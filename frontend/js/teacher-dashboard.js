/**
 * ========================================================
 * SSGMCE TEACHER DASHBOARD - MAIN MODULE CONTROLLER
 * Bootstraps the Teacher ERP Dashboard Application
 * ========================================================
 */

(function () {
  function bootstrap() {
    if (typeof TeacherApp !== 'undefined' && typeof TeacherApp.init === 'function') {
      TeacherApp.init();
      console.log('✅ Teacher Dashboard initialized successfully.');
    }
  }

  // Ensure DOM is ready before initializing Teacher ERP
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Global helper for programmatic access
  window.TeacherDashboard = {
    getApp: function () {
      return window.TeacherApp;
    },
    getApi: function () {
      return window.TeacherAPI;
    },
    getData: function () {
      return window.TeacherERPData;
    }
  };
})();
