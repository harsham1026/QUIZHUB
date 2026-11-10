from datetime import datetime
from app.extensions import db

class QuizSession(db.Model):
    __tablename__ = "quiz_sessions"

    id = db.Column(db.Integer, primary_key=True)
    pin = db.Column(db.String(10), unique=True, nullable=False, index=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    host_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(
        db.Enum("lobby", "active", "question_active", "showing_result", "completed", "cancelled", name="session_status_enum"),
        default="lobby",
        nullable=False,
        index=True
    )
    current_question_index = db.Column(db.Integer, default=0, nullable=False)
    current_question_start_time = db.Column(db.DateTime, nullable=True)
    session_type = db.Column(
        db.Enum("live_multiplayer", "duel_1v1", "tournament", name="session_type_enum"),
        default="live_multiplayer",
        nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    host = db.relationship("User", backref="hosted_sessions")
    participants = db.relationship("SessionParticipant", backref="session", lazy="dynamic", cascade="all, delete-orphan")
    submitted_answers = db.relationship("SubmittedAnswer", backref="session", lazy="dynamic", cascade="all, delete-orphan")
    results = db.relationship("GameResult", backref="session", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_participants=False):
        data = {
            "id": self.id,
            "pin": self.pin,
            "quiz_id": self.quiz_id,
            "quiz_title": self.quiz.title if self.quiz else "",
            "host_id": self.host_id,
            "host_name": self.host.full_name if self.host else "",
            "status": self.status,
            "current_question_index": self.current_question_index,
            "session_type": self.session_type,
            "participant_count": self.participants.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }
        if include_participants:
            data["participants"] = [p.to_dict() for p in self.participants.all()]
        return data


class SessionParticipant(db.Model):
    __tablename__ = "session_participants"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    nickname = db.Column(db.String(80), nullable=False)
    score = db.Column(db.Integer, default=0, nullable=False)
    streak = db.Column(db.Integer, default=0, nullable=False)
    rank = db.Column(db.Integer, default=0, nullable=False)
    is_connected = db.Column(db.Boolean, default=True, nullable=False)
    socket_id = db.Column(db.String(100), nullable=True)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to user
    user = db.relationship("User", backref="session_participations")

    def to_dict(self):
        avatar = self.user.avatar_url if (self.user and self.user.avatar_url) else f"https://api.dicebear.com/7.x/bottts/svg?seed={self.nickname}"
        return {
            "id": self.id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "nickname": self.nickname,
            "avatar_url": avatar,
            "score": self.score,
            "streak": self.streak,
            "rank": self.rank,
            "is_connected": self.is_connected,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


class SubmittedAnswer(db.Model):
    __tablename__ = "submitted_answers"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_sessions.id", ondelete="CASCADE"), nullable=False)
    participant_id = db.Column(db.Integer, db.ForeignKey("session_participants.id", ondelete="CASCADE"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_ids = db.Column(db.JSON, nullable=False)  # List of integer option IDs
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
    points_awarded = db.Column(db.Integer, default=0, nullable=False)
    response_time_seconds = db.Column(db.Float, default=0.0, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("session_id", "participant_id", "question_id", name="uq_session_part_question"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "participant_id": self.participant_id,
            "question_id": self.question_id,
            "selected_option_ids": self.selected_option_ids,
            "is_correct": self.is_correct,
            "points_awarded": self.points_awarded,
            "response_time_seconds": round(self.response_time_seconds, 3),
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }


class GameResult(db.Model):
    __tablename__ = "game_results"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    nickname = db.Column(db.String(80), nullable=False)
    final_score = db.Column(db.Integer, default=0, nullable=False)
    final_rank = db.Column(db.Integer, default=1, nullable=False)
    correct_count = db.Column(db.Integer, default=0, nullable=False)
    incorrect_count = db.Column(db.Integer, default=0, nullable=False)
    average_speed = db.Column(db.Float, default=0.0, nullable=False)
    xp_earned = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship("User", backref="game_results")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "nickname": self.nickname,
            "final_score": self.final_score,
            "final_rank": self.final_rank,
            "correct_count": self.correct_count,
            "incorrect_count": self.incorrect_count,
            "average_speed": round(self.average_speed, 2),
            "xp_earned": self.xp_earned,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

