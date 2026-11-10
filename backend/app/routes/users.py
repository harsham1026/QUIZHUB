from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User, StudentProfile, TeacherProfile
from app.models.admin import Notification

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

@users_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    user.full_name = data.get("full_name", user.full_name)
    user.avatar_url = data.get("avatar_url", user.avatar_url)

    if user.role == "teacher" and user.teacher_profile:
        user.teacher_profile.school_or_organization = data.get("school_or_organization", user.teacher_profile.school_or_organization)
        user.teacher_profile.subject_specialization = data.get("subject_specialization", user.teacher_profile.subject_specialization)
        user.teacher_profile.bio = data.get("bio", user.teacher_profile.bio)

    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200

@users_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify({"notifications": [n.to_dict() for n in notifs]}), 200

@users_bp.route("/notifications/<int:notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_notification_read(notif_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if n:
        n.is_read = True
        db.session.commit()
    return jsonify({"message": "Notification marked as read"}), 200

