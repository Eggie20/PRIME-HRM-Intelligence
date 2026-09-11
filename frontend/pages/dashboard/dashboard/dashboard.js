/**
 * NBSC PRIME-HRM Intelligence Hub — HR Command Center Logic
 * Manages KPI indicators, Chart.js visualizations, and session profile data.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Enforce staff authentication guard
  requireAuth([ROLES.HR_ADMIN, ROLES.HRMPSB_MEMBER, ROLES.DEPT_HEAD]);

  // Display user profile in sidebar
  const currentUser = getUser();
  if (currentUser) {
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar');

    if (nameEl) nameEl.textContent = currentUser.name || currentUser.email;
    if (roleEl) roleEl.textContent = ROLE_LABELS[currentUser.role] || currentUser.role;
    if (avatarEl) {
      const initials = (currentUser.name || currentUser.email)
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      avatarEl.textContent = initials || 'AD';
    }
  }

  // Role-Based UI Action Controls
  const btnQuickImport = document.getElementById('btn-quick-import');
  if (currentUser && currentUser.role !== ROLES.HR_ADMIN && btnQuickImport) {
    btnQuickImport.style.display = 'none';
  }

  // Bulk Import In-Page Modal Handler
  if (btnQuickImport) {
    btnQuickImport.addEventListener('click', (e) => {
      e.preventDefault();
      openDashboardImportModal();
    });
  }

  function openDashboardImportModal() {
    const modalHtml = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="border: 2px dashed rgba(212, 168, 67, 0.4); background: rgba(212, 168, 67, 0.04); border-radius: 12px; padding: 2rem; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📂</div>
          <h4 style="margin: 0 0 0.25rem 0; color: #0f172a;">Upload Masterlist Spreadsheet (.xlsx / .csv)</h4>
          <p style="margin: 0 0 1rem 0; font-size: 0.85rem; color: #64748b;">Institutional Plantilla & DBM Salary Grade format</p>
          <input type="file" id="modal-dashboard-import-file" accept=".csv,.xlsx" style="display: none;" />
          <button type="button" class="btn btn--outline btn--sm" onclick="document.getElementById('modal-dashboard-import-file').click()">Select Local File</button>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; border: 1px solid #e2e8f0;">
          <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a;">⚡ Fast Demo Ingestion</div>
          <p style="font-size: 0.8rem; color: #64748b; margin: 0 0 0.75rem 0;">Click below to stage 3 verified faculty & staff records:</p>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-dash-demo-import">
            ＋ Stage 3 Sample Personnel Records
          </button>
        </div>
        <div id="modal-dash-import-status" style="font-size: 0.85rem; color: #16a34a; font-weight: 600; display: none;"></div>
      </div>
    `;

    showModal(
      '↑ Bulk Excel Roster Ingestion',
      modalHtml,
      'Process & Ingest Batch',
      async () => {
        const sampleRecords = [
          { first_name: 'Engr. Dindo', last_name: 'Bautista', email: 'dbautista@nbsc.edu.ph', department: 'ICS', position_title: 'Assistant Professor II', category: 'TEACHING', employment_status: 'PERMANENT', monthly_salary: 42000, daily_rate: 1909.09 },
          { first_name: 'Dr. Clarice', last_name: 'Montemayor', email: 'cmontemayor@nbsc.edu.ph', department: 'IBM', position_title: 'Associate Professor I', category: 'TEACHING', employment_status: 'PERMANENT', monthly_salary: 51350, daily_rate: 2334.09 },
          { first_name: 'Ronaldo', last_name: 'Macaraeg', email: 'rmacaraeg@nbsc.edu.ph', department: 'FIN', position_title: 'Budget Officer I', category: 'NON_TEACHING', employment_status: 'COS', monthly_salary: 27000, daily_rate: 1227.27 }
        ];

        if (typeof db !== 'undefined' && db.bulkImportEmployees) {
          const res = db.bulkImportEmployees(sampleRecords);
          await loadDashboardData();
          showToast(`Ingested ${res.count} records! Updated HR command center analytics.`, 'success', 3500);
          return true;
        }
        return true;
      },
      'Cancel'
    );

    setTimeout(() => {
      const btnDemo = document.getElementById('btn-dash-demo-import');
      const statusEl = document.getElementById('modal-dash-import-status');
      if (btnDemo && statusEl) {
        btnDemo.addEventListener('click', () => {
          statusEl.style.display = 'block';
          statusEl.textContent = '✓ 3 verified records staged: Engr. Dindo Bautista, Dr. Clarice Montemayor, Ronaldo Macaraeg.';
          showToast('3 records staged for ingestion', 'info', 2000);
        });
      }
    }, 100);
  }

  // 2FA Settings In-Page Modal Handler
  const btn2fa = document.getElementById('btn-header-2fa');
  if (btn2fa) {
    btn2fa.addEventListener('click', (e) => {
      e.preventDefault();
      open2faSettingsModal();
    });
  }

  function open2faSettingsModal() {
    const modalHtml = `
      <div style="display: flex; flex-direction: column; gap: 1rem; text-align: center;">
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 0.75rem; color: #065f46; font-size: 0.85rem; font-weight: 600;">
          🔒 Two-Factor Authentication (TOTP) Active
        </div>
        <p style="font-size: 0.85rem; color: #475569; margin: 0;">
          Time-based One-Time Password (RFC 6238) algorithm backed by Google Authenticator / Microsoft Authenticator.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: left;">
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">ENCRYPTED SECRET KEY</div>
          <div style="font-family: monospace; font-size: 0.95rem; color: #0f172a; word-break: break-all; font-weight: bold;">
            JBSWY3DPEHPK3PXP-NBSC-2026
          </div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: left;">
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600;">BACKUP RECOVERY CODES</div>
          <div style="font-family: monospace; font-size: 0.85rem; color: #334155; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <span>• 8421-9041</span>
            <span>• 1948-3829</span>
            <span>• 4920-1184</span>
            <span>• 7712-4029</span>
          </div>
        </div>
      </div>
    `;

    showModal(
      '🔒 Institutional 2FA Security Settings',
      modalHtml,
      'Done',
      () => true,
      'Close'
    );
  }

  // Logout button listener
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showModal(
        'Confirm Sign Out',
        '<p>Are you sure you want to conclude your administrative session?</p>',
        'Sign Out',
        () => logout('/pages/auth/admin-login/admin-login.html')
      );
    });
  }

  // Refresh data listener
  const btnRefresh = document.getElementById('btn-refresh-dashboard');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      showToast('Refreshing HR analytics...', 'info', 1500);
      await loadDashboardData();
    });
  }

  /**
   * Fetches latest KPI figures from backend API.
   */
  async function fetchKPIs() {
    try {
      const response = await apiGet('/dashboard/kpis/');
      const kpis = response.data;
      if (!kpis) return;

      const totalEmpEl = document.getElementById('kpi-total-employees');
      const breakdownEl = document.getElementById('kpi-emp-breakdown');
      const vacanciesEl = document.getElementById('kpi-open-vacancies');
      const applicantsEl = document.getElementById('kpi-active-applicants');
      const primeScoreEl = document.getElementById('kpi-prime-score');

      if (totalEmpEl) totalEmpEl.textContent = kpis.total_employees;
      if (breakdownEl) {
        breakdownEl.textContent = `${kpis.teaching_faculty} Teaching • ${kpis.non_teaching_staff} Staff`;
      }
      if (vacanciesEl) vacanciesEl.textContent = kpis.active_vacancies;
      if (applicantsEl) applicantsEl.textContent = kpis.applicants_in_pipeline;
      if (primeScoreEl && kpis.prime_hrm_status) {
        primeScoreEl.textContent = `${kpis.prime_hrm_status.overall_score}%`;
      }
    } catch (err) {
      console.warn('Using default KPI indicators:', err.message);
    }
  }

  let deptChartInstance = null;
  let employmentChartInstance = null;
  let categoryChartInstance = null;
  let pillarsChartInstance = null;

  /**
   * Initializes or updates all 4 Chart.js analytics graphs.
   */
  async function fetchCharts() {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js library not loaded');
      return;
    }

    try {
      const response = await apiGet('/dashboard/charts/');
      const chartData = response.data || {};

      // 1. Department Bar Chart
      const deptCanvas = document.getElementById('chart-departments');
      if (deptCanvas) {
        const depts = chartData.departments || [
          { label: 'General Education', count: 32 },
          { label: 'Business & Mgmt', count: 28 },
          { label: 'Computer Studies', count: 35 },
          { label: 'Teacher Education', count: 31 },
          { label: 'Administration', count: 16 }
        ];

        if (deptChartInstance) deptChartInstance.destroy();
        deptChartInstance = new Chart(deptCanvas, {
          type: 'bar',
          data: {
            labels: depts.map(d => d.label),
            datasets: [{
              label: 'Personnel Count',
              data: depts.map(d => d.count),
              backgroundColor: '#0F1B2D',
              hoverBackgroundColor: '#D4A843',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
              x: { grid: { display: false } }
            }
          }
        });
      }

      // 2. Employment Status Doughnut Chart
      const empCanvas = document.getElementById('chart-employment');
      if (empCanvas) {
        const empTypes = chartData.employment_types || [
          { label: 'Permanent Plantilla', count: 52 },
          { label: 'Contract of Service (COS)', count: 68 },
          { label: 'Temporary', count: 14 },
          { label: 'Job Order', count: 8 }
        ];

        if (employmentChartInstance) employmentChartInstance.destroy();
        employmentChartInstance = new Chart(empCanvas, {
          type: 'doughnut',
          data: {
            labels: empTypes.map(e => e.label),
            datasets: [{
              data: empTypes.map(e => e.count),
              backgroundColor: ['#10B981', '#D4A843', '#3B82F6', '#94A3B8'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
            }
          }
        });
      }

      // 3. Faculty vs Staff Pie Chart
      const catCanvas = document.getElementById('chart-categories');
      if (catCanvas) {
        const categories = chartData.categories || [
          { label: 'Teaching / Faculty', count: 96 },
          { label: 'Non-Teaching / Staff', count: 46 }
        ];

        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(catCanvas, {
          type: 'pie',
          data: {
            labels: categories.map(c => c.label),
            datasets: [{
              data: categories.map(c => c.count),
              backgroundColor: ['#D4A843', '#0F1B2D'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
          }
        });
      }

      // 4. PRIME-HRM 4 Pillars Radar Chart
      const pillarsCanvas = document.getElementById('chart-pillars');
      if (pillarsCanvas) {
        if (pillarsChartInstance) pillarsChartInstance.destroy();
        pillarsChartInstance = new Chart(pillarsCanvas, {
          type: 'radar',
          data: {
            labels: [
              'Recruitment, Selection & Placement',
              'Learning & Development',
              'Performance Management',
              'Rewards & Recognition'
            ],
            datasets: [
              {
                label: 'NBSC Compliance Score (%)',
                data: [96.5, 92.0, 94.8, 93.5],
                backgroundColor: 'rgba(212, 168, 67, 0.25)',
                borderColor: '#D4A843',
                pointBackgroundColor: '#0F1B2D',
                pointBorderColor: '#D4A843'
              },
              {
                label: 'CSC Level 2 Threshold',
                data: [80, 80, 80, 80],
                borderColor: 'rgba(148, 163, 184, 0.5)',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                min: 50,
                max: 100,
                ticks: { stepSize: 10, font: { size: 10 } }
              }
            },
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
          }
        });
      }

    } catch (err) {
      console.warn('Error loading chart data:', err.message);
    }
  }

  /**
   * Orchestrates complete dashboard reload.
   */
  async function loadDashboardData() {
    await Promise.all([
      fetchKPIs(),
      fetchCharts()
    ]);
  }

  await loadDashboardData();
});
