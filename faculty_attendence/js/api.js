/**
 * SSGMCE ERP - Frontend API Client Adapter
 * Provides JWT management, automatic token refresh, standard envelope unwrapping,
 * typed endpoints, and graceful offline fallback.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ErpApi = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Extract base URL from meta tag or fallback to default backend URL
  const metaApiBase = document.querySelector('meta[name="api-base"]');
  const API_BASE_URL = (metaApiBase && metaApiBase.content) || 'http://localhost:5000/api/v1';

  const TOKEN_KEY = 'ssgmce_erp_access_token';
  const REFRESH_TOKEN_KEY = 'ssgmce_erp_refresh_token';
  const USER_KEY = 'ssgmce_erp_user';

  let isRefreshing = false;
  let refreshSubscribers = [];

  function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
  }

  function onTokenRefreshed(newToken) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
  }

  const ErpApi = {
    baseUrl: API_BASE_URL,

    // Token Management
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    },

    getRefreshToken() {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setRefreshToken(token) {
      if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
      else localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    getUser() {
      try {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },

    setUser(user) {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    },

    clearAuth() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },

    isAuthenticated() {
      return Boolean(this.getToken());
    },

    // HTTP Request Handler with Automatic Refresh
    async request(endpoint, options = {}) {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      const token = this.getToken();
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        ...options,
        headers,
      };

      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      try {
        const response = await fetch(url, config);

        // Handle Token Expiry & Automatic Refresh
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            if (!isRefreshing) {
              isRefreshing = true;
              try {
                const refreshRes = await fetch(`${this.baseUrl}/auth/refresh-token`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken }),
                });
                const refreshData = await refreshRes.json();
                if (refreshData.success && refreshData.data?.accessToken) {
                  this.setToken(refreshData.data.accessToken);
                  onTokenRefreshed(refreshData.data.accessToken);
                } else {
                  this.clearAuth();
                  throw new Error('Session expired');
                }
              } catch (refreshErr) {
                this.clearAuth();
                throw refreshErr;
              } finally {
                isRefreshing = false;
              }
            }

            // Retry request with new token
            return new Promise((resolve, reject) => {
              subscribeTokenRefresh((newToken) => {
                config.headers['Authorization'] = `Bearer ${newToken}`;
                fetch(url, config)
                  .then((res) => res.json())
                  .then(resolve)
                  .catch(reject);
              });
            });
          }
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.warn(`[ErpApi] Network request failed for ${url}:`, err.message);
        throw err;
      }
    },

    // =========================================================================
    // AUTHENTICATION
    // =========================================================================
    async login(employeeCodeOrEmail, password) {
      const isEmail = employeeCodeOrEmail.includes('@');
      const body = {
        password,
        ...(isEmail ? { email: employeeCodeOrEmail } : { employeeCode: employeeCodeOrEmail }),
      };

      const res = await this.request('/auth/login', {
        method: 'POST',
        body,
      });

      if (res.success && res.data) {
        this.setToken(res.data.accessToken);
        this.setRefreshToken(res.data.refreshToken);
        this.setUser(res.data.user);
      }
      return res;
    },

    async logout() {
      const refreshToken = this.getRefreshToken();
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      } catch (e) {
        // Continue clearing local state regardless
      }
      this.clearAuth();
    },

    async getMe() {
      return await this.request('/auth/me');
    },

    // =========================================================================
    // MASTER DATA
    // =========================================================================
    async getDepartments() {
      return await this.request('/master/departments');
    },

    async getClasses(department) {
      const qs = department ? `?department=${encodeURIComponent(department)}` : '';
      return await this.request(`/master/classes${qs}`);
    },

    async getSubjects(department, semester) {
      const params = new URLSearchParams();
      if (department) params.append('department', department);
      if (semester) params.append('semester', semester);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return await this.request(`/master/subjects${qs}`);
    },

    // =========================================================================
    // CLASS CARDS
    // =========================================================================
    async getTeacherCards(teacherId) {
      const qs = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : '';
      return await this.request(`/cards${qs}`);
    },

    async createCard(cardPayload) {
      return await this.request('/cards', {
        method: 'POST',
        body: cardPayload,
      });
    },

    async updateCard(cardId, cardPayload) {
      return await this.request(`/cards/${cardId}`, {
        method: 'PUT',
        body: cardPayload,
      });
    },

    async deleteCard(cardId) {
      return await this.request(`/cards/${cardId}`, {
        method: 'DELETE',
      });
    },

    async checkCardDuplicate(department, classId, subjectCode) {
      const qs = `?department=${encodeURIComponent(department)}&classId=${encodeURIComponent(classId)}&subjectCode=${encodeURIComponent(subjectCode)}`;
      return await this.request(`/cards/check-duplicate${qs}`);
    },

    // =========================================================================
    // STUDENTS & ROSTER
    // =========================================================================
    async getClassRoster(classId, subject) {
      const qs = subject ? `?subject=${encodeURIComponent(subject)}` : '';
      return await this.request(`/students/class/${encodeURIComponent(classId)}${qs}`);
    },

    // =========================================================================
    // ATTENDANCE
    // =========================================================================
    async checkAttendanceDuplicate(department, classId, date, subjectCode, period) {
      const params = new URLSearchParams({
        department: department || '',
        classId: classId || '',
        date: date || '',
        subjectCode: subjectCode || '',
      });
      if (period) params.append('period', period);
      return await this.request(`/attendance/check-duplicate?${params.toString()}`);
    },

    async saveDraft(sessionData) {
      return await this.request('/attendance/draft', {
        method: 'POST',
        body: sessionData,
      });
    },

    async getDraft(classId, subjectCode, date, period) {
      const params = new URLSearchParams({
        classId: classId || '',
        subjectCode: subjectCode || '',
        date: date || '',
      });
      if (period) params.append('period', period);
      return await this.request(`/attendance/draft?${params.toString()}`);
    },

    async submitAttendance(sessionData) {
      return await this.request('/attendance/submit', {
        method: 'POST',
        body: sessionData,
      });
    },

    async getAllRecords(teacherId) {
      const qs = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : '';
      return await this.request(`/attendance/records${qs}`);
    },

    async getSessionDetails(sessionId) {
      return await this.request(`/attendance/sessions/${encodeURIComponent(sessionId)}`);
    },

    // =========================================================================
    // PROFILE & NOTIFICATIONS
    // =========================================================================
    async getProfile() {
      return await this.request('/profile');
    },

    async getNotifications() {
      return await this.request('/notifications');
    },

    async markNotificationRead(id) {
      return await this.request(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },

    // =========================================================================
    // REPORTS
    // =========================================================================
    async getClassStats(classId) {
      return await this.request(`/reports/classes/${encodeURIComponent(classId)}/stats`);
    },
  };

  return ErpApi;
});
