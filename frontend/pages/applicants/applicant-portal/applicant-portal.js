/**
 * NBSC Candidate Portal — Applicant Dashboard Logic
 * Aligned with C:\NBSC PRIME-HRM Intelligence Hub\sample\sample.html
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Authenticated Profile Setup
  const user = typeof getUser === 'function' ? getUser() : null;
  const applicantName = user?.name || user?.email || 'Carlo Mendoza';
  const firstName = applicantName.split(' ')[0] || 'Carlo';
  const userInitials = getInitials(applicantName);
  const applicantId = user?.applicant_id || (user?.id ? `APP-2026-${String(user.id).replace(/\D/g, '').padStart(5, '0')}` : 'APP-2026-00417');

  // Populate Header & Sidebar Identity
  const navAvatar = document.getElementById('nav-avatar');
  const navUsername = document.getElementById('nav-username');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName = document.getElementById('sidebar-name');
  const sidebarId = document.getElementById('sidebar-id');
  const welcomeHeading = document.getElementById('welcome-heading');

  if (navAvatar) navAvatar.textContent = userInitials;
  if (navUsername) navUsername.textContent = applicantName;
  if (sidebarAvatar) sidebarAvatar.textContent = userInitials;
  if (sidebarName) sidebarName.textContent = applicantName;
  if (sidebarId) sidebarId.innerHTML = `Applicant ID &middot; ${escapeHtml(applicantId)}`;
  if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${firstName}`;

  // 2. Navigation Actions
  const btnLogout = document.getElementById('btn-applicant-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof logout === 'function') {
        logout('../../auth/applicant-login/applicant-login.html');
      } else {
        localStorage.removeItem('nbsc_access_token');
        localStorage.removeItem('nbsc_user');
        window.location.href = '../../auth/applicant-login/applicant-login.html';
      }
    });
  }

  const btnBrowseJobs = document.getElementById('btn-browse-jobs');
  const navOpenPositions = document.getElementById('nav-open-positions');
  const scrollToJobs = (e) => {
    e?.preventDefault();
    const jobsSection = document.getElementById('jobs');
    if (jobsSection) {
      jobsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  if (btnBrowseJobs) btnBrowseJobs.addEventListener('click', scrollToJobs);
  if (navOpenPositions) navOpenPositions.addEventListener('click', scrollToJobs);

  // 3. Applications Management
  const appsContainer = document.getElementById('applications-container');
  const emptyPanel = document.getElementById('applications-empty-panel');
  const activeAppsCount = document.getElementById('active-apps-count');
  const welcomeSub = document.getElementById('welcome-sub');

  async function loadMyApplications() {
    let applications = [];

    // Attempt API Fetch
    try {
      if (typeof apiGet === 'function') {
        const res = await apiGet('/applications/my-applications/');
        if (res && res.success && res.data && Array.isArray(res.data.applications)) {
          applications = res.data.applications;
        }
      }
    } catch (err) {
      // Fallback: Check local Database
      if (typeof db !== 'undefined' && db.getTable) {
        const allApps = db.getTable('applications') || [];
        if (user && user.id) {
          applications = allApps.filter(a => a.applicant_id === user.id || a.user_id === user.id);
        }
      }
    }

    renderApplications(applications);
  }

  function renderApplications(applications) {
    if (!appsContainer || !emptyPanel) return;

    if (!applications || applications.length === 0) {
      appsContainer.classList.add('d-none');
      appsContainer.innerHTML = '';
      emptyPanel.classList.remove('d-none');
      if (activeAppsCount) activeAppsCount.textContent = '';
      if (welcomeSub) {
        welcomeSub.textContent = "You're registered but haven't applied to a position yet. Submit your first application to move into screening.";
      }
      updatePillarJourney('REGISTERED');
      return;
    }

    // Active applications exist
    emptyPanel.classList.add('d-none');
    appsContainer.classList.remove('d-none');
    appsContainer.innerHTML = '';

    if (activeAppsCount) {
      activeAppsCount.textContent = `${applications.length} position${applications.length > 1 ? 's' : ''}`;
    }
    if (welcomeSub) {
      welcomeSub.textContent = `You have ${applications.length} active application${applications.length > 1 ? 's' : ''} in progress under CSC PRIME-HRM Level 2 review.`;
    }

    const latestApp = applications[0];
    updatePillarJourney(latestApp.stage || 'SCREENING');

    applications.forEach(app => {
      const card = document.createElement('div');
      card.className = 'app-card';
      const docket = app.tracking_number || app.id || 'NBSC-APP-2026';
      const stageLabel = (typeof STAGE_LABELS !== 'undefined' && STAGE_LABELS[app.stage]) ? STAGE_LABELS[app.stage] : (app.stage || 'In Screening');

      card.innerHTML = `
        <div class="app-card__info">
          <span class="app-card__docket">${escapeHtml(docket)}</span>
          <h3 class="app-card__title">${escapeHtml(app.vacancy_title || 'Institutional Faculty / Staff Position')}</h3>
          <div class="app-card__meta">${escapeHtml(app.vacancy_department || 'Northern Bukidnon State College')} &bull; Applied ${escapeHtml(app.created_at || 'August 2026')}</div>
        </div>
        <div class="app-card__actions">
          <span class="app-card__stage-pill">${escapeHtml(stageLabel)}</span>
          <a href="../application-track/application-track.html?tracking=${encodeURIComponent(docket)}" class="btn-ghost">
            Track Status &rarr;
          </a>
        </div>
      `;
      appsContainer.appendChild(card);
    });
  }

  // 4. Update 4-Pillar Recruitment Journey Sidebar
  function updatePillarJourney(stageKey) {
    const p1 = document.getElementById('stage-pillar-1');
    const p2 = document.getElementById('stage-pillar-2');
    const p3 = document.getElementById('stage-pillar-3');
    const p4 = document.getElementById('stage-pillar-4');
    if (!p1 || !p2 || !p3 || !p4) return;

    // Reset all stages
    [p1, p2, p3, p4].forEach(p => p.className = 'stage');

    p1.className = 'stage done';
    p1.querySelector('.dot').innerHTML = '&#10003;';

    if (stageKey === 'REGISTERED' || !stageKey) {
      p2.className = 'stage current';
      p2.querySelector('.dot').textContent = '2';
      p3.querySelector('.dot').textContent = '3';
      p4.querySelector('.dot').textContent = '4';
    } else if (['APPLIED', 'SCREENING', 'QS_PASS', 'QS_FAIL'].includes(stageKey)) {
      p2.className = 'stage current';
      p2.querySelector('.dot').textContent = '2';
      p3.querySelector('.dot').textContent = '3';
      p4.querySelector('.dot').textContent = '4';
    } else if (['DSS_SCORED', 'DEPT_EVAL', 'ASSESSMENT'].includes(stageKey)) {
      p2.className = 'stage done';
      p2.querySelector('.dot').innerHTML = '&#10003;';
      p3.className = 'stage current';
      p3.querySelector('.dot').textContent = '3';
      p4.querySelector('.dot').textContent = '4';
    } else if (['DELIBERATION', 'FINAL_DECISION', 'APPOINTED', 'ASSUMPTION'].includes(stageKey)) {
      p2.className = 'stage done';
      p2.querySelector('.dot').innerHTML = '&#10003;';
      p3.className = 'stage done';
      p3.querySelector('.dot').innerHTML = '&#10003;';
      p4.className = 'stage current';
      p4.querySelector('.dot').textContent = '4';
    }
  }

  // 5. Open Opportunities Loading & Filtering
  const jobList = document.getElementById('jobList');
  const jobsCount = document.getElementById('jobs-count');
  const jobSearch = document.getElementById('jobSearch');
  const chips = document.querySelectorAll('.chip');
  let activeDept = 'all';

  const DEFAULT_JOBS = [
    {
      id: 'vac-005',
      dept: 'fin',
      title: 'Accountant II',
      deptName: 'Finance & Accounting Division',
      sg: 15,
      deadline: 'Sep 25'
    },
    {
      id: 'vac-008',
      dept: 'admin',
      title: 'Administrative Assistant III',
      deptName: 'Office of the President',
      sg: 9,
      deadline: 'Sep 18'
    },
    {
      id: 'vac-007',
      dept: 'ibm',
      title: 'Associate Professor I, Business Administration',
      deptName: 'Institute of Business & Management',
      sg: 15,
      deadline: 'Oct 2'
    }
  ];

  async function loadOpportunities() {
    let vacancies = [];

    // Attempt to load from database or API
    try {
      if (typeof apiGet === 'function') {
        const res = await apiGet('/vacancies/public/');
        if (res && res.success && res.data && Array.isArray(res.data.vacancies) && res.data.vacancies.length > 0) {
          vacancies = res.data.vacancies;
        }
      }
    } catch (err) {
      if (typeof db !== 'undefined' && db.getTable) {
        const dbVacs = db.getTable('vacancies') || [];
        if (dbVacs.length > 0) vacancies = dbVacs;
      }
    }

    renderJobList(vacancies.length > 0 ? vacancies : DEFAULT_JOBS);
  }

  function renderJobList(jobs) {
    if (!jobList) return;
    jobList.innerHTML = '';

    const list = jobs.length > 0 ? jobs : DEFAULT_JOBS;
    if (jobsCount) jobsCount.textContent = `${list.length} positions`;

    list.forEach(job => {
      const row = document.createElement('div');
      row.className = 'job-row';

      // Normalize department code
      let deptCode = 'admin';
      const rawDept = (job.dept || job.department_code || job.department || '').toLowerCase();
      if (rawDept.includes('fin') || rawDept.includes('acc')) {
        deptCode = 'fin';
      } else if (rawDept.includes('ibm') || rawDept.includes('acad') || rawDept.includes('ite') || rawDept.includes('ics') || rawDept.includes('faculty') || rawDept.includes('professor')) {
        deptCode = 'ibm';
      } else {
        deptCode = 'admin';
      }

      const jobTitle = job.title || 'Institutional Vacancy';
      const deptDisplay = job.deptName || job.department || 'Northern Bukidnon State College';
      const sg = job.sg || job.salary_grade || 11;
      const deadline = job.deadline ? formatDeadline(job.deadline) : 'Sep 30';
      const applyUrl = `../apply/apply.html?vacancy_id=${encodeURIComponent(job.id || 'vac-001')}`;

      row.dataset.dept = deptCode;
      row.dataset.title = `${jobTitle.toLowerCase()} ${deptDisplay.toLowerCase()}`;

      row.innerHTML = `
        <div class="job-info">
          <div class="jtitle">${escapeHtml(jobTitle)}</div>
          <div class="jmeta">${escapeHtml(deptDisplay)} <span class="sg">SG ${sg}</span></div>
        </div>
        <div class="job-right">
          <div class="deadline">Closes <b>${escapeHtml(deadline)}</b></div>
          <a href="${applyUrl}" class="btn-ghost">Apply</a>
        </div>
      `;

      jobList.appendChild(row);
    });

    filterJobs();
  }

  function formatDeadline(dl) {
    if (!dl) return 'Sep 30';
    if (typeof dl === 'string' && dl.length <= 8 && dl.includes(' ')) return dl;
    try {
      const d = new Date(dl);
      if (isNaN(d.getTime())) return dl;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dl;
    }
  }

  // 6. Search and Chip Filtering
  function filterJobs() {
    const q = (jobSearch ? jobSearch.value : '').toLowerCase().trim();
    const rows = document.querySelectorAll('.job-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const matchesDept = activeDept === 'all' || row.dataset.dept === activeDept;
      const matchesText = !q || row.dataset.title.includes(q);
      const isVisible = matchesDept && matchesText;
      row.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });

    if (jobsCount) {
      jobsCount.textContent = `${visibleCount} position${visibleCount === 1 ? '' : 's'}`;
    }
  }

  if (jobSearch) {
    jobSearch.addEventListener('input', filterJobs);
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeDept = chip.dataset.dept || 'all';
      filterJobs();
    });
  });

  // Init
  loadMyApplications();
  loadOpportunities();

  // Helper Initials
  function getInitials(name) {
    if (!name) return 'CM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
});
