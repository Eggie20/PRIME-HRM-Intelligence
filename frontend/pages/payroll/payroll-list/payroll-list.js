/**
 * NBSC PRIME-HRM Intelligence Hub — Payroll Batches Archive Logic
 * Fetches historical payroll cycles from /api/v1/payroll/batches/, renders data table,
 * computes cumulative compensation statistics, and manages batch inspection modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPayrollList();
});

let allBatches = [];

/**
 * Initializes batch fetch, search, filter, and modal bindings.
 */
function initPayrollList() {
  fetchBatches();

  const searchInput = document.getElementById('input-search-batch');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  const statusFilter = document.getElementById('select-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
  }

  // Modal close handlers
  const btnClose = document.getElementById('btn-close-inspect');
  const btnCloseBottom = document.getElementById('btn-close-inspect-bottom');
  const overlay = document.getElementById('btn-close-inspect-overlay');

  [btnClose, btnCloseBottom, overlay].forEach(el => {
    if (el) {
      el.addEventListener('click', closeInspectModal);
    }
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInspectModal();
  });

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout && typeof logout === 'function') {
    btnLogout.addEventListener('click', logout);
  }
}

/**
 * Retrieves payroll batches from backend API.
 * @returns {Promise<void>}
 */
async function fetchBatches() {
  try {
    const res = await apiGet('/payroll/batches/');
    allBatches = res.data || res || [];
    renderRibbonMetrics(allBatches);
    renderBatchTable(allBatches);
  } catch (err) {
    console.error('Error loading payroll batches:', err);
    const tbody = document.getElementById('tbody-payroll-batches');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--red); padding: 32px;">${err.message || 'Error loading records.'}</td></tr>`;
    }
    if (typeof showToast === 'function') {
      showToast('Error loading payroll batches.', 'error');
    }
  }
}

/**
 * Updates summary ribbon counters.
 * @param {Array<Object>} batches - List of payroll batches
 */
