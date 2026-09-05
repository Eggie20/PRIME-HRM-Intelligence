/**
 * NBSC PRIME-HRM Intelligence Hub — 4-Pillar DSS Scoring Logic
 * Integrates Chart.js radar chart with live scoring inputs and API persistence.
 */

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth([ROLES.HR_ADMIN, ROLES.HRMPSB_MEMBER, ROLES.DEPT_HEAD]);

  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.name || user.email;
    if (roleEl) roleEl.textContent = ROLE_LABELS[user.role] || user.role;
    if (avatarEl) {
      avatarEl.textContent = (user.name || user.email).substring(0, 2).toUpperCase();
    }
  }

  let applicationId = getQueryParam('id') || getQueryParam('application_id');
  const selectVacancy = document.getElementById('select-dss-vacancy');
  const selectCandidate = document.getElementById('select-dss-candidate');
  const chipsContainer = document.getElementById('candidate-chips-container');

  // DOM elements
  const candidateName = document.getElementById('dss-candidate-name');
  const candidatePosition = document.getElementById('dss-candidate-position');
  const heroAvatar = document.getElementById('dss-hero-avatar');
  const trackingBadge = document.getElementById('dss-tracking-badge');
  const btnBackDocket = document.getElementById('btn-back-docket');
  const btnForwardEval = document.getElementById('btn-forward-eval');
  const compositeScoreEl = document.getElementById('composite-score-val');
  const compliancePill = document.getElementById('compliance-pill');
  const calculatedTimestamp = document.getElementById('calculated-timestamp');
  const btnRecalculate = document.getElementById('btn-recalculate-dss');

  // Stepper Links
  const linkCandidateReview = document.getElementById('link-candidate-review');
  const linkDssScoring = document.getElementById('link-dss-scoring');
  const linkDeptEval = document.getElementById('link-dept-eval');
  const linkDeliberation = document.getElementById('link-deliberation');
  const linkFinalDecision = document.getElementById('link-final-decision');

  function updateNavLinks(appId) {
    if (linkCandidateReview) linkCandidateReview.href = `../applicant-review/applicant-review.html?id=${appId}`;
    if (linkDssScoring) linkDssScoring.href = `../dss-scoring/dss-scoring.html?id=${appId}`;
    if (linkDeptEval) linkDeptEval.href = `../evaluation/evaluation.html?id=${appId}`;
    if (linkDeliberation) linkDeliberation.href = `../deliberation/deliberation.html?id=${appId}`;
    if (linkFinalDecision) linkFinalDecision.href = `../final-decision/final-decision.html?id=${appId}`;
    if (btnBackDocket) btnBackDocket.href = `../applicant-review/applicant-review.html?id=${appId}`;
    if (btnForwardEval) btnForwardEval.href = `../evaluation/evaluation.html?id=${appId}`;
  }

  // Load all vacancies and applications from DB
  let allVacancies = (typeof db !== 'undefined' ? db.getTable('vacancies') : []) || [];
  let allApplications = (typeof db !== 'undefined' ? db.getTable('applications') : []) || [];
  if (!allApplications || allApplications.length === 0) {
    if (typeof db !== 'undefined') db.init();
    allApplications = db.getTable('applications') || [];
    allVacancies = db.getTable('vacancies') || [];
  }

  if (!applicationId) {
    applicationId = (allApplications && allApplications.length > 0) ? allApplications[0].id : 'app-001';
  }

  function switchCandidate(newAppId, updateFilter = true) {
    applicationId = newAppId;
    updateNavLinks(applicationId);

    const newUrl = `${window.location.pathname}?id=${applicationId}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    if (updateFilter && docketFilter) {
      docketFilter.setActiveCandidate(applicationId);
    }

    loadData();
  }

  // Initialize High-Precision Universal Docket Filter
  let docketFilter = null;
  if (typeof initDocketFilter === 'function') {
    docketFilter = initDocketFilter({
      activeAppId: applicationId,
      applications: allApplications,
      vacancies: allVacancies,
      onSelect: (newId) => {
        switchCandidate(newId, false);
      }
    });
  }

  updateNavLinks(applicationId);

  // Sliders & Value Displays
  const sliders = {
    education_score: { input: document.getElementById('range-edu'), display: document.getElementById('val-edu') },
    experience_score: { input: document.getElementById('range-exp'), display: document.getElementById('val-exp') },
    training_score: { input: document.getElementById('range-train'), display: document.getElementById('val-train') },
    teaching_demo_score: { input: document.getElementById('range-demo'), display: document.getElementById('val-demo') },
    behavioral_interview_score: { input: document.getElementById('range-interview'), display: document.getElementById('val-interview') },
    background_investigation_score: { input: document.getElementById('range-bi'), display: document.getElementById('val-bi') },
    character_reference_score: { input: document.getElementById('range-ref'), display: document.getElementById('val-ref') },
    community_engagement_score: { input: document.getElementById('range-community'), display: document.getElementById('val-community') },
    public_service_dedication_score: { input: document.getElementById('range-dedication'), display: document.getElementById('val-dedication') }
  };

  // Summary labels
  const summaryMerit = document.getElementById('summary-merit');
  const summaryComp = document.getElementById('summary-competence');
  const summaryEthics = document.getElementById('summary-ethics');
  const summaryService = document.getElementById('summary-service');

  function calculateLivePillars() {
    const edu = parseFloat(sliders.education_score.input?.value || 12);
    const exp = parseFloat(sliders.experience_score.input?.value || 8);
    const train = parseFloat(sliders.training_score.input?.value || 4);
    const demo = parseFloat(sliders.teaching_demo_score.input?.value || 12.5);
    const interview = parseFloat(sliders.behavioral_interview_score.input?.value || 13);
    const bi = parseFloat(sliders.background_investigation_score.input?.value || 8.5);
    const ref = parseFloat(sliders.character_reference_score.input?.value || 9);
    const comm = parseFloat(sliders.community_engagement_score.input?.value || 8.5);
    const ded = parseFloat(sliders.public_service_dedication_score.input?.value || 9);

    const merit = ((edu + exp + train) / 30) * 100;
    const comp = ((demo + interview) / 30) * 100;
    const ethics = ((bi + ref) / 20) * 100;
    const service = ((comm + ded) / 20) * 100;

    const weighted = (merit * 0.3) + (comp * 0.3) + (ethics * 0.2) + (service * 0.2);

    compositeScoreEl.textContent = weighted.toFixed(2);
    if (weighted >= 70) {
      compliancePill.className = 'compliance-beacon compliance-beacon--pass';
      compliancePill.innerHTML = '&#10004; CSC QS COMPLIANT';
    } else {
      compliancePill.className = 'compliance-beacon compliance-beacon--fail';
      compliancePill.innerHTML = '&#9888; BELOW 70.00 BENCHMARK';
    }

    if (summaryMerit) summaryMerit.textContent = `${merit.toFixed(1)}%`;
    if (summaryComp) summaryComp.textContent = `${comp.toFixed(1)}%`;
    if (summaryEthics) summaryEthics.textContent = `${ethics.toFixed(1)}%`;
    if (summaryService) summaryService.textContent = `${service.toFixed(1)}%`;

    initRadar([merit, comp, ethics, service]);
  }

  // Attach slider input listeners for live numeric update & dynamic recalculation
  Object.values(sliders).forEach(item => {
    if (item.input && item.display) {
      item.input.addEventListener('input', () => {
        item.display.textContent = parseFloat(item.input.value).toFixed(1);
        calculateLivePillars();
      });
    }
  });

  // Initialize Chart.js Radar
  let radarChart = null;
  const ctx = document.getElementById('dss-radar-chart').getContext('2d');

  function initRadar(scores) {
    if (radarChart) radarChart.destroy();

    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['1. Merit & Fitness', '2. Technical Competence', '3. Ethics & Integrity', '4. Public Service'],
        datasets: [
          {
            label: 'Candidate Competency',
            data: scores || [80, 85, 87.5, 87.5],
            backgroundColor: 'rgba(212, 168, 67, 0.25)',
            borderColor: '#D4A843',
            borderWidth: 2,
            pointBackgroundColor: '#0F1B2D',
            pointBorderColor: '#D4A843',
            pointRadius: 4
          },
          {
            label: 'CSC Benchmark (70%)',
            data: [70, 70, 70, 70],
            borderColor: 'rgba(16, 185, 129, 0.6)',
            borderDash: [5, 5],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 },
            pointLabels: { font: { size: 11, weight: 'bold' } }
          }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  /**
   * Fetches candidate info and DSS score from API.
   */
  async function loadData() {
    try {
      const appRes = await apiGet(`/applications/${applicationId}/`);
      if (appRes.success && appRes.data && appRes.data.application) {
        const a = appRes.data.application;
        const name = a.applicant_name || (a.personal_info && a.personal_info.full_name) || 'Candidate';
        if (candidateName) candidateName.textContent = name;
        if (candidatePosition) candidatePosition.textContent = `${a.vacancy_title} (${a.vacancy_department}) • Code: ${a.tracking_number}`;
        if (heroAvatar) {
          const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          heroAvatar.textContent = initials || 'CA';
        }
        if (trackingBadge) trackingBadge.textContent = a.tracking_number || 'NBSC-APP-2026';
      }

      const dssRes = await apiGet(`/hiring/${applicationId}/dss/`);
      if (dssRes.success && dssRes.data && dssRes.data.dss) {
        renderDSS(dssRes.data.dss);
      }
    } catch (err) {
      showToast('Error loading candidate DSS records.', 'error');
    }
  }

  /**
   * Updates DOM and Radar with DSS data object.
   * @param {Object} dss
   */
  function renderDSS(dss) {
    const total = dss.total_score || 0;
    compositeScoreEl.textContent = total.toFixed(2);

    if (dss.qs_compliant) {
      compliancePill.className = 'compliance-beacon compliance-beacon--pass';
      compliancePill.innerHTML = '&#10004; CSC QS COMPLIANT';
    } else {
      compliancePill.className = 'compliance-beacon compliance-beacon--fail';
      compliancePill.innerHTML = '&#9888; BELOW 70.00 BENCHMARK';
    }

    if (dss.calculated_at) {
      calculatedTimestamp.textContent = `Calculated: ${formatDate(dss.calculated_at)}`;
    }

    const details = dss.details || {};
    const coords = details.radar_coordinates || [
      dss.merit_score || 80,
      dss.competence_score || 85,
      dss.ethics_score || 87.5,
      dss.service_score || 87.5
    ];

    if (summaryMerit) summaryMerit.textContent = `${coords[0]}%`;
    if (summaryComp) summaryComp.textContent = `${coords[1]}%`;
    if (summaryEthics) summaryEthics.textContent = `${coords[2]}%`;
    if (summaryService) summaryService.textContent = `${coords[3]}%`;

    initRadar(coords);
  }

  /**
   * Collects slider inputs and sends calculation request.
   */
  async function recalculateDSS() {
    btnRecalculate.disabled = true;
    btnRecalculate.textContent = 'Evaluating 4 Pillars...';

    const ratings = {};
    Object.entries(sliders).forEach(([key, item]) => {
      if (item.input) {
        ratings[key] = parseFloat(item.input.value);
      }
    });

    try {
      const res = await apiPost(`/hiring/${applicationId}/dss/`, { ratings });
      btnRecalculate.disabled = false;
      btnRecalculate.textContent = 'Recalculate & Persist DSS Score';

      if (res.success && res.data && res.data.dss) {
        showToast(res.message || 'DSS score updated.', 'success');
        renderDSS(res.data.dss);
      } else {
        showToast(res.message || 'Failed to update score.', 'error');
      }
    } catch (err) {
      btnRecalculate.disabled = false;
      btnRecalculate.textContent = 'Recalculate & Persist DSS Score';
      showToast('Network error during DSS computation.', 'error');
    }
  }

  btnRecalculate.addEventListener('click', recalculateDSS);

  initRadar([80, 85, 87.5, 87.5]);
  loadData();
});
