/**
 * NBSC PRIME-HRM Intelligence Hub — Department Head Rubric Evaluation Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Authorization guard
  requireAuth([ROLES.DEPT_HEAD, ROLES.HR_ADMIN]);

  // Set user profile in sidebar
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

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout('/pages/auth/admin-login/admin-login.html');
    });
  }

  let applicationId = getQueryParam('id') || getQueryParam('application_id');
  const selectVacancy = document.getElementById('select-eval-vacancy');
  const selectCandidate = document.getElementById('select-eval-candidate');
  const chipsContainer = document.getElementById('candidate-chips-container');

  // Stepper links
  const linkCandidateReview = document.getElementById('link-candidate-review');
  const linkDssScore = document.getElementById('link-dss-scoring') || document.getElementById('link-dss-score');
  const linkDeptEval = document.getElementById('link-dept-eval');
  const linkDeliberation = document.getElementById('link-deliberation');
  const linkFinalDecision = document.getElementById('link-final-decision');

  function updateNavLinks(appId) {
    if (linkCandidateReview) linkCandidateReview.href = `../applicant-review/applicant-review.html?id=${appId}`;
    if (linkDssScore) linkDssScore.href = `../dss-scoring/dss-scoring.html?id=${appId}`;
    if (linkDeptEval) linkDeptEval.href = `../evaluation/evaluation.html?id=${appId}`;
    if (linkDeliberation) linkDeliberation.href = `../deliberation/deliberation.html?id=${appId}`;
    if (linkFinalDecision) linkFinalDecision.href = `../final-decision/final-decision.html?id=${appId}`;
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

    loadApplicationData(applicationId);
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

  // Sliders and value displays
  const sliders = {
    teachingDemo: document.getElementById('slider-teaching-demo'),
    subjectMastery: document.getElementById('slider-subject-mastery'),
    instructionalDesign: document.getElementById('slider-instructional-design'),
    edtechSkills: document.getElementById('slider-edtech-skills'),
    researchOutput: document.getElementById('slider-research-output'),
    grantPotential: document.getElementById('slider-grant-potential'),
    mentorshipEthos: document.getElementById('slider-mentorship-ethos'),
    departmentFit: document.getElementById('slider-department-fit')
  };

  const valDisplays = {
    teachingDemo: document.getElementById('val-teaching-demo'),
    subjectMastery: document.getElementById('val-subject-mastery'),
    instructionalDesign: document.getElementById('val-instructional-design'),
    edtechSkills: document.getElementById('val-edtech-skills'),
    researchOutput: document.getElementById('val-research-output'),
    grantPotential: document.getElementById('val-grant-potential'),
    mentorshipEthos: document.getElementById('val-mentorship-ethos'),
    departmentFit: document.getElementById('val-department-fit')
  };

  const summaryTechnical = document.getElementById('summary-technical');
  const summaryInstructional = document.getElementById('summary-instructional');
  const summaryResearch = document.getElementById('summary-research');
  const summaryLeadership = document.getElementById('summary-leadership');
  const summaryTotalScore = document.getElementById('summary-total-score');
  const evalLiveTotal = document.getElementById('eval-live-total');

  /**
   * Recalculates total rubric scores dynamically from slider inputs.
   * @returns {number} The computed aggregate score
   */
  function updateScores() {
    const teachingDemo = parseFloat(sliders.teachingDemo.value) || 0;
    const subjectMastery = parseFloat(sliders.subjectMastery.value) || 0;
    const instructionalDesign = parseFloat(sliders.instructionalDesign.value) || 0;
    const edtechSkills = parseFloat(sliders.edtechSkills.value) || 0;
    const researchOutput = parseFloat(sliders.researchOutput.value) || 0;
    const grantPotential = parseFloat(sliders.grantPotential.value) || 0;
    const mentorshipEthos = parseFloat(sliders.mentorshipEthos.value) || 0;
    const departmentFit = parseFloat(sliders.departmentFit.value) || 0;

    valDisplays.teachingDemo.textContent = `${teachingDemo.toFixed(1)} / 15.0`;
    valDisplays.subjectMastery.textContent = `${subjectMastery.toFixed(1)} / 15.0`;
    valDisplays.instructionalDesign.textContent = `${instructionalDesign.toFixed(1)} / 12.5`;
    valDisplays.edtechSkills.textContent = `${edtechSkills.toFixed(1)} / 12.5`;
    valDisplays.researchOutput.textContent = `${researchOutput.toFixed(1)} / 10.0`;
    valDisplays.grantPotential.textContent = `${grantPotential.toFixed(1)} / 10.0`;
    valDisplays.mentorshipEthos.textContent = `${mentorshipEthos.toFixed(1)} / 12.5`;
    valDisplays.departmentFit.textContent = `${departmentFit.toFixed(1)} / 12.5`;

    const technicalTotal = teachingDemo + subjectMastery;
    const instructionalTotal = instructionalDesign + edtechSkills;
    const researchTotal = researchOutput + grantPotential;
    const leadershipTotal = mentorshipEthos + departmentFit;

    summaryTechnical.textContent = `${technicalTotal.toFixed(1)} / 30`;
    summaryInstructional.textContent = `${instructionalTotal.toFixed(1)} / 25`;
    summaryResearch.textContent = `${researchTotal.toFixed(1)} / 20`;
    summaryLeadership.textContent = `${leadershipTotal.toFixed(1)} / 25`;

    const grandTotal = technicalTotal + instructionalTotal + researchTotal + leadershipTotal;
    const roundedTotal = Math.min(100, Math.round(grandTotal * 10) / 10);

    summaryTotalScore.textContent = `${roundedTotal.toFixed(1)} / 100`;
    evalLiveTotal.innerHTML = `${roundedTotal.toFixed(1)} <span class="font-xs text-muted">/ 100</span>`;
    const bigScore = document.getElementById('summary-total-score-big');
    if (bigScore) bigScore.textContent = roundedTotal.toFixed(1);

    return roundedTotal;
  }

  // Attach input event listeners to all sliders
  Object.values(sliders).forEach(slider => {
    if (slider) {
      slider.addEventListener('input', updateScores);
    }
  });

  /**
   * Fetches application details and previous evaluations.
   * @param {string} appId - Application Object ID
   */
  async function loadApplicationData(appId) {
    try {
      const response = await apiGet(`/applications/${appId}/`);
      const app = response.data && response.data.application ? response.data.application : response.data;

      if (!app) {
        showToast('Applicant record not found.', 'error');
        return;
      }

      document.getElementById('heading-eval-candidate').textContent = app.applicant_name || 'Candidate Name';
      document.getElementById('eval-tracking-badge').textContent = app.tracking_number || appId;

      const positionText = app.vacancy ? `${app.vacancy.title} • ${app.vacancy.department}` : 'Instructor I • College of Education';
      document.getElementById('eval-position-text').textContent = positionText;

      const initials = (app.applicant_name || 'CA').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      document.getElementById('eval-candidate-avatar').textContent = initials;

      const stageBadge = document.getElementById('eval-stage-badge');
      if (stageBadge) {
        stageBadge.textContent = STAGE_LABELS[app.stage] || app.stage;
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
      showToast('Could not load applicant details.', 'error');
    }

    try {
      const evalRes = await apiGet(`/hiring/${appId}/evaluate/`);
      const evals = evalRes.data && evalRes.data.evaluations ? evalRes.data.evaluations : [];
      renderPriorEvaluations(evals);
    } catch (err) {
      console.warn('No prior evaluations loaded:', err);
    }
  }

  /**
   * Renders the prior evaluation history cards.
   * @param {Array<Object>} evaluations
   */
  function renderPriorEvaluations(evaluations) {
    const container = document.getElementById('prior-evaluations-container');
    if (!container) return;

    if (!evaluations || evaluations.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-muted font-xs">No prior evaluations submitted yet.</div>';
      return;
    }

    container.innerHTML = evaluations.map(ev => {
      const recClass = ev.recommendation === 'RECOMMEND'
        ? 'badge--success'
        : ev.recommendation === 'RESERVED' ? 'badge--warning' : 'badge--danger';

      return `
        <div class="prior-eval-item">
          <div class="prior-eval-meta">
            <strong>${escapeHtml(ev.evaluator_name || 'Department Evaluator')}</strong>
            <span class="badge ${recClass}">${ev.recommendation}</span>
          </div>
          <div class="d-flex justify-between font-xs text-muted">
            <span>Score: <strong>${ev.total_score || 0}/100</strong></span>
            <span>${formatDate(ev.submitted_at)}</span>
          </div>
          ${ev.remarks ? `<div class="prior-eval-remarks font-xs">${escapeHtml(ev.remarks)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // Handle evaluation submission
  const formEval = document.getElementById('form-dept-evaluation');
  if (formEval) {
    formEval.addEventListener('submit', async (e) => {
      e.preventDefault();

      const recommendation = document.getElementById('select-recommendation').value;
      const remarks = document.getElementById('textarea-eval-remarks').value.trim();
      const totalScore = updateScores();

      if (!remarks) {
        showToast('Please provide qualitative justification remarks for the HRMPSB Board.', 'warning');
        document.getElementById('textarea-eval-remarks').focus();
        return;
      }

      const ratingsPayload = {
        teaching_demo_score: parseFloat(sliders.teachingDemo.value) || 0,
        subject_mastery_score: parseFloat(sliders.subjectMastery.value) || 0,
        instructional_design_score: parseFloat(sliders.instructionalDesign.value) || 0,
        edtech_skills_score: parseFloat(sliders.edtechSkills.value) || 0,
        research_output_score: parseFloat(sliders.researchOutput.value) || 0,
        grant_potential_score: parseFloat(sliders.grantPotential.value) || 0,
        mentorship_ethos_score: parseFloat(sliders.mentorshipEthos.value) || 0,
        department_fit_score: parseFloat(sliders.departmentFit.value) || 0
      };

      const btnSubmit = document.getElementById('btn-submit-evaluation');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Submitting Evaluation...';

      try {
        const response = await apiPost(`/hiring/${applicationId}/evaluate/`, {
          ratings: ratingsPayload,
          recommendation: recommendation,
          remarks: remarks,
          total_score: totalScore
        });

        showToast(response.message || 'Evaluation submitted successfully!', 'success');

        // Refresh prior evals and update stage badge
        const stageBadge = document.getElementById('eval-stage-badge');
        if (stageBadge) {
          stageBadge.textContent = 'Stage 4: Dept Eval (Completed)';
          stageBadge.className = 'badge badge--success font-sm';
        }

        setTimeout(() => {
          loadApplicationData(applicationId);
        }, 500);

      } catch (err) {
        console.error('Evaluation submission error:', err);
        showToast(err.message || 'Failed to submit department evaluation.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Submit Formal Department Evaluation';
      }
    });
  }

  // Initial calculation and data load
  updateScores();
  loadApplicationData(applicationId);
});
