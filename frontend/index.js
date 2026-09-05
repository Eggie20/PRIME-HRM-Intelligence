/**
 * NBSC PRIME-HRM Intelligence Hub — Landing Page Logic
 * Smooth scroll navigation, active state highlights, and session-aware CTAs.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If user is already logged in, update top buttons
  if (isAuthenticated()) {
    const userRole = getUserRole();
    const btnStaff = document.getElementById('btn-portal-staff');
    const heroBtnAdmin = document.getElementById('hero-btn-admin');

    const targetUrl = userRole === ROLES.APPLICANT
      ? 'pages/applicants/applicant-portal/applicant-portal.html'
      : 'pages/dashboard/dashboard/dashboard.html';

    const label = userRole === ROLES.APPLICANT
      ? 'Open Applicant Dashboard'
      : 'Open HR Command Center';

    if (btnStaff) {
      btnStaff.textContent = label + ' →';
      btnStaff.href = targetUrl;
    }
    if (heroBtnAdmin) {
      heroBtnAdmin.textContent = label;
      heroBtnAdmin.href = targetUrl;
    }
  }

  // Mobile Navigation Drawer Toggle
  const navToggle = document.getElementById('nav-toggle-btn');
  const navLinks = document.getElementById('public-nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth scroll for nav anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
