/**
 * NBSC PRIME-HRM Intelligence Hub — Payroll Upload & Bulk Generator Logic
 * Handles Excel file drag-and-drop, API ingestion, statutory preview table rendering,
 * and batch encryption triggers.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPayrollUpload();
});

let selectedFile = null;
let currentBatchId = null;

/**
 * Initializes dropzone events, file input listeners, and button bindings.
 */
function initPayrollUpload() {
  const dropzone = document.getElementById('payroll-dropzone');
  const fileInput = document.getElementById('input-payroll-file');
  const fileInfo = document.getElementById('dropzone-file-info');
  const btnParse = document.getElementById('btn-parse-payroll');
  const btnProcess = document.getElementById('btn-process-batch');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dropzone--dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dropzone--dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dropzone--dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0], fileInfo);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0], fileInfo);
      }
    });
  }

  if (btnParse) {
    btnParse.addEventListener('click', handleParseWorkbook);
  }

  if (btnProcess) {
    btnProcess.addEventListener('click', handleProcessBatch);
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout && typeof logout === 'function') {
    btnLogout.addEventListener('click', logout);
  }
}

/**
 * Updates UI with selected file name and size.
 * @param {File} file - Selected Excel file
 * @param {HTMLElement} fileInfoEl - File metadata element
 */
function handleFileSelection(file, fileInfoEl) {
  selectedFile = file;
  if (fileInfoEl) {
    fileInfoEl.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileInfoEl.classList.remove('d-none');
  }
  if (typeof showToast === 'function') {
    showToast(`File selected: ${file.name}`, 'info');
  }
}

/**
 * Submits payroll file to backend ingestion endpoint /api/v1/payroll/upload/
 * Falls back to demo calculation if no file is chosen.
 * @returns {Promise<void>}
 */
async function handleParseWorkbook() {
  const periodLabel = document.getElementById('input-period-label')?.value || 'September 1–15, 2026';
  const department = document.getElementById('select-department')?.value || 'ALL';
  const btnParse = document.getElementById('btn-parse-payroll');

  if (btnParse) {
    btnParse.disabled = true;
    btnParse.textContent = 'Parsing & Validating...';
  }

  try {
    let result = null;

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('period_label', periodLabel);
      formData.append('department', department);

      const response = await fetch(`${API_BASE_URL}/payroll/upload/`, {
        method: 'POST',
        headers: {
          ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
        },
        body: formData
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Failed to upload workbook');
      }
      result = json.data;
    } else {
      // Demo fallback: Fetch batches to populate preview
      const response = await fetch(`${API_BASE_URL}/payroll/batches/`);
      const json = await response.json();
      if (json.data && json.data.length > 0) {
        const latest = json.data[0];
        const detailRes = await fetch(`${API_BASE_URL}/payroll/batches/${latest.batch_id}/`);
        const detailJson = await detailRes.json();
        result = {
          batch: detailJson.data.batch,
          matched_count: detailJson.data.batch.employee_count,
          total_rows: detailJson.data.batch.employee_count,
          records_preview: detailJson.data.records
        };
      } else {
        throw new Error('Please select an Excel file (.xlsx) to parse.');
      }
    }

    renderParseSummary(result);
    if (typeof showToast === 'function') {
      showToast('Payroll workbook parsed and validated successfully!', 'success');
    }
  } catch (err) {
    console.error('Error parsing payroll:', err);
    if (typeof showToast === 'function') {
      showToast(err.message || 'Error processing payroll file.', 'error');
    }
  } finally {
    if (btnParse) {
      btnParse.disabled = false;
      btnParse.textContent = 'Parse Workbook & Validate Records';
    }
  }
}

/**
 * Updates KPI metric cards and populates the parsed records preview table.
 * @param {Object} data - Parsed payload from backend
 */
function renderParseSummary(data) {
  const batch = data.batch || {};
  currentBatchId = batch.batch_id;

  const kpiCount = document.getElementById('kpi-employee-count');
  const kpiMatched = document.getElementById('kpi-matched-count');
  const kpiGross = document.getElementById('kpi-total-gross');
  const kpiNet = document.getElementById('kpi-total-net');
  const kpiDeductions = document.getElementById('kpi-total-deductions');

  if (kpiCount) kpiCount.textContent = batch.employee_count || data.total_rows || 0;
  if (kpiMatched) kpiMatched.textContent = `${data.matched_count || batch.employee_count || 0} employees verified`;
  if (kpiGross) kpiGross.textContent = `PHP ${(batch.total_gross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (kpiNet) kpiNet.textContent = `PHP ${(batch.total_net || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (kpiDeductions) kpiDeductions.textContent = `Deductions: PHP ${(batch.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Table rows
  const tbody = document.getElementById('tbody-payroll-preview');
  const records = data.records_preview || [];

  if (tbody) {
    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted p-6">No records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = records.map(r => `
      <tr>
        <td><code>${r.employee_id}</code></td>
        <td><strong>${r.full_name}</strong><br><span class="font-xs text-muted">${r.position || 'Faculty/Staff'}</span></td>
        <td><span class="badge badge--neutral">${r.department}</span></td>
        <td>SG ${r.salary_grade || 12}</td>
        <td class="text-right">PHP ${(r.basic_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="text-right font-bold">PHP ${(r.gross_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="text-right text-danger font-sm">-PHP ${(r.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="text-right font-bold text-success">PHP ${(r.net_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td><span class="badge badge--success">&#10003; Validated</span></td>
      </tr>
    `).join('');
  }

  // Reveal the generate button
  const btnProcess = document.getElementById('btn-process-batch');
  if (btnProcess) {
    btnProcess.classList.remove('d-none');
  }
}

/**
 * Triggers batch ReportLab PDF generation and AES encryption.
 * @returns {Promise<void>}
 */
async function handleProcessBatch() {
  if (!currentBatchId) {
    if (typeof showToast === 'function') {
      showToast('Please parse a payroll workbook first.', 'warning');
    }
    return;
  }

  const modal = document.getElementById('modal-process-progress');
  const barFill = document.getElementById('progress-bar-fill');
  const doneBlock = document.getElementById('modal-progress-done');
  const spinner = document.getElementById('progress-spinner');
  const progressText = document.getElementById('modal-progress-text');

  if (modal) {
    modal.classList.add('modal--open');
    if (barFill) barFill.style.width = '30%';
  }

  try {
    // Animate progress bar
    setTimeout(() => { if (barFill) barFill.style.width = '65%'; }, 600);

    const response = await fetch(`${API_BASE_URL}/payroll/batches/${currentBatchId}/process/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      }
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || 'Batch compilation failed.');
    }

    if (barFill) barFill.style.width = '100%';
    if (spinner) spinner.classList.add('d-none');
    if (progressText) progressText.classList.add('d-none');
    if (doneBlock) doneBlock.classList.remove('d-none');

    if (typeof showToast === 'function') {
      showToast(json.message || 'Payslips successfully compiled and encrypted!', 'success');
    }
  } catch (err) {
    console.error('Error processing batch:', err);
    if (modal) modal.classList.remove('modal--open');
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to process batch.', 'error');
    }
  }
}
