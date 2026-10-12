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
    this.checkBackendConnection();
    this.initHashRouting();
  },

  async checkBackendConnection(isManualCheck = false) {
    const pill = document.getElementById('backend-status-pill');
    const dot = document.getElementById('backend-status-dot');
    const text = document.getElementById('backend-status-text');

    const setStatus = (isOnline, latency) => {
      if (pill) {
        pill.style.background = isOnline ? '#ECFDF5' : '#FEF2F2';
        pill.style.borderColor = isOnline ? '#10B981' : '#EF4444';
        pill.style.color = isOnline ? '#047857' : '#B91C1C';
      }
      if (dot) {
        dot.style.background = isOnline ? '#10B981' : '#EF4444';
        dot.style.boxShadow = isOnline ? '0 0 8px #10B981' : '0 0 8px #EF4444';
      }
      if (text) {
        text.textContent = isOnline 
          ? `🟢 Backend: Connected${latency ? ` (${latency}ms)` : ''}`
          : '🔴 Backend: Offline';
      }
    };

    if (typeof window.TeacherAPI !== 'undefined') {
      try {
        const start = performance.now();
        const health = await window.TeacherAPI.checkHealth();
        const latency = Math.round(performance.now() - start);

        if (health && health.status === 'OK') {
          const loginData = await window.TeacherAPI.login();
          setStatus(true, latency);

          const teacherName = (loginData && loginData.user && loginData.user.name) || (window.ERP_AUTH ? window.ERP_AUTH.getUserName() : '') || 'Faculty';
          if (isManualCheck) {
            this.showToast(`✅ Live Backend Connected (${latency}ms)! Authenticated as ${teacherName}`, 'success');
          } else {
            this.showToast(`🟢 Connected to Backend API (${teacherName})`, 'success');
          }
          console.log('✅ Logged in successfully as:', teacherName);
          try {
            const data = await window.TeacherAPI.getDashboardSummary();
            console.log('📊 Live Dashboard KPI metrics:', data.metrics);
            console.log('📅 Today schedule slots:', data.todaySchedule);

            // Seamlessly bind live Supabase data to UI cards
            if (data && data.metrics && typeof TeacherERPData !== 'undefined') {
              TeacherERPData.stats.totalClasses = String(data.metrics.totalClasses || 0).padStart(2, '0');
              TeacherERPData.stats.totalStudents = String(data.metrics.totalStudents || 0);
              if (data.metrics.averageAttendance !== undefined) {
                TeacherERPData.stats.attendancePercent = parseInt(data.metrics.averageAttendance, 10) || 0;
              }
              if (data.faculty) {
                TeacherERPData.faculty.name = data.faculty.name;
                TeacherERPData.faculty.employeeId = data.faculty.employeeId;
                TeacherERPData.faculty.title = data.faculty.title;
              }
              this.renderHeaderProfile();
              this.renderDashboardData();
            }
          } catch (kpiErr) {
            console.warn('Dashboard summary:', kpiErr.message);
          }
        } else {
          setStatus(false);
          if (isManualCheck) this.showToast('❌ Backend server offline', 'error');
        }
      } catch (err) {
        setStatus(false);
        console.warn('Backend connection:', err.message);
        if (isManualCheck) this.showToast(`❌ Connection error: ${err.message}`, 'error');
      }
    } else {
      setStatus(false);
    }
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
      const stored = localStorage.getItem("ssgmce_active_teacher") || localStorage.getItem("ssgmce_user") || localStorage.getItem("ssgmce_logged_in_teacher") || sessionStorage.getItem("ssgmce_active_teacher") || sessionStorage.getItem("ssgmce_user");
      if (stored) {
        const u = typeof stored === 'string' ? JSON.parse(stored) : stored;
        const empCode = u.emp_code || u.employeeId;
        const facObj = (typeof TeacherERPData !== 'undefined' && TeacherERPData.facultyList)
          ? TeacherERPData.facultyList.find(f => f.empCode === empCode)
          : null;
        return {
          name: u.full_name || u.name || (facObj && facObj.name) || "Dr. J. M. Patil",
          department: "Computer Science & Engineering",
          departmentCode: "CSE",
          title: u.designation || (facObj && facObj.title) || "Professor & Head",
          employeeId: empCode || (facObj && facObj.empCode) || "EMP-CSE-1001",
          avatarInitials: (u.name || (facObj && facObj.name) || "JP").split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
        };
      }
    } catch (e) {
      console.warn("Could not read teacher session from storage", e);
    }
    const activeCode = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
      ? TeacherERPData.getActiveTeacherEmpCode()
      : 'EMP-CSE-1001';
    const facObj = (typeof TeacherERPData !== 'undefined' && TeacherERPData.facultyList)
      ? TeacherERPData.facultyList.find(f => f.empCode === activeCode)
      : null;
    return facObj ? {
      name: facObj.name,
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
      title: facObj.title,
      employeeId: facObj.empCode,
      avatarInitials: facObj.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
    } : {
      name: "Dr. J. M. Patil",
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
      title: "Professor & Head",
      employeeId: "EMP-CSE-1001",
      avatarInitials: "JP"
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
      heroNameElem.textContent = teacher.name || (window.ERP_AUTH ? window.ERP_AUTH.getUserName() : '') || "Faculty";
    }

    const heroDesigElem = document.getElementById("hero-teacher-designation");
    if (heroDesigElem) {
      heroDesigElem.textContent = teacher.title || "Department Faculty";
    }

    const heroIdElem = document.getElementById("hero-teacher-id");
    if (heroIdElem) {
      heroIdElem.textContent = teacher.employeeId ? `Faculty ID: ${teacher.employeeId}` : "Faculty ID: --";
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
  switchView(viewName, subView) {
    this.currentView = viewName;

    // Update navigation active state
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      item.classList.remove("active");
      if (item.dataset.view === viewName || (viewName && viewName.startsWith('attendance') && item.dataset.view === 'attendance')) {
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
        setHeaderBadge("Teacher Attendance Hub");
        this.initIntegratedAttendance(subView);
        break;
      case 'attendance-mark':
        document.getElementById("attendance-module").style.display = "block";
        setHeaderBadge("Teacher Attendance Hub");
        this.switchAttendanceSubView('marking');
        break;
      case 'attendance-roster':
        document.getElementById("attendance-module").style.display = "block";
        setHeaderBadge("Teacher Attendance Hub");
        this.switchAttendanceSubView('roster');
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
        window.location.href = "teacher_timetable.html";
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

  // ----------------------------------------------------
  // INTEGRATED ATTENDANCE SUB-MODULE CONTROLLER
  // ----------------------------------------------------
  currentAttendanceSubView: 'marking',

  openAttendanceModule(subView = 'marking') {
    this.switchView('attendance', subView);
  },

  openAttendanceForClass(classCode, subject) {
    this.switchView('attendance', 'marking');
    const frame = document.getElementById('attendance-integrated-frame');
    if (frame) {
      const q = `teacher-attendance.html?embedded=true&class=${encodeURIComponent(classCode)}&subject=${encodeURIComponent(subject || '')}`;
      frame.src = q;
    }
  },

  initIntegratedAttendance(subView) {
    let target = subView;
    if (!target) {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.includes('roster')) {
        target = 'roster';
      } else {
        try {
          target = localStorage.getItem('ssgmce_teacher_attendance_subview') || 'marking';
        } catch (_) {
          target = 'marking';
        }
      }
    }
    this.switchAttendanceSubView(target, false);
  },

  switchAttendanceSubView(subView, updateHash = true) {
    const mode = (subView === 'roster') ? 'roster' : 'marking';
    this.currentAttendanceSubView = mode;
    try {
      localStorage.setItem('ssgmce_teacher_attendance_subview', mode);
    } catch (_) {}

    const markTab = document.getElementById('tab-attendance-mark');
    const rosterTab = document.getElementById('tab-attendance-roster');
    const descElem = document.getElementById('attendance-active-subview-desc');
    const frame = document.getElementById('attendance-integrated-frame');
    const loaderText = document.getElementById('attendance-loader-text');

    if (markTab && rosterTab) {
      if (mode === 'marking') {
        markTab.classList.add('active');
        markTab.style.background = '#0B5CAD';
        markTab.style.color = '#FFFFFF';
        markTab.style.boxShadow = '0 2px 6px rgba(11, 92, 173, 0.3)';

        rosterTab.classList.remove('active');
        rosterTab.style.background = 'transparent';
        rosterTab.style.color = '#475569';
        rosterTab.style.boxShadow = 'none';

        if (descElem) descElem.textContent = "Mark lecture/lab attendance or record RFID swipes";
        if (loaderText) loaderText.textContent = "Loading Mark Attendance...";
      } else {
        rosterTab.classList.add('active');
        rosterTab.style.background = '#0B5CAD';
        rosterTab.style.color = '#FFFFFF';
        rosterTab.style.boxShadow = '0 2px 6px rgba(11, 92, 173, 0.3)';

        markTab.classList.remove('active');
        markTab.style.background = 'transparent';
        markTab.style.color = '#475569';
        markTab.style.boxShadow = 'none';

        if (descElem) descElem.textContent = "Review detailed class-wise attendance roster, percentages, and summaries";
        if (loaderText) loaderText.textContent = "Loading Attendance Roster...";
      }
    }

    const targetSrc = (mode === 'roster') 
      ? 'teacher-attendance-roster.html?embedded=true&class=3R' 
      : 'teacher-attendance.html?embedded=true&class=3R';


    if (frame) {
      const currentSrc = frame.getAttribute('src') || '';
      if (!currentSrc.includes(targetSrc)) {
        this.showAttendanceLoader();
        frame.src = targetSrc;
      }
    }

    if (updateHash) {
      const hashVal = mode === 'roster' ? '#attendance/roster' : '#attendance';
      if (window.location.hash !== hashVal) {
        history.pushState(null, null, hashVal);
      }
    }
  },

  showAttendanceLoader() {
    const loader = document.getElementById('attendance-frame-loader');
    const errorEl = document.getElementById('attendance-frame-error');
    if (loader) loader.style.display = 'flex';
    if (errorEl) errorEl.style.display = 'none';
  },

  onAttendanceFrameLoaded() {
    const loader = document.getElementById('attendance-frame-loader');
    const errorEl = document.getElementById('attendance-frame-error');
    if (loader) loader.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    try {
      const frame = document.getElementById('attendance-integrated-frame');
      if (frame && frame.contentWindow) {
        if (window.ERP_AUTH && window.ERP_AUTH.isAuthenticated()) {
          const user = window.ERP_AUTH.getCurrentUser();
          if (frame.contentWindow.ERP_AUTH && typeof frame.contentWindow.ERP_AUTH.setSession === 'function') {
            frame.contentWindow.ERP_AUTH.setSession(user);
          }
          if (frame.contentWindow.ERP_DATA && !frame.contentWindow.ERP_DATA.teacher) {
            frame.contentWindow.ERP_DATA.teacher = {
              name: user.fullName || user.name,
              id: user.empCode || user.emp_code || user.id,
              department: user.department || 'CSE'
            };
          }
        }
        if (frame.contentWindow.document) {
          const doc = frame.contentWindow.document;
          const h = Math.max(doc.body.scrollHeight || 0, doc.documentElement.scrollHeight || 0, 880);
          frame.style.height = (h + 30) + 'px';
        }
      }
    } catch (e) {
      console.info('[TeacherApp] Frame height auto-fit restricted by origin, standard layout preserved.');
    }
  },

  onAttendanceFrameError(status = 'Network Error') {
    const loader = document.getElementById('attendance-frame-loader');
    const errorEl = document.getElementById('attendance-frame-error');
    if (loader) loader.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
    console.error(`[Attendance] Fetch failed: ${status}. Module could not be loaded into dashboard frame.`);
  },

  reloadAttendanceFrame() {
    const frame = document.getElementById('attendance-integrated-frame');
    if (frame) {
      this.showAttendanceLoader();
      frame.src = frame.src;
      this.showToast('Refreshing attendance module...');
    }
  },

  openAttendanceStandalone() {
    const url = (this.currentAttendanceSubView === 'roster')
      ? 'teacher-attendance-roster.html?class=3R'
      : 'teacher-attendance.html?class=3R';
    window.open(url, '_blank');
  },


  openAttendanceReports() {
    if (this.currentView !== 'attendance') {
      this.switchView('attendance', 'marking');
    } else if (this.currentAttendanceSubView !== 'marking') {
      this.switchAttendanceSubView('marking');
    }
    const frame = document.getElementById('attendance-integrated-frame');
    if (frame) {
      const openModal = () => {
        try {
          const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
          if (doc) {
            const m = doc.getElementById('modalPdfCenter');
            if (m) {
              m.classList.remove('hidden');
              return true;
            }
          }
        } catch (err) {
          console.warn('[Attendance] Cannot access frame document:', err);
        }
        return false;
      };

      if (!openModal()) {
        frame.addEventListener('load', () => {
          setTimeout(openModal, 150);
        }, { once: true });
      }
    }
  },

  initHashRouting() {
    const handleHash = () => {
      const rawHash = (window.location.hash || '').replace('#', '').trim().toLowerCase();
      if (!rawHash) return;
      if (rawHash.startsWith('attendance')) {
        const sub = rawHash.includes('roster') ? 'roster' : 'marking';
        this.switchView('attendance', sub);
      } else {
        const validViews = ['dashboard', 'profile', 'academics', 'timetable', 'classes', 'students', 'syllabus', 'results', 'examination', 'fees', 'documents', 'hostel', 'library', 'placement', 'grievance', 'settings'];
        if (validViews.includes(rawHash)) {
          this.switchView(rawHash);
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);

    if (window.location.hash) {
      handleHash();
    }
  },

  // ----------------------------------------------------
  // NOTIFICATIONS LIST & CLASS ANNOUNCEMENT DISPATCHER
  // ----------------------------------------------------
  async renderNotificationsList() {
    const listEl = document.getElementById("notifications-full-list");
    const container = document.getElementById("notification-items-list");
    const empCode = (this.currentTeacher && this.currentTeacher.empCode) ? this.currentTeacher.empCode : 'EMP-CSE-1001';

    try {
      const res = await fetch(`http://localhost:8000/api/v1/notifications/list?user_id=${encodeURIComponent(empCode)}&limit=30`).then(r => r.json()).catch(() => null);
      const notifs = (res && res.data && res.data.length > 0) ? res.data : null;

      // Update badge
      const countRes = await fetch(`http://localhost:8000/api/v1/notifications/unread-count?user_id=${encodeURIComponent(empCode)}`).then(r => r.json()).catch(() => null);
      const unreadCount = (countRes && countRes.data && countRes.data.unread_count !== undefined) ? countRes.data.unread_count : 0;

      document.querySelectorAll('.notif-badge').forEach(b => {
        b.textContent = unreadCount;
        b.style.display = unreadCount > 0 ? '' : 'none';
      });

      if (listEl) {
        if (!notifs || notifs.length === 0) {
          listEl.innerHTML = `<div style="text-align:center; padding:30px; color:#64748B;">No notices or circulars right now. All caught up!</div>`;
        } else {
          listEl.innerHTML = notifs.map(n => {
            const isUnread = !n.is_read;
            const p = (n.priority || 'normal').toUpperCase();
            const color = p === 'URGENT' ? '#E11D48' : (p === 'HIGH' ? '#D97706' : '#005A9C');
            return `
              <div class="activity-item" style="padding:14px; border-bottom:1px solid #F1F5F9; background:${isUnread ? 'rgba(0,166,214,0.03)' : '#fff'};">
                <div class="activity-icon-box" style="background:#EBF3FC; color:${color}; font-weight:800; font-size:12px; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                  ${p === 'URGENT' ? '!' : '🔔'}
                </div>
                <div class="activity-content" style="flex:1;">
                  <div class="activity-title-row" style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="activity-title" style="font-weight:700; color:#1E293B;">${n.title}</span>
                      <span class="badge" style="background:${p === 'URGENT' ? '#FFE4E6' : '#FEF3C7'}; color:${p === 'URGENT' ? '#E11D48' : '#D97706'}; font-size:10px; padding:1px 6px; border-radius:4px;">${p}</span>
                      ${isUnread ? '<span style="width:6px; height:6px; border-radius:50%; background:#00A6D6;"></span>' : ''}
                    </div>
                    <span class="activity-time" style="font-size:12px; color:#94A3B8;">${new Date(n.received_at || n.sent_at || Date.now()).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
                  <span class="activity-desc" style="font-size:13px; color:#475569; display:block; margin-top:4px;">${n.message || ''}</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      if (container && notifs) {
        container.innerHTML = notifs.slice(0, 5).map(notif => `
          <div class="notification-item ${!notif.is_read ? 'unread' : ''}">
            <div class="notif-icon-box" style="background:#EBF3FC; color:var(--primary-blue);">
              <i data-lucide="bell" style="width:16px;height:16px;"></i>
            </div>
            <div class="notif-content">
              <div class="notif-title" style="font-weight:600;">${notif.title}</div>
              <div class="notif-desc">${notif.message || ''}</div>
              <div class="notif-time">${new Date(notif.received_at || Date.now()).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.warn("Error fetching teacher notifications:", e);
    }
  },

  async markAllTeacherNotificationsRead() {
    const empCode = (this.currentTeacher && this.currentTeacher.empCode) ? this.currentTeacher.empCode : 'EMP-CSE-1001';
    try {
      await fetch(`http://localhost:8000/api/v1/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: empCode })
      });
      this.showToast("All faculty notifications marked as read!");
      this.renderNotificationsList();
    } catch (e) {
      this.showToast("Failed to mark notifications read");
    }
  },

  async dispatchClassAnnouncement() {
    const classVal = document.getElementById("teacherNotifClass")?.value || '3R';
    const priorityVal = document.getElementById("teacherNotifPriority")?.value || 'normal';
    const titleVal = document.getElementById("teacherNotifTitle")?.value || '';
    const msgVal = document.getElementById("teacherNotifMsg")?.value || '';
    const empCode = (this.currentTeacher && this.currentTeacher.empCode) ? this.currentTeacher.empCode : 'EMP-CSE-1001';

    if (!titleVal || !msgVal) {
      this.showToast("Please provide both a headline and detailed message.", "error");
      return;
    }

    try {
      const payload = {
        notification_type: "announcement",
        title: titleVal,
        message: msgVal,
        priority: priorityVal,
        target_type: classVal === 'student' ? 'role' : 'class',
        target_id: classVal,
        sender_id: empCode,
        action_url: "/student/announcements"
      };

      const res = await fetch("http://localhost:8000/api/v1/notifications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res && res.code === 200) {
        this.showToast(`Notice successfully dispatched to ${classVal}!`, "success");
        document.getElementById("teacherNotifTitle").value = "";
        document.getElementById("teacherNotifMsg").value = "";
        document.getElementById("teacherCreateNotifCard").style.display = "none";
        this.renderNotificationsList();
      } else {
        this.showToast("Failed to dispatch notice", "error");
      }
    } catch (err) {
      console.error("Error creating notification:", err);
      this.showToast("Network error creating announcement", "error");
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
  // STUDENTS ROSTER VIEW (CONNECTED TO SUPABASE DATABASE)
  // ----------------------------------------------------
  liveStudents: [],
  selectedRosterClass: '3R',

  async renderStudentsView() {
    const container = document.getElementById("students-content");
    if (!container) return;

    // Show initial loading skeleton
    container.innerHTML = `
      <div class="card" style="padding:20px;">
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
          <div style="font-size:15px; font-weight:600; margin-bottom:8px;">Fetching Live Student Records from Supabase...</div>
          <div style="font-size:12px;">Querying assigned cohorts (3R &amp; 2R1) with attendance rates &amp; academic standing</div>
        </div>
      </div>
    `;

    try {
      const activeCode = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';
      const res = await fetch(`/api/v1/management/teacher/students?emp_code=${activeCode}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        this.liveStudents = data.data;
      } else {
        this.liveStudents = [];
      }
    } catch (e) {
      console.warn("Could not fetch live students, falling back to local dataset:", e);
      this.liveStudents = [];
    }

    // Default to 3R if students exist
    const has3R = this.liveStudents.some(s => s.class_name === '3R');
    const defaultClass = has3R ? '3R' : (this.liveStudents[0]?.class_name || '3R');
    this.selectedRosterClass = defaultClass;

    const classFiltered = this.liveStudents.filter(s => s.class_name === this.selectedRosterClass);
    const displayList = classFiltered.length > 0 ? classFiltered : (this.liveStudents.length > 0 ? this.liveStudents : (TeacherERPData.students["2R1"] || []));

    container.innerHTML = `
      <div class="card" style="padding:20px;">
        <div class="students-roster-controls" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
          <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
            <input type="text" id="roster-filter-input" class="roster-search-input" 
                   placeholder="Filter student name, roll or code..." oninput="TeacherApp.filterStudentRoster(this.value)">
            <select id="roster-class-selector" style="padding:8px 14px; border:1px solid var(--border-light); border-radius:var(--radius-sm); font-weight:600; color:var(--dark-navy);" 
                    onchange="TeacherApp.changeRosterClass(this.value)">
              <option value="3R" ${this.selectedRosterClass === '3R' ? 'selected' : ''}>Class 3R (Third Year CSE — 74 Students)</option>
              <option value="2R1" ${this.selectedRosterClass === '2R1' ? 'selected' : ''}>Class 2R1 (Second Year CSE — 83 Students)</option>
            </select>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="quick-action-btn primary" onclick="TeacherApp.openBulkMarksModal()" style="background:#0B5CAD; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">
              <i data-lucide="edit-3" style="width:14px;height:14px;"></i> Bulk Marks Entry
            </button>
            <button class="quick-action-btn" onclick="TeacherApp.openAttendanceModule()" style="background:#F1F5F9; border:1px solid #CBD5E1; color:#334155; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">
              <i data-lucide="check-square" style="width:14px;height:14px;"></i> Mark Attendance
            </button>
          </div>
        </div>

        <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
          Showing <strong>${displayList.length} students</strong> enrolled in Class <strong>${this.selectedRosterClass}</strong> • Data live synchronized from PostgreSQL
        </div>

        <table class="roster-table" id="students-roster-table" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#F8FAFC; text-align:left; border-bottom:2px solid #E2E8F0;">
              <th style="padding:10px 12px;">Roll No</th>
              <th style="padding:10px 12px;">Student Full Name</th>
              <th style="padding:10px 12px;">Enrollment Code</th>
              <th style="padding:10px 12px;">Class &amp; Div</th>
              <th style="padding:10px 12px;">Attendance Rate</th>
              <th style="padding:10px 12px;">Academic Alerts</th>
              <th style="padding:10px 12px;">Action</th>
            </tr>
          </thead>
          <tbody id="roster-table-body">
            ${this.generateRosterRows(displayList)}
          </tbody>
        </table>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  generateRosterRows(students) {
    if (!students || students.length === 0) {
      return '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">No student records found.</td></tr>';
    }

    return students.map(st => {
      const roll = st.roll_no || st.rollNo || '-';
      const name = st.full_name || st.name || 'Student';
      const code = st.student_code || st.email || '-';
      const cls = st.class_name ? `${st.class_name} (${st.division || 'A'})` : '3R (A)';
      const att = (st.attendance_percentage !== undefined) ? st.attendance_percentage : (st.attendance || 85.0);
      const alerts = st.academic_alerts || (att < 75 ? 'Low Attendance' : 'Clear');
      const isEligible = att >= 75;

      return `
        <tr style="border-bottom:1px solid #E2E8F0;">
          <td style="font-weight:700; color:var(--primary-blue); padding:10px 12px;">${roll}</td>
          <td style="font-weight:600; color:var(--dark-navy); padding:10px 12px;">${name}</td>
          <td style="color:var(--text-muted); font-size:12px; padding:10px 12px;"><code>${code}</code></td>
          <td style="padding:10px 12px;"><span class="badge badge-info" style="font-size:11px;">${cls}</span></td>
          <td style="padding:10px 12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:65px; height:6px; background:#E2E8F0; border-radius:10px; overflow:hidden;">
                <div style="width:${Math.min(100, att)}%; height:100%; background:${isEligible ? 'var(--primary-blue)' : '#EF4444'};"></div>
              </div>
              <span style="font-weight:700; font-size:12px;">${att}%</span>
            </div>
          </td>
          <td style="padding:10px 12px;">
            <span class="badge ${alerts === 'Clear' ? 'badge-completed' : 'badge-pending'}" style="font-size:11px;">
              ${alerts}
            </span>
          </td>
          <td style="padding:10px 12px;">
            <button style="font-size:12px; color:var(--primary-blue); font-weight:600; background:transparent; border:none; cursor:pointer;" 
                    onclick="TeacherApp.showToast('Student academic record opened for ${name.replace(/'/g, "\\'")}')">
              View Profile
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  changeRosterClass(classCode) {
    this.selectedRosterClass = classCode;
    const filtered = this.liveStudents.filter(s => s.class_name === classCode);
    const tbody = document.getElementById("roster-table-body");
    if (tbody) {
      tbody.innerHTML = this.generateRosterRows(filtered.length > 0 ? filtered : (TeacherERPData.students[classCode] || []));
      if (window.lucide) window.lucide.createIcons();
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
  // RESULTS VIEW & MARKS EVALUATION CONSOLE (STEP 6)
  // ----------------------------------------------------
  getAuthHeaders() {
    const token = localStorage.getItem('ssgmce_teacher_token') ||
                  localStorage.getItem('ssgmce_access_token') ||
                  localStorage.getItem('ssgmce_token') ||
                  sessionStorage.getItem('ssgmce_access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const stored = JSON.parse(localStorage.getItem('ssgmce_user') || localStorage.getItem('ssgmce_active_teacher') || '{}');
      if (stored && stored.id) headers['X-Teacher-Id'] = stored.id;
      if (stored && stored.emp_code) headers['X-Emp-Code'] = stored.emp_code;
    } catch (e) {}
    return headers;
  },

  renderResultsView() {
    const container = document.getElementById("results-content");
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:20px;">
          <div>
            <h3 style="font-size:18px; color:var(--dark-navy); font-weight:700; margin:0 0 4px 0;">Autonomous Marks Entry &amp; Academic Grading Console</h3>
            <p style="font-size:12.5px; color:var(--text-muted); margin:0;">Continuous Internal Evaluation (CIE: Max 30) &amp; End-Semester Examination (ESE: Max 70)</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="quick-action-btn" onclick="TeacherApp.saveMarksRoster(true)" id="btnSaveMarksDraft" style="background:#475569; color:#fff; display:flex; align-items:center; gap:6px; font-weight:600; padding:8px 16px; border-radius:8px;">
              <i data-lucide="save" style="width:15px;height:15px;"></i> Save Draft
            </button>
            <button class="quick-action-btn primary" onclick="TeacherApp.saveMarksRoster(false)" id="btnSubmitMarks" style="background:#0b5cad; border-color:#0b5cad; color:#fff; display:flex; align-items:center; gap:6px; font-weight:600; padding:8px 16px; border-radius:8px;">
              <i data-lucide="send" style="width:15px;height:15px;"></i> Submit Marks
            </button>
            <button class="quick-action-btn" onclick="TeacherApp.lockMarksRoster()" id="btnLockMarks" style="background:#b91c1c; border-color:#b91c1c; color:#fff; display:flex; align-items:center; gap:6px; font-weight:600; padding:8px 16px; border-radius:8px;">
              <i data-lucide="lock" style="width:15px;height:15px;"></i> Lock Submission
            </button>
            <button class="quick-action-btn" onclick="TeacherApp.exportGazetteCsv()" style="background:#059669; border-color:#059669; color:#fff; display:flex; align-items:center; gap:6px; font-weight:600; padding:8px 16px; border-radius:8px;">
              <i data-lucide="download" style="width:15px;height:15px;"></i> Export Gazette
            </button>
          </div>
        </div>

        <!-- Filter & Control Toolbar -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:20px; display:flex; gap:16px; align-items:flex-end; flex-wrap:wrap;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:4px;">Class</label>
            <select id="teacherMarksClassSelect" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-weight:600; background:#fff; min-width:140px;">
              <option value="3R" selected>3R (Third Year CSE)</option>
              <option value="2R">2R (Second Year CSE)</option>
              <option value="4R">4R (Final Year CSE)</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:4px;">Subject</label>
            <select id="teacherMarksSubjectSelect" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-weight:600; background:#fff; min-width:260px;">
              <option value="CS501" selected>CS501 - Database Management Systems</option>
              <option value="CS502">CS502 - Computer Networks &amp; Protocols</option>
              <option value="CS503">CS503 - Theory of Computation</option>
              <option value="CS504">CS504 - Software Engineering</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:4px;">Semester</label>
            <select id="teacherMarksSemesterSelect" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-weight:600; background:#fff; min-width:120px;">
              <option value="5" selected>Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="TeacherApp.loadMarksRoster()" style="padding:8px 18px; border-radius:6px; font-weight:600; cursor:pointer;">
            Load Class Roster
          </button>
        </div>

        <!-- Lock Warning Notice -->
        <div id="teacherLockAlert" style="display:none; padding:14px 18px; margin-bottom:20px; background:#fef2f2; border:1px solid #fee2e2; border-radius:8px; color:#991b1b; font-size:13px; align-items:center; gap:10px;">
          <span style="font-size:18px;">🔒</span>
          <div>
            <strong>Submission Locked:</strong> This grading sheet is locked against further faculty modifications.
            <span id="teacherLockReasonText" style="margin-left:6px; font-style:italic; color:#7f1d1d;"></span>
          </div>
        </div>

        <!-- Metrics Summary Cards -->
        <div class="results-grid-summary" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
          <div class="result-stat-box" style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; text-align:center;">
            <div id="statTotalStudents" style="font-size:22px; font-weight:800; color:var(--primary-blue);">0</div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Enrolled Students</div>
          </div>
          <div class="result-stat-box" style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; text-align:center;">
            <div id="statGradedCount" style="font-size:22px; font-weight:800; color:#0284c7;">0</div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Graded Entries</div>
          </div>
          <div class="result-stat-box" style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; text-align:center;">
            <div id="statAvgMarks" style="font-size:22px; font-weight:800; color:#059669;">—</div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Class Average Marks</div>
          </div>
          <div class="result-stat-box" style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; text-align:center;">
            <div id="statLockStatus" style="font-size:18px; font-weight:800; color:#10b981; line-height:28px;">NEW</div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Lock Status</div>
          </div>
        </div>

        <!-- Grading Table -->
        <div class="table-responsive-wrapper" style="overflow-x:auto;">
          <table class="attendance-data-table" style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr style="background:#f1f5f9; text-align:left; border-bottom:2px solid #cbd5e1;">
                <th style="padding:10px 12px; width:80px;">Roll No</th>
                <th style="padding:10px 12px;">Student Name</th>
                <th style="padding:10px 12px; width:100px;">Student Code</th>
                <th style="padding:10px 12px; width:130px;">Internal (Max 30)</th>
                <th style="padding:10px 12px; width:130px;">External (Max 70)</th>
                <th style="padding:10px 12px; width:110px;">Total (100)</th>
                <th style="padding:10px 12px; width:110px;">Grade &amp; GP</th>
                <th style="padding:10px 12px; width:90px;">Status</th>
              </tr>
            </thead>
            <tbody id="teacherResultsTableBody">
              <tr>
                <td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">
                  Click "Load Class Roster" to fetch active student grading list from Supabase.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    // Automatically trigger initial load
    setTimeout(() => this.loadMarksRoster(), 50);
  },

  async loadMarksRoster() {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const subjectId = document.getElementById('teacherMarksSubjectSelect')?.value || 'CS501';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5);

    const tbody = document.getElementById('teacherResultsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">Fetching students roster and marks from Supabase...</td></tr>`;
    }

    try {
      const res = await fetch(`/api/v1/results/marks/roster?class_id=${encodeURIComponent(classId)}&subject_id=${encodeURIComponent(subjectId)}&semester=${semester}`, {
        headers: this.getAuthHeaders()
      }).then(r => r.json());

      if (!res || !res.success || !res.data) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">${(res && res.error && res.error.message) || 'Error loading roster.'}</td></tr>`;
        return;
      }

      const data = res.data;
      const students = data.students || [];
      const isLocked = Boolean(data.is_locked);
      const statusVal = data.status || 'NEW';

      // Update Lock Alert & Buttons
      const lockAlert = document.getElementById('teacherLockAlert');
      const lockReasonText = document.getElementById('teacherLockReasonText');
      const btnSave = document.getElementById('btnSaveMarksDraft');
      const btnSubmit = document.getElementById('btnSubmitMarks');
      const btnLock = document.getElementById('btnLockMarks');
      const statLock = document.getElementById('statLockStatus');

      if (statLock) {
        statLock.textContent = statusVal;
        statLock.style.color = isLocked ? '#dc2626' : (statusVal === 'SUBMITTED' ? '#0b5cad' : '#059669');
      }

      if (isLocked) {
        if (lockAlert) {
          lockAlert.style.display = 'flex';
          if (lockReasonText) lockReasonText.textContent = data.lock_reason ? `(${data.lock_reason})` : '';
        }
        if (btnSave) btnSave.disabled = true;
        if (btnSubmit) btnSubmit.disabled = true;
        if (btnLock) {
          btnLock.disabled = true;
          btnLock.innerHTML = `<i data-lucide="lock" style="width:15px;height:15px;"></i> Locked`;
        }
      } else {
        if (lockAlert) lockAlert.style.display = 'none';
        if (btnSave) btnSave.disabled = false;
        if (btnSubmit) btnSubmit.disabled = false;
        if (btnLock) {
          btnLock.disabled = false;
          btnLock.innerHTML = `<i data-lucide="lock" style="width:15px;height:15px;"></i> Lock Submission`;
        }
      }

      // Update Stats
      let gradedCount = 0;
      let totalMarksSum = 0;
      students.forEach(s => {
        if (s.total_marks !== null) {
          gradedCount++;
          totalMarksSum += s.total_marks;
        }
      });

      document.getElementById('statTotalStudents').textContent = students.length;
      document.getElementById('statGradedCount').textContent = gradedCount;
      document.getElementById('statAvgMarks').textContent = gradedCount > 0 ? (totalMarksSum / gradedCount).toFixed(1) : '—';

      // Render Rows
      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No enrolled students found for class ${classId}.</td></tr>`;
        return;
      }

      tbody.innerHTML = students.map(s => {
        const intVal = s.internal_marks !== null ? s.internal_marks : '';
        const extVal = s.external_marks !== null ? s.external_marks : '';
        const totVal = s.total_marks !== null ? s.total_marks : '—';
        const gradeVal = s.grade || '—';
        const gpVal = s.grade_point !== null ? Number(s.grade_point).toFixed(1) : '—';
        const stVal = s.result_status || '—';
        const disabledAttr = isLocked ? 'disabled' : '';

        return `
          <tr style="border-bottom:1px solid #e2e8f0;" data-student-id="${s.student_id}" data-student-code="${s.student_code}">
            <td style="padding:10px 12px; font-weight:700; color:var(--primary-blue);">${s.roll_no || '—'}</td>
            <td style="padding:10px 12px; font-weight:600;">${s.full_name || 'Student'}</td>
            <td style="padding:10px 12px; color:var(--text-muted); font-size:12px;">${s.student_code}</td>
            <td style="padding:8px 12px;">
              <input type="number" min="0" max="30" step="0.5" class="roster-int-mark" 
                     value="${intVal}" ${disabledAttr} placeholder="0-30"
                     style="width:90px; padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; font-size:13px;"
                     oninput="TeacherApp.calcRosterRow(this)">
            </td>
            <td style="padding:8px 12px;">
              <input type="number" min="0" max="70" step="0.5" class="roster-ext-mark" 
                     value="${extVal}" ${disabledAttr} placeholder="0-70"
                     style="width:90px; padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; font-size:13px;"
                     oninput="TeacherApp.calcRosterRow(this)">
            </td>
            <td style="padding:10px 12px; font-weight:700; color:var(--dark-navy);" class="roster-total-cell">
              ${totVal !== '—' ? totVal + ' / 100' : '—'}
            </td>
            <td style="padding:10px 12px;" class="roster-grade-cell">
              ${gradeVal !== '—' ? `<span class="badge ${['O', 'A+', 'A'].includes(gradeVal) ? 'badge-success' : (gradeVal === 'F' ? 'badge-danger' : 'badge-info')}">${gradeVal} (${gpVal})</span>` : '—'}
            </td>
            <td style="padding:10px 12px;" class="roster-status-cell">
              ${stVal !== '—' ? `<span class="badge ${stVal === 'PASS' ? 'badge-status-safe' : 'badge-danger'}">${stVal}</span>` : '—'}
            </td>
          </tr>
        `;
      }).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      console.error('Error loading marks roster:', err);
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Network error communicating with results API.</td></tr>`;
    }
  },

  calcRosterRow(input) {
    const row = input.closest('tr');
    const intInput = row.querySelector('.roster-int-mark');
    const extInput = row.querySelector('.roster-ext-mark');
    const totalCell = row.querySelector('.roster-total-cell');
    const gradeCell = row.querySelector('.roster-grade-cell');
    const statusCell = row.querySelector('.roster-status-cell');

    let intVal = parseFloat(intInput.value);
    let extVal = parseFloat(extInput.value);

    // Boundary validation & visual cues
    if (!isNaN(intVal)) {
      if (intVal < 0) { intVal = 0; intInput.value = 0; }
      if (intVal > 30) { intVal = 30; intInput.value = 30; }
      intInput.style.borderColor = '#cbd5e1';
    }
    if (!isNaN(extVal)) {
      if (extVal < 0) { extVal = 0; extInput.value = 0; }
      if (extVal > 70) { extVal = 70; extInput.value = 70; }
      extInput.style.borderColor = '#cbd5e1';
    }

    if (isNaN(intVal) && isNaN(extVal)) {
      totalCell.textContent = '—';
      gradeCell.textContent = '—';
      statusCell.textContent = '—';
      return;
    }

    const total = (isNaN(intVal) ? 0 : intVal) + (isNaN(extVal) ? 0 : extVal);
    totalCell.textContent = `${total.toFixed(1)} / 100`;

    // UGC 10-Point Scale
    let grade = 'F', gp = 0.0, status = 'FAIL';
    if (total >= 90) { grade = 'O'; gp = 10.0; status = 'PASS'; }
    else if (total >= 80) { grade = 'A+'; gp = 9.0; status = 'PASS'; }
    else if (total >= 70) { grade = 'A'; gp = 8.0; status = 'PASS'; }
    else if (total >= 60) { grade = 'B+'; gp = 7.0; status = 'PASS'; }
    else if (total >= 50) { grade = 'B'; gp = 6.0; status = 'PASS'; }
    else if (total >= 45) { grade = 'C'; gp = 5.0; status = 'PASS'; }
    else if (total >= 40) { grade = 'P'; gp = 4.0; status = 'PASS'; }

    gradeCell.innerHTML = `<span class="badge ${['O', 'A+', 'A'].includes(grade) ? 'badge-success' : (grade === 'F' ? 'badge-danger' : 'badge-info')}">${grade} (${gp.toFixed(1)})</span>`;
    statusCell.innerHTML = `<span class="badge ${status === 'PASS' ? 'badge-status-safe' : 'badge-danger'}">${status}</span>`;
  },

  async saveMarksRoster(isDraft = false) {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const subjectId = document.getElementById('teacherMarksSubjectSelect')?.value || 'CS501';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5);

    const rows = document.querySelectorAll('#teacherResultsTableBody tr[data-student-code]');
    if (!rows.length) {
      TeacherApp.showToast('No student records found to save.', 'warning');
      return;
    }

    const marksData = [];
    let hasValidationError = false;

    rows.forEach(r => {
      const sCode = r.getAttribute('data-student-code');
      const intInput = r.querySelector('.roster-int-mark');
      const extInput = r.querySelector('.roster-ext-mark');

      const intVal = parseFloat(intInput.value);
      const extVal = parseFloat(extInput.value);

      if (!isNaN(intVal) || !isNaN(extVal)) {
        if ((!isNaN(intVal) && (intVal < 0 || intVal > 30)) || (!isNaN(extVal) && (extVal < 0 || extVal > 70))) {
          hasValidationError = true;
          intInput.style.borderColor = '#ef4444';
          extInput.style.borderColor = '#ef4444';
        }
        marksData.push({
          student_id: sCode,
          internal_marks: isNaN(intVal) ? 0.0 : intVal,
          external_marks: isNaN(extVal) ? 0.0 : extVal,
          practical_marks: 0.0,
          assignment_marks: 0.0
        });
      }
    });

    if (hasValidationError) {
      TeacherApp.showToast('Validation Error: Internal must be 0-30 and External 0-70.', 'error');
      return;
    }

    if (!marksData.length) {
      TeacherApp.showToast('Please enter marks for at least one student before saving.', 'warning');
      return;
    }

    const actionLabel = isDraft ? 'Saving marks draft...' : 'Submitting authoritative marks...';
    TeacherApp.showToast(actionLabel, 'info');

    try {
      const res = await fetch('/api/v1/results/marks/entry', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          semester: semester,
          marks: marksData,
          is_draft: isDraft
        })
      }).then(r => r.json());

      if (res && res.success) {
        TeacherApp.showToast(`✅ ${isDraft ? 'Draft saved' : 'Marks submitted'} successfully for ${marksData.length} students!`, 'success');
        await this.loadMarksRoster();
      } else {
        TeacherApp.showToast((res && res.error && res.error.message) || res.message || 'Error recording marks', 'error');
      }
    } catch (err) {
      TeacherApp.showToast(`Network error: ${err.message}`, 'error');
    }
  },

  async lockMarksRoster() {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const subjectId = document.getElementById('teacherMarksSubjectSelect')?.value || 'CS501';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5);

    if (!confirm(`Are you sure you want to LOCK marks submission for Class ${classId} - ${subjectId} (Semester ${semester})?\n\nOnce locked, no further edits can be made unless unlocked by the Examination Cell.`)) {
      return;
    }

    TeacherApp.showToast('Locking marks submission against further faculty edits...', 'info');

    try {
      const res = await fetch('/api/v1/results/marks/lock', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          semester: semester,
          reason: 'End-semester marks verified and sealed by Course Faculty'
        })
      }).then(r => r.json());

      if (res && res.success) {
        TeacherApp.showToast(`🔒 Marks submission successfully locked!`, 'success');
        await this.loadMarksRoster();
      } else {
        TeacherApp.showToast((res && res.error && res.error.message) || res.message || 'Error locking submission', 'error');
      }
    } catch (err) {
      TeacherApp.showToast(`Lock error: ${err.message}`, 'error');
    }
  },

  exportGazetteCsv() {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5);
    TeacherApp.showToast(`Preparing Results Gazette CSV for Class ${classId} (Sem ${semester})...`, 'info');
    window.location.href = `/api/v1/results/export?class_name=${encodeURIComponent(classId)}&semester=${semester}`;
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
  // STEP 8: BULK MARKS ENTRY MODAL & WORKFLOW
  // ----------------------------------------------------
  openBulkMarksModal() {
    let modal = document.getElementById("bulkMarksModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "bulkMarksModal";
      modal.className = "modal-overlay";
      modal.style.cssText = `
        display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(11, 31, 58, 0.6); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(2px);
      `;
      document.body.appendChild(modal);
    }

    const students = (this.liveStudents && this.liveStudents.length > 0)
      ? this.liveStudents.filter(s => s.class_name === '3R').slice(0, 15)
      : (TeacherERPData.students["3R"] || []).slice(0, 15);

    modal.innerHTML = `
      <div style="background:#fff; width:92%; max-width:780px; max-height:90vh; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.25);">
        <div style="padding:16px 22px; background:#0B1F3A; color:#fff; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:700;">Bulk Marks Entry Sheet</h3>
            <span style="font-size:12px; color:#00A6D6;">Autonomous Continuous Assessment &amp; Semester Internal Grading</span>
          </div>
          <button onclick="document.getElementById('bulkMarksModal').style.display='none'" style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer;">&times;</button>
        </div>
        
        <div style="padding:16px 22px; background:#F8FAFC; border-bottom:1px solid #E2E8F0; display:flex; gap:16px; flex-wrap:wrap; font-size:13px;">
          <div><strong>Class:</strong> <span class="badge badge-info" style="font-size:11px;">3R (Third Year CSE)</span></div>
          <div><strong>Subject:</strong> <span class="badge badge-secondary" style="font-size:11px;">5CS220PC - Database Management Systems</span></div>
          <div><strong>Max Marks:</strong> Internal: 30 • External: 70 • Total: 100</div>
        </div>

        <div style="padding:16px 22px; overflow-y:auto; flex:1;">
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr style="background:#F1F5F9; text-align:left; border-bottom:2px solid #CBD5E1;">
                <th style="padding:8px 10px;">Roll No</th>
                <th style="padding:8px 10px;">Student Name</th>
                <th style="padding:8px 10px; width:130px;">Internal (Max 30)</th>
                <th style="padding:8px 10px; width:130px;">External (Max 70)</th>
                <th style="padding:8px 10px;">Calculated Total</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(st => {
                const sid = st.student_id || st.id || 'stud-' + st.roll_no;
                const roll = st.roll_no || st.rollNo || '-';
                const name = st.full_name || st.name || 'Student';
                return `
                  <tr style="border-bottom:1px solid #E2E8F0;">
                    <td style="padding:8px 10px; font-weight:700; color:var(--primary-blue);">${roll}</td>
                    <td style="padding:8px 10px; font-weight:600;">${name}</td>
                    <td style="padding:8px 10px;">
                      <input type="number" class="bulk-int-mark" data-id="${sid}" min="0" max="30" value="26" 
                             style="width:80px; padding:6px; border:1px solid #CBD5E1; border-radius:4px;" 
                             oninput="TeacherApp.calcRowTotal(this)">
                    </td>
                    <td style="padding:8px 10px;">
                      <input type="number" class="bulk-ext-mark" data-id="${sid}" min="0" max="70" value="54" 
                             style="width:80px; padding:6px; border:1px solid #CBD5E1; border-radius:4px;" 
                             oninput="TeacherApp.calcRowTotal(this)">
                    </td>
                    <td style="padding:8px 10px; font-weight:700; color:#059669;" class="row-total-display">80 / 100 (A)</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="padding:14px 22px; background:#F8FAFC; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:var(--text-muted);">* Boundary enforcement: Marks cannot be negative or exceed max values.</span>
          <div style="display:flex; gap:10px;">
            <button onclick="document.getElementById('bulkMarksModal').style.display='none'" style="padding:8px 16px; border:1px solid #CBD5E1; background:#fff; border-radius:6px; cursor:pointer;">Cancel</button>
            <button onclick="TeacherApp.submitBulkMarks()" style="padding:8px 20px; background:#0B5CAD; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Validate &amp; Submit Marks</button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  },

  calcRowTotal(input) {
    const row = input.closest('tr');
    const intInput = row.querySelector('.bulk-int-mark');
    const extInput = row.querySelector('.bulk-ext-mark');
    const totalEl = row.querySelector('.row-total-display');

    const intVal = Math.max(0, Math.min(30, parseFloat(intInput.value) || 0));
    const extVal = Math.max(0, Math.min(70, parseFloat(extInput.value) || 0));
    intInput.value = intVal;
    extInput.value = extVal;

    const total = intVal + extVal;
    const grade = total >= 80 ? 'A' : (total >= 70 ? 'B+' : (total >= 60 ? 'B' : (total >= 50 ? 'C' : 'P')));
    totalEl.textContent = `${total} / 100 (${grade})`;
  },

  async submitBulkMarks() {
    this.showToast('Validating boundaries and recording bulk marks...', 'info');
    const rows = document.querySelectorAll('#bulkMarksModal tbody tr');
    const marksData = [];

    rows.forEach(r => {
      const intInput = r.querySelector('.bulk-int-mark');
      const extInput = r.querySelector('.bulk-ext-mark');
      marksData.push({
        student_id: intInput.getAttribute('data-id'),
        internal_marks: parseFloat(intInput.value) || 0,
        external_marks: parseFloat(extInput.value) || 0,
        practical_marks: 0,
        maximum_marks: 100
      });
    });

    try {
      const res = await fetch('/api/v1/results/marks/entry', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: '3R',
          subject_id: 'CS501',
          semester: 5,
          marks: marksData,
          is_draft: false
        })
      });

      const data = await res.json();
      if (data.success) {
        this.showToast(`✅ Successfully validated and saved marks for ${marksData.length} students!`, 'success');
        document.getElementById('bulkMarksModal').style.display = 'none';
        if (this.currentView === 'results') {
          this.loadMarksRoster();
        }
      } else {
        this.showToast((data.error && data.error.message) || data.message || 'Error saving marks', 'error');
      }
    } catch (err) {
      this.showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ----------------------------------------------------
  // STEP 8: LEAVE APPLICATION WORKFLOW
  // ----------------------------------------------------
  openLeaveModal() {
    let modal = document.getElementById("teacherLeaveModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "teacherLeaveModal";
      modal.className = "modal-overlay";
      modal.style.cssText = `
        display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(11, 31, 58, 0.6); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(2px);
      `;
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="background:#fff; width:90%; max-width:480px; border-radius:12px; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.25);">
        <div style="padding:16px 20px; background:#0B1F3A; color:#fff; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:15px; font-weight:700;">Apply for Faculty Leave</h3>
          <button onclick="document.getElementById('teacherLeaveModal').style.display='none'" style="background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer;">&times;</button>
        </div>
        <div style="padding:20px; font-size:13px;">
          <div style="margin-bottom:12px;">
            <label style="display:block; font-weight:600; margin-bottom:4px;">Leave Type</label>
            <select id="teacherLeaveType" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px;">
              <option value="casual">Casual Leave (CL)</option>
              <option value="medical">Medical Leave (ML)</option>
              <option value="duty">Duty Leave / Conference (DL)</option>
              <option value="earned">Earned Leave (EL)</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
            <div>
              <label style="display:block; font-weight:600; margin-bottom:4px;">Start Date</label>
              <input type="date" id="teacherLeaveStart" value="2026-11-10" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px;">
            </div>
            <div>
              <label style="display:block; font-weight:600; margin-bottom:4px;">End Date</label>
              <input type="date" id="teacherLeaveEnd" value="2026-11-11" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px;">
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block; font-weight:600; margin-bottom:4px;">Total Working Days</label>
            <input type="number" id="teacherLeaveDays" value="2.0" step="0.5" min="0.5" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px;">
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block; font-weight:600; margin-bottom:4px;">Reason / Academic Arrangement</label>
            <textarea id="teacherLeaveReason" rows="3" placeholder="Specify reason and lecture adjustment..." style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px;"></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button onclick="document.getElementById('teacherLeaveModal').style.display='none'" style="padding:8px 14px; border:1px solid #CBD5E1; background:#fff; border-radius:6px; cursor:pointer;">Cancel</button>
            <button onclick="TeacherApp.submitLeaveApplication()" style="padding:8px 18px; background:#0B5CAD; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Submit Application</button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  },

  async submitLeaveApplication() {
    const leaveType = document.getElementById('teacherLeaveType').value;
    const startDate = document.getElementById('teacherLeaveStart').value;
    const endDate = document.getElementById('teacherLeaveEnd').value;
    const totalDays = parseFloat(document.getElementById('teacherLeaveDays').value) || 1.0;
    const reason = document.getElementById('teacherLeaveReason').value || 'Personal academic leave';

    try {
      const activeCode = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';

      const res = await fetch('/api/v1/management/teacher/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_code: activeCode,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          total_days: totalDays,
          reason: reason
        })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('✅ Leave application successfully submitted to HOD/Admin for review!', 'success');
        document.getElementById('teacherLeaveModal').style.display = 'none';
      } else {
        this.showToast(data.message || 'Leave submission failed', 'error');
      }
    } catch (e) {
      this.showToast(`Error: ${e.message}`, 'error');
    }
  },

  // ----------------------------------------------------
  // STEP 8: ATTENDANCE SUBMISSION FOR APPROVAL
  // ----------------------------------------------------
  async submitAttendanceSession(sessionId) {
    if (!sessionId) {
      this.showToast('Select an attendance session to submit', 'warning');
      return;
    }
    try {
      const activeCode = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
        ? TeacherERPData.getActiveTeacherEmpCode()
        : 'EMP-CSE-1001';

      const res = await fetch('/api/v1/management/teacher/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, emp_code: activeCode })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('✅ Session submitted for HOD approval and locking!', 'success');
      } else {
        this.showToast(data.message || 'Submission failed', 'error');
      }
    } catch (e) {
      this.showToast(`Error: ${e.message}`, 'error');
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

