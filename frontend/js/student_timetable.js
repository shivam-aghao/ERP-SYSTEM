/* ========================================================
   STUDENT ERP — TIMETABLE MODULE CONTROLLER
   student_timetable.js
   SSGMCE Student Portal
   Read-Only Timetable & Scheduled Test/Assessment Display
   ======================================================== */

const StudentTimetableApp = {
  selectedTimetableDate: null,
  tests: [],
  timetableEntries: [],
  studentSession: null,
  serverTimeOffsetMs: 0,
  realtimeChannel: null,
  _tickerInterval: null,

  init() {
    this.loadStudentSession();
    this.bindEvents();
    this.renderHeaderProfile();
    // 1. Instant local render (0ms response time - zero blank delay)
    this.loadCachedTests();
    this.renderTimetableView();
    this.initLucideIcons();

    // 2. Background async refresh (Stale-While-Revalidate)
    Promise.allSettled([
      this.syncServerTime(),
      this.loadTimetable(),
      this.loadTests()
    ]).then(() => {
      this.renderTimetableView();
      this.initLucideIcons();
    });

    this.initRealtimeSubscription();
    this.startLiveStatusTicker();
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

  async syncServerTime() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.getApiBase()}/server-time`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.timestamp_ms) {
          this.serverTimeOffsetMs = json.data.timestamp_ms - Date.now();
        }
      }
    } catch (_) {}
  },

  getServerNow() {
    const serverTimestamp = Date.now() + (this.serverTimeOffsetMs || 0);
    return new Date(serverTimestamp);
  },

  getApiBase() {
    return (typeof window !== 'undefined' && (window.__API_BASE__ || window.__STUDENT_API_BASE__)) || '/api/v1';
  },

  // ----------------------------------------------------
  // LOAD REAL STUDENT TIMETABLE FROM BACKEND API
  // ----------------------------------------------------
  async loadTimetable() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      let res = await fetch(`${this.getApiBase()}/student/timetable`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const c2 = new AbortController();
        const t2 = setTimeout(() => c2.abort(), 1500);
        res = await fetch(`${this.getApiBase()}/timetable`, { signal: c2.signal });
        clearTimeout(t2);
      }
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          this.timetableEntries = json.data;
          return;
        }
      }
    } catch (e) {
      // Background timetable fetch
    }

    try {
      if (typeof StudentApi !== 'undefined' && typeof StudentApi.getTimetable === 'function') {
        const res = await StudentApi.getTimetable();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.timetableEntries = res.data;
          return;
        }
      }
    } catch (_) {}
  },

  // ----------------------------------------------------
  // AUTHENTICATED STUDENT SESSION
  // ----------------------------------------------------
  loadStudentSession() {
    try {
      const stored = localStorage.getItem('ssgmce_erp_session') || localStorage.getItem('ssgmce_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'student' || parsed.studentCode || parsed.rollNo) {
          this.studentSession = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse student session:", e);
    }

    // Default student context from ERP model (CSE 2R1)
    this.studentSession = {
      fullName: "Shivam Aghao",
      shortName: "Shivam",
      initials: "SA",
      rollNo: "21",
      studentCode: "307001",
      className: "2R1",
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
      email: "shivam.aghao@ssgmce.ac.in"
    };
  },

  // ----------------------------------------------------
  // LOAD SCHEDULED TESTS / ASSESSMENTS (MULTI-TIER: API + SUPABASE + LOCAL CACHE)
  // ----------------------------------------------------
  async loadTests() {
    let localTests = [];
    let apiTests = [];

    // 1. Read local cache for immediate offline/cross-tab sync
    try {
      const local = localStorage.getItem('ssgmce_scheduled_tests');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          localTests = parsed.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
        }
      }
    } catch (_) {}

    // 2. Backend REST API with fast timeout
    try {
      let classCode = (this.studentSession && (this.studentSession.className || this.studentSession.class_name || this.studentSession.classCode)) || '2R1';
      const studentCode = (this.studentSession && (this.studentSession.studentCode || this.studentSession.student_code || this.studentSession.id)) || '307001';

      const params = new URLSearchParams();
      if (classCode) params.append('class_code', classCode);
      if (studentCode) params.append('student_code', studentCode);

      const url = `${this.getApiBase()}/timetable/tests?${params.toString()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          apiTests = json.data.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
        }
      }
    } catch (e) {
      // Backend fetch finished or timed out
    }

    // 3. Direct Supabase Client if API returned empty and client is already ready
    if (apiTests.length === 0 && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('timetable_assessments')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (!error && Array.isArray(data) && data.length > 0) {
          apiTests = data
            .filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"))
            .map(t => ({
              id: t.id,
              teacher_id: t.teacher_id || 'FAC-CSE-1001',
              type: t.type || 'Quiz',
              subject: t.subject || '',
              title: t.title || '',
              date: t.date || '',
              start: t.start_time || t.start || '',
              end: t.end_time || t.end || '',
              link: t.link || '',
              class_code: t.class_code || '2R1'
            }));
        }
      } catch (sbErr) {}
    }

    // Combine & merge: ensure tests scheduled on either side are immediately present
    const testMap = new Map();
    localTests.forEach(t => testMap.set(t.id, t));
    apiTests.forEach(t => testMap.set(t.id, t));

    this.tests = Array.from(testMap.values());
    try {
      localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
    } catch (_) {}
  },

  bindEvents() {
    // Mobile Drawer Toggle (identical to Student Dashboard & Attendance)
    const toggleBtn = document.getElementById("mobileMenuToggle") || document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("dashboardSidebar") || document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebarBackdrop") || document.getElementById("sidebar-overlay");
    const closeBtn = document.getElementById("sidebar-close-btn");

    const closeSidebarDrawer = () => {
      if (sidebar) {
        sidebar.classList.remove("drawer-open");
        sidebar.classList.remove("open");
      }
      if (backdrop) {
        backdrop.classList.remove("active");
        backdrop.classList.remove("open");
      }
      document.body.style.overflow = "";
    };

    const openSidebarDrawer = () => {
      if (sidebar) {
        sidebar.classList.add("drawer-open");
        sidebar.classList.add("open");
      }
      if (backdrop) {
        backdrop.classList.add("active");
        backdrop.classList.add("open");
      }
      document.body.style.overflow = "hidden";
    };

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("drawer-open") || sidebar.classList.contains("open");
        if (isOpen) {
          closeSidebarDrawer();
        } else {
          openSidebarDrawer();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeSidebarDrawer);
    }

    if (backdrop) {
      backdrop.addEventListener("click", closeSidebarDrawer);
    }

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById("profileBtn") || document.getElementById("profile-dropdown-trigger");
    const profilePanel = document.getElementById("profilePanel") || document.getElementById("profile-dropdown-menu");
    if (profileBtn && profilePanel) {
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = profilePanel.classList.contains("active") || profilePanel.classList.contains("show");
        this.closeAllDropdowns();
        if (!isOpen) {
          profilePanel.classList.add("active");
          profilePanel.classList.add("show");
          profileBtn.classList.add("active");
        }
      });
    }

    // Notifications Dropdown Toggle
    const notifBtn = document.getElementById("notifBtn");
    const notifPanel = document.getElementById("notifPanel");
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = notifPanel.classList.contains("active") || notifPanel.classList.contains("show");
        this.closeAllDropdowns();
        if (!isOpen) {
          notifPanel.classList.add("active");
          notifPanel.classList.add("show");
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", () => {
      this.closeAllDropdowns();
    });

    // Close modals and popovers on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllDropdowns();
        this.closeTestDetailsModal();
      }
    });

    // Close modal on clicking outside modal container
    const detailsModal = document.getElementById("testDetailsModal");
    if (detailsModal) {
      detailsModal.addEventListener("click", (e) => {
        if (e.target === detailsModal) {
          this.closeTestDetailsModal();
        }
      });
    }

    // Live Cross-Tab & Window Focus Synchronization with Teacher Portal
    window.addEventListener("storage", async (e) => {
      if (e.key === "ssgmce_scheduled_tests") {
        await this.loadTests();
        this.renderTimetableView();
      }
    });

    window.addEventListener("tests:updated", async () => {
      await this.loadTests();
      this.renderTimetableView();
    });

    window.addEventListener("focus", async () => {
      await this.loadTests();
      this.renderTimetableView();
    });
  },

  closeAllDropdowns() {
    const profilePanel = document.getElementById("profilePanel") || document.getElementById("profile-dropdown-menu");
    const profileBtn = document.getElementById("profileBtn") || document.getElementById("profile-dropdown-trigger");
    const notifPanel = document.getElementById("notifPanel");

    if (profilePanel) {
      profilePanel.classList.remove("active");
      profilePanel.classList.remove("show");
    }
    if (profileBtn) profileBtn.classList.remove("active");
    if (notifPanel) {
      notifPanel.classList.remove("active");
      notifPanel.classList.remove("show");
    }
  },

  initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  renderHeaderProfile() {
    const s = this.studentSession;
    if (!s) return;

    const displayName = s.shortName || s.fullName || s.name || "Student";
    const displayClass = s.className ? `${s.className} • Roll ${s.rollNo || '--'}` : (s.role || "Student");
    const initials = s.initials || (displayName ? displayName.substring(0, 2).toUpperCase() : "ST");

    // Standard IDs
    const headerName = document.getElementById("header-profile-name");
    const headerDept = document.getElementById("header-profile-dept");
    const avatarElem = document.getElementById("header-profile-avatar");
    const menuName = document.getElementById("profile-menu-name");
    const menuTitle = document.getElementById("profile-menu-title");

    if (headerName) headerName.textContent = displayName;
    if (headerDept) headerDept.textContent = displayClass;
    if (menuName) menuName.textContent = s.fullName || displayName;
    if (menuTitle) menuTitle.textContent = `${displayClass} • ${s.departmentCode || 'CSE'}`;
    if (avatarElem) avatarElem.innerHTML = `<span>${initials}</span>`;

    // Common Dashboard classes
    document.querySelectorAll('.avatar-circle, .large-avatar').forEach(el => {
      el.textContent = initials;
    });
    document.querySelectorAll('.student-name, .p-name').forEach(el => {
      el.textContent = displayName;
    });
    document.querySelectorAll('.student-meta').forEach(el => {
      el.textContent = `Roll: ${s.rollNo || 21} • ${s.className || 'CSE 2R1'} (${s.studentCode || 'CSE2401'})`;
    });
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
      else if (!meridiem && h >= 1 && h <= 7) h += 12; // College academic afternoon (1:00 - 7:59 -> PM)
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

  subjectsMatch(sub1, sub2) {
    if (!sub1 || !sub2) return false;
    const s1 = sub1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = sub2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return true;
    if (s1.includes(s2) || s2.includes(s1)) return true;

    const aliases = [
      ['databasemanagementsystems', 'databasesystems', 'dbms'],
      ['datastructuresandalgorithms', 'datastructures', 'dsa'],
      ['operatingsystems', 'os', 'operatingsystem'],
      ['computernetworks', 'cn', 'networks'],
      ['javaprogrammingandoop', 'javaprogramming', 'java', 'javalab', 'javaprogramminglab']
    ];

    for (const group of aliases) {
      const match1 = group.some(alias => s1.includes(alias));
      const match2 = group.some(alias => s2.includes(alias));
      if (match1 && match2) return true;
    }
    return false;
  },

  getSlotIndexForTime(timeStr, isSat = false) {
    const mins = this.timeToMinutes(timeStr);
    if (isSat) {
      if (mins < 570) return 0; // < 09:30 AM -> Sat Slot 1 (8:30 - 9:30)
      if (mins < 645) return 1; // < 10:45 AM -> Sat Slot 2 (9:30 - 10:30)
      if (mins < 705) return 2; // < 11:45 AM -> Sat Slot 3 (10:45 - 11:45)
      if (mins < 765) return 3; // < 12:45 PM -> Sat Slot 4 (11:45 - 12:45)
      if (mins < 945) return 4;
      return 5;
    }
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

    const now = this.getServerNow();
    const [year, month, day] = test.date.split("-").map(Number);
    const startMins = this.timeToMinutes(test.start);
    const endMins = this.timeToMinutes(test.end);

    const startH = Math.floor(startMins / 60);
    const startM = startMins % 60;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

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
    } else if (now >= startDateTime && now < endDateTime) {
      return {
        status: "Live",
        badgeClass: "status-live",
        label: "Live Now",
        caption: "Assessment Active"
      };
    } else {
      return {
        status: "Ended",
        badgeClass: "status-ended",
        label: "Closed",
        caption: "Submission Closed"
      };
    }
  },

  isTargetedForCurrentStudent(test) {
    if (!test) return false;
    const rawClass = (this.studentSession && (this.studentSession.className || this.studentSession.class_name || this.studentSession.classCode || '2R1')) || '2R1';
    const studentClass = rawClass.trim().toLowerCase();
    const targetClass = (test.class_code || test.class || '').trim().toLowerCase();

    if (!targetClass || targetClass === 'all' || targetClass === 'any' || targetClass === 'global') return true;
    if (targetClass === studentClass) return true;

    const extractToken = (s) => (s.match(/[1-4][a-z][1-2]?/g) || []);
    const tTokens = extractToken(targetClass);
    const sTokens = extractToken(studentClass);
    if (tTokens.length > 0 && sTokens.length > 0) {
      return tTokens.some(t => sTokens.includes(t));
    }
    return targetClass.includes(studentClass) || studentClass.includes(targetClass);
  },

  // ----------------------------------------------------
  // REAL-TIME SUPABASE SUBSCRIPTION & LIVE STATUS TICKER
  // ----------------------------------------------------
  async initRealtimeSubscription() {
    try {
      const getClient = window.getSupabaseClient || (typeof getSupabaseClient === 'function' ? getSupabaseClient : null);
      const client = getClient ? await getClient() : (window.supabaseClient || null);

      if (!client) {
        console.warn("[StudentTimetable] Supabase client initialization in progress or offline fallback.");
        return;
      }

      if (this.realtimeChannel) {
        try { client.removeChannel(this.realtimeChannel); } catch (_) {}
      }

      this.realtimeChannel = client
        .channel('realtime:student_timetable_assessments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_assessments' }, async (payload) => {
          console.log('[StudentTimetable Realtime Event]', payload.eventType, payload);
          const record = payload.new || payload.old || {};
          const tid = String(record.id || '');

          // Strictly ignore permanent quizzes or non-scheduled records
          if (!tid.startsWith('test-')) return;

          const isTargeted = this.isTargetedForCurrentStudent(record);

          if (payload.eventType === 'DELETE') {
            this.tests = this.tests.filter(t => t.id !== record.id);
            this.renderTimetableView();
            this.initLucideIcons();
            return;
          }

          if (!isTargeted) return;

          // Re-fetch tests with authoritative server URLs & re-render
          await this.loadTests();
          this.renderTimetableView();
          this.initLucideIcons();
        })
        .subscribe((status) => {
          console.info('[StudentTimetable Realtime] Channel status:', status);
        });
    } catch (err) {
      console.warn('[StudentTimetable Realtime] Subscription note:', err);
    }
  },

  startLiveStatusTicker() {
    if (this._tickerInterval) clearInterval(this._tickerInterval);
    this._tickerInterval = setInterval(async () => {
      let needsRefresh = false;
      for (const t of this.tests) {
        const oldStatus = t._lastStatus;
        const currentStatus = this.getTestStatus(t).status;
        if (oldStatus && oldStatus !== currentStatus) {
          needsRefresh = true;
          break;
        }
        t._lastStatus = currentStatus;
      }
      if (needsRefresh) {
        await this.loadTests();
        this.renderTimetableView();
        this.initLucideIcons();
      }
    }, 10000);
  },

  // ----------------------------------------------------
  // TEST DETAILS MODAL (READ-ONLY FOR STUDENT)
  // ----------------------------------------------------
  openTestDetails(testId) {
    const test = this.tests.find(t => t.id === testId);
    if (!test) return;

    const modal = document.getElementById("testDetailsModal");
    const typeBadge = document.getElementById("detailsModalTypeBadge");
    const modalTitle = document.getElementById("detailsModalTitle");
    const body = document.getElementById("testDetailsBody");

    const statusObj = this.getTestStatus(test);
    const start12 = this.formatTime12Hour(test.start);
    const end12 = this.formatTime12Hour(test.end);

    // Formatted readable date
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

    // Student launch action button based on test type and live status
    let actionBtnHTML = "";
    let linkRowHTML = "";

    if (statusObj.status === "Ended") {
      actionBtnHTML = `
        <button type="button" class="btn-test-action disabled" disabled aria-disabled="true">
          <i data-lucide="lock" style="width:15px;height:15px;"></i>
          <span>Assessment Closed</span>
        </button>
      `;
      linkRowHTML = `
        <span class="detail-val text-muted" style="font-size:13px;">
          <em>Assessment closed</em>
        </span>
      `;
    } else if (statusObj.status === "Live" && test.link) {
      let actionLabel = "Start Assessment";
      if (test.type === "Quiz") actionLabel = "Start Quiz";
      else if (test.type === "Assignment") actionLabel = "Submit Assignment";
      else if (test.type === "TEC") actionLabel = "Start TEC Evaluation";

      actionBtnHTML = `
        <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="btn-test-action live">
          <i data-lucide="external-link" style="width:15px;height:15px;"></i>
          <span>${actionLabel}</span>
        </a>
      `;
      linkRowHTML = `
        <span class="detail-val">
          <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="test-external-link">
            ${test.link}
          </a>
        </span>
      `;
    } else {
      actionBtnHTML = `
        <button type="button" class="btn-test-action upcoming" disabled aria-disabled="true">
          <i data-lucide="clock" style="width:15px;height:15px;"></i>
          <span>${statusObj.caption || "Upcoming Assessment"}</span>
        </button>
      `;
      linkRowHTML = `
        <span class="detail-val text-muted" style="font-size:13px;">
          <em>Link unlocks at exact scheduled start time (${start12})</em>
        </span>
      `;
    }

    if (typeBadge) {
      typeBadge.textContent = `${test.type.toUpperCase()} OVERVIEW`;
    }
    if (modalTitle) {
      modalTitle.textContent = test.title;
    }

    if (body) {
      body.innerHTML = `
        <div class="test-details-info-grid">
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="book-open" style="width:14px;height:14px;"></i> Course:</span>
            <span class="detail-val"><strong>${test.subject}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="layers" style="width:14px;height:14px;"></i> Assessment Type:</span>
            <span class="detail-val"><span class="test-type-badge ${test.type.toLowerCase()}-type">${test.type}</span></span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="calendar" style="width:14px;height:14px;"></i> Scheduled Date:</span>
            <span class="detail-val">${readableDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="clock" style="width:14px;height:14px;"></i> Time Slot:</span>
            <span class="detail-val">${start12} – ${end12}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="activity" style="width:14px;height:14px;"></i> Current Status:</span>
            <span class="detail-val">
              <span class="test-status-pill ${statusObj.badgeClass}">${statusObj.label}</span>
              ${statusObj.caption ? `<span class="status-caption">${statusObj.caption}</span>` : ''}
            </span>
          </div>
          <div class="detail-row link-row">
            <span class="detail-label"><i data-lucide="link-2" style="width:14px;height:14px;"></i> Portal Link:</span>
            ${linkRowHTML}
          </div>
        </div>

        <div class="test-details-action-bar" style="justify-content: flex-end;">
          <div class="student-action-wrap" style="width: 100%;">
            ${actionBtnHTML}
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

  // ----------------------------------------------------
  // MAIN TIMETABLE RENDERING (IDENTICAL STRUCTURE TO TEACHER)
  // ----------------------------------------------------
  renderTimetableView() {
    const container = document.getElementById("timetable-content");
    if (!container) return;

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

    // Official 3N Timetable Dataset from SSGMCE Academic Department
    const scheduleRows = [
      {
        day: "Monday",
        dayShort: "Mon",
        part1: [
          { subject: "DSS LAB(D)", faculty: "AGS", batch: "Batch D", isLab: true, colspan: 2, slotIndices: [0, 1] }
        ],
        part2: [
          { subject: "DBMS(A)/DSS(B)/OS(C)", faculty: "FIK/AGS/SNK", batch: "Batches A, B, C", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM-III", faculty: "", batch: "", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "DSS", faculty: "AGS", batch: "B4", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Tuesday",
        dayShort: "Tue",
        part1: [
          { subject: "OS", faculty: "SNK", batch: "B2", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "DSS", faculty: "AGS", batch: "B2", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DBMS(B)/DSS(C)/OS(D)", faculty: "FIK/AGS/SNK", batch: "Batches B, C, D", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM-III", faculty: "", batch: "", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "DBMS", faculty: "FIK", batch: "B4", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Wednesday",
        dayShort: "Wed",
        part1: [
          { subject: "OS", faculty: "SNK", batch: "B2", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "TOC", faculty: "SSM", batch: "B2", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DBMS(C)/OS (A)", faculty: "FIK/SNK", batch: "Batches C, A", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM-IV", faculty: "", batch: "", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "OE-III", faculty: "", batch: "Open Elective", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Thursday",
        dayShort: "Thu",
        part1: [
          { subject: "DBMS", faculty: "FIK", batch: "B2", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "TOC", faculty: "SSM", batch: "B2", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DBMS(D)/OS Lab(B)", faculty: "FIK/SNK", batch: "Batches D, B", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM-IV", faculty: "", batch: "", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "OE-III", faculty: "", batch: "Open Elective", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Friday",
        dayShort: "Fri",
        part1: [
          { subject: "DBMS", faculty: "FIK", batch: "B4", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "DSS", faculty: "AGS", batch: "B4", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "TOC", faculty: "SSM", batch: "B4", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "OS", faculty: "SNK", batch: "B4", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "DSS LAB(A)", faculty: "AGS", batch: "Batch A", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      }
    ];

    const saturdayRow = {
      day: "Saturday",
      dayShort: "Sat",
      part1: [
        { subject: "MDM Lab -I (OOP Lab)", faculty: "", batch: "M-I (A), M-I (B)", isLab: true, colspan: 2, slotIndices: [0, 1] }
      ],
      part2: [
        { subject: "MDM Lab -I (C(OOP Lab))", faculty: "", batch: "M-I (C), M-I (D)", isLab: true, colspan: 2, slotIndices: [2, 3] }
      ],
      part3: [
        { subject: "Off / Prep", faculty: "", batch: "", isFree: true, colspan: 2, slotIndices: [4, 5] }
      ]
    };

    // Compute upcoming assessments for alert strip
    const upcomingTests = (this.tests || []).filter(t => {
      if (!t.date) return false;
      if (!this.isTargetedForCurrentStudent(t)) return false;
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
               onclick="StudentTimetableApp.openTestDetails('${t.id}')"
               role="button"
               tabindex="0"
               aria-label="Upcoming Assessment: ${t.title}"
               onkeydown="if(event.key==='Enter') StudentTimetableApp.openTestDetails('${t.id}')">
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
              </div>
            </div>
            <div class="upcoming-item-right">
              <button type="button" class="btn-view-upcoming-detail" onclick="event.stopPropagation(); StudentTimetableApp.openTestDetails('${t.id}')">
                <span>View Details</span>
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
            <span style="font-size:11.5px; color:#92400E; font-weight:600;">Advance Notice</span>
          </div>
          <div class="upcoming-items-grid">
            ${alertCardsHTML}
          </div>
        </div>
      `;
    }

    // Helper: Render block cell (supports single slot or colspan 2 labs or scheduled tests)
    const renderBlockHTML = (block, dayName, isSat = false) => {
      // Find tests scheduled for this day & slot from backend data
      const slotTests = (this.tests || []).filter(t => {
        if (!t.date || !t.start) return false;
        if (!this.isTargetedForCurrentStudent(t)) return false;
        const [y, m, d] = t.date.split("-").map(Number);
        const testDateObj = new Date(y, m - 1, d, 12, 0, 0);
        const testDayName = testDateObj.toLocaleDateString("en-US", { weekday: "long" });
        if (testDayName.toLowerCase() !== dayName.toLowerCase()) return false;

        const testSlotIdx = this.getSlotIndexForTime(t.start, isSat);
        return block.slotIndices.includes(testSlotIdx);
      });

      if (slotTests.length > 0) {
        const testsHTML = slotTests.map(t => {
          const st = this.getTestStatus(t);
          const start12 = this.formatTime12Hour(t.start);
          const end12 = this.formatTime12Hour(t.end);

          return `
            <div class="test-card ${t.type.toLowerCase()}-card"
                 onclick="StudentTimetableApp.openTestDetails('${t.id}')"
                 role="button"
                 tabindex="0"
                 aria-label="Assessment: ${t.title}"
                 onkeydown="if(event.key==='Enter') StudentTimetableApp.openTestDetails('${t.id}')">
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
              <span class="off-prep-caption">No Class Scheduled</span>
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
                ${block.isLab ? 'LAB SESSION' : 'LECTURE'}
              </span>
            </div>
            
            <div class="class-subject-title" title="${block.subject}">
              ${block.subject}
            </div>

            <div class="class-card-meta">
              ${block.faculty ? `<span class="class-faculty-pill"><i data-lucide="user" style="width:10px;height:10px;display:inline;vertical-align:-1px;"></i> ${block.faculty}</span>` : ''}
              ${block.batch ? `<span class="class-batch-pill">${block.batch}</span>` : ''}
            </div>
          </div>
        </td>
      `;
    };

    // Helper: Render full schedule row
    const renderRowHTML = (row, isSat = false) => {
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

          <!-- Part 1: Slots 1 & 2 (11.00 - 01.00 / Sat: 8.30 - 10.30) -->
          ${row.part1.map(b => renderBlockHTML(b, row.day, isSat)).join('')}

          <!-- BREAK Column (15 Mins) -->
          <td class="timetable-break-cell body-break">
            <div class="break-vertical-text">
              <span>B</span><span>R</span><span>E</span><span>A</span><span>K</span>
            </div>
          </td>

          <!-- Part 2: Slots 3 & 4 (01.15 - 03.15 / Sat: 10.45 - 12.45) -->
          ${row.part2.map(b => renderBlockHTML(b, row.day, isSat)).join('')}

          <!-- RECESS Column (30 Mins) -->
          <td class="timetable-recess-cell body-recess">
            <div class="recess-vertical-text">
              <span>R</span><span>E</span><span>C</span><span>E</span><span>S</span><span>S</span>
            </div>
          </td>

          <!-- Part 3: Slots 5 & 6 (03.45 - 05.45 / Sat: Afternoon) -->
          ${row.part3.map(b => renderBlockHTML(b, row.day, isSat)).join('')}
        </tr>
      `;
    };

    const saturdayHeaderRowHTML = `
      <tr class="saturday-time-header-row" role="row">
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy); text-align:center;">Day</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">8.30 am - 9.30 am</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">9.30 am - 10.30 am</th>
        <th scope="col" class="timetable-break-cell header-break">15 Mins</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">10.45 am - 11.45 am</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">11.45 am - 12.45 pm</th>
        <th scope="col" class="timetable-recess-cell header-recess">30 Mins</th>
        <th scope="col" colspan="2" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy); text-align:center;">Afternoon (Off / Prep)</th>
      </tr>
    `;

    let sundayRowHTML = "";
    if (includeSunday) {
      const sundayRow = {
        day: "Sunday",
        dayShort: "Sun",
        part1: [{ subject: "Off / Prep", faculty: "", batch: "", isFree: true, colspan: 2, slotIndices: [0, 1] }],
        part2: [{ subject: "Off / Prep", faculty: "", batch: "", isFree: true, colspan: 2, slotIndices: [2, 3] }],
        part3: [{ subject: "Off / Prep", faculty: "", batch: "", isFree: true, colspan: 2, slotIndices: [4, 5] }]
      };
      sundayRowHTML = renderRowHTML(sundayRow, false);
    }

    container.innerHTML = `
      <div class="timetable-card">
        
        <!-- ==================== OFFICIAL SSGMCE HEADER ==================== -->
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
                <h2 class="official-main-heading">TIME-TABLE</h2>
              </div>
            </div>
            <div class="official-tt-submeta">
              <div class="submeta-left">
                <span>Class: <span class="class-tag">3N</span></span>
              </div>
              <div class="submeta-right">
                <span>w.e.f.: <span class="wef-tag">21/07/2026</span></span>
              </div>
            </div>
          </div>

          <!-- Schedule Controls Toolbar -->
          <div class="timetable-header-content" style="margin-top:14px; margin-bottom:12px;">
            <div class="schedule-meta">
              <span class="schedule-term-badge">
                <i data-lucide="graduation-cap" style="width:13px;height:13px;"></i>
                Academic Term: 2026-2027 • Autumn Semester
              </span>
            </div>

            <div class="schedule-controls">
              <div class="date-control">
                <label for="student-timetable-date-input" class="date-control-label">
                  <i data-lucide="calendar" style="width:14px;height:14px;"></i>
                  <span>View Date</span>
                </label>
                <input type="date"
                       id="student-timetable-date-input"
                       class="date-input"
                       value="${selectedDate}"
                       aria-label="Select date to highlight"
                       onchange="StudentTimetableApp.handleTimetableDateChange(this.value)">
              </div>

              <button class="today-button ${isToday ? 'active' : ''}"
                      type="button"
                      onclick="StudentTimetableApp.resetTimetableToToday()"
                      aria-label="Reset timetable view to today">
                <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                <span>Today</span>
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
                ${isToday ? "Today's Classes" : "Selected Date"}
              </span>
            </div>
            <div class="status-hint">
              ${isWeekend
                ? '<i data-lucide="info" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> <em>Weekend schedule highlighted below</em>'
                : `<i data-lucide="check" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Highlighting <strong>${currentDayName}</strong> in the schedule`
              }
            </div>
          </div>

          <!-- Advance Alert Strip for Upcoming Tests (e.g. In 2 Days, Tomorrow, Today) -->
          ${upcomingAlertStripHTML}
        </div>

        <!-- ==================== TIMETABLE GRID TABLE ==================== -->
        <div class="timetable-wrapper">
          <table class="timetable" role="table" aria-label="Student Weekly Timetable">
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
              ${scheduleRows.map(r => renderRowHTML(r, false)).join('')}
              ${saturdayHeaderRowHTML}
              ${renderRowHTML(saturdayRow, true)}
              ${sundayRowHTML}
            </tbody>
          </table>
        </div>

        <!-- ==================== OFFICIAL FOOTER & LEGEND ==================== -->
        <div class="official-legend-container">
          <div class="official-legend-grid">
            <div class="legend-box faculty-legend">
              <h5 class="legend-box-title"><i data-lucide="users" style="width:13px;height:13px;"></i> Faculty Key:</h5>
              <div class="legend-tag-list">
                <span class="faculty-tag"><strong>AGS:</strong> Prof. A. G. Sharma</span>
                <span class="faculty-tag"><strong>FIK:</strong> Prof. F. I. Khan</span>
                <span class="faculty-tag"><strong>SNK:</strong> Prof. S. N. Kale</span>
                <span class="faculty-tag"><strong>SSM:</strong> Prof. S. S. Mohod</span>
              </div>
            </div>
            <div class="legend-box subject-legend">
              <h5 class="legend-box-title"><i data-lucide="book-open" style="width:13px;height:13px;"></i> Subject Key:</h5>
              <div class="legend-tag-list">
                <span class="subject-tag"><strong>OS:</strong> Operating Systems</span>
                <span class="subject-tag"><strong>DSS:</strong> Decision Support Systems</span>
                <span class="subject-tag"><strong>DBMS:</strong> Database Management Systems</span>
                <span class="subject-tag"><strong>TOC:</strong> Theory of Computation</span>
                <span class="subject-tag"><strong>MDM:</strong> Multidisciplinary Minor (MDM-III, MDM-IV, OOP Lab)</span>
                <span class="subject-tag"><strong>OE:</strong> Open Elective III</span>
              </div>
            </div>
          </div>
          <div class="timetable-legend-bar" style="border-top:1px solid #E2E8F0; padding-top:10px;">
            <div class="legend-items">
              <span class="legend-title">Legend:</span>
              <div class="legend-item"><span class="legend-dot lecture-dot"></span><span>Theory Lecture (1 Hr)</span></div>
              <div class="legend-item"><span class="legend-dot lab-dot"></span><span>Practical Lab Session (2 Hrs)</span></div>
              <div class="legend-item"><span class="legend-dot test-dot"></span><span>Scheduled Test / Assessment</span></div>
              <div class="legend-item"><span class="legend-dot off-dot"></span><span>Break / Recess / Prep</span></div>
            </div>
          </div>
        </div>

      </div>
    `;

    this.initLucideIcons();
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

// Global expose
window.StudentTimetableApp = StudentTimetableApp;

// Auto initialize on DOM load or immediately if already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    StudentTimetableApp.init();
  });
} else {
  StudentTimetableApp.init();
}
