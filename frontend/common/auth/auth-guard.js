/**
 * SSGMCE College ERP — Central Page-Level Authorization Guard
 * frontend/common/auth/auth-guard.js
 *
 * Prevents unauthorized page access and privilege escalation.
 * Strictly verifies identity against the server; never trusts localStorage values.
 */

(function (window) {
  'use strict';

  var AuthGuard = {
    /**
     * Guards a web page to require specific authenticated roles.
     * @param {string[]} allowedRoles - Array of authorized roles, e.g. ['student'], ['teacher'], ['admin']
     * @param {Function} [onAuthorized] - Optional callback executed with verified user once authenticated
     */
    guardPage: async function (allowedRoles, onAuthorized) {
      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        allowedRoles = ['student', 'teacher', 'admin', 'hod', 'super_admin'];
      }
      var normalizedAllowed = allowedRoles.map(function (r) { return r.toLowerCase(); });

      // 1. Initial token existence check
      var token = window.AuthClient ? window.AuthClient.getAccessToken() : null;
      if (!token) {
        var currentPath = window.location.pathname.split('/').pop() || 'index.html';
        console.warn('[AuthGuard] Unauthenticated access blocked. Redirecting to login.');
        window.location.replace('login.html?redirect=' + encodeURIComponent(currentPath));
        return;
      }

      // 2. Authoritative server verification handshake
      try {
        var verifiedUser = await window.AuthClient.verifySession();
        var authoritativeRole = String(verifiedUser.role || '').toLowerCase();
        var teacherRoles = ['teacher', 'faculty', 'hod', 'employee', 'staff', 'instructor'];
        if (teacherRoles.indexOf(authoritativeRole) !== -1) {
          authoritativeRole = 'teacher';
        }

        // 3. Super Admin has universal access
        var isSuperAdmin = (authoritativeRole === 'super_admin' || authoritativeRole === 'admin');
        var isAuthorized = isSuperAdmin || (normalizedAllowed.indexOf(authoritativeRole) !== -1);

        if (!isAuthorized) {
          console.warn('[AuthGuard] Role mismatch. User role:', authoritativeRole, 'Required:', allowedRoles);
          var currentPath = window.location.pathname.split('/').pop() || 'index.html';
          if (window.AuthClient && window.AuthClient.clearSession) {
            window.AuthClient.clearSession();
          }
          window.location.replace('login.html?role=' + encodeURIComponent(normalizedAllowed[0] || '') + '&redirect=' + encodeURIComponent(currentPath));
          return;
        }

        // 4. Expose verified user to window
        window.verifiedUser = verifiedUser;
        window.activeUser = verifiedUser;
        window.currentUser = verifiedUser;

        if (typeof onAuthorized === 'function') {
          onAuthorized(verifiedUser);
        }

      } catch (err) {
        console.warn('[AuthGuard] Session verification error:', err.message);
        var curFile = window.location.pathname.split('/').pop() || 'index.html';
        window.location.replace('login.html?expired=1&redirect=' + encodeURIComponent(curFile));
      }
    },

    /**
     * Helper to require Student access
     */
    requireStudent: function (callback) {
      return this.guardPage(['student'], callback);
    },

    /**
     * Helper to require Teacher access
     */
    requireTeacher: function (callback) {
      return this.guardPage(['teacher', 'hod', 'admin', 'super_admin'], callback);
    },

    /**
     * Helper to require Admin access
     */
    requireAdmin: function (callback) {
      return this.guardPage(['admin', 'super_admin'], callback);
    }
  };

  // Expose globally
  window.AuthGuard = AuthGuard;

})(typeof window !== 'undefined' ? window : this);

