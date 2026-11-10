import time
from flask import request
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio, db
from app.services.game_manager import game_manager
from app.services.scoring import calculate_question_score
from app.models.session import QuizSession, SessionParticipant, SubmittedAnswer, GameResult
from app.models.user import StudentProfile

@socketio.on("connect")
def handle_connect():
    pass

@socketio.on("disconnect")
def handle_disconnect():
    socket_id = request.sid
    result = game_manager.remove_socket(socket_id)
    if result:
        pin = result["pin"]
        room = game_manager.get_room(pin)
        if room:
            participants_list = list(room["participants"].values())
            emit("lobby_updated", {"participants": participants_list}, to=pin)
            emit("player_left", {"socket_id": socket_id}, to=pin)

@socketio.on("join_game")
def handle_join_game(data):
    pin = data.get("pin", "").strip()
    nickname = data.get("nickname", "").strip()
    user_id = data.get("user_id")

    if not pin or not nickname:
        emit("error_message", {"message": "PIN and Nickname are required"})
        return

    room = game_manager.get_room(pin)
    if not room:
        # Check database for active session
        session = QuizSession.query.filter_by(pin=pin).first()
        if not session or session.status in ["completed", "cancelled"]:
            emit("error_message", {"message": "Invalid or expired Game PIN"})
            return
        
        # Populate room from DB
        quiz_data = session.quiz.to_dict(include_questions=True, include_correct=True)
        room = game_manager.create_room(pin, session.id, quiz_data, session.host_id)

    # Check if participant already exists in DB
    participant = SessionParticipant.query.filter_by(session_id=room["session_id"], nickname=nickname).first()
    if not participant:
        participant = SessionParticipant(
            session_id=room["session_id"],
            user_id=user_id,
            nickname=nickname,
            socket_id=request.sid
        )
        db.session.add(participant)
        db.session.commit()
    else:
        participant.socket_id = request.sid
        participant.is_connected = True
        db.session.commit()

    part_data = game_manager.add_participant(
        pin=pin,
        participant_id=participant.id,
        nickname=nickname,
        user_id=user_id,
        socket_id=request.sid
    )

    join_room(pin)
    emit("player_joined", {"participant": part_data}, to=pin)
    emit("lobby_updated", {"participants": list(room["participants"].values())}, to=pin)
    emit("join_success", {
        "participant_id": participant.id,
        "session_id": room["session_id"],
        "status": room["status"],
        "current_question_index": room["current_question_index"],
    })

@socketio.on("host_connect")
def handle_host_connect(data):
    pin = data.get("pin", "").strip()
    host_id = data.get("host_id")
    room = game_manager.get_room(pin)
    if not room:
        session = QuizSession.query.filter_by(pin=pin).first()
        if session and session.host_id == host_id:
            quiz_data = session.quiz.to_dict(include_questions=True, include_correct=True)
            room = game_manager.create_room(pin, session.id, quiz_data, host_id)

    if room:
        game_manager.set_host_socket(pin, host_id, request.sid)
        join_room(pin)
        emit("lobby_updated", {"participants": list(room["participants"].values())}, to=request.sid)

@socketio.on("start_game")
def handle_start_game(data):
    pin = data.get("pin", "").strip()
    room = game_manager.get_room(pin)
    if not room:
        emit("error_message", {"message": "Game room not found"})
        return

    # Update DB status
    session = QuizSession.query.get(room["session_id"])
    if session:
        session.status = "question_active"
        db.session.commit()

    emit("game_started", {"total_questions": room["total_questions"]}, to=pin)

    # Immediately broadcast first question
    question_payload = game_manager.start_next_question(pin)
    if question_payload:
        emit("new_question", question_payload, to=pin)

