/* ========================================================
   SSGMCE TEACHER ERP — TEST & ASSESSMENT SCHEDULER MODULE
   teacher-test-schedule.js / teacher_test_schedule.js
   Shri Sant Gajanan Maharaj College of Engineering, Shegaon
   Standalone Reusable Module for Test, Quiz, Assignment & TEC Scheduling
   ======================================================== */

const TeacherTestScheduler = {
  tests: [],
  teacherSubjects: [],
  activeDeleteTestId: null,
  isInitialized: false,
  currentFilterType: 'all',
  currentFilterStatus: 'all',
  currentSearchQuery: '',

  // ----------------------------------------------------
  // 1. INITIALIZATION & SETUP
  // ----------------------------------------------------
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.loadCachedTests();
    this.bindGlobalEvents();
    this.bindPageUIEvents();
    this.ensureModalsExist();

    // 1. Instant local render of dashboard table if on dedicated page
    this.renderAssessmentsDashboard();

    // 2. Stale-While-Revalidate background fetch
    Promise.allSettled([
      this.loadTests(),
      this.loadTeacherSubjects()
    ]).then(() => {
      this.renderAssessmentsDashboard();
      this.dispatchUpdatedEvent();
    });

    // 3. Listen for cross-tab storage and update events
    window.addEventListener('storage', (e) => {
      if (e.key === 'ssgmce_scheduled_tests') {
        this.loadCachedTests();
        this.renderAssessmentsDashboard();
      }
    });

    window.addEventListener('tests:updated', () => {
      this.renderAssessmentsDashboard();
    });
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
  // 2. LOCAL CACHE & SUPABASE PERSISTENCE
  // ----------------------------------------------------
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

  saveTests() {
    try {
      localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
      this.dispatchUpdatedEvent();
    } catch (_) {}
  },

  dispatchUpdatedEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tests:updated', { detail: { tests: this.tests } }));
    }
  },

  async loadTests() {
    // 1. REST API
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
          this.dispatchUpdatedEvent();
          return this.tests;
        }
      }
    } catch (e) {
      console.warn("[TeacherTestScheduler] API fetch note:", e);
    }

    // 2. Direct Supabase Client fallback
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
          this.dispatchUpdatedEvent();
          return this.tests;
        }
      }
    } catch (_) {}

    this.loadCachedTests();
    return this.tests;
  },

  // ----------------------------------------------------
  // 3. DYNAMIC TEACHER SUBJECTS
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
      console.warn("[TeacherTestScheduler] Could not load teacher subjects:", e);
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
  // 4. TIME & SLOT MAPPINGS
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
      else if (!meridiem && h >= 1 && h <= 6) h += 12;
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
  // 5. MODALS & CRUD OPERATIONS
  // ----------------------------------------------------
  openAddTestModal(defaultDate = null) {
    this.ensureModalsExist();
    const modal = document.getElementById("testFormModal");
    const title = document.getElementById("testModalTitle");
    const badge = document.getElementById("testModalBadge");
    const btnText = document.getElementById("btnSubmitTestText");
    const form = document.getElementById("testScheduleForm");

    if (form) form.reset();
    const idElem = document.getElementById("testFormId");
    if (idElem) idElem.value = "";

    if (this.teacherSubjects && this.teacherSubjects.length > 0) {
      this.populateSubjectSelect(this.teacherSubjects);
    } else {
      this.loadTeacherSubjects();
    }

    const targetDate = defaultDate || (
      (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0]
    );

    const dateInput = document.getElementById("testDateInput");
    const startInput = document.getElementById("testStartTimeInput");
    const endInput = document.getElementById("testEndTimeInput");

    if (dateInput) dateInput.value = targetDate;
    if (startInput) startInput.value = "11:15";
    if (endInput) endInput.value = "12:15";

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
    this.ensureModalsExist();
    const test = this.tests.find(t => t.id === testId);
    if (!test) return;

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

    // Validations
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

    try {
      new URL(link);
    } catch (_) {
      this.showToast("Please enter a valid URL (including https://).", "error");
      return;
    }

    const submitBtn = document.getElementById("btnSubmitTestForm");
    const submitText = document.getElementById("btnSubmitTestText");
    const originalText = submitText ? submitText.textContent : "Save Test";

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = "Scheduling...";

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

      this.saveTests();
      this.showToast(successMsg, "success");
      this.closeTestFormModal();
      this.renderAssessmentsDashboard();
      this.dispatchUpdatedEvent();
    } catch (err) {
      console.warn("[TeacherTestScheduler] Local fallback save:", err);
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
      this.renderAssessmentsDashboard();
      this.dispatchUpdatedEvent();
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = originalText;
    }
  },

  openTestDetails(testId) {
    this.ensureModalsExist();
    const test = this.tests.find(t => t.id === testId);
    if (!test) return;

    const modal = document.getElementById("testDetailsModal");
    const typeBadge = document.getElementById("detailsModalTypeBadge");
    const modalTitle = document.getElementById("detailsModalTitle");
    const body = document.getElementById("testDetailsBody");

    const statusObj = this.getTestStatus(test);
    const start12 = this.formatTime12Hour(test.start);
    const end12 = this.formatTime12Hour(test.end);

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
            <button type="button" class="btn-test-edit" onclick="TeacherTestScheduler.openEditTestModal('${test.id}')" title="Edit this test">
              <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-test-delete" onclick="TeacherTestScheduler.promptDeleteTest('${test.id}')" title="Delete this test">
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
    this.ensureModalsExist();
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
      this.showToast("Assessment deleted successfully", "success");
    } catch (err) {
      console.warn("[TeacherTestScheduler] Backend delete note:", err);
    }

    const idx = this.tests.findIndex(t => t.id === testId);
    if (idx !== -1) {
      this.tests.splice(idx, 1);
      this.saveTests();
    }

    this.closeDeleteConfirmModal();
    this.closeTestDetailsModal();
    this.renderAssessmentsDashboard();
    this.dispatchUpdatedEvent();
  },

  // ----------------------------------------------------
  // 6. DEDICATED ASSESSMENTS DASHBOARD & TABLE RENDERER
  // ----------------------------------------------------
  setFilterType(type) {
    this.currentFilterType = type || 'all';
    this.renderAssessmentsDashboard();
  },

  setFilterStatus(status) {
    this.currentFilterStatus = status || 'all';
    this.renderAssessmentsDashboard();
  },

  setSearchQuery(query) {
    this.currentSearchQuery = (query || '').toLowerCase().trim();
    this.renderAssessmentsDashboard();
  },

  renderAssessmentsDashboard(containerId = "assessmentsTableContainer") {
    const container = document.getElementById(containerId);

    // Update Stats counters if DOM elements exist
    const totalCount = this.tests.length;
    const liveCount = this.tests.filter(t => this.getTestStatus(t).status === 'Live').length;
    const upcomingCount = this.tests.filter(t => this.getTestStatus(t).status === 'Upcoming').length;
    const quizCount = this.tests.filter(t => (t.type || '').toLowerCase() === 'quiz').length;
    const assignmentCount = this.tests.filter(t => (t.type || '').toLowerCase() === 'assignment').length;
    const tecCount = this.tests.filter(t => (t.type || '').toLowerCase() === 'tec').length;

    const elTotal = document.getElementById("stat-total-tests");
    const elLive = document.getElementById("stat-live-tests");
    const elUpcoming = document.getElementById("stat-upcoming-tests");
    const elQuizzes = document.getElementById("stat-quizzes-count");
    const elAssignments = document.getElementById("stat-assignments-count");
    const elTEC = document.getElementById("stat-tec-count");

    if (elTotal) elTotal.textContent = totalCount;
    if (elLive) elLive.textContent = liveCount;
    if (elUpcoming) elUpcoming.textContent = upcomingCount;
    if (elQuizzes) elQuizzes.textContent = quizCount;
    if (elAssignments) elAssignments.textContent = assignmentCount;
    if (elTEC) elTEC.textContent = tecCount;

    if (!container) return;

    // Filter tests
    let filtered = [...this.tests];

    if (this.currentFilterType && this.currentFilterType !== 'all') {
      filtered = filtered.filter(t => (t.type || '').toLowerCase() === this.currentFilterType.toLowerCase());
    }

    if (this.currentFilterStatus && this.currentFilterStatus !== 'all') {
      filtered = filtered.filter(t => {
        const st = this.getTestStatus(t).status;
        return st.toLowerCase() === this.currentFilterStatus.toLowerCase();
      });
    }

    if (this.currentSearchQuery) {
      filtered = filtered.filter(t => {
        const title = (t.title || '').toLowerCase();
        const subject = (t.subject || '').toLowerCase();
        const type = (t.type || '').toLowerCase();
        const classCode = (t.class_code || '').toLowerCase();
        return title.includes(this.currentSearchQuery) ||
               subject.includes(this.currentSearchQuery) ||
               type.includes(this.currentSearchQuery) ||
               classCode.includes(this.currentSearchQuery);
      });
    }

    // Sort by date ascending, then time
    filtered.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.start || '').localeCompare(b.start || '');
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-assessments-state">
          <div class="empty-icon-wrap">
            <i data-lucide="calendar-x" style="width:32px;height:32px;"></i>
          </div>
          <h4 class="empty-title">No Assessments Found</h4>
          <p class="empty-desc">
            ${this.currentSearchQuery || this.currentFilterType !== 'all' || this.currentFilterStatus !== 'all'
              ? 'No scheduled assessments match your active filter criteria. Try adjusting your search or filter.'
              : 'You have not scheduled any assessments yet. Click the button below to schedule your first quiz, test, or assignment.'}
          </p>
          <button type="button" class="btn-schedule-new-hero" onclick="TeacherTestScheduler.openAddTestModal()">
            <i data-lucide="plus-circle" style="width:16px;height:16px;"></i>
            <span>Schedule New Assessment</span>
          </button>
        </div>
      `;
      this.initLucideIcons();
      return;
    }

    container.innerHTML = `
      <div class="assessments-table-responsive">
        <table class="assessments-data-table" role="table">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Title &amp; Class</th>
              <th scope="col">Subject Course</th>
              <th scope="col">Date &amp; Time Slot</th>
              <th scope="col">Status</th>
              <th scope="col" style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(t => {
              const st = this.getTestStatus(t);
              const start12 = this.formatTime12Hour(t.start);
              const end12 = this.formatTime12Hour(t.end);
              const slotIdx = this.getSlotIndexForTime(t.start);
              const slotLabel = `Slot ${slotIdx + 1}`;

              let readableDate = t.date;
              try {
                const [y, m, d] = t.date.split("-");
                const dt = new Date(y, m - 1, d);
                readableDate = dt.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                });
              } catch (_) {}

              return `
                <tr class="assessment-row ${st.status.toLowerCase()}-row">
                  <td>
                    <span class="test-type-badge ${t.type.toLowerCase()}-type">
                      <i data-lucide="file-text" style="width:11px;height:11px;"></i>
                      ${t.type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div class="assess-title-wrap">
                      <a href="javascript:void(0)" onclick="TeacherTestScheduler.openTestDetails('${t.id}')" class="assess-item-title" title="${t.title}">
                        ${t.title}
                      </a>
                      <span class="assess-class-tag">${t.class_code || 'CSE 2R1'}</span>
                    </div>
                  </td>
                  <td>
                    <div class="assess-subject-text">
                      <i data-lucide="book-open" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
                      ${t.subject}
                    </div>
                  </td>
                  <td>
                    <div class="assess-datetime-cell">
                      <div class="assess-date-val">
                        <i data-lucide="calendar" style="width:12px;height:12px;"></i>
                        <span>${readableDate}</span>
                      </div>
                      <div class="assess-time-val">
                        <i data-lucide="clock" style="width:12px;height:12px;"></i>
                        <span>${start12} – ${end12} (${slotLabel})</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="test-status-pill ${st.badgeClass}">
                      ${st.label}
                    </span>
                  </td>
                  <td>
                    <div class="assess-row-actions">
                      <a href="${t.link}" target="_blank" rel="noopener noreferrer" class="btn-table-action btn-preview" title="Open / Preview Assessment Link">
                        <i data-lucide="external-link" style="width:14px;height:14px;"></i>
                      </a>
                      <button type="button" class="btn-table-action btn-details" onclick="TeacherTestScheduler.openTestDetails('${t.id}')" title="View Full Details">
                        <i data-lucide="eye" style="width:14px;height:14px;"></i>
                      </button>
                      <button type="button" class="btn-table-action btn-edit" onclick="TeacherTestScheduler.openEditTestModal('${t.id}')" title="Edit Assessment">
                        <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
                      </button>
                      <button type="button" class="btn-table-action btn-delete" onclick="TeacherTestScheduler.promptDeleteTest('${t.id}')" title="Delete Assessment">
                        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                      </button>
                    </div>
                  </td>
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
  // 7. GLOBAL EVENT BINDINGS & PAGE UI HANDLERS
  // ----------------------------------------------------
  bindGlobalEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeTestFormModal();
        this.closeTestDetailsModal();
        this.closeDeleteConfirmModal();
      }
    });

    // Close on backdrop click
    document.addEventListener("click", (e) => {
      const modals = [
        document.getElementById("testFormModal"),
        document.getElementById("testDetailsModal"),
        document.getElementById("testDeleteConfirmModal")
      ];
      modals.forEach(m => {
        if (m && e.target === m) {
          this.closeTestFormModal();
          this.closeTestDetailsModal();
          this.closeDeleteConfirmModal();
        }
      });
    });
  },

  bindPageUIEvents() {
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

    const profileTrigger = document.getElementById("profile-dropdown-trigger");
    const profileMenu = document.getElementById("profile-dropdown-menu");
    if (profileTrigger && profileMenu) {
      profileTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("show");
        profileTrigger.classList.toggle("active");
      });
    }

    document.addEventListener("click", () => {
      if (profileMenu) profileMenu.classList.remove("show");
      if (profileTrigger) profileTrigger.classList.remove("active");
    });
  },

  ensureModalsExist() {
    // If form modal is missing in current document, inject it dynamically
    if (!document.getElementById("testFormModal")) {
      const formModalHTML = `
        <div class="test-modal-overlay" id="testFormModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="testModalTitle">
          <div class="test-modal-container">
            <div class="test-modal-header">
              <div class="modal-header-info">
                <span class="modal-badge-tag" id="testModalBadge">Assessment Module</span>
                <h3 class="test-modal-title" id="testModalTitle">Schedule New Test</h3>
              </div>
              <button type="button" class="btn-modal-close" onclick="TeacherTestScheduler.closeTestFormModal()" aria-label="Close dialog">
                <i data-lucide="x" style="width:18px;height:18px;"></i>
              </button>
            </div>

            <form class="test-form" id="testScheduleForm" onsubmit="TeacherTestScheduler.handleSaveTest(event)" novalidate>
              <input type="hidden" id="testFormId" value="">

              <div class="form-row-grid two-cols">
                <div class="form-field-group">
                  <label for="testTypeSelect" class="form-label">
                    <span>Test Type</span>
                    <span class="required-star">*</span>
                  </label>
                  <div class="select-wrapper">
                    <select id="testTypeSelect" class="form-select" required>
                      <option value="Quiz">Quiz</option>
                      <option value="Assignment">Assignment</option>
                      <option value="TEC">TEC</option>
                      <option value="Assessment">Assessment</option>
                      <option value="Mid-Term">Mid-Term</option>
                    </select>
                  </div>
                </div>

                <div class="form-field-group">
                  <label for="testClassSelect" class="form-label">
                    <span>Target Class</span>
                    <span class="required-star">*</span>
                  </label>
                  <div class="select-wrapper">
                    <select id="testClassSelect" class="form-select" required>
                      <option value="2R1" selected>CSE 2R1 (2nd Year)</option>
                      <option value="2R2">CSE 2R2 (2nd Year)</option>
                      <option value="3R">CSE 3R (3rd Year)</option>
                      <option value="4R">CSE 4R (Final Year)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-field-group">
                <label for="testSubjectSelect" class="form-label">
                  <span>Subject / Course</span>
                  <span class="required-star">*</span>
                </label>
                <div class="select-wrapper">
                  <select id="testSubjectSelect" class="form-select" required>
                    <option value="" disabled selected>Select Subject...</option>
                    <option value="Data Structures">Data Structures</option>
                    <option value="Database Management Systems">Database Management Systems</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Java Programming & OOP">Java Programming &amp; OOP</option>
                    <option value="Computer Networks">Computer Networks</option>
                  </select>
                </div>
              </div>

              <div class="form-field-group">
                <label for="testTitleInput" class="form-label">
                  <span>Assessment Title / Unit Topic</span>
                  <span class="required-star">*</span>
                </label>
                <input type="text"
                       id="testTitleInput"
                       class="form-input"
                       placeholder="e.g., Unit 1 Assessment / Binary Trees Quiz"
                       required>
              </div>

              <div class="form-row-grid three-cols">
                <div class="form-field-group">
                  <label for="testDateInput" class="form-label">
                    <span>Date</span>
                    <span class="required-star">*</span>
                  </label>
                  <input type="date"
                         id="testDateInput"
                         class="form-input"
                         required>
                </div>

                <div class="form-field-group">
                  <label for="testStartTimeInput" class="form-label">
                    <span>Start Time</span>
                    <span class="required-star">*</span>
                  </label>
                  <input type="time"
                         id="testStartTimeInput"
                         class="form-input"
                         value="11:15"
                         required>
                </div>

                <div class="form-field-group">
                  <label for="testEndTimeInput" class="form-label">
                    <span>End Time</span>
                    <span class="required-star">*</span>
                  </label>
                  <input type="time"
                         id="testEndTimeInput"
                         class="form-input"
                         value="12:15"
                         required>
                </div>
              </div>

              <div class="form-field-group">
                <label for="testLinkInput" class="form-label">
                  <span>Online Assessment Link / Form URL</span>
                  <span class="required-star">*</span>
                </label>
                <div class="input-with-icon">
                  <i data-lucide="link-2" class="field-icon" style="width:15px;height:15px;"></i>
                  <input type="url"
                         id="testLinkInput"
                         class="form-input with-icon"
                         placeholder="https://forms.gle/... or https://quiz.portal/..."
                         value="https://forms.gle/ssgmce-assessment"
                         required>
                </div>
                <span class="field-help-text">Direct test portal link students will unlock at scheduled start time.</span>
              </div>

              <div class="modal-form-actions">
                <button type="button" class="btn-cancel" onclick="TeacherTestScheduler.closeTestFormModal()">
                  Cancel
                </button>
                <button type="submit" class="btn-submit" id="btnSubmitTestForm">
                  <i data-lucide="check" style="width:16px;height:16px;"></i>
                  <span id="btnSubmitTestText">Schedule Test</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', formModalHTML);
    }

    if (!document.getElementById("testDetailsModal")) {
      const detailsModalHTML = `
        <div class="test-modal-overlay" id="testDetailsModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="detailsModalTitle">
          <div class="test-modal-container test-details-container">
            <div class="test-modal-header">
              <div class="modal-header-info">
                <span class="modal-badge-tag" id="detailsModalTypeBadge">ASSESSMENT OVERVIEW</span>
                <h3 class="test-modal-title" id="detailsModalTitle">Assessment Details</h3>
              </div>
              <button type="button" class="btn-modal-close" onclick="TeacherTestScheduler.closeTestDetailsModal()" aria-label="Close dialog">
                <i data-lucide="x" style="width:18px;height:18px;"></i>
              </button>
            </div>
            <div class="test-details-body" id="testDetailsBody"></div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', detailsModalHTML);
    }

    if (!document.getElementById("testDeleteConfirmModal")) {
      const deleteModalHTML = `
        <div class="test-modal-overlay" id="testDeleteConfirmModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
          <div class="test-modal-container test-delete-container">
            <div class="delete-icon-wrap">
              <i data-lucide="alert-triangle" style="width:28px;height:28px;"></i>
            </div>
            <h3 class="delete-modal-title" id="deleteModalTitle">Delete Assessment?</h3>
            <p class="delete-modal-desc">
              Are you sure you want to delete <strong id="deleteTestTitleName">this assessment</strong>? This action will remove it from the faculty and student timetables.
            </p>
            <div class="modal-form-actions center-actions">
              <button type="button" class="btn-cancel" onclick="TeacherTestScheduler.closeDeleteConfirmModal()">Cancel</button>
              <button type="button" class="btn-confirm-delete" id="btnConfirmDeleteAction" onclick="TeacherTestScheduler.confirmExecuteDelete()">
                <i data-lucide="trash-2" style="width:15px;height:15px;"></i>
                <span>Delete Assessment</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', deleteModalHTML);
    }
  },

  initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
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

// Global Exposure
window.TeacherTestScheduler = TeacherTestScheduler;
window.TestSchedulerService = TeacherTestScheduler;

// Helper function for Filter tabs
window.handleTabFilterClick = function(btn, type) {
  document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  TeacherTestScheduler.setFilterType(type);
};

// Auto initialize on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    TeacherTestScheduler.init();
  });
} else {
  TeacherTestScheduler.init();
}

