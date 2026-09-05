/**
 * NBSC PRIME-HRM Intelligence Hub — Application Status Tracking Logic
 * Executive Tracking & Milestone History Experience
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-track');
  const inputTracking = document.getElementById('input-tracking-number');
  const btnSubmit = document.getElementById('btn-track-submit');

  const resultsCard = document.getElementById('track-results-card');
  const emptyStateContainer = document.getElementById('track-empty-state');
  const initialStateContainer = document.getElementById('track-initial-state');

  const resultTrackingNum = document.getElementById('result-tracking-num');
  const resultVacancyTitle = document.getElementById('result-vacancy-title');
  const resultDepartment = document.getElementById('result-department');
  const resultCurrentStage = document.getElementById('result-current-stage');
  const resultUpdatedDate = document.getElementById('result-updated-date');
  const timelineContainer = document.getElementById('milestone-timeline-container');

  // Mobile Navigation Drawer Toggle
  const navToggle = document.getElementById('nav-toggle-btn');
  const navLinks = document.getElementById('public-nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Quick Sample Docket Buttons
  const sampleBtns = document.querySelectorAll('.track-sample-btn');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      if (code && inputTracking) {
        inputTracking.value = code;
        trackApplication(code);
      }
    });
  });

  // Check URL query param for instant track (only if explicitly provided via link query)
  const urlTracking = typeof getQueryParam === 'function' ? getQueryParam('tracking') : null;
  if (urlTracking) {
    inputTracking.value = urlTracking;
    trackApplication(urlTracking);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const trackingCode = inputTracking.value.trim();
    if (trackingCode) {
      if (typeof setQueryParam === 'function') {
        setQueryParam('tracking', trackingCode);
      }
      trackApplication(trackingCode);
    }
  });

  /**
   * Queries application tracking endpoint by code.
   * @param {string} code
   */
  async function trackApplication(code) {
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>Searching...</span>';
    }

    if (initialStateContainer) initialStateContainer.classList.add('d-none');
    if (resultsCard) resultsCard.classList.add('d-none');
    if (emptyStateContainer) {
      emptyStateContainer.classList.add('d-none');
      emptyStateContainer.innerHTML = '';
    }

    try {
      const res = await apiGet(`/applications/track/${encodeURIComponent(code)}/`);
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>Track Status</span><span>&rarr;</span>';
      }

      if (res && res.success && res.data) {
        renderTrackingResult(res.data);
      } else {
        showEmptyState(code);
      }
    } catch (err) {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>Track Status</span><span>&rarr;</span>';
      }
      // Fallback: Check local DB if API call failed
      if (typeof db !== 'undefined') {
        const apps = db.getTable('applications') || [];
        const found = apps.find(a => 
          (a.tracking_number && a.tracking_number.toLowerCase() === code.toLowerCase()) ||
          (a.id && a.id.toLowerCase() === code.toLowerCase())
        );

        if (found) {
          const vacs = db.getTable('vacancies') || [];
          const v = vacs.find(vac => vac.id === found.vacancy_id) || {};
          renderTrackingResult({
            tracking_number: found.tracking_number || code,
            vacancy_title: v.title || 'Instructor I (Computer Studies)',
            department: v.department || 'Institute of Computer Studies (ICS)',
            stage: found.stage || 'DELIBERATION',
            created_at: 'August 20, 2026',
            updated_at: 'September 2, 2026',
            stage_history: found.stage_history || []
          });
          return;
        }
      }
      showEmptyState(code);
    }
  }

  /**
   * Renders the status and stage milestones.
   * @param {Object} data
   */
  function renderTrackingResult(data) {
    if (!resultsCard) return;
    resultsCard.classList.remove('d-none');

    if (resultTrackingNum) resultTrackingNum.textContent = data.tracking_number || 'NBSC-APP-2026';
    if (resultVacancyTitle) resultVacancyTitle.textContent = data.vacancy_title || 'Plantilla Position';
    if (resultDepartment) {
      resultDepartment.textContent = `${data.department || 'NBSC'} • Applied on ${data.created_at || 'Recent'}`;
    }

    const stageLabel = (typeof STAGE_LABELS !== 'undefined' && STAGE_LABELS[data.stage]) 
      ? STAGE_LABELS[data.stage] 
      : data.stage;

    if (resultCurrentStage) {
      resultCurrentStage.innerHTML = `
        <span class="track-pulse-dot"></span>
        <span>${escapeHtml(stageLabel)}</span>
      `;
    }

    if (resultUpdatedDate) {
      resultUpdatedDate.textContent = `Last active: ${data.updated_at || 'Recently'}`;
    }

    // Master 8-Stage Progression for CSC PRIME-HRM
    const MASTER_STAGES = [
      { key: 'APPLIED', num: '01', title: '1. Application Docketing', defaultRemarks: 'Application packet received via NBSC Career Portal and tracking docket generated.' },
      { key: 'SCREENING', num: '02', title: '2. Document & QS Screening', defaultRemarks: 'Human Resource Management Office (HRMO) verified Qualification Standards (QS) and TOR compliance.' },
      { key: 'DSS_SCORED', num: '03', title: '3. 4-Pillar DSS Scoring', defaultRemarks: 'Automated 4-Pillar Decision Support System completed comparative benchmark scoring.' },
      { key: 'DEPT_EVAL', num: '04', title: '4. Dept Head Demonstration', defaultRemarks: 'Department Head / Institute Dean completed teaching demonstration rubric and technical interview.' },
      { key: 'DELIBERATION', num: '05', title: '5. HRMPSB Deliberation', defaultRemarks: 'HRMPSB Board Members actively conducting comparative deliberation and consensus ranking.' },
      { key: 'FINAL_DECISION', num: '06', title: '6. President Appointment', defaultRemarks: 'College President issuance of appointment notice under Civil Service Commission rules.' },
      { key: 'RESOLUTION', num: '07', title: '7. Board Attestation', defaultRemarks: 'Official Board Resolution and Plantilla Assignment submitted to CSC Field Office.' },
      { key: 'OATH', num: '08', title: '8. Assumption to Duty', defaultRemarks: 'Administration of Oath of Office and formal institutional onboarding.' }
    ];

    const currentKey = (data.stage || 'DELIBERATION').toUpperCase();
    let currentIndex = MASTER_STAGES.findIndex(s => s.key === currentKey);
    if (currentIndex === -1) currentIndex = 4; // default to stage 5 (Deliberation)

    // Update Progress Bar
    const progressPct = Math.round(((currentIndex + 1) / MASTER_STAGES.length) * 100);
    const progressFill = document.getElementById('track-progress-fill');
    const progressText = document.getElementById('track-progress-pct');
    if (progressFill) progressFill.style.width = `${progressPct}%`;
    if (progressText) progressText.textContent = `Stage ${currentIndex + 1} of ${MASTER_STAGES.length} (${progressPct}%)`;

    // Render Milestones Grid (2-Column Arrangement)
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';

    const history = data.stage_history || [];
    const historyMap = {};
    history.forEach(h => {
      if (h.stage) historyMap[h.stage.toUpperCase()] = h;
    });

    // Default dates for completed stages if not in history
    const sampleDates = [
      'August 20, 2026 • 08:30 AM',
      'August 23, 2026 • 11:15 AM',
      'August 26, 2026 • 02:00 PM',
      'August 29, 2026 • 04:45 PM',
      'September 2, 2026 • 10:00 AM'
    ];

    MASTER_STAGES.forEach((stage, idx) => {
      const node = document.createElement('div');
      let statusClass = 'pending';
      let statusIcon = stage.num;
      let badgeText = 'UPCOMING';
      let dateDisplay = 'Scheduled Milestone';
      let remarks = stage.defaultRemarks;

      const logged = historyMap[stage.key];

      if (idx < currentIndex) {
        statusClass = 'completed';
        statusIcon = '&#10003;';
        badgeText = 'VERIFIED';
        dateDisplay = logged && logged.timestamp ? (typeof formatDate === 'function' ? formatDate(logged.timestamp) : logged.timestamp) : (sampleDates[idx] || 'Completed');
        if (logged && logged.remarks) remarks = logged.remarks;
      } else if (idx === currentIndex) {
        statusClass = 'active';
        statusIcon = '&#9679;';
        badgeText = 'IN PROGRESS';
        dateDisplay = logged && logged.timestamp ? (typeof formatDate === 'function' ? formatDate(logged.timestamp) : logged.timestamp) : (sampleDates[idx] || 'Active Phase');
        if (logged && logged.remarks) remarks = logged.remarks;
      } else {
        statusClass = 'pending';
        statusIcon = stage.num;
        badgeText = 'UPCOMING';
        dateDisplay = 'Awaiting Prior Milestone';
      }

      node.className = `milestone-node milestone-node--${statusClass}`;
      node.innerHTML = `
        <div class="milestone-node__dot" aria-hidden="true">${statusIcon}</div>
        <div class="milestone-node__content">
          <div class="milestone-node__header">
            <span class="milestone-node__stage">${escapeHtml(stage.title)}</span>
            <span class="milestone-node__badge">${badgeText}</span>
          </div>
          <div class="milestone-node__time">
            <span>&#128337;</span>
            <span>${escapeHtml(dateDisplay)}</span>
          </div>
          <div class="milestone-node__remarks">
            ${escapeHtml(remarks)}
          </div>
        </div>
      `;

      timelineContainer.appendChild(node);
    });
  }

  /**
   * Helper to display an attractive empty state when a tracking code is not found.
   */
  function showEmptyState(code) {
    if (!emptyStateContainer) return;
    emptyStateContainer.classList.remove('d-none');
    emptyStateContainer.innerHTML = `
      <div class="track-empty-box">
        <div class="track-empty-box__icon">&#128270;</div>
        <h3 class="track-empty-box__title">No Records Found</h3>
        <p class="track-empty-box__text">
          We could not find an active recruitment record matching <strong>"${escapeHtml(code)}"</strong>.
          Please double-check your official CSC application acknowledgment email or try one of the sample tracking codes above.
        </p>
      </div>
    `;
  }
});
