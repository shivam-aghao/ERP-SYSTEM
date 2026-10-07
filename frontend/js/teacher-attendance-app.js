/**
 * College ERP - Teacher Attendance Management Application Controller
 * Orchestrates navigation, calendar logic, swipe engine, summary review,
 * edit mode, confirmation modals, and persistence.
 */

document.addEventListener("DOMContentLoaded", () => {
  const App = {
    // Current application state
    state: {
      currentStep: 1, // 1: Home, 2: Date, 3: My Class Cards, 4: Attendance (Swipe/Roster), 5: Summary
      selectedDept: null,
      selectedClass: null,
      selectedDate: new Date(),
      calendarViewingMonth: new Date(),
      selectedSubject: null,
      students: [],
      attendanceViewMode: "swipe", // 'swipe' or 'roster'
      isSubmitted: false
    },

    swipeEngine: null,

    async init() {
      AttendanceService.init();
      this.bindDOM();
      this.bindEvents();
      this.startLiveHealthMonitor();
      if (typeof ERP_DATA !== "undefined" && ERP_DATA.initDynamic) {
        await ERP_DATA.initDynamic();
      }
      await this.syncTeacherFromBackend();
      await this.renderRecentAttendance();
      this.renderCalendar();
      this.updateNavigationUI();
    },

    async syncTeacherFromBackend() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/profile/active");
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.fullName) {
            if (typeof ERP_DATA !== "undefined" && ERP_DATA.teacher) {
              ERP_DATA.teacher.name = json.data.fullName;
              ERP_DATA.teacher.id = json.data.empCode || ERP_DATA.teacher.id;
              ERP_DATA.teacher.designation = json.data.designation || ERP_DATA.teacher.designation;
              ERP_DATA.teacher.avatar = json.data.avatar || "JP";
            }
            const nameEl = document.getElementById("teacherName");
            if (nameEl) nameEl.textContent = json.data.fullName;
            const avatarEl = document.getElementById("teacherAvatar");
            if (avatarEl) avatarEl.textContent = json.data.avatar || "JP";
          }
        }
      } catch (e) {
        console.warn("[App] Running in offline fallback mode:", e);
      }
    },

    startLiveHealthMonitor() {
      const updateBadge = (backendOnline, supabaseOnline) => {
        const badge = document.getElementById("erpLiveConnBadge");
        const dot = document.getElementById("liveDot");
        const text = document.getElementById("liveBadgeText");
        if (!badge) return;

        if (backendOnline && supabaseOnline) {
          badge.style.background = "#DCFCE7";
          badge.style.color = "#15803D";
          badge.style.border = "1px solid #86EFAC";
          badge.title = "Connected to Live FastAPI Backend (Port 8000) & Cloud Supabase Database";
          if (dot) {
            dot.style.background = "#22C55E";
            dot.style.boxShadow = "0 0 8px #22C55E";
          }
          if (text) text.textContent = "Live Connected (Backend & Supabase)";
        } else if (supabaseOnline) {
          badge.style.background = "#DCFCE7";
          badge.style.color = "#15803D";
          badge.style.border = "1px solid #86EFAC";
          badge.title = "Connected directly to Cloud Supabase Database";
          if (dot) {
            dot.style.background = "#22C55E";
            dot.style.boxShadow = "0 0 8px #22C55E";
          }
          if (text) text.textContent = "Live Connected (Supabase Cloud)";
        } else if (backendOnline) {
          badge.style.background = "#FEF3C7";
          badge.style.color = "#B45309";
          badge.style.border = "1px solid #FCD34D";
          badge.title = "Connected to Backend, database syncing...";
          if (dot) {
            dot.style.background = "#F59E0B";
            dot.style.boxShadow = "0 0 6px #F59E0B";
          }
          if (text) text.textContent = "Backend Live";
        } else {
          badge.style.background = "#FEE2E2";
          badge.style.color = "#991B1B";
          badge.style.border = "1px solid #FCA5A5";
          badge.title = "Local offline storage mode";
          if (dot) {
            dot.style.background = "#EF4444";
            dot.style.boxShadow = "none";
          }
          if (text) text.textContent = "Offline Mode";
        }
      };

      const checkHealth = async () => {
        try {
          if (window.ErpApi && typeof window.ErpApi.checkHealth === "function") {
            const { backendOnline, supabaseOnline } = await window.ErpApi.checkHealth();
            updateBadge(backendOnline, supabaseOnline);
          }
        } catch (e) {
          updateBadge(false, false);
        }
      };

      checkHealth();
      setInterval(checkHealth, 3500);
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

      // Modals: Student Report & Teacher Conducted Classes
      this.btnOpenStudentSearchModal = document.getElementById("btnOpenStudentSearchModal");
      this.modalStudentReport = document.getElementById("modalStudentReport");
      this.reportStudentSearchInput = document.getElementById("reportStudentSearchInput");
      this.btnExecuteStudentSearch = document.getElementById("btnExecuteStudentSearch");
      this.studentSearchResultsBox = document.getElementById("studentSearchResultsBox");
      this.studentSearchResultsChips = document.getElementById("studentSearchResultsChips");
      this.studentReportContent = document.getElementById("studentReportContent");
      this.studentReportPlaceholder = document.getElementById("studentReportPlaceholder");

      this.btnOpenTeacherReportModal = document.getElementById("btnOpenTeacherReportModal");
      this.modalTeacherReport = document.getElementById("modalTeacherReport");
      this.trFilterClass = document.getElementById("trFilterClass");
      this.btnRefreshTeacherReport = document.getElementById("btnRefreshTeacherReport");

      this.btnDownloadStudentPdf = document.getElementById("btnDownloadStudentPdf");
      this.btnDownloadTeacherPdf = document.getElementById("btnDownloadTeacherPdf");

      // PDF Reports Center & Quick Access Elements
      this.btnHeaderPdfReports = document.getElementById("btnHeaderPdfReports");
      this.navSidebarPdfReports = document.getElementById("navSidebarPdfReports");
      this.modalPdfCenter = document.getElementById("modalPdfCenter");
      this.btnPdfCenterOpenStudent = document.getElementById("btnPdfCenterOpenStudent");
      this.btnPdfCenterDownloadTeacher = document.getElementById("btnPdfCenterDownloadTeacher");
      this.btnDownloadSessionSummaryPdf = document.getElementById("btnDownloadSessionSummaryPdf");

      // Modal Class Card extra fields
      this.cardModalType = document.getElementById("cardModalType");
      this.groupReplacedTeacher = document.getElementById("groupReplacedTeacher");
      this.cardModalReplacedTeacher = document.getElementById("cardModalReplacedTeacher");
      this.groupAdjustmentReason = document.getElementById("groupAdjustmentReason");
      this.cardModalReason = document.getElementById("cardModalReason");
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
        const now = new Date();
        this.state.calendarViewingMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        this.state.selectedDate = now;
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

      // Card Type (Extra vs Replacement) change toggle
      if (this.cardModalType) {
        this.cardModalType.addEventListener("change", () => {
          const isReplacement = this.cardModalType.value === "replacement";
          if (this.groupReplacedTeacher) this.groupReplacedTeacher.classList.toggle("hidden", !isReplacement);
          if (this.groupAdjustmentReason) this.groupAdjustmentReason.classList.toggle("hidden", !isReplacement);
        });
      }

      // Student Search & Attendance Report Modal
      if (this.btnOpenStudentSearchModal) {
        this.btnOpenStudentSearchModal.addEventListener("click", () => {
          this.openStudentSearchModal();
        });
      }
      if (this.btnExecuteStudentSearch) {
        this.btnExecuteStudentSearch.addEventListener("click", () => {
          this.executeStudentSearch();
        });
      }
      if (this.reportStudentSearchInput) {
        this.reportStudentSearchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this.executeStudentSearch();
        });
      }

      // Teacher Conducted Classes Report Modal
      if (this.btnOpenTeacherReportModal) {
        this.btnOpenTeacherReportModal.addEventListener("click", () => {
          this.openTeacherReportModal();
        });
      }
      if (this.btnRefreshTeacherReport) {
        this.btnRefreshTeacherReport.addEventListener("click", () => {
          this.loadTeacherReportData();
        });
      }
      if (this.trFilterClass) {
        this.trFilterClass.addEventListener("change", () => {
          this.loadTeacherReportData();
        });
      }

      // PDF Download Button Handlers
      if (this.btnDownloadStudentPdf) {
        this.btnDownloadStudentPdf.addEventListener("click", () => {
          this.downloadStudentReportPdf();
        });
      }
      if (this.btnDownloadTeacherPdf) {
        this.btnDownloadTeacherPdf.addEventListener("click", () => {
          this.downloadTeacherReportPdf();
        });
      }

      // PDF Reports Center & Header / Sidebar Handlers
      if (this.btnHeaderPdfReports) {
        this.btnHeaderPdfReports.addEventListener("click", () => {
          if (this.modalPdfCenter) this.modalPdfCenter.classList.remove("hidden");
        });
      }
      if (this.navSidebarPdfReports) {
        this.navSidebarPdfReports.addEventListener("click", (e) => {
          e.preventDefault();
          if (this.modalPdfCenter) this.modalPdfCenter.classList.remove("hidden");
        });
      }
      if (this.btnPdfCenterOpenStudent) {
        this.btnPdfCenterOpenStudent.addEventListener("click", () => {
          if (this.modalPdfCenter) this.modalPdfCenter.classList.add("hidden");
          this.openStudentSearchModal();
        });
      }
      const tileStudent = document.getElementById("tileStudentReport");
      if (tileStudent) {
        tileStudent.addEventListener("click", () => {
          if (this.modalPdfCenter) this.modalPdfCenter.classList.add("hidden");
          this.openStudentSearchModal();
        });
      }
      if (this.btnPdfCenterDownloadTeacher) {
        this.btnPdfCenterDownloadTeacher.addEventListener("click", () => {
          this.downloadTeacherReportPdf();
        });
      }
      const tileTeacher = document.getElementById("tileTeacherReport");
      if (tileTeacher) {
        tileTeacher.addEventListener("click", () => {
          this.downloadTeacherReportPdf();
        });
      }
      if (this.btnDownloadSessionSummaryPdf) {
        this.btnDownloadSessionSummaryPdf.addEventListener("click", () => {
          this.downloadSessionSummaryPdf();
        });
      }

      // Quick PDF Download buttons from header cards
      document.querySelectorAll(".btn-download-student-pdf-quick").forEach((btn) => {
        btn.addEventListener("click", () => this.downloadStudentReportPdf());
      });
      document.querySelectorAll(".btn-download-teacher-pdf-quick").forEach((btn) => {
        btn.addEventListener("click", () => this.downloadTeacherReportPdf());
      });

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

      // Attendance Group Sub-Navigation Items (Cards, Student Records, Lecture Report)
      const navToggleAttendance = document.getElementById("navToggleAttendance");
      const navSubListAttendance = document.getElementById("navSubListAttendance");
      const chevronAttendance = document.getElementById("chevronAttendance");

      if (navToggleAttendance) {
        navToggleAttendance.addEventListener("click", (e) => {
          e.preventDefault();
          if (navSubListAttendance) {
            const isHidden = navSubListAttendance.style.display === "none";
            navSubListAttendance.style.display = isHidden ? "flex" : "none";
            if (chevronAttendance) {
              chevronAttendance.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
            }
          }
        });
      }

      const navSubCards = document.getElementById("navSubCards");
      if (navSubCards) {
        navSubCards.addEventListener("click", (e) => {
          e.preventDefault();
          this.setActiveSubNav("cards");
          this.goToStep(3);
        });
      }

      const navSubStudentRecords = document.getElementById("navSubStudentRecords");
      if (navSubStudentRecords) {
        navSubStudentRecords.addEventListener("click", (e) => {
          e.preventDefault();
          this.setActiveSubNav("student-records");
          this.openStudentSearchModal();
        });
      }

      const navSubLectureReport = document.getElementById("navSubLectureReport");
      if (navSubLectureReport) {
        navSubLectureReport.addEventListener("click", (e) => {
          e.preventDefault();
          this.setActiveSubNav("lecture-report");
          this.openTeacherReportModal();
        });
      }

      // Sidebar links
      document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          if (link.id === "navToggleAttendance") return;
          const nav = link.getAttribute("data-nav");
          document.querySelectorAll(".sidebar .nav-item").forEach((item) => item.classList.remove("active"));
          link.closest(".nav-item").classList.add("active");
          if (nav === "attendance") {
            this.goToStep(1);
          } else if (nav === "dashboard") {
            if (window.parent && window.parent.TeacherApp && window.self !== window.top) {
              window.parent.TeacherApp.switchView("dashboard");
            } else {
              window.location.href = "teacher-dashboard.html";
            }
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
      document.getElementById("headerLogoutBtn").addEventListener("click", logoutAction);
      document.getElementById("sidebarLogoutBtn").addEventListener("click", logoutAction);
    },

    setActiveSubNav(subType) {
      const subItems = [
        { id: "navSubCards", type: "cards" },
        { id: "navSubStudentRecords", type: "student-records" },
        { id: "navSubLectureReport", type: "lecture-report" }
      ];
      subItems.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
          if (item.type === subType) {
            el.classList.add("active");
            el.style.color = "#FFFFFF";
            el.style.fontWeight = "600";
            el.style.background = "rgba(56, 189, 248, 0.15)";
            const dot = el.querySelector("span:first-child");
            if (dot) dot.style.color = "#38BDF8";
          } else {
            el.classList.remove("active");
            el.style.color = "#94A3B8";
            el.style.fontWeight = "500";
            el.style.background = "transparent";
            const dot = el.querySelector("span:first-child");
            if (dot) dot.style.color = "#64748B";
          }
        }
      });
      document.querySelectorAll(".sidebar .nav-item").forEach((item) => item.classList.remove("active"));
      const navGroupAttendance = document.getElementById("navGroupAttendance");
      if (navGroupAttendance) navGroupAttendance.classList.add("active");
    },

    async goToStep(stepNumber) {
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
        await this.initStudentAttendance();
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

    async renderRecentAttendance() {
      const records = await AttendanceService.getAllRecords();
      this.recentAttendanceTbody.innerHTML = "";

      // Dynamically compute Home Hero metrics from real database records
      const statToday = document.getElementById("statTodayCount");
      const statAvg = document.getElementById("statAvgAttendance");
      if (statToday) statToday.textContent = records.length;
      if (statAvg) {
        if (records.length > 0) {
          const sumPct = records.reduce((acc, r) => acc + (parseFloat(r.attendanceRate || r.percentage) || 0), 0);
          statAvg.textContent = `${Math.round(sumPct / records.length)}%`;
        } else {
          statAvg.textContent = "0%";
        }
      }

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
              ${record.status === 'Submitted' ? 'Submitted' : 'Draft'}
            </span>
          </td>
          <td style="color: var(--text-muted); font-size: 12px;">${record.savedAt || 'Recently'}</td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="btn-table-action btn-view-record" data-id="${record.id}">View</button>
              <button class="btn-table-action btn-download-record-pdf" style="background: #0B5CAD; color: #fff; font-weight: 700; border: none; cursor: pointer;" data-id="${record.id}">PDF</button>
            </div>
          </td>
        `;

        tr.querySelector(".btn-view-record").addEventListener("click", () => {
          this.viewExistingRecord(record);
        });

        tr.querySelector(".btn-download-record-pdf").addEventListener("click", () => {
          this.downloadSingleRecordPdf(record);
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

      const today = new Date();

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
        const cards = await AttendanceService.getAllClassCards();

        this.classCardsGrid.innerHTML = "";

        if (!cards || cards.length === 0) {
          this.classCardsEmptyState.classList.remove("hidden");
          return;
        }

        this.classCardsEmptyState.classList.add("hidden");

        cards.forEach((card) => {
          const deptObj = (ERP_DATA.departments || []).find((d) => d.code === card.department);
          const deptColor = deptObj ? deptObj.color : "#0B5CAD";
          const isScheduled = card.card_type === "scheduled";
          const typeBadgeHtml = isScheduled
            ? `<span class="card-badge-pill" style="border-color: #22C55E40; color: #15803D; background-color: #DCFCE7; font-weight: 700;">Timetable Scheduled</span>`
            : `<span class="card-badge-pill" style="border-color: #F59E0B40; color: #B45309; background-color: #FEF3C7; font-weight: 700;">Extra / Replacement</span>`;

          const cardEl = document.createElement("div");
          cardEl.className = "my-class-card";
          cardEl.dataset.cardId = card.id;

          cardEl.innerHTML = `
            <div>
              <div class="card-top-row" style="align-items: flex-start; gap: 6px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <span class="card-badge-pill" style="border-color: ${deptColor}40; color: ${deptColor}; background-color: ${deptColor}15;">
                    ${card.department}
                  </span>
                  ${typeBadgeHtml}
                </div>
                <div class="card-menu-container">
                  <button class="card-menu-btn" title="Options" aria-label="Card Options">⋮</button>
                  <div class="card-menu-dropdown">
                    <button class="card-menu-item btn-card-edit" type="button">
                      Edit Card
                    </button>
                    <button class="card-menu-item danger btn-card-delete" type="button">
                      Delete Card
                    </button>
                  </div>
                </div>
              </div>

              <div class="card-body-content" style="margin-top: 10px;">
                <div class="card-class-heading">Class ${card.class}</div>
                <div class="card-subject-name">${card.subject_name}</div>
                <div class="card-subject-code">${card.subject_code}</div>
                ${card.time_slot ? `<div style="font-size: 11.5px; color: #475569; margin-top: 6px; font-weight: 600; display: flex; align-items: center; gap: 4px;">${card.time_slot}</div>` : ''}
              </div>
            </div>

            <div class="card-footer-meta" style="margin-top: 12px;">
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

    async startAttendanceFromCard(card) {
      const deptObj = (ERP_DATA.departments || []).find((d) => d.code === card.department) || {
        id: card.department,
        code: card.department,
        name: card.department_name || card.department,
        color: "#0B5CAD"
      };

      const classList = (ERP_DATA.classes && ERP_DATA.classes[card.department]) || [];
      const classObj = classList.find((c) => c.name === card.class || c.id === card.class) || {
        id: card.class,
        name: card.class,
        year: "",
        studentCount: 60
      };

      const subjectList = (ERP_DATA.subjects && ERP_DATA.subjects[card.department]) || [];
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
      const isDuplicate = await AttendanceService.checkDuplicate(
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

      this.showToast(`Loading enrolled students for ${classObj.name}...`, "info");
      this.state.students = await ERP_DATA.fetchStudentRoster(deptObj.code, classObj.name || classObj.id);
      if (!this.state.students || this.state.students.length === 0) {
        this.state.students = await ERP_DATA.fetchStudentRoster(deptObj.code, "SY-CSE-A");
      }
      this.showToast(`Loaded ${this.state.students.length} students from database`, "success");
      this.goToStep(4);
    },

    async openCreateCardModal() {
      this.cardModalTitle.innerText = "Create Extra / Replacement Class Card";
      this.cardModalCardId.value = "";
      this.cardModalError.classList.add("hidden");

      if (this.cardModalType) {
        this.cardModalType.value = "extra";
      }
      if (this.groupReplacedTeacher) this.groupReplacedTeacher.classList.add("hidden");
      if (this.groupAdjustmentReason) this.groupAdjustmentReason.classList.add("hidden");
      if (this.cardModalReason) this.cardModalReason.value = "";

      // Populate Teachers list for replacement dropdown
      if (this.cardModalReplacedTeacher) {
        this.cardModalReplacedTeacher.innerHTML = `<option value="">-- Select Professor Replaced --</option>`;
        try {
          const teachers = await window.ErpApi.getTeachers();
          teachers.forEach((t) => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.innerText = `${t.name} (${t.employeeId || 'Faculty'})`;
            this.cardModalReplacedTeacher.appendChild(opt);
          });
        } catch (e) {
          console.warn("Failed to load teachers for replacement modal:", e);
        }
      }

      // Populate Department / Program dropdown
      this.cardModalDept.innerHTML = `<option value="">-- Select Program --</option>`;
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

      const cardType = this.cardModalType?.value || "extra";
      const replacedTeacherId = this.cardModalReplacedTeacher?.value || null;
      const adjustmentReason = this.cardModalReason?.value || null;

      const cardPayload = {
        department: deptCode,
        department_name: deptObj ? deptObj.name : deptCode,
        class: classId,
        subject_code: subjectCode,
        subject_name: subjectName,
        card_type: cardType,
        replacedTeacherId: replacedTeacherId,
        adjustmentReason: adjustmentReason
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

    async initStudentAttendance() {
      // Check if students array is already initialized for this class session
      if (!this.state.students || this.state.students.length === 0) {
        if (ERP_DATA.fetchStudentRoster) {
          const classIdent = this.state.selectedClass.name || this.state.selectedClass.id;
          const deptIdent = this.state.selectedDept.code || "CSE";
          this.state.students = await ERP_DATA.fetchStudentRoster(deptIdent, classIdent);
        }
        if (!this.state.students || this.state.students.length === 0) {
          this.state.students = ERP_DATA.generateStudentRoster(
            this.state.selectedDept.code,
            this.state.selectedClass.id
          );
        }
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
<<<<<<< HEAD
      const rollNo = student.rollNo || student.roll || (student.rollFormatted ? student.rollFormatted.replace("ROLL ", "") : srNo);
      const studentCode = student.studentCode || student.enrollmentNo || student.prn || student.code || "-";
=======
      const rollNo = student.rollFormatted ? student.rollFormatted.replace("ROLL ", "") : `${student.roll || srNo}`;
      const studentCode = student.studentCode || student.student_code || student.prn || student.code || `STU-${student.roll || srNo}`;
>>>>>>> 9ecf21c236e1425e37789315b9bca71c89a6ca6d

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

      let icon = "i";
      if (type === "success") icon = "✓";
      if (type === "danger") icon = "✕";
      if (type === "warning") icon = "!";

      toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
      this.toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    // =========================================================================
    // STUDENT SEARCH & ATTENDANCE REPORT & DATA CORNER
    // =========================================================================

    openStudentSearchModal() {
      if (this.modalStudentReport) {
        this.modalStudentReport.classList.remove("hidden");
        if (this.reportStudentSearchInput) {
          this.reportStudentSearchInput.value = "";
          this.reportStudentSearchInput.focus();
        }
        if (this.studentSearchResultsBox) this.studentSearchResultsBox.classList.add("hidden");
        if (this.studentReportContent) this.studentReportContent.classList.add("hidden");
        if (this.studentReportPlaceholder) this.studentReportPlaceholder.classList.remove("hidden");
      }
    },

    async executeStudentSearch() {
      const query = (this.reportStudentSearchInput?.value || "").trim();
      if (!query) {
        this.showToast("Please enter student Name, Roll No., or SIS ID", "warning");
        return;
      }

      this.btnExecuteStudentSearch.disabled = true;
      this.btnExecuteStudentSearch.innerText = "Searching...";

      try {
        const results = await window.ErpApi.searchStudent(query);
        this.studentSearchResultsChips.innerHTML = "";

        if (!results || results.length === 0) {
          // If no search matches, try direct report lookup
          await this.loadStudentReport(query);
          return;
        }

        if (results.length === 1) {
          await this.loadStudentReport(results[0].sisId || results[0].rollNo || results[0].id);
          return;
        }

        // Show chips for multiple results
        this.studentSearchResultsBox.classList.remove("hidden");
        results.forEach((s) => {
          const chip = document.createElement("button");
          chip.className = "btn-table-action";
          chip.style.cssText = "font-size: 12px; padding: 4px 10px; background: #fff; border: 1px solid #CBD5E1; border-radius: 6px; cursor: pointer;";
          chip.innerHTML = `<strong>${s.name}</strong> (Roll: ${s.rollNo} • SIS: ${s.sisId})`;
          chip.addEventListener("click", () => {
            this.loadStudentReport(s.sisId || s.rollNo || s.id);
          });
          this.studentSearchResultsChips.appendChild(chip);
        });

      } catch (err) {
        console.error("Student search error:", err);
        this.showToast("Failed to search students.", "danger");
      } finally {
        this.btnExecuteStudentSearch.disabled = false;
        this.btnExecuteStudentSearch.innerText = "Search";
      }
    },

    async loadStudentReport(identifier) {
      this.showToast(`Loading report for student: ${identifier}...`, "info");
      try {
        const data = await window.ErpApi.getStudentReport(identifier);
        if (!data || !data.student) {
          this.showToast(`No report records found for '${identifier}'`, "warning");
          return;
        }

        this.currentStudentReportData = data;

        // Fill Student Header
        document.getElementById("stReportName").innerText = data.student.name || "-";
        document.getElementById("stReportRoll").innerText = data.student.rollNo ?? "-";
        document.getElementById("stReportSis").innerText = data.student.sisId || data.student.enrollmentNo || "-";
        document.getElementById("stReportClass").innerText = data.student.classCode || "2R1";
        document.getElementById("stReportDept").innerText = data.student.program || "CSE";
        
        const overallRate = data.student.overallAttendanceRate ?? 0;
        const rateBadge = document.getElementById("stReportRateBadge");
        rateBadge.innerText = `${overallRate}%`;
        rateBadge.style.color = overallRate >= 75 ? "#16A34A" : (overallRate >= 60 ? "#D97706" : "#DC2626");

        document.getElementById("stReportLectureRatio").innerText = `${data.student.totalClassesAttended} / ${data.student.totalClassesConducted} Attended`;

        // Fill Course Breakdown
        const courseTbody = document.getElementById("stReportCourseTableBody");
        courseTbody.innerHTML = "";
        const summaries = data.courseWiseSummary || [];
        if (summaries.length === 0) {
          courseTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748B; padding: 16px;">No course lectures recorded yet.</td></tr>`;
        } else {
          summaries.forEach((c) => {
            const tr = document.createElement("tr");
            const pctColor = c.percentage >= 75 ? "#15803D" : (c.percentage >= 60 ? "#B45309" : "#B91C1C");
            tr.innerHTML = `
              <td><strong style="color: #0B5CAD;">${c.courseCode}</strong></td>
              <td style="font-weight: 600;">${c.courseName}</td>
              <td style="color: #475569;">${c.teacherName}</td>
              <td style="text-align: center;">${c.totalLectures}</td>
              <td style="text-align: center; font-weight: 600;">${c.presentLectures}</td>
              <td style="text-align: right; font-weight: 700; color: ${pctColor};">${c.percentage}%</td>
            `;
            courseTbody.appendChild(tr);
          });
        }

        // Fill Student Data Corner (Certificates & Courses)
        const certsCount = document.getElementById("stReportCertsCount");
        const certsGrid = document.getElementById("stReportCertificatesGrid");
        certsGrid.innerHTML = "";
        const certs = data.certifications || [];
        certsCount.innerText = `${certs.length} Uploaded`;

        if (certs.length === 0) {
          certsGrid.innerHTML = `<div style="grid-column: 1 / -1; font-size: 12.5px; color: #64748B; padding: 12px; background: #fff; border-radius: 6px; border: 1px dashed #CBD5E1; text-align: center;">No student certifications or completed course documents uploaded yet.</div>`;
        } else {
          certs.forEach((cert) => {
            const card = document.createElement("div");
            card.style.cssText = "background: #fff; border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;";
            card.innerHTML = `
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
                  <span style="font-size: 10px; font-weight: 700; background: #ECFDF5; color: #059669; padding: 2px 6px; border-radius: 4px; border: 1px solid #A7F3D0;">${cert.type || 'Certification'}</span>
                  <span style="font-size: 11px; color: #64748B;">${cert.issue_date || ''}</span>
                </div>
                <div style="font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.3; margin-bottom: 4px;">${cert.title}</div>
                <div style="font-size: 11.5px; color: #475569;">${cert.issuing_authority || 'Accredited Authority'}</div>
                ${cert.score ? `<div style="font-size: 11px; color: #0284C7; margin-top: 4px; font-weight: 600;">Score/Grade: ${cert.score}</div>` : ''}
              </div>
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10.5px; color: #64748B; font-family: monospace;">${cert.credential_id || 'ID Verified'}</span>
                ${cert.url && cert.url !== '#' ? `<a href="${cert.url}" target="_blank" style="font-size: 11px; font-weight: 600; color: #0B5CAD; text-decoration: none;">Verify</a>` : '<span style="font-size: 10px; color: #10B981; font-weight: 600;">Verified</span>'}
              </div>
            `;
            certsGrid.appendChild(card);
          });
        }

        // Fill Detailed History Log
        const historyTbody = document.getElementById("stReportDetailedHistoryBody");
        historyTbody.innerHTML = "";
        const history = data.detailedHistory || [];
        if (history.length === 0) {
          historyTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748B; padding: 16px;">No lecture logs recorded yet.</td></tr>`;
        } else {
          history.forEach((h) => {
            const tr = document.createElement("tr");
            const isP = h.status === "PRESENT" || h.status === "P";
            tr.innerHTML = `
              <td><strong>${h.date}</strong></td>
              <td style="color: #475569;">${h.timeSlot}</td>
              <td><span style="font-weight: 600;">${h.courseName}</span> <span style="font-size: 11px; color: #64748B;">(${h.courseCode})</span></td>
              <td style="color: #475569;">${h.teacherName}</td>
              <td>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; ${isP ? 'background: #DCFCE7; color: #15803D;' : 'background: #FEE2E2; color: #B91C1C;'}">
                  ${isP ? 'PRESENT' : 'ABSENT'}
                </span>
              </td>
              <td style="color: #475569; font-size: 11.5px;">${h.remarks || '-'}</td>
            `;
            historyTbody.appendChild(tr);
          });
        }

        // Switch View
        this.studentReportPlaceholder.classList.add("hidden");
        this.studentReportContent.classList.remove("hidden");

      } catch (err) {
        console.error("Load student report error:", err);
        this.showToast("Failed to load student report.", "danger");
      }
    },

    // =========================================================================
    // TEACHER CONDUCTED CLASSES REPORT
    // =========================================================================

    openTeacherReportModal() {
      if (this.modalTeacherReport) {
        this.modalTeacherReport.classList.remove("hidden");
        this.loadTeacherReportData();
      }
    },

    async loadTeacherReportData() {
      const classCode = this.trFilterClass?.value || "";
      try {
        const data = await window.ErpApi.getTeacherClassesReport("me", "", classCode);
        if (!data || !data.teacher) return;

        this.currentTeacherReportData = data;

        document.getElementById("trReportName").innerText = data.teacher.name || (ERP_DATA.teacher?.name || "Faculty");
        document.getElementById("trReportEmpId").innerText = data.teacher.employeeId || (ERP_DATA.teacher?.id || "");
        document.getElementById("trReportTitle").innerText = data.teacher.title || (ERP_DATA.teacher?.designation || "Faculty");
        document.getElementById("trReportTotalCount").innerText = data.teacher.totalLecturesConducted ?? 0;
        document.getElementById("trReportAvgRate").innerText = `${data.teacher.averageAttendanceRate ?? 0}%`;

        const tbody = document.getElementById("trReportClassesTableBody");
        tbody.innerHTML = "";
        const classes = data.conductedClasses || [];
        if (classes.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748B; padding: 20px;">No classes conducted match the selected filter.</td></tr>`;
          return;
        }

        classes.forEach((c) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><strong>${c.date}</strong></td>
            <td style="color: #475569;">${c.timeSlot}</td>
            <td><strong style="color: #0B5CAD;">${c.classCode}</strong></td>
            <td><span style="font-weight: 600;">${c.courseName}</span> <span style="font-size: 11px; color: #64748B;">(${c.courseCode})</span></td>
            <td style="color: #475569; font-size: 12px;">${c.topic}</td>
            <td style="text-align: center;"><strong>${c.presentCount}</strong> / ${c.totalStudents}</td>
            <td style="text-align: right; font-weight: 700; color: ${c.attendanceRate >= 75 ? '#15803D' : '#B45309'};">${c.attendanceRate}%</td>
          `;
          tbody.appendChild(tr);
        });

      } catch (err) {
        console.error("Teacher conducted classes report error:", err);
      }
    },

    // =========================================================================
    // PDF GENERATION & EXPORT ENGINE
    // =========================================================================

    downloadStudentReportPdf() {
      if (!this.currentStudentReportData || !this.currentStudentReportData.student) {
        this.showToast("Please search and load a student record first.", "warning");
        return;
      }

      const data = this.currentStudentReportData;
      const st = data.student;
      const summaries = data.courseWiseSummary || [];
      const certs = data.certifications || [];
      const history = data.detailedHistory || [];

      const overallRate = st.overallAttendanceRate ?? 0;
      const rateColor = overallRate >= 75 ? "#15803D" : (overallRate >= 60 ? "#B45309" : "#B91C1C");

      // Course breakdown rows
      let courseRows = "";
      if (summaries.length === 0) {
        courseRows = `<tr><td colspan="6" style="padding: 10px; text-align: center; color: #64748B;">No course attendance records found.</td></tr>`;
      } else {
        summaries.forEach((c) => {
          const cRateColor = c.percentage >= 75 ? "#15803D" : (c.percentage >= 60 ? "#B45309" : "#B91C1C");
          courseRows += `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 8px 10px; font-weight: 700; color: #0B5CAD;">${c.courseCode}</td>
              <td style="padding: 8px 10px; font-weight: 600;">${c.courseName}</td>
              <td style="padding: 8px 10px; color: #475569;">${c.teacherName}</td>
              <td style="padding: 8px 10px; text-align: center;">${c.totalLectures}</td>
              <td style="padding: 8px 10px; text-align: center; font-weight: 600;">${c.presentLectures}</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: ${cRateColor};">${c.percentage}%</td>
            </tr>
          `;
        });
      }

      // Certifications cards
      let certsHtml = "";
      if (certs.length === 0) {
        certsHtml = `<div style="padding: 10px; font-size: 11.5px; color: #64748B; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; text-align: center;">No student certifications or completed course documents uploaded.</div>`;
      } else {
        certsHtml = `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">`;
        certs.forEach((crt) => {
          certsHtml += `
            <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 700; background: #DCFCE7; color: #15803D; padding: 2px 6px; border-radius: 4px;">${crt.type || 'Verified'}</span>
                <span style="font-size: 10.5px; color: #64748B;">${crt.issue_date || ''}</span>
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 2px;">${crt.title}</div>
              <div style="font-size: 11px; color: #475569;">${crt.issuing_authority || 'Accredited Authority'}</div>
              ${crt.score ? `<div style="font-size: 10.5px; color: #0284C7; font-weight: 600; margin-top: 2px;">Grade/Score: ${crt.score}</div>` : ''}
              <div style="font-size: 10px; color: #64748B; font-family: monospace; margin-top: 4px;">ID: ${crt.credential_id || 'VERIFIED'}</div>
            </div>
          `;
        });
        certsHtml += `</div>`;
      }

      // Detailed date-wise lecture history rows
      let historyRows = "";
      if (history.length === 0) {
        historyRows = `<tr><td colspan="6" style="padding: 10px; text-align: center; color: #64748B;">No date-wise lecture records available.</td></tr>`;
      } else {
        history.forEach((h) => {
          const isP = (h.status === "PRESENT" || h.status === "P");
          const badgeStyle = isP
            ? "background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC;"
            : "background: #FEE2E2; color: #B91C1C; border: 1px solid #FCA5A5;";
          historyRows += `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 6px 8px; font-weight: 600;">${h.date}</td>
              <td style="padding: 6px 8px; color: #475569;">${h.timeSlot}</td>
              <td style="padding: 6px 8px;"><span style="font-weight: 600;">${h.courseName}</span> <span style="font-size: 10px; color: #64748B;">(${h.courseCode})</span></td>
              <td style="padding: 6px 8px; color: #475569;">${h.teacherName}</td>
              <td style="padding: 6px 8px; text-align: center;">
                <span style="display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700; ${badgeStyle}">
                  ${isP ? 'PRESENT' : 'ABSENT'}
                </span>
              </td>
              <td style="padding: 6px 8px; color: #475569;">${h.remarks || '-'}</td>
            </tr>
          `;
        });
      }

      const safeName = (st.name || "Student").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${safeName}_Attendance_Record.pdf`;
      const docTitle = `${st.name} - Official Student Attendance Record`;

      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; padding: 20px; max-width: 800px; margin: 0 auto; background: #fff;">
          <!-- Institution Letterhead -->
          <div style="border-bottom: 2.5px solid #0B5CAD; padding-bottom: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; background: #0B1F3A; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; border: 2px solid #F59E0B;">
                SSGM
              </div>
              <div>
                <h1 style="font-size: 16px; font-weight: 800; color: #0B1F3A; margin: 0; line-height: 1.2;">SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING</h1>
                <div style="font-size: 11px; font-weight: 600; color: #64748B; margin-top: 2px;">SHEGAON, MAHARASHTRA • (An Autonomous Institute)</div>
                <div style="font-size: 10.5px; font-weight: 700; color: #0B5CAD; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
                  EMPLOYEE ATTENDANCE ERP • INDIVIDUAL STUDENT RECORD
                </div>
              </div>
            </div>
            <div style="text-align: right; font-size: 10.5px; color: #64748B;">
              <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div><strong>Academic Session:</strong> 2024-2025</div>
              <div style="color: #10B981; font-weight: 700;">Official Record</div>
            </div>
          </div>

          <!-- Student Profile & Overall Attendance Summary -->
          <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748B;">Student Demographic Profile</div>
              <h2 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 2px 0 6px 0;">${st.name}</h2>
              <div style="display: flex; gap: 14px; font-size: 11.5px; color: #334155;">
                <span><strong>Roll No:</strong> ${st.rollNo}</span>
                <span>•</span>
                <span><strong>SIS / Enrollment No:</strong> ${st.sisId || st.enrollmentNo || '-'}</span>
                <span>•</span>
                <span><strong>Class:</strong> ${st.classCode || '2R1'}</span>
                <span>•</span>
                <span><strong>Program:</strong> ${st.program || 'CSE'}</span>
              </div>
            </div>
            <div style="background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 8px 16px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Overall Attendance Rate</div>
              <div style="font-size: 24px; font-weight: 900; color: ${rateColor}; line-height: 1.1; margin: 2px 0;">${overallRate}%</div>
              <div style="font-size: 11px; font-weight: 600; color: #475569;">${st.totalClassesAttended} / ${st.totalClassesConducted} Attended</div>
            </div>
          </div>

          <!-- Section 1: Course & Employee Breakdown Table -->
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12.5px; font-weight: 700; color: #0B1F3A; margin-bottom: 6px; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px;">
              1. Course-wise & Employee Breakdown
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
              <thead>
                <tr style="background: #F1F5F9; color: #334155; border-bottom: 1.5px solid #CBD5E1;">
                  <th style="padding: 7px 8px;">Course Code</th>
                  <th style="padding: 7px 8px;">Course Name</th>
                  <th style="padding: 7px 8px;">Employee / Teacher</th>
                  <th style="padding: 7px 8px; text-align: center;">Conducted</th>
                  <th style="padding: 7px 8px; text-align: center;">Attended</th>
                  <th style="padding: 7px 8px; text-align: right;">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${courseRows}
              </tbody>
            </table>
          </div>

          <!-- Section 2: Student Data Corner (Certificates) -->
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12.5px; font-weight: 700; color: #0B1F3A; margin-bottom: 6px; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px;">
              2. Student Data Corner — Industry Certifications & Completed Courses
            </div>
            ${certsHtml}
          </div>

          <!-- Section 3: Date-wise Lecture Log Table -->
          <div style="margin-bottom: 22px;">
            <div style="font-size: 12.5px; font-weight: 700; color: #0B1F3A; margin-bottom: 6px; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px;">
              3. Date-wise Lecture Attendance Log
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; text-align: left;">
              <thead>
                <tr style="background: #F1F5F9; color: #334155; border-bottom: 1.5px solid #CBD5E1;">
                  <th style="padding: 6px 8px;">Date</th>
                  <th style="padding: 6px 8px;">Time Slot</th>
                  <th style="padding: 6px 8px;">Course</th>
                  <th style="padding: 6px 8px;">Employee / Teacher</th>
                  <th style="padding: 6px 8px; text-align: center;">Status</th>
                  <th style="padding: 6px 8px;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${historyRows}
              </tbody>
            </table>
          </div>

          <!-- Sign-off Block -->
          <div style="margin-top: 30px; padding-top: 14px; border-top: 1.5px dashed #CBD5E1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; font-size: 11px; color: #475569;">
            <div>
              <div style="height: 32px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Class Teacher</div>
              <div>Dept. of CSE</div>
            </div>
            <div>
              <div style="height: 32px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Head of Program</div>
              <div>Computer Science & Engg.</div>
            </div>
            <div>
              <div style="height: 32px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Dean Academics</div>
              <div>SSGMCE Shegaon</div>
            </div>
          </div>
        </div>
      `;

      this.triggerPdfDownload(html, fileName, docTitle);
    },

    async downloadTeacherReportPdf() {
      if (!this.currentTeacherReportData || !this.currentTeacherReportData.teacher) {
        this.showToast("Loading employee conducted classes log...", "info");
        await this.loadTeacherReportData();
      }
      if (!this.currentTeacherReportData || !this.currentTeacherReportData.teacher) {
        this.showToast("Unable to load teacher report data.", "danger");
        return;
      }

      const data = this.currentTeacherReportData;
      const tr = data.teacher;
      const classes = data.conductedClasses || [];
      const filterClass = this.trFilterClass?.value ? `Class ${this.trFilterClass.value}` : "All Classes";

      let classRows = "";
      if (classes.length === 0) {
        classRows = `<tr><td colspan="7" style="padding: 12px; text-align: center; color: #64748B;">No conducted lecture records found.</td></tr>`;
      } else {
        classes.forEach((c) => {
          const rateColor = c.attendanceRate >= 75 ? "#15803D" : (c.attendanceRate >= 60 ? "#B45309" : "#B91C1C");
          classRows += `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 7px 8px; font-weight: 600;">${c.date}</td>
              <td style="padding: 7px 8px; color: #475569;">${c.timeSlot}</td>
              <td style="padding: 7px 8px; font-weight: 700; color: #0B5CAD;">${c.classCode}</td>
              <td style="padding: 7px 8px;"><span style="font-weight: 600;">${c.courseName}</span> <span style="font-size: 10px; color: #64748B;">(${c.courseCode})</span></td>
              <td style="padding: 7px 8px; color: #475569;">${c.topic}</td>
              <td style="padding: 7px 8px; text-align: center; font-weight: 600;">${c.presentCount} / ${c.totalStudents}</td>
              <td style="padding: 7px 8px; text-align: right; font-weight: 700; color: ${rateColor};">${c.attendanceRate}%</td>
            </tr>
          `;
        });
      }

      const safeTeacher = (tr.name || "Employee").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${safeTeacher}_Conducted_Classes_Report.pdf`;
      const docTitle = `${tr.name} - Conducted Classes Report`;

      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; padding: 20px; max-width: 800px; margin: 0 auto; background: #fff;">
          <!-- Institution Letterhead -->
          <div style="border-bottom: 2.5px solid #0B5CAD; padding-bottom: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; background: #0B1F3A; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; border: 2px solid #F59E0B;">
                SSGM
              </div>
              <div>
                <h1 style="font-size: 16px; font-weight: 800; color: #0B1F3A; margin: 0; line-height: 1.2;">SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING</h1>
                <div style="font-size: 11px; font-weight: 600; color: #64748B; margin-top: 2px;">SHEGAON, MAHARASHTRA • (An Autonomous Institute)</div>
                <div style="font-size: 10.5px; font-weight: 700; color: #0B5CAD; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
                  EMPLOYEE CONDUCTED CLASSES & ATTENDANCE LOG REPORT
                </div>
              </div>
            </div>
            <div style="text-align: right; font-size: 10.5px; color: #64748B;">
              <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div><strong>Academic Session:</strong> 2024-2025</div>
              <div style="color: #10B981; font-weight: 700;">Verified Official</div>
            </div>
          </div>

          <!-- Employee Credentials & Performance Stats -->
          <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; align-items: center;">
            <div>
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748B;">Employee Profile</div>
              <h2 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 2px 0 4px 0;">${tr.name}</h2>
              <div style="font-size: 11.5px; color: #334155;">
                <span><strong>Employee ID:</strong> ${tr.employeeId}</span> • 
                <span><strong>Designation:</strong> ${tr.title}</span> • 
                <span><strong>Program:</strong> CSE</span>
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 4px;">
                <strong>Filter Scope:</strong> ${filterClass}
              </div>
            </div>
            <div style="background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Conducted</div>
              <div style="font-size: 24px; font-weight: 900; color: #0B5CAD; line-height: 1.1; margin: 2px 0;">${tr.totalLecturesConducted}</div>
              <div style="font-size: 10.5px; color: #64748B;">Lectures Logged</div>
            </div>
            <div style="background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Average Attendance</div>
              <div style="font-size: 24px; font-weight: 900; color: #16A34A; line-height: 1.1; margin: 2px 0;">${tr.averageAttendanceRate}%</div>
              <div style="font-size: 10.5px; color: #64748B;">Student Turnout</div>
            </div>
          </div>

          <!-- Conducted Classes Table -->
          <div style="margin-bottom: 22px;">
            <div style="font-size: 12.5px; font-weight: 700; color: #0B5CAD; margin-bottom: 6px; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px;">
              Semester-wise, Class-wise Conducted Academic Lectures
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
              <thead>
                <tr style="background: #F1F5F9; color: #334155; border-bottom: 1.5px solid #CBD5E1;">
                  <th style="padding: 7px 8px;">Date</th>
                  <th style="padding: 7px 8px;">Time Slot</th>
                  <th style="padding: 7px 8px;">Class</th>
                  <th style="padding: 7px 8px;">Course</th>
                  <th style="padding: 7px 8px;">Topic Taught</th>
                  <th style="padding: 7px 8px; text-align: center;">Present / Total</th>
                  <th style="padding: 7px 8px; text-align: right;">Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                ${classRows}
              </tbody>
            </table>
          </div>

          <!-- Sign-off Block -->
          <div style="margin-top: 36px; padding-top: 14px; border-top: 1.5px dashed #CBD5E1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; color: #475569;">
            <div>
              <div style="height: 36px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Employee / Faculty Signature</div>
              <div>${tr.name} (${tr.employeeId})</div>
            </div>
            <div>
              <div style="height: 36px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Head of Program</div>
              <div>Dept. of Computer Science & Engineering</div>
            </div>
          </div>
        </div>
      `;

      this.triggerPdfDownload(html, fileName, docTitle);
    },

    downloadSingleRecordPdf(record) {
      const docTitle = `Attendance Session Record - ${record.classId} (${record.subjectCode})`;
      const fileName = `Session_${record.classId}_${record.subjectCode}_${(record.date || '').replace(/[^a-zA-Z0-9]/g, '')}.pdf`;

      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; padding: 20px; max-width: 800px; margin: 0 auto; background: #fff;">
          <div style="border-bottom: 2.5px solid #0B5CAD; padding-bottom: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; background: #0B1F3A; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; border: 2px solid #F59E0B;">
                SSGM
              </div>
              <div>
                <h1 style="font-size: 16px; font-weight: 800; color: #0B1F3A; margin: 0; line-height: 1.2;">SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING</h1>
                <div style="font-size: 11px; font-weight: 600; color: #64748B; margin-top: 2px;">SHEGAON, MAHARASHTRA • (An Autonomous Institute)</div>
                <div style="font-size: 10.5px; font-weight: 700; color: #0B5CAD; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
                  CLASSROOM ATTENDANCE SESSION REPORT • RECORD #${record.id}
                </div>
              </div>
            </div>
            <div style="text-align: right; font-size: 10.5px; color: #64748B;">
              <div><strong>Date:</strong> ${record.dateFormatted || record.date}</div>
              <div><strong>Status:</strong> ${record.status || 'Submitted'}</div>
              <div style="color: #10B981; font-weight: 700;">Official Record</div>
            </div>
          </div>

          <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 14px; margin-bottom: 16px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px; align-items: center;">
            <div>
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748B;">Conducted Lecture Details</div>
              <h2 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 2px 0 4px 0;">${record.subjectName} (${record.subjectCode})</h2>
              <div style="font-size: 12px; color: #334155;">
                <span><strong>Program:</strong> ${record.department || 'CSE'}</span> • 
                <span><strong>Class:</strong> ${record.classId}</span> • 
                <span><strong>Teacher:</strong> ${(ERP_DATA.teacher?.name || "Faculty")}</span>
              </div>
            </div>
            <div style="background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Students Present</div>
              <div style="font-size: 22px; font-weight: 900; color: #0B5CAD; margin: 2px 0;">${record.presentCount} / ${record.totalStudents}</div>
              <div style="font-size: 10.5px; color: #64748B;">Enrolled Students</div>
            </div>
            <div style="background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Attendance Rate</div>
              <div style="font-size: 22px; font-weight: 900; color: #16A34A; margin: 2px 0;">${record.percentage}</div>
              <div style="font-size: 10.5px; color: #64748B;">Class Participation</div>
            </div>
          </div>

          <div style="margin-top: 40px; padding-top: 14px; border-top: 1.5px dashed #CBD5E1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; color: #475569;">
            <div>
              <div style="height: 36px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Teacher / Employee Signature</div>
              <div>${(ERP_DATA.teacher?.name || "Faculty")} (${(ERP_DATA.teacher?.id || "")})</div>
            </div>
            <div>
              <div style="height: 36px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Head of Program</div>
              <div>Department of Computer Science & Engineering</div>
            </div>
          </div>
        </div>
      `;

      this.triggerPdfDownload(html, fileName, docTitle);
    },

    downloadSessionSummaryPdf() {
      const clsName = this.state.selectedClass ? this.state.selectedClass.name : "2R1";
      const subjName = this.state.selectedSubject ? this.state.selectedSubject.name : "Data Structures";
      const subjCode = this.state.selectedSubject ? this.state.selectedSubject.code : "CS302";
      const dateStr = this.formatDateLong(this.state.selectedDate);
      const total = this.state.students.length;
      const presentList = this.state.students.filter(s => s.status === 'present');
      const absentList = this.state.students.filter(s => s.status === 'absent');
      const ratePct = total > 0 ? ((presentList.length / total) * 100).toFixed(1) : "0.0";

      let studentRows = "";
      this.state.students.forEach((s) => {
        const isP = s.status === 'present';
        studentRows += `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #0B5CAD;">${s.rollFormatted || s.roll}</td>
            <td style="padding: 5px 8px; font-weight: 600;">${s.name}</td>
            <td style="padding: 5px 8px; color: #475569;">${s.studentCode || '-'}</td>
            <td style="padding: 5px 8px; text-align: center;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700; ${isP ? 'background: #DCFCE7; color: #15803D;' : 'background: #FEE2E2; color: #B91C1C;'}">
                ${isP ? 'PRESENT' : 'ABSENT'}
              </span>
            </td>
          </tr>
        `;
      });

      const fileName = `Attendance_Sheet_${clsName}_${subjCode}_${this.formatDateISO(this.state.selectedDate)}.pdf`;
      const docTitle = `Attendance Sheet - ${clsName} ${subjCode} (${dateStr})`;

      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; padding: 20px; max-width: 800px; margin: 0 auto; background: #fff;">
          <div style="border-bottom: 2.5px solid #0B5CAD; padding-bottom: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; background: #0B1F3A; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; border: 2px solid #F59E0B;">
                SSGM
              </div>
              <div>
                <h1 style="font-size: 16px; font-weight: 800; color: #0B1F3A; margin: 0; line-height: 1.2;">SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING</h1>
                <div style="font-size: 11px; font-weight: 600; color: #64748B; margin-top: 2px;">SHEGAON, MAHARASHTRA • (An Autonomous Institute)</div>
                <div style="font-size: 10.5px; font-weight: 700; color: #0B5CAD; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
                  DAILY CLASSROOM ATTENDANCE SUBMISSION SHEET
                </div>
              </div>
            </div>
            <div style="text-align: right; font-size: 10.5px; color: #64748B;">
              <div><strong>Session Date:</strong> ${dateStr}</div>
              <div><strong>Academic Year:</strong> 2024-2025</div>
              <div style="color: #10B981; font-weight: 700;">Verified Official</div>
            </div>
          </div>

          <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; align-items: center;">
            <div>
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748B;">Conducted Lecture</div>
              <h2 style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 2px 0 4px 0;">${subjName} (${subjCode})</h2>
              <div style="font-size: 11.5px; color: #334155;">
                <span><strong>Class:</strong> ${clsName}</span> • 
                <span><strong>Program:</strong> CSE</span> • 
                <span><strong>Employee:</strong> ${(ERP_DATA.teacher?.name || "Faculty")}</span>
              </div>
            </div>
            <div style="background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Present Count</div>
              <div style="font-size: 22px; font-weight: 900; color: #15803D; margin: 2px 0;">${presentList.length} / ${total}</div>
              <div style="font-size: 10px; color: #64748B;">${absentList.length} Absent</div>
            </div>
            <div style="background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Attendance Rate</div>
              <div style="font-size: 22px; font-weight: 900; color: #0B5CAD; margin: 2px 0;">${ratePct}%</div>
              <div style="font-size: 10px; color: #64748B;">Participation</div>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; color: #0B1F3A; margin-bottom: 6px; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px;">
              Enrolled Student Attendance Roster
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; text-align: left;">
              <thead>
                <tr style="background: #F1F5F9; color: #334155; border-bottom: 1.5px solid #CBD5E1;">
                  <th style="padding: 6px 8px;">Roll No</th>
                  <th style="padding: 6px 8px;">Student Full Name</th>
                  <th style="padding: 6px 8px;">Student Code / SIS</th>
                  <th style="padding: 6px 8px; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${studentRows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 36px; padding-top: 14px; border-top: 1.5px dashed #CBD5E1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; color: #475569;">
            <div>
              <div style="height: 36px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Teacher / Employee Signature</div>
              <div>${(ERP_DATA.teacher?.name || "Faculty")} (${(ERP_DATA.teacher?.id || "")})</div>
            </div>
            <div>
              <div style="height: 36px;"></div>
              <div style="border-top: 1px solid #94A3B8; padding-top: 4px; font-weight: 700; color: #0F172A;">Head of Program</div>
              <div>Department of Computer Science & Engineering</div>
            </div>
          </div>
        </div>
      `;

      this.triggerPdfDownload(html, fileName, docTitle);
    },

    triggerPdfDownload(htmlContent, fileName, docTitle) {
      this.showToast(`Preparing PDF: ${fileName}...`, "info");

      if (typeof window.html2pdf === "function") {
        const container = document.createElement("div");
        container.style.cssText = "position: absolute; left: -9999px; top: -9999px; width: 800px; background: #fff;";
        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        const opt = {
          margin: [8, 8, 8, 8],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        window.html2pdf().set(opt).from(container).save().then(() => {
          if (document.body.contains(container)) document.body.removeChild(container);
          this.showToast(`Downloaded ${fileName}`, "success");
        }).catch((err) => {
          console.warn("html2pdf conversion error, falling back to print window:", err);
          if (document.body.contains(container)) document.body.removeChild(container);
          this.openPrintWindow(htmlContent, docTitle);
        });
      } else {
        this.openPrintWindow(htmlContent, docTitle);
      }
    },

    openPrintWindow(htmlContent, docTitle) {
      const printWin = window.open("", "_blank");
      if (!printWin) {
        this.showToast("Popup blocked. Please allow popups to save/download PDF.", "warning");
        return;
      }
      printWin.document.open();
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${docTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { margin: 0; padding: 0; background: #fff; font-family: 'Inter', sans-serif; color: #0F172A; }
            * { box-sizing: border-box; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 10px 20px; background: #0B1F3A; color: #fff; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 600;">SSGMCE ERP Print & Save as PDF</span>
            <button onclick="window.print()" style="padding: 6px 14px; background: #0B5CAD; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">Print / Save as PDF</button>
          </div>
          ${htmlContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          <\/script>
        </body>
        </html>
      `);
      printWin.document.close();
      this.showToast("Opening print / Save-as-PDF dialog...", "info");
    }
  };

  App.init();
  window.CollegeERPApp = App;
});

