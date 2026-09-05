/**
 * NBSC PRIME-HRM Intelligence Hub — Vacancy Create/Edit Form Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth([ROLES.HR_ADMIN]);

  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.name || user.email;
    if (roleEl) roleEl.textContent = ROLE_LABELS[user.role] || user.role;
    if (avatarEl) {
      avatarEl.textContent = (user.name || user.email).substring(0, 2).toUpperCase();
    }
  }

  const form = document.getElementById('form-vacancy');
  const btnSubmit = document.getElementById('btn-submit-vacancy');
  const formHeading = document.getElementById('form-heading');
  const breadcrumbAction = document.getElementById('breadcrumb-action');
  const selectDept = document.getElementById('select-department');

  // Form Fields
  const inputTitle = document.getElementById('input-title');
  const selectCategory = document.getElementById('select-category');
  const selectEmploymentStatus = document.getElementById('select-employment-status');
  const inputSlots = document.getElementById('input-slots');
  const textareaDescription = document.getElementById('textarea-description');
  const inputEducation = document.getElementById('input-education');
  const inputExperience = document.getElementById('input-experience');
  const inputTraining = document.getElementById('input-training');
  const inputEligibility = document.getElementById('input-eligibility');
  const inputSalaryGrade = document.getElementById('input-salary-grade');
  const inputMonthlySalary = document.getElementById('input-monthly-salary');
  const inputDailyRate = document.getElementById('input-daily-rate');
  const selectStatus = document.getElementById('select-status');
  const inputDeadline = document.getElementById('input-deadline');

  // Error placeholders
  const errorTitle = document.getElementById('error-title');
  const errorDepartment = document.getElementById('error-department');
  const errorEducation = document.getElementById('error-education');

  // Populate department choices
  if (selectDept) {
    DEPARTMENTS.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.code;
      opt.textContent = `${dept.code} - ${dept.name}`;
      selectDept.appendChild(opt);
    });
  }

  // Check for Edit Mode
  const vacancyId = getQueryParam('id');
  const isEditMode = Boolean(vacancyId);

  if (isEditMode) {
    formHeading.textContent = 'Edit Vacancy';
    breadcrumbAction.textContent = 'Edit Vacancy';
    btnSubmit.textContent = 'Update Vacancy';
    await loadVacancyData(vacancyId);
  }

  /**
   * Loads existing vacancy data for edit form.
   * @param {string} id
   */
  async function loadVacancyData(id) {
    try {
      const res = await apiGet(`/vacancies/${id}/`);
      if (res.success && res.data && res.data.vacancy) {
        const v = res.data.vacancy;
        inputTitle.value = v.title || '';
        selectDept.value = v.department || '';
        selectCategory.value = v.category || 'TEACHING';
        selectEmploymentStatus.value = v.employment_status || 'COS';
        inputSlots.value = v.slots || 1;
        textareaDescription.value = v.description || '';
        inputEducation.value = v.education || '';
        inputExperience.value = v.experience || '';
        inputTraining.value = v.training || '';
        inputEligibility.value = v.eligibility || '';
        inputSalaryGrade.value = v.salary_grade || 12;
        inputMonthlySalary.value = v.monthly_salary || 29165.00;
        inputDailyRate.value = v.daily_rate || 1325.68;
        selectStatus.value = v.status || 'OPEN';
        if (v.deadline) {
          inputDeadline.value = v.deadline;
        }
      } else {
        showToast(res.message || 'Failed to load vacancy for editing.', 'error');
      }
    } catch (err) {
      showToast('Error retrieving vacancy data.', 'error');
    }
  }

  /**
   * Validates form inputs and returns clean payload.
   * @returns {Object|null}
   */
  function validateAndGetPayload() {
    let isValid = true;
    errorTitle.textContent = '';
    errorDepartment.textContent = '';
    errorEducation.textContent = '';

    const title = inputTitle.value.trim();
    const department = selectDept.value.trim();
    const education = inputEducation.value.trim();

    if (!title) {
      errorTitle.textContent = 'Position title is mandatory.';
      isValid = false;
    }
    if (!department) {
      errorDepartment.textContent = 'Department selection is mandatory.';
      isValid = false;
    }
    if (!education) {
      errorEducation.textContent = 'Education Qualification Standard is mandatory.';
      isValid = false;
    }

    if (!isValid) return null;

    return {
      title,
      department,
      category: selectCategory.value,
      employment_status: selectEmploymentStatus.value,
      slots: parseInt(inputSlots.value, 10) || 1,
      description: textareaDescription.value.trim(),
      education,
      experience: inputExperience.value.trim() || 'None Required',
      training: inputTraining.value.trim() || 'None Required',
      eligibility: inputEligibility.value.trim() || 'None Required / RA 1080',
      salary_grade: parseInt(inputSalaryGrade.value, 10) || 12,
      monthly_salary: parseFloat(inputMonthlySalary.value) || 29165.00,
      daily_rate: parseFloat(inputDailyRate.value) || 1325.68,
      status: selectStatus.value,
      deadline: inputDeadline.value || null
    };
  }

  // Form Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = validateAndGetPayload();
    if (!payload) return;

    btnSubmit.disabled = true;
    btnSubmit.textContent = isEditMode ? 'Updating...' : 'Saving...';

    try {
      let res;
      if (isEditMode) {
        res = await apiPut(`/vacancies/${vacancyId}/`, payload);
      } else {
        res = await apiPost('/vacancies/', payload);
      }

      if (res.success) {
        showToast(
          isEditMode ? 'Vacancy updated successfully.' : 'Vacancy created successfully.',
          'success'
        );
        setTimeout(() => {
          window.location.href = '../vacancy-list/vacancy-list.html';
        }, 800);
      } else {
        showToast(res.message || 'Operation failed.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.textContent = isEditMode ? 'Update Vacancy' : 'Save Vacancy';
      }
    } catch (err) {
      showToast('Network error during save.', 'error');
      btnSubmit.disabled = false;
      btnSubmit.textContent = isEditMode ? 'Update Vacancy' : 'Save Vacancy';
    }
  });
});
