/**
 * NBSC PRIME-HRM Intelligence Hub — Auth Module
 * Session validation, role-based route guards, and session state.
 * Uses NbscDB localStorage backend (no JWT decoding needed).
 */

/**
 * Checks if the user has a valid, non-expired session.
 * Validates the stored access token against the sessions table.
 * @returns {boolean}
 */
/**
 * Resolves a frontend path relative to current location, supporting file:/// and http(s)://.
 * @param {string} targetRelativePath - Path relative to frontend/ (e.g. 'pages/auth/admin-login/admin-login.html')
 * @returns {string}
 */
function resolveFrontendPath(targetRelativePath) {
  const cleanPath = targetRelativePath.startsWith('/') ? targetRelativePath.slice(1) : targetRelativePath;
  const currentPath = (window.location.pathname || '').replace(/\\/g, '/');

  if (window.location.protocol === 'file:') {
    const idx = currentPath.indexOf('/frontend/');
    if (idx !== -1) {
      return currentPath.substring(0, idx + '/frontend/'.length) + cleanPath;
    }
  }

  if (currentPath.includes('/pages/')) {
    const parts = currentPath.split('/pages/')[1].split('/');
    const depth = parts.length - 1;
    const prefix = depth > 0 ? '../'.repeat(depth) : './';
    return cleanPath.startsWith('pages/') ? prefix + cleanPath.replace(/^pages\//, '') : prefix + cleanPath;
  }

  return '/' + cleanPath;
}

/**
 * Checks if the user has a valid, non-expired session.
 * Validates the stored access token against the sessions table.
 * @returns {boolean}
 */
function isAuthenticated() {
  const token = localStorage.getItem('nbsc_access_token');
  if (!token) return false;

  // Validate against DB sessions table
  if (typeof db !== 'undefined' && db.validateSession) {
    const user = db.validateSession(token);
    return user !== null;
  }
  return localStorage.getItem('nbsc_user') !== null;
}

/**
 * Retrieves the currently logged-in user profile.
 * First checks the stored user JSON, then falls back to session token lookup.
 * @returns {Object|null}
 */
function getUser() {
  // Fast path: check stored user profile
  const raw = localStorage.getItem('nbsc_user');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }

  // Fallback: resolve from session token via DB
  const token = localStorage.getItem('nbsc_access_token');
  if (token && typeof db !== 'undefined' && db.validateSession) {
    const user = db.validateSession(token);
    if (user) {
      // Cache it for subsequent calls
      localStorage.setItem('nbsc_user', JSON.stringify(user));
      return user;
    }
  }

  return null;
}

/**
 * Returns the current user's role (e.g. HR_ADMIN, APPLICANT).
 * @returns {string|null}
 */
function getUserRole() {
  const user = getUser();
  return user ? user.role : null;
}

/**
 * Returns current user's ID.
 * @returns {string|null}
 */
function getUserId() {
  const user = getUser();
  return user ? user.id : null;
}

/**
 * Route protection guard: validates auth & role, redirects to login if unauthorized.
 * @param {Array<string>} [allowedRoles] - Optional list of authorized roles
 * @param {string} [redirectUrl] - Fallback redirect path
 */
function requireAuth(allowedRoles = [], redirectUrl = null) {
  const targetLogin = redirectUrl || resolveFrontendPath('pages/auth/admin-login/admin-login.html');

  if (!isAuthenticated()) {
    clearAuth();
    window.location.href = targetLogin;
    return;
  }

  if (allowedRoles.length > 0) {
    const role = getUserRole();
    if (!allowedRoles.includes(role)) {
      alert('Access denied. You do not have permission to view this page.');
      // Redirect to appropriate landing depending on role
      if (typeof ROLES !== 'undefined' && role === ROLES.APPLICANT) {
        window.location.href = resolveFrontendPath('pages/applicants/applicant-portal/applicant-portal.html');
      } else {
        window.location.href = resolveFrontendPath('pages/dashboard/dashboard/dashboard.html');
      }
    }
  }
}

/**
 * Signs out current user and redirects to login.
 * Destroys the session in the DB and clears localStorage.
 * @param {string} [redirectTo]
 */
