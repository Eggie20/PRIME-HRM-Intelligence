/**
 * NBSC PRIME-HRM Intelligence Hub — Vacancy Directory Logic
 * Paginated vacancy directory with filters, rate limit rows-per-page,
 * column sorting, live status indicators, and interactive pagination.
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

  // DOM elements
  const tbody = document.getElementById('vacancy-table-body');
  const emptyStateContainer = document.getElementById('vacancy-empty-state');
  const inputSearch = document.getElementById('input-search-vacancies');
  const selectDept = document.getElementById('select-filter-dept');
  const selectCategory = document.getElementById('select-filter-category');
  const selectStatus = document.getElementById('select-filter-status');
  const btnReset = document.getElementById('btn-reset-filters');
  const btnLogout = document.getElementById('btn-logout');

  // Top live indicator elements
  const vacanciesCountNum = document.getElementById('vacancies-count-num');
  const vacanciesCountLabel = document.getElementById('vacancies-count-label');
  const indicatorScopeTag = document.getElementById('indicator-scope-tag');

  // Table footer pagination & rate limit elements
  const selectPageSize = document.getElementById('select-page-size');
  const rangeStart = document.getElementById('range-start');
  const rangeEnd = document.getElementById('range-end');
  const rangeTotal = document.getElementById('range-total');
  const metricTotalSlots = document.getElementById('metric-total-slots');
  const metricOpenCount = document.getElementById('metric-open-count');
  const paginationNav = document.getElementById('vacancies-pagination-nav');
  const sortableHeaders = document.querySelectorAll('.sortable-th');

  // Populate department filter
  if (selectDept) {
    DEPARTMENTS.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.code;
      opt.textContent = `${dept.code} - ${dept.name}`;
      selectDept.appendChild(opt);
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showModal(
        'Confirm Sign Out',
        '<p>Are you sure you want to end your recruitment session?</p>',
        'Sign Out',
        () => logout('/pages/auth/admin-login/admin-login.html')
      );
    });
  }

  // State
  let currentPage = 1;
  let pageSize = '10';
  let currentSortBy = 'title';
  let currentSortOrder = 'asc';

  /**
   * Fetches vacancies from API matching active filters.
   * @param {number} [page=1]
   */
  async function fetchVacancies(page = 1) {
    currentPage = page;
    showLoadingSpinner(tbody);

    const searchVal = inputSearch ? inputSearch.value.trim() : '';
    const deptVal = selectDept ? selectDept.value : '';
    const catVal = selectCategory ? selectCategory.value : '';
    const statusVal = selectStatus ? selectStatus.value : '';
    const isFiltered = Boolean(searchVal || deptVal || catVal || statusVal);

    const params = {
      page,
      page_size: pageSize,
      q: searchVal,
      department: deptVal,
      category: catVal,
      status: statusVal,
      sort_by: currentSortBy,
      order: currentSortOrder
    };

    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== '')
    ).toString();

    try {
      const res = await apiGet(`/vacancies/?${queryString}`);
      if (res.success && res.data) {
        const vacancies = res.data.vacancies || [];
        const pagination = res.data.pagination || {
          page: 1,
          total_pages: 1,
          total_items: vacancies.length,
          start_index: 1,
          end_index: vacancies.length
        };

        // Update Top Indicator
        const totalItems = pagination.total_items;
        if (vacanciesCountNum) vacanciesCountNum.textContent = totalItems;
        if (vacanciesCountLabel) {
          if (isFiltered) {
            const grandTotal = document.getElementById('kpi-total-vacancies')?.textContent || '6';
            vacanciesCountLabel.textContent = `of ${grandTotal} Filtered`;
          } else {
            vacanciesCountLabel.textContent = totalItems === 1 ? 'Vacancy Active' : 'Vacancies Active';
          }
        }
        if (indicatorScopeTag) {
          indicatorScopeTag.textContent = isFiltered ? 'Filtered' : 'Plantilla Registry';
          indicatorScopeTag.style.background = isFiltered ? 'rgba(59, 130, 246, 0.12)' : 'rgba(212, 168, 67, 0.15)';
          indicatorScopeTag.style.color = isFiltered ? '#1D4ED8' : '#854D0E';
          indicatorScopeTag.style.borderColor = isFiltered ? 'rgba(59, 130, 246, 0.28)' : 'rgba(212, 168, 67, 0.3)';
        }

        updateVacancyKpis(vacancies);
        updateFooterMetrics(vacancies);
        renderVacancyTable(vacancies);
        renderCustomPagination(pagination);
        updateSortIcons();
      } else {
        showToast(res.message || 'Failed to load vacancies.', 'error');
      }
    } catch (err) {
      showToast('Network error connecting to vacancies API.', 'error');
    }
  }

  function updateVacancyKpis(vacancies) {
    const kpiTotal = document.getElementById('kpi-total-vacancies');
    const kpiOpen = document.getElementById('kpi-open-vacancies');
    const kpiDelib = document.getElementById('kpi-delib-vacancies');
    const kpiCandidates = document.getElementById('kpi-total-candidates');

    if (kpiTotal) kpiTotal.textContent = vacancies.length;
    if (kpiOpen) kpiOpen.textContent = vacancies.filter(v => v.status === 'OPEN').length;
    if (kpiDelib) kpiDelib.textContent = vacancies.filter(v => v.status === 'DELIBERATION').length;
    if (kpiCandidates) {
      const totalApps = vacancies.reduce((sum, v) => sum + (v.applicant_count || 0), 0);
      kpiCandidates.textContent = totalApps;
    }
  }

  function updateFooterMetrics(vacancies) {
    if (!vacancies || vacancies.length === 0) {
      if (metricTotalSlots) metricTotalSlots.textContent = '0 Available Slots';
      if (metricOpenCount) metricOpenCount.textContent = '0 Postings';
      return;
    }
    const totalSlots = vacancies.reduce((sum, v) => sum + (v.slots || 1), 0);
    const openPostings = vacancies.filter(v => v.status === 'OPEN').length;
    if (metricTotalSlots) metricTotalSlots.textContent = `${totalSlots} Available Slot${totalSlots === 1 ? '' : 's'}`;
    if (metricOpenCount) metricOpenCount.textContent = `${openPostings} Posting${openPostings === 1 ? '' : 's'}`;
  }

  /**
   * Renders vacancy rows into table body.
   * @param {Array<Object>} vacancies
   */
  function renderVacancyTable(vacancies) {
    tbody.innerHTML = '';

    if (!vacancies || vacancies.length === 0) {
      emptyStateContainer.classList.remove('d-none');
      renderEmptyState(
        emptyStateContainer,
        'No Vacancies Found',
        'There are no vacancies matching your current filter criteria.',
        '+ Create Vacancy',
        () => window.location.href = '../vacancy-form/vacancy-form.html'
      );
      return;
    }

    emptyStateContainer.classList.add('d-none');

    vacancies.forEach(v => {
      const tr = document.createElement('tr');

      const isTeaching = v.category === 'TEACHING';
      const categoryBadge = isTeaching
        ? '<span class="badge--teaching">Teaching</span>'
        : '<span class="badge--non-teaching">Non-Teaching</span>';

      let statusBadge = '<span class="badge--open">Open</span>';
      if (v.status === 'DELIBERATION') {
        statusBadge = '<span class="badge--deliberation">Deliberation</span>';
      } else if (v.status === 'CLOSED') {
        statusBadge = '<span class="badge--closed">Closed</span>';
      }

      const salaryStr = v.monthly_salary
        ? `&#8369;${Number(v.monthly_salary).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`
        : '—';

      const deadlineStr = v.deadline
        ? new Date(v.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Open until filled';

      tr.innerHTML = `
        <td>
          <div class="font-semibold text-primary-900">${escapeHtml(v.title || 'Untitled Vacancy')}</div>
          <div class="text-xs text-muted font-normal mt-1">
            ${escapeHtml(v.department || v.department_code || 'General')} &bull;
            <span class="text-accent-700 font-medium">${v.employment_status || 'Permanent (Plantilla)'}</span>
          </div>
        </td>
        <td>${categoryBadge}</td>
        <td>
          <div class="font-medium">SG ${v.salary_grade || '—'}</div>
          <div class="text-xs text-muted font-mono">${salaryStr}</div>
        </td>
        <td><span class="font-semibold">${v.slots || 1}</span></td>
        <td>
          <span class="font-bold text-primary-800">${v.applicant_count || 0}</span>
        </td>
        <td class="text-xs text-neutral-600">${deadlineStr}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <div class="vacancy-actions-group">
            <a href="../../hiring/hiring-pipeline/hiring-pipeline.html?vacancy_id=${v.id}" class="btn-pipeline-pill" title="View Hiring Pipeline" aria-label="View Hiring Pipeline">
              <span class="btn-icon">&#9638;</span>
              <span>Pipeline</span>
            </a>
            <a href="../vacancy-form/vacancy-form.html?id=${v.id}" class="action-btn" title="Edit Vacancy" aria-label="Edit Vacancy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </a>
            <button class="action-btn action-btn--archive" data-id="${v.id}" data-title="${escapeHtml(v.title)}" title="Archive Vacancy" aria-label="Archive Vacancy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach archive listener
    tbody.querySelectorAll('.action-btn--archive').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const title = e.currentTarget.getAttribute('data-title');
        handleArchiveVacancy(id, title);
      });
    });
  }

  /**
   * Renders interactive pagination buttons and range indicator in the table footer.
   * @param {Object} meta
   */
  function renderCustomPagination(meta) {
    if (!paginationNav) return;
    const page = meta.page || 1;
    const totalPages = meta.total_pages || 1;
    const totalItems = meta.total_items !== undefined ? meta.total_items : 0;

    if (rangeStart) rangeStart.textContent = totalItems === 0 ? 0 : (meta.start_index || 1);
    if (rangeEnd) rangeEnd.textContent = meta.end_index || totalItems;
    if (rangeTotal) rangeTotal.textContent = totalItems;

    if (totalItems === 0) {
      paginationNav.innerHTML = '';
      return;
    }

    let navHtml = '';

    // First button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-vac-first" title="First Page" ${page <= 1 ? 'disabled' : ''}>
        &laquo;
      </button>
    `;

    // Prev button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-vac-prev" title="Previous Page" ${page <= 1 ? 'disabled' : ''}>
        &lsaquo;
      </button>
    `;

    // Page number buttons
    const maxVisible = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      navHtml += `<button class="btn-page" data-page="1">1</button>`;
      if (startPage > 2) {
        navHtml += `<span class="btn-page" style="border:none;background:transparent;cursor:default;opacity:0.4;">...</span>`;
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      navHtml += `
        <button class="btn-page ${p === page ? 'btn-page--active' : ''}" data-page="${p}" aria-current="${p === page ? 'page' : 'false'}">
          ${p}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        navHtml += `<span class="btn-page" style="border:none;background:transparent;cursor:default;opacity:0.4;">...</span>`;
      }
      navHtml += `<button class="btn-page" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-vac-next" title="Next Page" ${page >= totalPages ? 'disabled' : ''}>
        &rsaquo;
      </button>
    `;

    // Last button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-vac-last" title="Last Page" ${page >= totalPages ? 'disabled' : ''}>
        &raquo;
      </button>
    `;

    paginationNav.innerHTML = navHtml;

    // Attach navigation listeners
    const btnFirst = paginationNav.querySelector('#btn-vac-first');
    if (btnFirst && page > 1) btnFirst.onclick = () => fetchVacancies(1);

    const btnPrev = paginationNav.querySelector('#btn-vac-prev');
    if (btnPrev && page > 1) btnPrev.onclick = () => fetchVacancies(page - 1);

    const btnNext = paginationNav.querySelector('#btn-vac-next');
    if (btnNext && page < totalPages) btnNext.onclick = () => fetchVacancies(page + 1);

    const btnLast = paginationNav.querySelector('#btn-vac-last');
    if (btnLast && page < totalPages) btnLast.onclick = () => fetchVacancies(totalPages);

    paginationNav.querySelectorAll('.btn-page[data-page]').forEach(btn => {
      btn.onclick = () => {
        const targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (targetPage !== page) {
          fetchVacancies(targetPage);
        }
      };
    });
  }

  /**
   * Updates sort indicator chevrons on column headers.
   */
  function updateSortIcons() {
    sortableHeaders.forEach(th => {
      const field = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;
      if (field === currentSortBy) {
        th.classList.add('sort-active');
        icon.innerHTML = currentSortOrder === 'asc' ? '&#9650;' : '&#9660;';
      } else {
        th.classList.remove('sort-active');
        icon.innerHTML = '&#8645;';
      }
    });
  }

  /**
   * Prompts confirmation and archives vacancy record.
   * @param {string} id
   * @param {string} title
   */
  function handleArchiveVacancy(id, title) {
    showModal(
      'Archive Vacancy',
      `<p>Are you sure you want to archive <strong>${title}</strong>? Candidates and audit history will remain intact.</p>`,
      'Archive',
      async () => {
        try {
          const res = await apiDelete(`/vacancies/${id}/`);
          if (res.success) {
            showToast(`Vacancy "${title}" archived.`, 'success');
            await fetchVacancies(currentPage);
          } else {
            showToast(res.message || 'Failed to archive.', 'error');
          }
        } catch (err) {
          showToast('Network error archiving vacancy.', 'error');
        }
      },
      'Cancel'
    );
  }

  // Filter events
  if (selectDept) selectDept.addEventListener('change', () => fetchVacancies(1));
  if (selectCategory) selectCategory.addEventListener('change', () => fetchVacancies(1));
  if (selectStatus) selectStatus.addEventListener('change', () => fetchVacancies(1));
  if (inputSearch) inputSearch.addEventListener('input', debounce(() => fetchVacancies(1), 300));

  // Rows per page (Rate limit) selector
  if (selectPageSize) {
    selectPageSize.addEventListener('change', () => {
      pageSize = selectPageSize.value;
      fetchVacancies(1);
    });
  }

  // Column header sorting
  sortableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (currentSortBy === field) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortBy = field;
        currentSortOrder = 'asc';
      }
      updateSortIcons();
      fetchVacancies(1);
    });
  });

  // Reset filters
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (inputSearch) inputSearch.value = '';
      if (selectDept) selectDept.value = '';
      if (selectCategory) selectCategory.value = '';
      if (selectStatus) selectStatus.value = '';
      currentSortBy = 'title';
      currentSortOrder = 'asc';
      if (selectPageSize) selectPageSize.value = '10';
      pageSize = '10';
      fetchVacancies(1);
      showToast('Filters and sorting reset to default', 'info', 1500);
    });
  }

  await fetchVacancies(1);
});
