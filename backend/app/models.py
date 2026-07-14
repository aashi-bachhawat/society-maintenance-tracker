import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    resident = "resident"
    admin = "admin"


class ComplaintStatus(str, enum.Enum):
    open = "Open"
    in_progress = "In Progress"
    resolved = "Resolved"


class ComplaintPriority(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.resident)
    apartment_number = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="resident", foreign_keys="Complaint.resident_id")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=gen_uuid)
    resident_id = Column(String, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    photo_url = Column(String, nullable=True)
    status = Column(Enum(ComplaintStatus), nullable=False, default=ComplaintStatus.open)
    priority = Column(Enum(ComplaintPriority), nullable=False, default=ComplaintPriority.medium)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    is_closed = Column(Boolean, default=False)

    resident = relationship("User", back_populates="complaints", foreign_keys=[resident_id])
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan",
                            order_by="ComplaintHistory.timestamp")


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(String, primary_key=True, default=gen_uuid)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    status = Column(Enum(ComplaintStatus), nullable=False)
    note = Column(Text, nullable=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    actor_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="history")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_important = Column(Boolean, default=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
