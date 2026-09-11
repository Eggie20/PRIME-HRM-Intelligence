/**
 * NBSC PRIME-HRM Intelligence Hub — Applicant Login Logic
 * Authenticates job applicants via Email + Official Application Tracking Number (Passwordless).
 * Handles docket recovery modal, demo quick-fill, and transitions to Staff Portal.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof isAuthenticated === 'function' && isAuthenticated() && getUserRole() === ROLES.APPLICANT) {
    window.location.href = '../../applicants/applicant-portal/applicant-portal.html';
    return;
  }

  // Form & Inputs
  const form = document.getElementById('form-applicant-login');
  const inputEmail = document.getElementById('input-applicant-email');
  const inputTracking = document.getElementById('input-applicant-tracking');
  const errorTracking = document.getElementById('input-applicant-tracking-error');
  const errorEmail = document.getElementById('input-applicant-email-error');
  const btnSubmit = document.getElementById('btn-submit-applicant-login');
  const btnText = document.getElementById('btn-applicant-login-text');
  const btnDemoApplicant = document.getElementById('btn-demo-applicant');

  // Staff Portal Transition
  const linkStaffPortal = document.getElementById('link-staff-portal');
  const heroBtnStaff = document.getElementById('hero-btn-staff-portal');

  // Recovery Modal Elements
  const linkForgotTracking = document.getElementById('link-forgot-tracking');
  const modalForgot = document.getElementById('modal-forgot-tracking');
  const btnCloseRecovery = document.getElementById('btn-close-recovery-modal');
  const btnCancelRecovery = document.getElementById('btn-cancel-recovery');
  const formRecovery = document.getElementById('form-recovery-tracking');
  const inputRecoveryEmail = document.getElementById('input-recovery-email');
  const errorRecoveryEmail = document.getElementById('recovery-email-error');
  const btnFillRecoveryDemo = document.getElementById('btn-fill-recovery-demo');
  const recoveryResultBox = document.getElementById('recovery-result-box');
  const btnSubmitRecovery = document.getElementById('btn-submit-recovery');
  const btnRecoveryText = document.getElementById('btn-recovery-text');

  // Page Transition Animation to Staff Portal
  const triggerStaffTransition = (e, href) => {
    e.preventDefault();
    document.body.classList.add('page-exit-to-staff');
    setTimeout(() => {
      window.location.href = href;
    }, 220);
  };

  if (heroBtnStaff) {
    heroBtnStaff.addEventListener('click', (e) => triggerStaffTransition(e, '../admin-login/admin-login.html'));
  }
  if (linkStaffPortal) {
    linkStaffPortal.addEventListener('click', (e) => triggerStaffTransition(e, '../admin-login/admin-login.html'));
  }

  // Quick Demo Access (Carlo Mendoza with Active Faculty Application Docket)
  if (btnDemoApplicant) {
    btnDemoApplicant.addEventListener('click', () => {
      if (inputEmail) inputEmail.value = 'applicant@gmail.com';
      if (inputTracking) inputTracking.value = 'NBSC-APP-2026-10001';
      if (errorEmail) errorEmail.textContent = '';
      if (errorTracking) errorTracking.textContent = '';
      if (typeof showToast === 'function') {
        showToast('Loaded Carlo Mendoza demo docket: NBSC-APP-2026-10001', 'info', 2500);
      }
    });
  }

  // Auto-uppercase formatting on Tracking Number input
  if (inputTracking) {
    inputTracking.addEventListener('input', () => {
      inputTracking.value = inputTracking.value.toUpperCase();
      if (errorTracking) errorTracking.textContent = '';
    });
  }

  if (inputEmail) {
    inputEmail.addEventListener('input', () => {
      if (errorEmail) errorEmail.textContent = '';
    });
  }

  /**
   * Submits applicant credentials (Email + Tracking Number).
   * @param {Event} e
   */
  async function handleApplicantLogin(e) {
    e.preventDefault();

    const email = inputEmail ? inputEmail.value.trim() : '';
    const tracking = inputTracking ? inputTracking.value.trim().toUpperCase() : '';

    let hasError = false;
    if (!email) {
      if (errorEmail) errorEmail.textContent = 'Please enter your registered email address.';
      hasError = true;
    }
    if (!tracking) {
      if (errorTracking) errorTracking.textContent = 'Please enter your application tracking number.';
      hasError = true;
    }

    if (hasError) {
      if (typeof showToast === 'function') {
        showToast('Please provide both your registered email and tracking number.', 'error');
      }
      return;
    }

    btnSubmit.disabled = true;
    if (btnText) btnText.textContent = 'Verifying tracking number...';

    try {
      let response;

      // 1. Try dedicated tracking auth helper
      if (typeof apiApplicantLoginByTracking === 'function') {
        response = await apiApplicantLoginByTracking(email, tracking);
      } else if (typeof db !== 'undefined' && db.authenticateApplicantByTracking) {
        response = db.authenticateApplicantByTracking(email, tracking);
      } else {
        // Direct backend POST fallback
        response = await apiPost('/auth/applicant/login-tracking/', {
          email,
          tracking_number: tracking
        });
      }

      if (!response || !response.success) {
        throw new Error((response && response.error) || 'Invalid tracking number or email address.');
      }

      // Save tokens and session
      if (typeof setAuthToken === 'function' && response.data?.access_token) {
        setAuthToken(response.data.access_token, response.data.refresh_token || 'mock-refresh');
      }

      const user = response.data?.user || {
        full_name: 'Carlo Mendoza',
        name: 'Carlo Mendoza',
        role: 'APPLICANT',
        email: email,
        tracking_number: tracking
      };

      localStorage.setItem('nbsc_user', JSON.stringify(user));
      localStorage.setItem('nbsc_active_tracking', tracking);

      if (typeof showToast === 'function') {
        showToast(`Welcome back, ${user.full_name || 'Applicant'}! Redirecting to Candidate Portal...`, 'success', 1500);
      }

      setTimeout(() => {
        window.location.href = '../../applicants/applicant-portal/applicant-portal.html';
      }, 500);

    } catch (err) {
      const errMsg = err.message || 'Verification failed. Application not found for this email.';
      if (errorTracking) errorTracking.textContent = errMsg;
      if (typeof showToast === 'function') {
        showToast(errMsg, 'error');
      }
    } finally {
      btnSubmit.disabled = false;
      if (btnText) btnText.textContent = 'Sign In to Application Tracker';
    }
  }

  if (form) {
    form.addEventListener('submit', handleApplicantLogin);
  }

  // ═══════════════════════════════════════════════════════════
  // RECOVERY MODAL HANDLERS ("Forgot your tracking number?")
  // ═══════════════════════════════════════════════════════════

  const openRecoveryModal = () => {
    if (!modalForgot) return;
    modalForgot.classList.add('is-open');
    modalForgot.setAttribute('aria-hidden', 'false');
    if (recoveryResultBox) {
      recoveryResultBox.style.display = 'none';
      recoveryResultBox.innerHTML = '';
    }
    if (errorRecoveryEmail) errorRecoveryEmail.textContent = '';
    if (inputRecoveryEmail) {
      // Pre-fill if already entered in login form
      if (inputEmail && inputEmail.value) {
        inputRecoveryEmail.value = inputEmail.value.trim();
      }
      setTimeout(() => inputRecoveryEmail.focus(), 100);
    }
  };

  const closeRecoveryModal = () => {
    if (!modalForgot) return;
    modalForgot.classList.remove('is-open');
    modalForgot.setAttribute('aria-hidden', 'true');
  };

  if (linkForgotTracking) {
    linkForgotTracking.addEventListener('click', (e) => {
      e.preventDefault();
      openRecoveryModal();
    });
  }

  if (btnCloseRecovery) {
    btnCloseRecovery.addEventListener('click', closeRecoveryModal);
  }

  if (btnCancelRecovery) {
    btnCancelRecovery.addEventListener('click', closeRecoveryModal);
  }

  // Close when clicking outside card or pressing Escape
  if (modalForgot) {
    modalForgot.addEventListener('click', (e) => {
      if (e.target === modalForgot) closeRecoveryModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalForgot.classList.contains('is-open')) {
        closeRecoveryModal();
      }
    });
  }

  // Quick-fill demo email inside recovery modal
  if (btnFillRecoveryDemo && inputRecoveryEmail) {
    btnFillRecoveryDemo.addEventListener('click', () => {
      inputRecoveryEmail.value = 'applicant@gmail.com';
      if (errorRecoveryEmail) errorRecoveryEmail.textContent = '';
      inputRecoveryEmail.focus();
    });
  }

  // Handle Recovery Form Submit
  if (formRecovery) {
    formRecovery.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = inputRecoveryEmail ? inputRecoveryEmail.value.trim() : '';

      if (!email) {
        if (errorRecoveryEmail) errorRecoveryEmail.textContent = 'Please enter your registered email address.';
        return;
      }
      if (errorRecoveryEmail) errorRecoveryEmail.textContent = '';

      if (btnSubmitRecovery) btnSubmitRecovery.disabled = true;
      if (btnRecoveryText) btnRecoveryText.textContent = 'Searching records...';

      try {
        let result;
        if (typeof apiRecoverTrackingNumber === 'function') {
          result = await apiRecoverTrackingNumber(email);
        } else if (typeof db !== 'undefined' && db.lookupTrackingNumbersByEmail) {
          result = db.lookupTrackingNumbersByEmail(email);
        } else {
          result = { success: false, count: 0, dockets: [] };
        }

        if (recoveryResultBox) {
          recoveryResultBox.style.display = 'block';

          if (result && result.success && result.count > 0) {
            recoveryResultBox.className = 'recovery-result-box recovery-result-box--success';
            recoveryResultBox.innerHTML = `
              <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 700; margin-bottom: 0.25rem;">
                <span style="color: #059669; font-size: 1.1rem;">✓</span>
                <span>Active Application Found (${result.count})</span>
              </div>
              <p style="font-size: 0.8rem; margin: 0 0 0.65rem 0; opacity: 0.92;">
                Confirmation dispatched to <strong>${escapeHtml(email)}</strong>. You can copy or immediately use your tracking number below:
              </p>
              <div class="recovery-dockets-list">
                ${result.dockets.map(d => `
                  <div class="recovery-docket-item">
                    <div>
                      <span class="recovery-docket-code">${escapeHtml(d.tracking_number)}</span>
                      <span style="font-size: 0.72rem; color: #64748B; margin-left: 0.4rem;">(${escapeHtml(d.stage)})</span>
                    </div>
                    <button type="button" class="btn-use-docket" data-tracking="${escapeHtml(d.tracking_number)}">
                      Use This Code &rarr;
                    </button>
                  </div>
                `).join('')}
              </div>
            `;

            // Attach click listeners to "Use This Code" buttons
            recoveryResultBox.querySelectorAll('.btn-use-docket').forEach(btn => {
              btn.addEventListener('click', (ev) => {
                const code = ev.currentTarget.getAttribute('data-tracking');
                if (inputEmail) inputEmail.value = email;
                if (inputTracking) inputTracking.value = code;
                closeRecoveryModal();
                if (typeof showToast === 'function') {
                  showToast(`Tracking code ${code} inserted! Click Sign In to proceed.`, 'info', 3000);
                }
              });
            });

            if (typeof showToast === 'function') {
              showToast(`Tracking number sent to ${email}!`, 'success');
            }

          } else {
            recoveryResultBox.className = 'recovery-result-box recovery-result-box--empty';
            recoveryResultBox.innerHTML = `
              <div style="font-weight: 700; margin-bottom: 0.2rem;">No active application found for this email.</div>
              <p style="font-size: 0.8rem; margin: 0; line-height: 1.45;">
                Please verify the email spelling or visit <a href="../../vacancies/job-board/job-board.html" style="color: #92400E; font-weight: 700; text-decoration: underline;">Open Vacancies</a> to submit a new application.
              </p>
            `;
          }
        }
      } catch (err) {
        if (recoveryResultBox) {
          recoveryResultBox.style.display = 'block';
          recoveryResultBox.className = 'recovery-result-box recovery-result-box--empty';
          recoveryResultBox.innerHTML = `Error checking records: ${escapeHtml(err.message || 'Please try again.')}`;
        }
      } finally {
        if (btnSubmitRecovery) btnSubmitRecovery.disabled = false;
        if (btnRecoveryText) btnRecoveryText.textContent = 'Send Tracking Number';
      }
    });
  }
});
