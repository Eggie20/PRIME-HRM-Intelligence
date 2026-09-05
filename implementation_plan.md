# NBSC PRIME-HRM Intelligence Hub — Implementation Plan

A responsive, Django-based HRMS for Northern Bukidnon State College. **No React** — server-rendered with Django templates + vanilla JS/HTMX for interactivity. Separate `backend/` and `frontend/` directories for clarity.

---

## User Review Required

> [!IMPORTANT]
> **Tech stack change from original spec:** The original spec called for React + FastAPI. Per your request, this plan uses **Django** for both backend logic and template-based rendering (no React). MongoDB is retained via **Djongo** or **MongoEngine** as the ODM.

> [!WARNING]
> **MongoDB + Django compatibility:** Django's ORM was designed for relational databases. We have two options:
> 1. **Djongo** — translates Django ORM queries to MongoDB (allows `manage.py` migrations, admin panel)
> 2. **MongoEngine** — standalone MongoDB ODM (more Pythonic for Mongo, but no Django admin/migrations)
>
> **Recommendation:** Use **MongoEngine** for all custom models (employees, applications, audit chain, etc.) and keep a minimal SQLite/Postgres for Django's built-in auth and session tables. This gives us the best of both worlds.

> [!IMPORTANT]
> **Python not found on PATH.** Your system has the `py` launcher but `python`/`python3` commands are not on PATH. We'll use `py -m pip`, `py manage.py`, etc. throughout. You may want to add Python to your PATH for convenience.

## Open Questions

1. **MongoDB hosting** — Will you use MongoDB Atlas (cloud) or a local MongoDB instance for development?
2. **DSS weight distribution** — Default: Merit 30%, Competence 30%, Ethics 20%, Service Orientation 20%. Confirm or adjust.
3. **Payslip password formula** — Default: `last4_of_employee_ID + MMDDYYYY_of_DOB`. Confirm.
4. **PRIME-HRM policy PDFs** — Which documents will be ingested into SARA's RAG vector store? Please provide during Phase 5.
5. **Email provider** — The spec mentions Resend. Confirm, or use Django's built-in SMTP backend with any provider?
6. **Domain/Deployment target** — Where will this be hosted? (e.g., DigitalOcean, Railway, PythonAnywhere, school server)

---

## Production File Structure

