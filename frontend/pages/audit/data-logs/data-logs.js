/**
 * NBSC PRIME-HRM Intelligence Hub — System Data Logs Logic
 * Provides activity audit trail, search/filtering, and cryptographic payload inspection.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof requireAuth === 'function') {
    try { requireAuth([ROLES.HR_ADMIN]); } catch (e) { console.warn(e); }
  }
  if (typeof initAppNavigation === 'function') {
    initAppNavigation();
  }

  // Ensure user display info is filled
  const activeUser = (typeof getUser === 'function' && getUser()) || 
    JSON.parse(localStorage.getItem('nbsc_user') || 'null') || {
      full_name: 'Dr. Maria Santos',
      role: 'HR_ADMIN'
    };
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-display-role');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl && (!nameEl.textContent.trim() || nameEl.textContent === '—')) {
    nameEl.textContent = activeUser.full_name || 'Dr. Maria Santos';
  }
  if (roleEl && (!roleEl.textContent.trim() || roleEl.textContent === '—')) {
    roleEl.textContent = (typeof ROLE_LABELS !== 'undefined' && ROLE_LABELS[activeUser.role]) || activeUser.role || 'HR Administrator';
  }
  if (avatarEl && (!avatarEl.textContent.trim() || avatarEl.textContent === '—')) {
    avatarEl.textContent = (activeUser.full_name || 'DM').substring(0, 2).toUpperCase();
  }

  // Seed / Static Mock Logs Dataset
  const SYSTEM_LOGS = [
    {
      id: 'LOG-2026-0911-001',
      timestamp: '2026-09-11 20:38:14',
      action: 'CHAIN_BLOCK_SEALED',
      module: 'AUDIT',
      module_label: 'Cryptographic Ledger',
      actor_name: 'System Autonomous Bot',
      actor_role: 'SYSTEM_DAEMON',
      ip: '127.0.0.1 (Localhost)',
      status: 'AUDIT_SEALED',
      details: 'Appended block #014 to SHA-256 Merkle chain. Hash: 8f9b42...a91c',
      payload: {
        block_height: 14,
        previous_hash: '3e4f7a90b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8',
        block_hash: '8f9b42c8d1e0f3a4b5c6d7e8a91cb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
        merkle_root: '5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
        records_count: 5,
        seal_authority: 'NBSC-PRIME-LEDGER-V2',
        tamper_status: 'VALID'
      }
    },
    {
      id: 'LOG-2026-0911-002',
      timestamp: '2026-09-11 19:45:02',
      action: 'AUTH_LOGIN_SUCCESS',
      module: 'AUTH',
      module_label: 'Authentication',
      actor_name: 'Dr. Dennis A. Tarepe',
      actor_role: 'HR_ADMIN',
      ip: '192.168.10.45',
      status: 'SUCCESS',
      details: 'Successful administrator login with 2FA TOTP verification.',
      payload: {
        user_id: 'usr-001',
        username: 'admin',
        auth_method: 'PASSWORD_MFA_TOTP',
        session_id: 'sess-8924b1f2',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
        login_location: 'Admin Office, NBSC Main Campus'
      }
    },
    {
      id: 'LOG-2026-0911-003',
      timestamp: '2026-09-11 18:30:19',
      action: 'EMP_PROFILE_UPDATED',
      module: 'EMPLOYEES',
      module_label: 'Personnel Directory',
      actor_name: 'Dr. Dennis A. Tarepe',
      actor_role: 'HR_ADMIN',
      ip: '192.168.10.45',
      status: 'SUCCESS',
      details: 'Updated position title and salary details for employee emp-007.',
      payload: {
        employee_id: 'emp-007',
        target_name: 'Maria Kristina Velasco',
        fields_modified: ['position_title', 'monthly_salary', 'updated_at'],
        previous_values: {
          position_title: 'Administrative Aide VI',
          monthly_salary: 16500.00
        },
        new_values: {
          position_title: 'Administrative Assistant II',
          monthly_salary: 19500.00
        }
      }
    },
    {
      id: 'LOG-2026-0911-004',
      timestamp: '2026-09-11 17:15:40',
      action: 'HRMPSB_BALLOT_CAST',
      module: 'HRMPSB',
      module_label: 'HRMPSB Deliberation',
      actor_name: 'Atty. James Ronald Balisi',
      actor_role: 'HRMPSB_MEMBER',
      ip: '192.168.10.88',
      status: 'AUDIT_SEALED',
      details: 'Deliberation vote submitted for Vacancy VAC-2026-001 (Instructor I).',
      payload: {
        deliberation_id: 'delib-2026-001',
        candidate_id: 'app-002',
        score_allocated: 94.5,
        decision: 'RECOMMEND_APPOINTMENT',
        ballot_hash: '4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
        remarks: 'Candidate scored highest on pedagogical demonstration and civil service competency.'
      }
    },
    {
      id: 'LOG-2026-0911-005',
      timestamp: '2026-09-11 16:50:11',
      action: 'VACANCY_STATUS_CHANGED',
      module: 'HIRING',
      module_label: 'Recruitment & Pipeline',
      actor_name: 'Dr. Dennis A. Tarepe',
      actor_role: 'HR_ADMIN',
      ip: '192.168.10.45',
      status: 'SUCCESS',
      details: 'Vacancy VAC-2026-004 publication status shifted from DRAFT to PUBLISHED.',
      payload: {
        vacancy_id: 'VAC-2026-004',
        title: 'Assistant Professor I - Computer Science',
        department: 'ICS',
        plantilla_item: 'OSEC-NB-AP1-2026-09',
        closing_date: '2026-10-15',
        csc_publication_ref: 'CSC-RO10-BUL-2026-089'
      }
    },
    {
      id: 'LOG-2026-0911-006',
      timestamp: '2026-09-11 15:22:33',
      action: 'SETTINGS_MUTATED',
      module: 'SETTINGS',
      module_label: 'System Settings',
      actor_name: 'Dr. Dennis A. Tarepe',
      actor_role: 'HR_ADMIN',
      ip: '192.168.10.45',
      status: 'SUCCESS',
      details: 'Modified PRIME-HRM Level 2 accreditation compliance thresholds.',
      payload: {
        section: 'COMPLIANCE_PILLARS',
        setting_key: 'rss_passing_threshold',
        old_value: 80.0,
        new_value: 85.0,
        audit_tag: 'PRIME-HRM-MATURITY-LEVEL-2'
      }
    },
    {
      id: 'LOG-2026-0911-007',
      timestamp: '2026-09-11 14:10:05',
      action: 'PAYROLL_BATCH_EXPORTED',
      module: 'PAYROLL',
      module_label: 'Payroll Operations',
      actor_name: 'Grace Magbanua',
      actor_role: 'FINANCE_OFFICER',
      ip: '192.168.10.60',
      status: 'SUCCESS',
      details: 'Disbursement file generated for batch PB-2026-09-1 (1st Half Sept 2026).',
      payload: {
        batch_id: 'PB-2026-09-1',
        total_beneficiaries: 184,
        gross_payroll: 3450200.50,
        net_disbursement: 2890450.25,
        bank_remittance_format: 'LANDBANK_E_FPS',
        check_number_range: '109820-109999'
      }
    },
    {
      id: 'LOG-2026-0911-008',
      timestamp: '2026-09-11 11:35:48',
      action: 'AUTH_SESSION_EXPIRED',
      module: 'AUTH',
      module_label: 'Authentication',
      actor_name: 'Prof. Mary Jean Perez',
      actor_role: 'DEPT_HEAD',
      ip: '192.168.10.72',
      status: 'INFO',
      details: 'Inactivity timeout triggered after 30 minutes of idle state.',
      payload: {
        user_id: 'usr-003',
        session_id: 'sess-7718c399',
        idle_duration_minutes: 30,
        action_taken: 'TERMINATE_TOKEN_INVALIDATE'
      }
    },
    {
      id: 'LOG-2026-0911-009',
      timestamp: '2026-09-11 09:12:17',
      action: 'AUTH_FAILED_ATTEMPT',
      module: 'AUTH',
      module_label: 'Authentication',
      actor_name: 'Unknown Client',
      actor_role: 'ANONYMOUS',
      ip: '203.177.135.22',
      status: 'WARNING',
      details: 'Failed login attempt with invalid credential sequence.',
      payload: {
        attempted_username: 'superadmin',
        failure_reason: 'INVALID_CREDENTIALS',
        attempt_count: 2,
        throttled: false
      }
    },
    {
      id: 'LOG-2026-0911-010',
      timestamp: '2026-09-10 16:40:55',
      action: 'FILE_UPLOAD_VERIFIED',
      module: 'HIRING',
      module_label: 'Recruitment & Pipeline',
      actor_name: 'Maria Cristina S. Santos',
      actor_role: 'APPLICANT',
      ip: '175.158.201.8',
      status: 'SUCCESS',
      details: 'Uploaded PDS CS Form 212 Revised 2017 with SHA-256 integrity hash verification.',
      payload: {
        applicant_id: 'app-005',
        document_type: 'PDS_FORM_212',
        file_size_bytes: 2459012,
        file_sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        virus_scan: 'CLEAN'
      }
    },
    {
      id: 'LOG-2026-0910-011',
      timestamp: '2026-09-10 14:05:30',
      action: 'DEPT_EVAL_SUBMITTED',
      module: 'HIRING',
      module_label: 'Recruitment & Pipeline',
      actor_name: 'Engr. Junrie B. Matias',
      actor_role: 'DEPT_HEAD',
      ip: '192.168.10.51',
      status: 'SUCCESS',
      details: 'Technical rubric evaluation completed for 3 applicants in vacancy VAC-2026-002.',
      payload: {
        evaluator_id: 'emp-004',
        vacancy_id: 'VAC-2026-002',
        applicants_evaluated: ['app-003', 'app-004', 'app-007'],
        average_score: 88.75,
        recommendations_sealed: true
      }
    },
    {
      id: 'LOG-2026-0910-012',
      timestamp: '2026-09-10 10:15:22',
      action: 'BACKUP_SNAPSHOT_SEALED',
      module: 'AUDIT',
      module_label: 'Cryptographic Ledger',
      actor_name: 'Automated DB Archiver',
      actor_role: 'SYSTEM_DAEMON',
      ip: '127.0.0.1 (Localhost)',
      status: 'AUDIT_SEALED',
      details: 'Daily immutable database snapshot exported and cryptographically checksummed.',
      payload: {
        snapshot_id: 'SNAP-20260910-0400',
        total_tables: 18,
        total_rows: 4820,
        compression_ratio: '74%',
        pg_dump_hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
      }
    }
  ];

  // DOM Elements
  const tbody = document.getElementById('logs-tbody');
  const searchInput = document.getElementById('input-log-search');
  const moduleSelect = document.getElementById('select-module');
  const statusSelect = document.getElementById('select-status');
  const resetBtn = document.getElementById('btn-reset-filters');
  const displayCount = document.getElementById('logs-display-count');
  const metricTotal = document.getElementById('metric-total-events');
  const metricAuth = document.getElementById('metric-auth-events');
  const metricMutations = document.getElementById('metric-mutations');
  const btnRefresh = document.getElementById('btn-refresh-logs');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');

  // Modal Elements
  const modal = document.getElementById('modal-payload');
  const modalClose = document.getElementById('btn-close-modal');
  const modalCloseFooter = document.getElementById('btn-modal-close-footer');
  const modalEventId = document.getElementById('modal-event-id');
  const modalTitle = document.getElementById('modal-payload-title');
  const modalTimestamp = document.getElementById('modal-timestamp');
  const modalModule = document.getElementById('modal-module');
  const modalActor = document.getElementById('modal-actor');
  const modalIp = document.getElementById('modal-ip');
  const modalJson = document.getElementById('modal-json-content');
  const btnCopyPayload = document.getElementById('btn-copy-payload');

  let activeLogs = [...SYSTEM_LOGS];
  let selectedEvent = null;

  // Initialize metrics
  function updateMetrics() {
    if (metricTotal) metricTotal.textContent = SYSTEM_LOGS.length;
    if (metricAuth) metricAuth.textContent = SYSTEM_LOGS.filter(l => l.module === 'AUTH').length;
    if (metricMutations) metricMutations.textContent = SYSTEM_LOGS.filter(l => ['EMPLOYEES', 'HIRING', 'SETTINGS', 'HRMPSB'].includes(l.module)).length;
  }

  // Render Table Rows
  function renderLogs(logs) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (displayCount) {
      displayCount.textContent = `Showing ${logs.length} of ${SYSTEM_LOGS.length} events`;
    }

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--color-neutral-400);">
            No system log records found matching your filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    logs.forEach(log => {
      const tr = document.createElement('tr');

      // Status Badge Style
      let statusClass = 'badge-status--info';
      if (log.status === 'SUCCESS') statusClass = 'badge-status--success';
      if (log.status === 'AUDIT_SEALED') statusClass = 'badge-status--audit';
      if (log.status === 'WARNING') statusClass = 'badge-status--warning';

      // Module Badge Style
      let modClass = 'module-badge--settings';
      if (log.module === 'AUTH') modClass = 'module-badge--auth';
      if (log.module === 'HIRING' || log.module === 'HRMPSB') modClass = 'module-badge--hiring';
      if (log.module === 'EMPLOYEES') modClass = 'module-badge--employees';
      if (log.module === 'PAYROLL') modClass = 'module-badge--payroll';
      if (log.module === 'AUDIT') modClass = 'module-badge--audit';

      tr.innerHTML = `
        <td><span class="log-timestamp">${log.timestamp}</span></td>
        <td><span class="log-action-code">${log.action}</span></td>
        <td><span class="module-badge ${modClass}">${log.module}</span></td>
        <td>
          <div class="actor-box">
            <span class="actor-name">${escapeHtml(log.actor_name)}</span>
            <span class="actor-role">${log.actor_role}</span>
          </div>
        </td>
        <td><span class="ip-mono">${log.ip}</span></td>
        <td><span class="badge-status ${statusClass}">${log.status}</span></td>
        <td style="text-align: center;">
          <button class="btn-outline-sm btn-inspect" data-id="${log.id}">Inspect</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach inspect listeners
    tbody.querySelectorAll('.btn-inspect').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openInspectModal(id);
      });
    });
  }

  // Filter Logic
  function applyFilters() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const mod = moduleSelect?.value || 'ALL';
    const stat = statusSelect?.value || 'ALL';

    activeLogs = SYSTEM_LOGS.filter(log => {
      const matchQuery = !query || 
        log.id.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.actor_name.toLowerCase().includes(query) ||
        log.ip.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);

      const matchMod = mod === 'ALL' || log.module === mod;
      const matchStat = stat === 'ALL' || log.status === stat;

      return matchQuery && matchMod && matchStat;
    });

    renderLogs(activeLogs);
  }

  // Modal Functions
  function openInspectModal(eventId) {
    selectedEvent = SYSTEM_LOGS.find(l => l.id === eventId);
    if (!selectedEvent || !modal) return;

    modalEventId.textContent = selectedEvent.id;
    modalTitle.textContent = `${selectedEvent.action} Payload`;
    modalTimestamp.textContent = selectedEvent.timestamp;
    modalModule.textContent = `${selectedEvent.module_label} (${selectedEvent.module})`;
    modalActor.textContent = `${selectedEvent.actor_name} [${selectedEvent.actor_role}]`;
    modalIp.textContent = selectedEvent.ip;
    modalJson.textContent = JSON.stringify(selectedEvent.payload, null, 2);

    modal.removeAttribute('hidden');
  }

  function closeModal() {
    if (modal) {
      modal.setAttribute('hidden', '');
    }
    selectedEvent = null;
  }

  // Event Listeners
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (moduleSelect) moduleSelect.addEventListener('change', applyFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (moduleSelect) moduleSelect.value = 'ALL';
      if (statusSelect) statusSelect.value = 'ALL';
      applyFilters();
    });
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCloseFooter) modalCloseFooter.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (btnCopyPayload) {
    btnCopyPayload.addEventListener('click', () => {
      if (!selectedEvent) return;
      navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
      showToast('Payload copied to clipboard!', 'success');
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      showToast('Logs refreshed from ledger.', 'info');
      applyFilters();
    });
  }

  // Export CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const headers = ['Timestamp', 'Event ID', 'Action', 'Module', 'Actor', 'Role', 'IP', 'Status', 'Details'];
      const rows = activeLogs.map(l => [
        `"${l.timestamp}"`,
        `"${l.id}"`,
        `"${l.action}"`,
        `"${l.module}"`,
        `"${l.actor_name}"`,
        `"${l.actor_role}"`,
        `"${l.ip}"`,
        `"${l.status}"`,
        `"${l.details.replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `NBSC_System_Data_Logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported filtered data logs to CSV.', 'success');
    });
  }

  // Export JSON
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `NBSC_System_Data_Logs_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Exported activity logs to JSON.', 'success');
    });
  }

  // Initial Run
  updateMetrics();
  renderLogs(activeLogs);
});
