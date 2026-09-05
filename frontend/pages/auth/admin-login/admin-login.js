/**
 * NBSC PRIME-HRM Intelligence Hub — Staff Login Logic
 * Handles staff sign-in, demo role quick-fill, and 2FA flow transitions.
 * Uses NbscDB frontend-only authentication (no backend API required).
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated and not applicant, redirect directly to dashboard
  if (isAuthenticated() && getUserRole() !== ROLES.APPLICANT) {
    window.location.href = '../../dashboard/dashboard/dashboard.html';
    return;
  }

  // Cache DOM elements
  const loginForm = document.getElementById('form-admin-login');
  const inputEmail = document.getElementById('input-email');
  const inputPassword = document.getElementById('input-password');
  const btnSubmit = document.getElementById('btn-submit-login');
  const btnLoginText = document.getElementById('btn-login-text');
  const btnTogglePassword = document.getElementById('btn-toggle-password');

  const btnDemoAdmin = document.getElementById('btn-demo-admin');
  const btnDemoHrmpsb = document.getElementById('btn-demo-hrmpsb');
  const btnDemoDeptHead = document.getElementById('btn-demo-depthead');

  const heroBtnApplicant = document.getElementById('hero-btn-applicant-portal');
  const linkApplicantPortal = document.getElementById('link-applicant-portal');

  // Page Transition Animation to Applicant Portal
  const triggerApplicantTransition = (e, href) => {
    e.preventDefault();
    document.body.classList.add('page-exit-to-applicant');
    setTimeout(() => {
      window.location.href = href;
    }, 220);
  };

  if (heroBtnApplicant) {
    heroBtnApplicant.addEventListener('click', (e) => triggerApplicantTransition(e, '../applicant-login/applicant-login.html'));
  }
  if (linkApplicantPortal) {
    linkApplicantPortal.addEventListener('click', (e) => triggerApplicantTransition(e, '../applicant-login/applicant-login.html'));
  }

  /**
   * Toggles password masking state between text and password.
   */
  function togglePasswordVisibility() {
    if (inputPassword.type === 'password') {
      inputPassword.type = 'text';
      btnTogglePassword.innerHTML = '&#128064;';
    } else {
      inputPassword.type = 'password';
      btnTogglePassword.innerHTML = '&#128065;';
    }
  }

  if (btnTogglePassword) {
    btnTogglePassword.addEventListener('click', togglePasswordVisibility);
  }

  /**
   * Fills demo account credentials for easy evaluator testing.
   * @param {'admin'|'hrmpsb'|'depthead'} roleKey
   */
  function fillDemoCredentials(roleKey) {
    const demoAccounts = {
      admin: { email: 'admin@nbsc.edu.ph', password: 'AdminPassword123!' },
      hrmpsb: { email: 'hrmpsb@nbsc.edu.ph', password: 'MemberPassword123!' },
      depthead: { email: 'depthead.ics@nbsc.edu.ph', password: 'DeptPassword123!' }
    };

    const target = demoAccounts[roleKey];
    if (target) {
      inputEmail.value = target.email;
      inputPassword.value = target.password;
      showToast(`Filled credentials for ${roleKey.toUpperCase()}`, 'info', 2000);
    }
  }

  if (btnDemoAdmin) {
    btnDemoAdmin.addEventListener('click', () => fillDemoCredentials('admin'));
  }
  if (btnDemoHrmpsb) {
    btnDemoHrmpsb.addEventListener('click', () => fillDemoCredentials('hrmpsb'));
  }
  if (btnDemoDeptHead) {
    btnDemoDeptHead.addEventListener('click', () => fillDemoCredentials('depthead'));
  }

  /**
   * Authenticates staff credentials using the frontend NbscDB data store.
   * No backend API call required — validates directly against localStorage.
   * @param {Event} e - Form submit event
   */
  function handleAdminLogin(e) {
    e.preventDefault();

    const validation = validateForm(loginForm);
    if (!validation.isValid) {
      showToast('Please provide both email and password.', 'error');
      return;
    }

    const email = inputEmail.value.trim();
    const password = inputPassword.value;

    btnSubmit.disabled = true;
    btnLoginText.textContent = 'Authenticating...';

    // Simulate brief network delay for realistic UX
    setTimeout(() => {
      const result = db.authenticate(email, password);

      if (!result.success) {
        showToast(result.error || 'Login failed. Please check your credentials.', 'error');
        btnSubmit.disabled = false;
        btnLoginText.textContent = 'Sign In to Workspace';
        return;
      }

      if (result.data && result.data.requires_2fa) {
        // Redirect to 2FA challenge page with temporary token
        sessionStorage.setItem('nbsc_temp_2fa_token', result.data.temp_token);
        window.location.href = '../verify-2fa/verify-2fa.html';
        return;
      }

      // Store tokens & user session
      setAuthToken(result.data.access_token, result.data.refresh_token);
      localStorage.setItem('nbsc_user', JSON.stringify(result.data.user));

      showToast(`Welcome back, ${result.data.user.full_name}!`, 'success', 1500);

      setTimeout(() => {
        window.location.href = '../../dashboard/dashboard/dashboard.html';
      }, 700);

    }, 400); // 400ms simulated delay
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
  }
});
