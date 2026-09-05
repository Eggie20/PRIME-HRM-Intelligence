/**
 * NBSC PRIME-HRM Intelligence Hub — 2FA Verification Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-verify-2fa');
  const inputCode = document.getElementById('input-totp-code');
  const btnSubmit = document.getElementById('btn-submit-verify');
  const btnText = document.getElementById('btn-verify-text');

  const tempToken = sessionStorage.getItem('nbsc_temp_2fa_token');

  // Automatically submit once 6 digits are typed
  inputCode.addEventListener('input', () => {
    inputCode.value = inputCode.value.replace(/\D/g, '');
    if (inputCode.value.length === 6) {
      handle2FASubmit();
    }
  });

  /**
   * Submits 6-digit TOTP code to backend verification endpoint.
   */
  async function handle2FASubmit(e) {
    if (e) e.preventDefault();

    const code = inputCode.value.trim();
    if (!code || code.length !== 6) {
      showToast('Please enter all 6 digits of your authenticator code.', 'error');
      return;
    }

    btnSubmit.disabled = true;
    btnText.textContent = 'Verifying security code...';

    try {
      const response = await apiPost('/auth/2fa/verify/', {
        code,
        temp_token: tempToken
      });

      // Clear temp token
      sessionStorage.removeItem('nbsc_temp_2fa_token');

      // Store authenticated credentials
      setAuthToken(response.data.access_token, response.data.refresh_token);
      localStorage.setItem('nbsc_user', JSON.stringify(response.data.user));

      showToast('Two-factor identity verified successfully!', 'success', 1500);

      setTimeout(() => {
        window.location.href = '../../dashboard/dashboard/dashboard.html';
      }, 600);

    } catch (err) {
      showToast(err.message || 'Invalid or expired 2FA code. Please try again.', 'error');
      inputCode.value = '';
      inputCode.focus();
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = 'Authenticate Session';
    }
  }

  if (form) {
    form.addEventListener('submit', handle2FASubmit);
  }
});
