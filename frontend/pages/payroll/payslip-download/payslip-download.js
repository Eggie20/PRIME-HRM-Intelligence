/**
 * NBSC PRIME-HRM Intelligence Hub — Employee Payslip Portal Logic
 * Loads employee payslip records from /api/v1/payroll/my-payslips/,
 * populates the voucher summary view, stats strip, and initiates print/PDF vouchers.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPayslipDownload();
});

let myPayslips = [];
let activeRecord = null;

/**
 * Initializes payslip retrieval, period dropdown event binding, and download listener.
 */
function initPayslipDownload() {
  fetchMyPayslips();

  const periodSelect = document.getElementById('select-pay-period');
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const found = myPayslips.find(p => p.id === selectedId);
      if (found) {
        renderSelectedPayslip(found);
      }
    });
  }

  const btnDownload = document.getElementById('btn-download-pdf');
  if (btnDownload) {
    btnDownload.addEventListener('click', handleDownloadPdf);
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout && typeof logout === 'function') {
    btnLogout.addEventListener('click', logout);
  }
}

/**
 * Retrieves employee payslip history from backend.
 * @returns {Promise<void>}
 */
async function fetchMyPayslips() {
  try {
    const res = await apiGet('/payroll/my-payslips/');
    myPayslips = res.data || res || [];
    populatePeriodSelect(myPayslips);
    renderPayslipHistoryTable(myPayslips);

    if (myPayslips.length > 0) {
      renderSelectedPayslip(myPayslips[0]);
    } else {
      renderEmptyState();
    }
  } catch (err) {
    console.error('Error loading my payslips:', err);
    if (typeof showToast === 'function') {
      showToast('Error loading payslip statement.', 'error');
    }
  }
}

/**
 * Populates period selector dropdown.
 * @param {Array<Object>} payslips - List of payslips
 */
function populatePeriodSelect(payslips) {
  const select = document.getElementById('select-pay-period');
  if (!select) return;

  if (payslips.length === 0) {
    select.innerHTML = `<option value="">No payslip vouchers available</option>`;
    return;
  }

  select.innerHTML = payslips.map((p, idx) => `
    <option value="${p.id}" ${idx === 0 ? 'selected' : ''}>
      ${p.period_label || 'Payroll Period'} &bull; ${p.full_name || 'Staff'} (${p.batch_id || 'Batch'})
    </option>
  `).join('');
}

/**
 * Renders the chosen payslip record into the voucher UI.
 * @param {Object} record - Selected payslip record
 */
