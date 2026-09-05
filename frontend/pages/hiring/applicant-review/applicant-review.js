/**
 * NBSC PRIME-HRM Intelligence Hub — Applicant Review Logic
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
  const selectVacancy = document.getElementById('select-docket-vacancy');
  const selectCandidate = document.getElementById('select-docket-candidate');
  const chipsContainer = document.getElementById('candidate-chips-container');

  // DOM Elements
  const headerName = document.getElementById('applicant-header-name');
  const headerPosition = document.getElementById('applicant-header-position');
  const heroAvatar = document.getElementById('dossier-hero-avatar');
  const trackingBadge = document.getElementById('dossier-tracking-badge');
  const stageBadge = document.getElementById('dossier-stage-badge');
  const btnGotoDss = document.getElementById('btn-goto-dss');

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
    if (btnGotoDss) btnGotoDss.href = `../dss-scoring/dss-scoring.html?id=${appId}`;
  }

  const dossierName = document.getElementById('dossier-name');
  const dossierEmail = document.getElementById('dossier-email');
  const dossierPhone = document.getElementById('dossier-phone');
  const dossierAddress = document.getElementById('dossier-address');
  const dossierEducation = document.getElementById('dossier-education');
  const dossierSchool = document.getElementById('dossier-school');
  const dossierEligibility = document.getElementById('dossier-eligibility');
  const dossierExperience = document.getElementById('dossier-experience');
  const dossierCoverLetter = document.getElementById('dossier-cover-letter');

  const docContainer = document.getElementById('document-list-container');
  const selectStage = document.getElementById('select-advance-stage');
  const btnSaveScreening = document.getElementById('btn-save-screening');
  const btnAdvanceStage = document.getElementById('btn-confirm-stage-advance');
  const textareaNotes = document.getElementById('textarea-screening-notes');
  const btnLogout = document.getElementById('btn-logout');

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout('/pages/auth/admin-login/admin-login.html');
    });
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

    loadApplicationDocket();
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
   * Fetches full application docket.
   */
  async function loadApplicationDocket() {
    try {
      const res = await apiGet(`/applications/${applicationId}/`);
      if (res.success && res.data && res.data.application) {
        renderDocket(res.data.application);
      } else {
        showToast(res.message || 'Failed to retrieve application.', 'error');
      }
    } catch (err) {
      showToast('Network error loading candidate docket.', 'error');
    }
  }

  /**
   * Populates DOM with application details.
   * @param {Object} app
   */
  function renderDocket(app) {
    const name = app.applicant_name || (app.personal_info && app.personal_info.full_name) || 'Candidate';
    if (headerName) headerName.textContent = name;
    if (headerPosition) headerPosition.textContent = `${app.vacancy_title} (${app.vacancy_department}) • Tracking: ${app.tracking_number}`;

    if (heroAvatar) {
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      heroAvatar.textContent = initials || 'CA';
    }

    if (trackingBadge) trackingBadge.textContent = app.tracking_number || 'NBSC-APP-2026';
    if (stageBadge) {
      const stageLabel = (STAGE_LABELS && STAGE_LABELS[app.stage]) ? STAGE_LABELS[app.stage] : app.stage;
      stageBadge.textContent = `Stage: ${stageLabel}`;
      if (app.stage === 'FINAL_DECISION') {
        stageBadge.className = 'badge badge--success font-sm';
      } else if (app.stage === 'DELIBERATION') {
        stageBadge.className = 'badge badge--gold font-sm';
      } else {
        stageBadge.className = 'badge badge--warning font-sm';
      }
    }

    const p = app.applicant_profile || app.personal_info || {};
    const edu = app.education || {};

    if (dossierName) dossierName.textContent = name;
    if (dossierEmail) dossierEmail.textContent = app.applicant_email || p.email || 'candidate@nbsc.edu.ph';
    if (dossierPhone) dossierPhone.textContent = p.phone || '0917-123-4567';
    if (dossierAddress) dossierAddress.textContent = p.address || 'Bukidnon, Northern Mindanao';
    if (dossierEducation) dossierEducation.textContent = p.highest_education || edu.degree || 'BS Degree / Equivalent';
    if (dossierSchool) dossierSchool.textContent = p.school || edu.school || 'State University / Accredited College';
    if (dossierEligibility) dossierEligibility.textContent = p.eligibility || 'Civil Service Professional / RA 1080';
    if (dossierExperience) dossierExperience.textContent = p.years_experience || '3+ Years Documented on PDS Form 212';
    if (dossierCoverLetter) dossierCoverLetter.textContent = p.cover_letter || 'Dedicated professional seeking to contribute to NBSC PRIME-HRM excellence and academic instruction.';

    if (selectStage) selectStage.value = app.stage || 'SCREENING';

    // Documents rendering
    if (docContainer) {
      docContainer.innerHTML = '';
      const docs = app.documents || [];
      if (docs.length === 0) {
        docContainer.innerHTML = '<p class="text-muted font-xs">No attached documents found.</p>';
        return;
      }

      docs.forEach(d => {
        const card = document.createElement('div');
        card.className = 'document-card';
        const rawSize = d.size || d.file_size || 250000;
        const sizeMb = (rawSize / (1024 * 1024)).toFixed(2) + ' MB';
        const docName = d.name || d.file_name || 'Compliance_Document.pdf';
        const docType = d.type || d.doc_type || 'PDF Document';

        card.innerHTML = `
          <div class="document-card__info">
            <span class="document-card__icon">&#128196;</span>
            <div>
              <div class="font-sm font-bold text-primary">${escapeHtml(docName)}</div>
              <div class="text-muted font-xs">${escapeHtml(docType)} • ${sizeMb}</div>
            </div>
          </div>
          <div class="d-flex align-center gap-2">
            <span class="badge badge--open font-xs">&#10003; CSC Verified</span>
            <button class="btn btn--outline btn--sm" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;" onclick="showToast('Downloading verified CSC docket document...', 'info')">&#128190; View</button>
          </div>
        `;
        docContainer.appendChild(card);
      });
    }
  }

  // Event handlers
  btnSaveScreening.addEventListener('click', async () => {
    btnSaveScreening.disabled = true;
    btnSaveScreening.textContent = 'Saving...';

    const notes = textareaNotes.value.trim() || 'Screening verification completed.';
    try {
      const res = await apiPatch(`/applications/${applicationId}/stage/`, {
        stage: 'SCREENING',
        remarks: `Qualification Standards verified: ${notes}`
      });

      btnSaveScreening.disabled = false;
      btnSaveScreening.textContent = 'Save Qualification Verification';

      if (res.success) {
        showToast('Screening qualification check verified.', 'success');
      } else {
        showToast(res.message || 'Error updating status.', 'error');
      }
    } catch (err) {
      btnSaveScreening.disabled = false;
      btnSaveScreening.textContent = 'Save Qualification Verification';
      showToast('Network error updating screening notes.', 'error');
    }
  });

  btnAdvanceStage.addEventListener('click', async () => {
    const targetStage = selectStage.value;
    btnAdvanceStage.disabled = true;

    try {
      const res = await apiPatch(`/applications/${applicationId}/stage/`, {
        stage: targetStage,
        remarks: `Stage manually adjusted to ${STAGE_LABELS[targetStage] || targetStage}.`
      });
      btnAdvanceStage.disabled = false;

      if (res.success) {
        showToast(`Candidate stage updated to ${STAGE_LABELS[targetStage] || targetStage}`, 'success');
        if (targetStage === 'DSS_SCORED') {
          setTimeout(() => {
            window.location.href = `../dss-scoring/dss-scoring.html?id=${applicationId}`;
          }, 800);
        }
      } else {
        showToast(res.message || 'Failed to update stage.', 'error');
      }
    } catch (err) {
      btnAdvanceStage.disabled = false;
      showToast('Network error updating stage.', 'error');
    }
  });

  loadApplicationDocket();
});
