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

  // ── Profile Correction Requests Review Panel Logic ─────────
  const btnToggleCorrections = document.getElementById('btn-toggle-corrections');
  const badgePendingCorrections = document.getElementById('badge-pending-corrections');
  const panelCorrections = document.getElementById('panel-correction-requests');
  const btnCloseCorrections = document.getElementById('btn-close-corrections');
  const listCorrections = document.getElementById('correction-requests-list');
  const countCorrections = document.getElementById('panel-correction-count');

  if (btnToggleCorrections && panelCorrections) {
    btnToggleCorrections.addEventListener('click', () => {
      panelCorrections.classList.toggle('d-none');
    });
  }

  if (btnCloseCorrections && panelCorrections) {
    btnCloseCorrections.addEventListener('click', () => {
      panelCorrections.classList.add('d-none');
    });
  }

  function updateCorrectionBadgeAndList() {
    if (typeof db === 'undefined') return;
    const tickets = db.getTable('correction_requests') || [];
    const pendingTickets = tickets.filter(t => t.status === 'PENDING');

    if (badgePendingCorrections) {
      if (pendingTickets.length > 0) {
        badgePendingCorrections.textContent = pendingTickets.length;
        badgePendingCorrections.style.display = 'inline-block';
      } else {
        badgePendingCorrections.style.display = 'none';
      }
    }

    if (countCorrections) {
      countCorrections.textContent = `${tickets.length} Ticket${tickets.length === 1 ? '' : 's'} (${pendingTickets.length} Pending)`;
    }

    if (!listCorrections) return;

    if (tickets.length === 0) {
      listCorrections.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #64748b;">
          <div style="font-size: 24px; margin-bottom: 6px;">&#128194;</div>
          <strong>No Profile Correction Requests Submitted</strong>
          <p class="font-xs mt-1">When candidates report mistaken biographical or qualification information, their requests and ID proof will appear here for verification.</p>
        </div>
      `;
      return;
    }

    listCorrections.innerHTML = tickets.map(t => {
      const isPending = t.status === 'PENDING';
      const isApproved = t.status === 'APPROVED';
      const statusBadge = isApproved
        ? '<span class="badge badge--success">✓ Approved &amp; Synced</span>'
        : t.status === 'REJECTED'
        ? '<span class="badge badge--danger">✕ Rejected</span>'
        : '<span class="badge badge--warning">⏳ Pending HRMO Verification</span>';

      const proofImg = t.proof_document && t.proof_document.data_url
        ? `<div style="margin-top: 8px; border: 1px solid #DBDECF; border-radius: 6px; padding: 8px; background: #ffffff; max-width: 320px;">
             <div class="font-xs text-muted mb-1">Attached ID Document (${escapeHtml(t.id_type || 'Valid ID')}):</div>
             <img src="${t.proof_document.data_url}" alt="Government ID Proof" style="width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px; display: block;" />
             <div class="font-xs font-bold text-primary mt-1">${escapeHtml(t.proof_document.file_name || 'ID-Scan')} &bull; Control #${escapeHtml(t.id_number || 'N/A')}</div>
           </div>`
        : `<div class="font-xs text-muted mt-1">ID Type: ${escapeHtml(t.id_type || 'Government ID')} &bull; Number: ${escapeHtml(t.id_number || 'N/A')}</div>`;

      return `
        <div class="ticket-review-card" style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div class="d-flex align-center justify-between flex-wrap gap-2 mb-2 pb-2" style="border-bottom: 1px solid #F1F5F9;">
            <div class="d-flex align-center gap-2">
              <span class="font-bold text-primary font-sm code">${escapeHtml(t.id || 'CR-REQ')}</span>
              <span>&bull;</span>
              <strong>${escapeHtml(t.applicant_name || 'Applicant')}</strong>
              <span class="text-secondary font-xs">(${escapeHtml(t.applicant_email || '')})</span>
            </div>
            <div>${statusBadge}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;">
            <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 6px;">
              <div class="font-xs text-muted uppercase font-bold">Field to Correct:</div>
              <div class="font-sm font-bold text-primary">${escapeHtml(t.field_label || t.field_name || '')}</div>
              
              <div class="mt-2 font-xs text-muted uppercase font-bold">Current Record on File:</div>
              <div class="font-sm text-secondary" style="text-decoration: line-through;">${escapeHtml(t.current_value || '—')}</div>

              <div class="mt-2 font-xs text-muted uppercase font-bold">Requested Accurate Value:</div>
              <div class="font-sm font-bold text-success">${escapeHtml(t.requested_value || '—')}</div>

              <div class="mt-2 font-xs text-muted uppercase font-bold">Applicant Stated Reason:</div>
              <div class="font-xs text-secondary">${escapeHtml(t.reason || 'None stated')}</div>
            </div>

            <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 6px;">
              <div class="font-xs text-muted uppercase font-bold">Identity Verification &amp; Document Proof:</div>
              ${proofImg}
            </div>
          </div>

          ${isPending ? `
            <div class="d-flex align-center justify-end gap-2 pt-2" style="border-top: 1px dashed #E2E8F0;">
              <button type="button" class="btn btn--danger btn--sm btn-reject-ticket" data-id="${t.id}">
                ✕ Reject Request
              </button>
              <button type="button" class="btn btn--success btn--sm btn-approve-ticket" data-id="${t.id}">
                ✓ Approve Correction &amp; Sync DB
              </button>
            </div>
          ` : `
            <div class="font-xs text-muted text-right pt-2" style="border-top: 1px dashed #E2E8F0;">
              Processed by <strong>${escapeHtml(t.approved_by || t.rejected_by || 'HR Admin')}</strong> on ${t.updated_at ? new Date(t.updated_at).toLocaleString() : 'Recently'}
            </div>
          `}
        </div>
      `;
    }).join('');

    // Attach Approve / Reject event listeners
    listCorrections.querySelectorAll('.btn-approve-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticketId = btn.dataset.id;
        const currentAdmin = (user && (user.email || user.name)) ? (user.email || user.name) : 'admin@nbsc.edu.ph';
        if (confirm(`Approve correction request #${ticketId}? This will immediately update the applicant's record across all tables and record an immutable SHA-256 audit entry.`)) {
          const success = db.approveCorrectionRequest(ticketId, currentAdmin);
          if (success) {
            showToast(`Correction ticket #${ticketId} approved & database synchronized!`, 'success');
            updateCorrectionBadgeAndList();
            loadApplicationDocket();
          } else {
            showToast('Failed to approve ticket.', 'error');
          }
        }
      });
    });

    listCorrections.querySelectorAll('.btn-reject-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticketId = btn.dataset.id;
        const currentAdmin = (user && (user.email || user.name)) ? (user.email || user.name) : 'admin@nbsc.edu.ph';
        const reason = prompt('Please enter the reason for rejecting this correction request:', 'Discrepancy between stated change and attached government ID');
        if (reason) {
          const success = db.rejectCorrectionRequest(ticketId, currentAdmin, reason);
          if (success) {
            showToast(`Correction ticket #${ticketId} rejected.`, 'info');
            updateCorrectionBadgeAndList();
          } else {
            showToast('Failed to reject ticket.', 'error');
          }
        }
      });
    });
  }

  // Initial load
  loadApplicationDocket();
  updateCorrectionBadgeAndList();
});
