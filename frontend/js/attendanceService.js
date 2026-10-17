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
            const fullName = p.fullName || p.full_name || p.name || 'Aghao Shivam Sanjay';
            const className = p.className || p.class_name || p.class || 'TY B.E. Computer Science and Engineering-A';
            const rollNo = p.rollNo || p.roll_no || p.rollNumber || '3R71';
            const studentCode = p.studentCode || p.student_code || p.enrollmentNumber || '308637';
            return {
              success: true,
              data: {
                name: fullName,
                fullName: fullName,
                class: className,
                className: className,
                rollNo: rollNo,
                rollNumber: rollNo,
                enrollmentNumber: studentCode,
                studentCode: studentCode,
                department: p.department || p.department_name || 'Computer Science & Engineering',
                semester: p.semester || p.current_semester || 'V',
                division: p.division || 'A',
                academicYear: p.academicYear || p.academic_year || '2026-2027',
                prn: p.prn || studentCode,
                facultyMentor: p.facultyMentor || p.faculty_mentor || 'Dr. J. M. Patil',
                email: p.email || p.institutional_email || '308637@ssgmce.ac.in',
                phone: p.phone || p.primary_mobile || '9876543210'
              }
            };
          }
        }
      } catch (err) {
        console.warn('AttendanceService: Live profile fetch failed:', err);
      }

      // Local storage / session fallback
      try {
        const u = (typeof window !== 'undefined' && window.ERP_AUTH && typeof window.ERP_AUTH.getCurrentUser === 'function' && window.ERP_AUTH.getCurrentUser()) ||
                  (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('ssgmce_user') || '{}')) || {};
        const fullName = u.fullName || u.full_name || u.name || 'Aghao Shivam Sanjay';
        const className = u.className || u.class_name || u.class || 'TY B.E. Computer Science and Engineering-A';
        const rollNo = u.rollNo || u.roll_no || '3R71';
        const studentCode = u.studentCode || u.student_code || '308637';
        return {
          success: true,
          data: {
            name: fullName,
            fullName: fullName,
            class: className,
            className: className,
            rollNo: rollNo,
            rollNumber: rollNo,
            enrollmentNumber: studentCode,
            studentCode: studentCode,
            department: 'Computer Science & Engineering',
            semester: 'V',
            division: 'A',
            academicYear: '2026-2027',
            prn: u.prn || studentCode
          }
        };
      } catch (e) {}

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
            const cfg = (typeof window !== 'undefined' && window.ERP_CONFIG) || {};
            const sbBase = cfg.SUPABASE_URL || 'https://gftqvclenyplnuoocbwe.supabase.co';
            const sbUrl = sbBase.replace(/\/+$/, '') + '/rest/v1';
            const sbKey = cfg.SUPABASE_ANON_KEY || (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) || '';
            let userCode = '';
            if (typeof window !== 'undefined' && window.verifiedUser) {
              userCode = window.verifiedUser.user_id || window.verifiedUser.student_code || '';
            }
            if (!userCode && typeof window !== 'undefined' && window.AuthClient && window.AuthClient.getCurrentUser) {
              const u = window.AuthClient.getCurrentUser();
              if (u) userCode = u.user_id || u.student_code || '';
            }
            if (!userCode) {
              try {
                const stored = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
                userCode = stored.student_code || stored.studentCode || stored.enrollmentNo || stored.user_id || '';
              } catch (e) {}
            }
            if (!userCode) throw new Error('No authenticated student code found');

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

        const subjectArray = (attData && (attData.subjects || attData.subjectWise || attData.subject_wise)) || [];
        if (subjectArray && subjectArray.length > 0) {
          const list = subjectArray.map((item, idx) => {
            const attended = item.attended !== undefined ? item.attended : (item.present_periods !== undefined ? item.present_periods : (item.present !== undefined ? item.present : 0));
            const total = item.total !== undefined ? item.total : (item.total_periods !== undefined ? item.total_periods : 0);
            const pct = item.percentage !== undefined ? Number(item.percentage) : (item.attendance_percentage !== undefined ? Number(item.attendance_percentage) : (total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 0));
            const status = calc.getStatus ? calc.getStatus(pct) : {
              label: pct >= 75 ? 'Safe Zone' : 'Critical (<75%)',
              badgeClass: pct >= 75 ? 'att-badge-good' : 'att-badge-danger'
            };

            const rawType = (item.type || item.subject_type || '').toUpperCase();
            const isPrac = rawType.includes('PR') || rawType.includes('LAB');
            const normType = isPrac ? 'PR' : 'TH';
            const normTypeName = isPrac ? 'Practical' : 'Theory';

            const subTitle = item.subject || item.name || item.subjectName || item.subject_name || item.code || '';
            const subCode = item.code || item.subjectCode || item.subject_code || '';
            return {
              id: item.id || `sub-${idx}`,
              code: subCode,
              name: subTitle,
              subject: subTitle,
              type: normType,
              typeName: item.typeName || normTypeName,
              faculty: item.faculty || item.faculty_name || 'SSGMCE Faculty',
              classroom: item.classroom || item.room || 'LH-204',
              room: item.classroom || item.room || 'LH-204',
              present: attended,
              total: total,
              absent: total >= attended ? total - attended : 0,
              percentage: pct,
              credits: item.credits || (normType === 'PR' ? '1.5' : '3.0'),
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
