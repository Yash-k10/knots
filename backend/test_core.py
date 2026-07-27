import unittest
from datetime import timedelta

from app.core import (
    AuthenticationError,
    create_access_token,
    create_refresh_token,
    create_verification_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestCoreSecurity(unittest.TestCase):
    def test_password_hashing(self):
        password = "secure_password_123"
        hashed = hash_password(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrong_password", hashed))

    def test_access_token_creation_and_decoding(self):
        subject = "test_user_id"
        token = create_access_token(subject=subject, expires_delta=timedelta(minutes=5))
        payload = decode_token(token, expected_type="access")
        self.assertEqual(payload["sub"], subject)
        self.assertEqual(payload["type"], "access")

    def test_refresh_token_creation_and_decoding(self):
        subject = "test_user_id"
        token = create_refresh_token(subject=subject, expires_delta=timedelta(days=1))
        payload = decode_token(token, expected_type="refresh")
        self.assertEqual(payload["sub"], subject)
        self.assertEqual(payload["type"], "refresh")

    def test_verification_token_creation_and_decoding(self):
        subject = "test_user_id"
        token = create_verification_token(
            subject=subject, expires_delta=timedelta(hours=1)
        )
        payload = decode_token(token, expected_type="verification")
        self.assertEqual(payload["sub"], subject)
        self.assertEqual(payload["type"], "verification")

    def test_invalid_token_type(self):
        subject = "test_user_id"
        token = create_access_token(subject=subject)
        with self.assertRaises(AuthenticationError) as context:
            decode_token(token, expected_type="refresh")
        self.assertIn("Invalid token type", str(context.exception))

    def test_invalid_token_signature(self):
        invalid_token = "invalid.token.signature"
        with self.assertRaises(AuthenticationError):
            decode_token(invalid_token)


if __name__ == "__main__":
    unittest.main()
