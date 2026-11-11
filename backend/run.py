import os
from app import create_app
from app.extensions import socketio

flask_env = os.getenv("FLASK_ENV", "development")
app = create_app(flask_env)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    print(f"🚀 QuizHub Backend starting on http://0.0.0.0:{port} (Debug: {debug})")
    socketio.run(app, host="0.0.0.0", port=port, debug=debug, allow_unsafe_werkzeug=True)
