/**
 * NBSC PRIME-HRM Intelligence Hub — Employee Directory Logic
 * Table rendering, server-side filtering, debounced search, live KPI metrics,
 * column sorting, customizable rate limit (rows per page), and rich pagination.
 */

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth([ROLES.HR_ADMIN, ROLES.HRMPSB_MEMBER, ROLES.DEPT_HEAD]);

  // Sidebar profile
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
  const tbody = document.getElementById('employee-table-body');
  const emptyStateContainer = document.getElementById('employee-empty-state');
  const inputSearch = document.getElementById('input-search-employees');
  const selectDept = document.getElementById('select-filter-dept');
  const selectCat = document.getElementById('select-filter-category');
  const selectStatus = document.getElementById('select-filter-status');
  const btnLogout = document.getElementById('btn-logout');
  const btnExportRoster = document.getElementById('btn-export-roster');
  const btnImportRoster = document.getElementById('btn-import-roster');
  const btnAddEmployee = document.getElementById('btn-add-employee');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // Role-Based UI Action Controls
  if (user && user.role !== ROLES.HR_ADMIN) {
    if (btnImportRoster) btnImportRoster.style.display = 'none';
    if (btnAddEmployee) btnAddEmployee.style.display = 'none';
  }

  // If logged in as Department Head, auto-scope department filter to their assigned department
  if (user && user.role === ROLES.DEPT_HEAD && user.department_code && selectDept) {
    selectDept.value = user.department_code;
    selectDept.disabled = true; // prevent changing to other departments
  }

  // Live top indicator elements
  const employeeCountNum = document.getElementById('employee-count-num');
  const employeeCountLabel = document.getElementById('employee-count-label');
  const indicatorScopeTag = document.getElementById('indicator-scope-tag');

  // KPI elements
  const kpiTotal = document.getElementById('kpi-total-emp');
  const kpiTeaching = document.getElementById('kpi-teaching-emp');
  const kpiNonTeaching = document.getElementById('kpi-nonteaching-emp');
  const kpiPermanent = document.getElementById('kpi-permanent-emp');

  // Table footer pagination & rate limit elements
  const selectPageSize = document.getElementById('select-page-size');
  const rangeStart = document.getElementById('range-start');
  const rangeEnd = document.getElementById('range-end');
  const rangeTotal = document.getElementById('range-total');
  const metricDailySum = document.getElementById('metric-daily-sum');
  const metricPlantillaRatio = document.getElementById('metric-plantilla-ratio');
  const paginationNav = document.getElementById('employee-pagination-nav');
  const sortableHeaders = document.querySelectorAll('.sortable-th');

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showModal(
        'Confirm Sign Out',
        '<p>Are you sure you want to conclude your session?</p>',
        'Sign Out',
        () => logout('/pages/auth/admin-login/admin-login.html')
      );
    });
  }

  // State
  let currentPage = 1;
  let pageSize = '10';
  let currentSortBy = 'employee_id';
  let currentSortOrder = 'asc';

  // Palette for avatar backgrounds
  const AVATAR_COLORS = ['#0891B2', '#4F46E5', '#D97706', '#9333EA', '#059669', '#0284C7', '#E11D48'];

  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  /**
   * Updates executive KPI banner counts from database records.
   */
  function updateKPIs() {
    if (typeof db === 'undefined') return;
    const all = (db.getTable('employees') || []).filter(e => e.is_active !== false);
    const teaching = all.filter(e => e.category === 'TEACHING').length;
    const nonTeaching = all.filter(e => e.category === 'NON_TEACHING').length;
    const permanent = all.filter(e => (e.employment_status || '') === 'PERMANENT').length;

    if (kpiTotal) kpiTotal.textContent = all.length;
    if (kpiTeaching) kpiTeaching.textContent = teaching;
    if (kpiNonTeaching) kpiNonTeaching.textContent = nonTeaching;
    if (kpiPermanent) kpiPermanent.textContent = permanent;
  }

  /**
   * Updates footer institutional live metrics (daily compensation and plantilla ratio).
   * @param {Array<Object>} employees
   */
  function updateFooterMetrics(employees) {
    if (!employees || employees.length === 0) {
      if (metricDailySum) metricDailySum.innerHTML = '&#8369;0.00';
      if (metricPlantillaRatio) metricPlantillaRatio.textContent = '0%';
      return;
    }
    const totalDaily = employees.reduce((sum, e) => sum + (Number(e.daily_rate) || 0), 0);
    const permanentCount = employees.filter(e => (e.employment_status || '') === 'PERMANENT').length;
    const ratio = Math.round((permanentCount / employees.length) * 100);

    if (metricDailySum) {
      metricDailySum.innerHTML = `&#8369;${totalDaily.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (metricPlantillaRatio) {
      metricPlantillaRatio.textContent = `${ratio}%`;
    }
  }

  /**
   * Fetches paginated employee records based on active filter selections and rate limits.
   * @param {number} [page=1]
   */
  async function fetchEmployees(page = 1) {
    currentPage = page;
    showLoadingSpinner(tbody);

    const searchVal = inputSearch.value.trim();
    const deptVal = selectDept.value;
    const catVal = selectCat.value;
    const statusVal = selectStatus.value;
    const isFiltered = Boolean(searchVal || deptVal || catVal || statusVal);

    const params = {
      page,
      page_size: pageSize,
      search: searchVal,
      department: deptVal,
      category: catVal,
      status: statusVal,
      sort_by: currentSortBy,
      order: currentSortOrder
    };

    try {
      const response = await apiGet('/employees/', params);
      const employees = response.data.employees || [];
      const meta = response.data.pagination || { page: 1, total_pages: 1, total_items: employees.length };

      const totalCount = meta.total_items !== undefined ? meta.total_items : employees.length;

      // Update the live premium indicator
      if (employeeCountNum) employeeCountNum.textContent = totalCount;
      if (employeeCountLabel) {
        if (isFiltered) {
          const grandTotal = kpiTotal ? kpiTotal.textContent : '8';
          employeeCountLabel.textContent = `of ${grandTotal} Filtered`;
        } else {
          employeeCountLabel.textContent = totalCount === 1 ? 'Employee Active' : 'Employees Active';
        }
      }
      if (indicatorScopeTag) {
        indicatorScopeTag.textContent = isFiltered ? 'Filtered' : 'Live Roster';
        indicatorScopeTag.style.background = isFiltered ? 'rgba(59, 130, 246, 0.12)' : 'rgba(212, 168, 67, 0.15)';
        indicatorScopeTag.style.color = isFiltered ? '#1D4ED8' : '#854D0E';
        indicatorScopeTag.style.borderColor = isFiltered ? 'rgba(59, 130, 246, 0.28)' : 'rgba(212, 168, 67, 0.3)';
      }

      updateKPIs();
      updateFooterMetrics(employees);
      renderTable(employees);
      renderCustomPagination(meta);
      updateSortIcons();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center p-6 text-danger">
            Error loading employee directory: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  /**
   * Renders employee objects into HTML table rows.
   * @param {Array<Object>} employees
   */
  function renderTable(employees) {
    if (!employees || employees.length === 0) {
      tbody.innerHTML = '';
      emptyStateContainer.classList.remove('d-none');
      renderEmptyState(
        emptyStateContainer,
        'No Personnel Found',
        'No employee records matched your filter criteria. Try resetting filters or clearing search keywords.',
        '+ Add New Employee',
        () => window.location.href = '../employee-form/employee-form.html'
      );
      return;
    }

    emptyStateContainer.classList.add('d-none');

    tbody.innerHTML = employees.map(emp => {
      const catBadge = emp.category === 'TEACHING'
        ? '<span class="badge badge--teaching">Teaching</span>'
        : '<span class="badge badge--non-teaching">Non-Teaching</span>';

      let statusBadge = '<span class="badge badge--cos">COS</span>';
      if (emp.employment_status === 'PERMANENT') {
        statusBadge = '<span class="badge badge--permanent">Permanent</span>';
      } else if (emp.employment_status === 'TEMPORARY') {
        statusBadge = '<span class="badge badge--temporary">Temporary</span>';
      } else if (emp.employment_status === 'JOB_ORDER') {
        statusBadge = '<span class="badge badge--job-order">Job Order</span>';
      }

      const dailyRateStr = emp.daily_rate > 0
        ? `&#8369;${Number(emp.daily_rate).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—';

      const initials = (emp.full_name || 'Staff')
        .replace(/^(Dr\.|Prof\.|Engr\.|Atty\.)\s*/i, '')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'EM';

      const avatarBg = getAvatarColor(emp.full_name || emp.id);
      const deptCode = emp.department_code || emp.department || 'ADMIN';

      return `
        <tr>
          <td><span class="emp-id-badge">${emp.employee_id || emp.employee_number || emp.id}</span></td>
          <td>
            <div class="emp-cell-user">
              <div class="emp-avatar" style="background-color: ${avatarBg};">${initials}</div>
              <div class="emp-info">
                <span class="emp-name-text">${emp.full_name}</span>
                <span class="emp-email-sub">${emp.email || 'nbsc.edu.ph'}</span>
              </div>
            </div>
          </td>
          <td><span class="dept-chip dept-chip--${deptCode}">${emp.department || deptCode}</span></td>
          <td>
            <div>
              <span>${emp.position || emp.position_title || 'Faculty / Staff'}</span>
              ${emp.salary_grade ? `<small class="text-muted d-block font-xs">SG-${emp.salary_grade}</small>` : ''}
            </div>
          </td>
          <td>${catBadge}</td>
          <td>${statusBadge}</td>
          <td><span class="rate-cell">${dailyRateStr}</span></td>
          <td>
            <div class="actions-cell">
              <a href="../employee-detail/employee-detail.html?id=${emp.id || emp.employee_id}" class="action-btn" title="View Profile" aria-label="View Profile">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </a>
              <a href="../employee-form/employee-form.html?id=${emp.id || emp.employee_id}" class="action-btn" title="Edit Employee" aria-label="Edit Employee">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </a>
              <button class="action-btn action-btn--delete btn-delete-emp" data-id="${emp.id || emp.employee_id}" data-name="${emp.full_name}" title="Deactivate" aria-label="Deactivate">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach delete listeners
    tbody.querySelectorAll('.btn-delete-emp').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        confirmDelete(id, name);
      };
    });
  }

  /**
   * Renders interactive pagination controls and range indicator in the table footer.
   * @param {Object} meta - Pagination metadata
   */
  function renderCustomPagination(meta) {
    if (!paginationNav) return;
    const page = meta.page || 1;
    const totalPages = meta.total_pages || 1;
    const totalItems = meta.total_items !== undefined ? meta.total_items : 0;

    // Update range indicator text
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
      <button class="btn-page btn-page-nav" id="btn-page-first" title="First Page" ${page <= 1 ? 'disabled' : ''}>
        &laquo;
      </button>
    `;

    // Prev button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-page-prev" title="Previous Page" ${page <= 1 ? 'disabled' : ''}>
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
      <button class="btn-page btn-page-nav" id="btn-page-next" title="Next Page" ${page >= totalPages ? 'disabled' : ''}>
        &rsaquo;
      </button>
    `;

    // Last button
    navHtml += `
      <button class="btn-page btn-page-nav" id="btn-page-last" title="Last Page" ${page >= totalPages ? 'disabled' : ''}>
        &raquo;
      </button>
    `;

    paginationNav.innerHTML = navHtml;

    // Attach navigation listeners
    const btnFirst = paginationNav.querySelector('#btn-page-first');
    if (btnFirst && page > 1) btnFirst.onclick = () => fetchEmployees(1);

    const btnPrev = paginationNav.querySelector('#btn-page-prev');
    if (btnPrev && page > 1) btnPrev.onclick = () => fetchEmployees(page - 1);

    const btnNext = paginationNav.querySelector('#btn-page-next');
    if (btnNext && page < totalPages) btnNext.onclick = () => fetchEmployees(page + 1);

    const btnLast = paginationNav.querySelector('#btn-page-last');
    if (btnLast && page < totalPages) btnLast.onclick = () => fetchEmployees(totalPages);

    paginationNav.querySelectorAll('.btn-page[data-page]').forEach(btn => {
      btn.onclick = () => {
        const targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (targetPage !== page) {
          fetchEmployees(targetPage);
        }
      };
    });
  }

  /**
   * Updates sort indicator chevrons on sortable column headers.
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
   * Prompts confirmation and deactivates employee on approval.
   * @param {string} id
   * @param {string} name
   */
  function confirmDelete(id, name) {
    showModal(
      'Deactivate Employee Record',
      `<p>Are you sure you want to deactivate <strong>${name}</strong>? Their historical payroll and audit records will be preserved.</p>`,
      'Deactivate',
      async () => {
        try {
          await apiDelete(`/employees/${id}/`);
          showToast(`Employee ${name} deactivated.`, 'success');
          await fetchEmployees(currentPage);
        } catch (err) {
          showToast(err.message || 'Failed to deactivate employee.', 'error');
        }
      },
      'Cancel'
    );
  }

  // Filter change handlers
  const handleFilterChange = () => fetchEmployees(1);
  selectDept.addEventListener('change', handleFilterChange);
  selectCat.addEventListener('change', handleFilterChange);
  selectStatus.addEventListener('change', handleFilterChange);

  // Debounced search
  inputSearch.addEventListener('input', debounce(handleFilterChange, 300));

  // Rows per page (Rate limit) selector
  if (selectPageSize) {
    selectPageSize.addEventListener('change', () => {
      pageSize = selectPageSize.value;
      fetchEmployees(1);
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
      fetchEmployees(1);
    });
  });

  // Reset filters handler
  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      inputSearch.value = '';
      selectDept.value = '';
      selectCat.value = '';
      selectStatus.value = '';
      currentSortBy = 'employee_id';
      currentSortOrder = 'asc';
      if (selectPageSize) selectPageSize.value = '10';
      pageSize = '10';
      fetchEmployees(1);
      showToast('Filters and sorting reset to default', 'info', 1500);
    });
  }

  // Export roster handler (CSV + JSON options)
  if (btnExportRoster) {
    btnExportRoster.addEventListener('click', () => {
      if (typeof db !== 'undefined' && db.exportRosterCsv) {
        db.exportRosterCsv();
        showToast('NBSC personnel roster downloaded as CSV!', 'success');
      } else if (typeof db !== 'undefined' && db.downloadExport) {
        db.downloadExport();
        showToast('NBSC database exported as JSON!', 'success');
      } else {
        showToast('Exporting roster...', 'info');
      }
    });
  }

  // Add Employee In-Page Modal Handler
  if (btnAddEmployee) {
    btnAddEmployee.addEventListener('click', (e) => {
      e.preventDefault();
      openAddEmployeeModal();
    });
  }

  function openAddEmployeeModal() {
    const modalHtml = `
      <form id="modal-employee-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">First Name *</label>
            <input type="text" id="m-emp-first" class="form-group__input" placeholder="e.g. Jonathan" required style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Last Name *</label>
            <input type="text" id="m-emp-last" class="form-group__input" placeholder="e.g. Cruz" required style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Middle Name</label>
            <input type="text" id="m-emp-mid" class="form-group__input" placeholder="e.g. Santos" style="width: 100%;" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Institutional Email *</label>
            <input type="email" id="m-emp-email" class="form-group__input" placeholder="e.g. jcruz@nbsc.edu.ph" required style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Contact Number</label>
            <input type="text" id="m-emp-phone" class="form-group__input" placeholder="0917-xxx-xxxx" value="0917-482-9011" style="width: 100%;" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Department / Office *</label>
            <select id="m-emp-dept" class="form-group__input" style="width: 100%;">
              <option value="ICS">Institute of Computer Studies (ICS)</option>
              <option value="IBM">Institute of Business and Management (IBM)</option>
              <option value="ITE">Institute of Teacher Education (ITE)</option>
              <option value="DGEC">Dept. of General Education (DGEC)</option>
              <option value="ADMIN">Administrative & General Support (ADMIN)</option>
              <option value="FIN">Finance & Accounting Division (FIN)</option>
              <option value="REG">Office of the College Registrar (REG)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Position Title *</label>
            <input type="text" id="m-emp-title" class="form-group__input" placeholder="e.g. Assistant Professor I" required style="width: 100%;" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Category *</label>
            <select id="m-emp-cat" class="form-group__input" style="width: 100%;">
              <option value="TEACHING">Teaching / Faculty</option>
              <option value="NON_TEACHING">Non-Teaching / Staff</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Appointment Status *</label>
            <select id="m-emp-status" class="form-group__input" style="width: 100%;">
              <option value="PERMANENT">Permanent (Plantilla)</option>
              <option value="COS">Contract of Service (COS)</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="JOB_ORDER">Job Order (JO)</option>
              <option value="PART_TIME">Part-Time Faculty</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Monthly Salary Rate (₱)</label>
            <input type="number" id="m-emp-salary" class="form-group__input" value="38400" style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px;">Daily Rate Equivalent (₱)</label>
            <input type="number" id="m-emp-daily" class="form-group__input" value="1745.45" step="0.01" style="width: 100%;" />
          </div>
        </div>
      </form>
    `;

    showModal(
      '✚ Add New Employee (CSC Form 212)',
      modalHtml,
      'Save Personnel Record',
      async () => {
        const first = document.getElementById('m-emp-first')?.value?.trim();
        const last = document.getElementById('m-emp-last')?.value?.trim();
        const email = document.getElementById('m-emp-email')?.value?.trim();
        const title = document.getElementById('m-emp-title')?.value?.trim();

        if (!first || !last || !email || !title) {
          showToast('Please fill in First Name, Last Name, Email, and Position Title.', 'error');
          return false;
        }

        const newEmpData = {
          first_name: first,
          last_name: last,
          middle_name: document.getElementById('m-emp-mid')?.value?.trim() || '',
          full_name: `${first} ${last}`,
          email: email,
          phone: document.getElementById('m-emp-phone')?.value?.trim() || '',
          department: document.getElementById('m-emp-dept')?.value || 'ADMIN',
          department_code: document.getElementById('m-emp-dept')?.value || 'ADMIN',
          position_title: title,
          category: document.getElementById('m-emp-cat')?.value || 'TEACHING',
          employment_status: document.getElementById('m-emp-status')?.value || 'PERMANENT',
          monthly_salary: Number(document.getElementById('m-emp-salary')?.value) || 38400,
          daily_rate: Number(document.getElementById('m-emp-daily')?.value) || 1745.45
        };

        if (typeof db !== 'undefined' && db.addEmployee) {
          const created = db.addEmployee(newEmpData);
          updateKPIs();
          await fetchEmployees(1);
          showToast(`Successfully added ${created.full_name} to NBSC personnel roster!`, 'success', 3500);
          return true;
        } else {
          showToast('Database engine unavailable.', 'error');
          return false;
        }
      },
      'Cancel'
    );
  }

  // Import Excel In-Page Modal Handler
  if (btnImportRoster) {
    btnImportRoster.addEventListener('click', (e) => {
      e.preventDefault();
      openImportEmployeeModal();
    });
  }

  function openImportEmployeeModal() {
    const modalHtml = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="border: 2px dashed rgba(212, 168, 67, 0.4); background: rgba(212, 168, 67, 0.04); border-radius: 12px; padding: 2rem; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📂</div>
          <h4 style="margin: 0 0 0.25rem 0; color: #0f172a;">Upload Masterlist Spreadsheet (.xlsx / .csv)</h4>
          <p style="margin: 0 0 1rem 0; font-size: 0.85rem; color: #64748b;">Complies with CSC Plantilla & DBM Salary Grade format</p>
          <input type="file" id="modal-import-file" accept=".csv,.xlsx" style="display: none;" />
          <button type="button" class="btn btn--outline btn--sm" onclick="document.getElementById('modal-import-file').click()">Select Local File</button>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; border: 1px solid #e2e8f0;">
          <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a;">⚡ Fast Demo Ingestion</div>
          <p style="font-size: 0.8rem; color: #64748b; margin: 0 0 0.75rem 0;">Click below to simulate parsing and staging 3 verified personnel records:</p>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-load-demo-import">
            ＋ Load 3 Sample Faculty & Staff Records
          </button>
        </div>
        <div id="modal-import-status" style="font-size: 0.85rem; color: #16a34a; font-weight: 600; display: none;"></div>
      </div>
    `;

    showModal(
      '↑ Bulk Excel Roster Ingestion',
      modalHtml,
      'Process Roster Batch',
      async () => {
        const sampleRecords = [
          { first_name: 'Engr. Dindo', last_name: 'Bautista', email: 'dbautista@nbsc.edu.ph', department: 'ICS', position_title: 'Assistant Professor II', category: 'TEACHING', employment_status: 'PERMANENT', monthly_salary: 42000, daily_rate: 1909.09 },
          { first_name: 'Dr. Clarice', last_name: 'Montemayor', email: 'cmontemayor@nbsc.edu.ph', department: 'IBM', position_title: 'Associate Professor I', category: 'TEACHING', employment_status: 'PERMANENT', monthly_salary: 51350, daily_rate: 2334.09 },
          { first_name: 'Ronaldo', last_name: 'Macaraeg', email: 'rmacaraeg@nbsc.edu.ph', department: 'FIN', position_title: 'Budget Officer I', category: 'NON_TEACHING', employment_status: 'COS', monthly_salary: 27000, daily_rate: 1227.27 }
        ];

        if (typeof db !== 'undefined' && db.bulkImportEmployees) {
          const res = db.bulkImportEmployees(sampleRecords);
          updateKPIs();
          await fetchEmployees(1);
          showToast(`Bulk ingested ${res.count} personnel records into active roster!`, 'success', 3500);
          return true;
        }
        return true;
      },
      'Cancel'
    );

    setTimeout(() => {
      const btnDemo = document.getElementById('btn-load-demo-import');
      const statusEl = document.getElementById('modal-import-status');
      if (btnDemo && statusEl) {
        btnDemo.addEventListener('click', () => {
          statusEl.style.display = 'block';
          statusEl.textContent = '✓ 3 records parsed and staged for batch ingestion: Engr. Dindo Bautista, Dr. Clarice Montemayor, Ronaldo Macaraeg.';
          showToast('3 demo records staged for ingestion', 'info', 2000);
        });
      }
    }, 100);
  }

  // Initial load
  await fetchEmployees(1);
});
