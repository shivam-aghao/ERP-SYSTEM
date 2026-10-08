/**
 * SSGMCE College ERP — Central Authentication & Role-Based Session Manager
 * frontend/js/auth.js
 *
 * Secure Token-Based Authentication Architecture:
 * - Uses signed JWT tokens issued by backend & Supabase Auth as the single source of truth.
 * - Server validates user identity and authoritative role on every protected request.
 * - Zero-trust of client storage: Modifying localStorage/sessionStorage will NEVER grant elevated access.
 * - Handles auto-refresh on token expiration and secure session termination on logout.
 */

(function (window) {
  'use strict';

  var STORAGE_ACCESS_TOKEN = 'ssgmce_access_token';
  var STORAGE_REFRESH_TOKEN = 'ssgmce_refresh_token';
  var STORAGE_USER_KEY = 'ssgmce_user';
  var STORAGE_ACTIVE_ROLE = 'ssgmce_active_role';
  var STORAGE_REMEMBER_KEY = 'ssgmce_remember_session';

  function getApiBase() {
    if (window.ERP_CONFIG && window.ERP_CONFIG.API_BASE) {
      return window.ERP_CONFIG.API_BASE;
    }
    var port = (window.location && window.location.port) ? window.location.port : '';
    var origin = (port === '8000') 
      ? window.location.origin 
      : 'http://' + (window.location.hostname || 'localhost') + ':8000';
    return origin + '/api/v1';
  }

  function getStorage(remember) {
    if (remember === undefined) {
      remember = (localStorage.getItem(STORAGE_REMEMBER_KEY) === 'true');
    }
    return remember ? localStorage : sessionStorage;
  }

  var ERP_AUTH = {
    /**
     * Authenticates user against backend API and receives signed JWT tokens
     * @param {string} userId - Student Code, Faculty Emp Code, or Admin Username
     * @param {string} password - User password
     * @param {string} [roleHint] - Optional role hint
     * @param {boolean} [rememberMe=false] - Whether to persist across browser restarts
     * @returns {Promise<Object>}
     */
    login: async function (userId, password, roleHint, rememberMe) {
      var apiBase = getApiBase();
      var payload = {
        user_id: String(userId || '').trim(),
        username: String(userId || '').trim(),
        password: String(password || '').trim(),
        role: roleHint || ''
      };

      var res = await fetch(apiBase + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        var errData = await res.json().catch(function () { return {}; });
        var errMsg = errData.detail || errData.message || 'Invalid User ID or Password.';
        throw new Error(errMsg);
      }

      var resData = await res.json();
      var data = resData.data || resData;
      var accessToken = data.access_token || data.token;
      var refreshToken = data.refresh_token;
      var user = data.user || {};
      var role = (data.role || user.role || 'student').toLowerCase();
      if (role === 'faculty') role = 'teacher';

      // Persist session tokens
      var storage = getStorage(!!rememberMe);
      if (rememberMe) {
        localStorage.setItem(STORAGE_REMEMBER_KEY, 'true');
      } else {
        localStorage.removeItem(STORAGE_REMEMBER_KEY);
      }

      storage.setItem(STORAGE_ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_ACCESS_TOKEN, accessToken);
      localStorage.setItem('ssgmce_token', accessToken);

      if (refreshToken) {
        storage.setItem(STORAGE_REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_REFRESH_TOKEN, refreshToken);
      }

      // Store user cache for immediate display
      var userJson = JSON.stringify(user);
      storage.setItem(STORAGE_USER_KEY, userJson);
      storage.setItem(STORAGE_ACTIVE_ROLE, role);
      localStorage.setItem(STORAGE_USER_KEY, userJson);
      localStorage.setItem(STORAGE_ACTIVE_ROLE, role);
      localStorage.setItem('user_role', role);

      // Return standardized payload
      return {
        success: true,
        user: user,
        token: accessToken,
        access_token: accessToken,
        refresh_token: refreshToken,
        role: role,
        redirect: data.redirect || this.getRedirectForRole(role)
      };
    },

    /**
     * Gets current access token from storage
     */
    getToken: function () {
      return sessionStorage.getItem(STORAGE_ACCESS_TOKEN) ||
             localStorage.getItem(STORAGE_ACCESS_TOKEN) ||
             localStorage.getItem('ssgmce_token') ||
             null;
    },

    /**
     * Gets refresh token
     */
    getRefreshToken: function () {
      return sessionStorage.getItem(STORAGE_REFRESH_TOKEN) ||
             localStorage.getItem(STORAGE_REFRESH_TOKEN) ||
             null;
    },

    /**
     * Refreshes access token with server using refresh token
     */
    refreshSession: async function () {
      var refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      var apiBase = getApiBase();
      var res = await fetch(apiBase + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!res.ok) {
        this.clearLocalSession();
        throw new Error('Session refresh rejected by server');
      }

      var data = await res.json();
      var result = data.data || data;
      var newAccessToken = result.access_token;
      var newRefreshToken = result.refresh_token;

      var storage = getStorage();
      storage.setItem(STORAGE_ACCESS_TOKEN, newAccessToken);
      localStorage.setItem(STORAGE_ACCESS_TOKEN, newAccessToken);
      localStorage.setItem('ssgmce_token', newAccessToken);

      if (newRefreshToken) {
        storage.setItem(STORAGE_REFRESH_TOKEN, newRefreshToken);
        localStorage.setItem(STORAGE_REFRESH_TOKEN, newRefreshToken);
      }

      return newAccessToken;
    },

    /**
     * Authoritative server validation: Calls /api/v1/auth/me to verify user identity.
     * NEVER relies on localStorage values.
     * @returns {Promise<Object>} Authoritatively verified user
     */
    verifySession: async function () {
      var token = this.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      var apiBase = getApiBase();
      var res = await fetch(apiBase + '/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      });

      // Handle token expiry: attempt automatic refresh
      if (res.status === 401) {
        try {
          var newToken = await this.refreshSession();
          var retryRes = await fetch(apiBase + '/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + newToken,
              'Accept': 'application/json'
            }
          });
          if (retryRes.ok) {
            var retryJson = await retryRes.json();
            var verifiedUser = retryJson.data || retryJson;
            this.syncVerifiedSession(verifiedUser);
            return verifiedUser;
          }
        } catch (refreshErr) {
          this.clearLocalSession();
          throw new Error('Session expired');
        }
        this.clearLocalSession();
        throw new Error('Session unauthorized');
      }

      if (!res.ok) {
        this.clearLocalSession();
        throw new Error('Authentication validation failed');
      }

      var resJson = await res.json();
      var user = resJson.data || resJson;
      this.syncVerifiedSession(user);
      return user;
    },

    /**
     * Synchronizes verified server user to local state
     */
    syncVerifiedSession: function (user) {
      if (!user) return;
      var role = (user.role || 'student').toLowerCase();
      if (role === 'faculty') role = 'teacher';
      user.role = role;

      user.fullName = user.full_name || user.name || 'SSGMCE Member';
      user.shortName = user.fullName;
      user.initials = user.fullName.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
      user.studentCode = user.student_code || user.identifier || user.id;
      user.rollNo = user.roll_no || 1;
      user.className = user.class_name || '3R';
      user.empCode = user.emp_code || user.identifier || user.id;

      var userJson = JSON.stringify(user);
      var storage = getStorage();
      storage.setItem(STORAGE_USER_KEY, userJson);
      storage.setItem(STORAGE_ACTIVE_ROLE, role);
      localStorage.setItem(STORAGE_USER_KEY, userJson);
      localStorage.setItem(STORAGE_ACTIVE_ROLE, role);
      localStorage.setItem('user_role', role);

      window.verifiedUser = user;
      window.currentUser = user;
      window.activeUser = user;
    },

    /**
     * Retrieves cached user object (for offline or instantaneous header rendering)
     */
    getCurrentUser: function () {
      try {
        var raw = sessionStorage.getItem(STORAGE_USER_KEY) || localStorage.getItem(STORAGE_USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    getUser: function () {
      return this.getCurrentUser();
    },

    getUserName: function () {
      var user = this.getCurrentUser();
      return user ? (user.fullName || user.full_name || user.name || 'User') : 'User';
    },

    /**
     * Checks if a token exists in storage
     */
    isAuthenticated: function () {
      return !!this.getToken();
    },

    isLoggedIn: function () {
      return this.isAuthenticated();
    },

    getRole: function () {
      var user = this.getCurrentUser();
      return user && user.role ? user.role.toLowerCase() : 'student';
    },

    getRedirectForRole: function (role) {
      role = String(role || this.getRole() || '').toLowerCase();
      if (role === 'teacher' || role === 'faculty' || role === 'hod') {
        return 'teacher-dashboard.html';
      } else if (role === 'admin' || role === 'super_admin') {
        return 'admin-dashboard.html';
      }
      return 'student-dashboard.html';
    },

    redirectByRole: function (role) {
      window.location.href = this.getRedirectForRole(role);
    },

    clearLocalSession: function () {
      sessionStorage.clear();
      localStorage.removeItem(STORAGE_ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_ACTIVE_ROLE);
      localStorage.removeItem(STORAGE_REMEMBER_KEY);
      localStorage.removeItem('ssgmce_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('ssgmce_teacher_token');
      localStorage.removeItem('ssgmce_selected_faculty');
    },

    /**
     * Terminates session on the server and clears browser storage
     */
    logout: async function () {
      var token = this.getToken();
      var apiBase = getApiBase();
      try {
        if (token) {
          await fetch(apiBase + '/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
          });
        }
      } catch (e) {
        console.warn('[ERPAuth] Logout warning:', e);
      } finally {
        this.clearLocalSession();
        window.location.replace('login.html?logout=true');
      }
    },

    /**
     * Authoritative Page Guard.
     * Validates authentication token against backend.
     * Prevents unauthorized role switching and privilege escalation.
     * @param {'student'|'teacher'|'admin'|'any'} expectedRole
     */
    requireAuth: function (expectedRole) {
      var curPath = (window.location && window.location.pathname) 
        ? window.location.pathname.split('/').pop().toLowerCase() 
        : 'index.html';

      // 1. Check token existence
      if (!this.isAuthenticated()) {
        console.warn('[ERPAuth] Unauthenticated access blocked: No token found. Redirecting to login.');
        window.location.replace('login.html?redirect=' + encodeURIComponent(curPath));
        return false;
      }

      // 2. Asynchronously verify with server
      var self = this;
      this.verifySession()
        .then(function (verifiedUser) {
          var authoritativeRole = String(verifiedUser.role || '').toLowerCase();
          if (authoritativeRole === 'faculty') authoritativeRole = 'teacher';

          if (expectedRole && expectedRole !== 'any') {
            var exp = expectedRole.toLowerCase();
            if (exp === 'faculty') exp = 'teacher';

            // Universal admin bypass for administrative roles
            if (authoritativeRole === 'super_admin' || authoritativeRole === 'admin') {
              return;
            }

            // Role mismatch check
            if (exp !== authoritativeRole) {
              console.error('[ERPAuth] Privilege escalation blocked. True Role: ' + authoritativeRole + ', Attempted Page: ' + exp);
              var authorizedHome = self.getRedirectForRole(authoritativeRole);
              alert('Access Denied: You do not have permission to access this portal.');
              window.location.replace(authorizedHome);
            }
          }
        })
        .catch(function (err) {
          console.warn('[ERPAuth] Session verification failed:', err.message);
          window.location.replace('login.html?expired=1&redirect=' + encodeURIComponent(curPath));
        });

      return true;
    },

    requireRole: function (role, redirectUrl) {
      return this.requireAuth(role);
    }
  };

  // Expose globally
  window.ERP_AUTH = ERP_AUTH;
  window.ERPAuth = ERP_AUTH;

  // Auto-init AuthGuard integration if loaded
  if (window.AuthGuard) {
    window.AuthGuard.verifySession = ERP_AUTH.verifySession.bind(ERP_AUTH);
  }

})(typeof window !== 'undefined' ? window : this);
