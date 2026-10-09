/* ========================================================
   TEACHER ERP — TIMETABLE MODULE CONTROLLER
   teacher_timetable.js / teacher-timetable.js
   SSGMCE Teacher Portal
   Integrated Regular Timetable & Test/Assessment Scheduling
   ======================================================== */

const TeacherTimetableApp = {
  selectedTimetableDate: null,

  // Scheduled tests collection
  tests: [],
  activeDeleteTestId: null,
  teacherSubjects: [],

  init() {
    this.bindEvents();
    this.renderHeaderProfile();

    // Connect to Standalone Test Scheduler Module if loaded
    if (typeof TeacherTestScheduler !== 'undefined') {
      TeacherTestScheduler.init();
      if (TeacherTestScheduler.tests && TeacherTestScheduler.tests.length > 0) {
        this.tests = TeacherTestScheduler.tests;
      } else {
        this.loadCachedTests();
      }
    } else {
      this.loadCachedTests();
    }

    // 1. Instant local render (0ms response time, zero blank screen)
    this.renderTimetableView();
    this.initLucideIcons();

    // Cross-module real-time synchronization
    window.addEventListener('tests:updated', (e) => {
      if (e && e.detail && Array.isArray(e.detail.tests)) {
        this.tests = e.detail.tests;
      } else if (typeof TeacherTestScheduler !== 'undefined') {
        this.tests = TeacherTestScheduler.tests;
      } else {
        this.loadCachedTests();
      }
      this.renderTimetableView();
    });

    // 2. Background async refresh (Stale-While-Revalidate)
    Promise.allSettled([
      (typeof TeacherTestScheduler !== 'undefined') ? TeacherTestScheduler.loadTests() : this.loadTests(),
      this.loadTeacherSubjects(),
      this.checkBackendConnection()
    ]).then(() => {
      if (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests) {
        this.tests = TeacherTestScheduler.tests;
      }
      this.renderTimetableView();
      this.initLucideIcons();
    });
  },

  loadCachedTests() {
    try {
      const local = localStorage.getItem('ssgmce_scheduled_tests');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tests = parsed.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
        }
      }
    } catch (_) {}
  },

  getApiBase() {
    return (typeof window !== 'undefined' && window.__API_BASE__) || '/api/v1';
  },

  getAuthHeaders() {
    let token = localStorage.getItem('ssgmce_teacher_token');
    if (!token) {
      try {
        const storedUser = localStorage.getItem("ssgmce_user") || localStorage.getItem("ssgmce_erp_session");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          token = 'teach_token_' + (u.emp_code || u.id || 'default');
        }
      } catch (_) {}
    }
    token = token || 'teach_token_default';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      'X-User-Role': 'faculty'
    };
  },

  // ----------------------------------------------------
  // DYNAMIC TEACHER SUBJECTS (FROM SUPABASE SYLLABUS)
  // ----------------------------------------------------
  async loadTeacherSubjects() {
    try {
      let teacherId = "";
      try {
        const storedUser = localStorage.getItem("ssgmce_user") || localStorage.getItem("ssgmce_erp_session");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          teacherId = u.emp_code || u.id || "";
        }
      } catch (_) {}

      const url = `${this.getApiBase()}/teacher/subjects${teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : ''}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          this.teacherSubjects = json.data;
          this.populateSubjectSelect(json.data);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not dynamically load teacher subjects:", e);
    }

    // Role-specific allotted subjects based on authenticated faculty
    const activeTeacher = this.getActiveTeacher();
    const teacherId = activeTeacher.empCode || "EMP-CSE-1001";
    let defaultSubjects = [];

    if (teacherId === "EMP-CSE-1015" || (activeTeacher.name && (activeTeacher.name.includes("Kulthe") || activeTeacher.name.includes("Krushan")))) {
      // Official Allotted Subjects for Mr. Krushan. V. Kulthe (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "5CS205MD", name: "Multidisciplinary Minor #1 (MDM#1)", class_code: "2R1", semester: "III" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R1", semester: "III" },
        { code: "WS-102", name: "Workshop Practice (WS - R2)", class_code: "1R2", semester: "I" }
      ];
    } else if (teacherId === "EMP-CSE-1014" || (activeTeacher.name && activeTeacher.name.includes("Rakhonde"))) {
      // Official Allotted Subjects for Prof. M. D. Rakhonde (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "5CS228MD", name: "Multidisciplinary Minor #4 (MDM#4)", class_code: "3N", semester: "V" },
        { code: "5CS229ML", name: "MDM#5 (Web Technology Lab)", class_code: "3N", semester: "V" },
        { code: "3CS206OE", name: "Open Elective - I (OE -I)", class_code: "2R1", semester: "III" },
        { code: "SKL-102", name: "Skill Lab-I (Skill Lab-I - R2)", class_code: "1R2", semester: "I" }
      ];
    } else if (teacherId === "EMP-CSE-1013" || (activeTeacher.name && activeTeacher.name.includes("Fatkar"))) {
      // Official Allotted Subjects for Prof. N. N. Fatkar (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "3CS202PC", name: "Data Structures (DS - 2R2)", class_code: "2R2", semester: "III" },
        { code: "3CS204PC", name: "Data Structures Lab (DS Lab - 2R2)", class_code: "2R2", semester: "III" },
        { code: "5CS230OE", name: "Open Elective - III (OE-III)", class_code: "3N", semester: "V" },
        { code: "5CS229ML", name: "MDM#5 (Web Technology Lab)", class_code: "3N", semester: "V" }
      ];
    } else if (teacherId === "EMP-CSE-1012" || (activeTeacher.name && activeTeacher.name.includes("Kanherkar"))) {
      // Official Allotted Subjects for Prof. V. S. Kanherkar (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "3CS205MD", name: "Multidisciplinary Minor #1 (MDM#1)", class_code: "2R1", semester: "III" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R2", semester: "III" },
        { code: "5CS229ML", name: "MDM#5 (Web Technology Lab)", class_code: "3N", semester: "V" },
        { code: "1AL102ES", name: "Computer Programming (CP)", class_code: "1FY", semester: "II" }
      ];
    } else if (teacherId === "EMP-CSE-1011" || (activeTeacher.name && activeTeacher.name.includes("Puranik"))) {
      // Official Allotted Subjects for Prof. T. A. Puranik (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "3CS200PC", name: "Discrete Structures & Graph Theory (DSGT - 2R1)", class_code: "2R1", semester: "III" },
        { code: "3CS200PC", name: "Discrete Structures & Graph Theory (DSGT - 2R2)", class_code: "2R2", semester: "III" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R2", semester: "III" },
        { code: "1FY-SKL", name: "Skill Lab-I (SKL-I)", class_code: "1FY", semester: "I" }
      ];
    } else if (teacherId === "EMP-CSE-1010" || (activeTeacher.name && activeTeacher.name.includes("Jawake"))) {
      // Official Allotted Subjects for Prof. S. M. Jawake (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "5CS227MD", name: "MDM#3 (Multidisciplinary Minor #3)", class_code: "3N", semester: "V" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R1", semester: "III" },
        { code: "5CS229ML", name: "MDM#5 (Web Technology Lab)", class_code: "3N", semester: "V" },
        { code: "1FY-CP", name: "Computer Programming (CP)", class_code: "1FY", semester: "I" }
      ];
    } else if (teacherId === "EMP-CSE-1009" || (activeTeacher.name && activeTeacher.name.includes("Deshmukh"))) {
      // Official Allotted Subjects for Prof. R. V. Deshmukh (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "7KS02", name: "Computer Graphics (CG)", class_code: "4R", semester: "VII" },
        { code: "7KS06", name: "Computer Graphics Lab (CG Lab)", class_code: "4R", semester: "VII" },
        { code: "5CS220PC", name: "Database Management Systems (DBMS / DMS)", class_code: "3N", semester: "V" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R2", semester: "III" }
      ];
    } else if (teacherId === "EMP-CSE-1008" || (activeTeacher.name && activeTeacher.name.includes("Zamare"))) {
      // Official Allotted Subjects for Dr. R. A. Zamare (Associate Professor, CSE)
      defaultSubjects = [
        { code: "5CS222PC", name: "Computer Architecture & Organization (CAO)", class_code: "3N", semester: "V" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R1", semester: "III" },
        { code: "5CS228MD", name: "MDM#4 (Web Technology)", class_code: "3N", semester: "V" },
        { code: "5CS229ML", name: "MDM#5 (Web Technology Lab)", class_code: "3N", semester: "V" },
        { code: "WS(R1)", name: "Workshop Practice (WS(R1))", class_code: "1R1", semester: "I" }
      ];
    } else if (teacherId === "EMP-CSE-1007" || (activeTeacher.name && activeTeacher.name.includes("Pagrut"))) {
      // Official Allotted Subjects for Prof. S. B. Pagrut (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "3CS201PC", name: "Object Oriented Programming (OOP)", class_code: "2R1", semester: "III" },
        { code: "3CS203PC", name: "Object Oriented Programming Lab (OOP_LAB)", class_code: "2R1", semester: "III" },
        { code: "7KS04", name: "Digital Forensics (PE-III DF)", class_code: "4R", semester: "VII" },
        { code: "7KS07", name: "ET Lab III - DF (Practical)", class_code: "4R", semester: "VII" }
      ];
    } else if (teacherId === "EMP-CSE-1006" || (activeTeacher.name && activeTeacher.name.includes("Sable"))) {
      // Official Allotted Subjects for Prof. K. P. Sable (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "3CS202PC", name: "Data Structures (DS)", class_code: "2R1", semester: "III" },
        { code: "3CS204PC", name: "Data Structures Lab (DS Lab)", class_code: "2R1", semester: "III" },
        { code: "7KS01", name: "System Software & Engineering Economics (SSEE)", class_code: "4R", semester: "VII" },
        { code: "5CS229ML", name: "MDM#5 (Web Technology Lab)", class_code: "3N", semester: "V" }
      ];
    } else if (teacherId === "EMP-CSE-1005" || (activeTeacher.name && activeTeacher.name.includes("Bharne"))) {
      // Official Allotted Subjects for Dr. P. K. Bharne (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "5CS223PE", name: "Decision Support Systems (PE-I DSS)", class_code: "3N", semester: "V" },
        { code: "5CS226PE", name: "ET Lab-I DSS (Practical)", class_code: "3N", semester: "V" },
        { code: "7KS04", name: "Data Warehousing & Mining (PE-III DWM)", class_code: "4R", semester: "VII" },
        { code: "7KS07", name: "ET Lab III - DW&M (Practical)", class_code: "4R", semester: "VII" }
      ];
    } else if (teacherId === "EMP-CSE-1004" || (activeTeacher.name && activeTeacher.name.includes("Mahalle"))) {
      // Official Allotted Subjects for Dr. V. S. Mahalle (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "3CS201PC", name: "Object Oriented Programming (OOP)", class_code: "2R2", semester: "III" },
        { code: "3CS203PC", name: "Object Oriented Programming Lab (OOP_LAB)", class_code: "2R2", semester: "III" },
        { code: "5KS04", name: "PE – I (ICS)", class_code: "3R", semester: "V" },
        { code: "5KS08", name: "ET LAB-I (ICS)", class_code: "3R", semester: "V" }
      ];
    } else if (teacherId === "EMP-CSE-1003" || (activeTeacher.name && activeTeacher.name.includes("Mankar"))) {
      // Official Allotted Subjects for Prof. C. M. Mankar (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "5CS221PC", name: "Compiler Design (CD)", class_code: "3N", semester: "V" },
        { code: "5CS225PC", name: "Compiler Design Lab (CD Lab)", class_code: "3N", semester: "V" },
        { code: "5CS227MD", name: "MDM#3 (Multidisciplinary Minor #3)", class_code: "3N", semester: "V" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R1", semester: "III" }
      ];
    } else if (teacherId === "EMP-CSE-1002" || (activeTeacher.name && activeTeacher.name.includes("Kandoi"))) {
      // Official Allotted Subjects for Dr. N. M. Kandoi (Assistant Professor, CSE)
      defaultSubjects = [
        { code: "7KS05", name: "Blockchain Fundamentals (BF)", class_code: "4R", semester: "VII" },
        { code: "7KS08", name: "ET LAB IV BF (Practical)", class_code: "4R", semester: "VII" },
        { code: "3CS400EL", name: "Community / Field Project (CEP)", class_code: "2R2", semester: "III" }
      ];
    } else {
      // Official Allotted Subjects for Dr. J. M. Patil (SSGMCE HOD CSE)
      defaultSubjects = [
        { code: "7KS03", name: "Cloud Computing (CC)", class_code: "4R", semester: "VII" },
        { code: "5CS224PC", name: "Database Management Systems Lab (DBMS / DMS)", class_code: "3N", semester: "V" }
      ];
    }

    this.teacherSubjects = defaultSubjects;
    this.populateSubjectSelect(defaultSubjects);
  },

  populateSubjectSelect(subjects) {
    const select = document.getElementById("testSubjectSelect");
    if (!select || !subjects || subjects.length === 0) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="" disabled selected>Select Subject...</option>';
    subjects.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub.name;
      opt.textContent = sub.name + (sub.code ? ` (${sub.code})` : '');
      if (sub.class_code) opt.setAttribute("data-class", sub.class_code);
      select.appendChild(opt);
    });

    select.onchange = () => {
      const selectedOpt = select.options[select.selectedIndex];
      const targetClass = selectedOpt ? selectedOpt.getAttribute("data-class") : null;
      const classSelect = document.getElementById("testClassSelect");
      if (classSelect && targetClass) {
        classSelect.value = targetClass;
      }
    };

    if (currentVal) select.value = currentVal;
  },

  // ----------------------------------------------------
  // TEST DATA PERSISTENCE (BACKEND API + LOCAL CACHE)
  // ----------------------------------------------------
  async loadTests() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.getApiBase()}/timetable/tests`, {
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          this.tests = json.data
            .filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"))
            .map(t => ({
              id: t.id,
              type: t.type || 'Quiz',
              subject: t.subject || '',
              title: t.title || '',
              date: t.date || '',
              start: t.start || t.start_time || '',
              end: t.end || t.end_time || '',
              link: t.link || '',
              class_code: t.class_code || '2R1',
              teacher_id: t.teacher_id || t.faculty_id || t.created_by || 'EMP-CSE-1001',
              faculty_id: t.faculty_id || t.teacher_id || t.created_by || 'EMP-CSE-1001',
              faculty_name: t.faculty_name || 'Dr. J. M. Patil',
              created_by: t.created_by || t.teacher_id || 'EMP-CSE-1001'
            }));
          try {
            localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
          } catch (_) {}
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load tests from backend API:", e);
    }

    // Try direct Supabase client if already ready without blocking
    try {
      if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient
          .from('timetable_assessments')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (!error && Array.isArray(data) && data.length > 0) {
          this.tests = data
            .filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"))
            .map(t => ({
              id: t.id,
              teacher_id: t.teacher_id || t.faculty_id || 'EMP-CSE-1001',
              faculty_id: t.faculty_id || t.teacher_id || 'EMP-CSE-1001',
              faculty_name: t.faculty_name || 'Dr. J. M. Patil',
              created_by: t.created_by || t.teacher_id || 'EMP-CSE-1001',
              type: t.type || 'Quiz',
              subject: t.subject || '',
              title: t.title || '',
              date: t.date || '',
              start: t.start_time || t.start || '',
              end: t.end_time || t.end || '',
              link: t.link || '',
              class_code: t.class_code || '2R1'
            }));
          try {
            localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
          } catch (_) {}
          return;
        }
      }
    } catch (_) {}

    // Fallback to localStorage cache
    this.loadCachedTests();
  },

  isTestCreator(test, activeTeacher) {
    if (!test) return false;
    if (!activeTeacher) activeTeacher = this.getActiveTeacher();

    const activeCode = (activeTeacher.empCode || "").trim().toUpperCase();
    const activeName = (activeTeacher.name || "").trim().toLowerCase();

    const testCreator = (test.created_by || test.faculty_id || test.teacher_id || "").trim().toUpperCase();
    const testFacultyName = (test.faculty_name || "").trim().toLowerCase();

    // If test has no creator (legacy / pre-seeded mock assessment)
    // Dr. J. M. Patil (HOD CSE EMP-CSE-1001) has full authority over pre-seeded/legacy assessments
    if (!testCreator && !testFacultyName) {
      if (activeCode === "EMP-CSE-1001" || activeName.includes("patil") || (activeTeacher.role && activeTeacher.role === "admin")) {
        return true;
      }
      return false;
    }

    // Direct employee code match
    if (testCreator && activeCode) {
      if (testCreator === activeCode) return true;
      const codeNumA = (activeCode.match(/\d+/) || [])[0];
      const codeNumT = (testCreator.match(/\d+/) || [])[0];
      if (codeNumA && codeNumT && codeNumA === codeNumT) return true;
    }

    // Faculty name substring matching
    if (testFacultyName && activeName) {
      if (testFacultyName === activeName) return true;
      const cleanTest = testFacultyName.replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '').trim();
      const cleanActive = activeName.replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '').trim();
      if (cleanTest && cleanActive && (cleanTest === cleanActive || activeName.includes(cleanTest) || testFacultyName.includes(cleanActive))) {
        return true;
      }
      const testTokens = cleanTest.split(/[\s,.]+/).filter(w => w.length > 2);
      const activeTokens = cleanActive.split(/[\s,.]+/).filter(w => w.length > 2);
      for (const t of testTokens) {
        if (activeTokens.includes(t)) return true;
      }
    }

    // Check admin role
    try {
      if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
        const u = Auth.getCurrentUser();
        if (u && (u.role === 'admin' || u.role === 'superadmin')) return true;
      }
    } catch (_) {}

    return false;
  },

  saveTests() {
    try {
      localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
      window.dispatchEvent(new CustomEvent('tests:updated', { detail: { tests: this.tests } }));
    } catch (_) {}
  },

  bindEvents() {
    // Mobile hamburger menu toggle
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const closeBtn = document.getElementById("sidebar-close-btn");

    if (hamburgerBtn && sidebar) {
      hamburgerBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (overlay) overlay.classList.toggle("active");
      });
    }

    if (closeBtn && sidebar) {
      closeBtn.addEventListener("click", () => {
        sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }

    // Profile Dropdown Trigger & Direct Profile Click
    const profileTrigger = document.getElementById("profile-dropdown-trigger");
    const profileMenu = document.getElementById("profile-dropdown-menu");
    const headerProfName = document.getElementById("header-profile-name");

    if (headerProfName) {
      headerProfName.style.cursor = "pointer";
      headerProfName.title = "View Faculty Profile";
      headerProfName.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = "teacher-dashboard.html#profile";
      });
    }

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
    document.addEventListener("click", (e) => {
      this.closeAllDropdowns();
    });

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeTestFormModal();
        this.closeTestDetailsModal();
        this.closeDeleteConfirmModal();
      }
    });

    // Close modal on clicking outside modal container
    const modals = [
      document.getElementById("testFormModal"),
      document.getElementById("testDetailsModal"),
      document.getElementById("testDeleteConfirmModal")
    ];

    modals.forEach(m => {
      if (m) {
        m.addEventListener("click", (e) => {
          if (e.target === m) {
            this.closeTestFormModal();
            this.closeTestDetailsModal();
            this.closeDeleteConfirmModal();
          }
        });
      }
    });
  },

  closeAllDropdowns() {
    const profileMenu = document.getElementById("profile-dropdown-menu");
    const profileTrigger = document.getElementById("profile-dropdown-trigger");

    if (profileMenu) profileMenu.classList.remove("show");
    if (profileTrigger) profileTrigger.classList.remove("active");
  },

  initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  getActiveTeacher() {
    let f = {
      name: "Dr. J. M. Patil",
      title: "Head Of Department",
      departmentCode: "CSE",
      departmentName: "Department of Computer Science & Engineering",
      empCode: "EMP-CSE-1001",
      initials: "JMP",
      session: "2025-2026 (Autumn)",
      wef: "13/08/2026"
    };

    try {
      const selected = localStorage.getItem("ssgmce_selected_faculty");
      const stored = localStorage.getItem("ssgmce_active_teacher") || 
                     localStorage.getItem("ssgmce_user") || 
                     sessionStorage.getItem("ssgmce_active_teacher") ||
                     sessionStorage.getItem("ssgmce_user");
      
      let u = null;
      if (stored) {
        u = typeof stored === 'string' ? JSON.parse(stored) : stored;
      }

      const code = (selected || (u && (u.emp_code || u.empCode || u.id)) || "EMP-CSE-1001").toUpperCase();
      const nameStr = (u && (u.full_name || u.name) || "").toLowerCase();

      if (code === "EMP-CSE-1015" || nameStr.includes("kulthe") || nameStr.includes("krushan")) {
        return {
          name: "Mr. Krushan. V. Kulthe",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1015",
          initials: "KVK",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1014" || nameStr.includes("rakhonde")) {
        return {
          name: "Prof. M. D. Rakhonde",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1014",
          initials: "MDR",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1013" || nameStr.includes("fatkar")) {
        return {
          name: "Prof. N. N. Fatkar",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1013",
          initials: "NNF",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1012" || nameStr.includes("kanherkar")) {
        return {
          name: "Prof. V. S. Kanherkar",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1012",
          initials: "VSK",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1011" || nameStr.includes("puranik")) {
        return {
          name: "Prof. T. A. Puranik",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1011",
          initials: "TAP",
          session: "2025-2026 (Autumn)",
          wef: "18/08/2025"
        };
      } else if (code === "EMP-CSE-1010" || nameStr.includes("jawake")) {
        return {
          name: "Prof. S. M. Jawake",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1010",
          initials: "SMJ",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1009" || nameStr.includes("deshmukh")) {
        return {
          name: "Prof. R. V. Deshmukh",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1009",
          initials: "RVD",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1008" || nameStr.includes("zamare")) {
        return {
          name: "Dr. R. A. Zamare",
          title: "Associate Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1008",
          initials: "RAZ",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1007" || nameStr.includes("pagrut")) {
        return {
          name: "Prof. S. B. Pagrut",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1007",
          initials: "SBP",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1006" || nameStr.includes("sable")) {
        return {
          name: "Prof. K. P. Sable",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1006",
          initials: "KPS",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1005" || nameStr.includes("bharne")) {
        return {
          name: "Dr. P. K. Bharne",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1005",
          initials: "PKB",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1004" || nameStr.includes("mahalle")) {
        return {
          name: "Dr. V. S. Mahalle",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1004",
          initials: "VSM",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1003" || nameStr.includes("mankar")) {
        return {
          name: "Prof. C. M. Mankar",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1003",
          initials: "CMM",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1002" || nameStr.includes("kandoi")) {
        return {
          name: "Dr. N. M. Kandoi",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1002",
          initials: "NMK",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (code === "EMP-CSE-1001" || nameStr.includes("patil")) {
        return {
          name: "Dr. J. M. Patil",
          title: "Head Of Department",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: "EMP-CSE-1001",
          initials: "JMP",
          session: "2026-2027 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (typeof SSGMCE_FACULTY_TIMETABLES !== 'undefined' && SSGMCE_FACULTY_TIMETABLES[code]) {
        const fac = SSGMCE_FACULTY_TIMETABLES[code];
        return {
          name: fac.name || "Faculty Member",
          title: "Assistant Professor",
          departmentCode: "CSE",
          departmentName: "Department of Computer Science & Engineering",
          empCode: code,
          initials: (fac.name || "FM").split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase(),
          session: "2025-2026 (Autumn)",
          wef: "13/08/2026"
        };
      } else if (u && (u.full_name || u.name)) {
        return {
          name: u.full_name || u.name,
          title: u.designation || "Assistant Professor",
          departmentCode: u.department_code || "CSE",
          departmentName: u.department_name || "Department of Computer Science & Engineering",
          empCode: u.emp_code || u.empCode || code,
          initials: (u.full_name || u.name || "FM").split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase(),
          session: "2025-2026 (Autumn)",
          wef: "13/08/2026"
        };
      }
    } catch (_) {}

    return f;
  },

  renderHeaderProfile() {
    const f = this.getActiveTeacher();

    const headerName = document.getElementById("header-profile-name");
    const headerDept = document.getElementById("header-profile-dept");
    const avatarElem = document.getElementById("header-profile-avatar");
    const menuName = document.getElementById("profile-menu-name");
    const menuTitle = document.getElementById("profile-menu-title");

    if (headerName) headerName.textContent = f.name;
    if (headerDept) headerDept.textContent = `${f.title} • ${f.departmentCode || 'CSE'}`;
    if (menuName) menuName.textContent = f.name;
    if (menuTitle) menuTitle.textContent = `${f.title} • ${f.empCode}`;
    if (avatarElem) {
      avatarElem.innerHTML = `<span>${(f.initials || f.name.split(' ').map(w=>w[0]).join('').slice(0,3)).toUpperCase()}</span>`;
    }
  },

  switchFaculty(empCode) {
    if (!empCode) return;
    if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.setActiveTeacherEmpCode === 'function') {
      TeacherERPData.setActiveTeacherEmpCode(empCode);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('ssgmce_selected_faculty', empCode);
    }
    this.renderHeaderProfile();
    this.renderTimetableView();
  },

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

  // ----------------------------------------------------
  // TEST TIMING & SLOT MAPPING
  // ----------------------------------------------------
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const str = String(timeStr).trim().replace('.', ':');
    const match = str.match(/^(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meridiem = match[3] ? match[3].toUpperCase() : null;
      if (meridiem === "PM" && h < 12) h += 12;
      else if (meridiem === "AM" && h === 12) h = 0;
      else if (!meridiem && h >= 1 && h <= 7) h += 12;
      return h * 60 + m;
    }
    const parts = str.split(":");
    let hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    if (hours >= 1 && hours <= 7) hours += 12;
    return hours * 60 + mins;
  },

  formatTime12Hour(timeStr) {
    if (!timeStr) return "";
    const mins = this.timeToMinutes(timeStr);
    let h = Math.floor(mins / 60);
    const m = String(mins % 60).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  },

  getSlotIndexForTime(timeStr) {
    const mins = this.timeToMinutes(timeStr);
    // Weekday 6-Slot System (11:00 AM - 05:45 PM)
    if (mins < 720) return 0;   // < 12:00 PM -> Slot 1 (11.00 am - 12.00 pm)
    if (mins < 795) return 1;   // < 01:15 PM -> Slot 2 (12.00 pm - 01.00 pm)
    if (mins < 855) return 2;   // < 02:15 PM -> Slot 3 (01.15 pm - 02.15 pm)
    if (mins < 945) return 3;   // < 03:45 PM -> Slot 4 (02.15 pm - 03.15 pm)
    if (mins < 1005) return 4;  // < 04:45 PM -> Slot 5 (03.45 pm - 04.45 pm)
    return 5;                   // >= 04:45 PM -> Slot 6 (04.45 pm - 05.45 pm)
  },

  getTestStatus(test) {
    if (!test || !test.date || !test.start || !test.end) {
      return { status: "Upcoming", badgeClass: "status-upcoming", label: "Upcoming" };
    }

    const now = new Date();
    const [year, month, day] = test.date.split("-").map(Number);
    const [startH, startM] = test.start.split(":").map(Number);
    const [endH, endM] = test.end.split(":").map(Number);

    const startDateTime = new Date(year, month - 1, day, startH, startM, 0);
    const endDateTime = new Date(year, month - 1, day, endH, endM, 0);

    const start12 = this.formatTime12Hour(test.start);

    if (now < startDateTime) {
      return {
        status: "Upcoming",
        badgeClass: "status-upcoming",
        label: "Upcoming",
        caption: `Starts at ${start12}`
      };
    } else if (now >= startDateTime && now <= endDateTime) {
      return {
        status: "Live",
        badgeClass: "status-live",
        label: "Live Now",
        caption: "Active session"
      };
    } else {
      return {
        status: "Ended",
        badgeClass: "status-ended",
        label: "Closed",
        caption: "Test Closed"
      };
    }
  },

  // ----------------------------------------------------
  // TEST MODALS MANAGEMENT
  // ----------------------------------------------------
  openAddTestModal() {
    if (typeof TeacherTestScheduler !== 'undefined') {
      const selectedDate = this.selectedTimetableDate || (
        (typeof AcademicDateUtils !== 'undefined')
          ? AcademicDateUtils.getTodayISO()
          : new Date().toISOString().split('T')[0]
      );
      TeacherTestScheduler.openAddTestModal(selectedDate);
      return;
    }

    const modal = document.getElementById("testFormModal");
    const title = document.getElementById("testModalTitle");
    const badge = document.getElementById("testModalBadge");
    const btnText = document.getElementById("btnSubmitTestText");
    const form = document.getElementById("testScheduleForm");

    if (form) form.reset();
    document.getElementById("testFormId").value = "";

    if (this.teacherSubjects && this.teacherSubjects.length > 0) {
      this.populateSubjectSelect(this.teacherSubjects);
    } else {
      this.loadTeacherSubjects();
    }

    // Default date to currently viewed timetable date
    const selectedDate = this.selectedTimetableDate || (
      (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0]
    );

    document.getElementById("testDateInput").value = selectedDate;
    document.getElementById("testStartTimeInput").value = "11:15";
    document.getElementById("testEndTimeInput").value = "12:15";

    if (title) title.textContent = "Schedule New Assessment";
    if (badge) badge.textContent = "NEW ASSESSMENT";
    if (btnText) btnText.textContent = "Schedule Test";

    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }
    this.initLucideIcons();
  },

  openEditTestModal(testId) {
    const test = (this.tests || []).find(t => t.id === testId) || 
                 (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests && TeacherTestScheduler.tests.find(t => t.id === testId));
    if (!test) return;

    const activeTeacher = this.getActiveTeacher();
    if (!this.isTestCreator(test, activeTeacher)) {
      this.showToast(`Permission Denied: Only ${test.faculty_name || 'the scheduling faculty'} can edit this assessment.`, "error");
      return;
    }

    this.closeTestDetailsModal();

    const modal = document.getElementById("testFormModal");
    const title = document.getElementById("testModalTitle");
    const badge = document.getElementById("testModalBadge");
    const btnText = document.getElementById("btnSubmitTestText");

    const idElem = document.getElementById("testFormId");
    const typeElem = document.getElementById("testTypeSelect");
    const subElem = document.getElementById("testSubjectSelect");
    const titleElem = document.getElementById("testTitleInput");
    const dateElem = document.getElementById("testDateInput");
    const startElem = document.getElementById("testStartTimeInput");
    const endElem = document.getElementById("testEndTimeInput");
    const linkElem = document.getElementById("testLinkInput");
    const classElem = document.getElementById("testClassSelect");

    if (idElem) idElem.value = test.id;
    if (typeElem) typeElem.value = test.type;
    if (subElem) subElem.value = test.subject;
    if (titleElem) titleElem.value = test.title;
    if (dateElem) dateElem.value = test.date;
    if (startElem) startElem.value = test.start;
    if (endElem) endElem.value = test.end;
    if (linkElem) linkElem.value = test.link;
    if (classElem && test.class_code) classElem.value = test.class_code;

    if (title) title.textContent = "Edit Assessment";
    if (badge) badge.textContent = "EDIT MODE";
    if (btnText) btnText.textContent = "Update Assessment";

    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }
    this.initLucideIcons();
  },

  closeTestFormModal() {
    const modal = document.getElementById("testFormModal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  },

  async handleSaveTest(e) {
    if (e) e.preventDefault();

    const id = (document.getElementById("testFormId")?.value || "").trim();
    const type = document.getElementById("testTypeSelect")?.value || "Quiz";
    const subject = document.getElementById("testSubjectSelect")?.value || "";
    const classElem = document.getElementById("testClassSelect");
    const classCode = classElem ? classElem.value : "2R1";
    const title = (document.getElementById("testTitleInput")?.value || "").trim();
    const date = document.getElementById("testDateInput")?.value || "";
    const start = document.getElementById("testStartTimeInput")?.value || "";
    const end = document.getElementById("testEndTimeInput")?.value || "";
    const link = (document.getElementById("testLinkInput")?.value || "").trim();

    // Validation checks
    if (!subject) {
      this.showToast("Please select a subject for the test.", "error");
      return;
    }
    if (!title) {
      this.showToast("Please enter a test title or topic.", "error");
      return;
    }
    if (!date) {
      this.showToast("Please specify the test date.", "error");
      return;
    }
    if (!start || !end) {
      this.showToast("Start time and end time are required.", "error");
      return;
    }

    const startMins = this.timeToMinutes(start);
    const endMins = this.timeToMinutes(end);

    if (endMins <= startMins) {
      this.showToast("End time must be after start time.", "error");
      return;
    }

    if (!link) {
      this.showToast("Please enter the test URL or submission link.", "error");
      return;
    }

    // URL validation
    try {
      new URL(link);
    } catch (_) {
      this.showToast("Please enter a valid URL (including https://).", "error");
      return;
    }

    const submitBtn = document.getElementById("btnSubmitTestForm");
    const submitText = document.getElementById("btnSubmitTestText");
    const originalText = submitText ? submitText.textContent : "Save Test";

    // Disable button to prevent duplicate submissions
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = "Scheduling...";

    const activeTeacher = this.getActiveTeacher();
    const payload = {
      type,
      subject,
      title,
      date,
      start_time: start,
      end_time: end,
      link,
      class_code: classCode || "2R1",
      teacher_id: activeTeacher.empCode || "EMP-CSE-1001",
      faculty_id: activeTeacher.empCode || "EMP-CSE-1001",
      faculty_name: activeTeacher.name || "Dr. J. M. Patil",
      created_by: activeTeacher.empCode || "EMP-CSE-1001"
    };

    const typeLabel = type === "Assignment" ? "Assignment" : (type === "TEC" ? "TEC" : (type === "Quiz" ? "Quiz" : (type || "Test")));
    const successMsg = id ? `${typeLabel} updated successfully` : `${typeLabel} scheduled successfully`;

    try {
      let res;
      if (id && !id.startsWith("local-")) {
        res = await fetch(`${this.getApiBase()}/timetable/tests/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        payload.id = id || ("test-" + Date.now());
        res = await fetch(`${this.getApiBase()}/timetable/tests`, {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }

      const testObj = {
        id: id || payload.id || ("test-" + Date.now()),
        ...payload,
        start: payload.start_time,
        end: payload.end_time
      };

      const existingIdx = this.tests.findIndex(t => t.id === testObj.id);
      if (existingIdx >= 0) {
        this.tests[existingIdx] = testObj;
      } else {
        this.tests.push(testObj);
      }
      if (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests) {
        const scIdx = TeacherTestScheduler.tests.findIndex(t => t.id === testObj.id);
        if (scIdx >= 0) TeacherTestScheduler.tests[scIdx] = testObj;
        else TeacherTestScheduler.tests.push(testObj);
      }

      this.saveTests();
      this.showToast(successMsg, "success");
      this.closeTestFormModal();
      this.renderTimetableView();
    } catch (err) {
      console.warn("Backend save notice:", err);
      const testObj = {
        id: id || payload.id || ("test-" + Date.now()),
        ...payload,
        start: payload.start_time,
        end: payload.end_time
      };
      const existingIdx = this.tests.findIndex(t => t.id === testObj.id);
      if (existingIdx >= 0) {
        this.tests[existingIdx] = testObj;
      } else {
        this.tests.push(testObj);
      }
      if (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests) {
        const scIdx = TeacherTestScheduler.tests.findIndex(t => t.id === testObj.id);
        if (scIdx >= 0) TeacherTestScheduler.tests[scIdx] = testObj;
        else TeacherTestScheduler.tests.push(testObj);
      }
      this.saveTests();
      this.showToast(successMsg, "success");
      this.closeTestFormModal();
      this.renderTimetableView();
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = originalText;
    }
  },

  openTestDetails(testId) {
    const test = (this.tests || []).find(t => t.id === testId) || 
                 (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests && TeacherTestScheduler.tests.find(t => t.id === testId));
    if (!test) return;

    const modal = document.getElementById("testDetailsModal");
    const typeBadge = document.getElementById("detailsModalTypeBadge");
    const modalTitle = document.getElementById("detailsModalTitle");
    const body = document.getElementById("testDetailsBody");

    const statusObj = this.getTestStatus(test);
    const start12 = this.formatTime12Hour(test.start);
    const end12 = this.formatTime12Hour(test.end);

    // Readable date
    let readableDate = test.date;
    try {
      const [y, m, d] = test.date.split("-");
      const dt = new Date(y, m - 1, d);
      readableDate = dt.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch (_) {}

    // Action button text based on test type and status
    let actionBtnHTML = "";
    if (statusObj.status === "Ended") {
      actionBtnHTML = `
        <button type="button" class="btn-test-action disabled" disabled>
          <i data-lucide="lock" style="width:15px;height:15px;"></i>
          <span>Test Closed</span>
        </button>
      `;
    } else if (statusObj.status === "Upcoming") {
      actionBtnHTML = `
        <button type="button" class="btn-test-action disabled" disabled title="Test link will open at scheduled start time">
          <i data-lucide="clock" style="width:15px;height:15px;"></i>
          <span>Link opens at ${start12}</span>
        </button>
        <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="btn-preview-link" title="Teacher preview link">
          <i data-lucide="external-link" style="width:14px;height:14px;"></i> Preview URL
        </a>
      `;
    } else {
      // Live Now
      let actionLabel = "Start Assessment";
      if (test.type === "Quiz") actionLabel = "Start Quiz";
      else if (test.type === "Assignment") actionLabel = "Submit Assignment";
      else if (test.type === "TEC") actionLabel = "Start TEC";

      actionBtnHTML = `
        <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="btn-test-action active-live">
          <i data-lucide="play-circle" style="width:16px;height:16px;"></i>
          <span>${actionLabel}</span>
        </a>
      `;
    }

    if (typeBadge) typeBadge.textContent = `${test.type.toUpperCase()} • ${test.subject}`;
    if (modalTitle) modalTitle.textContent = test.title;

    const activeTeacher = this.getActiveTeacher();
    const isOwner = this.isTestCreator(test, activeTeacher);

    if (body) {
      body.innerHTML = `
        <div class="test-details-grid">
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="layers" style="width:14px;height:14px;"></i> Subject:</span>
            <span class="detail-val"><strong>${test.subject}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="user" style="width:14px;height:14px;"></i> Scheduled By:</span>
            <span class="detail-val"><strong>${test.faculty_name || 'Dr. J. M. Patil'}</strong> ${isOwner ? '<span style="color:#0284C7; font-size:11px; font-weight:700; background:#E0F2FE; padding:2px 7px; border-radius:4px; margin-left:6px;">You</span>' : ''}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="calendar" style="width:14px;height:14px;"></i> Date:</span>
            <span class="detail-val">${readableDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="clock" style="width:14px;height:14px;"></i> Timing:</span>
            <span class="detail-val">${start12} – ${end12}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="activity" style="width:14px;height:14px;"></i> Status:</span>
            <span class="detail-val">
              <span class="test-status-pill ${statusObj.badgeClass}">${statusObj.label}</span>
              ${statusObj.caption ? `<span class="status-caption">${statusObj.caption}</span>` : ''}
            </span>
          </div>
          <div class="detail-row link-row">
            <span class="detail-label"><i data-lucide="link-2" style="width:14px;height:14px;"></i> Test URL:</span>
            <span class="detail-val">
              <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="test-external-link">
                ${test.link}
              </a>
            </span>
          </div>
        </div>

        <div class="test-details-action-bar">
          <div class="student-action-wrap">
            ${actionBtnHTML}
          </div>

          <div class="teacher-manage-actions">
            ${isOwner ? `
              <button type="button" class="btn-test-edit" onclick="TeacherTimetableApp.openEditTestModal('${test.id}')" title="Edit this assessment">
                <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-test-delete" onclick="TeacherTimetableApp.promptDeleteTest('${test.id}')" title="Delete this assessment">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                <span>Delete</span>
              </button>
            ` : `
              <div class="creator-lock-notice" style="display:inline-flex; align-items:center; gap:8px; background:#F8FAFC; border:1px solid #CBD5E1; padding:7px 14px; border-radius:8px; font-size:12px; color:#475569; font-weight:600;">
                <i data-lucide="lock" style="width:14px;height:14px;color:#64748B;"></i>
                <span>Scheduled by <strong>${test.faculty_name || 'Dr. J. M. Patil'}</strong> (Only creator can edit or delete)</span>
              </div>
            `}
          </div>
        </div>
      `;
    }

    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }
    this.initLucideIcons();
  },

  closeTestDetailsModal() {
    const modal = document.getElementById("testDetailsModal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  },

  promptDeleteTest(testId) {
    const test = (this.tests || []).find(t => t.id === testId) || 
                 (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests && TeacherTestScheduler.tests.find(t => t.id === testId));
    if (!test) return;

    const activeTeacher = this.getActiveTeacher();
    if (!this.isTestCreator(test, activeTeacher)) {
      this.showToast(`Permission Denied: Only ${test.faculty_name || 'the scheduling faculty'} can delete this assessment.`, "error");
      return;
    }

    this.activeDeleteTestId = testId;
    if (typeof TeacherTestScheduler !== 'undefined') {
      TeacherTestScheduler.activeDeleteTestId = testId;
    }

    const modal = document.getElementById("testDeleteConfirmModal");
    const nameElem = document.getElementById("deleteTestTitleName");

    if (nameElem) {
      nameElem.textContent = `"${test.title}" (${test.type})`;
    }

    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }
    this.initLucideIcons();
  },

  closeDeleteConfirmModal() {
    this.activeDeleteTestId = null;
    if (typeof TeacherTestScheduler !== 'undefined') {
      TeacherTestScheduler.activeDeleteTestId = null;
    }
    const modal = document.getElementById("testDeleteConfirmModal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  },

  async confirmExecuteDelete() {
    const testId = this.activeDeleteTestId || 
                   (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.activeDeleteTestId);
    if (!testId) return;

    const test = (this.tests || []).find(t => t.id === testId) || 
                 (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests && TeacherTestScheduler.tests.find(t => t.id === testId));

    if (test) {
      const activeTeacher = this.getActiveTeacher();
      if (!this.isTestCreator(test, activeTeacher)) {
        this.showToast(`Permission Denied: Only ${test.faculty_name || 'the scheduling faculty'} can delete this assessment.`, "error");
        this.closeDeleteConfirmModal();
        return;
      }
    }

    const deleteBtn = document.getElementById("btnConfirmDeleteAction");
    if (deleteBtn) deleteBtn.disabled = true;

    try {
      await fetch(`${this.getApiBase()}/timetable/tests/${encodeURIComponent(testId)}`, {
        method: "DELETE",
        headers: this.getAuthHeaders()
      });
      this.showToast("Assessment deleted successfully", "success");
    } catch (err) {
      console.warn("Backend delete notice:", err);
      this.showToast("Assessment deleted from schedule", "success");
    } finally {
      if (deleteBtn) deleteBtn.disabled = false;
    }

    // Remove from TeacherTimetableApp tests
    const idx = this.tests.findIndex(t => t.id === testId);
    if (idx !== -1) {
      this.tests.splice(idx, 1);
    }
    // Remove from TeacherTestScheduler tests
    if (typeof TeacherTestScheduler !== 'undefined' && TeacherTestScheduler.tests) {
      const scIdx = TeacherTestScheduler.tests.findIndex(t => t.id === testId);
      if (scIdx !== -1) {
        TeacherTestScheduler.tests.splice(scIdx, 1);
      }
    }

    this.saveTests();
    this.closeDeleteConfirmModal();
    this.closeTestDetailsModal();
    this.renderTimetableView();
  },

  // ----------------------------------------------------
  // MAIN TIMETABLE RENDERING (DR. J. M. PATIL PERSONAL TIME-TABLE)
  // ----------------------------------------------------
  renderTimetableView() {
    const container = document.getElementById("timetable-content");
    if (!container) return;

    const term = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getCurrentAcademicTerm()
      : { academicYear: "2026-2027", semesterType: "Autumn" };

    const selectedDate = this.selectedTimetableDate || (
      (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0]
    );

    const currentDayName = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getDayName(selectedDate)
      : "Monday";

    const readableDate = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.formatReadableDate(selectedDate)
      : selectedDate;

    const todayISO = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];

    const isToday = (selectedDate === todayISO);
    const isWeekend = (currentDayName === "Saturday" || currentDayName === "Sunday");

    // Check if Sunday has scheduled tests
    const hasSundayTest = (this.tests || []).some(t => {
      if (!t.date) return false;
      const [y, m, d] = t.date.split("-").map(Number);
      const dayName = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
      return dayName.toLowerCase() === "sunday";
    });
    const includeSunday = hasSundayTest || currentDayName.toLowerCase() === "sunday";

    // ----------------------------------------------------
    // DYNAMIC SCHEDULE & TEACHING LOAD DATASETS FOR FACULTIES
    // ----------------------------------------------------
    const teacher = this.getActiveTeacher();
    const isKulthe = teacher.empCode === "EMP-CSE-1015" || (teacher.name && (teacher.name.includes("Kulthe") || teacher.name.includes("Krushan")));
    const isRakhonde = teacher.empCode === "EMP-CSE-1014" || (teacher.name && teacher.name.includes("Rakhonde"));
    const isFatkar = teacher.empCode === "EMP-CSE-1013" || (teacher.name && teacher.name.includes("Fatkar"));
    const isKanherkar = teacher.empCode === "EMP-CSE-1012" || (teacher.name && teacher.name.includes("Kanherkar"));
    const isPuranik = teacher.empCode === "EMP-CSE-1011" || (teacher.name && teacher.name.includes("Puranik"));
    const isJawake = teacher.empCode === "EMP-CSE-1010" || (teacher.name && teacher.name.includes("Jawake"));
    const isDeshmukh = teacher.empCode === "EMP-CSE-1009" || (teacher.name && teacher.name.includes("Deshmukh"));
    const isZamare = teacher.empCode === "EMP-CSE-1008" || (teacher.name && teacher.name.includes("Zamare"));
    const isPagrut = teacher.empCode === "EMP-CSE-1007" || (teacher.name && teacher.name.includes("Pagrut"));
    const isSable = teacher.empCode === "EMP-CSE-1006" || (teacher.name && teacher.name.includes("Sable"));
    const isBharne = teacher.empCode === "EMP-CSE-1005" || (teacher.name && teacher.name.includes("Bharne"));
    const isMahalle = teacher.empCode === "EMP-CSE-1004" || (teacher.name && teacher.name.includes("Mahalle"));
    const isMankar = teacher.empCode === "EMP-CSE-1003" || (teacher.name && teacher.name.includes("Mankar"));
    const isKandoi = teacher.empCode === "EMP-CSE-1002" || (teacher.name && teacher.name.includes("Kandoi"));

    let scheduleRows = [];
    let teachingLoadRows = [];
    let totalTheoryLoad = 0;
    let totalPracticalLoad = 0;
    let totalWeeklyLoad = 0;

    if (isKulthe) {
      // Official Personal Time-Table for Mr. Krushan. V. Kulthe (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "MDM#1 (A4)", room: "A4", class_code: "2R1 (Sem III)", fullTitle: "Multidisciplinary Minor #1", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "MDM#1 (A4)", room: "A4", class_code: "2R1 (Sem III)", fullTitle: "Multidisciplinary Minor #1", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "CEP(2R1-D)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch D", fullTitle: "Community / Field Project (Batch D)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "CEP(2R1-D)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch D", fullTitle: "Community / Field Project (Batch D)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { code: "WS-102", name: "WS(R2)", sem: "I", class_code: "1R2", theory: 1, practical: 6, total: 7 },
        { code: "3CS400EL", name: "Community / Field Project", sem: "III", class_code: "2R1", theory: 0, practical: 4, total: 4 },
        { code: "5CS205MD", name: "MDM#1", sem: "III", class_code: "2R1", theory: 2, practical: 0, total: 2 }
      ];
      totalTheoryLoad = 3;
      totalPracticalLoad = 10;
      totalWeeklyLoad = 13;
    } else if (isRakhonde) {
      // Official Personal Time-Table for Prof. M. D. Rakhonde (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "OE1 (A3)", room: "A3", class_code: "2R1 (Sem III)", fullTitle: "Open Elective - I", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "(MDM#4) (C1)", room: "C1", class_code: "3N (Sem V)", fullTitle: "Multidisciplinary Minor #4", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free / Prep", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "OE1 (A3)", room: "A3", class_code: "2R1 (Sem III)", fullTitle: "Open Elective - I", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "(MDM#4) (C1)", room: "C1", class_code: "3N (Sem V)", fullTitle: "Multidisciplinary Minor #4", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free / Prep", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "OE1 (A3)", room: "A3", class_code: "2R1 (Sem III)", fullTitle: "Open Elective - I", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "MDM(WT-B5)", room: "Lab 02", class_code: "3N (Sem V)", batch: "Batch B5", fullTitle: "Web Technology Lab (Batch B5)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "MDM(WT-8)", room: "Lab 02", class_code: "3N (Sem V)", batch: "Batch B8", fullTitle: "Web Technology Lab (Batch B8)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { code: "5CS228MD", name: "(MDM#4)", sem: "V", class_code: "3N", theory: 2, practical: 0, total: 2 },
        { code: "5CS229ML", name: "MDM#5", sem: "V", class_code: "3N", theory: 0, practical: 4, total: 4 },
        { code: "3CS206OE", name: "OE -I", sem: "III", class_code: "2R1", theory: 3, practical: 0, total: 3 },
        { code: "SKL-102", name: "Skill Lab-I(R2)", sem: "I", class_code: "1R2", theory: 1, practical: 6, total: 7 }
      ];
      totalTheoryLoad = 6;
      totalPracticalLoad = 10;
      totalWeeklyLoad = 16;
    } else if (isFatkar) {
      // Official Personal Time-Table for Prof. N. N. Fatkar (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "DS(2R2-A)", room: "Lab 02", class_code: "2R2 (Sem III)", batch: "Batch A", fullTitle: "Data Structures Lab (Batch A)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "DS(2R2-C)", room: "Lab 02", class_code: "2R2 (Sem III)", batch: "Batch C", fullTitle: "Data Structures Lab (Batch C)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "DS(2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "DS(2R2-D)", room: "Lab 02", class_code: "2R2 (Sem III)", batch: "Batch D", fullTitle: "Data Structures Lab (Batch D)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "DS(2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "OE-III", room: "C1", class_code: "3N (Sem V)", fullTitle: "Open Elective - III (OE-III)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "DS(2R2-B)", room: "Lab 02", class_code: "2R2 (Sem III)", batch: "Batch B", fullTitle: "Data Structures Lab (Batch B)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "DS(2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "OE-III", room: "C1", class_code: "3N (Sem V)", fullTitle: "Open Elective - III (OE-III)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "DS(2R2)", room: "B108", class_code: "2R2 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "MDM(WT-B6)", room: "Lab 02", class_code: "3N (Sem V)", batch: "Batch B6", fullTitle: "MDM#5: Web Technology Lab (Batch B6)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "MDM(WT-B7)", room: "Lab 02", class_code: "3N (Sem V)", batch: "Batch B7", fullTitle: "MDM#5: Web Technology Lab (Batch B7)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "III", code: "3CS202PC / 3CS204PC", name: "DS-R2", detail: "Data Structures Theory & DS Lab — Class 2R2 (Classroom B007/B108 & Lab 02)", th: 4, pr: 8, total: 12 },
        { sem: "V", code: "5CS229ML", name: "(MDM#5)", detail: "MDM#5: Web Technology Lab — Class 3N (Lab 02, Batch B6 & B7)", th: 0, pr: 4, total: 4 },
        { sem: "V", code: "5CS230OE", name: "OE-III", detail: "Open Elective - III (OE-III) — Class 3N (Classroom C1)", th: 2, pr: 0, total: 2 }
      ];
      totalTheoryLoad = 6;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 18;

    } else if (isKanherkar) {
      // Official Personal Time-Table for Prof. V. S. Kanherkar (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "MDM#1", room: "C2", class_code: "2R1 (Sem III)", fullTitle: "Multidisciplinary Minor #1 (MDM#1)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "CEP(2R2-A)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch A", fullTitle: "Community / Field Project (Batch A)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "MDM#1", room: "C2", class_code: "2R1 (Sem III)", fullTitle: "Multidisciplinary Minor #1 (MDM#1)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "CEP(2R2-A)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch A", fullTitle: "Community / Field Project (Batch A)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "MDM(WT-B3)", room: "Lab 02", class_code: "3N (Sem V)", batch: "Batch B3", fullTitle: "MDM#5: Web Technology Lab (Batch B3)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "II", code: "1AL102ES / 1AL105ES", name: "CP", detail: "Computer Programming — Second Semester / First Year (Classroom & Lab)", th: 4, pr: 6, total: 10 },
        { sem: "III", code: "3CS205MD", name: "MDM#1", detail: "Multidisciplinary Minor #1 (MDM#1) — Class 2R1 (Classroom C2)", th: 2, pr: 0, total: 2 },
        { sem: "III", code: "3CS400EL", name: "Community / Field Project", detail: "Community / Field Project (CEP) — Class 2R2 (Batch A)", th: 0, pr: 4, total: 4 },
        { sem: "V", code: "5CS229ML", name: "MDM#5", detail: "MDM#5: Web Technology Lab — Class 3N (Lab 02, Batch B3)", th: 0, pr: 2, total: 2 }
      ];
      totalTheoryLoad = 6;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 18;

    } else if (isPuranik) {
      // Official Personal Time-Table for Prof. T. A. Puranik (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "CEP(2R2-B)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch B", fullTitle: "Community / Field Project (Batch B)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "DS&GT(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DS&GT)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "DS&GT(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DS&GT)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "DSGT(2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DSGT)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "CEP(2R2-B)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch B", fullTitle: "Community / Field Project (Batch B)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "DS&GT(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DS&GT)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "DS&GT(2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DS&GT)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "DSGT(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DSGT)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "DS&GT(2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DS&GT)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "DS&GT(2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Discrete Structures & Graph Theory (DS&GT)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "III", code: "3CS200PC", name: "DSGT-R1", detail: "Discrete Structures & Graph Theory — Class 2R1 (Classroom B108)", th: 4, pr: 0, total: 4 },
        { sem: "III", code: "3CS200PC", name: "DSGT-R2", detail: "Discrete Structures & Graph Theory — Class 2R2 (Classroom B007)", th: 4, pr: 0, total: 4 },
        { sem: "I", code: "1FY-SKL", name: "Skill lab-I", detail: "Skill Lab-I — First Year (Classroom & Lab)", th: 1, pr: 6, total: 7 },
        { sem: "III", code: "3CS400EL", name: "Community / Field Project", detail: "Community / Field Project (CEP) — Class 2R2 (Batch B)", th: 0, pr: 4, total: 4 }
      ];
      totalTheoryLoad = 9;
      totalPracticalLoad = 10;
      totalWeeklyLoad = 19;

    } else if (isJawake) {
      // Official Personal Time-Table for Prof. S. M. Jawake (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "MDM#3", room: "C2", class_code: "3N (Sem V)", fullTitle: "Multidisciplinary Minor #3 (MDM#3)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "MDM#3", room: "C2", class_code: "3N (Sem V)", fullTitle: "Multidisciplinary Minor #3 (MDM#3)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "CEP(2R1-A)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch A", fullTitle: "Community / Field Project (Batch A)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "CEP(2R1-A)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch A", fullTitle: "Community / Field Project (Batch A)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "MDM(WT-B2)", room: "Lab 02", class_code: "3N (Sem V)", batch: "Batch B2", fullTitle: "MDM#5: Web Technology Lab (Batch B2)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "I", code: "1FY-CP", name: "CP", detail: "Computer Programming — First Year (Classroom & Lab)", th: 4, pr: 6, total: 10 },
        { sem: "V", code: "5CS227MD", name: "MDM#3", detail: "Multidisciplinary Minor #3 (MDM#3) — Class 3N (Classroom C2)", th: 2, pr: 0, total: 2 },
        { sem: "III", code: "3CS400EL", name: "Community / Field Project", detail: "Community / Field Project (CEP) — Class 2R1 (Batch A)", th: 0, pr: 4, total: 4 },
        { sem: "V", code: "5CS229ML", name: "MDM#5", detail: "MDM#5: Web Technology Lab — Class 3N (Lab 02, Batch B2)", th: 0, pr: 2, total: 2 }
      ];
      totalTheoryLoad = 6;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 18;

    } else if (isDeshmukh) {
      // Official Personal Time-Table for Prof. R. V. Deshmukh (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "CEP(2R2-C)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch C", fullTitle: "Community / Field Project (Batch C)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "CG (C)", room: "Graphics Lab", class_code: "4R (Sem VII)", batch: "Batch C", fullTitle: "Computer Graphics Lab (Batch C)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "DMS", room: "B206", class_code: "3N (Sem V)", fullTitle: "Database Management Systems (DMS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "CG", room: "B206", class_code: "4R (Sem VII)", fullTitle: "Computer Graphics (CG)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "CG (D)", room: "Graphics Lab", class_code: "4R (Sem VII)", batch: "Batch D", fullTitle: "Computer Graphics Lab (Batch D)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "DMS", room: "B206", class_code: "3N (Sem V)", fullTitle: "Database Management Systems (DMS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "CG", room: "B206", class_code: "4R (Sem VII)", fullTitle: "Computer Graphics (CG)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "CG (B)", room: "Graphics Lab", class_code: "4R (Sem VII)", batch: "Batch B", fullTitle: "Computer Graphics Lab (Batch B)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "CEP(2R2-C)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch C", fullTitle: "Community / Field Project (Batch C)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "CG", room: "B206", class_code: "4R (Sem VII)", fullTitle: "Computer Graphics (CG)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "DMS", room: "B206", class_code: "3N (Sem V)", fullTitle: "Database Management Systems (DMS)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "CG (A)", room: "Graphics Lab", class_code: "4R (Sem VII)", batch: "Batch A", fullTitle: "Computer Graphics Lab (Batch A)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "VII", code: "7KS02 / 7KS06", name: "CG", detail: "Computer Graphics & CG Lab — Class 4R (Classroom B206 & Graphics Lab)", th: 3, pr: 8, total: 11 },
        { sem: "V", code: "5CS220PC", name: "DBMS", detail: "Database Management Systems (DMS) — Class 3N (Classroom B206)", th: 3, pr: 0, total: 3 },
        { sem: "III", code: "3CS400EL", name: "Community / Field Project", detail: "Community / Field Project (CEP) — Class 2R2 (Batch C)", th: 0, pr: 4, total: 4 }
      ];
      totalTheoryLoad = 6;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 18;

    } else if (isZamare) {
      // Official Personal Time-Table for Dr. R. A. Zamare (Associate Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "CA&O", room: "B206", class_code: "3N (Sem V)", fullTitle: "Computer Architecture & Organization (CA&O)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "CEP(2R1-B)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch B", fullTitle: "Community / Field Project (Batch B)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "CA&O", room: "B206", class_code: "3N (Sem V)", fullTitle: "Computer Architecture & Organization (CA&O)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "MDM#4", room: "C2", class_code: "3N (Sem V)", fullTitle: "MDM#4: Web Technology (MDM#4)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "CA&O", room: "B206", class_code: "3N (Sem V)", fullTitle: "Computer Architecture & Organization (CA&O)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "MDM#4", room: "C2", class_code: "3N (Sem V)", fullTitle: "MDM#4: Web Technology (MDM#4)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "CEP(2R1-B)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch B", fullTitle: "Community / Field Project (Batch B)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "MDM(WT-B1)", room: "Lab 01", class_code: "3N (Sem V)", batch: "Batch B1", fullTitle: "MDM#5: Web Technology Lab (Batch B1)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "V", code: "5CS222PC", name: "CAO", detail: "Computer Architecture & Organization — Class 3N (Classroom B206)", th: 3, pr: 0, total: 3 },
        { sem: "III", code: "3CS400EL", name: "Community / Field Project", detail: "Community / Field Project (CEP) — Class 2R1 (Batch B)", th: 0, pr: 4, total: 4 },
        { sem: "I", code: "WS(R1)", name: "WS(R1)", detail: "Workshop Practice — Class 1R1 (Workshop)", th: 0, pr: 6, total: 6 },
        { sem: "V", code: "5CS228MD / 5CS229ML", name: "WT (MDM#4 / MDM#5)", detail: "Web Technology Theory (MDM#4) & Lab (MDM#5) — Class 3N (C2 & Lab 01)", th: 2, pr: 2, total: 4 }
      ];
      totalTheoryLoad = 5;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 17;

    } else if (isPagrut) {
      // Official Personal Time-Table for Prof. S. B. Pagrut (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "OOP(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "PE - III DF(B6)", room: "Room 402", class_code: "4R (Sem VII)", batch: "Batch B6", fullTitle: "Digital Forensics (PE-III DF)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "PE - III DF", room: "Room 402", class_code: "4R (Sem VII)", fullTitle: "Digital Forensics (PE-III DF)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "OOP(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "OOP(2R1-A)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch A", fullTitle: "OOP Lab (Batch A)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "OOP(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "OOP(2R1-D)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch D", fullTitle: "OOP Lab (Batch D)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "OOP(2R1)", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "PE - III DF (B2)", room: "Room 402", class_code: "4R (Sem VII)", batch: "Batch B2", fullTitle: "Digital Forensics (PE-III DF)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "OOP(2R1-B)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch B", fullTitle: "OOP Lab (Batch B)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "OOP(2R1-C)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch C", fullTitle: "OOP Lab (Batch C)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "ET Lab III – DF (H)", room: "ET Lab III", class_code: "4R (Sem VII)", batch: "Batch H", fullTitle: "ET Lab III – DF (Batch H)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "III", code: "3CS201PC / 3CS203PC", name: "OOP", detail: "Object Oriented Programming & OOP Lab — Class 2R1 (Classroom B108 & Lab)", th: 4, pr: 8, total: 12 },
        { sem: "VII", code: "7KS04 / 7KS07", name: "PE-III DF", detail: "Digital Forensics & ET Lab III DF — Class 4R (Classroom B6/B2 & Lab)", th: 3, pr: 2, total: 5 }
      ];
      totalTheoryLoad = 7;
      totalPracticalLoad = 10;
      totalWeeklyLoad = 17;

    } else if (isSable) {
      // Official Personal Time-Table for Prof. K. P. Sable (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "DS", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "SSEE", room: "B108", class_code: "4R (Sem VII)", fullTitle: "System Software & Engineering Economics (SSEE)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "DS", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "SSEE", room: "B108", class_code: "4R (Sem VII)", fullTitle: "System Software & Engineering Economics (SSEE)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "DS (2R1-C)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch C", fullTitle: "Data Structures Lab (Batch C)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "DS", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "SSEE", room: "B108", class_code: "4R (Sem VII)", fullTitle: "System Software & Engineering Economics (SSEE)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "DS (2R1-B)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch B", fullTitle: "Data Structures Lab (Batch B)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "DS (2R1-D)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch D", fullTitle: "Data Structures Lab (Batch D)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "DS (2R1-A)", room: "Lab", class_code: "2R1 (Sem III)", batch: "Batch A", fullTitle: "Data Structures Lab (Batch A)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "DS", room: "B108", class_code: "2R1 (Sem III)", fullTitle: "Data Structures (DS)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "MDM (WT-B4)", room: "Lab 04", class_code: "3N (Sem V)", batch: "Batch B4", fullTitle: "MDM#5: Web Technology Lab (Batch B4)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "III", code: "3CS202PC / 3CS204PC", name: "DS", detail: "Data Structures & DS Lab — Class 2R1 (Classroom B108 & Lab)", th: 4, pr: 8, total: 12 },
        { sem: "VII", code: "7KS01", name: "SSEE", detail: "System Software & Engineering Economics — Class 4R", th: 3, pr: 0, total: 3 },
        { sem: "V", code: "5CS229ML", name: "MDM#5", detail: "MDM#5: Web Technology Lab — Class 3N/3R (Batch B4)", th: 0, pr: 2, total: 2 }
      ];
      totalTheoryLoad = 7;
      totalPracticalLoad = 10;
      totalWeeklyLoad = 17;

    } else if (isBharne) {
      // Official Personal Time-Table for Dr. P. K. Bharne (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "DWM", room: "B206", class_code: "4R (Sem VII)", fullTitle: "Data Warehousing & Mining (DWM)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "PE - 1 DSS", room: "B206", class_code: "3N (Sem V)", fullTitle: "PE-I: Decision Support Systems (DSS)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "DWM", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Data Warehousing & Mining (DWM)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "ET Lab-I DSS (G)", room: "Lab", class_code: "3N (Sem V)", batch: "Batch G", fullTitle: "ET Lab-I DSS (Batch G)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "PE - 1 DSS", room: "B206", class_code: "3N (Sem V)", fullTitle: "PE-I: Decision Support Systems (DSS)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "ET Lab-I DSS (E)", room: "Lab", class_code: "3N (Sem V)", batch: "Batch E", fullTitle: "ET Lab-I DSS (Batch E)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "ET Lab III – DW&M (G)", room: "Lab", class_code: "4R (Sem VII)", batch: "Batch G", fullTitle: "ET Lab III – DW&M (Batch G)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [2] },
            { subject: "DWM", room: "B206", class_code: "4R (Sem VII)", fullTitle: "Data Warehousing & Mining (DWM)", isLab: false, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "ET Lab III- DWM(F)", room: "Lab", class_code: "4R (Sem VII)", batch: "Batch F", fullTitle: "ET Lab III- DWM (Batch F)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "PE - 1 DSS", room: "B206", class_code: "3N (Sem V)", fullTitle: "PE-I: Decision Support Systems (DSS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "ET Lab III – DW&M (E)", room: "Lab", class_code: "4R (Sem VII)", batch: "Batch E", fullTitle: "ET Lab III – DW&M (Batch E)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "ET Lab-I DSS (F)", room: "Lab", class_code: "3N (Sem V)", batch: "Batch F", fullTitle: "ET Lab-I DSS (Batch F)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "V", code: "5CS223PE / 5CS226PE", name: "PE-I DSS", detail: "Decision Support Systems (DSS) & Lab — Class 3N (Classroom B206 & Lab)", th: 3, pr: 6, total: 9 },
        { sem: "VII", code: "7KS04 / 7KS07", name: "PE-III DWM", detail: "Data Warehousing & Mining (DWM) & Lab — Class 4R (Classroom B206/B007 & Lab)", th: 3, pr: 6, total: 9 }
      ];
      totalTheoryLoad = 6;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 18;

    } else if (isMahalle) {
      // Official Personal Time-Table for Dr. V. S. Mahalle (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "OOP (2R2-D)", room: "Lab", class_code: "2R2 (Sem III)", batch: "Batch D", fullTitle: "OOP Lab (Batch D)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "OOP (2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "ICS", room: "DBMS Lab", class_code: "3R (Sem V)", fullTitle: "PE-I: Introduction to Cyber Security (ICS)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "OOP 2R2-(B)", room: "Lab", class_code: "2R2 (Sem III)", batch: "Batch B", fullTitle: "OOP Lab (Batch B)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "OOP (2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "ICS", room: "DBMS Lab", class_code: "3R (Sem V)", fullTitle: "PE-I: Introduction to Cyber Security (ICS)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "OOP (2R2-C)", room: "Lab", class_code: "2R2 (Sem III)", batch: "Batch C", fullTitle: "OOP Lab (Batch C)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "ET Lab: ICS (H)", room: "ET Lab I", class_code: "3R (Sem V)", batch: "Batch H", fullTitle: "ET LAB-I (ICS) (Batch H)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [4] },
            { subject: "OOP (2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "OOP 2R2-(A)", room: "Lab", class_code: "2R2 (Sem III)", batch: "Batch A", fullTitle: "OOP Lab (Batch A)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "ICS", room: "DBMS Lab", class_code: "3R (Sem V)", fullTitle: "PE-I: Introduction to Cyber Security (ICS)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "OOP (2R2)", room: "B007", class_code: "2R2 (Sem III)", fullTitle: "Object Oriented Programming (OOP)", isLab: false, colspan: 1, slotIndices: [2] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "III", code: "3CS201PC", name: "OOP", detail: "Object Oriented Programming (OOP) — Class 2R2 (Classroom B007)", th: 4, pr: 0, total: 4 },
        { sem: "III", code: "3CS203PC", name: "OOP_LAB", detail: "Object Oriented Programming Lab — Class 2R2 (Batches A, B, C, D)", th: 0, pr: 8, total: 8 },
        { sem: "V", code: "5KS04", name: "PE – I (ICS)", detail: "PE-I: Introduction to Cyber Security — Class 3R (DBMS Lab)", th: 3, pr: 0, total: 3 },
        { sem: "V", code: "5KS08", name: "ET LAB-I (ICS)", detail: "ET LAB-I (ICS) Practical — Class 3R (Batch H)", th: 0, pr: 2, total: 2 }
      ];
      totalTheoryLoad = 7;
      totalPracticalLoad = 10;
      totalWeeklyLoad = 17;

    } else if (isMankar) {
      // Official Personal Time-Table for Prof. C. M. Mankar (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "CD", room: "B206", class_code: "3N (Sem V)", fullTitle: "Compiler Design (CD)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "CD (B)", room: "Lab", class_code: "3N (Sem V)", batch: "Batch B", fullTitle: "Compiler Design Lab (Batch B)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "MDM#3", room: "C1", class_code: "3N (Sem V)", fullTitle: "Multidisciplinary Minor #3 (MDM#3)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "CD", room: "B206", class_code: "3N (Sem V)", fullTitle: "Compiler Design (CD)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "CD (A)", room: "Lab", class_code: "3N (Sem V)", batch: "Batch A", fullTitle: "Compiler Design Lab (Batch A)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "MDM#3", room: "C1", class_code: "3N (Sem V)", fullTitle: "Multidisciplinary Minor #3 (MDM#3)", isLab: false, colspan: 1, slotIndices: [4] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "CEP (2R1-C)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch C", fullTitle: "Community / Field Project (Batch C)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "CD", room: "B206", class_code: "3N (Sem V)", fullTitle: "Compiler Design (CD)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "CD (D)", room: "Lab", class_code: "3N (Sem V)", batch: "Batch D", fullTitle: "Compiler Design Lab (Batch D)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "CEP (2R1-C)", room: "Seminar Hall", class_code: "2R1 (Sem III)", batch: "Batch C", fullTitle: "Community / Field Project (Batch C)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "CD (C)", room: "Lab", class_code: "3N (Sem V)", batch: "Batch C", fullTitle: "Compiler Design Lab (Batch C)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "V", code: "5CS221PC / 5CS225PC", name: "CD", detail: "Compiler Design (CD) — Class 3N (Classroom B206 & Lab)", th: 3, pr: 8, total: 11 },
        { sem: "V", code: "5CS227MD", name: "MDM#3", detail: "Multidisciplinary Minor #3 (MDM#3) — Classroom C1", th: 2, pr: 0, total: 2 },
        { sem: "III", code: "3CS400EL", name: "Community / Field Project", detail: "Community / Field Project (CEP) — Class 2R1 (Batch C)", th: 0, pr: 4, total: 4 }
      ];
      totalTheoryLoad = 5;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 17;

    } else if (isKandoi) {
      // Official Personal Time-Table for Dr. N. M. Kandoi (Assistant Professor, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "BF", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Blockchain Fundamentals (BF)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "BF (B)", room: "ET Lab IV", class_code: "4R (Sem VII)", batch: "Batch B", fullTitle: "ET LAB IV BF (Batch B)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "CEP(D-2R2)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch D", fullTitle: "Community / Field Project (Batch D)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "BF (C)", room: "ET Lab IV", class_code: "4R (Sem VII)", batch: "Batch C", fullTitle: "ET LAB IV BF (Batch C)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "BF", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Blockchain Fundamentals (BF)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "BF (A)", room: "ET Lab IV", class_code: "4R (Sem VII)", batch: "Batch A", fullTitle: "ET LAB IV BF (Batch A)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "CEP(D-2R2)", room: "Seminar Hall", class_code: "2R2 (Sem III)", batch: "Batch D", fullTitle: "Community / Field Project (Batch D)", isLab: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [0] },
            { subject: "BF", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Blockchain Fundamentals (BF)", isLab: false, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "BF (D)", room: "ET Lab IV", class_code: "4R (Sem VII)", batch: "Batch D", fullTitle: "ET LAB IV BF (Batch D)", isLab: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meeting", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Research", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "VII", code: "7KS05", name: "BF", detail: "Blockchain Fundamentals — Class 4R (Classroom B007)", th: 3, pr: 0, total: 3 },
        { sem: "VII", code: "7KS08", name: "ET LAB IV BF", detail: "ET LAB IV BF (Practical) — Class 4R (Batches A, B, C, D)", th: 0, pr: 8, total: 8 },
        { sem: "III", code: "3CS400EL", name: "Community / Field Project", detail: "Community / Field Project (CEP) — Class 2R2 (Batch D)", th: 0, pr: 4, total: 4 }
      ];
      totalTheoryLoad = 3;
      totalPracticalLoad = 12;
      totalWeeklyLoad = 15;

    } else {
      // Official Personal Time-Table for Dr. J. M. Patil (Head Of Department, CSE)
      scheduleRows = [
        {
          day: "Monday",
          dayShort: "Mon",
          part1: [
            { subject: "CC", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Cloud Computing (CC)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "DMS(D)", room: "Adv Systems Lab", class_code: "3N (Sem V)", batch: "Batch D", fullTitle: "DBMS Lab (Batch D)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Tuesday",
          dayShort: "Tue",
          part1: [
            { subject: "CC", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Cloud Computing (CC)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "DMS(B)", room: "Adv Systems Lab", class_code: "3N (Sem V)", batch: "Batch B", fullTitle: "DBMS Lab (Batch B)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Wednesday",
          dayShort: "Wed",
          part1: [
            { subject: "CC", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Cloud Computing (CC)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "Free / Research / Admin", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Thursday",
          dayShort: "Thu",
          part1: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "DMS(C)", room: "Adv Systems Lab", class_code: "3N (Sem V)", batch: "Batch C", fullTitle: "DBMS Lab (Batch C)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Friday",
          dayShort: "Fri",
          part1: [
            { subject: "CC", room: "B007", class_code: "4R (Sem VII)", fullTitle: "Cloud Computing (CC)", isLab: false, colspan: 1, slotIndices: [0] },
            { subject: "Free Slot", isFree: true, colspan: 1, slotIndices: [1] }
          ],
          part2: [
            { subject: "DMS(A)", room: "Adv Systems Lab", class_code: "3N (Sem V)", batch: "Batch A", fullTitle: "DBMS Lab (Batch A)", isLab: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Free / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        },
        {
          day: "Saturday",
          dayShort: "Sat",
          part1: [
            { subject: "Off / Project Review", isFree: true, colspan: 2, slotIndices: [0, 1] }
          ],
          part2: [
            { subject: "Off / Dept Meetings", isFree: true, colspan: 2, slotIndices: [2, 3] }
          ],
          part3: [
            { subject: "Off / Prep", isFree: true, colspan: 2, slotIndices: [4, 5] }
          ]
        }
      ];

      teachingLoadRows = [
        { sem: "VII", code: "7KS03", name: "Cloud Computing (CC)", detail: "Cloud Computing (CC) — Class 4R (Classroom B007)", th: 4, pr: 0, total: 4 },
        { sem: "V", code: "5CS224PC", name: "Database Management Systems Lab (DBMS / DMS)", detail: "Database Management Systems Lab (DBMS / DMS) — Class 3N (Batches A, B, C, D)", th: 0, pr: 8, total: 8 }
      ];
      totalTheoryLoad = 4;
      totalPracticalLoad = 8;
      totalWeeklyLoad = 12;
    }

    // Compute upcoming assessments for alert strip
    const upcomingTests = (this.tests || []).filter(t => {
      if (!t.date) return false;
      const st = this.getTestStatus(t);
      if (st.status === "Ended") return false;

      const [ty, tm, td] = t.date.split("-").map(Number);
      const [cy, cm, cd] = todayISO.split("-").map(Number);
      const tDt = new Date(ty, tm - 1, td);
      const cDt = new Date(cy, cm - 1, cd);
      const diffTime = tDt.getTime() - cDt.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      return diffDays >= 0 || st.status === "Live";
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.start || "").localeCompare(b.start || "");
    });

    let upcomingAlertStripHTML = "";
    if (upcomingTests.length > 0) {
      const alertCardsHTML = upcomingTests.map(t => {
        const st = this.getTestStatus(t);
        const start12 = this.formatTime12Hour(t.start);
        const end12 = this.formatTime12Hour(t.end);

        const [ty, tm, td] = t.date.split("-").map(Number);
        const [cy, cm, cd] = todayISO.split("-").map(Number);
        const tDt = new Date(ty, tm - 1, td);
        const cDt = new Date(cy, cm - 1, cd);
        const diffDays = Math.round((tDt - cDt) / (1000 * 3600 * 24));

        let badgeClass = "in-days";
        let countdownText = `In ${diffDays} Days`;

        if (st.status === "Live") {
          badgeClass = "today-badge";
          countdownText = "LIVE NOW";
        } else if (diffDays === 0) {
          badgeClass = "today-badge";
          countdownText = "TODAY";
        } else if (diffDays === 1) {
          badgeClass = "tomorrow";
          countdownText = "TOMORROW";
        } else if (diffDays === 2) {
          badgeClass = "in-days";
          countdownText = "IN 2 DAYS";
        }

        let readableTestDate = t.date;
        try {
          readableTestDate = tDt.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
          });
        } catch (_) {}

        return `
          <div class="upcoming-alert-item-card"
               onclick="TeacherTimetableApp.openTestDetails('${t.id}')"
               role="button"
               tabindex="0"
               aria-label="Upcoming Assessment: ${t.title}"
               onkeydown="if(event.key==='Enter') TeacherTimetableApp.openTestDetails('${t.id}')">
            <div class="upcoming-item-left">
              <div class="upcoming-item-top">
                <span class="upcoming-countdown-badge ${badgeClass}">
                  <i data-lucide="${diffDays === 0 || st.status === 'Live' ? 'zap' : 'clock'}" style="width:10px;height:10px;"></i>
                  ${countdownText}
                </span>
                <span class="test-type-badge ${t.type.toLowerCase()}-type" style="font-size:10px; padding:1px 6px;">
                  ${t.type.toUpperCase()}
                </span>
                <span class="upcoming-item-subject">${t.subject}</span>
              </div>
              <div class="upcoming-item-title-meta">
                <strong>${t.title}</strong>
                <span style="opacity:0.6;">•</span>
                <span><i data-lucide="calendar" style="width:11px;height:11px;display:inline;vertical-align:-1px;"></i> ${readableTestDate}</span>
                <span style="opacity:0.6;">•</span>
                <span><i data-lucide="clock" style="width:11px;height:11px;display:inline;vertical-align:-1px;"></i> ${start12} – ${end12}</span>
                <span style="opacity:0.6;">•</span>
                <span style="color:#0284C7; font-weight:600;"><i data-lucide="user" style="width:11px;height:11px;display:inline;vertical-align:-1px;"></i> ${t.faculty_name || 'Dr. J. M. Patil'}</span>
              </div>
            </div>
            <div class="upcoming-item-right">
              <button type="button" class="btn-view-upcoming-detail" onclick="event.stopPropagation(); TeacherTimetableApp.openTestDetails('${t.id}')">
                <span>Manage</span>
                <i data-lucide="arrow-right" style="width:12px;height:12px;"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      upcomingAlertStripHTML = `
        <div class="upcoming-assessments-alert-strip">
          <div class="upcoming-alert-header">
            <div class="upcoming-alert-title-wrap">
              <span class="upcoming-pulse-icon">
                <i data-lucide="bell-ring" style="width:13px;height:13px;"></i>
              </span>
              <span>Upcoming Assessments &amp; Tests Notice (${upcomingTests.length})</span>
            </div>
            <span style="font-size:11.5px; color:#92400E; font-weight:600;">Department Overview (All Faculty)</span>
          </div>
          <div class="upcoming-items-grid">
            ${alertCardsHTML}
          </div>
        </div>
      `;
    }

    // Helper: Render block cell (supports single slot, colspan 2 practicals, or scheduled tests)
    const renderBlockHTML = (block, dayName) => {
      // Find tests scheduled for this day & slot from backend data
      const slotTests = (this.tests || []).filter(t => {
        if (!t.date || !t.start) return false;
        const [y, m, d] = t.date.split("-").map(Number);
        const testDateObj = new Date(y, m - 1, d, 12, 0, 0);
        const testDayName = testDateObj.toLocaleDateString("en-US", { weekday: "long" });
        if (testDayName.toLowerCase() !== dayName.toLowerCase()) return false;

        const testSlotIdx = this.getSlotIndexForTime(t.start);
        return block.slotIndices.includes(testSlotIdx);
      });

      if (slotTests.length > 0) {
        const testsHTML = slotTests.map(t => {
          const st = this.getTestStatus(t);
          const start12 = this.formatTime12Hour(t.start);
          const end12 = this.formatTime12Hour(t.end);

          return `
            <div class="test-card ${t.type.toLowerCase()}-card"
                 onclick="TeacherTimetableApp.openTestDetails('${t.id}')"
                 role="button"
                 tabindex="0"
                 aria-label="Assessment: ${t.title}"
                 onkeydown="if(event.key==='Enter') TeacherTimetableApp.openTestDetails('${t.id}')">
              <div class="test-card-top">
                <span class="test-type-badge ${t.type.toLowerCase()}-type">
                  <i data-lucide="file-text" style="width:11px;height:11px;"></i>
                  ${t.type.toUpperCase()}
                </span>
                <span class="test-status-pill ${st.badgeClass}">
                  ${st.label}
                </span>
              </div>
              <div class="test-subject">${t.subject}</div>
              <div class="test-title" title="${t.title}">${t.title}</div>
              <div class="test-time">
                <i data-lucide="calendar" style="width:11px;height:11px;"></i>
                <span>${t.date}</span>
                <span style="margin: 0 4px; opacity:0.5;">•</span>
                <i data-lucide="clock" style="width:11px;height:11px;"></i>
                <span>${start12} – ${end12}</span>
              </div>
              <div class="test-faculty-author" style="margin-top:4px; font-size:10.5px; color:#475569; display:flex; align-items:center; gap:4px; font-weight:600;">
                <i data-lucide="user" style="width:10px;height:10px;color:#0284C7;"></i>
                <span>${t.faculty_name || 'Dr. J. M. Patil'}</span>
              </div>
            </div>
          `;
        }).join('');

        return `
          <td class="schedule-cell" colspan="${block.colspan || 1}">
            <div class="cell-stack-container">
              ${testsHTML}
            </div>
          </td>
        `;
      }

      if (block.isFree) {
        return `
          <td class="schedule-cell off-prep-cell" colspan="${block.colspan || 1}">
            <div class="off-prep">
              <span class="off-prep-pill">
                <i data-lucide="coffee" style="width:12px;height:12px;"></i>
                OFF / PREP
              </span>
              <span class="off-prep-caption">No Lecture Scheduled</span>
            </div>
          </td>
        `;
      }

      const isHighlightRow = (dayName.toLowerCase() === currentDayName.toLowerCase());

      return `
        <td class="schedule-cell" colspan="${block.colspan || 1}">
          <div class="class-card ${block.isLab ? 'class-lab' : 'class-lecture'} ${isHighlightRow ? 'class-card-highlighted' : ''}">
            <div class="class-card-top">
              <span class="class-type ${block.isLab ? 'type-lab' : 'type-lecture'}">
                <i data-lucide="${block.isLab ? 'flask-conical' : 'book-open'}" style="width:11px;height:11px;"></i>
                ${block.isLab ? 'LAB PRACTICAL' : 'THEORY LECTURE'}
              </span>
            </div>
            
            <div class="class-subject-title" title="${block.fullTitle || block.subject}">
              ${block.subject}
            </div>

            <div class="class-card-meta">
              ${block.room ? `<span class="class-faculty-pill"><i data-lucide="map-pin" style="width:10px;height:10px;display:inline;vertical-align:-1px;"></i> ${block.room}</span>` : ''}
              ${block.class_code ? `<span class="class-batch-pill">${block.class_code}</span>` : ''}
              ${block.batch ? `<span class="class-batch-pill">${block.batch}</span>` : ''}
            </div>
          </div>
        </td>
      `;
    };

    // Helper: Render full schedule row
    const renderRowHTML = (row) => {
      const isHighlightRow = (row.day.toLowerCase() === currentDayName.toLowerCase());

      return `
        <tr class="schedule-row ${isHighlightRow ? 'active-day-row' : ''}" role="row">
          <!-- Day Cell -->
          <td class="day-cell ${isHighlightRow ? 'active-day-cell' : ''}" scope="row">
            <div class="day-cell-inner">
              <span class="day-label">${row.dayShort || row.day.substring(0, 3)}</span>
              ${isHighlightRow ? `
                <span class="today-badge ${isToday ? 'today-badge-current' : 'today-badge-active'}">
                  ${isToday ? 'TODAY' : 'ACTIVE'}
                </span>
              ` : ''}
            </div>
          </td>

          <!-- Part 1: Slots 1 & 2 (11.00 am - 01.00 pm) -->
          ${row.part1.map(b => renderBlockHTML(b, row.day)).join('')}

          <!-- BREAK Column (15 Mins) -->
          <td class="timetable-break-cell body-break">
            <div class="break-vertical-text">
              <span>B</span><span>R</span><span>E</span><span>A</span><span>K</span>
            </div>
          </td>

          <!-- Part 2: Slots 3 & 4 (01.15 pm - 03.15 pm) -->
          ${row.part2.map(b => renderBlockHTML(b, row.day)).join('')}

          <!-- RECESS Column (30 Mins) -->
          <td class="timetable-recess-cell body-recess">
            <div class="recess-vertical-text">
              <span>R</span><span>E</span><span>C</span><span>E</span><span>S</span><span>S</span>
            </div>
          </td>

          <!-- Part 3: Slots 5 & 6 (03.45 pm - 05.45 pm) -->
          ${row.part3.map(b => renderBlockHTML(b, row.day)).join('')}
        </tr>
      `;
    };

    let sundayRowHTML = "";
    if (includeSunday) {
      const sundayRow = {
        day: "Sunday",
        dayShort: "Sun",
        part1: [{ subject: "Off / Holiday", isFree: true, colspan: 2, slotIndices: [0, 1] }],
        part2: [{ subject: "Off / Holiday", isFree: true, colspan: 2, slotIndices: [2, 3] }],
        part3: [{ subject: "Off / Holiday", isFree: true, colspan: 2, slotIndices: [4, 5] }]
      };
      sundayRowHTML = renderRowHTML(sundayRow);
    }

    container.innerHTML = `
      <div class="timetable-card">

        <!-- ==================== OFFICIAL SSGMCE PERSONAL TIME-TABLE HEADER ==================== -->
        <div class="timetable-header">
          <div class="official-timetable-header-card">
            <div class="official-tt-top">
              <div class="official-college-branding">
                <div class="official-college-info">
                  <h4 class="inst-name">Shri Sant Gajanan Maharaj College of Engineering, Shegaon</h4>
                  <p class="inst-dept">Department of Computer Science &amp; Engineering • Autonomous Curriculum</p>
                </div>
              </div>
              <div class="official-tt-session-wrap">
                <span class="session-badge-text">Session: 2026-2027 (Autumn)</span>
                <h2 class="official-main-heading">PERSONAL TIME-TABLE</h2>
              </div>
            </div>
            <div class="official-tt-submeta">
              <div class="submeta-left">
                <span>Name of Faculty: <span class="faculty-tag">${teacher.name}</span> (${teacher.title})</span>
              </div>
              <div class="submeta-right">
                <span>w.e.f.: <span class="wef-tag">13/08/2026</span></span>
              </div>
            </div>
          </div>

          <!-- Schedule Controls Toolbar -->
          <div class="timetable-header-content" style="margin-top:14px; margin-bottom:12px;">
            <div class="schedule-meta">
              <span class="schedule-term-badge">
                <i data-lucide="graduation-cap" style="width:13px;height:13px;"></i>
                Academic Term: ${term.academicYear} • Autumn Semester
              </span>
            </div>

            <!-- Schedule Controls -->
            <div class="schedule-controls">
              <div class="date-control">
                <label for="timetable-date-picker-input" class="date-control-label">
                  <i data-lucide="calendar" style="width:14px;height:14px;"></i>
                  <span>View Date</span>
                </label>
                <input type="date"
                       id="timetable-date-picker-input"
                       class="date-input"
                       value="${selectedDate}"
                       aria-label="Select date to highlight"
                       onchange="TeacherTimetableApp.handleTimetableDateChange(this.value)">
              </div>

              <button class="today-button ${isToday ? 'active' : ''}"
                      type="button"
                      onclick="TeacherTimetableApp.resetTimetableToToday()"
                      aria-label="Reset timetable view to today">
                <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                <span>Today</span>
              </button>

              <!-- Test / Assessment Button -->
              <button class="test-button"
                      type="button"
                      id="btnOpenScheduleTestModal"
                      onclick="TeacherTimetableApp.openAddTestModal()"
                      aria-label="Schedule a new test or assessment">
                <i data-lucide="file-plus-2" style="width:14px;height:14px;"></i>
                <span>Schedule Test</span>
              </button>

              <button class="print-button"
                      type="button"
                      onclick="window.print()"
                      aria-label="Print timetable schedule">
                <i data-lucide="printer" style="width:14px;height:14px;"></i>
                <span>Print Schedule</span>
              </button>
            </div>
          </div>

          <!-- Schedule Status Banner -->
          <div class="schedule-status ${isToday ? 'status-today' : 'status-custom'}">
            <div class="status-left">
              <span class="status-pulse-dot" aria-hidden="true"></span>
              <span class="status-date-text">
                Schedule for: <strong>${currentDayName}, ${readableDate}</strong>
              </span>
              <span class="status-badge ${isToday ? 'badge-today' : 'badge-selected'}">
                ${isToday ? "Today's Schedule" : "Selected Date"}
              </span>
            </div>
            <div class="status-hint">
              ${isWeekend
                ? '<i data-lucide="info" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> <em>Weekend schedule shown below</em>'
                : `<i data-lucide="check" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Highlighting <strong>${currentDayName}</strong> in the schedule`
              }
            </div>
          </div>

          <!-- Advance Alert Strip for Upcoming Tests -->
          ${upcomingAlertStripHTML}
        </div>

        <!-- ==================== TIMETABLE GRID TABLE (6 SLOTS + BREAK + RECESS) ==================== -->
        <div class="timetable-wrapper">
          <table class="timetable" role="table" aria-label="Faculty Weekly Timetable">
            <thead>
              <tr role="row">
                <th class="timetable-header-cell day-col-header" scope="col">
                  <div class="th-content">
                    <i data-lucide="calendar-days" style="width:14px;height:14px;"></i>
                    <span>Day</span>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 1</span>
                    <div class="th-time-range"><span>11.00 am - 12.00 pm</span></div>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 2</span>
                    <div class="th-time-range"><span>12.00 pm - 01.00 pm</span></div>
                  </div>
                </th>
                <th class="timetable-break-cell header-break" scope="col">
                  <span>15 Mins</span>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 3</span>
                    <div class="th-time-range"><span>01.15 pm - 02.15 pm</span></div>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 4</span>
                    <div class="th-time-range"><span>02.15 pm - 03.15 pm</span></div>
                  </div>
                </th>
                <th class="timetable-recess-cell header-recess" scope="col">
                  <span>30 Mins</span>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 5</span>
                    <div class="th-time-range"><span>03.45 pm - 04.45 pm</span></div>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 6</span>
                    <div class="th-time-range"><span>04.45 pm - 05.45 pm</span></div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              ${scheduleRows.map(r => renderRowHTML(r)).join('')}
              ${sundayRowHTML}
            </tbody>
          </table>
        </div>

        <!-- ==================== TEACHING LOAD SUMMARY TABLE (OFFICIAL BOTTOM CARD) ==================== -->
        <div class="teaching-load-card">
          <h4 class="teaching-load-title">
            <i data-lucide="bar-chart-2" style="width:16px;height:16px;color:var(--tt-blue);"></i>
            <span>Teaching Load Summary (${teacher.name})</span>
          </h4>
          <table class="teaching-load-table" role="table" aria-label="Teaching Load Summary">
            <thead>
              <tr>
                <th rowspan="2" style="width:70px;">Sem</th>
                <th rowspan="2" style="width:120px;">Subject Code</th>
                <th rowspan="2" style="text-align:left;">Subject Name</th>
                <th colspan="2">Load (Hrs / Week)</th>
                <th rowspan="2" style="width:110px;">Total Load</th>
              </tr>
              <tr class="th-sub">
                <th style="width:90px;">Theory (Th)</th>
                <th style="width:90px;">Practical (Pr)</th>
              </tr>
            </thead>
            <tbody>
              ${teachingLoadRows.map(row => `
                <tr>
                  <td><strong>${row.sem}</strong></td>
                  <td><code>${row.code}</code></td>
                  <td style="text-align:left;">${row.detail || `<strong>${row.name}</strong>`}</td>
                  <td>${row.th > 0 ? `<strong>${String(row.th).padStart(2, '0')}</strong>` : '--'}</td>
                  <td>${row.pr > 0 ? `<strong>${String(row.pr).padStart(2, '0')}</strong>` : '--'}</td>
                  <td><strong>${String(row.total).padStart(2, '0')} Hrs</strong></td>
                </tr>
              `).join('')}
              <tr style="background:#F8FAFD; font-weight:700;">
                <td colspan="3" style="text-align:right;">Total Faculty Teaching Load:</td>
                <td>${String(totalTheoryLoad).padStart(2, '0')}</td>
                <td>${String(totalPracticalLoad).padStart(2, '0')}</td>
                <td style="color:var(--tt-blue); font-size:13.5px;">${totalWeeklyLoad} Hrs/Week</td>
              </tr>
            </tbody>
          </table>
          <div class="teaching-load-signatures">
            <div>
              <span style="display:block; border-top:1px solid #94A3B8; padding-top:6px; width:170px; text-align:center;">Time Table Coordinator</span>
            </div>
            <div>
              <span style="display:block; border-top:1px solid #94A3B8; padding-top:6px; width:170px; text-align:center;">Head, CSE Dept.</span>
            </div>
          </div>
        </div>

        <!-- ==================== LEGEND & FOOTNOTE ==================== -->
        <div class="timetable-legend-bar">
          <div class="legend-items">
            <span class="legend-title">Legend:</span>
            <div class="legend-item">
              <span class="legend-dot lecture-dot"></span>
              <span>Theory Lecture (1 Hr)</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot lab-dot"></span>
              <span>Practical Lab (2 Hrs)</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot test-dot"></span>
              <span>Assessment / Scheduled Test</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot off-dot"></span>
              <span>Off / Prep / Meeting</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot active-dot"></span>
              <span>Active Date Highlight</span>
            </div>
          </div>
          <div class="legend-note">
            <span>SSGMCE Autonomous Curriculum • Faculty Schedule</span>
          </div>
        </div>

      </div>
    `;

    this.initLucideIcons();
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

        if (health && (health.status === 'OK' || health.status === 'healthy')) {
          setStatus(true, latency);
        } else {
          setStatus(false);
        }
      } catch (err) {
        setStatus(false);
      }
    } else {
      if (pill) {
        pill.style.display = 'inline-flex';
        setStatus(true);
        if (text) text.textContent = '🟢 Portal Active';
      }
    }
  },

  showToast(message, type = 'info') {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-stack";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `dashboard-toast toast-${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'}" style="width:16px;height:16px;flex-shrink:0;"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    this.initLucideIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Aliases for compatibility
window.TeacherTimetableApp = TeacherTimetableApp;
window.TeacherApp = window.TeacherApp || TeacherTimetableApp;

// Auto initialize on DOM load or immediately if already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    TeacherTimetableApp.init();
  });
} else {
  TeacherTimetableApp.init();
}
