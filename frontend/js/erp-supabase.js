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

  const DEFAULT_CONFIG = {
    url: (typeof window !== 'undefined' && window.__SUPABASE_URL__) || 'https://gftqvclenyplnuoocbwe.supabase.co',
    anonKey: (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY'
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
     * @param {string} studentCode e.g. '308637'
     */
    getStudentAttendanceSummary: async function (studentCode = '308637') {
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
          });

          return { success: true, sessionId: createdSession.id, source: 'supabase' };
        }
      } catch (err) {
        console.warn('[ERPSupabase] Session insert failed, persisting to LocalStorage fallback:', err);
      }

      // Local storage fallback for faculty attendance
      try {
        const existing = JSON.parse(localStorage.getItem('erp_attendance_records') || '[]');
        existing.unshift({
          id: 'SESSION-' + Date.now(),
          ...sessionObj,
          records: recordsArray,
          status: 'Submitted',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('erp_attendance_records', JSON.stringify(existing));
        return { success: true, sessionId: 'LOCAL-' + Date.now(), source: 'local-storage' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  };

  global.ERPSupabase = ERPSupabase;
})(typeof window !== 'undefined' ? window : this);
