from datetime import datetime
import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.extensions import db
from app.models.session import QuizSession, SessionParticipant, SubmittedAnswer, GameResult
from app.models.quiz import Quiz
from app.models.user import StudentProfile
from app.services.game_manager import game_manager
from app.services.scoring import calculate_question_score
from app.middleware.auth import role_required

sessions_bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")


def _generate_unique_db_pin() -> str:
    for _ in range(50):
        pin = "".join(random.choices("0123456789", k=6))
        if not QuizSession.query.filter_by(pin=pin).first():
            return pin
    return game_manager.generate_pin()


def _participant_stats(session_id: int):
    """Aggregate total response time and correct count per participant from DB."""
    rows = (
        db.session.query(
            SubmittedAnswer.participant_id,
            func.coalesce(func.sum(SubmittedAnswer.response_time_seconds), 0.0),
        )
        .filter(SubmittedAnswer.session_id == session_id)
        .group_by(SubmittedAnswer.participant_id)
        .all()
    )
    time_map = {pid: float(total_time) for pid, total_time in rows}

    correct_rows = (
        db.session.query(
            SubmittedAnswer.participant_id,
            func.count(SubmittedAnswer.id),
        )
        .filter(SubmittedAnswer.session_id == session_id, SubmittedAnswer.is_correct.is_(True))
        .group_by(SubmittedAnswer.participant_id)
        .all()
    )
    correct_map = {pid: int(cnt) for pid, cnt in correct_rows}
    return time_map, correct_map


def _sorted_participants(session: QuizSession):
    time_map, correct_map = _participant_stats(session.id)
    participants = session.participants.all()
    sorted_parts = sorted(
        participants,
        key=lambda p: (-p.score, time_map.get(p.id, 0.0), p.id),
    )
    for idx, p in enumerate(sorted_parts):
        p.rank = idx + 1
    return sorted_parts, time_map, correct_map


def _finalize_session(session: QuizSession):
    if session.status == "completed":
        return

    session.status = "completed"
    session.ended_at = datetime.utcnow()

    questions = session.quiz.questions if session.quiz else []
    total_questions = len(questions)
    sorted_parts, time_map, correct_map = _sorted_participants(session)

    # Avoid duplicate results if already finalized
    existing_count = GameResult.query.filter_by(session_id=session.id).count()
    if existing_count == 0:
        for idx, p in enumerate(sorted_parts):
            rank = idx + 1
            correct_cnt = correct_map.get(p.id, 0)
            total_rt = time_map.get(p.id, 0.0)
            xp_earned = p.score // 10 + (300 if rank == 1 else (200 if rank == 2 else (100 if rank == 3 else 50)))

            db.session.add(GameResult(
                session_id=session.id,
                user_id=p.user_id,
                nickname=p.nickname,
                final_score=p.score,
                final_rank=rank,
                correct_count=correct_cnt,
                incorrect_count=max(0, total_questions - correct_cnt),
                average_speed=total_rt / max(1, total_questions),
                xp_earned=xp_earned,
            ))

            if p.user_id:
                profile = StudentProfile.query.filter_by(user_id=p.user_id).first()
                if profile:
                    profile.add_xp(xp_earned)
                    profile.total_quizzes_played += 1
                    if rank == 1:
                        profile.total_wins += 1
                    accuracy = (correct_cnt / max(1, total_questions)) * 100.0
                    profile.accuracy_rate = (profile.accuracy_rate + accuracy) / 2.0

    db.session.commit()


