/**
 * NBSC PRIME-HRM Intelligence Hub — Program Form Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth([ROLES.HR_ADMIN]);

  const form = document.getElementById('form-program');
  const pageHeading = document.getElementById('page-heading');
  const cardHeading = document.getElementById('card-heading');
  const btnSubmit = document.getElementById('btn-submit-program');
  const btnText = document.getElementById('btn-save-text');

  const inputCode = document.getElementById('input-program-code');
  const selectDept = document.getElementById('select-program-dept');
  const inputName = document.getElementById('input-program-name');
  const inputDesc = document.getElementById('input-program-desc');

  const progIdParam = getQueryParam('id');
  const isEditMode = Boolean(progIdParam);

  if (isEditMode) {
    pageHeading.textContent = 'Edit Program';
    cardHeading.textContent = `Update Program Details (${progIdParam})`;
    btnText.textContent = 'Update Program';
    inputCode.disabled = true; // Code immutable
    await loadProgram(progIdParam);
  }

  async function loadProgram(id) {
    try {
      const response = await apiGet(`/programs/${id}/`);
      const prog = response.data.program;
      if (!prog) return;

      inputCode.value = prog.code;
      selectDept.value = prog.department;
      inputName.value = prog.name;
      inputDesc.value = prog.description || '';
    } catch (err) {
      showToast('Error loading program: ' + err.message, 'error');
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    const validation = validateForm(form);
    if (!validation.isValid) {
      showToast('Please fill in required fields.', 'error');
      return;
    }

    const payload = {
      code: inputCode.value.trim().toUpperCase(),
      department: selectDept.value,
      name: inputName.value.trim(),
      description: inputDesc.value.trim()
    };

    btnSubmit.disabled = true;
    btnText.textContent = isEditMode ? 'Updating...' : 'Saving...';

    try {
      if (isEditMode) {
        await apiPut(`/programs/${progIdParam}/`, payload);
        showToast('Program updated successfully!', 'success');
      } else {
        await apiPost('/programs/', payload);
        showToast('Program registered successfully!', 'success');
      }

      setTimeout(() => {
        window.location.href = '../program-list/program-list.html';
      }, 700);
    } catch (err) {
      showToast(err.message || 'Failed to save program.', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = isEditMode ? 'Update Program' : 'Save Program';
    }
  }

  if (form) {
    form.addEventListener('submit', handleSave);
  }
});
