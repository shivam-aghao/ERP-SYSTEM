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
                fullName: p.fullName || p.full_name || 'Student',
                rollNumber: p.rollNo || p.roll_no || '--',
                enrollmentNumber: p.studentCode || p.student_code || '--',
                department: p.department || p.department_name || 'Computer Science & Engineering',
                semester: p.semester || p.current_semester || '--',
                division: p.division || '--',
                academicYear: p.academicYear || p.academic_year || '--',
                prn: p.prn || '--',
                facultyMentor: p.facultyMentor || p.faculty_mentor || '--',
                email: p.email || p.institutional_email || '--',
                phone: p.phone || p.primary_mobile || '--'
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
          const res = await fetch(`${this.apiBaseUrl}/attendance`);
          if (res.ok) {
            const json = await res.json();
            if (json && json.data) attData = json.data;
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
              code: item.code || item.subjectCode || item.subject_code || '',
              name: item.name || item.subjectName || item.subject_name || '',
              type: item.type || (item.code && item.code.includes('LAB') ? 'PR' : 'TH'),
              typeName: item.typeName || (item.type === 'PR' ? 'Practical' : 'Theory'),
              faculty: item.faculty || item.faculty_name || '',
              classroom: item.classroom || item.room || '',
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
