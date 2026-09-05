# NBSC PRIME-HRM Intelligence Hub

> **A responsive web-based HRMS for Northern Bukidnon State College (NBSC)**, automating Civil Service Commission (CSC) PRIME-HRM Level 2 compliance, merit selection deliberations, personnel management, and institutional HR analytics.

---

## Architecture

This system is strictly architected into two decoupled directories:

```
NBSC PRIME-HRM Intelligence Hub/
├── frontend/             # Pure HTML5 + Vanilla CSS (BEM) + Modern Vanilla JS
│                         # (Zero frameworks, zero inline styles, zero inline scripts)
├── backend/              # Django REST API (JSON only, MongoEngine MongoDB)
├── files/                # Official NBSC Comparative Assessment Report (CAR) sheets
│                         # (DGEC.xlsx, IBM.xlsx, ICS.xlsx, ITE.xlsx)
└── picture/              # UI/UX reference design specifications
```

---

## Key Capabilities & Features

### 1. Security & Authentication
- **Role-Based Access Control (RBAC)**: Support for `HR_ADMIN`, `HRMPSB_MEMBER`, `DEPT_HEAD`, `APPLICANT`, and `EMPLOYEE`.
- **JWT Authentication**: Secure Bearer tokens with separate access and refresh lifecycles.
- **Two-Factor Authentication (2FA)**: RFC 6238 compliant TOTP using Google/Microsoft Authenticator, automated QR code generation, and challenge verification.
- **Demo Quick-Fill**: Integrated login shortcuts for rapid evaluator testing.

### 2. Personnel & Faculty Management
- **Directory**: Real-time searchable and filterable personnel roster with department, category, and appointment status badges.
- **Comparative Assessment Import**: Automated parser for official NBSC HRMPSB Excel workbooks (`DGEC.xlsx`, `IBM.xlsx`, `ICS.xlsx`, `ITE.xlsx`) and general rosters.
- **Civil Service Standard Profiles**: Comprehensive tracking of employee designations, salary grades, daily rates, and contact details.

### 3. Executive HR Command Center
- **Institutional KPIs**: Live headcounts, vacancy status, applicant pipeline totals, and PRIME-HRM compliance scores.
- **Data Visualizations (Chart.js)**:
  - Personnel distribution by Academic Institute (`DGEC`, `IBM`, `ICS`, `ITE`, `ADMIN`)
  - Appointment breakdown (Permanent Plantilla, Contract of Service, Temporary, Job Order)
  - Faculty vs. Administrative workforce split
  - 4 Pillars of PRIME-HRM Compliance Radar Map
- **Tamper-Evident Activity Feed**: SHA-256 block status tracking.

### 4. Modular Frontend Design Standard
- **Dedicated Page Folders**: Every screen has its own isolated folder containing identically named `.html`, `.css`, and `.js` files.
- **Strict Separation of Concerns**: Zero inline CSS `style=""` attributes and zero inline `<script>` tags in HTML.
- **Shared Design Tokens**: Consistent NBSC Midnight Navy (`#0F1B2D`) and Heritage Gold (`#D4A843`) palette.

---

## Getting Started

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Any modern web browser (Chrome, Edge, Firefox, Safari)

### 1. Backend Setup

From the `backend/` directory:

```bash
# Check Django configuration
py manage.py check

# Run automated tests
py manage.py test

# (Optional) Seed demo users, programs, and import roster files
py scripts/seed_db.py

# Start Django API server (runs on http://localhost:8000)
py manage.py runserver
```

### 2. Frontend Access

The frontend consists of static files and can be opened directly or served via any HTTP server:

- **Using Python HTTP Server**:
  ```bash
  cd frontend
  py -m http.server 3000
  ```
- **Direct Browser Navigation**:
  - Landing Homepage: `frontend/index.html`
  - Staff Sign In: `frontend/pages/auth/admin-login/admin-login.html`
  - Applicant Portal: `frontend/pages/auth/applicant-login/applicant-login.html`
  - HR Command Center: `frontend/pages/dashboard/dashboard/dashboard.html`
  - Employee Directory: `frontend/pages/employees/employee-list/employee-list.html`

### 3. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **HR Administrator** | `admin@nbsc.edu.ph` | `AdminPassword123!` |
| **HRMPSB Board Member** | `hrmpsb@nbsc.edu.ph` | `MemberPassword123!` |
| **Department Head (ICS)** | `depthead.ics@nbsc.edu.ph` | `DeptPassword123!` |
| **Applicant** | `applicant@gmail.com` | `Applicant123!` |

*(Use the "Quick Demo Access" buttons on the staff login screen for instant credential filling)*

---

## Automated Test Coverage

```bash
cd backend
py manage.py test
```

Tests validate:
- User model password hashing & verification
- TOTP secret generation & window verification
- JWT claims encoding and decoding
- Standard API response formatters (`api_success`, `api_error`)
- Employee model and pagination utility
- Program model and serialization
