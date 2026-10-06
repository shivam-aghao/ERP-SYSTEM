/**
 * SSGMCE ERP - High-Resilience Dual-Tier API Client
 * Tier 1: Local Python FastAPI Backend (http://localhost:8000/api/v1)
 * Tier 2: Direct Cloud Supabase Client (window.supabaseClient)
 * Seamless automatic fallback ensures the Frontend is ALWAYS connected!
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

const ErpApi = {
  baseUrl: API_BASE_URL,

  /**
   * Health monitor: checks FastAPI backend and Supabase Cloud connection status
   */
  async checkHealth() {
    let backendOnline = false;
    let supabaseOnline = false;

    // Check FastAPI Backend
    try {
      const res = await fetch("http://localhost:8000/health", { cache: "no-store", signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        backendOnline = true;
        const data = await res.json();
        supabaseOnline = data.database === "connected";
      }
    } catch (e) {
      backendOnline = false;
    }

    // Check Supabase directly if backend didn't report
    if (!supabaseOnline && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient.from("teachers").select("id").limit(1);
        if (!error) supabaseOnline = true;
      } catch (e) {
        supabaseOnline = false;
      }
    }

    return { backendOnline, supabaseOnline };
  },

  /**
   * Active Teacher Profile
   */
  async getProfile(empCode = null) {
    // 1. Try FastAPI Backend
    try {
      const url = empCode ? `${this.baseUrl}/profile?empCode=${encodeURIComponent(empCode)}` : `${this.baseUrl}/profile`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {
      console.info("[ErpApi] Backend profile unavailable, falling back to Supabase Cloud...");
    }

    // 2. Fallback to direct Supabase
    if (window.supabaseClient) {
      try {
        let query = window.supabaseClient.from("teachers").select("*").eq("is_active", true);
        if (empCode) query = query.eq("emp_code", empCode);
        const { data, error } = await query.order("created_at", { ascending: true }).limit(1);
        if (!error && data && data.length > 0) {
          const t = data[0];
          return {
            id: t.id,
            empCode: t.emp_code,
            fullName: t.full_name,
            designation: t.designation || "Associate Professor",
            department: t.department_code || "CSE",
            email: t.email,
            avatar: t.avatar_initials || "JP",
            source: "supabase",
          };
        }
      } catch (err) {
        console.warn("[ErpApi] Supabase profile error:", err);
      }
    }

    return null;
  },

  /**
   * Master Data: Departments
   */
  async getDepartments() {
    try {
      const res = await fetch(`${this.baseUrl}/master/departments`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient.from("departments").select("code, name, color").eq("is_active", true);
        if (!error && data) return data;
      } catch (e) {}
    }

    return [
      { code: "CSE", name: "Computer Science & Engineering", color: "#0B5CAD" },
      { code: "ECE", name: "Electronics & Telecommunication", color: "#00A6D6" },
      { code: "ME", name: "Mechanical Engineering", color: "#F59E0B" }
    ];
  },

  async getPrograms() {
    return this.getDepartments();
  },

  /**
   * Master Data: Classes
   */
  async getClasses(dept = "") {
    try {
      const url = dept ? `${this.baseUrl}/master/classes?department=${encodeURIComponent(dept)}` : `${this.baseUrl}/master/classes`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        let query = window.supabaseClient.from("classes").select("id, name, department_code, semester").eq("is_active", true);
        if (dept) query = query.eq("department_code", dept);
        const { data, error } = await query;
        if (!error && data) {
          return data.map(c => ({ id: c.id, name: c.name, departmentCode: c.department_code, semester: c.semester }));
        }
      } catch (e) {}
    }

    return [
      { name: "SY-CSE-A", departmentCode: "CSE", semester: 3 },
      { name: "2R1", departmentCode: "CSE", semester: 3 },
      { name: "2R2", departmentCode: "CSE", semester: 3 },
      { name: "3R", departmentCode: "CSE", semester: 5 },
      { name: "4R", departmentCode: "CSE", semester: 7 }
    ];
  },

  /**
   * Master Data: Subjects / Courses
   */
  async getSubjects(dept = "") {
    try {
      const url = dept ? `${this.baseUrl}/master/subjects?department=${encodeURIComponent(dept)}` : `${this.baseUrl}/master/subjects`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        let query = window.supabaseClient.from("subjects").select("code, name, type, credits, semester").eq("is_active", true);
        if (dept) query = query.eq("department_code", dept);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (e) {}
    }

    return [
      { code: "3CS205MD", name: "Database Management", type: "THEORY", credits: 3 },
      { code: "3CS201DS", name: "Data Structures", type: "THEORY", credits: 4 },
      { code: "3CS202OS", name: "Operating Systems", type: "THEORY", credits: 3 },
      { code: "3CS203CN", name: "Computer Networks", type: "THEORY", credits: 3 },
      { code: "3CS204SE", name: "Software Engineering", type: "THEORY", credits: 3 }
    ];
  },

  async getCourses(dept = "") {
    return this.getSubjects(dept);
  },

  /**
   * Class Cards
   */
  async getClassCards(teacherCode = null) {
    try {
      const url = teacherCode ? `${this.baseUrl}/cards?teacherCode=${encodeURIComponent(teacherCode)}` : `${this.baseUrl}/cards`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) return json.data;
      }
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient.from("class_cards").select("*").eq("is_active", true);
        if (!error && data) {
          return data.map(c => ({
            id: c.id,
            teacherId: c.teacher_id,
            departmentCode: c.department_code,
            departmentName: c.department_name,
            className: c.class_name,
            subjectCode: c.subject_code,
            subjectName: c.subject_name,
            cardType: c.card_type,
            timeSlot: c.time_slot,
            roomNumber: c.room_number,
            colorGradient: c.color_gradient,
          }));
        }
      } catch (e) {}
    }

    return [];
  },

  async createClassCard(cardData) {
    try {
      const res = await fetch(`${this.baseUrl}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentCode: cardData.department || cardData.departmentCode,
          className: cardData.class || cardData.className,
          subjectCode: cardData.subject_code || cardData.subjectCode,
          cardType: cardData.cardType || "scheduled",
          timeSlot: cardData.time_slot || cardData.timeSlot || "02:15 PM - 03:15 PM",
        }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient.from("class_cards").insert([{
          department_code: cardData.department || cardData.departmentCode,
          class_name: cardData.class || cardData.className,
          subject_code: cardData.subject_code || cardData.subjectCode,
          subject_name: cardData.subject_name || cardData.subjectName || "Subject",
          card_type: cardData.cardType || "scheduled",
          time_slot: cardData.time_slot || cardData.timeSlot || "02:15 PM - 03:15 PM",
        }]).select();
        if (!error && data) return { success: true, data: data[0] };
      } catch (e) {}
    }

    return null;
  },

  async deleteClassCard(cardId) {
    try {
      const res = await fetch(`${this.baseUrl}/cards/${cardId}`, { method: "DELETE" });
      if (res.ok) return await res.json();
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient.from("class_cards").delete().eq("id", cardId);
        if (!error) return { success: true };
      } catch (e) {}
    }

    return null;
  },

  /**
   * Students Class Roster
   */
  async getStudents(dept = "CSE", classId = "SY-CSE-A") {
    try {
      const res = await fetch(`${this.baseUrl}/students/roster?classId=${encodeURIComponent(classId)}&department=${encodeURIComponent(dept)}`, {
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from("students")
          .select("id, roll_no, student_code, enrollment_no, name, department_code, class_name, is_provisional")
          .eq("class_name", classId)
          .eq("is_active", true)
          .order("roll_no");
        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.id,
            rollNo: s.roll_no,
            studentCode: s.student_code,
            enrollmentNo: s.enrollment_no,
            name: s.name,
            departmentCode: s.department_code,
            className: s.class_name,
            isProvisional: s.is_provisional,
            recentHistory: [],
          }));
        }
      } catch (e) {}
    }

    return [];
  },

  /**
   * Submit Attendance Session & Student Records
   */
  async submitAttendance(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/attendance/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback: direct Supabase insert
    if (window.supabaseClient) {
      try {
        const presentCount = (payload.records || []).filter(r => r.status === "PRESENT").length;
        const totalCount = (payload.records || []).length;
        const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100 * 100) / 100 : 0;

        const sessionCode = "REC-" + Math.floor(100000 + Math.random() * 900000);
        const { data: sessionData, error: sErr } = await window.supabaseClient.from("attendance_sessions").insert([{
          session_code: sessionCode,
          department_code: payload.department,
          class_name: payload.classId,
          subject_code: payload.subjectCode,
          session_date: payload.date,
          period: payload.period || "1",
          topic_taught: payload.topicTaught || payload.topic,
          remark: payload.remark,
          total_students: totalCount,
          present_count: presentCount,
          absent_count: totalCount - presentCount,
          attendance_rate: rate,
          status: payload.status || "SUBMITTED",
        }]).select();

        if (!sErr && sessionData && sessionData[0]) {
          const sid = sessionData[0].id;
          const recRows = (payload.records || []).map(r => ({
            session_id: sid,
            roll_no: r.rollNo,
            student_id: r.studentId,
            student_name: r.studentName || `Roll ${r.rollNo}`,
            status: r.status,
          }));
          if (recRows.length > 0) {
            await window.supabaseClient.from("attendance_records").insert(recRows);
          }
          return { success: true, data: { sessionId: sid, sessionCode, status: "SUBMITTED" } };
        }
      } catch (e) {
        console.warn("[ErpApi] Supabase attendance submit notice:", e);
      }
    }

    return null;
  },

  /**
   * Recent Attendance Sessions
   */
  async getRecords() {
    try {
      const res = await fetch(`${this.baseUrl}/attendance/recent`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) return json.data;
      }
    } catch (e) {}

    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from("attendance_sessions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);
        if (!error && data) {
          return data.map(r => ({
            id: r.id,
            idDisplay: r.session_code,
            sessionDate: r.session_date,
            departmentCode: r.department_code,
            className: r.class_name,
            subjectCode: r.subject_code,
            subjectName: r.subject_name || r.subject_code,
            presentCount: r.present_count,
            totalStudents: r.total_students,
            attendanceRate: r.attendance_rate,
            status: r.status,
            createdAt: r.created_at,
          }));
        }
      } catch (e) {}
    }

    return [];
  },

  /**
   * Individual Student Report
   */
  async getStudentReport(identifier) {
    try {
      const res = await fetch(`${this.baseUrl}/reports/student/${encodeURIComponent(identifier)}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {}

    return null;
  },

  /**
   * Faculty Conducted Classes Report
   */
  async getTeacherClassesReport(params = {}) {
    try {
      let url = `${this.baseUrl}/reports/teacher-classes`;
      const q = new URLSearchParams(params).toString();
      if (q) url += `?${q}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) return json.data;
      }
    } catch (e) {}

    return [];
  },

  async checkDuplicate(dept, classId, date, subjectCode) {
    try {
      const url = `${this.baseUrl}/attendance/check-duplicate?department=${encodeURIComponent(dept)}&classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}&subjectCode=${encodeURIComponent(subjectCode)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const json = await res.json();
        return json.data?.isDuplicate || false;
      }
    } catch (err) {}
    return false;
  }
};

window.ErpApi = ErpApi;
