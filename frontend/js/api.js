/**
 * Teacher Dashboard ERP - Frontend API Client
 * Connects the frontend to the Node.js/Express Backend (http://localhost:5001/api/v1)
 */

(function () {
  var preferredBase = (window.ERP_CONFIG && window.ERP_CONFIG.TEACHER_API_BASE) || 
                      (window.ERP_CONFIG && window.ERP_CONFIG.BACKEND_ORIGIN ? window.ERP_CONFIG.BACKEND_ORIGIN + '/api/v1' : null) || 
                      'http://localhost:8000/api/v1';
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
      try {
        var stored = JSON.parse(localStorage.getItem('ssgmce_user') || localStorage.getItem('ssgmce_active_teacher') || '{}');
        if (stored && stored.id) headers['X-Teacher-Id'] = stored.id;
        if (stored && stored.emp_code) headers['X-Emp-Code'] = stored.emp_code;
      } catch (e) {}
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
      var endpoints = [
        API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/health',
        API_BASE_URL + '/health',
        'http://localhost:8000/health',
        'http://127.0.0.1:8000/health',
        'http://localhost:8000/api/v1/health',
        'http://127.0.0.1:8000/api/v1/health',
        'http://localhost:5001/health'
      ];

      for (var i = 0; i < endpoints.length; i++) {
        var u = endpoints[i];
        try {
          var res = await fetch(u, { signal: AbortSignal.timeout(2000) });
          if (res.ok) {
            var data = await res.json();
            if (data.status === 'OK' || data.status === 'healthy' || data.database === 'connected') {
              var port = u.includes('5001') ? 5001 : 8000;
              API_BASE_URL = u.includes('/api/v1') ? u.replace(/\/health\/?$/, '') : u.replace(/\/health\/?$/, '') + '/api/v1';
              return { 
                status: 'OK', 
                service: data.service || 'ssgmce-unified-erp-backend', 
                port: port,
                supabase: data.supabase || (data.database === 'connected' ? 'connected' : 'offline'),
                database: data.database || 'connected'
              };
            }
          }
        } catch (_) {}
      }

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

      var storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem('ssgmce_user') || localStorage.getItem('ssgmce_active_teacher') || '{}');
      } catch (e) {}

      var loginId = email || (storedUser && (storedUser.email || storedUser.emp_code || storedUser.username)) || 'FAC-01';
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
        if (data && data.user) {
          localStorage.setItem('ssgmce_user', JSON.stringify(data.user));
          localStorage.setItem('ssgmce_active_teacher', JSON.stringify(data.user));
          if (data.user.emp_code) {
            localStorage.setItem('ssgmce_selected_faculty', data.user.emp_code);
          }
        }
        return data;
      } catch (err) {
        console.warn('[TeacherAPI] login note:', err.message);
        var activeUser = (storedUser && storedUser.name) ? storedUser : {
          id: '1f33bd6c-cab3-4205-8daa-1ac23b4d3552',
          name: 'Faculty Member',
          role: 'teacher',
          emp_code: 'FAC-01',
          employeeId: 'FAC-01'
        };
        return {
          user: activeUser,
          token: this.token || 'teach_token_default'
        };
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
      var query = classCode ? '?classCode=' + encodeURIComponent(classCode) + '&class_code=' + encodeURIComponent(classCode) : '';
      var res = await this.request('/students' + query);
      var data = res.data !== undefined ? res.data : res;
      if (data && Array.isArray(data.students)) return data.students;
      if (Array.isArray(data)) return data;
      return (data && data.students) || [];
    },

    // 6. Timetable & Syllabus
    getMyTimetable: async function (teacherId) {
      try {
        var query = teacherId ? '?teacher_id=' + encodeURIComponent(teacherId) : '';
        var res = await this.request('/timetable/my' + query);
        return res.data;
      } catch (err) {
        // Direct Supabase Fallback
        if (typeof window !== 'undefined' && window.ERP_CONFIG && window.ERP_CONFIG.SUPABASE_URL) {
          try {
            var sUrl = window.ERP_CONFIG.SUPABASE_URL;
            var sKey = window.ERP_CONFIG.SUPABASE_ANON_KEY;
            var code = teacherId;
            if (!code) {
              var stored = JSON.parse(localStorage.getItem('ssgmce_user') || localStorage.getItem('ssgmce_active_teacher') || '{}');
              code = stored.emp_code || 'EMP-CSE-1001';
            }
            var resp = await fetch(sUrl + '/rest/v1/timetable_entries?emp_code=eq.' + encodeURIComponent(code) + '&order=slot_index.asc', {
              headers: { 'apikey': sKey, 'Authorization': 'Bearer ' + sKey }
            });
            if (resp.ok) {
              var sEntries = await resp.json();
              if (sEntries && sEntries.length > 0) {
                return {
                  teacher: { emp_code: code, name: sEntries[0].teacher_name, total_load_hours: sEntries.length },
                  entries: sEntries,
                  total_load: sEntries.length
                };
              }
            }
          } catch (se) {}
        }
        throw err;
      }
    },

    getAllTeachers: async function () {
      var res = await this.request('/teachers');
      return res.data;
    },

    getTeacherTimetable: async function (teacherId) {
      var res = await this.request('/timetable/teacher/' + encodeURIComponent(teacherId));
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
