/**
 * NBSC PRIME-HRM Intelligence Hub — Shared Constants
 * Application-wide enums, URLs, role definitions, and pipeline stages.
 */

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000/api/v1';

const ROLES = {
  HR_ADMIN: 'HR_ADMIN',
  HRMPSB_MEMBER: 'HRMPSB_MEMBER',
  DEPT_HEAD: 'DEPT_HEAD',
  APPLICANT: 'APPLICANT',
  EMPLOYEE: 'EMPLOYEE'
};

const ROLE_LABELS = {
  HR_ADMIN: 'HR Administrator',
  HRMPSB_MEMBER: 'HRMPSB Board Member',
  DEPT_HEAD: 'Department Head',
  APPLICANT: 'Applicant',
  EMPLOYEE: 'College Employee'
};

const HIRING_STAGES = {
  APPLIED: 'APPLIED',
  SCREENING: 'SCREENING',
  DSS_SCORED: 'DSS_SCORED',
  DEPT_EVAL: 'DEPT_EVAL',
  DELIBERATION: 'DELIBERATION',
  FINAL_DECISION: 'FINAL_DECISION',
  APPOINTED: 'APPOINTED',
  REJECTED: 'REJECTED'
};

const STAGE_LABELS = {
  APPLIED: '1. Application Submitted',
  SCREENING: '2. Document Screening',
  DSS_SCORED: '3. 4-Pillar DSS Scoring',
  DEPT_EVAL: '4. Department Head Evaluation',
  DELIBERATION: '5. HRMPSB Deliberation & Voting',
  FINAL_DECISION: '6. HR Admin Final Decision',
  APPOINTED: '7. Officially Appointed',
  REJECTED: 'Application Closed'
};

const STAGE_ORDER = [
  'APPLIED',
  'SCREENING',
  'DSS_SCORED',
  'DEPT_EVAL',
  'DELIBERATION',
  'FINAL_DECISION',
  'APPOINTED'
];

const DEPARTMENTS = [
  { code: 'DGEC', name: 'Department of General Education & Communication' },
  { code: 'IBM',  name: 'Institute of Business and Management' },
  { code: 'ICS',  name: 'Institute of Computer Studies' },
  { code: 'ITE',  name: 'Institute of Teacher Education' },
  { code: 'ADMIN', name: 'Administrative & General Support' },
  { code: 'FIN',   name: 'Finance & Accounting Division' },
  { code: 'REG',   name: 'Office of the College Registrar' }
];

const EMPLOYMENT_STATUSES = {
  PERMANENT: 'Permanent (Plantilla)',
  TEMPORARY: 'Temporary',
  COS: 'Contract of Service (COS)',
  JOB_ORDER: 'Job Order (JO)',
  PART_TIME: 'Part-Time Faculty'
};

const VACANCY_TYPES = {
  TEACHING: 'Teaching / Faculty',
  NON_TEACHING: 'Non-Teaching / Staff'
};
