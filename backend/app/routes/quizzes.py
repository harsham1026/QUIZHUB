from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.quiz import Quiz, Question, AnswerOption
from app.models.user import User
from app.middleware.auth import role_required, get_current_user

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api/quizzes")

@quizzes_bp.route("", methods=["GET"])
def get_quizzes():
    category = request.args.get("category")
    difficulty = request.args.get("difficulty")
    search = request.args.get("search")
    page = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 12)), 50)

    query = Quiz.query.filter_by(is_published=True, is_public=True)

    if category and category != "All":
        query = query.filter_by(category=category)
    if difficulty and difficulty != "All":
        query = query.filter_by(difficulty=difficulty)
    if search:
        query = query.filter(Quiz.title.ilike(f"%{search}%") | Quiz.description.ilike(f"%{search}%"))

    total = query.count()
    quizzes = query.order_by(Quiz.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "quizzes": [q.to_dict() for q in quizzes],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }), 200

@quizzes_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_quizzes():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    quizzes = Quiz.query.filter_by(creator_id=user.id).order_by(Quiz.created_at.desc()).all()
    return jsonify({"quizzes": [q.to_dict(include_questions=True, include_correct=True) for q in quizzes]}), 200

@quizzes_bp.route("", methods=["POST"])
@jwt_required()
@role_required("teacher", "admin")
def create_quiz():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Validation Error", "message": "Quiz title is required"}), 400

    quiz = Quiz(
        creator_id=user_id,
        title=title,
        description=data.get("description", ""),
        category=data.get("category", "General Knowledge"),
        difficulty=data.get("difficulty", "medium"),
        cover_image=data.get("cover_image"),
        time_limit_per_question=int(data.get("time_limit_per_question", 30)),
        is_published=data.get("is_published", True),
        is_public=data.get("is_public", True),
        randomize_questions=data.get("randomize_questions", False),
        randomize_options=data.get("randomize_options", False),
    )
    db.session.add(quiz)
    db.session.flush()

    raw_questions = data.get("questions", [])
    for q_idx, q_data in enumerate(raw_questions):
        question = Question(
            quiz_id=quiz.id,
            question_text=q_data.get("question_text", "Untitled Question"),
            question_type=q_data.get("question_type", "multiple_choice"),
            time_limit=int(q_data.get("time_limit", quiz.time_limit_per_question)),
            points=int(q_data.get("points", 1000)),
            image_url=q_data.get("image_url"),
            order_num=q_idx,
        )
        db.session.add(question)
        db.session.flush()

        raw_options = q_data.get("options", [])
        for opt_idx, opt_data in enumerate(raw_options):
            option = AnswerOption(
                question_id=question.id,
                option_text=opt_data.get("option_text", ""),
                is_correct=bool(opt_data.get("is_correct", False)),
                order_num=opt_idx,
            )
            db.session.add(option)

    db.session.commit()
    return jsonify({"message": "Quiz created successfully", "quiz": quiz.to_dict(include_questions=True, include_correct=True)}), 201

@quizzes_bp.route("/<int:quiz_id>", methods=["GET"])
def get_quiz_detail(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Not Found", "message": "Quiz not found"}), 404

    # Include correct answers only if requester is creator or admin
    current_user = get_current_user()
    is_owner = current_user and (current_user.id == quiz.creator_id or current_user.role == "admin")

    return jsonify({"quiz": quiz.to_dict(include_questions=True, include_correct=is_owner)}), 200

@quizzes_bp.route("/<int:quiz_id>", methods=["PUT"])
@jwt_required()
def update_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Not Found", "message": "Quiz not found"}), 404

    user = User.query.get(user_id)
    if quiz.creator_id != user_id and user.role != "admin":
        return jsonify({"error": "Forbidden", "message": "You can only edit your own quizzes"}), 403

    data = request.get_json() or {}
    quiz.title = data.get("title", quiz.title)
    quiz.description = data.get("description", quiz.description)
    quiz.category = data.get("category", quiz.category)
    quiz.difficulty = data.get("difficulty", quiz.difficulty)
    quiz.cover_image = data.get("cover_image", quiz.cover_image)
    quiz.time_limit_per_question = int(data.get("time_limit_per_question", quiz.time_limit_per_question))
    quiz.is_published = data.get("is_published", quiz.is_published)
    quiz.is_public = data.get("is_public", quiz.is_public)

    # If questions provided, replace them
    if "questions" in data:
        for q in quiz.questions:
            db.session.delete(q)
        db.session.flush()

        for q_idx, q_data in enumerate(data["questions"]):
            question = Question(
                quiz_id=quiz.id,
                question_text=q_data.get("question_text", "Untitled Question"),
                question_type=q_data.get("question_type", "multiple_choice"),
                time_limit=int(q_data.get("time_limit", quiz.time_limit_per_question)),
                points=int(q_data.get("points", 1000)),
                image_url=q_data.get("image_url"),
                order_num=q_idx,
            )
            db.session.add(question)
            db.session.flush()

            for opt_idx, opt_data in enumerate(q_data.get("options", [])):
                option = AnswerOption(
                    question_id=question.id,
                    option_text=opt_data.get("option_text", ""),
                    is_correct=bool(opt_data.get("is_correct", False)),
                    order_num=opt_idx,
                )
                db.session.add(option)

    db.session.commit()
    return jsonify({"message": "Quiz updated successfully", "quiz": quiz.to_dict(include_questions=True, include_correct=True)}), 200

@quizzes_bp.route("/<int:quiz_id>", methods=["DELETE"])
@jwt_required()
def delete_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Not Found", "message": "Quiz not found"}), 404

    user = User.query.get(user_id)
    if quiz.creator_id != user_id and user.role != "admin":
        return jsonify({"error": "Forbidden", "message": "You can only delete your own quizzes"}), 403

    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz deleted successfully"}), 200

@quizzes_bp.route("/<int:quiz_id>/duplicate", methods=["POST"])
@jwt_required()
@role_required("teacher", "admin")
def duplicate_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    original = Quiz.query.get(quiz_id)
    if not original:
        return jsonify({"error": "Quiz not found"}), 404

    cloned = Quiz(
        creator_id=user_id,
        title=f"{original.title} (Copy)",
        description=original.description,
        category=original.category,
        difficulty=original.difficulty,
        cover_image=original.cover_image,
        time_limit_per_question=original.time_limit_per_question,
        is_published=False,
        is_public=original.is_public,
    )
    db.session.add(cloned)
    db.session.flush()

    for q in original.questions:
        new_q = Question(
            quiz_id=cloned.id,
            question_text=q.question_text,
            question_type=q.question_type,
            time_limit=q.time_limit,
            points=q.points,
            image_url=q.image_url,
            order_num=q.order_num,
        )
        db.session.add(new_q)
        db.session.flush()

        for opt in q.options:
            new_opt = AnswerOption(
                question_id=new_q.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
                order_num=opt.order_num,
            )
            db.session.add(new_opt)

    db.session.commit()
    return jsonify({"message": "Quiz duplicated successfully", "quiz": cloned.to_dict(include_questions=True, include_correct=True)}), 201

@quizzes_bp.route("/<int:quiz_id>/practice", methods=["GET"])
def get_practice_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    # Practice mode returns questions with correct answers embedded so client can evaluate instant solo feedback
    return jsonify({"quiz": quiz.to_dict(include_questions=True, include_correct=True)}), 200

