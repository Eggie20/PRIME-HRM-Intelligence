/**
 * NBSC PRIME-HRM Intelligence Hub — Final Appointment Decision Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Only HR_ADMIN has authorization to issue final appointment resolutions
  requireAuth([ROLES.HR_ADMIN]);

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
    const signatoryEl = document.getElementById('cert-signatory-name');
    if (signatoryEl) signatoryEl.textContent = `${user.name || 'HR Administrator'} — Appointing Authority`;
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout('/pages/auth/admin-login/admin-login.html');
    });
  }

  let applicationId = getQueryParam('id') || getQueryParam('application_id');
  const selectVacancy = document.getElementById('select-decision-vacancy');
  const selectCandidate = document.getElementById('select-decision-candidate');
  const chipsContainer = document.getElementById('candidate-chips-container');

  // Cross-navigation links
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

  // Populate Vacancy Dropdown
  function switchCandidate(newAppId, updateFilter = true) {
    applicationId = newAppId;
    updateNavLinks(applicationId);

    const newUrl = `${window.location.pathname}?id=${applicationId}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    if (updateFilter && docketFilter) {
      docketFilter.setActiveCandidate(applicationId);
    }

    loadResolutionData(applicationId);
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

  /**
   * Loads candidate details, deliberation metrics, and existing appointment decision.
   * @param {string} appId
   */
  async function loadResolutionData(appId) {
    try {
      const res = await apiGet(`/hiring/${appId}/deliberation-summary/`);
      const data = res.data || {};

      const app = data.application || {};
      const dss = data.dss || {};
      const evals = data.evaluations || [];
      const tally = data.vote_tally || { APPROVE: 0, DISAPPROVE: 0, ABSTAIN: 0 };
      const decision = data.final_decision;

      renderCandidateHeader(app);
      renderMeritDossier(dss, evals, tally);

      const year = new Date().getFullYear();
      const lastDigits = (app.tracking_number || appId).split('-').pop();
      const defaultResNum = `NBSC-BOT-RES-${year}-${lastDigits}`;

      const resInput = document.getElementById('input-resolution-number');
      if (resInput && !resInput.value) {
        resInput.value = defaultResNum;
      }

      if (decision) {
        renderExistingDecision(decision, app);
      }

    } catch (err) {
      console.error('Failed to load candidate resolution dossier:', err);
      showToast('Could not load candidate deliberation dossier.', 'error');
    }
  }

  /**
   * Renders candidate header section.
   * @param {Object} app
   */
  function renderCandidateHeader(app) {
    document.getElementById('heading-resolution').textContent = app.applicant_name || 'Candidate Name';
    document.getElementById('resolution-tracking-badge').textContent = app.tracking_number || 'NBSC-APP-2026';

    const pos = app.vacancy ? `${app.vacancy.title} • ${app.vacancy.department}` : 'Instructor I • Academic Department';
    document.getElementById('resolution-position-text').textContent = pos;

    const initials = (app.applicant_name || 'CA').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('resolution-candidate-avatar').textContent = initials;

    const stageBadge = document.getElementById('resolution-stage-badge');
    if (stageBadge) {
      stageBadge.textContent = STAGE_LABELS[app.stage] || app.stage;
      if (app.stage === 'APPOINTED') {
        stageBadge.className = 'badge badge--success font-sm';
      } else if (app.stage === 'REJECTED') {
        stageBadge.className = 'badge badge--danger font-sm';
      }
    }

    const certBody = document.getElementById('cert-preview-body');
    if (certBody) {
      certBody.textContent = `In accordance with CSC PRIME-HRM Level 2 standards, ${app.applicant_name || 'the candidate'} is hereby recognized for satisfying all Qualification Standards for the position of ${pos}.`;
    }
  }

  /**
   * Renders the scorecard summary.
   * @param {Object} dss
   * @param {Array<Object>} evals
   * @param {Object} tally
   */
  function renderMeritDossier(dss, evals, tally) {
    const dssScoreEl = document.getElementById('summary-dss-score');
    const qsBadgeEl = document.getElementById('summary-qs-status');

    if (dss && dss.total_score) {
      dssScoreEl.textContent = `${dss.total_score.toFixed(1)} / 100`;
      if (dss.qs_compliant) {
        qsBadgeEl.textContent = 'Compliant';
        qsBadgeEl.className = 'badge badge--success';
      } else {
        qsBadgeEl.textContent = 'Deficient';
        qsBadgeEl.className = 'badge badge--danger';
      }
    } else {
      dssScoreEl.textContent = 'Not Scored';
      qsBadgeEl.textContent = 'Pending';
      qsBadgeEl.className = 'badge badge--neutral';
    }

    const deptScoreEl = document.getElementById('summary-dept-score');
    const deptRecEl = document.getElementById('summary-dept-rec');

    if (evals && evals.length > 0) {
      const topEval = evals[0];
      deptScoreEl.textContent = `${topEval.total_score || 0} / 100`;
      deptRecEl.textContent = topEval.recommendation || 'RECOMMEND';
      deptRecEl.className = topEval.recommendation === 'RECOMMEND'
        ? 'badge badge--success'
        : topEval.recommendation === 'RESERVED' ? 'badge badge--warning' : 'badge badge--danger';
    } else {
      deptScoreEl.textContent = 'Not Evaluated';
      deptRecEl.textContent = 'None';
      deptRecEl.className = 'badge badge--neutral';
    }

    const consensusEl = document.getElementById('summary-hrmpsb-consensus');
    if (consensusEl) {
      consensusEl.textContent = `${tally.APPROVE || 0} Approve / ${tally.DISAPPROVE || 0} Disapprove (${tally.ABSTAIN || 0} Abstain)`;
    }
  }

  /**
   * Renders already-decided appointment data.
   * @param {Object} decision
   * @param {Object} app
   */
  function renderExistingDecision(decision, app) {
    const banner = document.getElementById('crypto-commit-banner');
    const blockIndexEl = document.getElementById('crypto-block-index');
    const blockHashEl = document.getElementById('crypto-block-hash');

    if (banner) banner.classList.remove('d-none');
    if (blockIndexEl) blockIndexEl.textContent = `#${decision.audit_block_index !== undefined ? decision.audit_block_index : '—'}`;
    if (blockHashEl) blockHashEl.textContent = decision.audit_block_hash || 'SHA-256 Block Signed';

    const resInput = document.getElementById('input-resolution-number');
    if (resInput && decision.resolution_number) resInput.value = decision.resolution_number;

    const radios = document.getElementsByName('executive_decision');
    radios.forEach(r => {
      if (r.value === decision.decision) r.checked = true;
    });

    const btnCommit = document.getElementById('btn-commit-resolution');
    if (btnCommit) {
      btnCommit.textContent = `Resolution Already Committed (${decision.decision})`;
      btnCommit.disabled = true;
      btnCommit.className = 'btn btn--outline w-100 btn--lg';
    }
  }

  // Handle Resolution Commitment
  const formFinal = document.getElementById('form-final-decision');
  if (formFinal) {
    formFinal.addEventListener('submit', async (e) => {
      e.preventDefault();

      const decisionType = document.querySelector('input[name="executive_decision"]:checked')?.value || 'APPOINTED';
      const resNumber = document.getElementById('input-resolution-number').value.trim();
      const remarks = document.getElementById('textarea-decision-remarks').value.trim();

      if (!resNumber) {
        showToast('Please specify the official BOT Resolution Number.', 'warning');
        document.getElementById('input-resolution-number').focus();
        return;
      }

      if (!remarks) {
        showToast('Please provide executive rationale and appointment conditions.', 'warning');
        document.getElementById('textarea-decision-remarks').focus();
        return;
      }

      const confirmed = confirm(
        `Are you sure you want to commit this resolution (${decisionType}) to the immutable SHA-256 Audit Chain? This action cannot be revoked.`
      );
      if (!confirmed) return;

      const btnCommit = document.getElementById('btn-commit-resolution');
      btnCommit.disabled = true;
      btnCommit.textContent = 'Mining Cryptographic Block...';

      try {
        const response = await apiPost(`/hiring/${applicationId}/final-decision/`, {
          decision: decisionType,
          resolution_number: resNumber,
          remarks: remarks
        });

        const block = (response.data && (response.data.block || response.data.audit_block)) || {};
        showToast(response.message || 'Appointment decision committed to Audit Chain!', 'success');

        // Show cryptographic banner
        const banner = document.getElementById('crypto-commit-banner');
        if (banner) banner.classList.remove('d-none');
        document.getElementById('crypto-block-index').textContent = `#${block.block_index !== undefined ? block.block_index : (block.index !== undefined ? block.index : '1')}`;
        document.getElementById('crypto-block-hash').textContent = block.hash || block.block_hash || '';

        // Update stage badge
        const stageBadge = document.getElementById('resolution-stage-badge');
        if (stageBadge) {
          stageBadge.textContent = decisionType === 'APPOINTED' ? 'Stage 7: Appointed' : 'Application Closed';
          stageBadge.className = decisionType === 'APPOINTED' ? 'badge badge--success font-sm' : 'badge badge--danger font-sm';
        }

        btnCommit.textContent = `Resolution Committed (${decisionType})`;
        btnCommit.className = 'btn btn--outline w-100 btn--lg';

      } catch (err) {
        console.error('Final decision commit error:', err);
        showToast(err.message || 'Failed to commit resolution to Audit Chain.', 'error');
        btnCommit.disabled = false;
        btnCommit.textContent = 'Commit Resolution & Sign Cryptographic Block';
      }
    });
  }

  // Initial load
  loadResolutionData(applicationId);
});
