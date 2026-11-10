import os
from app import create_app
from app.extensions import socketio

app = create_app(os.getenv("FLASK_ENV", "development"))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    print(f"🚀 QuizHub Backend starting on http://127.0.0.1:{port} (Debug: {debug})")
    socketio.run(app, host="0.0.0.0", port=port, debug=debug, allow_unsafe_werkzeug=True)

