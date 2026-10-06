/**
 * ========================================================
 * SSGMCE TEACHER DASHBOARD - MAIN MODULE CONTROLLER
 * Bootstraps the Teacher ERP Dashboard Application
 * ========================================================
 */

(function () {
  // Ensure DOM is ready before initializing Teacher ERP
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof TeacherApp !== 'undefined' && typeof TeacherApp.init === 'function') {
      TeacherApp.init();
      console.log('✅ Teacher Dashboard initialized successfully.');
    }
  });

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
