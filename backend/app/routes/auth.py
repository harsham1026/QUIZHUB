import os
import re
import time
import smtplib
from collections import defaultdict
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from app.extensions import db
from app.models.user import User, StudentProfile, TeacherProfile
from app.models.admin import ActivityLog

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Email regex supporting Gmail, Outlook, Yahoo, and any RFC-compliant domains
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# In-memory rate limiting for login attempts
_login_failed_attempts = defaultdict(list)

def _is_valid_email(email):
    if not email or len(email) > 191:
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

def _check_rate_limit(key, limit=5, window_seconds=300):
    now = time.time()
    _login_failed_attempts[key] = [t for t in _login_failed_attempts[key] if now - t < window_seconds]
    return len(_login_failed_attempts[key]) < limit

def _record_failed_attempt(key):
    _login_failed_attempts[key].append(time.time())

def _clear_rate_limit(key):
    if key in _login_failed_attempts:
        del _login_failed_attempts[key]

def _send_reset_email(to_email, reset_url):
    smtp_server = os.getenv("SMTP_SERVER") or os.getenv("MAIL_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or 587)
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME") or os.getenv("MAIL_USERNAME")
    smtp_pass = os.getenv("SMTP_PASS") or os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
    sender_email = os.getenv("MAIL_DEFAULT_SENDER") or os.getenv("SMTP_FROM") or (smtp_user if smtp_user else "noreply@quizhub.com")

    if not smtp_server or not smtp_user or not smtp_pass:
        return False, "SMTP is not configured on the server."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "QuizHub - Password Reset Request"
        msg["From"] = f"QuizHub Security <{sender_email}>"
        msg["To"] = to_email

        text = f"Hello,\n\nYou recently requested to reset your QuizHub password. Click the link below to set a new password:\n\n{reset_url}\n\nThis link is valid for 1 hour. If you did not request this, you can safely ignore this email.\n\n— The QuizHub Team"
        html = f"""
        <div style="background-color: #0d1117; color: #c9d1d9; font-family: sans-serif; padding: 32px; border-radius: 12px;">
          <h2 style="color: #00f2fe; margin-top: 0;">QuizHub Password Reset</h2>
          <p>You requested a password reset for your QuizHub account. Click the button below to choose a new password:</p>
          <div style="margin: 28px 0;">
            <a href="{reset_url}" style="background-color: #00f2fe; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #8b949e;">This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.</p>
        </div>
        """
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, [to_email], msg.as_string())
        return True, "Email sent successfully"
    except Exception as e:
        return False, str(e)

@auth_bp.route("/config", methods=["GET"])
def get_auth_config():
    """Return public authentication configuration."""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID", "")
    smtp_server = os.getenv("SMTP_SERVER") or os.getenv("MAIL_SERVER")
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME") or os.getenv("MAIL_USERNAME")

    return jsonify({
        "google_client_id": google_client_id,
        "google_configured": bool(google_client_id),
        "smtp_configured": bool(smtp_server and smtp_user),
    }), 200

