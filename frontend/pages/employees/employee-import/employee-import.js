/**
 * NBSC PRIME-HRM Intelligence Hub — Employee Import Logic
 * Uploads Excel rosters, calls backend parser, and presents import statistics.
 */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth([ROLES.HR_ADMIN]);

  const dropzone = document.getElementById('excel-dropzone');
  const fileInput = document.getElementById('input-file-excel');
  const fileNameDisplay = document.getElementById('file-name-display');
  const btnStart = document.getElementById('btn-start-import');
  const btnText = document.getElementById('btn-import-text');
  const summaryBox = document.getElementById('import-summary-box');

  let selectedFile = null;

  /**
   * Sets active file and updates UI display.
   * @param {File} file
   */
  function handleFileSelected(file) {
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast('Please select a valid Excel (.xlsx) file.', 'error');
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
    fileNameDisplay.classList.remove('d-none');
    btnStart.disabled = false;
  }

  // Drag and drop listeners
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, e => {
      e.preventDefault();
      dropzone.classList.add('dropzone--dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, e => {
      e.preventDefault();
      dropzone.classList.remove('dropzone--dragover');
    });
  });

  dropzone.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    if (dt && dt.files.length > 0) {
      handleFileSelected(dt.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  /**
   * Submits selected file to bulk import endpoint.
   */
  async function startImport() {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    btnStart.disabled = true;
    btnText.textContent = 'Parsing & Importing Records...';

    try {
      const response = await apiUpload('/employees/import/', formData);
      const res = response.data || {};

      document.getElementById('summary-imported').textContent = res.imported || 0;
      document.getElementById('summary-skipped').textContent = res.skipped || 0;
      document.getElementById('summary-errors').textContent = (res.errors && res.errors.length) || 0;

      summaryBox.classList.remove('d-none');
      showToast(`Successfully processed ${selectedFile.name}!`, 'success');

    } catch (err) {
      showToast(err.message || 'Import failed. Check file formatting.', 'error');
    } finally {
      btnStart.disabled = false;
      btnText.textContent = 'Process & Import Roster';
    }
  }

  btnStart.addEventListener('click', startImport);
});
