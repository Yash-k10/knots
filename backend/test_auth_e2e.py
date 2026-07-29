"""
End-to-End Auth Flow Test — Week 1 Saturday Task
=================================================
Tests the complete authentication lifecycle:
  1. Register a new user
  2. Login with credentials
  3. Access protected route (GET /users/me)
  4. Update email address (PATCH /users/{id})
  5. Change password (POST /users/me/change-password)
  6. Logout (POST /auth/logout)
  7. Verify old token is invalid (stateless, but test flow)
  8. Re-login with new password
  9. Re-login fails with old password
  10. Delete account (DELETE /users/{id})
  11. Deleted user cannot login

Prerequisites:
  - Backend running at http://localhost:8000
  - Database has been migrated and seeded (roles exist)
  - python-dotenv and httpx installed (pip install httpx)

Usage:
  cd backend
  python test_auth_e2e.py
"""

import time
import unittest

import httpx

BASE_URL = "http://localhost:8000/api/v1"

# Unique test user credentials (using timestamp to avoid collisions)
TEST_TIMESTAMP = str(int(time.time()))
TEST_EMAIL = f"e2e.test.{TEST_TIMESTAMP}@sbjit.edu.in"
TEST_PASSWORD = "TestPassword123!"
TEST_NEW_EMAIL = f"e2e.updated.{TEST_TIMESTAMP}@sbjit.edu.in"
TEST_NEW_PASSWORD = "NewSecurePass456!"
TEST_ROLE_ID = 2  # Student


