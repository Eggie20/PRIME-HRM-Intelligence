# 🐘 PostgreSQL Database Seeder & JSON Data Guide

The **NBSC PRIME-HRM Intelligence Hub** includes comprehensive PostgreSQL-ready relational seed datasets covering the entire institutional lifecycle:
- **Users & Staff Accounts** (Admin, HRMPSB Member, Department Head, Applicant, Faculty)
- **Academic Programs & Institutes** (ICS, IBM, ITE, DGEC)
- **Personnel & Faculty Directory** (8 itemized plantilla & COS personnel with CSC salary grades)
- **Recruitment Vacancies** (6 open & deliberated plantilla positions with Qualification Standards)
- **Hiring Pipeline Candidates** (8 applicants demonstrating all 8 progression stages)
- **4-Pillar Decision Support System (DSS)** merit scores & rubrics
- **Department Head Likert Evaluations** & **HRMPSB Deliberation Ballots**
- **Tamper-Evident SHA-256 Cryptographic Audit Ledger** (Genesis block + action blocks)
- **Payroll Disbursement Batches & Itemized Payslips** (TRAIN Law tax, GSIS, PhilHealth, Pag-IBIG)
- **In-App Notifications & Global System Settings**

---

## 📂 Seed Files Generated

| File | Location | Description |
|---|---|---|
| **`seed_data.json`** | `backend/data/seed_data.json` & root `seed_data.json` | Clean, standardized JSON dataset structured by table. Suitable for custom ingestion scripts, ORMs, and API fixtures. |
| **`seed_postgres.sql`** | `backend/data/seed_postgres.sql` & root `seed_postgres.sql` | Self-contained SQL migration script (`CREATE TABLE IF NOT EXISTS` + `INSERT INTO ... ON CONFLICT DO NOTHING`). |
| **`seed_postgres.py`** | `backend/scripts/seed_postgres.py` | Standalone Python migration script with CLI argument parsing and error diagnostics. |

---

## 🚀 Quick Start: 3 Ways to Seed PostgreSQL

### Method 1: Using the Python Seeder Script (Recommended)

1. **Install psycopg2 driver** (if not already installed):
   ```bash
   pip install psycopg2-binary
   ```

2. **Run the seeder**:
   ```bash
   # Using default database: postgresql://postgres:postgres@localhost:5432/nbsc_hrms
   python backend/scripts/seed_postgres.py

   # OR specify a custom connection URI:
   python backend/scripts/seed_postgres.py --url "postgresql://myuser:mypassword@localhost:5432/my_hrms_db"
   ```

---

### Method 2: Using standard `psql` (Fastest, zero dependencies)

If you have PostgreSQL installed or run via Docker:

```bash
# 1. Create database (if needed)
createdb -U postgres nbsc_hrms

# 2. Run the SQL seed script
psql -U postgres -d nbsc_hrms -f seed_postgres.sql
```

---

### Method 3: Using pgAdmin, DBeaver, Supabase, or Neon

1. Open your database in **pgAdmin**, **DBeaver**, or your cloud provider SQL console (Supabase / Neon).
2. Open the file **`seed_postgres.sql`** (located at the root or in `backend/data/seed_postgres.sql`).
3. Click **Execute / Run Query** (`F5` or `Ctrl+Enter`).
4. All 14 tables and records will be created and populated automatically!

---

## 📋 Seeded Data Summary (14 Tables, 87+ Records)

| Table | Count | Key Attributes |
|---|---|---|
| `users` | 8 | Passwords, roles (`HR_ADMIN`, `HRMPSB_MEMBER`, `DEPT_HEAD`, `APPLICANT`, `EMPLOYEE`), 2FA flags |
| `programs` | 6 | BSIT, BSCS, BSBA, BEED, BSED, DGEC |
| `employees` | 8 | Faculty roster, daily rates, salary grades (SG 6-24), status (Permanent / COS) |
| `vacancies` | 6 | Plantilla items across all institutes, CSC QS education/experience/training/eligibility |
| `applications` | 8 | Demonstrating all 8 stages (`APPLIED` → `SCREENING` → `DSS_SCORED` → `DEPT_EVALUATION` → `DELIBERATION` → `APPOINTMENT_ISSUED` → `DOCUMENT_VERIFICATION` → `ONBOARDED`) |
| `dss_scores` | 2 | 4-Pillar merit, competence, ethics, and public service ratings |
| `dept_head_evaluations` | 2 | Department rubric ratings, Likert scores, and recommendations |
| `deliberation_ballots` | 2 | HRMPSB board votes and deliberation notes |
| `hiring_decisions` | 1 | Official BOR resolution appointment record |
| `audit_blocks` | 6 | SHA-256 chained transaction blocks with cryptographic hashes |
| `payroll_batches` | 2 | Semi-monthly batches with total gross, deductions, and net disbursements |
| `payslips` | 16 | Itemized employee payslips with GSIS, PhilHealth, Pag-IBIG, withholding tax |
| `notifications` | 4 | In-app alerts for recruitment status, payroll release, and board meetings |
| `settings` | 3 | Institutional branding, audit retention, and PRIME-HRM Level 2 parameters |

---

## 🔐 Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **HR Administrator** | `admin@nbsc.edu.ph` | `AdminPassword123!` |
| **HRMPSB Board Member** | `hrmpsb@nbsc.edu.ph` | `MemberPassword123!` |
| **Department Head (ICS)** | `depthead.ics@nbsc.edu.ph` | `DeptPassword123!` |
| **Candidate / Applicant** | `applicant@gmail.com` | `ApplicantPass123!` |
| **Faculty / Employee** | `employee.dgec@nbsc.edu.ph` | `EmpPassword123!` |
