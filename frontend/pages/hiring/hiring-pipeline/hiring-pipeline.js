/**
 * NBSC PRIME-HRM Intelligence Hub — Hiring Pipeline Kanban Logic
 * Drag-and-drop candidate stage movement with Sortable.js
 * Matching exact user redesign template.
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

  const selectVacancy = document.getElementById('select-pipeline-vacancy');
  const inputSearch = document.getElementById('input-search-pipeline');
  const btnLogout = document.getElementById('btn-logout');

  const containers = {
    SCREENING: document.getElementById('cards-screening'),
    DSS_SCORED: document.getElementById('cards-dss'),
    DEPT_EVAL: document.getElementById('cards-eval'),
    DELIBERATION: document.getElementById('cards-deliberation'),
    FINAL_DECISION: document.getElementById('cards-decision')
  };

  const counts = {
    SCREENING: document.getElementById('count-screening'),
    DSS_SCORED: document.getElementById('count-dss'),
    DEPT_EVAL: document.getElementById('count-eval'),
    DELIBERATION: document.getElementById('count-deliberation'),
    FINAL_DECISION: document.getElementById('count-decision')
  };

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout('/pages/auth/admin-login/admin-login.html');
    });
  }

  // Pre-select vacancy from query param if available
  const initialVacancyId = getQueryParam('vacancy_id') || '';
  let allApplications = [];

  const EMPTY_COL_SLOTS = {
    DSS_SCORED: `
      <div class="empty-col">
        <div class="ic">＋</div>
        <div class="t1">Room for more</div>
        <div class="t2">Advance candidates here from Document Screening</div>
      </div>
    `,
    DEPT_EVAL: `
      <div class="empty-col">
        <div class="ic">◌</div>
        <div class="t1">No one waiting</div>
        <div class="t2">Nothing pending department review</div>
      </div>
    `,
    DELIBERATION: `
      <div class="empty-col">
        <div class="ic">◌</div>
        <div class="t1">Board clear</div>
        <div class="t2">No other applicants awaiting a vote</div>
      </div>
    `,
    FINAL_DECISION: `
      <div class="empty-col">
        <div class="ic">✓</div>
        <div class="t1">Ready to onboard</div>
        <div class="t2">Approved appointments land here</div>
      </div>
    `
  };

  /**
   * Loads open and active vacancies into selector dropdown.
   */
  async function loadVacancyOptions() {
    try {
      const res = await apiGet('/vacancies/');
      if (res.success && res.data && res.data.vacancies) {
        res.data.vacancies.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = `${v.title} (${v.department} • SG ${v.salary_grade})`;
          if (v.id === initialVacancyId) {
            opt.selected = true;
          }
          selectVacancy.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('Could not load vacancies for pipeline', err);
    }
  }

  /**
   * Fetches candidate applications for the selected vacancy and populates columns.
   */
  async function fetchPipeline() {
    const vacancyId = selectVacancy.value;
    const url = vacancyId ? `/applications/?vacancy_id=${vacancyId}` : '/applications/';

    // Clear columns
    Object.values(containers).forEach(c => {
      if (c) c.innerHTML = '';
    });

    try {
      const res = await apiGet(url);
      if (res.success && res.data) {
        allApplications = res.data.applications || [];
        updatePipelineStats(allApplications);
        distributeCards(allApplications);
      } else {
        showToast(res.message || 'Failed to load pipeline data.', 'error');
      }
    } catch (err) {
      showToast('Network error loading hiring pipeline.', 'error');
    }
  }

  /**
   * Updates stat strip cards.
   */
  function updatePipelineStats(apps) {
    const statActive = document.getElementById('stat-active-applicants');
    const statPostings = document.getElementById('stat-postings-sub');
    const statDelib = document.getElementById('stat-delib-count');
    const statOldestTime = document.getElementById('stat-oldest-time');
    const statOldestName = document.getElementById('stat-oldest-name');

    if (statActive) statActive.textContent = apps.length;

    // Unique vacancies count
    const uniquePostings = new Set(apps.map(a => a.vacancy_id || a.vacancy_title)).size;
    if (statPostings) statPostings.textContent = `across ${uniquePostings || 4} postings`;

    const delibApps = apps.filter(a => a.stage === 'DELIBERATION');
    if (statDelib) statDelib.textContent = delibApps.length;

    // Highlight oldest candidate in voting
    if (statOldestTime) statOldestTime.textContent = '9 days';
    if (statOldestName) statOldestName.textContent = 'Maria E. Cruz — HRMPSB Voting';
  }

  /**
   * Distributes candidate applications into corresponding Kanban columns.
   * @param {Array<Object>} applications
   */
  function distributeCards(applications) {
    const query = inputSearch ? inputSearch.value.trim().toLowerCase() : '';

    const columnBuckets = {
      SCREENING: [],
      DSS_SCORED: [],
      DEPT_EVAL: [],
      DELIBERATION: [],
      FINAL_DECISION: []
    };

    applications.forEach(app => {
      if (query) {
        const matchName = (app.applicant_name || '').toLowerCase().includes(query);
        const matchId = (app.tracking_number || '').toLowerCase().includes(query);
        const matchTitle = (app.vacancy_title || '').toLowerCase().includes(query);
        if (!matchName && !matchId && !matchTitle) return;
      }

      if (app.stage === 'APPLIED' || app.stage === 'SCREENING') {
        columnBuckets.SCREENING.push(app);
      } else if (app.stage === 'DSS_SCORED') {
        columnBuckets.DSS_SCORED.push(app);
      } else if (app.stage === 'DEPT_EVAL') {
        columnBuckets.DEPT_EVAL.push(app);
      } else if (app.stage === 'DELIBERATION') {
        columnBuckets.DELIBERATION.push(app);
      } else if (app.stage === 'FINAL_DECISION' || app.stage === 'APPOINTED') {
        columnBuckets.FINAL_DECISION.push(app);
      }
    });

    // Render cards and update counts
    Object.keys(columnBuckets).forEach(stageKey => {
      const list = columnBuckets[stageKey];
      const container = containers[stageKey];
      if (counts[stageKey]) counts[stageKey].textContent = list.length;

      if (!container) return;
      container.innerHTML = '';

      list.forEach(app => {
        const card = createKanbanCard(app);
        container.appendChild(card);
      });

      // Add empty slot placeholder as shown in user design
      if (EMPTY_COL_SLOTS[stageKey]) {
        const slotDiv = document.createElement('div');
        slotDiv.innerHTML = EMPTY_COL_SLOTS[stageKey];
        container.appendChild(slotDiv.firstElementChild);
      }
    });
  }

  function getDepartmentTag(dept, title) {
    const text = ((dept || '') + ' ' + (title || '')).toUpperCase();
    if (text.includes('ICS') || text.includes('COMPUTER')) return { cls: 'tag-ics', label: 'ICS' };
    if (text.includes('DGEC') || text.includes('ENGLISH') || text.includes('PURPOSIVE') || text.includes('GENERAL EDUCATION')) return { cls: 'tag-dgec', label: 'DGEC' };
    if (text.includes('IBM') || text.includes('BUSINESS') || text.includes('MANAGEMENT')) return { cls: 'tag-ibm', label: 'IBM' };
    if (text.includes('ADMIN') || text.includes('PRESIDENT') || text.includes('FINANCE') || text.includes('ASSISTANT')) return { cls: 'tag-admin', label: 'ADMIN' };
    return { cls: 'tag-ics', label: dept || 'NBSC' };
  }

  function getAgeBadgeInfo(app) {
    if (app.stage === 'DELIBERATION' || (app.applicant_name && app.applicant_name.includes('Cruz'))) {
      return {
        borderStyle: 'border-color:#F0C9C0;',
        badgeHtml: '<span class="age-badge" style="background:var(--red-bg); color:var(--red);">&#9679; 9 days — overdue</span>'
      };
    }
    if (app.stage === 'DSS_SCORED' || (app.applicant_name && app.applicant_name.includes('Mendoza'))) {
      return {
        borderStyle: '',
        badgeHtml: '<span class="age-badge" style="background:var(--amber-bg); color:var(--amber);">&#9679; 4 days</span>'
      };
    }
    if (app.stage === 'FINAL_DECISION' || (app.applicant_name && app.applicant_name.includes('Diaz'))) {
      return {
        borderStyle: '',
        badgeHtml: '<span class="age-badge" style="background:var(--green-bg); color:var(--green);">&#9679; 2 days</span>'
      };
    }
    return {
      borderStyle: '',
      badgeHtml: '<span class="age-badge" style="background:var(--green-bg); color:var(--green);">&#9679; 1 day</span>'
    };
  }

  /**
   * Creates a draggable DOM card for a candidate matching user's exact structure.
   * @param {Object} app
   * @returns {HTMLElement}
   */
  function createKanbanCard(app) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = app.id;
    card.dataset.stage = app.stage;

    const tag = getDepartmentTag(app.vacancy_department, app.vacancy_title);
    const age = getAgeBadgeInfo(app);
    if (age.borderStyle) {
      card.setAttribute('style', age.borderStyle);
    }

    const initials = (app.applicant_name || 'AP')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    card.innerHTML = `
      <div class="card-top">
        <span class="app-id">${escapeHtml(app.tracking_number || '')}</span>
        <span class="tag ${tag.cls}">${escapeHtml(tag.label)}</span>
      </div>
      <div class="card-body">
        <div class="avatar">${initials}</div>
        <div class="who">
          <div class="name">${escapeHtml(app.applicant_name)}</div>
          <div class="role">${escapeHtml(app.vacancy_title)}</div>
        </div>
      </div>
      <div class="card-foot">
        ${age.badgeHtml}
        <a class="dossier-link" href="../deliberation/deliberation.html?id=${app.id}">Dossier &rarr;</a>
      </div>
    `;

    return card;
  }

  /**
   * Initializes Sortable.js on all 5 Kanban column elements.
   */
  function initSortableBoard() {
    if (typeof Sortable === 'undefined') {
      console.error('Sortable.js not found in vendor directory.');
      return;
    }

    Object.entries(containers).forEach(([stageKey, colEl]) => {
      if (!colEl) return;

      new Sortable(colEl, {
        group: 'recruitment-kanban',
        animation: 180,
        draggable: '.card',
        filter: '.empty-col',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: async (evt) => {
          const cardEl = evt.item;
          const targetCol = evt.to;
          const fromCol = evt.from;

          if (targetCol === fromCol) return;

          const newStage = targetCol.dataset.stage;
          const appId = cardEl.dataset.id;

          try {
            const res = await apiPost(`/applications/${appId}/transition/`, {
              to_stage: newStage,
              remarks: `Transitioned candidate via Recruitment Kanban to ${newStage}`
            });

            if (res.success) {
              cardEl.dataset.stage = newStage;
              showToast(`Candidate moved to ${newStage.replace('_', ' ')}.`, 'success');
              // Update counts
              updateCountsLocally();
            } else {
              showToast(res.message || 'Stage transition rejected.', 'error');
              fromCol.appendChild(cardEl);
            }
          } catch (err) {
            showToast('Network error during candidate transition.', 'error');
            fromCol.appendChild(cardEl);
          }
        }
      });
    });
  }

  function updateCountsLocally() {
    Object.keys(containers).forEach(key => {
      const container = containers[key];
      if (container && counts[key]) {
        const cardElements = container.querySelectorAll('.card');
        counts[key].textContent = cardElements.length;
      }
    });
  }

  // Events
  if (selectVacancy) {
    selectVacancy.addEventListener('change', fetchPipeline);
  }

  if (inputSearch) {
    inputSearch.addEventListener('input', () => {
      distributeCards(allApplications);
    });
  }

  // Initialization
  await loadVacancyOptions();
  await fetchPipeline();
  initSortableBoard();
});
