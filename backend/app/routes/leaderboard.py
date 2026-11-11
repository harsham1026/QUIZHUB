from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func, case
from app.extensions import db
from app.models.user import User, StudentProfile
from app.models.session import GameResult

leaderboard_bp = Blueprint("leaderboard", __name__, url_prefix="/api/leaderboard")


@leaderboard_bp.route("/global", methods=["GET"])
def get_global_leaderboard():
    period = request.args.get("period", "all").lower()

    if period in ("weekly", "monthly"):
        days = 7 if period == "weekly" else 30
        cutoff = datetime.utcnow() - timedelta(days=days)

        rows = (
            db.session.query(
                GameResult.user_id,
                func.sum(GameResult.xp_earned).label("period_xp"),
                func.sum(case((GameResult.final_rank == 1, 1), else_=0)).label("period_wins"),
                func.sum(GameResult.correct_count).label("correct_sum"),
                func.sum(GameResult.incorrect_count).label("incorrect_sum"),
            )
            .filter(GameResult.user_id.isnot(None), GameResult.created_at >= cutoff)
            .group_by(GameResult.user_id)
            .order_by(func.sum(GameResult.xp_earned).desc())
            .limit(50)
            .all()
        )

        leaders = []
        for rank, row in enumerate(rows, start=1):
            user = User.query.get(row.user_id)
            if not user or not user.is_active:
                continue
            total_ans = (row.correct_sum or 0) + (row.incorrect_sum or 0)
            accuracy = ((row.correct_sum or 0) / total_ans * 100.0) if total_ans > 0 else 0.0
            profile = user.student_profile
            leaders.append({
                "rank": rank,
                "user_id": user.id,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user.email}",
                "xp": int(row.period_xp or 0),
                "level": profile.level if profile else 1,
                "streak": profile.streak if profile else 0,
                "total_wins": int(row.period_wins or 0),
                "accuracy_rate": round(accuracy, 2),
            })

        return jsonify({"leaderboard": leaders, "period": period}), 200

    # All-time leaderboard from StudentProfile
    profiles = (
        StudentProfile.query.join(User)
        .filter(User.is_active.is_(True))
        .order_by(StudentProfile.xp.desc())
        .limit(50)
        .all()
    )

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
    recent_games = [
        r.to_dict()
        for r in GameResult.query.filter_by(user_id=user_id)
        .order_by(GameResult.created_at.desc())
        .limit(5)
        .all()
    ]

    return jsonify({
        "user": user.to_dict(include_profile=False),
        "profile": profile.to_dict() if profile else None,
        "achievements": achievements,
        "recent_games": recent_games,
    }), 200
