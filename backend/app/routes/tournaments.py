from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.tournament import Tournament, TournamentParticipant
from app.middleware.auth import role_required, get_current_user

tournaments_bp = Blueprint("tournaments", __name__, url_prefix="/api/tournaments")


def _parse_naive_utc(raw_value):
    if not raw_value:
        return datetime.utcnow()
    dt = datetime.fromisoformat(str(raw_value).replace("Z", "+00:00"))
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


@tournaments_bp.route("", methods=["GET"])
def get_tournaments():
    current_user = get_current_user()
    registered_ids = set()
    if current_user:
        entries = TournamentParticipant.query.filter_by(user_id=current_user.id).all()
        registered_ids = {e.tournament_id for e in entries}

    tournaments = Tournament.query.order_by(Tournament.start_date.asc()).all()
    items = []
    for t in tournaments:
        d = t.to_dict()
        d["is_registered"] = t.id in registered_ids
        items.append(d)
    return jsonify({"tournaments": items}), 200


@tournaments_bp.route("/<int:tourney_id>", methods=["GET"])
def get_tournament_detail(tourney_id):
    t = Tournament.query.get(tourney_id)
    if not t:
        return jsonify({"error": "Tournament not found", "message": "Tournament not found"}), 404

    participants = (
        TournamentParticipant.query.filter_by(tournament_id=tourney_id)
        .order_by(TournamentParticipant.score.desc())
        .all()
    )
    data = t.to_dict()
    data["participants"] = [p.to_dict() for p in participants]
    return jsonify({"tournament": data}), 200


@tournaments_bp.route("", methods=["POST"])
@jwt_required()
@role_required("teacher", "admin")
def create_tournament():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Validation Error", "message": "Title is required"}), 400

    start_date = _parse_naive_utc(data.get("start_date"))
    end_date = _parse_naive_utc(data.get("end_date"))
    deadline = _parse_naive_utc(data.get("registration_deadline"))

    tourney = Tournament(
        title=title,
        description=data.get("description", ""),
        category=data.get("category", "General"),
        status=data.get("status", "registration_open"),
        max_participants=int(data.get("max_participants", 100)),
        creator_id=user_id,
        quiz_id=data.get("quiz_id") or None,
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
        return jsonify({"error": "Tournament not found", "message": "Tournament not found"}), 404

    if t.status not in ["upcoming", "registration_open"]:
        msg = "Registration is not open for this tournament"
        return jsonify({"error": msg, "message": msg}), 400

    if t.participants.count() >= t.max_participants:
        msg = "Tournament is already at maximum capacity"
        return jsonify({"error": msg, "message": msg}), 400

    existing = TournamentParticipant.query.filter_by(tournament_id=tourney_id, user_id=user_id).first()
    if existing:
        msg = "You are already registered for this tournament"
        return jsonify({"error": msg, "message": msg}), 400

    tp = TournamentParticipant(tournament_id=tourney_id, user_id=user_id)
    db.session.add(tp)
    db.session.commit()

    return jsonify({"message": "Successfully registered for tournament", "participant": tp.to_dict()}), 201
