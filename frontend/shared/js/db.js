/**
 * NBSC PRIME-HRM Intelligence Hub — Frontend JSON Data Store (PostgreSQL-Ready)
 *
 * A localStorage-backed CRUD engine where every "table" is a JSON array
 * structured to mirror a PostgreSQL relational schema. When migrating to
 * a real database, each table maps 1-to-1 to a CREATE TABLE statement.
 *
 * Usage:
 *   const db = new NbscDB();
 *   db.init();
 *   const user = db.findOne('users', u => u.email === 'admin@nbsc.edu.ph');
 */

/* ═══════════════════════════════════════════════════════════
   SEED DATA — Mirrors PostgreSQL table schemas
   ═══════════════════════════════════════════════════════════ */

const DB_SEED = {
  /**
   * users table
   * PostgreSQL: CREATE TABLE users (
   *   id UUID PRIMARY KEY,
   *   email VARCHAR(255) UNIQUE NOT NULL,
   *   password VARCHAR(255) NOT NULL,
   *   full_name VARCHAR(255) NOT NULL,
   *   role VARCHAR(50) NOT NULL,
   *   department_code VARCHAR(10),
   *   position_title VARCHAR(255),
   *   is_active BOOLEAN DEFAULT true,
   *   requires_2fa BOOLEAN DEFAULT false,
   *   created_at TIMESTAMPTZ DEFAULT NOW(),
   *   updated_at TIMESTAMPTZ DEFAULT NOW()
   * );
   */
  users: [
    {
      id: 'usr-001',
      email: 'admin@nbsc.edu.ph',
      password: 'AdminPassword123!',
      password_hash: 'AdminPassword123!',
      full_name: 'Dr. Maria Santos',
      role: 'HR_ADMIN',
      department_code: 'ADMIN',
      position_title: 'HR Director / College President',
      is_active: true,
      requires_2fa: false,
      created_at: '2026-01-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'usr-002',
      email: 'hrmpsb@nbsc.edu.ph',
      password: 'MemberPassword123!',
      password_hash: 'MemberPassword123!',
      full_name: 'Prof. Juan Dela Cruz',
      role: 'HRMPSB_MEMBER',
      department_code: 'ICS',
      position_title: 'HRMPSB Board Member / Senior Faculty',
      is_active: true,
      requires_2fa: false,
      created_at: '2026-02-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'usr-003',
      email: 'depthead.ics@nbsc.edu.ph',
      password: 'DeptPassword123!',
      password_hash: 'DeptPassword123!',
      full_name: 'Dr. Ana Reyes',
      role: 'DEPT_HEAD',
      department_code: 'ICS',
      position_title: 'Dean, Institute of Computer Studies',
      is_active: true,
      requires_2fa: false,
      created_at: '2026-02-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'usr-004',
      email: 'applicant@gmail.com',
      password: 'ApplicantPass123!',
      password_hash: 'ApplicantPass123!',
      full_name: 'Carlo Mendoza',
      role: 'APPLICANT',
      department_code: null,
      position_title: null,
      is_active: true,
      requires_2fa: false,
      created_at: '2026-08-20T14:30:00+08:00',
      updated_at: '2026-08-20T14:30:00+08:00'
    },
    {
      id: 'usr-005',
      email: 'employee.dgec@nbsc.edu.ph',
      password: 'EmpPassword123!',
      password_hash: 'EmpPassword123!',
      full_name: 'Liza Fernandez',
      role: 'EMPLOYEE',
      department_code: 'DGEC',
      position_title: 'Instructor I',
      is_active: true,
      requires_2fa: false,
      created_at: '2026-03-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'usr-006',
      email: 'employee.ibm@nbsc.edu.ph',
      password: 'EmpPassword123!',
      password_hash: 'EmpPassword123!',
      full_name: 'Mark Anthony Torres',
      role: 'EMPLOYEE',
      department_code: 'IBM',
      position_title: 'Associate Professor II',
      is_active: true,
      requires_2fa: false,
      created_at: '2026-03-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'usr-007',
      email: 'depthead.ite@nbsc.edu.ph',
      password: 'DeptPassword123!',
      password_hash: 'DeptPassword123!',
      full_name: 'Dr. Roberto Villanueva',
      role: 'DEPT_HEAD',
      department_code: 'ITE',
      position_title: 'Dean, Institute of Teacher Education',
      is_active: true,
      requires_2fa: false,
      created_at: '2026-02-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'usr-008',
      email: 'employee.fin@nbsc.edu.ph',
      password: 'EmpPassword123!',
      password_hash: 'EmpPassword123!',
      full_name: 'Grace Magbanua',
      role: 'EMPLOYEE',
      department_code: 'FIN',
      position_title: 'Administrative Officer III',
      is_active: true,
      requires_2fa: false,
      created_at: '2026-04-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    }
  ],

  /**
   * sessions table
   * PostgreSQL: CREATE TABLE sessions (
   *   id UUID PRIMARY KEY,
   *   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
   *   token VARCHAR(512) UNIQUE NOT NULL,
   *   created_at TIMESTAMPTZ DEFAULT NOW(),
   *   expires_at TIMESTAMPTZ NOT NULL
   * );
   */
  sessions: [],

  /**
   * employees table
   * PostgreSQL: CREATE TABLE employees (
   *   id UUID PRIMARY KEY,
   *   user_id UUID REFERENCES users(id),
   *   employee_number VARCHAR(20) UNIQUE NOT NULL,
   *   department_code VARCHAR(10) NOT NULL,
   *   position_title VARCHAR(255),
   *   salary_grade INTEGER,
   *   employment_status VARCHAR(50),
   *   date_hired DATE,
   *   date_of_birth DATE,
   *   phone VARCHAR(20),
   *   address TEXT,
   *   is_active BOOLEAN DEFAULT true,
   *   created_at TIMESTAMPTZ DEFAULT NOW(),
   *   updated_at TIMESTAMPTZ DEFAULT NOW()
   * );
   */
  employees: [
    {
      id: 'emp-001',
      user_id: 'usr-005',
      employee_id: 'NBSC-2023-0042',
      employee_number: 'NBSC-2023-0042',
      full_name: 'Liza Fernandez, M.A.Ed.',
      email: 'employee.dgec@nbsc.edu.ph',
      department: 'DGEC',
      department_code: 'DGEC',
      position: 'Instructor I',
      position_title: 'Instructor I',
      category: 'TEACHING',
      salary_grade: 12,
      daily_rate: 1425.50,
      employment_status: 'PERMANENT',
      date_hired: '2023-06-15',
      date_of_birth: '1990-03-22',
      phone: '09171234567',
      address: 'Malaybalay City, Bukidnon',
      is_active: true,
      created_at: '2023-06-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'emp-002',
      user_id: 'usr-006',
      employee_id: 'NBSC-2021-0018',
      employee_number: 'NBSC-2021-0018',
      full_name: 'Mark Anthony Torres, MBA',
      email: 'employee.ibm@nbsc.edu.ph',
      department: 'IBM',
      department_code: 'IBM',
      position: 'Associate Professor II',
      position_title: 'Associate Professor II',
      category: 'TEACHING',
      salary_grade: 16,
      daily_rate: 1950.00,
      employment_status: 'PERMANENT',
      date_hired: '2021-01-10',
      date_of_birth: '1985-11-08',
      phone: '09189876543',
      address: 'Valencia City, Bukidnon',
      is_active: true,
      created_at: '2021-01-10T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'emp-003',
      user_id: 'usr-008',
      employee_id: 'NBSC-2022-0031',
      employee_number: 'NBSC-2022-0031',
      full_name: 'Roberto Gomez, CPA',
      email: 'roberto.gomez@nbsc.edu.ph',
      department: 'FIN',
      department_code: 'FIN',
      position: 'Administrative Officer III',
      position_title: 'Administrative Officer III',
      category: 'NON_TEACHING',
      salary_grade: 14,
      daily_rate: 1680.00,
      employment_status: 'PERMANENT',
      date_hired: '2022-07-01',
      date_of_birth: '1988-05-14',
      phone: '09201112233',
      address: 'Don Carlos, Bukidnon',
      is_active: true,
      created_at: '2022-07-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'emp-004',
      user_id: null,
      employee_id: 'NBSC-2024-0055',
      employee_number: 'NBSC-2024-0055',
      full_name: 'Engr. Danica Flores, MSCS',
      email: 'danica.flores@nbsc.edu.ph',
      department: 'ICS',
      department_code: 'ICS',
      position: 'Instructor I',
      position_title: 'Instructor I',
      category: 'TEACHING',
      salary_grade: 12,
      daily_rate: 1350.00,
      employment_status: 'COS',
      date_hired: '2024-08-01',
      date_of_birth: '1995-09-30',
      phone: '09334445566',
      address: 'Quezon, Bukidnon',
      is_active: true,
      created_at: '2024-08-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'emp-005',
      user_id: null,
      employee_id: 'NBSC-2020-0009',
      employee_number: 'NBSC-2020-0009',
      full_name: 'Dr. Eduardo Ramirez, Ph.D.',
      email: 'eduardo.ramirez@nbsc.edu.ph',
      department: 'ITE',
      department_code: 'ITE',
      position: 'Associate Professor I',
      position_title: 'Associate Professor I',
      category: 'TEACHING',
      salary_grade: 15,
      daily_rate: 1810.00,
      employment_status: 'PERMANENT',
      date_hired: '2020-06-01',
      date_of_birth: '1982-12-01',
      phone: '09456677889',
      address: 'Maramag, Bukidnon',
      is_active: true,
      created_at: '2020-06-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'emp-006',
      user_id: null,
      employee_id: 'NBSC-2025-0061',
      employee_number: 'NBSC-2025-0061',
      full_name: 'Maria Kristina Velasco',
      email: 'kristina.velasco@nbsc.edu.ph',
      department: 'REG',
      department_code: 'REG',
      position: 'Administrative Assistant II',
      position_title: 'Administrative Assistant II',
      category: 'NON_TEACHING',
      salary_grade: 8,
      daily_rate: 980.00,
      employment_status: 'JOB_ORDER',
      date_hired: '2025-01-15',
      date_of_birth: '1997-07-19',
      phone: '09567788990',
      address: 'Manolo Fortich, Bukidnon',
      is_active: true,
      created_at: '2025-01-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'emp-007',
      user_id: null,
      employee_id: 'NBSC-2019-0005',
      employee_number: 'NBSC-2019-0005',
      full_name: 'Prof. Armando Reyes, Ed.D.',
      email: 'armando.reyes@nbsc.edu.ph',
      department: 'DGEC',
      department_code: 'DGEC',
      position: 'Professor I',
      position_title: 'Professor I',
      category: 'TEACHING',
      salary_grade: 19,
      daily_rate: 2450.00,
      employment_status: 'PERMANENT',
      date_hired: '2019-06-01',
      date_of_birth: '1978-02-28',
      phone: '09678899001',
      address: 'Malaybalay City, Bukidnon',
      is_active: true,
      created_at: '2019-06-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'emp-008',
      user_id: null,
      employee_id: 'NBSC-2023-0048',
      employee_number: 'NBSC-2023-0048',
      full_name: 'Clarisse Joy Dizon',
      email: 'clarisse.dizon@nbsc.edu.ph',
      department: 'ADMIN',
      department_code: 'ADMIN',
      position: 'Administrative Aide IV',
      position_title: 'Administrative Aide IV',
      category: 'NON_TEACHING',
      salary_grade: 4,
      daily_rate: 650.00,
      employment_status: 'TEMPORARY',
      date_hired: '2023-09-01',
      date_of_birth: '1999-04-10',
      phone: '09789900112',
      address: 'Lantapan, Bukidnon',
      is_active: true,
      created_at: '2023-09-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    }
  ],

  /**
   * vacancies table
   * PostgreSQL: CREATE TABLE vacancies (
   *   id UUID PRIMARY KEY,
   *   title VARCHAR(255) NOT NULL,
   *   department_code VARCHAR(10) NOT NULL,
   *   category VARCHAR(50) NOT NULL,
   *   salary_grade INTEGER,
   *   description TEXT,
   *   qualification_standards JSONB,
   *   status VARCHAR(20) DEFAULT 'OPEN',
   *   applicant_count INTEGER DEFAULT 0,
   *   posted_by UUID REFERENCES users(id),
   *   deadline DATE,
   *   created_at TIMESTAMPTZ DEFAULT NOW(),
   *   updated_at TIMESTAMPTZ DEFAULT NOW()
   * );
   */
  vacancies: [
    {
      id: 'vac-001',
      title: 'Instructor I (Computer Science)',
      department_code: 'ICS',
      department: 'Institute of Computer Studies (ICS)',
      category: 'TEACHING',
      salary_grade: 12,
      monthly_salary: 29165.00,
      slots: 2,
      employment_status: 'Permanent (Plantilla)',
      description: 'Full-time teaching position for BS Computer Science program. Must teach core CS subjects including Data Structures, Algorithms, and Software Engineering.',
      qualification_standards: {
        education: "Bachelor's degree in Computer Science or Information Technology",
        experience: '1 year relevant teaching experience',
        training: '4 hours relevant training',
        eligibility: 'RA 1080 (LET) or CSC Professional'
      },
      status: 'OPEN',
      applicant_count: 3,
      posted_by: 'usr-001',
      deadline: '2026-10-15',
      created_at: '2026-08-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'vac-002',
      title: 'Instructor I (English & Purposive Comm)',
      department_code: 'DGEC',
      department: 'Dept. of General Education (DGEC)',
      category: 'TEACHING',
      salary_grade: 12,
      monthly_salary: 29165.00,
      slots: 1,
      employment_status: 'Permanent (Plantilla)',
      description: 'Teaching position for General Education English courses including Purposive Communication and Technical Writing.',
      qualification_standards: {
        education: "Bachelor's degree in English, Literature, or Communication Arts",
        experience: 'None required',
        training: 'None required',
        eligibility: 'RA 1080 (LET)'
      },
      status: 'OPEN',
      applicant_count: 2,
      posted_by: 'usr-001',
      deadline: '2026-10-30',
      created_at: '2026-08-20T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'vac-003',
      title: 'Associate Professor I (Business Admin)',
      department_code: 'IBM',
      department: 'Institute of Business and Management (IBM)',
      category: 'TEACHING',
      salary_grade: 15,
      monthly_salary: 36619.00,
      slots: 1,
      employment_status: 'Permanent (Plantilla)',
      description: 'Senior faculty position for BS Business Administration program specializing in Financial Management and Entrepreneurship.',
      qualification_standards: {
        education: "Master's degree in Business Administration or related field",
        experience: '3 years relevant teaching experience',
        training: '16 hours relevant training',
        eligibility: 'RA 1080 (LET) or CSC Professional'
      },
      status: 'DELIBERATION',
      applicant_count: 2,
      posted_by: 'usr-001',
      deadline: '2026-11-15',
      created_at: '2026-08-25T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'vac-004',
      title: 'Administrative Assistant III (President Office)',
      department_code: 'ADMIN',
      department: 'Administrative & General Support (ADMIN)',
      category: 'NON_TEACHING',
      salary_grade: 9,
      monthly_salary: 21211.00,
      slots: 1,
      employment_status: 'Permanent (Plantilla)',
      description: 'Administrative support position for the Office of the College President. Handles correspondence, scheduling, and records management.',
      qualification_standards: {
        education: "Bachelor's degree",
        experience: '1 year relevant experience',
        training: '4 hours relevant training',
        eligibility: 'Career Service Professional / Second Level Eligibility'
      },
      status: 'OPEN',
      applicant_count: 1,
      posted_by: 'usr-001',
      deadline: '2026-10-20',
      created_at: '2026-08-28T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'vac-005',
      title: 'Accountant II',
      department_code: 'FIN',
      department: 'Finance & Accounting Division (FIN)',
      category: 'NON_TEACHING',
      salary_grade: 15,
      monthly_salary: 36619.00,
      slots: 1,
      employment_status: 'Permanent (Plantilla)',
      description: 'Accounting position responsible for budget preparation, financial reporting, and compliance with COA regulations.',
      qualification_standards: {
        education: "Bachelor's degree in Accountancy",
        experience: '2 years relevant experience',
        training: '8 hours relevant training',
        eligibility: 'RA 1080 (CPA)'
      },
      status: 'CLOSED',
      applicant_count: 1,
      posted_by: 'usr-001',
      deadline: '2026-09-01',
      created_at: '2026-07-15T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    },
    {
      id: 'vac-006',
      title: 'Instructor I (Elementary Education)',
      department_code: 'ITE',
      department: 'Institute of Teacher Education (ITE)',
      category: 'TEACHING',
      salary_grade: 12,
      monthly_salary: 29165.00,
      slots: 2,
      employment_status: 'Permanent (Plantilla)',
      description: 'Teaching position for Bachelor of Elementary Education program. Focus on professional education and field study courses.',
      qualification_standards: {
        education: "Bachelor's degree in Elementary Education or related field",
        experience: 'None required',
        training: 'None required',
        eligibility: 'RA 1080 (LET)'
      },
      status: 'OPEN',
      applicant_count: 1,
      posted_by: 'usr-001',
      deadline: '2026-11-01',
      created_at: '2026-09-01T08:00:00+08:00',
      updated_at: '2026-09-01T10:00:00+08:00'
    }
  ],

  /**
   * applications table
   * PostgreSQL: CREATE TABLE applications (
   *   id UUID PRIMARY KEY,
   *   tracking_number VARCHAR(20) UNIQUE NOT NULL,
   *   applicant_id UUID REFERENCES users(id),
   *   vacancy_id UUID REFERENCES vacancies(id),
   *   stage VARCHAR(50) NOT NULL DEFAULT 'APPLIED',
   *   personal_info JSONB,
   *   education JSONB,
   *   documents JSONB,
   *   stage_history JSONB DEFAULT '[]',
   *   created_at TIMESTAMPTZ DEFAULT NOW(),
   *   updated_at TIMESTAMPTZ DEFAULT NOW()
   * );
   */
  applications: [
    {
      id: 'app-001',
      tracking_number: 'NBSC-APP-2026-00001',
      applicant_id: 'usr-004',
      applicant_name: 'Carlo Mendoza',
      vacancy_id: 'vac-001',
      stage: 'DSS_SCORED',
      personal_info: { full_name: 'Carlo Mendoza', email: 'applicant@gmail.com', phone: '09171234567' },
      education: { degree: 'BS Computer Science', school: 'MSU-IIT', year_graduated: 2024 },
      documents: [
        { name: 'PDS.pdf', type: 'application/pdf', size: 245760, uploaded_at: '2026-08-20T14:30:00+08:00' },
        { name: 'TOR.pdf', type: 'application/pdf', size: 189440, uploaded_at: '2026-08-20T14:32:00+08:00' }
      ],
      stage_history: [
        { stage: 'APPLIED', timestamp: '2026-08-20T14:30:00+08:00', actor: 'applicant@gmail.com' },
        { stage: 'SCREENING', timestamp: '2026-08-22T09:00:00+08:00', actor: 'admin@nbsc.edu.ph' },
        { stage: 'DSS_SCORED', timestamp: '2026-08-25T11:00:00+08:00', actor: 'admin@nbsc.edu.ph' }
      ],
      created_at: '2026-08-20T14:30:00+08:00',
      updated_at: '2026-08-25T11:00:00+08:00'
    },
    {
      id: 'app-002',
      tracking_number: 'NBSC-APP-2026-00002',
      applicant_id: 'usr-009',
      applicant_name: 'Maria Elena Cruz, MBA',
      vacancy_id: 'vac-003',
      stage: 'DELIBERATION',
      personal_info: { full_name: 'Maria Elena Cruz, MBA', email: 'elena.cruz@gmail.com', phone: '09283344556' },
      education: { degree: 'Master in Business Administration', school: 'Ateneo de Cagayan', year_graduated: 2021 },
      documents: [
        { name: 'PDS_Signed.pdf', type: 'application/pdf', size: 312000, uploaded_at: '2026-08-26T10:00:00+08:00' }
      ],
      stage_history: [
        { stage: 'APPLIED', timestamp: '2026-08-26T10:00:00+08:00', actor: 'elena.cruz@gmail.com' },
        { stage: 'SCREENING', timestamp: '2026-08-27T08:30:00+08:00', actor: 'admin@nbsc.edu.ph' },
        { stage: 'DSS_SCORED', timestamp: '2026-08-28T14:00:00+08:00', actor: 'admin@nbsc.edu.ph' },
        { stage: 'DEPT_EVAL', timestamp: '2026-08-29T16:00:00+08:00', actor: 'depthead.ibm@nbsc.edu.ph' },
        { stage: 'DELIBERATION', timestamp: '2026-09-01T09:00:00+08:00', actor: 'admin@nbsc.edu.ph' }
      ],
      created_at: '2026-08-26T10:00:00+08:00',
      updated_at: '2026-09-01T09:00:00+08:00'
    },
    {
      id: 'app-003',
      tracking_number: 'NBSC-APP-2026-00003',
      applicant_id: 'usr-010',
      applicant_name: 'John Patrick Reyes',
      vacancy_id: 'vac-001',
      stage: 'SCREENING',
      personal_info: { full_name: 'John Patrick Reyes', email: 'john.reyes@yahoo.com', phone: '09395566778' },
      education: { degree: 'BS Information Technology', school: 'USTP', year_graduated: 2023 },
      documents: [
        { name: 'PDS_2026.pdf', type: 'application/pdf', size: 280000, uploaded_at: '2026-08-28T11:20:00+08:00' }
      ],
      stage_history: [
        { stage: 'APPLIED', timestamp: '2026-08-28T11:20:00+08:00', actor: 'john.reyes@yahoo.com' },
        { stage: 'SCREENING', timestamp: '2026-08-30T10:15:00+08:00', actor: 'admin@nbsc.edu.ph' }
      ],
      created_at: '2026-08-28T11:20:00+08:00',
      updated_at: '2026-08-30T10:15:00+08:00'
    },
    {
      id: 'app-004',
      tracking_number: 'NBSC-APP-2026-00004',
      applicant_id: 'usr-011',
      applicant_name: 'Sarah May Alcantara, LPT',
      vacancy_id: 'vac-002',
      stage: 'DEPT_EVAL',
      personal_info: { full_name: 'Sarah May Alcantara, LPT', email: 'sarah.alcantara@gmail.com', phone: '09456677889' },
      education: { degree: 'BSEd English', school: 'BukSU', year_graduated: 2022 },
      documents: [
        { name: 'PDS.pdf', type: 'application/pdf', size: 290000, uploaded_at: '2026-08-29T14:40:00+08:00' }
      ],
      stage_history: [
        { stage: 'APPLIED', timestamp: '2026-08-29T14:40:00+08:00', actor: 'sarah.alcantara@gmail.com' },
        { stage: 'SCREENING', timestamp: '2026-08-31T09:00:00+08:00', actor: 'admin@nbsc.edu.ph' },
        { stage: 'DSS_SCORED', timestamp: '2026-09-01T13:30:00+08:00', actor: 'admin@nbsc.edu.ph' },
        { stage: 'DEPT_EVAL', timestamp: '2026-09-02T10:00:00+08:00', actor: 'depthead.dgec@nbsc.edu.ph' }
      ],
      created_at: '2026-08-29T14:40:00+08:00',
      updated_at: '2026-09-02T10:00:00+08:00'
    },
    {
      id: 'app-005',
      tracking_number: 'NBSC-APP-2026-00005',
      applicant_id: 'usr-012',
      applicant_name: 'Mark Lawrence Diaz',
      vacancy_id: 'vac-004',
      stage: 'FINAL_DECISION',
      personal_info: { full_name: 'Mark Lawrence Diaz', email: 'mark.diaz@gmail.com', phone: '09567788990' },
      education: { degree: 'BS Public Administration', school: 'Central Mindanao University', year_graduated: 2020 },
      documents: [
        { name: 'PDS_Certified.pdf', type: 'application/pdf', size: 340000, uploaded_at: '2026-08-25T09:00:00+08:00' }
      ],
      stage_history: [
        { stage: 'APPLIED', timestamp: '2026-08-25T09:00:00+08:00', actor: 'mark.diaz@gmail.com' },
        { stage: 'SCREENING', timestamp: '2026-08-26T11:00:00+08:00', actor: 'admin@nbsc.edu.ph' },
        { stage: 'DSS_SCORED', timestamp: '2026-08-27T15:00:00+08:00', actor: 'admin@nbsc.edu.ph' },
        { stage: 'DEPT_EVAL', timestamp: '2026-08-28T16:30:00+08:00', actor: 'depthead.admin@nbsc.edu.ph' },
        { stage: 'DELIBERATION', timestamp: '2026-08-30T14:00:00+08:00', actor: 'board@nbsc.edu.ph' },
        { stage: 'FINAL_DECISION', timestamp: '2026-09-02T11:00:00+08:00', actor: 'admin@nbsc.edu.ph' }
      ],
      created_at: '2026-08-25T09:00:00+08:00',
      updated_at: '2026-09-02T11:00:00+08:00'
    }
  ],

  /**
   * notifications table
   * PostgreSQL: CREATE TABLE notifications (
   *   id UUID PRIMARY KEY,
   *   recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
   *   title VARCHAR(255) NOT NULL,
   *   message TEXT NOT NULL,
   *   category VARCHAR(50) NOT NULL,
   *   target_link VARCHAR(512),
   *   is_read BOOLEAN DEFAULT false,
   *   created_at TIMESTAMPTZ DEFAULT NOW()
   * );
   */
  notifications: [
    {
      id: 'ntf-001',
      recipient_id: 'usr-001',
      title: 'New Application Received',
      message: 'Carlo Mendoza submitted an application for Instructor I (Computer Science) — ICS.',
      category: 'APPLICATION_STAGE',
      target_link: '/pages/hiring/hiring-pipeline/hiring-pipeline.html',
      is_read: false,
      created_at: '2026-08-20T14:30:00+08:00'
    },
    {
      id: 'ntf-002',
      recipient_id: 'usr-002',
      title: 'Deliberation Request',
      message: 'Vacancy "Instructor I (Computer Science)" has 3 applicants ready for HRMPSB deliberation.',
      category: 'EVALUATION_REQUEST',
      target_link: '/pages/hiring/deliberation/deliberation.html',
      is_read: false,
      created_at: '2026-08-26T09:00:00+08:00'
    },
    {
      id: 'ntf-003',
      recipient_id: 'usr-003',
      title: 'Evaluation Required',
      message: 'Please submit your Department Head evaluation for applicant Carlo Mendoza (ICS position).',
      category: 'EVALUATION_REQUEST',
      target_link: '/pages/hiring/evaluation/evaluation.html',
      is_read: true,
      created_at: '2026-08-25T11:30:00+08:00'
    },
    {
      id: 'ntf-004',
      recipient_id: 'usr-001',
      title: 'System Update',
      message: 'PRIME-HRM Intelligence Hub v2.0 has been deployed with SARA AI Assistant and 4-Pillar DSS Engine.',
      category: 'SYSTEM',
      target_link: null,
      is_read: true,
      created_at: '2026-09-01T08:00:00+08:00'
    }
  ],

  /**
   * programs table
   * PostgreSQL: CREATE TABLE programs (
   *   id UUID PRIMARY KEY,
   *   code VARCHAR(10) UNIQUE NOT NULL,
   *   name VARCHAR(255) NOT NULL,
   *   department_code VARCHAR(10) NOT NULL,
   *   level VARCHAR(50) DEFAULT 'BACHELOR',
   *   is_active BOOLEAN DEFAULT true,
   *   created_at TIMESTAMPTZ DEFAULT NOW()
   * );
   */
  programs: [
    {
      id: 'prg-001',
      code: 'BSIT',
      name: 'Bachelor of Science in Information Technology',
      department_code: 'ICS',
      department: 'Institute of Computer Studies (ICS)',
      description: 'Focuses on enterprise cloud infrastructure, cybersecurity systems, and web architecture.',
      level: 'BACHELOR',
      is_active: true,
      created_at: '2020-06-01T08:00:00+08:00'
    },
    {
      id: 'prg-002',
      code: 'BSCS',
      name: 'Bachelor of Science in Computer Science',
      department_code: 'ICS',
      department: 'Institute of Computer Studies (ICS)',
      description: 'Deep specialization in algorithmic optimization, machine intelligence, and software engineering.',
      level: 'BACHELOR',
      is_active: true,
      created_at: '2020-06-01T08:00:00+08:00'
    },
    {
      id: 'prg-003',
      code: 'BSBA',
      name: 'Bachelor of Science in Business Administration',
      department_code: 'IBM',
      department: 'Institute of Business and Management (IBM)',
      description: 'Prepares leaders in fiscal governance, human capital logistics, and agribusiness commerce.',
      level: 'BACHELOR',
      is_active: true,
      created_at: '2020-06-01T08:00:00+08:00'
    },
    {
      id: 'prg-004',
      code: 'BEED',
      name: 'Bachelor of Elementary Education',
      department_code: 'ITE',
      department: 'Institute of Teacher Education (ITE)',
      description: 'Developmental pedagogy for foundational literacy, curriculum design, and primary education.',
      level: 'BACHELOR',
      is_active: true,
      created_at: '2020-06-01T08:00:00+08:00'
    },
    {
      id: 'prg-005',
      code: 'BSED',
      name: 'Bachelor of Secondary Education',
      department_code: 'ITE',
      department: 'Institute of Teacher Education (ITE)',
      description: 'Secondary teaching licensure tracks in Mathematics, Physical Sciences, and Social Studies.',
      level: 'BACHELOR',
      is_active: true,
      created_at: '2020-06-01T08:00:00+08:00'
    },
    {
      id: 'prg-006',
      code: 'DGEC-GE',
      name: 'General Education Core Curriculum',
      department_code: 'DGEC',
      department: 'Dept. of General Education (DGEC)',
      description: 'CHED-mandated foundational coursework in ethics, science, culture, and purposive communication.',
      level: 'SERVICE',
      is_active: true,
      created_at: '2020-06-01T08:00:00+08:00'
    }
  ],

  /**
   * audit_blocks table (SHA-256 Hash Chain)
   * PostgreSQL: CREATE TABLE audit_blocks (
   *   id UUID PRIMARY KEY,
   *   block_index INTEGER UNIQUE NOT NULL,
   *   timestamp TIMESTAMPTZ NOT NULL,
   *   action VARCHAR(255) NOT NULL,
   *   actor_email VARCHAR(255),
   *   actor_role VARCHAR(50),
   *   target_id VARCHAR(255),
   *   data JSONB NOT NULL,
   *   previous_hash VARCHAR(64) NOT NULL,
   *   hash VARCHAR(64) UNIQUE NOT NULL
   * );
   */
  audit_blocks: [
    {
      id: 'blk-000',
      index: 0,
      block_index: 0,
      timestamp: '2026-01-01T08:00:00+08:00',
      action: 'GENESIS',
      actor_email: 'system@nbsc.edu.ph',
      actor_role: 'SYSTEM',
      target_id: 'GENESIS-ROOT',
      data: { message: 'NBSC PRIME-HRM Cryptographic Audit Ledger Initialized' },
      previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
    },
    {
      id: 'blk-001',
      index: 1,
      block_index: 1,
      timestamp: '2026-08-15T08:30:00+08:00',
      action: 'VACANCY_CREATED',
      actor_email: 'admin@nbsc.edu.ph',
      actor_role: 'HR_ADMIN',
      target_id: 'vac-001',
      data: { vacancy_id: 'vac-001', title: 'Instructor I (Computer Science)', department: 'ICS' },
      previous_hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      prev_hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3'
    },
    {
      id: 'blk-002',
      index: 2,
      block_index: 2,
      timestamp: '2026-08-20T14:30:00+08:00',
      action: 'APPLICATION_SUBMITTED',
      actor_email: 'applicant@gmail.com',
      actor_role: 'APPLICANT',
      target_id: 'app-001',
      data: { application_id: 'app-001', tracking_number: 'NBSC-APP-2026-00001', vacancy_id: 'vac-001' },
      previous_hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      prev_hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4'
    },
    {
      id: 'blk-003',
      index: 3,
      block_index: 3,
      timestamp: '2026-08-25T11:00:00+08:00',
      action: 'DSS_SCORED',
      actor_email: 'admin@nbsc.edu.ph',
      actor_role: 'HR_ADMIN',
      target_id: 'app-001',
      data: { application_id: 'app-001', composite_score: 86.15, rank: 1 },
      previous_hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      prev_hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5'
    },
    {
      id: 'blk-004',
      index: 4,
      block_index: 4,
      timestamp: '2026-08-30T10:15:00+08:00',
      action: 'HRMPSB_DELIBERATION',
      actor_email: 'board@nbsc.edu.ph',
      actor_role: 'HRMPSB_MEMBER',
      target_id: 'app-001',
      data: { application_id: 'app-001', vote: 'APPROVE', resolution: 'Certified compliant with CSC ORAOHRA standards' },
      previous_hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      prev_hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6'
    },
    {
      id: 'blk-005',
      index: 5,
      block_index: 5,
      timestamp: '2026-09-01T14:00:00+08:00',
      action: 'HIRING_APPOINTED',
      actor_email: 'admin@nbsc.edu.ph',
      actor_role: 'HR_ADMIN',
      target_id: 'app-001',
      data: { application_id: 'app-001', plantillano: 'NBSC-PLANTILLA-2026-042', status: 'CONFIRMED' },
      previous_hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      prev_hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      hash: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7'
    }
  ],

  /**
   * dss_scores table
   */
  dss_scores: [
    {
      id: 'dss-001',
      application_id: 'app-001',
      merit_score: 88.5,
      competence_score: 82.0,
      ethics_score: 90.0,
      service_score: 85.0,
      total_weighted: 86.15,
      rank: 1,
      scored_by: 'usr-001',
      created_at: '2026-08-25T11:00:00+08:00'
    }
  ],

  /**
   * payroll_batches table
   */
  payroll_batches: [
    {
      id: 'batch-2026-08-b',
      batch_id: 'PR-2026-08-B',
      period_label: 'August 16–31, 2026',
      department: 'ALL',
      employee_count: 8,
      total_gross: 248600.00,
      total_deductions: 32450.00,
      total_net: 216150.00,
      status: 'PROCESSED',
      audit_block_hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      created_at: '2026-08-31T17:00:00+08:00',
      records: [
        {
          id: 'pay-001',
          employee_id: 'NBSC-2023-0042',
          full_name: 'Liza Fernandez, M.A.Ed.',
          department: 'DGEC',
          gross_pay: 31361.00,
          deductions: { gsis: 2822.49, philhealth: 1254.44, withholding_tax: 0 },
          net_pay: 27284.07
        },
        {
          id: 'pay-002',
          employee_id: 'NBSC-2022-0018',
          full_name: 'Engr. Carlos Mendoza',
          department: 'ICS',
          gross_pay: 38400.00,
          deductions: { gsis: 3456.00, philhealth: 1536.00, withholding_tax: 1200.00 },
          net_pay: 32208.00
        },
        {
          id: 'pay-003',
          employee_id: 'NBSC-2021-0012',
          full_name: 'Mark Anthony Torres',
          department: 'IBM',
          gross_pay: 42000.00,
          deductions: { gsis: 3780.00, philhealth: 1680.00, withholding_tax: 1850.00 },
          net_pay: 34690.00
        },
        {
          id: 'pay-004',
          employee_id: 'NBSC-2020-0008',
          full_name: 'Dr. Roberto Villanueva',
          department: 'ITE',
          gross_pay: 48500.00,
          deductions: { gsis: 4365.00, philhealth: 1940.00, withholding_tax: 3200.00 },
          net_pay: 38995.00
        },
        {
          id: 'pay-005',
          employee_id: 'NBSC-2024-0055',
          full_name: 'Grace Magbanua, CPA',
          department: 'FIN',
          gross_pay: 36619.00,
          deductions: { gsis: 3295.71, philhealth: 1464.76, withholding_tax: 1100.00 },
          net_pay: 30758.53
        },
        {
          id: 'pay-006',
          employee_id: 'NBSC-2025-0061',
          full_name: 'Maria Kristina Velasco',
          department: 'REG',
          gross_pay: 19600.00,
          deductions: { gsis: 1764.00, philhealth: 784.00, withholding_tax: 0 },
          net_pay: 17052.00
        },
        {
          id: 'pay-007',
          employee_id: 'NBSC-2019-0005',
          full_name: 'Prof. Armando Reyes, Ed.D.',
          department: 'DGEC',
          gross_pay: 49000.00,
          deductions: { gsis: 4410.00, philhealth: 1960.00, withholding_tax: 3400.00 },
          net_pay: 39230.00
        },
        {
          id: 'pay-008',
          employee_id: 'NBSC-2023-0048',
          full_name: 'Clarisse Joy Dizon',
          department: 'ADMIN',
          gross_pay: 13000.00,
          deductions: { gsis: 1170.00, philhealth: 520.00, withholding_tax: 0 },
          net_pay: 11310.00
        }
      ]
    },
    {
      id: 'batch-2026-08-a',
      batch_id: 'PR-2026-08-A',
      period_label: 'August 01–15, 2026',
      department: 'ALL',
      employee_count: 8,
      total_gross: 248600.00,
      total_deductions: 32450.00,
      total_net: 216150.00,
      status: 'DISTRIBUTED',
      audit_block_hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      records: [
        {
          id: 'pay-001-a',
          employee_id: 'NBSC-2023-0042',
          full_name: 'Liza Fernandez, M.A.Ed.',
          department: 'DGEC',
          gross_pay: 31361.00,
          deductions: { gsis: 2822.49, philhealth: 1254.44, withholding_tax: 0 },
          net_pay: 27284.07
        },
        {
          id: 'pay-002-a',
          employee_id: 'NBSC-2022-0018',
          full_name: 'Engr. Carlos Mendoza',
          department: 'ICS',
          gross_pay: 38400.00,
          deductions: { gsis: 3456.00, philhealth: 1536.00, withholding_tax: 1200.00 },
          net_pay: 32208.00
        },
        {
          id: 'pay-003-a',
          employee_id: 'NBSC-2021-0012',
          full_name: 'Mark Anthony Torres',
          department: 'IBM',
          gross_pay: 42000.00,
          deductions: { gsis: 3780.00, philhealth: 1680.00, withholding_tax: 1850.00 },
          net_pay: 34690.00
        }
      ]
    }
  ],

  /**
   * settings table (key-value configuration store)
   */
  settings: [
    {
      id: 'set-001',
      key: 'dss_weights',
      value: { merit: 30, competence: 30, ethics: 20, service: 20 },
      updated_by: 'usr-001',
      updated_at: '2026-01-15T08:00:00+08:00'
    },
    {
      id: 'set-002',
      key: 'institution_info',
      value: {
        name: 'Northern Bukidnon State College',
        abbreviation: 'NBSC',
        address: 'Malaybalay City, Bukidnon 8700',
        president: 'Dr. Maria Santos',
        website: 'https://nbsc.edu.ph'
      },
      updated_by: 'usr-001',
      updated_at: '2026-01-15T08:00:00+08:00'
    },
    {
      id: 'set-003',
      key: 'payslip_password_formula',
      value: { pattern: 'last4_of_employee_id + MMDDYYYY_of_DOB', example: '004203221990' },
      updated_by: 'usr-001',
      updated_at: '2026-01-15T08:00:00+08:00'
    }
  ]
};


/* ═══════════════════════════════════════════════════════════
   NbscDB — localStorage-Backed CRUD Engine
   ═══════════════════════════════════════════════════════════ */

/**
 * Frontend database engine backed by localStorage.
 * Each table is stored as a JSON array under the key `nbsc_db_{tableName}`.
 * Designed for seamless PostgreSQL migration — every operation maps to SQL.
 */
class NbscDB {
  constructor() {
    /** @type {string} Prefix for all localStorage keys */
    this.prefix = 'nbsc_db_';
    /** @type {string} Key tracking whether DB has been seeded */
    this.initKey = 'nbsc_db_initialized';
  }

  /* ── Initialization ──────────────────────────────────────── */

  /**
   * Seeds the database on first run. Safe to call multiple times.
   * Equivalent to: pg_restore --clean --if-exists
   */
  init() {
    const isInitialized = localStorage.getItem(this.initKey);
    const dbVersion = localStorage.getItem('nbsc_db_version');
    const CURRENT_VERSION = '2.2.0';

    Object.entries(DB_SEED).forEach(([table, rows]) => {
      const existing = localStorage.getItem(this.prefix + table);
      if (!isInitialized || !existing || dbVersion !== CURRENT_VERSION) {
        this.setTable(table, rows);
      }
    });
    if (!isInitialized || dbVersion !== CURRENT_VERSION) {
      localStorage.setItem(this.initKey, new Date().toISOString());
      localStorage.setItem('nbsc_db_version', CURRENT_VERSION);
      console.log('[NbscDB] Database seeded/updated (v' + CURRENT_VERSION + ') with', Object.keys(DB_SEED).length, 'tables.');
    }
  }

  /**
   * Forces a complete re-seed, wiping all existing data.
   * Equivalent to: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
   */
  reset() {
    Object.keys(DB_SEED).forEach(table => {
      localStorage.removeItem(this.prefix + table);
    });
    localStorage.removeItem(this.initKey);
    this.init();
    console.log('[NbscDB] Database reset complete.');
  }

  /* ── Table CRUD ──────────────────────────────────────────── */

  /**
   * Retrieves all rows from a table.
   * Equivalent to: SELECT * FROM {table}
   * @param {string} table - Table name
   * @returns {Array<Object>}
   */
  getTable(table) {
    const raw = localStorage.getItem(this.prefix + table);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  /**
   * Replaces entire table contents.
   * @param {string} table - Table name
   * @param {Array<Object>} rows - Array of row objects
   */
  setTable(table, rows) {
    localStorage.setItem(this.prefix + table, JSON.stringify(rows));
  }

  /**
   * Finds the first row matching a predicate.
   * Equivalent to: SELECT * FROM {table} WHERE ... LIMIT 1
   * @param {string} table - Table name
   * @param {Function} predicate - Filter function (row) => boolean
   * @returns {Object|null}
   */
  findOne(table, predicate) {
    return this.getTable(table).find(predicate) || null;
  }

  /**
   * Finds all rows matching a predicate.
   * Equivalent to: SELECT * FROM {table} WHERE ...
   * @param {string} table - Table name
   * @param {Function} [predicate] - Optional filter function
   * @returns {Array<Object>}
   */
  findAll(table, predicate) {
    const rows = this.getTable(table);
    return predicate ? rows.filter(predicate) : rows;
  }

  /**
   * Counts rows matching a predicate.
   * Equivalent to: SELECT COUNT(*) FROM {table} WHERE ...
   * @param {string} table - Table name
   * @param {Function} [predicate] - Optional filter function
   * @returns {number}
   */
  count(table, predicate) {
    return this.findAll(table, predicate).length;
  }

  /**
   * Inserts a new row into a table.
   * Equivalent to: INSERT INTO {table} VALUES (...)
   * @param {string} table - Table name
   * @param {Object} row - Row data (must include `id`)
   * @returns {Object} The inserted row
   */
  insert(table, row) {
    const rows = this.getTable(table);
    if (!row.id) {
      row.id = this._generateId(table);
    }
    if (!row.created_at) {
      row.created_at = new Date().toISOString();
    }
    rows.push(row);
    this.setTable(table, rows);
    return row;
  }

  /**
   * Updates a row by ID with partial changes.
   * Equivalent to: UPDATE {table} SET ... WHERE id = {id}
   * @param {string} table - Table name
   * @param {string} id - Row ID
   * @param {Object} changes - Partial update object
   * @returns {Object|null} Updated row or null if not found
   */
  update(table, id, changes) {
    const rows = this.getTable(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...changes, updated_at: new Date().toISOString() };
    this.setTable(table, rows);
    return rows[idx];
  }

  /**
   * Removes a row by ID.
   * Equivalent to: DELETE FROM {table} WHERE id = {id}
   * @param {string} table - Table name
   * @param {string} id - Row ID
   * @returns {boolean} True if row was removed
   */
  remove(table, id) {
    const rows = this.getTable(table);
    const filtered = rows.filter(r => r.id !== id);
    if (filtered.length === rows.length) return false;
    this.setTable(table, filtered);
    return true;
  }

  /* ── Authentication ──────────────────────────────────────── */

  /**
   * Authenticates a user by email and password.
   * Equivalent to: SELECT * FROM users WHERE email = $1 AND password = $2
   * @param {string} email - User email
   * @param {string} password - User password (plaintext for demo)
   * @returns {{ success: boolean, data?: Object, error?: string }}
   */
  authenticate(email, password) {
    const user = this.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    if (!user.is_active) {
      return { success: false, error: 'This account has been deactivated. Contact HR administration.' };
    }

    const matchesPassword = (user.password && user.password === password) ||
                            (user.password_hash && user.password_hash === password);
    if (!matchesPassword) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Check 2FA requirement
    if (user.requires_2fa) {
      const tempToken = this._generateToken();
      return {
        success: true,
        data: {
          requires_2fa: true,
          temp_token: tempToken,
          user_id: user.id
        }
      };
    }

    // Create session
    const session = this.createSession(user);

    // Build user profile (exclude password)
    const userProfile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      name: user.full_name,
      role: user.role,
      department_code: user.department_code,
      position_title: user.position_title
    };

    return {
      success: true,
      data: {
        requires_2fa: false,
        access_token: session.token,
        refresh_token: this._generateToken(),
        user: userProfile
      }
    };
  }

  /**
   * Creates a new session for a user.
   * Equivalent to: INSERT INTO sessions (user_id, token, expires_at) VALUES (...)
   * @param {Object} user - User object
   * @returns {Object} Session record
   */
  createSession(user) {
    // Clean up old sessions for this user
    const sessions = this.getTable('sessions').filter(s => s.user_id !== user.id);

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const session = {
      id: this._generateId('ses'),
      user_id: user.id,
      token: this._generateToken(),
      created_at: now.toISOString(),
      expires_at: expires.toISOString()
    };

    sessions.push(session);
    this.setTable('sessions', sessions);
    return session;
  }

  /**
   * Validates a session token and returns the associated user.
   * Equivalent to: SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id
   *                WHERE s.token = $1 AND s.expires_at > NOW()
   * @param {string} token - Session token
   * @returns {Object|null} User object or null if invalid/expired
   */
  validateSession(token) {
    if (!token) return null;

    const session = this.findOne('sessions', s => s.token === token);
    if (!session) return null;

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      this.remove('sessions', session.id);
      return null;
    }

    // Resolve user
    const user = this.findOne('users', u => u.id === session.user_id);
    if (!user || !user.is_active) return null;

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      name: user.full_name,
      role: user.role,
      department_code: user.department_code,
      position_title: user.position_title
    };
  }

  /**
   * Destroys a session by token.
   * Equivalent to: DELETE FROM sessions WHERE token = $1
   * @param {string} token - Session token
   */
  destroySession(token) {
    if (!token) return;
    const sessions = this.getTable('sessions').filter(s => s.token !== token);
    this.setTable('sessions', sessions);
  }

  /* ── Export Utilities ────────────────────────────────────── */

  /**
   * Exports the entire database as a PostgreSQL-compatible JSON dump.
   * Each table is an array of rows ready for pg \copy or JSONB import.
   * @returns {Object} Full database export
   */
  exportForPostgres() {
    const dump = {};
    Object.keys(DB_SEED).forEach(table => {
      dump[table] = this.getTable(table);
    });
    return {
      _metadata: {
        exported_at: new Date().toISOString(),
        source: 'NBSC PRIME-HRM Intelligence Hub — Frontend JSON Store',
        version: '2.0.0',
        tables: Object.keys(dump),
        total_rows: Object.values(dump).reduce((sum, rows) => sum + rows.length, 0)
      },
      ...dump
    };
  }

  /**
   * Downloads the database export as a JSON file.
   */
  downloadExport() {
    const data = this.exportForPostgres();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nbsc_primehrm_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── Private Helpers ─────────────────────────────────────── */

  /**
   * Generates a random ID with a table-based prefix.
   * @param {string} prefix - Table name or prefix
   * @returns {string}
   * @private
   */
  _generateId(prefix) {
    const short = prefix.substring(0, 3);
    const rand = Math.random().toString(36).substring(2, 10);
    const ts = Date.now().toString(36);
    return `${short}-${ts}-${rand}`;
  }

  /**
   * Generates a session token mimicking a JWT structure.
   * @returns {string}
   * @private
   */
  _generateToken() {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      iss: 'nbsc-primehrm',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
      jti: Math.random().toString(36).substring(2, 15)
    }));
    const sig = btoa(Math.random().toString(36).substring(2, 30));
    return `${header}.${payload}.${sig}`;
  }
}


/* ═══════════════════════════════════════════════════════════
   Global Database Instance
   ═══════════════════════════════════════════════════════════ */

/** @type {NbscDB} Singleton database instance */
const db = new NbscDB();
db.init();