@auth_bp.route("/google", methods=["POST"])
def google_auth():
    """Verify Google token, find or create user, and issue QuizHub JWT."""
    data = request.get_json() or {}
    credential = data.get("credential")  # ID token
    access_token = data.get("access_token")  # OAuth2 access token

    if not credential and not access_token:
        return jsonify({
            "error": "Validation Error",
            "message": "Google credential (ID token) or access_token is required"
        }), 400

    google_client_id = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID")
    google_user_info = None

    # Option A: Google ID Token (from Google Identity Services credential response)
    if credential:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            req_transport = google_requests.Request()
            id_info = id_token.verify_oauth2_token(
                credential,
                req_transport,
                audience=google_client_id if google_client_id else None
            )
            google_user_info = {
                "sub": id_info.get("sub"),
                "email": id_info.get("email"),
                "name": id_info.get("name"),
                "picture": id_info.get("picture"),
                "email_verified": id_info.get("email_verified", True),
            }
        except Exception:
            # Fallback to Google tokeninfo HTTP endpoint
            try:
                resp = requests.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": credential},
                    timeout=10
                )
                if resp.status_code == 200:
                    info = resp.json()
                    google_user_info = {
                        "sub": info.get("sub"),
                        "email": info.get("email"),
                        "name": info.get("name"),
                        "picture": info.get("picture"),
                        "email_verified": str(info.get("email_verified", "")).lower() in ("true", "1"),
                    }
                else:
                    return jsonify({
                        "error": "Unauthorized",
                        "message": "Google credential verification failed. Please try signing in again."
                    }), 401
            except Exception as net_err:
                return jsonify({
                    "error": "Authentication Failed",
                    "message": f"Network error during Google verification: {net_err}"
                }), 502

    # Option B: Google Access Token (from OAuth2 popup token client)
    elif access_token:
        try:
            resp = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10
            )
            if resp.status_code == 200:
                info = resp.json()
                google_user_info = {
                    "sub": info.get("sub"),
                    "email": info.get("email"),
                    "name": info.get("name"),
                    "picture": info.get("picture"),
                    "email_verified": str(info.get("email_verified", "")).lower() in ("true", "1"),
                }
            else:
                return jsonify({
                    "error": "Unauthorized",
                    "message": "Google access token is invalid or expired"
                }), 401
        except Exception as net_err:
            return jsonify({
                "error": "Authentication Failed",
                "message": f"Network error during Google profile retrieval: {net_err}"
            }), 502

    if not google_user_info or not google_user_info.get("email"):
        return jsonify({
            "error": "Unauthorized",
            "message": "Could not retrieve verified email from Google account."
        }), 401

    google_id = str(google_user_info["sub"])
    email = google_user_info["email"].lower().strip()
    full_name = google_user_info.get("name") or email.split("@")[0]
    avatar_url = google_user_info.get("picture")

    # Check for existing user by google_id first, then by email
    user = User.query.filter_by(google_id=google_id).first()
    is_new_user = False

    if not user:
        user = User.query.filter_by(email=email).first()
        if user:
            # Link Google ID to existing account
            user.google_id = google_id
            if avatar_url:
                user.avatar_url = avatar_url
            if not user.full_name or user.full_name == email:
                user.full_name = full_name
            user.auth_provider = "both" if user.password_hash else "google"
        else:
            # Create a brand new unified User account
            is_new_user = True
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                avatar_url=avatar_url,
                role="user",
                auth_provider="google",
                is_active=True,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
            )
            db.session.add(user)
            db.session.flush()

    if not user.is_active:
        return jsonify({"error": "Forbidden", "message": "Account has been deactivated. Please contact support."}), 403

    # Ensure user has a profile attached for XP and statistics
    if not user.student_profile:
        db.session.add(StudentProfile(user_id=user.id))

    user.last_login = datetime.utcnow()
    action = "user_registered_google" if is_new_user else "user_logged_in_google"
    log = ActivityLog(user_id=user.id, action=action, ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    access_token_jwt = create_access_token(identity=str(user.id))
    refresh_token_jwt = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Authenticated successfully with Google",
        "is_new_user": is_new_user,
        "user": user.to_dict(),
        "access_token": access_token_jwt,
        "refresh_token": refresh_token_jwt,
    }), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user with full name, email, and password."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password")
    full_name = data.get("full_name", "").strip()

    if not email or not password or not full_name:
        return jsonify({"error": "Validation Error", "message": "Full name, email address, and password are required."}), 400

    if not _is_valid_email(email):
        return jsonify({"error": "Validation Error", "message": "Please enter a valid email address (e.g., user@example.com)."}), 400

    if len(password) < 8:
        return jsonify({"error": "Validation Error", "message": "Password must be at least 8 characters long."}), 400

    if confirm_password is not None and password != confirm_password:
        return jsonify({"error": "Validation Error", "message": "Passwords do not match."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Conflict", "message": "An account with this email address already exists. Please sign in."}), 409

    user = User(
        email=email,
        full_name=full_name,
        role="user",
        auth_provider="email",
        last_login=datetime.utcnow(),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Always ensure student_profile is created for player stats
    student_profile = StudentProfile(user_id=user.id)
    db.session.add(student_profile)

    # Activity log
    log = ActivityLog(user_id=user.id, action="user_registered_email", ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Account created successfully! Welcome to QuizHub.",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user with email and password."""
    remote_ip = request.remote_addr or "unknown"
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Validation Error", "message": "Email address and password are required."}), 400

    # Rate limiting: max 5 failed attempts per 5 minutes per IP or email
    if not _check_rate_limit(remote_ip) or not _check_rate_limit(email):
        return jsonify({
            "error": "Too Many Requests",
            "message": "Too many failed login attempts. Please wait 5 minutes before trying again."
        }), 429

    user = User.query.filter_by(email=email).first()

    if not user:
        _record_failed_attempt(remote_ip)
        _record_failed_attempt(email)
        return jsonify({"error": "Unauthorized", "message": "Invalid email address or password."}), 401

    if not user.password_hash:
        _record_failed_attempt(remote_ip)
        return jsonify({
            "error": "Unauthorized",
            "message": "This account was registered with Google Sign-In. Please click 'Continue with Google' or use Forgot Password to set a password."
        }), 401

    if not user.check_password(password):
        _record_failed_attempt(remote_ip)
        _record_failed_attempt(email)
        return jsonify({"error": "Unauthorized", "message": "Invalid email address or password."}), 401

    if not user.is_active:
        return jsonify({"error": "Forbidden", "message": "Account has been deactivated. Please contact support."}), 403

    # Successful login: clear failed attempts
    _clear_rate_limit(remote_ip)
    _clear_rate_limit(email)

    user.last_login = datetime.utcnow()
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    log = ActivityLog(user_id=user.id, action="user_logged_in_email", ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Successfully logged out"}), 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.is_active:
        return jsonify({"error": "Unauthorized", "message": "User not found or inactive"}), 401

    new_access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": new_access_token}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Request password reset link. Safe response preventing user enumeration."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not _is_valid_email(email):
        return jsonify({"error": "Validation Error", "message": "Please enter a valid email address."}), 400

    smtp_server = os.getenv("SMTP_SERVER") or os.getenv("MAIL_SERVER")
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME") or os.getenv("MAIL_USERNAME")
    smtp_configured = bool(smtp_server and smtp_user)

    user = User.query.filter_by(email=email).first()
    if user:
        s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="quizhub-password-reset")
        token = s.dumps({"user_id": user.id, "email": user.email})
        origin = request.headers.get("Origin") or "https://pesquiz.vercel.app"
        reset_url = f"{origin}/forgot-password?token={token}"

        if smtp_configured:
            _send_reset_email(user.email, reset_url)
        else:
            current_app.logger.info(f"[PASSWORD RESET] SMTP not configured. Token generated for {email}: {token}")

    if not smtp_configured:
        return jsonify({
            "message": "Password reset email delivery is currently disabled because SMTP is not configured on the server. Please sign in or contact the platform administrator.",
            "smtp_configured": False
        }), 200

    return jsonify({
        "message": "If an account exists for this email, password reset instructions have been sent.",
        "smtp_configured": True
    }), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Set new password using a secure, time-limited token."""
    data = request.get_json() or {}
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "")

    if not token or not new_password:
        return jsonify({"error": "Validation Error", "message": "Reset token and new password are required."}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Validation Error", "message": "Password must be at least 8 characters long."}), 400

    s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="quizhub-password-reset")
    try:
        payload = s.loads(token, max_age=3600)  # 1 hour expiration
        user_id = payload.get("user_id")
    except SignatureExpired:
        return jsonify({"error": "Unauthorized", "message": "The password reset token has expired. Please request a new one."}), 400
    except BadSignature:
        return jsonify({"error": "Unauthorized", "message": "Invalid or tampered password reset token."}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found."}), 404

    user.set_password(new_password)
    db.session.commit()

    log = ActivityLog(user_id=user.id, action="password_reset_completed", ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Password has been successfully updated. You may now log in with your new password."}), 200


