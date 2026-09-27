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


def _send_via_webhook(
    recipient: str,
    subject: str,
    plain_text: str,
    html_content: str,
) -> bool:
    """Dispatch email via Google Apps Script Webhook or custom HTTPS Webhook (Port 443 - 100% Free)."""
    webhook_url = settings.EMAIL_WEBHOOK_URL.strip()
    payload = {
        "to": recipient,
        "subject": subject,
        "text": plain_text,
        "html": html_content,
        "sender_name": settings.EMAILS_FROM_NAME or "KNOTS Campus Hub",
    }

    req = urllib.request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        if resp.status in (200, 201, 202, 302):
            logger.info(
                f"[SUCCESS] OTP email dispatched to {recipient} via Email Webhook (HTTPS 443)"
            )
            return True
        else:
            resp_body = resp.read().decode("utf-8", errors="replace")
            logger.error(
                f"[ERROR] Email Webhook responded with status {resp.status}: {resp_body}"
            )
            raise RuntimeError(f"Email Webhook failed with status {resp.status}")


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

    configured_port = int(settings.SMTP_PORT or 465)
    # On Render and cloud hosts, Port 465 (SSL) is standard and bypasses STARTTLS blocks
    if configured_port == 465:
        ports_to_try = [465, 587]
    elif configured_port == 587:
        ports_to_try = [465, 587]
    else:
        ports_to_try = [configured_port, 465, 587]

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

    # Log dispatch event and display OTP in logs for development verification
    logger.info(
        f"[AUTH OTP DISPATCH] Initiating OTP delivery for {normalized_recipient} (Purpose: {purpose}) | Code: {otp_code}"
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
        # Priority 1: Webhook HTTP API (100% Free Google Apps Script / Custom Webhook over HTTPS 443)
        if settings.EMAIL_WEBHOOK_URL:
            try:
                return _send_via_webhook(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as webhook_err:
                logger.warning(
                    f"Email Webhook delivery failed: {webhook_err}. Attempting fallback..."
                )

        # Priority 2: Resend HTTP API (Recommended for modern cloud apps & Render)
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


def send_application_alert_email(
    poster_email: str,
    poster_name: str,
    applicant_name: str,
    applicant_email: str,
    job_title: str,
    company_name: str,
    resume_url: str | None = None,
    cover_note: str | None = None,
) -> bool:
    """Send an automated email notification to the job/referral poster when an applicant applies."""
    normalized_recipient = poster_email.strip().lower()
    subject = (
        f"New Application: {applicant_name} applied for {job_title} at {company_name}"
    )

    plain_text_body = (
        f"Hello {poster_name},\n\n"
        f"{applicant_name} ({applicant_email}) has just applied for your opportunity: '{job_title}' at {company_name}.\n\n"
        f"Cover Note: {cover_note or 'No cover note provided'}\n"
        f"Resume Link: {resume_url or 'Attached in KNOTS profile'}\n\n"
        f"You can review this application and connect with the candidate directly on KNOTS.\n\n"
        f"Best regards,\n"
        f"KNOTS Placement Hub"
    )

    resume_html = (
        f'<div style="font-size: 12px; color: #5851A4; margin-top: 6px;">Resume / Portfolio: <a href="{resume_url}" style="color: #4B63D2; font-weight: bold;">View Resume</a></div>'
        if resume_url
        else ""
    )
    cover_html = (
        f'<div style="font-size: 12px; color: #5851A4; margin-top: 8px; font-style: italic;">"{cover_note}"</div>'
        if cover_note
        else ""
    )

    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>{subject}</title></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAF9FD; margin: 0; padding: 30px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #EAE4F7; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(75, 99, 210, 0.08);">
    <div style="background: linear-gradient(135deg, #1E2746 0%, #2A3558 100%); padding: 24px; color: #ffffff;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 800;">KNOTS Career Network</h2>
      <p style="margin: 4px 0 0 0; color: #FFD21A; font-size: 13px; font-weight: 600;">New Candidate Application Received</p>
    </div>
    <div style="padding: 28px; color: #1E2746;">
      <p style="font-size: 15px; line-height: 1.6;">Hello <strong>{poster_name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #5851A4;">
        A candidate has submitted an application for your posted opportunity:
      </p>
      <div style="background: #FAF9FD; border: 1px solid #D5CBEE; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <div style="font-size: 15px; font-weight: 800; color: #1E2746;">{job_title}</div>
        <div style="font-size: 13px; font-weight: 600; color: #4B63D2; margin-top: 2px;">{company_name}</div>
        <hr style="border: 0; border-top: 1px solid #EAE4F7; margin: 12px 0;">
        <div style="font-size: 12px; color: #5851A4;">Candidate: <strong>{applicant_name}</strong> ({applicant_email})</div>
        {resume_html}
        {cover_html}
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #5851A4;">
        Log into the KNOTS platform to review candidate qualifications, message the applicant, or update application status.
      </p>
    </div>
    <div style="background: #FAF9FD; border-top: 1px solid #EAE4F7; padding: 16px; text-align: center; font-size: 11px; color: #9188BE;">
      KNOTS Placement &amp; Opportunities Hub • S. B. Jain Institute of Technology, Management &amp; Research
    </div>
  </div>
</body>
</html>"""

    try:
        if settings.EMAIL_WEBHOOK_URL:
            try:
                return _send_via_webhook(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception:
                pass
        if settings.RESEND_API_KEY:
            try:
                return _send_via_resend(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception:
                pass
        if settings.BREVO_API_KEY:
            try:
                return _send_via_brevo(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception:
                pass
        if settings.SENDGRID_API_KEY:
            try:
                return _send_via_sendgrid(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception:
                pass
        return _send_via_smtp(normalized_recipient, subject, plain_text_body, html_body)
    except Exception as e:
        logger.warning(f"Failed to dispatch application notification email: {e}")
        return False


def send_referral_email(
    recipient_email: str,
    alumni_name: str,
    student_name: str,
    department: str = "General",
    opportunity_title: str = "Job / Internship Opportunity",
    company_name: str = "Your Company",
    student_profile_link: str | None = None,
    opportunity_link: str | None = None,
    resume_url: str | None = None,
    linkedin_url: str | None = None,
    github_url: str | None = None,
    student_email: str | None = None,
    student_phone: str | None = None,
    batch: str | None = None,
    placement_status: str | None = None,
    cgpa: str | None = None,
    skills: list[str] | str | None = None,
    pitch: str | None = None,
) -> bool:
    """Send an authentic, structured Referral Request email to the alumni's inbox."""
    normalized_recipient = recipient_email.strip().lower()
    logger.info(
        f"[REFERRAL DISPATCH] Initiating referral email delivery to {normalized_recipient} from {student_name} for {opportunity_title} at {company_name}"
    )

    subject = f"Referral Request: {student_name} for {opportunity_title} at {company_name}"

    # Format skills
    skills_text = ""
    skills_html = ""
    if skills:
        if isinstance(skills, list):
            skill_list = [str(s).strip() for s in skills if str(s).strip()]
        else:
            skill_list = [s.strip() for s in str(skills).split(",") if s.strip()]
        if skill_list:
            skills_text = ", ".join(skill_list)
            skills_badges = "".join(
                f'<span style="display: inline-block; background-color: #F0EDFB; color: #4B63D2; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; margin: 2px 4px 2px 0; border: 1px solid #D5CBEE;">{sk}</span>'
                for sk in skill_list
            )
            skills_html = f"""
            <div style="margin-top: 10px;">
              <span style="font-size: 12px; font-weight: 700; color: #5851A4; display: block; margin-bottom: 4px;">Key Technical Skills:</span>
              <div>{skills_badges}</div>
            </div>"""

    # Plain text version
    plain_text_body = (
        f"Hello {alumni_name},\n\n"
        f"You have received a direct referral request on KNOTS from SBJIT student {student_name}.\n\n"
        f"--- CANDIDATE DETAILS ---\n"
        f"Name: {student_name}\n"
        f"Email: {student_email or 'Available on profile'}\n"
        f"Phone: {student_phone or 'N/A'}\n"
        f"Department: {department}\n"
        f"Graduation Batch: {batch or 'N/A'}\n"
        f"Placement Status: {placement_status or 'Actively Seeking Placement / Opportunities'}\n"
        f"CGPA: {cgpa or 'N/A'}\n"
        f"Skills: {skills_text or 'N/A'}\n\n"
        f"--- TARGET OPPORTUNITY ---\n"
        f"Company: {company_name}\n"
        f"Target Role / Job ID: {opportunity_title}\n"
        f"Job Posting Link: {opportunity_link or 'N/A'}\n\n"
        f"--- RESUME & PORTFOLIO ---\n"
        f"Resume URL: {resume_url or 'N/A'}\n"
        f"LinkedIn: {linkedin_url or 'N/A'}\n"
        f"GitHub: {github_url or 'N/A'}\n\n"
        f"--- CANDIDATE'S PITCH / NOTE ---\n"
        f"\"{pitch or 'I would love to be considered for an employee referral for this role.'}\"\n\n"
        f"You can contact the student directly by replying to this email ({student_email or normalized_recipient}).\n\n"
        f"Warm regards,\n"
        f"KNOTS Alumni & Career Network\n"
        f"S. B. Jain Institute of Technology, Management & Research, Nagpur"
    )

    # Resume CTA button
    resume_cta = ""
    if resume_url:
        resume_cta = f"""
        <div style="text-align: center; margin: 22px 0 16px;">
          <a href="{resume_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4B63D2 0%, #5851A4 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(75, 99, 210, 0.35);">
            📄 Open Candidate Resume / CV
          </a>
        </div>"""

    social_links = []
    if linkedin_url:
        social_links.append(f'<a href="{linkedin_url}" target="_blank" style="color: #4B63D2; text-decoration: none; font-weight: 700; margin-right: 12px;">🔗 LinkedIn Profile</a>')
    if github_url:
        social_links.append(f'<a href="{github_url}" target="_blank" style="color: #4B63D2; text-decoration: none; font-weight: 700; margin-right: 12px;">💻 GitHub</a>')
    if student_profile_link:
        social_links.append(f'<a href="{student_profile_link}" target="_blank" style="color: #4B63D2; text-decoration: none; font-weight: 700;">🌐 KNOTS Profile</a>')
    social_links_html = " • ".join(social_links) if social_links else ""

    status_badge = placement_status or "Actively Seeking Placement"
    status_badge_html = f'<span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #FDE68A;">{status_badge}</span>'

    # Rich HTML Email body
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f6fd; color: #1e2746;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f8f6fd; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #eae4f7; box-shadow: 0 6px 24px rgba(75, 99, 210, 0.08); overflow: hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #1E2746 0%, #2A3558 100%); color: #ffffff;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background: rgba(255, 210, 26, 0.2); color: #FFD21A; border: 1px solid rgba(255, 210, 26, 0.4); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 6px; margin-bottom: 8px;">
                      ⚡ SBJIT Alumni Referral Request
                    </span>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px;">
                      KNOTS Referral Portal
                    </h1>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #C8B6E2;">
                      Connecting {company_name} Alumni with Ambitious SBJIT Juniors
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px 32px;">
              <p style="margin: 0 0 14px; font-size: 15px; font-weight: 600; color: #1e2746;">
                Dear <strong>{alumni_name}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 13.5px; line-height: 1.6; color: #5851A4;">
                SBJIT student <strong>{student_name}</strong> from <strong>{department}</strong> has reached out to request an employee referral for an open position at <strong>{company_name}</strong>.
              </p>

              <!-- Target Opportunity Card -->
              <div style="background-color: #FAF9FD; border: 1px solid #D5CBEE; border-radius: 14px; padding: 16px 18px; margin-bottom: 20px;">
                <span style="font-size: 11px; font-weight: 800; color: #4B63D2; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
                  Target Opportunity
                </span>
                <div style="font-size: 16px; font-weight: 800; color: #1E2746;">
                  {opportunity_title}
                </div>
                <div style="font-size: 13px; font-weight: 600; color: #5851A4; margin-top: 2px;">
                  🏢 {company_name}
                  {f' • <a href="{opportunity_link}" target="_blank" style="color: #4B63D2; font-weight: 700; text-decoration: none;">View Job Link ↗</a>' if opportunity_link else ''}
                </div>
              </div>

              <!-- Candidate Profile Card -->
              <div style="background-color: #ffffff; border: 1px solid #EAE4F7; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 800; color: #1E2746; text-transform: uppercase; letter-spacing: 0.5px;">
                    Candidate Profile Details
                  </span>
                  {status_badge_html}
                </div>

                <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 12.5px; color: #1E2746; line-height: 1.8;">
                  <tr>
                    <td width="35%" style="color: #5851A4; font-weight: 600;">Student Name:</td>
                    <td style="font-weight: 700;">{student_name}</td>
                  </tr>
                  <tr>
                    <td style="color: #5851A4; font-weight: 600;">Department & Batch:</td>
                    <td><strong>{department}</strong> {f'• Batch {batch}' if batch else ''}</td>
                  </tr>
                  {f'<tr><td style="color: #5851A4; font-weight: 600;">Academic CGPA:</td><td><strong style="color: #059669;">{cgpa}</strong></td></tr>' if cgpa else ''}
                  {f'<tr><td style="color: #5851A4; font-weight: 600;">Student Email:</td><td><a href="mailto:{student_email}" style="color: #4B63D2; font-weight: 700;">{student_email}</a></td></tr>' if student_email else ''}
                  {f'<tr><td style="color: #5851A4; font-weight: 600;">Phone / WhatsApp:</td><td><strong>{student_phone}</strong></td></tr>' if student_phone else ''}
                </table>

                {skills_html}

                {f'<div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #F0EDFB; font-size: 12px;">{social_links_html}</div>' if social_links_html else ''}
              </div>

              <!-- Student Pitch Note -->
              {f'''
              <div style="background-color: #F0EDFB; border-left: 4px solid #4B63D2; border-radius: 0 12px 12px 0; padding: 14px 16px; margin-bottom: 20px;">
                <span style="font-size: 11px; font-weight: 800; color: #4B63D2; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
                  Note from Candidate:
                </span>
                <p style="margin: 0; font-size: 13px; font-style: italic; color: #1E2746; line-height: 1.5;">
                  "{pitch}"
                </p>
              </div>''' if pitch else ''}

              <!-- Resume Button CTA -->
              {resume_cta}

              <!-- Direct Contact Box -->
              <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 14px 16px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #065F46; line-height: 1.5;">
                  💬 <strong>Next Step:</strong> You can contact the student directly by replying to this email or writing to <a href="mailto:{student_email or recipient_email}" style="color: #047857; font-weight: 700;">{student_email or recipient_email}</a> to share your company's internal referral link or schedule a conversation.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #FAF9FD; border-top: 1px solid #eae4f7; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                S. B. Jain Institute of Technology, Management &amp; Research, Nagpur
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #5851A4;">
                KNOTS • Empowering Alumni-Student Collaboration &amp; Campus Placements
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
        if settings.EMAIL_WEBHOOK_URL:
            try:
                return _send_via_webhook(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as e:
                logger.warning(f"Webhook referral delivery failed: {e}")

        if settings.RESEND_API_KEY:
            try:
                return _send_via_resend(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as e:
                logger.warning(f"Resend referral delivery failed: {e}")

        if settings.BREVO_API_KEY:
            try:
                return _send_via_brevo(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as e:
                logger.warning(f"Brevo referral delivery failed: {e}")

        if settings.SENDGRID_API_KEY:
            try:
                return _send_via_sendgrid(
                    normalized_recipient, subject, plain_text_body, html_body
                )
            except Exception as e:
                logger.warning(f"SendGrid referral delivery failed: {e}")

        return _send_via_smtp(
            normalized_recipient, subject, plain_text_body, html_body
        )

    except Exception as e:
        logger.warning(f"Failed to dispatch referral notification email: {e}")
        return False