```
NBSC PRIME-HRM Intelligence Hub/
│
├── files/                          # Your existing Excel data files
│   ├── DGEC.xlsx
│   ├── IBM.xlsx
│   ├── ICS.xlsx
│   └── ITE.xlsx
│
├── picture/                        # Your existing reference screenshots
│   └── *.png
│
├── backend/                        # ── DJANGO PROJECT ROOT ──
│   ├── manage.py
│   ├── requirements/
│   │   ├── base.txt                # Shared dependencies
│   │   ├── dev.txt                 # Dev-only (debug toolbar, etc.)
│   │   └── prod.txt                # Production (gunicorn, whitenoise)
│   │
│   ├── config/                     # Django project settings package
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # Shared settings
│   │   │   ├── dev.py              # Dev overrides (DEBUG=True)
│   │   │   └── prod.py             # Prod overrides (security, allowed hosts)
│   │   ├── urls.py                 # Root URL conf
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── apps/                       # All Django apps
│   │   ├── __init__.py
│   │   │
│   │   ├── accounts/               # ── Auth, Users, Roles, 2FA ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # User model (MongoEngine), Role enum
│   │   │   ├── views.py            # Login, logout, register, 2FA setup
│   │   │   ├── forms.py            # Login/register/password reset forms
│   │   │   ├── urls.py
│   │   │   ├── middleware.py        # JWT middleware, role-based access
│   │   │   ├── decorators.py       # @role_required, @twofa_required
│   │   │   ├── tokens.py           # JWT issue/verify, TOTP helpers
│   │   │   ├── signals.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       ├── test_auth.py
│   │   │       └── test_2fa.py
│   │   │
│   │   ├── dashboard/              # ── Analytics Dashboard ──
│   │   │   ├── __init__.py
│   │   │   ├── views.py            # KPI aggregation, chart data endpoints
│   │   │   ├── urls.py
│   │   │   ├── services.py         # Analytics queries (Mongo aggregation)
│   │   │   └── tests/
│   │   │       └── test_dashboard.py
│   │   │
│   │   ├── employees/              # ── Employee CRUD + Bulk Import ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # Employee document (MongoEngine)
│   │   │   ├── views.py            # List, create, update, delete, import
│   │   │   ├── forms.py            # Employee forms
│   │   │   ├── urls.py
│   │   │   ├── services.py         # Excel/CSV import logic (pandas + openpyxl)
│   │   │   ├── filters.py          # Search & filter helpers
│   │   │   └── tests/
│   │   │       └── test_employees.py
│   │   │
│   │   ├── programs/               # ── Programs Management ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # Program document
│   │   │   ├── views.py
│   │   │   ├── forms.py
│   │   │   ├── urls.py
│   │   │   └── tests/
│   │   │       └── test_programs.py
│   │   │
│   │   ├── vacancies/              # ── Vacancy & Job Board ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # Vacancy document
│   │   │   ├── views.py            # HR CRUD + public job board
│   │   │   ├── forms.py
│   │   │   ├── urls.py
│   │   │   └── tests/
│   │   │       └── test_vacancies.py
│   │   │
│   │   ├── applicants/             # ── Applicant Portal ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # Application document, uploaded docs
│   │   │   ├── views.py            # Register, apply, upload, track timeline
│   │   │   ├── forms.py            # Registration, application forms
│   │   │   ├── urls.py
│   │   │   └── tests/
│   │   │       └── test_applicants.py
│   │   │
│   │   ├── hiring/                 # ── Hiring Pipeline + DSS ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # Evaluation, DSS scores, deliberation
│   │   │   ├── views.py            # Kanban board, screening, scoring
│   │   │   ├── forms.py            # Evaluation forms, voting forms
│   │   │   ├── urls.py
│   │   │   ├── dss.py              # DSS 4-pillar scoring engine
│   │   │   ├── services.py         # Pipeline stage transitions
│   │   │   └── tests/
│   │   │       ├── test_dss.py
│   │   │       └── test_hiring.py
│   │   │
│   │   ├── audit/                  # ── SHA256 Audit Chain ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # AuditBlock document
│   │   │   ├── views.py            # Chain viewer, verification endpoint
│   │   │   ├── urls.py
│   │   │   ├── chain.py            # Hash chain logic (create block, verify)
│   │   │   └── tests/
│   │   │       └── test_chain.py
│   │   │
│   │   ├── payroll/                # ── Payroll & Encrypted Payslips ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # Payroll, Payslip documents
│   │   │   ├── views.py            # Upload Excel, generate, download
│   │   │   ├── forms.py
│   │   │   ├── urls.py
│   │   │   ├── services.py         # ReportLab PDF gen, PyPDF2 encryption
│   │   │   └── tests/
│   │   │       └── test_payroll.py
│   │   │
│   │   ├── sara/                   # ── SARA Voice AI Assistant (RAG) ──
│   │   │   ├── __init__.py
│   │   │   ├── models.py           # Chat history, vector store refs
│   │   │   ├── views.py            # Chat API endpoint, STT/TTS bridge
│   │   │   ├── urls.py
│   │   │   ├── rag.py              # RAG pipeline (embeddings, retrieval)
│   │   │   ├── llm.py              # Gemini Flash integration
│   │   │   ├── tools.py            # DB tool-calling (role-scoped queries)
│   │   │   └── tests/
│   │   │       └── test_sara.py
│   │   │
│   │   └── notifications/          # ── In-app + Email Notifications ──
│   │       ├── __init__.py
│   │       ├── models.py           # Notification document
│   │       ├── views.py            # Mark read, list
│   │       ├── urls.py
│   │       ├── services.py         # Email sending (Resend/SMTP)
│   │       └── tests/
│   │           └── test_notifications.py
│   │
│   ├── core/                       # Shared utilities
│   │   ├── __init__.py
│   │   ├── mongo.py                # MongoEngine connection setup
│   │   ├── pagination.py           # Cursor-based pagination helper
│   │   ├── storage.py              # File/document storage abstraction
│   │   ├── validators.py           # Shared validators
│   │   ├── context_processors.py   # Global template context
│   │   └── templatetags/
│   │       ├── __init__.py
│   │       └── hub_tags.py         # Custom template tags/filters
│   │
│   ├── fixtures/                   # Seed/demo data
│   │   ├── demo_users.json
│   │   ├── demo_employees.json
│   │   ├── demo_programs.json
│   │   └── demo_vacancies.json
│   │
│   ├── scripts/                    # Management scripts
│   │   ├── seed_db.py              # Load demo data
│   │   └── verify_chain.py         # CLI audit chain verification
│   │
│   └── media/                      # Uploaded files (gitignored)
│       ├── documents/              # Applicant uploads (resume, TOR, PDS)
│       ├── payslips/               # Generated encrypted PDFs
│       └── avatars/                # Profile photos
│
├── frontend/                       # ── TEMPLATES + STATIC ASSETS ──
│   ├── templates/
│   │   ├── base.html               # Master layout (meta, nav, footer, scripts)
│   │   ├── components/             # Reusable partials
│   │   │   ├── _navbar.html        # Top nav (public/applicant)
│   │   │   ├── _sidebar.html       # Sidebar (admin roles)
│   │   │   ├── _kpi_card.html      # Dashboard KPI card
│   │   │   ├── _pagination.html    # Pagination controls
│   │   │   ├── _modal.html         # Generic modal shell
│   │   │   ├── _timeline.html      # Application timeline tracker
│   │   │   ├── _toast.html         # Toast notification
│   │   │   ├── _vacancy_card.html  # Job listing card
│   │   │   └── _kanban_column.html # Kanban column partial
│   │   │
│   │   ├── accounts/
│   │   │   ├── admin_login.html    # Staff sign-in (dark split layout)
│   │   │   ├── applicant_login.html# Applicant sign-in (card)
│   │   │   ├── register.html       # Create applicant account
│   │   │   ├── setup_2fa.html      # QR code + TOTP verification
│   │   │   ├── verify_2fa.html     # 2FA code entry
│   │   │   └── password_reset.html
│   │   │
│   │   ├── dashboard/
│   │   │   └── index.html          # HR Command Center
│   │   │
│   │   ├── employees/
│   │   │   ├── list.html           # Employee table with search/filter
│   │   │   ├── detail.html         # Employee profile view
│   │   │   ├── form.html           # Create/edit employee
│   │   │   └── import.html         # Bulk import UI
│   │   │
│   │   ├── programs/
│   │   │   ├── list.html
│   │   │   └── form.html
│   │   │
│   │   ├── vacancies/
│   │   │   ├── list.html           # HR vacancy management
│   │   │   ├── form.html           # Create/edit vacancy
│   │   │   └── public_board.html   # Public-facing job board
│   │   │
│   │   ├── applicants/
│   │   │   ├── portal.html         # Applicant dashboard (my apps + open jobs)
│   │   │   ├── apply.html          # Application form + doc upload
│   │   │   └── track.html          # Full timeline view
│   │   │
│   │   ├── hiring/
│   │   │   ├── pipeline.html       # Kanban board
│   │   │   ├── applicant_detail.html # Full applicant review
│   │   │   ├── dss_scores.html     # 4-pillar scoring view
│   │   │   ├── evaluation.html     # Dept Head evaluation form
│   │   │   ├── deliberation.html   # HRMPSB voting panel
│   │   │   └── final_decision.html # HR Admin final decision
│   │   │
│   │   ├── audit/
│   │   │   ├── chain.html          # Audit chain viewer
│   │   │   └── verify.html         # Chain integrity verification
│   │   │
│   │   ├── payroll/
│   │   │   ├── upload.html         # Excel upload form
│   │   │   ├── list.html           # Payroll records
│   │   │   └── download.html       # Employee payslip download
│   │   │
│   │   ├── sara/
│   │   │   └── chat.html           # SARA voice assistant UI
│   │   │
│   │   └── errors/
│   │       ├── 404.html
│   │       ├── 403.html
│   │       └── 500.html
│   │
│   └── static/
│       ├── css/
│       │   ├── base.css            # CSS variables, reset, typography
│       │   ├── layout.css          # Sidebar, navbar, grid system
│       │   ├── components.css      # Cards, buttons, badges, forms, modals
│       │   ├── dashboard.css       # Dashboard-specific styles
│       │   ├── kanban.css          # Kanban board styles
│       │   ├── timeline.css        # Application timeline
│       │   ├── sara.css            # SARA chat UI
│       │   └── public.css          # Public pages (landing, job board)
│       │
│       ├── js/
│       │   ├── app.js              # Global init, CSRF setup, toast system
│       │   ├── charts.js           # Chart.js dashboard charts
│       │   ├── kanban.js           # Drag-and-drop Kanban (Sortable.js)
│       │   ├── forms.js            # Form validation, file upload preview
│       │   ├── datatables.js       # Table search, sort, pagination
│       │   ├── sara.js             # Web Speech API STT/TTS + chat logic
│       │   ├── htmx-ext.js         # HTMX extensions/custom events
│       │   └── 2fa.js              # QR code generation (qrcode.js)
│       │
│       ├── img/
│       │   ├── nbsc-logo.png       # NBSC crest/logo
│       │   ├── nbsc-logo-white.png # White variant for dark backgrounds
│       │   ├── sara-avatar.png     # SARA robot avatar
│       │   └── favicon.ico
│       │
│       └── vendor/                 # Vendored JS/CSS (no CDN dependency)
│           ├── htmx.min.js         # HTMX for dynamic partials
│           ├── chart.min.js        # Chart.js
│           ├── sortable.min.js     # Sortable.js for Kanban
│           └── qrcode.min.js       # QR code for 2FA setup
│
├── docs/                           # Project documentation
│   ├── API.md                      # Internal API endpoints reference
│   ├── DEPLOYMENT.md               # Deployment instructions
│   ├── DATABASE.md                 # MongoDB schema documentation
│   └── PRIME-HRM-POLICIES/         # Policy PDFs for SARA RAG ingestion
│       └── (your policy PDFs here)
│
├── docker/                         # Docker configuration
│   ├── Dockerfile.backend          # Django + Gunicorn
│   ├── Dockerfile.nginx            # Nginx for static files
│   └── docker-compose.yml          # Full stack orchestration
│
├── .env.example                    # Environment variable template
├── .gitignore
├── README.md
└── Makefile                        # Common commands (dev, migrate, seed, test)
```

