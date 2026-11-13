import unittest
from unittest.mock import patch, MagicMock
from itsdangerous import URLSafeTimedSerializer
from app import create_app, db
from app.models.user import User, StudentProfile
from app.models.quiz import Quiz

class GoogleAndEmailAuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_auth_config(self):
        res = self.client.get("/api/auth/config")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("google_client_id", data)
        self.assertIn("google_configured", data)
        self.assertIn("smtp_configured", data)

    # 1. Register with Gmail address
    def test_register_gmail_address(self):
        res = self.client.post("/api/auth/register", json={
            "full_name": "Google User",
            "email": "player.one@gmail.com",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        user = data.get("user")
        self.assertEqual(user.get("email"), "player.one@gmail.com")
        self.assertEqual(user.get("full_name"), "Google User")
        self.assertEqual(user.get("role"), "user")
        self.assertEqual(user.get("auth_provider"), "email")
        self.assertIsNotNone(user.get("profile_picture"))

    # 2. Register with Outlook address
    def test_register_outlook_address(self):
        res = self.client.post("/api/auth/register", json={
            "full_name": "Outlook User",
            "email": "gamer.two@outlook.com",
            "password": "OutlookSecret888",
            "confirm_password": "OutlookSecret888"
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.get_json().get("user").get("email"), "gamer.two@outlook.com")

    # 3. Register with Yahoo & other domains
    def test_register_yahoo_and_custom_domain(self):
        res = self.client.post("/api/auth/register", json={
            "full_name": "Yahoo User",
            "email": "champion@yahoo.com",
            "password": "YahooPassword2026",
            "confirm_password": "YahooPassword2026"
        })
        self.assertEqual(res.status_code, 201)

        res2 = self.client.post("/api/auth/register", json={
            "full_name": "Custom Domain User",
            "email": "coder@pes.edu",
            "password": "AcademicSecure999",
            "confirm_password": "AcademicSecure999"
        })
        self.assertEqual(res2.status_code, 201)

    # 4. Reject invalid email format
    def test_register_invalid_email_format(self):
        res = self.client.post("/api/auth/register", json={
            "full_name": "Bad Email",
            "email": "not-an-email",
            "password": "ValidPassword123",
            "confirm_password": "ValidPassword123"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("valid email address", res.get_json().get("message").lower())

    # 5. Reject short passwords (< 8 characters)
    def test_register_reject_short_password(self):
        res = self.client.post("/api/auth/register", json={
            "full_name": "Short Pass",
            "email": "short@example.com",
            "password": "1234567",
            "confirm_password": "1234567"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 8 characters", res.get_json().get("message").lower())

    # 6. Reject password confirmation mismatch
    def test_register_password_mismatch(self):
        res = self.client.post("/api/auth/register", json={
            "full_name": "Mismatch User",
            "email": "mismatch@example.com",
            "password": "Password123!",
            "confirm_password": "Password999!"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("passwords do not match", res.get_json().get("message").lower())

    # 7. Prevent duplicate email registration
    def test_register_duplicate_email(self):
        payload = {
            "full_name": "First Register",
            "email": "duplicate@quizhub.com",
            "password": "SecurePassword1",
            "confirm_password": "SecurePassword1"
        }
        res1 = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res1.status_code, 201)

        res2 = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res2.status_code, 409)
        self.assertIn("already exists", res2.get_json().get("message").lower())

    # 8. Email & Password Login with correct and incorrect credentials
    def test_login_email_password(self):
        # Register user
        self.client.post("/api/auth/register", json={
            "full_name": "Login Tester",
            "email": "logintester@quizhub.com",
            "password": "MySuperSecretPassword",
            "confirm_password": "MySuperSecretPassword"
        })

        # Correct login
        res = self.client.post("/api/auth/login", json={
            "email": "logintester@quizhub.com",
            "password": "MySuperSecretPassword"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data.get("user").get("email"), "logintester@quizhub.com")

        # Incorrect password
        bad_res = self.client.post("/api/auth/login", json={
            "email": "logintester@quizhub.com",
            "password": "WrongPassword123"
        })
        self.assertEqual(bad_res.status_code, 401)
        self.assertIn("invalid", bad_res.get_json().get("message").lower())

    # 9. Password reset flow with time-limited token
    def test_password_reset_flow(self):
        # Register user
        self.client.post("/api/auth/register", json={
            "full_name": "Reset Tester",
            "email": "reset@quizhub.com",
            "password": "OldPassword1234",
            "confirm_password": "OldPassword1234"
        })

        # Forgot password request
        forgot_res = self.client.post("/api/auth/forgot-password", json={"email": "reset@quizhub.com"})
        self.assertEqual(forgot_res.status_code, 200)

        # Generate a valid timed token using the app's secret key
        s = URLSafeTimedSerializer(self.app.config["SECRET_KEY"], salt="quizhub-password-reset")
        user = User.query.filter_by(email="reset@quizhub.com").first()
        valid_token = s.dumps({"user_id": user.id, "email": user.email})

        # Perform password reset
        reset_res = self.client.post("/api/auth/reset-password", json={
            "token": valid_token,
            "new_password": "NewBrandNewPassword2026"
        })
        self.assertEqual(reset_res.status_code, 200)

        # Verify old password fails and new password succeeds
        fail_login = self.client.post("/api/auth/login", json={"email": "reset@quizhub.com", "password": "OldPassword1234"})
        self.assertEqual(fail_login.status_code, 401)

        success_login = self.client.post("/api/auth/login", json={"email": "reset@quizhub.com", "password": "NewBrandNewPassword2026"})
        self.assertEqual(success_login.status_code, 200)

    # 10. Google Auth remains fully functional
    @patch("requests.get")
    def test_google_auth_integration(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "sub": "google-uid-12345",
            "email": "gamer@quizhub.com",
            "name": "Nova Quizzer",
            "picture": "https://lh3.googleusercontent.com/photo.jpg",
            "email_verified": True,
        }
        mock_get.return_value = mock_resp

        res = self.client.post("/api/auth/google", json={"access_token": "mock-token-xyz"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("is_new_user"))
        self.assertEqual(data.get("user").get("google_id"), "google-uid-12345")
        self.assertEqual(data.get("user").get("auth_provider"), "google")

if __name__ == "__main__":
    unittest.main()
