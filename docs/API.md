# NBSC PRIME-HRM Intelligence Hub — REST API Reference

All endpoints return uniform JSON responses via `core.response`:
```json
{
  "success": true,
  "message": "Human readable status",
  "data": { ... }
}
```

Protected endpoints require the standard Bearer authentication header:
`Authorization: Bearer <jwt_access_token>`

---

## 1. Authentication (`/api/v1/auth/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/login/` | Authenticate email and password, issue JWT | No |
| `POST` | `/api/v1/auth/refresh/` | Refresh expired access token | No |
| `POST` | `/api/v1/auth/logout/` | Invalidate current session | Yes |
| `GET` | `/api/v1/auth/me/` | Retrieve authenticated user profile | Yes |

---

## 2. Dashboard Analytics (`/api/v1/dashboard/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/kpis/` | High-level KPI indicators (employees, vacancies, pipeline, PRIME score) | Yes (Staff) |
| `GET` | `/api/v1/dashboard/charts/` | Aggregated series for department, employment status, categories, and pillars | Yes (Staff) |

---

## 3. Employees Management (`/api/v1/employees/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/employees/` | Paginated personnel list with filtering (department, status, category, search) | Yes |
| `POST` | `/api/v1/employees/` | Create new employee document | Yes (HR_ADMIN) |
| `GET` | `/api/v1/employees/<id>/` | Detailed employee 201 profile | Yes |
| `PUT` | `/api/v1/employees/<id>/` | Update employee information | Yes (HR_ADMIN) |
| `POST` | `/api/v1/employees/import/` | Bulk import personnel from Excel workbook | Yes (HR_ADMIN) |

---

## 4. Academic & Administrative Programs (`/api/v1/programs/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/programs/` | List academic divisions and degree programs | Yes |
| `POST` | `/api/v1/programs/` | Create new program entity | Yes (HR_ADMIN) |
| `GET` | `/api/v1/programs/<code>/` | Retrieve single program details | Yes |

---

## 5. Vacancies & Recruitment (`/api/v1/vacancies/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/vacancies/public/` | Public active job board listings | No |
| `GET` | `/api/v1/vacancies/` | Administrative vacancy listing | Yes |
| `POST` | `/api/v1/vacancies/` | Create recruitment vacancy with Qualification Standards | Yes (HR_ADMIN) |
| `GET` | `/api/v1/vacancies/<id>/` | Vacancy details and qualification standards | No |
| `PATCH` | `/api/v1/vacancies/<id>/toggle-status/` | Switch vacancy status (`OPEN`, `DELIBERATION`, `CLOSED`) | Yes (HR_ADMIN) |

---

## 6. Applicant Management (`/api/v1/applications/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/applications/submit/` | Submit multipart candidate application with PDS and TOR | No / Yes |
| `GET` | `/api/v1/applications/my-applications/` | List authenticated candidate's active dockets | Yes (APPLICANT) |
| `GET` | `/api/v1/applications/track/<tracking_no>/` | Public tracking lookup with milestone progress | No |
| `GET` | `/api/v1/applications/` | Administrative applicant listing for Kanban pipeline | Yes (Staff) |
| `PATCH` | `/api/v1/applications/<id>/stage/` | Update 8-stage recruitment pipeline position | Yes (Staff) |

---

## 7. Hiring Intelligence & Deliberation (`/api/v1/hiring/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/hiring/dss/calculate/` | Compute 4-Pillar DSS score with radar series | Yes (Staff) |
| `POST` | `/api/v1/hiring/evaluation/` | Submit Department Head Likert rubric evaluation | Yes (DEPT_HEAD) |
| `POST` | `/api/v1/hiring/deliberation/vote/` | Cast HRMPSB board member ballot | Yes (HRMPSB) |
| `GET` | `/api/v1/hiring/deliberation/<vac_id>/` | View board deliberation vote tally and candidate matrix | Yes (Staff) |
| `POST` | `/api/v1/hiring/decision/` | Final appointment sign-off and SHA-256 block commitment | Yes (HR_ADMIN) |

---

## 8. Cryptographic Audit Trail (`/api/v1/audit/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/audit/chain/` | Retrieve chronological blockchain ledger | Yes (Staff) |
| `GET` | `/api/v1/audit/verify/` | Execute cryptographic hash validation across all blocks | Yes (Staff) |

---

## 9. Payroll & Encrypted Payslips (`/api/v1/payroll/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/payroll/upload/` | Upload and preview Excel payroll workbook | Yes (HR_ADMIN) |
| `POST` | `/api/v1/payroll/process/` | Generate branded ReportLab PDFs and AES-128 encryption | Yes (HR_ADMIN) |
| `GET` | `/api/v1/payroll/batches/` | Historical disbursement cycles | Yes (HR_ADMIN) |
| `GET` | `/api/v1/payroll/my-payslips/` | Personal payslip records for authenticated employee | Yes |
| `GET` | `/api/v1/payroll/payslips/<id>/download/` | Stream password-protected PDF document | Yes |

---

## 10. SARA Voice AI Assistant (`/api/v1/sara/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/sara/chat/` | Conversational query (text or speech transcript) with RAG & tools | No / Yes |
| `GET` | `/api/v1/sara/history/<session_id>/` | Retrieve message history for active conversation session | No / Yes |
| `POST` | `/api/v1/sara/feedback/` | Submit helpfulness rating for AI response | No / Yes |

---

## 11. In-App Notifications (`/api/v1/notifications/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/notifications/` | List recent notifications and unread count | Yes |
| `PATCH` | `/api/v1/notifications/<id>/read/` | Mark single notification as read | Yes |
| `POST` | `/api/v1/notifications/read-all/` | Mark all user notifications as read | Yes |
