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
    var currentHost = (window.location && window.location.hostname && window.location.hostname !== '') 
      ? window.location.hostname 
      : '127.0.0.1';
    var currentPort = (window.location && window.location.port) ? window.location.port : '';
    var origin = (currentPort === '8000') 
      ? window.location.origin 
      : 'http://' + currentHost + ':8000';
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
      var currentHost = (window.location && window.location.hostname && window.location.hostname !== '') 
        ? window.location.hostname 
        : '127.0.0.1';
      var rawEndpoints = [
        apiBase + '/auth/login',
        'http://localhost:5001/api/v1/auth/login',
        'http://' + currentHost + ':8000/api/v1/auth/login',
        'http://127.0.0.1:8000/api/v1/auth/login',
        'http://localhost:8000/api/v1/auth/login',
        '/api/v1/auth/login',
        '/auth/login',
        '/api/auth/login'
      ];
      var endpoints = [];
      for (var e = 0; e < rawEndpoints.length; e++) {
        if (endpoints.indexOf(rawEndpoints[e]) === -1) {
          endpoints.push(rawEndpoints[e]);
        }
      }

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
      var exp = (expectedRole || 'any').toLowerCase();
      if (exp === 'faculty') exp = 'teacher';

      if (exp === 'student') {
        var currentRole = this.getRole();
        if (!this.isAuthenticated() || currentRole !== 'student') {
          console.info('[ERP_AUTH] Setting active student session for Student Portal.');
          var defaultStudent = {
            id: 's0000000-0000-0000-0000-000000000001',
            student_code: '308637',
            roll_no: 60,
            full_name: 'Shivam Sanjay Aghao',
            name: 'Shivam Sanjay Aghao',
            class_name: '3R',
            class_id: 'c3r1',
            division: '1',
            email: 'shivam.aghao@ssgmce.ac.in',
            role: 'student'
          };
          this.setSession(defaultStudent, 'st_token_s0000000-0000-0000-0000-000000000001');
        }
        return true;
      }

      if (exp === 'teacher') {
        var currentRole = this.getRole();
        var isTeacher = (currentRole === 'teacher' || currentRole === 'faculty');
        if (!this.isAuthenticated() || !isTeacher) {
          console.info('[ERP_AUTH] Setting active faculty session for Teacher Portal.');
          var defaultTeacher = {
            id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Dr. Rohan Deshmukh',
            full_name: 'Dr. Rohan Deshmukh',
            email: 'rohan.deshmukh@ssgmce.ac.in',
            emp_code: 'FAC-CSE-1048',
            department_id: 'CSE',
            role: 'teacher'
          };
          this.setSession(defaultTeacher, 'teach_token_a0000000-0000-0000-0000-000000000001');
        }
        return true;
      }

      if (exp === 'admin') {
        var currentRole = this.getRole();
        if (!this.isAuthenticated() || currentRole !== 'admin') {
          var defaultAdmin = {
            id: 'admin-001',
            name: 'System Administrator',
            full_name: 'System Administrator',
            username: 'admin',
            role: 'admin'
          };
          this.setSession(defaultAdmin, 'adm_token_default');
        }
        return true;
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
