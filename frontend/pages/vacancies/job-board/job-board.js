/**
 * NBSC PRIME-HRM Intelligence Hub — Public Job Board Logic
 * Enhanced Executive Experience with Clickable Cards & Complete Details Modal
 */

document.addEventListener('DOMContentLoaded', async () => {
  const gridContainer = document.getElementById('job-grid-container');
  const emptyStateContainer = document.getElementById('job-empty-state');
  const inputSearch = document.getElementById('input-search-jobs');
  const selectDept = document.getElementById('select-dept-filter');
  const selectSort = document.getElementById('select-sort-order');
  const tabs = document.querySelectorAll('.job-tab');
  const resultsSummary = document.getElementById('job-results-summary');
  const paginationContainer = document.getElementById('job-pagination-container');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const btnMobileFilterToggle = document.getElementById('btn-mobile-filter-toggle');
  const filtersCollapsible = document.getElementById('job-filters-collapsible');
  const mobileFilterCount = document.getElementById('mobile-filter-count');

  const countAll = document.getElementById('count-all');
  const countTeaching = document.getElementById('count-teaching');
  const countNonTeaching = document.getElementById('count-non-teaching');

  const statTotal = document.getElementById('stat-total-vacancies');
  const statStreams = document.getElementById('stat-streams');
  const statUnits = document.getElementById('stat-units');

  // Modal Elements
  const modalBackdrop = document.getElementById('job-modal-backdrop');
  const modalTitle = document.getElementById('modal-job-title');
  const modalDept = document.getElementById('modal-job-dept');
  const modalTags = document.getElementById('modal-job-tags');
  const modalBody = document.getElementById('modal-job-body');
  const modalApplyBtn = document.getElementById('modal-apply-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalFooterCloseBtn = document.getElementById('modal-footer-close-btn');

  // Mobile Navigation Drawer Toggle
  const navToggle = document.getElementById('nav-toggle-btn');
  const navLinks = document.getElementById('public-nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Mobile Refine Filters Collapsible Toggle
  if (btnMobileFilterToggle && filtersCollapsible) {
    btnMobileFilterToggle.addEventListener('click', () => {
      const isOpen = filtersCollapsible.classList.toggle('is-open');
      btnMobileFilterToggle.classList.toggle('is-active', isOpen);
      btnMobileFilterToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  let activeCategory = '';
  let allVacancies = [];
  let currentPage = 1;
  const pageSize = 8;

  // Populate Department filter options safely
  if (selectDept && typeof DEPARTMENTS !== 'undefined') {
    DEPARTMENTS.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.code;
      opt.textContent = `${dept.code} — ${dept.name}`;
      selectDept.appendChild(opt);
    });
  }

  /**
   * Fetches public job postings from backend or mock fallback.
   */
  async function fetchJobBoard() {
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0; color: #64748b;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #d4a843; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem;"></div>
          <p style="font-weight: 600; font-size: 1rem; color: #0f1b2d;">Retrieving active career opportunities...</p>
        </div>
      `;
    }

    try {
      const res = await apiGet('/vacancies/public/');
      if (res && res.success && res.data) {
        allVacancies = res.data.vacancies || [];
        updateCountsAndStats();
        filterAndRender();
      } else {
        // Fallback to local DB if available
        if (typeof DB !== 'undefined' && DB.vacancies) {
          allVacancies = DB.vacancies.filter(v => v.status === 'PUBLISHED' || !v.status);
          updateCountsAndStats();
          filterAndRender();
        } else {
          showEmptyState('Unable to Load Openings', 'Unable to retrieve career vacancies at this moment. Please check back shortly.');
        }
      }
    } catch (err) {
      // Graceful fallback to local DB if network fails
      if (typeof DB !== 'undefined' && DB.vacancies) {
        allVacancies = DB.vacancies.filter(v => v.status === 'PUBLISHED' || !v.status);
        updateCountsAndStats();
        filterAndRender();
      } else {
        showEmptyState('Connection Offline', 'Unable to connect to NBSC Career Portal. Please refresh the page.');
      }
    }
  }

  /**
   * Updates category tab counters dynamically based on active search & unit filters,
   * while keeping institutional highlights reflecting total vacancies.
   */
  function updateCountsAndStats() {
    const searchTerm = inputSearch ? inputSearch.value.trim().toLowerCase() : '';
    const deptCode = selectDept ? selectDept.value : '';

    // Calculate dynamic counts matching active search and department (category independent)
    const matchingVacancies = allVacancies.filter(v => {
      const matchDept = !deptCode || v.department === deptCode;
      const matchSearch = !searchTerm ||
        (v.title && v.title.toLowerCase().includes(searchTerm)) ||
        (v.description && v.description.toLowerCase().includes(searchTerm)) ||
        (v.education && v.education.toLowerCase().includes(searchTerm)) ||
        (v.eligibility && v.eligibility.toLowerCase().includes(searchTerm));
      return matchDept && matchSearch;
    });

    const dynamicAll = matchingVacancies.length;
    const dynamicTeaching = matchingVacancies.filter(v => v.category === 'TEACHING').length;
    const dynamicNonTeaching = matchingVacancies.filter(v => v.category === 'NON_TEACHING').length;

    if (countAll) countAll.textContent = dynamicAll;
    if (countTeaching) countTeaching.textContent = dynamicTeaching;
    if (countNonTeaching) countNonTeaching.textContent = dynamicNonTeaching;

    // Overall Institutional Metrics (Unfiltered Database Figures)
    const totalTeaching = allVacancies.filter(v => v.category === 'TEACHING').length;
    const totalNonTeaching = allVacancies.filter(v => v.category === 'NON_TEACHING').length;

    if (statTotal) statTotal.textContent = allVacancies.length;
    if (statStreams) {
      statStreams.innerHTML = `${totalTeaching} Faculty &bull; ${totalNonTeaching} Staff`;
    }
    if (statUnits) {
      const uniqueDepts = new Set(allVacancies.map(v => v.department).filter(Boolean));
      const count = uniqueDepts.size > 0 ? uniqueDepts.size : 5;
      statUnits.textContent = `${count} Colleges & Divisions`;
    }
  }

  /**
   * Filters and sorts vacancies, slices for 8-per-page pagination, and renders.
   * @param {boolean} resetPage - If true, resets to page 1
   */
  function filterAndRender(resetPage = false) {
    if (resetPage) {
      currentPage = 1;
    }

    const searchTerm = inputSearch ? inputSearch.value.trim().toLowerCase() : '';
    const deptCode = selectDept ? selectDept.value : '';
    const sortOrder = selectSort ? selectSort.value : 'newest';

    updateCountsAndStats();

    // Toggle clear search button
    if (btnClearSearch) {
      if (searchTerm) {
        btnClearSearch.classList.remove('d-none');
      } else {
        btnClearSearch.classList.add('d-none');
      }
    }

    // Toggle reset all filters button
    if (btnResetFilters) {
      const hasActiveFilters = Boolean(searchTerm || deptCode || activeCategory || (sortOrder && sortOrder !== 'newest'));
      if (hasActiveFilters) {
        btnResetFilters.classList.remove('d-none');
      } else {
        btnResetFilters.classList.add('d-none');
      }
    }

    // Update mobile filter toggle badge count
    if (mobileFilterCount && btnMobileFilterToggle) {
      let activeRefineCount = 0;
      if (deptCode) activeRefineCount++;
      if (sortOrder && sortOrder !== 'newest') activeRefineCount++;

      if (activeRefineCount > 0) {
        mobileFilterCount.textContent = activeRefineCount;
        mobileFilterCount.classList.remove('d-none');
        btnMobileFilterToggle.classList.add('is-active');
      } else {
        mobileFilterCount.classList.add('d-none');
        if (!filtersCollapsible || !filtersCollapsible.classList.contains('is-open')) {
          btnMobileFilterToggle.classList.remove('is-active');
        }
      }
    }

    let filtered = allVacancies.filter(v => {
      const matchCategory = !activeCategory || v.category === activeCategory;
      const matchDept = !deptCode || v.department === deptCode;
      const matchSearch = !searchTerm ||
        (v.title && v.title.toLowerCase().includes(searchTerm)) ||
        (v.description && v.description.toLowerCase().includes(searchTerm)) ||
        (v.education && v.education.toLowerCase().includes(searchTerm)) ||
        (v.eligibility && v.eligibility.toLowerCase().includes(searchTerm));

      return matchCategory && matchDept && matchSearch;
    });

    // Apply sorting
    if (sortOrder === 'sg-desc') {
      filtered.sort((a, b) => (Number(b.salary_grade) || 0) - (Number(a.salary_grade) || 0));
    } else if (sortOrder === 'deadline-asc') {
      filtered.sort((a, b) => new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31'));
    } else if (sortOrder === 'title-asc') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortOrder === 'newest') {
      filtered.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    // Slice for 8 items per page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pagedVacancies = filtered.slice(startIndex, endIndex);

    renderGrid(pagedVacancies, totalItems, startIndex, endIndex);
    renderPagination(totalItems, totalPages);
  }

  /**
   * Renders vacancy cards into the grid container.
   * @param {Array<Object>} vacancies
   * @param {number} totalItems
   * @param {number} startIndex
   * @param {number} endIndex
   */
  function renderGrid(vacancies, totalItems = 0, startIndex = 0, endIndex = 0) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    // Update contextual results summary label
    if (resultsSummary) {
      if (totalItems === 0) {
        resultsSummary.innerHTML = `Showing <strong>0</strong> active opportunities`;
      } else if (totalItems <= pageSize) {
        resultsSummary.innerHTML = `Showing <strong>${totalItems}</strong> active ${totalItems === 1 ? 'opportunity' : 'opportunities'}`;
      } else {
        resultsSummary.innerHTML = `Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalItems}</strong> active opportunities`;
      }
    }

    if (!vacancies || vacancies.length === 0) {
      showEmptyState(
        'No Matching Positions Found',
        'No career opportunities match your specific search parameters or selected filters. Try broadening your criteria or resetting filters.'
      );
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    if (emptyStateContainer) {
      emptyStateContainer.classList.add('d-none');
      emptyStateContainer.innerHTML = '';
    }

    vacancies.forEach(v => {
      const card = document.createElement('article');
      const isTeaching = v.category === 'TEACHING';
      card.className = `job-card ${isTeaching ? 'job-card--teaching' : 'job-card--non-teaching'}`;
      card.setAttribute('data-vacancy-id', v.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('title', 'Click to view complete qualification standards & details');

      const categoryBadge = isTeaching
        ? '<span class="job-badge job-badge--teaching">Faculty</span>'
        : '<span class="job-badge job-badge--non-teaching">Staff</span>';

      const monthlySalary = typeof formatCurrency === 'function' 
        ? formatCurrency(v.monthly_salary || 29165)
        : `₱${(v.monthly_salary || 29165).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

      const deadlineText = v.deadline 
        ? (typeof formatDate === 'function' ? formatDate(v.deadline) : v.deadline)
        : 'Open Continuous Recruitment';

      const plantillaText = v.employment_status || 'Permanent (Plantilla)';

      // Cleaned compensation box: SG badge + Monthly Salary + / month (never wraps awkwardly)
      card.innerHTML = `
        <div class="job-card__header">
          <h2 class="job-card__title">${escapeHtml(v.title || 'Untitled Opening')}</h2>
          ${categoryBadge}
        </div>

        <div class="job-card__dept">
          <span class="job-card__dept-name">${escapeHtml(v.department || 'NBSC')}</span>
          <span>&bull;</span>
          <span class="job-card__plantilla-chip">${escapeHtml(plantillaText)}</span>
        </div>

        <div class="job-card__compensation">
          <div class="job-card__comp-main">
            <span class="job-card__sg-badge">SG ${v.salary_grade || 12}</span>
            <span class="job-card__salary">${monthlySalary}</span>
            <span class="job-card__salary-period">/ month</span>
          </div>
          <span class="job-card__slots">${v.slots || 1} Open Slot(s)</span>
        </div>

        <div class="job-card__qs">
          <div class="job-card__qs-item">
            <span class="job-card__qs-bullet">&#9679;</span>
            <span><strong class="job-card__qs-label">Education:</strong> ${escapeHtml(v.qualification_standards?.education || v.education || "Bachelor's Degree relevant to the job")}</span>
          </div>
          <div class="job-card__qs-item">
            <span class="job-card__qs-bullet">&#9679;</span>
            <span><strong class="job-card__qs-label">Experience:</strong> ${escapeHtml(v.qualification_standards?.experience || v.experience || 'None Required')}</span>
          </div>
          <div class="job-card__qs-item">
            <span class="job-card__qs-bullet">&#9679;</span>
            <span><strong class="job-card__qs-label">Eligibility:</strong> ${escapeHtml(v.qualification_standards?.eligibility || v.eligibility || 'RA 1080 / CS Professional')}</span>
          </div>
        </div>

        <div class="job-card__footer">
          <span class="job-card__deadline">
            <span class="job-card__deadline-icon">&#128197;</span>
            <span>Deadline: ${deadlineText}</span>
          </span>
          <div class="job-card__actions">
            <button type="button" class="job-card__view-btn" data-vacancy-id="${v.id}">Details &rarr;</button>
            <a href="../../applicants/apply/apply.html?vacancy_id=${v.id}" class="job-card__apply-btn">
              <span>Apply Now</span>
              <span>&rarr;</span>
            </a>
          </div>
        </div>
      `;

      // Click card to open full details modal
      card.addEventListener('click', (e) => {
        // If clicking directly on the Apply button, let the link navigate
        if (e.target.closest('.job-card__apply-btn')) return;
        openVacancyModal(v.id);
      });

      // Keyboard accessibility (Enter or Space to view details)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.job-card__apply-btn')) return;
          e.preventDefault();
          openVacancyModal(v.id);
        }
      });

      gridContainer.appendChild(card);
    });
  }

  /**
   * Opens the Job Details Modal with complete civil service qualification standards & requirements.
   * @param {string} vacancyId
   */
  function openVacancyModal(vacancyId) {
    const v = allVacancies.find(item => item.id === vacancyId);
    if (!v || !modalBackdrop) return;

    const isTeaching = v.category === 'TEACHING';
    const categoryBadge = isTeaching
      ? '<span class="job-badge job-badge--teaching">Faculty / Teaching</span>'
      : '<span class="job-badge job-badge--non-teaching">Staff / Administrative</span>';

    const plantillaBadge = `<span class="job-card__plantilla-chip">${escapeHtml(v.employment_status || 'Permanent (Plantilla)')}</span>`;

    const monthlySalary = typeof formatCurrency === 'function' 
      ? formatCurrency(v.monthly_salary || 29165)
      : `₱${(v.monthly_salary || 29165).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    const deadlineText = v.deadline 
      ? (typeof formatDate === 'function' ? formatDate(v.deadline) : v.deadline)
      : 'Open Continuous Recruitment';

    // Populate Modal Header
    if (modalTags) modalTags.innerHTML = `${categoryBadge} ${plantillaBadge}`;
    if (modalTitle) modalTitle.textContent = v.title || 'Job Opening Details';
    if (modalDept) modalDept.textContent = `${v.department || 'Northern Bukidnon State College'} • Plantilla Position`;
    if (modalApplyBtn) modalApplyBtn.href = `../../applicants/apply/apply.html?vacancy_id=${v.id}`;

    // Populate Modal Body with Full Specifications
    if (modalBody) {
      modalBody.innerHTML = `
        <!-- 4-Pill Overview Highlights -->
        <div class="job-modal__spec-grid">
          <div class="job-modal__spec-card">
            <div class="job-modal__spec-label">Compensation</div>
            <div class="job-modal__spec-val job-modal__spec-val--green">${monthlySalary}/mo</div>
          </div>
          <div class="job-modal__spec-card">
            <div class="job-modal__spec-label">Salary Grade</div>
            <div class="job-modal__spec-val">Grade ${v.salary_grade || 12}</div>
          </div>
          <div class="job-modal__spec-card">
            <div class="job-modal__spec-label">Available Slots</div>
            <div class="job-modal__spec-val">${v.slots || 1} Open Slot(s)</div>
          </div>
          <div class="job-modal__spec-card">
            <div class="job-modal__spec-label">Filing Deadline</div>
            <div class="job-modal__spec-val">${deadlineText}</div>
          </div>
        </div>

        <!-- Position Overview -->
        <div>
          <div class="job-modal__sec-title">&#128196; Position Overview &amp; Duties</div>
          <p>${escapeHtml(v.description || 'This position is part of Northern Bukidnon State College merit recruitment. The appointee will perform duties in accordance with the college charter, CSC civil service rules, and institutional development goals.')}</p>
        </div>

        <!-- CSC Qualification Standards (QS) -->
        <div>
          <div class="job-modal__sec-title">&#127891; Civil Service Qualification Standards (QS)</div>
          <div class="job-modal__qs-list">
            <div class="job-modal__qs-row">
              <span class="job-modal__qs-key">Education:</span>
              <span class="job-modal__qs-desc">${escapeHtml(v.qualification_standards?.education || v.education || "Bachelor's Degree relevant to the job")}</span>
            </div>
            <div class="job-modal__qs-row">
              <span class="job-modal__qs-key">Experience:</span>
              <span class="job-modal__qs-desc">${escapeHtml(v.qualification_standards?.experience || v.experience || 'None Required')}</span>
            </div>
            <div class="job-modal__qs-row">
              <span class="job-modal__qs-key">Training:</span>
              <span class="job-modal__qs-desc">${escapeHtml(v.qualification_standards?.training || 'None Required')}</span>
            </div>
            <div class="job-modal__qs-row">
              <span class="job-modal__qs-key">Eligibility:</span>
              <span class="job-modal__qs-desc">${escapeHtml(v.qualification_standards?.eligibility || v.eligibility || 'RA 1080 / Career Service Professional')}</span>
            </div>
          </div>
        </div>

        <!-- Submission Checklist -->
        <div>
          <div class="job-modal__sec-title">&#128203; Required Application Documents (CSC PRIME-HRM)</div>
          <ul class="job-modal__req-list">
            <li class="job-modal__req-item">
              <span>&#10003;</span>
              <span>Fully accomplished &amp; signed <strong>Personal Data Sheet (CSC Form 212 Revised 2017)</strong> with Work Experience Sheet.</span>
            </li>
            <li class="job-modal__req-item">
              <span>&#10003;</span>
              <span>Authenticated copy of <strong>Certificate of Eligibility / Board Rating / PRC License</strong>.</span>
            </li>
            <li class="job-modal__req-item">
              <span>&#10003;</span>
              <span>Certified true copy of <strong>Transcript of Records (TOR) &amp; College Diploma</strong>.</span>
            </li>
            <li class="job-modal__req-item">
              <span>&#10003;</span>
              <span>Performance rating in the last rating period (for government employees, if applicable).</span>
            </li>
            <li class="job-modal__req-item">
              <span>&#10003;</span>
              <span>Certificates of relevant trainings, seminars, and specialized skill credentials.</span>
            </li>
          </ul>
        </div>
      `;
    }

    // Show modal and prevent body background scroll
    modalBackdrop.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the Job Details Modal.
   */
  function closeVacancyModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.add('d-none');
    document.body.style.overflow = '';
  }

  // Modal Close Event Listeners
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeVacancyModal);
  if (modalFooterCloseBtn) modalFooterCloseBtn.addEventListener('click', closeVacancyModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeVacancyModal();
    });
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && !modalBackdrop.classList.contains('d-none')) {
      closeVacancyModal();
    }
  });

  /**
   * Helper to display an attractive empty state box
   */
  function showEmptyState(title, message) {
    if (emptyStateContainer) {
      emptyStateContainer.classList.remove('d-none');
      emptyStateContainer.innerHTML = `
        <div class="job-empty-box">
          <div class="job-empty-box__icon">&#128269;</div>
          <h3 class="job-empty-box__title">${escapeHtml(title)}</h3>
          <p class="job-empty-box__text">${escapeHtml(message)}</p>
        </div>
      `;
    }
  }

  /**
   * Builds numbered pagination controls.
   * @param {number} totalItems
   * @param {number} totalPages
   */
  function renderPagination(totalItems, totalPages) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    if (totalItems <= pageSize) {
      // Only 1 page — show page info but no navigation buttons
      const info = document.createElement('div');
      info.className = 'job-pagination-info';
      info.textContent = `Page 1 of 1 (${totalItems} total ${totalItems === 1 ? 'opportunity' : 'opportunities'})`;
      paginationContainer.appendChild(info);
      return;
    }

    const nav = document.createElement('div');
    nav.className = 'job-pagination';

    // Previous Button
    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'job-page-btn job-page-btn--nav';
    btnPrev.innerHTML = `&larr; Prev`;
    btnPrev.disabled = (currentPage === 1);
    btnPrev.setAttribute('aria-label', 'Go to previous page');
    btnPrev.addEventListener('click', () => {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    });
    nav.appendChild(btnPrev);

    // Numbered Buttons
    for (let p = 1; p <= totalPages; p++) {
      const btnPage = document.createElement('button');
      btnPage.type = 'button';
      btnPage.className = `job-page-btn ${p === currentPage ? 'job-page-btn--active' : ''}`;
      btnPage.textContent = p;
      btnPage.setAttribute('aria-label', `Page ${p}`);
      if (p === currentPage) {
        btnPage.setAttribute('aria-current', 'page');
      }
      btnPage.addEventListener('click', () => {
        if (p !== currentPage) {
          goToPage(p);
        }
      });
      nav.appendChild(btnPage);
    }

    // Next Button
    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'job-page-btn job-page-btn--nav';
    btnNext.innerHTML = `Next &rarr;`;
    btnNext.disabled = (currentPage === totalPages);
    btnNext.setAttribute('aria-label', 'Go to next page');
    btnNext.addEventListener('click', () => {
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    });
    nav.appendChild(btnNext);

    paginationContainer.appendChild(nav);

    // Contextual Page Range Indicator
    const info = document.createElement('div');
    info.className = 'job-pagination-info';
    info.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} total opportunities)`;
    paginationContainer.appendChild(info);
  }

  /**
   * Switches to target page and smoothly scrolls back to the top of the grid.
   * @param {number} pageNumber
   */
  function goToPage(pageNumber) {
    currentPage = pageNumber;
    filterAndRender(false);

    // Smooth scroll to top of job grid (controls bar top)
    const target = document.querySelector('.job-controls-bar') || gridContainer;
    if (target) {
      const targetPos = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({
        top: Math.max(0, targetPos),
        behavior: 'smooth'
      });
    }
  }

  // Category Tabs Click Handling
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('job-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('job-tab--active');
      tab.setAttribute('aria-selected', 'true');
      activeCategory = tab.dataset.category || '';
      filterAndRender(true);
    });
  });

  // Search Input Handling with Debounce
  if (inputSearch) {
    const handleInput = typeof debounce === 'function' 
      ? debounce(() => filterAndRender(true), 250) 
      : () => filterAndRender(true);
    inputSearch.addEventListener('input', handleInput);
  }

  // Clear Search Button
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (inputSearch) {
        inputSearch.value = '';
        inputSearch.focus();
      }
      filterAndRender(true);
    });
  }

  // Unit and Sort Dropdown Listeners
  if (selectDept) {
    selectDept.addEventListener('change', () => filterAndRender(true));
  }

  if (selectSort) {
    selectSort.addEventListener('change', () => filterAndRender(true));
  }

  // Reset All Filters Button
  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      if (inputSearch) inputSearch.value = '';
      if (selectDept) selectDept.value = '';
      if (selectSort) selectSort.value = 'newest';
      activeCategory = '';

      tabs.forEach(t => {
        const isAll = !t.dataset.category;
        t.classList.toggle('job-tab--active', isAll);
        t.setAttribute('aria-selected', isAll ? 'true' : 'false');
      });

      filterAndRender(true);
    });
  }

  // Floating Back-to-Top Institutional Button
  const btnBackToTop = document.getElementById('btn-back-to-top');
  if (btnBackToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 280) {
        btnBackToTop.classList.add('is-visible');
      } else {
        btnBackToTop.classList.remove('is-visible');
      }
    });

    btnBackToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Initial Fetch
  fetchJobBoard();
});
