/**
 * NBSC PRIME-HRM Intelligence Hub — 2FA Setup Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();

  const qrSpinner = document.getElementById('qr-spinner');
  const qrImage = document.getElementById('qr-image');
  const secretCode = document.getElementById('secret-code');
  const form = document.getElementById('form-verify-setup');
  const inputCode = document.getElementById('input-setup-code');
  const btnSubmit = document.getElementById('btn-submit-setup');
  const btnText = document.getElementById('btn-setup-text');

  /**
   * Fetches QR code data and secret from the 2FA setup endpoint.
   */
  async function load2FASetup() {
    try {
      const response = await apiPost('/auth/2fa/setup/');
      if (response.data) {
        secretCode.textContent = response.data.secret;
        qrImage.src = response.data.qr_code;
        qrSpinner.classList.add('d-none');
        qrImage.classList.remove('d-none');
      }
    } catch (err) {
      showToast('Failed to generate 2FA key. Please try again.', 'error');
    }
  }

  await load2FASetup();

  /**
   * Submits initial verification code.
   * @param {Event} e
   */
  async function handleVerify(e) {
    e.preventDefault();
    const code = inputCode.value.trim();

    if (!code || code.length !== 6) {
      showToast('Please enter a valid 6-digit code.', 'error');
      inputCode.classList.add('form-group__input--error');
      return;
    }

    btnSubmit.disabled = true;
    btnText.textContent = 'Verifying...';

    try {
      const response = await apiPost('/auth/2fa/verify/', { code });
      showToast('Two-Factor Authentication is now enabled on your account!', 'success', 2000);

      setTimeout(() => {
        window.location.href = '../../dashboard/dashboard/dashboard.html';
      }, 800);
    } catch (err) {
      showToast(err.message || 'Invalid code. Check your authenticator app time.', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = 'Verify & Activate 2FA';
    }
  }

  if (form) {
    form.addEventListener('submit', handleVerify);
  }
});
