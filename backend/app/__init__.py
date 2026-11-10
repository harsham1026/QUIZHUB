import os
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, jwt, socketio, cors, migrate

def create_app(config_name=None):
    if not config_name:
        config_name = os.getenv("FLASK_ENV", "development")

    flask_app = Flask(__name__)
    flask_app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Initialize extensions
    db.init_app(flask_app)
    jwt.init_app(flask_app)
    cors.init_app(flask_app, resources={r"/api/*": {"origins": "*"}})
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

    # Import socket events to bind handlers
    with flask_app.app_context():
        import app.sockets.game_events
        # Create database tables if not existing
        try:
            db.create_all()
        except Exception as e:
            flask_app.logger.warning(f"db.create_all() encountered note: {e}")

    @flask_app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "QuizHub API",
            "version": "1.0.0"
        }), 200

    return flask_app
