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
