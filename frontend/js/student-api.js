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

  function resolveBaseUrl() {
    if (typeof window !== 'undefined' && window.__STUDENT_API_BASE__) {
      return window.__STUDENT_API_BASE__;
    }
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      return `${window.location.origin}/api/v1/student`;
    }
    return 'http://127.0.0.1:8000/api/v1/student';
  }

  function getActiveStudentCode() {
    if (typeof window !== 'undefined' && window.ERP_AUTH) {
      const user = window.ERP_AUTH.getCurrentUser();
      if (user && (user.student_code || user.studentCode || user.id)) {
        return user.student_code || user.studentCode || user.id;
      }
    }
    return '';
  }

  const StudentApi = {
    get baseUrl() {
      return resolveBaseUrl();
    },

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
    async getAttendance(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/attendance?student_code=${encodeURIComponent(code)}`);
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

    // 10. D-Wallet & Documents
    async getDwallet(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/dwallet?student_code=${encodeURIComponent(code)}`);
    },

    async getDocuments(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/documents?student_code=${encodeURIComponent(code)}`);
    },

    async getCertificates(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/certificates?student_code=${encodeURIComponent(code)}`);
    },

    async verifyCertificate(code) {
      return await this.request(`/certificates/verify/${encodeURIComponent(code)}`);
    },

    async uploadDocument(payload, studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/dwallet/upload?student_code=${encodeURIComponent(code)}`, {
        method: 'POST',
        body: payload
      });
    },

    // 11. Examination & Academic Records
    async getExamination(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/examination?student_code=${encodeURIComponent(code)}`);
    },

    async getAcademicDashboard(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/academic-dashboard?student_code=${encodeURIComponent(code)}`);
    },

    async getSemesterResults(studentCode = null, semester = null) {
      const code = studentCode || getActiveStudentCode();
      const semParam = semester ? `&semester=${encodeURIComponent(semester)}` : '';
      return await this.request(`/semester-results?student_code=${encodeURIComponent(code)}${semParam}`);
    },

    async getAcademicHistory(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/academic-history?student_code=${encodeURIComponent(code)}`);
    },

    async getFeeTransactions(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      return await this.request(`/fee-transactions?student_code=${encodeURIComponent(code)}`);
    },

    async submitRevaluation(payload) {
      return await this.request('/examination/revaluation', {
        method: 'POST',
        body: payload
      });
    },

    // 12. Step 7 Notifications & Real-Time Alerts
    async getNotifications(options = {}) {
      const code = (typeof options === 'string' ? options : options.studentCode) || getActiveStudentCode();
      const status = options.status || 'all';
      const type = options.type || '';
      const priority = options.priority || '';
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      let q = `/notifications/list?user_id=${encodeURIComponent(code)}&status=${encodeURIComponent(status)}&limit=${limit}&offset=${offset}`;
      if (type) q += `&type=${encodeURIComponent(type)}`;
      if (priority) q += `&priority=${encodeURIComponent(priority)}`;
      
      const rootUrl = this.baseUrl.replace(/\/student$/, '');
      const res = await fetch(`${rootUrl}${q}`);
      return await res.json();
    },

    async getUnreadCounts(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      const rootUrl = this.baseUrl.replace(/\/student$/, '');
      const res = await fetch(`${rootUrl}/notifications/unread-count?user_id=${encodeURIComponent(code)}`);
      return await res.json();
    },

    async markNotificationRead(id, studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      const rootUrl = this.baseUrl.replace(/\/student$/, '');
      const res = await fetch(`${rootUrl}/notifications/mark-read/${encodeURIComponent(id)}?user_id=${encodeURIComponent(code)}`, {
        method: 'POST'
      });
      return await res.json();
    },

    async markAllNotificationsRead(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      const rootUrl = this.baseUrl.replace(/\/student$/, '');
      const res = await fetch(`${rootUrl}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: code })
      });
      return await res.json();
    },

    async dismissNotification(id, studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      const rootUrl = this.baseUrl.replace(/\/student$/, '');
      const res = await fetch(`${rootUrl}/notifications/dismiss/${encodeURIComponent(id)}?user_id=${encodeURIComponent(code)}`, {
        method: 'POST'
      });
      return await res.json();
    },

    async getNotificationPreferences(studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      const rootUrl = this.baseUrl.replace(/\/student$/, '');
      const res = await fetch(`${rootUrl}/notifications/preferences?user_id=${encodeURIComponent(code)}`);
      return await res.json();
    },

    async updateNotificationPreferences(preferences, studentCode = null) {
      const code = studentCode || getActiveStudentCode();
      const rootUrl = this.baseUrl.replace(/\/student$/, '');
      const res = await fetch(`${rootUrl}/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: code, preferences })
      });
      return await res.json();
    }
  };

  return StudentApi;
});
