/**
 * Teacher Dashboard ERP - Frontend API Client
 * Connects the frontend to the Node.js/Express Backend (http://localhost:5001/api/v1)
 */

(function () {
  var preferredBase = (window.ERP_CONFIG && window.ERP_CONFIG.TEACHER_API_BASE) || 'http://localhost:5001/api/v1';
  var fallbackBase = (window.ERP_CONFIG && window.ERP_CONFIG.API_BASE) || window.__API_BASE__ || 'http://localhost:8000/api/v1';
  var API_BASE_URL = preferredBase;

  var TeacherAPI = {
    token: localStorage.getItem('ssgmce_teacher_token') || null,

    getBaseUrl: function () {
      return API_BASE_URL;
    },

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
      // Step 1: Probe configured Teacher API Base (port 8000 by default in config.js)
      try {
        var root = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
        var res = await fetch(root + '/health');
        if (res.ok) {
          var data = await res.json();
          if (data.status === 'OK' || data.status === 'healthy') {
            return { status: 'OK', service: data.service || 'ssgmce-unified-erp-backend', port: 8000 };
          }
        }
      } catch (_) {}

      // Step 2: Probe FastAPI Unified Backend on port 8000 explicitly
      try {
        var base8000 = (window.ERP_CONFIG && window.ERP_CONFIG.BACKEND_ORIGIN) || 'http://localhost:8000';
        var res2 = await fetch(base8000 + '/health');
        if (res2.ok) {
          var data2 = await res2.json();
          if (data2.status === 'OK' || data2.status === 'healthy') {
            API_BASE_URL = base8000 + '/api/v1';
            return { status: 'OK', service: data2.service || 'ssgmce-unified-erp-backend', port: 8000 };
          }
        }
      } catch (_) {}

      // Step 3: Probe optional Express Teacher Backend on port 5001 if available
      try {
        var res3 = await fetch('http://localhost:5001/health');
        if (res3.ok) {
          var data3 = await res3.json();
          if (data3.status === 'OK' || data3.status === 'healthy') {
            API_BASE_URL = 'http://localhost:5001/api/v1';
            return { status: 'OK', service: data3.service || 'ssgmce-teacher-dashboard-backend', port: 5001 };
          }
        }
      } catch (_) {}

      return { status: 'OFFLINE', error: 'No backend responding' };
    },

    login: async function (email, password) {
      // If session is already authenticated via ERP_AUTH, return active user
      if (window.ERP_AUTH && window.ERP_AUTH.isAuthenticated()) {
        var u = window.ERP_AUTH.getCurrentUser();
        var tok = localStorage.getItem('ssgmce_teacher_token') || 'token_session_live';
        this.setToken(tok);
        return { user: u, token: tok };
      }

      var loginId = email || 'FAC-01';
      var loginPass = password || 'faculty123';
      try {
        var res = await this.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: loginId, password: loginPass, user_id: loginId, role: 'teacher' }),
        });
        var data = res.data || res;
        var token = (data && data.token) || res.token;
        if (token) {
          this.setToken(token);
        }
        return data;
      } catch (err) {
        console.warn('[TeacherAPI] login note:', err.message);
        return { user: { name: 'Faculty Member', role: 'teacher' } };
      }
    },

    getProfile: async function () {
      var res = await this.request('/auth/profile');
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