---

## Proposed Changes

### Component 1: Project Scaffolding & Configuration

#### [NEW] `backend/config/settings/base.py`
- Django settings with split config (base → dev/prod)
- MongoEngine connection config via `MONGODB_SETTINGS`
- Minimal SQLite for Django's auth/session tables
- Template dirs pointing to `frontend/templates/`
- Static dirs pointing to `frontend/static/`
- Installed apps: all 11 custom apps + django defaults

#### [NEW] `backend/config/urls.py`
- Root URL routing to all app URL modules
- Separate namespaces: `accounts:`, `dashboard:`, `employees:`, `programs:`, `vacancies:`, `applicants:`, `hiring:`, `audit:`, `payroll:`, `sara:`, `notifications:`
- Public routes (job board, applicant portal) vs. staff routes

#### [NEW] `backend/core/mongo.py`
- MongoEngine connection initialization
- Connection pooling config
- Separate DB aliases for test environment

---

### Component 2: Accounts & Auth (`apps/accounts/`)

#### [NEW] `backend/apps/accounts/models.py`
- `User` MongoEngine Document with fields: email, password_hash (Argon2), first_name, last_name, role (enum: HR_ADMIN, HRMPSB_MEMBER, DEPT_HEAD, EMPLOYEE, APPLICANT), is_active, totp_secret, totp_enabled, created_at
- Role enum with permission matrix

