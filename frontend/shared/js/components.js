/**
 * NBSC PRIME-HRM Intelligence Hub — Reusable DOM Component Builders
 * Toast alerts, confirmation modals, pagination bars, spinners, and timeline bars.
 */

/**
 * Ensures the global toast container exists on document.body.
 * @returns {HTMLElement}
 */
function getOrCreateToastContainer() {
  let container = document.getElementById('global-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'global-toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Displays a toast notification on the top right.
 * @param {string} message - Text or HTML content
 * @param {'success'|'error'|'info'|'warning'} [type='info'] - Toast variant
 * @param {number} [duration=3500] - Duration in ms before auto-dismiss
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');

  const textSpan = document.createElement('span');
  textSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'inherit';
  closeBtn.style.fontSize = '1.25rem';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.lineHeight = '1';
  closeBtn.onclick = () => toast.remove();

  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
}

/**
 * Displays a modal dialog with custom title, content, and confirm action.
 * @param {string} title - Header text
 * @param {string} bodyHtml - Content HTML string
 * @param {string} [confirmLabel='Confirm'] - Action button text
 * @param {Function} [onConfirm] - Callback on action click
 * @param {string} [cancelLabel='Cancel'] - Cancel button text
 */
function showModal(title, bodyHtml, confirmLabel = 'Confirm', onConfirm = null, cancelLabel = 'Cancel') {
  let modalEl = document.getElementById('global-dynamic-modal');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'global-dynamic-modal';
  modalEl.className = 'modal modal--open';
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');

  modalEl.innerHTML = `
    <div class="modal__overlay" id="modal-overlay"></div>
    <div class="modal__dialog">
      <div class="modal__header">
        <h3 class="card__title" id="modal-title">${title}</h3>
        <button class="btn btn--icon btn--ghost" id="modal-close-x" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body" id="modal-body">
        ${bodyHtml}
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-btn-cancel">${cancelLabel}</button>
        <button class="btn btn--primary" id="modal-btn-confirm">${confirmLabel}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const close = () => {
    modalEl.classList.remove('modal--open');
    setTimeout(() => modalEl.remove(), 200);
  };

  document.getElementById('modal-overlay').onclick = close;
  document.getElementById('modal-close-x').onclick = close;
  document.getElementById('modal-btn-cancel').onclick = close;

  document.getElementById('modal-btn-confirm').onclick = async () => {
    if (onConfirm) {
      const result = await onConfirm();
      if (result !== false) close();
    } else {
      close();
    }
  };
}

/**
 * Injects a loading spinner into a target element.
 * @param {HTMLElement|string} target - Container element or selector
 */
function showLoadingSpinner(target) {
  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) return;
  container.setAttribute('data-prev-html', container.innerHTML);
  if (container.tagName === 'TBODY') {
    container.innerHTML = `
      <tr>
        <td colspan="100" class="text-center p-6">
          <div class="d-flex align-center justify-center gap-2">
            <div class="loading-spinner"></div>
            <span class="font-xs text-muted">Loading data...</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  container.innerHTML = `
    <div class="d-flex align-center justify-center p-6 w-100">
      <div class="loading-spinner"></div>
    </div>
  `;
}

/**
 * Hides spinner and restores content if previously stored.
 * @param {HTMLElement|string} target
 */
function hideLoadingSpinner(target) {
  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) return;
  const prev = container.getAttribute('data-prev-html');
  if (prev !== null) {
    container.innerHTML = prev;
    container.removeAttribute('data-prev-html');
  }
}

/**
 * Renders standard pagination controls into a container.
 * @param {HTMLElement|string} target
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {Function} onPageChange - Callback receiving page number
 */
