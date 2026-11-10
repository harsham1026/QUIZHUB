import random
import string
import time
from typing import Dict, Any, Optional

class GameManager:
    """
    Authoritative in-memory state manager for active live competitions.
    Synced with database transactions upon important phase transitions.
    """
    def __init__(self):
        # session_pin -> GameState dict
        self.rooms: Dict[str, Dict[str, Any]] = {}
        # socket_id -> { "pin": pin, "participant_id": id, "user_id": id, "is_host": bool }
        self.client_map: Dict[str, Dict[str, Any]] = {}

    def generate_pin(self) -> str:
        chars = "0123456789"
        for _ in range(50):
            pin = "".join(random.choices(chars, k=6))
            if pin not in self.rooms:
                return pin
        # fallback alphanumeric
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

    def create_room(self, pin: str, session_id: int, quiz_data: dict, host_id: int) -> dict:
        room_state = {
            "pin": pin,
            "session_id": session_id,
            "host_id": host_id,
            "host_socket_id": None,
            "status": "lobby",  # lobby, question_active, showing_result, completed
            "quiz": quiz_data,
            "total_questions": len(quiz_data.get("questions", [])),
            "current_question_index": -1,
            "current_question_start_time": 0.0,
            "participants": {},  # participant_id -> { participant data }
            "answers_received": {},  # participant_id -> answer dict for current question
        }
        self.rooms[pin] = room_state
        return room_state

    def get_room(self, pin: str) -> Optional[dict]:
        return self.rooms.get(pin)

    def add_participant(self, pin: str, participant_id: int, nickname: str, user_id: Optional[int], socket_id: str) -> Optional[dict]:
        room = self.rooms.get(pin)
        if not room:
            return None

        # Check for reconnecting participant
        if participant_id in room["participants"]:
            part = room["participants"][participant_id]
            part["socket_id"] = socket_id
            part["is_connected"] = True
        else:
            part = {
                "id": participant_id,
                "user_id": user_id,
                "nickname": nickname,
                "score": 0,
                "streak": 0,
                "rank": len(room["participants"]) + 1,
                "socket_id": socket_id,
                "is_connected": True,
                "correct_answers": 0,
                "total_response_time": 0.0,
            }
            room["participants"][participant_id] = part

        self.client_map[socket_id] = {
            "pin": pin,
            "participant_id": participant_id,
            "user_id": user_id,
            "is_host": False,
        }
        return part

    def set_host_socket(self, pin: str, host_id: int, socket_id: str):
        room = self.rooms.get(pin)
        if room:
            room["host_socket_id"] = socket_id
            self.client_map[socket_id] = {
                "pin": pin,
                "participant_id": None,
                "user_id": host_id,
                "is_host": True,
            }

    def remove_socket(self, socket_id: str):
        mapping = self.client_map.pop(socket_id, None)
        if not mapping:
            return None
        pin = mapping["pin"]
        room = self.rooms.get(pin)
        if not room:
            return None

        if mapping.get("is_host"):
            room["host_socket_id"] = None
        else:
            part_id = mapping.get("participant_id")
            if part_id and part_id in room["participants"]:
                room["participants"][part_id]["is_connected"] = False

        return {"pin": pin, "mapping": mapping}

    def start_next_question(self, pin: str) -> Optional[dict]:
        room = self.rooms.get(pin)
        if not room:
            return None

        room["current_question_index"] += 1
        q_idx = room["current_question_index"]
        questions = room["quiz"].get("questions", [])

        if q_idx >= len(questions):
            room["status"] = "completed"
            return None

        current_q = questions[q_idx]
        room["status"] = "question_active"
        room["current_question_start_time"] = time.time()
        room["answers_received"] = {}

        # Strip 'is_correct' before broadcasting to players
        sanitized_options = [
            {"id": opt["id"], "option_text": opt["option_text"], "order_num": opt.get("order_num", 0)}
            for opt in current_q.get("options", [])
        ]

        question_payload = {
            "question_index": q_idx,
            "total_questions": len(questions),
            "id": current_q["id"],
            "question_text": current_q["question_text"],
            "question_type": current_q["question_type"],
            "time_limit": current_q["time_limit"],
            "points": current_q["points"],
            "image_url": current_q.get("image_url"),
            "options": sanitized_options,
        }
        return question_payload

    def close_current_question(self, pin: str) -> Optional[dict]:
        room = self.rooms.get(pin)
        if not room or room["status"] != "question_active":
            return None

        room["status"] = "showing_result"
        q_idx = room["current_question_index"]
        current_q = room["quiz"]["questions"][q_idx]

        # Extract correct option IDs
        correct_ids = [opt["id"] for opt in current_q.get("options", []) if opt.get("is_correct")]

        # Update ranks
        sorted_parts = sorted(
            room["participants"].values(),
            key=lambda p: (-p["score"], p["total_response_time"])
        )
        for idx, p in enumerate(sorted_parts):
            p["rank"] = idx + 1

        leaderboard = [
            {
                "id": p["id"],
                "nickname": p["nickname"],
                "score": p["score"],
                "streak": p["streak"],
                "rank": p["rank"],
                "is_connected": p["is_connected"],
            }
            for p in sorted_parts[:10]
        ]

        return {
            "question_index": q_idx,
            "correct_option_ids": correct_ids,
            "leaderboard": leaderboard,
            "answers_count": len(room["answers_received"]),
            "total_participants": len(room["participants"]),
        }

game_manager = GameManager()

