/**
 * SSGMCE College ERP — Central Client Authentication SDK
 * frontend/common/auth/auth-client.js
 *
 * Enforces server-side token validation, automatic token refresh,
 * secure session persistence, and zero-trust of client storage.
 */

(function (window) {
  'use strict';

  var ACCESS_TOKEN_KEY = 'ssgmce_access_token';
  var REFRESH_TOKEN_KEY = 'ssgmce_refresh_token';
  var USER_CACHE_KEY = 'ssgmce_user_cache';
  var REMEMBER_KEY = 'ssgmce_remember_session';

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

  function getStorage(isPersistent) {
    if (isPersistent === undefined) {
      isPersistent = (localStorage.getItem(REMEMBER_KEY) === 'true');
    }
    return isPersistent ? localStorage : sessionStorage;
  }

  var AuthClient = {
    /**
     * Authenticates user against server API
     * @param {string} userId - Student Code, Faculty Emp Code, or Admin Username
     * @param {string} password - Password
     * @param {boolean} rememberMe - Whether to persist across browser restarts
     * @returns {Promise<Object>}
     */
    login: async function (userId, password, rememberMe) {
      var apiBase = getApiBase();
      var payload = {
        user_id: String(userId || '').trim(),
        username: String(userId || '').trim(),
        password: String(password || '').trim()
      };

      var response = await fetch(apiBase + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        var errBody = await response.json().catch(function () { return {}; });
        var message = errBody.detail || errBody.message || 'Invalid User ID or Password.';
        throw new Error(message);
      }

      var resJson = await response.json();
      var data = resJson.data || resJson;

      var accessToken = data.access_token || data.token;
      var refreshToken = data.refresh_token;
      var user = data.user || {};
      var role = data.role || user.role || 'student';
      var redirect = data.redirect || (role === 'teacher' ? 'teacher-dashboard.html' : (role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html'));

      // Save tokens securely in appropriate storage
      var storage = getStorage(!!rememberMe);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      storage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      // Sync legacy storage keys for existing UI components
      var userJson = JSON.stringify(user);
      storage.setItem(USER_CACHE_KEY, userJson);
      storage.setItem('ssgmce_user', userJson);
      storage.setItem('ssgmce_active_role', role);
      localStorage.setItem('ssgmce_access_token', accessToken);
      localStorage.setItem('ssgmce_token', accessToken);
      localStorage.setItem('ssgmce_user', userJson);

      return {
        success: true,
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user,
        role: role,
        redirect: redirect
      };
    },

    /**
     * Retrieves active access token from storage
     */
    getAccessToken: function () {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY) || 
             localStorage.getItem(ACCESS_TOKEN_KEY) || 
             localStorage.getItem('ssgmce_token') || 
             null;
    },

    /**
     * Retrieves active refresh token
     */
    getRefreshToken: function () {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY) || 
             localStorage.getItem(REFRESH_TOKEN_KEY) || 
             null;
    },

    /**
     * Refreshes an expired access token using the stored refresh token
     */
    refreshSession: async function () {
      var refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      var apiBase = getApiBase();
      var response = await fetch(apiBase + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        this.clearSession();
        throw new Error('Session refresh failed. Please log in again.');
      }

      var resJson = await response.json();
      var data = resJson.data || resJson;

      var newAccessToken = data.access_token;
      var newRefreshToken = data.refresh_token;

      var storage = getStorage();
      storage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      localStorage.setItem('ssgmce_token', newAccessToken);

      if (newRefreshToken) {
        storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      if (data.user) {
        storage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
        storage.setItem('ssgmce_user', JSON.stringify(data.user));
      }

      return newAccessToken;
    },

    /**
     * Authoritatively verifies active session with the backend server.
     * NEVER trusts local browser storage role or user_id.
     * @returns {Promise<Object>} Verified user profile with authoritative role
     */
    verifySession: async function () {
      var token = this.getAccessToken();
      if (!token) {
        throw new Error('No active authentication token found');
      }

      var apiBase = getApiBase();
      var response = await fetch(apiBase + '/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      });

      // Handle token expiration: attempt auto-refresh
      if (response.status === 401) {
        try {
          var newToken = await this.refreshSession();
          var retryResponse = await fetch(apiBase + '/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + newToken,
              'Accept': 'application/json'
            }
          });
          if (retryResponse.ok) {
            var retryJson = await retryResponse.json();
            return retryJson.data || retryJson;
          }
        } catch (refreshErr) {
          this.clearSession();
          throw new Error('Session expired. Please log in again.');
        }
        this.clearSession();
        throw new Error('Unauthorized session.');
      }

      if (!response.ok) {
        this.clearSession();
        throw new Error('Session verification failed');
      }

      var resJson = await response.json();
      var verifiedUser = resJson.data || resJson;

      // Update cached user with authoritative server response
      var storage = getStorage();
      storage.setItem(USER_CACHE_KEY, JSON.stringify(verifiedUser));
      storage.setItem('ssgmce_user', JSON.stringify(verifiedUser));
      storage.setItem('ssgmce_active_role', verifiedUser.role);

      return verifiedUser;
    },

    /**
     * Retrieves currently verified user object if present.
     * @returns {Object|null}
     */
    getCurrentUser: function () {
      if (typeof window !== 'undefined' && window.verifiedUser) return window.verifiedUser;
      try {
        var raw = sessionStorage.getItem(USER_CACHE_KEY) || 
                  localStorage.getItem(USER_CACHE_KEY) || 
                  localStorage.getItem('ssgmce_user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Authenticated fetch helper: automatically injects Authorization header
     * and handles 401 refresh seamlessly.
     */
    fetchWithAuth: async function (url, options) {
      options = options || {};
      options.headers = options.headers || {};

      var token = this.getAccessToken();
      if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
      }

      var response = await fetch(url, options);
      if (response.status === 401) {
        try {
          var newToken = await this.refreshSession();
          options.headers['Authorization'] = 'Bearer ' + newToken;
          return await fetch(url, options);
        } catch (e) {
          this.clearSession();
          window.location.href = 'login.html?expired=1';
          throw e;
        }
      }
      return response;
    },

    /**
     * Clears all authentication tokens and state from browser storage
     */
    clearSession: function () {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_CACHE_KEY);
      sessionStorage.removeItem('ssgmce_user');
      sessionStorage.removeItem('ssgmce_erp_session');
      sessionStorage.removeItem('ssgmce_active_role');
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('ssgmce_teacher_token');

      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem('ssgmce_token');
      localStorage.removeItem('ssgmce_user');
      localStorage.removeItem('ssgmce_erp_session');
      localStorage.removeItem('ssgmce_active_role');
      localStorage.removeItem('user_role');
      localStorage.removeItem('ssgmce_teacher_token');
      localStorage.removeItem(REMEMBER_KEY);
    },

    /**
     * Terminates session on the backend server and clears local tokens
     */
    logout: async function () {
      var token = this.getAccessToken();
      var apiBase = getApiBase();
      try {
        if (token) {
          await fetch(apiBase + '/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
          });
        }
      } catch (e) {
        console.warn('[AuthClient] Server logout notice:', e);
      } finally {
        this.clearSession();
        window.location.href = 'login.html?logout=1';
      }
    },

    /**
     * UI Visibility Helper: Checks if the user has a specific permission.
     * NOTE: Strictly for UI display/rendering logic. The backend authorizes
     * all data and API access independently.
     * @param {string} permission
     * @returns {boolean}
     */
    hasPermission: function (permission) {
      if (!permission) return true;
      var user = this.getCurrentUser();
      if (!user) return false;
      var role = (user.role || '').toLowerCase();
      if (role === 'super_admin') return true;
      var perms = user.permissions || [];
      var norm = String(permission).trim().toLowerCase();
      return perms.map(function (p) { return String(p).toLowerCase(); }).indexOf(norm) !== -1;
    },

    /**
     * UI Visibility Helper: Checks if the user has ANY of the specified permissions.
     * @param {string[]} permissions
     * @returns {boolean}
     */
    hasAnyPermission: function (permissions) {
      if (!permissions || !permissions.length) return true;
      var self = this;
      return permissions.some(function (p) { return self.hasPermission(p); });
    },

    /**
     * DOM helper that automatically hides elements the current user cannot access
     * using data-permission="<perm>" or data-role="<role1,role2>".
     */
    applyUIPermissions: function () {
      if (typeof document === 'undefined') return;
      var self = this;
      var user = this.getCurrentUser();
      var role = user ? (user.role || '').toLowerCase() : '';

      document.querySelectorAll('[data-permission]').forEach(function (el) {
        var reqPerm = el.getAttribute('data-permission');
        if (reqPerm && !self.hasPermission(reqPerm)) {
          el.style.display = 'none';
        }
      });

      document.querySelectorAll('[data-role]').forEach(function (el) {
        var reqRoles = el.getAttribute('data-role').toLowerCase().split(',').map(function (r) { return r.trim(); });
        if (role !== 'super_admin' && reqRoles.indexOf(role) === -1) {
          el.style.display = 'none';
        }
      });
    }
  };

  // Expose globally
  window.AuthClient = AuthClient;

})(typeof window !== 'undefined' ? window : this);

