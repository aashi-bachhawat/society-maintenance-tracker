# Society Maintenance Tracker

A full-stack platform for apartment societies to raise, track, and resolve maintenance complaints — with photo attachments, status history, priority and overdue handling, a notice board, and email notifications.

**Stack:** FastAPI (Python) + SQLAlchemy + PostgreSQL/SQLite · React (Vite) · JWT auth · Resend (email)

---

## 1. Project structure

```
society-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, static file mount
│   │   ├── database.py        # DB engine/session
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT + password hashing
│   │   ├── routers/
│   │   │   ├── auth.py        # /api/auth/*
│   │   │   ├── complaints.py  # /api/complaints/*
│   │   │   ├── notices.py     # /api/notices/*
│   │   │   └── dashboard.py   # /api/dashboard/*
│   │   └── utils/
│   │       ├── email.py       # Resend email integration
│   │       └── overdue.py     # Overdue detection logic
│   ├── seed_admin.py          # Script to create/reset an admin account
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/              # Login, Register, ResidentDashboard, AdminComplaints, AdminDashboard, NoticeBoard
│   │   ├── components/         # Navbar, ComplaintCard, Badges
│   │   ├── context/AuthContext.jsx
│   │   └── api.js              # Axios client with JWT interceptor
│   └── .env.example
└── SYSTEM_DESIGN.md
```

---

## 2. Local setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) PostgreSQL — SQLite is used automatically if `DATABASE_URL` is left blank

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit values as needed
python seed_admin.py admin@society.com "Admin User" "yourStrongPassword"

uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Interactive docs (Swagger UI) are auto-generated at `http://localhost:8000/docs`, and ReDoc at `/redoc`.

> Public `/api/auth/register` always creates **resident** accounts. The only way to create an **admin** account is `seed_admin.py`, which also works to promote/reset an existing user — this keeps the admin role from being self-assignable.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL if backend isn't on localhost:8000
npm run dev
```

Open `http://localhost:5173`. Log in with the admin account you seeded, or register a new resident account.

---

## 3. Environment variables

### `backend/.env.example`
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. Leave blank for local SQLite (`society.db`). |
| `SECRET_KEY` | JWT signing secret — set a long random string in production. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT session length (default 1440 = 24h). |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free tier: 100 emails/day, no card). If left blank, emails are logged instead of sent, so the app still works without it. |
| `EMAIL_FROM` | Sender address. `onboarding@resend.dev` works out of the box on Resend's sandbox domain. |
| `OVERDUE_THRESHOLD_DAYS` | Default overdue threshold (also editable live from the admin dashboard). |
| `UPLOAD_DIR` / `MAX_UPLOAD_SIZE_MB` | Photo upload storage folder and size limit. |
| `FRONTEND_URL` | Used for CORS. |

### `frontend/.env.example`
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API. |

---

## 4. Database schema

**users**
| column | type | notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | |
| email | string | unique |
| password_hash | string | bcrypt |
| role | enum | `resident` \| `admin` |
| apartment_number | string | nullable |
| created_at | datetime | |

**complaints**
| column | type | notes |
|---|---|---|
| id | UUID (PK) | |
| resident_id | UUID (FK → users) | |
| category | string | |
| description | text | |
| photo_url | string | nullable |
| status | enum | `Open` \| `In Progress` \| `Resolved` |
| priority | enum | `Low` \| `Medium` \| `High` |
| created_at / updated_at / resolved_at | datetime | |
| is_closed | boolean | true once resolved |

**complaint_history** — one row per status change (append-only audit trail)
| column | type | notes |
|---|---|---|
| id | UUID (PK) | |
| complaint_id | UUID (FK) | |
| status | enum | status at this point in time |
| note | text | nullable, admin's comment |
| actor_id / actor_name | UUID / string | who made the change |
| timestamp | datetime | |

**notices**
| column | type | notes |
|---|---|---|
| id | UUID (PK) | |
| title / content | string / text | |
| is_important | boolean | pins to top, triggers email blast |
| created_by | UUID (FK → users) | |
| created_at | datetime | |

**settings** — simple key-value store (currently just `overdue_threshold_days`)

---

## 5. API reference (summary — full interactive docs at `/docs`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register a resident account |
| POST | `/api/auth/login` | public | Login, returns JWT |
| GET | `/api/auth/me` | any | Current user info |
| POST | `/api/complaints` | resident | Raise a complaint (multipart form: category, description, photo) |
| GET | `/api/complaints/mine` | resident | List own complaints with history |
| GET | `/api/complaints?category=&status=&date_from=&date_to=` | admin | List/filter all complaints, overdue-first |
| GET | `/api/complaints/{id}` | owner/admin | Single complaint detail |
| PATCH | `/api/complaints/{id}/status` | admin | Update status (`{status, note}`) — records history, emails resident |
| PATCH | `/api/complaints/{id}/priority` | admin | Update priority (`{priority}`) |
| GET | `/api/notices` | any | List notices, important-first |
| POST | `/api/notices` | admin | Post a notice (emails residents if `is_important`) |
| DELETE | `/api/notices/{id}` | admin | Remove a notice |
| GET | `/api/dashboard` | admin | Totals by status/category, overdue count |
| GET/PUT | `/api/dashboard/settings` | admin | Read/update the overdue threshold (days) |

All authenticated requests use `Authorization: Bearer <token>`.

---

## 6. Deployment

**Backend (Render/Railway):**
1. Push this repo to GitHub.
2. Create a new Web Service pointing at `backend/`, build command `pip install -r requirements.txt`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Add a managed Postgres instance and set `DATABASE_URL` to its connection string.
4. Set `SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL` as environment variables.
5. After first deploy, run `python seed_admin.py <email> "<name>" "<password>"` via the platform's shell/console to create your admin login.

> Note: on most free hosting tiers the filesystem is ephemeral, so uploaded photos won't persist across redeploys. For a production deployment, swap local disk storage in `utils` for an object store (S3, Cloudinary, etc.) — the `_save_photo` function in `routers/complaints.py` is the only place that would need to change.

**Frontend (Vercel):**
1. Import the repo, set root directory to `frontend/`.
2. Set `VITE_API_URL` to your deployed backend URL.
3. Deploy — Vercel auto-detects the Vite build.

**Email (Resend):** sign up free at resend.com, verify a domain (or use their sandbox sender for testing), create an API key, and set `RESEND_API_KEY` / `EMAIL_FROM` on the backend.

---

## 7. Default login

After running `seed_admin.py`, log in with the email/password you provided. Residents self-register via the "Create an account" link on the login page.