class TestAuthFlowEndToEnd(unittest.TestCase):
    """Full end-to-end test of the authentication system."""

    # Shared state across ordered tests
    access_token: str = ""
    refresh_token: str = ""
    user_id: int = 0

    @classmethod
    def setUpClass(cls):
        """Verify the backend is reachable before running tests."""
        try:
            r = httpx.get("http://localhost:8000/", timeout=5)
            assert r.status_code == 200, "Backend health check failed"
        except httpx.ConnectError:
            raise unittest.SkipTest(
                "Backend not running at http://localhost:8000 — skipping E2E tests"
            )

    # --- 1. REGISTER ---
    def test_01_register_new_user(self):
        """Register a new user via POST /auth/register."""
        response = httpx.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "role_id": TEST_ROLE_ID,
            },
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertTrue(body.get("success", True))

        data = body.get("data", {})
        user = data.get("user", data)
        self.assertEqual(user["email"], TEST_EMAIL)
        self.__class__.user_id = user["id"]
        print(f"  ✅ Registered user {TEST_EMAIL} (ID: {self.__class__.user_id})")

    def test_02_register_duplicate_email_fails(self):
        """Attempting to register the same email should fail with 409."""
        response = httpx.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "role_id": TEST_ROLE_ID,
            },
            timeout=10,
        )
        self.assertEqual(response.status_code, 409)
        print("  ✅ Duplicate registration correctly rejected (409)")

    # --- 2. LOGIN ---
    def test_03_login(self):
        """Login with registered credentials via POST /auth/login."""
        response = httpx.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        data = body.get("data", {})
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.__class__.access_token = data["access_token"]
        self.__class__.refresh_token = data["refresh_token"]
        print("  ✅ Login successful — tokens received")

    def test_04_login_wrong_password_fails(self):
        """Login with wrong password should return 401."""
        response = httpx.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": "WrongPassword!"},
            timeout=10,
        )
        self.assertEqual(response.status_code, 401)
        print("  ✅ Login with wrong password correctly rejected (401)")

    # --- 3. ACCESS PROTECTED ROUTE ---
    def test_05_access_user_me(self):
        """Access GET /users/me with valid token."""
        response = httpx.get(
            f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {self.__class__.access_token}"},
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json().get("data", {})
        self.assertEqual(data["email"], TEST_EMAIL)
        self.assertEqual(data["id"], self.__class__.user_id)
        print(f"  ✅ Protected route /users/me returned user data (ID: {data['id']})")

    def test_06_access_protected_without_token_fails(self):
        """Accessing protected route without token should fail."""
        response = httpx.get(f"{BASE_URL}/users/me", timeout=10)
        self.assertIn(response.status_code, [401, 403, 422])
        print("  ✅ Protected route correctly rejected unauthenticated request")

    # --- 4. TOKEN REFRESH ---
    def test_07_refresh_token(self):
        """Refresh access token via POST /auth/refresh."""
        response = httpx.post(
            f"{BASE_URL}/auth/refresh",
            json={"refresh_token": self.__class__.refresh_token},
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json().get("data", {})
        self.assertIn("access_token", data)
        # Update token for subsequent tests
        self.__class__.access_token = data["access_token"]
        self.__class__.refresh_token = data["refresh_token"]
        print("  ✅ Token refresh successful — new tokens received")

    # --- 5. UPDATE EMAIL ---
    def test_08_update_email(self):
        """Update user email via PATCH /users/{id}."""
        response = httpx.patch(
            f"{BASE_URL}/users/{self.__class__.user_id}",
            headers={"Authorization": f"Bearer {self.__class__.access_token}"},
            json={"email": TEST_NEW_EMAIL},
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json().get("data", {})
        self.assertEqual(data["email"], TEST_NEW_EMAIL)
        print(f"  ✅ Email updated to {TEST_NEW_EMAIL}")

    # --- 6. CHANGE PASSWORD (SECURE ENDPOINT) ---
    def test_09_change_password_wrong_current_fails(self):
        """Changing password with wrong current password should fail."""
        response = httpx.post(
            f"{BASE_URL}/users/me/change-password",
            headers={"Authorization": f"Bearer {self.__class__.access_token}"},
            json={
                "current_password": "WrongOldPassword!",
                "new_password": TEST_NEW_PASSWORD,
            },
            timeout=10,
        )
        self.assertEqual(response.status_code, 401)
        print(
            "  ✅ Password change with wrong current password correctly rejected (401)"
        )

    def test_10_change_password_same_as_current_fails(self):
        """Changing password to the same value should fail."""
        response = httpx.post(
            f"{BASE_URL}/users/me/change-password",
            headers={"Authorization": f"Bearer {self.__class__.access_token}"},
            json={
                "current_password": TEST_PASSWORD,
                "new_password": TEST_PASSWORD,
            },
            timeout=10,
        )
        self.assertEqual(response.status_code, 422)
        print("  ✅ Password change to same value correctly rejected (422)")

    def test_11_change_password_success(self):
        """Change password with correct current password via POST /users/me/change-password."""
        response = httpx.post(
            f"{BASE_URL}/users/me/change-password",
            headers={"Authorization": f"Bearer {self.__class__.access_token}"},
            json={
                "current_password": TEST_PASSWORD,
                "new_password": TEST_NEW_PASSWORD,
            },
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        print("  ✅ Password changed successfully")

    # --- 7. LOGOUT ---
    def test_12_logout(self):
        """Logout via POST /auth/logout."""
        response = httpx.post(
            f"{BASE_URL}/auth/logout",
            headers={"Authorization": f"Bearer {self.__class__.access_token}"},
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        print("  ✅ Logout successful")

    # --- 8. RE-LOGIN WITH NEW PASSWORD ---
    def test_13_login_with_old_password_fails(self):
        """Login with old password after change should fail."""
        response = httpx.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_NEW_EMAIL, "password": TEST_PASSWORD},
            timeout=10,
        )
        self.assertEqual(response.status_code, 401)
        print("  ✅ Login with old password correctly rejected (401)")

    def test_14_login_with_new_password(self):
        """Login with new password on updated email."""
        response = httpx.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_NEW_EMAIL, "password": TEST_NEW_PASSWORD},
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json().get("data", {})
        self.assertIn("access_token", data)
        self.__class__.access_token = data["access_token"]
        print("  ✅ Login with new password and updated email successful")

    # --- 9. DELETE ACCOUNT ---
    def test_15_delete_account(self):
        """Delete the test user's account via DELETE /users/{id}."""
        response = httpx.delete(
            f"{BASE_URL}/users/{self.__class__.user_id}",
            headers={"Authorization": f"Bearer {self.__class__.access_token}"},
            timeout=10,
        )
        self.assertEqual(response.status_code, 200, response.text)
        print(f"  ✅ Account {self.__class__.user_id} deleted successfully")

    def test_16_deleted_user_cannot_login(self):
        """Deleted user should not be able to login."""
        response = httpx.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_NEW_EMAIL, "password": TEST_NEW_PASSWORD},
            timeout=10,
        )
        self.assertIn(response.status_code, [401, 404])
        print("  ✅ Deleted user correctly cannot login")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  KNOTS — End-to-End Auth Flow Test")
    print("=" * 60 + "\n")
    unittest.main(verbosity=2, failfast=True)
