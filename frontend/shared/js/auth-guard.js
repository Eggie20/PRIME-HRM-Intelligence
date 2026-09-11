/**
 * NBSC PRIME-HRM Intelligence Hub — Early Auth Guard
 * Executes synchronously in <head> before DOM render to eliminate
 * Flash of Unauthorized Content (FOUC) and split-second admin UI flicker.
 */
(function() {
  try {
    const raw = localStorage.getItem('nbsc_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.role) {
        document.documentElement.setAttribute('data-role', user.role);
        if (user.department_code) {
          document.documentElement.setAttribute('data-dept', user.department_code);
        }
      }
    } else {
      document.documentElement.setAttribute('data-role', 'GUEST');
    }

    // Pre-paint restore of sidebar collapsed state to prevent FOUC
    if (localStorage.getItem('nbsc_sidebar_collapsed') === 'true') {
      document.documentElement.classList.add('sidebar-is-collapsed');
    }
  } catch (e) {
    // Non-blocking fallback
  }
})();
