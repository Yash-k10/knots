import time
import unittest
from unittest.mock import MagicMock, patch

from app.auth.schemas.auth import SendOTPRequest
from app.auth.services.auth import (
    OTP_STORE,
    check_and_consume_otp,
    hash_otp,
    save_otp,
)
from app.core.email import send_otp_email
from app.core.exceptions import AuthenticationError, ValidationError


class TestAuthOTPFlow(unittest.TestCase):
    def setUp(self):
        OTP_STORE.clear()
        # Mock Redis client so CI tests run isolated and fast without network calls
        self.redis_patcher = patch(
            "app.auth.services.auth.get_redis_client", return_value=None
        )
        self.redis_patcher.start()

    def tearDown(self):
        self.redis_patcher.stop()
        OTP_STORE.clear()

    def test_otp_hashing(self):
        email = "student@sbjit.edu.in"
        otp = "123456"
        h1 = hash_otp(email, otp)
        h2 = hash_otp(email, otp)
        self.assertEqual(h1, h2)
        self.assertNotEqual(h1, otp)

    def test_save_and_verify_success(self):
        email = "student@sbjit.edu.in"
        otp = "543210"

        save_otp(email, otp, "login", expires_in=300)

        # First verification succeeds
        result = check_and_consume_otp(email, otp)
        self.assertTrue(result)

        # Single-use: Second verification fails
        with self.assertRaises(AuthenticationError):
            check_and_consume_otp(email, otp)

    def test_wrong_otp_attempts(self):
        email = "student@sbjit.edu.in"
        otp = "889900"

        save_otp(email, otp, "login", expires_in=300)

        # 4 wrong attempts
        for attempt in range(1, 5):
            with self.assertRaises(AuthenticationError) as ctx:
                check_and_consume_otp(email, "000000")
            self.assertIn("attempt(s) remaining", str(ctx.exception))

        # 5th wrong attempt invalidates the OTP
        with self.assertRaises(AuthenticationError) as ctx:
            check_and_consume_otp(email, "000000")
        self.assertIn("Too many failed attempts", str(ctx.exception))

    def test_expired_otp(self):
        email = "student@sbjit.edu.in"
        otp = "112233"

        # Save with 0 second expiry
        save_otp(email, otp, "login", expires_in=0)
        time.sleep(0.05)

        with self.assertRaises(AuthenticationError) as ctx:
            check_and_consume_otp(email, otp)
        self.assertIn("expired", str(ctx.exception).lower())

    def test_resend_cooldown(self):
        email = "student@sbjit.edu.in"
        save_otp(email, "111111", "login", expires_in=300)

        # Immediate resend within 30s should raise ValidationError
        with self.assertRaises(ValidationError) as ctx:
            save_otp(email, "222222", "login", expires_in=300)
        self.assertIn("Please wait", str(ctx.exception))

    def test_email_domain_validation_in_schema(self):
        valid_req = SendOTPRequest(email="test@sbjit.edu.in", purpose="login")
        self.assertEqual(valid_req.email, "test@sbjit.edu.in")

        with self.assertRaises(Exception):
            SendOTPRequest(email="hacker@gmail.com", purpose="login")

    @patch("smtplib.SMTP")
    @patch("smtplib.SMTP_SSL")
    def test_mock_smtp_email_dispatch(self, mock_ssl, mock_smtp):
        from app.core.config import settings

        old_resend = settings.RESEND_API_KEY
        old_brevo = settings.BREVO_API_KEY
        old_sg = settings.SENDGRID_API_KEY
        try:
            settings.RESEND_API_KEY = None
            settings.BREVO_API_KEY = None
            settings.SENDGRID_API_KEY = None
            instance = MagicMock()
            mock_ssl.return_value.__enter__.return_value = instance
            mock_smtp.return_value.__enter__.return_value = instance

            res = send_otp_email("student@sbjit.edu.in", "654321", "login")
            self.assertTrue(res)
        finally:
            settings.RESEND_API_KEY = old_resend
            settings.BREVO_API_KEY = old_brevo
            settings.SENDGRID_API_KEY = old_sg

    @patch("urllib.request.urlopen")
    def test_resend_api_email_dispatch(self, mock_urlopen):
        from app.core.config import settings

        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        old_resend = settings.RESEND_API_KEY
        try:
            settings.RESEND_API_KEY = "re_test_dummy_key"
            res = send_otp_email("student@sbjit.edu.in", "123456", "login")
            self.assertTrue(res)
            self.assertTrue(mock_urlopen.called)
        finally:
            settings.RESEND_API_KEY = old_resend

    @patch("urllib.request.urlopen")
    def test_brevo_api_email_dispatch(self, mock_urlopen):
        from app.core.config import settings

        mock_resp = MagicMock()
        mock_resp.status = 201
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        old_brevo = settings.BREVO_API_KEY
        old_resend = settings.RESEND_API_KEY
        try:
            settings.RESEND_API_KEY = None
            settings.BREVO_API_KEY = "xkeysib_test_dummy_key"
            res = send_otp_email("student@sbjit.edu.in", "123456", "login")
            self.assertTrue(res)
            self.assertTrue(mock_urlopen.called)
        finally:
            settings.RESEND_API_KEY = old_resend
            settings.BREVO_API_KEY = old_brevo

    @patch("urllib.request.urlopen")
    def test_sendgrid_api_email_dispatch(self, mock_urlopen):
        from app.core.config import settings

        mock_resp = MagicMock()
        mock_resp.status = 202
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        old_sg = settings.SENDGRID_API_KEY
        old_resend = settings.RESEND_API_KEY
        old_brevo = settings.BREVO_API_KEY
        try:
            settings.RESEND_API_KEY = None
            settings.BREVO_API_KEY = None
            settings.SENDGRID_API_KEY = "SG.dummy_test_key"
            res = send_otp_email("student@sbjit.edu.in", "123456", "login")
            self.assertTrue(res)
            self.assertTrue(mock_urlopen.called)
        finally:
            settings.RESEND_API_KEY = old_resend
            settings.BREVO_API_KEY = old_brevo
            settings.SENDGRID_API_KEY = old_sg


if __name__ == "__main__":
    unittest.main()
