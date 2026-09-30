/**
 * SSGMCE Student ERP Dashboard - FastAPI & Supabase Client Adapter
 * Connects frontend to Student Backend (http://localhost:8001/api/v1/student)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StudentApi = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_BASE_URL = 'http://localhost:8001/api/v1/student';

  const StudentApi = {
    baseUrl: (typeof window !== 'undefined' && window.__STUDENT_API_BASE__) || DEFAULT_BASE_URL,

    async request(endpoint, options = {}) {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const config = {
        ...options,
        headers
      };

      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      try {
        const res = await fetch(url, config);
        const data = await res.json();
        return data;
      } catch (err) {
        console.warn(`[StudentApi] Request failed for ${url}:`, err.message);
        throw err;
      }
    },

    // 1. Profile
    async getProfile() {
      return await this.request('/profile');
    },

    // 2. Timetable
    async getTimetable(day = null) {
      const qs = day ? `?day=${encodeURIComponent(day)}` : '';
      return await this.request(`/timetable${qs}`);
    },

    // 3. Attendance
    async getAttendance() {
      return await this.request('/attendance');
    },

    // 4. Syllabus
    async getSyllabus() {
      return await this.request('/syllabus');
    },

    // 5. Fees
    async getFees() {
      return await this.request('/fees');
    },

    async initiatePayment(amount) {
      return await this.request('/fees/pay', {
        method: 'POST',
        body: { amount }
      });
    },

    // 6. E-Learning
    async getElearning() {
      return await this.request('/elearning');
    },

    // 7. Change Info
    async getChangeInfoRequests() {
      return await this.request('/change-info');
    },

    async submitChangeInfo(payload) {
      return await this.request('/change-info', {
        method: 'POST',
        body: payload
      });
    },

    // 8. Updation Info
    async getUpdationRecords() {
      return await this.request('/update-info');
    },

    async submitUpdationRecord(payload) {
      return await this.request('/update-info', {
        method: 'POST',
        body: payload
      });
    },

    // 9. D-Wallet
    async getDwallet() {
      return await this.request('/dwallet');
    },

    async uploadDocument(payload) {
      return await this.request('/dwallet/upload', {
        method: 'POST',
        body: payload
      });
    },

    // 10. Examination
    async getExamination() {
      return await this.request('/examination');
    },

    async submitRevaluation(payload) {
      return await this.request('/examination/revaluation', {
        method: 'POST',
        body: payload
      });
    },

    // 11. Notifications
    async getNotifications() {
      return await this.request('/notifications');
    }
  };

  return StudentApi;
});
