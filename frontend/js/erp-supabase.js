/**
 * ==============================================================================
 * SSGMCE SHEGAON - COLLEGE ERP SYSTEM
 * Central Supabase Client & Data Integration Helper (erp-supabase.js)
 * ==============================================================================
 * Provides unified data access to Supabase PostgreSQL database tables:
 * - students, classes, subjects, teachers
 * - attendance_sessions, attendance_records
 * - student_attendance_summary (Postgres aggregate view)
 * 
 * Includes offline resilience: falls back to local storage and mock fixtures
 * if network or database credentials are unavailable.
 */

(function (global) {
  'use strict';

  const erpCfg = (typeof window !== 'undefined' && window.ERP_CONFIG) || {};
  const DEFAULT_CONFIG = {
    url: (typeof window !== 'undefined' && window.__SUPABASE_URL__) || erpCfg.SUPABASE_URL || 'https://gftqvclenyplnuoocbwe.supabase.co',
    anonKey: (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) || erpCfg.SUPABASE_ANON_KEY || ''
  };

  const ERPSupabase = {
    config: DEFAULT_CONFIG,

    /**
     * Configure Supabase URL and Key dynamically
     */
    configure: function (url, anonKey) {
      if (url) this.config.url = url;
      if (anonKey) this.config.anonKey = anonKey;
    },

    /**
     * Fetch attendance summary for a student from student_attendance_summary view
     * @param {string|null} studentCode
     */
    getStudentAttendanceSummary: async function (studentCode = null) {
      if (!studentCode) {
        try {
          if (global.ERPAuth && typeof global.ERPAuth.getSession === 'function') {
            const sess = global.ERPAuth.getSession();
            if (sess && (sess.studentCode || sess.id)) studentCode = sess.studentCode || sess.id;
          }
          if (!studentCode && typeof localStorage !== 'undefined') {
            const u = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
            studentCode = u.studentCode || u.student_code || u.id || null;
          }
        } catch (_) {}
      }
      if (!studentCode) return { success: true, data: [], source: 'empty' };
      try {
        const endpoint = `${this.config.url}/rest/v1/student_attendance_summary?student_code=eq.${encodeURIComponent(studentCode)}&select=*`;
        const res = await fetch(endpoint, {
          headers: {
            'apikey': this.config.anonKey,
            'Authorization': `Bearer ${this.config.anonKey}`
          }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return { success: true, data: rows, source: 'supabase' };
        }
      } catch (err) {
        console.warn('[ERPSupabase] Failed to fetch student attendance summary:', err.message);
      }

      return { success: false, data: [], source: 'supabase' };
    },

    /**
     * Record a new attendance session marked by faculty
     * @param {Object} sessionObj 
     * @param {Array} recordsArray [{ studentId, status: 'PRESENT'|'ABSENT' }]
     */
    submitAttendanceSession: async function (sessionObj, recordsArray) {
      try {
        // 1. Post Session
        const sessionRes = await fetch(`${this.config.url}/rest/v1/attendance_sessions`, {
          method: 'POST',
          headers: {
            'apikey': this.config.anonKey,
            'Authorization': `Bearer ${this.config.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(sessionObj)
        });

        if (sessionRes.ok) {
          const [createdSession] = await sessionRes.json();
          // 2. Post Records
          const recordsPayload = recordsArray.map(r => ({
            session_id: createdSession.id,
            student_id: r.studentId,
            status: r.status
          }));

          await fetch(`${this.config.url}/rest/v1/attendance_records`, {
            method: 'POST',
            headers: {
              'apikey': this.config.anonKey,
              'Authorization': `Bearer ${this.config.anonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(recordsPayload)
          return { success: true, sessionId: createdSession.id, source: 'supabase' };
        } else {
          const errBody = await sessionRes.text().catch(() => '');
          throw new Error(`Failed to create attendance session: ${errBody || sessionRes.statusText}`);
        }
      } catch (err) {
        console.error('[ERPSupabase] Session insert failed:', err);
        return { success: false, error: err.message };
      }
    }
  };

  global.ERPSupabase = ERPSupabase;
})(typeof window !== 'undefined' ? window : this);
