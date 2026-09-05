-- ==============================================================================
-- NBSC PRIME-HRM Intelligence Hub — PostgreSQL Schema & Seed Migration Script
-- Target: PostgreSQL 12+
-- Generated: 2026-09-05
-- ==============================================================================

BEGIN;

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_code VARCHAR(50),
    position_title VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    requires_2fa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. Table: programs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programs (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    department VARCHAR(255),
    description TEXT,
    level VARCHAR(50) DEFAULT 'Undergraduate',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. Table: employees
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    employee_number VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    position VARCHAR(255) NOT NULL,
    position_title VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    salary_grade INTEGER,
    daily_rate NUMERIC(10, 2),
    monthly_salary NUMERIC(10, 2),
    employment_status VARCHAR(50) NOT NULL,
    date_hired DATE,
    date_of_birth VARCHAR(20),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. Table: vacancies
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vacancies (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    department VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    salary_grade INTEGER,
    monthly_salary NUMERIC(10, 2),
    daily_rate NUMERIC(10, 2),
    slots INTEGER DEFAULT 1,
    employment_status VARCHAR(50) NOT NULL,
    description TEXT,
    qualification_standards JSONB,
    status VARCHAR(50) DEFAULT 'OPEN',
    applicant_count INTEGER DEFAULT 0,
    posted_by VARCHAR(50),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. Table: applications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(50) PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    applicant_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    vacancy_id VARCHAR(50) REFERENCES vacancies(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    personal_info JSONB,
    education JSONB,
    documents JSONB,
    stage_history JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. Table: dss_scores
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dss_scores (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    merit_score NUMERIC(6, 2),
    competence_score NUMERIC(6, 2),
    ethics_score NUMERIC(6, 2),
    service_score NUMERIC(6, 2),
    total_score NUMERIC(6, 2),
    rank INTEGER,
    qs_compliant BOOLEAN DEFAULT TRUE,
    details JSONB,
    scored_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. Table: dept_head_evaluations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dept_head_evaluations (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    evaluator_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    evaluator_name VARCHAR(255),
    ratings JSONB,
    total_score NUMERIC(6, 2),
    recommendation VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. Table: deliberation_ballots
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliberation_ballots (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    voter_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    voter_name VARCHAR(255),
    vote VARCHAR(50) NOT NULL,
    rank_priority INTEGER,
    deliberation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 9. Table: hiring_decisions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hiring_decisions (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL,
    resolution_number VARCHAR(100),
    appointed_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    audit_block_index INTEGER,
    audit_block_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 10. Table: audit_blocks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_blocks (
    id VARCHAR(50) PRIMARY KEY,
    block_index INTEGER UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    target_id VARCHAR(100),
    data JSONB,
    previous_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 11. Table: payroll_batches
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll_batches (
    id VARCHAR(50) PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    period_label VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    department VARCHAR(50) NOT NULL,
    employee_count INTEGER NOT NULL,
    total_gross NUMERIC(12, 2) NOT NULL,
    total_deductions NUMERIC(12, 2) NOT NULL,
    total_net NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    uploaded_by VARCHAR(255),
    audit_block_hash VARCHAR(64),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 12. Table: payslips
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payslips (
    id VARCHAR(50) PRIMARY KEY,
    batch_id VARCHAR(50) REFERENCES payroll_batches(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    position VARCHAR(255) NOT NULL,
    salary_grade INTEGER,
    email VARCHAR(255),
    date_of_birth VARCHAR(20),
    basic_pay NUMERIC(10, 2) NOT NULL,
    pera NUMERIC(10, 2) DEFAULT 0.00,
    gross_pay NUMERIC(10, 2) NOT NULL,
    gsis NUMERIC(10, 2) DEFAULT 0.00,
    philhealth NUMERIC(10, 2) DEFAULT 0.00,
    pagibig NUMERIC(10, 2) DEFAULT 0.00,
    withholding_tax NUMERIC(10, 2) DEFAULT 0.00,
    total_deductions NUMERIC(10, 2) NOT NULL,
    net_pay NUMERIC(10, 2) NOT NULL,
    encrypted_pdf_filename VARCHAR(255),
    encrypted_pdf_path VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 13. Table: notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 14. Table: settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(50) PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- SEED DATA INGESTION
-- ==============================================================================

-- Seeding users (8 records)
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-001', 'admin@nbsc.edu.ph', 'AdminPassword123!', 'Dr. Maria Santos', 'HR_ADMIN', 'ADMIN', 'HR Director / College President', TRUE, FALSE, '2026-01-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-002', 'hrmpsb@nbsc.edu.ph', 'MemberPassword123!', 'Prof. Juan Dela Cruz', 'HRMPSB_MEMBER', 'ICS', 'HRMPSB Board Member / Senior Faculty', TRUE, FALSE, '2026-02-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-003', 'depthead.ics@nbsc.edu.ph', 'DeptPassword123!', 'Dr. Ana Reyes', 'DEPT_HEAD', 'ICS', 'Dean, Institute of Computer Studies', TRUE, FALSE, '2026-02-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-004', 'applicant@gmail.com', 'ApplicantPass123!', 'Carlo Mendoza', 'APPLICANT', NULL, NULL, TRUE, FALSE, '2026-08-20T14:30:00+08:00', '2026-08-20T14:30:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-005', 'employee.dgec@nbsc.edu.ph', 'EmpPassword123!', 'Liza Fernandez', 'EMPLOYEE', 'DGEC', 'Instructor I', TRUE, FALSE, '2026-03-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-006', 'employee.ibm@nbsc.edu.ph', 'EmpPassword123!', 'Mark Anthony Torres', 'EMPLOYEE', 'IBM', 'Associate Professor II', TRUE, FALSE, '2026-03-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-007', 'depthead.ite@nbsc.edu.ph', 'DeptPassword123!', 'Dr. Roberto Villanueva', 'DEPT_HEAD', 'ITE', 'Dean, Institute of Teacher Education', TRUE, FALSE, '2026-02-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, password_hash, full_name, role, department_code, position_title, is_active, requires_2fa, created_at, updated_at) VALUES ('usr-008', 'employee.fin@nbsc.edu.ph', 'EmpPassword123!', 'Grace Magbanua', 'EMPLOYEE', 'FIN', 'Administrative Officer III', TRUE, FALSE, '2026-04-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding programs (6 records)
INSERT INTO programs (id, code, name, department_code, department, description, level, is_active, created_at) VALUES ('prg-001', 'BSIT', 'Bachelor of Science in Information Technology', 'ICS', 'Institute of Computer Studies (ICS)', 'Focuses on enterprise cloud infrastructure, cybersecurity systems, and web architecture.', 'BACHELOR', TRUE, '2020-06-01T08:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO programs (id, code, name, department_code, department, description, level, is_active, created_at) VALUES ('prg-002', 'BSCS', 'Bachelor of Science in Computer Science', 'ICS', 'Institute of Computer Studies (ICS)', 'Deep specialization in algorithmic optimization, machine intelligence, and software engineering.', 'BACHELOR', TRUE, '2020-06-01T08:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO programs (id, code, name, department_code, department, description, level, is_active, created_at) VALUES ('prg-003', 'BSBA', 'Bachelor of Science in Business Administration', 'IBM', 'Institute of Business and Management (IBM)', 'Prepares leaders in fiscal governance, human capital logistics, and agribusiness commerce.', 'BACHELOR', TRUE, '2020-06-01T08:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO programs (id, code, name, department_code, department, description, level, is_active, created_at) VALUES ('prg-004', 'BEED', 'Bachelor of Elementary Education', 'ITE', 'Institute of Teacher Education (ITE)', 'Developmental pedagogy for foundational literacy, curriculum design, and primary education.', 'BACHELOR', TRUE, '2020-06-01T08:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO programs (id, code, name, department_code, department, description, level, is_active, created_at) VALUES ('prg-005', 'BSED', 'Bachelor of Secondary Education', 'ITE', 'Institute of Teacher Education (ITE)', 'Secondary teaching licensure tracks in Mathematics, Physical Sciences, and Social Studies.', 'BACHELOR', TRUE, '2020-06-01T08:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO programs (id, code, name, department_code, department, description, level, is_active, created_at) VALUES ('prg-006', 'DGEC-GE', 'General Education Core Curriculum', 'DGEC', 'Dept. of General Education (DGEC)', 'CHED-mandated foundational coursework in ethics, science, culture, and purposive communication.', 'SERVICE', TRUE, '2020-06-01T08:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding employees (8 records)
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-001', 'usr-005', 'NBSC-2023-0042', 'NBSC-2023-0042', 'Liza Fernandez, M.A.Ed.', 'employee.dgec@nbsc.edu.ph', 'DGEC', 'DGEC', 'Instructor I', 'Instructor I', 'TEACHING', 12, 1425.5, 31361, 'PERMANENT', '2023-06-15', '1990-03-22', '09171234567', 'Malaybalay City, Bukidnon', TRUE, '2023-06-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-002', 'usr-006', 'NBSC-2021-0018', 'NBSC-2021-0018', 'Mark Anthony Torres, MBA', 'employee.ibm@nbsc.edu.ph', 'IBM', 'IBM', 'Associate Professor II', 'Associate Professor II', 'TEACHING', 16, 1950, 42900, 'PERMANENT', '2021-01-10', '1985-11-08', '09189876543', 'Valencia City, Bukidnon', TRUE, '2021-01-10T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-003', 'usr-008', 'NBSC-2022-0031', 'NBSC-2022-0031', 'Roberto Gomez, CPA', 'roberto.gomez@nbsc.edu.ph', 'FIN', 'FIN', 'Administrative Officer III', 'Administrative Officer III', 'NON_TEACHING', 14, 1680, 36960, 'PERMANENT', '2022-07-01', '1988-05-14', '09201112233', 'Don Carlos, Bukidnon', TRUE, '2022-07-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-004', NULL, 'NBSC-2024-0055', 'NBSC-2024-0055', 'Engr. Danica Flores, MSCS', 'danica.flores@nbsc.edu.ph', 'ICS', 'ICS', 'Instructor I', 'Instructor I', 'TEACHING', 12, 1350, 29700, 'COS', '2024-08-01', '1995-09-30', '09334445566', 'Quezon, Bukidnon', TRUE, '2024-08-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-005', NULL, 'NBSC-2020-0009', 'NBSC-2020-0009', 'Dr. Eduardo Ramirez, Ph.D.', 'eduardo.ramirez@nbsc.edu.ph', 'ITE', 'ITE', 'Associate Professor I', 'Associate Professor I', 'TEACHING', 15, 1810, 39820, 'PERMANENT', '2020-06-01', '1982-12-01', '09456677889', 'Maramag, Bukidnon', TRUE, '2020-06-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-006', NULL, 'NBSC-2025-0061', 'NBSC-2025-0061', 'Maria Kristina Velasco', 'kristina.velasco@nbsc.edu.ph', 'REG', 'REG', 'Administrative Assistant II', 'Administrative Assistant II', 'NON_TEACHING', 8, 980, 21560, 'JOB_ORDER', '2025-01-15', '1997-07-19', '09567788990', 'Manolo Fortich, Bukidnon', TRUE, '2025-01-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-007', NULL, 'NBSC-2019-0005', 'NBSC-2019-0005', 'Prof. Armando Reyes, Ed.D.', 'armando.reyes@nbsc.edu.ph', 'DGEC', 'DGEC', 'Professor I', 'Professor I', 'TEACHING', 19, 2450, 53900, 'PERMANENT', '2019-06-01', '1978-02-28', '09678899001', 'Malaybalay City, Bukidnon', TRUE, '2019-06-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO employees (id, user_id, employee_id, employee_number, full_name, email, department, department_code, position, position_title, category, salary_grade, daily_rate, monthly_salary, employment_status, date_hired, date_of_birth, phone, address, is_active, created_at, updated_at) VALUES ('emp-008', NULL, 'NBSC-2023-0048', 'NBSC-2023-0048', 'Clarisse Joy Dizon', 'clarisse.dizon@nbsc.edu.ph', 'ADMIN', 'ADMIN', 'Administrative Aide IV', 'Administrative Aide IV', 'NON_TEACHING', 4, 650, 14300, 'TEMPORARY', '2023-09-01', '1999-04-10', '09789900112', 'Lantapan, Bukidnon', TRUE, '2023-09-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding vacancies (6 records)
INSERT INTO vacancies (id, title, department_code, department, category, salary_grade, monthly_salary, daily_rate, slots, employment_status, description, qualification_standards, status, applicant_count, posted_by, deadline, created_at, updated_at) VALUES ('vac-001', 'Instructor I (Computer Science)', 'ICS', 'Institute of Computer Studies (ICS)', 'TEACHING', 12, 29165, 1325.68, 2, 'Permanent (Plantilla)', 'Full-time teaching position for BS Computer Science program. Must teach core CS subjects including Data Structures, Algorithms, and Software Engineering.', '{"education":"Bachelor''s degree in Computer Science or Information Technology","experience":"1 year relevant teaching experience","training":"4 hours relevant training","eligibility":"RA 1080 (LET) or CSC Professional"}'::jsonb, 'OPEN', 3, 'usr-001', '2026-10-15', '2026-08-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO vacancies (id, title, department_code, department, category, salary_grade, monthly_salary, daily_rate, slots, employment_status, description, qualification_standards, status, applicant_count, posted_by, deadline, created_at, updated_at) VALUES ('vac-002', 'Instructor I (English & Purposive Comm)', 'DGEC', 'Dept. of General Education (DGEC)', 'TEACHING', 12, 29165, 1325.68, 1, 'Permanent (Plantilla)', 'Teaching position for General Education English courses including Purposive Communication and Technical Writing.', '{"education":"Bachelor''s degree in English, Literature, or Communication Arts","experience":"None required","training":"None required","eligibility":"RA 1080 (LET)"}'::jsonb, 'OPEN', 2, 'usr-001', '2026-10-30', '2026-08-20T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO vacancies (id, title, department_code, department, category, salary_grade, monthly_salary, daily_rate, slots, employment_status, description, qualification_standards, status, applicant_count, posted_by, deadline, created_at, updated_at) VALUES ('vac-003', 'Associate Professor I (Business Admin)', 'IBM', 'Institute of Business and Management (IBM)', 'TEACHING', 15, 36619, 1664.5, 1, 'Permanent (Plantilla)', 'Senior faculty position for BS Business Administration program specializing in Financial Management and Entrepreneurship.', '{"education":"Master''s degree in Business Administration or related field","experience":"3 years relevant teaching experience","training":"16 hours relevant training","eligibility":"RA 1080 (LET) or CSC Professional"}'::jsonb, 'DELIBERATION', 2, 'usr-001', '2026-11-15', '2026-08-25T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO vacancies (id, title, department_code, department, category, salary_grade, monthly_salary, daily_rate, slots, employment_status, description, qualification_standards, status, applicant_count, posted_by, deadline, created_at, updated_at) VALUES ('vac-004', 'Administrative Assistant III (President Office)', 'ADMIN', 'Administrative & General Support (ADMIN)', 'NON_TEACHING', 9, 21211, 964.14, 1, 'Permanent (Plantilla)', 'Administrative support position for the Office of the College President. Handles correspondence, scheduling, and records management.', '{"education":"Bachelor''s degree","experience":"1 year relevant experience","training":"4 hours relevant training","eligibility":"Career Service Professional / Second Level Eligibility"}'::jsonb, 'OPEN', 1, 'usr-001', '2026-10-20', '2026-08-28T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO vacancies (id, title, department_code, department, category, salary_grade, monthly_salary, daily_rate, slots, employment_status, description, qualification_standards, status, applicant_count, posted_by, deadline, created_at, updated_at) VALUES ('vac-005', 'Accountant II', 'FIN', 'Finance & Accounting Division (FIN)', 'NON_TEACHING', 15, 36619, 1664.5, 1, 'Permanent (Plantilla)', 'Accounting position responsible for budget preparation, financial reporting, and compliance with COA regulations.', '{"education":"Bachelor''s degree in Accountancy","experience":"2 years relevant experience","training":"8 hours relevant training","eligibility":"RA 1080 (CPA)"}'::jsonb, 'CLOSED', 1, 'usr-001', '2026-09-01', '2026-07-15T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO vacancies (id, title, department_code, department, category, salary_grade, monthly_salary, daily_rate, slots, employment_status, description, qualification_standards, status, applicant_count, posted_by, deadline, created_at, updated_at) VALUES ('vac-006', 'Instructor I (Elementary Education)', 'ITE', 'Institute of Teacher Education (ITE)', 'TEACHING', 12, 29165, 1325.68, 2, 'Permanent (Plantilla)', 'Teaching position for Bachelor of Elementary Education program. Focus on professional education and field study courses.', '{"education":"Bachelor''s degree in Elementary Education or related field","experience":"None required","training":"None required","eligibility":"RA 1080 (LET)"}'::jsonb, 'OPEN', 1, 'usr-001', '2026-11-01', '2026-09-01T08:00:00+08:00', '2026-09-01T10:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding applications (8 records)
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-001', 'NBSC-APP-2026-10011', 'usr-004', 'Dave Kevin M. Alcantara', 'dalcantara@example.com', 'vac-005', 'APPLIED', '{"full_name":"Dave Kevin M. Alcantara","email":"dalcantara@example.com","phone":"0917 555 0191","address":"Malaybalay City, Bukidnon","highest_education":"Master of Arts in Education","school":"Bukidnon State University","years_experience":"2 years elementary instruction","eligibility":"RA 1080 (LET)"}'::jsonb, '{"degree":"Master of Arts in Education","institution":"Bukidnon State University","year":2023}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Alcantara_PDS_2026.pdf","file_size":1450000,"verified":true},{"doc_type":"TRANSCRIPT_OF_RECORDS","file_name":"Alcantara_TOR.pdf","file_size":2200000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-08-25T09:00:00+08:00","remarks":"Application submitted via career portal."}]'::jsonb, '2026-08-25T09:00:00+08:00', '2026-08-25T09:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-002', 'NBSC-APP-2026-10042', 'usr-004', 'April Anne Elizabeth A. Bajao', 'applicant@gmail.com', 'vac-001', 'SCREENING', '{"full_name":"April Anne Elizabeth A. Bajao","email":"applicant@gmail.com","phone":"0917 555 0192","address":"Manolo Fortich, Bukidnon","highest_education":"MS in Information Technology","school":"University of Science and Technology of Southern Philippines","years_experience":"3 years full-stack development & tertiary instruction","eligibility":"RA 1080 / CS Professional"}'::jsonb, '{"degree":"MS in Information Technology","institution":"USTP","year":2024}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Bajao_PDS_2026.pdf","file_size":1480000,"verified":true},{"doc_type":"TRANSCRIPT_OF_RECORDS","file_name":"Bajao_TOR.pdf","file_size":2100000,"verified":true},{"doc_type":"ELIGIBILITY_CERT","file_name":"Bajao_CSP_Cert.pdf","file_size":890000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-08-20T14:30:00+08:00","remarks":"Online submission."},{"stage":"SCREENING","updated_at":"2026-08-22T10:00:00+08:00","remarks":"Passed initial Qualification Standards screening against CSC matrix."}]'::jsonb, '2026-08-20T14:30:00+08:00', '2026-08-22T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-003', 'NBSC-APP-2026-10088', 'usr-004', 'John Paul D. Tan', 'jptan@example.com', 'vac-002', 'DSS_SCORED', '{"full_name":"John Paul D. Tan","email":"jptan@example.com","phone":"0917 555 0193","address":"Cagayan de Oro City","highest_education":"Master in Business Administration","school":"Xavier University - Ateneo de Cagayan","years_experience":"4 years corporate banking and lecturing","eligibility":"RA 1080 / CS Professional"}'::jsonb, '{"degree":"Master in Business Administration","institution":"XU","year":2022}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Tan_PDS_2026.pdf","file_size":1520000,"verified":true},{"doc_type":"TRANSCRIPT_OF_RECORDS","file_name":"Tan_TOR.pdf","file_size":1980000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-08-15T11:00:00+08:00","remarks":"Submitted application."},{"stage":"SCREENING","updated_at":"2026-08-18T14:00:00+08:00","remarks":"QS verified compliant."},{"stage":"DSS_SCORED","updated_at":"2026-08-28T16:00:00+08:00","remarks":"4-Pillar Decision Support System score computed: 88.40/100."}]'::jsonb, '2026-08-15T11:00:00+08:00', '2026-08-28T16:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-004', 'NBSC-APP-2026-10103', 'usr-004', 'Maria Teresa C. Santos', 'msantos.candidate@example.com', 'vac-004', 'DEPT_EVALUATION', '{"full_name":"Maria Teresa C. Santos","email":"msantos.candidate@example.com","phone":"0917 555 0194","address":"Manolo Fortich, Bukidnon","highest_education":"BS in Office Administration","school":"Central Mindanao University","years_experience":"3 years public records management","eligibility":"Career Service Subprofessional"}'::jsonb, '{"degree":"BS in Office Administration","institution":"CMU","year":2021}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Santos_PDS_2026.pdf","file_size":1420000,"verified":true},{"doc_type":"CIVIL_SERVICE_ELIGIBILITY","file_name":"Santos_CSE.pdf","file_size":910000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-08-10T10:00:00+08:00","remarks":"Application filed."},{"stage":"SCREENING","updated_at":"2026-08-12T13:30:00+08:00","remarks":"Screening passed."},{"stage":"DSS_SCORED","updated_at":"2026-08-20T15:00:00+08:00","remarks":"DSS score 86.20."},{"stage":"DEPT_EVALUATION","updated_at":"2026-08-29T11:30:00+08:00","remarks":"Department Head rubric evaluation completed with 91.50% rating."}]'::jsonb, '2026-08-10T10:00:00+08:00', '2026-08-29T11:30:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-005', 'NBSC-APP-2026-10145', 'usr-004', 'Christian P. Villanueva', 'cvillanueva.candidate@example.com', 'vac-003', 'DELIBERATION', '{"full_name":"Christian P. Villanueva","email":"cvillanueva.candidate@example.com","phone":"0917 555 0195","address":"Valencia City, Bukidnon","highest_education":"Master of Arts in History","school":"University of the Philippines Diliman","years_experience":"3 years tertiary Philippine history teaching","eligibility":"RA 1080 / CS Professional"}'::jsonb, '{"degree":"Master of Arts in History","institution":"UP Diliman","year":2022}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Villanueva_PDS_2026.pdf","file_size":1620000,"verified":true},{"doc_type":"TEACHING_DEMO_RUBRIC","file_name":"Demo_Evaluation.pdf","file_size":780000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-08-01T09:00:00+08:00","remarks":"Filing confirmed."},{"stage":"SCREENING","updated_at":"2026-08-05T14:00:00+08:00","remarks":"QS approved."},{"stage":"DSS_SCORED","updated_at":"2026-08-15T16:00:00+08:00","remarks":"DSS score 92.10."},{"stage":"DEPT_EVALUATION","updated_at":"2026-08-22T10:00:00+08:00","remarks":"Dept evaluation: 94.00%."},{"stage":"DELIBERATION","updated_at":"2026-08-30T14:00:00+08:00","remarks":"HRMPSB Board deliberation conducted; consensus ranking: Rank 1."}]'::jsonb, '2026-08-01T09:00:00+08:00', '2026-08-30T14:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-006', 'NBSC-APP-2026-10179', 'usr-004', 'Elena R. Cruz', 'ecruz.candidate@example.com', 'vac-006', 'APPOINTMENT_ISSUED', '{"full_name":"Elena R. Cruz","email":"ecruz.candidate@example.com","phone":"0917 555 0196","address":"Malaybalay City, Bukidnon","highest_education":"BS in Accountancy (CPA)","school":"Ateneo de Davao University","years_experience":"5 years government financial disbursement","eligibility":"RA 1080 (Certified Public Accountant - CPA)"}'::jsonb, '{"degree":"BS in Accountancy (CPA)","institution":"ADDU","year":2019}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Cruz_PDS_2026.pdf","file_size":1550000,"verified":true},{"doc_type":"CPA_BOARD_RATING","file_name":"PRC_CPA_License.pdf","file_size":890000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-07-20T08:00:00+08:00","remarks":"Applied."},{"stage":"SCREENING","updated_at":"2026-07-25T11:00:00+08:00","remarks":"Screened."},{"stage":"DSS_SCORED","updated_at":"2026-08-05T15:00:00+08:00","remarks":"DSS scored: 90.40."},{"stage":"DEPT_EVALUATION","updated_at":"2026-08-12T14:00:00+08:00","remarks":"Dept eval: 93.00%."},{"stage":"DELIBERATION","updated_at":"2026-08-20T16:00:00+08:00","remarks":"HRMPSB approved Rank 1."},{"stage":"APPOINTMENT_ISSUED","updated_at":"2026-08-28T10:00:00+08:00","remarks":"Appointment resolution signed by College President; Block committed to Audit Chain."}]'::jsonb, '2026-07-20T08:00:00+08:00', '2026-08-28T10:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-007', 'NBSC-APP-2026-10204', 'usr-004', 'Mark Anthony L. Reyes', 'mreyes.candidate@example.com', 'vac-001', 'DOCUMENT_VERIFICATION', '{"full_name":"Mark Anthony L. Reyes","email":"mreyes.candidate@example.com","phone":"0917 555 0197","address":"Malaybalay City, Bukidnon","highest_education":"Master of Information Systems","school":"Mindanao State University - IIT","years_experience":"4 years database engineering","eligibility":"RA 1080 / CS Professional"}'::jsonb, '{"degree":"Master of Information Systems","institution":"MSU-IIT","year":2021}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Reyes_PDS_2026.pdf","file_size":1600000,"verified":true},{"doc_type":"NBI_CLEARANCE","file_name":"NBI_Clearance_2026.pdf","file_size":750000,"verified":true},{"doc_type":"MEDICAL_CERTIFICATE","file_name":"Medical_CS_Form_211.pdf","file_size":920000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-07-15T09:00:00+08:00","remarks":"Filed."},{"stage":"DELIBERATION","updated_at":"2026-08-15T15:00:00+08:00","remarks":"Deliberation cleared."},{"stage":"APPOINTMENT_ISSUED","updated_at":"2026-08-22T11:00:00+08:00","remarks":"Conditional appointment issued."},{"stage":"DOCUMENT_VERIFICATION","updated_at":"2026-08-31T14:00:00+08:00","remarks":"Medical clearance, NBI check, and notarized PDS verified."}]'::jsonb, '2026-07-15T09:00:00+08:00', '2026-08-31T14:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO applications (id, tracking_number, applicant_id, applicant_name, applicant_email, vacancy_id, stage, personal_info, education, documents, stage_history, created_at, updated_at) VALUES ('app-008', 'NBSC-APP-2026-10250', 'usr-004', 'Noreen Faye S. Esta', 'nesta.candidate@example.com', 'vac-002', 'ONBOARDED', '{"full_name":"Noreen Faye S. Esta","email":"nesta.candidate@example.com","phone":"0917 555 0198","address":"Manolo Fortich, Bukidnon","highest_education":"Ph.D. in Business Administration units earned","school":"University of San Carlos","years_experience":"5 years tertiary academic leadership","eligibility":"RA 1080 / CS Professional"}'::jsonb, '{"degree":"Ph.D. units earned / MBA","institution":"USC","year":2020}'::jsonb, '[{"doc_type":"PDS_CS_FORM_212","file_name":"Esta_PDS_2026.pdf","file_size":1540000,"verified":true},{"doc_type":"OATH_OF_OFFICE","file_name":"Oath_Of_Office_Signed.pdf","file_size":1100000,"verified":true}]'::jsonb, '[{"stage":"APPLIED","updated_at":"2026-06-10T09:00:00+08:00","remarks":"Filed."},{"stage":"DELIBERATION","updated_at":"2026-07-12T14:00:00+08:00","remarks":"Approved."},{"stage":"APPOINTMENT_ISSUED","updated_at":"2026-07-28T10:00:00+08:00","remarks":"Appointed."},{"stage":"DOCUMENT_VERIFICATION","updated_at":"2026-08-10T11:00:00+08:00","remarks":"Pre-employment compliance verified."},{"stage":"ONBOARDED","updated_at":"2026-08-18T08:30:00+08:00","remarks":"Plantilla induction completed; 201 Personnel file active and enrolled in payroll."}]'::jsonb, '2026-06-10T09:00:00+08:00', '2026-08-18T08:30:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding dss_scores (2 records)
INSERT INTO dss_scores (id, application_id, merit_score, competence_score, ethics_score, service_score, total_score, rank, qs_compliant, details, scored_by, created_at) VALUES ('dss-001', 'app-003', 26.5, 27, 17.5, 17.4, 88.4, 1, TRUE, '{"education_pts":14,"experience_pts":8.5,"training_pts":4}'::jsonb, 'usr-003', '2026-08-28T16:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO dss_scores (id, application_id, merit_score, competence_score, ethics_score, service_score, total_score, rank, qs_compliant, details, scored_by, created_at) VALUES ('dss-002', 'app-005', 28, 28.5, 18, 17.6, 92.1, 1, TRUE, '{"education_pts":15,"experience_pts":9,"training_pts":4}'::jsonb, 'usr-003', '2026-08-15T16:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding dept_head_evaluations (2 records)
INSERT INTO dept_head_evaluations (id, application_id, evaluator_id, evaluator_name, ratings, total_score, recommendation, remarks, created_at) VALUES ('dhe-001', 'app-004', 'usr-003', 'Dr. Ana Reyes', '{"technical_mastery":5,"instructional_clarity":4,"communication":5,"professionalism":5}'::jsonb, 91.5, 'STRONGLY_RECOMMEND', 'Demonstrated exceptional institutional record organization and technical competence.', '2026-08-29T11:30:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO dept_head_evaluations (id, application_id, evaluator_id, evaluator_name, ratings, total_score, recommendation, remarks, created_at) VALUES ('dhe-002', 'app-005', 'usr-003', 'Dr. Ana Reyes', '{"technical_mastery":5,"instructional_clarity":5,"communication":4,"professionalism":5}'::jsonb, 94, 'STRONGLY_RECOMMEND', 'Exceptional teaching demonstration on Philippine historiography and high student engagement.', '2026-08-22T10:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding deliberation_ballots (2 records)
INSERT INTO deliberation_ballots (id, application_id, voter_id, voter_name, vote, rank_priority, deliberation_notes, created_at) VALUES ('dlb-001', 'app-005', 'usr-002', 'Prof. Juan Dela Cruz', 'APPROVE', 1, 'Strong teaching demonstration and exemplary peer references.', '2026-08-30T14:15:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO deliberation_ballots (id, application_id, voter_id, voter_name, vote, rank_priority, deliberation_notes, created_at) VALUES ('dlb-002', 'app-005', 'usr-003', 'Dr. Ana Reyes', 'APPROVE', 1, 'Recommended for DGEC faculty plantilla with unanimous department backing.', '2026-08-30T14:20:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding hiring_decisions (1 records)
INSERT INTO hiring_decisions (id, application_id, decision, resolution_number, appointed_by, audit_block_index, audit_block_hash, created_at) VALUES ('dec-001', 'app-006', 'APPOINTED', 'BOR-RES-2026-089', 'usr-001', 5, 'd7f4a2189c4e09f58a719c8114f2e185038c92b23a1a9e88d6ef92a0134b210a', '2026-08-28T10:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding audit_blocks (6 records)
INSERT INTO audit_blocks (id, block_index, timestamp, action, actor_email, actor_role, target_id, data, previous_hash, hash) VALUES ('blk-000', 0, '2026-01-01T08:00:00+08:00', 'GENESIS', 'system@nbsc.edu.ph', 'SYSTEM', 'GENESIS-ROOT', '{"message":"NBSC PRIME-HRM Cryptographic Audit Ledger Initialized"}'::jsonb, '0000000000000000000000000000000000000000000000000000000000000000', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2') ON CONFLICT DO NOTHING;
INSERT INTO audit_blocks (id, block_index, timestamp, action, actor_email, actor_role, target_id, data, previous_hash, hash) VALUES ('blk-001', 1, '2026-08-15T08:30:00+08:00', 'VACANCY_CREATED', 'admin@nbsc.edu.ph', 'HR_ADMIN', 'vac-001', '{"vacancy_id":"vac-001","title":"Instructor I (Computer Science)","department":"ICS"}'::jsonb, 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3') ON CONFLICT DO NOTHING;
INSERT INTO audit_blocks (id, block_index, timestamp, action, actor_email, actor_role, target_id, data, previous_hash, hash) VALUES ('blk-002', 2, '2026-08-20T14:30:00+08:00', 'APPLICATION_SUBMITTED', 'applicant@gmail.com', 'APPLICANT', 'app-001', '{"application_id":"app-001","tracking_number":"NBSC-APP-2026-00001","vacancy_id":"vac-001"}'::jsonb, 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3', 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4') ON CONFLICT DO NOTHING;
INSERT INTO audit_blocks (id, block_index, timestamp, action, actor_email, actor_role, target_id, data, previous_hash, hash) VALUES ('blk-003', 3, '2026-08-25T11:00:00+08:00', 'DSS_SCORED', 'admin@nbsc.edu.ph', 'HR_ADMIN', 'app-001', '{"application_id":"app-001","composite_score":86.15,"rank":1}'::jsonb, 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4', 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5') ON CONFLICT DO NOTHING;
INSERT INTO audit_blocks (id, block_index, timestamp, action, actor_email, actor_role, target_id, data, previous_hash, hash) VALUES ('blk-004', 4, '2026-08-30T10:15:00+08:00', 'HRMPSB_DELIBERATION', 'board@nbsc.edu.ph', 'HRMPSB_MEMBER', 'app-001', '{"application_id":"app-001","vote":"APPROVE","resolution":"Certified compliant with CSC ORAOHRA standards"}'::jsonb, 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5', 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6') ON CONFLICT DO NOTHING;
INSERT INTO audit_blocks (id, block_index, timestamp, action, actor_email, actor_role, target_id, data, previous_hash, hash) VALUES ('blk-005', 5, '2026-09-01T14:00:00+08:00', 'HIRING_APPOINTED', 'admin@nbsc.edu.ph', 'HR_ADMIN', 'app-001', '{"application_id":"app-001","plantillano":"NBSC-PLANTILLA-2026-042","status":"CONFIRMED"}'::jsonb, 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6', 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7') ON CONFLICT DO NOTHING;

-- Seeding payroll_batches (2 records)
INSERT INTO payroll_batches (id, batch_id, period_label, start_date, end_date, department, employee_count, total_gross, total_deductions, total_net, status, uploaded_by, audit_block_hash, processed_at, created_at) VALUES ('batch-2026-08-b', 'PR-2026-08-B', 'August 16–31, 2026', '2026-08-16', '2026-08-31', 'ALL', 8, 248600, 32450, 216150, 'PROCESSED', 'admin@nbsc.edu.ph', 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5', '2026-08-31T17:00:00+08:00', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payroll_batches (id, batch_id, period_label, start_date, end_date, department, employee_count, total_gross, total_deductions, total_net, status, uploaded_by, audit_block_hash, processed_at, created_at) VALUES ('batch-2026-08-a', 'PR-2026-08-A', 'August 01–15, 2026', '2026-08-16', '2026-08-31', 'ALL', 8, 248600, 32450, 216150, 'DISTRIBUTED', 'admin@nbsc.edu.ph', 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6', NULL, NULL) ON CONFLICT DO NOTHING;

-- Seeding payslips (11 records)
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-001', 'batch-2026-08-b', 'NBSC-2023-0042', 'Liza Fernandez, M.A.Ed.', 'DGEC', NULL, 12, NULL, '1990-01-01', NULL, 1000, 31361, 0, 0, 100, 0, NULL, 27284.07, 'Payslip_NBSC-2023-0042_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2023-0042.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-002', 'batch-2026-08-b', 'NBSC-2022-0018', 'Engr. Carlos Mendoza', 'ICS', NULL, 12, NULL, '1990-01-01', NULL, 1000, 38400, 0, 0, 100, 0, NULL, 32208, 'Payslip_NBSC-2022-0018_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2022-0018.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-003', 'batch-2026-08-b', 'NBSC-2021-0012', 'Mark Anthony Torres', 'IBM', NULL, 12, NULL, '1990-01-01', NULL, 1000, 42000, 0, 0, 100, 0, NULL, 34690, 'Payslip_NBSC-2021-0012_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2021-0012.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-004', 'batch-2026-08-b', 'NBSC-2020-0008', 'Dr. Roberto Villanueva', 'ITE', NULL, 12, NULL, '1990-01-01', NULL, 1000, 48500, 0, 0, 100, 0, NULL, 38995, 'Payslip_NBSC-2020-0008_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2020-0008.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-005', 'batch-2026-08-b', 'NBSC-2024-0055', 'Grace Magbanua, CPA', 'FIN', NULL, 12, NULL, '1990-01-01', NULL, 1000, 36619, 0, 0, 100, 0, NULL, 30758.53, 'Payslip_NBSC-2024-0055_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2024-0055.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-006', 'batch-2026-08-b', 'NBSC-2025-0061', 'Maria Kristina Velasco', 'REG', NULL, 12, NULL, '1990-01-01', NULL, 1000, 19600, 0, 0, 100, 0, NULL, 17052, 'Payslip_NBSC-2025-0061_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2025-0061.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-007', 'batch-2026-08-b', 'NBSC-2019-0005', 'Prof. Armando Reyes, Ed.D.', 'DGEC', NULL, 12, NULL, '1990-01-01', NULL, 1000, 49000, 0, 0, 100, 0, NULL, 39230, 'Payslip_NBSC-2019-0005_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2019-0005.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-008', 'batch-2026-08-b', 'NBSC-2023-0048', 'Clarisse Joy Dizon', 'ADMIN', NULL, 12, NULL, '1990-01-01', NULL, 1000, 13000, 0, 0, 100, 0, NULL, 11310, 'Payslip_NBSC-2023-0048_PR-2026-08-B.pdf', 'media/payslips/PR-2026-08-B/NBSC-2023-0048.pdf', '2026-08-31T17:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-009', 'batch-2026-08-a', 'NBSC-2023-0042', 'Liza Fernandez, M.A.Ed.', 'DGEC', NULL, 12, NULL, '1990-01-01', NULL, 1000, 31361, 0, 0, 100, 0, NULL, 27284.07, 'Payslip_NBSC-2023-0042_PR-2026-08-A.pdf', 'media/payslips/PR-2026-08-A/NBSC-2023-0042.pdf', NULL) ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-010', 'batch-2026-08-a', 'NBSC-2022-0018', 'Engr. Carlos Mendoza', 'ICS', NULL, 12, NULL, '1990-01-01', NULL, 1000, 38400, 0, 0, 100, 0, NULL, 32208, 'Payslip_NBSC-2022-0018_PR-2026-08-A.pdf', 'media/payslips/PR-2026-08-A/NBSC-2022-0018.pdf', NULL) ON CONFLICT DO NOTHING;
INSERT INTO payslips (id, batch_id, employee_id, full_name, department, position, salary_grade, email, date_of_birth, basic_pay, pera, gross_pay, gsis, philhealth, pagibig, withholding_tax, total_deductions, net_pay, encrypted_pdf_filename, encrypted_pdf_path, created_at) VALUES ('pslip-011', 'batch-2026-08-a', 'NBSC-2021-0012', 'Mark Anthony Torres', 'IBM', NULL, 12, NULL, '1990-01-01', NULL, 1000, 42000, 0, 0, 100, 0, NULL, 34690, 'Payslip_NBSC-2021-0012_PR-2026-08-A.pdf', 'media/payslips/PR-2026-08-A/NBSC-2021-0012.pdf', NULL) ON CONFLICT DO NOTHING;

-- Seeding notifications (4 records)
INSERT INTO notifications (id, recipient_email, recipient_id, title, message, category, target_link, is_read, created_at) VALUES ('ntf-001', 'admin@nbsc.edu.ph', 'usr-001', 'New Application Received', 'Carlo Mendoza submitted an application for Instructor I (Computer Science) — ICS.', 'APPLICATION_STAGE', '/pages/hiring/hiring-pipeline/hiring-pipeline.html', FALSE, '2026-08-20T14:30:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO notifications (id, recipient_email, recipient_id, title, message, category, target_link, is_read, created_at) VALUES ('ntf-002', 'admin@nbsc.edu.ph', 'usr-002', 'Deliberation Request', 'Vacancy "Instructor I (Computer Science)" has 3 applicants ready for HRMPSB deliberation.', 'EVALUATION_REQUEST', '/pages/hiring/deliberation/deliberation.html', FALSE, '2026-08-26T09:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO notifications (id, recipient_email, recipient_id, title, message, category, target_link, is_read, created_at) VALUES ('ntf-003', 'admin@nbsc.edu.ph', 'usr-003', 'Evaluation Required', 'Please submit your Department Head evaluation for applicant Carlo Mendoza (ICS position).', 'EVALUATION_REQUEST', '/pages/hiring/evaluation/evaluation.html', TRUE, '2026-08-25T11:30:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO notifications (id, recipient_email, recipient_id, title, message, category, target_link, is_read, created_at) VALUES ('ntf-004', 'admin@nbsc.edu.ph', 'usr-001', 'System Update', 'PRIME-HRM Intelligence Hub v2.0 has been deployed with SARA AI Assistant and 4-Pillar DSS Engine.', 'SYSTEM', NULL, TRUE, '2026-09-01T08:00:00+08:00') ON CONFLICT DO NOTHING;

-- Seeding settings (3 records)
INSERT INTO settings (id, key, value, updated_by, updated_at) VALUES ('set-001', 'dss_weights', '{"merit":30,"competence":30,"ethics":20,"service":20}'::jsonb, 'usr-001', '2026-01-15T08:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO settings (id, key, value, updated_by, updated_at) VALUES ('set-002', 'institution_info', '{"name":"Northern Bukidnon State College","abbreviation":"NBSC","address":"Malaybalay City, Bukidnon 8700","president":"Dr. Maria Santos","website":"https://nbsc.edu.ph"}'::jsonb, 'usr-001', '2026-01-15T08:00:00+08:00') ON CONFLICT DO NOTHING;
INSERT INTO settings (id, key, value, updated_by, updated_at) VALUES ('set-003', 'payslip_password_formula', '{"pattern":"last4_of_employee_id + MMDDYYYY_of_DOB","example":"004203221990"}'::jsonb, 'usr-001', '2026-01-15T08:00:00+08:00') ON CONFLICT DO NOTHING;

COMMIT;

-- Database seeding completed successfully.
