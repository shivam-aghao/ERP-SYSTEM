/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL
 * Attendance Data Layer Configuration & State
 * Strict Zero-Static-Mock Policy:
 * Dynamic data loaded from Supabase / Backend API.
 */

(function (global) {
  'use strict';

  const getSessionStudent = () => {
    try {
      if (global.ERPAuth && typeof global.ERPAuth.getSession === 'function') {
        const s = global.ERPAuth.getSession();
        if (s && s.role === 'student') return s;
      }
      if (typeof localStorage !== 'undefined') {
        const s = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
        if (s && (s.fullName || s.name)) return s;
      }
    } catch (_) {}
    return null;
  };

  const activeStudent = getSessionStudent();

  const studentProfile = {
    name: activeStudent ? (activeStudent.fullName || activeStudent.name) : "Student",
    rollNo: activeStudent ? (activeStudent.rollNo || activeStudent.roll_no || "--") : "--",
    studentCode: activeStudent ? (activeStudent.studentCode || activeStudent.student_code || "--") : "--",
    prn: activeStudent ? (activeStudent.prn || "--") : "--",
    class: activeStudent ? (activeStudent.className || activeStudent.class_name || "--") : "--",
    department: activeStudent ? (activeStudent.department || activeStudent.department_name || "Computer Science & Engineering") : "Computer Science & Engineering",
    academicYear: activeStudent ? (activeStudent.academicYear || "2025-2026") : "2025-2026",
    semester: activeStudent ? (activeStudent.semester || "--") : "--",
    division: activeStudent ? (activeStudent.division || "A") : "A",
    batch: activeStudent ? (activeStudent.batch || "--") : "--",
    avatarText: activeStudent ? (activeStudent.initials || "ST") : "ST",
    mentorName: activeStudent ? (activeStudent.mentorName || "--") : "--"
  };

  const attendanceData = [];

  const attendanceThresholds = {
    good: 80,       // 80%+ -> Good
    warning: 75,    // 75-79% -> Warning
    low: 50,        // 50-74% -> Low
    critical: 0     // Below 50% -> Critical
  };

  const attendanceDataExports = {
    studentProfile: null,
    attendanceData: [],
    attendanceThresholds
  };

  // Expose to window or module system cleanly
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = attendanceDataExports;
  } else {
    global.AttendanceData = attendanceDataExports;
  }
})(typeof window !== 'undefined' ? window : this);
