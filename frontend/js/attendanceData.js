/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL
 * Independent Attendance Mock Data Layer
 * 
 * Student: Student Profile (Dynamic)
 * Class: TY B.E. Computer Science and Engineering-A
 * Academic Year: 2026–2027
 * Semester: V
 * 
 * STRICT ARCHITECTURAL PRINCIPLE:
 * This data is strictly isolated to the Student Attendance System.
 * DO NOT link, import, or leak into the Student Dashboard.
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

  const attendanceData = [
    {
      id: 1,
      subject: "Data Science and Statistics",
      code: "5CS223PE-I-TH",
      type: "TH",
      present: 5,
      total: 11,
      faculty: "Prof. Rajesh Sharma",
      credits: 3.0,
      room: "LH-204"
    },
    {
      id: 2,
      subject: "Database Management Systems",
      code: "5CS220PC",
      type: "TH",
      present: 4,
      total: 9,
      faculty: "Dr. Rohan Deshmukh",
      credits: 3.0,
      room: "LH-112"
    },
    {
      id: 3,
      subject: "Compiler Design",
      code: "5CS221PC",
      type: "TH",
      present: 5,
      total: 18,
      faculty: "Prof. Priya Patil",
      credits: 4.0,
      room: "LH-301"
    },
    {
      id: 4,
      subject: "Computer Architecture & Organization",
      code: "5CS222PC",
      type: "TH",
      present: 5,
      total: 15,
      faculty: "Prof. Vikram Joshi",
      credits: 3.0,
      room: "LH-108"
    },
    {
      id: 5,
      subject: "Database Management Systems-LAB",
      code: "5CS224PC",
      type: "PR",
      present: 2,
      total: 2,
      faculty: "Dr. Rohan Deshmukh",
      credits: 1.5,
      room: "Database Lab 1"
    },
    {
      id: 6,
      subject: "Compiler Design_LAB",
      code: "5CS225PC",
      type: "PR",
      present: 0,
      total: 4,
      faculty: "Prof. Priya Patil",
      credits: 1.5,
      room: "Systems Lab 2"
    },
    {
      id: 7,
      subject: "Introduction to Microprocessors",
      code: "5ET227MD",
      type: "TH",
      present: 2,
      total: 7,
      faculty: "Dr. Sneha Kulkarni",
      credits: 3.0,
      room: "LH-201"
    },
    {
      id: 8,
      subject: "Microcontroller Applications",
      code: "5ET228MD",
      type: "TH",
      present: 3,
      total: 6,
      faculty: "Prof. V. K. Ramanujan",
      credits: 3.0,
      room: "LH-302"
    },
    {
      id: 9,
      subject: "Microprocessor and Microcontroller Lab",
      code: "5ET229ML",
      type: "PR",
      present: 0,
      total: 2,
      faculty: "Dr. Sneha Kulkarni",
      credits: 1.5,
      room: "Microprocessor Lab"
    }
  ];

  const attendanceThresholds = {
    good: 80,       // 80%+ -> Good
    warning: 75,    // 75-79% -> Warning
    low: 50,        // 50-74% -> Low
    critical: 0     // Below 50% -> Critical
  };

  const attendanceDataExports = {
    studentProfile,
    attendanceData,
    attendanceThresholds
  };

  // Expose to window or module system cleanly
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = attendanceDataExports;
  } else {
    global.AttendanceData = attendanceDataExports;
  }
})(typeof window !== 'undefined' ? window : this);
