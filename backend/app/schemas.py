from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- Auth ----------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    apartment_number: Optional[str] = None
    role: Optional[str] = "resident"  # allow "admin" only via seed script in practice


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str
    apartment_number: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Complaint History ----------

class ComplaintHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str
    note: Optional[str] = None
    actor_name: str
    timestamp: datetime


# ---------- Complaints ----------

class ComplaintCreate(BaseModel):
    category: str
    description: str


class ComplaintStatusUpdate(BaseModel):
    status: str  # Open | In Progress | Resolved
    note: Optional[str] = None


class ComplaintPriorityUpdate(BaseModel):
    priority: str  # Low | Medium | High


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    resident_id: str
    resident_name: Optional[str] = None
    apartment_number: Optional[str] = None
    category: str
    description: str
    photo_url: Optional[str] = None
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    is_closed: bool
    is_overdue: bool = False
    days_open: int = 0
    history: List[ComplaintHistoryOut] = []


# ---------- Notices ----------

class NoticeCreate(BaseModel):
    title: str
    content: str
    is_important: bool = False


class NoticeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    content: str
    is_important: bool
    created_at: datetime
    created_by_name: Optional[str] = None


# ---------- Dashboard ----------

class DashboardStats(BaseModel):
    total_complaints: int
    by_status: dict
    by_category: dict
    overdue_count: int


# ---------- Settings ----------

class SettingUpdate(BaseModel):
    overdue_threshold_days: int
