/* ========================================================
   TEACHER ERP MAIN APPLICATION CONTROLLER
   ======================================================== */

const TeacherApp = {
  currentView: 'dashboard',

  init() {
    this.bindEvents();
    this.renderHeaderProfile();
    this.renderDynamicDates();
    this.renderDashboardData();
    this.renderTimetableView();
    this.renderStudentsView();
    this.renderSyllabusView();
    this.renderResultsView();
    this.renderNotificationsList();
    this.initLucideIcons();
  },

  initLucideIcons() {
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // Dynamic Date & Academic Session Rendering
  renderDynamicDates() {
    if (typeof AcademicDateUtils === 'undefined') return;

    const now = AcademicDateUtils.getNow();
    const todayFormatted = AcademicDateUtils.formatReadableDate(now);
    const fullWeekdayDate = AcademicDateUtils.formatFullWeekdayDate(now);
    const term = AcademicDateUtils.getCurrentAcademicTerm(now);
    const currentYear = now.getFullYear();

    // 1. Dashboard Welcome Banner Date
    const todayDateElem = document.getElementById("dashboard-today-date");
    if (todayDateElem) {
      todayDateElem.textContent = fullWeekdayDate;
    }
    const todayPickerInput = document.getElementById("dashboard-date-picker-input");
    if (todayPickerInput) {
      todayPickerInput.value = AcademicDateUtils.getTodayISO(now);
    }
  },

  openDashboardDatePicker() {
    const input = document.getElementById("dashboard-date-picker-input");
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (e) {
        input.focus();
        input.click();
      }
    } else {
      input.focus();
      input.click();
    }
  },

  handleDashboardDateChange(dateVal) {
    if (!dateVal || typeof AcademicDateUtils === 'undefined') return;
    const parts = dateVal.split('-');
    if (parts.length !== 3) return;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const fullWeekday = AcademicDateUtils.formatFullWeekdayDate(d);
    const todayISO = AcademicDateUtils.getTodayISO();
    const isToday = (dateVal === todayISO);

    const dateElem = document.getElementById("dashboard-today-date");
    if (dateElem) {
      dateElem.textContent = fullWeekday;
    }

    const labelElem = document.getElementById("dashboard-date-label");
    if (labelElem) {
      labelElem.textContent = isToday ? "Today's Date" : "Selected Date";
    }

    // Sync with attendance module state
    if (typeof AttendanceState !== 'undefined') {
      AttendanceState.setDate(dateVal);
    }

    this.showToast(`Dashboard date set to: ${AcademicDateUtils.formatReadableDate(d)}`);

    // 2. Dynamic Greeting based on current time
    const hour = now.getHours();
    const greetingText = hour < 12 ? "Good Morning" : (hour < 17 ? "Good Afternoon" : "Good Evening");
    const greetingElem = document.getElementById("welcome-greeting-text");
    if (greetingElem) {
      greetingElem.innerHTML = `${greetingText}, Professor 👋`;
    }

    // 3. Faculty Profile Academic Term
    const profileTermElem = document.getElementById("profile-academic-term");
    if (profileTermElem) {
      profileTermElem.textContent = term.fullTerm;
    }

    // 4. Academics Hub Active Semester Description
    const academicsTermElem = document.getElementById("academics-active-semester-desc");
    if (academicsTermElem) {
      academicsTermElem.innerHTML = `<strong>Academic Year:</strong> ${term.academicYear} (${term.semesterType} Term)<br><strong>Current Phase:</strong> Mid-Semester Instruction Cycle<br><strong>Accreditation Tier:</strong> NBA Accredited & Autonomous Curriculum`;
    }

    // 5. Examination Mid-Semester Exam Begins (+21 days)
    const examDateElem = document.getElementById("exam-midsem-date");
    if (examDateElem) {
      examDateElem.textContent = AcademicDateUtils.getRelativeFutureDate(21);
    }

    // 6. Fees Clearance Note
    const feesClearanceElem = document.getElementById("fees-clearance-note");
    if (feesClearanceElem) {
      feesClearanceElem.textContent = `Official Accounts Clearance: No pending institutional dues recorded for Academic Session ${term.academicYear}.`;
    }

    // 7. Library Next Book Renewal Date (+7 days)
    const libraryRenewalElem = document.getElementById("library-renewal-date");
    if (libraryRenewalElem) {
      libraryRenewalElem.textContent = AcademicDateUtils.getRelativeFutureDate(7);
    }

    // 8. Training & Placement Technical Assessment Date (+14 days)
    const placementDateElem = document.getElementById("placement-assessment-date");
    if (placementDateElem) {
      placementDateElem.textContent = `Role: GenC Elevate • Technical Assessment Date: ${AcademicDateUtils.getRelativeFutureDate(14)}`;
    }

    // 9. Footer Copyright Year
    const footerElem = document.getElementById("footer-copyright-text");
    if (footerElem) {
      footerElem.innerHTML = `&copy; ${currentYear} SHRI SANT GANJANA MAHARAJ COLLEGE OF ENGINEERING (SSGMCE). All Rights Reserved.`;
    }
  },

  // Dynamic Teacher Profile Management
  getLoggedInTeacher() {
    try {
      const stored = localStorage.getItem("ssgmce_logged_in_teacher") || sessionStorage.getItem("ssgmce_logged_in_teacher");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not read teacher session from storage", e);
    }
    return (typeof TeacherERPData !== 'undefined' && TeacherERPData.faculty) ? TeacherERPData.faculty : {
      name: "Faculty Member",
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
      title: "Faculty",
      avatarInitials: "FM"
    };
  },

  renderHeaderProfile() {
    const teacher = this.getLoggedInTeacher();
    if (!teacher) return;

    let initials = teacher.avatarInitials;
    if (!initials && teacher.name) {
      const cleanName = teacher.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
      const parts = cleanName.split(/\s+/);
      initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }

    const avatarElem = document.getElementById("header-profile-avatar");
    if (avatarElem) {
      avatarElem.innerHTML = `<span>${initials || "FM"}</span>`;
    }

    const nameElem = document.getElementById("header-profile-name");
    if (nameElem) {
      nameElem.textContent = teacher.name || "Faculty Member";
    }

    const deptElem = document.getElementById("header-profile-dept");
    if (deptElem) {
      deptElem.textContent = teacher.department || teacher.departmentCode || "Faculty Department";
    }

    const menuNameElem = document.getElementById("profile-menu-name");
    if (menuNameElem) {
      menuNameElem.textContent = teacher.name || "Faculty Member";
    }

    const menuTitleElem = document.getElementById("profile-menu-title");
    if (menuTitleElem) {
      menuTitleElem.textContent = `${teacher.title || "Faculty"} • ${teacher.departmentCode || teacher.department || ""}`;
    }

    const heroDeptElem = document.getElementById("hero-faculty-department");
    if (heroDeptElem) {
      heroDeptElem.textContent = teacher.department || teacher.departmentCode || "Computer Science & Engineering";
    }

    const heroNameElem = document.getElementById("hero-teacher-name");
    if (heroNameElem) {
      heroNameElem.textContent = teacher.name || "Dr. Rohan Deshmukh";
    }

    const heroDesigElem = document.getElementById("hero-teacher-designation");
    if (heroDesigElem) {
      heroDesigElem.textContent = teacher.title || "Associate Professor";
    }

    const heroIdElem = document.getElementById("hero-teacher-id");
    if (heroIdElem) {
      heroIdElem.textContent = teacher.employeeId ? `Faculty ID: ${teacher.employeeId}` : "Faculty ID: FAC-CSE-1048";
    }
  },

  bindEvents() {
    // Mobile hamburger menu toggle
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const sidebarCloseBtn = document.getElementById("sidebar-close-btn");

    if (hamburgerBtn && sidebar && overlay) {
      hamburgerBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });

      if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener("click", () => {
          sidebar.classList.remove("open");
          overlay.classList.remove("active");
        });
      }
    }

    // Keyboard shortcut (Ctrl+K / Cmd+K) to focus search bar
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("header-search-input");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // Header Profile Dropdown toggle
    const profileTrigger = document.getElementById("profile-dropdown-trigger");
    const profileMenu = document.getElementById("profile-dropdown-menu");

    if (profileTrigger && profileMenu) {
      profileTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = profileMenu.classList.contains("show");
        this.closeAllDropdowns();
        if (!isOpen) {
          profileMenu.classList.add("show");
          profileTrigger.classList.add("active");
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", () => {
      this.closeAllDropdowns();
    });

    // Global Search Bar Handler
    const searchInput = document.getElementById("header-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        this.handleGlobalSearch(query);
      });
    }
  },

  closeAllDropdowns() {
    const profileMenu = document.getElementById("profile-dropdown-menu");
    const profileTrigger = document.getElementById("profile-dropdown-trigger");

    if (profileMenu) profileMenu.classList.remove("show");
    if (profileTrigger) profileTrigger.classList.remove("active");
  },

  // ----------------------------------------------------
  // VIEW ROUTING / SWITCHING
  // ----------------------------------------------------
  switchView(viewName) {
    this.currentView = viewName;

    // Update navigation active state
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      item.classList.remove("active");
      if (item.dataset.view === viewName) {
        item.classList.add("active");
      }
    });

    // Close mobile sidebar on navigation
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    }

    // Hide all view containers
    document.querySelectorAll(".view-section-pane").forEach(pane => {
      pane.style.display = "none";
    });

    // Update Header Page Title / Role Badge
    const titleElem = document.getElementById("header-page-title");
    const setHeaderBadge = (text) => {
      if (titleElem) {
        titleElem.innerHTML = `<i data-lucide="graduation-cap" style="width:13px;height:13px;"></i> ${text}`;
      }
    };

    switch (viewName) {
      case 'dashboard':
        document.getElementById("dashboard-view").style.display = "block";
        setHeaderBadge("Teacher Dashboard");
        break;
      case 'profile':
        document.getElementById("profile-view").style.display = "block";
        setHeaderBadge("Faculty Profile");
        break;
      case 'academics':
        document.getElementById("academics-view").style.display = "block";
        setHeaderBadge("Academics Hub");
        break;
      case 'attendance':
        document.getElementById("attendance-module").style.display = "block";
        setHeaderBadge("Teacher Attendance");
        AttendanceWorkflow.init();
        break;
      case 'examination':
        document.getElementById("examination-view").style.display = "block";
        setHeaderBadge("Examinations");
        break;
      case 'fees':
        document.getElementById("fees-view").style.display = "block";
        setHeaderBadge("College Fees");
        break;
      case 'documents':
        document.getElementById("documents-view").style.display = "block";
        setHeaderBadge("Official Documents");
        break;
      case 'hostel':
        document.getElementById("hostel-view").style.display = "block";
        setHeaderBadge("Campus Hostel");
        break;
      case 'library':
        document.getElementById("library-view").style.display = "block";
        setHeaderBadge("Central Library");
        break;
      case 'placement':
        document.getElementById("placement-view").style.display = "block";
        setHeaderBadge("Training & Placement");
        break;
      case 'grievance':
        document.getElementById("grievance-view").style.display = "block";
        setHeaderBadge("Grievance Redressal");
        break;
      case 'settings':
        document.getElementById("settings-view").style.display = "block";
        setHeaderBadge("Settings");
        break;
      case 'timetable':
        document.getElementById("timetable-view").style.display = "block";
        setHeaderBadge("Faculty Timetable");
        break;
      case 'classes':
        document.getElementById("classes-view").style.display = "block";
        setHeaderBadge("Assigned Classes");
        break;
      case 'students':
        document.getElementById("students-view").style.display = "block";
        setHeaderBadge("Students Directory");
        break;
      case 'syllabus':
        document.getElementById("syllabus-view").style.display = "block";
        setHeaderBadge("Syllabus Tracker");
        break;
      case 'results':
        document.getElementById("results-view").style.display = "block";
        setHeaderBadge("Exam Results");
        break;
      case 'notifications':
        document.getElementById("notifications-view").style.display = "block";
        setHeaderBadge("Notifications");
        break;
      case 'information':
        document.getElementById("profile-view").style.display = "block";
        setHeaderBadge("Faculty Information");
        break;
      default:
        document.getElementById("dashboard-view").style.display = "block";
        setHeaderBadge("Teacher Dashboard");
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.initLucideIcons();
  },

  // ----------------------------------------------------
  // DASHBOARD RENDERING
  // ----------------------------------------------------
  renderDashboardData() {
    // 1. Stats Cards
    const statsContainer = document.getElementById("stats-cards-container");
    if (statsContainer) {
      statsContainer.innerHTML = `
        <!-- CARD 1: Total Classes -->
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Total Classes</span>
            <span class="stat-value">${TeacherERPData.stats.totalClasses}</span>
          </div>
          <div class="stat-icon-wrapper blue">
            <i data-lucide="layout-grid" style="width:24px;height:24px;"></i>
          </div>
        </div>

        <!-- CARD 2: Today's Classes -->
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Today's Classes</span>
            <span class="stat-value">${TeacherERPData.stats.todayClasses}</span>
          </div>
          <div class="stat-icon-wrapper cyan">
            <i data-lucide="calendar" style="width:24px;height:24px;"></i>
          </div>
        </div>

        <!-- CARD 3: Total Students -->
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Total Students</span>
            <span class="stat-value">${TeacherERPData.stats.totalStudents}</span>
          </div>
          <div class="stat-icon-wrapper secondary">
            <i data-lucide="users" style="width:24px;height:24px;"></i>
          </div>
        </div>

        <!-- CARD 4: Attendance Pending -->
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Attendance Pending</span>
            <span class="stat-value" style="color:var(--warning);">${TeacherERPData.stats.attendancePending}</span>
          </div>
          <div class="stat-icon-wrapper navy">
            <i data-lucide="clock" style="width:24px;height:24px;"></i>
          </div>
        </div>
      `;
    }

    // 2. Today's Classes Timeline
    const timelineContainer = document.getElementById("today-classes-timeline");
    if (timelineContainer) {
      timelineContainer.innerHTML = `
        <div class="classes-timeline">
          ${TeacherERPData.todayClasses.map(cls => `
            <div class="timeline-item ${cls.isCurrent ? 'active' : ''}">
              <div class="timeline-time">${cls.time}</div>
              <div class="timeline-dot-container">
                <div class="timeline-dot"></div>
              </div>
              <div class="timeline-details">
                <div class="timeline-header">
                  <div class="timeline-subject">${cls.subject}</div>
                  ${cls.isCurrent ? '<span class="current-badge"><span class="pulse-dot"></span> Next Up</span>' : ''}
                </div>
                <div class="timeline-meta">
                  <span><strong>${cls.department}</strong> • ${cls.classCode}</span>
                  <span>•</span>
                  <span class="timeline-room"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${cls.room}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 3. Attendance Section Progress & Stats
    const attendanceProgressContainer = document.getElementById("attendance-progress-container");
    if (attendanceProgressContainer) {
      const completedCount = TeacherERPData.stats.attendanceCompletedCount;
      const pendingCount = TeacherERPData.stats.attendancePendingCount;
      const totalCount = completedCount + pendingCount;
      const completedPercent = Math.round((completedCount / totalCount) * 100);
      const pendingPercent = 100 - completedPercent;

      attendanceProgressContainer.innerHTML = `
        <div class="attendance-overview-wrapper">
          <!-- Attendance Completed -->
          <div class="progress-group">
            <div class="progress-label-row">
              <span class="label-name">Attendance Completed</span>
              <span class="label-val" style="color:var(--primary-blue);">${completedPercent}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill completed" style="width: ${completedPercent}%;"></div>
            </div>
          </div>

          <!-- Attendance Pending -->
          <div class="progress-group">
            <div class="progress-label-row">
              <span class="label-name">Attendance Pending</span>
              <span class="label-val" style="color:var(--warning);">${pendingPercent}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill pending" style="width: ${pendingPercent}%;"></div>
            </div>
          </div>

          <!-- Mini Stat Boxes -->
          <div class="attendance-stats-row">
            <div class="attendance-mini-stat">
              <div class="mini-stat-num completed">0${completedCount}</div>
              <div class="mini-stat-title">Completed</div>
            </div>
            <div class="attendance-mini-stat">
              <div class="mini-stat-num pending">0${pendingCount}</div>
              <div class="mini-stat-title">Pending</div>
            </div>
          </div>

          <!-- Mark Attendance CTA -->
          <button class="btn-mark-attendance-large" onclick="TeacherApp.openAttendanceModule()">
            <i data-lucide="calendar-check" style="width:18px;height:18px;"></i>
            Mark Attendance
          </button>
        </div>
      `;
    }

    // 4. Class Overview Cards
    const classGrid = document.getElementById("class-overview-grid");
    if (classGrid) {
      classGrid.innerHTML = TeacherERPData.assignedClasses.map(cls => `
        <div class="class-card" onclick="TeacherApp.openAttendanceForClass('${cls.classCode}', '${cls.subject}')">
          <div class="class-card-top">
            <span class="dept-badge">${cls.department}</span>
            <i data-lucide="arrow-right" class="class-arrow-icon" style="width:16px;height:16px;"></i>
          </div>

          <div class="class-card-middle">
            <div class="class-name-large">${cls.classCode}</div>
            <div class="class-subject-name">${cls.subject}</div>
          </div>

          <div class="class-card-bottom">
            <div class="class-students-count">
              <i data-lucide="users" style="width:14px;height:14px;"></i>
              ${cls.studentsCount} Students
            </div>
            <span class="badge ${cls.attendanceStatus === 'Completed' ? 'badge-completed' : 'badge-pending'}">
              <i data-lucide="${cls.attendanceStatus === 'Completed' ? 'check-circle-2' : 'clock'}" style="width:12px;height:12px;"></i>
              ${cls.attendanceStatus}
            </span>
          </div>
        </div>
      `).join('');
    }

    // 5. Recent Activity List
    const activityContainer = document.getElementById("recent-activity-list");
    if (activityContainer) {
      activityContainer.innerHTML = TeacherERPData.recentActivities.map(act => `
        <div class="activity-item">
          <div class="activity-icon-box ${act.iconStyle}">
            <i data-lucide="${act.icon}" style="width:18px;height:18px;"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title-row">
              <span class="activity-title">${act.title}</span>
              <span class="activity-time">${act.time}</span>
            </div>
            <span class="activity-desc">${act.description}</span>
          </div>
        </div>
      `).join('');
    }

    this.initLucideIcons();
  },

  openAttendanceModule() {
    this.switchView('attendance');
    AttendanceWorkflow.goToStep(1);
  },

  openAttendanceForClass(classCode, subject) {
    this.switchView('attendance');
    AttendanceState.setClass(classCode);
    if (subject) {
      const subs = TeacherERPData.subjects[classCode] || [];
      const match = subs.find(s => s.name.toLowerCase().includes(subject.toLowerCase()));
      if (match) AttendanceState.setSubject(match.code);
    }
    AttendanceWorkflow.goToStep(3);
  },

  // ----------------------------------------------------
  // NOTIFICATIONS LIST
  // ----------------------------------------------------
  renderNotificationsList() {
    const container = document.getElementById("notification-items-list");
    if (!container) return;

    container.innerHTML = TeacherERPData.notifications.map(notif => `
      <div class="notification-item ${notif.unread ? 'unread' : ''}" onclick="TeacherApp.handleNotificationClick('${notif.id}')">
        <div class="notif-icon-box" style="background:#EBF3FC; color:var(--primary-blue);">
          <i data-lucide="${notif.icon}" style="width:16px;height:16px;"></i>
        </div>
        <div class="notif-content">
          <div class="notif-title">${notif.title}</div>
          <div class="notif-desc">${notif.description}</div>
          <div class="notif-time">${notif.time}</div>
        </div>
      </div>
    `).join('');
  },

  handleNotificationClick(id) {
    const notif = TeacherERPData.notifications.find(n => n.id === id);
    if (notif) {
      notif.unread = false;
      this.renderNotificationsList();
      this.showToast(`Viewing: ${notif.title}`);
    }
  },

  // ----------------------------------------------------
  // TIMETABLE MODULE VIEW
  // ----------------------------------------------------
  selectedTimetableDate: null,

  handleTimetableDateChange(dateVal) {
    if (!dateVal) return;
    this.selectedTimetableDate = dateVal;
    this.renderTimetableView();
  },

  resetTimetableToToday() {
    this.selectedTimetableDate = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];
    this.renderTimetableView();
  },

  renderTimetableView() {
    const container = document.getElementById("timetable-content");
    if (!container) return;

    const timeHeaders = ["Day", "09:00 - 10:30 AM", "11:00 - 12:30 PM", "01:30 - 03:00 PM", "03:30 - 05:00 PM"];
    const term = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getCurrentAcademicTerm()
      : { academicYear: "2026-2027", semesterType: "Odd" };

    const selectedDate = this.selectedTimetableDate || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0]);
    const currentDayName = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getDayName(selectedDate) : "Monday";
    const readableDate = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.formatReadableDate(selectedDate) : selectedDate;
    const todayISO = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0];
    const isToday = (selectedDate === todayISO);

    const isWeekend = (currentDayName === "Saturday" || currentDayName === "Sunday");

    container.innerHTML = `
      <div class="timetable-grid-card">
        <div class="timetable-header-toolbar">
          <div>
            <h3 style="font-size:16px; color:var(--dark-navy);">Weekly Lecture & Lab Schedule</h3>
            <p style="font-size:12.5px; color:var(--text-muted);" id="timetable-academic-term">Academic Term: ${term.academicYear} • ${term.semesterType} Semester</p>
          </div>

          <!-- Date Picker & Filter Controls -->
          <div class="timetable-date-filter-bar">
            <div class="timetable-picker-group">
              <i data-lucide="calendar" style="width:15px;height:15px; color:var(--primary-blue);"></i>
              <span style="font-size:12.5px; font-weight:600; color:var(--dark-navy);">View Date:</span>
              <input type="date" 
                     id="timetable-date-picker-input" 
                     class="timetable-date-input" 
                     value="${selectedDate}" 
                     onchange="TeacherApp.handleTimetableDateChange(this.value)">
            </div>
            <button class="btn-timetable-today ${isToday ? 'active' : ''}" 
                    type="button"
                    onclick="TeacherApp.resetTimetableToToday()" 
                    title="Reset to today's schedule">
              <i data-lucide="calendar-check" style="width:13px;height:13px;"></i>
              Today
            </button>
            <button class="quick-action-btn" type="button" onclick="window.print()">
              <i data-lucide="printer" style="width:14px;height:14px;"></i> Print Schedule
            </button>
          </div>
        </div>

        <!-- Highlighting Banner -->
        <div class="timetable-schedule-status-banner">
          <div class="status-left">
            <span class="status-pulse-indicator"></span>
            <span>Schedule for: <strong>${currentDayName}, ${readableDate}</strong></span>
            <span class="badge ${isToday ? 'badge-completed' : 'badge-cyan'}">${isToday ? "Today's Schedule" : "Selected Date"}</span>
          </div>
          <div class="status-hint">
            ${isWeekend ? '<em>Note: Weekend - regular weekday schedule displayed below</em>' : `Highlighting <strong>${currentDayName}</strong> in the schedule`}
          </div>
        </div>

        <table class="timetable-table">
          <thead>
            <tr>
              ${timeHeaders.map(th => `<th>${th}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${TeacherERPData.timetable.map(row => {
              const isHighlightRow = (row.day.toLowerCase() === currentDayName.toLowerCase());
              return `
              <tr class="${isHighlightRow ? 'active-day-row' : ''}">
                <td class="timetable-day-cell ${isHighlightRow ? 'active-day-cell' : ''}">
                  <div class="day-cell-content">
                    <span class="day-name">${row.day}</span>
                    ${isHighlightRow ? `<span class="active-day-pill">${isToday ? 'Today' : 'Active'}</span>` : ''}
                  </div>
                </td>
                ${row.slots.map(slot => {
                  if (slot === "Free Slot") {
                    return `<td style="color:var(--text-light); font-size:12px; font-style:italic;">Off / Prep</td>`;
                  }
                  const isLab = slot.toLowerCase().includes("lab");
                  return `
                    <td>
                      <div class="timetable-slot ${isLab ? 'lab' : ''} ${isHighlightRow ? 'active-slot' : ''}">
                        <div class="slot-sub">${slot.split('(')[0]}</div>
                        <div class="slot-room">${slot.split('(')[1] ? '(' + slot.split('(')[1] : ''}</div>
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
    `;

    this.initLucideIcons();
  },

  // ----------------------------------------------------
  // STUDENTS ROSTER VIEW
  // ----------------------------------------------------
  renderStudentsView() {
    const container = document.getElementById("students-content");
    if (!container) return;

    const allStudents = TeacherERPData.students["2R1"];

    container.innerHTML = `
      <div class="card" style="padding:20px;">
        <div class="students-roster-controls">
          <div style="display:flex; gap:12px; align-items:center;">
            <input type="text" id="roster-filter-input" class="roster-search-input" 
                   placeholder="Filter student name or roll..." oninput="TeacherApp.filterStudentRoster(this.value)">
            <select style="padding:8px 12px; border:1px solid var(--border-light); border-radius:var(--radius-sm);" 
                    onchange="TeacherApp.changeRosterClass(this.value)">
              <option value="2R1">CSE 2R1 (Data Structures)</option>
              <option value="2R2">CSE 2R2 (Java Programming)</option>
              <option value="3R">CSE 3R (Database Management)</option>
            </select>
          </div>
          <button class="quick-action-btn primary" onclick="TeacherApp.openAttendanceModule()">
            <i data-lucide="check-square" style="width:14px;height:14px;"></i> Take Attendance for Batch
          </button>
        </div>

        <table class="roster-table" id="students-roster-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Full Name</th>
              <th>Institute Email</th>
              <th>Attendance Rate</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="roster-table-body">
            ${this.generateRosterRows(allStudents)}
          </tbody>
        </table>
      </div>
    `;
  },

  generateRosterRows(students) {
    return students.map(st => `
      <tr>
        <td style="font-weight:700; color:var(--primary-blue);">ROLL ${st.rollNo}</td>
        <td style="font-weight:600; color:var(--dark-navy);">${st.name}</td>
        <td style="color:var(--text-muted);">${st.email}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:70px; height:6px; background:#E2E8F0; border-radius:10px; overflow:hidden;">
              <div style="width:${st.attendance}%; height:100%; background:${st.attendance >= 85 ? 'var(--primary-blue)' : 'var(--warning)'};"></div>
            </div>
            <span style="font-weight:700; font-size:12px;">${st.attendance}%</span>
          </div>
        </td>
        <td>
          <span class="badge ${st.attendance >= 85 ? 'badge-completed' : 'badge-pending'}">
            ${st.attendance >= 85 ? 'Eligible' : 'Low Attendance'}
          </span>
        </td>
        <td>
          <button style="font-size:12px; color:var(--primary-blue); font-weight:600;" 
                  onclick="TeacherApp.showToast('Student academic record opened for ${st.name}')">
            View Details
          </button>
        </td>
      </tr>
    `).join('');
  },

  filterStudentRoster(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll("#roster-table-body tr");
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  },

  changeRosterClass(classCode) {
    const list = TeacherERPData.students[classCode] || TeacherERPData.students["2R1"];
    const tbody = document.getElementById("roster-table-body");
    if (tbody) {
      tbody.innerHTML = this.generateRosterRows(list);
    }
  },

  // ----------------------------------------------------
  // SYLLABUS VIEW
  // ----------------------------------------------------
  renderSyllabusView() {
    const container = document.getElementById("syllabus-content");
    if (!container) return;

    container.innerHTML = `
      <div class="syllabus-units-grid">
        ${TeacherERPData.syllabus.map(syl => `
          <div class="syllabus-unit-card">
            <div class="syllabus-header-row">
              <div>
                <h3 class="unit-title">${syl.subject}</h3>
                <span style="font-size:12px; color:var(--text-muted); font-weight:500;">Class: ${syl.classCode} • Course Completion</span>
              </div>
              <div class="unit-progress-badge">Overall: ${syl.progress}%</div>
            </div>

            <div class="progress-track" style="height:8px; margin-bottom:18px;">
              <div class="progress-fill completed" style="width: ${syl.progress}%;"></div>
            </div>

            <div class="topics-checklist">
              ${syl.units.map(unit => `
                <div class="topic-item">
                  <i data-lucide="${unit.percent === 100 ? 'check-circle' : (unit.percent > 0 ? 'clock' : 'circle')}" 
                     style="color:${unit.percent === 100 ? 'var(--success)' : (unit.percent > 0 ? 'var(--primary-blue)' : 'var(--text-light)')}; width:16px; height:16px;"></i>
                  <span>${unit.name} <strong>(${unit.percent}%)</strong></span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ----------------------------------------------------
  // RESULTS VIEW
  // ----------------------------------------------------
  renderResultsView() {
    const container = document.getElementById("results-content");
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h3 style="font-size:16px; color:var(--dark-navy);">Internal Assessment 1 Marks Entry</h3>
            <p style="font-size:12.5px; color:var(--text-muted);">CSE 2R1 • Data Structures • Max Marks: 30</p>
          </div>
          <button class="quick-action-btn primary" onclick="TeacherApp.showToast('Results spreadsheet successfully synchronized!', 'success')">
            <i data-lucide="upload" style="width:14px;height:14px;"></i> Upload Marksheet (.xlsx)
          </button>
        </div>

        <div class="results-grid-summary">
          <div class="result-stat-box">
            <div style="font-size:24px; font-weight:800; color:var(--primary-blue);">26.4</div>
            <div style="font-size:12px; color:var(--text-muted);">Class Average Score</div>
          </div>
          <div class="result-stat-box">
            <div style="font-size:24px; font-weight:800; color:var(--success);">98.2%</div>
            <div style="font-size:12px; color:var(--text-muted);">Passing Rate</div>
          </div>
          <div class="result-stat-box">
            <div style="font-size:24px; font-weight:800; color:var(--dark-navy);">30 / 30</div>
            <div style="font-size:12px; color:var(--text-muted);">Highest Score</div>
          </div>
        </div>
      </div>
    `;
  },

  // ----------------------------------------------------
  // GLOBAL SEARCH FILTER
  // ----------------------------------------------------
  handleGlobalSearch(query) {
    if (!query) return;
    // Show toast with match preview
    if (this.currentView === 'dashboard') {
      const cards = document.querySelectorAll(".class-card");
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.opacity = text.includes(query) ? "1" : "0.3";
      });
    }
  },

  // ----------------------------------------------------
  // TOAST FEEDBACK SYSTEM
  // ----------------------------------------------------
  showToast(message, type = "info") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.style.cssText = `
      background-color: var(--dark-navy);
      color: var(--white);
      padding: 12px 20px;
      border-radius: var(--radius-md);
      box-shadow: 0 6px 18px rgba(11, 31, 58, 0.25);
      border-left: 4px solid ${type === 'success' ? 'var(--success)' : 'var(--accent-cyan)'};
      font-size: 13.5px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideUp 0.3s ease;
    `;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

if (typeof window !== 'undefined') {
  window.TeacherApp = TeacherApp;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TeacherApp };
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  TeacherApp.init();
});

