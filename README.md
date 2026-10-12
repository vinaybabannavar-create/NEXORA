# NEXORA
AI-Powered Enterprise Operations & Intelligence Platform

NEXORA is a modular enterprise platform foundation built around:
- Django + Django REST Framework for core business/auth APIs
- PostgreSQL for transactional data
- FastAPI for AI/RAG services
- Next.js + React + TypeScript for the web frontend
- Node.js + Socket.IO for realtime communication
- Redis for caching/queues/realtime support
- MongoDB for flexible/semi-structured data
- Docker Compose for local infrastructure

## Current implemented foundation

- Custom email-based Django User model
- UUID user IDs
- Roles: EMPLOYEE, MANAGER, ADMIN
- JWT login/refresh/logout
- Refresh-token blacklist
- Current-user endpoint
- Role-based permissions
- Admin-only endpoint
- Manager-or-admin endpoint
- Public registration foundation
- Django Admin
- PostgreSQL migrations
- API health endpoint
- FastAPI health endpoint
- Socket.IO health/realtime skeleton
- Next.js frontend dashboard/login skeleton
- Docker Compose for PostgreSQL, Redis, MongoDB

## Important security note

`.env.example` contains placeholders only. Create your own `.env` and use strong secrets.
The existing development database may contain test accounts from the earlier build. Do not reuse development passwords in production.

## Recommended local startup

### Fastest first-time setup

From the NEXORA root in VS Code PowerShell:

```powershell
.\scriptsootstrap.ps1
python backend\django\manage.py createsuperuser
```

Then start each service as described below.

### 1. Start infrastructure

```powershell
docker compose up -d postgres redis mongodb
```

### 2. Django

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/django/requirements.txt
python backend/django/manage.py migrate
python backend/django/manage.py runserver
```

### 3. FastAPI

```powershell
pip install -r backend/fastapi/requirements.txt
uvicorn app.main:app --app-dir backend/fastapi --reload --port 8001
```

### 4. Realtime service

```powershell
cd services/realtime
npm install
npm run dev
```

### 5. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open:
- Frontend: http://localhost:3000
- Django API: http://127.0.0.1:8000
- Django Admin: http://127.0.0.1:8000/admin/
- FastAPI docs: http://127.0.0.1:8001/docs
- Realtime: http://127.0.0.1:3001/health

## Architecture

```text
NEXORA
├── frontend/                 Next.js web application
├── backend/
│   ├── django/               Core enterprise API/auth/admin
│   └── fastapi/               AI/RAG service boundary
├── services/
│   └── realtime/              Node.js + Socket.IO
├── infrastructure/            Docker/monitoring configuration
├── tests/                      Cross-service test notes
├── docs/                       Architecture/security documentation
└── scripts/                    Local setup helpers
```

## Planned modules

Users & Departments → Projects → Tasks → Customers → Support → Documents →
AI/RAG → Realtime Collaboration → Notifications → Analytics → Audit Logs →
Workflows → Automation → Monitoring → CI/CD → Cloud deployment.


## What is not included

The ZIP contains source code and configuration, not your local PostgreSQL data, Docker volumes, access tokens, or real passwords. This is intentional so the archive is safe to move/share.

The existing development accounts from the previous local database are therefore not embedded in the ZIP. After first setup, create a new admin with `createsuperuser`; other test users can be created through the registration API or Django Admin.
