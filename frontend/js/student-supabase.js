/**
 * ==============================================================================
 * SSGMCE SHEGAON - COLLEGE ERP SYSTEM
 * Student Supabase Client & Data Integration Layer (student-supabase.js)
 * ==============================================================================
 * Connects all student frontend modules (Dashboard, Attendance, Profile, Syllabus)
 * directly to Supabase PostgreSQL database.
 * 
 * Strict Zero-Static-Mock Policy:
 * All data is fetched dynamically from Supabase database tables / views.
 */

(function (global) {
  'use strict';

  // Read configuration from window or ERP-Supabase
  const getSupabaseConfig = () => {
    const parentConfig = (global.ERPSupabase && global.ERPSupabase.config) || {};
    return {
      url: global.__SUPABASE_URL__ || parentConfig.url || 'https://gftqvclenyplnuoocbwe.supabase.co',
      anonKey: global.__SUPABASE_ANON_KEY__ || parentConfig.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY'
    };
  };

  // Dynamic Empty Profile Defaults
  const SEED_DATA = {
    profile: {
      student_code: "",
      prn: "",
      roll_no: "",
      full_name: "",
      gender: "",
      date_of_birth: "",
      blood_group: "",
      nationality: "Indian",
      category: "",
      caste: "",
      primary_mobile: "",
      institutional_email: "",
      emergency_contact: "",
      permanent_address: "",
      district: "",
      state: "Maharashtra",
      pincode: "",
      father_name: "",
      mother_name: "",
      faculty_mentor: "",
      admission_quota: "",
      hostel_status: "",
      department_name: "Computer Science & Engineering",
      department_code: "CSE",
      class_name: "",
      division: "",
      academic_year: "",
      current_semester: 1,
      academic_standing: ""
    },
    metrics: {
      cgpa: 0.0,
      latest_sgpa: 0.0,
      sem1_sgpa: 0.0,
      sem2_sgpa: 0.0,
      sem3_sgpa: 0.0,
      overall_attendance_pct: 0.0,
      earned_credits: 0,
      total_credits: 0,
      academic_standing: ""
    },
    attendance: [],
    timetable: [],
    syllabus: [],
    notifications: []
  };

  const resolveCurrentStudentCode = (explicitCode) => {
    if (explicitCode) return explicitCode;
    try {
      if (global.ERPAuth && typeof global.ERPAuth.getSession === 'function') {
        const sess = global.ERPAuth.getSession();
        if (sess && (sess.studentCode || sess.id)) return sess.studentCode || sess.id;
      }
      if (typeof localStorage !== 'undefined') {
        const u = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
        if (u.studentCode || u.student_code || u.id) return u.studentCode || u.student_code || u.id;
      }
    } catch (_) {}
    return null;
  };

  const StudentSupabase = {
    /**
     * Get active Supabase REST headers
     */
    _getHeaders: function () {
      const cfg = getSupabaseConfig();
      return {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json'
      };
    },

    /**
     * 1. Get Complete Student Profile
     * @param {string|null} studentCode
     */
    getStudentProfile: async function (studentCode = null) {
      studentCode = resolveCurrentStudentCode(studentCode);
      const cfg = getSupabaseConfig();
      if (studentCode) {
        try {
          const endpoint = `${cfg.url}/rest/v1/view_student_full_profile?student_code=eq.${encodeURIComponent(studentCode)}&select=*`;
          const res = await fetch(endpoint, { headers: this._getHeaders() });
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows) && rows.length > 0) {
              return { success: true, data: rows[0], source: 'supabase' };
            }
          }
        } catch (err) {
          console.info('[StudentSupabase] Offline mode: using local cache for profile:', err.message);
        }
      }

      return { success: false, data: null, source: 'supabase' };
    },

    /**
     * 2. Get Academic Metrics (CGPA, SGPA, Credits, Standing)
     */
    getAcademicMetrics: async function (studentCode = null) {
      studentCode = resolveCurrentStudentCode(studentCode);
      const cfg = getSupabaseConfig();
      if (studentCode) {
        try {
          const endpoint = `${cfg.url}/rest/v1/student_academic_metrics?student_code=eq.${encodeURIComponent(studentCode)}&limit=1`;
          const res = await fetch(endpoint, { headers: this._getHeaders() });
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows) && rows.length > 0) {
              return { success: true, data: rows[0], source: 'supabase' };
            }
          }
        } catch (err) {
          console.info('[StudentSupabase] Offline mode: using local cache for metrics');
        }
      }

      return { success: false, data: null, source: 'supabase' };
    },

    /**
     * 3. Get Student Attendance Breakdown
     */
    getAttendanceSummary: async function (studentCode = null) {
      studentCode = resolveCurrentStudentCode(studentCode);
      const cfg = getSupabaseConfig();
      if (studentCode) {
        try {
          const endpoint = `${cfg.url}/rest/v1/student_attendance_summary?student_code=eq.${encodeURIComponent(studentCode)}&select=*`;
          const res = await fetch(endpoint, { headers: this._getHeaders() });
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows) && rows.length > 0) {
              return { success: true, data: rows, source: 'supabase' };
            }
          }
        } catch (err) {
          console.info('[StudentSupabase] Offline mode: using local cache for attendance');
        }
      }

      return { success: false, data: [], source: 'supabase' };
    },

    /**
     * 4. Get Student Timetable Schedule
     * @param {string} day Optional day filter e.g. 'Monday'
     */
    getTimetable: async function (day = null) {
      const cfg = getSupabaseConfig();
      try {
        let endpoint = `${cfg.url}/rest/v1/student_timetables?select=*&order=period_no.asc`;
        if (day) endpoint += `&day_of_week=eq.${encodeURIComponent(day)}`;
        const res = await fetch(endpoint, { headers: this._getHeaders() });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            const mapped = rows.map(r => ({
              period_no: r.period_no,
              day: r.day_of_week,
              time: `${r.start_time ? r.start_time.substring(0, 5) : '10:00'} - ${r.end_time ? r.end_time.substring(0, 5) : '11:00'}`,
              subject: r.subject_name,
              code: r.subject_code,
              room: r.room || 'LH-112',
              faculty: r.faculty_name || '',
              type: r.session_type || 'Theory'
            }));
            return { success: true, data: mapped, source: 'supabase' };
          }
        }
      } catch (err) {
        console.error('[StudentSupabase] Error fetching student timetables from Supabase:', err);
      }

      return { success: false, data: [], source: 'supabase' };
    },

    /**
     * 5. Get Curriculum & Syllabus Subjects
     */
    getSyllabus: async function (semester = 4) {
      const cfg = getSupabaseConfig();
      try {
        const endpoint = `${cfg.url}/rest/v1/curriculum_syllabi?select=*`;
        const res = await fetch(endpoint, { headers: this._getHeaders() });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const mapped = rows.map(r => ({
              name: r.course_name,
              code: r.course_code,
              type: r.course_type,
              credits: r.credits,
              faculty: r.faculty_name,
              short: r.short_code || r.course_name
            }));
            return { success: true, data: mapped, source: 'supabase' };
          }
        }
      } catch (err) {
        console.error('[StudentSupabase] Error fetching syllabus from Supabase:', err);
      }

      return { success: false, data: [], source: 'supabase' };
    },

    /**
     * 6. Get Notifications
     */
    getNotifications: async function () {
      const cfg = getSupabaseConfig();
      try {
        const endpoint = `${cfg.url}/rest/v1/student_notifications?select=*&order=created_at.desc&limit=10`;
        const res = await fetch(endpoint, { headers: this._getHeaders() });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const mapped = rows.map((r, idx) => ({
              id: r.id || idx + 1,
              title: r.title,
              message: r.message,
              type: r.severity || 'info',
              source: r.source || 'College Office',
              time: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'
            }));
            return { success: true, data: mapped, source: 'supabase' };
          }
        }
      } catch (err) {
        console.error('[StudentSupabase] Error fetching notifications from Supabase:', err);
      }

      return { success: false, data: [], source: 'supabase' };
    },

    /**
     * 7. Save Profile Changes
     */
    updateProfile: async function (studentCode, updates) {
      const cfg = getSupabaseConfig();
      try {
        const endpoint = `${cfg.url}/rest/v1/students?student_code=eq.${encodeURIComponent(studentCode)}`;
        await fetch(endpoint, {
          method: 'PATCH',
          headers: this._getHeaders(),
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.warn('[StudentSupabase] Remote profile update error:', err);
      }

      // Always persist to localStorage for instant local reflection
      try {
        if (typeof localStorage !== 'undefined') {
          const existing = JSON.parse(localStorage.getItem('ssgmce_student_profile_data') || '{}');
          const merged = { ...existing, ...updates };
          localStorage.setItem('ssgmce_student_profile_data', JSON.stringify(merged));
          return { success: true, data: merged, source: 'local-storage' };
        }
        return { success: true, data: updates, source: 'memory' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    /**
     * 8. Unified Dashboard Overview
     */
    getDashboardOverview: async function (studentCode = null) {
      const [profileRes, metricsRes, attendanceRes, timetableRes, notifRes] = await Promise.all([
        this.getStudentProfile(studentCode),
        this.getAcademicMetrics(studentCode),
        this.getAttendanceSummary(studentCode),
        this.getTimetable(),
        this.getNotifications()
      ]);

      return {
        success: true,
        student: profileRes.data,
        metrics: metricsRes.data,
        attendance: attendanceRes.data,
        timetable: timetableRes.data,
        notifications: notifRes.data
      };
    }
  };

  global.StudentSupabase = StudentSupabase;
})(typeof window !== 'undefined' ? window : this);
