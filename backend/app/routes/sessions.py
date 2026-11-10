from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.session import QuizSession, SessionParticipant, GameResult
from app.models.quiz import Quiz
from app.services.game_manager import game_manager
from app.middleware.auth import role_required

sessions_bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")

@sessions_bp.route("/create", methods=["POST"])
@jwt_required()
@role_required("teacher", "admin")
def create_session():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    quiz_id = data.get("quiz_id")

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Not Found", "message": "Quiz not found"}), 404

    pin = game_manager.generate_pin()
    session = QuizSession(
        pin=pin,
        quiz_id=quiz.id,
        host_id=user_id,
        session_type=data.get("session_type", "live_multiplayer"),
        status="lobby",
    )
    db.session.add(session)
    db.session.commit()

    # Pre-warm game manager room
    quiz_data = quiz.to_dict(include_questions=True, include_correct=True)
    game_manager.create_room(pin, session.id, quiz_data, user_id)

    return jsonify({
        "message": "Game session created",
        "session": session.to_dict(),
        "pin": pin,
    }), 201

@sessions_bp.route("/verify/<string:pin>", methods=["GET"])
def verify_pin(pin):
    clean_pin = pin.strip()
    session = QuizSession.query.filter_by(pin=clean_pin).first()
    if not session or session.status in ["completed", "cancelled"]:
        return jsonify({"valid": False, "message": "Invalid or expired Game PIN"}), 404

    return jsonify({
        "valid": True,
        "session_id": session.id,
        "quiz_title": session.quiz.title if session.quiz else "Quiz Competition",
        "total_questions": len(session.quiz.questions) if session.quiz else 0,
        "status": session.status,
    }), 200

@sessions_bp.route("/<int:session_id>/results", methods=["GET"])
def get_session_results(session_id):
    session = QuizSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    results = GameResult.query.filter_by(session_id=session_id).order_by(GameResult.final_rank.asc()).all()
    podium = [r.to_dict() for r in results[:3]]

    return jsonify({
        "session": session.to_dict(),
        "podium": podium,
        "results": [r.to_dict() for r in results],
    }), 200

@sessions_bp.route("/my-history", methods=["GET"])
@jwt_required()
def get_user_history():
    user_id = int(get_jwt_identity())
    results = GameResult.query.filter_by(user_id=user_id).order_by(GameResult.created_at.desc()).limit(20).all()
    return jsonify({"history": [r.to_dict() for r in results]}), 200

