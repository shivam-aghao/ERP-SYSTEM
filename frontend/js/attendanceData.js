/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL
 * Attendance Data Layer Configuration & State
 * 
 * Strict Zero-Static-Mock Policy:
 * Dynamic data loaded from Supabase / Backend API.
 */

(function (global) {
  'use strict';

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
