/**
 * College ERP - Python Backend API Client
 * Connects Frontend UI directly to the Python FastAPI Backend on Port 5000
 */

const API_BASE_URL = window.location.origin.includes(":5000")
  ? `${window.location.origin}/api/v1`
  : "http://localhost:5000/api/v1";

const ErpApi = {
  baseUrl: API_BASE_URL,

  async checkHealth() {
    try {
      const res = await fetch("http://localhost:5000/health");
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async getClassCards() {
    try {
      const res = await fetch(`${this.baseUrl}/cards`);
      return await res.json();
    } catch (err) {
      console.warn("[Backend API] Failed to fetch cards:", err);
      return null;
    }
  },

  async getStudents(dept = "CSE", classId = "2R1") {
    try {
      const res = await fetch(`${this.baseUrl}/students/class/${classId}?departmentCode=${dept}`);
      return await res.json();
    } catch (err) {
      console.warn("[Backend API] Failed to fetch students:", err);
      return null;
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
      console.warn("[Backend API] Failed to submit attendance:", err);
      return null;
    }
  },

  async getRecords() {
    try {
      const res = await fetch(`${this.baseUrl}/attendance/records`);
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // 1-Click Complete Connection Diagnostic
  async verifyFullConnection() {
    console.log("%c=======================================================", "color: #3B82F6; font-weight: bold;");
    console.log("%c SSGMCE ERP: TRIPLE-TIER CONNECTION DIAGNOSTIC       ", "color: #3B82F6; font-weight: bold; font-size: 14px;");
    console.log("%c=======================================================", "color: #3B82F6; font-weight: bold;");

    // 1. Frontend Check
    console.log("%c[1/3 Frontend UI]    🟢 ALIVE - Running at " + window.location.href, "color: #10B981; font-weight: bold;");

    // 2. Python Backend Check
    const health = await this.checkHealth();
    if (health && health.success) {
      console.log(`%c[2/3 Python Backend] 🟢 CONNECTED - ${health.backend} on port 5000`, "color: #10B981; font-weight: bold;");
    } else {
      console.log("%c[2/3 Python Backend] 🔴 DISCONNECTED - Is 'python run.py' running?", "color: #EF4444; font-weight: bold;");
    }

    // 3. Database Check via Backend
    const cardData = await this.getClassCards();
    const studentData = await this.getStudents("CSE", "2R1");
    if (cardData && cardData.data && studentData && studentData.data) {
      console.log(`%c[3/3 Supabase DB]     🟢 CONNECTED - Loaded ${cardData.data.length} Class Cards & ${studentData.data.length} Students from PostgreSQL!`, "color: #10B981; font-weight: bold;");
    } else {
      console.log("%c[3/3 Supabase DB]     🔴 ERROR querying database tables", "color: #EF4444; font-weight: bold;");
    }

    console.log("%c=======================================================", "color: #3B82F6; font-weight: bold;");
    return {
      frontend: "CONNECTED",
      backend: health?.backend || "DISCONNECTED",
      databaseCards: cardData?.data?.length || 0,
      databaseStudents: studentData?.data?.length || 0
    };
  }
};

window.ErpApi = ErpApi;

// Auto-run diagnostic on page load
ErpApi.verifyFullConnection();
