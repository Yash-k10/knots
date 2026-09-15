import json
import logging
import smtplib
import ssl
import urllib.error
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_resend(
    recipient: str,
    subject: str,
    plain_text: str,
    html_content: str,
) -> bool:
    """Dispatch email via Resend HTTPS REST API (Port 443 - Render compatible)."""
    api_key = settings.RESEND_API_KEY.strip()
    sender = (
        settings.RESEND_FROM_EMAIL.strip()
        if settings.RESEND_FROM_EMAIL
        else f"{settings.EMAILS_FROM_NAME} <onboarding@resend.dev>"
    )

    payload = {
        "from": sender,
        "to": [recipient],
        "subject": subject,
        "html": html_content,
        "text": plain_text,
    }

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "KNOTS-Campus-Hub/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        if resp.status in (200, 201, 202):
            logger.info(
                f"[SUCCESS] OTP email dispatched to {recipient} via Resend HTTP API (HTTPS 443)"
            )
            return True
        else:
            resp_body = resp.read().decode("utf-8", errors="replace")
            logger.error(
                f"[ERROR] Resend API responded with status {resp.status}: {resp_body}"
            )
            raise RuntimeError(f"Resend HTTP API failed with status {resp.status}")


def _send_via_brevo(
    recipient: str,
    subject: str,
    plain_text: str,
    html_content: str,
) -> bool:
    """Dispatch email via Brevo / Sendinblue HTTPS REST API (Port 443 - Render compatible)."""
    api_key = settings.BREVO_API_KEY.strip()
    sender_email = settings.EMAILS_FROM_EMAIL or "contact@sbjit.edu.in"
    sender_name = settings.EMAILS_FROM_NAME or "KNOTS Campus Hub"

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": recipient}],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": plain_text,
    }

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
            "User-Agent": "KNOTS-Campus-Hub/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        if resp.status in (200, 201, 202):
            logger.info(
                f"[SUCCESS] OTP email dispatched to {recipient} via Brevo HTTP API (HTTPS 443)"
            )
            return True
        else:
            resp_body = resp.read().decode("utf-8", errors="replace")
            logger.error(
                f"[ERROR] Brevo API responded with status {resp.status}: {resp_body}"
            )
            raise RuntimeError(f"Brevo HTTP API failed with status {resp.status}")


def _send_via_sendgrid(
    recipient: str,
    subject: str,
    plain_text: str,
    html_content: str,
) -> bool:
    """Dispatch email via SendGrid HTTPS REST API (Port 443 - Render compatible)."""
    api_key = settings.SENDGRID_API_KEY.strip()
    sender_email = settings.EMAILS_FROM_EMAIL or "contact@sbjit.edu.in"
    sender_name = settings.EMAILS_FROM_NAME or "KNOTS Campus Hub"

    payload = {
        "personalizations": [{"to": [{"email": recipient}]}],
        "from": {"email": sender_email, "name": sender_name},
        "subject": subject,
        "content": [
            {"type": "text/plain", "value": plain_text},
            {"type": "text/html", "value": html_content},
        ],
    }

    req = urllib.request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "KNOTS-Campus-Hub/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        if resp.status in (200, 201, 202):
            logger.info(
                f"[SUCCESS] OTP email dispatched to {recipient} via SendGrid HTTP API (HTTPS 443)"
            )
            return True
        else:
            resp_body = resp.read().decode("utf-8", errors="replace")
            logger.error(
                f"[ERROR] SendGrid API responded with status {resp.status}: {resp_body}"
            )
            raise RuntimeError(f"SendGrid HTTP API failed with status {resp.status}")


