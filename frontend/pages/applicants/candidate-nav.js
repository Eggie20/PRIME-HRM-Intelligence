/**
 * NBSC Candidate Portal — Shared Navigation & User Dropdown Logic
 * File: candidate-nav.js
 * Controls user dropdown menu, click-outside dismiss, escape key dismiss,
 * mobile drawer toggle, and unified sign-out handling across candidate views.
 */

(function () {
  function initCandidateNav() {
    // 1. User Dropdown Toggle
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    const userDropdownContainer = document.getElementById('user-dropdown-container');

    if (userMenuBtn && userDropdownMenu) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = userDropdownMenu.classList.toggle('is-open');
        userMenuBtn.classList.toggle('is-active', isOpen);
        userMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (userDropdownContainer && !userDropdownContainer.contains(e.target)) {
          userDropdownMenu.classList.remove('is-open');
          userMenuBtn.classList.remove('is-active');
          userMenuBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && userDropdownMenu.classList.contains('is-open')) {
          userDropdownMenu.classList.remove('is-open');
          userMenuBtn.classList.remove('is-active');
          userMenuBtn.setAttribute('aria-expanded', 'false');
          userMenuBtn.focus();
        }
      });
    }

    // 2. Mobile Navigation Drawer Toggle
    const navToggleBtn = document.getElementById('nav-toggle-btn');
    const mobileDrawer = document.getElementById('topbar-mobile-drawer');
    if (navToggleBtn && mobileDrawer) {
      if (!navToggleBtn.dataset.candidateNavBound) {
        navToggleBtn.dataset.candidateNavBound = 'true';
        navToggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = mobileDrawer.classList.toggle('is-open');
          navToggleBtn.classList.toggle('is-active', isOpen);
          navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close mobile drawer on outside click
        document.addEventListener('click', (e) => {
          if (!navToggleBtn.contains(e.target) && !mobileDrawer.contains(e.target)) {
            mobileDrawer.classList.remove('is-open');
            navToggleBtn.classList.remove('is-active');
            navToggleBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
            mobileDrawer.classList.remove('is-open');
            navToggleBtn.classList.remove('is-active');
            navToggleBtn.setAttribute('aria-expanded', 'false');
            navToggleBtn.focus();
          }
        });
      }
    }

    // 3. Unified Sign-Out Handler
    function handleCandidateSignOut(e) {
      if (e) e.preventDefault();
      if (confirm('Are you sure you want to sign out of the Candidate Portal?')) {
        if (typeof logout === 'function') {
          logout('../../auth/applicant-login/applicant-login.html');
        } else {
          localStorage.removeItem('nbsc_access_token');
          localStorage.removeItem('nbsc_user');
          window.location.href = '../../auth/applicant-login/applicant-login.html';
        }
      }
    }

    const btnLogout = document.getElementById('btn-applicant-logout');
    if (btnLogout && !btnLogout.dataset.candidateNavBound) {
      btnLogout.dataset.candidateNavBound = 'true';
      btnLogout.addEventListener('click', handleCandidateSignOut);
    }

    const btnMobileLogout = document.getElementById('btn-mobile-logout');
    if (btnMobileLogout && !btnMobileLogout.dataset.candidateNavBound) {
      btnMobileLogout.dataset.candidateNavBound = 'true';
      btnMobileLogout.addEventListener('click', handleCandidateSignOut);
    }

    // 4. Sync profile information from DB or localStorage if present
    const defaultName = 'Carlo D. Mendoza';
    const defaultId = 'APP-2026-00417';
    const defaultEmail = 'carlo.mendoza@email.com';

    let applicantName = defaultName;
    let applicantId = defaultId;
    let applicantEmail = defaultEmail;

    if (typeof getUser === 'function') {
      const u = getUser();
      if (u?.name) applicantName = u.name;
      if (u?.email) applicantEmail = u.email;
      if (u?.applicant_id) applicantId = u.applicant_id;
    } else {
      try {
        const stored = localStorage.getItem('nbsc_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name) applicantName = parsed.name;
          if (parsed.email) applicantEmail = parsed.email;
          if (parsed.applicant_id) applicantId = parsed.applicant_id;
        }
      } catch (err) {
        // fallback to default
      }
    }

    // Compute initials
    const nameParts = applicantName.split(' ').filter(Boolean);
    const initials = (nameParts.length >= 2 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]) : (nameParts[0]?.[0] || 'C')).toUpperCase();

    const setContent = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setContent('nav-avatar', initials);
    setContent('nav-username', applicantName);
    setContent('dropdown-avatar', initials);
    setContent('dropdown-username', applicantName);
    setContent('dropdown-useremail', applicantEmail);
    setContent('mobile-avatar', initials);
    setContent('mobile-username', applicantName);

    const dropdownRole = document.getElementById('dropdown-userrole');
    if (dropdownRole) dropdownRole.textContent = `Applicant • ${applicantId}`;

    // 5. Dynamic Active Link Synchronization
    try {
      const path = window.location.pathname.toLowerCase();
      let currentKey = '';
      if (path.includes('applicant-portal')) currentKey = 'portal';
      else if (path.includes('open-positions')) currentKey = 'positions';
      else if (path.includes('application-track')) currentKey = 'track';
      else if (path.includes('profile-settings')) currentKey = 'settings';

      if (currentKey) {
        const matchMap = {
          portal: ['applicant-portal.html'],
          positions: ['open-positions.html'],
          track: ['application-track.html'],
          settings: ['profile-settings.html']
        };
        const targets = matchMap[currentKey] || [];

        // Sync dropdown items
        document.querySelectorAll('.dropdown-item').forEach(el => {
          const href = (el.getAttribute('href') || '').toLowerCase();
          const matches = targets.some(t => href.includes(t));
          el.classList.toggle('active', matches);
        });

        // Sync mobile navlinks
        document.querySelectorAll('.mobile-navlink').forEach(el => {
          const href = (el.getAttribute('href') || '').toLowerCase();
          const matches = targets.some(t => href.includes(t));
          el.classList.toggle('active', matches);
        });

        // Sync desktop topnav links
        document.querySelectorAll('.topnav .navlink').forEach(el => {
          const href = (el.getAttribute('href') || '').toLowerCase();
          const matches = targets.some(t => href.includes(t));
          el.classList.toggle('active', matches);
        });
      }
    } catch (e) {
      // Non-blocking
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCandidateNav);
  } else {
    initCandidateNav();
  }
})();
