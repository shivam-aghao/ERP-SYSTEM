/**
 * Teacher Dashboard ERP - Frontend API Client
 * Connects the frontend to the Node.js/Express Backend (http://localhost:5001/api/v1)
 */

(function () {
  var API_BASE_URL = window.__API_BASE__ || 'http://localhost:8000/api/v1';

  var TeacherAPI = {
    token: localStorage.getItem('ssgmce_teacher_token') || null,

    setToken: function (token) {
      this.token = token;
      if (token) {
        localStorage.setItem('ssgmce_teacher_token', token);
      } else {
        localStorage.removeItem('ssgmce_teacher_token');
      }
    },

    getHeaders: function () {
      var headers = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['Authorization'] = 'Bearer ' + this.token;
      }
      return headers;
    },

    request: async function (endpoint, options) {
      options = options || {};
      var url = API_BASE_URL + endpoint;
      var config = Object.assign(
        {
          headers: this.getHeaders(),
        },
        options
      );

      try {
        var response = await fetch(url, config);
        var data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Request failed with status ' + response.status);
        }
        return data;
      } catch (err) {
        console.warn('[TeacherAPI] ' + endpoint + ':', err.message);
        throw err;
      }
    },

    // 1. Healthcheck
    checkHealth: async function () {
      try {
        var baseRoot = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
        var res = await fetch(baseRoot + '/health');
        var data = await res.json();
        if (data && (data.status === 'OK' || data.status === 'healthy' || data.healthy)) {
          return { status: 'OK', details: data };
        }
        return data;
      } catch (err) {
        return { status: 'OFFLINE', error: err.message };
      }
    },

    // 2. Authentication
    login: async function (email, password) {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      var res = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password }),
      });
      if (res && res.data) {
        var token = res.data.token || res.data.accessToken;
        if (token) this.setToken(token);
      }
      return res.data;
    },

    getProfile: async function (empCode) {
      var query = empCode ? '?empCode=' + encodeURIComponent(empCode) : '';
      var res = await this.request('/teacher/profile' + query);
      return res.data;
    },

    // 3. Dashboard KPI metrics & timetable
    getDashboardSummary: async function () {
      var res = await this.request('/dashboard/summary');
      return res.data;
    },

    // 4. Attendance Sessions
    getSessions: async function (filters) {
      filters = filters || {};
      var params = new URLSearchParams(filters).toString();
      var res = await this.request('/attendance/sessions?' + params);
      return res.data;
    },

    createSession: async function (sessionData) {
      var res = await this.request('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
      return res.data;
    },

    markAttendanceRecord: async function (sessionId, recordData) {
      var res = await this.request('/attendance/sessions/' + sessionId + '/mark', {
        method: 'POST',
        body: JSON.stringify(recordData),
      });
      return res.data;
    },

    submitSession: async function (sessionId, records) {
      var res = await this.request('/attendance/sessions/' + sessionId + '/submit', {
        method: 'POST',
        body: JSON.stringify({ records: records }),
      });
      return res.data;
    },

    // 5. Academic Data (Departments, Classes, Subjects, Students)
    getDepartments: async function () {
      var res = await this.request('/departments');
      return res.data;
    },

    getClasses: async function (departmentCode) {
      var query = departmentCode ? '?departmentCode=' + encodeURIComponent(departmentCode) : '';
      var res = await this.request('/classes' + query);
      return res.data;
    },

    getSubjects: async function (classCode) {
      var query = classCode ? '?classCode=' + encodeURIComponent(classCode) : '';
      var res = await this.request('/subjects' + query);
      return res.data;
    },

    getStudents: async function (classCode) {
      var query = classCode ? '?classCode=' + encodeURIComponent(classCode) : '';
      var res = await this.request('/students' + query);
      return res.data;
    },

    // 6. Timetable & Syllabus
    getMyTimetable: async function () {
      var res = await this.request('/timetable/my');
      return res.data;
    },

    getSyllabusProgress: async function (subjectCode, classCode) {
      var res = await this.request('/syllabus/' + subjectCode + '/' + classCode);
      return res.data;
    },

    // 7. Notifications
    getNotifications: async function () {
      var res = await this.request('/notifications');
      return res.data;
    },
  };

  // Expose safely to window
  window.TeacherAPI = TeacherAPI;
})();
