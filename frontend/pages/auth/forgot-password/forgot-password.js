/**
 * NBSC PRIME-HRM Intelligence Hub — Forgot Password Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-forgot-password');
  const inputEmail = document.getElementById('input-reset-email');
  const btnSubmit = document.getElementById('btn-submit-reset');
  const btnText = document.getElementById('btn-reset-text');
  const successBox = document.getElementById('reset-success-box');

  /**
   * Submits email to password recovery endpoint.
   * @param {Event} e
   */
  async function handleReset(e) {
    e.preventDefault();
    const email = inputEmail.value.trim();

    if (!email || !validateEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      inputEmail.classList.add('form-group__input--error');
      return;
    }

    btnSubmit.disabled = true;
    btnText.textContent = 'Sending link...';

    // Simulate API dispatch
    setTimeout(() => {
      form.classList.add('d-none');
      successBox.classList.remove('d-none');
      showToast('Password reset link sent!', 'success');
    }, 800);
  }

  if (form) {
    form.addEventListener('submit', handleReset);
  }
});
