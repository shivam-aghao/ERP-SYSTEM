/**
 * College ERP — Teacher Attendance Service Layer
 * frontend/js/teacher-attendance-service.js
 *
 * Strict Zero-LocalStorage Policy for Business Data:
 * Supabase PostgreSQL via FastAPI Backend is the sole authoritative source of truth.
 * No attendance records, drafts, or class cards are stored in browser storage.
 */

(function (window) {
  'use strict';

  function getApiBase() {
    if (window.ERP_CONFIG && window.ERP_CONFIG.API_BASE) {
      return window.ERP_CONFIG.API_BASE;
    }
    var port = (window.location && window.location.port) ? window.location.port : '';
    var origin = (port === '8000')
      ? window.location.origin
      : 'http://' + (window.location.hostname || 'localhost') + ':8000';
    return origin + '/api/v1';
  }

  function getAuthHeaders() {
    var headers = {
      'Content-Type': 'application/json'
    };
    if (window.AuthClient && typeof window.AuthClient.getAccessToken === 'function') {
      var tok = window.AuthClient.getAccessToken();
      if (tok) headers['Authorization'] = 'Bearer ' + tok;
    } else {
      var fallbackTok = localStorage.getItem('ssgmce_access_token') || localStorage.getItem('ssgmce_teacher_token');
      if (fallbackTok) headers['Authorization'] = 'Bearer ' + fallbackTok;
    }
    return headers;
  }

  const AttendanceService = {
    // -------------------------------------------------------------
    // 1. GET ALL ATTENDANCE RECORDS (LIVE DATABASE QUERY)
    // -------------------------------------------------------------
    async getAllRecords() {
      const apiBase = getApiBase();
      try {
        if (window.ErpApi && typeof window.ErpApi.getRecords === 'function') {
          const live = await window.ErpApi.getRecords();
          if (Array.isArray(live)) {
            return live.map(r => ({
              id: r.idDisplay || r.id_display || r.session_code || r.id,
              department: r.departmentCode || r.department_code || "CSE",
              departmentName: "Computer Science & Engineering",
              classId: r.className || r.class_name || "3R",
              subjectCode: r.subjectCode || r.subject_code,
              subjectName: r.subjectName || r.subject_name,
              date: r.sessionDate || r.session_date,
              dateFormatted: r.dateFormatted || r.date_formatted || r.sessionDate || r.session_date,
              totalStudents: r.totalStudents !== undefined ? r.totalStudents : (r.total_students || 0),
              presentCount: r.presentCount !== undefined ? r.presentCount : (r.present_count || 0),
              absentCount: r.absentCount !== undefined ? r.absentCount : ((r.total_students || 0) - (r.present_count || 0)),
              percentage: `${r.attendanceRate !== undefined ? r.attendanceRate : (r.attendance_rate || 0)}%`,
              status: (r.status || "SUBMITTED").toUpperCase() === "SUBMITTED" ? "Submitted" : "Draft",
              savedAt: (r.createdAt || r.created_at) ? new Date(r.createdAt || r.created_at).toLocaleDateString() : "Recorded"
            }));
          }
        }

        const res = await fetch(`${apiBase}/attendance/records?limit=50`, {
          headers: getAuthHeaders()
        });

        if (!res.ok) {
          throw new Error(`Failed to load attendance records (HTTP ${res.status})`);
        }

        const json = await res.json();
        const records = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);

        return records.map(r => ({
          id: r.id_display || r.session_code || r.id,
          department: r.department_code || "CSE",
          departmentName: "Computer Science & Engineering",
          classId: r.class_name || r.class_id || "3R",
          subjectCode: r.subject_code || r.subject_id,
          subjectName: r.subject_name || "Course",
          date: r.session_date,
          dateFormatted: r.date_formatted || r.session_date,
          totalStudents: r.total_students || 0,
          presentCount: r.present_count || 0,
          absentCount: r.absent_count || 0,
          percentage: `${r.attendance_rate || 0}%`,
          status: (r.status || "SUBMITTED").toUpperCase() === "SUBMITTED" ? "Submitted" : "Draft",
          savedAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recorded"
        }));
      } catch (err) {
        console.error("[AttendanceService] Error loading records from server:", err);
        throw err;
      }
    },

    // -------------------------------------------------------------
    // 2. CHECK DUPLICATE ATTENDANCE (LIVE SERVER VALIDATION)
    // -------------------------------------------------------------
    async checkDuplicate(department, classId, date, subjectCode) {
      try {
        const records = await this.getAllRecords();
        if (!Array.isArray(records)) return false;
        return records.some(
          r => (r.classId === classId || r.className === classId) &&
               r.date === date &&
               r.subjectCode === subjectCode &&
               r.status === "Submitted"
        );
      } catch (e) {
        return false;
      }
    },

    // -------------------------------------------------------------
    // 3. GET DRAFT ATTENDANCE FROM DATABASE
    // -------------------------------------------------------------
    async getDraft(department, classId, date, subjectCode) {
      const apiBase = getApiBase();
      try {
        const query = new URLSearchParams({
          class_id: classId || '',
          subject_id: subjectCode || '',
          session_date: date || ''
        }).toString();

        const res = await fetch(`${apiBase}/attendance/draft?${query}`, {
          headers: getAuthHeaders()
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            return json.data;
          }
        }
        return null;
      } catch (e) {
        console.warn("[AttendanceService] Could not fetch draft from server:", e);
        return null;
      }
    },

    // -------------------------------------------------------------
    // 4. SAVE DRAFT TO DATABASE
    // -------------------------------------------------------------
    async saveDraft(sessionData) {
      const apiBase = getApiBase();
      try {
        const presentIds = (sessionData.students || [])
          .filter(s => s.status === "present")
          .map(s => s.id || s.studentCode || s.roll);
        const absentIds = (sessionData.students || [])
          .filter(s => s.status === "absent")
          .map(s => s.id || s.studentCode || s.roll);

        const payload = {
          class_id: sessionData.classId,
          subject_id: sessionData.subjectCode,
          session_date: sessionData.date,
          period_number: sessionData.periodNumber ? parseInt(sessionData.periodNumber) : 1,
          session_type: sessionData.sessionType || "theory",
          present_student_ids: presentIds,
          absent_student_ids: absentIds,
          remarks: sessionData.remarks || "Draft saved from web portal"
        };

        const res = await fetch(`${apiBase}/attendance/draft`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.message || `Draft save failed (HTTP ${res.status})`);
        }

        const data = await res.json();
        return { success: true, message: "Attendance saved as draft in database.", data: data.data };
      } catch (err) {
        console.error("[AttendanceService] Save draft error:", err);
        throw err;
      }
    },

    // -------------------------------------------------------------
    // 5. SUBMIT ATTENDANCE DIRECTLY TO DATABASE
    // -------------------------------------------------------------
    async submitAttendance(sessionData) {
      const apiBase = getApiBase();
      const presentIds = (sessionData.students || [])
        .filter(s => s.status === "present")
        .map(s => s.id || s.studentCode || s.roll);
      const absentIds = (sessionData.students || [])
        .filter(s => s.status === "absent")
        .map(s => s.id || s.studentCode || s.roll);

      const payload = {
        class_id: sessionData.classId,
        subject_id: sessionData.subjectCode,
        session_date: sessionData.date,
        period_number: sessionData.periodNumber ? parseInt(sessionData.periodNumber) : 1,
        session_type: sessionData.sessionType || "theory",
        present_student_ids: presentIds,
        absent_student_ids: absentIds,
        remarks: sessionData.remarks || "Formal attendance submission"
      };

      const res = await fetch(`${apiBase}/attendance/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.detail || errJson.message || `Attendance submission failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const resData = await res.json();
      return {
        success: true,
        message: "Attendance successfully recorded in official database.",
        data: resData.data || resData
      };
    },

    // -------------------------------------------------------------
    // 6. GET TEACHER CLASS CARDS (FETCHED LIVE FROM DATABASE)
    // -------------------------------------------------------------
    async getAllClassCards() {
      const apiBase = getApiBase();
      try {
        if (window.ErpApi && typeof window.ErpApi.getClassCards === 'function') {
          const liveCards = await window.ErpApi.getClassCards();
          if (Array.isArray(liveCards) && liveCards.length > 0) {
            return liveCards;
          }
        }

        const res = await fetch(`${apiBase}/management/teacher/classes`, {
          headers: getAuthHeaders()
        });

        if (res.ok) {
          const json = await res.json();
          const classes = json.data || json || [];
          if (Array.isArray(classes) && classes.length > 0) {
            return classes.map((c, idx) => ({
              id: c.class_id || `CARD-${c.class_name}`,
              department: "CSE",
              department_name: "Computer Science & Engineering",
              class: c.class_name,
              class_name: c.class_name,
              subject_code: c.subject_code || "CSE",
              subject_name: c.subject_name || `${c.class_name} Course`,
              card_type: "assigned",
              time_slot: c.time_slot || "Scheduled Slot",
              room_number: c.room || "Main Building",
              color_gradient: idx % 2 === 0 ? "from-blue-600 to-indigo-700" : "from-teal-600 to-emerald-700"
            }));
          }
        }

        const fallbackRes = await fetch(`${apiBase}/classes`, {
          headers: getAuthHeaders()
        });
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          const list = json.data || json || [];
          if (Array.isArray(list) && list.length > 0) {
            return list.map((c, idx) => ({
              id: c.id,
              department: "CSE",
              department_name: "Computer Science & Engineering",
              class: c.class_name || c.name,
              class_name: c.class_name || c.name,
              subject_code: "CSE-CORE",
              subject_name: `${c.class_name || c.name} Instruction`,
              card_type: "roster",
              time_slot: "Campus Schedule",
              room_number: c.room || "Hall",
              color_gradient: "from-blue-600 to-indigo-700"
            }));
          }
        }

        throw new Error("No authorized classes found for faculty member in database.");
      } catch (err) {
        console.error("[AttendanceService] Class cards load error:", err);
        throw err;
      }
    },

    async getTeacherCards(teacherId) {
      return await this.getAllClassCards();
    }
  };

  window.AttendanceService = AttendanceService;
})(window);
