/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL
 * Dynamic Live Attendance Service Layer (FastAPI & Supabase Connected)
 */

(function () {
  'use strict';

  const root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global);

  class AttendanceService {
    constructor() {
      this.apiBaseUrl = 'http://localhost:8000/api/v1/student';
      this.useMockData = false;
    }

    _getData() {
      return root.AttendanceData || {};
    }

    _getCalculations() {
      return root.AttendanceCalculations || {};
    }

    /**
     * Fetch active student metadata from live backend
     */
    async getStudentProfile() {
      try {
        if (typeof root.StudentApi !== 'undefined' && typeof root.StudentApi.getProfile === 'function') {
          const res = await root.StudentApi.getProfile();
          if (res && res.data) {
            const p = res.data;
            return {
              success: true,
              data: {
                fullName: p.fullName || p.full_name || '',
                rollNumber: p.rollNo || p.roll_no || '',
                enrollmentNumber: p.studentCode || p.student_code || '',
                department: p.department || p.department_name || '',
                semester: p.semester || p.current_semester || '',
                division: p.division || '',
                academicYear: p.academicYear || p.academic_year || '',
                prn: p.prn || '',
                facultyMentor: p.facultyMentor || p.faculty_mentor || '',
                email: p.email || p.institutional_email || '',
                phone: p.phone || p.primary_mobile || ''
              }
            };
          }
        }
      } catch (err) {
        console.warn('AttendanceService: Live profile fetch failed:', err);
      }

      return { success: false, data: {} };
    }

    /**
     * Fetch all subject-wise attendance entries dynamically from FastAPI & Supabase
     */
    async getAttendanceList() {
      const calc = this._getCalculations();

      try {
        let attData = null;
        if (typeof root.StudentApi !== 'undefined' && typeof root.StudentApi.getAttendance === 'function') {
          const res = await root.StudentApi.getAttendance();
          if (res && res.data) {
            attData = res.data;
          }
        } else {
          try {
            const res = await fetch(`${this.apiBaseUrl}/attendance`);
            if (res.ok) {
              const json = await res.json();
              if (json && json.data) attData = json.data;
            }
          } catch (fetchErr) {
            console.warn('[AttendanceService] Backend fetch notice:', fetchErr);
          }
        }

        // Direct Cloud Supabase Fallback
        if (!attData && (typeof window !== 'undefined')) {
          try {
            const sbUrl = 'https://gftqvclenyplnuoocbwe.supabase.co/rest/v1';
            const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY';
            let userCode = '308637';
            try {
              const stored = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
              userCode = stored.student_code || stored.studentCode || stored.enrollmentNo || '308637';
            } catch (e) {}

            const sRes = await fetch(`${sbUrl}/student_attendance_subjects?student_code=eq.${encodeURIComponent(userCode)}&order=subject_code`, {
              headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }
            });
            if (sRes.ok) {
              const subs = await sRes.json();
              if (subs && subs.length > 0) {
                attData = {
                  student_code: userCode,
                  subjectWise: subs.map(s => ({
                    code: s.subject_code,
                    name: s.subject_name,
                    type: s.subject_type,
                    typeName: s.type_name,
                    attended: s.present_periods,
                    total: s.total_periods,
                    percentage: s.total_periods > 0 ? Number(((s.present_periods / s.total_periods) * 100).toFixed(2)) : 0,
                    faculty: s.faculty_name,
                    classroom: s.classroom
                  }))
                };
              }
            }
          } catch (sbErr) {
            console.warn('[AttendanceService] Direct Supabase fetch notice:', sbErr);
          }
        }

        if (attData && attData.subjectWise && attData.subjectWise.length > 0) {
          const list = attData.subjectWise.map((item, idx) => {
            const attended = item.attended !== undefined ? item.attended : (item.present || 0);
            const total = item.total !== undefined ? item.total : 0;
            const pct = item.percentage !== undefined ? Number(item.percentage) : (total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 0);
            const status = calc.getStatus ? calc.getStatus(pct) : {
              label: pct >= 75 ? 'Safe Zone' : 'Critical (<75%)',
              badgeClass: pct >= 75 ? 'att-badge-good' : 'att-badge-danger'
            };

            return {
              id: item.id || `sub-${idx}`,
              code: item.code || item.subjectCode || 'SUB-101',
              name: item.name || item.subjectName || 'Course',
              type: item.type || (item.code && item.code.includes('LAB') ? 'PR' : 'TH'),
              typeName: item.typeName || (item.type === 'PR' ? 'Practical' : 'Theory'),
              faculty: item.faculty || 'Course Faculty',
              classroom: item.classroom || 'LH-201',
              present: attended,
              total: total,
              absent: total >= attended ? total - attended : 0,
              percentage: pct,
              status
            };
          });

          return { success: true, data: list, overall: attData };
        }
      } catch (err) {
        console.warn('AttendanceService: Fetch failed:', err);
      }

      return { success: false, data: [] };
    }

    /**
     * Fetch aggregated 4-card metrics
     */
    async getSummaryCards() {
      const { data } = await this.getAttendanceList();
      const calc = this._getCalculations();
      const summary = calc.computeSummary ? calc.computeSummary(data) : {};
      return { success: true, data: summary };
    }

    /**
     * Fetch analytical insights & risk metrics
     */
    async getInsights() {
      const { data } = await this.getAttendanceList();
      const calc = this._getCalculations();
      const insights = calc.computeInsights ? calc.computeInsights(data) : {};
      return { success: true, data: insights };
    }

    /**
     * Calculate target consecutive classes needed
     */
    calculateTarget(present, total, targetPct) {
      const calc = this._getCalculations();
      return calc.calculateConsecutiveNeeded ? calc.calculateConsecutiveNeeded(present, total, targetPct) : { needed: 0 };
    }
  }

  root.AttendanceService = new AttendanceService();
})();
