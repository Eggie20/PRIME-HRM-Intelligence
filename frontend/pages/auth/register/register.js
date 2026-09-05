/**
 * NBSC PRIME-HRM Intelligence Hub — Applicant Registration Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-register');
  const inputName = document.getElementById('input-reg-name');
  const inputEmail = document.getElementById('input-reg-email');
  const inputPhone = document.getElementById('input-reg-phone');
  const inputPass = document.getElementById('input-reg-password');
  const inputConfirm = document.getElementById('input-reg-confirm-pass');
  const btnSubmit = document.getElementById('btn-submit-register');
  const btnText = document.getElementById('btn-register-text');

  /**
   * Submits applicant registration request.
   * @param {Event} e
   */
  async function handleRegister(e) {
    e.preventDefault();

    const validation = validateForm(form);
    if (!validation.isValid) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (inputPass.value !== inputConfirm.value) {
      showToast('Passwords do not match.', 'error');
      inputConfirm.classList.add('form-group__input--error');
      return;
    }

    if (inputPass.value.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    btnSubmit.disabled = true;
    btnText.textContent = 'Creating account...';

    try {
      const payload = {
        full_name: inputName.value.trim(),
        email: inputEmail.value.trim().toLowerCase(),
        phone: inputPhone.value.trim(),
        password: inputPass.value
      };

      const response = await apiPost('/auth/applicant/register/', payload);

      setAuthToken(response.data.access_token, response.data.refresh_token);
      localStorage.setItem('nbsc_user', JSON.stringify(response.data.user));

      showToast('Registration successful! Welcome to NBSC PRIME-HRM.', 'success', 2000);

      setTimeout(() => {
        window.location.href = '../../applicants/applicant-portal/applicant-portal.html';
      }, 800);

    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = 'Complete Registration';
    }
  }

  if (form) {
    form.addEventListener('submit', handleRegister);
  }
});
