/**
 * SSGMCE Student ERP Dashboard - FastAPI & Supabase Client Adapter
 * Connects frontend to Student Backend (http://localhost:8000/api/v1/student)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StudentApi = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1/student';

  function getActiveStudentCode() {
    if (typeof window !== 'undefined' && window.ERP_AUTH) {
      const user = window.ERP_AUTH.getCurrentUser();
      if (user && (user.student_code || user.studentCode || user.id)) {
        return user.student_code || user.studentCode || user.id;
      }
    }
    return '308637';
  }

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

    // 0. Health & Overview
    async getHealth() {
      return await this.request('/health');
    },

    async getOverview(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/overview?student_code=${encodeURIComponent(code)}`);
    },

    // 1. Profile
    async getProfile(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/profile?student_code=${encodeURIComponent(code)}`);
    },

    async updateProfile(updates, studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/profile?student_code=${encodeURIComponent(code)}`, {
        method: 'PUT',
        body: updates
      });
    },

    // 2. Academic Metrics
    async getMetrics(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/metrics?student_code=${encodeURIComponent(code)}`);
    },

    // 2.1 Attendance
    async getAttendance(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/attendance?student_code=${encodeURIComponent(code)}`);
    },

    // 3. Timetable
    async getTimetable(day = null) {
      const qs = day ? `?day=${encodeURIComponent(day)}` : '';
      return await this.request(`/timetable${qs}`);
    },

    // 4. Attendance
    async getAttendance(studentCode = '308637') {
      return await this.request(`/attendance?student_code=${encodeURIComponent(studentCode)}`);
    },

    // 5. Syllabus
    async getSyllabus() {
      return await this.request('/syllabus');
    },

    // 6. Fees
    async getFees() {
      return await this.request('/fees');
    },

    async initiatePayment(amount) {
      return await this.request('/fees/pay', {
        method: 'POST',
        body: { amount }
      });
    },

    // 7. E-Learning
    async getElearning() {
      return await this.request('/elearning');
    },

    // 8. Change Info
    async getChangeInfoRequests() {
      return await this.request('/change-info');
    },

    async submitChangeInfo(payload) {
      return await this.request('/change-info', {
        method: 'POST',
        body: payload
      });
    },

    // 9. Updation Info
    async getUpdationRecords() {
      return await this.request('/update-info');
    },

    async submitUpdationRecord(payload) {
      return await this.request('/update-info', {
        method: 'POST',
        body: payload
      });
    },

    // 10. D-Wallet
    async getDwallet(studentCode = '308637') {
      return await this.request(`/dwallet?student_code=${encodeURIComponent(studentCode)}`);
    },

    async uploadDocument(payload, studentCode = '308637') {
      return await this.request(`/dwallet/upload?student_code=${encodeURIComponent(studentCode)}`, {
        method: 'POST',
        body: payload
      });
    },

    // 11. Examination
    async getExamination() {
      return await this.request('/examination');
    },

    async submitRevaluation(payload) {
      return await this.request('/examination/revaluation', {
        method: 'POST',
        body: payload
      });
    },

    // 12. Notifications
    async getNotifications(studentCode = '308637') {
      return await this.request(`/notifications?student_code=${encodeURIComponent(studentCode)}`);
    },

    async markNotificationRead(id) {
      return await this.request(`/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH'
      });
    }
  };

  return StudentApi;
});
