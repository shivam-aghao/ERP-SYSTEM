/* ========================================================
   ACADEMIC DATE UTILITIES - DYNAMIC DATE HANDLING
   ======================================================== */
const AcademicDateUtils = {
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],

  shortMonthNames: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],

  dayNames: [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ],

  shortDayNames: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],

  getNow() {
    return new Date();
  },

  getTodayISO(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Returns formatted readable date "DD Month YYYY" (e.g. "21 September 2026")
  formatReadableDate(dateInput) {
    let year, monthIndex, day;
    if (!dateInput) {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
      day = now.getDate();
    } else if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        monthIndex = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const parsed = new Date(dateInput);
        if (isNaN(parsed.getTime())) return dateInput;
        year = parsed.getFullYear();
        monthIndex = parsed.getMonth();
        day = parsed.getDate();
      }
    } else if (dateInput instanceof Date) {
      year = dateInput.getFullYear();
      monthIndex = dateInput.getMonth();
      day = dateInput.getDate();
    } else {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
      day = now.getDate();
    }
    const monthName = this.monthNames[monthIndex] || "";
    const formattedDay = String(day).padStart(2, '0');
    return `${formattedDay} ${monthName} ${year}`;
  },

  // Returns "Weekday, DD Month YYYY" (e.g., "Monday, 21 September 2026")
  formatFullWeekdayDate(dateInput = new Date()) {
    let d;
    if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput || new Date();
    }
    const weekday = this.dayNames[d.getDay()];
    const formatted = this.formatReadableDate(d);
    return `${weekday}, ${formatted}`;
  },

  // Returns relative date in "DD Month YYYY" (or short month "DD Mon YYYY")
  getRelativeFutureDate(daysAhead, shortMonth = false) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const day = String(d.getDate()).padStart(2, '0');
    const monthName = shortMonth ? this.shortMonthNames[d.getMonth()] : this.monthNames[d.getMonth()];
    return `${day} ${monthName} ${d.getFullYear()}`;
  },

  // Dynamic Academic Term calculation
  getCurrentAcademicTerm(d = new Date()) {
    const year = d.getFullYear();
    const month = d.getMonth(); // 0 = Jan, 11 = Dec
    if (month >= 6) { // July to Dec
      return {
        academicYear: `${year}-${year + 1}`,
        semesterType: "Odd",
        semesterName: "Semester 5 (Odd)",
        fullTerm: `${year}-${year + 1} (Odd Semester)`
      };
    } else { // Jan to June
      return {
        academicYear: `${year - 1}-${year}`,
        semesterType: "Even",
        semesterName: "Semester 6 (Even)",
        fullTerm: `${year - 1}-${year} (Even Semester)`
      };
    }
  },

  getDayName(dateInput) {
    let d;
    if (!dateInput) d = new Date();
    else if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput;
    }
    return this.dayNames[d.getDay()] || "Monday";
  }
};

if (typeof window !== 'undefined') {
  window.AcademicDateUtils = AcademicDateUtils;
}

/* ========================================================
   TEACHER ERP DATA STORE - EXPANDED ACADEMIC MODEL
   ======================================================== */

const getSessionFaculty = () => {
  try {
    if (typeof window !== 'undefined' && window.ERP_AUTH) {
      const u = window.ERP_AUTH.getCurrentUser();
      if (u && (u.role === 'teacher' || u.role === 'faculty')) {
        return {
          name: u.fullName || u.name || "Faculty Member",
          prefix: "Prof.",
          title: u.designation || "Faculty Member",
          department: u.department || "Computer Science & Engineering",
          departmentCode: u.departmentCode || "CSE",
          employeeId: u.empCode || u.emp_code || "",
          email: u.email || "",
          phone: u.phone || "",
          avatarInitials: u.initials || "FA",
          academicYear: AcademicDateUtils.getCurrentAcademicTerm().academicYear,
          currentSemester: AcademicDateUtils.getCurrentAcademicTerm().semesterName
        };
      }
    }
  } catch (_) {}
  return {
    name: "Faculty Member",
    prefix: "Prof.",
    title: "Faculty Member",
    department: "Computer Science & Engineering",
    departmentCode: "CSE",
    employeeId: "",
    email: "",
    phone: "",
    avatarInitials: "FA",
    academicYear: AcademicDateUtils.getCurrentAcademicTerm().academicYear,
    currentSemester: AcademicDateUtils.getCurrentAcademicTerm().semesterName
  };
};

const TeacherERPData = {
  get faculty() {
    return getSessionFaculty();
  },

  institution: {
    name: "Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
    subTitle: "(An Autonomous Institute)",
    shortName: "SSGMCE"
  },

  stats: {
    totalClasses: "0",
    todayClasses: "0",
    totalStudents: "0",
    attendancePending: "0",
    attendanceCompletedCount: 0,
    attendancePendingCount: 0,
    attendancePercent: 0
  },

  departments: [],
  classes: {},
  subjects: {},

  getStudentsForClass(classCode) {
    if (this.students && this.students[classCode]) {
      return this.students[classCode];
    }
    return [];
  },

  students: {},
  todayClasses: [],
  timetable: [],
  assignedClasses: [],
  syllabus: [],
  recentActivities: [],
  notifications: []
};

if (typeof window !== 'undefined') {
  window.AcademicDateUtils = AcademicDateUtils;
  window.TeacherERPData = TeacherERPData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AcademicDateUtils, TeacherERPData };
}
