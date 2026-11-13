import os
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, jwt, socketio, cors, migrate, HAS_SOCKETIO


def create_app(config_name=None):
    if not config_name:
        config_name = os.getenv("FLASK_ENV", "development")

    flask_app = Flask(__name__)
    flask_app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Initialize extensions
    db.init_app(flask_app)
    jwt.init_app(flask_app)
    cors.init_app(flask_app, resources={r"/api/*": {"origins": "*"}})
    if HAS_SOCKETIO:
        socketio.init_app(flask_app)
    migrate.init_app(flask_app, db)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.quizzes import quizzes_bp
    from app.routes.sessions import sessions_bp
    from app.routes.tournaments import tournaments_bp
    from app.routes.challenges import challenges_bp
    from app.routes.leaderboard import leaderboard_bp
    from app.routes.ai import ai_bp
    from app.routes.admin import admin_bp
    from app.routes.users import users_bp

    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(quizzes_bp)
    flask_app.register_blueprint(sessions_bp)
    flask_app.register_blueprint(tournaments_bp)
    flask_app.register_blueprint(challenges_bp)
    flask_app.register_blueprint(leaderboard_bp)
    flask_app.register_blueprint(ai_bp)
    flask_app.register_blueprint(admin_bp)
    flask_app.register_blueprint(users_bp)

    with flask_app.app_context():
        if HAS_SOCKETIO and not (os.getenv("VERCEL") or os.getenv("VERCEL_ENV")):
            import app.sockets.game_events  # noqa: F401
        try:
            db.create_all()
            engine = db.engine
            dialect_name = engine.dialect.name
            with engine.connect() as conn:
                if dialect_name == "postgresql":
                    for stmt in [
                        "ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'user';",
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(191);",
                        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;",
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';",
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;",
                        "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;",
                    ]:
                        try:
                            conn.execute(db.text(stmt))
                            conn.commit()
                        except Exception:
                            pass
                elif dialect_name == "sqlite":
                    res = conn.execute(db.text("PRAGMA table_info(users);")).fetchall()
                    col_names = [r[1] for r in res]
                    if "google_id" not in col_names:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN google_id VARCHAR(191);"))
                    if "auth_provider" not in col_names:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email';"))
                    if "last_login" not in col_names:
                        conn.execute(db.text("ALTER TABLE users ADD COLUMN last_login DATETIME;"))
                    conn.commit()
                elif dialect_name == "mysql":
                    for stmt in [
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(191) UNIQUE;",
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';",
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login DATETIME;",
                        "ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;",
                    ]:
                        try:
                            conn.execute(db.text(stmt))
                            conn.commit()
                        except Exception:
                            pass

            from app.seed_helper import seed_if_empty
            seed_if_empty()
        except Exception as e:
            db.session.rollback()
            flask_app.logger.warning(f"DB init/seed note: {e}")

    @flask_app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "QuizHub API",
            "version": "1.0.0",
            "mode": "serverless" if (os.getenv("VERCEL") or os.getenv("VERCEL_ENV")) else "standard",
        }), 200

    return flask_app