def _build_session_state(session: QuizSession, participant_id=None) -> dict:
    questions = list(session.quiz.questions) if session.quiz else []
    total_questions = len(questions)
    q_idx = session.current_question_index

    sorted_parts, _, _ = _sorted_participants(session)
    participants_data = [p.to_dict() for p in sorted_parts]
    leaderboard = participants_data[:10]

    current_question_payload = None
    question_result = None
    answers_count = 0
    has_answered = False
    selected_option_ids = []

    if 0 <= q_idx < total_questions and session.status in ("question_active", "showing_result"):
        q = questions[q_idx]
        answers_count = SubmittedAnswer.query.filter_by(
            session_id=session.id, question_id=q.id
        ).count()

        if participant_id is not None:
            my_sub = SubmittedAnswer.query.filter_by(
                session_id=session.id,
                participant_id=participant_id,
                question_id=q.id,
            ).first()
            if my_sub:
                has_answered = True
                selected_option_ids = my_sub.selected_option_ids or []

        # Strip is_correct before sending question payload
        sanitized_options = [
            {"id": opt.id, "option_text": opt.option_text, "order_num": opt.order_num}
            for opt in q.options
        ]
        remaining = q.time_limit
        if session.current_question_start_time:
            elapsed = (datetime.utcnow() - session.current_question_start_time).total_seconds()
            remaining = max(0, int(round(q.time_limit - elapsed)))

        current_question_payload = {
            "question_index": q_idx,
            "total_questions": total_questions,
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "time_limit": q.time_limit,
            "remaining_seconds": remaining,
            "points": q.points,
            "image_url": q.image_url,
            "options": sanitized_options,
        }

        if session.status == "showing_result":
            correct_ids = [opt.id for opt in q.options if opt.is_correct]
            my_result = None
            if participant_id is not None:
                my_sub = SubmittedAnswer.query.filter_by(
                    session_id=session.id,
                    participant_id=participant_id,
                    question_id=q.id,
                ).first()
                if my_sub:
                    my_result = {
                        "is_correct": my_sub.is_correct,
                        "points_awarded": my_sub.points_awarded,
                        "response_time_seconds": round(my_sub.response_time_seconds, 2),
                    }
            question_result = {
                "question_index": q_idx,
                "correct_option_ids": correct_ids,
                "leaderboard": leaderboard,
                "answers_count": answers_count,
                "total_participants": len(participants_data),
                "my_result": my_result,
            }

    final_podium = []
    full_standings = []
    if session.status == "completed":
        results = (
            GameResult.query.filter_by(session_id=session.id)
            .order_by(GameResult.final_rank.asc())
            .all()
        )
        if results:
            final_podium = [
                {
                    "rank": r.final_rank,
                    "nickname": r.nickname,
                    "score": r.final_score,
                    "xp_earned": r.xp_earned,
                }
                for r in results[:3]
            ]
            full_standings = [r.to_dict() for r in results]
        else:
            final_podium = [
                {
                    "rank": idx + 1,
                    "nickname": p["nickname"],
                    "score": p["score"],
                    "xp_earned": p["score"] // 10 + 50,
                }
                for idx, p in enumerate(participants_data[:3])
            ]
            full_standings = [
                {
                    "id": p.get("id"),
                    "session_id": session.id,
                    "user_id": p.get("user_id"),
                    "nickname": p.get("nickname"),
                    "final_score": p.get("score", 0),
                    "score": p.get("score", 0),
                    "final_rank": idx + 1,
                    "rank": idx + 1,
                    "correct_count": p.get("correct_count", 0),
                    "incorrect_count": max(0, total_questions - p.get("correct_count", 0)),
                    "xp_earned": p.get("score", 0) // 10 + 50,
                    "average_speed": 0.0,
                }
                for idx, p in enumerate(participants_data)
            ]

    return {
        "session_id": session.id,
        "pin": session.pin,
        "status": session.status,
        "quiz_id": session.quiz_id,
        "quiz_title": session.quiz.title if session.quiz else "",
        "host_id": session.host_id,
        "total_questions": total_questions,
        "current_question_index": q_idx,
        "participants": participants_data,
        "answers_count": answers_count,
        "current_question": current_question_payload,
        "question_result": question_result,
        "leaderboard": leaderboard,
        "final_podium": final_podium,
        "full_standings": full_standings,
        "has_answered": has_answered,
        "selected_option_ids": selected_option_ids,
    }


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

    pin = _generate_unique_db_pin()
    session = QuizSession(
        pin=pin,
        quiz_id=quiz.id,
        host_id=user_id,
        session_type=data.get("session_type", "live_multiplayer"),
        status="lobby",
    )
    db.session.add(session)
    db.session.commit()

    # Pre-warm in-memory manager for optional Socket.IO mode
    quiz_data = quiz.to_dict(include_questions=True, include_correct=True)
    game_manager.create_room(pin, session.id, quiz_data, user_id)

    return jsonify({
        "message": "Game session created",
        "session": session.to_dict(),
        "pin": pin,
        "quiz_id": quiz.id,
    }), 201


@sessions_bp.route("/verify/<string:pin>", methods=["GET"])
def verify_pin(pin):
    clean_pin = pin.strip().upper()
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


@sessions_bp.route("/<string:pin>/join", methods=["POST"])
def join_session(pin):
    clean_pin = pin.strip().upper()
    data = request.get_json() or {}
    nickname = (data.get("nickname") or "").strip()
    user_id = data.get("user_id")

    if not nickname:
        return jsonify({"error": "Validation Error", "message": "Nickname is required"}), 400

    session = QuizSession.query.filter_by(pin=clean_pin).first()
    if not session or session.status in ["completed", "cancelled"]:
        return jsonify({"error": "Not Found", "message": "Invalid or expired Game PIN"}), 404

    participant = SessionParticipant.query.filter_by(session_id=session.id, nickname=nickname).first()
    if not participant:
        participant = SessionParticipant(
            session_id=session.id,
            user_id=user_id,
            nickname=nickname,
            is_connected=True,
        )
        db.session.add(participant)
    else:
        participant.is_connected = True
        if user_id and not participant.user_id:
            participant.user_id = user_id
    db.session.commit()

    state = _build_session_state(session, participant_id=participant.id)
    state["participant_id"] = participant.id
    return jsonify(state), 200


@sessions_bp.route("/<string:pin>/state", methods=["GET"])
def get_session_state(pin):
    clean_pin = pin.strip().upper()
    session = QuizSession.query.filter_by(pin=clean_pin).first()
    if not session:
        return jsonify({"error": "Not Found", "message": "Game session not found"}), 404

    pid = request.args.get("participant_id", type=int)
    state = _build_session_state(session, participant_id=pid)
    return jsonify(state), 200