function renderRibbonMetrics(batches) {
  const ribbonBatches = document.getElementById('ribbon-total-batches');
  const ribbonDisbursed = document.getElementById('ribbon-total-disbursed');
  const ribbonSlips = document.getElementById('ribbon-total-slips');

  const totalCycles = batches.length;
  const totalNet = batches.reduce((sum, b) => sum + (b.total_net || 0), 0);
  const totalSlips = batches.reduce((sum, b) => sum + (b.employee_count || (b.records ? b.records.length : 0)), 0);

  if (ribbonBatches) ribbonBatches.textContent = totalCycles;
  if (ribbonDisbursed) ribbonDisbursed.textContent = `PHP ${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (ribbonSlips) ribbonSlips.textContent = `${totalSlips} Records`;
}

/**
 * Renders batch rows in the table.
 * @param {Array<Object>} batches - List of batches to display
 */
function renderBatchTable(batches) {
  const tbody = document.getElementById('tbody-payroll-batches');
  const countDisplay = document.getElementById('table-record-count');
  if (!tbody) return;

  if (countDisplay) {
    countDisplay.textContent = `Showing ${batches.length} of ${allBatches.length} batches`;
  }

  if (batches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--ink-soft); padding: 36px;">No matching payroll batches found.</td></tr>`;
    return;
  }

  tbody.innerHTML = batches.map(b => {
    const rawStatus = (b.status || 'PROCESSED').toUpperCase();
    let statusClass = 'badge-status--processed';
    let statusDot = '&#10003;';
    if (rawStatus === 'DISTRIBUTED') {
      statusClass = 'badge-status--distributed';
      statusDot = '&#10148;';
    } else if (rawStatus === 'PENDING') {
      statusClass = 'badge-status--pending';
      statusDot = '&#9203;';
    }

    const shortHash = b.audit_block_hash
      ? `${b.audit_block_hash.substring(0, 8)}...${b.audit_block_hash.slice(-4)}`
      : 'Unanchored';

    const hashDisplay = b.audit_block_hash
      ? `<a href="../../audit/audit-chain/audit-chain.html" class="audit-hash-pill" title="Cryptographic Block Hash: ${b.audit_block_hash}">
           <span>&#128274;</span>
           <span>${shortHash}</span>
         </a>`
      : `<span style="color: var(--ink-soft); font-size: 11px;">Pending</span>`;

    return `
      <tr>
        <td>
          <span class="batch-code">${b.batch_id}</span>
        </td>
        <td>
          <div class="period-title">${b.period_label || 'Pay Cycle'}</div>
          <div class="period-sub">Semi-monthly cycle</div>
        </td>
        <td>
          <span class="tag-scope">${b.department || 'ALL FACULTY & STAFF'}</span>
        </td>
        <td style="text-align: center; font-weight: 600;">${b.employee_count || (b.records ? b.records.length : 0)}</td>
        <td style="text-align: right;" class="amount-gross">PHP ${(b.total_gross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right;" class="amount-deduction">-PHP ${(b.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right;" class="amount-net">PHP ${(b.total_net || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>
          <span class="badge-status ${statusClass}">${statusDot} ${rawStatus}</span>
        </td>
        <td>${hashDisplay}</td>
        <td style="text-align: center;">
          <button type="button" class="btn-inspect" onclick="inspectBatch('${b.batch_id}')">
            <span>Inspect</span>
            <span>&rarr;</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Combines search input and status select filter.
 */
function applyFilters() {
  const searchInput = document.getElementById('input-search-batch');
  const statusFilter = document.getElementById('select-status-filter');

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const status = statusFilter ? statusFilter.value.toUpperCase() : '';

  let filtered = allBatches;

  if (q) {
    filtered = filtered.filter(b =>
      (b.batch_id && b.batch_id.toLowerCase().includes(q)) ||
      (b.period_label && b.period_label.toLowerCase().includes(q)) ||
      (b.department && b.department.toLowerCase().includes(q))
    );
  }

  if (status) {
    filtered = filtered.filter(b => (b.status || '').toUpperCase() === status);
  }

  renderBatchTable(filtered);
}

/**
 * Opens modal drawer and loads employee records for selected batch.
 * @param {string} batchId - Batch unique identifier
 */
async function inspectBatch(batchId) {
  const modal = document.getElementById('modal-batch-inspect');
  const title = document.getElementById('modal-inspect-title');
  const period = document.getElementById('modal-inspect-period');
  const count = document.getElementById('modal-inspect-count');
  const tbody = document.getElementById('tbody-batch-inspect');

  if (title) title.textContent = `Batch Breakdown: ${batchId}`;
  if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--ink-soft); padding: 24px;">Loading details...</td></tr>`;
  if (modal) modal.classList.add('modal--open');

  try {
    const res = await apiGet(`/payroll/batches/${batchId}/`);
    const data = res.data || res;
    if (period) period.textContent = (data.batch && data.batch.period_label) ? data.batch.period_label : 'Semi-monthly compensation schedule';
    const recs = data.records || [];
    if (count) count.textContent = `${recs.length} employee compensation records found`;

    if (tbody) {
      if (recs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--ink-soft); padding: 24px;">No vouchers found for this batch.</td></tr>`;
        return;
      }

      tbody.innerHTML = recs.map(r => `
        <tr>
          <td><span class="batch-code" style="font-size: 11px;">${r.employee_id}</span></td>
          <td><strong>${r.full_name}</strong></td>
          <td><span class="tag-scope">${r.department}</span></td>
          <td style="text-align: right;" class="amount-gross">PHP ${(r.gross_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; color: var(--ink-soft);">PHP ${(r.deductions?.gsis || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; color: var(--ink-soft);">PHP ${(r.deductions?.philhealth || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; color: var(--ink-soft);">PHP ${(r.deductions?.withholding_tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;" class="amount-net">PHP ${(r.net_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: center;">
            <a href="../payslip-download/payslip-download.html" class="btn-inspect" title="View Payslip Voucher">
              <span>&#128274;</span>
              <span>View</span>
            </a>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error inspecting batch:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--red); padding: 24px;">${err.message}</td></tr>`;
    }
  }
}

/**
 * Closes the batch inspector modal.
 */
function closeInspectModal() {
  const modal = document.getElementById('modal-batch-inspect');
  if (modal) {
    modal.classList.remove('modal--open');
  }
}
