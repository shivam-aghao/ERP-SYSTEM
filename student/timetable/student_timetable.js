/* ========================================================
   STUDENT ERP — TIMETABLE MODULE CONTROLLER
   student_timetable.js
   SSGMCE Student Portal
   Read-Only Timetable & Scheduled Test/Assessment Display
   ======================================================== */

const StudentTimetableApp = {
  selectedTimetableDate: null,
  tests: [],
  studentSession: null,

  async init() {
    this.loadStudentSession();
    this.bindEvents();
    this.renderHeaderProfile();
    await this.loadTests();
    this.renderTimetableView();
    this.initLucideIcons();
  },

  getApiBase() {
    return (typeof window !== 'undefined' && window.__API_BASE__) || '/api/v1';
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
      fullName: "Shivam Sanjay Aghao",
      shortName: "Shivam Aghao",
      initials: "SA",
      rollNo: 21,
      studentCode: "308637",
      className: "B.Tech CSE 2R1",
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
      email: "shivam.aghao@ssgmce.ac.in"
    };
  },

  // ----------------------------------------------------
  // LOAD SCHEDULED TESTS / ASSESSMENTS FROM BACKEND API
  // ----------------------------------------------------
  async loadTests() {
    try {
      const res = await fetch(`${this.getApiBase()}/timetable/tests`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          this.tests = json.data;
          try {
            localStorage.setItem("ssgmce_teacher_scheduled_tests", JSON.stringify(this.tests));
          } catch (_) {}
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch tests from backend API, checking local storage cache:", e);
    }

    // Fallback to local storage cache if server is offline
    try {
      const stored = localStorage.getItem("ssgmce_teacher_scheduled_tests");
      if (stored) {
        this.tests = JSON.parse(stored);
      } else {
        this.tests = [];
      }
    } catch (_) {
      this.tests = [];
    }
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

    // Profile Dropdown Trigger
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

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
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
    const s = this.studentSession;
    if (!s) return;

    const headerName = document.getElementById("header-profile-name");
    const headerDept = document.getElementById("header-profile-dept");
    const avatarElem = document.getElementById("header-profile-avatar");
    const menuName = document.getElementById("profile-menu-name");
    const menuTitle = document.getElementById("profile-menu-title");

    const displayName = s.shortName || s.fullName || "Shivam Aghao";
    const displayClass = s.className ? `${s.className} • Roll ${s.rollNo || '21'}` : "B.Tech CSE 2R1 • Roll 21";
    const initials = s.initials || "SA";

    if (headerName) headerName.textContent = displayName;
    if (headerDept) headerDept.textContent = displayClass;
    if (menuName) menuName.textContent = s.fullName || displayName;
    if (menuTitle) menuTitle.textContent = `${displayClass} • ${s.departmentCode || 'CSE'}`;
    if (avatarElem) {
      avatarElem.innerHTML = `<span>${initials}</span>`;
    }
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
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    return hours * 60 + mins;
  },

  formatTime12Hour(timeStr) {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parts[1].padStart(2, "0") : "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  },

  getSlotIndexForTime(timeStr) {
    // 0: 09:00 - 10:30 (540 to 630 mins)
    // 1: 11:00 - 12:30 (660 to 750 mins)
    // 2: 13:30 - 15:00 (810 to 900 mins)
    // 3: 15:30 - 17:00 (930 to 1020 mins)
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

    // Regular schedule data preserved
    const timetableData = (typeof TeacherERPData !== 'undefined' && TeacherERPData.timetable)
      ? TeacherERPData.timetable
      : [
        {
          day: "Monday",
          slots: [
            "Data Structures (Room 201)",
            "Java Programming (Room 305)",
            "Free Slot",
            "Data Structures Lab (Lab 02)"
          ]
        },
        {
          day: "Tuesday",
          slots: [
            "Free Slot",
            "Data Structures (Room 201)",
            "Database Systems (Room 304)",
            "Operating Systems (Lab 04)"
          ]
        },
        {
          day: "Wednesday",
          slots: [
            "Operating Systems (Room 201)",
            "Free Slot",
            "Data Structures Lab (Lab 01)",
            "Data Structures Lab (Lab 01)"
          ]
        },
        {
          day: "Thursday",
          slots: [
            "Data Structures (Room 201)",
            "Algorithms (Room 304)",
            "Free Slot",
            "Project Guidance (Seminar Hall)"
          ]
        },
        {
          day: "Friday",
          slots: [
            "Software Engg (Room 105)",
            "Operating Systems (Room 201)",
            "Free Slot",
            "Faculty Meeting (Dept Library)"
          ]
        }
      ];

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
                            <i data-lucide="clock" style="width:11px;height:11px;"></i>
                            <span>${start12} – ${end12}</span>
                          </div>
                        </div>
                      `;
                    }).join('');

                    // Free slot without any test
                    if (parsed.isFree && slotTests.length === 0) {
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
                          ${testsHTML}
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

