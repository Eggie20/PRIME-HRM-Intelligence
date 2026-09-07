/**
 * NBSC Candidate Portal — Open Positions Logic
 * Displays all active vacancies with digit salaries, dates, and dynamic QS Matrix match comparison.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. User Profile Setup
  const user = typeof getUser === 'function' ? getUser() : null;
  const applicantName = user?.name || user?.email || 'Carlo Mendoza';
  const userInitials = getInitials(applicantName);
  const applicantId = user?.applicant_id || (user?.id ? `APP-2026-${String(user.id).replace(/\D/g, '').padStart(5, '0')}` : 'APP-2026-00417');

  const navAvatar = document.getElementById('nav-avatar');
  const navUsername = document.getElementById('nav-username');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName = document.getElementById('sidebar-name');
  const sidebarId = document.getElementById('sidebar-id');

  const mobileAvatar = document.getElementById('mobile-avatar');
  const mobileUsername = document.getElementById('mobile-username');

  if (navAvatar) navAvatar.textContent = userInitials;
  if (navUsername) navUsername.textContent = applicantName;
  if (mobileAvatar) mobileAvatar.textContent = userInitials;
  if (mobileUsername) mobileUsername.textContent = applicantName;
  if (sidebarAvatar) sidebarAvatar.textContent = userInitials;
  if (sidebarName) sidebarName.textContent = applicantName;
  if (sidebarId) sidebarId.innerHTML = `Applicant ID &middot; ${escapeHtml(applicantId)}`;

  // Mobile Navigation Drawer Toggle
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const mobileDrawer = document.getElementById('topbar-mobile-drawer');
  if (navToggleBtn && mobileDrawer) {
    navToggleBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('is-open');
      navToggleBtn.classList.toggle('is-active', isOpen);
      navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Sign out buttons (Desktop & Mobile)
  function handleSignOut(e) {
    if (e) e.preventDefault();
    if (confirm('Are you sure you want to sign out of the Candidate Portal?')) {
      if (typeof logout === 'function') {
        logout('../../auth/applicant-login/applicant-login.html');
      } else {
        localStorage.removeItem('nbsc_access_token');
        localStorage.removeItem('nbsc_user');
        window.location.href = '../../auth/applicant-login/applicant-login.html';
      }
    }
  }

  const btnLogout = document.getElementById('btn-applicant-logout');
  if (btnLogout) btnLogout.addEventListener('click', handleSignOut);

  const btnMobileLogout = document.getElementById('btn-mobile-logout');
  if (btnMobileLogout) btnMobileLogout.addEventListener('click', handleSignOut);

  // 2. Candidate Verified Credentials
  const CANDIDATE = {
    degree: 'BS Computer Science',
    field: 'Computing & IT',
    experience_years: 2,
    training_hours: 16,
    eligibility: 'Career Service Professional (RA 1080 / CSC Level 2)'
  };

  // 3. Vacancy Directory Data with Digit Salaries & Qualification Standards
  const VACANCIES_DATA = [
    {
      id: 'vac-001',
      title: 'Instructor I (Computer Studies)',
      department_code: 'acad',
      department: 'Institute of Computer Studies (ICS)',
      category: 'TEACHING',
      salary_grade: 15,
      monthly_salary: 36619.00,
      daily_rate: 1664.50,
      deadline_date: 'Sep 30, 2026',
      days_left: 23,
      qs_match_pct: 100,
      qs_badge_type: 'perfect',
      qs_badge_label: '100% QS Match · Highly Recommended',
      qs_standards: {
        education: 'BS in Computer Science, IT, or related computing field',
        experience: '1 year relevant instructional or industry computing experience',
        training: '8 hours relevant training in computing / higher education pedagogy',
        eligibility: 'RA 1080 / Career Service Professional Eligibility'
      },
      qs_evaluation: [
        { label: 'Education', req: 'BS CS / IT Required', candidate: 'BS Computer Science (MSU-IIT)', pass: true },
        { label: 'Experience', req: '1 Year Tech Exp Required', candidate: '2 Years Industry Exp', pass: true },
        { label: 'Training', req: '8 Hours Pedagogy / Tech', candidate: '16 Hours Completed', pass: true },
        { label: 'Eligibility', req: 'CS Professional / RA 1080', candidate: 'CS Professional Certified', pass: true }
      ]
    },
    {
      id: 'vac-008',
      title: 'Administrative Assistant III',
      department_code: 'admin',
      department: 'Office of the President',
      category: 'NON_TEACHING',
      salary_grade: 9,
      monthly_salary: 21211.00,
      daily_rate: 964.14,
      deadline_date: 'Sep 18, 2026',
      days_left: 11,
      qs_match_pct: 90,
      qs_badge_type: 'high',
      qs_badge_label: '90% QS Match · Qualified',
      qs_standards: {
        education: "Completion of 2 years studies in college or Bachelor's degree",
        experience: '1 year relevant administrative or office management experience',
        training: '4 hours relevant training in records and office systems',
        eligibility: 'Career Service (Sub-Professional / Professional)'
      },
      qs_evaluation: [
        { label: 'Education', req: '2 Yrs College / Degree', candidate: "Bachelor's Degree Holder", pass: true },
        { label: 'Experience', req: '1 Year Office Exp', candidate: '2 Years Experience', pass: true },
        { label: 'Training', req: '4 Hours Office Training', candidate: '16 Hours Tech Training', pass: true },
        { label: 'Eligibility', req: 'CS Sub-Prof / Prof', candidate: 'CS Professional Certified', pass: true }
      ]
    },
    {
      id: 'vac-005',
      title: 'Accountant II',
      department_code: 'fin',
      department: 'Finance & Accounting Division',
      category: 'NON_TEACHING',
      salary_grade: 15,
      monthly_salary: 36619.00,
      daily_rate: 1664.50,
      deadline_date: 'Sep 25, 2026',
      days_left: 18,
      qs_match_pct: 65,
      qs_badge_type: 'partial',
      qs_badge_label: '65% Match · License Required',
      qs_standards: {
        education: "Bachelor's degree in Accountancy",
        experience: '2 years relevant experience in government accounting or auditing',
        training: '8 hours relevant training in COA rules and government budgeting',
        eligibility: 'RA 1080 (Certified Public Accountant)'
      },
      qs_evaluation: [
        { label: 'Education', req: 'BS Accountancy Required', candidate: 'BS Computer Science', pass: false },
        { label: 'Experience', req: '2 Years Relevant Exp', candidate: '2 Years Tech Experience', pass: true },
        { label: 'Training', req: '8 Hours Budget / Accounting', candidate: '16 Hours Training', pass: true },
        { label: 'Eligibility', req: 'RA 1080 (CPA Required)', candidate: 'CS Professional', pass: false }
      ]
    },
    {
      id: 'vac-007',
      title: 'Associate Professor I (Business Administration)',
      department_code: 'acad',
      department: 'Institute of Business & Management',
      category: 'TEACHING',
      salary_grade: 15,
      monthly_salary: 36619.00,
      daily_rate: 1664.50,
      deadline_date: 'Oct 02, 2026',
      days_left: 25,
      qs_match_pct: 70,
      qs_badge_type: 'partial',
      qs_badge_label: '70% Match · Masteral Discipline Check',
      qs_standards: {
        education: "Master's degree in Business Administration or Management",
        experience: '2 years teaching experience in tertiary business programs',
        training: '16 hours relevant training in management education',
        eligibility: 'RA 1080 / CSC Professional'
      },
      qs_evaluation: [
        { label: 'Education', req: 'Masteral in Business Required', candidate: 'BS Computer Science', pass: false },
        { label: 'Experience', req: '2 Years Teaching', candidate: '2 Years Experience', pass: true },
        { label: 'Training', req: '16 Hours Management Training', candidate: '16 Hours Training', pass: true },
        { label: 'Eligibility', req: 'RA 1080 / CS Professional', candidate: 'CS Professional Certified', pass: true }
      ]
    }
  ];

  // 4. Render Vacancies Stack
  const vacanciesStack = document.getElementById('vacancies-stack');
  const positionsCount = document.getElementById('positions-count');
  const jobSearch = document.getElementById('jobSearch');
  const chips = document.querySelectorAll('.chip');
  let activeDept = 'all';
  let onlyTopMatches = false;

  function renderVacancies() {
    if (!vacanciesStack) return;
    vacanciesStack.innerHTML = '';

    const query = (jobSearch ? jobSearch.value : '').toLowerCase().trim();
    let visible = 0;

    VACANCIES_DATA.forEach(v => {
      const matchesDept = activeDept === 'all' || v.department_code === activeDept;
      const matchesText = !query || v.title.toLowerCase().includes(query) || v.department.toLowerCase().includes(query);
      const matchesTop = !onlyTopMatches || v.qs_match_pct >= 90;

      if (matchesDept && matchesText && matchesTop) {
        visible++;
        const card = document.createElement('article');
        card.className = 'vacancy-row-card';

        // Format Numeric Digit Salary
        const formattedSalary = `₱${v.monthly_salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo`;

        // QS Matrix Grid HTML
        const matrixGridHtml = v.qs_evaluation.map(item => `
          <div class="qs-matrix-item">
            <div class="qs-matrix-item__label">${escapeHtml(item.label)}</div>
            <div class="qs-matrix-item__val">${escapeHtml(item.req)}</div>
            <div class="qs-matrix-item__status ${item.pass ? 'qs-matrix-item__status--pass' : 'qs-matrix-item__status--check'}">
              ${item.pass ? '✓ Meets Candidate Profile' : '⚠ Specialty Check'}
            </div>
          </div>
        `).join('');

        card.innerHTML = `
          <div class="vacancy-row-card__top">
            <div class="vacancy-title-group">
              <h3>${escapeHtml(v.title)}</h3>
              <div class="vacancy-dept-meta">${escapeHtml(v.department)} &bull; ${v.category === 'TEACHING' ? 'Academic Plantilla' : 'Administrative Plantilla'}</div>
            </div>
            <div class="vacancy-top-badges">
              <span class="qs-badge qs-badge--${v.qs_badge_type}">
                ${escapeHtml(v.qs_badge_label)}
              </span>
            </div>
          </div>

          <!-- Numeric Salary and Date Strip -->
          <div class="vacancy-meta-strip">
            <div class="salary-group">
              <span class="text-muted font-xs">Monthly Rate:</span>
              <span class="digit-salary">${formattedSalary}</span>
              <span class="salary-grade-pill">SG ${v.salary_grade}</span>
            </div>
            <div class="deadline-group">
              Application Deadline: <b>${escapeHtml(v.deadline_date)}</b> (${v.days_left} days remaining)
            </div>
          </div>

          <!-- Qualification Standards (QS) Comparison Matrix -->
          <div class="qs-matrix-box">
            <div class="qs-matrix-box__title">
              <span>Qualification Standards (QS) Candidate Profile Matrix</span>
              <span>Overall Match: <strong>${v.qs_match_pct}%</strong></span>
            </div>
            <div class="qs-matrix-grid">
              ${matrixGridHtml}
            </div>
          </div>

          <div class="vacancy-actions">
            <span class="font-xs text-muted">Protected under CSC PRIME-HRM Level 2 Merit Standards</span>
            <a href="../apply/apply.html?vacancy_id=${encodeURIComponent(v.id)}" class="btn-primary">
              Apply for Position &rarr;
            </a>
          </div>
        `;

        vacanciesStack.appendChild(card);
      }
    });

    if (positionsCount) {
      positionsCount.textContent = `${visible} position${visible === 1 ? '' : 's'} available`;
    }
  }

  // Filter Listeners
  if (jobSearch) {
    jobSearch.addEventListener('input', renderVacancies);
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.id === 'btn-filter-top-match') {
        onlyTopMatches = !onlyTopMatches;
        chip.classList.toggle('active', onlyTopMatches);
        renderVacancies();
        return;
      }

      chips.forEach(c => {
        if (c.id !== 'btn-filter-top-match') c.classList.remove('active');
      });
      chip.classList.add('active');
      activeDept = chip.dataset.dept || 'all';
      renderVacancies();
    });
  });

  renderVacancies();

  function getInitials(name) {
    if (!name) return 'CM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
});
