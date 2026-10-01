/**
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
