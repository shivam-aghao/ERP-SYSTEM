/**
 * SSGMCE College ERP — Central Authentication & Session Manager
 */
(function (window) {
  'use strict';

  var ERP_AUTH = {
    getUser: function () {
      try {
        var raw = localStorage.getItem('ssgmce_user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    setUser: function (user) {
      if (user) {
        localStorage.setItem('ssgmce_user', JSON.stringify(user));
        if (user.role) {
          localStorage.setItem('ssgmce_active_role', user.role);
        }
      } else {
        localStorage.removeItem('ssgmce_user');
        localStorage.removeItem('ssgmce_active_role');
      }
    },

    getRole: function () {
      var user = this.getUser();
      return user ? (user.role || 'student') : (localStorage.getItem('ssgmce_active_role') || 'student');
    },

    isLoggedIn: function () {
      return !!this.getUser();
    },

    logout: function () {
      localStorage.removeItem('ssgmce_user');
      localStorage.removeItem('ssgmce_teacher_token');
      localStorage.removeItem('ssgmce_active_role');
      window.location.href = 'login.html';
    },

    requireAuth: function (expectedRole) {
      var user = this.getUser();
      if (!user) {
        window.location.href = 'login.html';
        return false;
      }
      if (expectedRole && user.role !== expectedRole && expectedRole !== 'any') {
        if (user.role === 'teacher' || user.role === 'faculty') {
          window.location.href = 'teacher-dashboard.html';
        } else if (user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'student-dashboard.html';
        }
        return false;
      }
      return true;
    }
  };

  window.ERP_AUTH = ERP_AUTH;
})(typeof window !== 'undefined' ? window : this);
