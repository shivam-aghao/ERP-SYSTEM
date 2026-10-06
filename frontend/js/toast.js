/**
 * SSGMCE College ERP — Central Toast Notification Engine
 * Replaces native alert() with sleek, animated, non-blocking toast notifications.
 *
 * Usage:
 *   ERPToast.success("Attendance saved successfully!");
 *   ERPToast.error("Failed to load records from server");
 *   ERPToast.info("Results updated");
 *   ERPToast.warning("Unsaved changes detected");
 *   showToast("Message", "success"); // Compatibility shorthand
 */

(function (window) {
  'use strict';

  let container = null;

  function ensureContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.createElement('div');
      container.className = 'erp-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    return container;
  }

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  const TITLES = {
    success: 'Success',
    error: 'Notice',
    warning: 'Attention',
    info: 'Information'
  };

  function createToast(message, type = 'info', title = null, duration = 3800) {
    const parent = ensureContainer();
    const normalizedType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';

    const toast = document.createElement('div');
    toast.className = `erp-toast erp-toast-${normalizedType}`;
    toast.setAttribute('role', 'alert');

    const displayTitle = title || TITLES[normalizedType];

    toast.innerHTML = `
      <div class="erp-toast-icon">${ICONS[normalizedType]}</div>
      <div class="erp-toast-content">
        <div class="erp-toast-title">${displayTitle}</div>
        <div class="erp-toast-message">${message}</div>
      </div>
      <button type="button" class="erp-toast-close" aria-label="Close notification">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="erp-toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    parent.appendChild(toast);

    // Trigger enter transition
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    let dismissTimer = setTimeout(dismiss, duration);

    function dismiss() {
      clearTimeout(dismissTimer);
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 350);
    }

    toast.querySelector('.erp-toast-close').addEventListener('click', dismiss);

    // Pause dismissal on mouse hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(dismissTimer);
      const prog = toast.querySelector('.erp-toast-progress');
      if (prog) prog.style.animationPlayState = 'paused';
    });

    toast.addEventListener('mouseleave', () => {
      const prog = toast.querySelector('.erp-toast-progress');
      if (prog) prog.style.animationPlayState = 'running';
      dismissTimer = setTimeout(dismiss, 1500);
    });

    return toast;
  }

  const ERPToast = {
    success: (msg, title, duration) => createToast(msg, 'success', title, duration),
    error: (msg, title, duration) => createToast(msg, 'error', title, duration),
    warning: (msg, title, duration) => createToast(msg, 'warning', title, duration),
    info: (msg, title, duration) => createToast(msg, 'info', title, duration),
    show: createToast
  };

  // Expose globally
  window.ERPToast = ERPToast;
  window.showToast = function (message, type, title) {
    return createToast(message, type, title);
  };

})(window);

