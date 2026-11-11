from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate

try:
    from flask_socketio import SocketIO
    socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
    HAS_SOCKETIO = True
except ImportError:
    HAS_SOCKETIO = False

    class _NoopSocketIO:
        def init_app(self, app, **kwargs):
            pass

        def on(self, *args, **kwargs):
            def decorator(fn):
                return fn
            return decorator

        def run(self, app, **kwargs):
            app.run(**kwargs)

    socketio = _NoopSocketIO()

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
migrate = Migrate()
