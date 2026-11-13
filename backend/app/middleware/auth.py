from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User


def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({"error": "Unauthorized", "message": "Missing or invalid token"}), 401

            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return jsonify({"error": "Forbidden", "message": "Account inactive or not found"}), 403

            # Common User account model:
            # All active users have access to all general features (quizzes, sessions, tournaments, AI, etc.).
            # Only enforce if 'admin' is exclusively required.
            if allowed_roles and list(allowed_roles) == ["admin"]:
                if user.role != "admin":
                    return jsonify({
                        "error": "Forbidden",
                        "message": "Access denied. Admin privileges required."
                    }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    try:
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())
        return User.query.get(user_id)
    except Exception:
        return None
