/**
 * NBSC Candidate Portal — Main Dashboard Logic
 * Highlights Open Positions with Exact Digit Salaries, Closing Dates, and Applicant QS Match Matrix
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── 1. Authenticated Profile Setup ─────────────────────────────
  const user = typeof getUser === 'function' ? getUser() : null;
  const applicantName = user?.name || user?.email || 'Carlo Mendoza';
  const firstName = applicantName.split(' ')[0] || 'Carlo';
  const userInitials = getInitials(applicantName);
  const applicantId = user?.applicant_id || (user?.id ? `APP-2026-${String(user.id).replace(/\D/g, '').padStart(5, '0')}` : 'APP-2026-00417');

  const navAvatar = document.getElementById('nav-avatar');
  const navUsername = document.getElementById('nav-username');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName = document.getElementById('sidebar-name');
  const sidebarId = document.getElementById('sidebar-id');
  const welcomeHeading = document.getElementById('welcome-heading');

  const mobileAvatar = document.getElementById('mobile-avatar');
  const mobileUsername = document.getElementById('mobile-username');

  if (navAvatar) navAvatar.textContent = userInitials;
  if (navUsername) navUsername.textContent = applicantName;
  if (mobileAvatar) mobileAvatar.textContent = userInitials;
  if (mobileUsername) mobileUsername.textContent = applicantName;
  if (sidebarAvatar) sidebarAvatar.textContent = userInitials;
  if (sidebarName) sidebarName.textContent = applicantName;
  if (sidebarId) sidebarId.innerHTML = `Applicant ID &middot; ${escapeHtml(applicantId)}`;
  if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${firstName}`;

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

  // ── 2. Candidate Credentials & Qualification Standards (QS) Matrix ──
  const CANDIDATE_PROFILE = {
    degree: 'BS Computer Science',
    field: 'Computing & Information Technology',
    experience_years: 2,
    training_hours: 16,
    eligibility: 'Career Service Professional (RA 1080 / CSC Level 2)'
  };

  // ── 3. Highlighted Vacancies with Digit Salaries & Deadlines ────
  const HIGHLIGHTED_VACANCIES = [
    {
      id: 'vac-001',
      title: 'Instructor I (Computer Studies)',
      department: 'Institute of Computer Studies (ICS)',
      salary_grade: 15,
      monthly_salary: 36619.00,
      daily_rate: 1664.50,
      deadline_date: 'Sep 30, 2026',
      days_left: 23,
      qs_match_pct: 100,
      qs_badge_type: 'perfect',
      qs_badge_label: '100% Match · Top Academic Fit',
      qs_checklist: [
        { label: 'Education', req: 'BS Computer Science / IT', match: true, text: 'Candidate: BS Computer Science (MSU-IIT)' },
        { label: 'Experience', req: '1 Year Tech / Teaching', match: true, text: 'Candidate: 2 Years Experience' },
        { label: 'Training', req: '8 Hours Computing / Pedagogy', match: true, text: 'Candidate: 16 Hours Training' },
        { label: 'Eligibility', req: 'CS Professional / RA 1080', match: true, text: 'Candidate: CS Professional Certified' }
      ]
    },
    {
      id: 'vac-008',
      title: 'Administrative Assistant III',
      department: 'Office of the President',
      salary_grade: 9,
      monthly_salary: 21211.00,
      daily_rate: 964.14,
      deadline_date: 'Sep 18, 2026',
      days_left: 11,
      qs_match_pct: 90,
      qs_badge_type: 'high',
      qs_badge_label: '90% Match · Qualified',
      qs_checklist: [
        { label: 'Education', req: "Completion of 2 yrs College / Bachelor's", match: true, text: 'Candidate: Bachelor Degree Holder' },
        { label: 'Experience', req: '1 Year Relevant Administrative Experience', match: true, text: 'Candidate: 2 Years Experience' },
        { label: 'Training', req: '4 Hours Relevant Office Training', match: true, text: 'Candidate: 16 Hours Tech Training' },
        { label: 'Eligibility', req: 'Career Service Sub-Prof / Professional', match: true, text: 'Candidate: CS Professional' }
      ]
    },
    {
      id: 'vac-005',
      title: 'Accountant II',
      department: 'Finance & Accounting Division',
      salary_grade: 15,
      monthly_salary: 36619.00,
      daily_rate: 1664.50,
      deadline_date: 'Sep 25, 2026',
      days_left: 18,
      qs_match_pct: 65,
      qs_badge_type: 'partial',
      qs_badge_label: '65% Match · License Required',
      qs_checklist: [
        { label: 'Education', req: "Bachelor's degree in Accountancy", match: false, text: 'Candidate: BS Computer Science' },
        { label: 'Experience', req: '2 Years Relevant Experience', match: true, text: 'Candidate: 2 Years Tech Experience' },
        { label: 'Training', req: '8 Hours Relevant Accounting Training', match: true, text: 'Candidate: 16 Hours Training' },
        { label: 'Eligibility', req: 'RA 1080 (Certified Public Accountant)', match: false, text: 'Specialized Licensure Required' }
      ]
    }
  ];

  // ── 4. Render Highlights Grid ──────────────────────────────────
  const highlightsGrid = document.getElementById('highlights-grid');
  if (highlightsGrid) {
    highlightsGrid.innerHTML = '';
    HIGHLIGHTED_VACANCIES.forEach(item => {
      const card = document.createElement('div');
      card.className = 'highlight-card';

      // Format Digit Salary with commas and currency symbol
      const formattedSalary = `₱${item.monthly_salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo`;

      // QS Checklist HTML
      const checklistHtml = item.qs_checklist.map(c => `
        <div class="matrix-mini-item">
          <span>${c.label}:</span>
          <span class="${c.match ? 'matrix-mini-check' : 'matrix-mini-warn'}">
            ${c.match ? '✓ Meets Standard' : '⚠ ' + c.req}
          </span>
        </div>
      `).join('');

      card.innerHTML = `
        <div>
          <div class="highlight-card__top">
            <span class="qs-match-badge qs-match-badge--${item.qs_badge_type}">
              ${item.qs_badge_label}
            </span>
            <span class="deadline-pill">
              Closes <b>${escapeHtml(item.deadline_date)}</b> (${item.days_left}d left)
            </span>
          </div>

          <h3 class="highlight-card__title">${escapeHtml(item.title)}</h3>
          <div class="highlight-card__dept">${escapeHtml(item.department)}</div>

          <!-- Numeric Digit Salary Block -->
          <div class="salary-block">
            <div>
              <span class="text-muted font-xs d-block">Authorized Monthly Compensation:</span>
              <span class="salary-digit">${formattedSalary}</span>
            </div>
            <span class="salary-grade-tag">Salary Grade ${item.salary_grade}</span>
          </div>

          <!-- Applicant QS Match Matrix Mini-Checklist -->
          <div class="matrix-mini-checklist">
            ${checklistHtml}
          </div>
        </div>

        <div class="highlight-card__actions">
          <a href="../open-positions/open-positions.html?highlight=${encodeURIComponent(item.id)}" class="btn-ghost btn--sm">
            View Criteria Matrix &rarr;
          </a>
          <a href="../apply/apply.html?vacancy_id=${encodeURIComponent(item.id)}" class="btn-primary btn--sm">
            Apply Now
          </a>
        </div>
      `;

      highlightsGrid.appendChild(card);
    });
  }

  function getInitials(name) {
    if (!name) return 'CM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
});