#### [NEW] `backend/apps/accounts/tokens.py`
- JWT token creation/verification using `PyJWT`
- TOTP setup (pyotp) — generate secret, verify code
- Token stored in HttpOnly cookie (not localStorage)

#### [NEW] `backend/apps/accounts/middleware.py`
- JWT authentication middleware — extract token from cookie, attach user to request
- Role-based access middleware

#### [NEW] `backend/apps/accounts/views.py`
- `admin_login` — staff sign-in with dark split-screen layout (matches screenshot 7)
- `applicant_login` — clean card layout (matches screenshot 2)
- `register` — applicant registration form (matches screenshot 3)
- `setup_2fa` — QR code display for TOTP setup
- `verify_2fa` — code entry after login
- `logout`, `password_reset`, `password_reset_confirm`

---

### Component 3: Dashboard (`apps/dashboard/`)

#### [NEW] `backend/apps/dashboard/views.py`
- `index` — HR Command Center with KPI cards + charts (matches screenshot 8)
- Returns aggregation data for: total employees, active vacancies, pending applicants, monthly hires
- Chart data endpoints (JSON): gender distribution, dept headcount, teaching vs non-teaching, employment type

#### [NEW] `frontend/static/js/charts.js`
- Chart.js initialization for all dashboard charts
- Fetch data from Django JSON endpoints
- Bar chart (dept headcount), pie chart (teaching vs non-teaching), doughnut (gender), horizontal bar (employment type)

