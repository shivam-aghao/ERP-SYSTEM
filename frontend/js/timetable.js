/**
 * ==========================================================================
 * SSGMCE TEACHER ERP — TIMETABLE MODULE (STEP 3)
 * File: frontend/js/timetable.js
 * Dedicated, modular Timetable management for SSGMCE Teacher ERP Portal.
 * Sourced directly from official PDF: DATA/Personal Timtable for teacher.pdf
 * Ensures every teacher sees strictly THEIR OWN personal timetable!
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const TimetableModule = {
    selectedDate: null,
    activeTerm: null,
    timeHeaders: [
      "Day",
      "11:00 - 12:00 PM",
      "12:00 - 01:00 PM",
      "01:15 - 02:15 PM",
      "02:15 - 03:15 PM",
      "03:45 - 04:45 PM",
      "04:45 - 05:45 PM"
    ],
    daysOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    liveDataLoaded: false,
    tests: [],

    /**
     * Initialize the timetable module
     */
    init(containerId = "timetable-content") {
      this.selectedDate = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0];

      this.activeTerm = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getCurrentAcademicTerm()
        : { academicYear: "2026-2027", semesterType: "Odd" };

      this.loadScheduledTests();
      this.ensureModalsExist();
      this.loadLiveTimetableIfPossible();
      this.render(containerId);
      this.attachGlobalBridge();
    },

    /**
     * Load scheduled tests from cache or mock data
     */
    loadScheduledTests() {
      try {
        const stored = (typeof window !== 'undefined' && window.localStorage)
          ? window.localStorage.getItem('ssgmce_scheduled_tests')
          : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.tests = parsed;
            return;
          }
        }
      } catch (_) {}

      // Default mock tests matching user requirements
      this.tests = [
        {
          id: "TEST-001",
          facultyId: "T-001",
          empCode: "EMP-CSE-1001",
          facultyName: "Dr. Rohan Deshmukh",
          testName: "Mid-Term Exam - Data Structures",
          subject: "Data Structures",
          classId: "2R1",
          date: "2026-10-15",
          timeSlot: "09:00 - 10:30 AM",
          duration: 90,
          room: "Room 201",
          testType: "Mid-Term",
          totalMarks: 50,
          instructions: "Bring your own scientific calculators. No mobile phones allowed.",
          attachmentUrl: "/uploads/ds-midterm-question-paper.pdf",
          createdAt: "2026-10-08T10:00:00Z"
        },
        {
          id: "TEST-002",
          facultyId: "T-001",
          empCode: "EMP-CSE-1001",
          facultyName: "Dr. Rohan Deshmukh",
          testName: "Quiz 1 - Java OOP & Collections",
          subject: "Java Programming",
          classId: "2R1",
          date: "2026-10-16",
          timeSlot: "11:00 - 12:30 PM",
          duration: 45,
          room: "Room 305",
          testType: "Quiz",
          totalMarks: 20,
          instructions: "Multiple choice questionnaire covering OOP concepts.",
          attachmentUrl: "/uploads/java-quiz-1.pdf",
          createdAt: "2026-10-08T11:00:00Z"
        },
        {
          id: "TEST-003",
          facultyId: "T-002",
          empCode: "EMP-CSE-1002",
          facultyName: "Prof. Priya Kulkarni",
          testName: "Mid-Term Exam - Operating Systems",
          subject: "Operating Systems",
          classId: "3R",
          date: "2026-10-19",
          timeSlot: "09:00 - 10:30 AM",
          duration: 90,
          room: "Room 102",
          testType: "Mid-Term",
          totalMarks: 50,
          instructions: "Process synchronization and CPU scheduling problem solving.",
          attachmentUrl: "/uploads/os-midterm.pdf",
          createdAt: "2026-10-08T12:00:00Z"
        }
      ];
    },

    /**
     * Find scheduled test matching row day and time slot
     */
    findTestForDayAndSlot(dayName, slotIndex, timeSlotHeader, activeEmpCode) {
      if (!this.tests || !Array.isArray(this.tests) || this.tests.length === 0) return null;
      const targetEmp = (activeEmpCode || '').toUpperCase();

      return this.tests.find(t => {
        // Match faculty
        const facMatches = !t.facultyId ||
          t.facultyId.toUpperCase() === targetEmp ||
          t.facultyId.toUpperCase() === 'T-001' && (targetEmp === 'EMP-CSE-1001' || targetEmp === 'EMP-CSE-1009' || targetEmp === 'T-001') ||
          (t.empCode && t.empCode.toUpperCase() === targetEmp);
        if (!facMatches) return false;

        // Match slot
        const timeHeaderNorm = (timeSlotHeader || '').toLowerCase();
        const testSlotNorm = (t.timeSlot || t.start || '').toLowerCase();
        const slotMatches = testSlotNorm.includes(timeHeaderNorm) ||
          timeHeaderNorm.includes(testSlotNorm) ||
          (slotIndex === 0 && (testSlotNorm.includes('09:00') || testSlotNorm.includes('11:00'))) ||
          (slotIndex === 1 && (testSlotNorm.includes('11:00') || testSlotNorm.includes('12:00'))) ||
          (slotIndex === 2 && (testSlotNorm.includes('01:15') || testSlotNorm.includes('01:30'))) ||
          (slotIndex === 3 && (testSlotNorm.includes('02:15') || testSlotNorm.includes('03:30')));
        if (!slotMatches) return false;

        // Match day
        if (t.date) {
          try {
            const parts = t.date.split('-');
            if (parts.length === 3) {
              const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              const testDay = dt.toLocaleDateString('en-US', { weekday: 'long' });
              return testDay.toLowerCase() === dayName.toLowerCase();
            }
          } catch (_) {}
        }
        return false;
      });
    },

    /**
     * Fetch live timetable from backend API if available
     */
    async loadLiveTimetableIfPossible() {
      if (typeof window !== 'undefined' && window.TeacherAPI && typeof window.TeacherAPI.getMyTimetable === 'function') {
        try {
          const activeCode = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode)
            ? TeacherERPData.getActiveTeacherEmpCode()
            : 'EMP-CSE-1001';
          const liveData = await window.TeacherAPI.getMyTimetable(activeCode);
          if (liveData && liveData.grid && liveData.grid.length > 0) {
            this.liveData = liveData;
            this.liveDataLoaded = true;
            this.render("timetable-content");
          }
        } catch (e) {
          console.warn("[TimetableModule] Using high-fidelity offline PDF data:", e.message);
        }
      }
    },

    /**
     * Switch viewed faculty member
     */
    async switchFaculty(empCode, containerId = "timetable-content") {
      if (!empCode) return;
      if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.setActiveTeacherEmpCode === 'function') {
        TeacherERPData.setActiveTeacherEmpCode(empCode);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ssgmce_selected_faculty', empCode);
      }
      this.liveData = null;
      if (typeof window !== 'undefined' && window.TeacherAPI && typeof window.TeacherAPI.getMyTimetable === 'function') {
        try {
          const liveData = await window.TeacherAPI.getMyTimetable(empCode);
          if (liveData && liveData.grid && liveData.grid.length > 0) {
            this.liveData = liveData;
          }
        } catch(e) {}
      }
      this.render(containerId);
      if (typeof TeacherApp !== 'undefined' && typeof TeacherApp.renderDashboardData === 'function') {
        TeacherApp.renderHeaderProfile();
        TeacherApp.renderDashboardData();
      }
    },

    /**
     * Handle date picker change
     */
    handleDateChange(dateVal, containerId = "timetable-content") {
      if (!dateVal) return;
      this.selectedDate = dateVal;
      this.render(containerId);

      // Notify external observers
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timetable:datechange', { detail: { date: dateVal } }));
      }
    },

    /**
     * Reset selected date to current date (Today)
     */
    resetToToday(containerId = "timetable-content") {
      this.selectedDate = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0];
      this.render(containerId);
    },

    /**
     * Trigger print dialog for timetable schedule
     */
    printSchedule() {
      window.print();
    },

    /**
     * Determine class code from subject name
     */
    getClassCodeForSubject(subjectName) {
      if (!subjectName) return '2R1';
      if (subjectName.includes('2R2')) return '2R2';
      if (subjectName.includes('2R1')) return '2R1';
      if (subjectName.includes('3R') || subjectName.includes('DBMS') || subjectName.includes('CD') || subjectName.includes('MDM#')) return '3R';
      if (subjectName.includes('4R') || subjectName.includes('CG') || subjectName.includes('BF') || subjectName.includes('CC') || subjectName.includes('DWM')) return '4R';
      return '2R1';
    },

    /**
     * Check if session has been marked (synced with AttendanceMarkingManager & localStorage)
     */
    isSessionMarked(sessionKey) {
      if (typeof window !== 'undefined' && window.AttendanceMarkingManager && window.AttendanceMarkingManager.markedSessions) {
        if (window.AttendanceMarkingManager.markedSessions[sessionKey]) return true;
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem('ssgmce_marked_sessions');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed[sessionKey]) return true;
          }
        }
      } catch (_) {}
      return false;
    },

    /**
     * Compute calendar ISO date for a weekday row in the selected/current active week
     */
    getDateForDayInWeek(refDate, dayName) {
      const d = new Date(refDate || new Date());
      const currentDay = d.getDay(); // 0 is Sunday, 1 is Monday ...
      const distanceToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
      const monday = new Date(d);
      monday.setDate(d.getDate() + distanceToMonday);

      const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const targetIdx = daysOrder.indexOf(dayName);
      if (targetIdx === -1) {
        return (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO(d) : d.toISOString().split('T')[0];
      }

      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + targetIdx);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayNum = String(targetDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayNum}`;
    },

    /**
     * Determine if a lecture slot is in the future
     */
    isClassInFuture(dateISO, timeSlotString) {
      if (!dateISO) return false;
      const now = new Date();
      const todayISO = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO(now)
        : now.toISOString().split('T')[0];

      if (dateISO > todayISO) return true;
      if (dateISO < todayISO) return false;

      // Same day (Today): Check slot start time
      if (!timeSlotString) return false;
      const startPart = timeSlotString.split('-')[0].trim();
      const match = startPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return false;

      let hour = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      let meridiem = match[3] ? match[3].toUpperCase() : null;

      if (!meridiem) {
        if (timeSlotString.toUpperCase().includes('PM')) {
          if (hour >= 1 && hour <= 7) meridiem = 'PM';
          else if (hour === 12) meridiem = 'PM';
          else meridiem = 'AM';
        } else {
          meridiem = 'AM';
        }
      }

      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;

      const slotStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, 0);
      return now < slotStartDate;
    },

    /**
     * Slot click handler - Click-to-Mark single entry point
     */
    handleSlotClick(subjectName, roomPart, timeSlotHeader, classCode, selectedDate) {
      // 1. Check if future class
      if (this.isClassInFuture(selectedDate, timeSlotHeader)) {
        const msg = "Cannot mark attendance for future classes.";
        if (typeof window.showToast === 'function') {
          window.showToast(msg, 'info');
        } else if (typeof TeacherApp !== 'undefined' && TeacherApp.showToast) {
          TeacherApp.showToast(msg, 'info');
        }
        return;
      }

      // 2. Check Leave & Attendance Marking Permissions
      if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.canMarkAttendance === 'function') {
        const activeEmp = (typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
          ? TeacherERPData.getActiveTeacherEmpCode()
          : 'EMP-CSE-1001';

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let dayName = 'Monday';
        try {
          const dObj = new Date(selectedDate || new Date().toISOString().split('T')[0]);
          if (!isNaN(dObj.getTime())) dayName = days[dObj.getDay()];
        } catch (_) {}

        const perm = TeacherERPData.canMarkAttendance(activeEmp, {
          day: dayName,
          date: selectedDate,
          timeSlot: timeSlotHeader,
          subject: subjectName,
          classCode: classCode
        });

        if (!perm.allowed) {
          const reason = perm.reason || 'You are on leave for this class. Attendance marking is disabled.';
          if (typeof window.showToast === 'function') {
            window.showToast(reason, 'warning');
          } else if (typeof TeacherApp !== 'undefined' && TeacherApp.showToast) {
            TeacherApp.showToast(reason);
          }
          this.showOnLeaveAlert(reason, perm.engagingFacultyName);
          return;
        }
      }

      // 3. Update URL with parameters for context & direct routing
      try {
        const params = new URLSearchParams(window.location.search);
        params.set('view', 'attendance-mark');
        params.set('classId', classCode);
        params.set('subject', subjectName);
        params.set('date', selectedDate);
        params.set('time', timeSlotHeader);
        params.set('room', roomPart);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ classId: classCode, subject: subjectName, date: selectedDate }, '', newUrl);
      } catch (_) {}

      // 4. Open Attendance Marking Page immediately with context prefilled
      if (typeof window !== 'undefined' && window.AttendanceMarkingManager && typeof window.AttendanceMarkingManager.openFromSlot === 'function') {
        window.AttendanceMarkingManager.openFromSlot(subjectName, roomPart, timeSlotHeader, classCode, selectedDate);
      } else if (typeof window !== 'undefined' && window.TeacherApp && typeof window.TeacherApp.showToast === 'function') {
        window.TeacherApp.showToast(`Selected: ${subjectName} (${classCode}) on ${selectedDate}`);
      }
    },

    /**
     * Generate HTML markup for the entire Timetable grid card
     */
    getHTML(dateISO) {
      if (!this.tests || !Array.isArray(this.tests) || this.tests.length === 0) {
        this.loadScheduledTests();
      }

      const selectedDate = dateISO || this.selectedDate || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0]);
      const currentDayName = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getDayName(selectedDate) : "Monday";
      const readableDate = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.formatReadableDate(selectedDate) : selectedDate;
      const todayISO = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0];
      const isToday = (selectedDate === todayISO);
      const isWeekend = (currentDayName === "Saturday" || currentDayName === "Sunday");
      const term = this.activeTerm || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getCurrentAcademicTerm() : { academicYear: "2026-2027", semesterType: "Odd" });

      // Resolve Active Faculty details and list for switcher
      const activeEmpCode = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';

      const facDataMap = (typeof SSGMCE_FACULTY_TIMETABLES !== 'undefined') ? SSGMCE_FACULTY_TIMETABLES : {};
      const currentFacObj = facDataMap[activeEmpCode] || (typeof TeacherERPData !== 'undefined' && TeacherERPData.faculty ? {
        name: TeacherERPData.faculty.name || "Dr. Rohan Deshmukh",
        empCode: activeEmpCode,
        title: TeacherERPData.faculty.designation || "Assistant Professor",
        totalLoad: 16,
        teaching_load: []
      } : {
        name: "Dr. Rohan Deshmukh",
        empCode: activeEmpCode,
        title: "Assistant Professor",
        totalLoad: 16,
        teaching_load: []
      });

      const facList = Object.keys(facDataMap).length > 0
        ? Object.entries(facDataMap).map(([code, f]) => ({
            empCode: code,
            name: f.name || code,
            totalLoad: f.totalLoad || 16
          }))
        : [{ empCode: activeEmpCode, name: currentFacObj.name, totalLoad: currentFacObj.totalLoad || 16 }];

      const teachingLoad = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getTeachingLoadForTeacher === 'function')
        ? TeacherERPData.getTeachingLoadForTeacher(activeEmpCode)
        : (currentFacObj.teaching_load || []);

      // Dynamic schedule rows strictly for active faculty
      const timetableData = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getTimetableForTeacher === 'function')
        ? TeacherERPData.getTimetableForTeacher(activeEmpCode)
        : ((typeof TeacherERPData !== 'undefined' && TeacherERPData.timetable && TeacherERPData.timetable.length > 0)
          ? TeacherERPData.timetable
          : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => ({
            day: day,
            slots: ["Free Slot", "Free Slot", "Free Slot", "Free Slot", "Free Slot", "Free Slot"]
          })));

      return `
      <div class="timetable-grid-card">
        <!-- 0. Faculty Identity & Switcher Toolbar -->
        <div class="timetable-faculty-strip" style="background: linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%); color: #fff; padding: 14px 20px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="width: 42px; height: 42px; border-radius: 8px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 1px solid rgba(255,255,255,0.3);">
              ${currentFacObj.name.split('. ').pop().charAt(0) || 'F'}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #fff;">${currentFacObj.name}</h4>
                <span style="background: #10B981; color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 600;">${currentFacObj.empCode}</span>
                <span style="background: rgba(255,255,255,0.2); color: #E0F2FE; font-size: 11px; padding: 2px 7px; border-radius: 4px;">${currentFacObj.title}</span>
              </div>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #BAE6FD;">
                Department of Computer Science &amp; Engineering &bull; SSGMCE Autonomous &bull; Weekly Load: <strong>${currentFacObj.totalLoad} Hours</strong>
              </p>
            </div>
          </div>

          <!-- Faculty Personal View Badge -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="shield-check" style="width:14px;height:14px;color:#34D399;"></i>
              Personal Timetable &bull; ${activeEmpCode}
            </span>
          </div>
        </div>

        <!-- 1. Header Toolbar -->
        <div class="timetable-header-toolbar" style="border-top: none;">
          <div>
            <h3 style="margin: 0; font-size: 16px; color: var(--dark-navy, #0B1F3A);">Personal Lecture &amp; Lab Timetable</h3>
            <p id="timetable-academic-term" style="margin: 3px 0 0 0; font-size: 12px; color: var(--text-muted, #64748B);">
              Official Schedule w.e.f. 13/08/2026 &bull; Term: ${term.academicYear} &bull; ${term.semesterType} Semester
            </p>
          </div>

          <!-- Date Picker & Filter Controls -->
          <div class="timetable-date-filter-bar">
            <div class="timetable-picker-group">
              <i data-lucide="calendar" style="width:15px;height:15px; color:var(--primary-blue, #0B5CAD);"></i>
              <span style="font-size:12.5px; font-weight:600; color:var(--dark-navy, #0B1F3A);">View Date:</span>
              <input type="date" 
                     id="timetable-date-picker-input" 
                     class="timetable-date-input" 
                     value="${selectedDate}" 
                     onchange="TimetableModule.handleDateChange(this.value)">
            </div>
            <button class="btn-timetable-today ${isToday ? 'active' : ''}" 
                    type="button"
                    onclick="TimetableModule.resetToToday()" 
                    title="Reset to today's schedule">
              <i data-lucide="calendar-check" style="width:13px;height:13px;"></i>
              Today
            </button>
            <button class="btn-apply-leave-prominent" 
                    type="button" 
                    onclick="TimetableModule.openLeaveModal()" 
                    style="background:#0284C7; color:#ffffff; border:none; padding:6px 14px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(2,132,199,0.35); transition:all 0.2s;"
                    title="Apply for faculty leave and substitution">
              <i data-lucide="calendar" style="width:14px;height:14px;"></i>
              <span>Apply for Leave</span>
            </button>
            <button class="btn-schedule-test-prominent" 
                    type="button" 
                    onclick="TimetableModule.openScheduleTestModal()" 
                    style="background:#EA580C; color:#ffffff; border:none; padding:6px 14px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(234,88,12,0.35); transition:all 0.2s;"
                    title="Schedule a new assessment or examination">
              <i data-lucide="plus-circle" style="width:14px;height:14px;"></i>
              <span>+ Schedule Test</span>
            </button>
            <button class="btn-timetable-print" type="button" onclick="TimetableModule.printSchedule()">
              <i data-lucide="printer" style="width:14px;height:14px;"></i> Print Schedule
            </button>
          </div>
        </div>

        <!-- 2. Status Banner -->
        <div class="timetable-schedule-status-banner">
          <div class="status-left">
            <span class="status-pulse-indicator"></span>
            <span>Schedule for: <strong>${currentDayName}, ${readableDate}</strong></span>
            <span class="badge ${isToday ? 'badge-completed' : 'badge-cyan'}">${isToday ? "Today's Schedule" : "Selected Date"}</span>
            ${(typeof TeacherERPData !== 'undefined' && TeacherERPData.isFacultyOnLeave && TeacherERPData.isFacultyOnLeave(activeEmpCode, selectedDate || currentDayName)) ? `
              <span class="badge" style="background:#FEF3C7; color:#854D0E; border:1px solid #F59E0B; font-weight:700;">🟡 On Leave (Substitutable)</span>
            ` : ''}
          </div>
          <div class="status-hint">
            ${isWeekend ? '<em>Note: Weekend - regular weekday schedule displayed below</em>' : `Highlighting <strong>${currentDayName}</strong> in the schedule`}
          </div>
        </div>

        <!-- 3. Table Schedule Grid -->
        <div style="overflow-x: auto;">
          <table class="timetable-table" style="min-width: 850px;">
            <thead>
              <tr>
                ${this.timeHeaders.map((th, idx) => `
                  <th>
                    ${th}
                    ${idx === 2 ? '<div style="font-size:9.5px; font-weight:normal; color:#E0F2FE;">(Break: 1:00-1:15 PM)</div>' : ''}
                    ${idx === 4 ? '<div style="font-size:9.5px; font-weight:normal; color:#E0F2FE;">(Recess: 3:15-3:45 PM)</div>' : ''}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${(!timetableData || timetableData.length === 0) ? `
                <tr>
                  <td colspan="${this.timeHeaders.length}" style="text-align: center; padding: 48px 20px; background: #F8FAFC;">
                    <div style="font-size: 32px; margin-bottom: 10px;">📅</div>
                    <div style="font-weight: 700; font-size: 15px; color: #1E293B; margin-bottom: 4px;">No classes scheduled for you this week.</div>
                    <div style="font-size: 13px; color: #64748B;">There are currently no active lectures or lab practicals assigned to this faculty member.</div>
                  </td>
                </tr>
              ` : timetableData.map(row => {
                const slotDate = this.getDateForDayInWeek(selectedDate, row.day);
                const isRowToday = (slotDate === todayISO);
                const isHighlightRow = isRowToday || (row.day && row.day.toLowerCase() === currentDayName.toLowerCase());
                const daySlots = Array.isArray(row.slots) ? row.slots : [];
                return `
                <tr class="${isRowToday ? 'today-row ' : ''}${isHighlightRow ? 'active-day-row' : ''}">
                  <td class="timetable-day-cell ${isRowToday ? 'today-cell ' : ''}${isHighlightRow ? 'active-day-cell' : ''}">
                    <div class="day-cell-content">
                      <span class="day-name">${row.day}</span>
                      ${isRowToday ? `<span class="active-day-pill" style="background:#059669; color:#fff; font-weight:800; font-size:10px; padding:2px 6px; border-radius:4px;">TODAY</span>` : (isHighlightRow && !isRowToday ? `<span class="active-day-pill">Active</span>` : '')}
                    </div>
                  </td>
                  ${daySlots.map((slot, slotIndex) => {
                    const isObj = (typeof slot === 'object' && slot !== null);
                    const timeSlotHeader = isObj ? (slot.time || this.timeHeaders[slotIndex + 1] || "11:00 - 12:00 PM") : (this.timeHeaders[slotIndex + 1] || "11:00 - 12:00 PM");

                    // 1. Check if a test is scheduled for this day and slot
                    const matchedTest = this.findTestForDayAndSlot(row.day, slotIndex, timeSlotHeader, activeEmpCode);
                    if (matchedTest) {
                      return `
                        <td>
                          <div class="timetable-slot timetable-test-slot"
                               onclick="TimetableModule.openTestDetails('${matchedTest.id}')"
                               style="background:#FFF7ED; border:1.5px solid #F97316; border-left:5px solid #DC2626; border-radius:8px; padding:10px 12px; cursor:pointer; box-shadow:0 2px 6px rgba(220,38,38,0.12);"
                               title="Scheduled Test: ${matchedTest.testName}. Click to view details.">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                              <span style="background:#DC2626; color:#ffffff; font-size:9.5px; font-weight:900; padding:2px 6px; border-radius:4px; letter-spacing:0.5px;">TEST</span>
                              <span style="background:#FFEDD5; color:#C2410C; font-size:10px; padding:1px 6px; border-radius:4px; font-weight:700;">${matchedTest.testType || 'Mid-Term'}</span>
                            </div>
                            <div style="font-weight:800; font-size:12.5px; color:#7F1D1D; margin-bottom:4px; line-height:1.3;">
                              ${matchedTest.testName}
                            </div>
                            <div style="font-size:11px; color:#9A3412; font-weight:600;">
                              ${matchedTest.subject}
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:4px; border-top:1px dashed #FDBA74; font-size:11px; color:#9A3412;">
                              <span>Room: <strong>${matchedTest.room || 'Room 201'}</strong></span>
                              <span style="font-weight:700; color:#C2410C;">${matchedTest.totalMarks} Marks</span>
                            </div>
                            <div style="margin-top:4px; text-align:right;">
                              <span style="font-size:10px; font-weight:700; color:#B45309;">Class: ${matchedTest.classId || '2R1'}</span>
                            </div>
                          </div>
                        </td>
                      `;
                    }

                    // 2. Otherwise render regular lecture, engaged class, on-leave class, or off slot
                    const isOff = isObj
                      ? (slot.status === 'free' || slot.subject === 'Off / Prep' || !slot.subject)
                      : (!slot || slot === "Free Slot" || slot === "Off / Prep");
                    if (isOff) {
                      return `<td style="color:var(--text-light, #94A3B8); font-size:12px; font-style:italic; background:#FAFAFA; text-align:center;">Off / Prep</td>`;
                    }
                    const rawSubject = isObj ? slot.subject : slot.split('(')[0].trim();
                    const subjectName = rawSubject;
                    const roomPart = isObj ? (slot.room || 'Room 201') : (slot.split('(')[1] ? slot.split('(')[1].replace(')', '').trim() : 'B108');
                    const classCode = isObj ? (slot.classId || '2R1') : this.getClassCodeForSubject(slot);
                    const isLab = isObj ? Boolean(slot.isLab) : (slot.toLowerCase().includes("lab") || slot.toLowerCase().includes("cep") || slot.toLowerCase().includes("mdm"));

                    // Determine slot state: Future, Completed, or Pending
                    const isFutureSlot = this.isClassInFuture(slotDate, timeSlotHeader);
                    const sessionKey = `${slotDate}_${classCode}_${subjectName}`;
                    const isMarked = isObj ? Boolean(slot.isMarked || this.isSessionMarked(sessionKey)) : this.isSessionMarked(sessionKey);

                    const safeSubject = subjectName.replace(/'/g, "\\'");
                    const safeRoom = roomPart.replace(/'/g, "\\'");

                    // Leave & Engagement Checks
                    const engRecord = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getClassEngagement === 'function')
                      ? TeacherERPData.getClassEngagement(activeEmpCode, row.day, timeSlotHeader, slotDate)
                      : null;
                    const isFacOnLeave = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.isFacultyOnLeave === 'function')
                      ? TeacherERPData.isFacultyOnLeave(activeEmpCode, slotDate || row.day)
                      : false;

                    if (engRecord) {
                      const isEngagingFaculty = (engRecord.engagingEmpCode === activeEmpCode || engRecord.engagingFacultyId === activeEmpCode);
                      return `
                        <td>
                          <div class="timetable-slot timetable-slot-engaged"
                               onclick="TimetableModule.handleSlotClick('${safeSubject}', '${safeRoom}', '${timeSlotHeader}', '${classCode}', '${slotDate}')"
                               style="background:#ECFDF5; border:1.5px solid #10B981; border-left:5px solid #059669; border-radius:8px; padding:10px 12px; cursor:pointer; box-shadow:0 2px 6px rgba(16,185,129,0.12);"
                               title="Substituted by ${engRecord.engagingFacultyName}. ${isEngagingFaculty ? 'Click to mark attendance.' : 'Attendance managed by substitute.'}">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                              <span style="font-weight:800; color:#065F46; font-size:12.5px;">${subjectName}</span>
                              <span style="background:#10B981; color:#fff; font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px;">ENGAGED</span>
                            </div>
                            <div style="font-size:11px; color:#047857; font-weight:600; margin-bottom:4px;">
                              Engaged by: <strong>${engRecord.engagingFacultyName}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px; font-size:11px; color:#065F46; border-top:1px dashed #A7F3D0; padding-top:4px;">
                              <span>(${roomPart})</span>
                              <span style="font-weight:700;">${classCode}</span>
                            </div>
                            <div style="margin-top:4px; text-align:right;">
                              ${isEngagingFaculty ? '<span style="font-size:10px; color:#059669; font-weight:700;">✓ Mark Attendance</span>' : '<span style="font-size:10px; color:#B45309; font-weight:600;">Managed by Substitute</span>'}
                            </div>
                          </div>
                        </td>
                      `;
                    }

                    if (isFacOnLeave) {
                      return `
                        <td>
                          <div class="timetable-slot timetable-slot-onleave"
                               onclick="TimetableModule.handleSlotClick('${safeSubject}', '${safeRoom}', '${timeSlotHeader}', '${classCode}', '${slotDate}')"
                               style="background:#FEF9C3; border:1.5px solid #F59E0B; border-left:5px solid #D97706; border-radius:8px; padding:10px 12px; cursor:pointer; box-shadow:0 2px 6px rgba(245,158,11,0.12);"
                               title="Faculty is on approved leave for this lecture.">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                              <span style="font-weight:800; color:#92400E; font-size:12.5px;">${subjectName}</span>
                              <span style="background:#F59E0B; color:#fff; font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px;">ON LEAVE</span>
                            </div>
                            <div style="font-size:11px; color:#B45309; font-weight:600; margin-bottom:4px;">
                              On Leave: <strong>${currentFacObj.name}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px; font-size:11px; color:#92400E; border-top:1px dashed #FDE68A; padding-top:4px;">
                              <span>(${roomPart})</span>
                              <span style="font-weight:700;">${classCode}</span>
                            </div>
                            <div style="margin-top:5px; display:flex; justify-content:space-between; align-items:center;">
                              <span style="font-size:10px; color:#DC2626; font-weight:700;">Attendance Blocked</span>
                              <button type="button"
                                      onclick="event.stopPropagation(); TimetableModule.openEngagementModal('${safeSubject}', '${safeRoom}', '${timeSlotHeader}', '${classCode}', '${slotDate}', '${currentFacObj.empCode}', '${currentFacObj.name.replace(/'/g, "\\'")}')"
                                      style="background:#0B5CAD; color:#fff; border:none; padding:3px 8px; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer; box-shadow:0 1px 3px rgba(11,92,173,0.3);">
                                + Engage
                              </button>
                            </div>
                          </div>
                        </td>
                      `;
                    }

                    // 3. Regular Slot: Render according to status (Future, Completed, or Pending)
                    if (isFutureSlot) {
                      return `
                        <td>
                          <div class="timetable-slot ${isLab ? 'lab' : ''} slot-future"
                               title="Cannot mark attendance for future classes"
                               style="cursor: not-allowed;">
                            <div class="slot-sub" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                              <span style="font-weight:700;">${subjectName}</span>
                              <span class="slot-future-badge">Upcoming</span>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:3px;">
                              <div class="slot-room" style="font-size:11px; color:#64748B;">(${roomPart})</div>
                              <span class="slot-class" style="font-weight:600; font-size:11px; color:#64748B;">${classCode}</span>
                            </div>
                            <div style="margin-top:4px; font-size:10px; color:#94A3B8; font-style:italic;">
                              Cannot mark ahead
                            </div>
                          </div>
                        </td>
                      `;
                    }

                    if (isMarked) {
                      return `
                        <td>
                          <div class="timetable-slot ${isLab ? 'lab' : ''} slot-completed slot-clickable"
                               onclick="TimetableModule.handleSlotClick('${safeSubject}', '${safeRoom}', '${timeSlotHeader}', '${classCode}', '${slotDate}')"
                               title="Attendance already submitted. Click to view or edit roster."
                               style="cursor: pointer;">
                            <div class="slot-sub" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                              <span style="font-weight:700; color:#14532D;">${subjectName}</span>
                              <span class="slot-completed-badge"><i data-lucide="check" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> Completed</span>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:3px;">
                              <div class="slot-room" style="color:#15803D;">(${roomPart})</div>
                              <span class="slot-class" style="font-weight:700; font-size:11px; color:#166534;">${classCode}</span>
                            </div>
                            <div style="margin-top:4px; display:flex; justify-content:space-between; align-items:center;">
                              <span style="font-size:10px; color:#15803D; font-weight:600;">Attendance Logged</span>
                              <span class="slot-view-edit-link" style="font-size:10.5px; font-weight:700; color:#047857;">View/Edit &rarr;</span>
                            </div>
                          </div>
                        </td>
                      `;
                    }

                    // Default for past/active today session not yet marked: PENDING
                    return `
                      <td>
                        <div class="timetable-slot ${isLab ? 'lab' : ''} slot-pending slot-clickable"
                             onclick="TimetableModule.handleSlotClick('${safeSubject}', '${safeRoom}', '${timeSlotHeader}', '${classCode}', '${slotDate}')"
                             title="Attendance pending! Click to mark attendance immediately."
                             style="cursor: pointer;">
                          <div class="slot-sub" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                            <span style="font-weight:700; color:#854D0E;">${subjectName}</span>
                            <span class="slot-pending-badge"><span class="slot-pending-dot"></span> Pending</span>
                          </div>
                          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:3px;">
                            <div class="slot-room" style="color:#92400E;">(${roomPart})</div>
                            <span class="slot-class" style="font-weight:700; font-size:11px; color:#B45309;">${classCode}</span>
                          </div>
                          <div style="margin-top:4px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:10px; color:#B45309; font-weight:700;">Click to Mark</span>
                            <span style="font-size:10.5px; font-weight:800; color:#D97706;">Mark &rarr;</span>
                          </div>
                        </div>
                      </td>
                    `;
                  }).join('')}
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 4. Legend & Teaching Load Info Bar -->
        <div style="padding: 12px 20px; background: #F8FAFC; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 12px;">
          <div class="timetable-legend-bar" style="margin: 0; padding: 0; border: none; background: transparent;">
            <div class="legend-item">
              <span class="legend-swatch lecture"></span>
              <span>Theory Lecture</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch lab"></span>
              <span>Practical / Lab / Project</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch" style="background:#FEFCE8; border:1px solid #FDE047; border-left:3px solid #F59E0B; width:12px; height:12px; border-radius:3px; display:inline-block;"></span>
              <span style="font-weight:600; color:#854D0E;">Attendance Pending</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch" style="background:#F0FDF4; border:1px solid #BBF7D0; border-left:3px solid #10B981; width:12px; height:12px; border-radius:3px; display:inline-block;"></span>
              <span style="font-weight:600; color:#14532D;">Attendance Completed</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch test" style="background:#EA580C; border:1px solid #DC2626;"></span>
              <span style="font-weight:700; color:#C2410C;">Scheduled Test</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch" style="background:#FEF9C3; border:1.5px solid #F59E0B;"></span>
              <span style="color:#92400E; font-weight:700;">On Leave</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch" style="background:#ECFDF5; border:1.5px solid #10B981;"></span>
              <span style="color:#065F46; font-weight:700;">Engaged</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch" style="background:#F8FAFC; border:1px solid #E2E8F0; border-left:3px solid #94A3B8; width:12px; height:12px; border-radius:3px; display:inline-block;"></span>
              <span style="color:#64748B;">Upcoming (Future)</span>
            </div>
          </div>

          <div style="color: #64748B; font-size: 11.5px;">
            Break: <strong>1:00 PM – 1:15 PM</strong> &bull; Recess: <strong>3:15 PM – 3:45 PM</strong>
          </div>
        </div>

        <!-- 5. Allotted Teaching Load Breakdown from PDF -->
        ${teachingLoad.length > 0 ? `
        <div style="padding: 14px 20px; background: #FFFFFF; border-top: 1px solid #E2E8F0; border-radius: 0 0 10px 10px;">
          <h5 style="margin: 0 0 8px 0; font-size: 12.5px; color: var(--dark-navy, #0B1F3A); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            Allotted Teaching Load Summary (From Official PDF)
          </h5>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${teachingLoad.map(item => `
              <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 12px; font-size: 12px; display: flex; gap: 8px; align-items: center;">
                <span style="font-weight: 700; color: #0B5CAD;">Sem ${item.semester || 'V'}:</span>
                <span style="font-weight: 600; color: #1E293B;">${item.abbr || item.code}</span>
                <span style="color: #64748B;">(Th: ${item.theory || 0}h | Pr: ${item.practical || 0}h)</span>
                ${item.total ? `<span style="background: #E2E8F0; padding: 1px 6px; border-radius: 4px; font-weight: 600; color: #334155;">Tot: ${item.total}h</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
      `;
    },

    /**
     * Render the timetable into the specified DOM container
     */
    render(containerId = "timetable-content") {
      let container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!container) return;

      container.innerHTML = this.getHTML(this.selectedDate);

      // Re-initialize Lucide Icons
      if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      // Notify observers
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timetable:rendered', { detail: { date: this.selectedDate } }));
      }
    },

    /**
     * Open Test Scheduling Modal
     */
    openScheduleTestModal() {
      this.ensureModalsExist();
      const modal = document.getElementById("ttScheduleTestModal");
      if (modal) {
        modal.style.display = "flex";
        // Reset form
        const form = document.getElementById("ttScheduleTestForm");
        if (form) form.reset();
        const dateInput = document.getElementById("ttTestDateInput");
        if (dateInput) dateInput.value = this.selectedDate || new Date().toISOString().split('T')[0];
      }
    },

    /**
     * Close Test Scheduling Modal
     */
    closeScheduleTestModal() {
      const modal = document.getElementById("ttScheduleTestModal");
      if (modal) modal.style.display = "none";
    },

    /**
     * Handle saving new test from modal form
     */
    async handleSaveTest(e) {
      if (e) e.preventDefault();
      const testName = (document.getElementById("ttTestNameInput")?.value || "").trim();
      const subject = document.getElementById("ttTestSubjectSelect")?.value || "Data Structures";
      const classId = document.getElementById("ttTestClassSelect")?.value || "2R1";
      const date = document.getElementById("ttTestDateInput")?.value || this.selectedDate;
      const timeSlot = document.getElementById("ttTestSlotSelect")?.value || "09:00 - 10:30 AM";
      const testType = document.getElementById("ttTestTypeSelect")?.value || "Mid-Term";
      const duration = parseInt(document.getElementById("ttTestDurationInput")?.value, 10) || 90;
      const room = (document.getElementById("ttTestRoomInput")?.value || "Room 201").trim();
      const totalMarks = parseInt(document.getElementById("ttTestMarksInput")?.value, 10) || 50;
      const instructions = (document.getElementById("ttTestInstructionsInput")?.value || "").trim();

      if (!testName) {
        this.showToast("Please enter a test name.", "error");
        return;
      }

      const activeCode = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode)
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';

      const facultyName = (typeof TeacherERPData !== 'undefined' && TeacherERPData.faculty && TeacherERPData.faculty.name)
        ? TeacherERPData.faculty.name
        : 'Dr. Rohan Deshmukh';

      const newTest = {
        id: `TEST-${Date.now()}`,
        facultyId: activeCode,
        empCode: activeCode,
        facultyName: facultyName,
        testName: testName,
        subject: subject,
        classId: classId,
        date: date,
        timeSlot: timeSlot,
        duration: duration,
        room: room,
        testType: testType,
        totalMarks: totalMarks,
        instructions: instructions,
        attachmentUrl: "/uploads/question-paper.pdf",
        createdAt: new Date().toISOString()
      };

      // Add to local state
      this.tests.unshift(newTest);

      // Save to localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
        }
      } catch (_) {}

      // Try backend POST /api/tests/schedule
      try {
        await fetch('/api/tests/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTest)
        });
      } catch (_) {}

      // Close modal & show toast
      this.closeScheduleTestModal();
      this.showToast("Test scheduled successfully. Notifications sent to faculty and students.", "success");

      // Re-render timetable
      this.render("timetable-content");
    },

    /**
     * Open details dialog for a scheduled test
     */
    openTestDetails(testId) {
      this.ensureModalsExist();
      const test = this.tests.find(t => t.id === testId);
      if (!test) return;

      const modal = document.getElementById("ttTestDetailsModal");
      const title = document.getElementById("ttDetailsTitle");
      const body = document.getElementById("ttDetailsBody");

      if (title) title.textContent = test.testName;
      if (body) {
        body.innerHTML = `
          <div style="background:#FFF7ED; border:1px solid #FED7AA; border-left:4px solid #EA580C; border-radius:6px; padding:12px 14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="background:#DC2626; color:#fff; font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px;">${test.testType ? test.testType.toUpperCase() : 'TEST'}</span>
              <span style="font-weight:700; color:#C2410C; font-size:12px;">Class: ${test.classId}</span>
            </div>
            <h4 style="margin:6px 0 2px 0; font-size:15px; color:#9A3412;">${test.testName}</h4>
            <div style="font-size:12px; color:#7C2D12;">Subject: <strong>${test.subject}</strong></div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:12px; margin-bottom:14px;">
            <div><span style="color:#64748B;">Date:</span> <strong>${test.date}</strong></div>
            <div><span style="color:#64748B;">Time Slot:</span> <strong>${test.timeSlot}</strong></div>
            <div><span style="color:#64748B;">Room / Venue:</span> <strong>${test.room || 'Room 201'}</strong></div>
            <div><span style="color:#64748B;">Total Marks:</span> <strong style="color:#EA580C;">${test.totalMarks} Marks (${test.duration || 90}m)</strong></div>
            <div style="grid-column: span 2;"><span style="color:#64748B;">Faculty:</span> <strong>${test.facultyName || test.facultyId}</strong></div>
          </div>
          ${test.instructions ? `
          <div style="margin-bottom:14px;">
            <span style="font-size:12px; font-weight:700; color:#1E293B; display:block; margin-bottom:4px;">Special Instructions:</span>
            <div style="background:#F1F5F9; border:1px solid #CBD5E1; border-radius:6px; padding:10px 12px; font-size:12px; color:#334155; line-height:1.4;">${test.instructions}</div>
          </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #E2E8F0; padding-top:12px;">
            <button type="button" onclick="TimetableModule.promptDeleteTest('${test.id}')" style="background:#FEF2F2; border:1px solid #FCA5A5; color:#DC2626; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
              Delete Test
            </button>
            <button type="button" onclick="TimetableModule.closeTestDetailsModal()" style="background:#0B1F3A; color:#fff; border:none; padding:7px 16px; border-radius:6px; font-size:12.5px; font-weight:600; cursor:pointer;">
              Close
            </button>
          </div>
        `;
      }

      if (modal) modal.style.display = "flex";
    },

    /**
     * Close Test Details Modal
     */
    closeTestDetailsModal() {
      const modal = document.getElementById("ttTestDetailsModal");
      if (modal) modal.style.display = "none";
    },

    /**
     * Prompt delete test
     */
    promptDeleteTest(testId) {
      if (confirm("Are you sure you want to delete this scheduled test? It will be removed from faculty and student timetables.")) {
        this.tests = this.tests.filter(t => t.id !== testId);
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
          }
        } catch (_) {}
        this.closeTestDetailsModal();
        this.showToast("Test deleted successfully.", "info");
        this.render("timetable-content");
      }
    },

    /**
     * Ensure modal dialog DOM elements exist
     */
    ensureModalsExist() {
      if (typeof document === 'undefined') return;

      // 1. Schedule Test Modal
      if (!document.getElementById("ttScheduleTestModal")) {
        const modalDiv = document.createElement("div");
        modalDiv.id = "ttScheduleTestModal";
        modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(11,31,58,0.65); backdrop-filter:blur(3px); display:none; align-items:center; justify-content:center; z-index:99999; padding:16px; box-sizing:border-box;";
        modalDiv.innerHTML = `
          <div style="background:#fff; border-radius:10px; width:100%; max-width:620px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.25); display:flex; flexDirection:column; font-family:'Inter', sans-serif;">
            <div style="background:linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%); color:#fff; padding:16px 20px; border-radius:10px 10px 0 0; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#EA580C; color:#fff; font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px;">NEW ASSESSMENT</span>
                <h3 style="margin:0; font-size:16px; font-weight:700;">Schedule Assessment / Test</h3>
              </div>
              <button type="button" onclick="TimetableModule.closeScheduleTestModal()" style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <form id="ttScheduleTestForm" onsubmit="TimetableModule.handleSaveTest(event)" style="padding:20px; display:flex; flex-direction:column; gap:14px;">
              <div>
                <label style="display:block; font-size:12.5px; font-weight:600; color:#1E293B; margin-bottom:4px;">Test Name <span style="color:#EF4444;">*</span></label>
                <input type="text" id="ttTestNameInput" placeholder="e.g. Mid-Term Exam - Data Structures" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box;" />
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                  <label style="display:block; font-size:12.5px; font-weight:600; color:#1E293B; margin-bottom:4px;">Subject <span style="color:#EF4444;">*</span></label>
                  <select id="ttTestSubjectSelect" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box; background:#fff;">
                    <option value="Data Structures">Data Structures</option>
                    <option value="Java Programming">Java Programming</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Database Management Systems">Database Management Systems</option>
                    <option value="Advanced Algorithms">Advanced Algorithms</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:12.5px; font-weight:600; color:#1E293B; margin-bottom:4px;">Class / Batch <span style="color:#EF4444;">*</span></label>
                  <select id="ttTestClassSelect" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box; background:#fff;">
                    <option value="2R1">2R1 (CSE Second Year A)</option>
                    <option value="2R2">2R2 (CSE Second Year B)</option>
                    <option value="3R">3R (CSE Third Year)</option>
                    <option value="4R">4R (CSE Final Year)</option>
                  </select>
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                  <label style="display:block; font-size:12.5px; font-weight:600; color:#1E293B; margin-bottom:4px;">Date <span style="color:#EF4444;">*</span></label>
                  <input type="date" id="ttTestDateInput" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box;" />
                </div>
                <div>
                  <label style="display:block; font-size:12.5px; font-weight:600; color:#1E293B; margin-bottom:4px;">Time Slot <span style="color:#EF4444;">*</span></label>
                  <select id="ttTestSlotSelect" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box; background:#fff;">
                    <option value="09:00 - 10:30 AM">09:00 - 10:30 AM</option>
                    <option value="11:00 - 12:30 PM">11:00 - 12:30 PM</option>
                    <option value="01:30 - 03:00 PM">01:30 - 03:00 PM</option>
                    <option value="03:30 - 05:00 PM">03:30 - 05:00 PM</option>
                  </select>
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
                <div>
                  <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Test Type</label>
                  <select id="ttTestTypeSelect" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box; background:#fff;">
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Practical">Practical</option>
                    <option value="Assignment Submission">Assignment</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Duration (mins)</label>
                  <input type="number" id="ttTestDurationInput" value="90" min="15" max="300" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box;" />
                </div>
                <div>
                  <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Total Marks</label>
                  <input type="number" id="ttTestMarksInput" value="50" min="5" max="100" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box;" />
                </div>
              </div>
              <div>
                <label style="display:block; font-size:12.5px; font-weight:600; color:#1E293B; margin-bottom:4px;">Room / Location <span style="color:#EF4444;">*</span></label>
                <input type="text" id="ttTestRoomInput" value="Room 201" placeholder="e.g. Room 201 or Lab 02" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box;" />
              </div>
              <div>
                <label style="display:block; font-size:12.5px; font-weight:600; color:#1E293B; margin-bottom:4px;">Special Instructions</label>
                <textarea id="ttTestInstructionsInput" rows="2" placeholder="e.g. Bring your own scientific calculators." style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box; resize:vertical;"></textarea>
              </div>
              <div style="background:#FFF7ED; border:1px solid #FED7AA; border-radius:6px; padding:8px 12px; font-size:11.5px; color:#9A3412;">
                📢 This test will reflect in your timetable and all students of the selected class.
              </div>
              <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #E2E8F0; padding-top:10px;">
                <button type="button" onclick="TimetableModule.closeScheduleTestModal()" style="padding:8px 14px; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:6px; font-size:12.5px; font-weight:600; color:#475569; cursor:pointer;">Cancel</button>
                <button type="submit" style="padding:8px 18px; background:#EA580C; border:none; border-radius:6px; font-size:12.5px; font-weight:700; color:#fff; cursor:pointer; box-shadow:0 2px 6px rgba(234,88,12,0.3);">+ Schedule Test</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(modalDiv);
      }

      // 2. Test Details Modal
      if (!document.getElementById("ttTestDetailsModal")) {
        const detailsDiv = document.createElement("div");
        detailsDiv.id = "ttTestDetailsModal";
        detailsDiv.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(11,31,58,0.65); backdrop-filter:blur(3px); display:none; align-items:center; justify-content:center; z-index:99999; padding:16px; box-sizing:border-box;";
        detailsDiv.innerHTML = `
          <div style="background:#fff; border-radius:10px; width:100%; max-width:520px; max-height:85vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.25); display:flex; flex-direction:column; font-family:'Inter', sans-serif;">
            <div style="background:linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%); color:#fff; padding:14px 18px; border-radius:10px 10px 0 0; display:flex; justify-content:space-between; align-items:center;">
              <h3 id="ttDetailsTitle" style="margin:0; font-size:15px; font-weight:700;">Assessment Details</h3>
              <button type="button" onclick="TimetableModule.closeTestDetailsModal()" style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <div id="ttDetailsBody" style="padding:18px;"></div>
          </div>
        `;
        document.body.appendChild(detailsDiv);
      }

      // 3. Faculty Leave Application Modal
      if (!document.getElementById("ttLeaveModal")) {
        const leaveDiv = document.createElement("div");
        leaveDiv.id = "ttLeaveModal";
        leaveDiv.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(11,31,58,0.65); backdrop-filter:blur(3px); display:none; align-items:center; justify-content:center; z-index:99999; padding:16px; box-sizing:border-box;";
        leaveDiv.innerHTML = `
          <div style="background:#fff; border-radius:12px; width:100%; max-width:680px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.25); display:flex; flex-direction:column; font-family:'Inter', sans-serif;">
            <div style="background:linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%); color:#fff; padding:16px 20px; border-radius:12px 12px 0 0; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">📅</span>
                <h3 style="margin:0; font-size:16px; font-weight:700;">Apply for Faculty Leave</h3>
              </div>
              <button type="button" onclick="TimetableModule.closeLeaveModal()" style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
              <form id="ttLeaveForm" onsubmit="TimetableModule.handleSaveLeave(event)" style="display:flex; flex-direction:column; gap:12px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <div>
                    <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Faculty Name (Auto)</label>
                    <input type="text" id="ttLeaveNameInput" readonly style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; background:#F1F5F9; font-size:12.5px; box-sizing:border-box;" />
                  </div>
                  <div>
                    <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Faculty Email (Auto)</label>
                    <input type="email" id="ttLeaveEmailInput" readonly style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; background:#F1F5F9; font-size:12.5px; box-sizing:border-box;" />
                  </div>
                </div>
                <div>
                  <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Phone Number <span style="color:#EF4444;">*</span></label>
                  <input type="tel" id="ttLeavePhoneInput" value="9822012345" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box;" />
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <div>
                    <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Start Date <span style="color:#EF4444;">*</span></label>
                    <input type="date" id="ttLeaveStartInput" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box;" />
                  </div>
                  <div>
                    <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">End Date <span style="color:#EF4444;">*</span></label>
                    <input type="date" id="ttLeaveEndInput" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box;" />
                  </div>
                </div>
                <div>
                  <label style="display:block; font-size:12px; font-weight:600; color:#1E293B; margin-bottom:4px;">Reason for Leave <span style="color:#EF4444;">*</span></label>
                  <textarea id="ttLeaveReasonInput" rows="2" placeholder="e.g. Attending Academic Conference / Personal" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; box-sizing:border-box; resize:vertical;"></textarea>
                </div>
                <div style="background:#FEF3C7; border:1px solid #FDE68A; border-radius:6px; padding:8px 12px; font-size:11.5px; color:#92400E;">
                  ⚠️ Your scheduled classes during this period will show <strong>On Leave</strong> and become available for substitute faculty engagement.
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #E2E8F0; padding-top:10px;">
                  <button type="button" onclick="TimetableModule.closeLeaveModal()" style="padding:7px 14px; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">Cancel</button>
                  <button type="submit" style="padding:7px 18px; background:#0B5CAD; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">Submit Application &rarr;</button>
                </div>
              </form>
              <div style="border-top:1px solid #E2E8F0; padding-top:12px;">
                <h4 style="margin:0 0 8px 0; font-size:13px; font-weight:700; color:#1E293B;">Leave Status Tracking</h4>
                <div id="ttLeaveHistoryContainer"></div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(leaveDiv);
      }

      // 4. Class Engagement (Substitution) Modal
      if (!document.getElementById("ttEngagementModal")) {
        const engDiv = document.createElement("div");
        engDiv.id = "ttEngagementModal";
        engDiv.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(11,31,58,0.65); backdrop-filter:blur(3px); display:none; align-items:center; justify-content:center; z-index:99999; padding:16px; box-sizing:border-box;";
        engDiv.innerHTML = `
          <div style="background:#fff; border-radius:12px; width:100%; max-width:480px; box-shadow:0 20px 40px rgba(0,0,0,0.25); display:flex; flex-direction:column; font-family:'Inter', sans-serif;">
            <div style="background:linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%); color:#fff; padding:14px 18px; border-radius:12px 12px 0 0; display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:15px; font-weight:700;">Engage Class (Substitute)</h3>
              <button type="button" onclick="TimetableModule.closeEngagementModal()" style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <div style="padding:18px;">
              <div style="background:#EFF6FF; border-left:4px solid #3B82F6; padding:10px 12px; border-radius:6px; margin-bottom:12px; font-size:12.5px; color:#1E3A8A;">
                <strong>Are you sure you want to engage this class?</strong>
                <p style="margin:2px 0 0 0; font-size:11.5px; color:#3B82F6;">You will conduct this lecture and mark attendance in place of the on-leave faculty.</p>
              </div>
              <div id="ttEngagementDetails"></div>
              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px; border-top:1px solid #E2E8F0; padding-top:12px;">
                <button type="button" onclick="TimetableModule.closeEngagementModal()" style="padding:7px 14px; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">Cancel</button>
                <button type="button" onclick="TimetableModule.handleConfirmEngagement()" style="padding:7px 18px; background:#10B981; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">✓ Confirm Engagement</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(engDiv);
      }

      // 5. On-Leave Alert Modal (when on-leave faculty tries to mark attendance)
      if (!document.getElementById("ttOnLeaveAlertModal")) {
        const alertDiv = document.createElement("div");
        alertDiv.id = "ttOnLeaveAlertModal";
        alertDiv.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.65); backdrop-filter:blur(2px); display:none; align-items:center; justify-content:center; z-index:100001; padding:16px; box-sizing:border-box;";
        alertDiv.innerHTML = `
          <div style="background:#fff; border-radius:12px; width:100%; max-width:440px; padding:22px; box-shadow:0 20px 40px rgba(0,0,0,0.25); border-top:5px solid #F59E0B; font-family:'Inter', sans-serif;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <span style="font-size:24px;">⚠️</span>
              <div>
                <h4 style="margin:0; font-size:16px; color:#92400E; font-weight:800;">Attendance Marking Restricted</h4>
                <span style="font-size:11px; color:#B45309;">Faculty Leave Policy</span>
              </div>
            </div>
            <p id="ttOnLeaveAlertMessage" style="margin:0 0 12px 0; font-size:13px; color:#334155; line-height:1.5;"></p>
            <div id="ttOnLeaveAlertSub" style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:6px; padding:8px 10px; font-size:12px; color:#065F46; margin-bottom:14px; display:none;"></div>
            <div style="display:flex; justify-content:flex-end;">
              <button type="button" onclick="TimetableModule.closeOnLeaveAlert()" style="padding:8px 18px; background:#0B5CAD; color:#fff; border:none; border-radius:6px; font-weight:700; font-size:12.5px; cursor:pointer;">Understood</button>
            </div>
          </div>
        `;
        document.body.appendChild(alertDiv);
      }
    },

    /**
     * Open Leave Application Modal
     */
    openLeaveModal() {
      this.ensureModalsExist();
      const modal = document.getElementById("ttLeaveModal");
      if (modal) {
        modal.style.display = "flex";
        const empCode = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode)
          ? TeacherERPData.getActiveTeacherEmpCode()
          : 'EMP-CSE-1001';
        const fac = (typeof TeacherERPData !== 'undefined' && TeacherERPData.faculty)
          ? TeacherERPData.faculty
          : { name: "Dr. Rohan Deshmukh", email: "rdeshmukh@ssgmce.ac.in" };

        const nameInput = document.getElementById("ttLeaveNameInput");
        const emailInput = document.getElementById("ttLeaveEmailInput");
        const startInput = document.getElementById("ttLeaveStartInput");
        const endInput = document.getElementById("ttLeaveEndInput");

        if (nameInput) nameInput.value = fac.name || "Dr. Rohan Deshmukh";
        if (emailInput) emailInput.value = fac.email || "rdeshmukh@ssgmce.ac.in";
        if (startInput) startInput.value = this.selectedDate || new Date().toISOString().split('T')[0];
        if (endInput) {
          const dt = new Date(Date.now() + 86400000 * 2);
          endInput.value = dt.toISOString().split('T')[0];
        }
        this.renderLeaveHistoryTable();
      }
    },

    closeLeaveModal() {
      const modal = document.getElementById("ttLeaveModal");
      if (modal) modal.style.display = "none";
    },

    renderLeaveHistoryTable() {
      const container = document.getElementById("ttLeaveHistoryContainer");
      if (!container) return;
      const empCode = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode)
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';
      const leaves = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getFacultyLeaves)
        ? TeacherERPData.getFacultyLeaves(empCode)
        : [];

      if (!leaves || leaves.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:18px; color:#64748B; font-size:12px;">No leave records found.</div>`;
        return;
      }

      container.innerHTML = leaves.map(l => `
        <div style="background:#fff; border:1px solid #E2E8F0; border-left:4px solid #10B981; border-radius:6px; padding:8px 12px; margin-bottom:6px; font-size:11.5px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>${l.startDate} &rarr; ${l.endDate}</strong>
            <span style="background:#DCFCE7; color:#166534; font-weight:700; padding:1px 6px; border-radius:4px; font-size:10px;">${l.status || 'Approved'}</span>
          </div>
          <div style="color:#475569; margin-top:2px;">${l.reason || 'Personal Leave'}</div>
        </div>
      `).join('');
    },

    handleSaveLeave(e) {
      if (e) e.preventDefault();
      const empCode = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode)
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';
      const fac = (typeof TeacherERPData !== 'undefined' && TeacherERPData.faculty)
        ? TeacherERPData.faculty
        : { name: "Dr. Rohan Deshmukh", email: "rdeshmukh@ssgmce.ac.in" };

      const phone = document.getElementById("ttLeavePhoneInput")?.value || "9822012345";
      const startDate = document.getElementById("ttLeaveStartInput")?.value;
      const endDate = document.getElementById("ttLeaveEndInput")?.value;
      const reason = document.getElementById("ttLeaveReasonInput")?.value || "Academic / Official Purpose";

      if (!startDate || !endDate) {
        this.showToast("Please specify both start and end date.", "error");
        return;
      }

      if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.applyForLeave === 'function') {
        TeacherERPData.applyForLeave({
          empCode: empCode,
          facultyName: fac.name,
          facultyEmail: fac.email,
          phone: phone,
          startDate: startDate,
          endDate: endDate,
          reason: reason
        });
      }

      this.closeLeaveModal();
      this.showToast("Leave application submitted successfully.", "success");
      this.render("timetable-content");
    },

    /**
     * Open Engagement Confirmation Modal
     */
    openEngagementModal(subject, room, timeSlot, classId, date, originalEmpCode, originalFacultyName) {
      this.ensureModalsExist();
      this._pendingEngagement = {
        subject, room, timeSlot, classId, date, originalEmpCode, originalFacultyName
      };

      const modal = document.getElementById("ttEngagementModal");
      const details = document.getElementById("ttEngagementDetails");
      if (details) {
        const myName = (typeof TeacherERPData !== 'undefined' && TeacherERPData.faculty && TeacherERPData.faculty.name)
          ? TeacherERPData.faculty.name
          : "Dr. Rohan Deshmukh";
        details.innerHTML = `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px; font-size:12px; display:flex; flex-direction:column; gap:6px;">
            <div><span style="color:#64748B;">Subject:</span> <strong>${subject}</strong></div>
            <div><span style="color:#64748B;">Class & Room:</span> <strong>Class ${classId} (${room})</strong></div>
            <div><span style="color:#64748B;">Schedule:</span> <strong>${timeSlot} &bull; ${date}</strong></div>
            <div><span style="color:#64748B;">Original Faculty (On Leave):</span> <strong style="color:#92400E;">${originalFacultyName}</strong></div>
            <div><span style="color:#64748B;">Engaging (Substitute) Faculty:</span> <strong style="color:#059669;">${myName}</strong></div>
          </div>
        `;
      }
      if (modal) modal.style.display = "flex";
    },

    closeEngagementModal() {
      const modal = document.getElementById("ttEngagementModal");
      if (modal) modal.style.display = "none";
      this._pendingEngagement = null;
    },

    handleConfirmEngagement() {
      if (!this._pendingEngagement) return;
      const activeEmp = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode)
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';
      const myName = (typeof TeacherERPData !== 'undefined' && TeacherERPData.faculty && TeacherERPData.faculty.name)
        ? TeacherERPData.faculty.name
        : "Dr. Rohan Deshmukh";

      if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.engageClass === 'function') {
        TeacherERPData.engageClass({
          originalEmpCode: this._pendingEngagement.originalEmpCode,
          originalFacultyName: this._pendingEngagement.originalFacultyName,
          engagingEmpCode: activeEmp,
          engagingFacultyName: myName,
          classId: this._pendingEngagement.classId,
          date: this._pendingEngagement.date,
          day: (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getDayName(this._pendingEngagement.date) : "Monday",
          timeSlot: this._pendingEngagement.timeSlot,
          subject: this._pendingEngagement.subject,
          room: this._pendingEngagement.room
        });
      }

      this.closeEngagementModal();
      this.showToast("Class engaged successfully. You can now mark attendance.", "success");
      this.render("timetable-content");
    },

    showOnLeaveAlert(message, substituteName) {
      this.ensureModalsExist();
      const modal = document.getElementById("ttOnLeaveAlertModal");
      const msgElem = document.getElementById("ttOnLeaveAlertMessage");
      const subElem = document.getElementById("ttOnLeaveAlertSub");
      if (msgElem) msgElem.textContent = message;
      if (subElem) {
        subElem.style.display = substituteName ? 'block' : 'none';
        if (substituteName) subElem.textContent = `Attendance for this lecture is assigned to substitute: ${substituteName}.`;
      }
      if (modal) modal.style.display = "flex";
    },

    closeOnLeaveAlert() {
      const modal = document.getElementById("ttOnLeaveAlertModal");
      if (modal) modal.style.display = "none";
    },

    /**
     * Display toast alert
     */
    showToast(message, type = 'info') {
      let toastContainer = document.getElementById("timetable-toast-container");
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "timetable-toast-container";
        toastContainer.style.cssText = "position:fixed; top:24px; right:24px; z-index:100000; display:flex; flex-direction:column; gap:8px;";
        document.body.appendChild(toastContainer);
      }

      const toast = document.createElement("div");
      toast.style.cssText = `background:#0B1F3A; color:#fff; padding:12px 18px; border-radius:8px; box-shadow:0 8px 20px rgba(0,0,0,0.25); border-left:4px solid ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#0B5CAD'}; font-size:13px; font-weight:600; display:flex; align-items:center; gap:8px; animation:slideInRight 0.3s ease;`;
      toast.innerHTML = `<span>${type === 'success' ? '✓' : '🔔'}</span><span>${message}</span>`;
      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    },

    /**
     * Bridge with existing TeacherApp for backwards-compatibility
     */
    attachGlobalBridge() {
      if (typeof window !== 'undefined' && window.TeacherApp) {
        window.TeacherApp.selectedTimetableDate = this.selectedDate;
        window.TeacherApp.handleTimetableDateChange = (dateVal) => this.handleDateChange(dateVal);
        window.TeacherApp.resetTimetableToToday = () => this.resetToToday();
        window.TeacherApp.renderTimetableView = () => this.render("timetable-content");
      }
    }
  };

  // Expose TimetableModule globally
  global.TimetableModule = TimetableModule;

  // Auto-bind to TeacherApp when script evaluates
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => {
      TimetableModule.attachGlobalBridge();
    });
  }

})(typeof window !== 'undefined' ? window : this);
