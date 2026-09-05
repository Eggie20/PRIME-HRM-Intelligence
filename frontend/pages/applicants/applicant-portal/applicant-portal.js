/**
 * NBSC PRIME-HRM Intelligence Hub — Applicant Portal Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // If not logged in, redirect to applicant login
  const token = getAuthToken();
  if (!token) {
    window.location.href = '../../auth/applicant-login/applicant-login.html';
    return;
  }

  const user = getUser();
  const applicantNameEl = document.getElementById('applicant-name');
  if (applicantNameEl && user) {
    applicantNameEl.textContent = user.name || user.email;
  }

  const appsContainer = document.getElementById('applications-container');
  const emptyStateContainer = document.getElementById('applications-empty-state');
  const recommendedGrid = document.getElementById('recommended-grid');
  const btnLogout = document.getElementById('btn-applicant-logout');

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout('../../auth/applicant-login/applicant-login.html');
    });
  }

  // 7 Primary Timeline Display Stages
  const TIMELINE_STAGES = [
    { key: 'APPLIED', label: '1. Applied' },
    { key: 'SCREENING', label: '2. Screening' },
    { key: 'DSS_SCORED', label: '3. 4-Pillars' },
    { key: 'DEPT_EVAL', label: '4. Dept Eval' },
    { key: 'DELIBERATION', label: '5. Deliberation' },
    { key: 'FINAL_DECISION', label: '6. Decision' },
    { key: 'APPOINTED', label: '7. Appointed' }
  ];

  /**
   * Fetches applications belonging to current user.
   */
  async function fetchMyApplications() {
    showLoadingSpinner(appsContainer);

    try {
      const res = await apiGet('/applications/my-applications/');
      if (res.success && res.data) {
        renderApplications(res.data.applications || []);
      } else {
        showToast(res.message || 'Unable to retrieve applications.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to recruitment database.', 'error');
    }
  }

  /**
   * Renders application cards with interactive 7-step timeline stepper.
   * @param {Array<Object>} applications
   */
  function renderApplications(applications) {
    appsContainer.innerHTML = '';

    if (!applications || applications.length === 0) {
      emptyStateContainer.classList.remove('d-none');
      renderEmptyState(
        emptyStateContainer,
        'No Active Applications Found',
        'You have not submitted any applications yet. Explore open vacancies to begin your journey at NBSC.'
      );
      return;
    }

    emptyStateContainer.classList.add('d-none');

    applications.forEach(app => {
      const card = document.createElement('article');
      card.className = 'application-card';

      const currentStageIndex = TIMELINE_STAGES.findIndex(s => s.key === app.stage);
      const isRejected = app.stage === 'REJECTED';

      // Compute stepper percentage
      let progressPercent = 0;
      if (!isRejected && currentStageIndex >= 0) {
        progressPercent = Math.min(100, Math.round((currentStageIndex / (TIMELINE_STAGES.length - 1)) * 100));
      }

      // Generate Stepper HTML
      let stepsHtml = '';
      TIMELINE_STAGES.forEach((stageObj, idx) => {
        let stepClass = 'stepper__step';
        let circleContent = `${idx + 1}`;

        if (!isRejected) {
          if (idx < currentStageIndex) {
            stepClass += ' stepper__step--completed';
            circleContent = '&#10003;';
          } else if (idx === currentStageIndex) {
            stepClass += ' stepper__step--active';
          }
        }

        stepsHtml += `
          <div class="${stepClass}">
            <div class="stepper__circle">${circleContent}</div>
            <span class="stepper__label">${stageObj.label}</span>
          </div>
        `;
      });

      const latestRemarks = app.stage_history && app.stage_history.length > 0
        ? app.stage_history[app.stage_history.length - 1].remarks
        : 'Application processing underway.';

      card.innerHTML = `
        <div class="application-card__top">
          <div>
            <span class="badge badge--teaching mb-1">${escapeHtml(app.tracking_number)}</span>
            <h3 class="application-card__position">${escapeHtml(app.vacancy_title)}</h3>
            <div class="application-card__dept">${escapeHtml(app.vacancy_department)} &bull; Applied: ${escapeHtml(app.created_at || 'Recent')}</div>
          </div>
          <div>
            <a href="../application-track/application-track.html?tracking=${encodeURIComponent(app.tracking_number)}" class="btn btn--secondary btn--sm">
              Full Milestone History &rarr;
            </a>
          </div>
        </div>

        <div class="stepper">
          <div class="stepper__track">
            <div class="stepper__track-fill" style="width: ${progressPercent}%;"></div>
          </div>
          ${stepsHtml}
        </div>

        <div class="application-card__status-banner">
          <div>
            <strong>Latest Milestone:</strong>
            <span>${escapeHtml(STAGE_LABELS[app.stage] || app.stage)}</span>
            ${isRejected ? '<span class="badge badge--danger ml-2">Application Closed</span>' : ''}
          </div>
          <div class="text-muted font-xs">
            ${escapeHtml(latestRemarks)}
          </div>
        </div>
      `;

      appsContainer.appendChild(card);
    });
  }

  /**
   * Fetches open positions to recommend at bottom of dashboard.
   */
  async function fetchRecommendedVacancies() {
    try {
      const res = await apiGet('/vacancies/public/');
      if (res.success && res.data && res.data.vacancies) {
        const top3 = res.data.vacancies.slice(0, 3);
        recommendedGrid.innerHTML = '';
        top3.forEach(v => {
          const item = document.createElement('div');
          item.className = 'card p-4';
          item.innerHTML = `
            <h4 class="font-md font-bold mb-1">${escapeHtml(v.title)}</h4>
            <div class="text-muted font-xs mb-3">${escapeHtml(v.department)} &bull; SG ${v.salary_grade}</div>
            <a href="../apply/apply.html?vacancy_id=${v.id}" class="btn btn--sm btn--secondary w-100">
              Apply &rarr;
            </a>
          `;
          recommendedGrid.appendChild(item);
        });
      }
    } catch (err) {
      console.warn('Could not load recommended openings', err);
    }
  }

  // Init
  fetchMyApplications();
  fetchRecommendedVacancies();
});
