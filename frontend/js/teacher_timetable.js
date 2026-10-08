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
    // 1. Instant local render (0ms response time, no blank loading screen)
    this.loadCachedTests();
    this.renderTimetableView();
    this.initLucideIcons();

    // 2. Background async refresh (Stale-While-Revalidate)
    Promise.allSettled([
      this.loadTests(),
      this.loadTeacherSubjects(),
      this.checkBackendConnection()
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
        }
      }
    } catch (e) {
      console.warn("Could not dynamically load teacher subjects:", e);
    }
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
      select.appendChild(opt);
    });
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
          this.tests = json.data.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
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

  renderHeaderProfile() {
    const activeEmpCode = (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.getActiveTeacherEmpCode === 'function')
      ? TeacherERPData.getActiveTeacherEmpCode()
      : 'EMP-CSE-1001';

    const facList = (typeof TeacherERPData !== 'undefined' && TeacherERPData.facultyList)
      ? TeacherERPData.facultyList
      : [];

    const f = facList.find(fac => fac.empCode === activeEmpCode) || {
      name: "Dr. J. M. Patil",
      title: "Professor & Head",
      departmentCode: "CSE",
      empCode: "EMP-CSE-1001",
      initials: "JP"
    };

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
      avatarElem.innerHTML = `<span>${(f.initials || f.name.split(' ').map(w=>w[0]).join('').slice(0,2)).toUpperCase()}</span>`;
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
    const str = timeStr.trim();
    // Check if format has AM/PM
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

  getSlotIndexForTime(timeStr) {
    // Official SSGMCE 6 Periods from PDF:
    // Period 1: 11:00 - 12:00 PM (mins: 660 - 720)
    // Period 2: 12:00 - 01:00 PM (mins: 720 - 780)
    // Period 3: 01:15 - 02:15 PM (mins: 795 - 855)
    // Period 4: 02:15 - 03:15 PM (mins: 855 - 915)
    // Period 5: 03:45 - 04:45 PM (mins: 945 - 1005)
    // Period 6: 04:45 - 05:45 PM (mins: 1005 - 1065)
    const mins = this.timeToMinutes(timeStr);
    if (mins < 720) return 0;       // < 12:00 PM -> Slot 1
    if (mins < 795) return 1;       // < 01:15 PM -> Slot 2
    if (mins < 855) return 2;       // < 02:15 PM -> Slot 3
    if (mins < 945) return 3;       // < 03:45 PM -> Slot 4
    if (mins < 1005) return 4;      // < 04:45 PM -> Slot 5
    return 5;                       // >= 04:45 PM -> Slot 6
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
    const test = this.tests.find(t => t.id === testId);
    if (!test) return;

    this.closeTestDetailsModal();

    const modal = document.getElementById("testFormModal");
    const title = document.getElementById("testModalTitle");
    const badge = document.getElementById("testModalBadge");
    const btnText = document.getElementById("btnSubmitTestText");

    document.getElementById("testFormId").value = test.id;
    document.getElementById("testTypeSelect").value = test.type;
    document.getElementById("testSubjectSelect").value = test.subject;
    document.getElementById("testTitleInput").value = test.title;
    document.getElementById("testDateInput").value = test.date;
    document.getElementById("testStartTimeInput").value = test.start;
    document.getElementById("testEndTimeInput").value = test.end;
    document.getElementById("testLinkInput").value = test.link;

    if (test.class_code && document.getElementById("testClassSelect")) {
      document.getElementById("testClassSelect").value = test.class_code;
    }

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
    e.preventDefault();

    const id = document.getElementById("testFormId").value.trim();
    const type = document.getElementById("testTypeSelect").value;
    const subject = document.getElementById("testSubjectSelect").value;
    const classElem = document.getElementById("testClassSelect");
    const classCode = classElem ? classElem.value : "2R1";
    const title = document.getElementById("testTitleInput").value.trim();
    const date = document.getElementById("testDateInput").value;
    const start = document.getElementById("testStartTimeInput").value;
    const end = document.getElementById("testEndTimeInput").value;
    const link = document.getElementById("testLinkInput").value.trim();

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

    // Get current teacher identity if available
    let teacherId = "FAC-CSE-1001";
    try {
      const storedUser = localStorage.getItem("ssgmce_user") || localStorage.getItem("ssgmce_erp_session");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        teacherId = u.emp_code || u.id || teacherId;
      }
    } catch (_) {}

    const payload = {
      type,
      subject,
      title,
      date,
      start_time: start,
      end_time: end,
      link,
      class_code: classCode || "2R1",
      teacher_id: teacherId
    };

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

      const typeLabel = type === "Assignment" ? "Assignment" : (type === "TEC" ? "TEC" : (type === "Quiz" ? "Quiz" : (type || "Test")));
      const successMsg = id ? `${typeLabel} updated successfully` : `${typeLabel} scheduled successfully`;

      if (res && res.ok) {
        await this.loadTests();
        this.saveTests();
        this.showToast(successMsg, "success");
        this.closeTestFormModal();
        this.renderTimetableView();
      } else {
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
        this.saveTests();
        this.showToast(successMsg, "success");
        this.closeTestFormModal();
        this.renderTimetableView();
      }
    } catch (err) {
      console.error("Backend save error:", err);
      const typeLabel = type === "Assignment" ? "Assignment" : (type === "TEC" ? "TEC" : (type === "Quiz" ? "Quiz" : (type || "Test")));
      const successMsg = id ? `${typeLabel} updated successfully` : `${typeLabel} scheduled successfully`;
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
    const test = this.tests.find(t => t.id === testId);
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

    if (body) {
      body.innerHTML = `
        <div class="test-details-grid">
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="layers" style="width:14px;height:14px;"></i> Subject:</span>
            <span class="detail-val"><strong>${test.subject}</strong></span>
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
            <button type="button" class="btn-test-edit" onclick="TeacherTimetableApp.openEditTestModal('${test.id}')" title="Edit this test">
              <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-test-delete" onclick="TeacherTimetableApp.promptDeleteTest('${test.id}')" title="Delete this test">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
              <span>Delete</span>
            </button>
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
    const test = this.tests.find(t => t.id === testId);
    if (!test) return;

    this.activeDeleteTestId = testId;
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
    const modal = document.getElementById("testDeleteConfirmModal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  },

  async confirmExecuteDelete() {
    if (!this.activeDeleteTestId) return;

    const testId = this.activeDeleteTestId;

    try {
      await fetch(`${this.getApiBase()}/timetable/tests/${encodeURIComponent(testId)}`, {
        method: "DELETE",
        headers: this.getAuthHeaders()
      });
      this.showToast("Assessment deleted from database", "success");
    } catch (err) {
      console.warn("Backend delete notice:", err);
    }

    const idx = this.tests.findIndex(t => t.id === testId);
    if (idx !== -1) {
      this.tests.splice(idx, 1);
      this.saveTests();
    }

    this.closeDeleteConfirmModal();
    this.closeTestDetailsModal();
    this.renderTimetableView();
  },

  // ----------------------------------------------------
  // MAIN TIMETABLE RENDERING
  // ----------------------------------------------------
  renderTimetableView() {
    const container = document.getElementById("timetable-content");
    if (!container) return;

    // Official SSGMCE 6 Periods from PDF
    const timeSlots = [
      { range: "11:00 – 12:00", period: "PM", label: "Slot 1" },
      { range: "12:00 – 01:00", period: "PM", label: "Slot 2" },
      { range: "01:15 – 02:15", period: "PM", label: "Slot 3" },
      { range: "02:15 – 03:15", period: "PM", label: "Slot 4" },
      { range: "03:45 – 04:45", period: "PM", label: "Slot 5" },
      { range: "04:45 – 05:45", period: "PM", label: "Slot 6" }
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

    // Exact original schedule data preserved
    const timetableData = (typeof TeacherERPData !== 'undefined' && TeacherERPData.timetable && TeacherERPData.timetable.length > 0)
      ? TeacherERPData.timetable
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => ({
        day: day,
        slots: ["Free Slot", "Free Slot", "Free Slot", "Free Slot"]
      }));

    // Helper: Parse slot string into title, location, and type
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
        
        <!-- Faculty Identity & Schedule Switcher -->
        <div class="timetable-faculty-strip" style="background: linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%); color: #fff; padding: 12px 18px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 6px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px;">
              ${(currentFacObj.name.split('. ').pop().charAt(0)) || 'F'}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <strong style="font-size: 15px;">${currentFacObj.name}</strong>
                <span style="background: #10B981; color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 4px;">${currentFacObj.empCode}</span>
                <span style="background: rgba(255,255,255,0.2); font-size: 11px; padding: 1px 6px; border-radius: 4px;">${currentFacObj.title}</span>
              </div>
              <div style="font-size: 12px; color: #BAE6FD; margin-top: 2px;">
                Personal Teaching Schedule &bull; Official Load: <strong>${currentFacObj.totalLoad} Hours</strong>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <label for="faculty-timetable-selector" style="font-size: 12px; color: #E0F2FE;">Faculty:</label>
            <select id="faculty-timetable-selector" 
                    style="padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4); background: #ffffff; color: #0B1F3A; font-size: 12px; font-weight: 600; cursor: pointer;"
                    onchange="TeacherTimetableApp.switchFaculty(this.value)">
              ${facList.map(f => `
                <option value="${f.empCode}" ${f.empCode === activeEmpCode ? 'selected' : ''}>
                  ${f.name} (${f.empCode}) — ${f.totalLoad}h
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- ==================== HEADER & TOOLBAR ==================== -->
        <div class="timetable-header">
          <div class="timetable-header-content">
            <div class="schedule-meta">
              <span class="schedule-term-badge">
                <i data-lucide="graduation-cap" style="width:13px;height:13px;"></i>
                Academic Term: ${term.academicYear} • ${term.semesterType} Semester
              </span>
              <h3 class="schedule-main-title">Personal Lecture &amp; Lab Schedule</h3>
              <p class="schedule-subtitle">Department of Computer Science &amp; Engineering • Autonomous Curriculum</p>
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
                ? '<i data-lucide="info" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> <em>Weekend — regular weekday instruction matrix shown below</em>'
                : `<i data-lucide="check" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Highlighting <strong>${currentDayName}</strong> in the schedule`
              }
            </div>
          </div>
        </div>

        <!-- ==================== TIMETABLE GRID TABLE ==================== -->
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
                ${timeSlots.map((slot, idx) => `
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

                    // Find tests scheduled for this day & slot
                    const slotTests = this.tests.filter(t => {
                      if (!t.date || !t.start) return false;
                      const [y, m, d] = t.date.split("-").map(Number);
                      const testDayName = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
                      if (testDayName.toLowerCase() !== row.day.toLowerCase()) return false;
                      return this.getSlotIndexForTime(t.start) === slotIdx;
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

                    // Build test cards HTML
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

                    // If regular class is free and no test exists, render Off/Prep
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
            <span class="legend-item">
              <span class="legend-dot lecture-dot"></span>
              <span>Theory Lecture</span>
            </span>
            <span class="legend-item">
              <span class="legend-dot lab-dot"></span>
              <span>Laboratory Session</span>
            </span>
            <span class="legend-item">
              <span class="legend-dot test-dot"></span>
              <span>Assessment / Test (Amber)</span>
            </span>
            <span class="legend-item">
              <span class="legend-dot off-dot"></span>
              <span>Off / Prep Period</span>
            </span>
            <span class="legend-item">
              <span class="legend-dot active-dot"></span>
              <span>Active Date Highlight</span>
            </span>
          </div>
          <div class="legend-right">
            <span>Break: 1:00 – 1:15 PM • Recess: 3:15 – 3:45 PM • Official Load: ${currentFacObj.totalLoad}h</span>
          </div>
        </div>

        <!-- Allotted Teaching Load Breakdown from PDF -->
        ${(teachingLoad && teachingLoad.length > 0) ? `
        <div style="padding: 12px 18px; background: #FFFFFF; border-top: 1px solid #E2E8F0; border-radius: 0 0 8px 8px;">
          <h5 style="margin: 0 0 6px 0; font-size: 12px; color: #0B1F3A; font-weight: 700; text-transform: uppercase;">
            Allotted Teaching Load Summary (From Official PDF)
          </h5>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${teachingLoad.map(item => `
              <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; padding: 4px 10px; font-size: 11.5px; display: flex; gap: 6px; align-items: center;">
                <span style="font-weight: 700; color: #0B5CAD;">Sem ${item.semester || 'V'}:</span>
                <span style="font-weight: 600; color: #1E293B;">${item.abbr || item.code}</span>
                <span style="color: #64748B;">(Th: ${item.theory || 0}h | Pr: ${item.practical || 0}h)</span>
                ${item.total ? `<span style="background: #E2E8F0; padding: 1px 5px; border-radius: 4px; font-weight: 600; color: #334155;">Tot: ${item.total}h</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

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

// Auto initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  TeacherTimetableApp.init();
});
