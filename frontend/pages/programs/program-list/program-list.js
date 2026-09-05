/**
 * NBSC PRIME-HRM Intelligence Hub — Programs Directory Logic
 * Complete filtering, debounced search, rate limit rows-per-page, column sorting, and pagination.
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

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout('/pages/auth/admin-login/admin-login.html');
    });
  }

  // DOM elements
  const tbody = document.getElementById('program-table-body');
  const emptyStateContainer = document.getElementById('program-empty-state');
  const selectDept = document.getElementById('select-program-dept');
  const inputSearch = document.getElementById('input-search-program');
  const btnReset = document.getElementById('btn-reset-filters');
  const kpiTotalEl = document.getElementById('kpi-total-programs');

  // Live top indicator elements
  const programsCountNum = document.getElementById('programs-count-num');
  const programsCountLabel = document.getElementById('programs-count-label');
  const indicatorScopeTag = document.getElementById('indicator-scope-tag');

  // Table footer pagination & rate limit elements
  const selectPageSize = document.getElementById('select-page-size');
  const rangeStart = document.getElementById('range-start');
  const rangeEnd = document.getElementById('range-end');
  const rangeTotal = document.getElementById('range-total');
  const metricDivisionsCount = document.getElementById('metric-divisions-count');
  const paginationNav = document.getElementById('programs-pagination-nav');
  const sortableHeaders = document.querySelectorAll('.sortable-th');

  // State
  let allPrograms = [];
  let currentPage = 1;
  let pageSize = '10';
  let currentSortBy = 'code';
  let currentSortOrder = 'asc';

  /**
   * Fetches programs from API and renders table.
   */
  async function fetchPrograms() {
    showLoadingSpinner(tbody);
    try {
      const response = await apiGet('/programs/');
      allPrograms = response.data.programs || [];
      if (kpiTotalEl) {
        kpiTotalEl.textContent = allPrograms.length;
      }
      renderFilteredPrograms(1);
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center p-6 text-danger">
            Error loading programs: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
    }
  }

  /**
   * Filters, sorts, and paginates programs client-side with full rate-limit support.
   * @param {number} [page=1]
   */
  function renderFilteredPrograms(page = 1) {
    currentPage = page;
    const dept = selectDept ? selectDept.value.trim() : '';
    const query = inputSearch ? inputSearch.value.trim().toLowerCase() : '';
    const isFiltered = Boolean(dept || query);

    let filtered = [...allPrograms];

    // 1. Department / Institute filter
    if (dept) {
      filtered = filtered.filter(p => {
        const deptCode = (p.department_code || '').toLowerCase();
        const deptName = (p.department || '').toLowerCase();
        const target = dept.toLowerCase();
        return deptCode.includes(target) || deptName.includes(target);
      });
    }

    // 2. Keyword Search
    if (query) {
      filtered = filtered.filter(p =>
        (p.code && p.code.toLowerCase().includes(query)) ||
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.department && p.department.toLowerCase().includes(query)) ||
        (p.department_code && p.department_code.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // 3. Sorting
    filtered.sort((a, b) => {
      let valA = a[currentSortBy] ?? '';
      let valB = b[currentSortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalItems = filtered.length;
    const limit = pageSize === 'all' ? 9999 : (parseInt(pageSize, 10) || 10);
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    currentPage = validPage;

    const startIdx = (validPage - 1) * limit;
    const pagedRows = filtered.slice(startIdx, startIdx + limit);

    // Update Top Indicator
    if (programsCountNum) programsCountNum.textContent = totalItems;
    if (programsCountLabel) {
      if (isFiltered) {
        programsCountLabel.textContent = `of ${allPrograms.length} Filtered`;
      } else {
        programsCountLabel.textContent = totalItems === 1 ? 'Program Active' : 'Programs Active';
      }
    }
    if (indicatorScopeTag) {
      indicatorScopeTag.textContent = isFiltered ? 'Filtered' : 'Academic Registry';
      indicatorScopeTag.style.background = isFiltered ? 'rgba(59, 130, 246, 0.12)' : 'rgba(212, 168, 67, 0.15)';
      indicatorScopeTag.style.color = isFiltered ? '#1D4ED8' : '#854D0E';
      indicatorScopeTag.style.borderColor = isFiltered ? 'rgba(59, 130, 246, 0.28)' : 'rgba(212, 168, 67, 0.3)';
    }

    // Update Footer Metrics
    const uniqueDepts = new Set(filtered.map(p => p.department_code || p.department)).size;
    if (metricDivisionsCount) {
      metricDivisionsCount.textContent = `${uniqueDepts} Institute${uniqueDepts === 1 ? '' : 's'}`;
    }

    // Empty state handling
    if (totalItems === 0) {
      tbody.innerHTML = '';
      if (emptyStateContainer) {
        emptyStateContainer.classList.remove('d-none');
        renderEmptyState(
          emptyStateContainer,
          'No Academic Programs Found',
          'No degree curricula matched your query. Try clearing search keywords or institute filters.',
          '+ Add New Program',
          () => window.location.href = '../program-form/program-form.html'
        );
      }
      renderCustomPagination({ page: 1, total_pages: 1, total_items: 0, start_index: 0, end_index: 0 });
      return;
    }

    if (emptyStateContainer) {
      emptyStateContainer.classList.add('d-none');
    }

    // Render Table Rows
    tbody.innerHTML = pagedRows.map(p => `
      <tr>
        <td><span class="program-code-badge">${escapeHtml(p.code)}</span></td>
        <td>
          <div class="font-semibold text-primary-900" style="font-size: 0.875rem;">${escapeHtml(p.name)}</div>
        </td>
        <td>
          <span class="institute-chip">${escapeHtml(p.department)}</span>
        </td>
        <td class="text-muted text-xs" style="max-width: 360px; line-height: 1.5;">${escapeHtml(p.description || '—')}</td>
        <td>
          <div class="action-btn-group">
            <a href="../program-form/program-form.html?id=${encodeURIComponent(p.id || p.code)}" class="action-btn" title="Edit Program" aria-label="Edit ${escapeHtml(p.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </a>
            <button class="action-btn action-btn--delete btn-delete-prog" data-id="${escapeHtml(p.id || p.code)}" data-name="${escapeHtml(p.name)}" title="Deactivate Program" aria-label="Deactivate ${escapeHtml(p.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach delete listeners
    tbody.querySelectorAll('.btn-delete-prog').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        deleteProgram(id, name);
      };
    });

    // Render Pagination Bar
    renderCustomPagination({
      page: validPage,
      total_pages: totalPages,
      total_items: totalItems,
      start_index: startIdx + 1,
      end_index: Math.min(startIdx + limit, totalItems)
    });

    updateSortIcons();
  }

  /**
   * Renders interactive pagination buttons and range text.
   * @param {Object} meta
   */
  function renderCustomPagination(meta) {
    if (!paginationNav) return;
    const { page, total_pages, total_items, start_index, end_index } = meta;

    if (rangeStart) rangeStart.textContent = total_items === 0 ? 0 : start_index;
    if (rangeEnd) rangeEnd.textContent = end_index;
    if (rangeTotal) rangeTotal.textContent = total_items;

    if (total_items === 0) {
      paginationNav.innerHTML = '';
      return;
    }

    let navHtml = '';

    // First button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-prog-first" title="First Page" ${page <= 1 ? 'disabled' : ''}>
        &laquo;
      </button>
    `;

    // Prev button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-prog-prev" title="Previous Page" ${page <= 1 ? 'disabled' : ''}>
        &lsaquo;
      </button>
    `;

    // Page number buttons
    const maxVisible = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);
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

    if (endPage < total_pages) {
      if (endPage < total_pages - 1) {
        navHtml += `<span class="btn-page" style="border:none;background:transparent;cursor:default;opacity:0.4;">...</span>`;
      }
      navHtml += `<button class="btn-page" data-page="${total_pages}">${total_pages}</button>`;
    }

    // Next button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-prog-next" title="Next Page" ${page >= total_pages ? 'disabled' : ''}>
        &rsaquo;
      </button>
    `;

    // Last button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-prog-last" title="Last Page" ${page >= total_pages ? 'disabled' : ''}>
        &raquo;
      </button>
    `;

    paginationNav.innerHTML = navHtml;

    // Attach navigation listeners
    const btnFirst = paginationNav.querySelector('#btn-prog-first');
    if (btnFirst && page > 1) btnFirst.onclick = () => renderFilteredPrograms(1);

    const btnPrev = paginationNav.querySelector('#btn-prog-prev');
    if (btnPrev && page > 1) btnPrev.onclick = () => renderFilteredPrograms(page - 1);

    const btnNext = paginationNav.querySelector('#btn-prog-next');
    if (btnNext && page < total_pages) btnNext.onclick = () => renderFilteredPrograms(page + 1);

    const btnLast = paginationNav.querySelector('#btn-prog-last');
    if (btnLast && page < total_pages) btnLast.onclick = () => renderFilteredPrograms(total_pages);

    paginationNav.querySelectorAll('.btn-page[data-page]').forEach(btn => {
      btn.onclick = () => {
        const targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (targetPage !== page) {
          renderFilteredPrograms(targetPage);
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
   * Deactivates program with confirmation modal.
   * @param {string} id
   * @param {string} name
   */
  function deleteProgram(id, name) {
    showModal(
      'Deactivate Program',
      `<p>Are you sure you want to deactivate program <strong>${escapeHtml(name)}</strong>?</p>`,
      'Deactivate',
      async () => {
        try {
          await apiDelete(`/programs/${id}/`);
          showToast(`Program ${name} deactivated.`, 'success');
          await fetchPrograms();
        } catch (e) {
          showToast(e.message || 'Failed to deactivate program.', 'error');
        }
      }
    );
  }

  // Event Listeners
  if (selectDept) selectDept.addEventListener('change', () => renderFilteredPrograms(1));
  if (inputSearch) inputSearch.addEventListener('input', debounce(() => renderFilteredPrograms(1), 250));

  // Rows per page (Rate limit) selector
  if (selectPageSize) {
    selectPageSize.addEventListener('change', () => {
      pageSize = selectPageSize.value;
      renderFilteredPrograms(1);
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
      renderFilteredPrograms(1);
    });
  });

  // Reset filters handler
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (selectDept) selectDept.value = '';
      if (inputSearch) inputSearch.value = '';
      currentSortBy = 'code';
      currentSortOrder = 'asc';
      if (selectPageSize) selectPageSize.value = '10';
      pageSize = '10';
      renderFilteredPrograms(1);
      showToast('Filters and sorting reset to default', 'info', 1500);
    });
  }

  await fetchPrograms();
});
