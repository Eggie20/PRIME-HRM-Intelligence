/**
 * NBSC PRIME-HRM Intelligence Hub — PostgreSQL Seed Generator
 * Generates:
 *   1. backend/data/seed_data.json
 *   2. seed_data.json (root mirror)
 *   3. backend/data/seed_postgres.sql
 *   4. seed_postgres.sql (root mirror)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Extract DB_SEED from db.js
const rootDir = path.resolve(__dirname, '..', '..');
const dbJsPath = path.join(rootDir, 'frontend', 'shared', 'js', 'db.js');
const dbContent = fs.readFileSync(dbJsPath, 'utf8');

const start = dbContent.indexOf('const DB_SEED = {');
const end = dbContent.indexOf('class NbscDB');
if (start === -1 || end === -1) {
  console.error('Could not locate DB_SEED in db.js');
  process.exit(1);
}

const seedCode = dbContent.slice(start, end).replace('const DB_SEED =', 'var DB_SEED =');
const sandbox = {};
vm.runInNewContext(seedCode, sandbox);
const seed = sandbox.DB_SEED;

// 2. Structured Tables
const users = seed.users.map(u => ({
  id: u.id,
  email: u.email,
  password_hash: u.password_hash || u.password,
  full_name: u.full_name,
  role: u.role,
  department_code: u.department_code || null,
  position_title: u.position_title || null,
  is_active: u.is_active !== undefined ? u.is_active : true,
  requires_2fa: u.requires_2fa !== undefined ? u.requires_2fa : false,
  created_at: u.created_at || '2026-01-15T08:00:00+08:00',
  updated_at: u.updated_at || '2026-09-01T10:00:00+08:00'
}));

const programs = seed.programs.map(p => ({
  id: p.id,
  code: p.code,
  name: p.name,
  department_code: p.department_code,
  department: p.department,
  description: p.description,
  level: p.level || 'Undergraduate',
  is_active: p.is_active !== undefined ? p.is_active : true,
  created_at: p.created_at || '2026-01-10T08:00:00+08:00'
}));

const employees = seed.employees.map(e => ({
  id: e.id,
  user_id: e.user_id || null,
  employee_id: e.employee_id,
  employee_number: e.employee_number || e.employee_id,
  full_name: e.full_name,
  email: e.email,
  department: e.department,
  department_code: e.department_code,
  position: e.position,
  position_title: e.position_title || e.position,
  category: e.category,
  salary_grade: e.salary_grade,
  daily_rate: e.daily_rate,
  monthly_salary: Math.round((e.daily_rate * 22) * 100) / 100,
  employment_status: e.employment_status,
  date_hired: e.date_hired || '2024-01-15',
  date_of_birth: e.date_of_birth || '1985-05-12',
  phone: e.phone || '0917-555-0100',
  address: e.address || 'Bukidnon, Philippines',
  is_active: e.is_active !== undefined ? e.is_active : true,
  created_at: e.created_at || '2026-01-15T08:00:00+08:00',
  updated_at: e.updated_at || '2026-09-01T10:00:00+08:00'
}));

const vacancies = seed.vacancies.map(v => ({
  id: v.id,
  title: v.title,
  department_code: v.department_code,
  department: v.department,
  category: v.category,
  salary_grade: v.salary_grade,
  monthly_salary: v.monthly_salary,
  daily_rate: Math.round((v.monthly_salary / 22.0) * 100) / 100,
  slots: v.slots || 1,
  employment_status: v.employment_status,
  description: v.description,
  qualification_standards: v.qualification_standards || {
    education: "Master's Degree relevant to position",
    experience: '1 year of relevant experience',
    training: '4 hours relevant training',
    eligibility: 'RA 1080 / CS Professional'
  },
  status: v.status || 'OPEN',
  applicant_count: v.applicant_count || 0,
  posted_by: v.posted_by || 'usr-001',
  deadline: v.deadline || '2026-10-15T23:59:59+08:00',
  created_at: v.created_at || '2026-08-01T08:00:00+08:00',
  updated_at: v.updated_at || '2026-08-01T08:00:00+08:00'
}));

const applications = [
  {
    id: 'app-001',
    tracking_number: 'NBSC-APP-2026-10011',
    applicant_id: 'usr-004',
    applicant_name: 'Dave Kevin M. Alcantara',
    applicant_email: 'dalcantara@example.com',
    vacancy_id: 'vac-005',
    stage: 'APPLIED',
    personal_info: {
      full_name: 'Dave Kevin M. Alcantara',
      email: 'dalcantara@example.com',
      phone: '0917 555 0191',
      address: 'Malaybalay City, Bukidnon',
      highest_education: 'Master of Arts in Education',
      school: 'Bukidnon State University',
      years_experience: '2 years elementary instruction',
      eligibility: 'RA 1080 (LET)'
    },
    education: { degree: 'Master of Arts in Education', institution: 'Bukidnon State University', year: 2023 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Alcantara_PDS_2026.pdf', file_size: 1450000, verified: true },
      { doc_type: 'TRANSCRIPT_OF_RECORDS', file_name: 'Alcantara_TOR.pdf', file_size: 2200000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-08-25T09:00:00+08:00', remarks: 'Application submitted via career portal.' }
    ],
    created_at: '2026-08-25T09:00:00+08:00',
    updated_at: '2026-08-25T09:00:00+08:00'
  },
  {
    id: 'app-002',
    tracking_number: 'NBSC-APP-2026-10042',
    applicant_id: 'usr-004',
    applicant_name: 'April Anne Elizabeth A. Bajao',
    applicant_email: 'applicant@gmail.com',
    vacancy_id: 'vac-001',
    stage: 'SCREENING',
    personal_info: {
      full_name: 'April Anne Elizabeth A. Bajao',
      email: 'applicant@gmail.com',
      phone: '0917 555 0192',
      address: 'Manolo Fortich, Bukidnon',
      highest_education: 'MS in Information Technology',
      school: 'University of Science and Technology of Southern Philippines',
      years_experience: '3 years full-stack development & tertiary instruction',
      eligibility: 'RA 1080 / CS Professional'
    },
    education: { degree: 'MS in Information Technology', institution: 'USTP', year: 2024 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Bajao_PDS_2026.pdf', file_size: 1480000, verified: true },
      { doc_type: 'TRANSCRIPT_OF_RECORDS', file_name: 'Bajao_TOR.pdf', file_size: 2100000, verified: true },
      { doc_type: 'ELIGIBILITY_CERT', file_name: 'Bajao_CSP_Cert.pdf', file_size: 890000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-08-20T14:30:00+08:00', remarks: 'Online submission.' },
      { stage: 'SCREENING', updated_at: '2026-08-22T10:00:00+08:00', remarks: 'Passed initial Qualification Standards screening against CSC matrix.' }
    ],
    created_at: '2026-08-20T14:30:00+08:00',
    updated_at: '2026-08-22T10:00:00+08:00'
  },
  {
    id: 'app-003',
    tracking_number: 'NBSC-APP-2026-10088',
    applicant_id: 'usr-004',
    applicant_name: 'John Paul D. Tan',
    applicant_email: 'jptan@example.com',
    vacancy_id: 'vac-002',
    stage: 'DSS_SCORED',
    personal_info: {
      full_name: 'John Paul D. Tan',
      email: 'jptan@example.com',
      phone: '0917 555 0193',
      address: 'Cagayan de Oro City',
      highest_education: 'Master in Business Administration',
      school: 'Xavier University - Ateneo de Cagayan',
      years_experience: '4 years corporate banking and lecturing',
      eligibility: 'RA 1080 / CS Professional'
    },
    education: { degree: 'Master in Business Administration', institution: 'XU', year: 2022 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Tan_PDS_2026.pdf', file_size: 1520000, verified: true },
      { doc_type: 'TRANSCRIPT_OF_RECORDS', file_name: 'Tan_TOR.pdf', file_size: 1980000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-08-15T11:00:00+08:00', remarks: 'Submitted application.' },
      { stage: 'SCREENING', updated_at: '2026-08-18T14:00:00+08:00', remarks: 'QS verified compliant.' },
      { stage: 'DSS_SCORED', updated_at: '2026-08-28T16:00:00+08:00', remarks: '4-Pillar Decision Support System score computed: 88.40/100.' }
    ],
    created_at: '2026-08-15T11:00:00+08:00',
    updated_at: '2026-08-28T16:00:00+08:00'
  },
  {
    id: 'app-004',
    tracking_number: 'NBSC-APP-2026-10103',
    applicant_id: 'usr-004',
    applicant_name: 'Maria Teresa C. Santos',
    applicant_email: 'msantos.candidate@example.com',
    vacancy_id: 'vac-004',
    stage: 'DEPT_EVALUATION',
    personal_info: {
      full_name: 'Maria Teresa C. Santos',
      email: 'msantos.candidate@example.com',
      phone: '0917 555 0194',
      address: 'Manolo Fortich, Bukidnon',
      highest_education: 'BS in Office Administration',
      school: 'Central Mindanao University',
      years_experience: '3 years public records management',
      eligibility: 'Career Service Subprofessional'
    },
    education: { degree: 'BS in Office Administration', institution: 'CMU', year: 2021 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Santos_PDS_2026.pdf', file_size: 1420000, verified: true },
      { doc_type: 'CIVIL_SERVICE_ELIGIBILITY', file_name: 'Santos_CSE.pdf', file_size: 910000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-08-10T10:00:00+08:00', remarks: 'Application filed.' },
      { stage: 'SCREENING', updated_at: '2026-08-12T13:30:00+08:00', remarks: 'Screening passed.' },
      { stage: 'DSS_SCORED', updated_at: '2026-08-20T15:00:00+08:00', remarks: 'DSS score 86.20.' },
      { stage: 'DEPT_EVALUATION', updated_at: '2026-08-29T11:30:00+08:00', remarks: 'Department Head rubric evaluation completed with 91.50% rating.' }
    ],
    created_at: '2026-08-10T10:00:00+08:00',
    updated_at: '2026-08-29T11:30:00+08:00'
  },
  {
    id: 'app-005',
    tracking_number: 'NBSC-APP-2026-10145',
    applicant_id: 'usr-004',
    applicant_name: 'Christian P. Villanueva',
    applicant_email: 'cvillanueva.candidate@example.com',
    vacancy_id: 'vac-003',
    stage: 'DELIBERATION',
    personal_info: {
      full_name: 'Christian P. Villanueva',
      email: 'cvillanueva.candidate@example.com',
      phone: '0917 555 0195',
      address: 'Valencia City, Bukidnon',
      highest_education: 'Master of Arts in History',
      school: 'University of the Philippines Diliman',
      years_experience: '3 years tertiary Philippine history teaching',
      eligibility: 'RA 1080 / CS Professional'
    },
    education: { degree: 'Master of Arts in History', institution: 'UP Diliman', year: 2022 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Villanueva_PDS_2026.pdf', file_size: 1620000, verified: true },
      { doc_type: 'TEACHING_DEMO_RUBRIC', file_name: 'Demo_Evaluation.pdf', file_size: 780000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-08-01T09:00:00+08:00', remarks: 'Filing confirmed.' },
      { stage: 'SCREENING', updated_at: '2026-08-05T14:00:00+08:00', remarks: 'QS approved.' },
      { stage: 'DSS_SCORED', updated_at: '2026-08-15T16:00:00+08:00', remarks: 'DSS score 92.10.' },
      { stage: 'DEPT_EVALUATION', updated_at: '2026-08-22T10:00:00+08:00', remarks: 'Dept evaluation: 94.00%.' },
      { stage: 'DELIBERATION', updated_at: '2026-08-30T14:00:00+08:00', remarks: 'HRMPSB Board deliberation conducted; consensus ranking: Rank 1.' }
    ],
    created_at: '2026-08-01T09:00:00+08:00',
    updated_at: '2026-08-30T14:00:00+08:00'
  },
  {
    id: 'app-006',
    tracking_number: 'NBSC-APP-2026-10179',
    applicant_id: 'usr-004',
    applicant_name: 'Elena R. Cruz',
    applicant_email: 'ecruz.candidate@example.com',
    vacancy_id: 'vac-006',
    stage: 'APPOINTMENT_ISSUED',
    personal_info: {
      full_name: 'Elena R. Cruz',
      email: 'ecruz.candidate@example.com',
      phone: '0917 555 0196',
      address: 'Malaybalay City, Bukidnon',
      highest_education: 'BS in Accountancy (CPA)',
      school: 'Ateneo de Davao University',
      years_experience: '5 years government financial disbursement',
      eligibility: 'RA 1080 (Certified Public Accountant - CPA)'
    },
    education: { degree: 'BS in Accountancy (CPA)', institution: 'ADDU', year: 2019 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Cruz_PDS_2026.pdf', file_size: 1550000, verified: true },
      { doc_type: 'CPA_BOARD_RATING', file_name: 'PRC_CPA_License.pdf', file_size: 890000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-07-20T08:00:00+08:00', remarks: 'Applied.' },
      { stage: 'SCREENING', updated_at: '2026-07-25T11:00:00+08:00', remarks: 'Screened.' },
      { stage: 'DSS_SCORED', updated_at: '2026-08-05T15:00:00+08:00', remarks: 'DSS scored: 90.40.' },
      { stage: 'DEPT_EVALUATION', updated_at: '2026-08-12T14:00:00+08:00', remarks: 'Dept eval: 93.00%.' },
      { stage: 'DELIBERATION', updated_at: '2026-08-20T16:00:00+08:00', remarks: 'HRMPSB approved Rank 1.' },
      { stage: 'APPOINTMENT_ISSUED', updated_at: '2026-08-28T10:00:00+08:00', remarks: 'Appointment resolution signed by College President; Block committed to Audit Chain.' }
    ],
    created_at: '2026-07-20T08:00:00+08:00',
    updated_at: '2026-08-28T10:00:00+08:00'
  },
  {
    id: 'app-007',
    tracking_number: 'NBSC-APP-2026-10204',
    applicant_id: 'usr-004',
    applicant_name: 'Mark Anthony L. Reyes',
    applicant_email: 'mreyes.candidate@example.com',
    vacancy_id: 'vac-001',
    stage: 'DOCUMENT_VERIFICATION',
    personal_info: {
      full_name: 'Mark Anthony L. Reyes',
      email: 'mreyes.candidate@example.com',
      phone: '0917 555 0197',
      address: 'Malaybalay City, Bukidnon',
      highest_education: 'Master of Information Systems',
      school: 'Mindanao State University - IIT',
      years_experience: '4 years database engineering',
      eligibility: 'RA 1080 / CS Professional'
    },
    education: { degree: 'Master of Information Systems', institution: 'MSU-IIT', year: 2021 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Reyes_PDS_2026.pdf', file_size: 1600000, verified: true },
      { doc_type: 'NBI_CLEARANCE', file_name: 'NBI_Clearance_2026.pdf', file_size: 750000, verified: true },
      { doc_type: 'MEDICAL_CERTIFICATE', file_name: 'Medical_CS_Form_211.pdf', file_size: 920000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-07-15T09:00:00+08:00', remarks: 'Filed.' },
      { stage: 'DELIBERATION', updated_at: '2026-08-15T15:00:00+08:00', remarks: 'Deliberation cleared.' },
      { stage: 'APPOINTMENT_ISSUED', updated_at: '2026-08-22T11:00:00+08:00', remarks: 'Conditional appointment issued.' },
      { stage: 'DOCUMENT_VERIFICATION', updated_at: '2026-08-31T14:00:00+08:00', remarks: 'Medical clearance, NBI check, and notarized PDS verified.' }
    ],
    created_at: '2026-07-15T09:00:00+08:00',
    updated_at: '2026-08-31T14:00:00+08:00'
  },
  {
    id: 'app-008',
    tracking_number: 'NBSC-APP-2026-10250',
    applicant_id: 'usr-004',
    applicant_name: 'Noreen Faye S. Esta',
    applicant_email: 'nesta.candidate@example.com',
    vacancy_id: 'vac-002',
    stage: 'ONBOARDED',
    personal_info: {
      full_name: 'Noreen Faye S. Esta',
      email: 'nesta.candidate@example.com',
      phone: '0917 555 0198',
      address: 'Manolo Fortich, Bukidnon',
      highest_education: 'Ph.D. in Business Administration units earned',
      school: 'University of San Carlos',
      years_experience: '5 years tertiary academic leadership',
      eligibility: 'RA 1080 / CS Professional'
    },
    education: { degree: 'Ph.D. units earned / MBA', institution: 'USC', year: 2020 },
    documents: [
      { doc_type: 'PDS_CS_FORM_212', file_name: 'Esta_PDS_2026.pdf', file_size: 1540000, verified: true },
      { doc_type: 'OATH_OF_OFFICE', file_name: 'Oath_Of_Office_Signed.pdf', file_size: 1100000, verified: true }
    ],
    stage_history: [
      { stage: 'APPLIED', updated_at: '2026-06-10T09:00:00+08:00', remarks: 'Filed.' },
      { stage: 'DELIBERATION', updated_at: '2026-07-12T14:00:00+08:00', remarks: 'Approved.' },
      { stage: 'APPOINTMENT_ISSUED', updated_at: '2026-07-28T10:00:00+08:00', remarks: 'Appointed.' },
      { stage: 'DOCUMENT_VERIFICATION', updated_at: '2026-08-10T11:00:00+08:00', remarks: 'Pre-employment compliance verified.' },
      { stage: 'ONBOARDED', updated_at: '2026-08-18T08:30:00+08:00', remarks: 'Plantilla induction completed; 201 Personnel file active and enrolled in payroll.' }
    ],
    created_at: '2026-06-10T09:00:00+08:00',
    updated_at: '2026-08-18T08:30:00+08:00'
  }
];

const dss_scores = [
  {
    id: 'dss-001',
    application_id: 'app-003',
    merit_score: 26.50,
    competence_score: 27.00,
    ethics_score: 17.50,
    service_score: 17.40,
    total_score: 88.40,
    rank: 1,
    qs_compliant: true,
    details: { education_pts: 14.0, experience_pts: 8.5, training_pts: 4.0 },
    scored_by: 'usr-003',
    created_at: '2026-08-28T16:00:00+08:00'
  },
  {
    id: 'dss-002',
    application_id: 'app-005',
    merit_score: 28.00,
    competence_score: 28.50,
    ethics_score: 18.00,
    service_score: 17.60,
    total_score: 92.10,
    rank: 1,
    qs_compliant: true,
    details: { education_pts: 15.0, experience_pts: 9.0, training_pts: 4.0 },
    scored_by: 'usr-003',
    created_at: '2026-08-15T16:00:00+08:00'
  }
];

const dept_head_evaluations = [
  {
    id: 'dhe-001',
    application_id: 'app-004',
    evaluator_id: 'usr-003',
    evaluator_name: 'Dr. Ana Reyes',
    ratings: { technical_mastery: 5, instructional_clarity: 4, communication: 5, professionalism: 5 },
    total_score: 91.50,
    recommendation: 'STRONGLY_RECOMMEND',
    remarks: 'Demonstrated exceptional institutional record organization and technical competence.',
    created_at: '2026-08-29T11:30:00+08:00'
  },
  {
    id: 'dhe-002',
    application_id: 'app-005',
    evaluator_id: 'usr-003',
    evaluator_name: 'Dr. Ana Reyes',
    ratings: { technical_mastery: 5, instructional_clarity: 5, communication: 4, professionalism: 5 },
    total_score: 94.00,
    recommendation: 'STRONGLY_RECOMMEND',
    remarks: 'Exceptional teaching demonstration on Philippine historiography and high student engagement.',
    created_at: '2026-08-22T10:00:00+08:00'
  }
];

const deliberation_ballots = [
  {
    id: 'dlb-001',
    application_id: 'app-005',
    voter_id: 'usr-002',
    voter_name: 'Prof. Juan Dela Cruz',
    vote: 'APPROVE',
    rank_priority: 1,
    deliberation_notes: 'Strong teaching demonstration and exemplary peer references.',
    created_at: '2026-08-30T14:15:00+08:00'
  },
  {
    id: 'dlb-002',
    application_id: 'app-005',
    voter_id: 'usr-003',
    voter_name: 'Dr. Ana Reyes',
    vote: 'APPROVE',
    rank_priority: 1,
    deliberation_notes: 'Recommended for DGEC faculty plantilla with unanimous department backing.',
    created_at: '2026-08-30T14:20:00+08:00'
  }
];

const hiring_decisions = [
  {
    id: 'dec-001',
    application_id: 'app-006',
    decision: 'APPOINTED',
    resolution_number: 'BOR-RES-2026-089',
    appointed_by: 'usr-001',
    audit_block_index: 5,
    audit_block_hash: 'd7f4a2189c4e09f58a719c8114f2e185038c92b23a1a9e88d6ef92a0134b210a',
    created_at: '2026-08-28T10:00:00+08:00'
  }
];

const audit_blocks = seed.audit_blocks.map(b => ({
  id: b.id,
  block_index: b.block_index !== undefined ? b.block_index : b.index,
  timestamp: b.timestamp,
  action: b.action,
  actor_email: b.actor_email,
  actor_role: b.actor_role,
  target_id: b.target_id,
  data: b.data,
  previous_hash: b.previous_hash || b.prev_hash,
  hash: b.hash
}));

const payroll_batches = seed.payroll_batches.map(b => ({
  id: b.id,
  batch_id: b.batch_id,
  period_label: b.period_label,
  start_date: b.start_date || (b.batch_id.includes('09-A') ? '2026-09-01' : '2026-08-16'),
  end_date: b.end_date || (b.batch_id.includes('09-A') ? '2026-09-15' : '2026-08-31'),
  department: b.department || 'ALL',
  employee_count: b.employee_count,
  total_gross: b.total_gross,
  total_deductions: b.total_deductions,
  total_net: b.total_net,
  status: b.status,
  uploaded_by: b.uploaded_by || 'admin@nbsc.edu.ph',
  audit_block_hash: b.audit_block_hash || null,
  processed_at: b.processed_at || b.created_at,
  created_at: b.created_at
}));

const payslips = [];
let slipIdx = 1;
for (const b of seed.payroll_batches) {
  if (Array.isArray(b.records)) {
    for (const r of b.records) {
      payslips.push({
        id: 'pslip-' + String(slipIdx++).padStart(3, '0'),
        batch_id: b.id,
        employee_id: r.employee_id,
        full_name: r.full_name || (r.first_name + ' ' + r.last_name),
        department: r.department || r.dept,
        position: r.position || r.pos,
        salary_grade: r.salary_grade || 12,
        email: r.email,
        date_of_birth: r.date_of_birth || r.dob || '1990-01-01',
        basic_pay: r.basic_pay,
        pera: r.pera || 1000.00,
        gross_pay: r.gross_pay,
        gsis: r.gsis || 0.00,
        philhealth: r.philhealth || 0.00,
        pagibig: r.pagibig || 100.00,
        withholding_tax: r.withholding_tax || 0.00,
        total_deductions: r.total_deductions,
        net_pay: r.net_pay,
        encrypted_pdf_filename: r.encrypted_pdf_filename || ('Payslip_' + r.employee_id + '_' + b.batch_id + '.pdf'),
        encrypted_pdf_path: r.encrypted_pdf_path || ('media/payslips/' + b.batch_id + '/' + r.employee_id + '.pdf'),
        created_at: b.created_at
      });
    }
  }
}

const notifications = seed.notifications.map(n => ({
  id: n.id,
  recipient_email: n.recipient_email || 'admin@nbsc.edu.ph',
  recipient_id: n.recipient_id || 'usr-001',
  title: n.title,
  message: n.message,
  category: n.category,
  target_link: n.target_link,
  is_read: n.is_read || false,
  created_at: n.created_at
}));

const settings = seed.settings.map(s => ({
  id: s.id,
  key: s.key,
  value: s.value,
  updated_by: s.updated_by || 'admin@nbsc.edu.ph',
  updated_at: s.updated_at
}));

// 3. Assemble JSON Seed
const fullSeed = {
  version: '1.0.0',
  exported_at: '2026-09-05T09:45:00+08:00',
  database_target: 'PostgreSQL 12+',
  tables: {
    users,
    programs,
    employees,
    vacancies,
    applications,
    dss_scores,
    dept_head_evaluations,
    deliberation_ballots,
    hiring_decisions,
    audit_blocks,
    payroll_batches,
    payslips,
    notifications,
    settings
  }
};

// 4. Save JSON files
const backendDataDir = path.join(rootDir, 'backend', 'data');
if (!fs.existsSync(backendDataDir)) {
  fs.mkdirSync(backendDataDir, { recursive: true });
}

const backendJsonPath = path.join(backendDataDir, 'seed_data.json');
const rootJsonPath = path.join(rootDir, 'seed_data.json');

const jsonString = JSON.stringify(fullSeed, null, 2);
fs.writeFileSync(backendJsonPath, jsonString, 'utf8');
fs.writeFileSync(rootJsonPath, jsonString, 'utf8');
console.log(`✅ Generated: ${backendJsonPath} (${Math.round(jsonString.length / 1024)} KB)`);
console.log(`✅ Generated mirror: ${rootJsonPath}`);

// 5. Generate seed_postgres.sql
function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
  }
  return "'" + String(val).replace(/'/g, "''") + "'";
}

let sql = `-- ==============================================================================
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
`;

function generateInsert(tableName, rows) {
  if (!rows || rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  let out = `\n-- Seeding ${tableName} (${rows.length} records)\n`;
  for (const r of rows) {
    const vals = cols.map(c => sqlEscape(r[c])).join(', ');
    out += `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
  }
  return out;
}

sql += generateInsert('users', users);
sql += generateInsert('programs', programs);
sql += generateInsert('employees', employees);
sql += generateInsert('vacancies', vacancies);
sql += generateInsert('applications', applications);
sql += generateInsert('dss_scores', dss_scores);
sql += generateInsert('dept_head_evaluations', dept_head_evaluations);
sql += generateInsert('deliberation_ballots', deliberation_ballots);
sql += generateInsert('hiring_decisions', hiring_decisions);
sql += generateInsert('audit_blocks', audit_blocks);
sql += generateInsert('payroll_batches', payroll_batches);
sql += generateInsert('payslips', payslips);
sql += generateInsert('notifications', notifications);
sql += generateInsert('settings', settings);

sql += `\nCOMMIT;\n\n-- Database seeding completed successfully.\n`;

const backendSqlPath = path.join(backendDataDir, 'seed_postgres.sql');
const rootSqlPath = path.join(rootDir, 'seed_postgres.sql');
fs.writeFileSync(backendSqlPath, sql, 'utf8');
fs.writeFileSync(rootSqlPath, sql, 'utf8');
console.log(`✅ Generated SQL script: ${backendSqlPath} (${Math.round(sql.length / 1024)} KB)`);
console.log(`✅ Generated SQL mirror: ${rootSqlPath}`);