@sessions_bp.route("/<string:pin>/start", methods=["POST"])
@jwt_required()
def start_session(pin):
    clean_pin = pin.strip().upper()
    user_id = int(get_jwt_identity())
    session = QuizSession.query.filter_by(pin=clean_pin).first()
    if not session:
        return jsonify({"error": "Not Found", "message": "Game session not found"}), 404
    if session.host_id != user_id:
        return jsonify({"error": "Forbidden", "message": "Only the host can start this session"}), 403

    questions = list(session.quiz.questions) if session.quiz else []
    if not questions:
        return jsonify({"error": "Validation Error", "message": "Quiz has no questions"}), 400

    session.status = "question_active"
    session.current_question_index = 0
    session.current_question_start_time = datetime.utcnow()
    db.session.commit()

    return jsonify(_build_session_state(session)), 200


@sessions_bp.route("/<string:pin>/answer", methods=["POST"])
def submit_session_answer(pin):
    clean_pin = pin.strip().upper()
    data = request.get_json() or {}
    participant_id = data.get("participant_id")
    selected_option_ids = data.get("selected_option_ids") or []

    session = QuizSession.query.filter_by(pin=clean_pin).first()
    if not session or session.status != "question_active":
        return jsonify({"error": "Invalid State", "message": "Answers cannot be submitted right now"}), 400

    participant = SessionParticipant.query.filter_by(id=participant_id, session_id=session.id).first()
    if not participant:
        return jsonify({"error": "Not Found", "message": "Participant not found in this game"}), 404

    questions = list(session.quiz.questions) if session.quiz else []
    q_idx = session.current_question_index
    if q_idx < 0 or q_idx >= len(questions):
        return jsonify({"error": "Invalid State", "message": "No active question"}), 400

    current_q = questions[q_idx]
    existing = SubmittedAnswer.query.filter_by(
        session_id=session.id,
        participant_id=participant.id,
        question_id=current_q.id,
    ).first()
    if existing:
        return jsonify({"error": "Duplicate", "message": "Answer already recorded"}), 409

    start_time = session.current_question_start_time or datetime.utcnow()
    response_time = max(0.05, (datetime.utcnow() - start_time).total_seconds())

    correct_option_ids = {opt.id for opt in current_q.options if opt.is_correct}
    submitted_set = {int(oid) for oid in selected_option_ids}
    is_correct = (correct_option_ids == submitted_set)

    score_result = calculate_question_score(
        max_points=current_q.points,
        time_limit=current_q.time_limit,
        response_time=response_time,
        is_correct=is_correct,
        current_streak=participant.streak,
    )

    participant.score += score_result["points"]
    participant.streak = score_result["new_streak"]

    sub = SubmittedAnswer(
        session_id=session.id,
        participant_id=participant.id,
        question_id=current_q.id,
        selected_option_ids=list(submitted_set),
        is_correct=is_correct,
        points_awarded=score_result["points"],
        response_time_seconds=response_time,
    )
    db.session.add(sub)
    db.session.flush()

    # Auto-close question if all connected participants have answered
    connected_count = SessionParticipant.query.filter_by(session_id=session.id, is_connected=True).count()
    answered_count = SubmittedAnswer.query.filter_by(session_id=session.id, question_id=current_q.id).count()
    if connected_count > 0 and answered_count >= connected_count:
        session.status = "showing_result"
        _sorted_participants(session)

    db.session.commit()
    return jsonify(_build_session_state(session, participant_id=participant.id)), 200


@sessions_bp.route("/<string:pin>/next", methods=["POST"])
@jwt_required()
def next_session_step(pin):
    clean_pin = pin.strip().upper()
    user_id = int(get_jwt_identity())
    session = QuizSession.query.filter_by(pin=clean_pin).first()
    if not session:
        return jsonify({"error": "Not Found", "message": "Game session not found"}), 404
    if session.host_id != user_id:
        return jsonify({"error": "Forbidden", "message": "Only the host can control game progression"}), 403

    questions = list(session.quiz.questions) if session.quiz else []
    if session.status == "question_active":
        session.status = "showing_result"
        _sorted_participants(session)
        db.session.commit()
    elif session.status == "showing_result":
        if session.current_question_index + 1 < len(questions):
            session.current_question_index += 1
            session.status = "question_active"
            session.current_question_start_time = datetime.utcnow()
            db.session.commit()
        else:
            _finalize_session(session)

    return jsonify(_build_session_state(session)), 200


@sessions_bp.route("/<string:pin>/end", methods=["POST"])
@jwt_required()
def end_session(pin):
    clean_pin = pin.strip().upper()
    user_id = int(get_jwt_identity())
    session = QuizSession.query.filter_by(pin=clean_pin).first()
    if not session:
        return jsonify({"error": "Not Found", "message": "Game session not found"}), 404
    if session.host_id != user_id:
        return jsonify({"error": "Forbidden", "message": "Only the host can end this session"}), 403

    _finalize_session(session)
    return jsonify(_build_session_state(session)), 200


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