@socketio.on("submit_answer")
def handle_submit_answer(data):
    pin = data.get("pin", "").strip()
    participant_id = data.get("participant_id")
    selected_option_ids = data.get("selected_option_ids", [])  # list of ints
    
    room = game_manager.get_room(pin)
    if not room or room["status"] != "question_active":
        emit("error_message", {"message": "Answers cannot be submitted at this time"})
        return

    if participant_id in room["answers_received"]:
        emit("error_message", {"message": "Answer already recorded for this question"})
        return

    q_idx = room["current_question_index"]
    questions = room["quiz"]["questions"]
    if q_idx >= len(questions):
        return

    current_q = questions[q_idx]
    time_limit = current_q["time_limit"]
    max_points = current_q["points"]
    response_time = max(0.05, time.time() - room["current_question_start_time"])

    # Authoritative correctness validation
    correct_option_ids = set([opt["id"] for opt in current_q["options"] if opt.get("is_correct")])
    submitted_set = set(selected_option_ids)
    is_correct = (correct_option_ids == submitted_set)

    part = room["participants"].get(participant_id)
    current_streak = part["streak"] if part else 0

    score_result = calculate_question_score(
        max_points=max_points,
        time_limit=time_limit,
        response_time=response_time,
        is_correct=is_correct,
        current_streak=current_streak
    )

    # Store in memory
    room["answers_received"][participant_id] = {
        "selected_option_ids": selected_option_ids,
        "response_time": response_time,
        "score_result": score_result,
    }

    if part:
        part["score"] += score_result["points"]
        part["streak"] = score_result["new_streak"]
        part["total_response_time"] += response_time
        if is_correct:
            part["correct_answers"] += 1

    # Persist submitted answer in DB
    sub = SubmittedAnswer(
        session_id=room["session_id"],
        participant_id=participant_id,
        question_id=current_q["id"],
        selected_option_ids=selected_option_ids,
        is_correct=is_correct,
        points_awarded=score_result["points"],
        response_time_seconds=response_time
    )
    db.session.add(sub)
    db.session.commit()

    emit("answer_received", {
        "participant_id": participant_id,
        "answers_count": len(room["answers_received"]),
        "total_participants": len(room["participants"]),
    }, to=pin)

    # If all connected participants have answered, we can automatically close the question
    connected_participants = [p for p in room["participants"].values() if p["is_connected"]]
    if len(room["answers_received"]) >= len(connected_participants):
        close_data = game_manager.close_current_question(pin)
        if close_data:
            emit("question_ended", close_data, to=pin)

@socketio.on("next_question")
def handle_next_question(data):
    pin = data.get("pin", "").strip()
    room = game_manager.get_room(pin)
    if not room:
        return

    # If current question was still open, close it first
    if room["status"] == "question_active":
        close_data = game_manager.close_current_question(pin)
        if close_data:
            emit("question_ended", close_data, to=pin)
        return

    question_payload = game_manager.start_next_question(pin)
    if question_payload:
        emit("new_question", question_payload, to=pin)
    else:
        # Game is complete!
        handle_end_game({"pin": pin})

@socketio.on("end_game")
def handle_end_game(data):
    pin = data.get("pin", "").strip()
    room = game_manager.get_room(pin)
    if not room:
        return

    room["status"] = "completed"

    # Sort final ranking
    sorted_parts = sorted(
        room["participants"].values(),
        key=lambda p: (-p["score"], p["total_response_time"])
    )

    final_podium = []
    session_id = room["session_id"]
    session = QuizSession.query.get(session_id)
    if session:
        session.status = "completed"

    for idx, p in enumerate(sorted_parts):
        rank = idx + 1
        p["rank"] = rank
        xp_earned = p["score"] // 10 + (300 if rank == 1 else (200 if rank == 2 else (100 if rank == 3 else 50)))

        # Save GameResult in DB
        res = GameResult(
            session_id=session_id,
            user_id=p["user_id"],
            nickname=p["nickname"],
            final_score=p["score"],
            final_rank=rank,
            correct_count=p["correct_answers"],
            incorrect_count=room["total_questions"] - p["correct_answers"],
            average_speed=p["total_response_time"] / max(1, room["total_questions"]),
            xp_earned=xp_earned
        )
        db.session.add(res)

        # Update StudentProfile XP if logged in student
        if p["user_id"]:
            profile = StudentProfile.query.filter_by(user_id=p["user_id"]).first()
            if profile:
                profile.add_xp(xp_earned)
                profile.total_quizzes_played += 1
                if rank == 1:
                    profile.total_wins += 1
                accuracy = (p["correct_answers"] / max(1, room["total_questions"])) * 100.0
                profile.accuracy_rate = (profile.accuracy_rate + accuracy) / 2.0

        if rank <= 3:
            final_podium.append({
                "rank": rank,
                "nickname": p["nickname"],
                "score": p["score"],
                "xp_earned": xp_earned,
            })

    db.session.commit()

    emit("game_finished", {
        "podium": final_podium,
        "full_standings": sorted_parts,
    }, to=pin)

