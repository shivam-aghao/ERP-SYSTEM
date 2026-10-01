/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL
 * Dynamic Live Attendance Service Layer (FastAPI & Supabase Connected)
 */

(function () {
  'use strict';

  const root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global);

  class AttendanceService {
    constructor() {
      this.apiBaseUrl = 'http://localhost:8001/api/v1/student';
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
                fullName: p.fullName || 'Shivam Sanjay Aghao',
                rollNumber: p.rollNo || 21,
                enrollmentNumber: p.studentCode || 'CSE2401',
                department: p.department || 'Computer Science & Engineering',
                semester: p.semester || 5,
                division: p.division || 'A',
                academicYear: p.academicYear || '2026-2027',
                prn: p.prn || 'CSE2401',
                facultyMentor: p.facultyMentor || 'Dr. Rohan Deshmukh (HOD, CSE)',
                email: p.email || 'shivam.aghao@ssgmce.ac.in',
                phone: p.phone || '+91 94221 88219'
              }
            };
          }
        }
      } catch (err) {
        console.warn('AttendanceService: Live profile fetch failed, using fallback:', err);
      }

      return { success: true, data: this._getData().studentProfile || {} };
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
        console.warn('AttendanceService: Fetch failed, using isolated fallback', err);
      }

      // Offline fallback
      const rawList = this._getData().attendanceData || [];
      const list = rawList.map(item => {
        const pct = calc.calculatePercentage ? calc.calculatePercentage(item.present, item.total) : Number(((item.present / item.total) * 100).toFixed(2));
        const status = calc.getStatus ? calc.getStatus(pct) : { label: 'Active', badgeClass: 'att-badge-good' };
        return {
          ...item,
          absent: item.total - item.present,
          percentage: pct,
          status
        };
      });
      return { success: true, data: list };
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
