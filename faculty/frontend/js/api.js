/**
<<<<<<< HEAD:faculty/dashboard/js/api.js
 * College ERP - Python Backend API Client
 * Connects Frontend UI directly to the Python FastAPI Backend on Port 8000
 * Integrated with Cloud Supabase PostgreSQL Database
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

const ErpApi = {
  baseUrl: API_BASE_URL,

  async checkHealth() {
    try {
      const res = await fetch("http://localhost:8000/api/v1/profile/active");
      const json = await res.json();
      return { success: res.ok, data: json.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async getProfile() {
    try {
      const res = await fetch(`${this.baseUrl}/profile/active`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn("[ErpApi] Profile fetch error:", e);
      return null;
    }
  },

  async getDepartments() {
    return this.getPrograms();
  },

  async getPrograms() {
    try {
      const res = await fetch(`${this.baseUrl}/master/departments`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
      return [];
    } catch (e) {
      console.warn("[ErpApi] Programs fetch error:", e);
      return [];
    }
  },

  async getClasses(dept = "") {
    try {
      const url = dept ? `${this.baseUrl}/master/classes?department=${encodeURIComponent(dept)}` : `${this.baseUrl}/master/classes`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
      return [];
    } catch (e) {
      console.warn("[ErpApi] Classes fetch error:", e);
      return [];
    }
  },

  async getSubjects(dept = "") {
    return this.getCourses(dept);
  },

  async getCourses(dept = "") {
    try {
      const url = dept ? `${this.baseUrl}/master/subjects?department=${encodeURIComponent(dept)}` : `${this.baseUrl}/master/subjects`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
      return [];
    } catch (e) {
      console.warn("[ErpApi] Courses fetch error:", e);
      return [];
    }
  },

  async getClassCards() {
    try {
      const res = await fetch(`${this.baseUrl}/cards`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
      return [];
    } catch (err) {
      console.warn("[ErpApi] Failed to fetch cards:", err);
      return [];
    }
  },

  async createClassCard(cardData) {
    try {
      const res = await fetch(`${this.baseUrl}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardData)
      });
      return await res.json();
    } catch (err) {
      console.warn("[ErpApi] Create card error:", err);
      return null;
    }
  },

  async deleteClassCard(cardId) {
    try {
      const res = await fetch(`${this.baseUrl}/cards/${cardId}`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (err) {
      console.warn("[ErpApi] Delete card error:", err);
      return null;
    }
  },

  async getStudents(dept = "CSE", classId = "2R1") {
    try {
      const res = await fetch(`${this.baseUrl}/students/class/${encodeURIComponent(classId)}?departmentCode=${encodeURIComponent(dept)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
      return [];
    } catch (err) {
      console.warn("[ErpApi] Failed to fetch students:", err);
      return [];
    }
  },

  async submitAttendance(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/attendance/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.warn("[ErpApi] Failed to submit attendance:", err);
      return null;
    }
  },

  async getRecords() {
    try {
      const res = await fetch(`${this.baseUrl}/attendance/records`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
      return [];
    } catch (err) {
      console.warn("[ErpApi] Failed to fetch attendance records:", err);
      return [];
    }
  },

  async checkDuplicate(dept, classId, date, subjectCode) {
    try {
      const url = `${this.baseUrl}/attendance/check-duplicate?department=${encodeURIComponent(dept)}&classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}&subjectCode=${encodeURIComponent(subjectCode)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data?.isDuplicate || false;
      }
      return false;
    } catch (err) {
      return false;
    }
  }
};

window.ErpApi = ErpApi;
=======
 * Teacher Dashboard ERP - Frontend API Client
 * Connects the frontend to the Node.js/Express Backend (http://localhost:5001/api/v1)
 */

(function () {
  var API_BASE_URL = window.__API_BASE__ || 'http://localhost:5001/api/v1';

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
        return await res.json();
      } catch (err) {
        return { status: 'OFFLINE', error: err.message };
      }
    },

    // 2. Authentication
    login: async function (email, password) {
      email = email || 'rohan.deshmukh@ssgmce.ac.in';
      password = password || 'Faculty@123';
      var res = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password }),
      });
      if (res && res.data && res.data.token) {
        this.setToken(res.data.token);
      }
      return res.data;
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
>>>>>>> 2295e3b306122139332de9d258ca1d23b3deeeba:teacher/frontend/js/api.js
