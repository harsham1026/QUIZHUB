from flask import Blueprint, request, jsonify
from app.models.user import User, StudentProfile
from app.models.admin import Achievement, UserAchievement
from app.models.session import GameResult

leaderboard_bp = Blueprint("leaderboard", __name__, url_prefix="/api/leaderboard")

@leaderboard_bp.route("/global", methods=["GET"])
def get_global_leaderboard():
    period = request.args.get("period", "all")  # all, weekly, monthly
    
    # Query top students by XP
    profiles = StudentProfile.query.join(User).filter(User.is_active == True).order_by(StudentProfile.xp.desc()).limit(50).all()
    
    leaders = []
    for rank, p in enumerate(profiles, start=1):
        leaders.append({
            "rank": rank,
            "user_id": p.user_id,
            "full_name": p.user.full_name,
            "avatar_url": p.user.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={p.user.email}",
            "xp": p.xp,
            "level": p.level,
            "streak": p.streak,
            "total_wins": p.total_wins,
            "accuracy_rate": round(p.accuracy_rate, 2),
        })

    return jsonify({"leaderboard": leaders, "period": period}), 200

@leaderboard_bp.route("/user/<int:user_id>/stats", methods=["GET"])
def get_user_stats(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = user.student_profile
    achievements = [ua.to_dict() for ua in user.user_achievements]
    recent_games = [r.to_dict() for r in GameResult.query.filter_by(user_id=user_id).order_by(GameResult.created_at.desc()).limit(5).all()]

    return jsonify({
        "user": user.to_dict(include_profile=False),
        "profile": profile.to_dict() if profile else None,
        "achievements": achievements,
        "recent_games": recent_games,
    }), 200

