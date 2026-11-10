from datetime import datetime
from app.extensions import db

class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), default="General Knowledge", nullable=False, index=True)
    difficulty = db.Column(db.Enum("easy", "medium", "hard", name="quiz_diff_enum"), default="medium", nullable=False)
    cover_image = db.Column(db.String(500), nullable=True)
    time_limit_per_question = db.Column(db.Integer, default=30, nullable=False)
    is_published = db.Column(db.Boolean, default=False, nullable=False, index=True)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    randomize_questions = db.Column(db.Boolean, default=False, nullable=False)
    randomize_options = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    questions = db.relationship("Question", backref="quiz", lazy="joined", cascade="all, delete-orphan", order_by="Question.order_num")
    sessions = db.relationship("QuizSession", backref="quiz", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_questions=False, include_correct=False):
        data = {
            "id": self.id,
            "creator_id": self.creator_id,
            "creator_name": self.creator.full_name if self.creator else "Unknown",
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "difficulty": self.difficulty,
            "cover_image": self.cover_image or "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80",
            "time_limit_per_question": self.time_limit_per_question,
            "is_published": self.is_published,
            "is_public": self.is_public,
            "randomize_questions": self.randomize_questions,
            "randomize_options": self.randomize_options,
            "total_questions": len(self.questions) if self.questions else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_questions and self.questions:
            data["questions"] = [q.to_dict(include_correct=include_correct) for q in self.questions]
        return data


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.Enum("multiple_choice", "true_false", "multi_select", name="q_type_enum"), default="multiple_choice", nullable=False)
    time_limit = db.Column(db.Integer, default=30, nullable=False)
    points = db.Column(db.Integer, default=1000, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    order_num = db.Column(db.Integer, default=0, nullable=False)

    # Relationships
    options = db.relationship("AnswerOption", backref="question", lazy="joined", cascade="all, delete-orphan", order_by="AnswerOption.order_num")

    def to_dict(self, include_correct=False):
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "question_text": self.question_text,
            "question_type": self.question_type,
            "time_limit": self.time_limit,
            "points": self.points,
            "image_url": self.image_url,
            "order_num": self.order_num,
            "options": [opt.to_dict(include_correct=include_correct) for opt in self.options],
        }


class AnswerOption(db.Model):
    __tablename__ = "answer_options"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
    order_num = db.Column(db.Integer, default=0, nullable=False)

    def to_dict(self, include_correct=False):
        data = {
            "id": self.id,
            "question_id": self.question_id,
            "option_text": self.option_text,
            "order_num": self.order_num,
        }
        if include_correct:
            data["is_correct"] = self.is_correct
        return data

