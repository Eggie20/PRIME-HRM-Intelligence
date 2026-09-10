/**
 * NBSC Candidate Portal — Application Track Logic
 * Synchronized with Candidate Profile (Carlo Mendoza) & 8-Stage Progress Tracker
 */

(function () {
  'use strict';

  // 8 Merit Selection Milestones
  const RECRUITMENT_STAGES = [
    { step: 1, name: 'Application Docketing', shortDesc: 'Packet logged & tracking code assigned' },
    { step: 2, name: 'Document & QS Screening', shortDesc: 'HRMO qualification standard audit' },
    { step: 3, name: '4-Pillar DSS Scoring', shortDesc: 'Automated comparative ranking' },
    { step: 4, name: 'Demonstration & Exam', shortDesc: 'Department head teaching demo & exam' },
    { step: 5, name: 'HRMPSB Deliberation', shortDesc: 'Selection board consensus evaluation' },
    { step: 6, name: 'Appointing Authority Selection', shortDesc: 'College President executive selection' },
    { step: 7, name: 'CSC Attestation & Plantilla', shortDesc: 'Civil Service Commission attestation' },
    { step: 8, name: 'Assumption of Duty', shortDesc: 'Formal oath taking & institutional onboarding' }
  ];

  // Candidate Submissions
  const CANDIDATE_RECORDS = {
    'NBSC-APP-2026-10001': {
      appId: 'NBSC-APP-2026-10001',
      title: 'Instructor I (Computer Studies)',
      office: 'Institute of Computer Studies (ICS)',
      category: 'Faculty Plantilla',
      salaryGrade: 'SG 12',
      monthlySalary: '₱31,800.00 / month',
      dateSubmitted: 'February 12, 2026',
      currentStage: 5,
      statusLabel: 'Stage 5: HRMPSB Deliberation',
      statusClass: 'badge-status',
      qsDescription: "Master's Degree in Computer Science, Information Technology, or allied discipline; RA 1080 / CSC Professional Eligibility.",
      scoreSummary: '91.80 / 100.00 — Ranked #1 of 6 Applicants (4-Pillar Composite)',
      docsStatus: 'Verified Complete • PDS (CS Form 212), TOR, CSC Certificate, IPCR Very Satisfactory',
      ledgerHash: 'SHA-256: 7f3b8904e2a1068c8bcf48d2...92df (Block #4 Verified)',
      headline: 'Stage 5 Active: HRMPSB Deliberation & Consensus Evaluation',
      explanation: 'Your credentials, teaching demo rubric (92.4%), and 4-Pillar Decision Support Score (91.8/100) are currently under review by the Human Resource Merit Promotion and Selection Board. Final selection consensus will be transmitted to the College President.',
      expectedDate: 'March 15, 2026'
    },
    'NBSC-APP-2025-08420': {
      appId: 'NBSC-APP-2025-08420',
      title: 'Administrative Assistant III (Senior Bookkeeper)',
      office: 'Finance & Budget Services Division',
      category: 'Non-Teaching Plantilla',
      salaryGrade: 'SG 09',
      monthlySalary: '₱23,011.00 / month',
      dateSubmitted: 'November 04, 2025',
      currentStage: 8,
      statusLabel: 'Stage 8: Assumption of Duty (Completed)',
      statusClass: 'badge-status',
      qsDescription: "Completion of 2 years college studies; 4 hours relevant financial training; 1 year relevant experience; CSC Sub-Professional or Professional.",
      scoreSummary: '89.50 / 100.00 — Fully Attested by CSC Field Office Bukidnon',
      docsStatus: 'Completed & Archived • Oath of Office & Plantilla Item Assumed',
      ledgerHash: 'SHA-256: 3c7a918e5b22...890a (Block #6 Finalized)',
      headline: 'Stage 8 Completed: Appointed & Onboarded to Institutional Plantilla',
      explanation: 'Application completed. The appointee has assumed formal duty under Plantilla Item No. NBSC-ADAS3-09-2025 with CS Form 33-A fully signed and attested.',
      expectedDate: 'Concluded Dec 15, 2025'
    }
  };

  // DOM Elements
  const formCandidateTrack = document.getElementById('form-candidate-track');
  const inputTrackingCode = document.getElementById('input-tracking-code');
  const attemptBtn2026 = document.getElementById('attempt-btn-2026');
  const attemptBtn2025 = document.getElementById('attempt-btn-2025');
  const btnResetDefault = document.getElementById('btn-reset-default');
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const topbarMobileDrawer = document.getElementById('topbar-mobile-drawer');
  const btnApplicantLogout = document.getElementById('btn-applicant-logout');
  const btnMobileLogout = document.getElementById('btn-mobile-logout');

  // Display Cards
  const candidateTrackLoading = document.getElementById('candidate-track-loading');
  const candidateTrackError = document.getElementById('candidate-track-error');
  const candidateDetailCard = document.getElementById('candidate-detail-card');
  const candidateErrorText = document.getElementById('candidate-error-text');

  // Detail Fields
  const cardDocket = document.getElementById('card-docket');
  const cardStatusBadge = document.getElementById('card-status-badge');
  const cardCategory = document.getElementById('card-category');
  const cardJobTitle = document.getElementById('card-job-title');
  const cardJobMeta = document.getElementById('card-job-meta');
  const cardProgressText = document.getElementById('card-progress-text');
  const cardProgressFill = document.getElementById('card-progress-fill');
  const candidatePipelineGrid = document.getElementById('candidate-pipeline-grid');
  const cardStageHeadline = document.getElementById('card-stage-headline');
  const cardStageDesc = document.getElementById('card-stage-desc');
  const cardStageMeta = document.getElementById('card-stage-meta');
  const cardQs = document.getElementById('card-qs');
  const cardScore = document.getElementById('card-score');
  const cardDocs = document.getElementById('card-docs');
  const cardHash = document.getElementById('card-hash');

  function init() {
    setupListeners();

    // Check query param or default to active 2026 attempt
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('appId') || urlParams.get('docket') || 'NBSC-APP-2026-10001';

    loadCandidateDocket(codeParam.trim());
  }

  function setupListeners() {
    if (formCandidateTrack) {
      formCandidateTrack.addEventListener('submit', function (e) {
        e.preventDefault();
        const code = inputTrackingCode.value.trim().toUpperCase();
        if (code) {
          loadCandidateDocket(code);
        }
      });
    }

    if (attemptBtn2026) {
      attemptBtn2026.addEventListener('click', function () {
        loadCandidateDocket('NBSC-APP-2026-10001');
      });
    }

    if (attemptBtn2025) {
      attemptBtn2025.addEventListener('click', function () {
        loadCandidateDocket('NBSC-APP-2025-08420');
      });
    }

    if (btnResetDefault) {
      btnResetDefault.addEventListener('click', function () {
        loadCandidateDocket('NBSC-APP-2026-10001');
      });
    }
  }

  function updateActiveSidebarBtn(code) {
    if (attemptBtn2026) {
      attemptBtn2026.classList.toggle('side-attempt-btn--active', code === 'NBSC-APP-2026-10001');
    }
    if (attemptBtn2025) {
      attemptBtn2025.classList.toggle('side-attempt-btn--active', code === 'NBSC-APP-2025-08420');
    }
  }

  function loadCandidateDocket(code) {
    if (candidateTrackLoading) candidateTrackLoading.classList.remove('d-none');
    if (candidateTrackError) candidateTrackError.classList.add('d-none');
    if (candidateDetailCard) candidateDetailCard.classList.add('d-none');
    if (inputTrackingCode) inputTrackingCode.value = code;

    updateActiveSidebarBtn(code);

    setTimeout(() => {
      let record = CANDIDATE_RECORDS[code];

      // Check offline db if available
      if (!record && window.db && typeof window.db.getTable === 'function') {
        const apps = window.db.getTable('applications') || [];
        const app = apps.find(a => 
          (a.trackingNumber && a.trackingNumber.toUpperCase() === code) ||
          (a.id && a.id.toString().toUpperCase() === code)
        );

        if (app) {
          const vacancies = window.db.getTable('vacancies') || [];
          const vac = vacancies.find(v => v.id === app.vacancyId) || {};

          record = {
            appId: app.trackingNumber || app.id || code,
            title: vac.title || 'Candidate Application',
            office: vac.department || 'Northern Bukidnon State College',
            category: vac.category || 'Civil Service Plantilla',
            salaryGrade: vac.salaryGrade ? `SG ${vac.salaryGrade}` : 'SG 11',
            monthlySalary: vac.monthlySalary ? `₱${Number(vac.monthlySalary).toLocaleString('en-US', {minimumFractionDigits: 2})} / mo` : '₱27,000.00 / mo',
            dateSubmitted: app.appliedDate || app.createdAt || 'Recent',
            currentStage: app.stage || 3,
            statusLabel: app.status || 'In Progress',
            statusClass: 'badge-status',
            qsDescription: vac.education ? `${vac.education}. ${vac.experience || ''}` : 'Standard CSC Qualification Standards applied.',
            scoreSummary: app.score ? `${app.score} / 100.00 — Evaluated` : '88.50 / 100.00',
            docsStatus: 'Verified Complete by HRMO Document Audit',
            ledgerHash: `SHA-256: ${Math.random().toString(36).substring(2, 10)}... (Verified)`,
            headline: `Stage ${app.stage || 3}: Under Evaluation`,
            explanation: `Your application is actively progressing through the NBSC Merit Selection Plan stages.`,
            expectedDate: 'Ongoing'
          };
        }
      }

      if (record) {
        renderCandidateRecord(record);
      } else {
        if (candidateTrackLoading) candidateTrackLoading.classList.add('d-none');
        if (candidateTrackError) {
          candidateTrackError.classList.remove('d-none');
          if (candidateErrorText) candidateErrorText.textContent = `No record found for tracking docket "${code}".`;
        }
      }
    }, 220);
  }

  function renderCandidateRecord(rec) {
    if (candidateTrackLoading) candidateTrackLoading.classList.add('d-none');
    if (candidateTrackError) candidateTrackError.classList.add('d-none');
    if (candidateDetailCard) candidateDetailCard.classList.remove('d-none');

    if (cardDocket) cardDocket.textContent = rec.appId;
    if (cardStatusBadge) cardStatusBadge.textContent = rec.statusLabel;
    if (cardCategory) cardCategory.textContent = rec.category;
    if (cardJobTitle) cardJobTitle.textContent = rec.title;
    if (cardJobMeta) {
      cardJobMeta.innerHTML = `
        <span>&#127970; ${rec.office}</span> &bull; 
        <span>&#128176; ${rec.salaryGrade} (${rec.monthlySalary})</span> &bull; 
        <span>&#128197; Submitted: ${rec.dateSubmitted}</span>
      `;
    }

    // Progress Bar
    const currentStep = rec.currentStage || 1;
    const pct = ((currentStep / 8) * 100).toFixed(1);
    if (cardProgressText) cardProgressText.textContent = `Progress: Stage ${currentStep} of 8 (${pct}%)`;
    if (cardProgressFill) cardProgressFill.style.width = `${pct}%`;

    // 8-Stage Grid
    if (candidatePipelineGrid) {
      candidatePipelineGrid.innerHTML = '';
      RECRUITMENT_STAGES.forEach(stage => {
        const stepEl = document.createElement('div');
        let statusClass = 'candidate-stage-step--pending';
        let statusText = 'Pending';

        if (stage.step < currentStep) {
          statusClass = 'candidate-stage-step--completed';
          statusText = 'Completed &#10003;';
        } else if (stage.step === currentStep) {
          statusClass = 'candidate-stage-step--active';
          statusText = 'In Progress';
        }

        stepEl.className = `candidate-stage-step ${statusClass}`;
        stepEl.innerHTML = `
          <div class="step-top">
            <span class="step-num">${stage.step < currentStep ? '&#10003;' : stage.step}</span>
            <span class="step-status">${statusText}</span>
          </div>
          <div class="step-title">${stage.name}</div>
          <p class="step-desc">${stage.shortDesc}</p>
        `;
        candidatePipelineGrid.appendChild(stepEl);
      });
    }

    // Stage Alert
    if (cardStageHeadline) cardStageHeadline.textContent = rec.headline;
    if (cardStageDesc) cardStageDesc.textContent = rec.explanation;
    if (cardStageMeta) {
      cardStageMeta.innerHTML = `
        <span>&#9201; Expected Resolution: <strong>${rec.expectedDate}</strong></span>
        <span class="ms-auto font-xs text-muted">Omnibus Rules on Appointments (CSC MC 14, s. 2018)</span>
      `;
    }

    // Matrix
    if (cardQs) cardQs.textContent = rec.qsDescription;
    if (cardScore) cardScore.textContent = rec.scoreSummary;
    if (cardDocs) cardDocs.textContent = rec.docsStatus;
    if (cardHash) cardHash.textContent = rec.ledgerHash;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
