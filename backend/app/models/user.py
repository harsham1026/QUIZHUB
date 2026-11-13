from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(191), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="user")
    google_id = db.Column(db.String(191), unique=True, nullable=True, index=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student_profile = db.relationship("StudentProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = db.relationship("TeacherProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    quizzes = db.relationship("Quiz", backref="creator", lazy="dynamic", cascade="all, delete-orphan")
    user_achievements = db.relationship("UserAchievement", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_profile=True):
        data = {
            "id": self.id,
            "google_id": self.google_id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role or "user",
            "avatar_url": self.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={self.email}",
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        if include_profile:
            if self.student_profile:
                data["profile"] = self.student_profile.to_dict()
            elif self.teacher_profile:
                data["profile"] = self.teacher_profile.to_dict()
            else:
                data["profile"] = {
                    "xp": 0,
                    "level": 1,
                    "streak": 0,
                    "total_quizzes_played": 0,
                    "total_wins": 0,
                    "accuracy_rate": 0.0,
                    "next_level_xp": 1000,
                    "current_level_progress": 0,
                }
        return data


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    xp = db.Column(db.Integer, default=0, nullable=False)
    level = db.Column(db.Integer, default=1, nullable=False)
    streak = db.Column(db.Integer, default=0, nullable=False)
    total_quizzes_played = db.Column(db.Integer, default=0, nullable=False)
    total_wins = db.Column(db.Integer, default=0, nullable=False)
    accuracy_rate = db.Column(db.Float, default=0.0, nullable=False)

    def add_xp(self, amount):
        self.xp += amount
        # Level progression formula: Level = 1 + int(xp / 1000)
        new_level = 1 + (self.xp // 1000)
        self.level = new_level

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "xp": self.xp,
            "level": self.level,
            "streak": self.streak,
            "total_quizzes_played": self.total_quizzes_played,
            "total_wins": self.total_wins,
            "accuracy_rate": round(self.accuracy_rate, 2),
            "next_level_xp": (self.level) * 1000,
            "current_level_progress": self.xp % 1000,
        }


class TeacherProfile(db.Model):
    __tablename__ = "teacher_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    school_or_organization = db.Column(db.String(255), nullable=True)
    subject_specialization = db.Column(db.String(150), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    verified = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "school_or_organization": self.school_or_organization,
            "subject_specialization": self.subject_specialization,
            "bio": self.bio,
            "verified": self.verified,
        }

