from datetime import datetime, timedelta
from app.extensions import db
from app.models.user import User, StudentProfile, TeacherProfile
from app.models.quiz import Quiz, Question, AnswerOption
from app.models.tournament import Tournament
from app.models.admin import Achievement, UserAchievement


def seed_if_empty():
    """Populate initial demo accounts, quizzes, achievements, and tournaments if database is empty."""
    if User.query.first() is not None:
        return

    achievements_data = [
        {"code": "first_win", "title": "First Blood", "description": "Win your first multiplayer quiz match.", "badge_icon": "Trophy", "xp_reward": 250},
        {"code": "streak_5", "title": "Unstoppable", "description": "Achieve a 5-question answer streak.", "badge_icon": "Flame", "xp_reward": 300},
        {"code": "speed_demon", "title": "Speed Demon", "description": "Answer a question correctly in under 2 seconds.", "badge_icon": "Zap", "xp_reward": 200},
        {"code": "quiz_master", "title": "Grandmaster", "description": "Play over 20 competitive quizzes.", "badge_icon": "Crown", "xp_reward": 500},
        {"code": "tourney_champ", "title": "Apex Champion", "description": "Rank #1 in a platform tournament.", "badge_icon": "Award", "xp_reward": 1000},
    ]
    achievement_objs = {}
    for ach in achievements_data:
        existing = Achievement.query.filter_by(code=ach["code"]).first()
        if not existing:
            existing = Achievement(**ach)
            db.session.add(existing)
        achievement_objs[ach["code"]] = existing
    db.session.flush()

    admin = User(
        email="admin@quizhub.com",
        full_name="Alex Vance (Admin)",
        role="admin",
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=AdminAlex",
    )
    admin.set_password("Admin@123456")
    db.session.add(admin)

    teacher = User(
        email="teacher@quizhub.com",
        full_name="Prof. Sarah Connor",
        role="teacher",
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=TeacherSarah",
    )
    teacher.set_password("Teacher@123456")
    db.session.add(teacher)
    db.session.flush()

    db.session.add(TeacherProfile(
        user_id=teacher.id,
        school_or_organization="Apex Cyber Academy",
        subject_specialization="Computer Science & Cybernetics",
        bio="Passionate educator and game theory enthusiast.",
        verified=True,
    ))

    student = User(
        email="student@quizhub.com",
        full_name="Marcus Phoenix",
        role="student",
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=MarcusStudent",
    )
    student.set_password("Student@123456")
    db.session.add(student)
    db.session.flush()

    db.session.add(StudentProfile(
        user_id=student.id,
        xp=3450,
        level=4,
        streak=6,
        total_quizzes_played=14,
        total_wins=8,
        accuracy_rate=88.5,
    ))
    if "first_win" in achievement_objs:
        db.session.add(UserAchievement(user_id=student.id, achievement_id=achievement_objs["first_win"].id))
    if "streak_5" in achievement_objs:
        db.session.add(UserAchievement(user_id=student.id, achievement_id=achievement_objs["streak_5"].id))

    mock_students = [
        ("elena@quizhub.com", "Elena Rostova", 5600, 6, 12, 28, 94.2),
        ("kai@quizhub.com", "Kai Sterling", 4800, 5, 9, 21, 89.0),
        ("zara@quizhub.com", "Zara Chen", 4100, 5, 7, 19, 86.4),
        ("neo@quizhub.com", "Neo Anderson", 2900, 3, 4, 11, 81.0),
    ]
    for email, name, xp, lvl, wins, played, acc in mock_students:
        s_user = User(
            email=email,
            full_name=name,
            role="student",
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
        )
        s_user.set_password("Student@123456")
        db.session.add(s_user)
        db.session.flush()
        db.session.add(StudentProfile(
            user_id=s_user.id,
            xp=xp,
            level=lvl,
            streak=lvl,
            total_quizzes_played=played,
            total_wins=wins,
            accuracy_rate=acc,
        ))

    q1 = Quiz(
        creator_id=teacher.id,
        title="Cyberpunk & Web3 Tech Trivia",
        description="Test your edge-running tech prowess in cryptography, decentralized networks, and cybernetic history.",
        category="Technology",
        difficulty="medium",
        cover_image="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        time_limit_per_question=25,
        is_published=True,
        is_public=True,
    )
    db.session.add(q1)
    db.session.flush()

    questions_q1 = [
        {
            "text": "What does the term 'Zero-Knowledge Proof' (ZKP) allow a prover to do?",
            "type": "multiple_choice",
            "points": 1000,
            "options": [
                ("Prove a statement is true without revealing any information beyond its validity", True),
                ("Encrypt data with zero computational overhead", False),
                ("Bypass database indexing for zero latency", False),
                ("Eliminate network packet inspection entirely", False),
            ],
        },
        {
            "text": "WebSocket protocols operate over a single persistent TCP connection.",
            "type": "true_false",
            "points": 800,
            "options": [("True", True), ("False", False)],
        },
        {
            "text": "Which consensus mechanism powers the current Ethereum network after 'The Merge'?",
            "type": "multiple_choice",
            "points": 1000,
            "options": [
                ("Proof of Work (PoW)", False),
                ("Proof of Stake (PoS)", True),
                ("Delegated Byzantine Fault Tolerance", False),
                ("Proof of Elapsed Time", False),
            ],
        },
        {
            "text": "Which of the following are valid React component lifecycle triggers? (Multi-select)",
            "type": "multi_select",
            "points": 1200,
            "options": [
                ("State update via setState / useState", True),
                ("Props change from parent component", True),
                ("Direct mutation of localStorage", False),
                ("Component mounting to the DOM tree", True),
            ],
        },
    ]
    for idx, q_info in enumerate(questions_q1):
        question = Question(
            quiz_id=q1.id,
            question_text=q_info["text"],
            question_type=q_info["type"],
            points=q_info["points"],
            time_limit=25,
            order_num=idx,
        )
        db.session.add(question)
        db.session.flush()
        for opt_idx, (opt_text, is_corr) in enumerate(q_info["options"]):
            db.session.add(AnswerOption(
                question_id=question.id,
                option_text=opt_text,
                is_correct=is_corr,
                order_num=opt_idx,
            ))

    q2 = Quiz(
        creator_id=teacher.id,
        title="Cosmic Wonders & Quantum Frontiers",
        description="From black holes to quantum entanglement, explore the deepest mysteries of our universe.",
        category="Science",
        difficulty="hard",
        cover_image="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
        time_limit_per_question=30,
        is_published=True,
        is_public=True,
    )
    db.session.add(q2)
    db.session.flush()

    questions_q2 = [
        {
            "text": "What is the boundary around a black hole beyond which nothing can escape called?",
            "type": "multiple_choice",
            "points": 1000,
            "options": [
                ("Event Horizon", True),
                ("Schwarzschild Singularity", False),
                ("Accretion Limit", False),
                ("Photon Sphere", False),
            ],
        },
        {
            "text": "Quantum entanglement permits faster-than-light transmission of arbitrary classical data.",
            "type": "true_false",
            "points": 1000,
            "options": [("True", False), ("False", True)],
        },
        {
            "text": "What particle is theorized to mediate the force of gravitation?",
            "type": "multiple_choice",
            "points": 1000,
            "options": [
                ("Graviton", True),
                ("Gluon", False),
                ("Higgs Boson", False),
                ("Muon", False),
            ],
        },
    ]
    for idx, q_info in enumerate(questions_q2):
        question = Question(
            quiz_id=q2.id,
            question_text=q_info["text"],
            question_type=q_info["type"],
            points=q_info["points"],
            time_limit=30,
            order_num=idx,
        )
        db.session.add(question)
        db.session.flush()
        for opt_idx, (opt_text, is_corr) in enumerate(q_info["options"]):
            db.session.add(AnswerOption(
                question_id=question.id,
                option_text=opt_text,
                is_correct=is_corr,
                order_num=opt_idx,
            ))

    now = datetime.utcnow()
    db.session.add(Tournament(
        title="Winter Apex Championship 2026",
        description="The ultimate nationwide battle of wits. Top 3 contenders win master badges and platform glory.",
        category="Technology",
        status="registration_open",
        max_participants=64,
        creator_id=teacher.id,
        quiz_id=q1.id,
        start_date=now + timedelta(days=2),
        end_date=now + timedelta(days=3),
        registration_deadline=now + timedelta(days=1, hours=12),
    ))

    db.session.commit()

