/* ========================================================
   ATTENDANCE WORKFLOW STATE MANAGEMENT
   ======================================================== */

const AttendanceState = {
  // Navigation & Step tracking
  // Step 1: Department, Step 2: Class, Step 3: Date, Step 4: Subject, Step 5: Students, Step 6: Summary
  currentStep: 1,

  // Selected parameters preserved across entire workflow
  selectedDepartment: {
    code: "CSE",
    name: "Computer Science & Engineering",
    icon: "laptop"
  },
  selectedClass: {
    code: "2R1",
    department: "CSE",
    name: "Second Year CSE - Div 1",
    studentsCount: 60
  },
  selectedDate: (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0],
  selectedSubject: {
    code: "CS302",
    name: "Data Structures",
    faculty: "Dr. Rohan Deshmukh",
    time: "10:00 AM – 11:00 AM",
    icon: "book-open"
  },

  // Flag indicating teacher explicitly picked a custom date
  isUserSelectedDate: false,

  // Student Marking State
  students: [],
  currentIndex: 0,
  attendanceMap: {}, // rollNo -> 'present' | 'absent'
  historyStack: [],  // Array of { index, rollNo, previousStatus } for Undo

  // Multi-session record cache: "${date}_${classCode}_${subjectCode}" -> session state
  recordsBySession: {},

  // Mode Flags
  markingMode: 'swipe', // 'swipe' (SWIP Card) | 'roster' (Roster List)
  isPaused: false,
  isDraftSaved: false,
  isSubmitted: false,

  // Submitted Sessions Log for Duplicate Prevention
  submittedSessions: [
    {
      sessionId: `ATT-${(typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO().replace(/-/g, '') : 'REC'}-2R1-CS302-PREV`,
      date: (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0],
      classCode: "2R1",
      departmentCode: "CSE",
      subjectCode: "CS302",
      subjectName: "Data Structures",
      lectureTime: "08:00 AM – 09:00 AM",
      teacher: "Dr. Rohan Deshmukh",
      submittedAt: new Date().toISOString()
    }
  ],

  // Initializer - automatically selects today unless user manually chose another date
  init() {
    if (!this.selectedDate || !this.isUserSelectedDate) {
      this.selectedDate = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0];
    }
    this.loadStudentsForCurrentClass();
  },

  getSessionKey(date = this.selectedDate, classCode = (this.selectedClass ? this.selectedClass.code : '2R1'), subjectCode = (this.selectedSubject ? this.selectedSubject.code : 'CS302')) {
    return `${date || 'current'}_${classCode || '2R1'}_${subjectCode || 'CS302'}`;
  },

  saveCurrentSessionRecord() {
    const key = this.getSessionKey();
    this.recordsBySession[key] = {
      attendanceMap: { ...this.attendanceMap },
      currentIndex: this.currentIndex,
      historyStack: [ ...this.historyStack ],
      isSubmitted: this.isSubmitted,
      isDraftSaved: this.isDraftSaved
    };
  },

  loadRecordForSession(date = this.selectedDate, classCode = (this.selectedClass ? this.selectedClass.code : '2R1'), subjectCode = (this.selectedSubject ? this.selectedSubject.code : 'CS302')) {
    const key = this.getSessionKey(date, classCode, subjectCode);
    const existingSubmitted = this.submittedSessions.find(s => 
      s.date === date &&
      s.classCode === classCode &&
      s.subjectCode === subjectCode
    );

    if (this.recordsBySession[key]) {
      const rec = this.recordsBySession[key];
      this.attendanceMap = { ...rec.attendanceMap };
      this.currentIndex = rec.currentIndex;
      this.historyStack = [ ...rec.historyStack ];
      this.isSubmitted = rec.isSubmitted;
      this.isDraftSaved = rec.isDraftSaved;
    } else if (existingSubmitted) {
      this.isSubmitted = true;
      this.isDraftSaved = false;
      this.currentIndex = this.students.length;
      this.attendanceMap = {};
      this.students.forEach(st => {
        this.attendanceMap[st.rollNo] = (st.rollNo % 8 === 0) ? 'absent' : 'present';
      });
    } else {
      this.currentIndex = 0;
      this.attendanceMap = {};
      this.historyStack = [];
      this.isSubmitted = false;
      this.isDraftSaved = false;
      this.students.forEach(st => {
        this.attendanceMap[st.rollNo] = null;
      });
    }
  },

  loadStudentsForCurrentClass() {
    if (!TeacherERPData || !TeacherERPData.getStudentsForClass) return;
    this.students = TeacherERPData.getStudentsForClass(this.selectedClass.code);
    this.loadRecordForSession(this.selectedDate, this.selectedClass.code, this.selectedSubject.code);
  },

  setDepartment(code) {
    const dept = TeacherERPData.departments.find(d => d.code === code);
    if (!dept) return;
    this.selectedDepartment = {
      code: dept.code,
      name: dept.name,
      icon: dept.icon
    };

    // Update class to first available class in department
    const firstClassCode = dept.classCodes[0];
    this.setClass(firstClassCode);
  },

  setClass(classCode) {
    const cls = TeacherERPData.classes[classCode];
    if (!cls) return;
    this.selectedClass = { ...cls };

    // Update available subjects for this class
    const subs = TeacherERPData.subjects[classCode] || [];
    if (subs.length > 0) {
      this.selectedSubject = { ...subs[0] };
    }

    this.loadStudentsForCurrentClass();
  },

  setDate(dateStr) {
    if (!dateStr || dateStr === this.selectedDate) return;
    this.saveCurrentSessionRecord();
    this.selectedDate = dateStr;
    this.isUserSelectedDate = true;
    this.loadRecordForSession(this.selectedDate, this.selectedClass.code, this.selectedSubject.code);
  },

  getDateStatusLabel() {
    const today = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0];
    if (this.selectedDate === today) return "Today's Lecture";
    if (this.selectedDate < today) return "Past Session";
    return "Scheduled Future Session";
  },

  setSubject(subjectCode) {
    const subs = TeacherERPData.subjects[this.selectedClass.code] || [];
    const sub = subs.find(s => s.code === subjectCode) || subs[0];
    if (sub) {
      this.selectedSubject = { ...sub };
    }
  },

  markCurrentStudent(status) {
    if (this.currentIndex >= this.students.length) return false;

    const student = this.students[this.currentIndex];
    const prevStatus = this.attendanceMap[student.rollNo];

    // Record action for Undo
    this.historyStack.push({
      index: this.currentIndex,
      rollNo: student.rollNo,
      previousStatus: prevStatus,
      newStatus: status
    });

    this.attendanceMap[student.rollNo] = status;
    this.currentIndex++;

    return true;
  },

  undoLastAction() {
    if (this.historyStack.length === 0) return false;

    const lastAction = this.historyStack.pop();
    this.currentIndex = lastAction.index;
    this.attendanceMap[lastAction.rollNo] = lastAction.previousStatus;
    return true;
  },

  toggleStudentStatus(rollNo) {
    const current = this.attendanceMap[rollNo];
    const newStatus = current === 'present' ? 'absent' : 'present';
    this.attendanceMap[rollNo] = newStatus;
  },

  setStudentStatus(rollNo, status) {
    this.attendanceMap[rollNo] = status;
  },

  markAllPresent() {
    this.students.forEach(st => {
      this.attendanceMap[st.rollNo] = 'present';
    });
    this.currentIndex = this.students.length;
  },

  markAllAbsent() {
    this.students.forEach(st => {
      this.attendanceMap[st.rollNo] = 'absent';
    });
    this.currentIndex = this.students.length;
  },

  isSessionAlreadySubmitted(date, classCode, subjectCode, lectureTime) {
    return this.submittedSessions.some(s => 
      s.date === date &&
      s.classCode === classCode &&
      s.subjectCode === subjectCode &&
      s.lectureTime === lectureTime
    );
  },

  recordSubmittedSession(details) {
    this.submittedSessions.push(details);
  },

  getSummary() {
    const total = this.students.length;
    let presentCount = 0;
    let absentCount = 0;
    let remainingCount = 0;

    const presentStudents = [];
    const absentStudents = [];

    this.students.forEach(st => {
      const status = this.attendanceMap[st.rollNo];
      if (status === 'present') {
        presentCount++;
        presentStudents.push(st);
      } else if (status === 'absent') {
        absentCount++;
        absentStudents.push(st);
      } else {
        remainingCount++;
      }
    });

    // Marked students calculation
    const markedCount = presentCount + absentCount;
    const rate = total > 0 ? ((presentCount / total) * 100).toFixed(2) : "0.00";

    return {
      total,
      presentCount,
      absentCount,
      remainingCount,
      markedCount,
      rate,
      presentStudents,
      absentStudents
    };
  },

  getFormattedDate() {
    if (typeof AcademicDateUtils !== 'undefined') {
      return AcademicDateUtils.formatReadableDate(this.selectedDate);
    }
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (!this.selectedDate) {
      const now = new Date();
      return `${String(now.getDate()).padStart(2, '0')} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
    const parts = this.selectedDate.split("-");
    if (parts.length !== 3) return this.selectedDate;

    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const formattedDay = String(day).padStart(2, '0');
    return `${formattedDay} ${monthNames[monthIndex] || ""} ${year}`;
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceState = AttendanceState;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AttendanceState };
}

