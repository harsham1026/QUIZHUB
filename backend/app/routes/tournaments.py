from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.tournament import Tournament, TournamentParticipant
from app.models.quiz import Quiz
from app.models.user import User
from app.middleware.auth import role_required

tournaments_bp = Blueprint("tournaments", __name__, url_prefix="/api/tournaments")

@tournaments_bp.route("", methods=["GET"])
def get_tournaments():
    tournaments = Tournament.query.order_by(Tournament.start_date.asc()).all()
    return jsonify({"tournaments": [t.to_dict() for t in tournaments]}), 200

@tournaments_bp.route("/<int:tourney_id>", methods=["GET"])
def get_tournament_detail(tourney_id):
    t = Tournament.query.get(tourney_id)
    if not t:
        return jsonify({"error": "Tournament not found"}), 404

    participants = TournamentParticipant.query.filter_by(tournament_id=tourney_id).order_by(TournamentParticipant.score.desc()).all()
    data = t.to_dict()
    data["participants"] = [p.to_dict() for p in participants]
    return jsonify({"tournament": data}), 200

@tournaments_bp.route("", methods=["POST"])
@jwt_required()
@role_required("teacher", "admin")
def create_tournament():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Validation Error", "message": "Title is required"}), 400

    start_date = datetime.fromisoformat(data.get("start_date").replace("Z", "+00:00")) if data.get("start_date") else datetime.utcnow()
    end_date = datetime.fromisoformat(data.get("end_date").replace("Z", "+00:00")) if data.get("end_date") else datetime.utcnow()
    deadline = datetime.fromisoformat(data.get("registration_deadline").replace("Z", "+00:00")) if data.get("registration_deadline") else datetime.utcnow()

    tourney = Tournament(
        title=title,
        description=data.get("description", ""),
        category=data.get("category", "General"),
        status=data.get("status", "registration_open"),
        max_participants=int(data.get("max_participants", 100)),
        creator_id=user_id,
        quiz_id=data.get("quiz_id"),
        start_date=start_date,
        end_date=end_date,
        registration_deadline=deadline,
    )
    db.session.add(tourney)
    db.session.commit()

    return jsonify({"message": "Tournament created successfully", "tournament": tourney.to_dict()}), 201

@tournaments_bp.route("/<int:tourney_id>/register", methods=["POST"])
@jwt_required()
def register_for_tournament(tourney_id):
    user_id = int(get_jwt_identity())
    t = Tournament.query.get(tourney_id)
    if not t:
        return jsonify({"error": "Tournament not found"}), 404

    if t.status not in ["upcoming", "registration_open"]:
        return jsonify({"error": "Registration is not open for this tournament"}), 400

    if t.participants.count() >= t.max_participants:
        return jsonify({"error": "Tournament is already at maximum capacity"}), 400

    existing = TournamentParticipant.query.filter_by(tournament_id=tourney_id, user_id=user_id).first()
    if existing:
        return jsonify({"error": "You are already registered for this tournament"}), 400

    tp = TournamentParticipant(tournament_id=tourney_id, user_id=user_id)
    db.session.add(tp)
    db.session.commit()

    return jsonify({"message": "Successfully registered for tournament", "participant": tp.to_dict()}), 201

