from datetime import datetime
from app.extensions import db

class Achievement(db.Model):
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    badge_icon = db.Column(db.String(100), nullable=False)
    xp_reward = db.Column(db.Integer, default=100, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "title": self.title,
            "description": self.description,
            "badge_icon": self.badge_icon,
            "xp_reward": self.xp_reward,
        }


class UserAchievement(db.Model):
    __tablename__ = "user_achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    achievement = db.relationship("Achievement")

    __table_args__ = (
        db.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement": self.achievement.to_dict() if self.achievement else None,
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None,
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "link": self.link,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type = db.Column(db.Enum("quiz", "question", "user", name="report_target_enum"), nullable=False)
    target_id = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(500), nullable=False)
    status = db.Column(
        db.Enum("pending", "reviewed", "dismissed", "actioned", name="report_status_enum"),
        default="pending",
        nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    reporter = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "reporter_id": self.reporter_id,
            "reporter_name": self.reporter.full_name if self.reporter else "Unknown",
            "target_type": self.target_type,
            "target_id": self.target_id,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = db.Column(db.String(150), nullable=False, index=True)
    ip_address = db.Column(db.String(50), nullable=True)
    activity_metadata = db.Column("metadata", db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_email": self.user.email if self.user else "System",
            "action": self.action,
            "ip_address": self.ip_address,
            "metadata": self.activity_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

