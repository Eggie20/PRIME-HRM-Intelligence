/**
 * NBSC PRIME-HRM Intelligence Hub — Utility Library
 * Formatting helpers, validation utilities, DOM query helpers, and debounce.
 */

/**
 * Sanitizes an untrusted string for safe HTML rendering.
 * @param {string|any} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a date string or timestamp into a readable date (e.g. "Sep 4, 2026").
 * @param {string|Date|number} dateInput - Input date string, object, or epoch
 * @returns {string} Formatted human-readable date
 */
function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Formats date into standard numeric format (MM/DD/YYYY).
 * @param {string|Date|number} dateInput
 * @returns {string} "MM/DD/YYYY"
 */
function formatDateShort(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/**
 * Formats a numeric amount into Philippine Peso currency string (e.g. "₱45,000.00").
 * @param {number|string} amount - Number to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(num);
}

/**
 * Formats file size in bytes to a human-readable string (e.g. "2.4 MB").
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Creates a debounced version of a function that delays execution until wait ms have elapsed.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to delay
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncates text with an ellipsis if it exceeds maxLength.
 * @param {string} text - Source text
 * @param {number} maxLength - Maximum characters
 * @returns {string} Truncated string
 */
function truncateText(text, maxLength = 60) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Retrieves query parameter value from current URL.
 * @param {string} param - Parameter key
 * @returns {string|null} Value or null
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Sets or updates a query parameter in current browser URL without reloading.
 * @param {string} param - Key name
 * @param {string} value - New value
 */
function setQueryParam(param, value) {
  const url = new URL(window.location.href);
  if (value === null || value === undefined || value === '') {
    url.searchParams.delete(param);
  } else {
    url.searchParams.set(param, value);
  }
  window.history.replaceState({}, '', url.toString());
}

/**
 * Validates email format using standard regex.
 * @param {string} email - Email address to test
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  if (!email) return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).trim());
}

/**
 * Validates Philippine phone numbers (+639xxxxxxxxx or 09xxxxxxxxx).
 * @param {string} phone - Phone string
 * @returns {boolean} True if valid
 */
function validatePhone(phone) {
  if (!phone) return false;
  const re = /^(09|\+639)\d{9}$/;
  return re.test(String(phone).replace(/\s+/g, ''));
}

/**
 * Validates required inputs within a form container and marks invalid fields.
 * @param {HTMLElement|string} formOrSelector - Form element or CSS selector
 * @returns {{isValid: boolean, errors: Array<{field: string, message: string}>}}
 */
function validateForm(formOrSelector) {
  const form = typeof formOrSelector === 'string'
    ? document.querySelector(formOrSelector)
    : formOrSelector;

  if (!form) return { isValid: true, errors: [] };

  const requiredFields = form.querySelectorAll('[required]');
  const errors = [];

  requiredFields.forEach(field => {
    const value = field.value ? field.value.trim() : '';
    const fieldId = field.id || field.name || 'field';
    const errorEl = document.getElementById(`${fieldId}-error`);

    if (!value) {
      field.classList.add('form-group__input--error');
      if (errorEl) {
        errorEl.textContent = 'This field is required.';
        errorEl.classList.add('form-group__error--visible');
      }
      errors.push({ field: fieldId, message: 'This field is required.' });
    } else {
      field.classList.remove('form-group__input--error');
      if (errorEl) {
        errorEl.classList.remove('form-group__error--visible');
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
