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
  selectedDate: "2026-09-17", // Default to academic calendar date
  selectedSubject: {
    code: "CS302",
    name: "Data Structures",
    faculty: "Dr. Rohan Deshmukh",
    time: "10:00 AM – 11:00 AM",
    icon: "book-open"
  },

  // Student Marking State
  students: [],
  currentIndex: 0,
  attendanceMap: {}, // rollNo -> 'present' | 'absent'
  historyStack: [],  // Array of { index, rollNo, previousStatus } for Undo

  // Mode Flags
  markingMode: 'swipe', // 'swipe' (SWIP Card) | 'roster' (Roster List)
  isPaused: false,
  isDraftSaved: false,
  isSubmitted: false,

  // Submitted Sessions Log for Duplicate Prevention
  submittedSessions: [
    {
      sessionId: "ATT-20260917-2R1-CS302-PREV",
      date: "2026-09-17",
      classCode: "2R1",
      departmentCode: "CSE",
      subjectCode: "CS302",
      subjectName: "Data Structures",
      lectureTime: "09:00 AM – 10:00 AM",
      teacher: "Dr. Rohan Deshmukh",
      submittedAt: "2026-09-17T10:00:00"
    }
  ],

  // Initializer
  init() {
    this.loadStudentsForCurrentClass();
  },

  loadStudentsForCurrentClass() {
    if (!TeacherERPData || !TeacherERPData.getStudentsForClass) return;
    this.students = TeacherERPData.getStudentsForClass(this.selectedClass.code);
    this.currentIndex = 0;
    this.attendanceMap = {};
    this.historyStack = [];
    this.isPaused = false;
    this.isDraftSaved = false;
    this.isSubmitted = false;

    // Initialize all to unmarked or empty
    this.students.forEach(st => {
      this.attendanceMap[st.rollNo] = null;
    });
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
    this.selectedDate = dateStr;
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
    if (!this.selectedDate) return "17 September 2026";
    const parts = this.selectedDate.split("-");
    if (parts.length !== 3) return this.selectedDate;

    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return `${day} ${monthNames[monthIndex] || "September"} ${year}`;
  }
};

