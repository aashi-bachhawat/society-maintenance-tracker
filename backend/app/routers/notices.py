from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..utils.email import send_email, important_notice_email

router = APIRouter(prefix="/api/notices", tags=["notices"])


def _to_out(n: models.Notice) -> schemas.NoticeOut:
    return schemas.NoticeOut(
        id=n.id,
        title=n.title,
        content=n.content,
        is_important=n.is_important,
        created_at=n.created_at,
        created_by_name=None,
    )


@router.get("", response_model=List[schemas.NoticeOut])
def list_notices(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    notices = db.query(models.Notice).order_by(
        models.Notice.is_important.desc(), models.Notice.created_at.desc()
    ).all()
    return [_to_out(n) for n in notices]


@router.post("", response_model=schemas.NoticeOut, status_code=201)
def create_notice(
    payload: schemas.NoticeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    notice = models.Notice(
        title=payload.title,
        content=payload.content,
        is_important=payload.is_important,
        created_by=current_user.id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    if notice.is_important:
        residents = db.query(models.User).filter(models.User.role == models.UserRole.resident).all()
        for resident in residents:
            subject, html = important_notice_email(resident.name, notice.title, notice.content)
            send_email(resident.email, subject, html)

    return _to_out(notice)


@router.delete("/{notice_id}", status_code=204)
def delete_notice(
    notice_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(notice)
    db.commit()
    return None
