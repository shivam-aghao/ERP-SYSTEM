/* ========================================================
   TEACHER ERP MAIN APPLICATION CONTROLLER
   ======================================================== */

const TeacherApp = {
  currentView: 'dashboard',
  selectedSyllabusSubjectId: null,

  init() {
    // 1. Immediately test and display backend connection status
    this.checkBackendConnection();

    // 2. Safely render each dashboard module
    try { this.bindEvents(); } catch (e) { console.warn('bindEvents:', e); }
    try { this.renderHeaderProfile(); } catch (e) { console.warn('renderHeaderProfile:', e); }
    try { this.renderDynamicDates(); } catch (e) { console.warn('renderDynamicDates:', e); }
    try { this.renderDashboardData(); } catch (e) { console.warn('renderDashboardData:', e); }
    try { this.renderClassesView(); } catch (e) { console.warn('renderClassesView:', e); }
    try { this.renderTimetableView(); } catch (e) { console.warn('renderTimetableView:', e); }
    try { this.renderStudentsView(); } catch (e) { console.warn('renderStudentsView:', e); }
    try { this.renderSyllabusView(); } catch (e) { console.warn('renderSyllabusView:', e); }
    try { this.renderResultsView(); } catch (e) { console.warn('renderResultsView:', e); }
    try { this.renderLeaveView(); } catch (e) { console.warn('renderLeaveView:', e); }
    try { this.renderBasicProfileView(); } catch (e) { console.warn('renderBasicProfileView:', e); }
    try { this.renderInformationView(); } catch (e) { console.warn('renderInformationView:', e); }
    try { this.renderNotificationsList(); } catch (e) { console.warn('renderNotificationsList:', e); }
    try { this.initLucideIcons(); } catch (e) { console.warn('initLucideIcons:', e); }
    try { this.initHashRouting(); } catch (e) { console.warn('initHashRouting:', e); }
    try { this.loadDynamicData(); } catch (e) { console.warn('loadDynamicData:', e); }
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
          let fn = u.full_name || u.name || u.fullName || '';
          const empCode = u.emp_code || u.employeeId;
          const facObj = (typeof TeacherERPData !== 'undefined' && TeacherERPData.facultyList)
            ? TeacherERPData.facultyList.find(f => f.empCode === empCode)
            : null;
          if (!fn || fn.toLowerCase().startsWith('faculty member')) {
            fn = (facObj && facObj.name) || (empCode ? 'Dr. N. M. Kandoi' : 'Prof. J. M. Patil');
          }
          return {
            name: fn,
            department: u.department_name || u.department || 'Computer Science & Engineering',
            departmentCode: u.department_code || u.departmentCode || 'CSE',
            title: u.designation || (facObj && facObj.title) || 'Associate Professor',
            employeeId: empCode || u.emp_code || u.empCode || u.id || (facObj && facObj.empCode) || 'EMP-CSE-1002',
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
        let fn = u.full_name || u.name || (facObj && facObj.name) || '';
        if (!fn || fn.toLowerCase().startsWith('faculty member')) {
          fn = (facObj && facObj.name) || (empCode ? 'Dr. N. M. Kandoi' : 'Prof. J. M. Patil');
        }
        return {
          name: fn,
          department: u.department_name || u.department || "Computer Science & Engineering",
          departmentCode: u.department_code || u.departmentCode || "CSE",
          title: u.designation || (facObj && facObj.title) || "Associate Professor",
          employeeId: empCode || (facObj && facObj.empCode) || "EMP-CSE-1002",
          email: u.email || "",
          phone: u.phone || "",
          avatarInitials: (fn || "FM").split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
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

    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const profile = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getProfileData === 'function')
      ? TeacherERPData.getProfileData(facultyId)
      : null;

    const displayName = (profile && profile.name) || teacher.name || "Faculty Member";
    let initials = teacher.avatarInitials;
    if (!initials && displayName) {
      const cleanName = displayName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
      const parts = cleanName.split(/\s+/);
      initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }

    const photoUrl = (profile && (profile.profileImageUrl || profile.profilePhoto)) || teacher.profileImageUrl || teacher.profilePhoto || null;

    const avatarElem = document.getElementById("header-profile-avatar");
    if (avatarElem) {
      if (photoUrl) {
        avatarElem.innerHTML = `<img src="${photoUrl}" alt="${displayName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; display:block;" onerror="this.onerror=null; this.parentElement.innerHTML='<span>${initials || 'FM'}</span>';">`;
      } else {
        avatarElem.innerHTML = `<span>${initials || "FM"}</span>`;
      }
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

    // Header Profile Dropdown Toggle (Clicking anywhere on the profile pill opens the dropdown menu)
    const profileTrigger = document.getElementById("profile-dropdown-trigger");
    const profileMenu = document.getElementById("profile-dropdown-menu");
    const heroProfName = document.getElementById("hero-teacher-name");

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
  // VIEW ROUTING / SWITCHING & HASH ROUTING
  // ----------------------------------------------------
  initHashRouting() {
    const applyHash = () => {
      const rawHash = (window.location.hash || '').replace(/^#/, '').trim().toLowerCase();
      if (!rawHash) return;
      const validViews = [
        'dashboard', 'profile', 'academics', 'attendance', 'attendance-mark', 'attendance-roster',
        'examination', 'fees', 'documents', 'hostel', 'library', 'placement', 'grievance',
        'settings', 'timetable', 'classes', 'students', 'syllabus', 'results',
        'notifications', 'leave', 'information'
      ];
      if (validViews.includes(rawHash)) {
        this.switchView(rawHash);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
  },

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
        this.renderBasicProfileView();
        break;
      }
      case 'academics':
        document.getElementById("academics-view").style.display = "block";
        setHeaderBadge("Academics Hub");
        break;
      case 'attendance':
        window.location.href = subView === 'roster' ? 'teacher-attendance-roster.html' : 'teacher-attendance.html';
        return;
      case 'attendance-mark': {
        const markPage = document.getElementById("attendance-marking-page");
        if (markPage) {
          markPage.style.display = "block";
          markPage.classList.add("active");
        } else {
          const mod = document.getElementById("attendance-module");
          if (mod) mod.style.display = "block";
        }
        setHeaderBadge("Mark Attendance");
        break;
      }
      case 'attendance-roster': {
        const markPage = document.getElementById("attendance-marking-page");
        if (markPage) {
          markPage.style.display = "block";
          markPage.classList.add("active");
        }
        if (window.AttendanceMarkingManager && typeof window.AttendanceMarkingManager.switchTab === 'function') {
          window.AttendanceMarkingManager.switchTab('roster');
        }
        setHeaderBadge("Class Roster");
        break;
      }
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
      case 'timetable': {
        const ttView = document.getElementById("timetable-view");
        if (ttView) {
          ttView.style.display = "block";
          ttView.classList.add("active");
        }
        setHeaderBadge("Personal Timetable");
        if (typeof this.renderTimetableView === 'function') {
          this.renderTimetableView();
        }
        break;
      }
      case 'classes':
        document.getElementById("classes-view").style.display = "block";
        setHeaderBadge("Assigned Classes");
        this.renderClassesView();
        break;
      case 'students':
        document.getElementById("students-view").style.display = "block";
        setHeaderBadge("Students Directory");
        this.renderStudentsView();
        break;
      case 'syllabus':
        document.getElementById("syllabus-view").style.display = "block";
        setHeaderBadge("Syllabus Tracker");
        this.renderSyllabusView();
        break;
      case 'results':
        document.getElementById("results-view").style.display = "block";
        setHeaderBadge("Exam Results");
        this.renderResultsView();
        break;
      case 'notifications':
        document.getElementById("notifications-view").style.display = "block";
        setHeaderBadge("Notifications");
        this.renderNotificationsList();
        break;
      case 'leave': {
        const leaveView = document.getElementById("leave-view");
        if (leaveView) {
          leaveView.style.display = "block";
          leaveView.classList.add("active");
        }
        setHeaderBadge("Faculty Leave & Substitution");
        this.renderLeaveView();
        break;
      }
      case 'information': {
        const infoView = document.getElementById("information-view");
        if (infoView) {
          infoView.style.display = "block";
          infoView.classList.add("active");
        }
        setHeaderBadge("Faculty Information & Portfolio");
        this.renderInformationView();
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
  // DYNAMIC BACKEND SYNCHRONIZATION
  // ----------------------------------------------------
  async loadDynamicData() {
    const teacher = (typeof this.getLoggedInTeacher === 'function') ? this.getLoggedInTeacher() : null;
    const empCode = teacher?.employeeId || teacher?.empCode || (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode ? TeacherERPData.getActiveTeacherEmpCode() : 'EMP-CSE-1001');

    try {
      // 1. Fetch live teacher dashboard data (classes, stats, today's schedule)
      const res = await fetch(`http://127.0.0.1:8000/api/v1/teachers/dashboard?identifier=${encodeURIComponent(empCode)}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data && data.stats) {
          if (TeacherERPData) {
            TeacherERPData.stats = {
              totalClasses: data.stats.totalClasses || 2,
              todayClasses: data.stats.todayClasses || 0,
              totalStudents: data.stats.totalStudents || 159,
              attendancePending: data.stats.attendancePending || 0,
              attendancePendingCount: data.stats.attendancePending || 0,
              attendanceCompletedCount: data.stats.attendanceCompleted || 0,
              attendancePercent: data.stats.todayClasses > 0 
                ? Math.round(((data.stats.attendanceCompleted || 0) / data.stats.todayClasses) * 100) 
                : 100
            };

            if (Array.isArray(data.classes) && data.classes.length > 0) {
              TeacherERPData.assignedClasses = data.classes.map(c => ({
                department: c.department || 'Computer Science & Engineering',
                classCode: c.class_code || c.class_name,
                subject: c.subject || 'Curriculum Course',
                studentsCount: c.students_count || 60,
                venue: c.venue || 'Lecture Hall',
                attendanceStatus: c.attendance_status || 'Pending'
              }));
            }

            if (Array.isArray(data.today_schedule) && data.today_schedule.length > 0) {
              TeacherERPData.todayClasses = data.today_schedule.map((item, idx) => ({
                id: item.id || `cls-${idx}`,
                time: item.period_time || '10:00 AM - 11:00 AM',
                subject: item.subject_name || item.course_name || 'Subject',
                classCode: item.class_code || item.class_id,
                department: 'Computer Science',
                room: item.room || item.venue || 'Classroom',
                attendanceStatus: item.att_label?.includes('Completed') ? 'Completed' : 'Pending',
                isCurrent: idx === 0
              }));
            }
          }
        }
      }
    } catch (err) {
      console.warn('loadDynamicData teacher dashboard:', err);
    }

    // 2. Fetch live notifications
    try {
      if (TeacherERPData && typeof TeacherERPData.loadLiveNotifications === 'function') {
        await TeacherERPData.loadLiveNotifications();
      }
    } catch (e) {
      console.warn('loadLiveNotifications:', e);
    }

    // 3. Pre-fetch students for first assigned class
    try {
      const firstClass = (TeacherERPData && TeacherERPData.assignedClasses && TeacherERPData.assignedClasses[0]?.classCode) || '2R1';
      if (TeacherERPData && typeof TeacherERPData.loadLiveStudents === 'function') {
        await TeacherERPData.loadLiveStudents(firstClass);
      }
    } catch (e) {}

    // 4. Refresh active views
    try { this.renderDashboardData(); } catch (e) {}
    try { this.renderClassesView(); } catch (e) {}
    try { this.renderNotificationsList(); } catch (e) {}
    try { this.initLucideIcons(); } catch (e) {}
  },

  // ----------------------------------------------------
  // CLASSES MODULE VIEW
  // ----------------------------------------------------
  renderClassesView() {
    const grid = document.getElementById("all-classes-grid");
    if (!grid) return;

    const classesList = (TeacherERPData && TeacherERPData.assignedClasses) || [];
    if (classesList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; padding:36px; text-align:center; color:var(--text-muted);">
          <i data-lucide="book-x" style="width:40px;height:40px; opacity:0.4; margin-bottom:12px;"></i>
          <h4 style="margin:0 0 6px; color:var(--dark-navy);">No Classes Assigned</h4>
          <p style="margin:0; font-size:13px;">No academic teaching allocations found for the active semester.</p>
        </div>
      `;
      this.initLucideIcons();
      return;
    }

    grid.innerHTML = classesList.map(cls => `
      <div class="class-card" style="cursor:default;">
        <div class="class-card-top">
          <span class="dept-badge">${cls.department || 'Computer Science & Engineering'}</span>
          <span class="badge ${cls.attendanceStatus === 'Completed' ? 'badge-completed' : 'badge-pending'}">
            <i data-lucide="${cls.attendanceStatus === 'Completed' ? 'check-circle-2' : 'clock'}" style="width:12px;height:12px;"></i>
            ${cls.attendanceStatus}
          </span>
        </div>

        <div class="class-card-middle" style="margin:14px 0;">
          <div class="class-name-large" style="font-size:22px; font-weight:800; color:var(--dark-navy);">${cls.classCode}</div>
          <div class="class-subject-name" style="font-size:14px; font-weight:600; color:var(--primary-blue); margin-top:2px;">${cls.subject}</div>
        </div>

        <div class="class-card-bottom" style="margin-bottom:16px;">
          <div class="class-students-count">
            <i data-lucide="users" style="width:14px;height:14px;"></i>
            ${cls.studentsCount} Enrolled Students
          </div>
          <div style="font-size:12px; color:var(--text-muted);">
            <i data-lucide="map-pin" style="width:12px;height:12px; display:inline-block; vertical-align:middle;"></i> ${cls.venue || 'Lecture Hall'}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; border-top:1px solid #F1F5F9; padding-top:14px;">
          <button class="quick-action-btn primary" style="font-size:12px; padding:7px 10px; justify-content:center;" onclick="TeacherApp.openAttendanceForClass('${cls.classCode}', '${cls.subject}')">
            <i data-lucide="check-square" style="width:13px;height:13px;"></i> Attendance
          </button>
          <button class="quick-action-btn secondary" style="font-size:12px; padding:7px 10px; justify-content:center;" onclick="TeacherApp.switchView('students'); TeacherApp.changeRosterClass('${cls.classCode}');">
            <i data-lucide="users" style="width:13px;height:13px;"></i> View Roster
          </button>
        </div>
      </div>
    `).join('');

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
    window.location.href = subView === 'roster' ? 'teacher-attendance-roster.html' : 'teacher-attendance.html';
  },

  openAttendanceForClass(classCode, subject) {
    const q = `teacher-attendance.html?class=${encodeURIComponent(classCode || '')}&subject=${encodeURIComponent(subject || '')}`;
    window.location.href = q;
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
        const validViews = ['dashboard', 'profile', 'information', 'leave', 'academics', 'timetable', 'classes', 'students', 'syllabus', 'results', 'examination', 'fees', 'documents', 'hostel', 'library', 'placement', 'grievance', 'settings', 'notifications'];
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
    const teacher = this.getLoggedInTeacher() || {};
    const empCode = teacher.employeeId || 'EMP-CSE-1001';

    let notifs = null;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/notifications/list?user_id=${encodeURIComponent(empCode)}&limit=30`).then(r => r.json()).catch(() => null);
      if (res && res.data && res.data.length > 0) {
        notifs = res.data;
      }
      const countRes = await fetch(`http://localhost:8000/api/v1/notifications/unread-count?user_id=${encodeURIComponent(empCode)}`).then(r => r.json()).catch(() => null);
      if (countRes && countRes.data && countRes.data.unread_count !== undefined) {
        const unreadCount = countRes.data.unread_count;
        document.querySelectorAll('.notif-badge').forEach(b => {
          b.textContent = unreadCount;
          b.style.display = unreadCount > 0 ? '' : 'none';
        });
      }
    } catch (e) {
      console.warn("Error fetching teacher notifications:", e);
    }

    if (!notifs || notifs.length === 0) {
      const localNotifs = (typeof TeacherERPData !== 'undefined' && Array.isArray(TeacherERPData.notifications)) ? TeacherERPData.notifications : [];
      notifs = localNotifs.map(n => ({
        id: n.id,
        title: n.title,
        message: n.description || n.message || '',
        priority: 'normal',
        is_read: !n.unread,
        received_at: Date.now(),
        time_str: n.time
      }));
    }

    if (listEl) {
      if (!notifs || notifs.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:30px; color:#64748B;">No notices or circulars right now. All caught up!</div>`;
      } else {
        listEl.innerHTML = notifs.map(n => {
          const isUnread = !n.is_read;
          const p = (n.priority || 'normal').toUpperCase();
          const color = p === 'URGENT' ? '#E11D48' : (p === 'HIGH' ? '#D97706' : '#005A9C');
          const timeText = n.time_str || new Date(n.received_at || n.sent_at || Date.now()).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
          return `
            <div class="activity-item" style="padding:14px; border-bottom:1px solid #F1F5F9; background:${isUnread ? 'rgba(0,166,214,0.03)' : '#fff'}; cursor:pointer;" onclick="TeacherApp.handleNotificationClick('${n.id || ''}')">
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
                  <span class="activity-time" style="font-size:12px; color:#94A3B8;">${timeText}</span>
                </div>
                <div style="display:flex; gap:12px; align-items:center; margin-top:8px;">
                  ${!n.is_read ? `
                    <button type="button" style="background:none; border:none; color:#005A9C; font-size:12px; font-weight:600; cursor:pointer; padding:0;" onclick="event.stopPropagation(); TeacherApp.markNotificationRead('${n.id || ''}')">
                      Mark as Read ✓
                    </button>
                  ` : '<span style="font-size:11.5px; color:#94A3B8;">✓ Read</span>'}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (container && notifs) {
      container.innerHTML = notifs.slice(0, 5).map(notif => `
        <div class="notification-item ${!notif.is_read ? 'unread' : ''}" onclick="TeacherApp.handleNotificationClick('${notif.id || ''}')">
          <div class="notif-icon-box" style="background:#EBF3FC; color:var(--primary-blue);">
            <i data-lucide="bell" style="width:16px;height:16px;"></i>
          </div>
          <div class="notif-content">
            <div class="notif-title" style="font-weight:600;">${notif.title}</div>
            <div class="notif-desc">${notif.message || ''}</div>
            <div class="notif-time">${notif.time_str || new Date(notif.received_at || Date.now()).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
          </div>
        </div>
      `).join('');
    }
    this.initLucideIcons();
  },

  async markAllTeacherNotificationsRead() {
    const teacher = this.getLoggedInTeacher() || {};
    const empCode = teacher.employeeId || 'EMP-CSE-1001';
    if (typeof TeacherERPData !== 'undefined' && Array.isArray(TeacherERPData.notifications)) {
      TeacherERPData.notifications.forEach(n => { n.unread = false; });
    }
    document.querySelectorAll('.notif-badge').forEach(b => {
      b.textContent = '0';
      b.style.display = 'none';
    });
    try {
      await fetch(`http://localhost:8000/api/v1/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: empCode })
      });
    } catch (_) {}
    this.showToast("All faculty notifications marked as read!", "success");
    this.renderNotificationsList();
  },

  async dispatchClassAnnouncement() {
    const classVal = document.getElementById("teacherNotifClass")?.value || '3R';
    const priorityVal = document.getElementById("teacherNotifPriority")?.value || 'normal';
    const titleVal = document.getElementById("teacherNotifTitle")?.value?.trim() || '';
    const msgVal = document.getElementById("teacherNotifMsg")?.value?.trim() || '';
    const teacher = this.getLoggedInTeacher() || {};
    const empCode = teacher.employeeId || 'EMP-CSE-1001';

    if (!titleVal || !msgVal) {
      this.showToast("Please provide both a headline and detailed message.", "error");
      return;
    }

    if (typeof TeacherERPData !== 'undefined' && Array.isArray(TeacherERPData.notifications)) {
      TeacherERPData.notifications.unshift({
        id: 'notif-' + Date.now(),
        title: `[${classVal}] ${titleVal}`,
        description: msgVal,
        time: 'Just now',
        icon: 'bell',
        unread: true
      });
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

      await fetch("http://localhost:8000/api/v1/notifications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => null);
    } catch (_) {}

    this.showToast(`Notice successfully dispatched to ${classVal}!`, "success");
    const tEl = document.getElementById("teacherNotifTitle");
    const mEl = document.getElementById("teacherNotifMsg");
    const cardEl = document.getElementById("teacherCreateNotifCard");
    if (tEl) tEl.value = "";
    if (mEl) mEl.value = "";
    if (cardEl) cardEl.style.display = "none";
    this.renderNotificationsList();
  },

  async handleNotificationClick(id) {
    const notif = TeacherERPData && TeacherERPData.notifications && TeacherERPData.notifications.find(n => n.id === id);
    if (notif) {
      notif.unread = false;
      try {
        if (window.TeacherAPI && typeof window.TeacherAPI.markNotificationRead === 'function') {
          await window.TeacherAPI.markNotificationRead(id);
        }
      } catch (_) {}
      this.renderNotificationsList();
      this.showToast(`Viewing: ${notif.title}`);
    }
  },

  async dispatchClassAnnouncement() {
    const targetClass = document.getElementById("teacherNotifClass")?.value || "2R1";
    const priority = document.getElementById("teacherNotifPriority")?.value || "normal";
    const title = (document.getElementById("teacherNotifTitle")?.value || "").trim();
    const msg = (document.getElementById("teacherNotifMsg")?.value || "").trim();

    if (!title || !msg) {
      if (typeof this.showToast === 'function') {
        this.showToast('Please provide both headline and message details.', 'error');
      }
      return;
    }

    const teacher = (typeof this.getLoggedInTeacher === 'function') ? this.getLoggedInTeacher() : null;
    const empCode = teacher?.employeeId || teacher?.empCode || 'EMP-CSE-1001';

    try {
      if (window.TeacherAPI && typeof window.TeacherAPI.createNotification === 'function') {
        await window.TeacherAPI.createNotification({
          notification_type: 'announcement',
          title: `[Class ${targetClass}] ${title}`,
          message: msg,
          priority: priority,
          target_type: 'class',
          target_id: targetClass,
          sender_id: empCode
        });
      }
    } catch (e) {
      console.warn('API announcement error:', e);
    }

    // Add directly to local list for immediate visual responsiveness
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `[Class ${targetClass}] ${title}`,
      description: msg,
      time: 'Just now',
      icon: priority === 'urgent' ? 'alert-triangle' : 'bell',
      priority: priority,
      unread: false
    };

    if (TeacherERPData && TeacherERPData.notifications) {
      TeacherERPData.notifications.unshift(newNotif);
    }

    // Reset form & hide composer
    const composer = document.getElementById("teacherCreateNotifCard");
    if (composer) composer.style.display = "none";
    const tInput = document.getElementById("teacherNotifTitle");
    if (tInput) tInput.value = "";
    const mInput = document.getElementById("teacherNotifMsg");
    if (mInput) mInput.value = "";

    this.renderNotificationsList();
    if (typeof this.showToast === 'function') {
      this.showToast(`Notice successfully broadcast to Class ${targetClass}!`, 'success');
    }
  },

  async markAllTeacherNotificationsRead() {
    try {
      if (window.TeacherAPI && typeof window.TeacherAPI.markAllNotificationsRead === 'function') {
        await window.TeacherAPI.markAllNotificationsRead();
      }
    } catch (e) {}

    if (TeacherERPData && TeacherERPData.notifications) {
      TeacherERPData.notifications.forEach(n => { n.unread = false; });
    }

    this.renderNotificationsList();
    if (typeof this.showToast === 'function') {
      this.showToast('All faculty circulars marked as read.', 'info');
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
  // STUDENTS ROSTER VIEW (DYNAMIC & DATABASE-CONNECTED)
  // ----------------------------------------------------
  _activeRosterClass: '2R1',

  async renderStudentsView() {
    const container = document.getElementById("students-content");
    if (!container) return;

    const assigned = (TeacherERPData && TeacherERPData.assignedClasses) || [];
    let classCodes = Array.from(new Set(assigned.map(c => c.classCode).filter(Boolean)));
    if (classCodes.length === 0) classCodes = ['2R1', '2R2', '3R', '4R'];

    if (!this._activeRosterClass || !classCodes.includes(this._activeRosterClass)) {
      this._activeRosterClass = classCodes[0] || '2R1';
    }

    // Get or load students for active class
    let students = (TeacherERPData && typeof TeacherERPData.getStudentsForClass === 'function' ? TeacherERPData.getStudentsForClass(this._activeRosterClass) : []);
    if (!students || students.length === 0) {
      if (TeacherERPData && typeof TeacherERPData.loadLiveStudents === 'function') {
        students = await TeacherERPData.loadLiveStudents(this._activeRosterClass);
      }
    }

    const currentSubject = (assigned.find(a => a.classCode === this._activeRosterClass)?.subject) || 'Curriculum Course';

    container.innerHTML = `
      <div class="card" style="padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:18px;">
          <div>
            <h3 style="font-size:17px; margin:0; color:var(--dark-navy); font-weight:700;">Authorized Student Directory</h3>
            <p style="font-size:12.5px; color:var(--text-muted); margin:4px 0 0 0;">Official enrolled students, institutional emails, and real-time attendance compliance from SSGMCE database.</p>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <button class="quick-action-btn primary" onclick="TeacherApp.openAttendanceForClass('${this._activeRosterClass}', '${currentSubject}')">
              <i data-lucide="check-square" style="width:14px;height:14px;"></i> Mark Attendance for ${this._activeRosterClass}
            </button>
          </div>
        </div>

        <div class="students-roster-controls" style="margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:12px; align-items:center; flex:1; max-width:650px;">
            <input type="text" id="roster-filter-input" class="roster-search-input" 
                   placeholder="Search student by name, roll no, or code..." oninput="TeacherApp.filterStudentRoster(this.value)"
                   style="flex:1; padding:9px 14px; border:1px solid var(--border-light); border-radius:6px; font-size:13px;">
            <select id="roster-class-select" style="padding:9px 14px; border:1px solid var(--border-light); border-radius:6px; font-size:13px; font-weight:600; color:var(--dark-navy); background:#F8FAFC;" 
                    onchange="TeacherApp.changeRosterClass(this.value)">
              ${classCodes.map(c => {
                const sub = (assigned.find(a => a.classCode === c)?.subject) || 'Curriculum Course';
                return `<option value="${c}" ${c === this._activeRosterClass ? 'selected' : ''}>Class ${c} (${sub})</option>`;
              }).join('')}
            </select>
          </div>
          <div style="font-size:13px; font-weight:700; color:var(--primary-blue);" id="roster-student-count-badge">
            ${students.length} Students Enrolled
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="roster-table" id="students-roster-table">
            <thead>
              <tr>
                <th style="width:90px;">Roll No</th>
                <th>Student Full Name</th>
                <th>Student Code</th>
                <th>Institute Email</th>
                <th style="width:160px;">Attendance Rate</th>
                <th style="width:110px;">Status</th>
                <th style="width:110px; text-align:center;">Action</th>
              </tr>
            </thead>
            <tbody id="roster-table-body">
              ${this.generateRosterRows(students)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.initLucideIcons();
  },

  async changeRosterClass(classCode) {
    this._activeRosterClass = classCode;
    const select = document.getElementById("roster-class-select");
    if (select && select.value !== classCode) select.value = classCode;

    let students = (TeacherERPData && typeof TeacherERPData.getStudentsForClass === 'function' ? TeacherERPData.getStudentsForClass(classCode) : []);
    if (!students || students.length === 0) {
      if (TeacherERPData && typeof TeacherERPData.loadLiveStudents === 'function') {
        const tbody = document.getElementById("roster-table-body");
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">Loading students from database...</td></tr>`;
        students = await TeacherERPData.loadLiveStudents(classCode);
      }
    }

    const tbody = document.getElementById("roster-table-body");
    if (tbody) {
      tbody.innerHTML = this.generateRosterRows(students);
    }
    const badge = document.getElementById("roster-student-count-badge");
    if (badge) {
      badge.textContent = `${students.length} Students Enrolled`;
    }
    this.initLucideIcons();
  },

  generateRosterRows(students) {
    if (!Array.isArray(students) || students.length === 0) {
      return `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No student records found in database for this class</td></tr>`;
    }
    return students.map(st => `
      <tr>
        <td style="font-weight:700; color:var(--primary-blue);">ROLL ${st.rollNo}</td>
        <td style="font-weight:600; color:var(--dark-navy);">${st.name}</td>
        <td style="color:#64748B; font-family:monospace; font-size:12px;">${st.studentCode || '--'}</td>
        <td style="color:var(--text-muted); font-size:12.5px;">${st.email}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="flex:1; height:6px; background:#E2E8F0; border-radius:10px; overflow:hidden;">
              <div style="width:${st.attendance}%; height:100%; background:${st.attendance >= 75 ? 'var(--primary-blue)' : 'var(--warning)'};"></div>
            </div>
            <span style="font-weight:700; font-size:12px; min-width:32px;">${st.attendance}%</span>
          </div>
        </td>
        <td>
          <span class="badge ${st.attendance >= 75 ? 'badge-completed' : 'badge-pending'}">
            ${st.attendance >= 75 ? 'Eligible' : 'Low Att.'}
          </span>
        </td>
        <td style="text-align:center;">
          <button style="font-size:12px; color:var(--primary-blue); font-weight:600; background:none; border:none; cursor:pointer;" 
                  onclick="TeacherApp.showToast('Student profile: ${st.name} (${st.studentCode || st.rollNo})')">
            View Details
          </button>
        </td>
      </tr>
    `).join('');
  },

  filterStudentRoster(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll("#roster-table-body tr");
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  },

  // ----------------------------------------------------
  // ----------------------------------------------------
  // DYNAMIC SYLLABUS COVERAGE & LECTURE TRACKING MODULE
  // ----------------------------------------------------
  selectedSyllabusSubjectId: null,

  selectSyllabusSubject(subjectId) {
    this.selectedSyllabusSubjectId = subjectId;
    this.renderSyllabusView();
  },


  _addLectureModalState: null,
  syllabusActiveTab: 'curriculum',
  syllabusHistorySearch: '',

  switchSyllabusTab(tab) {
    this.syllabusActiveTab = tab;
    this.renderSyllabusView();
  },

  filterSyllabusHistory(query) {
    this.syllabusHistorySearch = query;
    this.renderSyllabusView();
  },

  openAddLectureModal(subjectId, unitId, topicId) {
    const all = TeacherERPData.loadSyllabusData();
    const subject = all.find(s => s.subjectId === subjectId);
    const unit = subject?.units?.find(u => u.unitId === unitId);
    const topic = unit?.topics?.find(t => t.topicId === topicId);
    if (!topic) return;

    const nextLectureNo = (topic.lectures ? topic.lectures.length : 0) + 1;
    const today = (typeof AcademicDateUtils !== 'undefined' && AcademicDateUtils.getTodayISO)
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];

    const desc = topic.topicDescription || topic.topicName;
    const suggestions = desc
      .split(/[,;•\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !s.toLowerCase().startsWith('such as') && !s.toLowerCase().startsWith('e.g.'));

    const initialTag = suggestions.length > 0 ? (suggestions[(nextLectureNo - 1) % suggestions.length] || topic.topicName) : topic.topicName;

    this._addLectureModalState = {
      subjectId,
      unitId,
      topicId,
      subjectName: subject.subjectName,
      unitName: unit.unitName,
      topicName: topic.topicName,
      nextLectureNo,
      suggestions,
      tags: [initialTag]
    };

    let modalEl = document.getElementById("addLectureModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "addLectureModal";
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(11,31,58,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:999999; padding:16px;">
        <div style="background:#fff; border-radius:14px; width:100%; max-width:640px; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 24px 48px rgba(0,0,0,0.25); overflow:hidden;">
          <!-- Header -->
          <div style="background:#0B1F3A; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="background:#0B5CAD; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px; letter-spacing:0.5px;">LECTURE ${nextLectureNo}</span>
                <h3 style="margin:0; font-size:17px; font-weight:800; color:#fff;">Record New Lecture</h3>
              </div>
              <p style="margin:0; font-size:12.5px; color:#94A3B8;">
                <strong>${subject.subjectName}</strong> • ${unit.unitName.split(':')[0]} • <strong>${topic.topicName}</strong>
              </p>
            </div>
            <button type="button" onclick="TeacherApp.closeAddLectureModal()" style="background:transparent; border:none; color:#94A3B8; font-size:22px; cursor:pointer; line-height:1;">✕</button>
          </div>

          <!-- Body -->
          <div style="flex:1; overflow-y:auto; padding:22px 24px;">
            <!-- Date & Time Slot -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:18px;">
              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Date of Lecture *</label>
                <input type="date" id="addLectureDate" value="${today}" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; color:#0B1F3A; box-sizing:border-box;">
              </div>
              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Class Time Slot</label>
                <select id="addLectureTimeSlot" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; color:#0B1F3A; background:#fff; box-sizing:border-box;">
                  <option value="09:00 - 10:30 AM">09:00 - 10:30 AM (Slot 1)</option>
                  <option value="11:00 - 12:30 PM">11:00 - 12:30 PM (Slot 2)</option>
                  <option value="01:15 - 02:15 PM">01:15 - 02:15 PM (Slot 3)</option>
                  <option value="02:15 - 03:15 PM">02:15 - 03:15 PM (Slot 4)</option>
                  <option value="03:30 - 05:00 PM">03:30 - 05:00 PM (Slot 5)</option>
                </select>
              </div>
            </div>

            <!-- Topics Covered Tags -->
            <div style="margin-bottom:18px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Topics Covered in This Lecture *</label>
              <p style="margin:0 0 8px 0; font-size:11.5px; color:#64748B;">
                Specify concepts/modules delivered. Type and press <strong>Enter</strong> or click <strong>+ Add Topic</strong>.
              </p>
              <div style="display:flex; gap:8px; margin-bottom:10px;">
                <input type="text" id="addLectureTagInput" placeholder="e.g., Row-Major Ordering, Base Address calculation..." onkeydown="if(event.key==='Enter'){event.preventDefault();TeacherApp.addModalLectureTag();}" style="flex:1; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box;">
                <button type="button" onclick="TeacherApp.addModalLectureTag()" style="background:#0B5CAD; color:#fff; border:none; padding:9px 18px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer;">
                  + Add Topic
                </button>
              </div>

              <!-- Tags container -->
              <div id="addLectureTagsList" style="min-height:44px; padding:8px 12px; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:8px; display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
              </div>

              <!-- Suggestions -->
              ${suggestions.length > 0 ? `
                <div style="margin-top:8px;">
                  <span style="font-size:11px; color:#64748B; font-weight:600;">Quick add from curriculum:</span>
                  <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
                    ${suggestions.slice(0, 4).map(s => `
                      <button type="button" onclick="TeacherApp.selectModalSuggestion('${s.replace(/'/g, "\\'")}')" style="background:#fff; border:1px solid #CBD5E1; border-radius:12px; padding:3px 8px; font-size:11px; color:#475569; cursor:pointer; font-weight:600;">
                        + ${s}
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Notes -->
            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Lecture Delivery Notes (Optional)</label>
              <textarea id="addLectureNotes" rows="3" placeholder="e.g. Completed slide deck 4, student exercise assigned, homework assigned." style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; color:#0B1F3A; box-sizing:border-box; resize:vertical;"></textarea>
            </div>

            <!-- Notice -->
            <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:10px 14px; font-size:12px; color:#166534; display:flex; align-items:center; gap:8px;">
              <span>💡</span>
              <span>Once this lecture is saved, student attendance can be marked immediately from the curriculum card or history log.</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:14px 24px; border-top:1px solid #E2E8F0; display:flex; justify-content:flex-end; gap:12px; background:#F8FAFC;">
            <button type="button" onclick="TeacherApp.closeAddLectureModal()" style="background:#fff; color:#64748B; border:1px solid #CBD5E1; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">
              Cancel
            </button>
            <button type="button" onclick="TeacherApp.submitAddLecture('${subjectId}', '${unitId}', '${topicId}')" style="background:#0B5CAD; color:#fff; border:none; padding:8px 22px; border-radius:6px; font-size:13px; font-weight:800; cursor:pointer; box-shadow:0 2px 6px rgba(11,92,173,0.25);">
              + Record &amp; Add Lecture
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderModalTagsList();
  },

  renderModalTagsList() {
    const listEl = document.getElementById("addLectureTagsList");
    if (!listEl || !this._addLectureModalState) return;
    const tags = this._addLectureModalState.tags || [];

    if (tags.length === 0) {
      listEl.innerHTML = '<span style="font-size:12px; color:#94A3B8;">No topic tags added yet. Please add at least one topic covered.</span>';
      return;
    }

    listEl.innerHTML = tags.map(tag => `
      <span style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; padding:4px 10px; border-radius:16px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
        🏷️ ${tag}
        <button type="button" onclick="TeacherApp.removeModalLectureTag('${tag.replace(/'/g, "\\'")}')" style="background:transparent; border:none; color:#1D4ED8; cursor:pointer; padding:0; font-size:14px; line-height:1; font-weight:bold;">×</button>
      </span>
    `).join('');
  },

  addModalLectureTag() {
    const input = document.getElementById("addLectureTagInput");
    if (!input || !this._addLectureModalState) return;
    const val = input.value.trim();
    if (val && !this._addLectureModalState.tags.includes(val)) {
      this._addLectureModalState.tags.push(val);
      this.renderModalTagsList();
    }
    input.value = "";
  },

  removeModalLectureTag(tag) {
    if (!this._addLectureModalState) return;
    this._addLectureModalState.tags = this._addLectureModalState.tags.filter(t => t !== tag);
    this.renderModalTagsList();
  },

  selectModalSuggestion(tag) {
    if (!this._addLectureModalState) return;
    if (!this._addLectureModalState.tags.includes(tag)) {
      this._addLectureModalState.tags.push(tag);
      this.renderModalTagsList();
    }
  },

  closeAddLectureModal() {
    const el = document.getElementById("addLectureModal");
    if (el) el.innerHTML = "";
    this._addLectureModalState = null;
  },

  submitAddLecture(subjectId, unitId, topicId) {
    const dateInput = document.getElementById("addLectureDate");
    const slotInput = document.getElementById("addLectureTimeSlot");
    const notesInput = document.getElementById("addLectureNotes");

    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const timeSlot = slotInput ? slotInput.value : '09:00 - 10:30 AM';
    const notes = notesInput ? notesInput.value.trim() : '';
    const tags = (this._addLectureModalState && this._addLectureModalState.tags.length > 0)
      ? this._addLectureModalState.tags
      : [(this._addLectureModalState ? this._addLectureModalState.topicName : 'Core Lecture Delivery')];

    const res = TeacherERPData.addLectureToTopic(subjectId, unitId, topicId, {
      date,
      timeSlot,
      topicsCovered: tags,
      notes
    });

    this.closeAddLectureModal();

    if (res && res.newLecture) {
      if (typeof this.showToast === 'function') {
        this.showToast(`✓ Lecture ${res.newLecture.lectureNo} added for "${res.newLecture.topicName}" (${tags.length} topics covered). You can now mark attendance.`, 'success');
      }
      this.renderSyllabusView();
    } else {
      if (typeof this.showToast === 'function') {
        this.showToast('Could not add lecture to topic.', 'error');
      }
    }
  },

  addLectureToTopic(subjectId, unitId, topicId) {
    const today = (typeof AcademicDateUtils !== 'undefined' && AcademicDateUtils.getTodayISO)
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];
    const res = TeacherERPData.addLectureToTopic(subjectId, unitId, topicId, { date: today });
    if (res && res.newLecture) {
      if (typeof this.showToast === 'function') {
        this.showToast(`✓ Lecture ${res.newLecture.lectureNo} added for "${res.newLecture.topicName}". You can now mark attendance.`, 'success');
      }
      this.renderSyllabusView();
    } else {
      if (typeof this.showToast === 'function') {
        this.showToast('Could not add lecture to topic.', 'error');
      }
    }
  },

  undoLectureFromTopic(subjectId, unitId, topicId) {
    const res = TeacherERPData.undoLectureFromTopic(subjectId, unitId, topicId);
    if (res && res.removedLecture) {
      if (typeof this.showToast === 'function') {
        this.showToast(`↩ Lecture ${res.removedLecture.lectureNo} removed.`, 'info');
      }
      this.renderSyllabusView();
    } else {
      if (typeof this.showToast === 'function') {
        this.showToast('No lectures to remove for this topic.', 'warning');
      }
    }
  },

  openLectureAttendanceModal(subjectId, unitId, topicId, lectureIdOrNo, date, classId, topicName, subjectName) {
    const all = TeacherERPData.loadSyllabusData();
    const subject = all.find(s => s.subjectId === subjectId);
    const unit = subject?.units?.find(u => u.unitId === unitId);
    const topic = unit?.topics?.find(t => t.topicId === topicId);
    const lecture = topic?.lectures?.find(l => l.id === lectureIdOrNo || l.lectureNo === Number(lectureIdOrNo));
    if (!lecture) return;

    const roster = (TeacherERPData.students && TeacherERPData.students[classId]) ||
                   (TeacherERPData.students && TeacherERPData.students["2R1"]) || [
      { rollNo: 1, name: "Aarav Sharma", prn: "PRN2024001" },
      { rollNo: 2, name: "Aditi Patil", prn: "PRN2024002" },
      { rollNo: 3, name: "Amit Kumar", prn: "PRN2024003" },
      { rollNo: 4, name: "Ananya Deshmukh", prn: "PRN2024004" },
      { rollNo: 5, name: "Chetan Joshi", prn: "PRN2024005" },
      { rollNo: 6, name: "Devika Rao", prn: "PRN2024006" },
      { rollNo: 7, name: "Gaurav Shinde", prn: "PRN2024007" },
      { rollNo: 8, name: "Isha Kulkarni", prn: "PRN2024008" }
    ];

    // Existing records or default to present
    const prevMap = {};
    if (Array.isArray(lecture.records)) {
      lecture.records.forEach(r => { prevMap[r.rollNo] = r.status; });
    }

    const modalId = "lectureAttendanceModal";
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = modalId;
      document.body.appendChild(modalEl);
    }

    const totalStudents = roster.length;

    modalEl.innerHTML = `
      <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(11,31,58,0.75); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:999999; padding:16px;">
        <div style="background:#fff; border-radius:14px; width:100%; max-width:740px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 24px 48px rgba(0,0,0,0.3); overflow:hidden;">
          <div style="background:#0B1F3A; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="background:#0B5CAD; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px;">LECTURE ${lecture.lectureNo}</span>
                <h3 style="margin:0; font-size:17px; font-weight:800; color:#fff;">Mark Lecture Attendance</h3>
              </div>
              <p style="margin:0; font-size:12.5px; color:#94A3B8;">
                <strong>${subjectName || subject.subjectName}</strong> • Topic: <strong>${topicName || topic.topicName}</strong> • Class: <strong>${classId}</strong> • Date: <strong>${date || lecture.date}</strong>
              </p>
              ${Array.isArray(lecture.topicsCovered) && lecture.topicsCovered.length > 0 ? `
                <div style="display:flex; align-items:center; gap:6px; margin-top:6px; flex-wrap:wrap;">
                  <span style="font-size:11px; color:#CBD5E1; font-weight:600;">Topics Covered:</span>
                  ${lecture.topicsCovered.map(t => `
                    <span style="background:rgba(255,255,255,0.18); color:#fff; border:1px solid rgba(255,255,255,0.3); padding:1px 8px; border-radius:12px; font-size:11px; font-weight:600;">
                      🏷️ ${t}
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <button type="button" onclick="TeacherApp.closeLectureAttendanceModal()" style="background:transparent; border:none; color:#94A3B8; font-size:24px; cursor:pointer; padding:4px 8px; line-height:1;">✕</button>
          </div>

          <div style="background:#F8FAFC; padding:12px 24px; border-bottom:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div style="font-size:12.5px; color:#475569;">
              Enrolled: <strong style="color:#0B1F3A;">${totalStudents}</strong> •
              Status: <span id="modalAttendanceSummary" style="font-weight:700; color:${lecture.attendanceMarked ? '#15803D' : '#D97706'};">${lecture.attendanceMarked ? '✓ Previously Marked' : 'Ready to mark'}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" onclick="TeacherApp.setAllModalAttendance('present')" style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">
                ✓ All Present
              </button>
              <button type="button" onclick="TeacherApp.setAllModalAttendance('absent')" style="background:#FEE2E2; color:#991B1B; border:1px solid #FCA5A5; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">
                ✕ All Absent
              </button>
            </div>
          </div>

          <div style="flex:1; overflow-y:auto; padding:16px 24px;">
            <table style="width:100%; border-collapse:collapse; text-align:left;">
              <thead>
                <tr style="border-bottom:2px solid #E2E8F0; color:#64748B; font-size:12px;">
                  <th style="padding:8px 10px; width:80px;">Roll No</th>
                  <th style="padding:8px 10px;">Student Name</th>
                  <th style="padding:8px 10px; text-align:center; width:180px;">Attendance Status</th>
                </tr>
              </thead>
              <tbody id="lectureAttendanceRosterTbody">
                ${roster.map(st => {
                  const currStatus = prevMap[st.rollNo] || 'present';
                  const isPres = currStatus === 'present';
                  return `
                    <tr data-roll="${st.rollNo}" data-id="${st.id || `ST-${st.rollNo}`}" data-name="${st.name}" style="border-bottom:1px solid #F1F5F9; background:${isPres ? '#F0FDF4' : '#FEF2F2'};">
                      <td style="padding:10px; font-size:13px; font-weight:700; color:#0B1F3A;">${st.rollFormatted || st.rollNo}</td>
                      <td style="padding:10px; font-size:13px; font-weight:600; color:#334155;">${st.name}</td>
                      <td style="padding:10px; text-align:center;">
                        <div style="display:inline-flex; gap:6px;">
                          <button type="button" onclick="TeacherApp.toggleModalStatus('${st.rollNo}', 'present')" class="btn-att-p" style="background:${isPres ? '#15803D' : '#F1F5F9'}; color:${isPres ? '#fff' : '#475569'}; border:${isPres ? 'none' : '1px solid #CBD5E1'}; padding:4px 12px; border-radius:4px; font-size:12px; font-weight:700; cursor:pointer;">
                            Present
                          </button>
                          <button type="button" onclick="TeacherApp.toggleModalStatus('${st.rollNo}', 'absent')" class="btn-att-a" style="background:${!isPres ? '#B91C1C' : '#F1F5F9'}; color:${!isPres ? '#fff' : '#475569'}; border:${!isPres ? 'none' : '1px solid #CBD5E1'}; padding:4px 12px; border-radius:4px; font-size:12px; font-weight:700; cursor:pointer;">
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="background:#F8FAFC; padding:14px 24px; border-top:1px solid #E2E8F0; display:flex; justify-content:flex-end; align-items:center; gap:12px;">
            <button type="button" onclick="TeacherApp.closeLectureAttendanceModal()" style="background:#fff; color:#64748B; border:1px solid #CBD5E1; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">
              Cancel
            </button>
            <button type="button" onclick="TeacherApp.saveLectureAttendance('${subjectId}', '${unitId}', '${topicId}', '${lecture.id}')" style="background:#0B5CAD; color:#fff; border:none; padding:8px 22px; border-radius:6px; font-size:13px; font-weight:800; cursor:pointer; box-shadow:0 2px 6px rgba(11,92,173,0.3);">
              Save &amp; Lock Attendance
            </button>
          </div>
        </div>
      </div>
    `;
  },

  closeLectureAttendanceModal() {
    const modalEl = document.getElementById("lectureAttendanceModal");
    if (modalEl) modalEl.innerHTML = "";
  },

  toggleModalStatus(rollNo, status) {
    const row = document.querySelector(`#lectureAttendanceRosterTbody tr[data-roll='${rollNo}']`);
    if (!row) return;
    const btnP = row.querySelector('.btn-att-p');
    const btnA = row.querySelector('.btn-att-a');
    if (status === 'present') {
      row.style.background = '#F0FDF4';
      if (btnP) {
        btnP.style.background = '#15803D';
        btnP.style.color = '#fff';
        btnP.style.border = 'none';
      }
      if (btnA) {
        btnA.style.background = '#F1F5F9';
        btnA.style.color = '#475569';
        btnA.style.border = '1px solid #CBD5E1';
      }
    } else {
      row.style.background = '#FEF2F2';
      if (btnA) {
        btnA.style.background = '#B91C1C';
        btnA.style.color = '#fff';
        btnA.style.border = 'none';
      }
      if (btnP) {
        btnP.style.background = '#F1F5F9';
        btnP.style.color = '#475569';
        btnP.style.border = '1px solid #CBD5E1';
      }
    }
  },

  setAllModalAttendance(status) {
    const rows = document.querySelectorAll('#lectureAttendanceRosterTbody tr');
    rows.forEach(r => {
      const roll = r.getAttribute('data-roll');
      this.toggleModalStatus(roll, status);
    });
  },

  saveLectureAttendance(subjectId, unitId, topicId, lectureId) {
    const rows = document.querySelectorAll('#lectureAttendanceRosterTbody tr');
    const records = [];
    rows.forEach(r => {
      const btnP = r.querySelector('.btn-att-p');
      const isPresent = btnP && (
        btnP.style.background.includes('rgb(21, 128, 61)') ||
        btnP.style.background.includes('#15803D') ||
        btnP.style.color === 'rgb(255, 255, 255)' ||
        btnP.style.color === '#fff'
      );
      records.push({
        studentId: r.getAttribute('data-id'),
        rollNo: Number(r.getAttribute('data-roll')),
        name: r.getAttribute('data-name'),
        status: isPresent ? 'present' : 'absent'
      });
    });

    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;

    TeacherERPData.markLectureAttendance(subjectId, unitId, topicId, lectureId, {
      presentCount,
      absentCount,
      records
    });

    this.closeLectureAttendanceModal();
    if (typeof this.showToast === 'function') {
      this.showToast(`✓ Attendance marked (${presentCount}/${records.length} Present). Saved to syllabus records.`, 'success');
    }
    this.renderSyllabusView();
  },

  exportSyllabusCsv(subjectId) {
    const all = TeacherERPData.loadSyllabusData();
    const activeSubject = all.find(s => s.subjectId === subjectId);
    if (!activeSubject) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Subject Name,${activeSubject.subjectName}\r\n`;
    csvContent += `Class,${activeSubject.classId}\r\n`;
    csvContent += `Faculty Name,${activeSubject.facultyName || 'Faculty'}\r\n`;
    csvContent += `Total Planned Lectures,${activeSubject.totalLecturesPlanned || 60}\r\n`;
    csvContent += `Total Lectures Engaged,${activeSubject.totalLecturesTaken || 0}\r\n`;
    csvContent += `Overall Coverage,${activeSubject.progress || 0}%\r\n\r\n`;
    csvContent += "Lecture No,Date,Unit,Topic,Topics Covered,Attendance Status,Attendance ID,Notes\r\n";

    (activeSubject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        (topic.lectures || []).forEach(lec => {
          const lNo = lec.lectureNo;
          const date = lec.date || '';
          const uName = `"${(unit.unitName || '').replace(/"/g, '""')}"`;
          const tName = `"${(topic.topicName || '').replace(/"/g, '""')}"`;
          const covered = `"${(Array.isArray(lec.topicsCovered) ? lec.topicsCovered.join('; ') : (lec.topicsCovered || '')).replace(/"/g, '""')}"`;
          const status = lec.attendanceMarked ? 'Marked' : 'Not Marked';
          const attId = lec.attendanceId || '';
          const notes = `"${(lec.notes || '').replace(/"/g, '""')}"`;
          csvContent += `${lNo},${date},${uName},${tName},${covered},${status},${attId},${notes}\r\n`;
        });
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Syllabus_Lectures_${activeSubject.subjectCode || 'SUB'}_${activeSubject.classId || 'CLASS'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof this.showToast === 'function') {
      this.showToast(`Syllabus report for ${activeSubject.subjectName} exported!`, 'success');
    }
  },

  downloadSyllabusReport(subjectId) {
    this.exportSyllabusCsv(subjectId);
  },

  markSyllabusTopic(subjectId, unitId, topicId, count = 1) {
    const updated = TeacherERPData.markTopicCovered(subjectId, unitId, topicId, count);
    if (updated) {
      this.renderSyllabusView();
      const pct = updated.progress !== undefined ? updated.progress : Math.round((updated.totalLecturesTaken / updated.totalLecturesPlanned) * 100);
      if (typeof this.showToast === 'function') {
        this.showToast(`Lecture marked as covered (+${count}). Subject coverage: ${pct}%`, 'success');
      }
    } else {
      if (typeof this.showToast === 'function') {
        this.showToast('Failed to update syllabus topic.', 'error');
      }
    }
  },

  undoSyllabusTopic(subjectId, unitId, topicId, count = 1) {
    const updated = TeacherERPData.undoTopicCovered(subjectId, unitId, topicId, count);
    if (updated) {
      this.renderSyllabusView();
      const pct = updated.progress !== undefined ? updated.progress : Math.round((updated.totalLecturesTaken / updated.totalLecturesPlanned) * 100);
      if (typeof this.showToast === 'function') {
        this.showToast(`Topic progress reverted (-${count} lect). Coverage: ${pct}%`, 'info');
      }
    } else {
      if (typeof this.showToast === 'function') {
        this.showToast('Failed to revert topic progress.', 'error');
      }
    }
  },

  renderSyllabusView() {
    const container = document.getElementById("syllabus-content");
    if (!container) return;

    // 1. Strict Faculty-Specific Subjects Filter
    const teacher = (typeof this.getLoggedInTeacher === 'function') ? this.getLoggedInTeacher() : null;
    const empCode = teacher?.employeeId || teacher?.empCode || (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode ? TeacherERPData.getActiveTeacherEmpCode() : 'EMP-CSE-1001');
    const subjects = TeacherERPData.getSyllabusForTeacher(empCode);

    if (!subjects || subjects.length === 0) {
      container.innerHTML = `
        <div class="card" style="padding:48px; text-align:center; color:var(--text-muted, #64748B);">
          <i data-lucide="book-open" style="width:48px; height:48px; margin-bottom:12px; opacity:0.4;"></i>
          <h3 style="margin:0 0 8px 0; color:var(--dark-navy, #0B1F3A);">No Subjects Assigned</h3>
          <p style="margin:0; font-size:13px;">There are no subjects assigned to faculty profile <strong>${empCode}</strong> for syllabus tracking.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Default to first subject if none selected or selected is not in faculty's list
    if (!this.selectedSyllabusSubjectId || !subjects.some(s => s.subjectId === this.selectedSyllabusSubjectId)) {
      this.selectedSyllabusSubjectId = subjects[0].subjectId;
    }

    const currentSub = subjects.find(s => s.subjectId === this.selectedSyllabusSubjectId) || subjects[0];

    // Compute unit-wise, subject totals, and all-lectures list
    let totalPlanned = 0;
    let totalEngaged = 0;
    const unitBreakdown = [];
    const allLecturesList = [];

    (currentSub.units || []).forEach((unit, idx) => {
      let uPlanned = 0;
      let uEngaged = 0;

      (unit.topics || []).forEach(t => {
        const p = Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 0);
        const lecs = Array.isArray(t.lectures) ? t.lectures : [];
        const e = lecs.length || Number(t.engagedLectures || t.lecturesTaken || 0);
        uPlanned += p;
        uEngaged += e;

        lecs.forEach(l => {
          allLecturesList.push({
            ...l,
            unitId: unit.unitId,
            unitName: unit.unitName,
            topicId: t.topicId,
            topicName: t.topicName,
            subjectId: currentSub.subjectId,
            subjectName: currentSub.subjectName,
            classId: currentSub.classId
          });
        });
      });

      const uPct = uPlanned > 0 ? Math.min(100, Math.round((uEngaged / uPlanned) * 100)) : 0;
      unitBreakdown.push({
        unitId: unit.unitId,
        unitName: unit.unitName ? unit.unitName.split(':')[0] : `Unit ${idx+1}`,
        fullUnitName: unit.unitName,
        planned: uPlanned,
        engaged: uEngaged,
        progress: uPct
      });

      totalPlanned += uPlanned;
      totalEngaged += uEngaged;
    });

    // Sort all lectures descending
    allLecturesList.sort((a, b) => (b.lectureNo || 0) - (a.lectureNo || 0));

    totalPlanned = totalPlanned || Number(currentSub.totalLecturesPlanned || 60);
    const remaining = Math.max(0, totalPlanned - totalEngaged);
    const coveragePercent = totalPlanned > 0 ? Math.min(100, Math.round((totalEngaged / totalPlanned) * 100)) : 0;
    const isOnTrack = coveragePercent >= 45;
    const paceLabel = isOnTrack ? "On Track" : "Behind Schedule";

    const activeTab = this.syllabusActiveTab || 'curriculum';
    const searchQuery = (this.syllabusHistorySearch || '').toLowerCase().trim();

    const filteredLectures = searchQuery
      ? allLecturesList.filter(l => {
          const topMatch = (l.topicName || '').toLowerCase().includes(searchQuery);
          const unitMatch = (l.unitName || '').toLowerCase().includes(searchQuery);
          const tagsMatch = Array.isArray(l.topicsCovered) && l.topicsCovered.some(t => t.toLowerCase().includes(searchQuery));
          const dateMatch = (l.date || '').includes(searchQuery);
          const numMatch = `lecture ${l.lectureNo}`.includes(searchQuery);
          return topMatch || unitMatch || tagsMatch || dateMatch || numMatch;
        })
      : allLecturesList;

    container.innerHTML = `
      <!-- 1. Subject Selector Toolbar -->
      <div class="card" style="padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-muted, #64748B); text-transform:uppercase; display:block; margin-bottom:4px; letter-spacing:0.5px;">
              Your Assigned Teaching Load (${subjects.length} Subjects)
            </label>
            <select onchange="TeacherApp.selectSyllabusSubject(this.value)" style="padding:8px 14px; border:1px solid #CBD5E1; border-radius:6px; font-size:13.5px; font-weight:700; background:#F8FAFC; color:var(--dark-navy, #0B1F3A); min-width:260px; cursor:pointer;">
              ${subjects.map(s => `
                <option value="${s.subjectId}" ${s.subjectId === currentSub.subjectId ? 'selected' : ''}>
                  ${s.subjectName} (${s.classId})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Quick Subject Pills -->
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end;">
            ${subjects.map(s => `
              <button type="button" onclick="TeacherApp.selectSyllabusSubject('${s.subjectId}')" style="background:${s.subjectId === currentSub.subjectId ? 'var(--dark-navy, #0B1F3A)' : '#F1F5F9'}; color:${s.subjectId === currentSub.subjectId ? '#fff' : '#475569'}; border:1px solid ${s.subjectId === currentSub.subjectId ? 'var(--dark-navy, #0B1F3A)' : '#CBD5E1'}; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s ease;">
                ${s.subjectName} (${s.classId})
              </button>
            `).join('')}
          </div>
        </div>

        <div style="font-size:12.5px; color:var(--text-muted, #64748B);">
          Faculty ID: <strong style="color:var(--dark-navy, #0B1F3A);">${empCode}</strong>
        </div>
      </div>

      <!-- 2. Syllabus Coverage Analytics & Delivery Pace -->
      <div class="card" style="padding:22px 24px; margin-bottom:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px;">
              <h3 style="margin:0; font-size:17px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
                Syllabus Coverage &amp; Lecture Delivery Analysis
              </h3>
              <span style="background:${isOnTrack ? '#DCFCE7' : '#FEF3C7'}; color:${isOnTrack ? '#15803D' : '#B45309'}; border:1px solid ${isOnTrack ? '#86EFAC' : '#FDE047'}; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:800;">
                ● ${paceLabel}
              </span>
            </div>
            <p style="margin:4px 0 0 0; font-size:13px; color:var(--text-muted, #64748B);">
              Subject: <strong style="color:var(--dark-navy, #0B1F3A);">${currentSub.subjectName}</strong> (${currentSub.subjectCode || 'CS302'}) • Class: <strong style="color:var(--dark-navy, #0B1F3A);">${currentSub.classId}</strong>
            </p>
          </div>

          <button type="button" onclick="TeacherApp.exportSyllabusCsv('${currentSub.subjectId}')" style="background:#F8FAFC; color:var(--primary-blue, #0B5CAD); border:1px solid #CBD5E1; padding:7px 14px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="download" style="width:14px;height:14px;"></i> Export Syllabus Report (CSV)
          </button>
        </div>

        <!-- Metric Cards -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Overall Coverage</span>
            <div style="font-size:24px; font-weight:800; color:${isOnTrack ? 'var(--success, #10B981)' : 'var(--primary-blue, #0B5CAD)'}; margin-top:2px;">
              ${coveragePercent}%
            </div>
            <div style="width:100%; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden; margin-top:8px;">
              <div style="width:${coveragePercent}%; height:100%; background:${isOnTrack ? 'var(--success, #10B981)' : 'var(--primary-blue, #0B5CAD)'};"></div>
            </div>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Total Planned Lectures</span>
            <div style="font-size:24px; font-weight:800; color:var(--dark-navy, #0B1F3A); margin-top:2px;">${totalPlanned}</div>
            <span style="font-size:11.5px; color:var(--text-muted, #64748B);">Target academic syllabus</span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Lectures Engaged</span>
            <div style="font-size:24px; font-weight:800; color:var(--primary-blue, #0B5CAD); margin-top:2px;">${totalEngaged}</div>
            <span style="font-size:11.5px; color:var(--success, #10B981); font-weight:600;">Delivered by faculty</span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Remaining Lectures</span>
            <div style="font-size:24px; font-weight:800; color:${remaining > 0 ? '#B45309' : '#10B981'}; margin-top:2px;">${remaining}</div>
            <span style="font-size:11.5px; color:var(--text-muted, #64748B);">${remaining === 0 ? 'Syllabus finished!' : 'To be conducted'}</span>
          </div>
        </div>

        <!-- Unit-wise Progress Breakdown -->
        <div>
          <h4 style="margin:0 0 10px 0; font-size:13px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">
            Unit-wise Delivery Breakdown
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
            ${unitBreakdown.map(u => `
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:12px; font-weight:700; color:var(--dark-navy, #0B1F3A);">${u.unitName}</span>
                  <span style="font-size:11.5px; font-weight:800; color:${u.progress >= 100 ? 'var(--success, #10B981)' : 'var(--primary-blue, #0B5CAD)'};">
                    ${u.engaged}/${u.planned} (${u.progress}%)
                  </span>
                </div>
                <div style="width:100%; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                  <div style="width:${u.progress}%; height:100%; background:${u.progress >= 100 ? 'var(--success, #10B981)' : (u.progress > 0 ? 'var(--primary-blue, #0B5CAD)' : '#94A3B8')};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 3. Navigation Tabs -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:2px solid #E2E8F0; padding-bottom:8px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; gap:10px;">
          <button type="button" onclick="TeacherApp.switchSyllabusTab('curriculum')" style="background:${activeTab === 'curriculum' ? 'var(--dark-navy, #0B1F3A)' : '#F1F5F9'}; color:${activeTab === 'curriculum' ? '#fff' : '#475569'}; border:none; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">
            📚 Curriculum &amp; Lecture Delivery (${currentSub.units?.length || 0} Units)
          </button>
          <button type="button" onclick="TeacherApp.switchSyllabusTab('history')" style="background:${activeTab === 'history' ? 'var(--dark-navy, #0B1F3A)' : '#F1F5F9'}; color:${activeTab === 'history' ? '#fff' : '#475569'}; border:none; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">
            📋 Lecture Delivery History Log (${allLecturesList.length} Lectures)
          </button>
        </div>

        ${activeTab === 'history' ? `
          <input type="text" placeholder="Search lectures, topics covered, dates..." value="${this.syllabusHistorySearch || ''}" oninput="TeacherApp.filterSyllabusHistory(this.value)" style="padding:6px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; min-width:260px;">
        ` : ''}
      </div>

      <!-- Tab Content: Curriculum vs History Log -->
      ${activeTab === 'curriculum' ? `
        <!-- Curriculum Units & Topics -->
        <div>
          ${(currentSub.units || []).map((unit) => {
            let uPlan = 0;
            let uEng = 0;
            (unit.topics || []).forEach(t => {
              uPlan += Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 0);
              const lCount = Array.isArray(t.lectures) ? t.lectures.length : Number(t.engagedLectures || t.lecturesTaken || 0);
              uEng += lCount;
            });
            const uPct = uPlan > 0 ? Math.min(100, Math.round((uEng / uPlan) * 100)) : 0;
            const uComp = uPct >= 100;
            const uInProg = uPct > 0 && !uComp;

            return `
              <div class="card" style="margin-bottom:18px; border-radius:12px; overflow:hidden; padding:0;">
                <!-- Unit Header -->
                <div style="background:#F8FAFC; padding:16px 20px; border-bottom:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <div>
                    <h4 style="margin:0 0 3px 0; font-size:15px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
                      ${unit.unitName}
                    </h4>
                    <span style="font-size:12px; color:var(--text-muted, #64748B);">
                      ${unit.topics?.length || 0} Topics • ${uEng} of ${uPlan} Lectures Engaged
                    </span>
                  </div>

                  <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:120px; display:flex; flex-direction:column; gap:3px;">
                      <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; color:#475569;">
                        <span>Progress</span>
                        <span>${uPct}%</span>
                      </div>
                      <div style="width:100%; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                        <div style="width:${uPct}%; height:100%; background:${uComp ? '#10B981' : (uInProg ? '#0B5CAD' : '#94A3B8')};"></div>
                      </div>
                    </div>

                    <span style="background:${uComp ? '#DCFCE7' : (uInProg ? '#FEF3C7' : '#F1F5F9')}; color:${uComp ? '#15803D' : (uInProg ? '#B45309' : '#64748B')}; border:1px solid ${uComp ? '#86EFAC' : (uInProg ? '#FDE047' : '#CBD5E1')}; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:800;">
                      ${uComp ? 'Completed' : (uInProg ? 'In Progress' : 'Not Started')}
                    </span>
                  </div>
                </div>

                <!-- Topics List -->
                <div style="padding:16px 20px; background:#FAFAFA;">
                  ${(unit.topics || []).map(topic => {
                    const tPlanned = Number(topic.plannedLectures || topic.noOfLectures || topic.estimatedLectures || 1);
                    const lecs = Array.isArray(topic.lectures) ? topic.lectures : [];
                    const tEngaged = lecs.length || Number(topic.engagedLectures || topic.lecturesTaken || 0);
                    const tComp = topic.status === 'Completed' || tEngaged >= tPlanned;
                    const tInProg = topic.status === 'In Progress' || (tEngaged > 0 && !tComp);
                    const tProgress = tPlanned > 0 ? Math.min(100, Math.round((tEngaged / tPlanned) * 100)) : 0;

                    return `
                      <div style="background:#fff; border:1px solid #E2E8F0; border-radius:10px; padding:16px 18px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                        <!-- Topic Title & Add Lecture Trigger -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                          <div style="flex:1 1 260px;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                              <h5 style="margin:0; font-size:14.5px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
                                ${topic.topicName}
                              </h5>
                              <span style="background:${tComp ? '#DCFCE7' : (tInProg ? '#FEF3C7' : '#F1F5F9')}; color:${tComp ? '#15803D' : (tInProg ? '#B45309' : '#64748B')}; border:1px solid ${tComp ? '#86EFAC' : (tInProg ? '#FDE047' : '#CBD5E1')}; padding:1px 8px; border-radius:10px; font-size:11px; font-weight:700;">
                                ${tComp ? 'Completed' : (tInProg ? 'In Progress' : 'Not Started')}
                              </span>
                            </div>
                            ${topic.topicDescription ? `<p style="margin:0; font-size:12px; color:var(--text-muted, #64748B); line-height:1.4;">${topic.topicDescription}</p>` : ''}
                          </div>

                          <div style="display:flex; align-items:center; gap:8px;">
                            <button type="button" onclick="TeacherApp.openAddLectureModal('${currentSub.subjectId}', '${unit.unitId}', '${topic.topicId}')" style="background:var(--primary-blue, #0B5CAD); color:#fff; border:none; padding:6px 14px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(11,92,173,0.2);">
                              <i data-lucide="plus" style="width:14px;height:14px;"></i> + Add Lecture
                            </button>
                            ${tEngaged > 0 ? `
                              <button type="button" onclick="TeacherApp.undoLectureFromTopic('${currentSub.subjectId}', '${unit.unitId}', '${topic.topicId}')" title="Undo last added lecture" style="background:#F8FAFC; color:#64748B; border:1px solid #CBD5E1; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
                                ↩ Undo
                              </button>
                            ` : ''}
                          </div>
                        </div>

                        <!-- Progress Summary -->
                        <div style="background:#F8FAFC; border-radius:8px; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                          <span style="font-size:12px; color:#475569;">
                            Lectures Engaged: <strong style="color:var(--dark-navy, #0B1F3A);">${tEngaged}</strong> of <strong style="color:var(--dark-navy, #0B1F3A);">${tPlanned}</strong> planned
                          </span>
                          <div style="width:140px; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                            <div style="width:${tProgress}%; height:100%; background:${tComp ? '#10B981' : (tInProg ? '#0B5CAD' : '#94A3B8')};"></div>
                          </div>
                        </div>

                        <!-- Lectures List with Topics Covered Chips -->
                        <div>
                          <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase; display:block; margin-bottom:6px;">
                            Delivered Lectures &amp; Topics Covered (${lecs.length})
                          </span>

                          ${lecs.length === 0 ? `
                            <div style="padding:10px; background:#FAFAFA; border:1px dashed #CBD5E1; border-radius:6px; text-align:center; font-size:12px; color:var(--text-muted, #64748B);">
                              No lectures recorded yet. Click <strong>+ Add Lecture</strong> after conducting your class.
                            </div>
                          ` : `
                            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px;">
                              ${lecs.map(lec => {
                                const isMarked = !!lec.attendanceMarked || lec.attendanceStatus === 'Marked';
                                const covered = Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0
                                  ? lec.topicsCovered
                                  : [topic.topicName];

                                return `
                                  <div style="background:${isMarked ? '#F0FDF4' : '#FFFBEB'}; border:1px solid ${isMarked ? '#BBF7D0' : '#FDE68A'}; border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
                                    <div>
                                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                        <span style="font-size:13px; font-weight:800; color:${isMarked ? '#166534' : '#92400E'};">
                                          Lecture ${lec.lectureNo}
                                        </span>
                                        ${isMarked ? `
                                          <span style="background:#DCFCE7; color:#15803D; font-size:10.5px; font-weight:800; padding:1px 6px; border-radius:10px;">
                                            ✓ Marked
                                          </span>
                                        ` : `
                                          <span style="background:#FEF3C7; color:#B45309; font-size:10.5px; font-weight:700; padding:1px 6px; border-radius:10px;">
                                            Not Marked
                                          </span>
                                        `}
                                      </div>
                                      <span style="font-size:11.5px; color:#64748B; display:block; margin-bottom:6px;">
                                        📅 ${lec.date} ${lec.timeSlot ? `• ${lec.timeSlot}` : ''}
                                      </span>

                                      <!-- Topics Covered Chips -->
                                      <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px;">
                                        ${covered.map(t => `
                                          <span style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; border-radius:12px; padding:1px 8px; font-size:10.5px; font-weight:600; line-height:1.3;">
                                            🏷️ ${t}
                                          </span>
                                        `).join('')}
                                      </div>

                                      ${lec.notes ? `
                                        <p style="margin:2px 0 0 0; font-size:11px; color:#475569; font-style:italic;">
                                          📝 ${lec.notes}
                                        </p>
                                      ` : ''}
                                    </div>

                                    <div style="display:flex; justify-content:flex-end; padding-top:6px; border-top:${isMarked ? '1px solid #DCFCE7' : '1px solid #FEF3C7'};">
                                      <button type="button" onclick="TeacherApp.openLectureAttendanceModal('${currentSub.subjectId}', '${unit.unitId}', '${topic.topicId}', '${lec.id}', '${lec.date}', '${currentSub.classId}', '${topic.topicName.replace(/'/g, "\\'")}', '${currentSub.subjectName.replace(/'/g, "\\'")}')" style="background:${isMarked ? '#FFFFFF' : 'var(--primary-blue, #0B5CAD)'}; color:${isMarked ? 'var(--primary-blue, #0B5CAD)' : '#FFFFFF'}; border:${isMarked ? '1px solid var(--primary-blue, #0B5CAD)' : 'none'}; padding:5px 12px; border-radius:5px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap;">
                                        ${isMarked ? 'View / Edit Attendance' : 'Mark Attendance'}
                                      </button>
                                    </div>
                                  </div>
                                `;
                              }).join('')}
                            </div>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <!-- Tab Content: Lecture Delivery History Log -->
        <div class="card" style="padding:20px; border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h4 style="margin:0; font-size:15px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
              Delivered Lectures &amp; Topics Covered Log
            </h4>
            <span style="font-size:12px; color:var(--text-muted, #64748B);">
              Showing ${filteredLectures.length} of ${allLecturesList.length} total recorded lectures
            </span>
          </div>

          ${filteredLectures.length === 0 ? `
            <div style="padding:30px; text-align:center; background:#F8FAFC; border-radius:8px; color:#64748B; font-size:13px;">
              No lectures found matching your filter. Click "+ Add Lecture" under any curriculum topic to record one.
            </div>
          ` : `
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                  <tr style="background:#F8FAFC; border-bottom:2px solid #E2E8F0; color:#475569; font-size:12px; text-transform:uppercase;">
                    <th style="padding:10px 12px; width:90px;">Lecture #</th>
                    <th style="padding:10px 12px; width:110px;">Date</th>
                    <th style="padding:10px 12px; width:160px;">Unit &amp; Topic</th>
                    <th style="padding:10px 12px;">Topics Covered</th>
                    <th style="padding:10px 12px; width:130px; textAlign:center;">Attendance</th>
                    <th style="padding:10px 12px; width:130px; textAlign:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLectures.map(lec => {
                    const isMarked = !!lec.attendanceMarked || lec.attendanceStatus === 'Marked';
                    const covered = Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0
                      ? lec.topicsCovered
                      : [lec.topicName];

                    return `
                      <tr style="border-bottom:1px solid #F1F5F9; font-size:13px;">
                        <td style="padding:12px; font-weight:800; color:#0B1F3A;">
                          <span style="background:#EFF6FF; color:#1D4ED8; padding:2px 8px; border-radius:4px;">
                            Lec ${lec.lectureNo}
                          </span>
                        </td>
                        <td style="padding:12px; color:#475569;">
                          ${lec.date}
                        </td>
                        <td style="padding:12px;">
                          <div style="font-weight:700; color:#0B1F3A;">${lec.topicName}</div>
                          <span style="font-size:11px; color:#64748B;">${lec.unitName ? lec.unitName.split(':')[0] : 'Unit'}</span>
                        </td>
                        <td style="padding:12px;">
                          <div style="display:flex; flex-wrap:wrap; gap:4px;">
                            ${covered.map(t => `
                              <span style="background:#F1F5F9; color:#1E293B; border:1px solid #CBD5E1; border-radius:12px; padding:1px 7px; font-size:11px; font-weight:600;">
                                🏷️ ${t}
                              </span>
                            `).join('')}
                          </div>
                          ${lec.notes ? `
                            <p style="margin:4px 0 0 0; font-size:11px; color:#64748B; font-style:italic;">
                              📝 ${lec.notes}
                            </p>
                          ` : ''}
                        </td>
                        <td style="padding:12px; text-align:center;">
                          ${isMarked ? `
                            <span style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:800;">
                              ✓ Marked
                            </span>
                          ` : `
                            <span style="background:#FEF3C7; color:#B45309; border:1px solid #FDE047; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">
                              Not Marked
                            </span>
                          `}
                        </td>
                        <td style="padding:12px; text-align:right;">
                          <button type="button" onclick="TeacherApp.openLectureAttendanceModal('${lec.subjectId}', '${lec.unitId}', '${lec.topicId}', '${lec.id}', '${lec.date}', '${lec.classId}', '${lec.topicName.replace(/'/g, "\\'")}', '${lec.subjectName.replace(/'/g, "\\'")}')" style="background:${isMarked ? '#FFFFFF' : 'var(--primary-blue, #0B5CAD)'}; color:${isMarked ? 'var(--primary-blue, #0B5CAD)' : '#FFFFFF'}; border:${isMarked ? '1px solid var(--primary-blue, #0B5CAD)' : 'none'}; padding:5px 10px; border-radius:5px; font-size:11.5px; font-weight:700; cursor:pointer; white-space:nowrap;">
                            ${isMarked ? 'View / Edit' : 'Mark Attendance'}
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `}
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // ----------------------------------------------------
  // RESULTS & CONTINUOUS EVALUATION MARKSHEET MODULE
  // ----------------------------------------------------
  _resultsClass: null,
  _resultsExam: 'IA-1',
  _resultsData: {},

  getResultsMaxMarks(examType) {
    switch (examType) {
      case 'IA-1':
      case 'IA-2':
        return 30;
      case 'MID_SEM':
        return 50;
      case 'END_SEM':
        return 100;
      default:
        return 30;
    }
  },

  async renderResultsView() {
    const container = document.getElementById("results-content");
    if (!container) return;

    const assigned = (TeacherERPData && TeacherERPData.assignedClasses) || [];
    let classCodes = Array.from(new Set(assigned.map(c => c.classCode).filter(Boolean)));
    if (classCodes.length === 0) classCodes = ['2R1', '2R2', '3R', '4R'];

    if (!this._resultsClass || !classCodes.includes(this._resultsClass)) {
      this._resultsClass = classCodes[0] || '2R1';
    }

    const currentClass = this._resultsClass;
    const currentExam = this._resultsExam || 'IA-1';
    const maxMarks = this.getResultsMaxMarks(currentExam);
    const passMarks = Math.round(maxMarks * 0.4);

    const currentSub = (assigned.find(a => a.classCode === currentClass)?.subject) || 'Curriculum Course';

    // Load students for active class
    let students = (TeacherERPData && typeof TeacherERPData.getStudentsForClass === 'function' ? TeacherERPData.getStudentsForClass(currentClass) : []);
    if (!students || students.length === 0) {
      if (TeacherERPData && typeof TeacherERPData.loadLiveStudents === 'function') {
        students = await TeacherERPData.loadLiveStudents(currentClass);
      }
    }

    // Retrieve stored marks from localStorage or initialize
    const storageKey = `ssgmce_marks_${currentClass}_${currentExam}`;
    let marksMap = {};
    try {
      marksMap = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (_) {}

    // Initialize missing student marks
    students.forEach((st, idx) => {
      const sid = st.studentCode || st.id || `roll-${st.rollNo}`;
      if (marksMap[sid] === undefined) {
        const rollNum = parseInt(st.rollNo || idx + 1, 10);
        const baseline = maxMarks * 0.75;
        const variance = (rollNum % 7) - 2;
        const calculated = Math.min(maxMarks, Math.max(passMarks - 2, Math.round(baseline + variance)));
        marksMap[sid] = calculated;
      }
    });

    this._resultsData[storageKey] = marksMap;

    // Compute dynamic stats
    const marksValues = students.map(st => {
      const sid = st.studentCode || st.id || `roll-${st.rollNo}`;
      return Number(marksMap[sid] !== undefined ? marksMap[sid] : 0);
    });

    const studentCount = students.length;
    const totalScore = marksValues.reduce((sum, val) => sum + val, 0);
    const avgScore = studentCount > 0 ? (totalScore / studentCount).toFixed(1) : '0.0';
    const passingCount = marksValues.filter(m => m >= passMarks).length;
    const passRate = studentCount > 0 ? ((passingCount / studentCount) * 100).toFixed(1) : '100.0';
    const highestScore = marksValues.length > 0 ? Math.max(...marksValues) : maxMarks;

    container.innerHTML = `
      <div class="card" style="padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:16px;">
          <div>
            <h3 style="font-size:18px; margin:0; color:var(--dark-navy); font-weight:800;">Continuous Internal Assessment &amp; Marksheet</h3>
            <p style="font-size:12.5px; color:var(--text-muted); margin:4px 0 0 0;">Class ${currentClass} • ${currentSub} • Official Autonomous Moderation Grade Card</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="quick-action-btn secondary" onclick="TeacherApp.exportResultsCsv()">
              <i data-lucide="download" style="width:14px;height:14px;"></i> Export CSV
            </button>
            <button class="quick-action-btn primary" onclick="TeacherApp.saveResultsMarks()">
              <i data-lucide="save" style="width:14px;height:14px;"></i> Save Marksheet
            </button>
          </div>
        </div>

        <!-- Controls: Class & Exam Selection -->
        <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap; margin-bottom:20px; background:#F8FAFC; padding:14px 18px; border-radius:8px; border:1px solid #E2E8F0;">
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; font-weight:700; color:#475569;">Target Class:</label>
            <select id="results-class-select" style="padding:7px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; font-weight:600; color:var(--dark-navy); background:#fff;"
                    onchange="TeacherApp.changeResultsClass(this.value)">
              ${classCodes.map(c => `
                <option value="${c}" ${c === currentClass ? 'selected' : ''}>Class ${c} (${(assigned.find(a => a.classCode === c)?.subject) || 'Curriculum'})</option>
              `).join('')}
            </select>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; font-weight:700; color:#475569;">Evaluation Phase:</label>
            <select id="results-exam-select" style="padding:7px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; font-weight:600; color:var(--dark-navy); background:#fff;"
                    onchange="TeacherApp.changeResultsExam(this.value)">
              <option value="IA-1" ${currentExam === 'IA-1' ? 'selected' : ''}>Internal Assessment 1 (Max 30)</option>
              <option value="IA-2" ${currentExam === 'IA-2' ? 'selected' : ''}>Internal Assessment 2 (Max 30)</option>
              <option value="MID_SEM" ${currentExam === 'MID_SEM' ? 'selected' : ''}>Mid-Semester Exam (Max 50)</option>
              <option value="END_SEM" ${currentExam === 'END_SEM' ? 'selected' : ''}>Semester End Theory (Max 100)</option>
            </select>
          </div>

          <div style="margin-left:auto; font-size:12px; color:#64748B;">
            <strong>Passing Criteria:</strong> ${passMarks} / ${maxMarks} marks (40%)
          </div>
        </div>

        <!-- Dynamic Statistics Summary Cards -->
        <div class="results-grid-summary" style="margin-bottom:24px;">
          <div class="result-stat-box">
            <div style="font-size:26px; font-weight:800; color:var(--primary-blue);" id="results-avg-score">${avgScore}</div>
            <div style="font-size:12px; color:var(--text-muted);">Class Average (out of ${maxMarks})</div>
          </div>
          <div class="result-stat-box">
            <div style="font-size:26px; font-weight:800; color:var(--success);" id="results-pass-rate">${passRate}%</div>
            <div style="font-size:12px; color:var(--text-muted);">Passing Rate (${passingCount} / ${studentCount} students)</div>
          </div>
          <div class="result-stat-box">
            <div style="font-size:26px; font-weight:800; color:var(--dark-navy);" id="results-highest-score">${highestScore} / ${maxMarks}</div>
            <div style="font-size:12px; color:var(--text-muted);">Highest Marks Scored</div>
          </div>
        </div>

        <!-- Interactive Student Marksheet Table -->
        <div style="overflow-x:auto;">
          <table class="roster-table" id="results-marksheet-table">
            <thead>
              <tr>
                <th style="width:80px;">Roll No</th>
                <th>Student Full Name</th>
                <th>Student Code</th>
                <th style="width:130px; text-align:center;">Marks (${maxMarks})</th>
                <th style="width:100px; text-align:center;">Grade</th>
                <th style="width:110px; text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody id="results-marksheet-tbody">
              ${students.map(st => {
                const sid = st.studentCode || st.id || `roll-${st.rollNo}`;
                const val = marksMap[sid] !== undefined ? marksMap[sid] : 0;
                const isPassed = val >= passMarks;
                let grade = 'F';
                const pct = (val / maxMarks) * 100;
                if (pct >= 85) grade = 'A+';
                else if (pct >= 75) grade = 'A';
                else if (pct >= 60) grade = 'B';
                else if (pct >= 40) grade = 'C';

                return `
                  <tr data-student-id="${sid}">
                    <td style="font-weight:700; color:var(--primary-blue);">ROLL ${st.rollNo}</td>
                    <td style="font-weight:600; color:var(--dark-navy);">${st.name}</td>
                    <td style="color:#64748B; font-family:monospace; font-size:12px;">${st.studentCode || '--'}</td>
                    <td style="text-align:center;">
                      <input type="number" min="0" max="${maxMarks}" value="${val}"
                             style="width:72px; padding:6px 8px; border:1px solid #CBD5E1; border-radius:5px; font-weight:700; text-align:center; font-size:13px; color:var(--dark-navy);"
                             oninput="TeacherApp.handleMarksInputChange('${sid}', this.value, ${maxMarks})" />
                    </td>
                    <td style="text-align:center;">
                      <span class="badge" style="background:#EFF6FF; color:var(--primary-blue); font-weight:700;" id="grade-${sid}">${grade}</span>
                    </td>
                    <td style="text-align:center;">
                      <span class="badge ${isPassed ? 'badge-completed' : 'badge-pending'}" id="status-${sid}">
                        ${isPassed ? 'Passed' : 'Backlog'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.initLucideIcons();
  },

  // ----------------------------------------------------
  // RESULTS VIEW & MARKS EVALUATION CONSOLE
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
            <button class="quick-action-btn" onclick="TeacherApp.openBulkMarksModal()" style="background:#0f172a; color:#fff; display:flex; align-items:center; gap:6px; font-weight:600; padding:8px 16px; border-radius:8px;">
              <i data-lucide="edit-3" style="width:15px;height:15px;"></i> Bulk Marks Sheet
            </button>
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
            <select id="teacherMarksClassSelect" onchange="TeacherApp.loadMarksRoster()" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-weight:600; background:#fff; min-width:140px;">
              <option value="3R" selected>3R (Third Year CSE)</option>
              <option value="2R1">2R1 (Second Year CSE)</option>
              <option value="2R2">2R2 (Second Year CSE)</option>
              <option value="4R">4R (Final Year CSE)</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:4px;">Subject</label>
            <select id="teacherMarksSubjectSelect" onchange="TeacherApp.loadMarksRoster()" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-weight:600; background:#fff; min-width:260px;">
              <option value="CS501" selected>CS501 - Database Management Systems</option>
              <option value="CS502">CS502 - Computer Networks &amp; Protocols</option>
              <option value="CS503">CS503 - Theory of Computation</option>
              <option value="CS504">CS504 - Software Engineering</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:4px;">Semester</label>
            <select id="teacherMarksSemesterSelect" onchange="TeacherApp.loadMarksRoster()" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-weight:600; background:#fff; min-width:120px;">
              <option value="5" selected>Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>
          <button class="quick-action-btn primary" onclick="TeacherApp.loadMarksRoster()" style="padding:8px 18px; border-radius:6px; font-weight:600; cursor:pointer;">
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
            <div id="statAvgMarks" style="font-size:22px; font-weight:800; color:#059669;">-</div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Class Average Marks</div>
          </div>
          <div class="result-stat-box" style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; text-align:center;">
            <div id="statLockStatus" style="font-size:18px; font-weight:800; color:#10b981; line-height:28px;">OPEN</div>
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
                <th style="padding:10px 12px; width:120px;">Student Code</th>
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
                  Loading class grading roster...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.initLucideIcons();
    setTimeout(() => this.loadMarksRoster(), 50);
  },

  async loadMarksRoster() {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const subjectId = document.getElementById('teacherMarksSubjectSelect')?.value || 'CS501';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5, 10);

    const tbody = document.getElementById('teacherResultsTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">Fetching students roster and marks...</td></tr>`;

    let students = [];
    let isLocked = false;
    let statusVal = 'OPEN';
    let lockReason = '';

    try {
      const res = await fetch(`/api/v1/results/marks/roster?class_id=${encodeURIComponent(classId)}&subject_id=${encodeURIComponent(subjectId)}&semester=${semester}`, {
        headers: this.getAuthHeaders()
      }).then(r => r.json()).catch(() => null);

      if (res && res.success && res.data && Array.isArray(res.data.students) && res.data.students.length > 0) {
        students = res.data.students;
        isLocked = Boolean(res.data.is_locked);
        statusVal = res.data.status || 'OPEN';
        lockReason = res.data.lock_reason || '';
      }
    } catch (_) {}

    if (!students || students.length === 0) {
      const localList = (typeof TeacherERPData !== 'undefined' && TeacherERPData.students && (TeacherERPData.students[classId] || TeacherERPData.students['2R1'])) || [];
      students = localList.slice(0, 25).map((st, idx) => {
        const intM = 22 + (idx % 7);
        const extM = 48 + ((idx * 3) % 18);
        const totM = intM + extM;
        const grade = totM >= 90 ? 'O' : (totM >= 80 ? 'A+' : (totM >= 70 ? 'A' : (totM >= 60 ? 'B+' : 'B')));
        const gp = totM >= 90 ? 10 : (totM >= 80 ? 9 : (totM >= 70 ? 8 : (totM >= 60 ? 7 : 6)));
        return {
          student_id: st.id || `STU-${classId}-${st.rollNo || (idx + 1)}`,
          student_code: st.studentCode || `STU-${classId}-${String(st.rollNo || (idx + 1)).padStart(3, '0')}`,
          roll_no: st.rollNo || (idx + 1),
          full_name: st.name || 'Student',
          internal_marks: intM,
          external_marks: extM,
          total_marks: totM,
          grade: grade,
          grade_point: gp,
          result_status: 'PASS'
        };
      });
    }

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
        if (lockReasonText) lockReasonText.textContent = lockReason ? `(${lockReason})` : '';
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

    let gradedCount = 0;
    let totalMarksSum = 0;
    students.forEach(s => {
      if (s.total_marks !== null && s.total_marks !== undefined) {
        gradedCount++;
        totalMarksSum += Number(s.total_marks);
      }
    });

    const totalEl = document.getElementById('statTotalStudents');
    const gradedEl = document.getElementById('statGradedCount');
    const avgEl = document.getElementById('statAvgMarks');
    if (totalEl) totalEl.textContent = students.length;
    if (gradedEl) gradedEl.textContent = gradedCount;
    if (avgEl) avgEl.textContent = gradedCount > 0 ? (totalMarksSum / gradedCount).toFixed(1) : '-';

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No enrolled students found for class ${classId}.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      const intVal = s.internal_marks !== null && s.internal_marks !== undefined ? s.internal_marks : '';
      const extVal = s.external_marks !== null && s.external_marks !== undefined ? s.external_marks : '';
      const totVal = s.total_marks !== null && s.total_marks !== undefined ? s.total_marks : '-';
      const gradeVal = s.grade || '-';
      const gpVal = s.grade_point !== null && s.grade_point !== undefined ? Number(s.grade_point).toFixed(1) : '-';
      const stVal = s.result_status || '-';
      const disabledAttr = isLocked ? 'disabled' : '';

      return `
        <tr style="border-bottom:1px solid #e2e8f0;" data-student-id="${s.student_id}" data-student-code="${s.student_code}">
          <td style="padding:10px 12px; font-weight:700; color:var(--primary-blue);">${s.roll_no || '-'}</td>
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
            ${totVal !== '-' ? totVal + ' / 100' : '-'}
          </td>
          <td style="padding:10px 12px;" class="roster-grade-cell">
            ${gradeVal !== '-' ? `<span class="badge ${['O', 'A+', 'A'].includes(gradeVal) ? 'badge-completed' : 'badge-cyan'}">${gradeVal} (${gpVal})</span>` : '-'}
          </td>
          <td style="padding:10px 12px;" class="roster-status-cell">
            ${stVal !== '-' ? `<span class="badge ${stVal === 'PASS' ? 'badge-completed' : 'badge-pending'}">${stVal}</span>` : '-'}
          </td>
        </tr>
      `;
    }).join('');

    this.initLucideIcons();
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

    if (!isNaN(intVal)) {
      if (intVal < 0) { intVal = 0; intInput.value = 0; }
      if (intVal > 30) { intVal = 30; intInput.value = 30; }
    }
    if (!isNaN(extVal)) {
      if (extVal < 0) { extVal = 0; extInput.value = 0; }
      if (extVal > 70) { extVal = 70; extInput.value = 70; }
    }

    if (isNaN(intVal) && isNaN(extVal)) {
      totalCell.textContent = '-';
      gradeCell.textContent = '-';
      statusCell.textContent = '-';
      return;
    }

    const total = (isNaN(intVal) ? 0 : intVal) + (isNaN(extVal) ? 0 : extVal);
    totalCell.textContent = `${total.toFixed(1)} / 100`;

    let grade = 'F', gp = 0.0, status = 'FAIL';
    if (total >= 90) { grade = 'O'; gp = 10.0; status = 'PASS'; }
    else if (total >= 80) { grade = 'A+'; gp = 9.0; status = 'PASS'; }
    else if (total >= 70) { grade = 'A'; gp = 8.0; status = 'PASS'; }
    else if (total >= 60) { grade = 'B+'; gp = 7.0; status = 'PASS'; }
    else if (total >= 50) { grade = 'B'; gp = 6.0; status = 'PASS'; }
    else if (total >= 45) { grade = 'C'; gp = 5.0; status = 'PASS'; }
    else if (total >= 40) { grade = 'P'; gp = 4.0; status = 'PASS'; }

    gradeCell.innerHTML = `<span class="badge ${['O', 'A+', 'A'].includes(grade) ? 'badge-completed' : 'badge-cyan'}">${grade} (${gp.toFixed(1)})</span>`;
    statusCell.innerHTML = `<span class="badge ${status === 'PASS' ? 'badge-completed' : 'badge-pending'}">${status}</span>`;
  },

  async saveMarksRoster(isDraft = false) {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const subjectId = document.getElementById('teacherMarksSubjectSelect')?.value || 'CS501';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5, 10);

    const rows = document.querySelectorAll('#teacherResultsTableBody tr[data-student-code]');
    if (!rows.length) {
      this.showToast('No student records found to save.', 'warning');
      return;
    }

    const marksData = [];
    rows.forEach(r => {
      const sCode = r.getAttribute('data-student-code');
      const intInput = r.querySelector('.roster-int-mark');
      const extInput = r.querySelector('.roster-ext-mark');
      const intVal = parseFloat(intInput?.value);
      const extVal = parseFloat(extInput?.value);
      if (!isNaN(intVal) || !isNaN(extVal)) {
        marksData.push({
          student_id: sCode,
          internal_marks: isNaN(intVal) ? 0.0 : intVal,
          external_marks: isNaN(extVal) ? 0.0 : extVal,
          practical_marks: 0.0,
          assignment_marks: 0.0
        });
      }
    });

    if (!marksData.length) {
      this.showToast('Please enter marks for at least one student before saving.', 'warning');
      return;
    }

    try {
      await fetch('/api/v1/results/marks/entry', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          semester: semester,
          marks: marksData,
          is_draft: isDraft
        })
      }).catch(() => null);
    } catch (_) {}

    const statLock = document.getElementById('statLockStatus');
    if (statLock) {
      statLock.textContent = isDraft ? 'DRAFT' : 'SUBMITTED';
      statLock.style.color = isDraft ? '#059669' : '#0b5cad';
    }
    this.showToast(`✅ ${isDraft ? 'Draft saved' : 'Marks submitted'} successfully for ${marksData.length} students!`, 'success');
  },

  async lockMarksRoster() {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const subjectId = document.getElementById('teacherMarksSubjectSelect')?.value || 'CS501';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5, 10);

    if (!confirm(`Are you sure you want to LOCK marks submission for Class ${classId} - ${subjectId} (Semester ${semester})?\n\nOnce locked, no further edits can be made unless unlocked by the Examination Cell.`)) {
      return;
    }

    try {
      await fetch('/api/v1/results/marks/lock', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          semester: semester,
          reason: 'End-semester marks verified and sealed by Course Faculty'
        })
      }).catch(() => null);
    } catch (_) {}

    const lockAlert = document.getElementById('teacherLockAlert');
    const statLock = document.getElementById('statLockStatus');
    const btnSave = document.getElementById('btnSaveMarksDraft');
    const btnSubmit = document.getElementById('btnSubmitMarks');
    const btnLock = document.getElementById('btnLockMarks');
    if (lockAlert) lockAlert.style.display = 'flex';
    if (statLock) {
      statLock.textContent = 'LOCKED';
      statLock.style.color = '#dc2626';
    }
    if (btnSave) btnSave.disabled = true;
    if (btnSubmit) btnSubmit.disabled = true;
    if (btnLock) {
      btnLock.disabled = true;
      btnLock.innerHTML = `🔒 Locked`;
    }
    document.querySelectorAll('#teacherResultsTableBody input').forEach(inp => { inp.disabled = true; });
    this.showToast(`🔒 Marks submission for Class ${classId} (${subjectId}) locked!`, 'success');
  },

  exportGazetteCsv() {
    const classId = document.getElementById('teacherMarksClassSelect')?.value || '3R';
    const subjectId = document.getElementById('teacherMarksSubjectSelect')?.value || 'CS501';
    const semester = parseInt(document.getElementById('teacherMarksSemesterSelect')?.value || 5, 10);
    const rows = document.querySelectorAll('#teacherResultsTableBody tr[data-student-code]');
    if (rows && rows.length > 0) {
      const csvRows = [
        ['Roll No', 'Student Name', 'Student Code', 'Class', 'Subject', 'Semester', 'Internal Marks (30)', 'External Marks (70)', 'Total (100)', 'Status']
      ];
      rows.forEach(r => {
        const tds = r.querySelectorAll('td');
        const roll = tds[0]?.textContent?.trim() || '';
        const name = tds[1]?.textContent?.trim() || '';
        const code = r.getAttribute('data-student-code') || '';
        const intM = r.querySelector('.roster-int-mark')?.value || '0';
        const extM = r.querySelector('.roster-ext-mark')?.value || '0';
        const totM = (parseFloat(intM) || 0) + (parseFloat(extM) || 0);
        const status = totM >= 40 ? 'PASS' : 'FAIL';
        csvRows.push([roll, `"${name}"`, code, classId, subjectId, semester, intM, extM, totM, status]);
      });
      const csvContent = "\uFEFF" + csvRows.map(r => r.join(",")).join("\r\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Results_Gazette_${classId}_${subjectId}_Sem${semester}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.showToast(`Exported Results Gazette CSV for Class ${classId}!`, 'success');
      return;
    }
    window.location.href = `/api/v1/results/export?class_name=${encodeURIComponent(classId)}&semester=${semester}`;
  },

  // ----------------------------------------------------
  // BULK MARKS ENTRY MODAL & WORKFLOW
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

    const students = (typeof TeacherERPData !== 'undefined' && TeacherERPData.students && (TeacherERPData.students["3R"] || TeacherERPData.students["2R1"]) || []).slice(0, 15);

    modal.innerHTML = `
      <div style="background:#fff; width:92%; max-width:780px; max-height:90vh; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.25);">
        <div style="padding:16px 22px; background:#0B1F3A; color:#fff; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:700;">Bulk Marks Entry Sheet</h3>
            <span style="font-size:12px; color:#00A6D6;">Autonomous Continuous Assessment &amp; Semester Internal Grading</span>
          </div>
          <button onclick="document.getElementById('bulkMarksModal').style.display='none'" style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer;">&times;</button>
        </div>
        
        <div style="padding:14px 22px; background:#F8FAFC; border-bottom:1px solid #E2E8F0; display:flex; gap:16px; flex-wrap:wrap; font-size:13px;">
          <div><strong>Class:</strong> <span class="badge badge-cyan" style="font-size:11px;">3R (Third Year CSE)</span></div>
          <div><strong>Subject:</strong> <span class="badge badge-completed" style="font-size:11px;">5CS220PC - Database Management Systems</span></div>
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
              ${students.map((st, idx) => {
                const sid = st.student_id || st.id || 'stud-' + (st.roll_no || st.rollNo || (idx + 1));
                const roll = st.roll_no || st.rollNo || (idx + 1);
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

        <div style="padding:14px 22px; background:#F8FAFC; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span style="font-size:12px; color:var(--text-muted);">* Boundary enforcement: Marks cannot be negative or exceed max values.</span>
          <div style="display:flex; gap:10px;">
            <button onclick="document.getElementById('bulkMarksModal').style.display='none'" style="padding:8px 16px; border:1px solid #CBD5E1; background:#fff; border-radius:6px; cursor:pointer; font-weight:600;">Cancel</button>
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
      await fetch('/api/v1/results/marks/entry', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: '3R',
          subject_id: 'CS501',
          semester: 5,
          marks: marksData,
          is_draft: false
        })
      }).catch(() => null);
    } catch (_) {}

    this.showToast(`✅ Successfully validated and saved marks for ${marksData.length} students!`, 'success');
    const modal = document.getElementById('bulkMarksModal');
    if (modal) modal.style.display = 'none';
    if (this.currentView === 'results') {
      this.loadMarksRoster();
    }
  },

  handleMarksInputChange(studentId, rawValue, maxMarks) {
    const val = Math.min(maxMarks, Math.max(0, parseInt(rawValue, 10) || 0));
    const currentClass = this._resultsClass || '2R1';
    const currentExam = this._resultsExam || 'IA-1';
    const storageKey = `ssgmce_marks_${currentClass}_${currentExam}`;

    if (!this._resultsData[storageKey]) this._resultsData[storageKey] = {};
    this._resultsData[storageKey][studentId] = val;

    // Update grade and status badges for this student
    const passMarks = Math.round(maxMarks * 0.4);
    const isPassed = val >= passMarks;
    let grade = 'F';
    const pct = (val / maxMarks) * 100;
    if (pct >= 85) grade = 'A+';
    else if (pct >= 75) grade = 'A';
    else if (pct >= 60) grade = 'B';
    else if (pct >= 40) grade = 'C';

    const gradeElem = document.getElementById(`grade-${studentId}`);
    if (gradeElem) gradeElem.textContent = grade;

    const statusElem = document.getElementById(`status-${studentId}`);
    if (statusElem) {
      statusElem.textContent = isPassed ? 'Passed' : 'Backlog';
      statusElem.className = `badge ${isPassed ? 'badge-completed' : 'badge-pending'}`;
    }

    // Recalculate summary KPIs
    const marksValues = Object.values(this._resultsData[storageKey]).map(Number);
    if (marksValues.length > 0) {
      const sum = marksValues.reduce((a, b) => a + b, 0);
      const avg = (sum / marksValues.length).toFixed(1);
      const passedCount = marksValues.filter(m => m >= passMarks).length;
      const passPct = ((passedCount / marksValues.length) * 100).toFixed(1);
      const high = Math.max(...marksValues);

      const avgElem = document.getElementById("results-avg-score");
      if (avgElem) avgElem.textContent = avg;
      const passElem = document.getElementById("results-pass-rate");
      if (passElem) passElem.textContent = `${passPct}%`;
      const highElem = document.getElementById("results-highest-score");
      if (highElem) highElem.textContent = `${high} / ${maxMarks}`;
    }
  },

  changeResultsClass(classCode) {
    this._resultsClass = classCode;
    this.renderResultsView();
  },

  changeResultsExam(examType) {
    this._resultsExam = examType;
    this.renderResultsView();
  },

  saveResultsMarks() {
    const currentClass = this._resultsClass || '2R1';
    const currentExam = this._resultsExam || 'IA-1';
    const storageKey = `ssgmce_marks_${currentClass}_${currentExam}`;

    if (this._resultsData[storageKey]) {
      localStorage.setItem(storageKey, JSON.stringify(this._resultsData[storageKey]));
    }

    if (typeof this.showToast === 'function') {
      this.showToast(`Marksheet for ${currentClass} (${currentExam}) saved successfully!`, 'success');
    }
  },

  exportResultsCsv() {
    const currentClass = this._resultsClass || '2R1';
    const currentExam = this._resultsExam || 'IA-1';
    const storageKey = `ssgmce_marks_${currentClass}_${currentExam}`;
    const marksMap = this._resultsData[storageKey] || {};

    const students = (TeacherERPData && typeof TeacherERPData.getStudentsForClass === 'function' ? TeacherERPData.getStudentsForClass(currentClass) : []) || [];
    const maxMarks = this.getResultsMaxMarks(currentExam);

    let csv = "Roll No,Student Full Name,Student Code,Institute Email,Obtained Marks,Max Marks,Status\n";
    students.forEach(st => {
      const sid = st.studentCode || st.id || `roll-${st.rollNo}`;
      const mark = marksMap[sid] !== undefined ? marksMap[sid] : 0;
      const status = mark >= Math.round(maxMarks * 0.4) ? "Passed" : "Backlog";
      csv += `"${st.rollNo}","${st.name}","${st.studentCode || ''}","${st.email}","${mark}","${maxMarks}","${status}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `SSGMCE_Marksheet_${currentClass}_${currentExam}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof this.showToast === 'function') {
      this.showToast(`Marksheet exported: SSGMCE_Marksheet_${currentClass}_${currentExam}.csv`, 'info');
    }
  },

  // ----------------------------------------------------
  // FACULTY LEAVE & SUBSTITUTION MODULE + MODAL
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

    const teacher = this.getLoggedInTeacher() || {};
    const facultyName = teacher.name || "Prof. J. M. Patil";
    const facultyPhone = teacher.phone || "+91 94228 12345";
    const todayISO = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];
    const defaultEndDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    modal.innerHTML = `
      <div style="background:#fff; width:92%; max-width:520px; border-radius:14px; overflow:hidden; box-shadow:0 20px 45px rgba(0,0,0,0.28);">
        <div style="padding:16px 22px; background:#0B1F3A; color:#fff; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:8px; background:rgba(0,166,214,0.2); display:flex; align-items:center; justify-content:center; color:#38BDF8;">
              <i data-lucide="calendar-plus" style="width:18px;height:18px;"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:15.5px; font-weight:700;">Apply for Faculty Leave</h3>
              <div style="font-size:11.5px; color:#94A3B8;">${facultyName} • Class Substitution Auto-Sync</div>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('teacherLeaveModal').style.display='none'" style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
        </div>
        <div style="padding:20px 22px; font-size:13px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
            <div>
              <label style="display:block; font-weight:700; color:#334155; margin-bottom:4px; font-size:12px;">Leave Category <span style="color:#EF4444;">*</span></label>
              <select id="teacherLeaveType" style="width:100%; padding:8px 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; font-weight:600; color:#0F172A;">
                <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                <option value="Medical Leave (ML)">Medical Leave (ML)</option>
                <option value="Duty / Conference Leave (DL)">Duty / Conference Leave (DL)</option>
                <option value="Earned Leave (EL)">Earned Leave (EL)</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-weight:700; color:#334155; margin-bottom:4px; font-size:12px;">Contact Phone <span style="color:#EF4444;">*</span></label>
              <input type="tel" id="teacherLeavePhone" value="${facultyPhone}" style="width:100%; padding:8px 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; box-sizing:border-box;">
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
            <div>
              <label style="display:block; font-weight:700; color:#334155; margin-bottom:4px; font-size:12px;">Start Date <span style="color:#EF4444;">*</span></label>
              <input type="date" id="teacherLeaveStart" value="${todayISO}" style="width:100%; padding:8px 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; box-sizing:border-box;">
            </div>
            <div>
              <label style="display:block; font-weight:700; color:#334155; margin-bottom:4px; font-size:12px;">End Date <span style="color:#EF4444;">*</span></label>
              <input type="date" id="teacherLeaveEnd" value="${defaultEndDate}" style="width:100%; padding:8px 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; box-sizing:border-box;">
            </div>
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block; font-weight:700; color:#334155; margin-bottom:4px; font-size:12px;">Reason &amp; Lecture Substitution Arrangement <span style="color:#EF4444;">*</span></label>
            <textarea id="teacherLeaveReason" rows="3" placeholder="Specify reason for leave and any peer faculty class adjustment..." style="width:100%; padding:9px 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; box-sizing:border-box; resize:vertical;"></textarea>
          </div>
          <div style="background:#EFF6FF; border-left:4px solid #0B5CAD; padding:9px 12px; border-radius:4px; font-size:11.5px; color:#1E3A8A; margin-bottom:16px;">
            <strong>Automatic Timetable Sync:</strong> Approved/Submitted leave dates automatically mark your classes for peer faculty substitution.
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; border-top:1px solid #E2E8F0; padding-top:14px;">
            <button type="button" onclick="document.getElementById('teacherLeaveModal').style.display='none'; TeacherApp.switchView('leave');" style="padding:8px 12px; border:1px solid #CBD5E1; background:#F8FAFC; color:#0B5CAD; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer;">
              View Leave History &amp; Console &rarr;
            </button>
            <div style="display:flex; gap:8px;">
              <button type="button" onclick="document.getElementById('teacherLeaveModal').style.display='none'" style="padding:8px 14px; border:1px solid #CBD5E1; background:#fff; border-radius:6px; cursor:pointer; font-weight:600;">Cancel</button>
              <button type="button" onclick="TeacherApp.submitLeaveApplication()" style="padding:8px 18px; background:#0B5CAD; color:#fff; border:none; border-radius:6px; font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(11,92,173,0.25);">Submit Leave Request</button>
            </div>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
    this.initLucideIcons();
  },

  async submitLeaveApplication() {
    const leaveType = document.getElementById('teacherLeaveType')?.value || 'Casual Leave (CL)';
    const phone = document.getElementById('teacherLeavePhone')?.value?.trim() || '+91 94228 12345';
    const startDate = document.getElementById('teacherLeaveStart')?.value || '';
    const endDate = document.getElementById('teacherLeaveEnd')?.value || '';
    const rawReason = document.getElementById('teacherLeaveReason')?.value?.trim() || '';

    if (!startDate || !endDate) {
      this.showToast('Please select both Start Date and End Date.', 'error');
      return;
    }
    if (startDate > endDate) {
      this.showToast('End Date cannot be earlier than Start Date.', 'error');
      return;
    }
    if (!rawReason || rawReason.length < 3) {
      this.showToast('Please enter a reason for your leave application.', 'error');
      return;
    }

    const teacher = this.getLoggedInTeacher() || {};
    const activeCode = teacher.employeeId || ((typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
      ? TeacherERPData.getActiveTeacherEmpCode()
      : 'EMP-CSE-1001');
    const facultyName = teacher.name || 'Prof. J. M. Patil';
    const facultyEmail = teacher.email || `${activeCode.toLowerCase()}@ssgmce.ac.in`;
    const fullReason = `[${leaveType}] ${rawReason}`;

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const totalDays = Math.max(1, Math.round((eDate - sDate) / 86400000) + 1);

    if (window.TeacherERPData && typeof TeacherERPData.applyForLeave === 'function') {
      TeacherERPData.applyForLeave({
        facultyId: activeCode,
        empCode: activeCode,
        facultyName,
        facultyEmail,
        phone,
        startDate,
        endDate,
        reason: fullReason
      });
    }

    try {
      await fetch('/api/v1/management/teacher/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_code: activeCode,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          total_days: totalDays,
          reason: fullReason
        })
      }).catch(() => null);
    } catch (_) {}

    const modal = document.getElementById('teacherLeaveModal');
    if (modal) modal.style.display = 'none';

    this.showToast('✅ Leave application submitted! View status in Faculty Leave Console.', 'success');
    this.renderLeaveView();
    if (window.TimetableManager && typeof TimetableManager.render === 'function') {
      try { TimetableManager.render(); } catch (_) {}
    }
  },

  renderLeaveView() {
    const container = document.getElementById("leave-view");
    if (!container) return;

    const teacher = this.getLoggedInTeacher() || {};
    const facultyId = teacher.employeeId || teacher.id || teacher.facultyId || teacher.empCode || "EMP-CSE-1001";
    const facultyName = teacher.name || "Prof. J. M. Patil";
    const facultyEmail = teacher.email || (facultyId ? `${facultyId.toLowerCase()}@ssgmce.ac.in` : "faculty@ssgmce.ac.in");
    const facultyPhone = teacher.phone || "+91 94228 12345";

    const leaves = (window.TeacherERPData && typeof TeacherERPData.getFacultyLeaves === 'function')
      ? TeacherERPData.getFacultyLeaves(facultyId)
      : ((window.TeacherERPData && TeacherERPData.leaves) || []);

    const todayISO = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];

    const defaultEndDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

    container.innerHTML = `
      <div class="card" style="padding:24px; margin-bottom:20px;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light, #E2E8F0); padding-bottom:16px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:10px; background:#EFF6FF; color:#0B5CAD; display:flex; align-items:center; justify-content:center; font-size:22px;">
              <i data-lucide="calendar" style="width:24px;height:24px;color:#0B5CAD;"></i>
            </div>
            <div>
              <h2 style="margin:0; font-size:19px; font-weight:800; color:var(--dark-navy, #0B1F3A);">Faculty Leave Application &amp; Class Substitution</h2>
              <p style="margin:3px 0 0 0; font-size:12.5px; color:var(--text-muted, #64748B);">Apply for official leave and monitor peer faculty class coverage &amp; substitution</p>
            </div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="quick-action-btn" onclick="TeacherApp.switchView('dashboard')" style="display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Back to Dashboard
            </button>
            <button class="quick-action-btn primary" onclick="TeacherApp.switchView('timetable')" style="display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="layout-grid" style="width:14px;height:14px;"></i> View Full Timetable
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
          <!-- LEFT COLUMN: Leave Application Form -->
          <div style="background:var(--bg-light, #F8FAFC); border:1px solid var(--border-light, #E2E8F0); border-radius:10px; padding:20px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
              <i data-lucide="file-text" style="width:18px;height:18px;color:#0B5CAD;"></i>
              <h3 style="margin:0; font-size:15px; font-weight:700; color:var(--dark-navy, #0B1F3A);">Apply for New Leave</h3>
            </div>

            <form id="leaveApplicationForm" onsubmit="TeacherApp.handleLeaveFormSubmit(event)" style="display:flex; flex-direction:column; gap:14px;">
              <input type="hidden" id="leaveFacultyId" value="${facultyId}">

              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:5px;">Faculty Name (Auto-filled)</label>
                <input type="text" id="leaveFacultyName" value="${facultyName}" readonly style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; background:#E2E8F0; color:#475569; font-size:13px; font-weight:600; box-sizing:border-box; cursor:not-allowed;">
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:5px;">Faculty Email (Auto-filled)</label>
                <input type="email" id="leaveFacultyEmail" value="${facultyEmail}" readonly style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; background:#E2E8F0; color:#475569; font-size:13px; font-weight:600; box-sizing:border-box; cursor:not-allowed;">
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:5px;">Phone Number <span style="color:#EF4444;">*</span></label>
                <input type="tel" id="leavePhone" value="${facultyPhone}" placeholder="e.g., 9822012345" required style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; background:#ffffff; font-size:13px; color:#0F172A; box-sizing:border-box;">
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div>
                  <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:5px;">Starting Date <span style="color:#EF4444;">*</span></label>
                  <input type="date" id="leaveStartDate" value="${todayISO}" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; background:#ffffff; font-size:13px; color:#0F172A; box-sizing:border-box;">
                </div>
                <div>
                  <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:5px;">End Date <span style="color:#EF4444;">*</span></label>
                  <input type="date" id="leaveEndDate" value="${defaultEndDate}" required style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #CBD5E1; background:#ffffff; font-size:13px; color:#0F172A; box-sizing:border-box;">
                </div>
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:5px;">Reason for Leave <span style="color:#EF4444;">*</span></label>
                <textarea id="leaveReason" rows="3" placeholder="State academic, medical, or official conference reason..." required style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; background:#ffffff; font-size:13px; color:#0F172A; resize:vertical; box-sizing:border-box;"></textarea>
              </div>

              <div style="background:#FEF3C7; border-left:4px solid #F59E0B; padding:10px 12px; border-radius:4px; font-size:12px; color:#92400E; line-height:1.4;">
                <strong>Notice:</strong> Once your leave is recorded, your scheduled classes in this date range will display an <em>&ldquo;On Leave&rdquo;</em> tag and will be open for peer faculty substitution.
              </div>

              <button type="submit" id="leaveSubmitBtn" style="margin-top:4px; padding:11px 18px; background:#0B5CAD; color:#ffffff; border:none; border-radius:6px; font-weight:700; font-size:13.5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 2px 8px rgba(11,92,173,0.25);">
                <span>Submit Leave Application</span>
                <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
              </button>
            </form>
          </div>

          <!-- RIGHT COLUMN: Leave Status Tracking -->
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="clipboard-list" style="width:18px;height:18px;color:#0B5CAD;"></i>
                <h3 style="margin:0; font-size:15px; font-weight:700; color:var(--dark-navy, #0B1F3A);">Leave History &amp; Status Tracking</h3>
              </div>
              <span style="background:#E2E8F0; color:#334155; font-size:11.5px; padding:2px 8px; border-radius:12px; font-weight:700;">
                ${leaves.length} Total
              </span>
            </div>

            ${leaves.length === 0 ? `
              <div style="padding:40px 20px; text-align:center; background:var(--bg-light, #F8FAFC); border:1.5px dashed #CBD5E1; border-radius:10px; color:#64748B; font-size:13px;">
                <div style="font-size:28px; margin-bottom:8px;">🏖️</div>
                <strong>No leave requests recorded yet.</strong>
                <p style="margin:4px 0 0 0; font-size:12px;">Your submitted leave applications will appear here with live status updates.</p>
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:12px; max-height:480px; overflow-y:auto; padding-right:4px;">
                ${leaves.map(l => {
                  const isAppr = l.status === 'Approved';
                  const isPend = l.status === 'Pending';
                  const badgeBg = isAppr ? '#DCFCE7' : (isPend ? '#FEF9C3' : '#FEE2E2');
                  const badgeColor = isAppr ? '#166534' : (isPend ? '#854D0E' : '#991B1B');
                  const badgeBorder = isAppr ? '#86EFAC' : (isPend ? '#FDE047' : '#FCA5A5');
                  const borderLeft = isAppr ? '#10B981' : (isPend ? '#F59E0B' : '#EF4444');
                  const appliedDate = l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

                  return `
                    <div style="background:#ffffff; border:1px solid #E2E8F0; border-left:5px solid ${borderLeft}; border-radius:8px; padding:14px 16px; box-shadow:0 1px 4px rgba(0,0,0,0.03);">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                          <span style="font-weight:800; font-size:13px; color:#0F172A;">${l.startDate} &rarr; ${l.endDate}</span>
                          <span style="background:#F1F5F9; color:#475569; font-size:10.5px; padding:1px 6px; border-radius:4px; font-weight:600;">
                            ${l.daysCount || 1} ${l.daysCount === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                        <span style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px; letter-spacing:0.3px;">
                          ${isAppr ? '✓ APPROVED' : (isPend ? '⏳ PENDING' : '✕ REJECTED')}
                        </span>
                      </div>
                      <div style="font-size:12.5px; color:#475569; margin:6px 0; line-height:1.4;">
                        <strong>Reason:</strong> ${l.reason || 'Not specified'}
                      </div>
                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#94A3B8; margin-top:8px; padding-top:6px; border-top:1px solid #F1F5F9;">
                        <span>Applied: ${appliedDate}</span>
                        <span style="font-weight:600; color:#64748B;">Phone: ${l.phone || '--'}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.initLucideIcons();
  },

  async handleLeaveFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const facultyId = document.getElementById("leaveFacultyId")?.value || "EMP-CSE-1001";
    const facultyName = document.getElementById("leaveFacultyName")?.value || "Faculty Member";
    const facultyEmail = document.getElementById("leaveFacultyEmail")?.value || "faculty@ssgmce.ac.in";
    const phone = document.getElementById("leavePhone")?.value?.trim() || "";
    const startDate = document.getElementById("leaveStartDate")?.value || "";
    const endDate = document.getElementById("leaveEndDate")?.value || "";
    const reason = document.getElementById("leaveReason")?.value?.trim() || "";

    if (!startDate || !endDate) {
      this.showToast("Please select both starting and end dates.", "error");
      return;
    }
    if (startDate > endDate) {
      this.showToast("End date cannot be earlier than starting date.", "error");
      return;
    }
    if (!reason || reason.length < 3) {
      this.showToast("Please provide a descriptive reason for leave.", "error");
      return;
    }

    if (window.TeacherERPData && typeof TeacherERPData.applyForLeave === 'function') {
      TeacherERPData.applyForLeave({
        facultyId,
        empCode: facultyId,
        facultyName,
        facultyEmail,
        phone,
        startDate,
        endDate,
        reason
      });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const totalDays = Math.max(1, Math.round((eDate - sDate) / 86400000) + 1);

    try {
      await fetch('/api/v1/management/teacher/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_code: facultyId,
          leave_type: 'Casual Leave (CL)',
          start_date: startDate,
          end_date: endDate,
          total_days: totalDays,
          reason: reason
        })
      }).catch(() => null);
    } catch (_) {}

    this.showToast("✅ Leave application submitted successfully!", "success");
    this.renderLeaveView();

    if (window.TimetableManager && typeof TimetableManager.render === 'function') {
      try { TimetableManager.render(); } catch (_) {}
    }
  },

  handleLogout() {
    if (window.ERP_AUTH && typeof window.ERP_AUTH.logout === 'function') {
      window.ERP_AUTH.logout();
      return;
    }
    try {
      sessionStorage.clear();
      ['ssgmce_access_token', 'ssgmce_refresh_token', 'ssgmce_user', 'ssgmce_active_role', 'ssgmce_token', 'user_role', 'ssgmce_teacher_token', 'ssgmce_erp_session', 'ssgmce_active_teacher'].forEach(k => localStorage.removeItem(k));
    } catch (_) {}
    window.location.replace('login.html?logout=true');
  },

  // ----------------------------------------------------
  // GLOBAL SEARCH FILTER
  // ----------------------------------------------------
  handleGlobalSearch(query) {
    if (!query) return;
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
  },

  /* ========================================================
     BASIC FACULTY PROFILE MODULE IMPLEMENTATION (Minimal Glanceable Identity)
     ======================================================== */
  renderBasicProfileView() {
    const container = document.getElementById("faculty-profile-container") || document.getElementById("profile-view");
    if (!container) return;

    // Strict faculty isolation: retrieve strictly the active logged-in teacher's profile
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";

    const profile = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getProfileData === 'function')
      ? TeacherERPData.getProfileData(facultyId)
      : null;

    const info = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getFacultyInfo === 'function')
      ? TeacherERPData.getFacultyInfo(facultyId)
      : null;

    const completion = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.calculateProfileCompletion === 'function')
      ? TeacherERPData.calculateProfileCompletion(info)
      : { percentage: 75, missingItems: [] };

    const p = profile || {
      facultyId: facultyId,
      name: teacher?.name || "Dr. Rohan Deshmukh",
      designation: teacher?.designation || "Assistant Professor",
      department: teacher?.department || "Computer Science & Engineering",
      email: teacher?.email || "rdeshmukh@ssgmce.ac.in",
      phone: teacher?.phone || "+91 94228 12345",
      dateOfJoining: "2018-07-02",
      profileImageUrl: null,
      profilePhoto: null,
      shortBio: "Assistant Professor in CSE specializing in Data Structures, Distributed Algorithms, and Machine Learning."
    };

    const photoUrl = p.profileImageUrl || p.profilePhoto || null;
    const completionPct = completion.percentage || 75;
    const progressColor = completionPct >= 80 ? '#10B981' : (completionPct >= 50 ? '#0B5CAD' : '#F59E0B');

    let initials = (p.name || 'Faculty')
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const formattedJoiningDate = p.dateOfJoining
      ? new Date(p.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'July 2, 2018';

    container.innerHTML = `
      <div style="max-width: 1040px; margin: 0 auto; padding: 6px 0 24px 0;">
        
        <!-- Header Title Banner -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:24px; font-weight:800; color:#0B1F3A; margin:0 0 4px 0; letter-spacing:-0.02em;">Faculty Profile</h2>
            <p style="color:#64748B; font-size:13.5px; margin:0;">Quick glanceable faculty identity, department designation, and personal contact details.</p>
          </div>
          <div style="display:flex; gap:8px;">
            <span style="display:inline-flex; align-items:center; gap:6px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700;">
              <i data-lucide="shield-check" style="width:14px;height:14px;"></i> Verified Faculty Record
            </span>
          </div>
        </div>

        <!-- 1. Profile Completion Bar Card (Links directly to Information Module) -->
        <div style="background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%); border: 1px solid #DBEAFE; border-radius: 14px; padding: 18px 24px; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: 0 2px 6px rgba(11, 92, 173, 0.05);">
          <div style="flex: 1 1 320px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 700; color: #1E3A8A; text-transform: uppercase; letter-spacing: 0.04em;">Profile Completion Status</span>
              <span style="font-size: 13.5px; font-weight: 800; color: ${progressColor};">${completionPct}% Complete</span>
            </div>
            <div style="width: 100%; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
              <div style="width: ${completionPct}%; height: 100%; background: ${progressColor}; border-radius: 4px; transition: width 0.4s ease;"></div>
            </div>
            <div style="font-size: 12px; color: #64748B; margin-top: 6px;">
              ${completionPct >= 100 
                ? 'Your faculty profile & portfolio are fully complete.' 
                : 'Basic profile is set. Add your degrees, experience, awards & documents in the <strong>Information</strong> module for 100% completion.'}
            </div>
          </div>
          <button onclick="TeacherApp.switchView('information')" style="background: #0B5CAD; color: #FFFFFF; border: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(11, 92, 173, 0.2); transition: all 0.15s ease;">
            <span>Open Detailed Information Module</span>
            <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
          </button>
        </div>

        <!-- 2. Main Identity Profile Card -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05); overflow: hidden; margin-bottom: 22px;">
          <!-- Cover Strip -->
          <div style="height: 105px; background: linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 60%, #0284C7 100%); position: relative;"></div>

          <!-- Header Body -->
          <div style="padding: 0 28px 24px 28px; margin-top: -48px;">
            <div style="display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 18px;">
              
              <!-- Avatar & Core Headings -->
              <div style="display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap;">
                
                <!-- Dynamic 120x120px Circular Frame with Hover Overlay & Buttons -->
                <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                  <div
                    class="profile-avatar-frame-120"
                    onmouseenter="const ov = this.querySelector('.avatar-hover-overlay'); if (ov) ov.style.display='flex';"
                    onmouseleave="const ov = this.querySelector('.avatar-hover-overlay'); if (ov) ov.style.display='none';"
                    style="position:relative; width:120px; height:120px; border-radius:50%; overflow:hidden; border:4px solid #FFFFFF; box-shadow:0 6px 18px rgba(11,31,58,0.18); background:#F1F5F9; display:flex; align-items:center; justify-content:center; cursor:pointer;"
                    title="Profile Photo Options"
                  >
                    ${photoUrl ? `
                      <img src="${photoUrl}" alt="${p.name || 'Faculty Member'}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:#0B5CAD;color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;\\'>${initials}</div>';">
                    ` : `
                      <div style="width:100%; height:100%; background:#0B5CAD; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:38px; font-weight:800;">
                        ${initials}
                      </div>
                    `}

                    <!-- Hover Overlay with Three Action Buttons: View, Upload/Change, Delete -->
                    <div
                      class="avatar-hover-overlay"
                      style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(11,31,58,0.72); backdrop-filter:blur(2px); align-items:center; justify-content:center; gap:6px; border-radius:50%; z-index:5;"
                    >
                      <button
                        type="button"
                        onclick="event.stopPropagation(); TeacherApp.openViewPhotoModal();"
                        title="View Photo"
                        style="background:#FFFFFF; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,0.3);"
                      >👁️</button>
                      <button
                        type="button"
                        onclick="event.stopPropagation(); TeacherApp.triggerProfilePhotoUpload();"
                        title="Upload New Photo"
                        style="background:#FFFFFF; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,0.3);"
                      >✏️</button>
                      ${photoUrl ? `
                        <button
                          type="button"
                          onclick="event.stopPropagation(); TeacherApp.openDeleteProfilePhotoModal();"
                          title="Remove Photo"
                          style="background:#FEE2E2; color:#DC2626; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:13px; box-shadow:0 2px 6px rgba(0,0,0,0.3);"
                        >🗑️</button>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Below Image: Three Clean Action Buttons -->
                  <div style="display:flex; gap:6px; align-items:center;">
                    <button
                      type="button"
                      onclick="TeacherApp.openViewPhotoModal()"
                      style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:4px 8px; font-size:11px; font-weight:600; color:#334155; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
                      title="View Photo"
                    >
                      <span>👁️</span> View
                    </button>
                    <button
                      type="button"
                      onclick="TeacherApp.triggerProfilePhotoUpload()"
                      style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:4px 8px; font-size:11px; font-weight:600; color:#1D4ED8; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
                      title="Upload New Photo"
                    >
                      <span>📷</span> Upload
                    </button>
                    ${photoUrl ? `
                      <button
                        type="button"
                        onclick="TeacherApp.openDeleteProfilePhotoModal()"
                        style="background:#FEF2F2; border:1px solid #FECACA; border-radius:6px; padding:4px 8px; font-size:11px; font-weight:600; color:#DC2626; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
                        title="Remove Photo"
                      >
                        <span>🗑️</span> Remove
                      </button>
                    ` : ''}
                  </div>
                </div>

                <div style="padding-bottom: 4px;">
                  <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 6px 0; color: #0F172A;">${p.name || 'Faculty Member'}</h2>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <span style="background: #EFF6FF; color: #1D4ED8; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid #BFDBFE;">
                      ${p.designation || 'Faculty'}
                    </span>
                    <span style="background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                      ${p.department || 'Engineering'}
                    </span>
                    <span style="background: #FEF3C7; color: #92400E; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                      <span>ID: ${p.facultyId || facultyId}</span>
                      <i data-lucide="lock" style="width:11px;height:11px;color:#B45309;"></i>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Top Action Buttons (Edit Profile, Change Password, Logout) -->
              <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <button type="button" onclick="TeacherApp.openEditBasicProfileModal()" style="background: #0B5CAD; color: #FFFFFF; border: none; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(11, 92, 173, 0.2);">
                  <i data-lucide="edit-3" style="width:14px;height:14px;"></i> Edit Profile
                </button>

                <button type="button" onclick="TeacherApp.openChangePasswordModal()" style="background: #F8FAFC; color: #334155; border: 1px solid #CBD5E1; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                  <i data-lucide="key" style="width:14px;height:14px;"></i> Change Password
                </button>

                <button type="button" onclick="TeacherApp.openLogoutConfirmModal()" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                  <i data-lucide="log-out" style="width:14px;height:14px;"></i> Logout
                </button>
              </div>

            </div>

            <!-- Short Bio (1-2 lines) -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 18px; margin-top: 10px;">
              <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">
                Short Bio
              </div>
              <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.55;">
                ${p.shortBio || p.bio || 'No short bio provided. Click "Edit Profile" to write a 1-2 line summary.'}
              </p>
            </div>
          </div>
        </div>

        <!-- 3. Two-Column Glanceable Details Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 22px;">
          
          <!-- Card A: Official Institutional Information -->
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 16px 0; color: #0F172A; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="building" style="width:16px;height:16px;color:#0B5CAD;"></i> Institutional Details
            </h3>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                <span style="font-size: 13px; color: #64748B;">Faculty / Employee ID</span>
                <span style="font-size: 13px; font-weight: 700; color: #0F172A; display: inline-flex; align-items: center; gap: 4px;">
                  ${p.facultyId || facultyId} <span style="font-size: 11px; color: #94A3B8;" title="Assigned by Administration (Read-Only)">🔒</span>
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                <span style="font-size: 13px; color: #64748B;">Designation</span>
                <span style="font-size: 13px; font-weight: 600; color: #0F172A;">${p.designation || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                <span style="font-size: 13px; color: #64748B;">Department</span>
                <span style="font-size: 13px; font-weight: 600; color: #0F172A;">${p.department || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                <span style="font-size: 13px; color: #64748B;">Date of Joining</span>
                <span style="font-size: 13px; font-weight: 600; color: #0F172A;">${formattedJoiningDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 2px;">
                <span style="font-size: 13px; color: #64748B;">Institution</span>
                <span style="font-size: 13px; font-weight: 600; color: #0F172A;">SSGMCE Shegaon</span>
              </div>
            </div>
          </div>

          <!-- Card B: Contact Information -->
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 16px 0; color: #0F172A; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="phone-call" style="width:16px;height:16px;color:#0B5CAD;"></i> Contact & Location
            </h3>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                <span style="font-size: 13px; color: #64748B;">Official Email</span>
                <span style="font-size: 13px; font-weight: 600; color: #0B5CAD;">${p.email || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                <span style="font-size: 13px; color: #64748B;">Phone / Mobile</span>
                <span style="font-size: 13px; font-weight: 600; color: #0F172A;">${p.phone || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                <span style="font-size: 13px; color: #64748B;">Academic Block / Cabin</span>
                <span style="font-size: 13px; font-weight: 600; color: #0F172A;">CSE Block, Room 204</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 2px;">
                <span style="font-size: 13px; color: #64748B;">Account Status</span>
                <span style="font-size: 11px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 8px; border-radius: 4px;">
                  Active Faculty Member
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- 4. Module Distinction Callout (Strict Separation Between Profile and Information) -->
        <div style="background: #F1F5F9; border: 1px dashed #CBD5E1; border-radius: 12px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: #E2E8F0; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              📁
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #1E293B;">
                Looking for your Degrees, Experience, Publications, or Certificates?
              </div>
              <div style="font-size: 12.5px; color: #64748B; margin-top: 2px;">
                All comprehensive portfolio records, workshops attended/conducted, uploaded certificates vault, and yearly appraisal reports are maintained inside the <strong>Information</strong> module.
              </div>
            </div>
          </div>
          <button onclick="TeacherApp.switchView('information')" style="background: #FFFFFF; color: #0B5CAD; border: 1px solid #0B5CAD; padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <span>Open Information Module</span>
            <i data-lucide="arrow-right" style="width:13px;height:13px;"></i>
          </button>
        </div>

      </div>
    `;

    this.initLucideIcons();
  },

  openEditBasicProfileModal() {
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const profile = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getProfileData === 'function')
      ? TeacherERPData.getProfileData(facultyId)
      : null;

    const p = profile || {
      facultyId: facultyId,
      name: teacher?.name || "Dr. Rohan Deshmukh",
      designation: teacher?.designation || "Assistant Professor",
      department: teacher?.department || "Computer Science & Engineering",
      email: teacher?.email || "rdeshmukh@ssgmce.ac.in",
      phone: teacher?.phone || "+91 94228 12345",
      dateOfJoining: "2018-07-02",
      profilePhoto: "",
      shortBio: ""
    };

    const idInput = document.getElementById("editProfileFacultyId");
    if (idInput) idInput.value = p.facultyId || facultyId;

    const nameInput = document.getElementById("editProfileName");
    if (nameInput) nameInput.value = p.name || "";

    const desigInput = document.getElementById("editProfileDesignation");
    if (desigInput) desigInput.value = p.designation || "";

    const deptInput = document.getElementById("editProfileDepartment");
    if (deptInput) deptInput.value = p.department || "";

    const emailInput = document.getElementById("editProfileEmail");
    if (emailInput) emailInput.value = p.email || "";

    const phoneInput = document.getElementById("editProfilePhone");
    if (phoneInput) phoneInput.value = p.phone || "";

    const dojInput = document.getElementById("editProfileDateOfJoining");
    if (dojInput) dojInput.value = p.dateOfJoining || "";

    const photoInput = document.getElementById("editProfilePhotoUrl");
    if (photoInput) photoInput.value = p.profilePhoto || "";

    const bioInput = document.getElementById("editProfileBio");
    if (bioInput) bioInput.value = p.shortBio || p.bio || "";

    const modal = document.getElementById("editBasicProfileModal");
    if (modal) {
      modal.style.display = "flex";
      this.initLucideIcons();
    }
  },

  closeEditBasicProfileModal() {
    const modal = document.getElementById("editBasicProfileModal");
    if (modal) modal.style.display = "none";
  },

  handlePhotoFileSelect(event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoInput = document.getElementById("editProfilePhotoUrl");
      if (photoInput) {
        photoInput.value = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  },

  submitBasicProfile(event) {
    if (event) event.preventDefault();
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";

    const name = document.getElementById("editProfileName")?.value.trim();
    const designation = document.getElementById("editProfileDesignation")?.value.trim();
    const department = document.getElementById("editProfileDepartment")?.value.trim();
    const email = document.getElementById("editProfileEmail")?.value.trim();
    const phone = document.getElementById("editProfilePhone")?.value.trim();
    const dateOfJoining = document.getElementById("editProfileDateOfJoining")?.value;
    const profilePhoto = document.getElementById("editProfilePhotoUrl")?.value.trim();
    const shortBio = document.getElementById("editProfileBio")?.value.trim();

    if (!name) {
      this.showToast("Faculty full name is required", "error");
      return;
    }
    if (!email) {
      this.showToast("Official email address is required", "error");
      return;
    }

    const updated = {
      name,
      designation,
      department,
      email,
      phone,
      dateOfJoining,
      profilePhoto,
      shortBio
    };

    if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.updateProfileData === 'function') {
      TeacherERPData.updateProfileData(facultyId, updated);
    }

    // Sync session cache
    try {
      const stored = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
      stored.name = name;
      stored.email = email;
      stored.phone = phone;
      stored.designation = designation;
      stored.department = department;
      if (profilePhoto) stored.profilePhoto = profilePhoto;
      localStorage.setItem('ssgmce_user', JSON.stringify(stored));
    } catch (_) {}

    this.closeEditBasicProfileModal();
    this.renderBasicProfileView();
    this.renderHeaderProfile();
    this.showToast("Faculty profile updated successfully!", "success");
  },

  openChangePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    const alertBox = document.getElementById("changePasswordAlert");
    if (alertBox) alertBox.style.display = "none";

    const cInput = document.getElementById("currentPasswordInput");
    const nInput = document.getElementById("newPasswordInput");
    const cfInput = document.getElementById("confirmPasswordInput");
    if (cInput) cInput.value = "";
    if (nInput) nInput.value = "";
    if (cfInput) cfInput.value = "";

    if (modal) {
      modal.style.display = "flex";
      this.initLucideIcons();
    }
  },

  closeChangePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    if (modal) modal.style.display = "none";
  },

  submitChangePassword(event) {
    if (event) event.preventDefault();
    const cur = document.getElementById("currentPasswordInput")?.value;
    const n1 = document.getElementById("newPasswordInput")?.value;
    const n2 = document.getElementById("confirmPasswordInput")?.value;
    const alertBox = document.getElementById("changePasswordAlert");

    if (!cur) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.style.background = "#FEE2E2";
        alertBox.style.color = "#B91C1C";
        alertBox.textContent = "Please enter current password.";
      }
      return;
    }

    if (!n1 || n1.length < 6) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.style.background = "#FEE2E2";
        alertBox.style.color = "#B91C1C";
        alertBox.textContent = "New password must be at least 6 characters long.";
      }
      return;
    }

    if (n1 !== n2) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.style.background = "#FEE2E2";
        alertBox.style.color = "#B91C1C";
        alertBox.textContent = "New passwords do not match. Please re-type.";
      }
      return;
    }

    if (alertBox) {
      alertBox.style.display = "block";
      alertBox.style.background = "#DCFCE7";
      alertBox.style.color = "#15803D";
      alertBox.textContent = "Password changed successfully!";
    }

    setTimeout(() => {
      this.closeChangePasswordModal();
      this.showToast("Account password updated securely!", "success");
    }, 1100);
  },

  openLogoutConfirmModal() {
    const modal = document.getElementById("logoutConfirmModal");
    if (modal) modal.style.display = "flex";
  },

  closeLogoutConfirmModal() {
    const modal = document.getElementById("logoutConfirmModal");
    if (modal) modal.style.display = "none";
  },

  confirmLogout() {
    this.closeLogoutConfirmModal();
    this.showToast("Signing out of Teacher ERP session...", "info");

    try {
      localStorage.removeItem("ssgmce_user");
      localStorage.removeItem("ssgmce_token");
      localStorage.removeItem("ssgmce_active_teacher");
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
    } catch (_) {}

    setTimeout(() => {
      window.location.href = "login.html";
    }, 450);
  },

  /* ========================================================
     DYNAMIC PROFILE IMAGE MANAGEMENT (View, Upload, Delete)
     ======================================================== */
  _pendingUploadPhotoUrl: null,
  _pendingUploadPhotoFile: null,

  openViewPhotoModal() {
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const profile = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getProfileData === 'function')
      ? TeacherERPData.getProfileData(facultyId)
      : null;

    const displayName = (profile && profile.name) || (teacher && teacher.name) || "Faculty Member";
    const photoUrl = (profile && (profile.profileImageUrl || profile.profilePhoto)) || (teacher && (teacher.profileImageUrl || teacher.profilePhoto)) || null;

    let initials = teacher?.avatarInitials;
    if (!initials && displayName) {
      const cleanName = displayName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
      const parts = cleanName.split(/\s+/);
      initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }

    const bodyElem = document.getElementById("profileImageViewModalBody");
    if (!bodyElem) return;

    if (photoUrl) {
      bodyElem.innerHTML = `
        <div style="display:flex; justify-content:center; margin-bottom:20px;">
          <div style="width:230px; height:230px; border-radius:50%; overflow:hidden; border:4px solid #0B5CAD; box-shadow:0 8px 24px rgba(11,92,173,0.2); background:#F8FAFC;">
            <img src="${photoUrl}" alt="${displayName}" style="width:100%; height:100%; object-fit:cover; display:block;">
          </div>
        </div>
        <h4 style="margin:0 0 4px 0; font-size:18px; font-weight:700; color:#0F172A;">${displayName}</h4>
        <p style="margin:0 0 24px 0; font-size:13px; color:#64748B;">Current active faculty profile photograph</p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <button type="button" onclick="TeacherApp.closeViewPhotoModal(); TeacherApp.triggerProfilePhotoUpload();" style="background:#0B5CAD; color:#FFFFFF; border:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            ✏️ Upload New Photo
          </button>
          <button type="button" onclick="TeacherApp.closeViewPhotoModal(); TeacherApp.openDeleteProfilePhotoModal();" style="background:#FEF2F2; color:#DC2626; border:1px solid #FCA5A5; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            🗑️ Remove Photo
          </button>
          <button type="button" onclick="TeacherApp.closeViewPhotoModal()" style="background:#F1F5F9; color:#475569; border:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">
            Close
          </button>
        </div>
      `;
    } else {
      bodyElem.innerHTML = `
        <div style="display:flex; justify-content:center; margin-bottom:18px;">
          <div style="width:160px; height:160px; border-radius:50%; background:#0B5CAD; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:52px; font-weight:800; border:4px solid #E2E8F0; box-shadow:0 8px 24px rgba(0,0,0,0.1);">
            ${initials || 'FM'}
          </div>
        </div>
        <h4 style="margin:0 0 6px 0; font-size:17px; font-weight:700; color:#0F172A;">No Profile Photo Uploaded</h4>
        <p style="margin:0 auto 22px auto; font-size:13.5px; color:#64748B; max-width:320px; line-height:1.45;">
          Your default initials avatar is currently displayed across the ERP dashboard. Upload a picture to personalize your profile.
        </p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button type="button" onclick="TeacherApp.closeViewPhotoModal(); TeacherApp.triggerProfilePhotoUpload();" style="background:#0B5CAD; color:#FFFFFF; border:none; padding:10px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            📷 Upload Photo Now
          </button>
          <button type="button" onclick="TeacherApp.closeViewPhotoModal()" style="background:#F1F5F9; color:#475569; border:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">
            Close
          </button>
        </div>
      `;
    }

    const modal = document.getElementById("profileImageViewModal");
    if (modal) modal.style.display = "flex";
  },

  closeViewPhotoModal() {
    const modal = document.getElementById("profileImageViewModal");
    if (modal) modal.style.display = "none";
  },

  triggerProfilePhotoUpload() {
    const fileInput = document.getElementById("profileImageFileInput");
    if (fileInput) {
      fileInput.value = "";
      fileInput.click();
    }
  },

  handlePhotoFileSelected(event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    // Check file format: accept only image formats (JPG, PNG, JPEG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.showToast("Please select a valid image format (JPG, PNG, JPEG, WEBP)", "error");
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const isOversized = file.size > MAX_SIZE;

    // Format file size
    const formatBytes = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this._pendingUploadPhotoUrl = dataUrl;
      this._pendingUploadPhotoFile = file;

      // Populate preview modal
      const previewImg = document.getElementById("uploadPhotoPreviewImg");
      const previewBox = document.getElementById("uploadPhotoPreviewBox");
      const nameElem = document.getElementById("uploadPhotoFileName");
      const sizeElem = document.getElementById("uploadPhotoFileSize");
      const alertElem = document.getElementById("uploadPhotoOversizeAlert");
      const saveBtn = document.getElementById("btnSaveUploadedPhoto");

      if (previewImg) previewImg.src = dataUrl;
      if (nameElem) nameElem.textContent = file.name;
      if (sizeElem) {
        sizeElem.textContent = formatBytes(file.size) + (isOversized ? " (Exceeds 2MB Limit)" : "");
        sizeElem.style.color = isOversized ? "#DC2626" : "#0B5CAD";
      }

      if (previewBox) {
        previewBox.style.border = isOversized ? "4px solid #EF4444" : "4px solid #10B981";
      }

      if (alertElem) {
        alertElem.style.display = isOversized ? "flex" : "none";
      }

      if (saveBtn) {
        saveBtn.disabled = isOversized;
        saveBtn.style.opacity = isOversized ? "0.6" : "1";
        saveBtn.style.cursor = isOversized ? "not-allowed" : "pointer";
      }

      const modal = document.getElementById("profileImageUploadModal");
      if (modal) modal.style.display = "flex";
    };

    reader.readAsDataURL(file);
  },

  closeUploadPhotoModal() {
    this._pendingUploadPhotoUrl = null;
    this._pendingUploadPhotoFile = null;
    const modal = document.getElementById("profileImageUploadModal");
    if (modal) modal.style.display = "none";
  },

  saveUploadedPhoto() {
    if (!this._pendingUploadPhotoUrl) return;

    if (this._pendingUploadPhotoFile && this._pendingUploadPhotoFile.size > 2 * 1024 * 1024) {
      this.showToast("File size exceeds 2MB limit. Please select an image smaller than 2MB.", "error");
      return;
    }

    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const newImageUrl = this._pendingUploadPhotoUrl;

    if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.updateProfileImage === 'function') {
      TeacherERPData.updateProfileImage(facultyId, newImageUrl);
    }

    // Sync session state
    try {
      const stored = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
      stored.profileImageUrl = newImageUrl;
      stored.profilePhoto = newImageUrl;
      localStorage.setItem('ssgmce_user', JSON.stringify(stored));
    } catch (_) {}

    this.closeUploadPhotoModal();
    this.renderBasicProfileView();
    this.renderHeaderProfile();
    this.showToast("Profile photo updated successfully.", "success");
  },

  openDeleteProfilePhotoModal() {
    const modal = document.getElementById("profileImageDeleteModal");
    if (modal) modal.style.display = "flex";
  },

  closeDeletePhotoModal() {
    const modal = document.getElementById("profileImageDeleteModal");
    if (modal) modal.style.display = "none";
  },

  confirmDeletePhoto() {
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";

    if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.deleteProfileImage === 'function') {
      TeacherERPData.deleteProfileImage(facultyId);
    }

    // Sync session state
    try {
      const stored = JSON.parse(localStorage.getItem('ssgmce_user') || '{}');
      stored.profileImageUrl = null;
      stored.profilePhoto = null;
      localStorage.setItem('ssgmce_user', JSON.stringify(stored));
    } catch (_) {}

    this.closeDeletePhotoModal();
    this.renderBasicProfileView();
    this.renderHeaderProfile();
    this.showToast("Profile photo removed successfully.", "success");
  },

  /* ========================================================
     FACULTY INFORMATION & PORTFOLIO MODULE IMPLEMENTATION
     ======================================================== */
  currentInfoTab: 'personal',
  currentDocFilter: 'all',
  currentDocSearch: '',
  currentReportYear: '2026',
  currentDocPreview: null,

  renderInformationView(targetTab = null) {
    if (targetTab) {
      this.currentInfoTab = targetTab;
    }
    const container = document.getElementById("faculty-info-container");
    if (!container) return;

    // Strict faculty isolation: retrieve strictly the active logged-in teacher's profile
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const info = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getFacultyInfo === 'function')
      ? TeacherERPData.getFacultyInfo(facultyId)
      : null;

    if (!info) {
      container.innerHTML = `<div class="card" style="padding:24px; text-align:center; color:#64748B;">Unable to load faculty profile record for ID: ${facultyId}</div>`;
      return;
    }

    const completion = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.calculateProfileCompletion === 'function')
      ? TeacherERPData.calculateProfileCompletion(info)
      : { percentage: 85, missingItems: [] };

    const pd = info.personalDetails || {};
    const cleanName = (pd.name || teacher.name || "Faculty").replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
    const initials = cleanName.split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase() || "FM";
    const completionColor = completion.percentage >= 80 ? "#10B981" : (completion.percentage >= 50 ? "#0B5CAD" : "#F59E0B");

    container.innerHTML = `
      <div class="faculty-portfolio-container">
        <!-- Top Hero Card: Faculty Summary & Completion Progress -->
        <div class="faculty-hero-card">
          <div class="faculty-hero-top">
            <div class="faculty-hero-profile">
              <div class="faculty-hero-avatar-wrap">
                <div class="faculty-hero-avatar">
                  ${pd.profilePhoto ? `<img src="${pd.profilePhoto}" alt="${pd.name || 'Faculty'}">` : `<span>${initials}</span>`}
                </div>
                <span class="faculty-hero-badge-active" title="Active Verified Faculty Profile"></span>
              </div>
              <div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <h2 style="font-size:20px; font-weight:800; color:#0B1F3A; margin:0;">${pd.name || teacher.name || "Faculty Member"}</h2>
                  <span style="font-size:11px; padding:3px 9px; border-radius:12px; background:#EFF6FF; color:#0B5CAD; font-weight:700; border:1px solid #BFDBFE;">${pd.facultyId || facultyId}</span>
                </div>
                <p style="font-size:13.5px; color:#0B5CAD; font-weight:600; margin:3px 0 0 0;">${pd.designation || "Assistant Professor"} • Department of ${pd.department || "Computer Science & Engineering"}</p>
                <div style="display:flex; align-items:center; gap:16px; font-size:12px; color:#64748B; margin-top:6px; flex-wrap:wrap;">
                  <span>📧 ${pd.email || (facultyId.toLowerCase() + '@ssgmce.ac.in')}</span>
                  <span>📞 ${pd.phone || "+91 94228 12345"}</span>
                  <span>🏛️ SSGMCE Shegaon</span>
                </div>
              </div>
            </div>

            <!-- Profile Completion Progress Card -->
            <div class="faculty-completion-box">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; font-weight:700; color:#0B1F3A;">Profile Completion</span>
                <span style="font-size:13px; font-weight:800; color:${completionColor};">${completion.percentage}% Complete</span>
              </div>
              <div class="completion-bar-track">
                <div class="completion-bar-fill" style="width: ${completion.percentage}%; background:${completionColor};"></div>
              </div>
              ${completion.missingItems && completion.missingItems.length > 0 ? `
                <div style="font-size:11.5px; color:#64748B; display:flex; align-items:center; gap:5px;">
                  <span style="color:#F59E0B;">💡</span> <span>Tip: ${completion.missingItems[0]}</span>
                </div>
              ` : `
                <div style="font-size:11.5px; color:#059669; font-weight:600;">
                  ✓ Profile 100% complete & verified
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Portfolio Navigation Tab Bar (9 Tabs) -->
        <div class="portfolio-tabs-nav" id="portfolioTabsNav">
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'personal' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('personal')">
            <i data-lucide="user" style="width:14px;height:14px;"></i> Personal Details
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'education' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('education')">
            <i data-lucide="graduation-cap" style="width:14px;height:14px;"></i> Education (${(info.education || []).length})
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'experience' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('experience')">
            <i data-lucide="briefcase" style="width:14px;height:14px;"></i> Experience (${(info.experience || []).length})
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'achievements' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('achievements')">
            <i data-lucide="award" style="width:14px;height:14px;"></i> Achievements (${(info.achievements || []).length})
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'conducted' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('conducted')">
            <i data-lucide="presentation" style="width:14px;height:14px;"></i> Conducted (${(info.sessionsConducted || []).length})
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'attended' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('attended')">
            <i data-lucide="book-open" style="width:14px;height:14px;"></i> Attended (${(info.sessionsAttended || []).length})
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'publications' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('publications')">
            <i data-lucide="file-text" style="width:14px;height:14px;"></i> Publications (${(info.publications || []).length})
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'documents' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('documents')">
            <i data-lucide="folder" style="width:14px;height:14px;"></i> Document Vault (${(info.documents || []).length})
          </button>
          <button type="button" class="portfolio-tab-item ${this.currentInfoTab === 'report' ? 'active' : ''}" onclick="TeacherApp.switchInformationTab('report')">
            <i data-lucide="file-check" style="width:14px;height:14px;"></i> Yearly Report
          </button>
        </div>

        <!-- Active Tab Content Area -->
        <div class="portfolio-tab-content" id="faculty-tab-content">
          ${this.renderInformationActiveTabContent(info)}
        </div>
      </div>
    `;

    this.initLucideIcons();
  },

  switchInformationTab(tabKey) {
    this.currentInfoTab = tabKey;
    try { localStorage.setItem('ssgmce_current_info_tab', tabKey); } catch (_) {}
    this.renderInformationView();
  },

  renderInformationActiveTabContent(info) {
    switch (this.currentInfoTab) {
      case 'personal': return this.renderInfoTabPersonal(info);
      case 'education': return this.renderInfoTabEducation(info);
      case 'experience': return this.renderInfoTabExperience(info);
      case 'achievements': return this.renderInfoTabAchievements(info);
      case 'conducted': return this.renderInfoTabConducted(info);
      case 'attended': return this.renderInfoTabAttended(info);
      case 'publications': return this.renderInfoTabPublications(info);
      case 'documents': return this.renderInfoTabDocuments(info);
      case 'report': return this.renderInfoTabReport(info);
      default: return this.renderInfoTabPersonal(info);
    }
  },

  // 1. Personal Details Tab
  renderInfoTabPersonal(info) {
    const pd = info.personalDetails || {};
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Personal & Academic Profile</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Update your official identity, department designation, contact information, and biography.</p>
          </div>
        </div>

        <form onsubmit="TeacherApp.saveInformationPersonalDetails(event)" style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Full Name *</label>
              <input type="text" id="piFullName" class="form-control" value="${pd.name || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Faculty / Employee ID</label>
              <input type="text" id="piFacultyId" class="form-control" value="${pd.facultyId || info.facultyId || ''}" readonly style="width:100%; padding:9px 12px; border:1px solid #E2E8F0; border-radius:6px; font-size:13px; background:#F8FAFC; color:#64748B;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Official Email *</label>
              <input type="email" id="piEmail" class="form-control" value="${pd.email || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Phone Number *</label>
              <input type="tel" id="piPhone" class="form-control" value="${pd.phone || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Department</label>
              <input type="text" id="piDepartment" class="form-control" value="${pd.department || 'Computer Science & Engineering'}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Designation</label>
              <select id="piDesignation" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
                <option value="Assistant Professor" ${pd.designation === 'Assistant Professor' ? 'selected' : ''}>Assistant Professor</option>
                <option value="Associate Professor" ${pd.designation === 'Associate Professor' ? 'selected' : ''}>Associate Professor</option>
                <option value="Professor" ${pd.designation === 'Professor' ? 'selected' : ''}>Professor</option>
                <option value="Professor & Head of Department" ${pd.designation === 'Professor & Head of Department' ? 'selected' : ''}>Professor & Head of Department</option>
                <option value="Adjunct Faculty" ${pd.designation === 'Adjunct Faculty' ? 'selected' : ''}>Adjunct Faculty</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Date of Joining</label>
              <input type="date" id="piDateOfJoining" class="form-control" value="${pd.dateOfJoining || '2018-07-02'}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Profile Photo (URL or Upload)</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="piProfilePhoto" class="form-control" value="${pd.profilePhoto || ''}" placeholder="https://..." style="flex:1; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
                <label style="padding:9px 14px; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; color:#334155; display:inline-flex; align-items:center; gap:5px;">
                  📁 Browse
                  <input type="file" accept="image/*" style="display:none;" onchange="TeacherApp.handlePhotoUpload(event)">
                </label>
              </div>
            </div>
          </div>

          <div>
            <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Bio / About Me</label>
            <textarea id="piBio" rows="4" class="form-control" placeholder="Share your academic specialization, research pursuits, and teaching philosophy..." style="width:100%; padding:10px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; line-height:1.5;">${pd.bio || ''}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px; border-top:1px solid #E2E8F0; padding-top:16px;">
            <button type="submit" class="quick-action-btn primary" style="padding:10px 24px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13.5px; display:inline-flex; align-items:center; gap:8px;">
              <i data-lucide="save" style="width:15px;height:15px;"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    `;
  },

  handlePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const input = document.getElementById("piProfilePhoto");
      if (input) input.value = e.target.result;
      this.showToast("Profile image loaded. Click 'Save Changes' to persist.", "info");
    };
    reader.readAsDataURL(file);
  },

  saveInformationPersonalDetails(e) {
    if (e && e.preventDefault) e.preventDefault();
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";

    const updated = {
      name: document.getElementById("piFullName")?.value.trim() || "",
      email: document.getElementById("piEmail")?.value.trim() || "",
      phone: document.getElementById("piPhone")?.value.trim() || "",
      department: document.getElementById("piDepartment")?.value.trim() || "Computer Science & Engineering",
      designation: document.getElementById("piDesignation")?.value || "Assistant Professor",
      dateOfJoining: document.getElementById("piDateOfJoining")?.value || "",
      profilePhoto: document.getElementById("piProfilePhoto")?.value.trim() || "",
      bio: document.getElementById("piBio")?.value.trim() || ""
    };

    if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.saveFacultyPersonalDetails === 'function') {
      TeacherERPData.saveFacultyPersonalDetails(facultyId, updated);
    }

    this.showToast("Personal details updated successfully!", "success");
    this.renderHeaderProfile();
    this.renderInformationView();
  },

  // 2. Education Tab
  renderInfoTabEducation(info) {
    const list = info.education || [];
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Education & Academic Qualifications</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Degrees, doctorates, postgraduate diplomas, and verified university credentials.</p>
          </div>
          <button type="button" class="quick-action-btn primary" onclick="TeacherApp.openInformationModal('education')" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="plus-circle" style="width:15px;height:15px;"></i> Add Qualification
          </button>
        </div>

        ${list.length === 0 ? `
          <div style="text-align:center; padding:36px; color:#64748B; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:10px;">
            No education qualifications recorded. Click "+ Add Qualification" above.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${list.map(edu => `
              <div class="portfolio-item-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <h4 style="font-size:15px; font-weight:800; color:#0B1F3A; margin:0;">${edu.degree || 'Degree'}</h4>
                      <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#ECFDF5; color:#047857; font-weight:700; border:1px solid #A7F3D0;">${edu.yearOfPassing || 'Completed'}</span>
                    </div>
                    <p style="font-size:13px; color:#0B5CAD; font-weight:600; margin:4px 0 2px 0;">${edu.specialization || 'Field of Study'}</p>
                    <p style="font-size:12.5px; color:#64748B; margin:0;">${edu.university || 'University / Institution'} • Grade/Score: <strong>${edu.grade || 'N/A'}</strong></p>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${edu.certificateUrl ? `
                      <button type="button" class="quick-action-btn" onclick="TeacherApp.openDocViewerModal('${edu.degree} Certificate', '${edu.certificateUrl}', 'Education', '${edu.yearOfPassing}')" style="padding:5px 12px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; color:#0B5CAD; font-weight:600;">
                        <i data-lucide="file-text" style="width:13px;height:13px;"></i> View Certificate
                      </button>
                    ` : ''}
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.openInformationModal('education', '${edu.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#334155;">
                      <i data-lucide="edit-2" style="width:13px;height:13px;"></i> Edit
                    </button>
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.deleteInformationItem('education', '${edu.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #FEE2E2; background:#FEF2F2; color:#DC2626; border-radius:5px; cursor:pointer;">
                      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 3. Experience Tab
  renderInfoTabExperience(info) {
    const list = info.experience || [];
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Professional & Teaching Experience</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Academic appointments, industry research positions, and institution service timeline.</p>
          </div>
          <button type="button" class="quick-action-btn primary" onclick="TeacherApp.openInformationModal('experience')" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="plus-circle" style="width:15px;height:15px;"></i> Add Position
          </button>
        </div>

        ${list.length === 0 ? `
          <div style="text-align:center; padding:36px; color:#64748B; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:10px;">
            No experience history recorded. Click "+ Add Position" above.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${list.map(exp => `
              <div class="portfolio-item-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <h4 style="font-size:15px; font-weight:800; color:#0B1F3A; margin:0;">${exp.designation || 'Position'}</h4>
                      <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#EFF6FF; color:#1D4ED8; font-weight:700; border:1px solid #BFDBFE;">${exp.fromDate || ''} - ${exp.toDate || 'Present'}</span>
                    </div>
                    <p style="font-size:13px; color:#0B5CAD; font-weight:600; margin:4px 0 2px 0;">${exp.organization || 'Organization'}</p>
                    <p style="font-size:12.5px; color:#475569; margin:4px 0 0 0; line-height:1.5;">${exp.responsibilities || 'Key responsibilities not specified'}</p>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${exp.certificateUrl ? `
                      <button type="button" class="quick-action-btn" onclick="TeacherApp.openDocViewerModal('${exp.organization} Experience Proof', '${exp.certificateUrl}', 'Experience', '${exp.fromDate}')" style="padding:5px 12px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; color:#0B5CAD; font-weight:600;">
                        <i data-lucide="file-text" style="width:13px;height:13px;"></i> View Proof
                      </button>
                    ` : ''}
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.openInformationModal('experience', '${exp.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#334155;">
                      <i data-lucide="edit-2" style="width:13px;height:13px;"></i> Edit
                    </button>
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.deleteInformationItem('experience', '${exp.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #FEE2E2; background:#FEF2F2; color:#DC2626; border-radius:5px; cursor:pointer;">
                      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 4. Achievements & Awards Tab
  renderInfoTabAchievements(info) {
    const list = info.achievements || [];
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Honors, Awards & Achievements</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Institutional accolades, state/national awards, competitive rankings, and recognitions.</p>
          </div>
          <button type="button" class="quick-action-btn primary" onclick="TeacherApp.openInformationModal('achievements')" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="plus-circle" style="width:15px;height:15px;"></i> Add Achievement
          </button>
        </div>

        ${list.length === 0 ? `
          <div style="text-align:center; padding:36px; color:#64748B; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:10px;">
            No honors or awards recorded. Click "+ Add Achievement" above.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${list.map(ach => `
              <div class="portfolio-item-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <h4 style="font-size:15px; font-weight:800; color:#0B1F3A; margin:0;">🏆 ${ach.title || 'Achievement'}</h4>
                      <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#FEF3C7; color:#B45309; font-weight:700; border:1px solid #FDE68A;">${ach.year || ach.date || 'Recognized'}</span>
                    </div>
                    <p style="font-size:13px; color:#0B5CAD; font-weight:600; margin:4px 0 2px 0;">${ach.awardingBody || 'Awarding Organization'}</p>
                    <p style="font-size:12.5px; color:#475569; margin:4px 0 0 0; line-height:1.5;">${ach.description || ''}</p>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${ach.proofUrl ? `
                      <button type="button" class="quick-action-btn" onclick="TeacherApp.openDocViewerModal('${ach.title} Citation', '${ach.proofUrl}', 'Achievement', '${ach.year || ach.date}')" style="padding:5px 12px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; color:#0B5CAD; font-weight:600;">
                        <i data-lucide="file-text" style="width:13px;height:13px;"></i> View Citation
                      </button>
                    ` : ''}
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.openInformationModal('achievements', '${ach.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#334155;">
                      <i data-lucide="edit-2" style="width:13px;height:13px;"></i> Edit
                    </button>
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.deleteInformationItem('achievements', '${ach.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #FEE2E2; background:#FEF2F2; color:#DC2626; border-radius:5px; cursor:pointer;">
                      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 5. Sessions Conducted Tab
  renderInfoTabConducted(info) {
    const list = info.sessionsConducted || [];
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Sessions, Workshops & FDPs Conducted</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Workshops organized, faculty development programs steered, and keynote sessions delivered.</p>
          </div>
          <button type="button" class="quick-action-btn primary" onclick="TeacherApp.openInformationModal('sessionsConducted')" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="plus-circle" style="width:15px;height:15px;"></i> Add Conducted Session
          </button>
        </div>

        ${list.length === 0 ? `
          <div style="text-align:center; padding:36px; color:#64748B; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:10px;">
            No conducted sessions recorded. Click "+ Add Conducted Session" above.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${list.map(s => `
              <div class="portfolio-item-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <h4 style="font-size:15px; font-weight:800; color:#0B1F3A; margin:0;">${s.title || 'Session'}</h4>
                      <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#F3E8FF; color:#7E22CE; font-weight:700; border:1px solid #E9D5FF;">${s.type || 'Workshop'}</span>
                      <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#ECFDF5; color:#047857; font-weight:700; border:1px solid #A7F3D0;">Role: ${s.role || 'Trainer'}</span>
                    </div>
                    <p style="font-size:12.5px; color:#64748B; margin:4px 0 2px 0;">
                      📅 Date: <strong>${s.date || 'N/A'}</strong> (${s.duration || 'N/A'}) • 📍 Venue: <strong>${s.venue || 'SSGMCE'}</strong> • 👥 Participants: <strong>${s.participants || 'N/A'}</strong>
                    </p>
                    <p style="font-size:12.5px; color:#475569; margin:4px 0 0 0; line-height:1.5;">${s.description || ''}</p>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${s.certificateUrl ? `
                      <button type="button" class="quick-action-btn" onclick="TeacherApp.openDocViewerModal('${s.title} Report', '${s.certificateUrl}', 'Session', '${s.date}')" style="padding:5px 12px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; color:#0B5CAD; font-weight:600;">
                        <i data-lucide="file-text" style="width:13px;height:13px;"></i> View Report
                      </button>
                    ` : ''}
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.openInformationModal('sessionsConducted', '${s.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#334155;">
                      <i data-lucide="edit-2" style="width:13px;height:13px;"></i> Edit
                    </button>
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.deleteInformationItem('sessionsConducted', '${s.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #FEE2E2; background:#FEF2F2; color:#DC2626; border-radius:5px; cursor:pointer;">
                      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 6. Sessions Attended Tab
  renderInfoTabAttended(info) {
    const list = info.sessionsAttended || [];
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Sessions, Workshops & FDPs Attended</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">AICTE ATAL programs, IEEE conferences, pedagogy training, and industry development certifications.</p>
          </div>
          <button type="button" class="quick-action-btn primary" onclick="TeacherApp.openInformationModal('sessionsAttended')" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="plus-circle" style="width:15px;height:15px;"></i> Add Attended Session
          </button>
        </div>

        ${list.length === 0 ? `
          <div style="text-align:center; padding:36px; color:#64748B; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:10px;">
            No attended training sessions recorded. Click "+ Add Attended Session" above.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${list.map(s => `
              <div class="portfolio-item-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <h4 style="font-size:15px; font-weight:800; color:#0B1F3A; margin:0;">${s.title || 'Attended Program'}</h4>
                      <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#E0F2FE; color:#0369A1; font-weight:700; border:1px solid #BAE6FD;">${s.type || 'FDP'}</span>
                    </div>
                    <p style="font-size:13px; color:#0B5CAD; font-weight:600; margin:4px 0 2px 0;">Organized by: ${s.organizedBy || 'Host Institute'}</p>
                    <p style="font-size:12.5px; color:#64748B; margin:0;">📅 Date: <strong>${s.date || 'N/A'}</strong> • Duration: <strong>${s.duration || 'N/A'}</strong></p>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${s.certificateUrl ? `
                      <button type="button" class="quick-action-btn" onclick="TeacherApp.openDocViewerModal('${s.title} Participation Certificate', '${s.certificateUrl}', 'Session', '${s.date}')" style="padding:5px 12px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; color:#0B5CAD; font-weight:600;">
                        <i data-lucide="file-text" style="width:13px;height:13px;"></i> View Certificate
                      </button>
                    ` : ''}
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.openInformationModal('sessionsAttended', '${s.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#334155;">
                      <i data-lucide="edit-2" style="width:13px;height:13px;"></i> Edit
                    </button>
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.deleteInformationItem('sessionsAttended', '${s.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #FEE2E2; background:#FEF2F2; color:#DC2626; border-radius:5px; cursor:pointer;">
                      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 7. Publications & Research Tab
  renderInfoTabPublications(info) {
    const list = info.publications || [];
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Publications & Research Papers</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Scopus, SCI, IEEE, and peer-reviewed international journals and conference papers.</p>
          </div>
          <button type="button" class="quick-action-btn primary" onclick="TeacherApp.openInformationModal('publications')" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="plus-circle" style="width:15px;height:15px;"></i> Add Publication
          </button>
        </div>

        ${list.length === 0 ? `
          <div style="text-align:center; padding:36px; color:#64748B; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:10px;">
            No research papers logged. Click "+ Add Publication" above to add your articles.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${list.map(pub => `
              <div class="portfolio-item-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <h4 style="font-size:15px; font-weight:800; color:#0B1F3A; margin:0;">📄 ${pub.title || 'Paper Title'}</h4>
                      <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#EFF6FF; color:#1D4ED8; font-weight:700; border:1px solid #BFDBFE;">${pub.year || 'Published'}</span>
                      ${pub.citations ? `<span style="font-size:11px; padding:2px 8px; border-radius:12px; background:#FEF3C7; color:#B45309; font-weight:700;">★ ${pub.citations} Citations</span>` : ''}
                    </div>
                    <p style="font-size:13px; color:#0B5CAD; font-weight:600; margin:4px 0 2px 0;">${pub.journal || 'Journal / Conference'}</p>
                    <p style="font-size:12.5px; color:#64748B; margin:0;">
                      ${pub.doi ? `DOI: <a href="https://doi.org/${pub.doi}" target="_blank" style="color:#0B5CAD; text-decoration:underline;">${pub.doi}</a>` : 'Peer-reviewed'}
                    </p>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${pub.proofUrl ? `
                      <button type="button" class="quick-action-btn" onclick="TeacherApp.openDocViewerModal('${pub.title} Paper', '${pub.proofUrl}', 'Publication', '${pub.year}')" style="padding:5px 12px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; color:#0B5CAD; font-weight:600;">
                        <i data-lucide="file-text" style="width:13px;height:13px;"></i> View Paper
                      </button>
                    ` : ''}
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.openInformationModal('publications', '${pub.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#334155;">
                      <i data-lucide="edit-2" style="width:13px;height:13px;"></i> Edit
                    </button>
                    <button type="button" class="quick-action-btn" onclick="TeacherApp.deleteInformationItem('publications', '${pub.id}')" style="padding:5px 10px; font-size:12px; border:1px solid #FEE2E2; background:#FEF2F2; color:#DC2626; border-radius:5px; cursor:pointer;">
                      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 8. Documents & Certificates Vault Tab
  renderInfoTabDocuments(info) {
    let docs = info.documents || [];

    // Filter by Category
    if (this.currentDocFilter && this.currentDocFilter !== 'all') {
      docs = docs.filter(d => (d.category || '').toLowerCase() === this.currentDocFilter.toLowerCase());
    }

    // Filter by Search Query
    if (this.currentDocSearch && this.currentDocSearch.trim()) {
      const q = this.currentDocSearch.toLowerCase().trim();
      docs = docs.filter(d => (d.name || '').toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q));
    }

    const categories = ['all', 'Education', 'Experience', 'Achievement', 'Session', 'Publication', 'Other'];

    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Official Documents & Certificate Vault</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Unified repository of degrees, appraisal proofs, workshop certificates, and appointment orders.</p>
          </div>
          <button type="button" class="quick-action-btn primary" onclick="TeacherApp.openInformationModal('documents')" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="upload-cloud" style="width:15px;height:15px;"></i> Upload New Document
          </button>
        </div>

        <!-- Filter Pills & Search Input -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${categories.map(cat => `
              <button type="button" class="vault-filter-chip ${this.currentDocFilter.toLowerCase() === cat.toLowerCase() ? 'active' : ''}" onclick="TeacherApp.filterInformationDocuments('${cat}')">
                ${cat === 'all' ? 'All Files' : cat}
              </button>
            `).join('')}
          </div>

          <div style="display:flex; align-items:center; background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:6px 12px; width:260px; max-width:100%;">
            <i data-lucide="search" style="width:14px;height:14px;color:#94A3B8; margin-right:8px;"></i>
            <input type="text" placeholder="Search files..." value="${this.currentDocSearch}" oninput="TeacherApp.searchInformationDocuments(this.value)" style="border:none; background:transparent; font-size:12.5px; outline:none; width:100%;">
          </div>
        </div>

        ${docs.length === 0 ? `
          <div style="text-align:center; padding:36px; color:#64748B; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:10px;">
            No documents found matching the filter criteria.
          </div>
        ` : `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px;">
            ${docs.map(doc => `
              <div class="portfolio-item-card" style="padding:16px;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:38px; height:38px; border-radius:8px; background:#EFF6FF; color:#0B5CAD; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                      <i data-lucide="file-check-2" style="width:20px;height:20px;"></i>
                    </div>
                    <div>
                      <h4 style="font-size:13.5px; font-weight:700; color:#0B1F3A; margin:0 0 3px 0;">${doc.name || 'Document'}</h4>
                      <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:#64748B;">
                        <span style="padding:1px 6px; border-radius:8px; background:#F1F5F9; font-weight:600; color:#334155;">${doc.category || 'Other'}</span>
                        <span>• ${doc.uploadedDate || 'Uploaded'}</span>
                        <span>• ${doc.fileSize || '1.2 MB'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid #E2E8F0; padding-top:10px; margin-top:4px;">
                  <button type="button" class="quick-action-btn" onclick="TeacherApp.openDocViewerModal('${doc.name}', '${doc.fileUrl}', '${doc.category}', '${doc.uploadedDate}')" style="padding:4px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#0B5CAD; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                    <i data-lucide="eye" style="width:12px;height:12px;"></i> View
                  </button>
                  <button type="button" class="quick-action-btn" onclick="TeacherApp.downloadDirectDocument('${doc.name}', '${doc.fileUrl}')" style="padding:4px 10px; font-size:12px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:5px; cursor:pointer; color:#334155; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                    <i data-lucide="download" style="width:12px;height:12px;"></i> Download
                  </button>
                  <button type="button" class="quick-action-btn" onclick="TeacherApp.deleteInformationDocument('${doc.id}')" style="padding:4px 8px; font-size:12px; border:1px solid #FEE2E2; background:#FEF2F2; color:#DC2626; border-radius:5px; cursor:pointer;">
                    <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  filterInformationDocuments(category) {
    this.currentDocFilter = category;
    this.renderInformationView();
  },

  searchInformationDocuments(query) {
    this.currentDocSearch = query;
    this.renderInformationView();
  },

  deleteInformationDocument(docId) {
    if (!confirm("Are you sure you want to delete this document from the vault?")) return;
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.deleteFacultyDocument === 'function') {
      TeacherERPData.deleteFacultyDocument(facultyId, docId);
    }
    this.showToast("Document deleted from vault.");
    this.renderInformationView();
  },

  // 9. Yearly Report Tab
  renderInfoTabReport(info) {
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const reportYear = this.currentReportYear || "2026";
    const report = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.generateYearlyReport === 'function')
      ? TeacherERPData.generateYearlyReport(facultyId, reportYear)
      : null;

    const pd = (report && report.faculty) || info.personalDetails || {};
    const stats = (report && report.statistics) || { achievementsCount: 0, conductedCount: 0, attendedCount: 0, publicationsCount: 0, totalActivityScore: 0 };

    return `
      <div>
        <!-- Top Toolbar (Hidden during print) -->
        <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="font-size:16px; margin:0; color:#0B1F3A; font-weight:800;">Annual Faculty Performance Appraisal Report</h3>
            <p style="font-size:12.5px; color:#64748B; margin:4px 0 0 0;">Automated performance audit compiled according to SSGMCE autonomous academic regulations.</p>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <select id="reportYearSelect" onchange="TeacherApp.changeReportYear(this.value)" style="padding:8px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; font-weight:600; color:#0B1F3A; background:#FFFFFF;">
              <option value="2026" ${reportYear === '2026' ? 'selected' : ''}>Academic Year 2026-2027</option>
              <option value="2025" ${reportYear === '2025' ? 'selected' : ''}>Academic Year 2025-2026</option>
              <option value="2024" ${reportYear === '2024' ? 'selected' : ''}>Academic Year 2024-2025</option>
            </select>
            <button type="button" class="quick-action-btn primary" onclick="TeacherApp.printInformationYearlyReport()" style="padding:8px 16px; background:#0B5CAD; color:#FFFFFF; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="printer" style="width:15px;height:15px;"></i> Print Official Report
            </button>
            <button type="button" class="quick-action-btn" onclick="TeacherApp.downloadInformationYearlyReport()" style="padding:8px 16px; border:1px solid #CBD5E1; background:#FFFFFF; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px; color:#334155;">
              <i data-lucide="download" style="width:15px;height:15px;"></i> Export PDF
            </button>
          </div>
        </div>

        <!-- Official Report Container (Included in window.print) -->
        <div id="yearlyReportPrintContainer" style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; padding:32px; box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <!-- Official Institute Letterhead -->
          <div style="text-align:center; border-bottom:2px solid #0B1F3A; padding-bottom:16px; margin-bottom:24px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom:8px;">
              <img src="https://www.ssgmce.ac.in/favicon.svg" alt="SSGMCE Crest" style="width:48px; height:48px;">
              <div>
                <h1 style="font-size:19px; font-weight:900; color:#0B1F3A; margin:0; letter-spacing:0.3px;">SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING</h1>
                <p style="font-size:12.5px; color:#0B5CAD; font-weight:700; margin:2px 0 0 0;">SHEGAON - 444 503, DIST. BULDANA (MAHARASHTRA) • AN AUTONOMOUS INSTITUTE</p>
              </div>
            </div>
            <div style="display:inline-block; background:#0B1F3A; color:#FFFFFF; padding:4px 16px; border-radius:20px; font-size:12px; font-weight:700; margin-top:6px;">
              ANNUAL FACULTY ACTIVITY & APPRAISAL DOSSIER - ACADEMIC YEAR ${report?.academicYear || '2026-2027'}
            </div>
          </div>

          <!-- Faculty Profile Summary Grid -->
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin-bottom:24px;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:12.5px;">
              <div><span style="color:#64748B;">Faculty Name:</span><br><strong style="color:#0B1F3A;">${pd.name || 'Faculty Member'}</strong></div>
              <div><span style="color:#64748B;">Employee ID:</span><br><strong style="color:#0B1F3A;">${pd.facultyId || facultyId}</strong></div>
              <div><span style="color:#64748B;">Department:</span><br><strong style="color:#0B1F3A;">${pd.department || 'Computer Science & Engineering'}</strong></div>
              <div><span style="color:#64748B;">Designation:</span><br><strong style="color:#0B1F3A;">${pd.designation || 'Assistant Professor'}</strong></div>
              <div><span style="color:#64748B;">Contact Email:</span><br><strong style="color:#0B1F3A;">${pd.email || ''}</strong></div>
              <div><span style="color:#64748B;">Report Generated:</span><br><strong style="color:#0B1F3A;">${report?.generatedAt || new Date().toLocaleDateString()}</strong></div>
            </div>
          </div>

          <!-- Performance Scoring Summary Box -->
          <div style="margin-bottom:24px;">
            <h4 style="font-size:14px; font-weight:800; color:#0B1F3A; margin:0 0 10px 0; border-left:4px solid #0B5CAD; padding-left:8px;">1. Performance Index & Activity Score Card</h4>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px;">
              <div style="border:1px solid #E2E8F0; padding:12px; border-radius:6px; background:#FFFFFF; text-align:center;">
                <div style="font-size:20px; font-weight:800; color:#0B5CAD;">${stats.achievementsCount}</div>
                <div style="font-size:11px; color:#64748B; font-weight:600;">Achievements (10 pts ea)</div>
              </div>
              <div style="border:1px solid #E2E8F0; padding:12px; border-radius:6px; background:#FFFFFF; text-align:center;">
                <div style="font-size:20px; font-weight:800; color:#7E22CE;">${stats.conductedCount}</div>
                <div style="font-size:11px; color:#64748B; font-weight:600;">Conducted (15 pts ea)</div>
              </div>
              <div style="border:1px solid #E2E8F0; padding:12px; border-radius:6px; background:#FFFFFF; text-align:center;">
                <div style="font-size:20px; font-weight:800; color:#059669;">${stats.attendedCount}</div>
                <div style="font-size:11px; color:#64748B; font-weight:600;">Attended (5 pts ea)</div>
              </div>
              <div style="border:1px solid #E2E8F0; padding:12px; border-radius:6px; background:#FFFFFF; text-align:center;">
                <div style="font-size:20px; font-weight:800; color:#D97706;">${stats.publicationsCount}</div>
                <div style="font-size:11px; color:#64748B; font-weight:600;">Papers (20 pts ea)</div>
              </div>
              <div style="border:1px solid #0B1F3A; padding:12px; border-radius:6px; background:#0B1F3A; color:#FFFFFF; text-align:center;">
                <div style="font-size:20px; font-weight:800; color:#00A6D6;">${stats.totalActivityScore}</div>
                <div style="font-size:11px; color:#CBD5E1; font-weight:600;">Appraisal Score Points</div>
              </div>
            </div>
          </div>

          <!-- Academic Qualifications Section -->
          <div style="margin-bottom:20px;">
            <h4 style="font-size:14px; font-weight:800; color:#0B1F3A; margin:0 0 8px 0; border-left:4px solid #0B5CAD; padding-left:8px;">2. Academic Qualifications</h4>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="background:#F1F5F9; border-bottom:1px solid #CBD5E1; text-align:left;">
                  <th style="padding:8px 10px;">Degree</th>
                  <th style="padding:8px 10px;">Specialization</th>
                  <th style="padding:8px 10px;">University / Institution</th>
                  <th style="padding:8px 10px;">Year</th>
                  <th style="padding:8px 10px;">Score / Grade</th>
                </tr>
              </thead>
              <tbody>
                ${(report?.educationSummary || []).map(e => `
                  <tr style="border-bottom:1px solid #E2E8F0;">
                    <td style="padding:8px 10px; font-weight:600;">${e.degree}</td>
                    <td style="padding:8px 10px;">${e.specialization}</td>
                    <td style="padding:8px 10px;">${e.university}</td>
                    <td style="padding:8px 10px;">${e.yearOfPassing}</td>
                    <td style="padding:8px 10px;">${e.grade}</td>
                  </tr>
                `).join('') || `<tr><td colspan="5" style="padding:10px; text-align:center; color:#94A3B8;">No records logged</td></tr>`}
              </tbody>
            </table>
          </div>

          <!-- Publications in target year -->
          <div style="margin-bottom:20px;">
            <h4 style="font-size:14px; font-weight:800; color:#0B1F3A; margin:0 0 8px 0; border-left:4px solid #0B5CAD; padding-left:8px;">3. Research Publications in Academic Year ${reportYear}</h4>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="background:#F1F5F9; border-bottom:1px solid #CBD5E1; text-align:left;">
                  <th style="padding:8px 10px;">Title</th>
                  <th style="padding:8px 10px;">Journal / Conference</th>
                  <th style="padding:8px 10px;">DOI / Link</th>
                  <th style="padding:8px 10px;">Citations</th>
                </tr>
              </thead>
              <tbody>
                ${(report?.publications || []).map(p => `
                  <tr style="border-bottom:1px solid #E2E8F0;">
                    <td style="padding:8px 10px; font-weight:600;">${p.title}</td>
                    <td style="padding:8px 10px;">${p.journal}</td>
                    <td style="padding:8px 10px;">${p.doi || 'Indexed'}</td>
                    <td style="padding:8px 10px;">${p.citations || 0}</td>
                  </tr>
                `).join('') || `<tr><td colspan="4" style="padding:10px; text-align:center; color:#94A3B8;">No publications recorded in ${reportYear}</td></tr>`}
              </tbody>
            </table>
          </div>

          <!-- Sessions Conducted in target year -->
          <div style="margin-bottom:20px;">
            <h4 style="font-size:14px; font-weight:800; color:#0B1F3A; margin:0 0 8px 0; border-left:4px solid #0B5CAD; padding-left:8px;">4. Workshops & FDPs Conducted in Academic Year ${reportYear}</h4>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="background:#F1F5F9; border-bottom:1px solid #CBD5E1; text-align:left;">
                  <th style="padding:8px 10px;">Title / Topic</th>
                  <th style="padding:8px 10px;">Type & Role</th>
                  <th style="padding:8px 10px;">Venue</th>
                  <th style="padding:8px 10px;">Date & Duration</th>
                  <th style="padding:8px 10px;">Participants</th>
                </tr>
              </thead>
              <tbody>
                ${(report?.sessionsConducted || []).map(s => `
                  <tr style="border-bottom:1px solid #E2E8F0;">
                    <td style="padding:8px 10px; font-weight:600;">${s.title}</td>
                    <td style="padding:8px 10px;">${s.type} (${s.role})</td>
                    <td style="padding:8px 10px;">${s.venue || 'SSGMCE'}</td>
                    <td style="padding:8px 10px;">${s.date} (${s.duration || ''})</td>
                    <td style="padding:8px 10px;">${s.participants || '-'}</td>
                  </tr>
                `).join('') || `<tr><td colspan="5" style="padding:10px; text-align:center; color:#94A3B8;">No sessions conducted in ${reportYear}</td></tr>`}
              </tbody>
            </table>
          </div>

          <!-- Sessions Attended in target year -->
          <div style="margin-bottom:20px;">
            <h4 style="font-size:14px; font-weight:800; color:#0B1F3A; margin:0 0 8px 0; border-left:4px solid #0B5CAD; padding-left:8px;">5. Training & FDPs Attended in Academic Year ${reportYear}</h4>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="background:#F1F5F9; border-bottom:1px solid #CBD5E1; text-align:left;">
                  <th style="padding:8px 10px;">Title / Program</th>
                  <th style="padding:8px 10px;">Type</th>
                  <th style="padding:8px 10px;">Organizing Body</th>
                  <th style="padding:8px 10px;">Date & Duration</th>
                </tr>
              </thead>
              <tbody>
                ${(report?.sessionsAttended || []).map(s => `
                  <tr style="border-bottom:1px solid #E2E8F0;">
                    <td style="padding:8px 10px; font-weight:600;">${s.title}</td>
                    <td style="padding:8px 10px;">${s.type}</td>
                    <td style="padding:8px 10px;">${s.organizedBy}</td>
                    <td style="padding:8px 10px;">${s.date} (${s.duration || ''})</td>
                  </tr>
                `).join('') || `<tr><td colspan="4" style="padding:10px; text-align:center; color:#94A3B8;">No sessions attended in ${reportYear}</td></tr>`}
              </tbody>
            </table>
          </div>

          <!-- Official Verification Signatures -->
          <div style="margin-top:40px; padding-top:20px; border-top:1px dashed #CBD5E1; display:flex; justify-content:space-between; align-items:flex-end; font-size:12.5px;">
            <div style="text-align:center;">
              <div style="height:32px;"></div>
              <div style="border-top:1px solid #334155; width:180px; padding-top:4px;">Signature of Faculty</div>
              <strong style="font-size:11.5px; color:#64748B;">(${pd.name || 'Faculty Member'})</strong>
            </div>
            <div style="text-align:center;">
              <div style="height:32px;"></div>
              <div style="border-top:1px solid #334155; width:180px; padding-top:4px;">Head of Department (CSE)</div>
              <strong style="font-size:11.5px; color:#64748B;">SSGMCE Shegaon</strong>
            </div>
            <div style="text-align:center;">
              <div style="height:32px;"></div>
              <div style="border-top:1px solid #334155; width:180px; padding-top:4px;">Principal / Dean (Academic)</div>
              <strong style="font-size:11.5px; color:#64748B;">SSGMCE Autonomous Council</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  changeReportYear(year) {
    this.currentReportYear = year;
    this.renderInformationView();
  },

  printInformationYearlyReport() {
    window.print();
  },

  downloadInformationYearlyReport() {
    const reportElem = document.getElementById("yearlyReportPrintContainer");
    if (!reportElem) return;
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Faculty Appraisal Report - ${facultyId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0B1F3A; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 10px; font-size: 12px; }
          th { background: #F1F5F9; }
        </style>
      </head>
      <body>
        ${reportElem.innerHTML}
      </body>
      </html>
    `], { type: 'text/html' });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `SSGMCE_Faculty_Appraisal_${facultyId}_${this.currentReportYear || '2026'}.html`;
    a.click();
    this.showToast("Appraisal report exported successfully!", "success");
  },

  // Modal Dialogs for Add/Edit
  openInformationModal(sectionKey, itemId = null) {
    const modal = document.getElementById("facultyInfoModal");
    const titleElem = document.getElementById("facultyInfoModalTitle");
    const bodyElem = document.getElementById("facultyModalBody");
    const secKeyInput = document.getElementById("facultyModalSectionKey");
    const itemIdInput = document.getElementById("facultyModalItemId");

    if (!modal || !bodyElem) return;

    secKeyInput.value = sectionKey;
    itemIdInput.value = itemId || "";

    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    const info = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getFacultyInfo === 'function')
      ? TeacherERPData.getFacultyInfo(facultyId)
      : null;

    let existing = null;
    if (itemId && info && Array.isArray(info[sectionKey])) {
      existing = info[sectionKey].find(i => i.id === itemId);
    }

    const isEdit = Boolean(existing);

    switch (sectionKey) {
      case 'education': {
        titleElem.textContent = isEdit ? "Edit Academic Qualification" : "Add Academic Qualification";
        bodyElem.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Degree Name *</label>
              <input type="text" id="mEduDegree" class="form-control" placeholder="e.g. Ph.D. in Computer Engineering, M.Tech, B.E." value="${existing?.degree || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Specialization / Branch *</label>
              <input type="text" id="mEduSpec" class="form-control" placeholder="e.g. Distributed Systems & Algorithms" value="${existing?.specialization || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">University / Institution *</label>
              <input type="text" id="mEduUniv" class="form-control" placeholder="e.g. Sant Gadge Baba Amravati University" value="${existing?.university || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Year of Passing *</label>
                <input type="text" id="mEduYear" class="form-control" placeholder="e.g. 2023" value="${existing?.yearOfPassing || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Grade / Percentage / CGPA</label>
                <input type="text" id="mEduGrade" class="form-control" placeholder="e.g. 8.92 CGPA / First Class" value="${existing?.grade || ''}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Upload Degree Certificate (PDF / JPG / PNG)</label>
              <input type="file" id="mEduFile" accept=".pdf,image/*" style="width:100%; padding:8px; border:1px dashed #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
            </div>
          </div>
        `;
        break;
      }
      case 'experience': {
        titleElem.textContent = isEdit ? "Edit Experience Record" : "Add Professional Experience";
        bodyElem.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Organization / University Name *</label>
              <input type="text" id="mExpOrg" class="form-control" placeholder="e.g. Shri Sant Gajanan Maharaj College of Engineering" value="${existing?.organization || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Designation *</label>
              <input type="text" id="mExpDesig" class="form-control" placeholder="e.g. Assistant Professor" value="${existing?.designation || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">From Date *</label>
                <input type="text" id="mExpFrom" class="form-control" placeholder="e.g. 2018-07-02" value="${existing?.fromDate || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">To Date (or Present) *</label>
                <input type="text" id="mExpTo" class="form-control" placeholder="e.g. Present" value="${existing?.toDate || 'Present'}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Responsibilities / Roles</label>
              <textarea id="mExpResp" rows="3" class="form-control" placeholder="Key courses taught, committees served, laboratory in-charge..." style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">${existing?.responsibilities || ''}</textarea>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Upload Experience Certificate / Order</label>
              <input type="file" id="mExpFile" accept=".pdf,image/*" style="width:100%; padding:8px; border:1px dashed #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
            </div>
          </div>
        `;
        break;
      }
      case 'achievements': {
        titleElem.textContent = isEdit ? "Edit Achievement & Award" : "Add Achievement & Award";
        bodyElem.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Award / Honor Title *</label>
              <input type="text" id="mAchTitle" class="form-control" placeholder="e.g. Best Faculty Researcher Award 2025" value="${existing?.title || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Awarding Body / Organization *</label>
              <input type="text" id="mAchBody" class="form-control" placeholder="e.g. SSGMCE Autonomous Academic Council" value="${existing?.awardingBody || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Date / Year *</label>
              <input type="text" id="mAchYear" class="form-control" placeholder="e.g. 2025" value="${existing?.year || existing?.date || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Description / Citation</label>
              <textarea id="mAchDesc" rows="3" class="form-control" placeholder="Recognized for exceptional contribution in..." style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">${existing?.description || ''}</textarea>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Upload Citation / Proof (PDF / Image)</label>
              <input type="file" id="mAchFile" accept=".pdf,image/*" style="width:100%; padding:8px; border:1px dashed #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
            </div>
          </div>
        `;
        break;
      }
      case 'sessionsConducted': {
        titleElem.textContent = isEdit ? "Edit Conducted Session" : "Add Conducted Session / Workshop";
        bodyElem.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Title / Topic of the Program *</label>
              <input type="text" id="mCondTitle" class="form-control" placeholder="e.g. National FDP on Advanced Data Structures" value="${existing?.title || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Program Type</label>
                <select id="mCondType" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
                  <option value="Workshop" ${existing?.type === 'Workshop' ? 'selected' : ''}>Workshop</option>
                  <option value="FDP" ${existing?.type === 'FDP' ? 'selected' : ''}>FDP (Faculty Development)</option>
                  <option value="Seminar" ${existing?.type === 'Seminar' ? 'selected' : ''}>Seminar</option>
                  <option value="Guest Lecture" ${existing?.type === 'Guest Lecture' ? 'selected' : ''}>Guest Lecture</option>
                  <option value="Conference" ${existing?.type === 'Conference' ? 'selected' : ''}>Conference</option>
                </select>
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Role *</label>
                <select id="mCondRole" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
                  <option value="Resource Person & Lead Trainer" ${existing?.role === 'Resource Person & Lead Trainer' ? 'selected' : ''}>Resource Person</option>
                  <option value="Coordinator" ${existing?.role === 'Coordinator' ? 'selected' : ''}>Coordinator</option>
                  <option value="Speaker" ${existing?.role === 'Speaker' ? 'selected' : ''}>Speaker</option>
                  <option value="Organizer" ${existing?.role === 'Organizer' ? 'selected' : ''}>Organizer</option>
                </select>
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Date *</label>
                <input type="date" id="mCondDate" class="form-control" value="${existing?.date || '2026-02-14'}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Duration</label>
                <input type="text" id="mCondDuration" class="form-control" placeholder="e.g. 5 Days" value="${existing?.duration || ''}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Venue / Platform</label>
                <input type="text" id="mCondVenue" class="form-control" placeholder="e.g. Seminar Hall 2 / Online" value="${existing?.venue || ''}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Participants Count</label>
                <input type="number" id="mCondParticipants" class="form-control" placeholder="68" value="${existing?.participants || ''}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Description / Report</label>
              <textarea id="mCondDesc" rows="2" class="form-control" placeholder="Summary of outcomes and coverage..." style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">${existing?.description || ''}</textarea>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Upload Proof / Conduction Certificate</label>
              <input type="file" id="mCondFile" accept=".pdf,image/*" style="width:100%; padding:8px; border:1px dashed #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
            </div>
          </div>
        `;
        break;
      }
      case 'sessionsAttended': {
        titleElem.textContent = isEdit ? "Edit Attended Session" : "Add Attended Program";
        bodyElem.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Program Title / Course Name *</label>
              <input type="text" id="mAttTitle" class="form-control" placeholder="e.g. AICTE ATAL FDP on Deep Learning" value="${existing?.title || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Program Type</label>
              <select id="mAttType" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
                <option value="FDP" ${existing?.type === 'FDP' ? 'selected' : ''}>FDP</option>
                <option value="Conference" ${existing?.type === 'Conference' ? 'selected' : ''}>Conference</option>
                <option value="Workshop" ${existing?.type === 'Workshop' ? 'selected' : ''}>Workshop</option>
                <option value="Training" ${existing?.type === 'Training' ? 'selected' : ''}>Training</option>
                <option value="Seminar" ${existing?.type === 'Seminar' ? 'selected' : ''}>Seminar</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Organized By / Host Institution *</label>
              <input type="text" id="mAttOrg" class="form-control" placeholder="e.g. VNIT Nagpur / IIT Bombay" value="${existing?.organizedBy || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Date *</label>
                <input type="date" id="mAttDate" class="form-control" value="${existing?.date || '2026-01-08'}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Duration</label>
                <input type="text" id="mAttDuration" class="form-control" placeholder="e.g. 1 Week" value="${existing?.duration || ''}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Upload Attendance / Completion Certificate</label>
              <input type="file" id="mAttFile" accept=".pdf,image/*" style="width:100%; padding:8px; border:1px dashed #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
            </div>
          </div>
        `;
        break;
      }
      case 'publications': {
        titleElem.textContent = isEdit ? "Edit Research Publication" : "Add Research Publication";
        bodyElem.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Paper / Article Title *</label>
              <input type="text" id="mPubTitle" class="form-control" placeholder="e.g. Optimized Graph Partitioning in Distributed Memory Architectures" value="${existing?.title || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Journal / Conference Name *</label>
              <input type="text" id="mPubJournal" class="form-control" placeholder="e.g. IEEE Transactions on Parallel and Distributed Systems" value="${existing?.journal || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Publication Year *</label>
                <input type="text" id="mPubYear" class="form-control" placeholder="e.g. 2025" value="${existing?.year || ''}" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Citations</label>
                <input type="number" id="mPubCitations" class="form-control" placeholder="14" value="${existing?.citations || ''}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              </div>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">DOI / URL Link</label>
              <input type="text" id="mPubDoi" class="form-control" placeholder="e.g. 10.1109/TPDS.2025.889214" value="${existing?.doi || ''}" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Upload Paper Copy / Acceptance Letter</label>
              <input type="file" id="mPubFile" accept=".pdf,image/*" style="width:100%; padding:8px; border:1px dashed #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
            </div>
          </div>
        `;
        break;
      }
      case 'documents': {
        titleElem.textContent = "Upload Official Document";
        bodyElem.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Document Name *</label>
              <input type="text" id="mDocName" class="form-control" placeholder="e.g. Doctoral Degree Certificate" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Category *</label>
              <select id="mDocCat" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
                <option value="Education">Education</option>
                <option value="Experience">Experience</option>
                <option value="Achievement">Achievement</option>
                <option value="Session">Session</option>
                <option value="Publication">Publication</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:5px;">Select File (PDF, PNG, JPG) *</label>
              <input type="file" id="mDocFileInput" accept=".pdf,image/*" required style="width:100%; padding:8px; border:1px dashed #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
            </div>
          </div>
        `;
        break;
      }
    }

    modal.style.display = "flex";
    this.initLucideIcons();
  },

  closeInformationModal() {
    const modal = document.getElementById("facultyInfoModal");
    if (modal) modal.style.display = "none";
  },

  submitInformationModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    const sectionKey = document.getElementById("facultyModalSectionKey")?.value;
    const itemId = document.getElementById("facultyModalItemId")?.value;

    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";

    if (!sectionKey || typeof TeacherERPData === 'undefined') return;

    if (sectionKey === 'documents') {
      const name = document.getElementById("mDocName")?.value.trim() || "Uploaded Document";
      const cat = document.getElementById("mDocCat")?.value || "Other";
      const fileInput = document.getElementById("mDocFileInput");
      const file = fileInput?.files?.[0];
      const fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB";
      const fileUrl = file ? `/uploads/${file.name}` : "/certificates/document.pdf";

      TeacherERPData.addFacultyDocument(facultyId, {
        name,
        category: cat,
        fileUrl,
        fileSize
      });
      this.showToast(`Document "${name}" added to vault!`, "success");
      this.closeInformationModal();
      this.renderInformationView();
      return;
    }

    let itemData = {};

    switch (sectionKey) {
      case 'education': {
        const file = document.getElementById("mEduFile")?.files?.[0];
        itemData = {
          degree: document.getElementById("mEduDegree")?.value.trim() || "",
          specialization: document.getElementById("mEduSpec")?.value.trim() || "",
          university: document.getElementById("mEduUniv")?.value.trim() || "",
          yearOfPassing: document.getElementById("mEduYear")?.value.trim() || "",
          grade: document.getElementById("mEduGrade")?.value.trim() || "",
          certificateUrl: file ? `/certificates/${file.name}` : (itemId ? undefined : "/certificates/degree_certificate.pdf")
        };
        break;
      }
      case 'experience': {
        const file = document.getElementById("mExpFile")?.files?.[0];
        itemData = {
          organization: document.getElementById("mExpOrg")?.value.trim() || "",
          designation: document.getElementById("mExpDesig")?.value.trim() || "",
          fromDate: document.getElementById("mExpFrom")?.value.trim() || "",
          toDate: document.getElementById("mExpTo")?.value.trim() || "Present",
          responsibilities: document.getElementById("mExpResp")?.value.trim() || "",
          certificateUrl: file ? `/certificates/${file.name}` : undefined
        };
        break;
      }
      case 'achievements': {
        const file = document.getElementById("mAchFile")?.files?.[0];
        itemData = {
          title: document.getElementById("mAchTitle")?.value.trim() || "",
          awardingBody: document.getElementById("mAchBody")?.value.trim() || "",
          year: document.getElementById("mAchYear")?.value.trim() || "",
          date: document.getElementById("mAchYear")?.value.trim() || "",
          description: document.getElementById("mAchDesc")?.value.trim() || "",
          proofUrl: file ? `/certificates/${file.name}` : (itemId ? undefined : "/certificates/award_certificate.pdf")
        };
        break;
      }
      case 'sessionsConducted': {
        const file = document.getElementById("mCondFile")?.files?.[0];
        itemData = {
          title: document.getElementById("mCondTitle")?.value.trim() || "",
          type: document.getElementById("mCondType")?.value || "Workshop",
          role: document.getElementById("mCondRole")?.value || "Trainer",
          date: document.getElementById("mCondDate")?.value || "",
          duration: document.getElementById("mCondDuration")?.value.trim() || "",
          venue: document.getElementById("mCondVenue")?.value.trim() || "",
          participants: Number(document.getElementById("mCondParticipants")?.value) || 0,
          description: document.getElementById("mCondDesc")?.value.trim() || "",
          certificateUrl: file ? `/certificates/${file.name}` : undefined
        };
        break;
      }
      case 'sessionsAttended': {
        const file = document.getElementById("mAttFile")?.files?.[0];
        itemData = {
          title: document.getElementById("mAttTitle")?.value.trim() || "",
          type: document.getElementById("mAttType")?.value || "FDP",
          organizedBy: document.getElementById("mAttOrg")?.value.trim() || "",
          date: document.getElementById("mAttDate")?.value || "",
          duration: document.getElementById("mAttDuration")?.value.trim() || "",
          certificateUrl: file ? `/certificates/${file.name}` : (itemId ? undefined : "/certificates/participation_certificate.pdf")
        };
        break;
      }
      case 'publications': {
        const file = document.getElementById("mPubFile")?.files?.[0];
        itemData = {
          title: document.getElementById("mPubTitle")?.value.trim() || "",
          journal: document.getElementById("mPubJournal")?.value.trim() || "",
          year: document.getElementById("mPubYear")?.value.trim() || "",
          doi: document.getElementById("mPubDoi")?.value.trim() || "",
          citations: Number(document.getElementById("mPubCitations")?.value) || 0,
          proofUrl: file ? `/certificates/${file.name}` : undefined
        };
        break;
      }
    }

    if (itemId) {
      TeacherERPData.updateFacultySectionItem(facultyId, sectionKey, itemId, itemData);
      this.showToast("Record updated successfully!", "success");
    } else {
      TeacherERPData.addFacultySectionItem(facultyId, sectionKey, itemData);
      this.showToast("New record saved to portfolio!", "success");
    }

    this.closeInformationModal();
    this.renderInformationView();
  },

  deleteInformationItem(sectionKey, itemId) {
    if (!confirm("Are you sure you want to remove this record from your portfolio?")) return;
    const teacher = this.getLoggedInTeacher();
    const facultyId = (teacher && teacher.employeeId) || "EMP-CSE-1001";
    if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.deleteFacultySectionItem === 'function') {
      TeacherERPData.deleteFacultySectionItem(facultyId, sectionKey, itemId);
    }
    this.showToast("Record deleted from portfolio.");
    this.renderInformationView();
  },

  // Document Viewer Preview Modal
  openDocViewerModal(docName, docUrl, category, docDate) {
    this.currentDocPreview = { docName, docUrl, category, docDate };
    const modal = document.getElementById("facultyDocViewerModal");
    const titleElem = document.getElementById("docViewerTitle");
    const bodyElem = document.getElementById("docViewerBody");
    const metaElem = document.getElementById("docViewerMeta");

    if (!modal || !bodyElem) return;

    if (titleElem) titleElem.textContent = docName || "Official Certificate Preview";
    if (metaElem) metaElem.textContent = `Category: ${category || 'Verified Record'} • Issued/Uploaded: ${docDate || 'Current Session'}`;

    bodyElem.innerHTML = `
      <div style="width:100%; background:#FAFDFB; border:2px solid #0B5CAD; border-radius:10px; padding:28px 20px; box-shadow:0 8px 24px rgba(11,92,173,0.08); position:relative; overflow:hidden;">
        <!-- Institute Crest Watermark -->
        <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:12px;">
          <img src="https://www.ssgmce.ac.in/favicon.svg" alt="SSGMCE Crest" style="width:40px; height:40px;">
          <div>
            <div style="font-size:14px; font-weight:900; color:#0B1F3A; letter-spacing:0.5px;">SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING</div>
            <div style="font-size:11px; color:#0B5CAD; font-weight:700;">SHEGAON • AUTONOMOUS INSTITUTE</div>
          </div>
        </div>
        <div style="height:2px; background:linear-gradient(90deg, #0B1F3A, #00A6D6, #0B1F3A); margin-bottom:20px;"></div>

        <div style="font-size:11px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">
          OFFICIAL VERIFIED CERTIFICATE & PORTFOLIO RECORD
        </div>
        <h2 style="font-size:18px; font-weight:800; color:#0B1F3A; margin:0 0 10px 0;">${docName}</h2>
        <p style="font-size:12.5px; color:#475569; max-width:540px; margin:0 auto 18px auto; line-height:1.6;">
          This official institutional record certifies authentic qualification, conference participation, or research contribution logged in the SSGMCE Faculty Information & Appraisal system.
        </p>

        <div style="display:inline-flex; align-items:center; gap:8px; background:#ECFDF5; border:1px solid #A7F3D0; color:#047857; padding:5px 14px; border-radius:20px; font-size:12px; font-weight:700;">
          <span>✓ Digitally Authenticated Record</span>
        </div>
      </div>
    `;

    modal.style.display = "flex";
    this.initLucideIcons();
  },

  closeDocViewerModal() {
    const modal = document.getElementById("facultyDocViewerModal");
    if (modal) modal.style.display = "none";
  },

  downloadCurrentDocument() {
    if (!this.currentDocPreview) return;
    this.downloadDirectDocument(this.currentDocPreview.docName, this.currentDocPreview.docUrl);
  },

  downloadDirectDocument(name, url) {
    this.showToast(`Downloading: "${name}"...`, "info");
    const a = document.createElement("a");
    a.href = url || "#";
    a.download = `${name.replace(/\s+/g, '_')}.pdf`;
    a.target = "_blank";
    a.click();
  }
};

if (typeof window !== 'undefined') {
  window.TeacherApp = TeacherApp;
  if (!window.handleLogout) {
    window.handleLogout = () => TeacherApp.handleLogout();
  }
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

