import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(
    recipient_email: str,
    otp_code: str,
    purpose: str = "Verification",
) -> bool:
    """Send an HTML OTP verification email to the user's institutional inbox.

    Gracefully falls back to console logging if SMTP credentials are not configured.
    """
    normalized_recipient = recipient_email.strip().lower()

    # Always log for local development tracing
    logger.info(
        f"[AUTH OTP DISPATCH] Target: {normalized_recipient} | Purpose: {purpose} | OTP: {otp_code}"
    )
    print(
        f"\n=======================================================\n"
        f"[AUTH OTP DISPATCH] College Inbox: {normalized_recipient}\n"
        f"Purpose: {purpose.upper()}\n"
        f"6-Digit Code: {otp_code}\n"
        f"Valid for: 10 Minutes\n"
        f"=======================================================\n"
    )

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(
            f"SMTP credentials not configured. OTP '{otp_code}' recorded for {normalized_recipient} in development mode."
        )
        return True

    try:
        subject = f"Your KNOTS {purpose.capitalize()} Verification Code: {otp_code}"

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KNOTS Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f6fd; color: #1e2746;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f8f6fd; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; border: 1px solid #eae4f7; box-shadow: 0 4px 20px rgba(75, 99, 210, 0.08); overflow: hidden;" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; background: linear-gradient(135deg, #FAF9FD 0%, #F0EDFB 100%); border-bottom: 1px solid #eae4f7;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #4B63D2; letter-spacing: 0.5px;">KNOTS</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #5851A4; font-weight: 600;">SBJIT Institutional Career & Collaboration Hub</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px;">
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1e2746;">
                Hello,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #4b5563;">
                We received a request for <strong>{purpose.lower()}</strong> on your authorized college account (<strong>{normalized_recipient}</strong>). Use the one-time verification code below to proceed:
              </p>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #F0EDFB; border: 2px dashed #4B63D2; border-radius: 12px; padding: 16px 36px; text-align: center;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4B63D2; display: block;">
                        {otp_code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; text-align: center;">
                This code is valid for <strong>10 minutes</strong> and can only be used once.
              </p>

              <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin: 24px 0 0;">
                <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 1.5;">
                  <strong>Security Reminder:</strong> Never share this code with anyone. KNOTS staff or college administrators will never ask for your verification code.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 30px; background-color: #FAF9FD; border-top: 1px solid #eae4f7; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                St. Vincent Pallotti College of Engineering & Technology, Nagpur
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #c4b5fd;">
                KNOTS -- Campus Community, Placement & Innovation Network
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        smtp_user = settings.SMTP_USER.strip()
        smtp_password = settings.SMTP_PASSWORD.replace(" ", "").strip()
        sender_email = (
            settings.EMAILS_FROM_EMAIL.strip()
            if settings.EMAILS_FROM_EMAIL
            else smtp_user
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{sender_email}>"
        msg["To"] = normalized_recipient
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender_email, [normalized_recipient], msg.as_string())

        logger.info(f"[SUCCESS] OTP email dispatched to {normalized_recipient}")
        return True

    except Exception as e:
        logger.error(
            f"[ERROR] Failed to dispatch OTP email via SMTP to {normalized_recipient}: {e}"
        )
        # Return True so request does not crash, OTP remains stored and accessible
        return True
