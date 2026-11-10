# TalentHub — Campus Placement Management System

TalentHub is a full-stack placement portal built with **React + Vite + Tailwind CSS** and **FastAPI + SQLAlchemy + SQLite**. The React frontend is based on the original TalentHub interface; the backend provides the placement workflow and validation rules.

## 1. Requirements

- Windows 10/11, macOS or Linux
- **Python 3.13 recommended** (use a fresh virtual environment)
- Node.js 18 or newer and npm
- Internet access for the first dependency installation

Python 3.13 is recommended for this package. Do not use the Python 3.14 environment that was used with earlier project copies.

## 2. Run the backend

Open Terminal / PowerShell window 1:

```powershell
cd path\to\TalentHub_Final\backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If PowerShell blocks activation, run this once in that terminal and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Backend checks:
- API: http://127.0.0.1:8000/
- Interactive API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

The first backend start creates `backend/talenthub.db` and seeds demo accounts and sample jobs. Stop the server before deleting that database to reset the demo data. The application detects the earlier TalentHub database layout and preserves it as a timestamped backup before creating the updated schema.

## 3. Run the frontend

Open Terminal / PowerShell window 2 and leave the backend running:

```powershell
cd path\to\TalentHub_Final\frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173). The frontend calls the backend at http://127.0.0.1:8000.

## 4. Demo logins

All demo accounts use password: `password123`.

| Role | Email |
|---|---|
| Student | `rahul@student.talenthub.edu` |
| Student | `priya@student.talenthub.edu` |
| Student | `aman@student.talenthub.edu` |
| Student | `neha@student.talenthub.edu` |
| Company — ABC Technologies | `hr@abctech.com` |
| Company — XYZ Corp | `hr@xyzcorp.com` |
| Placement Coordinator | `coordinator@talenthub.edu` |

## 5. Implemented workflow and rules

1. **Company creates a job:** detailed description, job type, location, package, required skills, CGPA/backlog criteria, explicit branch scope, application deadline and a description for every selection round are required.
2. **Student reads the Placement Policy:** before the first application, the student must read and accept the active policy version once. The same accepted version covers all job applications; the student is not asked to accept it again for every job. A newly published policy version requires a new one-time acceptance before the next application.
3. **Student views and applies:** the job card shows the role details, eligibility, deadline and published round descriptions. Applying to a specific job is a separate application action, not a second policy acceptance. The backend independently checks policy acceptance, CGPA, backlogs, branch, deadline, duplicate application and existing accepted placement.
4. **Company reviews:** an application can be shortlisted or rejected. Rejection requires a written reason, which is retained in the application history and shown to the student.
5. **Selection process:** companies publish the names and descriptions of selection rounds for students to review. TalentHub does not schedule interview rounds or allocate interview time slots. After completing its selection process outside TalentHub, the company records the final selection decision for a shortlisted applicant.
6. **Offer:** an offer can be issued only after the company marks the selection process as completed. It has a unique reference, package, response deadline and explicit `PENDING`, `ACCEPTED`, `DECLINED` or `EXPIRED` status.
7. **Offer response:** students can accept or decline an issued offer before its response deadline. Offer acceptance is not gated by another policy/agreement prompt.
8. **Student profile:** phone and skills can be edited. Name, USN and branch are institutional fields. CGPA/backlog changes are requests and affect eligibility only after coordinator approval. Rejected update requests require a reason.
9. **Coordinator:** sees placement statistics, student records, applications, academic update requests, and profile audit history; can approve/reject academic changes and publish a new Placement Policy version.

The seeded Placement Policy v1 is **demo content**, not an approved college policy or legal document. Replace it with the institution's approved text before real deployment.

## 6. Tests and verification

Run the backend unit tests from the activated backend virtual environment:

```powershell
cd backend
python -m pytest -q
```

The included backend unit tests passed (6 tests). Python source compilation and frontend JSX/JavaScript syntax parsing also passed. A full Vite production build and browser-based end-to-end visual check still need to be performed on the target Windows machine after `npm install`.

## 7. Project structure

```text
TalentHub_Final/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route handlers
│   │   ├── core/          # database, authentication and constants
│   │   ├── models/        # SQLAlchemy models
│   │   ├── repositories/  # database access
│   │   ├── schemas/       # request validation
│   │   └── services/      # eligibility and workflow rules
│   ├── tests/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   └── pages/         # student, company and coordinator dashboards
    ├── package.json
    └── vite.config.js
```