function renderPagination(target, currentPage, totalPages, onPageChange) {
  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = `
    <div class="pagination">
      <span>Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong></span>
      <div class="pagination__buttons">
        <button class="btn btn--outline btn--sm" id="pagination-prev" ${currentPage <= 1 ? 'disabled' : ''}>&larr; Previous</button>
  `;

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      html += `
        <button class="btn ${p === currentPage ? 'btn--primary' : 'btn--outline'} btn--sm pagination-num" data-page="${p}">
          ${p}
        </button>
      `;
    }
  }

  html += `
        <button class="btn btn--outline btn--sm" id="pagination-next" ${currentPage >= totalPages ? 'disabled' : ''}>Next &rarr;</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const prevBtn = container.querySelector('#pagination-prev');
  if (prevBtn) {
    prevBtn.onclick = () => onPageChange(currentPage - 1);
  }

  const nextBtn = container.querySelector('#pagination-next');
  if (nextBtn) {
    nextBtn.onclick = () => onPageChange(currentPage + 1);
  }

  container.querySelectorAll('.pagination-num').forEach(btn => {
    btn.onclick = () => onPageChange(parseInt(btn.getAttribute('data-page'), 10));
  });
}

/**
 * Renders an empty state view with icon, title, description, and optional action button.
 * @param {HTMLElement|string} target
 * @param {string} title
 * @param {string} description
 * @param {string} [actionText]
 * @param {Function} [onAction]
 */
function renderEmptyState(target, title, description, actionText = null, onAction = null) {
  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">&#128196;</div>
      <h4 class="empty-state__title">${title}</h4>
      <p class="empty-state__desc">${description}</p>
      ${actionText ? `<button class="btn btn--primary btn--sm" id="empty-state-btn">${actionText}</button>` : ''}
    </div>
  `;

  if (actionText && onAction) {
    const btn = container.querySelector('#empty-state-btn');
    if (btn) btn.onclick = onAction;
  }
}

/**
 * Initializes interactive notification bell dropdown on navbar.
 * Fetches notifications from /api/v1/notifications/ and manages read states.
 * @param {string} [buttonSelector='#btn-notification-bell'] - Selector for bell trigger
 */
function initNotificationBell(buttonSelector = '#btn-notification-bell') {
  const bellBtn = document.querySelector(buttonSelector);
  if (!bellBtn) return;

  bellBtn.classList.add('notification-bell');

  let badgeEl = bellBtn.querySelector('.notification-bell__badge');
  if (!badgeEl) {
    badgeEl = document.createElement('span');
    badgeEl.className = 'notification-bell__badge';
    badgeEl.style.display = 'none';
    bellBtn.appendChild(badgeEl);
  }

  let dropdownEl = document.getElementById('global-notification-dropdown');
  if (!dropdownEl) {
    dropdownEl = document.createElement('div');
    dropdownEl.id = 'global-notification-dropdown';
    dropdownEl.className = 'notification-dropdown';
    dropdownEl.style.display = 'none';
    dropdownEl.innerHTML = `
      <div class="notification-dropdown__header">
        <h4 class="notification-dropdown__title">Notifications</h4>
        <button class="notification-dropdown__mark-all" id="btn-mark-all-read">Mark all as read</button>
      </div>
      <div class="notification-dropdown__list" id="notification-dropdown-list">
        <div class="p-4 text-center text-muted font-sm">Loading alerts...</div>
      </div>
    `;
    bellBtn.parentElement.style.position = 'relative';
    bellBtn.parentElement.appendChild(dropdownEl);

    const markAllBtn = dropdownEl.querySelector('#btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await fetch(`${API_BASE_URL}/notifications/read-all/`, {
            method: 'POST',
            headers: {
              ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
            }
          });
          badgeEl.style.display = 'none';
          badgeEl.textContent = '0';
          const items = dropdownEl.querySelectorAll('.notification-item--unread');
          items.forEach(it => it.classList.remove('notification-item--unread'));
          if (typeof showToast === 'function') showToast('All notifications marked as read', 'info', 2000);
        } catch (err) {
          console.warn('Could not mark all notifications as read:', err);
        }
      });
    }
  }

  // Toggle dropdown on click
  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdownEl.style.display === 'flex';
    dropdownEl.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      loadNotificationsList(dropdownEl, badgeEl);
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!bellBtn.contains(e.target) && !dropdownEl.contains(e.target)) {
      dropdownEl.style.display = 'none';
    }
  });

  // Initial fetch for badge
  loadNotificationsList(dropdownEl, badgeEl, true);
}

/**
 * Loads notification items from API.
 * @param {HTMLElement} dropdownEl
 * @param {HTMLElement} badgeEl
 * @param {boolean} [badgeOnly=false]
 */