---

### Component 4: Employees (`apps/employees/`)

#### [NEW] `backend/apps/employees/models.py`
- `Employee` Document: employee_id, personal info (name, gender, DOB, civil_status, PWD_flag), employment info (position, salary_grade, employment_type, department, program, date_hired), education (degree, school, year), contact info, document_urls, created_at, updated_at

#### [NEW] `backend/apps/employees/services.py`
- `import_from_excel(file)` — parse DGEC/IBM/ICS/ITE format Excel files using pandas + openpyxl
- Maps the interview scoresheet columns to employee fields
- Bulk insert with validation and error reporting

#### [NEW] `backend/apps/employees/views.py`
- CRUD views with search, filter (department, employment type, position), pagination
- Bulk import view with file upload + preview + confirm

---

### Component 5: Programs (`apps/programs/`)

#### [NEW] `backend/apps/programs/models.py`
- `Program` Document: name, code, type (teaching/non-teaching), department, description, is_active

#### [NEW] `backend/apps/programs/views.py`
- CRUD for teaching + non-teaching programs
- Linked to vacancies (used in vacancy creation dropdown)

---

### Component 6: Vacancies (`apps/vacancies/`)

#### [NEW] `backend/apps/vacancies/models.py`
- `Vacancy` Document: title, position_type (teaching/non-teaching), salary_grade, program_ref, department, qualifications, deadline, status (open/closed), created_by, applicant_count

#### [NEW] `backend/apps/vacancies/views.py`
- HR: CRUD vacancies
- Public: job board listing (matches screenshot 4) — card grid with Teaching/Non-Teaching badges, SG level, department, deadline, Apply button
- Landing page (matches screenshot 1) — hero section with NBSC branding + SARA preview

---

### Component 7: Applicants (`apps/applicants/`)

#### [NEW] `backend/apps/applicants/models.py`
- `Application` Document: applicant_ref (User), vacancy_ref, status (applied/screening/4pillars/interview/background/hrmpsb/final_decision/hired/rejected), documents (list of uploaded file refs), applied_at, stage_history (list of {stage, timestamp, actor})

#### [NEW] `backend/apps/applicants/views.py`
- `portal` — applicant dashboard showing "My Applications" with timeline tracker + "Open Positions" (matches screenshots 5 & 6)
- `apply` — application form with multi-file upload
- `track` — detailed timeline with 8-stage progress bar: Applied → Screening → 4 Pillars → Interview → Background → HRMPSB → Final Decision → Hired

---

### Component 8: Hiring Pipeline + DSS (`apps/hiring/`)

#### [NEW] `backend/apps/hiring/dss.py`
- 4-pillar Decision Support System scoring engine
- Pillars: Merit (30%), Competence (30%), Ethics (20%), Service Orientation (20%)
- Each pillar has sub-criteria with weights
- Produces normalized score (0-100) + rank recommendation
- **DSS is advisory only** — HR Admin makes final human decision

