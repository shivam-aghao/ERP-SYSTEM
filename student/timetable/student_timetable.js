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

  init() {
    this.loadStudentSession();
    this.bindEvents();
    this.renderHeaderProfile();
    // 1. Instant local render (0ms - zero delay)
    this.loadCachedTests();
    this.renderTimetableView();
    this.initLucideIcons();

    // 2. Background async refresh (Stale-While-Revalidate)
    Promise.allSettled([
      this.loadTimetable(),
      this.loadTests()
    ]).then(() => {
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

    // Default student context from ERP model
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

    // 2. Backend REST API
    try {
      let classCode = (this.studentSession && (this.studentSession.className || this.studentSession.class_name || this.studentSession.classCode)) || '2R1';
      const studentCode = (this.studentSession && (this.studentSession.studentCode || this.studentSession.student_code || this.studentSession.id)) || '307001';

      const params = new URLSearchParams();
      if (classCode) params.append('class_code', classCode);
      if (studentCode) params.append('student_code', studentCode);

      const url = `${this.getApiBase()}/timetable/tests?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          apiTests = json.data.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
        }
      }
    } catch (e) {
      console.warn("Could not fetch tests from backend API:", e);
    }

    // 3. Direct Supabase Client if API returned empty
    if (apiTests.length === 0) {
      try {
        const getClient = window.getSupabaseClient || (typeof getSupabaseClient === 'function' ? getSupabaseClient : null);
        const client = getClient ? await getClient() : (window.supabaseClient || null);
        if (client) {
          const { data, error } = await client
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
        }
      } catch (sbErr) {
        console.warn("[StudentTimetable] Direct Supabase fetch note:", sbErr);
      }
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
    const toggleBtn = document.getElementById("mobileMenuToggle");
    const sidebar = document.getElementById("dashboardSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("drawer-open");
        if (isOpen) {
          sidebar.classList.remove("drawer-open");
          if (backdrop) backdrop.classList.remove("active");
          document.body.style.overflow = "";
        } else {
          sidebar.classList.add("drawer-open");
          if (backdrop) backdrop.classList.add("active");
          document.body.style.overflow = "hidden";
        }
      });

      if (backdrop) {
        backdrop.addEventListener("click", () => {
          sidebar.classList.remove("drawer-open");
          backdrop.classList.remove("active");
          document.body.style.overflow = "";
        });
      }
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
    const str = timeStr.trim();
    const match = str.match(/^(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meridiem = match[3] ? match[3].toUpperCase() : null;
      if (meridiem === "PM" && h < 12) h += 12;
      else if (meridiem === "AM" && h === 12) h = 0;
      else if (!meridiem && h >= 1 && h <= 6) h += 12; // Standard college academic afternoon (1:00 - 6:59 -> PM)
      return h * 60 + m;
    }
    const parts = str.split(":");
    let hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    if (hours >= 1 && hours <= 6) hours += 12;
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

  getSlotIndexForTime(timeStr) {
    // 0: 09:00 - 10:30 (center ~ 585 mins)
    // 1: 11:00 - 12:30 (center ~ 705 mins)
    // 2: 13:30 - 15:00 (center ~ 855 mins)
    // 3: 15:30 - 17:00 (center ~ 975 mins)
    const mins = this.timeToMinutes(timeStr);
    if (mins < 645) return 0;       // < 10:45 AM -> Slot 1
    if (mins < 780) return 1;       // < 01:00 PM -> Slot 2
    if (mins < 915) return 2;       // < 03:15 PM -> Slot 3
    return 3;                       // >= 03:15 PM -> Slot 4
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
    if (statusObj.status === "Ended") {
      actionBtnHTML = `
        <button type="button" class="btn-test-action disabled" disabled aria-disabled="true">
          <i data-lucide="lock" style="width:15px;height:15px;"></i>
          <span>Assessment Closed</span>
        </button>
      `;
    } else if (statusObj.status === "Live") {
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
    } else {
      actionBtnHTML = `
        <button type="button" class="btn-test-action upcoming" disabled aria-disabled="true">
          <i data-lucide="clock" style="width:15px;height:15px;"></i>
          <span>${statusObj.caption || "Upcoming Assessment"}</span>
        </button>
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
            <span class="detail-val">
              <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="test-external-link">
                ${test.link}
              </a>
            </span>
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

    const timeSlots = [
      { range: "09:00 – 10:30", period: "AM", label: "Slot 1" },
      { range: "11:00 – 12:30", period: "PM", label: "Slot 2" },
      { range: "01:30 – 03:00", period: "PM", label: "Slot 3" },
      { range: "03:30 – 05:00", period: "PM", label: "Slot 4" }
    ];

    const term = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getCurrentAcademicTerm()
      : { academicYear: "2026-2027", semesterType: "Odd" };

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

    // Regular schedule data (from real backend database if available)
    const daysList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    let timetableData = [];

    if (this.timetableEntries && this.timetableEntries.length > 0) {
      timetableData = daysList.map(dayName => {
        const dayRows = this.timetableEntries.filter(
          e => e.day && e.day.toLowerCase() === dayName.toLowerCase()
        ).sort((a, b) => {
          const numA = parseInt((a.period_num || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt((b.period_num || '').replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });

        const slots = [];
        for (let sIdx = 0; sIdx < 4; sIdx++) {
          const entry = dayRows[sIdx];
          if (entry && entry.course_name) {
            const loc = entry.venue ? ` (${entry.venue})` : '';
            slots.push(`${entry.course_name}${loc}`);
          } else {
            slots.push("Free Slot");
          }
        }
        return { day: dayName, slots };
      });
    } else {
      timetableData = daysOfWeek.map(day => ({
        day: day,
        slots: ["Free Slot", "Free Slot", "Free Slot", "Free Slot"]
      }));
    }

    // Helper: Parse slot text into lecture/lab details
    const parseSlotInfo = (slotText) => {
      if (!slotText || slotText === "Free Slot") {
        return { isFree: true };
      }

      const isLab = slotText.toLowerCase().includes("lab");
      let subject = slotText;
      let location = "";

      const parenMatch = slotText.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        subject = parenMatch[1].trim();
        location = parenMatch[2].trim();
      }

      return {
        isFree: false,
        isLab,
        subject,
        location,
        typeLabel: isLab ? "LAB SESSION" : "LECTURE"
      };
    };

    container.innerHTML = `
      <div class="timetable-card">
        
        <!-- ==================== HEADER & TOOLBAR ==================== -->
        <div class="timetable-header">
          <div class="timetable-header-content">
            <div class="schedule-meta">
              <span class="schedule-term-badge">
                <i data-lucide="graduation-cap" style="width:13px;height:13px;"></i>
                Academic Term: ${term.academicYear} • ${term.semesterType} Semester
              </span>
              <h3 class="schedule-main-title">Weekly Lecture &amp; Lab Schedule</h3>
              <p class="schedule-subtitle">Department of Computer Science &amp; Engineering • Autonomous Curriculum</p>
            </div>

            <!-- Schedule Controls (Student view: View Date, Today, Print. NO Test Schedule Button) -->
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
                ? '<i data-lucide="info" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> <em>Weekend — regular weekday instruction matrix shown below</em>'
                : `<i data-lucide="check" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Highlighting <strong>${currentDayName}</strong> in the schedule`
              }
            </div>
          </div>
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
                ${timeSlots.map((slot) => `
                  <th class="timetable-header-cell time-slot-header" scope="col">
                    <div class="th-time-slot">
                      <span class="th-slot-num">${slot.label}</span>
                      <div class="th-time-range">
                        <i data-lucide="clock" style="width:12px;height:12px;"></i>
                        <span>${slot.range}</span>
                        <span class="th-ampm">${slot.period}</span>
                      </div>
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${timetableData.map(row => {
                const isHighlightRow = (row.day.toLowerCase() === currentDayName.toLowerCase());
                return `
                <tr class="schedule-row ${isHighlightRow ? 'active-day-row' : ''}" role="row">
                  
                  <!-- Day Cell -->
                  <td class="day-cell ${isHighlightRow ? 'active-day-cell' : ''}" scope="row">
                    <div class="day-cell-inner">
                      <span class="day-label">${row.day.toUpperCase()}</span>
                      ${isHighlightRow ? `
                        <span class="today-badge ${isToday ? 'today-badge-current' : 'today-badge-active'}">
                          ${isToday ? 'TODAY' : 'ACTIVE'}
                        </span>
                      ` : ''}
                    </div>
                  </td>

                  <!-- Subject Slots -->
                  ${row.slots.map((slotText, slotIdx) => {
                    const parsed = parseSlotInfo(slotText);

                    // Find tests scheduled for this day & slot from backend data
                    const slotTests = this.tests.filter(t => {
                      if (!t.date || !t.start) return false;
                      const [y, m, d] = t.date.split("-").map(Number);
                      // Use noon local time to avoid midnight timezone day rollback
                      const testDateObj = new Date(y, m - 1, d, 12, 0, 0);
                      const testDayName = testDateObj.toLocaleDateString("en-US", { weekday: "long" });
                      if (testDayName.toLowerCase() !== row.day.toLowerCase()) return false;

                      // Associate test with slot strictly by its scheduled time slot
                      const timeSlotMatch = (this.getSlotIndexForTime(t.start) === slotIdx);
                      return timeSlotMatch;
                    });

                    // Build regular class card HTML if not free
                    let regularClassHTML = "";
                    if (!parsed.isFree) {
                      regularClassHTML = `
                        <div class="class-card ${parsed.isLab ? 'class-lab' : 'class-lecture'} ${isHighlightRow ? 'class-card-highlighted' : ''}">
                          <div class="class-card-top">
                            <span class="class-type ${parsed.isLab ? 'type-lab' : 'type-lecture'}">
                              <i data-lucide="${parsed.isLab ? 'flask-conical' : 'book-open'}" style="width:11px;height:11px;"></i>
                              ${parsed.typeLabel}
                            </span>
                          </div>
                          
                          <div class="class-title" title="${parsed.subject}">
                            ${parsed.subject}
                          </div>

                          ${parsed.location ? `
                            <div class="class-location">
                              <i data-lucide="map-pin" style="width:12px;height:12px;"></i>
                              <span>${parsed.location}</span>
                            </div>
                          ` : ''}
                        </div>
                      `;
                    }

                    // Build scheduled test cards HTML (student can click to view details)
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

                    // If test(s) are scheduled for this slot, show test card (replaces regular lecture)
                    if (slotTests.length > 0) {
                      return `
                        <td class="schedule-cell">
                          <div class="cell-stack-container">
                            ${testsHTML}
                          </div>
                        </td>
                      `;
                    }

                    // Free slot without any test
                    if (parsed.isFree) {
                      return `
                        <td class="schedule-cell off-prep-cell">
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

                    return `
                      <td class="schedule-cell">
                        <div class="cell-stack-container">
                          ${regularClassHTML}
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

        <!-- ==================== LEGEND & FOOTNOTE ==================== -->
        <div class="timetable-legend-bar">
          <div class="legend-items">
            <span class="legend-title">Legend:</span>
            <div class="legend-item">
              <span class="legend-dot lecture-dot"></span>
              <span>Theory Lecture</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot lab-dot"></span>
              <span>Practical Lab Session</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot test-dot"></span>
              <span>Scheduled Test / Assessment</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot off-dot"></span>
              <span>Off / Prep Period</span>
            </div>
          </div>
          <div class="legend-note">
            <i data-lucide="clock-4" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
            <span>All sessions are 90 minutes. 30-minute recess between slots 2 &amp; 3. Tests are scheduled by course faculty.</span>
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

// Auto initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  StudentTimetableApp.init();
});
