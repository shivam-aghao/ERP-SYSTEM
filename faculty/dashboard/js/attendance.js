/**
 * College ERP - Teacher Attendance Management Workflow Controller
 * Native integration inside Teacher Dashboard
 * Supports:
 * - Dynamic System Date & Calendar selection (DD Month YYYY)
 * - My Class Cards with + Create Card, edit, delete, duplicate checking
 * - Student Attendance Marking: Swipe Deck & Side-by-Side Roster Table
 * - Summary Review with SVG Doughnut Chart, Edit Modal, Save Draft & Submit Attendance
 */

const AttendanceWorkflow = {
// Current application state
    state: {
      currentStep: 1, // 1: Home, 2: Date, 3: My Class Cards, 4: Attendance (Swipe/Roster), 5: Summary
      selectedDept: null,
      selectedClass: null,
      selectedDate: new Date(2026, 8, 17), // Default 17 Sept 2026
      calendarViewingMonth: new Date(2026, 8, 1),
      selectedSubject: null,
      students: [],
      attendanceViewMode: "swipe", // 'swipe' or 'roster'
      isSubmitted: false
    },

    swipeEngine: null,

    init() {
      AttendanceService.init();
      this.bindDOM();
      this.bindEvents();
      this.renderRecentAttendance();
      this.renderCalendar();
      this.updateNavigationUI();
    },

    bindDOM() {
      // Views (Updated New Flow: 1: Home, 2: Date, 3: My Class Cards, 4: Attendance, 5: Summary)
      this.views = {
        1: document.getElementById("step-home-view"),
        2: document.getElementById("step-date-view"),
        3: document.getElementById("step-cards-view"),
        4: document.getElementById("step-attendance-view"),
        5: document.getElementById("step-summary-view")
      };

      // Header & Navigation
      this.breadcrumbsEl = document.getElementById("breadcrumbs");
      this.globalBackBtn = document.getElementById("globalBackBtn");
      this.stepperContainer = document.getElementById("stepperContainer");
      this.stepperTrackFill = document.getElementById("stepperTrackFill");
      this.stepNodes = document.querySelectorAll(".step-node");

      // Step 1 Elements
      this.btnStartFlow = document.getElementById("btnStartFlow");
      this.recentAttendanceTbody = document.getElementById("recentAttendanceTbody");
      this.btnRefreshRecent = document.getElementById("btnRefreshRecent");

      // Step 2 Elements (Calendar Date)
      this.calMonthYear = document.getElementById("calMonthYear");
      this.calendarDaysGrid = document.getElementById("calendarDaysGrid");
      this.calPrevBtn = document.getElementById("calPrevBtn");
      this.calNextBtn = document.getElementById("calNextBtn");
      this.calTodayBtn = document.getElementById("calTodayBtn");
      this.selectedDateDisplay = document.getElementById("selectedDateDisplay");
      this.btnContinueToCards = document.getElementById("btnContinueToCards");

      // Step 3 Elements (My Class Cards)
      this.classCardsGrid = document.getElementById("classCardsGrid");
      this.classCardsEmptyState = document.getElementById("classCardsEmptyState");
      this.cardsViewSelectedDate = document.getElementById("cardsViewSelectedDate");
      this.btnChangeDateFromCards = document.getElementById("btnChangeDateFromCards");
      this.btnOpenCreateCardModal = document.getElementById("btnOpenCreateCardModal");
      this.btnEmptyCreateCard = document.getElementById("btnEmptyCreateCard");

      // Modal: Create / Edit Class Card
      this.modalClassCard = document.getElementById("modalClassCard");
      this.cardModalTitle = document.getElementById("cardModalTitle");
      this.cardModalCardId = document.getElementById("cardModalCardId");
      this.cardModalDept = document.getElementById("cardModalDept");
      this.cardModalClass = document.getElementById("cardModalClass");
      this.cardModalSubject = document.getElementById("cardModalSubject");
      this.cardModalError = document.getElementById("cardModalError");
      this.cardModalErrorText = document.getElementById("cardModalErrorText");
      this.btnSaveCardModal = document.getElementById("btnSaveCardModal");

      // Modal: Delete Class Card
      this.modalDeleteCard = document.getElementById("modalDeleteCard");
      this.deleteCardDetails = document.getElementById("deleteCardDetails");
      this.btnConfirmDeleteCard = document.getElementById("btnConfirmDeleteCard");
      this.pendingDeleteCardId = null;

      // Step 4 Elements (Attendance & Swipe Deck)
      this.attendanceWorkspace = document.getElementById("attendanceWorkspace");
      this.attendanceStatsStrip = document.getElementById("attendanceStatsStrip");
      this.studentProgressCard = document.getElementById("studentProgressCard");
      this.swipeDeckContainer = document.getElementById("swipeDeckContainer");
      this.rosterListView = document.getElementById("rosterListView");
      this.desktopControlsBar = document.getElementById("desktopControlsBar");
      this.auxiliaryControls = document.getElementById("auxiliaryControls");
      this.btnModeSwipe = document.getElementById("btnModeSwipe");
      this.btnModeRoster = document.getElementById("btnModeRoster");
      this.btnMarkAllPresent = document.getElementById("btnMarkAllPresent");
      this.btnMarkAllAbsent = document.getElementById("btnMarkAllAbsent");
      this.btnResetDefault = document.getElementById("btnResetDefault");
      this.btnSwipeAbsent = document.getElementById("btnSwipeAbsent");
      this.btnSwipePresent = document.getElementById("btnSwipePresent");
      this.btnSwipeUndo = document.getElementById("btnSwipeUndo");
      this.btnFinishEarly = document.getElementById("btnFinishEarly");

      // Live Stats
      this.statLivePresent = document.getElementById("statLivePresent");
      this.statLiveAbsent = document.getElementById("statLiveAbsent");
      this.statLiveRemaining = document.getElementById("statLiveRemaining");
      this.progressStudentText = document.getElementById("progressStudentText");
      this.progressPctText = document.getElementById("progressPctText");
      this.attendanceProgressFill = document.getElementById("attendanceProgressFill");

      // Step 7 Elements (Summary)
      this.summarySubtitleText = document.getElementById("summarySubtitleText");
      this.chartPresentCircle = document.getElementById("chartPresentCircle");
      this.chartAbsentCircle = document.getElementById("chartAbsentCircle");
      this.summaryChartPct = document.getElementById("summaryChartPct");
      this.sumValTotal = document.getElementById("sumValTotal");
      this.sumValPresent = document.getElementById("sumValPresent");
      this.sumValAbsent = document.getElementById("sumValAbsent");
      this.sumValRate = document.getElementById("sumValRate");
      this.sumPresentBadge = document.getElementById("sumPresentBadge");
      this.sumAbsentBadge = document.getElementById("sumAbsentBadge");
      this.sumPresentList = document.getElementById("sumPresentList");
      this.sumAbsentList = document.getElementById("sumAbsentList");

      // Summary Action buttons
      this.btnOpenEditModal = document.getElementById("btnOpenEditModal");
      this.btnOpenSaveModal = document.getElementById("btnOpenSaveModal");
      this.btnOpenSubmitModal = document.getElementById("btnOpenSubmitModal");

      // Modals
      this.modalEditAttendance = document.getElementById("modalEditAttendance");
      this.editStudentSearch = document.getElementById("editStudentSearch");
      this.editStudentsTbody = document.getElementById("editStudentsTbody");
      this.btnSaveEditChanges = document.getElementById("btnSaveEditChanges");

      this.modalSaveAttendance = document.getElementById("modalSaveAttendance");
      this.saveConfirmDetails = document.getElementById("saveConfirmDetails");
      this.btnConfirmSave = document.getElementById("btnConfirmSave");

      this.modalSubmitAttendance = document.getElementById("modalSubmitAttendance");
      this.submitConfirmDetails = document.getElementById("submitConfirmDetails");
      this.btnConfirmSubmit = document.getElementById("btnConfirmSubmit");

      // Shell & Misc
      this.mobileMenuToggle = document.getElementById("mobileMenuToggle");
      this.appSidebar = document.getElementById("appSidebar");
      this.toastContainer = document.getElementById("toastContainer");
    },

    bindEvents() {
      // Mobile sidebar toggle
      if (this.mobileMenuToggle) {
        this.mobileMenuToggle.addEventListener("click", () => {
          this.appSidebar.classList.toggle("mobile-open");
        });
      }

      // Global Back Button
      this.globalBackBtn.addEventListener("click", () => this.handleBackNavigation());

      // Step 1: Start Flow
      this.btnStartFlow.addEventListener("click", () => this.goToStep(2));
      this.btnRefreshRecent.addEventListener("click", () => {
        this.renderRecentAttendance();
        this.showToast("Recent attendance records refreshed", "info");
      });

      // Step 4: Calendar controls
      this.calPrevBtn.addEventListener("click", () => {
        this.state.calendarViewingMonth.setMonth(this.state.calendarViewingMonth.getMonth() - 1);
        this.renderCalendar();
      });

      this.calNextBtn.addEventListener("click", () => {
        this.state.calendarViewingMonth.setMonth(this.state.calendarViewingMonth.getMonth() + 1);
        this.renderCalendar();
      });

      this.calTodayBtn.addEventListener("click", () => {
        this.state.calendarViewingMonth = new Date(2026, 8, 1);
        this.state.selectedDate = new Date(2026, 8, 17);
        this.renderCalendar();
      });

      if (this.btnContinueToCards) {
        this.btnContinueToCards.addEventListener("click", () => {
          if (!this.state.selectedDate) {
            this.showToast("Please select a valid attendance date first", "danger");
            return;
          }
          this.goToStep(3);
        });
      }

      // Step 3: My Class Cards Events
      if (this.btnChangeDateFromCards) {
        this.btnChangeDateFromCards.addEventListener("click", () => this.goToStep(2));
      }
      if (this.btnOpenCreateCardModal) {
        this.btnOpenCreateCardModal.addEventListener("click", () => this.openCreateCardModal());
      }
      if (this.btnEmptyCreateCard) {
        this.btnEmptyCreateCard.addEventListener("click", () => this.openCreateCardModal());
      }
      if (this.cardModalDept) {
        this.cardModalDept.addEventListener("change", () => this.handleModalDeptChange());
      }
      if (this.cardModalClass) {
        this.cardModalClass.addEventListener("change", () => this.handleModalClassChange());
      }
      if (this.btnSaveCardModal) {
        this.btnSaveCardModal.addEventListener("click", () => this.handleSaveClassCard());
      }
      if (this.btnConfirmDeleteCard) {
        this.btnConfirmDeleteCard.addEventListener("click", () => this.handleConfirmDeleteCard());
      }

      // Close open card dropdowns when clicking outside
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".card-menu-container")) {
          document.querySelectorAll(".card-menu-dropdown.show").forEach((d) => {
            d.classList.remove("show");
          });
        }
      });

      // Step 4: Mode toggle (Swipe Deck vs Roster List)
      this.btnModeSwipe.addEventListener("click", () => this.setAttendanceMode("swipe"));
      this.btnModeRoster.addEventListener("click", () => this.setAttendanceMode("roster"));

      // Step 4: Mark All Present
      this.btnMarkAllPresent.addEventListener("click", () => {
        if (confirm("Are you sure you want to mark all students as Present?")) {
          this.state.students.forEach((s) => (s.status = "present"));
          this.updateLiveStats();
          if (this.state.attendanceViewMode === "roster") {
            this.renderRosterList();
          } else if (this.swipeEngine) {
            this.goToStep(5);
          }
          this.showToast("All students marked as Present", "success");
        }
      });

      // Step 4: Mark All Absent
      this.btnMarkAllAbsent.addEventListener("click", () => {
        if (confirm("Are you sure you want to mark all students as Absent?")) {
          this.state.students.forEach((s) => (s.status = "absent"));
          this.updateLiveStats();
          if (this.state.attendanceViewMode === "roster") {
            this.renderRosterList();
          } else if (this.swipeEngine) {
            this.goToStep(5);
          }
          this.showToast("All students marked as Absent", "warning");
        }
      });

      // Step 4: Reset to Default (unmarked / pending)
      this.btnResetDefault.addEventListener("click", () => {
        if (confirm("Reset attendance for all students back to default unassigned status?")) {
          this.state.students.forEach((s) => (s.status = null));
          this.updateLiveStats();
          if (this.swipeEngine) {
            this.swipeEngine.setStudents(this.state.students, 0);
          }
          if (this.state.attendanceViewMode === "roster") {
            this.renderRosterList();
          }
          this.showToast("Attendance reset to default status", "info");
        }
      });

      // Step 4: Desktop Control Buttons
      this.btnSwipeAbsent.addEventListener("click", () => {
        if (this.swipeEngine) this.swipeEngine.markAbsent();
      });

      this.btnSwipePresent.addEventListener("click", () => {
        if (this.swipeEngine) this.swipeEngine.markPresent();
      });

      this.btnSwipeUndo.addEventListener("click", () => {
        if (this.swipeEngine) this.swipeEngine.undo();
      });

      this.btnFinishEarly.addEventListener("click", () => {
        this.goToStep(5);
      });

      // Step 7: Modal Openers
      this.btnOpenEditModal.addEventListener("click", () => this.openEditModal());
      this.btnOpenSaveModal.addEventListener("click", () => this.openSaveModal());
      this.btnOpenSubmitModal.addEventListener("click", () => this.openSubmitModal());

      // Modal Close Handlers (via data-close-modal)
      document.querySelectorAll("[data-close-modal]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const targetId = e.currentTarget.getAttribute("data-close-modal");
          const modal = document.getElementById(targetId);
          if (modal) modal.classList.add("hidden");
        });
      });

      // Edit Modal Actions
      this.editStudentSearch.addEventListener("input", (e) => {
        this.renderEditTableRows(e.target.value);
      });

      this.btnSaveEditChanges.addEventListener("click", () => {
        this.modalEditAttendance.classList.add("hidden");
        this.renderSummaryReview();
        this.showToast("Attendance updates applied successfully", "success");
      });

      // Save Draft Confirmation
      this.btnConfirmSave.addEventListener("click", async () => {
        await this.handleSaveDraft();
      });

      // Submit Confirmation
      this.btnConfirmSubmit.addEventListener("click", async () => {
        await this.handleSubmitAttendance();
      });

      // Sidebar links
      document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          const nav = link.getAttribute("data-nav");
          document.querySelectorAll(".sidebar .nav-item").forEach((item) => item.classList.remove("active"));
          link.closest(".nav-item").classList.add("active");
          if (nav === "attendance") {
            this.goToStep(1);
          } else {
            this.showToast(`Navigated to ${link.innerText.trim()} module`, "info");
          }
          if (window.innerWidth <= 768) {
            this.appSidebar.classList.remove("mobile-open");
          }
        });
      });

      // Stepper nodes click navigation
      this.stepNodes.forEach((node) => {
        node.addEventListener("click", () => {
          const stepNum = parseInt(node.getAttribute("data-step"), 10);
          this.handleStepperNodeClick(stepNum);
        });
      });

      // Header logout
      const logoutAction = () => {
        if (confirm("Are you sure you want to log out from Teacher ERP?")) {
          this.showToast("Session logged out securely.", "info");
          setTimeout(() => location.reload(), 800);
        }
      };
      const hLogout = document.getElementById("headerLogoutBtn"); if (hLogout) hLogout.addEventListener("click", () => this.showToast("Session logged out securely.", "info"));
      const sLogout = document.getElementById("sidebarLogoutBtn"); if (sLogout) sLogout.addEventListener("click", () => this.showToast("Session logged out securely.", "info"));
    },

    // =========================================================================
    // NAVIGATION & STEP TRANSITIONS
    // =========================================================================

    goToStep(stepNumber) {
      if (stepNumber < 1 || stepNumber > 5) return;

      // Validation gates
      if (stepNumber >= 3 && !this.state.selectedDate) {
        this.showToast("Please select an attendance date first", "warning");
        this.goToStep(2);
        return;
      }
      if (stepNumber >= 4 && (!this.state.selectedDept || !this.state.selectedClass || !this.state.selectedSubject)) {
        this.showToast("Please select a class card first", "warning");
        this.goToStep(3);
        return;
      }

      this.state.currentStep = stepNumber;

      // Hide all views, display current
      Object.keys(this.views).forEach((key) => {
        if (parseInt(key, 10) === stepNumber && this.views[key]) {
          this.views[key].classList.remove("hidden");
        } else if (this.views[key]) {
          this.views[key].classList.add("hidden");
        }
      });

      // Trigger step-specific setup
      if (stepNumber === 3) {
        this.renderClassCards();
      } else if (stepNumber === 4) {
        this.initStudentAttendance();
      } else if (stepNumber === 5) {
        this.renderSummaryReview();
      }

      if (stepNumber !== 4) {
        const viewport = document.querySelector(".content-viewport");
        if (viewport) viewport.classList.remove("roster-expanded-viewport");
      }

      this.updateNavigationUI();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    handleBackNavigation() {
      if (this.state.currentStep > 1) {
        this.goToStep(this.state.currentStep - 1);
      }
    },

    handleStepperNodeClick(targetStepNode) {
      // Map stepper node 1..3 to internal steps:
      // Node 1: Date (Step 2)
      // Node 2: My Classes (Step 3)
      // Node 3: Attendance (Step 4)
      const targetStep = targetStepNode + 1;
      if (targetStep <= this.state.currentStep) {
        this.goToStep(targetStep);
      }
    },

    updateNavigationUI() {
      const step = this.state.currentStep;

      // Global Back Button visibility
      this.globalBackBtn.style.display = step > 1 ? "inline-flex" : "none";

      // Stepper visibility: show during steps 2 to 4
      if (step === 1) {
        this.stepperContainer.style.display = "none";
      } else {
        this.stepperContainer.style.display = "block";
      }

      // Stepper milestone mapping (1 to 3)
      let activeNodeIdx = 1;
      if (step === 2) activeNodeIdx = 1;      // Date
      else if (step === 3) activeNodeIdx = 2; // My Classes
      else if (step >= 4) activeNodeIdx = 3;  // Attendance / Summary

      // Stepper fill percentage (2 segments across 3 nodes)
      const fillPercentage = ((activeNodeIdx - 1) / 2) * 100;
      this.stepperTrackFill.style.width = `${fillPercentage}%`;

      this.stepNodes.forEach((node) => {
        const nodeNum = parseInt(node.getAttribute("data-step"), 10);
        node.classList.remove("active", "completed");
        if (nodeNum < activeNodeIdx) {
          node.classList.add("completed");
          node.querySelector(".step-circle").innerHTML = "✓";
        } else if (nodeNum === activeNodeIdx) {
          node.classList.add("active");
          node.querySelector(".step-circle").innerHTML = nodeNum;
        } else {
          node.querySelector(".step-circle").innerHTML = nodeNum;
        }
      });

      // Breadcrumb construction
      this.renderBreadcrumbs();
    },

    renderBreadcrumbs() {
      const crumbs = [];

      crumbs.push({ label: "Attendance", step: 1 });

      if (this.state.selectedDate && this.state.currentStep >= 2) {
        const formattedDate = this.formatDateShort(this.state.selectedDate);
        crumbs.push({ label: formattedDate, step: 2 });
      }

      if (this.state.currentStep === 3) {
        crumbs.push({ label: "My Classes", step: 3 });
      } else if (this.state.currentStep >= 4 && this.state.selectedClass && this.state.selectedSubject) {
        const deptCode = this.state.selectedDept ? this.state.selectedDept.code : "";
        crumbs.push({
          label: `${deptCode} ${this.state.selectedClass.name} - ${this.state.selectedSubject.code}`,
          step: 3
        });
      }

      if (this.state.currentStep === 4) {
        crumbs.push({ label: "Student Attendance", step: 4 });
      } else if (this.state.currentStep === 5) {
        crumbs.push({ label: "Summary", step: 5 });
      }

      this.breadcrumbsEl.innerHTML = "";
      crumbs.forEach((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        const item = document.createElement("span");
        item.className = `breadcrumb-item ${isLast ? "active" : ""}`;
        item.innerText = crumb.label;

        if (!isLast) {
          item.addEventListener("click", () => this.goToStep(crumb.step));
        }

        this.breadcrumbsEl.appendChild(item);

        if (!isLast) {
          const sep = document.createElement("span");
          sep.className = "breadcrumb-sep";
          sep.innerText = ">";
          this.breadcrumbsEl.appendChild(sep);
        }
      });
    },

    // =========================================================================
    // STEP 1: RECENT ATTENDANCE
    // =========================================================================

    renderRecentAttendance() {
      const records = AttendanceService.getAllRecords();
      this.recentAttendanceTbody.innerHTML = "";

      if (records.length === 0) {
        this.recentAttendanceTbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
              No attendance records found yet.
            </td>
          </tr>
        `;
        return;
      }

      records.forEach((record) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${record.id}</strong></td>
          <td>${record.dateFormatted || record.date}</td>
          <td>
            <span class="dept-code-tag">${record.department}</span>
            <strong style="margin-left: 4px;">${record.classId}</strong>
          </td>
          <td>
            <span style="font-weight: 600;">${record.subjectName}</span>
            <div style="font-size: 11px; color: var(--text-muted);">${record.subjectCode}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--navy);">${record.percentage}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${record.presentCount} / ${record.totalStudents} present</div>
          </td>
          <td>
            <span class="${record.status === 'Submitted' ? 'badge-submitted' : 'badge-draft'}">
              ${record.status === 'Submitted' ? '● Submitted' : '○ Draft'}
            </span>
          </td>
          <td style="color: var(--text-muted); font-size: 12px;">${record.savedAt || 'Recently'}</td>
          <td>
            <button class="btn-table-action btn-view-record" data-id="${record.id}">View Details</button>
          </td>
        `;

        tr.querySelector(".btn-view-record").addEventListener("click", () => {
          this.viewExistingRecord(record);
        });

        this.recentAttendanceTbody.appendChild(tr);
      });
    },

    viewExistingRecord(record) {
      alert(`Attendance Record [${record.id}]\nDepartment: ${record.department}\nClass: ${record.classId}\nSubject: ${record.subjectName} (${record.subjectCode})\nDate: ${record.dateFormatted}\nPresent: ${record.presentCount}\nAbsent: ${record.absentCount}\nPercentage: ${record.percentage}\nStatus: ${record.status}`);
    },

    // =========================================================================
    // STEP 2: DATE SELECTION & MODERN CALENDAR
    // =========================================================================

    renderCalendar() {
      const year = this.state.calendarViewingMonth.getFullYear();
      const month = this.state.calendarViewingMonth.getMonth();

      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      this.calMonthYear.innerText = `${monthNames[month]} ${year}`;

      this.calendarDaysGrid.innerHTML = "";

      // Day of week headers
      const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dayHeaders.forEach((day, i) => {
        const lbl = document.createElement("div");
        lbl.className = `cal-day-label ${i === 0 ? "weekend" : ""}`;
        lbl.innerText = day;
        this.calendarDaysGrid.appendChild(lbl);
      });

      // Calendar month math
      const firstDayIndex = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();

      const today = (typeof AcademicDateUtils !== 'undefined') ? ((typeof AcademicDateUtils !== 'undefined' && typeof AcademicDateUtils.getNow === 'function') ? AcademicDateUtils.getNow() : new Date()) : new Date();

      // Preceding month trailing cells
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const cell = document.createElement("div");
        cell.className = "cal-day-cell other-month disabled";
        cell.innerText = daysInPrevMonth - i;
        this.calendarDaysGrid.appendChild(cell);
      }

      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const cell = document.createElement("div");
        cell.className = "cal-day-cell";
        cell.innerText = day;

        // Is Sunday (Holiday/Non-academic)
        const isSunday = cellDate.getDay() === 0;
        if (isSunday) {
          cell.classList.add("disabled");
          cell.title = "Sunday - No academic lectures";
        }

        // Today highlight (#00A6D6)
        if (
          cellDate.getFullYear() === today.getFullYear() &&
          cellDate.getMonth() === today.getMonth() &&
          cellDate.getDate() === today.getDate()
        ) {
          cell.classList.add("is-today");
        }

        // Selected date highlight (#0B5CAD)
        if (
          this.state.selectedDate &&
          cellDate.getFullYear() === this.state.selectedDate.getFullYear() &&
          cellDate.getMonth() === this.state.selectedDate.getMonth() &&
          cellDate.getDate() === this.state.selectedDate.getDate()
        ) {
          cell.classList.add("is-selected");
        }

        if (!isSunday) {
          cell.addEventListener("click", () => {
            this.selectDate(cellDate, true);
          });
        }

        this.calendarDaysGrid.appendChild(cell);
      }

      this.updateSelectedDateDisplay();
    },

    selectDate(date, autoProceed = false) {
      this.state.selectedDate = date;
      this.renderCalendar();
      this.updateSelectedDateDisplay();

      if (autoProceed) {
        setTimeout(() => {
          this.goToStep(3);
        }, 120);
      }
    },

    updateSelectedDateDisplay() {
      if (this.state.selectedDate) {
        const options = { day: "numeric", month: "long", year: "numeric" };
        const formatted = this.state.selectedDate.toLocaleDateString("en-US", options);
        this.selectedDateDisplay.innerText = formatted;
      }
    },

    // =========================================================================
    // STEP 3: MY CLASS CARDS (TEACHER SAVED COMBINATIONS)
    // =========================================================================

    async renderClassCards() {
      if (this.cardsViewSelectedDate && this.state.selectedDate) {
        this.cardsViewSelectedDate.innerText = this.formatDateLong(this.state.selectedDate);
      }

      try {
        const teacherId = ERP_DATA.teacher.id;
        const cards = await AttendanceService.getTeacherCards(teacherId);

        this.classCardsGrid.innerHTML = "";

        if (!cards || cards.length === 0) {
          this.classCardsEmptyState.classList.remove("hidden");
          return;
        }

        this.classCardsEmptyState.classList.add("hidden");

        cards.forEach((card) => {
          const deptObj = ERP_DATA.departments.find((d) => d.code === card.department);
          const deptColor = deptObj ? deptObj.color : "#0B5CAD";

          const cardEl = document.createElement("div");
          cardEl.className = "my-class-card";
          cardEl.dataset.cardId = card.id;

          cardEl.innerHTML = `
            <div>
              <div class="card-top-row">
                <span class="card-badge-pill" style="border-color: ${deptColor}40; color: ${deptColor}; background-color: ${deptColor}15;">
                  ${card.department}
                </span>
                <div class="card-menu-container">
                  <button class="card-menu-btn" title="Options" aria-label="Card Options">⋮</button>
                  <div class="card-menu-dropdown">
                    <button class="card-menu-item btn-card-edit" type="button">
                      <span>✏️</span> Edit Card
                    </button>
                    <button class="card-menu-item danger btn-card-delete" type="button">
                      <span>🗑️</span> Delete Card
                    </button>
                  </div>
                </div>
              </div>

              <div class="card-body-content">
                <div class="card-class-heading">Class ${card.class}</div>
                <div class="card-subject-name">${card.subject_name}</div>
                <div class="card-subject-code">${card.subject_code}</div>
              </div>
            </div>

            <div class="card-footer-meta">
              <span class="card-action-hint">Mark Attendance →</span>
            </div>
          `;

          // Card click -> start attendance marking
          cardEl.addEventListener("click", (e) => {
            if (e.target.closest(".card-menu-container")) return;
            this.startAttendanceFromCard(card);
          });

          // Dropdown toggle
          const menuBtn = cardEl.querySelector(".card-menu-btn");
          const dropdown = cardEl.querySelector(".card-menu-dropdown");

          menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // Close any other open dropdowns
            document.querySelectorAll(".card-menu-dropdown.show").forEach((d) => {
              if (d !== dropdown) d.classList.remove("show");
            });
            dropdown.classList.toggle("show");
          });

          // Edit option
          const editBtn = cardEl.querySelector(".btn-card-edit");
          editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.remove("show");
            this.openEditCardModal(card);
          });

          // Delete option
          const deleteBtn = cardEl.querySelector(".btn-card-delete");
          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.remove("show");
            this.openDeleteCardModal(card);
          });

          this.classCardsGrid.appendChild(cardEl);
        });

        // Append "+ Create Card" tile at the end of the grid
        const createTile = document.createElement("div");
        createTile.className = "create-card-tile";
        createTile.id = "btnTileCreateCard";
        createTile.innerHTML = `
          <div class="create-tile-icon">+</div>
          <div class="create-tile-title">Create Class Card</div>
          <div class="create-tile-desc">Add a new Department, Class, & Subject</div>
        `;
        createTile.addEventListener("click", () => this.openCreateCardModal());
        this.classCardsGrid.appendChild(createTile);

      } catch (err) {
        console.error("Error rendering class cards:", err);
        this.showToast("Failed to load class cards", "danger");
      }
    },

    startAttendanceFromCard(card) {
      const deptObj = ERP_DATA.departments.find((d) => d.code === card.department) || {
        id: card.department,
        code: card.department,
        name: card.department_name || card.department,
        color: "#0B5CAD"
      };

      const classList = ERP_DATA.classes[card.department] || [];
      const classObj = classList.find((c) => c.name === card.class || c.id === card.class) || {
        id: card.class,
        name: card.class,
        year: "",
        studentCount: 60
      };

      const subjectList = ERP_DATA.subjects[card.department] || [];
      const subjectObj = subjectList.find((s) => s.code === card.subject_code) || {
        code: card.subject_code,
        name: card.subject_name,
        type: "Theory"
      };

      this.state.selectedDept = deptObj;
      this.state.selectedClass = classObj;
      this.state.selectedSubject = subjectObj;

      // Check if attendance already exists for this exact combination
      const dateStr = this.formatDateISO(this.state.selectedDate);
      const isDuplicate = AttendanceService.checkDuplicate(
        deptObj.code,
        classObj.name,
        dateStr,
        subjectObj.code
      );

      if (isDuplicate) {
        if (!confirm(`Notice: Attendance for ${classObj.name} - ${subjectObj.name} on ${dateStr} is already submitted.\nDo you want to re-evaluate this session?`)) {
          return;
        }
      }

      this.state.students = ERP_DATA.generateStudentRoster(deptObj.code, classObj.id || classObj.name);
      this.showToast(`Selected: Class ${classObj.name} — ${subjectObj.name}`, "info");
      this.goToStep(4);
    },

    openCreateCardModal() {
      this.cardModalTitle.innerText = "Create Class Card";
      this.cardModalCardId.value = "";
      this.cardModalError.classList.add("hidden");

      // Populate Department dropdown
      this.cardModalDept.innerHTML = `<option value="">-- Select Department --</option>`;
      ERP_DATA.departments.forEach((dept) => {
        const opt = document.createElement("option");
        opt.value = dept.code;
        opt.innerText = `${dept.name} (${dept.code})`;
        this.cardModalDept.appendChild(opt);
      });

      this.cardModalDept.value = "";
      this.populateModalClasses("", "");
      this.populateModalSubjects("", "");

      this.modalClassCard.classList.remove("hidden");
    },

    openEditCardModal(card) {
      this.cardModalTitle.innerText = "Edit Class Card";
      this.cardModalCardId.value = card.id;
      this.cardModalError.classList.add("hidden");

      // Populate Department dropdown
      this.cardModalDept.innerHTML = `<option value="">-- Select Department --</option>`;
      ERP_DATA.departments.forEach((dept) => {
        const opt = document.createElement("option");
        opt.value = dept.code;
        opt.innerText = `${dept.name} (${dept.code})`;
        this.cardModalDept.appendChild(opt);
      });

      this.cardModalDept.value = card.department;
      this.populateModalClasses(card.department, card.class);
      this.populateModalSubjects(card.department, card.subject_code);

      this.modalClassCard.classList.remove("hidden");
    },

    handleModalDeptChange() {
      const deptCode = this.cardModalDept.value;
      this.cardModalError.classList.add("hidden");
      this.populateModalClasses(deptCode, "");
      this.populateModalSubjects(deptCode, "");
    },

    handleModalClassChange() {
      this.cardModalError.classList.add("hidden");
    },

    populateModalClasses(deptCode, selectedClass = "") {
      this.cardModalClass.innerHTML = `<option value="">-- Select Class --</option>`;
      if (!deptCode) {
        this.cardModalClass.disabled = true;
        return;
      }

      const classList = ERP_DATA.classes[deptCode] || [];
      classList.forEach((cls) => {
        const opt = document.createElement("option");
        opt.value = cls.name;
        opt.innerText = `${cls.name} (${cls.year || cls.division || ''})`;
        if (cls.name === selectedClass) {
          opt.selected = true;
        }
        this.cardModalClass.appendChild(opt);
      });

      this.cardModalClass.disabled = false;
      if (selectedClass) {
        this.cardModalClass.value = selectedClass;
      }
    },

    populateModalSubjects(deptCode, selectedSubjectCode = "") {
      this.cardModalSubject.innerHTML = `<option value="">-- Select Subject --</option>`;
      if (!deptCode) {
        this.cardModalSubject.disabled = true;
        return;
      }

      const subjects = ERP_DATA.subjects[deptCode] || [];
      subjects.forEach((sub) => {
        const opt = document.createElement("option");
        opt.value = sub.code;
        opt.dataset.name = sub.name;
        opt.innerText = `${sub.name} (${sub.code})`;
        if (sub.code === selectedSubjectCode) {
          opt.selected = true;
        }
        this.cardModalSubject.appendChild(opt);
      });

      this.cardModalSubject.disabled = false;
      if (selectedSubjectCode) {
        this.cardModalSubject.value = selectedSubjectCode;
      }
    },

    async handleSaveClassCard() {
      const cardId = this.cardModalCardId.value;
      const deptCode = this.cardModalDept.value;
      const classId = this.cardModalClass.value;
      const subjectCode = this.cardModalSubject.value;

      if (!deptCode || !classId || !subjectCode) {
        this.cardModalErrorText.innerText = "Please select Department, Class, and Subject.";
        this.cardModalError.classList.remove("hidden");
        return;
      }

      const teacherId = ERP_DATA.teacher.id;
      const isDuplicate = AttendanceService.checkCardDuplicate(
        teacherId,
        deptCode,
        classId,
        subjectCode,
        cardId || null
      );

      if (isDuplicate) {
        this.cardModalErrorText.innerText = "A class card for this exact combination (Department + Class + Subject) already exists.";
        this.cardModalError.classList.remove("hidden");
        return;
      }

      const deptObj = ERP_DATA.departments.find((d) => d.code === deptCode);
      const subjectOpt = this.cardModalSubject.options[this.cardModalSubject.selectedIndex];
      const subjectName = subjectOpt ? (subjectOpt.dataset.name || subjectOpt.text) : subjectCode;

      const cardPayload = {
        department: deptCode,
        department_name: deptObj ? deptObj.name : deptCode,
        class: classId,
        subject_code: subjectCode,
        subject_name: subjectName
      };

      this.btnSaveCardModal.disabled = true;
      this.btnSaveCardModal.innerText = "Saving...";

      try {
        if (cardId) {
          await AttendanceService.updateCard(teacherId, cardId, cardPayload);
          this.showToast("Class card updated successfully.", "success");
        } else {
          await AttendanceService.createCard(teacherId, cardPayload);
          this.showToast("Class card created successfully.", "success");
        }

        this.modalClassCard.classList.add("hidden");
        this.renderClassCards();
      } catch (err) {
        this.cardModalErrorText.innerText = err.message || "Failed to save class card.";
        this.cardModalError.classList.remove("hidden");
      } finally {
        this.btnSaveCardModal.disabled = false;
        this.btnSaveCardModal.innerText = "Save Card";
      }
    },

    openDeleteCardModal(card) {
      this.pendingDeleteCardId = card.id;

      this.deleteCardDetails.innerHTML = `
        <div class="confirm-details-row">
          <span class="confirm-label">Department</span>
          <span class="confirm-value">${card.department}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Class</span>
          <span class="confirm-value">${card.class}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Subject</span>
          <span class="confirm-value">${card.subject_name} (${card.subject_code})</span>
        </div>
      `;

      this.modalDeleteCard.classList.remove("hidden");
    },

    async handleConfirmDeleteCard() {
      if (!this.pendingDeleteCardId) return;

      const teacherId = ERP_DATA.teacher.id;
      this.btnConfirmDeleteCard.disabled = true;
      this.btnConfirmDeleteCard.innerText = "Deleting...";

      try {
        await AttendanceService.deleteCard(teacherId, this.pendingDeleteCardId);
        this.modalDeleteCard.classList.add("hidden");
        this.pendingDeleteCardId = null;
        this.showToast("Class card removed. Past attendance records are preserved.", "success");
        this.renderClassCards();
      } catch (err) {
        this.showToast(err.message || "Failed to delete card.", "danger");
      } finally {
        this.btnConfirmDeleteCard.disabled = false;
        this.btnConfirmDeleteCard.innerText = "Delete Card";
      }
    },

    // =========================================================================
    // STEP 4: STUDENT ATTENDANCE MARKING (SWIPE ENGINE & ROSTER)
    // =========================================================================

    initStudentAttendance() {
      // Check if students array is already initialized for this class session
      if (!this.state.students || this.state.students.length === 0) {
        this.state.students = ERP_DATA.generateStudentRoster(
          this.state.selectedDept.code,
          this.state.selectedClass.id
        );
      }

      // Check if draft exists
      const dateStr = this.formatDateISO(this.state.selectedDate);
      const draft = AttendanceService.getDraft(
        this.state.selectedDept.code,
        this.state.selectedClass.id,
        dateStr,
        this.state.selectedSubject.code
      );

      if (draft && draft.students) {
        this.state.students = draft.students;
        this.showToast("Loaded saved attendance draft for this session", "info");
      }

      // Determine first uncompleted student index
      let firstPendingIndex = this.state.students.findIndex((s) => s.status === null);
      if (firstPendingIndex === -1) firstPendingIndex = 0;

      // Initialize Swipe Engine
      if (this.swipeEngine) {
        this.swipeEngine.destroy();
      }

      this.swipeEngine = new SwipeAttendanceEngine({
        container: this.swipeDeckContainer,
        students: this.state.students,
        currentIndex: firstPendingIndex,
        onMark: (student, status) => {
          this.updateLiveStats();
          if (this.state.attendanceViewMode === "roster") {
            this.renderRosterList();
          }
        },
        onUndo: (student) => {
          this.updateLiveStats();
          if (this.state.attendanceViewMode === "roster") {
            this.renderRosterList();
          }
          this.showToast(`Reverted Roll ${student.roll}`, "info");
        },
        onProgressChange: (prog) => {
          this.statLivePresent.innerText = prog.presentCount;
          this.statLiveAbsent.innerText = prog.absentCount;
          this.statLiveRemaining.innerText = prog.remainingCount;
          this.progressStudentText.innerText = `Student ${prog.currentDisplay} of ${prog.total}`;
          this.progressPctText.innerText = `${prog.percent}%`;
          this.attendanceProgressFill.style.width = `${prog.percent}%`;
        },
        onComplete: () => {
          this.showToast("All students evaluated! Showing summary review.", "success");
          setTimeout(() => {
            this.goToStep(5);
          }, 350);
        }
      });

      this.swipeEngine.render();
      this.updateLiveStats();

      // Apply initial view mode (defaults to swipe)
      this.setAttendanceMode(this.state.attendanceViewMode || "swipe");
    },

    setAttendanceMode(mode) {
      this.state.attendanceViewMode = mode;
      const viewport = document.querySelector(".content-viewport");

      if (mode === "swipe") {
        this.btnModeSwipe.classList.add("active");
        this.btnModeRoster.classList.remove("active");

        if (this.attendanceWorkspace) {
          this.attendanceWorkspace.classList.remove("mode-roster");
          this.attendanceWorkspace.classList.add("mode-swipe");
        }
        if (viewport) viewport.classList.remove("roster-expanded-viewport");

        // SHOW swipe deck elements
        if (this.swipeDeckContainer) this.swipeDeckContainer.classList.remove("hidden");
        if (this.desktopControlsBar) this.desktopControlsBar.classList.remove("hidden");
        if (this.auxiliaryControls) this.auxiliaryControls.classList.remove("hidden");
        if (this.attendanceStatsStrip) this.attendanceStatsStrip.classList.remove("hidden");
        if (this.studentProgressCard) this.studentProgressCard.classList.remove("hidden");

        // HIDE roster list completely
        if (this.rosterListView) this.rosterListView.classList.add("hidden");

        if (this.swipeEngine) this.swipeEngine.render();
      } else {
        this.btnModeRoster.classList.add("active");
        this.btnModeSwipe.classList.remove("active");

        if (this.attendanceWorkspace) {
          this.attendanceWorkspace.classList.remove("mode-swipe");
          this.attendanceWorkspace.classList.add("mode-roster");
        }
        if (viewport) viewport.classList.add("roster-expanded-viewport");

        // HIDE swipe cards and all swipe-specific controls completely
        if (this.swipeDeckContainer) this.swipeDeckContainer.classList.add("hidden");
        if (this.desktopControlsBar) this.desktopControlsBar.classList.add("hidden");
        if (this.auxiliaryControls) this.auxiliaryControls.classList.add("hidden");
        if (this.attendanceStatsStrip) this.attendanceStatsStrip.classList.add("hidden");
        if (this.studentProgressCard) this.studentProgressCard.classList.add("hidden");

        // SHOW only the complete roster list
        if (this.rosterListView) this.rosterListView.classList.remove("hidden");

        this.renderRosterList();
      }
    },

    renderRosterList() {
      const leftTbody = document.getElementById("leftTableBody");
      const rightTbody = document.getElementById("rightTableBody");
      if (!leftTbody || !rightTbody) return;

      leftTbody.innerHTML = "";
      rightTbody.innerHTML = "";

      // Update metadata bar text from current session state
      const teacherInfo = document.getElementById("rosterTeacherInfo");
      if (teacherInfo && ERP_DATA.teacher) {
        const deptCode = this.state.selectedDept?.code || "CSE";
        teacherInfo.innerText = `${ERP_DATA.teacher.name} (${ERP_DATA.teacher.id}) ${ERP_DATA.teacher.designation || "Teaching Assistant"} ${deptCode}`;
      }
      const classText = document.getElementById("rosterClassText");
      if (classText) {
        const deptCode = this.state.selectedDept?.code || "CSE";
        const className = this.state.selectedClass?.name || this.state.selectedClass?.id || "SY-CSE-A";
        classText.innerHTML = `<strong>Class:</strong> ${className.includes(deptCode) ? className : `${deptCode}-${className}`}`;
      }
      const subjectText = document.getElementById("rosterSubjectText");
      if (subjectText && this.state.selectedSubject) {
        subjectText.innerHTML = `<strong>Subject:</strong> ${this.state.selectedSubject.code} ${this.state.selectedSubject.name} (${(this.state.selectedSubject.type || "THEORY").toUpperCase()})`;
      }
      const dateText = document.getElementById("rosterDateText");
      if (dateText && this.state.selectedDate) {
        dateText.innerHTML = `<strong>Date:</strong> ${this.formatDateShort(this.state.selectedDate)}`;
      }

      // Split students into Left and Right table blocks
      const totalStudents = this.state.students.length;
      const midpoint = Math.ceil(totalStudents / 2);
      const leftStudents = this.state.students.slice(0, midpoint);
      const rightStudents = this.state.students.slice(midpoint);

      leftStudents.forEach((student, idx) => {
        leftTbody.appendChild(this.buildRosterTableRow(student, idx));
      });

      rightStudents.forEach((student, idx) => {
        rightTbody.appendChild(this.buildRosterTableRow(student, idx + midpoint));
      });

      this.updateRosterStats();
      this.bindRosterControls();
    },

    buildRosterTableRow(student, index) {
      const srNo = index + 1;
      const isAbsent = (student.status === "absent");
      const isPresent = (student.status === "present");
      const statusText = isAbsent ? "ABSENT" : (isPresent ? "PRESENT" : "PENDING");
      const statusClass = isAbsent ? "absent" : (isPresent ? "present" : "pending");
      const rollNo = student.rollFormatted ? student.rollFormatted.replace("ROLL ", "2UB") : `2UB${srNo}`;
      const studentCode = student.prn || student.code || `312225E${300 + srNo}`;

      // Generate 10 lecture history if not present
      if (!student.history || student.history.length < 10) {
        student.history = [];
        for (let i = 0; i < 10; i++) {
          const rand = Math.sin(srNo * 10 + i) * 10000;
          student.history.push((rand - Math.floor(rand)) > 0.22);
        }
      }

      // 10 pure CSS circles: empty circle for present, striped/hashed for absent
      const circlesHtml = student.history.map(wasPresent => {
        return wasPresent
          ? '<span class="circle-present" title="Present"></span>'
          : '<span class="circle-absent" title="Absent"></span>';
      }).join("");

      const tr = document.createElement("tr");
      tr.id = `roster-row-${student.roll}`;
      tr.dataset.roll = student.roll;

      tr.innerHTML = `
        <td class="col-sr">${srNo}</td>
        <td class="col-code">${studentCode}</td>
        <td class="col-name ${student.provisional ? 'provisional' : ''}">${student.name}${student.provisional ? ' *' : ''}</td>
        <td class="col-history"><div class="circle-indicator-wrapper">${circlesHtml}</div></td>
        <td class="col-roll ${statusClass}">${rollNo}</td>
        <td class="col-status ${statusClass}" title="Click to toggle status">
          <span class="status-badge">${statusText}</span>
        </td>
      `;

      const statusCell = tr.querySelector(".col-status");
      statusCell.addEventListener("click", () => {
        if (student.status === "present") {
          student.status = "absent";
        } else {
          student.status = "present";
        }
        this.updateRosterRow(tr, student);
        this.updateLiveStats();
      });

      return tr;
    },

    updateRosterRow(tr, student) {
      const isAbsent = (student.status === "absent");
      const isPresent = (student.status === "present");
      const statusText = isAbsent ? "ABSENT" : (isPresent ? "PRESENT" : "PENDING");
      const statusClass = isAbsent ? "absent" : (isPresent ? "present" : "pending");

      const rollCell = tr.querySelector(".col-roll");
      if (rollCell) rollCell.className = `col-roll ${statusClass}`;

      const statusCell = tr.querySelector(".col-status");
      if (statusCell) {
        statusCell.className = `col-status ${statusClass}`;
        const badge = statusCell.querySelector(".status-badge");
        if (badge) badge.textContent = statusText;
      }
    },

    updateRosterStats() {
      const total = this.state.students.length;
      const present = this.state.students.filter((s) => s.status === "present").length;
      const absent = this.state.students.filter((s) => s.status === "absent").length;

      const totalElem = document.getElementById("rosterTotalCount");
      const presentElem = document.getElementById("rosterPresentCount");
      const absentElem = document.getElementById("rosterAbsentCount");

      if (totalElem) totalElem.textContent = total;
      if (presentElem) presentElem.textContent = present;
      if (absentElem) absentElem.textContent = absent;

      const allAbsentCheckbox = document.getElementById("rosterToggleAllAbsent");
      if (allAbsentCheckbox) {
        allAbsentCheckbox.checked = (absent === total && total > 0);
      }
    },

    bindRosterControls() {
      if (this.rosterControlsBound) return;
      this.rosterControlsBound = true;

      const allAbsentCheckbox = document.getElementById("rosterToggleAllAbsent");
      if (allAbsentCheckbox) {
        allAbsentCheckbox.addEventListener("change", (e) => {
          const makeAllAbsent = e.target.checked;
          const newStatus = makeAllAbsent ? "absent" : "present";

          this.state.students.forEach((student) => {
            student.status = newStatus;
            const row = document.getElementById(`roster-row-${student.roll}`);
            if (row) this.updateRosterRow(row, student);
          });

          this.updateLiveStats();
        });
      }

      const btnSaveDraft = document.getElementById("btnRosterSaveDraft");
      if (btnSaveDraft) {
        btnSaveDraft.addEventListener("click", () => {
          if (!this.state.selectedDept || !this.state.selectedClass || !this.state.selectedSubject || !this.state.selectedDate) {
            this.showToast("Roster draft saved locally", "success");
            return;
          }
          const dateStr = this.formatDateISO(this.state.selectedDate);
          AttendanceService.saveDraft(
            this.state.selectedDept.code,
            this.state.selectedClass.id,
            dateStr,
            this.state.selectedSubject.code,
            this.state.students
          );
          this.showToast("Attendance roster draft saved successfully!", "success");
        });
      }

      const btnSubmitAll = document.getElementById("btnRosterSubmitAll");
      if (btnSubmitAll) {
        btnSubmitAll.addEventListener("click", () => {
          // Default unassigned students to present if submitting directly
          this.state.students.forEach((s) => {
            if (!s.status) s.status = "present";
          });
          this.updateLiveStats();
          this.goToStep(5);
        });
      }
    },

    updateLiveStats() {
      const total = this.state.students.length;
      const present = this.state.students.filter((s) => s.status === "present").length;
      const absent = this.state.students.filter((s) => s.status === "absent").length;
      const remaining = total - (present + absent);
      const percent = total > 0 ? Math.round(((present + absent) / total) * 100) : 0;

      if (this.statLivePresent) this.statLivePresent.innerText = present;
      if (this.statLiveAbsent) this.statLiveAbsent.innerText = absent;
      if (this.statLiveRemaining) this.statLiveRemaining.innerText = remaining;
      if (this.progressPctText) this.progressPctText.innerText = `${percent}%`;
      if (this.attendanceProgressFill) this.attendanceProgressFill.style.width = `${percent}%`;

      this.updateRosterStats();
    },

    // =========================================================================
    // STEP 5: ATTENDANCE SUMMARY & DOUGHNUT CHART
    // =========================================================================

    renderSummaryReview() {
      const total = this.state.students.length;
      const presentStudents = this.state.students.filter((s) => s.status === "present");
      const absentStudents = this.state.students.filter((s) => s.status === "absent");

      const presentCount = presentStudents.length;
      const absentCount = absentStudents.length;
      const ratePct = total > 0 ? ((presentCount / total) * 100).toFixed(2) : "0.00";

      // Subtitle
      const dateStr = this.formatDateLong(this.state.selectedDate);
      this.summarySubtitleText.innerText = `${this.state.selectedDept.code} • ${this.state.selectedClass.name} • ${this.state.selectedSubject.name} (${dateStr})`;

      // Summary Metric Cards
      this.sumValTotal.innerText = total;
      this.sumValPresent.innerText = presentCount;
      this.sumValAbsent.innerText = absentCount;
      this.sumValRate.innerText = `${ratePct}%`;

      // Doughnut Chart Calculations
      this.summaryChartPct.innerText = `${Math.round(parseFloat(ratePct))}%`;

      const circumference = 2 * Math.PI * 38; // ~238.76
      const presentOffset = circumference - (circumference * (presentCount / total));
      const absentOffset = circumference - (circumference * (absentCount / total));

      this.chartPresentCircle.style.strokeDashoffset = presentOffset;

      // Update Lists
      this.sumPresentBadge.innerText = `${presentCount} Students`;
      this.sumAbsentBadge.innerText = `${absentCount} Students`;

      // Present List
      this.sumPresentList.innerHTML = "";
      if (presentStudents.length === 0) {
        this.sumPresentList.innerHTML = `<div style="padding: 16px; color: var(--text-muted); text-align: center;">No students marked present.</div>`;
      } else {
        presentStudents.forEach((student) => {
          const row = document.createElement("div");
          row.className = "student-row-item";
          row.innerHTML = `
            <span class="row-roll-badge">${student.rollFormatted}</span>
            <span class="row-student-name">${student.name}</span>
            <span style="color: var(--success-dark); font-weight: 700; font-size: 13px;">✓ Present</span>
          `;
          this.sumPresentList.appendChild(row);
        });
      }

      // Absent List
      this.sumAbsentList.innerHTML = "";
      if (absentStudents.length === 0) {
        this.sumAbsentList.innerHTML = `<div style="padding: 16px; color: var(--text-muted); text-align: center;">All students are present (0 absent).</div>`;
      } else {
        absentStudents.forEach((student) => {
          const row = document.createElement("div");
          row.className = "student-row-item";
          row.innerHTML = `
            <span class="row-roll-badge" style="color: var(--danger);">${student.rollFormatted}</span>
            <span class="row-student-name">${student.name}</span>
            <span style="color: var(--danger-dark); font-weight: 700; font-size: 13px;">✕ Absent</span>
          `;
          this.sumAbsentList.appendChild(row);
        });
      }
    },

    // =========================================================================
    // EDIT ATTENDANCE MODAL
    // =========================================================================

    openEditModal() {
      this.editStudentSearch.value = "";
      this.renderEditTableRows("");
      this.modalEditAttendance.classList.remove("hidden");
    },

    renderEditTableRows(query = "") {
      this.editStudentsTbody.innerHTML = "";
      const q = query.toLowerCase().trim();

      const filtered = this.state.students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.roll.toString().includes(q) ||
          s.prn.toLowerCase().includes(q)
      );

      if (filtered.length === 0) {
        this.editStudentsTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 18px;">
              No matching students found.
            </td>
          </tr>
        `;
        return;
      }

      filtered.forEach((student) => {
        const tr = document.createElement("tr");
        const isPresent = student.status === "present";

        tr.innerHTML = `
          <td><strong>${student.rollFormatted}</strong></td>
          <td>${student.name}</td>
          <td>
            <span class="${isPresent ? 'badge-submitted' : 'badge-draft'}">
              ${isPresent ? 'Present' : 'Absent'}
            </span>
          </td>
          <td>
            <button class="btn-toggle-status ${isPresent ? 'is-present' : 'is-absent'}" data-roll="${student.roll}">
              ${isPresent ? 'Switch to Absent' : 'Switch to Present'}
            </button>
          </td>
        `;

        const toggleBtn = tr.querySelector(".btn-toggle-status");
        toggleBtn.addEventListener("click", () => {
          student.status = student.status === "present" ? "absent" : "present";
          this.renderEditTableRows(this.editStudentSearch.value);
        });

        this.editStudentsTbody.appendChild(tr);
      });
    },

    // =========================================================================
    // SAVE ATTENDANCE DRAFT
    // =========================================================================

    openSaveModal() {
      const total = this.state.students.length;
      const presentCount = this.state.students.filter((s) => s.status === "present").length;
      const absentCount = this.state.students.filter((s) => s.status === "absent").length;

      this.saveConfirmDetails.innerHTML = `
        <div class="confirm-details-row">
          <span class="confirm-label">Department</span>
          <span class="confirm-value">${this.state.selectedDept.name} (${this.state.selectedDept.code})</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Class</span>
          <span class="confirm-value">${this.state.selectedClass.name}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Date</span>
          <span class="confirm-value">${this.formatDateLong(this.state.selectedDate)}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Subject</span>
          <span class="confirm-value">${this.state.selectedSubject.name} (${this.state.selectedSubject.code})</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Present Count</span>
          <span class="confirm-value" style="color: var(--success-dark);">${presentCount} Students</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Absent Count</span>
          <span class="confirm-value" style="color: var(--danger-dark);">${absentCount} Students</span>
        </div>
      `;

      this.modalSaveAttendance.classList.remove("hidden");
    },

    async handleSaveDraft() {
      const sessionData = this.buildSessionPayload();
      this.btnConfirmSave.disabled = true;
      this.btnConfirmSave.innerText = "Saving Draft...";

      try {
        const res = await AttendanceService.saveDraft(sessionData);
        this.modalSaveAttendance.classList.add("hidden");
        this.showToast("Attendance saved successfully as draft.", "success");
      } catch (err) {
        this.showToast("Failed to save draft.", "danger");
      } finally {
        this.btnConfirmSave.disabled = false;
        this.btnConfirmSave.innerText = "Save Attendance";
      }
    },

    // =========================================================================
    // SUBMIT ATTENDANCE (FINAL & LOCK)
    // =========================================================================

    openSubmitModal() {
      const total = this.state.students.length;
      const presentCount = this.state.students.filter((s) => s.status === "present").length;
      const absentCount = this.state.students.filter((s) => s.status === "absent").length;
      const ratePct = total > 0 ? ((presentCount / total) * 100).toFixed(2) : "0.00";

      this.submitConfirmDetails.innerHTML = `
        <div class="confirm-details-row">
          <span class="confirm-label">Department</span>
          <span class="confirm-value">${this.state.selectedDept.name} (${this.state.selectedDept.code})</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Class</span>
          <span class="confirm-value">${this.state.selectedClass.name}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Date</span>
          <span class="confirm-value">${this.formatDateLong(this.state.selectedDate)}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Subject</span>
          <span class="confirm-value">${this.state.selectedSubject.name} (${this.state.selectedSubject.code})</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Present Students</span>
          <span class="confirm-value" style="color: var(--success-dark);">${presentCount}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Absent Students</span>
          <span class="confirm-value" style="color: var(--danger-dark);">${absentCount}</span>
        </div>
        <div class="confirm-details-row">
          <span class="confirm-label">Overall Percentage</span>
          <span class="confirm-value" style="color: var(--primary);">${ratePct}%</span>
        </div>
      `;

      this.modalSubmitAttendance.classList.remove("hidden");
    },

    async handleSubmitAttendance() {
      const sessionData = this.buildSessionPayload();
      this.btnConfirmSubmit.disabled = true;
      this.btnConfirmSubmit.innerText = "Submitting...";

      try {
        const res = await AttendanceService.submitAttendance(sessionData);
        this.modalSubmitAttendance.classList.add("hidden");
        this.showToast("Attendance submitted successfully.", "success");
        this.renderRecentAttendance();

        // Reset state & return to home after 1.2 seconds
        setTimeout(() => {
          this.state.selectedDept = null;
          this.state.selectedClass = null;
          this.state.selectedSubject = null;
          this.state.students = [];
          this.goToStep(1);
        }, 1200);

      } catch (err) {
        this.showToast(err.message || "Failed to submit attendance.", "danger");
      } finally {
        this.btnConfirmSubmit.disabled = false;
        this.btnConfirmSubmit.innerText = "Submit Attendance";
      }
    },

    buildSessionPayload() {
      const total = this.state.students.length;
      const presentCount = this.state.students.filter((s) => s.status === "present").length;
      const absentCount = this.state.students.filter((s) => s.status === "absent").length;
      const ratePct = total > 0 ? `${((presentCount / total) * 100).toFixed(2)}%` : "0.00%";

      return {
        department: this.state.selectedDept.code,
        departmentName: this.state.selectedDept.name,
        classId: this.state.selectedClass.name,
        date: this.formatDateISO(this.state.selectedDate),
        dateFormatted: this.formatDateShort(this.state.selectedDate),
        subjectCode: this.state.selectedSubject.code,
        subjectName: this.state.selectedSubject.name,
        totalStudents: total,
        presentCount: presentCount,
        absentCount: absentCount,
        percentage: ratePct,
        students: this.state.students
      };
    },

    // =========================================================================
    // UTILITIES
    // =========================================================================

    formatDateISO(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },

    formatDateShort(date) {
      const day = date.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    },

    formatDateLong(date) {
      const options = { day: "numeric", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-US", options);
    },

    showToast(message, type = "info") {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;

      let icon = "ℹ️";
      if (type === "success") icon = "✓";
      if (type === "danger") icon = "✕";
      if (type === "warning") icon = "⚠️";

      toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
      this.toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    openForClass(classCode, subjectNameOrCode) {
      this.init();
      const today = (typeof AcademicDateUtils !== 'undefined') ? ((typeof AcademicDateUtils !== 'undefined' && typeof AcademicDateUtils.getNow === 'function') ? AcademicDateUtils.getNow() : new Date()) : new Date();
      this.state.selectedDate = today;
      this.state.calendarViewingMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      this.renderCalendar();
      this.updateSelectedDateDisplay();

      const allCards = AttendanceService.getAllClassCards();
      const matched = allCards.find(c => 
        (c.class === classCode || c.class.toLowerCase() === (classCode || '').toLowerCase()) &&
        (!subjectNameOrCode || 
         (c.subject_code && c.subject_code.toLowerCase().includes(subjectNameOrCode.toLowerCase())) || 
         (c.subject_name && c.subject_name.toLowerCase().includes(subjectNameOrCode.toLowerCase())))
      );

      if (matched) {
        this.startAttendanceFromCard(matched);
      } else {
        this.goToStep(3);
      }
    },

};

// Global exports for dashboard interop
window.AttendanceWorkflow = AttendanceWorkflow;
window.CollegeERPApp = AttendanceWorkflow;

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    AttendanceWorkflow.init();
  });
} else {
  AttendanceWorkflow.init();
}