#### [NEW] `backend/apps/hiring/views.py`
- `pipeline` — Kanban board with drag-and-drop stage transitions (Sortable.js)
- `applicant_detail` — full review: documents, DSS scores, evaluations, deliberation notes
- `evaluation` — Dept Head evaluation form (scores + remarks)
- `deliberation` — HRMPSB voting panel (vote yes/no/abstain, add remarks)
- `final_decision` — HR Admin accept/reject with audit block creation

#### [NEW] `backend/apps/hiring/services.py`
- Stage transition logic with validation (can't skip stages)
- Automatic notification on stage change
- Triggers audit chain write on final decision

---

### Component 9: Audit Chain (`apps/audit/`)

#### [NEW] `backend/apps/audit/models.py`
- `AuditBlock` Document: index, timestamp, actor (user ref), action (string), payload (dict), prev_hash, hash

#### [NEW] `backend/apps/audit/chain.py`
- `create_block(actor, action, payload)` — compute SHA256 hash from: index + timestamp + actor + action + JSON(payload) + prev_hash
- `verify_chain()` — iterate all blocks, recompute hashes, verify chain integrity
- `get_chain()` — return full chain for display

#### [NEW] `backend/apps/audit/views.py`
- `chain` — visual chain viewer with block details
- `verify` — run verification, show pass/fail result with detail

---

### Component 10: Payroll (`apps/payroll/`)

#### [NEW] `backend/apps/payroll/services.py`
- `import_payroll(excel_file)` — parse payroll Excel (pandas)
- `generate_payslip(employee, payroll_data)` — create PDF via ReportLab with NBSC branding
- `encrypt_payslip(pdf_bytes, password)` — encrypt with PyPDF2 using per-employee password (last 4 of ID + DOB)

#### [NEW] `backend/apps/payroll/views.py`
- HR: upload payroll Excel, batch generate encrypted PDFs
- Employee: list own payslips, download (password-protected)

---

### Component 11: SARA Voice Assistant (`apps/sara/`)

#### [NEW] `backend/apps/sara/llm.py`
- Gemini Flash integration via Google AI Python SDK
- System prompt scoped by user role
- Tool-calling definitions for DB queries (employee lookup, vacancy info, etc.)

#### [NEW] `backend/apps/sara/rag.py`
- Document ingestion: parse PRIME-HRM policy PDFs → chunk → embed (Gemini embeddings)
- Vector store (MongoDB Atlas Vector Search or local FAISS)
- Retrieval: embed query → nearest neighbors → context injection

#### [NEW] `backend/apps/sara/views.py`
- `/sara/chat/` — POST endpoint accepting text query, returns AI response
- Role-scoped: employees can only query about themselves, HR can query about all

#### [NEW] `frontend/static/js/sara.js`
- Web Speech API: STT (SpeechRecognition) + TTS (SpeechSynthesis)
- Chat bubble UI with voice toggle
- Streaming response rendering

---

### Component 12: Frontend Templates & Static Assets

All templates use Django template inheritance from `base.html`. No React, no npm build step.

#### [NEW] `frontend/templates/base.html`
- Master layout: `<head>` with meta tags, CSS, `<body>` with nav/sidebar slot, content block, footer, JS
- Responsive: sidebar for admin roles (Dashboard, Employees, Programs, Vacancies, Hiring Pipeline, Audit Chain, Settings), top-nav for public/applicant
- NBSC branding: dark navy (#0F1B2D) + gold (#D4A843) + white palette
- HTMX loaded globally for dynamic partial updates

#### [NEW] `frontend/static/css/base.css`
- CSS custom properties (design tokens): colors, spacing, typography, shadows, border-radius
- CSS reset + Inter/Outfit font from Google Fonts
- NBSC color palette:
  - Primary: `#0F1B2D` (deep navy), `#1A2A42` (sidebar), `#D4A843` (gold accent)
  - Surfaces: `#F7F8FA` (bg), `#FFFFFF` (cards), `#E5E7EB` (borders)
  - Text: `#111827` (primary), `#6B7280` (secondary)
  - Status: `#10B981` (success/green for timeline), `#EF4444` (error), `#F59E0B` (warning)

#### [NEW] `frontend/static/vendor/htmx.min.js`
- HTMX for server-rendered dynamic updates (replaces SPA behavior)
- Used for: form submissions, Kanban column updates, pagination, search-as-you-type

---

### Component 13: Docker & Deployment

#### [NEW] `docker/docker-compose.yml`
- Services: django (Gunicorn), mongodb, nginx (static files + reverse proxy)
- Volumes for media uploads and MongoDB data
- Environment-driven config (`.env` file)

#### [NEW] `.env.example`
- `DJANGO_SETTINGS_MODULE`, `SECRET_KEY`, `MONGODB_URI`, `GEMINI_API_KEY`, `EMAIL_*`, `ALLOWED_HOSTS`, `DEBUG`

---

## Key Dependencies (`requirements/base.txt`)

| Package | Purpose |
|---------|---------|
| `Django==5.1` | Web framework |
| `mongoengine==0.28` | MongoDB ODM |
| `PyJWT==2.9` | JWT authentication |
| `argon2-cffi==23.1` | Argon2 password hashing |
| `pyotp==2.9` | TOTP 2FA |
| `qrcode[pil]==7.4` | QR code generation for 2FA |
| `pandas==2.2` | Excel/CSV data import |
| `openpyxl==3.1` | Excel file reading |
| `reportlab==4.2` | PDF generation |
| `PyPDF2==3.0` | PDF encryption |
| `google-genai==1.x` | Gemini Flash for SARA |
| `django-htmx==1.19` | HTMX integration |
| `Pillow==10.4` | Image processing |
| `gunicorn==22.0` | Production WSGI server |
| `whitenoise==6.7` | Static file serving |
| `python-dotenv==1.0` | Env file loading |

---

## Implementation Phases

### Phase 1 — Foundations (Weeks 1–2)
- Project scaffolding (all dirs, settings, mongo connection)
- `accounts` app: User model, JWT auth, login/register views, 2FA for HR Admin + HRMPSB
- `employees` app: CRUD, bulk Excel import (using your DGEC/IBM/ICS/ITE files)
- `programs` app: teaching + non-teaching CRUD
- `dashboard` skeleton: layout with sidebar, KPI cards (hardcoded → live)
- Base templates, CSS design system, NBSC branding

### Phase 2 — Recruitment Core (Weeks 3–4)
- `vacancies` app: CRUD + public job board
- `applicants` app: registration, apply flow, document upload, timeline tracker
- Public landing page (hero section matching screenshot 1)
- Kanban board for HR (Sortable.js drag-and-drop)

### Phase 3 — Hiring Intelligence (Weeks 5–6)
- `hiring` app: DSS 4-pillar scoring engine
- Dept Head evaluation form, HRMPSB deliberation/voting panel
- Final decision flow → audit chain write
- `audit` app: SHA256 hash chain, verification endpoint, chain viewer UI

### Phase 4 — Payroll (Week 7)
- `payroll` app: Excel import, ReportLab PDF generation, PyPDF2 encryption
- Employee payslip download portal

### Phase 5 — SARA (Weeks 8–9)
- `sara` app: Gemini Flash integration, RAG pipeline
- Policy document ingestion
- Web Speech API STT/TTS in browser
- Role-scoped chat UI

### Phase 6 — Polish & Deploy (Week 10)
- Dashboard charts (Chart.js) with live aggregation
- `notifications` app: in-app + email
- Error pages, loading states, seed demo data
- Docker setup, deployment (live URL + local demo)
- Accessibility pass (WCAG AA, ARIA, keyboard nav)

---

## Verification Plan

### Automated Tests
```bash
py manage.py test apps.accounts
py manage.py test apps.employees
py manage.py test apps.hiring.tests.test_dss
py manage.py test apps.audit.tests.test_chain
py manage.py test  # all tests
```

### Manual Verification
- Walk through all 8 screenshots to confirm UI matches
- Full applicant flow: register → apply → track timeline
- Full hiring flow: post vacancy → screen → DSS score → evaluate → deliberate → decide → verify audit block
- Payroll flow: upload Excel → generate payslip → download encrypted PDF
- SARA: voice query → role-scoped answer
- Responsive check: desktop + mobile breakpoints