async function loadNotificationsList(dropdownEl, badgeEl, badgeOnly = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/`, {
      headers: {
        ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      }
    });
    const json = await response.json();
    if (!response.ok) return;

    const data = json.data || {};
    const unread = data.unread_count || 0;
    const list = data.notifications || [];

    if (badgeEl) {
      if (unread > 0) {
        badgeEl.textContent = unread > 99 ? '99+' : unread;
        badgeEl.style.display = 'flex';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    if (badgeOnly) return;

    const listContainer = dropdownEl.querySelector('#notification-dropdown-list');
    if (!listContainer) return;

    if (list.length === 0) {
      listContainer.innerHTML = '<div class="p-4 text-center text-muted font-sm">No new notifications</div>';
      return;
    }

    const categoryIcons = {
      'APPLICATION_STAGE': '&#128188;',
      'PAYROLL_READY': '&#128176;',
      'EVALUATION_REQUEST': '&#9997;',
      'SYSTEM': '&#128276;'
    };

    listContainer.innerHTML = list.map(n => `
      <a href="${n.target_link || '#'}" class="notification-item ${n.is_read ? '' : 'notification-item--unread'}" data-id="${n.id}">
        <div class="notification-item__icon">${categoryIcons[n.category] || '&#128276;'}</div>
        <div class="notification-item__body">
          <div class="notification-item__title">${n.title}</div>
          <div class="notification-item__message">${n.message}</div>
          <div class="notification-item__time">${n.created_at ? n.created_at.slice(0,10) : 'Recent'}</div>
        </div>
      </a>
    `).join('');

    // Bind individual read clicks
    listContainer.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.getAttribute('data-id');
        if (id && item.classList.contains('notification-item--unread')) {
          try {
            await fetch(`${API_BASE_URL}/notifications/${id}/read/`, {
              method: 'POST',
              headers: {
                ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
              }
            });
            item.classList.remove('notification-item--unread');
          } catch (e) {
            console.warn('Failed to mark read:', e);
          }
        }
      });
    });
  } catch (err) {
    console.debug('Failed loading notifications:', err);
  }
}

/**
 * Modern SVG vector icon map for NBSC HRMS navigation.
 */
const NAV_ICONS_SVG = {
  dashboard: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect></svg>`,
  employees: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  programs: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
  vacancies: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  pipeline: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>`,
  deliberation: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg>`,
  audit: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>`,
  payroll: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`,
  sara: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>`,
  logout: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`
};

/**
 * Automatically upgrades the sidebar navigation to executive-grade standards:
 * - Injects crisp vector SVG icons, eliminating mismatched raw emojis.
 * - Adds status indicator and sleek wrapper to user profile footer.
 * - Formats badge indicators for live module status.
 */
function enhanceSidebarNav() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  const iconMappings = [
    { matcher: /dashboard/i, icon: NAV_ICONS_SVG.dashboard },
    { matcher: /employee/i, icon: NAV_ICONS_SVG.employees, badge: '8' },
    { matcher: /program/i, icon: NAV_ICONS_SVG.programs },
    { matcher: /vacanc/i, icon: NAV_ICONS_SVG.vacancies, badge: '4' },
    { matcher: /pipeline|applicant/i, icon: NAV_ICONS_SVG.pipeline },
    { matcher: /deliberation|voting/i, icon: NAV_ICONS_SVG.deliberation },
    { matcher: /audit/i, icon: NAV_ICONS_SVG.audit },
    { matcher: /payroll|payslip/i, icon: NAV_ICONS_SVG.payroll },
    { matcher: /sara/i, icon: NAV_ICONS_SVG.sara, badge: 'AI' }
  ];

  const links = sidebar.querySelectorAll('.sidebar__link');
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    const id = link.id || '';
    const text = link.textContent || '';
    const targetStr = `${href} ${id} ${text}`;

    for (const mapping of iconMappings) {
      if (mapping.matcher.test(targetStr)) {
        const iconContainer = link.querySelector('.sidebar__link-icon');
        if (iconContainer) {
          iconContainer.innerHTML = mapping.icon;
        }

        // Add badge counter if available and not already added
        if (mapping.badge && !link.querySelector('.sidebar__link-badge')) {
          const badgeEl = document.createElement('span');
          badgeEl.className = 'sidebar__link-badge';
          badgeEl.textContent = mapping.badge;
          link.appendChild(badgeEl);
        }
        break;
      }
    }
  });

  // Upgrade logout button with SVG icon
  const logoutBtn = sidebar.querySelector('#btn-logout');
  if (logoutBtn) {
    logoutBtn.className = 'sidebar__logout-btn';
    logoutBtn.innerHTML = NAV_ICONS_SVG.logout;
  }

  // Upgrade user avatar with status indicator
  const userAvatar = sidebar.querySelector('#user-avatar');
  if (userAvatar && !userAvatar.parentElement.classList.contains('sidebar__user-avatar-wrap')) {
    const parent = userAvatar.parentElement;
    const wrap = document.createElement('div');
    wrap.className = 'sidebar__user-avatar-wrap';
    parent.insertBefore(wrap, userAvatar);
    wrap.appendChild(userAvatar);

    const statusDot = document.createElement('span');
    statusDot.className = 'sidebar__user-status';
    wrap.appendChild(statusDot);
  }
}

// Auto-run on DOMContentLoaded or immediately if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhanceSidebarNav);
} else {
  enhanceSidebarNav();
}

