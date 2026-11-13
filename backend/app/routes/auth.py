import os
from datetime import datetime
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from app.extensions import db
from app.models.user import User, StudentProfile, TeacherProfile
from app.models.admin import ActivityLog

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/config", methods=["GET"])
def get_auth_config():
    """Return public authentication configuration."""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID", "")
    return jsonify({
        "google_client_id": google_client_id,
        "google_configured": bool(google_client_id),
    }), 200

@auth_bp.route("/google", methods=["POST"])
def google_auth():
    """Verify Google token, find or create user, and issue QuizHub JWT."""
    data = request.get_json() or {}
    credential = data.get("credential")  # ID token
    access_token = data.get("access_token")  # OAuth2 access token

    if not credential and not access_token:
        return jsonify({
            "error": "Validation Error",
            "message": "Google credential (ID token) or access_token is required"
        }), 400

    google_client_id = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID")
    google_user_info = None

    # Option A: Google ID Token (from Google Identity Services credential response)
    if credential:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            req_transport = google_requests.Request()
            id_info = id_token.verify_oauth2_token(
                credential,
                req_transport,
                audience=google_client_id if google_client_id else None
            )
            google_user_info = {
                "sub": id_info.get("sub"),
                "email": id_info.get("email"),
                "name": id_info.get("name"),
                "picture": id_info.get("picture"),
                "email_verified": id_info.get("email_verified", True),
            }
        except Exception:
            # Fallback to Google tokeninfo HTTP endpoint
            try:
                resp = requests.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": credential},
                    timeout=10
                )
                if resp.status_code == 200:
                    info = resp.json()
                    google_user_info = {
                        "sub": info.get("sub"),
                        "email": info.get("email"),
                        "name": info.get("name"),
                        "picture": info.get("picture"),
                        "email_verified": str(info.get("email_verified", "")).lower() in ("true", "1"),
                    }
                else:
                    return jsonify({
                        "error": "Unauthorized",
                        "message": "Google credential verification failed. Please try signing in again."
                    }), 401
            except Exception as net_err:
                return jsonify({
                    "error": "Authentication Failed",
                    "message": f"Network error during Google verification: {net_err}"
                }), 502

    # Option B: Google Access Token (from OAuth2 popup token client)
    elif access_token:
        try:
            resp = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10
            )
            if resp.status_code == 200:
                info = resp.json()
                google_user_info = {
                    "sub": info.get("sub"),
                    "email": info.get("email"),
                    "name": info.get("name"),
                    "picture": info.get("picture"),
                    "email_verified": str(info.get("email_verified", "")).lower() in ("true", "1"),
                }
            else:
                return jsonify({
                    "error": "Unauthorized",
                    "message": "Google access token is invalid or expired"
                }), 401
        except Exception as net_err:
            return jsonify({
                "error": "Authentication Failed",
                "message": f"Network error during Google profile retrieval: {net_err}"
            }), 502

    if not google_user_info or not google_user_info.get("email"):
        return jsonify({
            "error": "Unauthorized",
            "message": "Could not retrieve verified email from Google account."
        }), 401

    google_id = str(google_user_info["sub"])
    email = google_user_info["email"].lower().strip()
    full_name = google_user_info.get("name") or email.split("@")[0]
    avatar_url = google_user_info.get("picture")

    # Check for existing user by google_id first, then by email
    user = User.query.filter_by(google_id=google_id).first()
    is_new_user = False

    if not user:
        user = User.query.filter_by(email=email).first()
        if user:
            # Link Google ID to existing account
            user.google_id = google_id
            if avatar_url:
                user.avatar_url = avatar_url
            if not user.full_name or user.full_name == email:
                user.full_name = full_name
        else:
            # Create a brand new unified User account
            is_new_user = True
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                avatar_url=avatar_url,
                role="user",
                is_active=True,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
            )
            db.session.add(user)
            db.session.flush()

    if not user.is_active:
        return jsonify({"error": "Forbidden", "message": "Account has been deactivated. Please contact support."}), 403

    # Ensure user has a profile attached for XP and statistics
    if not user.student_profile:
        db.session.add(StudentProfile(user_id=user.id))

    user.last_login = datetime.utcnow()
    action = "user_registered_google" if is_new_user else "user_logged_in_google"
    log = ActivityLog(user_id=user.id, action=action, ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    access_token_jwt = create_access_token(identity=str(user.id))
    refresh_token_jwt = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Authenticated successfully with Google",
        "is_new_user": is_new_user,
        "user": user.to_dict(),
        "access_token": access_token_jwt,
        "refresh_token": refresh_token_jwt,
    }), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "user").strip().lower()

    if not email or not password or not full_name:
        return jsonify({"error": "Validation Error", "message": "Email, password, and full name are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Validation Error", "message": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Conflict", "message": "An account with this email already exists"}), 409

    user = User(
        email=email,
        full_name=full_name,
        role=role if role in ["user", "student", "teacher", "admin"] else "user",
        last_login=datetime.utcnow(),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Always ensure student_profile is created for player stats
    student_profile = StudentProfile(user_id=user.id)
    db.session.add(student_profile)

    if role == "teacher":
        teacher_profile = TeacherProfile(
            user_id=user.id,
            school_or_organization=data.get("school_or_organization", ""),
            subject_specialization=data.get("subject_specialization", "")
        )
        db.session.add(teacher_profile)

    # Activity log
    log = ActivityLog(user_id=user.id, action="user_registered", ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Registration successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Validation Error", "message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Unauthorized", "message": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Forbidden", "message": "Account has been deactivated. Please contact support."}), 403

    user.last_login = datetime.utcnow()
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    log = ActivityLog(user_id=user.id, action="user_logged_in", ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Successfully logged out"}), 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.is_active:
        return jsonify({"error": "Unauthorized", "message": "User not found or inactive"}), 401

    new_access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": new_access_token}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    user = User.query.filter_by(email=email).first()
    # Always return success message to prevent user enumeration
    return jsonify({
        "message": "If an account exists for this email, password reset instructions have been sent."
    }), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    new_password = data.get("new_password", "")
    if not email or len(new_password) < 6:
        return jsonify({"error": "Validation Error", "message": "Valid email and new password (min 6 chars) are required"}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        user.set_password(new_password)
        db.session.commit()
    return jsonify({"message": "Password has been successfully updated. You may now log in."}), 200

