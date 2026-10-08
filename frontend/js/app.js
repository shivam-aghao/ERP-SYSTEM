/* ========================================================
   TEACHER ERP MAIN APPLICATION CONTROLLER
   ======================================================== */

const TeacherApp = {
  currentView: 'dashboard',

  init() {
    // 1. Immediately test and display backend connection status
    this.checkBackendConnection();

    // 2. Safely render each dashboard module
    try { this.bindEvents(); } catch (e) { console.warn('bindEvents:', e); }
    try { this.renderHeaderProfile(); } catch (e) { console.warn('renderHeaderProfile:', e); }
    try { this.renderDynamicDates(); } catch (e) { console.warn('renderDynamicDates:', e); }
    try { this.renderDashboardData(); } catch (e) { console.warn('renderDashboardData:', e); }
    try { this.renderTimetableView(); } catch (e) { console.warn('renderTimetableView:', e); }
    try { this.renderStudentsView(); } catch (e) { console.warn('renderStudentsView:', e); }
    try { this.renderSyllabusView(); } catch (e) { console.warn('renderSyllabusView:', e); }
    try { this.renderResultsView(); } catch (e) { console.warn('renderResultsView:', e); }
    try { this.renderNotificationsList(); } catch (e) { console.warn('renderNotificationsList:', e); }
    try { this.initLucideIcons(); } catch (e) { console.warn('initLucideIcons:', e); }
    try { this.initHashRouting(); } catch (e) { console.warn('initHashRouting:', e); }
    if (typeof window.AttendanceMarkingManager !== 'undefined') {
      try { window.AttendanceMarkingManager.init(); } catch (e) {}
    }

    // 3. Periodic health monitor (every 7 seconds)
    if (!this._healthInterval) {
      this._healthInterval = setInterval(() => {
        this.checkBackendConnection(false);
      }, 7000);
    }
  },

  async checkBackendConnection(isManualCheck = false) {
    const pill = document.getElementById('backend-status-pill');
    const dot = document.getElementById('backend-status-dot');
    const text = document.getElementById('backend-status-text');

    const setStatus = (isOnline, latency, supabaseOnline) => {
      if (pill) {
        pill.style.background = (isOnline || supabaseOnline) ? '#ECFDF5' : '#FEF2F2';
        pill.style.borderColor = (isOnline || supabaseOnline) ? '#10B981' : '#EF4444';
        pill.style.color = (isOnline || supabaseOnline) ? '#047857' : '#B91C1C';
      }
      if (dot) {
        dot.style.background = (isOnline || supabaseOnline) ? '#10B981' : '#EF4444';
        dot.style.boxShadow = (isOnline || supabaseOnline) ? '0 0 8px #10B981' : '0 0 8px #EF4444';
      }
      if (text) {
        if (isOnline && supabaseOnline) {
          text.textContent = `🟢 Live Connected (Backend & Supabase)${latency ? ` (${latency}ms)` : ''}`;
        } else if (isOnline) {
          text.textContent = `🟢 Backend: Connected${latency ? ` (${latency}ms)` : ''}`;
        } else if (supabaseOnline) {
          text.textContent = `🟢 Supabase: Connected (Cloud)`;
        } else {
          text.textContent = '🔴 Backend: Offline';
        }
      }
    };

    let isHealthy = false;
    let supabaseOnline = false;
    let latency = 0;

    // Probe 1: Via TeacherAPI
    if (typeof window.TeacherAPI !== 'undefined' && typeof window.TeacherAPI.checkHealth === 'function') {
      try {
        const start = performance.now();
        const health = await window.TeacherAPI.checkHealth();
        latency = Math.round(performance.now() - start);
        if (health && (health.status === 'OK' || health.status === 'healthy')) {
          isHealthy = true;
          if (health.supabase === 'connected' || health.database === 'connected') {
            supabaseOnline = true;
          }
        }
      } catch (e) {
        console.warn('TeacherAPI health check failed:', e.message);
      }
    }

    // Probe 2: Direct HTTP fetch probes to ensure connection under all port/host configurations
    if (!isHealthy) {
      const endpoints = [
        'http://localhost:8000/health',
        'http://127.0.0.1:8000/health',
        'http://localhost:8000/api/v1/health',
        'http://127.0.0.1:8000/api/v1/health'
      ];
      for (const ep of endpoints) {
        try {
          const start = performance.now();
          const res = await fetch(ep, { signal: AbortSignal.timeout(2000) });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'OK' || data.status === 'healthy' || data.database === 'connected') {
              isHealthy = true;
              if (data.supabase === 'connected' || data.database === 'connected') {
                supabaseOnline = true;
              }
              latency = Math.round(performance.now() - start);
              break;
            }
          }
        } catch (_) {}
      }
    }

    // Probe 3: Direct Supabase client check
    if (!supabaseOnline && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient.from('teachers').select('id').limit(1);
        if (!error && data) {
          supabaseOnline = true;
        }
      } catch (_) {}
    }

    if (isHealthy || supabaseOnline) {
      setStatus(isHealthy, latency, supabaseOnline);
      let teacherName = (window.ERP_AUTH ? window.ERP_AUTH.getUserName() : '') || 'Faculty';

      if (typeof window.TeacherAPI !== 'undefined' && typeof window.TeacherAPI.login === 'function') {
        try {
          const loginData = await window.TeacherAPI.login();
          if (loginData && loginData.user && loginData.user.name) {
            teacherName = loginData.user.name;
          }
        } catch (loginErr) {
          console.warn('Backend login notice:', loginErr.message);
        }
      }

      if (isManualCheck) {
        this.showToast(`✅ Live Backend Connected (${latency}ms)! Authenticated as ${teacherName}`, 'success');
      }

      // Fetch dynamic dashboard KPIs
      if (typeof window.TeacherAPI !== 'undefined' && typeof window.TeacherAPI.getDashboardSummary === 'function') {
        try {
          const data = await window.TeacherAPI.getDashboardSummary();
          if (data && typeof TeacherERPData !== 'undefined') {
            const metrics = data.metrics || {
              totalClasses: data.total_classes,
              totalStudents: data.total_students,
              averageAttendance: data.attendance_average_pct ? `${data.attendance_average_pct}%` : '87%'
            };
            if (metrics.totalClasses !== undefined) TeacherERPData.stats.totalClasses = String(metrics.totalClasses).padStart(2, '0');
            if (metrics.totalStudents !== undefined) TeacherERPData.stats.totalStudents = String(metrics.totalStudents);
            if (metrics.averageAttendance) TeacherERPData.stats.attendancePercent = parseInt(metrics.averageAttendance, 10) || 87;
            if (typeof this.renderDashboardData === 'function') this.renderDashboardData();
          }
        } catch (kpiErr) {
          console.warn('Dashboard summary:', kpiErr.message);
        }
      }
    } else {
      setStatus(false);
      if (isManualCheck) this.showToast('❌ Backend server offline', 'error');
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
      if (window.ERP_AUTH) {
        const u = window.ERP_AUTH.getCurrentUser();
        if (u && (u.role === 'teacher' || u.role === 'faculty' || u.role === 'employee')) {
          const fn = u.full_name || u.name || u.fullName || 'Faculty Member';
          const empCode = u.emp_code || u.employeeId;
          const facObj = (typeof TeacherERPData !== 'undefined' && TeacherERPData.facultyList)
            ? TeacherERPData.facultyList.find(f => f.empCode === empCode)
            : null;
          return {
            name: fn,
            department: u.department_name || u.department || 'Computer Science & Engineering',
            departmentCode: u.department_code || u.departmentCode || 'CSE',
            title: u.designation || (facObj && facObj.title) || 'Faculty Member',
            employeeId: empCode || u.emp_code || u.empCode || u.id || (facObj && facObj.empCode) || '',
            email: u.email || '',
            phone: u.phone || '',
            avatarInitials: u.avatar || u.initials || fn.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          };
        }
      }
      const stored = localStorage.getItem("ssgmce_active_teacher") || localStorage.getItem("ssgmce_user") || localStorage.getItem("ssgmce_logged_in_teacher") || sessionStorage.getItem("ssgmce_active_teacher") || sessionStorage.getItem("ssgmce_user");
      if (stored) {
        const u = typeof stored === 'string' ? JSON.parse(stored) : stored;
        const empCode = u.emp_code || u.employeeId;
        const facObj = (typeof TeacherERPData !== 'undefined' && TeacherERPData.facultyList)
          ? TeacherERPData.facultyList.find(f => f.empCode === empCode)
          : null;
        return {
          name: u.full_name || u.name || (facObj && facObj.name) || "Faculty Member",
          department: u.department_name || u.department || "Computer Science & Engineering",
          departmentCode: u.department_code || u.departmentCode || "CSE",
          title: u.designation || (facObj && facObj.title) || "Faculty Member",
          employeeId: empCode || (facObj && facObj.empCode) || "",
          email: u.email || "",
          phone: u.phone || "",
          avatarInitials: (u.name || (facObj && facObj.name) || "FM").split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
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
      name: "Prof. J. M. Patil",
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
      title: "Professor & Head, CSE",
      employeeId: "EMP-CSE-1001",
      email: "jmpatil@ssgmce.ac.in",
      phone: "+91 94228 12345",
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

    const menuEmpIdElem = document.getElementById("profile-menu-empid");
    if (menuEmpIdElem) {
      menuEmpIdElem.textContent = teacher.employeeId ? `Employee Code: ${teacher.employeeId}` : "SSGMCE Faculty Record";
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

    // Dynamic Binding for Dedicated Profile Pane
    const profAvatarLarge = document.getElementById("teacher-profile-avatar-large");
    if (profAvatarLarge) {
      profAvatarLarge.textContent = initials || "FM";
    }

    const profFullName = document.getElementById("teacher-profile-fullname");
    if (profFullName) {
      profFullName.textContent = teacher.name || "Faculty Member";
    }

    const profDeptText = document.getElementById("teacher-profile-dept-text");
    if (profDeptText) {
      profDeptText.textContent = teacher.department ? `Department of ${teacher.department}` : "Department Faculty";
    }

    const profEmpId = document.getElementById("teacher-profile-empid");
    if (profEmpId) {
      profEmpId.textContent = teacher.employeeId ? `Employee Code: ${teacher.employeeId}` : "SSGMCE Faculty Record";
    }

    const profEmail = document.getElementById("teacher-profile-email-text");
    if (profEmail) {
      profEmail.textContent = teacher.email || (teacher.employeeId ? `${teacher.employeeId.toLowerCase()}@ssgmce.ac.in` : "faculty@ssgmce.ac.in");
    }

    const profDesig = document.getElementById("teacher-profile-designation-text");
    if (profDesig) {
      profDesig.textContent = teacher.title || "Faculty Member";
    }

    const profPhone = document.getElementById("teacher-profile-phone-text");
    if (profPhone) {
      profPhone.textContent = teacher.phone || "--";
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

    // Header Profile Direct Click & Dropdown Toggle
    const profileTrigger = document.getElementById("profile-dropdown-trigger");
    const profileMenu = document.getElementById("profile-dropdown-menu");
    const headerProfName = document.getElementById("header-profile-name");
    const headerProfAvatar = document.getElementById("header-profile-avatar");
    const headerProfDept = document.getElementById("header-profile-dept");
    const heroProfName = document.getElementById("hero-teacher-name");

    // Clicking directly on Teacher's Name in header opens Profile immediately
    if (headerProfName) {
      headerProfName.style.cursor = "pointer";
      headerProfName.title = "View Faculty Profile";
      headerProfName.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showTeacherProfile();
      });
    }

    // Clicking directly on Teacher's Avatar in header opens Profile immediately
    if (headerProfAvatar) {
      headerProfAvatar.style.cursor = "pointer";
      headerProfAvatar.title = "View Faculty Profile";
      headerProfAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showTeacherProfile();
      });
    }

    // Clicking on Teacher's Department label
    if (headerProfDept) {
      headerProfDept.style.cursor = "pointer";
      headerProfDept.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showTeacherProfile();
      });
    }

    // Clicking on Teacher's Name in Hero section opens Profile immediately
    if (heroProfName) {
      heroProfName.style.cursor = "pointer";
      heroProfName.title = "View Faculty Profile";
      heroProfName.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showTeacherProfile();
      });
    }

    if (profileTrigger && profileMenu) {
      profileTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        // If clicking on chevron icon specifically, toggle dropdown menu
        if (e.target.closest('.profile-arrow') || e.target.classList.contains('chevron-down-icon') || e.target.tagName.toLowerCase() === 'polyline') {
          const isOpen = profileMenu.classList.contains("show") || profileMenu.classList.contains("open") || profileMenu.style.display === "flex";
          this.closeAllDropdowns();
          if (!isOpen) {
            profileMenu.classList.add("show");
            profileMenu.classList.add("open");
            profileMenu.style.display = "flex";
            profileMenu.style.opacity = "1";
            profileMenu.style.visibility = "visible";
            profileTrigger.classList.add("active");
            profileTrigger.setAttribute("aria-expanded", "true");
          }
        } else {
          // Clicking anywhere on profile button directly opens Faculty Profile
          this.showTeacherProfile();
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", () => {
      this.closeAllDropdowns();
    });

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeTeacherProfileModal();
        this.closeAllDropdowns();
      }
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

  showTeacherProfile() {
    this.closeAllDropdowns();
    this.switchView('profile');
    try { window.location.hash = 'profile'; } catch (_) {}
    this.openTeacherProfileModal();
    const profView = document.getElementById("profile-view");
    if (profView) {
      profView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  openTeacherProfileModal() {
    const modal = document.getElementById("modal-teacher-profile");
    if (modal) {
      this.renderProfileModalData();
      modal.style.display = "flex";
      this.initLucideIcons();
    }
  },

  closeTeacherProfileModal() {
    const modal = document.getElementById("modal-teacher-profile");
    if (modal) {
      modal.style.display = "none";
    }
  },

  renderProfileModalData() {
    const teacher = this.getLoggedInTeacher();
    if (!teacher) return;

    let initials = teacher.avatarInitials;
    if (!initials && teacher.name) {
      const cleanName = teacher.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
      const parts = cleanName.split(/\s+/);
      initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }

    const modalAvatar = document.getElementById("modal-profile-avatar");
    if (modalAvatar) {
      modalAvatar.innerHTML = `<span>${initials || "JP"}</span><span style="position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; background: #10B981; border: 2.5px solid #FFFFFF; border-radius: 50%;" title="Active Faculty"></span>`;
    }

    const modalName = document.getElementById("modal-profile-name");
    if (modalName) modalName.textContent = teacher.name || "Prof. J. M. Patil";

    const modalTitle = document.getElementById("modal-profile-title");
    if (modalTitle) modalTitle.textContent = teacher.title || "Professor & Head, CSE";

    const modalDept = document.getElementById("modal-profile-dept");
    if (modalDept) modalDept.textContent = teacher.department ? `Department of ${teacher.department}` : "Department of Computer Science & Engineering";

    const modalEmpId = document.getElementById("modal-profile-empid");
    if (modalEmpId) modalEmpId.textContent = teacher.employeeId || "EMP-CSE-1001";

    const modalEmail = document.getElementById("modal-profile-email");
    if (modalEmail) modalEmail.textContent = teacher.email || (teacher.employeeId ? `${teacher.employeeId.toLowerCase()}@ssgmce.ac.in` : "jmpatil@ssgmce.ac.in");

    const modalPhone = document.getElementById("modal-profile-phone");
    if (modalPhone) modalPhone.textContent = teacher.phone || "+91 94228 12345";

    const modalCabin = document.getElementById("modal-profile-cabin");
    if (modalCabin) modalCabin.textContent = teacher.cabin || "Room B-204, Academic Block";

    const modalHours = document.getElementById("modal-profile-hours");
    if (modalHours) modalHours.textContent = teacher.officeHours || "Mon - Fri, 10:00 AM - 04:00 PM";

    const modalTerm = document.getElementById("modal-profile-term");
    if (modalTerm && typeof AcademicDateUtils !== 'undefined') {
      modalTerm.textContent = AcademicDateUtils.getCurrentAcademicTerm().fullTerm;
    }
  },

  closeAllDropdowns() {
    const profileMenu = document.getElementById("profile-dropdown-menu");
    const profileTrigger = document.getElementById("profile-dropdown-trigger");

    if (profileMenu) {
      profileMenu.classList.remove("show");
      profileMenu.classList.remove("open");
      profileMenu.style.display = "none";
      profileMenu.style.opacity = "0";
      profileMenu.style.visibility = "hidden";
    }
    if (profileTrigger) {
      profileTrigger.classList.remove("active");
      profileTrigger.setAttribute("aria-expanded", "false");
    }
  },

  // ----------------------------------------------------
  // VIEW ROUTING / SWITCHING
  // ----------------------------------------------------
  switchView(viewName, subView, preserveFrame = false) {
    this.closeAllDropdowns();
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

    // Hide all view containers and clear active classes
    document.querySelectorAll(".view-section-pane").forEach(pane => {
      pane.style.display = "none";
      pane.classList.remove("active");
    });

    // Update Header Page Title / Role Badge
    const titleElem = document.getElementById("header-page-title");
    const setHeaderBadge = (text) => {
      if (titleElem) {
        titleElem.innerHTML = `<i data-lucide="graduation-cap" style="width:13px;height:13px;"></i> ${text}`;
      }
    };

    switch (viewName) {
      case 'dashboard': {
        const dashView = document.getElementById("dashboard-view");
        if (dashView) {
          dashView.style.display = "block";
          dashView.classList.add("active");
        }
        setHeaderBadge("Teacher Dashboard");
        break;
      }
      case 'profile': {
        const profView = document.getElementById("profile-view");
        if (profView) {
          profView.style.display = "block";
          profView.classList.add("active");
        }
        setHeaderBadge("Faculty Profile");
        this.renderHeaderProfile();
        break;
      }
      case 'academics':
        document.getElementById("academics-view").style.display = "block";
        setHeaderBadge("Academics Hub");
        break;
      case 'attendance':
        document.getElementById("attendance-module").style.display = "block";
        setHeaderBadge("Teacher Attendance Hub");
        if (!preserveFrame) {
          this.initIntegratedAttendance(subView);
        }
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
      case 'information': {
        const profView = document.getElementById("profile-view");
        if (profView) {
          profView.style.display = "block";
          profView.classList.add("active");
        }
        setHeaderBadge("Faculty Information");
        this.renderHeaderProfile();
        break;
      }
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
      const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      const pendingPercent = totalCount > 0 ? (100 - completedPercent) : 0;

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
    const frame = document.getElementById('attendance-integrated-frame');
    const targetUrl = `teacher-attendance.html?embedded=true&class=${encodeURIComponent(classCode)}&subject=${encodeURIComponent(subject || '')}`;

    // Switch view to attendance with preserveFrame=true so switchView does not clobber frame
    this.switchView('attendance', 'marking', true);

    if (frame) {
      const currentSrc = frame.getAttribute('src') || '';
      if (currentSrc.includes(`class=${encodeURIComponent(classCode)}`)) {
        try {
          const app = frame.contentWindow && (frame.contentWindow.TeacherAttendanceApp || frame.contentWindow.CollegeERPApp);
          if (app && typeof app.handleDirectClassLaunch === 'function') {
            app.handleDirectClassLaunch(classCode, subject);
            this.onAttendanceFrameLoaded();
            return;
          }
        } catch (_) {}
      }
      this.showAttendanceLoader();
      frame.src = targetUrl;
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

    const defaultPage = (mode === 'roster') ? 'teacher-attendance-roster.html' : 'teacher-attendance.html';
    const targetSrc = `${defaultPage}?embedded=true&class=3R`;

    if (frame) {
      const currentSrc = frame.getAttribute('src') || '';
      const currentIsRoster = currentSrc.includes('teacher-attendance-roster.html');
      const shouldSwitch = (mode === 'roster' && !currentIsRoster) || (mode === 'marking' && currentIsRoster) || !currentSrc;

      if (shouldSwitch) {
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
        // Synchronize authenticated session into child iframe context
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
  // TIMETABLE MODULE VIEW (DELEGATED TO TimetableModule)
  // ----------------------------------------------------
  _selectedTimetableDate: null,

  get selectedTimetableDate() {
    return (window.TimetableModule && window.TimetableModule.selectedDate) || this._selectedTimetableDate || null;
  },

  set selectedTimetableDate(val) {
    this._selectedTimetableDate = val;
    if (window.TimetableModule) {
      window.TimetableModule.selectedDate = val;
    }
  },

  handleTimetableDateChange(dateVal) {
    if (window.TimetableModule && typeof window.TimetableModule.handleDateChange === 'function') {
      window.TimetableModule.handleDateChange(dateVal, "timetable-content");
    } else {
      if (!dateVal) return;
      this.selectedTimetableDate = dateVal;
      this.renderTimetableView();
    }
  },

  resetTimetableToToday() {
    if (window.TimetableModule && typeof window.TimetableModule.resetToToday === 'function') {
      window.TimetableModule.resetToToday("timetable-content");
    } else {
      this.selectedTimetableDate = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0];
      this.renderTimetableView();
    }
  },

  renderTimetableView() {
    if (window.TimetableModule && typeof window.TimetableModule.render === 'function') {
      window.TimetableModule.render("timetable-content");
      this.initLucideIcons();
      return;
    }

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
            ${(typeof TeacherERPData !== 'undefined' && TeacherERPData.timetable ? TeacherERPData.timetable : []).map(row => {
              const isHighlightRow = (row.day.toLowerCase() === currentDayName.toLowerCase());
              return `
              <tr class="${isHighlightRow ? 'active-day-row' : ''}">
                <td class="timetable-day-cell ${isHighlightRow ? 'active-day-cell' : ''}">
                  <div class="day-cell-content">
                    <span class="day-name">${row.day}</span>
                    ${isHighlightRow ? `<span class="active-day-pill">${isToday ? 'Today' : 'Active'}</span>` : ''}
                  </div>
                </td>
                ${row.slots.map((slot, slotIndex) => {
                  if (slot === "Free Slot") {
                    return `<td style="color:var(--text-light); font-size:12px; font-style:italic;">Off / Prep</td>`;
                  }
                  const isLab = slot.toLowerCase().includes("lab");
                  const timeSlotHeader = timeHeaders[slotIndex + 1] || "09:00 - 10:30 AM";
                  const subjectName = slot.split('(')[0].trim();
                  const roomPart = slot.split('(')[1] ? slot.split('(')[1].replace(')', '').trim() : 'Room 201';
                  let classCode = '2R1';
                  if (subjectName.includes('Java')) classCode = '2R2';
                  else if (subjectName.includes('Database') || subjectName.includes('Operating')) classCode = '3R';
                  else if (subjectName.includes('Algorithms') || subjectName.includes('Project')) classCode = '4R';

                  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                  const todayDayIndex = new Date().getDay();
                  const rowDayIndex = daysOfWeek.indexOf(row.day);
                  const isFutureSlot = (selectedDate > todayISO) || (selectedDate === todayISO && rowDayIndex > todayDayIndex);
                  const sessionKey = `${selectedDate}_${classCode}_${subjectName}`;
                  const isMarked = Boolean(
                    window.AttendanceMarkingManager && window.AttendanceMarkingManager.markedSessions && window.AttendanceMarkingManager.markedSessions[sessionKey]
                  );

                  return `
                    <td>
                      <div class="timetable-slot ${isLab ? 'lab' : ''} ${isHighlightRow ? 'active-slot' : ''} ${isMarked ? 'slot-marked' : ''} ${isFutureSlot ? 'slot-future' : 'slot-clickable'}"
                           ${!isFutureSlot ? `onclick="AttendanceMarkingManager.openFromSlot('${subjectName.replace(/'/g, "\\'")}', '${roomPart.replace(/'/g, "\\'")}', '${timeSlotHeader}', '${classCode}', '${selectedDate}')"` : ''}
                           title="${isFutureSlot ? 'Future session cannot be marked ahead' : (isMarked ? 'Attendance Marked. Click to view/edit' : 'Click to mark attendance for this lecture')}">
                        <div class="slot-sub" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                          <span>${subjectName}</span>
                          ${isMarked ? '<span class="slot-marked-badge"><i data-lucide="check-circle" style="width:10px;height:10px;"></i> Marked</span>' : (isFutureSlot ? '<span class="slot-future-badge">Future</span>' : '<span class="slot-hover-badge">Mark</span>')}
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:3px;">
                          <div class="slot-room">(${roomPart})</div>
                          ${isMarked && !isFutureSlot ? '<span class="slot-view-edit-link">View/Edit &rarr;</span>' : `<span style="font-size:10.5px; color:var(--text-muted); font-weight:600;">Class ${classCode}</span>`}
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
    `;

    this.initLucideIcons();
  },

  // ----------------------------------------------------
  // STUDENTS ROSTER VIEW
  // ----------------------------------------------------
  renderStudentsView() {
    const container = document.getElementById("students-content");
    if (!container) return;

    const allStudents = (TeacherERPData && TeacherERPData.students && TeacherERPData.students["2R1"]) 
      || (TeacherERPData && typeof TeacherERPData.getStudentsForClass === 'function' ? TeacherERPData.getStudentsForClass("2R1") : []) 
      || [];

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
    if (!Array.isArray(students) || students.length === 0) {
      return `<tr><td colspan="6" style="text-align:center; padding:18px; color:var(--text-muted);">No student records found in database</td></tr>`;
    }
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
    if (window.ERPToast) {
      return window.ERPToast.show(message, type);
    }
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
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    TeacherApp.init();
  });
} else {
  TeacherApp.init();
}

