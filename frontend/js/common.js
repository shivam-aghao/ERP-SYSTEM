/**
 * SSGMCE College ERP — Common UI Utilities
 */
(function (window) {
  'use strict';

  var ERP_UTILS = {
    formatDate: function (dateStr) {
      if (!dateStr) return '-';
      var d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    },

    formatTime: function (seconds) {
      var s = parseInt(seconds || 0, 10);
      var mins = Math.floor(s / 60);
      var secs = s % 60;
      return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    },

    showToast: function (message, type) {
      type = type || 'info';
      var toast = document.createElement('div');
      toast.className = 'erp-toast erp-toast-' + type;
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;color:#fff;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:all 0.3s ease;';
      
      if (type === 'success') toast.style.backgroundColor = '#10B981';
      else if (type === 'error') toast.style.backgroundColor = '#EF4444';
      else if (type === 'warning') toast.style.backgroundColor = '#F59E0B';
      else toast.style.backgroundColor = '#0B5CAD';

      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, 3500);
    }
  };

  window.ERP_UTILS = ERP_UTILS;
})(typeof window !== 'undefined' ? window : this);
