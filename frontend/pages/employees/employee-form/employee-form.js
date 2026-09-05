/**
 * NBSC PRIME-HRM Intelligence Hub — Employee Form Logic
 * Manages employee creation and modification with form validation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth([ROLES.HR_ADMIN]);

  const form = document.getElementById('form-employee');
  const pageHeading = document.getElementById('page-heading');
  const cardTitle = document.getElementById('card-form-title');
  const btnSubmit = document.getElementById('btn-submit-employee');
  const btnText = document.getElementById('btn-save-text');

  const empIdParam = getQueryParam('id');
  const isEditMode = Boolean(empIdParam);

  if (isEditMode) {
    pageHeading.textContent = 'Edit Employee Profile';
    cardTitle.textContent = `Update Profile (ID: ${empIdParam})`;
    btnText.textContent = 'Update Employee';
    await loadEmployeeData(empIdParam);
  }

  /**
   * Loads existing employee record for editing.
   * @param {string} id
   */
  async function loadEmployeeData(id) {
    try {
      const response = await apiGet(`/employees/${id}/`);
      const emp = response.data.employee;
      if (!emp) return;

      document.getElementById('input-first-name').value = emp.first_name || '';
      document.getElementById('input-last-name').value = emp.last_name || '';
      document.getElementById('input-middle-name').value = emp.middle_name || '';
      document.getElementById('input-email').value = emp.email || '';
      document.getElementById('input-phone').value = emp.phone || '';
      document.getElementById('select-department').value = emp.department || '';
      document.getElementById('input-position').value = emp.position || '';
      document.getElementById('select-category').value = emp.category || 'TEACHING';
      document.getElementById('select-status').value = emp.employment_status || 'COS';
      document.getElementById('input-daily-rate').value = emp.daily_rate || '';
      document.getElementById('input-monthly-salary').value = emp.monthly_salary || '';
    } catch (err) {
      showToast('Error loading employee record: ' + err.message, 'error');
    }
  }

  /**
   * Submits employee record to backend.
   * @param {Event} e
   */
  async function handleSave(e) {
    e.preventDefault();

    const validation = validateForm(form);
    if (!validation.isValid) {
      showToast('Please complete all required fields.', 'error');
      return;
    }

    const payload = {
      first_name: document.getElementById('input-first-name').value.trim(),
      last_name: document.getElementById('input-last-name').value.trim(),
      middle_name: document.getElementById('input-middle-name').value.trim(),
      email: document.getElementById('input-email').value.trim().toLowerCase(),
      phone: document.getElementById('input-phone').value.trim(),
      department: document.getElementById('select-department').value,
      position: document.getElementById('input-position').value.trim(),
      category: document.getElementById('select-category').value,
      employment_status: document.getElementById('select-status').value,
      daily_rate: parseFloat(document.getElementById('input-daily-rate').value) || 0.0,
      monthly_salary: parseFloat(document.getElementById('input-monthly-salary').value) || 0.0
    };

    btnSubmit.disabled = true;
    btnText.textContent = isEditMode ? 'Updating...' : 'Saving...';

    try {
      if (isEditMode) {
        await apiPut(`/employees/${empIdParam}/`, payload);
        showToast('Employee profile updated successfully!', 'success');
      } else {
        await apiPost('/employees/', payload);
        showToast('New employee created successfully!', 'success');
      }

      setTimeout(() => {
        window.location.href = '../employee-list/employee-list.html';
      }, 700);
    } catch (err) {
      showToast(err.message || 'Failed to save employee profile.', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = isEditMode ? 'Update Employee' : 'Save Personnel Record';
    }
  }

  if (form) {
    form.addEventListener('submit', handleSave);
  }
});