function logout(redirectTo = null) {
  // Destroy session in DB
  const token = localStorage.getItem('nbsc_access_token');
  if (token && typeof db !== 'undefined' && db.destroySession) {
    db.destroySession(token);
  }
  clearAuth();
  const target = redirectTo
    ? (redirectTo.startsWith('/') && window.location.protocol === 'file:' ? resolveFrontendPath(redirectTo) : redirectTo)
    : resolveFrontendPath('pages/auth/admin-login/admin-login.html');
  window.location.href = target;
}

/**
 * Checks if the current user has at least one of the specified roles.
 * @param {Array<string>|string} allowedRoles
 * @returns {boolean}
 */
function hasPermission(allowedRoles) {
  const role = getUserRole();
  if (!role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return rolesArray.includes(role);
}

/**
 * Initializes and dynamically adapts the sidebar navigation according to the active user role.
 * Updates user profile badge, initials, and toggles nav links and section headers.
 */
function initAppNavigation() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  const user = getUser();
  const role = getUserRole() || (user ? user.role : null);

  // Update User Profile Footer in Sidebar
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-display-role');
  const avatarEl = document.getElementById('user-avatar');

  if (user) {
    if (nameEl) nameEl.textContent = user.full_name || 'Staff User';
    if (roleEl) {
      if (typeof ROLE_LABELS !== 'undefined' && ROLE_LABELS[role]) {
        roleEl.textContent = ROLE_LABELS[role];
      } else {
        roleEl.textContent = role || 'Staff';
      }
    }
    if (avatarEl) {
      const parts = (user.full_name || 'User').trim().split(/\s+/);
      const initials = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
      avatarEl.textContent = initials;
    }
  }

  // Attach Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout && !btnLogout.dataset.boundLogout) {
    btnLogout.dataset.boundLogout = 'true';
    btnLogout.addEventListener('click', () => logout());
  }

  // Apply Role-Based Navigation Filtering
  if (typeof NAV_PERMISSIONS !== 'undefined' && role) {
    const alwaysVisibleCoreLinks = ['nav-dashboard', 'nav-employees', 'nav-programs', 'nav-vacancies', 'nav-hiring-pipeline'];
    Object.keys(NAV_PERMISSIONS).forEach(navId => {
      const linkEl = document.getElementById(navId);
      if (linkEl) {
        if (alwaysVisibleCoreLinks.includes(navId)) {
          linkEl.style.display = '';
          return;
        }
        const allowed = NAV_PERMISSIONS[navId];
        if (allowed.includes(role)) {
          linkEl.style.display = '';
        } else {
          linkEl.style.display = 'none';
        }
      }
    });

    // Role-specific label adjustments for personalized clarity
    if (role === 'DEPT_HEAD') {
      const empLabel = document.querySelector('#nav-employees .sidebar__link-content span:last-child');
      if (empLabel) empLabel.textContent = 'Department Staff';
      const progLabel = document.querySelector('#nav-programs .sidebar__link-content span:last-child');
      if (progLabel) progLabel.textContent = 'Institute Programs';
      const vacLabel = document.querySelector('#nav-vacancies .sidebar__link-content span:last-child');
      if (vacLabel) vacLabel.textContent = 'Unit Vacancies';
    } else if (role === 'HRMPSB_MEMBER') {
      const empLabel = document.querySelector('#nav-employees .sidebar__link-content span:last-child');
      if (empLabel) empLabel.textContent = 'Staff Directory';
    }

    // Hide section titles whose sibling links are completely hidden
    const navContainer = sidebar.querySelector('.sidebar__nav');
    if (navContainer) {
      const sectionTitles = navContainer.querySelectorAll('.sidebar__section-title');
      sectionTitles.forEach(title => {
        let sibling = title.nextElementSibling;
        let hasVisibleChild = false;
        while (sibling && !sibling.classList.contains('sidebar__section-title')) {
          if (sibling.classList.contains('sidebar__link') && sibling.style.display !== 'none') {
            hasVisibleChild = true;
            break;
          }
          sibling = sibling.nextElementSibling;
        }
        title.style.display = hasVisibleChild ? '' : 'none';
      });
    }
  }

  // Signal that auth & navigation state is ready to smoothly reveal user details
  document.documentElement.setAttribute('data-auth-ready', 'true');
  if (role) {
    document.documentElement.setAttribute('data-role', role);
  }
}

// Auto-run navigation initialization when DOM is loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppNavigation);
  } else {
    initAppNavigation();
  }
}
