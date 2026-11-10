from datetime import datetime
from app.extensions import db

class Tournament(db.Model):
    __tablename__ = "tournaments"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), default="General", nullable=False)
    status = db.Column(
        db.Enum("upcoming", "registration_open", "live", "completed", "cancelled", name="tournament_status_enum"),
        default="upcoming",
        nullable=False
    )
    max_participants = db.Column(db.Integer, default=100, nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    registration_deadline = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    creator = db.relationship("User", backref="created_tournaments")
    quiz = db.relationship("Quiz", backref="tournaments")
    participants = db.relationship("TournamentParticipant", backref="tournament", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "status": self.status,
            "max_participants": self.max_participants,
            "current_participants": self.participants.count(),
            "creator_id": self.creator_id,
            "creator_name": self.creator.full_name if self.creator else "Admin",
            "quiz_id": self.quiz_id,
            "quiz_title": self.quiz.title if self.quiz else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "registration_deadline": self.registration_deadline.isoformat() if self.registration_deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TournamentParticipant(db.Model):
    __tablename__ = "tournament_participants"

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = db.Column(db.Integer, default=0, nullable=False)
    final_rank = db.Column(db.Integer, nullable=True)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="tournament_entries")

    __table_args__ = (
        db.UniqueConstraint("tournament_id", "user_id", name="uq_tourney_user"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "user_id": self.user_id,
            "full_name": self.user.full_name if self.user else "Anonymous",
            "score": self.score,
            "final_rank": self.final_rank,
            "registered_at": self.registered_at.isoformat() if self.registered_at else None,
        }