def _send_via_smtp(
    recipient: str,
    subject: str,
    plain_text: str,
    html_content: str,
) -> bool:
    """Dispatch email via standard SMTP (Fallback for environments where SMTP ports are open)."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"No email provider or SMTP credentials configured. Email dispatch skipped for {recipient}."
        )
        return True

    smtp_user = settings.SMTP_USER.strip()
    smtp_password = settings.SMTP_PASSWORD.replace(" ", "").strip()
    sender_email = (
        settings.EMAILS_FROM_EMAIL.strip() if settings.EMAILS_FROM_EMAIL else smtp_user
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{sender_email}>"
    msg["To"] = recipient
    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    sent = False
    last_error = None

    configured_port = int(settings.SMTP_PORT or 587)
    ports_to_try = [configured_port]
    if configured_port == 587:
        ports_to_try.append(465)
    elif configured_port == 465:
        ports_to_try.append(587)
    else:
        ports_to_try.extend([587, 465])

    for port in ports_to_try:
        if sent:
            break
        try:
            if port == 465:
                ssl_context = ssl.create_default_context()
                with smtplib.SMTP_SSL(
                    settings.SMTP_HOST, 465, timeout=10, context=ssl_context
                ) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(sender_email, [recipient], msg.as_string())
                sent = True
                logger.info(
                    f"[SUCCESS] OTP email dispatched to {recipient} via Port 465 (SSL)"
                )
            else:
                with smtplib.SMTP(settings.SMTP_HOST, port, timeout=10) as server:
                    server.ehlo()
                    ssl_context = ssl.create_default_context()
                    server.starttls(context=ssl_context)
                    server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(sender_email, [recipient], msg.as_string())
                sent = True
                logger.info(
                    f"[SUCCESS] OTP email dispatched to {recipient} via Port {port} (STARTTLS)"
                )
        except smtplib.SMTPAuthenticationError as auth_err:
            last_error = auth_err
            logger.error(
                f"[AUTH ERROR] SMTP authentication failed on Port {port}: {auth_err}."
            )
        except Exception as e_port:
            last_error = e_port
            logger.warning(f"SMTP delivery attempt on Port {port} failed: {e_port}")

    if not sent:
        raise RuntimeError(f"All SMTP delivery channels failed: {last_error}")

    return True


def send_otp_email(
    recipient_email: str,
    otp_code: str,
    purpose: str = "Verification",
) -> bool:
    """Send an HTML OTP verification email to the user's institutional inbox.

    Supports modern HTTP Email APIs (Resend, Brevo, SendGrid) to bypass cloud/Render SMTP port blocks,
    with automatic fallback to SMTP.
    """
    normalized_recipient = recipient_email.strip().lower()

    # Log dispatch event without exposing plaintext OTP
    logger.info(
        f"[AUTH OTP DISPATCH] Initiating OTP delivery for {normalized_recipient} (Purpose: {purpose})"
    )

    subject = "KNOTS College Email Verification Code"

    plain_text_body = (
        f"Hello,\n\n"
        f"Your KNOTS verification code is:\n\n"
        f"{otp_code}\n\n"
        f"This code will expire in 5 minutes.\n\n"
        f"If you did not request this code, please ignore this email.\n\n"
        f"Regards,\n"
        f"KNOTS Team\n"
        f"S. B. Jain Institute of Technology, Management & Research, Nagpur"
    )

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
              <p style="margin: 6px 0 0; font-size: 13px; color: #5851A4; font-weight: 600;">S. B. Jain Institute of Technology, Management & Research, Nagpur</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px;">
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1e2746;">
                Hello,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #4b5563;">
                Your KNOTS verification code for <strong>{purpose.lower()}</strong> is:
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
                This code will expire in <strong>5 minutes</strong> and can only be used once.
              </p>

              <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin: 24px 0 0;">
                <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 1.5;">
                  <strong>Security Notice:</strong> If you did not request this verification code, please ignore this email. Never share this code with anyone.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 30px; background-color: #FAF9FD; border-top: 1px solid #eae4f7; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                S. B. Jain Institute of Technology, Management & Research, Nagpur
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #c4b5fd;">
                KNOTS &bull; Campus Community, Placement & Innovation Network
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    try:
        # Priority 1: Resend HTTP API (Recommended for modern cloud apps & Render)
        if settings.RESEND_API_KEY:
            try:
                return _send_via_resend(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as resend_err:
                logger.warning(
                    f"Resend HTTP delivery failed: {resend_err}. Attempting fallback..."
                )

        # Priority 2: Brevo HTTP API
        if settings.BREVO_API_KEY:
            try:
                return _send_via_brevo(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as brevo_err:
                logger.warning(
                    f"Brevo HTTP delivery failed: {brevo_err}. Attempting fallback..."
                )

        # Priority 3: SendGrid HTTP API
        if settings.SENDGRID_API_KEY:
            try:
                return _send_via_sendgrid(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as sg_err:
                logger.warning(
                    f"SendGrid HTTP delivery failed: {sg_err}. Attempting fallback..."
                )

        # Priority 4: SMTP Fallback
        return _send_via_smtp(normalized_recipient, subject, plain_text_body, html_body)

    except Exception as e:
        logger.error(
            f"[ERROR] Failed to dispatch OTP email to {normalized_recipient}: {e}"
        )
        raise RuntimeError(f"Unable to send verification email: {e}")
