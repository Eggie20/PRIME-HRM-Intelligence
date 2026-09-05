/**
 * NBSC PRIME-HRM Intelligence Hub — HRMPSB Deliberation & Voting Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Authorization guard
  requireAuth([ROLES.HRMPSB_MEMBER, ROLES.HR_ADMIN]);

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
  const selectVacancy = document.getElementById('select-delib-vacancy');
  const selectCandidate = document.getElementById('select-delib-candidate');
  const chipsContainer = document.getElementById('candidate-chips-container');

  // Cross-navigation links
  const linkCandidateReview = document.getElementById('link-candidate-review');
  const linkDssScoring = document.getElementById('link-dss-scoring');
  const linkDeptEval = document.getElementById('link-dept-eval');
  const linkFinalDecision = document.getElementById('link-final-decision');

  function updateNavLinks(appId) {
    if (linkCandidateReview) linkCandidateReview.href = `../applicant-review/applicant-review.html?id=${appId}`;
    if (linkDssScoring) linkDssScoring.href = `../dss-scoring/dss-scoring.html?id=${appId}`;
    if (linkDeptEval) linkDeptEval.href = `../evaluation/evaluation.html?id=${appId}`;
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

    // Update URL query parameter without full reload
    const newUrl = `${window.location.pathname}?id=${applicationId}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    if (updateFilter && docketFilter) {
      docketFilter.setActiveCandidate(applicationId);
    }

    loadDeliberationSummary(applicationId);
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
   * Fetches comprehensive deliberation summary including DSS, evals, and votes.
   * @param {string} appId
   */
  async function loadDeliberationSummary(appId) {
    try {
      const res = await apiGet(`/hiring/${appId}/deliberation-summary/`);
      const data = res.data || {};

      const app = data.application || {};
      const dss = data.dss || {};
      const evals = data.evaluations || [];
      const votes = data.votes || [];
      const tally = data.vote_tally || { APPROVE: 0, DISAPPROVE: 0, ABSTAIN: 0, TOTAL: 0 };

      renderCandidateHeader(app);
      renderConsensusTally(tally);
      renderDssSnapshot(dss);
      renderDeptEvaluations(evals);
      renderBallotsTable(votes);
      prefillExistingVote(votes, user);

    } catch (err) {
      console.error('Failed to load deliberation summary:', err);
      showToast('Error loading deliberation dossier.', 'error');
    }
  }

  /**
   * Renders candidate details in the top card.
   * @param {Object} app
   */
  function renderCandidateHeader(app) {
    document.getElementById('heading-deliberation').textContent = app.applicant_name || 'Candidate Name';
    document.getElementById('delib-tracking-badge').textContent = app.tracking_number || 'NBSC-APP-2026';

    const pos = app.vacancy ? `${app.vacancy.title} • ${app.vacancy.department}` : 'Instructor I • Academic Department';
    document.getElementById('delib-position-text').textContent = pos;

    const initials = (app.applicant_name || 'CA').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('delib-candidate-avatar').textContent = initials;
  }

  /**
   * Updates the consensus tally widget.
   * @param {Object} tally
   */
  function renderConsensusTally(tally) {
    document.getElementById('tally-approve').textContent = tally.APPROVE || 0;
    document.getElementById('tally-disapprove').textContent = tally.DISAPPROVE || 0;
    document.getElementById('tally-abstain').textContent = tally.ABSTAIN || 0;
  }

  /**
   * Renders DSS scores and meter progress bars.
   * @param {Object} dss
   */
  function renderDssSnapshot(dss) {
    const overallScoreEl = document.getElementById('dss-overall-score');
    const computedDateEl = document.getElementById('dss-computed-date');
    const qsBadgeEl = document.getElementById('dss-qs-badge');

    if (!dss || !dss.total_score) {
      overallScoreEl.textContent = 'Pending Calculation';
      computedDateEl.textContent = 'Not yet scored';
      qsBadgeEl.textContent = 'Pending DSS';
      qsBadgeEl.className = 'badge badge--neutral';
      return;
    }

    overallScoreEl.textContent = `${dss.total_score.toFixed(1)} / 100`;
    computedDateEl.textContent = dss.calculated_at ? formatDate(dss.calculated_at) : 'Calculated';

    if (dss.qs_compliant) {
      qsBadgeEl.textContent = 'QS Compliant';
      qsBadgeEl.className = 'badge badge--success';
    } else {
      qsBadgeEl.textContent = 'QS Deficient';
      qsBadgeEl.className = 'badge badge--danger';
    }

    const merit = dss.merit_score || 0;
    const competence = dss.competence_score || 0;
    const ethics = dss.ethics_score || 0;
    const service = dss.service_score || 0;

    document.getElementById('meter-val-merit').textContent = `${merit.toFixed(1)}%`;
    document.getElementById('meter-val-competence').textContent = `${competence.toFixed(1)}%`;
    document.getElementById('meter-val-ethics').textContent = `${ethics.toFixed(1)}%`;
    document.getElementById('meter-val-service').textContent = `${service.toFixed(1)}%`;

    document.getElementById('meter-bar-merit').style.width = `${Math.min(100, merit)}%`;
    document.getElementById('meter-bar-competence').style.width = `${Math.min(100, competence)}%`;
    document.getElementById('meter-bar-ethics').style.width = `${Math.min(100, ethics)}%`;
    document.getElementById('meter-bar-service').style.width = `${Math.min(100, service)}%`;
  }

  /**
   * Renders Department Head evaluation summary.
   * @param {Array<Object>} evals
   */
  function renderDeptEvaluations(evals) {
    const container = document.getElementById('dept-eval-summary-container');
    if (!container) return;

    if (!evals || evals.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-muted font-xs">
          No Department Head evaluation recorded yet.
          <div class="mt-2">
            <a href="../evaluation/evaluation.html?id=${applicationId}" class="btn btn--outline btn--sm">Submit Dept Evaluation</a>
          </div>
        </div>
      `;
      return;
    }

    const latest = evals[0];
    const recBadge = latest.recommendation === 'RECOMMEND'
      ? '<span class="badge badge--success">RECOMMENDED</span>'
      : latest.recommendation === 'RESERVED'
        ? '<span class="badge badge--warning">RESERVED</span>'
        : '<span class="badge badge--danger">NOT RECOMMENDED</span>';

    container.innerHTML = `
      <div class="p-3 bg-neutral-50 rounded mb-3">
        <div class="d-flex justify-between align-center mb-2">
          <strong>${escapeHtml(latest.evaluator_name || 'Department Evaluator')}</strong>
          ${recBadge}
        </div>
        <div class="d-flex justify-between font-xs text-muted mb-2">
          <span>Overall Rubric Score: <strong>${latest.total_score || 0}/100</strong></span>
          <span>${formatDate(latest.submitted_at)}</span>
        </div>
        ${latest.remarks ? `<p class="font-xs text-neutral-700 mt-2 bg-white p-2 rounded border">${escapeHtml(latest.remarks)}</p>` : ''}
      </div>
    `;
  }

  /**
   * Renders table of cast ballots.
   * @param {Array<Object>} votes
   */
  function renderBallotsTable(votes) {
    const container = document.getElementById('ballots-table-container');
    const badge = document.getElementById('total-ballots-badge');
    if (!container) return;

    if (badge) badge.textContent = `${votes.length} Ballot${votes.length === 1 ? '' : 's'}`;

    if (!votes || votes.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-muted font-xs">No ballots recorded yet for this candidate.</div>';
      return;
    }

    container.innerHTML = `
      <table class="ballots-table">
        <thead>
          <tr>
            <th>HRMPSB Member</th>
            <th>Deliberative Vote</th>
            <th>Rank</th>
            <th>Deliberation Remarks</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${votes.map(v => {
            const voteBadge = v.vote === 'APPROVE'
              ? '<span class="badge badge--success">APPROVE</span>'
              : v.vote === 'DISAPPROVE'
                ? '<span class="badge badge--danger">DISAPPROVE</span>'
                : '<span class="badge badge--neutral">ABSTAIN</span>';

            return `
              <tr>
                <td><strong>${escapeHtml(v.voter_name || 'Board Member')}</strong></td>
                <td>${voteBadge}</td>
                <td><span class="badge badge--outline font-xs">Rank #${v.rank_priority || 1}</span></td>
                <td><span class="font-xs text-neutral-600">${escapeHtml(v.deliberation_notes || '—')}</span></td>
                <td><span class="font-xs text-muted">${formatDate(v.voted_at)}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * If current user already voted, pre-fills the ballot form with their record.
   * @param {Array<Object>} votes
   * @param {Object} currentUser
   */
  function prefillExistingVote(votes, currentUser) {
    if (!currentUser || !votes) return;
    const myVote = votes.find(v => v.voter && (v.voter === currentUser.id || v.voter_name === currentUser.name));
    if (myVote) {
      const radios = document.getElementsByName('board_vote');
      radios.forEach(r => {
        if (r.value === myVote.vote) r.checked = true;
      });

      const rankSel = document.getElementById('input-rank-priority');
      if (rankSel && myVote.rank_priority) rankSel.value = myVote.rank_priority.toString();

      const notesEl = document.getElementById('textarea-deliberation-notes');
      if (notesEl && myVote.deliberation_notes) notesEl.value = myVote.deliberation_notes;

      const btnSubmit = document.getElementById('btn-submit-ballot');
      if (btnSubmit) btnSubmit.textContent = 'Update Deliberative Ballot';
    }
  }

  // Handle Ballot Submission
  const formBallot = document.getElementById('form-cast-ballot');
  if (formBallot) {
    formBallot.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selectedVote = document.querySelector('input[name="board_vote"]:checked')?.value || 'APPROVE';
      const rankPriority = parseInt(document.getElementById('input-rank-priority').value, 10) || 1;
      const deliberationNotes = document.getElementById('textarea-deliberation-notes').value.trim();

      if (!deliberationNotes) {
        showToast('Please provide brief deliberation notes explaining your board vote.', 'warning');
        document.getElementById('textarea-deliberation-notes').focus();
        return;
      }

      const btnSubmit = document.getElementById('btn-submit-ballot');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Submitting Ballot...';

      try {
        const response = await apiPost(`/hiring/${applicationId}/vote/`, {
          vote: selectedVote,
          rank_priority: rankPriority,
          deliberation_notes: deliberationNotes
        });

        showToast(response.message || 'Ballot successfully recorded!', 'success');
        loadDeliberationSummary(applicationId);

      } catch (err) {
        console.error('Voting error:', err);
        showToast(err.message || 'Failed to record deliberative ballot.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cast Deliberative Ballot';
      }
    });
  }

  // Initial load
  loadDeliberationSummary(applicationId);
});
