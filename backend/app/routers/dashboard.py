from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas, auth
from ..database import get_db
from ..utils.overdue import get_overdue_threshold, compute_overdue, set_overdue_threshold

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    complaints = db.query(models.Complaint).all()
    threshold = get_overdue_threshold(db)

    by_status = {}
    by_category = {}
    overdue_count = 0

    for c in complaints:
        by_status[c.status.value] = by_status.get(c.status.value, 0) + 1
        by_category[c.category] = by_category.get(c.category, 0) + 1
        is_overdue, _ = compute_overdue(c, threshold)
        if is_overdue:
            overdue_count += 1

    return schemas.DashboardStats(
        total_complaints=len(complaints),
        by_status=by_status,
        by_category=by_category,
        overdue_count=overdue_count,
    )


@router.get("/settings")
def get_settings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return {"overdue_threshold_days": get_overdue_threshold(db)}


@router.put("/settings")
def update_settings(
    payload: schemas.SettingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    set_overdue_threshold(db, payload.overdue_threshold_days)
    return {"overdue_threshold_days": payload.overdue_threshold_days}
