/**
 * NBSC PRIME-HRM Intelligence Hub — Applicant Login Logic
 * Authenticates job applicants, handles demo quick-access, password toggles,
 * and executes smooth page transition animations when navigating to Staff Portal.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof isAuthenticated === 'function' && isAuthenticated() && getUserRole() === ROLES.APPLICANT) {
    window.location.href = '../../applicants/applicant-portal/applicant-portal.html';
    return;
  }

  const form = document.getElementById('form-applicant-login');
  const inputEmail = document.getElementById('input-applicant-email');
  const inputPassword = document.getElementById('input-applicant-password');
  const btnSubmit = document.getElementById('btn-submit-applicant-login');
  const btnText = document.getElementById('btn-applicant-login-text');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const btnDemoApplicant = document.getElementById('btn-demo-applicant');

  const heroBtnStaff = document.getElementById('hero-btn-staff-portal');
  const linkStaffPortal = document.getElementById('link-staff-portal');

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

  // Quick Demo Access (Carlo Mendoza)
  if (btnDemoApplicant) {
    btnDemoApplicant.addEventListener('click', () => {
      if (inputEmail) inputEmail.value = 'applicant@gmail.com';
      if (inputPassword) inputPassword.value = 'ApplicantPass123!';
      showToast('Demo applicant credentials loaded: Carlo Mendoza', 'info', 2000);
    });
  }

  // Password Visibility Toggle
  if (btnTogglePassword && inputPassword) {
    btnTogglePassword.addEventListener('click', () => {
      const isPassword = inputPassword.getAttribute('type') === 'password';
      inputPassword.setAttribute('type', isPassword ? 'text' : 'password');
      btnTogglePassword.innerHTML = isPassword ? '&#128584;' : '&#128065;';
      btnTogglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  /**
   * Submits applicant credentials.
   * @param {Event} e
   */
  async function handleApplicantLogin(e) {
    e.preventDefault();

    const email = inputEmail.value.trim();
    const password = inputPassword.value;

    if (!email || !password) {
      showToast('Please enter both your email address and password.', 'error');
      return;
    }

    btnSubmit.disabled = true;
    if (btnText) btnText.textContent = 'Verifying credentials...';

    try {
      let response;
      if (typeof apiLoginLocal === 'function') {
        const result = await apiLoginLocal(email, password);
        if (!result.success) {
          throw new Error(result.error || 'Invalid applicant email or password.');
        }
        response = result;
      } else if (typeof db !== 'undefined' && db.authenticate) {
        const result = db.authenticate(email, password);
        if (!result.success) {
          throw new Error(result.error || 'Invalid applicant email or password.');
        }
        response = result;
      } else {
        response = await apiPost('/auth/applicant/login/', { email, password });
      }

      if (typeof setAuthToken === 'function') {
        setAuthToken(response.data?.access_token || 'mock-token', response.data?.refresh_token || 'mock-refresh');
      }
      localStorage.setItem('nbsc_user', JSON.stringify(response.data?.user || { full_name: 'Carlo Mendoza', role: 'APPLICANT', email }));

      showToast(`Welcome, ${response.data?.user?.full_name || 'Applicant'}! Redirecting...`, 'success', 1500);

      setTimeout(() => {
        window.location.href = '../../applicants/applicant-portal/applicant-portal.html';
      }, 600);

    } catch (err) {
      showToast(err.message || 'Login failed. Invalid applicant email or password.', 'error');
    } finally {
      btnSubmit.disabled = false;
      if (btnText) btnText.textContent = 'Sign In to Application Tracker';
    }
  }

  if (form) {
    form.addEventListener('submit', handleApplicantLogin);
  }
});