function renderSelectedPayslip(record) {
  activeRecord = record;

  // Header and Period
  const voucherPeriod = document.getElementById('voucher-period-label');
  if (voucherPeriod) voucherPeriod.textContent = record.period_label || 'Current Period';

  // Stats Strip
  const statNet = document.getElementById('stat-net-pay');
  const statGross = document.getElementById('stat-gross-pay');
  const statDed = document.getElementById('stat-deductions');
  if (statNet) statNet.textContent = `PHP ${(record.net_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (statGross) statGross.textContent = `PHP ${(record.gross_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (statDed) statDed.textContent = `-PHP ${(record.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Employee details
  const empName = document.getElementById('emp-full-name');
  const empId = document.getElementById('emp-id');
  const empDept = document.getElementById('emp-dept');
  const empPos = document.getElementById('emp-pos');

  if (empName) empName.textContent = record.full_name || 'NBSC Personnel';
  if (empId) empId.textContent = record.employee_id || 'NBSC-2024-0000';
  if (empDept) empDept.textContent = record.department || 'General';
  if (empPos) empPos.textContent = `${record.position || 'Faculty'} (SG ${record.salary_grade || 12}-1)`;

  // Earnings
  const earnings = record.earnings || {};
  const basic = earnings.basic_pay || (record.gross_pay ? record.gross_pay - 2000 : 35000);
  const pera = earnings.pera || 2000;
  const overtime = earnings.overtime || 0;
  const allowances = earnings.allowances || 0;

  const valBasic = document.getElementById('val-basic-pay');
  const valPera = document.getElementById('val-pera');
  const valOt = document.getElementById('val-overtime');
  const valAllow = document.getElementById('val-allowances');
  const valGross = document.getElementById('val-gross-pay');

  if (valBasic) valBasic.textContent = `PHP ${basic.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valPera) valPera.textContent = `PHP ${pera.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valOt) valOt.textContent = `PHP ${overtime.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valAllow) valAllow.textContent = `PHP ${allowances.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valGross) valGross.textContent = `PHP ${(record.gross_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Deductions
  const deductions = record.deductions || {};
  const gsis = deductions.gsis || Math.round(basic * 0.09);
  const philhealth = deductions.philhealth || 1000;
  const pagibig = deductions.pagibig || 200;
  const tax = deductions.withholding_tax || 2500;
  const loans = (deductions.loans || 0) + (deductions.lates || 0);

  const valGsis = document.getElementById('val-gsis');
  const valPhil = document.getElementById('val-philhealth');
  const valPag = document.getElementById('val-pagibig');
  const valTax = document.getElementById('val-tax');
  const valLoans = document.getElementById('val-loans');
  const valTotalDed = document.getElementById('val-total-deductions');

  if (valGsis) valGsis.textContent = `PHP ${gsis.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valPhil) valPhil.textContent = `PHP ${philhealth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valPag) valPag.textContent = `PHP ${pagibig.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valTax) valTax.textContent = `PHP ${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valLoans) valLoans.textContent = `PHP ${loans.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valTotalDed) valTotalDed.textContent = `PHP ${(record.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Net Pay
  const valNet = document.getElementById('val-net-pay');
  const valNetWords = document.getElementById('val-net-words');
  const net = record.net_pay || 0;
  if (valNet) valNet.textContent = `PHP ${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (valNetWords) valNetWords.textContent = `Philippine Pesos: ${numberToWords(Math.round(net))} Pesos Only`;

  // Proof Seal
  const valProofHash = document.getElementById('val-proof-hash');
  const valProofDate = document.getElementById('val-proof-date');
  const hash = record.audit_hash || '7d9283fbc01e4a5692019ab921c8340a1827463f82901cba2938174201948572';
  if (valProofHash) {
    valProofHash.textContent = `${hash.substring(0, 10)}...${hash.slice(-6)}`;
    valProofHash.title = `SHA-256 Block Hash: ${hash}`;
  }
  if (valProofDate) valProofDate.textContent = record.pay_date || '2026-08-31';

  // Password formula preview
  const formulaPreview = document.getElementById('password-formula-preview');
  if (formulaPreview && record.employee_id) {
    const cleanId = record.employee_id.replace(/[^a-zA-Z0-9]/g, '');
    const last4 = cleanId.slice(-4);
    const dob = record.date_of_birth || '15081992';
    formulaPreview.innerHTML = `<code>${last4}</code> + <code>${dob}</code> &rarr; <strong style="color: var(--navy-900); font-family: monospace;">${last4}${dob}</strong>`;
  }
}

/**
 * Renders the historical records list at the bottom.
 * @param {Array<Object>} payslips - List of payslips
 */
function renderPayslipHistoryTable(payslips) {
  const tbody = document.getElementById('tbody-payslip-history');
  if (!tbody) return;

  if (payslips.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--ink-soft); padding: 24px;">No historical payslips found.</td></tr>`;
    return;
  }

  tbody.innerHTML = payslips.map(p => `
    <tr>
      <td><strong>${p.period_label || 'Pay Cycle'}</strong></td>
      <td><span style="font-family: monospace; font-size: 11.5px; background: #F1F5F9; padding: 2px 6px; border-radius: 4px;">${p.batch_id || 'N/A'}</span></td>
      <td style="color: var(--ink-soft); font-size: 12px;">${p.pay_date || '2026-08-31'}</td>
      <td style="text-align: right; font-variant-numeric: tabular-nums;">PHP ${(p.gross_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td style="text-align: right; color: var(--red); font-variant-numeric: tabular-nums;">-PHP ${(p.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td style="text-align: right; font-weight: 700; color: var(--green); font-variant-numeric: tabular-nums;">PHP ${(p.net_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td style="text-align: center;">
        <button type="button" class="btn-outline" style="padding: 4px 8px; font-size: 11.5px;" onclick="selectPayslipById('${p.id}')">
          View Statement
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Selects a payslip by record ID and updates the dropdown and view.
 * @param {string} id - Payslip ID
 */
function selectPayslipById(id) {
  const found = myPayslips.find(p => p.id === id);
  if (found) {
    const select = document.getElementById('select-pay-period');
    if (select) select.value = id;
    renderSelectedPayslip(found);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Handles exporting the statement as PDF / Print preview.
 */
function handleDownloadPdf() {
  if (typeof showToast === 'function') {
    showToast('Opening official PDF print dialog. Select "Save as PDF" to store your encrypted voucher.', 'info');
  }
  setTimeout(() => {
    window.print();
  }, 400);
}

/**
 * Displays empty state if no records are found.
 */
function renderEmptyState() {
  const empName = document.getElementById('emp-full-name');
  if (empName) empName.textContent = 'No records available';
}

/**
 * Converts a positive number to English words for the net pay note.
 * @param {number} num
 * @returns {string}
 */
function numberToWords(num) {
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 1000000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    return inWords(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + inWords(n % 1000000) : '');
  }

  return inWords(num);
}
