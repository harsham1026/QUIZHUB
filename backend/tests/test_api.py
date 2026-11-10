import unittest
import json
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from app.extensions import db
from app.models.user import User

class QuizHubApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")

    def test_login_student(self):
        res = self.client.post("/api/auth/login", json={
            "email": "student@quizhub.com",
            "password": "Student@123456"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "student")

    def test_login_teacher(self):
        res = self.client.post("/api/auth/login", json={
            "email": "teacher@quizhub.com",
            "password": "Teacher@123456"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "teacher")

    def test_quizzes_listing(self):
        res = self.client.get("/api/quizzes")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(len(data["quizzes"]), 1)

    def test_practice_mode(self):
        res = self.client.get("/api/quizzes/1/practice")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("quiz", data)
        self.assertGreater(len(data["quiz"]["questions"]), 0)

    def test_leaderboard(self):
        res = self.client.get("/api/leaderboard/global")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("leaderboard", data)
        self.assertGreaterEqual(len(data["leaderboard"]), 1)

    def test_create_session_with_teacher_jwt(self):
        login_res = self.client.post("/api/auth/login", json={
            "email": "teacher@quizhub.com",
            "password": "Teacher@123456"
        })
        token = login_res.get_json()["access_token"]

        session_res = self.client.post("/api/sessions/create", 
            headers={"Authorization": f"Bearer {token}"},
            json={"quiz_id": 1, "session_type": "live_multiplayer"}
        )
        self.assertEqual(session_res.status_code, 201)
        data = session_res.get_json()
        self.assertIn("pin", data)
        self.assertEqual(len(data["pin"]), 6)

        # Verify PIN
        pin = data["pin"]
        verify_res = self.client.get(f"/api/sessions/verify/{pin}")
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.get_json()["valid"])

if __name__ == "__main__":
    unittest.main()

