from datetime import datetime
from sqlalchemy.orm import Session

from .. import models

DEFAULT_THRESHOLD_DAYS = 3


def get_overdue_threshold(db: Session) -> int:
    setting = db.query(models.Setting).filter(models.Setting.key == "overdue_threshold_days").first()
    if setting:
        try:
            return int(setting.value)
        except ValueError:
            pass
    return DEFAULT_THRESHOLD_DAYS


def set_overdue_threshold(db: Session, days: int) -> None:
    setting = db.query(models.Setting).filter(models.Setting.key == "overdue_threshold_days").first()
    if setting:
        setting.value = str(days)
    else:
        setting = models.Setting(key="overdue_threshold_days", value=str(days))
        db.add(setting)
    db.commit()


def compute_overdue(complaint: models.Complaint, threshold_days: int) -> tuple:
    """Returns (is_overdue: bool, days_open: int)"""
    reference_end = complaint.resolved_at if complaint.is_closed and complaint.resolved_at else datetime.utcnow()
    days_open = (reference_end - complaint.created_at).days
    is_overdue = (not complaint.is_closed) and days_open >= threshold_days
    return is_overdue, days_open
