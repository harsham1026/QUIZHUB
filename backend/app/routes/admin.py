from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.user import User
from app.models.quiz import Quiz
from app.models.session import QuizSession
from app.models.tournament import Tournament
from app.models.admin import ActivityLog, Report
from app.middleware.auth import role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/metrics", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_metrics():
    total_users = User.query.count()
    total_students = User.query.filter_by(role="student").count()
    total_teachers = User.query.filter_by(role="teacher").count()
    total_quizzes = Quiz.query.count()
    total_competitions = QuizSession.query.count()
    total_tournaments = Tournament.query.count()
    active_competitions = QuizSession.query.filter(QuizSession.status.in_(["lobby", "active", "question_active"])).count()
    completed_games = QuizSession.query.filter_by(status="completed").count()

    return jsonify({
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_quizzes": total_quizzes,
        "total_competitions": total_competitions,
        "total_tournaments": total_tournaments,
        "active_competitions": active_competitions,
        "completed_games": completed_games,
    }), 200

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_all_users():
    role = request.args.get("role")
    search = request.args.get("search")
    page = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 20)), 100)

    query = User.query
    if role and role != "All":
        query = query.filter_by(role=role)
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "users": [u.to_dict() for u in users],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }), 200

@admin_bp.route("/users/<int:user_id>/toggle-status", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role == "admin":
        return jsonify({"error": "Cannot deactivate admin account"}), 400

    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({
        "message": f"User status set to {'active' if user.is_active else 'inactive'}",
        "user": user.to_dict(),
    }), 200

@admin_bp.route("/logs", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_logs():
    logs = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(100).all()
    return jsonify({"logs": [l.to_dict() for l in logs]}), 200

@admin_bp.route("/reports", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_reports():
    reports = Report.query.order_by(Report.created_at.desc()).all()
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200

