from pydantic import BaseModel


class NotificationPreferenceResponse(BaseModel):
    """Full preference state returned to the client."""

    id: int
    user_id: int
    notify_on_like: bool
    notify_on_comment: bool
    notify_on_connection_request: bool
    notify_on_event_rsvp: bool
    notify_on_message: bool
    notify_on_job_alert: bool
    notify_on_general: bool

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    """All fields optional — PATCH only the ones you want to change."""

    notify_on_like: bool | None = None
    notify_on_comment: bool | None = None
    notify_on_connection_request: bool | None = None
    notify_on_event_rsvp: bool | None = None
    notify_on_message: bool | None = None
    notify_on_job_alert: bool | None = None
    notify_on_general: bool | None = None
