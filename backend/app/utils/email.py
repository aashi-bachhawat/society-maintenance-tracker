import os
import logging
import requests

logger = logging.getLogger("email")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
RESEND_URL = "https://api.resend.com/emails"


def send_email(to: str, subject: str, html: str) -> bool:
    """
    Sends an email via the Resend API (https://resend.com).
    If RESEND_API_KEY is not configured, the email is logged instead of sent,
    so the rest of the app keeps working in local/dev environments.
    """
    if not RESEND_API_KEY:
        logger.info(f"[EMAIL - MOCKED, no RESEND_API_KEY set] To: {to} | Subject: {subject}\n{html}")
        return False

    try:
        response = requests.post(
            RESEND_URL,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        if response.status_code >= 300:
            logger.error(f"Resend API error {response.status_code}: {response.text}")
            return False
        return True
    except requests.RequestException as e:
        logger.error(f"Failed to send email: {e}")
        return False


def complaint_status_email(resident_name: str, complaint_id: str, category: str, status: str, note: str = None) -> tuple:
    subject = f"Complaint Update: {category} is now '{status}'"
    note_html = f"<p><b>Note from admin:</b> {note}</p>" if note else ""
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px;">
        <h2>Complaint Status Updated</h2>
        <p>Hi {resident_name},</p>
        <p>Your complaint <b>#{complaint_id[:8]}</b> ({category}) status has changed to
        <b>{status}</b>.</p>
        {note_html}
        <p>Log in to the Society Maintenance Tracker to view full details and history.</p>
    </div>
    """
    return subject, html


def important_notice_email(resident_name: str, title: str, content: str) -> tuple:
    subject = f"Important Notice: {title}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px;">
        <h2>📌 Important Notice</h2>
        <p>Hi {resident_name},</p>
        <h3>{title}</h3>
        <p>{content}</p>
        <p>Log in to the Society Maintenance Tracker to view the full notice board.</p>
    </div>
    """
    return subject, html
