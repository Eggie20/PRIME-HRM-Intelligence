# Recruitment & Hiring Pipeline: Full 5-Stage Architecture & High-Capacity Docket System

A comprehensive technical blueprint to make the entire **Recruitment & Hiring Pipeline** fully operational, reactive, and interconnected across all 5 stages using pure client-side JavaScript (`localStorage` / `NbscDB`), with complete role-based support for **HR Admin**, **HRMPSB Member**, **Dept Head (Dean)**, and the **College President (Appointing Authority)**, plus a high-capacity **Universal Docket Filter** designed to handle small and large applicant pools seamlessly.

---

## 1. Overview of the 5-Stage Hiring Architecture

The NBSC PRIME-HRM Recruitment & Hiring subsystem maps directly to Civil Service Commission (CSC) ORAOHRA and PRIME-HRM Pillar 1 (Recruitment, Selection, and Placement).

```
                      ┌────────────────────────────────────────┐
                      │  0. HIRING PIPELINE OVERVIEW           │
                      │  (hiring-pipeline.html)                │
                      │  • Kanban board & stage metrics        │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
┌─────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
│ 1. CANDIDATE DOSSIER    │──▶│ 2. 4-PILLAR DSS SCORING  │──▶│ 3. DEPT HEAD RUBRIC      │
│ (applicant-review.html) │   │ (dss-scoring.html)       │   │ (evaluation.html)        │
│ • CSC QS verification   │   │ • 4-Pillar radar map     │   │ • 5-point Likert rubric  │
│ • Compliance documents  │   │ • 70.00 merit benchmark  │   │ • Formal recommendation  │
│ • Primary: HR Admin     │   │ • Primary: HR Admin / Sec│   │ • Primary: Dept Head/Dean│
└─────────────────────────┘   └──────────────────────────┘   └──────────────────────────┘
                                                                           │
                                                                           ▼
                              ┌──────────────────────────┐   ┌──────────────────────────┐
                              │ 5. APPOINTMENT RESOLUTION│◀──│ 4. HRMPSB DELIBERATION   │
                              │ (final-decision.html)    │   │ (deliberation.html)      │
                              │ • CSC Form 33 resolution │   │ • Secret deliberative vote│
                              │ • Plantilla assignment   │   │ • Rank 1/2/3 priority    │
                              │ • Primary: President / HR│   │ • Primary: Board Member  │
                              └──────────────────────────┘   └──────────────────────────┘
```

### Stage Summary & Role Ownership

| Stage | Page | Primary Role | Actions & Deliverables |
| :--- | :--- | :--- | :--- |
| **0. Pipeline** | `hiring-pipeline.html` | All Roles | Kanban board across all stages, vacancy filters, stage drag-and-drop. |
| **1. Dossier** | `applicant-review.html` | **HR Admin** | CSC Qualification Standards (QS) verification, PDS 212 check, document authentication, stage advancing. |
| **2. 4-Pillar DSS** | `dss-scoring.html` | **HR Admin / Committee** | 4-Pillar weighted scoring (Merit & Fitness 30%, Technical Competence 30%, Behavioral Ethics 20%, Public Service 20%), radar chart, 70.00 pts threshold. |
| **3. Dept Head Rubric** | `evaluation.html` | **Dept Head (Dean)** | 5-point Likert assessment (Teaching Demo, Pedagogy, Subject Mastery, Research), qualitative justification, formal recommendation. |
| **4. Deliberation** | `deliberation.html` | **HRMPSB Member** | Secret ballot casting (`APPROVE`, `DISAPPROVE`, `ABSTAIN`), Plantilla Rank Priority (Rank 1, 2, 3), live board vote tallies, quorum checking. |
| **5. Resolution** | `final-decision.html` | **College President** *(with HR Admin)* | Official CSC Form 33 Appointment Resolution, salary step and plantilla assignment, presidential signature and seal, cryptographic SHA-256 audit ledger commit. |

---

