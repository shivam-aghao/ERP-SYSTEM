/**
 * SSGMCE College ERP — Central Authentication & Role-Based Session Manager
 * Complete Integration: login(), logout(), getCurrentUser(), isAuthenticated(),
 * requireAuth(), requireRole(), redirectByRole()
 */
(function (window) {
  'use strict';

  var STORAGE_USER_KEY = 'ssgmce_user';
  var STORAGE_SESSION_KEY = 'ssgmce_erp_session';
  var STORAGE_LEGACY_KEY = 'ssgmce_user_session';
  var STORAGE_ROLE_KEY = 'ssgmce_active_role';
  var STORAGE_TEACHER_TOKEN = 'ssgmce_teacher_token';
  var STORAGE_STUDENT_TOKEN = 'ssgmce_student_token';

  function getApiBase() {
    if (window.ERP_CONFIG && window.ERP_CONFIG.API_BASE) {
      return window.ERP_CONFIG.API_BASE;
    }
    if (window.__API_BASE__) {
      return window.__API_BASE__;
    }
    var origin = (window.location && window.location.origin && window.location.origin.startsWith('http')) 
      ? window.location.origin 
      : 'http://localhost:8000';
    return origin + '/api/v1';
  }

  var ERP_AUTH = {
    /**
     * Performs backend authentication
     * @param {string} userId - Student ID, Faculty Emp Code, or Admin username
     * @param {string} password - User password
     * @param {string} [roleHint] - Optional role hint
     * @returns {Promise<Object>}
     */
    login: async function (userId, password, roleHint) {
      var apiBase = getApiBase();
      var endpoints = [
        apiBase + '/auth/login',
        'http://localhost:5001/api/v1/auth/login',
        '/api/v1/auth/login',
        '/auth/login',
        '/api/auth/login'
      ];

      var payload = {
        user_id: String(userId || '').trim(),
        username: String(userId || '').trim(),
        password: String(password || '').trim(),
        role: roleHint || ''
      };

      var lastError = null;
      for (var i = 0; i < endpoints.length; i++) {
        try {
          var res = await fetch(endpoints[i], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            var data = await res.json();
            var result = data.data || data;
            var user = result.user || result;
            var token = result.token || data.token || 'token_' + Date.now();
            var role = (result.role || user.role || 'student').toLowerCase();
            if (role === 'faculty') role = 'teacher';

            user.role = role;
            this.setSession(user, token);
            return {
              success: true,
              user: user,
              token: token,
              role: role,
              redirect: result.redirect || this.getRedirectForRole(role)
            };
          } else if (res.status === 401 || res.status === 403) {
            var errData = await res.json().catch(function() { return {}; });
            throw new Error(errData.message || errData.detail || 'Invalid User ID or Password.');
          }
        } catch (err) {
          lastError = err;
          if (err.message && err.message.includes('Invalid User ID')) {
            throw err;
          }
        }
      }

      throw lastError || new Error('Authentication server unreachable. Please verify backend is running on port 8000.');
    },

    /**
     * Saves user session across all synchronized storage keys
     */
    setSession: function (user, token) {
      if (!user) return;
      var role = (user.role || 'student').toLowerCase();
      if (role === 'faculty') role = 'teacher';
      user.role = role;

      // Provide standardized normalized fields
      user.fullName = user.full_name || user.name || user.fullName || 'SSGMCE Member';
      user.shortName = user.fullName;
      user.initials = user.fullName.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();
      user.studentCode = user.student_code || user.id;
      user.rollNo = user.roll_no || 1;
      user.className = user.class_name || '3R';
      user.classCode = user.class_code || user.className;
      user.empCode = user.emp_code || user.id;

      var userJson = JSON.stringify(user);
      localStorage.setItem(STORAGE_USER_KEY, userJson);
      localStorage.setItem(STORAGE_SESSION_KEY, userJson);
      localStorage.setItem(STORAGE_LEGACY_KEY, userJson);
      sessionStorage.setItem(STORAGE_SESSION_KEY, userJson);
      localStorage.setItem(STORAGE_ROLE_KEY, role);

      if (token) {
        if (role === 'teacher' || role === 'faculty') {
          localStorage.setItem(STORAGE_TEACHER_TOKEN, token);
        } else {
          localStorage.setItem(STORAGE_STUDENT_TOKEN, token);
        }
      }
    },

    /**
     * Retrieves current logged in user object or null
     */
    getCurrentUser: function () {
      try {
        var raw = localStorage.getItem(STORAGE_USER_KEY) || 
                  localStorage.getItem(STORAGE_SESSION_KEY) || 
                  localStorage.getItem(STORAGE_LEGACY_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    getUser: function () {
      return this.getCurrentUser();
    },

    /**
     * Checks if current session is active
     */
    isAuthenticated: function () {
      var user = this.getCurrentUser();
      return !!(user && user.role);
    },

    isLoggedIn: function () {
      return this.isAuthenticated();
    },

    /**
     * Gets user role: 'student', 'teacher', or 'admin'
     */
    getRole: function () {
      var user = this.getCurrentUser();
      if (user && user.role) {
        var r = user.role.toLowerCase();
        return (r === 'faculty') ? 'teacher' : r;
      }
      var storedRole = localStorage.getItem(STORAGE_ROLE_KEY);
      return storedRole ? ((storedRole === 'faculty') ? 'teacher' : storedRole.toLowerCase()) : 'student';
    },

    /**
     * Returns appropriate destination for given role
     */
    getRedirectForRole: function (role) {
      role = (role || this.getRole() || '').toLowerCase();
      if (role === 'teacher' || role === 'faculty') {
        return 'teacher-dashboard.html';
      } else if (role === 'admin') {
        return 'admin-dashboard.html';
      }
      return 'student-dashboard.html';
    },

    redirectByRole: function (role) {
      window.location.href = this.getRedirectForRole(role);
    },

    /**
     * Centralized Logout
     */
    logout: function () {
      try {
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem(STORAGE_SESSION_KEY);
        localStorage.removeItem(STORAGE_LEGACY_KEY);
        localStorage.removeItem(STORAGE_ROLE_KEY);
        localStorage.removeItem(STORAGE_TEACHER_TOKEN);
        localStorage.removeItem(STORAGE_STUDENT_TOKEN);
        localStorage.removeItem('user_role');
        localStorage.removeItem('dashboard_permissions');
        sessionStorage.clear();
      } catch (e) {}
      window.location.replace('login.html?logout=true');
    },

    /**
     * Role-Based Access Guard for Protected Pages
     * @param {'student'|'teacher'|'admin'|'any'} expectedRole
     * @returns {boolean}
     */
    requireAuth: function (expectedRole) {
      if (!this.isAuthenticated()) {
        console.warn('[ERP_AUTH] Unauthenticated access attempt. Redirecting to login.html');
        window.location.replace('login.html');
        return false;
      }

      var currentRole = this.getRole();
      if (expectedRole && expectedRole !== 'any') {
        var exp = expectedRole.toLowerCase();
        if (exp === 'faculty') exp = 'teacher';

        var isTeacher = (currentRole === 'teacher' || currentRole === 'faculty' || currentRole === 'employee');
        var isStudent = (currentRole === 'student');

        if (exp === 'teacher' && !isTeacher && currentRole !== 'admin') {
          console.warn('[ERP_AUTH] Role ' + currentRole + ' cannot access teacher portal. Redirecting to student-dashboard.');
          window.location.replace('student-dashboard.html');
          return false;
        }

        if (exp === 'student' && !isStudent) {
          console.warn('[ERP_AUTH] Role ' + currentRole + ' cannot access student portal. Redirecting to teacher-dashboard.');
          window.location.replace('teacher-dashboard.html');
          return false;
        }
      }
      return true;
    },

    requireRole: function (role) {
      return this.requireAuth(role);
    },

    /**
     * Hydrates DOM header elements with current user details
     */
    hydrateUI: function () {
      var user = this.getCurrentUser();
      if (!user) return;

      var nameElements = document.querySelectorAll('.student-name, .profile-name, #header-profile-name, .user-name, #userName');
      nameElements.forEach(function (el) {
        el.textContent = user.fullName || user.name || 'User';
      });

      var codeElements = document.querySelectorAll('.student-code, #headerStudentCode, .user-id, #userCode');
      codeElements.forEach(function (el) {
        el.textContent = user.studentCode || user.empCode || user.id || '';
      });

      var classElements = document.querySelectorAll('.student-class, #headerClass, .user-class');
      classElements.forEach(function (el) {
        el.textContent = user.className || '3R';
      });

      var avatarElements = document.querySelectorAll('.avatar-circle span, .profile-avatar span, #userInitials');
      avatarElements.forEach(function (el) {
        el.textContent = user.initials || 'SS';
      });
    }
  };

  // Expose on window
  window.ERP_AUTH = ERP_AUTH;
  window.ERPAuth = ERP_AUTH; // Compatibility alias
  window.getCurrentUser = function () { return ERP_AUTH.getCurrentUser(); };
  window.logout = function () { ERP_AUTH.logout(); };
  window.handleLogout = function () { ERP_AUTH.logout(); };

  // Auto-hydrate on DOM ready if user exists
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      ERP_AUTH.hydrateUI();
    });
  }

})(typeof window !== 'undefined' ? window : this);
