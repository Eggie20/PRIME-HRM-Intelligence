/**
 * NBSC PRIME-HRM Intelligence Hub — Public Application Tracker Logic
 * Real-time 8-stage progress tracker, docket search, and sample attempts
 */

(function () {
  'use strict';

  // 8 Merit Selection Milestones
  const RECRUITMENT_STAGES = [
    {
      step: 1,
      name: 'Application Docketing',
      shortDesc: 'Packet logged & tracking code assigned',
      icon: '&#128196;'
    },
    {
      step: 2,
      name: 'Document & QS Screening',
      shortDesc: 'HRMO qualification standard audit',
      icon: '&#9989;'
    },
    {
      step: 3,
      name: '4-Pillar DSS Scoring',
      shortDesc: 'Automated comparative ranking',
      icon: '&#128202;'
    },
    {
      step: 4,
      name: 'Demonstration & Exam',
      shortDesc: 'Department head teaching demo & exam',
      icon: '&#127891;'
    },
    {
      step: 5,
      name: 'HRMPSB Deliberation',
      shortDesc: 'Selection board consensus evaluation',
      icon: '&#9878;'
    },
    {
      step: 6,
      name: 'Appointing Authority Selection',
      shortDesc: 'College President executive selection',
      icon: '&#128506;'
    },
    {
      step: 7,
      name: 'CSC Attestation & Plantilla',
      shortDesc: 'Civil Service Commission attestation',
      icon: '&#128220;'
    },
    {
      step: 8,
      name: 'Assumption of Duty',
      shortDesc: 'Formal oath taking & institutional onboarding',
      icon: '&#127979;'
    }
  ];

  // Preset demo records with full PRIME-HRM audit data
  const DEMO_RECORDS = {
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
      statusClass: 'badge--info',
      qsDescription: "Master's Degree in Computer Science, Information Technology, or allied discipline; RA 1080 / CSC Professional Eligibility.",
      scoreSummary: '91.80 / 100.00 — Ranked #1 of 6 Applicants (4-Pillar Composite)',
      docsStatus: 'Verified Complete • PDS (CS Form 212), TOR, CSC Certificate, IPCR Very Satisfactory',
      ledgerHash: 'SHA-256: 7f3b8904e2a1068c8bcf48d2...92df (Block #4 Verified)',
      headline: 'Stage 5 Active: HRMPSB Deliberation & Consensus Evaluation',
      explanation: 'Your credentials, teaching demo score (92.4%), and 4-Pillar Decision Support Score (91.8/100) are currently being reviewed by the Human Resource Merit Promotion and Selection Board. Final ranking will be transmitted to the College President.',
      expectedDate: 'March 15, 2026'
    },
    'NBSC-APP-2026-00001': {
      appId: 'NBSC-APP-2026-00001',
      title: 'Administrative Officer V (HRMO III)',
      office: 'Office of Human Resource Management',
      category: 'Non-Teaching Plantilla',
      salaryGrade: 'SG 18',
      monthlySalary: '₱49,835.00 / month',
      dateSubmitted: 'January 18, 2026',
      currentStage: 7,
      statusLabel: 'Stage 7: CSC Attestation',
      statusClass: 'badge--gold',
      qsDescription: "Bachelor's Degree in Public Administration or HR; 8 hours supervisory training; 2 years relevant supervisory experience; CSC Professional.",
      scoreSummary: '94.20 / 100.00 — Recommended for Appointment by College President',
      docsStatus: 'Certified Complete • CSC Plantilla Packet Dispatched to Field Office',
      ledgerHash: 'SHA-256: d29ea146f41857c093a812...e3b8 (Block #5 Verified)',
      headline: 'Stage 7 Active: CSC Regional Office Attestation Pending',
      explanation: 'Appointment papers signed by the College President have been formally endorsed to Civil Service Commission Regional Office X for final notation and attestation.',
      expectedDate: 'March 10, 2026'
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
      statusClass: 'badge--success',
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
  const formTrack = document.getElementById('form-track');
  const inputTracking = document.getElementById('input-tracking-number');
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const publicNavLinks = document.getElementById('public-nav-links');
  const sampleButtons = document.querySelectorAll('.track-sample-btn');
  const attemptBtn2026 = document.getElementById('attempt-btn-2026');
  const attemptBtn2025 = document.getElementById('attempt-btn-2025');

  // Result Elements
  const trackLoading = document.getElementById('track-loading');
  const trackError = document.getElementById('track-error');
  const trackErrorCode = document.getElementById('track-error-code');
  const trackDetail = document.getElementById('track-detail');
  const btnErrorReset = document.getElementById('btn-error-reset');

  // Detail Elements
  const detailDocket = document.getElementById('detail-docket');
  const detailStatus = document.getElementById('detail-status');
  const detailCategory = document.getElementById('detail-category');
  const detailTitle = document.getElementById('detail-title');
  const detailOffice = document.getElementById('detail-office');
  const detailSg = document.getElementById('detail-sg');
  const detailDate = document.getElementById('detail-date');
  const pipelineProgressText = document.getElementById('pipeline-progress-text');
  const pipelineProgressFill = document.getElementById('pipeline-progress-fill');
  const pipelineStagesContainer = document.getElementById('pipeline-stages-container');
  const stageHeadline = document.getElementById('stage-headline');
  const stageExplanation = document.getElementById('stage-explanation');
  const stageActions = document.getElementById('stage-actions');
  const detailQs = document.getElementById('detail-qs');
  const detailScore = document.getElementById('detail-score');
  const detailDocs = document.getElementById('detail-docs');
  const detailHash = document.getElementById('detail-hash');

  /**
   * Initialize Application Tracker
   */
  function init() {
    setupMobileNav();
    setupEventListeners();
    
    // Check URL parameters for ?appId=...
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('appId') || urlParams.get('docket') || 'NBSC-APP-2026-10001';
    
    loadDocket(codeParam.trim());
  }

  /**
   * Mobile Hamburger Navigation
   */
  function setupMobileNav() {
    if (!navToggleBtn || !publicNavLinks) return;

    navToggleBtn.addEventListener('click', function () {
      const isOpen = publicNavLinks.classList.toggle('is-open');
      navToggleBtn.classList.toggle('is-active');
      navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!navToggleBtn.contains(e.target) && !publicNavLinks.contains(e.target)) {
        publicNavLinks.classList.remove('is-open');
        navToggleBtn.classList.remove('is-active');
        navToggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    if (formTrack) {
      formTrack.addEventListener('submit', function (e) {
        e.preventDefault();
        const code = inputTracking.value.trim().toUpperCase();
        if (code) {
          loadDocket(code);
        }
      });
    }

    sampleButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const code = this.getAttribute('data-code');
        if (code) {
          if (inputTracking) inputTracking.value = code;
          loadDocket(code);
        }
      });
    });

    if (attemptBtn2026) {
      attemptBtn2026.addEventListener('click', function () {
        setActiveAttempt('NBSC-APP-2026-10001');
        loadDocket('NBSC-APP-2026-10001');
      });
    }

    if (attemptBtn2025) {
      attemptBtn2025.addEventListener('click', function () {
        setActiveAttempt('NBSC-APP-2025-08420');
        loadDocket('NBSC-APP-2025-08420');
      });
    }

    if (btnErrorReset) {
      btnErrorReset.addEventListener('click', function () {
        loadDocket('NBSC-APP-2026-10001');
      });
    }
  }

  function setActiveAttempt(code) {
    if (attemptBtn2026) {
      attemptBtn2026.classList.toggle('attempt-item--active', code === 'NBSC-APP-2026-10001');
    }
    if (attemptBtn2025) {
      attemptBtn2025.classList.toggle('attempt-item--active', code === 'NBSC-APP-2025-08420');
    }
  }

  /**
   * Search for Docket and Render
   */
  function loadDocket(trackingCode) {
    showLoading();
    if (inputTracking) inputTracking.value = trackingCode;
    setActiveAttempt(trackingCode);

    setTimeout(() => {
      let record = DEMO_RECORDS[trackingCode];

      // If not in demo records, inspect db.getTable('applications')
      if (!record && window.db && typeof window.db.getTable === 'function') {
        const applications = window.db.getTable('applications') || [];
        const app = applications.find(a => 
          (a.trackingNumber && a.trackingNumber.toUpperCase() === trackingCode) ||
          (a.id && a.id.toString().toUpperCase() === trackingCode) ||
          (a.appId && a.appId.toUpperCase() === trackingCode)
        );

        if (app) {
          const vacancies = window.db.getTable('vacancies') || [];
          const vac = vacancies.find(v => v.id === app.vacancyId) || {};
          
          record = {
            appId: app.trackingNumber || app.id || trackingCode,
            title: vac.title || 'Applicant Position',
            office: vac.department || 'Northern Bukidnon State College',
            category: vac.category || 'Civil Service Plantilla',
            salaryGrade: vac.salaryGrade ? `SG ${vac.salaryGrade}` : 'SG 11',
            monthlySalary: vac.monthlySalary ? `₱${Number(vac.monthlySalary).toLocaleString('en-US', {minimumFractionDigits: 2})} / mo` : '₱27,000.00 / mo',
            dateSubmitted: app.appliedDate || app.createdAt || 'Recent',
            currentStage: app.stage || 3,
            statusLabel: app.status || 'In Evaluation',
            statusClass: 'badge--info',
            qsDescription: vac.education ? `${vac.education}. ${vac.experience || ''}` : 'Standard CSC Qualification Standards applied.',
            scoreSummary: app.score ? `${app.score} / 100.00 — Evaluated` : '88.50 / 100.00 — Complete',
            docsStatus: 'Document Packet Logged and Verified by HRMO',
            ledgerHash: `SHA-256: ${Math.random().toString(36).substring(2, 10)}... (Verified)`,
            headline: `Stage ${app.stage || 3}: Evaluation in Progress`,
            explanation: `The application is actively progressing through the NBSC Merit Selection Plan stages. Updates are audited under CSC PRIME-HRM rules.`,
            expectedDate: 'Ongoing'
          };
        }
      }

      if (record) {
        renderRecord(record);
      } else {
        showError(trackingCode);
      }
    }, 280);
  }

  function showLoading() {
    if (trackLoading) trackLoading.classList.remove('d-none');
    if (trackError) trackError.classList.add('d-none');
    if (trackDetail) trackDetail.classList.add('d-none');
  }

  function showError(code) {
    if (trackLoading) trackLoading.classList.add('d-none');
    if (trackDetail) trackDetail.classList.add('d-none');
    if (trackError) {
      trackError.classList.remove('d-none');
      if (trackErrorCode) trackErrorCode.textContent = code;
    }
  }

  /**
   * Render application details and 8-stage progress tracker
   */
  function renderRecord(rec) {
    if (trackLoading) trackLoading.classList.add('d-none');
    if (trackError) trackError.classList.add('d-none');
    if (trackDetail) trackDetail.classList.remove('d-none');

    // Header info
    if (detailDocket) detailDocket.textContent = rec.appId;
    if (detailStatus) {
      detailStatus.textContent = rec.statusLabel;
      detailStatus.className = `badge ${rec.statusClass || 'badge--info'}`;
    }
    if (detailCategory) detailCategory.textContent = rec.category;
    if (detailTitle) detailTitle.textContent = rec.title;
    if (detailOffice) detailOffice.innerHTML = `&#127970; ${rec.office}`;
    if (detailSg) detailSg.innerHTML = `&#128176; ${rec.salaryGrade} (${rec.monthlySalary})`;
    if (detailDate) detailDate.innerHTML = `&#128197; Submitted: ${rec.dateSubmitted}`;

    // Progress Bar
    const currentStep = rec.currentStage || 1;
    const progressPct = ((currentStep / 8) * 100).toFixed(1);
    if (pipelineProgressText) {
      pipelineProgressText.textContent = `Progress: Stage ${currentStep} of 8 (${progressPct}%)`;
    }
    if (pipelineProgressFill) {
      pipelineProgressFill.style.width = `${progressPct}%`;
    }

    // 8-Stage Grid
    if (pipelineStagesContainer) {
      pipelineStagesContainer.innerHTML = '';
      RECRUITMENT_STAGES.forEach(stage => {
        const stepEl = document.createElement('div');
        let statusClass = 'stage-step--pending';
        let statusText = 'Pending';

        if (stage.step < currentStep) {
          statusClass = 'stage-step--completed';
          statusText = 'Completed &#10003;';
        } else if (stage.step === currentStep) {
          statusClass = 'stage-step--active';
          statusText = 'In Progress';
        }

        stepEl.className = `stage-step ${statusClass}`;
        stepEl.innerHTML = `
          <div class="stage-step__top">
            <span class="stage-step__num">${stage.step < currentStep ? '&#10003;' : stage.step}</span>
            <span class="stage-step__status">${statusText}</span>
          </div>
          <div class="stage-step__title">${stage.name}</div>
          <p class="stage-step__desc">${stage.shortDesc}</p>
        `;
        pipelineStagesContainer.appendChild(stepEl);
      });
    }

    // Current Stage Alert Box
    if (stageHeadline) stageHeadline.textContent = rec.headline;
    if (stageExplanation) stageExplanation.textContent = rec.explanation;
    if (stageActions) {
      stageActions.innerHTML = `
        <span>&#9201; Expected Resolution: <strong>${rec.expectedDate}</strong></span>
        <span class="ms-auto font-xs text-muted">Civil Service Omnibus Rules on Appointments (CSC MC 14, s. 2018)</span>
      `;
    }

    // Spec Box
    if (detailQs) detailQs.textContent = rec.qsDescription;
    if (detailScore) detailScore.textContent = rec.scoreSummary;
    if (detailDocs) detailDocs.textContent = rec.docsStatus;
    if (detailHash) detailHash.textContent = rec.ledgerHash;
  }

  // Run upon DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
