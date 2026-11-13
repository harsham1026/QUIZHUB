import unittest
from unittest.mock import patch, MagicMock
from app import create_app, db
from app.models.user import User, StudentProfile
from app.models.quiz import Quiz

class GoogleAuthTestCase(unittest.TestCase):
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

    def test_google_auth_validation_missing_tokens(self):
        res = self.client.post("/api/auth/google", json={})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Validation Error", res.get_json().get("error"))

    @patch("requests.get")
    def test_google_auth_new_user_via_access_token(self, mock_get):
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
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)

        user_data = data.get("user")
        self.assertEqual(user_data.get("email"), "gamer@quizhub.com")
        self.assertEqual(user_data.get("full_name"), "Nova Quizzer")
        self.assertEqual(user_data.get("google_id"), "google-uid-12345")
        self.assertEqual(user_data.get("avatar_url"), "https://lh3.googleusercontent.com/photo.jpg")
        self.assertEqual(user_data.get("role"), "user")
        self.assertIsNotNone(user_data.get("created_at"))
        self.assertIsNotNone(user_data.get("last_login"))
        self.assertIsNotNone(user_data.get("profile"))

        # Verify DB persistence
        db_user = User.query.filter_by(google_id="google-uid-12345").first()
        self.assertIsNotNone(db_user)
        self.assertIsNotNone(db_user.student_profile)

    @patch("requests.get")
    def test_google_auth_returning_user(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "sub": "google-returning-999",
            "email": "returning@quizhub.com",
            "name": "Returning Champion",
            "picture": "https://lh3.googleusercontent.com/p2.jpg",
            "email_verified": True,
        }
        mock_get.return_value = mock_resp

        # First sign-in (Registration)
        r1 = self.client.post("/api/auth/google", json={"access_token": "tok1"})
        self.assertEqual(r1.status_code, 200)
        self.assertTrue(r1.get_json().get("is_new_user"))

        # Second sign-in (Login)
        r2 = self.client.post("/api/auth/google", json={"access_token": "tok2"})
        self.assertEqual(r2.status_code, 200)
        self.assertFalse(r2.get_json().get("is_new_user"))
        self.assertEqual(r2.get_json().get("user").get("google_id"), "google-returning-999")

    @patch("requests.get")
    def test_google_auth_links_existing_email_account(self, mock_get):
        # Create an account first via standard email
        existing = User(
            email="legacy@quizhub.com",
            full_name="Legacy Player",
            role="user"
        )
        existing.set_password("OldPassword@123")
        db.session.add(existing)
        db.session.commit()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "sub": "google-linked-777",
            "email": "legacy@quizhub.com",
            "name": "Legacy Player",
            "picture": "https://lh3.googleusercontent.com/avatar.png",
            "email_verified": True,
        }
        mock_get.return_value = mock_resp

        res = self.client.post("/api/auth/google", json={"access_token": "link-tok"})
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.get_json().get("is_new_user"))

        # Verify Google ID linked
        db_user = User.query.filter_by(email="legacy@quizhub.com").first()
        self.assertEqual(db_user.google_id, "google-linked-777")
        self.assertEqual(db_user.avatar_url, "https://lh3.googleusercontent.com/avatar.png")

    @patch("requests.get")
    def test_common_user_can_create_quiz_and_host(self, mock_get):
        # Sign in via Google
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "sub": "google-host-555",
            "email": "host@quizhub.com",
            "name": "Host User",
            "picture": "https://lh3.googleusercontent.com/host.png",
            "email_verified": True,
        }
        mock_get.return_value = mock_resp

        auth_res = self.client.post("/api/auth/google", json={"access_token": "host-tok"})
        token = auth_res.get_json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        # Verify /api/auth/me
        me_res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json().get("user").get("role"), "user")

        # Create quiz as common user
        quiz_res = self.client.post("/api/quizzes", json={
            "title": "Community Cyber Quiz",
            "description": "Created by common user",
            "category": "Technology",
            "difficulty": "medium",
            "time_limit_per_question": 20,
            "questions": [{
                "question_text": "What does CPU stand for?",
                "question_type": "multiple_choice",
                "time_limit": 20,
                "points": 1000,
                "options": [
                    {"option_text": "Central Processing Unit", "is_correct": True},
                    {"option_text": "Computer Power Unit", "is_correct": False}
                ]
            }]
        }, headers=headers)
        self.assertEqual(quiz_res.status_code, 201)
        quiz_id = quiz_res.get_json().get("quiz").get("id")

        # Create live multiplayer session as common user
        sess_res = self.client.post("/api/sessions/create", json={"quiz_id": quiz_id}, headers=headers)
        self.assertEqual(sess_res.status_code, 201)
        self.assertIsNotNone(sess_res.get_json().get("pin"))

        # Logout
        logout_res = self.client.post("/api/auth/logout", headers=headers)
        self.assertEqual(logout_res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
