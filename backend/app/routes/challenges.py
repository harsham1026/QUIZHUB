from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.social import Challenge
from app.models.quiz import Quiz
from app.models.session import QuizSession
from app.routes.sessions import _generate_unique_db_pin
from app.services.game_manager import game_manager

challenges_bp = Blueprint("challenges", __name__, url_prefix="/api/challenges")


@challenges_bp.route("", methods=["GET"])
@jwt_required()
def get_user_challenges():
    user_id = int(get_jwt_identity())
    challenges = Challenge.query.filter(
        (Challenge.challenger_id == user_id) | (Challenge.challenged_id == user_id)
    ).order_by(Challenge.created_at.desc()).all()
    return jsonify({"challenges": [c.to_dict() for c in challenges]}), 200


@challenges_bp.route("/create", methods=["POST"])
@jwt_required()
def create_challenge():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    challenged_id = data.get("challenged_id")
    quiz_id = data.get("quiz_id")

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    pin = _generate_unique_db_pin()
    session = QuizSession(
        pin=pin,
        quiz_id=quiz.id,
        host_id=user_id,
        session_type="duel_1v1",
        status="lobby",
    )
    db.session.add(session)
    db.session.flush()

    quiz_data = quiz.to_dict(include_questions=True, include_correct=True)
    game_manager.create_room(pin, session.id, quiz_data, user_id)

    challenge = Challenge(
        challenger_id=user_id,
        challenged_id=challenged_id or user_id,
        quiz_id=quiz.id,
        session_id=session.id,
        status="pending",
    )
    db.session.add(challenge)
    db.session.commit()

    return jsonify({
        "message": "Challenge created",
        "challenge": challenge.to_dict(),
        "pin": pin,
    }), 201


@challenges_bp.route("/<int:challenge_id>/accept", methods=["POST"])
@jwt_required()
def accept_challenge(challenge_id):
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404

    challenge.status = "accepted"
    db.session.commit()
    return jsonify({"message": "Challenge accepted", "challenge": challenge.to_dict()}), 200
