import os
import uuid
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..utils.overdue import get_overdue_threshold, compute_overdue
from ..utils.email import send_email, complaint_status_email

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_photo(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported photo format. Use jpg, png, gif, or webp.")

    contents = file.file.read()
    if len(contents) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Photo too large. Max size is {MAX_UPLOAD_SIZE_MB}MB.")

    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(contents)
    return f"/uploads/{filename}"


def _to_out(c: models.Complaint, db: Session) -> schemas.ComplaintOut:
    threshold = get_overdue_threshold(db)
    is_overdue, days_open = compute_overdue(c, threshold)
    return schemas.ComplaintOut(
        id=c.id,
        resident_id=c.resident_id,
        resident_name=c.resident.name if c.resident else None,
        apartment_number=c.resident.apartment_number if c.resident else None,
        category=c.category,
        description=c.description,
        photo_url=c.photo_url,
        status=c.status.value,
        priority=c.priority.value,
        created_at=c.created_at,
        updated_at=c.updated_at,
        resolved_at=c.resolved_at,
        is_closed=c.is_closed,
        is_overdue=is_overdue,
        days_open=days_open,
        history=[schemas.ComplaintHistoryOut.model_validate(h) for h in c.history],
    )


@router.post("", response_model=schemas.ComplaintOut, status_code=201)
def create_complaint(
    category: str = Form(...),
    description: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    photo_url = _save_photo(photo) if photo and photo.filename else None

    complaint = models.Complaint(
        resident_id=current_user.id,
        category=category,
        description=description,
        photo_url=photo_url,
        status=models.ComplaintStatus.open,
        priority=models.ComplaintPriority.medium,
    )
    db.add(complaint)
    db.flush()

    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        status=models.ComplaintStatus.open,
        note="Complaint raised",
        actor_id=current_user.id,
        actor_name=current_user.name,
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    return _to_out(complaint, db)


@router.get("/mine", response_model=List[schemas.ComplaintOut])
def my_complaints(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    complaints = (
        db.query(models.Complaint)
        .filter(models.Complaint.resident_id == current_user.id)
        .order_by(models.Complaint.created_at.desc())
        .all()
    )
    return [_to_out(c, db) for c in complaints]


@router.get("", response_model=List[schemas.ComplaintOut])
def list_complaints(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    q = db.query(models.Complaint)
    if category:
        q = q.filter(models.Complaint.category == category)
    if status:
        q = q.filter(models.Complaint.status == status)
    if date_from:
        q = q.filter(models.Complaint.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(models.Complaint.created_at <= datetime.fromisoformat(date_to))

    complaints = q.order_by(models.Complaint.created_at.desc()).all()
    results = [_to_out(c, db) for c in complaints]

    # Overdue complaints surface at the top, then by priority (High > Medium > Low)
    priority_rank = {"High": 0, "Medium": 1, "Low": 2}
    results.sort(key=lambda c: (not c.is_overdue, priority_rank.get(c.priority, 3)))
    return results


@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role != models.UserRole.admin and c.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
    return _to_out(c, db)


@router.patch("/{complaint_id}/status", response_model=schemas.ComplaintOut)
def update_status(
    complaint_id: str,
    payload: schemas.ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    try:
        new_status = models.ComplaintStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")

    if c.is_closed:
        raise HTTPException(status_code=400, detail="Complaint is already resolved and closed")

    c.status = new_status
    if new_status == models.ComplaintStatus.resolved:
        c.resolved_at = datetime.utcnow()
        c.is_closed = True

    history = models.ComplaintHistory(
        complaint_id=c.id,
        status=new_status,
        note=payload.note,
        actor_id=current_user.id,
        actor_name=current_user.name,
    )
    db.add(history)
    db.commit()
    db.refresh(c)

    # Notify resident by email (best-effort, does not block the response)
    subject, html = complaint_status_email(
        c.resident.name, c.id, c.category, new_status.value, payload.note
    )
    send_email(c.resident.email, subject, html)

    return _to_out(c, db)


@router.patch("/{complaint_id}/priority", response_model=schemas.ComplaintOut)
def update_priority(
    complaint_id: str,
    payload: schemas.ComplaintPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    try:
        c.priority = models.ComplaintPriority(payload.priority)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid priority value")

    db.commit()
    db.refresh(c)
    return _to_out(c, db)
