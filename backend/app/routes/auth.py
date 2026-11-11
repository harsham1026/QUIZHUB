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

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "student").strip().lower()

    if not email or not password or not full_name:
        return jsonify({"error": "Validation Error", "message": "Email, password, and full name are required"}), 400

    if role not in ["student", "teacher"]:
        return jsonify({"error": "Validation Error", "message": "Role must be 'student' or 'teacher'"}), 400

    if len(password) < 6:
        return jsonify({"error": "Validation Error", "message": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Conflict", "message": "An account with this email already exists"}), 409

    user = User(
        email=email,
        full_name=full_name,
        role=role,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    if role == "student":
        student_profile = StudentProfile(user_id=user.id)
        db.session.add(student_profile)
    elif role == "teacher":
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