## 2. High-Capacity Docket Filter Architecture (Scaling to Large Applicant Pools)

### Problem
In high-volume recruitment cycles (e.g. 20, 50, or 100+ candidates), the current implementation has two limitations:
1. `docket-filter.js` restricts chips with `filtered.slice(0, 5)`. Candidates past the 5th cannot be clicked.
2. If all candidates are displayed as static pills, they wrap into multiple rows, breaking visual hierarchy and pushing main page content down.

### Proposed High-Capacity Docket Solution

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍 DOCKET FILTER:  [ Search applicant, ID... ]  [ All Positions ▼ ]  [ All Stages ▼ ]  [ Candidate Combobox Dropdown ▼ ]  Showing 8 of 42│
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ ‹ ]  [ (CM) Carlo Mendoza #28881 ]  [ (ME) Maria Elena Cruz #28882 ]  [ (JP) John Reyes #28883 ] ... [ +37 More ]  [ › ]        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Horizontal Carousel with Kinetic Scroll & Paging Controls (`‹` / `›`):**
   * A single-row chip track (`.docket-chips-scroll`) with `overflow-x: auto`, smooth wheel scroll, touch gestures, and left/right carousel buttons.
   * `chip.scrollIntoView({ behavior: 'smooth', inline: 'center' })` automatically centers the selected applicant whenever a search or dropdown change occurs.

2. **Search with Multi-Field Typeahead & Disambiguation:**
   * Instant debounce search matching: **Full Legal Name**, **Tracking ID** (`NBSC-APP-2026-00001`), **Vacancy Title**, **Applicant Email**, and **Application Date**.
   * Disambiguates applicants with identical names by showing tracking number and filing date.

3. **High-Density Candidate Combobox (`#select-docket-candidate`):**
   * Contains all matching applicants with rich labels: `Carlo Mendoza • [NBSC-APP-2026-00001] • Filed: Aug 20, 2026 • Instructor I (ICS)`.
   * Displays dynamic count pill: `Showing 8 of 8` or `Showing 12 of 85`.

4. **"Browse All Applicants" Quick-Search Modal Drawer:**
   * Clicking the `+N More` chip or a "View All" button opens a lightweight modal drawer listing all applicants in a searchable, sortable table format with status badges.
   * Selecting any applicant instantly closes the modal and switches the active docket.

5. **Universal URL & LocalStorage State Sync:**
   * When an applicant is selected, their ID persists in `localStorage.setItem('nbsc_active_applicant_id', appId)` and updates the URL parameter `?id=app-001`.
   * Navigating between `1. Dossier` → `2. 4-Pillar DSS` → `3. Dept Head Rubric` → `4. HRMPSB Deliberation` → `5. Appointment Resolution` maintains the active candidate seamlessly.

---

## 3. Pure Client-Side JavaScript Architecture (No Backend/Database Server)

All data mutations, voting records, rubric scores, and stage advancements will operate strictly via client-side JavaScript utilizing `NbscDB` and `localStorage`:

### Key Data Stores in `localStorage`:

1. **`applications` Store:**
   * Contains applicant profile, applied vacancy ID, current stage (`SCREENING`, `DSS_SCORED`, `DEPT_EVAL`, `DELIBERATION`, `FINAL_DECISION`, `APPOINTED`), QS checklist verification status, and filing timestamps.
2. **`dss_scores` Store:**
   * Stores candidate 4-pillar scores (Pillar 1: 0–30, Pillar 2: 0–30, Pillar 3: 0–20, Pillar 4: 0–20), computed overall merit index, benchmark status (`COMPLIANT` / `BELOW_THRESHOLD`), and radar chart data points.
3. **`evaluations` Store:**
   * Stores Department Head / Dean rubrics (Teaching Demo, Pedagogy, Subject Mastery, Research), qualitative remarks, and recommendation code (`RECOMMEND`, `RESERVATION`, `NOT_RECOMMENDED`).
4. **`deliberation_votes` Store:**
   * Stores board member ballots:
     ```json
     {
       "application_id": "app-001",
       "voter_id": "usr-hrmpsb-01",
       "voter_name": "Prof. Juan Dela Cruz",
       "voter_role": "HRMPSB_MEMBER",
       "vote": "APPROVE",
       "rank": 1,
       "remarks": "Exemplary technical mastery and teaching demonstration.",
       "voted_at": "2026-08-25T14:30:00Z"
     }
     ```
   * Tallying function aggregates live counts: `X Approved`, `Y Disapproved`, `Z Abstained`.
5. **`resolutions` Store:**
   * Stores official appointment resolutions, presidential approval, appointed plantilla item number, salary grade, step increment, effective date, and generated SHA-256 cryptographic commit hash.
6. **`audit_logs` Store:**
   * Every stage change, ballot cast, rubric save, and appointment signing automatically generates a tamper-evident audit record logged to `frontend/pages/audit/data-logs/data-logs.html` and `audit-chain.html`.

---

## 4. Multi-Role Workflow & Sign-Off (Including College President)

### Role Matrix in Recruitment & Hiring

```
┌─────────────────────────┬──────────────┬───────────────┬─────────────────┬───────────────────┐
│ Feature / Action        │ HR Admin     │ Dept Head     │ HRMPSB Member   │ College President │
├─────────────────────────┼──────────────┼───────────────┼─────────────────┼───────────────────┤
│ View Kanban Pipeline    │ Full Control │ View Assigned │ View All        │ Executive View    │
│ Step 1: Dossier Screen  │ Verify & Save│ Read-Only     │ Read-Only       │ Executive View    │
│ Step 2: 4-Pillar DSS    │ Score & Calib│ Read-Only     │ Inspect Scoring │ Executive View    │
│ Step 3: Dept Rubric     │ Read-Only    │ Full Grading  │ Read-Only       │ Executive View    │
│ Step 4: Deliberation    │ Secretariat  │ Advisory View │ Cast Ballot/Rank│ Board Review      │
│ Step 5: Resolution Sign │ Prepare Doc  │ Read-Only     │ Read-Only       │ Final Signatory   │
└─────────────────────────┴──────────────┴───────────────┴─────────────────┴───────────────────┘
```

### Adding College President Role:
1. **In `constants.js`:**
   * Add `COLLEGE_PRESIDENT: 'COLLEGE_PRESIDENT'` to `ROLES`.
   * Add `'College President / Appointing Authority'` to `ROLE_LABELS`.
2. **In `admin-login.html` & `admin-login.js`:**
   * Add demo chip for **President**: `Dr. Maria Delosa (College President)` with instant quick-fill.
3. **In `final-decision.html` & `final-decision.js`:**
   * Dual signing capability: HR Admin prepares the resolution; College President executes and issues the final appointment with presidential signature and seal.

---

## 5. Proposed Changes by Component

### Component 1: Universal High-Capacity Docket System
- **[MODIFY] `frontend/shared/js/docket-filter.js`**
  - Remove hardcoded `.slice(0, 5)`.
  - Add horizontal scroll carousel with `‹` / `›` pagination buttons.
  - Add typeahead search debounce across Name, Tracking ID, Vacancy, Date.
  - Implement active chip auto-scroll into view.
  - Implement `+N More` quick drawer / modal for massive applicant lists.
  - Sync active applicant ID across `localStorage` and URL parameters.
- **[MODIFY] `frontend/shared/css/modules/navigation.css`**
  - Add styles for `.docket-chips-scroll`, `.docket-carousel-btn`, `.docket-more-btn`, and modal drawer.

### Component 2: Step 1 — Candidate Dossier (`applicant-review`)
- **[MODIFY] `frontend/pages/hiring/applicant-review/applicant-review.js`**
  - Wire stage management dropdown and "Update Application Stage" to advance candidate in pure JS.
  - Persist Qualification Standards (QS) verification checkboxes and remarks to `applications` store.
  - Update top stepper link targets with active candidate ID.

### Component 3: Step 2 — 4-Pillar Decision Support System (`dss-scoring`)
- **[MODIFY] `frontend/pages/hiring/dss-scoring/dss-scoring.js`**
  - Reactive slider calculations across Pillar 1, 2, 3, and 4.
  - Dynamic radar chart re-rendering on slider input.
  - Compute live overall merit index against 70.00 threshold.
  - Save calibrated score to `dss_scores` in `localStorage`.
  - Add "Save & Advance to Dept Head Rubric" action.

### Component 4: Step 3 — Department Head Rubric Evaluation (`evaluation`)
- **[MODIFY] `frontend/pages/hiring/evaluation/evaluation.js`**
  - Ensure Dept Head Likert rubric sliders compute live score (out of 100).
  - Enable saving qualitative justification and formal recommendation (`RECOMMEND`, `RESERVATION`, `NOT_RECOMMENDED`).
  - Persist evaluation to `evaluations` store and advance candidate to `DELIBERATION`.
  - Enforce role check: Dept Head can edit; other roles view in read-only mode.

### Component 5: Step 4 — HRMPSB Deliberation Chamber (`deliberation`)
- **[MODIFY] `frontend/pages/hiring/deliberation/deliberation.js`**
  - Enable board members to cast deliberative votes (`APPROVE`, `DISAPPROVE`, `ABSTAIN`) and select Rank Priority (Rank 1, 2, 3).
  - Tally board votes in real time (e.g. 2 Approved, 0 Disapproved).
  - Display Dept Head recommendation and 4-Pillar DSS snapshot dynamically.
  - Allow HR Admin Secretariat to certify quorum and advance candidate to `FINAL_DECISION`.

### Component 6: Step 5 — Final Appointment Resolution (`final-decision`)
- **[MODIFY] `frontend/pages/hiring/final-decision/final-decision.js`**
  - Load candidate dossier, DSS merit score, Dept Head rubric, and deliberation voting tallies.
  - Enable College President / HR Admin to set Plantilla Item Number, Salary Grade, and Effective Date.
  - Presidential digital sign-off action: generates official appointment resolution, transitions candidate to `APPOINTED`, and logs to cryptographic audit chain.
  - Render printable / exportable CSC Form 33 Appointment Resolution.

### Component 7: Roles & Demo Access Integration
- **[MODIFY] `frontend/shared/js/constants.js`**: Add `COLLEGE_PRESIDENT` role and label.
- **[MODIFY] `frontend/pages/auth/admin-login/admin-login.html` & `admin-login.js`**: Add quick demo access for `College President`.

---

## 6. Verification Plan

### Manual & Automated Verification
1. **High-Capacity Docket Filter Testing:**
   - Seed test dataset with 15+ candidate records across multiple vacancies (`Instructor I`, `Accountant II`, `Administrative Assistant III`).
   - Test search by name, tracking ID (`#28881`), vacancy filter, and stage filter.
   - Verify carousel `‹` / `›` buttons and `+N More` drawer modal.
   - Verify active candidate persists when navigating `1. Dossier` → `2. DSS` → `3. Dept Head` → `4. Deliberation` → `5. Resolution`.
2. **End-to-End Multi-Role Workflow Verification:**
   - **HR Admin:** Screen candidate in Dossier, verify QS, advance to DSS.
   - **Secretariat / HR Admin:** Calibrate 4-Pillar sliders, verify radar map and threshold calculation.
   - **Dept Head:** Login as Dept Head, grade teaching demo rubric, issue recommendation.
   - **HRMPSB Member:** Login as Board Member, cast deliberative ballot, check live vote tally.
   - **College President:** Login as President, review full deliberation matrix, sign and issue CSC Form 33 Appointment Resolution.
3. **Data Integrity & Audit Log Verification:**
   - Verify all actions persist in `localStorage` across page reloads without errors.
   - Check `data-logs.html` and `audit-chain.html` to confirm all hiring transitions generate verifiable audit records.
