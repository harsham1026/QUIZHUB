from datetime import datetime
from app.extensions import db

class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    captain_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    captain = db.relationship("User", foreign_keys=[captain_id])
    members = db.relationship("TeamMember", backref="team", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "captain_id": self.captain_id,
            "captain_name": self.captain.full_name if self.captain else "",
            "avatar_url": self.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={self.name}",
            "member_count": self.members.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TeamMember(db.Model):
    __tablename__ = "team_members"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = db.Column(db.Enum("captain", "member", name="team_role_enum"), default="member", nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="team_memberships")

    __table_args__ = (
        db.UniqueConstraint("team_id", "user_id", name="uq_team_user"),
    )


class Friendship(db.Model):
    __tablename__ = "friendships"

    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    addressee_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.Enum("pending", "accepted", "blocked", name="friendship_status_enum"), default="pending", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    requester = db.relationship("User", foreign_keys=[requester_id], backref="sent_friend_requests")
    addressee = db.relationship("User", foreign_keys=[addressee_id], backref="received_friend_requests")

    __table_args__ = (
        db.UniqueConstraint("requester_id", "addressee_id", name="uq_friendship"),
    )


class Challenge(db.Model):
    __tablename__ = "challenges"

    id = db.Column(db.Integer, primary_key=True)
    challenger_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenged_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_sessions.id", ondelete="SET NULL"), nullable=True)
    status = db.Column(db.Enum("pending", "accepted", "declined", "completed", name="challenge_status_enum"), default="pending", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    challenger = db.relationship("User", foreign_keys=[challenger_id])
    challenged = db.relationship("User", foreign_keys=[challenged_id])
    quiz = db.relationship("Quiz")
    session = db.relationship("QuizSession")

    def to_dict(self):
        return {
            "id": self.id,
            "challenger_id": self.challenger_id,
            "challenger_name": self.challenger.full_name if self.challenger else "",
            "challenged_id": self.challenged_id,
            "challenged_name": self.challenged.full_name if self.challenged else "",
            "quiz_id": self.quiz_id,
            "quiz_title": self.quiz.title if self.quiz else "",
            "session_id": self.session_id,
            "session_pin": self.session.pin if self.session else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

