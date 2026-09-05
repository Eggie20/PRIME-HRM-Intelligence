# NBSC PRIME-HRM Intelligence Hub — MongoDB Database Schema

The database architecture is implemented in MongoDB using MongoEngine ODM. It stores all unstructured, high-velocity, and cryptographic data models across 11 core collections.

---

## Collections Overview

```
nbsc_hrms (Database)
├── users                   # Accounts, roles, Argon2 hashes, TOTP secrets
├── programs                # Academic institutes and degree divisions
├── employees               # 201 personnel records, salary grades, daily rates
├── vacancies               # Job openings, QS requirements, slots, deadlines
├── applications            # Candidate dockets, 8-stage history, PDS/TOR metadata
├── dss_scores              # 4-Pillar DSS scores, sub-pillar points, radar series
├── dept_head_evaluations   # 5-point Likert rubric evaluations & recommendations
├── hrmpsb_votes            # Deliberation ballots, rank priorities, notes
├── hiring_decisions        # Appointment resolutions committed to hash chain
├── audit_blocks            # SHA-256 cryptographic chain blocks (Genesis -> N)
├── payroll_batches         # Bi-monthly disbursement cycles and status
├── payslip_records         # Itemized earnings, deductions, AES encrypted paths
├── sara_sessions           # Conversation threads and user roles
├── sara_messages           # Utterances, citations, tool calls, user ratings
└── notifications           # In-app alerts, categories, read flags
```

---

## 1. `users` Collection
- **Indexes**: `email` (unique), `role`, `department`
- **Fields**:
  - `email`: String (Required, Unique)
  - `password_hash`: String (Argon2id)
  - `full_name`: String
  - `role`: String (`HR_ADMIN`, `HRMPSB_MEMBER`, `DEPT_HEAD`, `EMPLOYEE`, `APPLICANT`)
  - `department`: String (`ICS`, `IBM`, `ITE`, `DGEC`, `ADMIN`, `FIN`, `REG`)
  - `totp_secret`: String (Optional 2FA)
  - `is_2fa_enabled`: Boolean (Default: False)
  - `is_active`: Boolean (Default: True)
  - `created_at`: DateTime

---

## 2. `vacancies` Collection
- **Indexes**: `status`, `department`, `category`, `salary_grade`, `-created_at`
- **Fields**:
  - `title`: String
  - `department`: String
  - `category`: String (`TEACHING`, `NON_TEACHING`)
  - `employment_status`: String (`PERMANENT`, `COS`, `TEMPORARY`, `JOB_ORDER`)
  - `education`, `experience`, `training`, `eligibility`: String
  - `salary_grade`: Integer
  - `monthly_salary`: Float
  - `daily_rate`: Float
  - `slots`: Integer
  - `status`: String (`OPEN`, `DELIBERATION`, `CLOSED`)
  - `deadline`: DateTime
  - `applicant_count`: Integer

---

## 3. `applications` Collection
- **Indexes**: `tracking_number` (unique), `applicant_email`, `vacancy`, `stage`, `-applied_at`
- **Fields**:
  - `tracking_number`: String (Unique format: `NBSC-APP-YYYY-XXXXX`)
  - `applicant`: Reference (`User`, Optional)
  - `applicant_email`, `applicant_name`: String
  - `vacancy`: Reference (`Vacancy`)
  - `stage`: String (`APPLIED`, `SCREENING`, `DSS_SCORED`, `DEPT_EVALUATION`, `DELIBERATION`, `APPOINTMENT_ISSUED`, `DOCUMENT_VERIFICATION`, `ONBOARDED`)
  - `applicant_profile`: Embedded Dict (education, experience, phone, address)
  - `documents`: List of Dicts (`doc_type`, `file_name`, `file_size`, `verified`)
  - `stage_history`: List of Dicts (`stage`, `remarks`, `actor_email`, `timestamp`)
  - `applied_at`: DateTime

---

## 4. `audit_blocks` Collection
- **Indexes**: `index` (unique), `hash` (unique), `prev_hash`, `actor_email`, `-timestamp`
- **Fields**:
  - `index`: Integer (0 for Genesis Block)
  - `timestamp`: DateTime (UTC)
  - `actor_id`: String
  - `actor_email`: String
  - `actor_role`: String
  - `action`: String (e.g. `GENESIS`, `VACANCY_CREATED`, `APPLICATION_SUBMITTED`, `DSS_SCORE_COMPUTED`, `APPOINTMENT_CONFIRMED`)
  - `target_id`: String
  - `payload`: Dict (Canonical state change payload)
  - `prev_hash`: String (64-character hex digest of previous block)
  - `hash`: String (64-character hex digest of current block header)

---

## 5. `payroll_batches` & `payslip_records`
- **PayrollBatch Fields**: `batch_id`, `period_label`, `start_date`, `end_date`, `total_gross`, `total_deductions`, `total_net`, `employee_count`, `status` (`DRAFT`, `PROCESSED`, `DISTRIBUTED`), `audit_block_hash`.
- **PayslipRecord Fields**: `batch` (Reference), `employee_id`, `full_name`, `salary_grade`, `basic_pay`, `pera`, `gross_pay`, `gsis`, `philhealth`, `pagibig`, `withholding_tax`, `total_deductions`, `net_pay`, `encrypted_pdf_path`, `is_downloaded`.
  - **Encryption Key Rule**: AES-128 key generated from `last4_of_employee_id + MMDDYYYY_of_date_of_birth`.

---

## 6. `sara_sessions` & `sara_messages`
- **SaraSession Fields**: `session_id`, `user_email`, `user_role`, `created_at`, `updated_at`.
- **SaraMessage Fields**: `session` (Reference), `role` (`user`, `assistant`), `content`, `citations` (List of policy sources), `tool_calls` (List of database tool executions), `feedback` (`HELPFUL`, `NOT_HELPFUL`, `NONE`).
