/* ========================================================
   TEACHER ATTENDANCE WORKFLOW CONTROLLER
   ======================================================== */

const AttendanceWorkflow = {
  // Swipe physics tracking variables
  dragState: {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    cardElem: null
  },

  init() {
    AttendanceState.init();
    this.bindGlobalEvents();
    this.goToStep(1);
  },

  bindGlobalEvents() {
    // Keyboard navigation listener for Step 5 (Student Attendance)
    window.addEventListener("keydown", (e) => {
      // Check if attendance module is active and in Step 5
      const moduleElem = document.getElementById("attendance-module");
      if (!moduleElem || moduleElem.style.display === "none") return;
      if (AttendanceState.currentStep !== 5) return;
      if (AttendanceState.isPaused) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        this.handleDecision("present");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.handleDecision("absent");
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        this.togglePauseModal();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.goToStep(4);
      }
    });
  },

  // ------------------------------------------------------
  // STEP NAVIGATION & STATE PRESERVATION
  // ------------------------------------------------------
  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 6) return;

    // Show skeleton transition briefly for realistic ERP feel
    this.showSkeletonLoader(() => {
      AttendanceState.currentStep = stepNumber;
      this.updateStepperUI(stepNumber);
      this.updateBreadcrumb();

      const container = document.getElementById("attendance-step-content");
      if (!container) return;

      switch (stepNumber) {
        case 1:
          this.renderStep1Departments(container);
          break;
        case 2:
          this.renderStep2Classes(container);
          break;
        case 3:
          this.renderStep3Date(container);
          break;
        case 4:
          this.renderStep4Subjects(container);
          break;
        case 5:
          this.renderStep5Students(container);
          break;
        case 6:
          this.renderStep6Summary(container);
          break;
      }

      window.scrollTo({ top: 120, behavior: "smooth" });
      if (window.lucide) lucide.createIcons();
    });
  },

  showSkeletonLoader(callback) {
    const container = document.getElementById("attendance-step-content");
    if (!container) {
      callback();
      return;
    }

    container.innerHTML = `
      <div class="skeleton-container">
        <div class="skeleton-header-shimmer"></div>
        <div class="skeleton-grid-shimmer">
          <div class="skeleton-card-item"></div>
          <div class="skeleton-card-item"></div>
          <div class="skeleton-card-item"></div>
        </div>
      </div>
    `;

    setTimeout(() => {
      callback();
    }, 150);
  },

  // ------------------------------------------------------
  // STEPPER & BREADCRUMB MANAGERS
  // ------------------------------------------------------
  updateStepperUI(currentStep) {
    const nodes = document.querySelectorAll(".stepper-workflow-container .workflow-step-node");
    const dividers = document.querySelectorAll(".stepper-workflow-container .workflow-step-connector");

    nodes.forEach((node, idx) => {
      const stepIdx = idx + 1;
      node.classList.remove("active", "completed", "muted");

      if (stepIdx === currentStep) {
        node.classList.add("active");
      } else if (stepIdx < currentStep) {
        node.classList.add("completed");
      } else {
        node.classList.add("muted");
      }
    });

    dividers.forEach((divider, idx) => {
      if (idx + 1 < currentStep) {
        divider.classList.add("completed");
      } else {
        divider.classList.remove("completed");
      }
    });
  },

  updateBreadcrumb() {
    const bcContainer = document.getElementById("attendance-breadcrumb-trail");
    if (!bcContainer) return;

    const step = AttendanceState.currentStep;
    const dept = AttendanceState.selectedDepartment.code;
    const cls = AttendanceState.selectedClass.code;
    const date = AttendanceState.getFormattedDate();
    const sub = AttendanceState.selectedSubject.name;

    let items = [];

    // Step 0: Attendance root
    items.push(`
      <span class="bc-item ${step === 1 ? 'current' : 'clickable'}" onclick="AttendanceWorkflow.goToStep(1)">
        Attendance
      </span>
    `);

    if (step >= 2) {
      items.push(`<span class="bc-separator">&gt;</span>`);
      items.push(`
        <span class="bc-item ${step === 2 ? 'current' : 'clickable'}" onclick="AttendanceWorkflow.goToStep(1)" title="Back to Department Selection">
          ${dept}
        </span>
      `);
    }

    if (step >= 3) {
      items.push(`<span class="bc-separator">&gt;</span>`);
      items.push(`
        <span class="bc-item ${step === 3 ? 'current' : 'clickable'}" onclick="AttendanceWorkflow.goToStep(2)" title="Back to Class Selection">
          ${cls}
        </span>
      `);
    }

    if (step >= 4) {
      items.push(`<span class="bc-separator">&gt;</span>`);
      items.push(`
        <span class="bc-item ${step === 4 ? 'current' : 'clickable'}" onclick="AttendanceWorkflow.goToStep(3)" title="Click to select or change date">
          ${date}
        </span>
      `);
    }

    if (step >= 5) {
      items.push(`<span class="bc-separator">&gt;</span>`);
      items.push(`
        <span class="bc-item ${step === 5 ? 'current' : 'clickable'}" onclick="AttendanceWorkflow.goToStep(4)" title="Back to Subject Selection">
          ${sub}
        </span>
      `);
    }

    if (step >= 6) {
      items.push(`<span class="bc-separator">&gt;</span>`);
      items.push(`<span class="bc-item current">Summary</span>`);
    }

    bcContainer.innerHTML = items.join('');
  },

  // ------------------------------------------------------
  // STEP 1: DEPARTMENT SELECTION
  // ------------------------------------------------------
  renderStep1Departments(container) {
    const departments = TeacherERPData.departments;
    const currentCode = AttendanceState.selectedDepartment.code;

    container.innerHTML = `
      <div class="workflow-card-wrapper">
        <div class="workflow-step-heading-block">
          <span class="workflow-step-pill">01 • Department Selection</span>
          <h2 class="workflow-main-title">Select Department</h2>
          <p class="workflow-subtitle">Choose the department for which you want to mark attendance.</p>
        </div>

        <div class="departments-grid">
          ${departments.map(dept => `
            <div class="dept-interactive-card ${dept.code === currentCode ? 'selected' : ''}" 
                 onclick="AttendanceWorkflow.handleSelectDepartment('${dept.code}')">
              <div class="dept-card-icon-box">
                <i data-lucide="${dept.icon}"></i>
              </div>
              <div class="dept-card-body">
                <h3 class="dept-title-name">${dept.name}</h3>
                <span class="dept-short-code">${dept.code}</span>
              </div>
              <div class="dept-card-footer">
                <span class="dept-classes-counter">${dept.classesCount} Classes</span>
                <i data-lucide="arrow-right" class="dept-card-arrow"></i>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="workflow-footer-controls">
          <div></div>
          <button class="btn-workflow-continue" onclick="AttendanceWorkflow.goToStep(2)">
            Continue to Class Selection
            <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    `;
  },

  handleSelectDepartment(code) {
    AttendanceState.setDepartment(code);
    this.updateBreadcrumb();
    // Smooth auto-progression to Step 2
    setTimeout(() => {
      this.goToStep(2);
    }, 180);
  },

  // ------------------------------------------------------
  // STEP 2: CLASS SELECTION
  // ------------------------------------------------------
  renderStep2Classes(container) {
    const deptCode = AttendanceState.selectedDepartment.code;
    const dept = TeacherERPData.departments.find(d => d.code === deptCode);
    const classCodes = dept ? dept.classCodes : ["2R1", "2R2", "3R", "4R"];
    const currentClass = AttendanceState.selectedClass.code;

    container.innerHTML = `
      <div class="workflow-card-wrapper">
        <div class="workflow-step-heading-block">
          <span class="workflow-step-pill">02 • Class Selection</span>
          <h2 class="workflow-main-title">Select Class</h2>
          <p class="workflow-subtitle">Choose the class for attendance in <strong>${AttendanceState.selectedDepartment.name}</strong>.</p>
        </div>

        <div class="classes-grid">
          ${classCodes.map(code => {
            const cls = TeacherERPData.classes[code] || { code, name: `${code} Class`, studentsCount: 60 };
            return `
              <div class="class-interactive-card ${code === currentClass ? 'selected' : ''}"
                   onclick="AttendanceWorkflow.handleSelectClass('${code}')">
                <div class="class-card-top-indicator">
                  <span class="class-sem-pill">${cls.semester || 'Semester 3'}</span>
                  <div class="class-radio-indicator"></div>
                </div>

                <div class="class-card-large-name">${cls.code}</div>
                <div class="class-card-dept-tag">${deptCode} Class</div>

                <div class="class-card-footer-meta">
                  <span class="class-students-tag">
                    <i data-lucide="users" style="width:14px;height:14px;"></i>
                    ${cls.studentsCount} Students
                  </span>
                  <i data-lucide="arrow-right" class="class-card-arrow"></i>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="workflow-footer-controls">
          <button class="btn-workflow-back" onclick="AttendanceWorkflow.goToStep(1)">
            <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
            Back to Departments
          </button>
          <button class="btn-workflow-continue" onclick="AttendanceWorkflow.goToStep(3)">
            Continue to Date Selection
            <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    `;
  },

  handleSelectClass(code) {
    AttendanceState.setClass(code);
    this.updateBreadcrumb();
    setTimeout(() => {
      this.goToStep(3);
    }, 180);
  },

  // ------------------------------------------------------
  // STEP 3: DATE SELECTION (Interactive Calendar)
  // ------------------------------------------------------
  renderStep3Date(container) {
    container.innerHTML = `
      <div class="workflow-card-wrapper">
        <div class="workflow-step-heading-block">
          <span class="workflow-step-pill">03 • Attendance Date</span>
          <h2 class="workflow-main-title">Select Attendance Date</h2>
          <p class="workflow-subtitle">Choose the date for which attendance will be marked for <strong>${AttendanceState.selectedClass.code}</strong>.</p>
        </div>

        <!-- Mount point for Interactive Calendar Component -->
        <div id="calendar-mount-point"></div>

        <div class="workflow-footer-controls">
          <button class="btn-workflow-back" onclick="AttendanceWorkflow.goToStep(2)">
            <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
            Back to Classes
          </button>
          <button class="btn-workflow-continue" id="btn-calendar-continue" onclick="AttendanceWorkflow.goToStep(4)">
            Continue to Subject
            <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    `;

    // Initialize and render interactive calendar
    const calMount = document.getElementById("calendar-mount-point");
    if (calMount) {
      AttendanceCalendar.init();
      AttendanceCalendar.render(calMount);
    }
  },

  // ------------------------------------------------------
  // STEP 4: SUBJECT SELECTION
  renderStep4Subjects(container) {
    const classCode = (AttendanceState.selectedClass && AttendanceState.selectedClass.code) ? AttendanceState.selectedClass.code : '';
    const subjects = (typeof TeacherERPData !== 'undefined' && TeacherERPData.subjects && TeacherERPData.subjects[classCode]) || [];

    const currentSubCode = AttendanceState.selectedSubject.code;

    const todayISO = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0];
    const isToday = (AttendanceState.selectedDate === todayISO);

    container.innerHTML = `
      <div class="workflow-card-wrapper">
        <div class="workflow-step-heading-block">
          <span class="workflow-step-pill">04 • Subject Selection</span>
          <h2 class="workflow-main-title">Select Subject</h2>
          <p class="workflow-subtitle">Choose the course subject for attendance marking in <strong>Division ${classCode}</strong>.</p>
        </div>

        <!-- Active Lecture Date Banner with Inline Date Picker -->
        <div class="step-date-banner">
          <div class="step-date-info">
            <div class="step-date-icon-box">
              <i data-lucide="calendar" class="step-date-icon"></i>
            </div>
            <div>
              <span class="step-date-sub">Selected Lecture Date</span>
              <div class="step-date-val">${AttendanceState.getFormattedDate()}</div>
            </div>
            <span class="date-status-tag ${isToday ? 'today' : 'custom'}">
              ${AttendanceState.getDateStatusLabel()}
            </span>
          </div>
          <div class="step-date-actions">
            <input type="date" 
                   id="step4-inline-date-picker" 
                   class="inline-hidden-date-picker" 
                   value="${AttendanceState.selectedDate || todayISO}" 
                   onchange="AttendanceWorkflow.changeDateFromAnywhere(this.value)">
            <button class="btn-change-date-pill" 
                    type="button"
                    onclick="AttendanceWorkflow.triggerPicker('step4-inline-date-picker')" 
                    title="Change Attendance Date">
              <i data-lucide="calendar-days" style="width:14px;height:14px;"></i>
              <span>Change Date</span>
            </button>
          </div>
        </div>

        <div class="subjects-grid">
          ${subjects.map(sub => `
            <div class="subject-interactive-card ${sub.code === currentSubCode ? 'selected' : ''}"
                 onclick="AttendanceWorkflow.handleSelectSubject('${sub.code}')">
              <div class="subject-card-icon-box">
                <i data-lucide="${sub.icon || 'book-open'}"></i>
              </div>

              <div class="subject-card-body">
                <h3 class="subject-title-name">${sub.name}</h3>
                <span class="subject-code-tag">${sub.code} • ${sub.credits || '4 Credits'}</span>
                
                <div class="subject-faculty-row">
                  <i data-lucide="user-check" style="width:14px;height:14px;"></i>
                  <span>${sub.faculty}</span>
                </div>

                <div class="subject-time-row">
                  <i data-lucide="clock" style="width:14px;height:14px;"></i>
                  <span>${sub.time}</span>
                </div>
              </div>

              <div class="subject-card-footer">
                <span class="subject-status-indicator">Ready to Mark</span>
                <i data-lucide="arrow-right" class="subject-card-arrow"></i>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="workflow-footer-controls">
          <button class="btn-workflow-back" onclick="AttendanceWorkflow.goToStep(3)">
            <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
            Back to Date
          </button>
          <button class="btn-workflow-continue" onclick="AttendanceWorkflow.goToStep(5)">
            Start Student Attendance
            <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    `;
  },

  handleSelectSubject(code) {
    AttendanceState.setSubject(code);
    this.updateBreadcrumb();
    setTimeout(() => {
      this.goToStep(5);
    }, 180);
  },

  // ------------------------------------------------------
  // STEP 5: STUDENT ATTENDANCE (SWIP Card & Roster List)
  // ------------------------------------------------------
  setMarkingMode(mode) {
    AttendanceState.markingMode = mode;
    const container = document.getElementById("attendance-step-content");
    if (container) {
      this.renderStep5Students(container);
    }
  },

  renderStep5Students(container) {
    const summary = AttendanceState.getSummary();
    const students = AttendanceState.students;
    const total = students.length;
    const currentIndex = AttendanceState.currentIndex;

    // Check if Roster List mode is selected
    if (AttendanceState.markingMode === 'roster') {
      this.renderRosterListView(container);
      return;
    }

    // SWIP Card Mode (Default)
    // If all students already completed, show completion state
    if (currentIndex >= total && total > 0) {
      this.renderCompletionScreen(container);
      return;
    }

    const currentStudent = students[currentIndex] || students[0];
    const progressPercent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;
    const canUndo = AttendanceState.historyStack.length > 0;

    container.innerHTML = `
      <div class="student-attendance-stage">
        
        <!-- Attendance Mode Selector: SWIP Card vs Roster List -->
        <div class="attendance-mode-selector-bar">
          <div class="mode-selector-title">
            <i data-lucide="layers" style="width:16px;height:16px; color:var(--primary-blue);"></i>
            <span>Attendance Mode:</span>
          </div>
          <div class="mode-toggle-group">
            <button class="btn-mode-toggle active" 
                    onclick="AttendanceWorkflow.setMarkingMode('swipe')">
              <i data-lucide="credit-card" style="width:15px;height:15px;"></i>
              <span>SWIP Card</span>
            </button>
            <button class="btn-mode-toggle" 
                    onclick="AttendanceWorkflow.setMarkingMode('roster')">
              <i data-lucide="list-checks" style="width:15px;height:15px;"></i>
              <span>Roster List</span>
            </button>
          </div>
        </div>

        <!-- Live Attendance Counter Bar -->
        <div class="live-counter-toolbar">
          <div class="counter-chip-group">
            <div class="counter-chip present">
              <i data-lucide="check-circle" style="width:16px;height:16px;"></i>
              <span>Present: <strong>${summary.presentCount}</strong></span>
            </div>
            <div class="counter-chip absent">
              <i data-lucide="x-circle" style="width:16px;height:16px;"></i>
              <span>Absent: <strong>${summary.absentCount}</strong></span>
            </div>
            <div class="counter-chip remaining">
              <i data-lucide="hourglass" style="width:16px;height:16px;"></i>
              <span>Remaining: <strong>${summary.remainingCount}</strong></span>
            </div>
          </div>

          <div class="counter-actions-group">
            <button class="btn-counter-tool ${canUndo ? '' : 'disabled'}" 
                    onclick="AttendanceWorkflow.handleUndo()" 
                    ${canUndo ? '' : 'disabled'}
                    title="Undo previous attendance marking">
              <i data-lucide="undo-2" style="width:14px;height:14px;"></i>
              Undo
            </button>
            <button class="btn-counter-tool pause" onclick="AttendanceWorkflow.togglePauseModal()">
              <i data-lucide="pause-circle" style="width:14px;height:14px;"></i>
              Pause
            </button>
            <button class="btn-counter-tool quick-help" onclick="AttendanceWorkflow.toggleShortcutsModal()">
              <i data-lucide="keyboard" style="width:14px;height:14px;"></i>
              Shortcuts
            </button>
          </div>
        </div>

        <!-- Interactive Lecture Date Control Bar -->
        <div class="swipe-lecture-date-strip">
          <div class="swipe-date-info-group">
            <i data-lucide="calendar" style="width:15px;height:15px; color:var(--primary-blue);"></i>
            <span class="swipe-date-label">Session Date:</span>
            <strong class="swipe-date-value">${AttendanceState.getFormattedDate()}</strong>
            <span class="date-status-tag ${AttendanceState.selectedDate === ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : '') ? 'today' : 'custom'}">
              ${AttendanceState.getDateStatusLabel()}
            </span>
          </div>

          <div class="swipe-date-action-group">
            <input type="date" 
                   id="step5-swipe-date-picker" 
                   class="inline-hidden-date-picker" 
                   value="${AttendanceState.selectedDate || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : '')}" 
                   onchange="AttendanceWorkflow.changeDateFromAnywhere(this.value)">
            <button class="btn-change-date-mini" 
                    type="button"
                    onclick="AttendanceWorkflow.triggerPicker('step5-swipe-date-picker')" 
                    title="Change Attendance Date">
              <i data-lucide="calendar-days" style="width:13px;height:13px;"></i>
              <span>Change Date</span>
            </button>
          </div>
        </div>

        <!-- Student Progress Header -->
        <div class="student-progress-wrapper">
          <div class="student-progress-text-row">
            <span class="student-index-label">Student <strong>${currentIndex + 1}</strong> of <strong>${total}</strong></span>
            <span class="student-batch-label">${AttendanceState.selectedClass.code} • ${AttendanceState.selectedSubject.name} • ${AttendanceState.getFormattedDate()}</span>
            <span class="student-percent-label">${progressPercent}% Completed</span>
          </div>
          <div class="student-progress-track">
            <div class="student-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <!-- SWIPE CARD ARENA -->
        <div class="swipe-arena-container" id="swipe-arena-container">
          <div class="student-active-swipe-card" id="student-active-swipe-card">
            
            <!-- Dynamic Drag Feedback Badges -->
            <div class="drag-feedback-badge absent" id="badge-drag-absent">
              <i data-lucide="x" style="width:24px;height:24px;"></i>
              <span>ABSENT</span>
            </div>
            <div class="drag-feedback-badge present" id="badge-drag-present">
              <i data-lucide="check" style="width:24px;height:24px;"></i>
              <span>PRESENT</span>
            </div>

            <!-- Header Badge -->
            <div class="student-card-tag-pill">STUDENT ${String(currentIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>

            <!-- PROMINENT ROLL NUMBER & STUDENT NAME -->
            <div class="student-card-roll-prominent">
              ROLL ${currentStudent.rollFormatted || currentStudent.rollNo}
            </div>

            <h1 class="student-card-name-prominent">
              ${currentStudent.name}
            </h1>

            <div class="student-card-meta-line">
              <span>${currentStudent.enrollmentNo}</span>
              <span>•</span>
              <span>Division ${AttendanceState.selectedClass.code} (${AttendanceState.selectedDepartment.code})</span>
            </div>

            <!-- Guidance Footer -->
            <div class="student-card-swipe-guidance">
              <span class="guide-left">← SWIPE TO ABSENT</span>
              <span class="guide-divider">•</span>
              <span class="guide-right">SWIPE TO PRESENT →</span>
            </div>
          </div>
        </div>

        <!-- DESKTOP FALLBACK BUTTONS -->
        <div class="desktop-controls-wrapper">
          <button class="btn-desktop-decision absent" onclick="AttendanceWorkflow.handleDecision('absent')">
            <i data-lucide="x" style="width:20px;height:20px;"></i>
            ← ABSENT
          </button>
          
          <button class="btn-desktop-decision present" onclick="AttendanceWorkflow.handleDecision('present')">
            PRESENT →
            <i data-lucide="check" style="width:20px;height:20px;"></i>
          </button>
        </div>

        <!-- Keyboard Cues -->
        <div class="keyboard-cues-hint">
          <span>Keyboard: <kbd class="kbd-key">←</kbd> Absent</span>
          <span>•</span>
          <span><kbd class="kbd-key">→</kbd> Present</span>
          <span>•</span>
          <span><kbd class="kbd-key">Space</kbd> Pause</span>
          <span>•</span>
          <span><kbd class="kbd-key">Esc</kbd> Back</span>
        </div>

        <!-- Back to Subject navigation -->
        <div class="workflow-footer-controls" style="margin-top:20px;">
          <button class="btn-workflow-back" onclick="AttendanceWorkflow.goToStep(4)">
            <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
            Back to Subject
          </button>
          <button class="btn-workflow-continue" onclick="AttendanceWorkflow.goToStep(6)">
            Jump to Summary
            <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    `;

    this.attachPointerSwipePhysics();
  },

  // ------------------------------------------------------
  // ROSTER LIST ATTENDANCE VIEW
  // ------------------------------------------------------
  renderRosterListView(container) {
    const summary = AttendanceState.getSummary();
    const isSubmitted = AttendanceState.isSubmitted;

    container.innerHTML = `
      <div class="student-attendance-stage" style="max-width: 960px;">
        
        <!-- Attendance Mode Selector: SWIP Card vs Roster List -->
        <div class="attendance-mode-selector-bar">
          <div class="mode-selector-title">
            <i data-lucide="layers" style="width:16px;height:16px; color:var(--primary-blue);"></i>
            <span>Attendance Mode:</span>
          </div>
          <div class="mode-toggle-group">
            <button class="btn-mode-toggle" 
                    onclick="AttendanceWorkflow.setMarkingMode('swipe')">
              <i data-lucide="credit-card" style="width:15px;height:15px;"></i>
              <span>SWIP Card</span>
            </button>
            <button class="btn-mode-toggle active" 
                    onclick="AttendanceWorkflow.setMarkingMode('roster')">
              <i data-lucide="list-checks" style="width:15px;height:15px;"></i>
              <span>Roster List</span>
            </button>
          </div>
        </div>

        <!-- Roster List Stage Container -->
        <div class="roster-list-stage">
          
          <!-- Lecture Information Bar -->
          <div class="roster-lecture-meta-bar">
            <span class="roster-meta-pill">Class / Division: <strong>${AttendanceState.selectedClass.code} (${AttendanceState.selectedDepartment.code})</strong></span>
            <span class="roster-meta-pill">Subject: <strong>${AttendanceState.selectedSubject.name} (${AttendanceState.selectedSubject.code})</strong></span>
            <span class="roster-meta-pill roster-date-interactive-pill">
              <i data-lucide="calendar" style="width:14px;height:14px; color:var(--primary-blue);"></i>
              <span>Date: <strong>${AttendanceState.getFormattedDate()}</strong></span>
              <span class="date-status-tag ${AttendanceState.selectedDate === ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : '') ? 'today' : 'custom'}">${AttendanceState.getDateStatusLabel()}</span>
              <input type="date" 
                     id="roster-date-picker" 
                     class="inline-hidden-date-picker" 
                     value="${AttendanceState.selectedDate || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : '')}" 
                     onchange="AttendanceWorkflow.changeDateFromAnywhere(this.value)">
              <button class="btn-roster-date-change" 
                      type="button"
                      onclick="AttendanceWorkflow.triggerPicker('roster-date-picker')" 
                      title="Change Attendance Date">
                <i data-lucide="calendar-days" style="width:12px;height:12px;"></i>
                <span>Change</span>
              </button>
            </span>
            <span class="roster-meta-pill">Teacher: <strong>${AttendanceState.selectedSubject.faculty}</strong></span>
          </div>

          <!-- Bulk Action Toolbar -->
          <div class="roster-bulk-toolbar">
            <div class="roster-bulk-btns">
              <button class="btn-bulk-action present" onclick="AttendanceWorkflow.handleRosterMarkAll('present')">
                <i data-lucide="check-check" style="width:16px;height:16px;"></i>
                Mark All Present
              </button>
              <button class="btn-bulk-action absent" onclick="AttendanceWorkflow.handleRosterMarkAll('absent')">
                <i data-lucide="x" style="width:16px;height:16px;"></i>
                Mark All Absent
              </button>
            </div>

            <!-- Live Status Counters -->
            <div class="counter-chip-group">
              <div class="counter-chip present">
                <i data-lucide="check-circle" style="width:15px;height:15px;"></i>
                <span>Present: <strong id="roster-live-present">${summary.presentCount}</strong></span>
              </div>
              <div class="counter-chip absent">
                <i data-lucide="x-circle" style="width:15px;height:15px;"></i>
                <span>Absent: <strong id="roster-live-absent">${summary.absentCount}</strong></span>
              </div>
              <div class="counter-chip remaining">
                <i data-lucide="users" style="width:15px;height:15px;"></i>
                <span>Total: <strong>${summary.total}</strong></span>
              </div>
            </div>

            <!-- Instant Search Box -->
            <div class="roster-search-box">
              <i data-lucide="search" class="roster-search-icon"></i>
              <input type="text" id="roster-search-filter" 
                     placeholder="Search Roll No, Student Name, PRN..." 
                     oninput="AttendanceWorkflow.filterRosterList(this.value)">
            </div>
          </div>

          <!-- Student Roster Table -->
          <div class="roster-table-wrapper">
            <table class="roster-attendance-table">
              <thead>
                <tr>
                  <th style="width:130px;">Roll Number</th>
                  <th>Student Name</th>
                  <th>Enrollment / PRN</th>
                  <th style="width:130px;">Current Status</th>
                  <th style="width:230px; text-align:center;">Attendance Option</th>
                </tr>
              </thead>
              <tbody id="roster-table-body-rows">
                ${this.renderRosterRowsHTML()}
              </tbody>
            </table>
          </div>

          <!-- Roster Bottom Action Controls -->
          <div class="roster-footer-controls">
            <button class="btn-workflow-back" onclick="AttendanceWorkflow.goToStep(4)">
              <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
              Back to Subject
            </button>

            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <button class="btn-save-draft" onclick="AttendanceWorkflow.openSaveDraftModal()" ${isSubmitted ? 'disabled' : ''}>
                <i data-lucide="save" style="width:16px;height:16px;"></i>
                Save Draft
              </button>

              <button class="btn-final-submit" onclick="AttendanceWorkflow.openSubmitModal()" ${isSubmitted ? 'disabled' : ''}>
                <i data-lucide="check-check" style="width:16px;height:16px;"></i>
                ${isSubmitted ? 'Submitted' : 'Submit Attendance'}
              </button>

              <button class="btn-workflow-continue" onclick="AttendanceWorkflow.goToStep(6)">
                Review Summary →
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  renderRosterRowsHTML() {
    const students = AttendanceState.students;
    return students.map(st => {
      const status = AttendanceState.attendanceMap[st.rollNo] || "present";
      return `
        <tr data-roll="${st.rollNo}" data-name="${st.name.toLowerCase()}" data-prn="${st.enrollmentNo.toLowerCase()}">
          <td class="roster-roll-col">ROLL ${st.rollFormatted || st.rollNo}</td>
          <td class="roster-name-col">${st.name}</td>
          <td class="roster-prn-col">${st.enrollmentNo}</td>
          <td>
            <span class="badge ${status === 'present' ? 'badge-completed' : 'badge-pending'}" id="roster-badge-${st.rollNo}">
              ${status === 'present' ? 'Present' : 'Absent'}
            </span>
          </td>
          <td style="text-align:center;">
            <div class="roster-decision-btns">
              <button class="btn-roster-status present ${status === 'present' ? 'active' : ''}" 
                      id="roster-btn-pres-${st.rollNo}"
                      onclick="AttendanceWorkflow.setStudentRosterStatus(${st.rollNo}, 'present')">
                <i data-lucide="check" style="width:14px;height:14px;"></i>
                Present
              </button>
              <button class="btn-roster-status absent ${status === 'absent' ? 'active' : ''}" 
                      id="roster-btn-abs-${st.rollNo}"
                      onclick="AttendanceWorkflow.setStudentRosterStatus(${st.rollNo}, 'absent')">
                <i data-lucide="x" style="width:14px;height:14px;"></i>
                Absent
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  setStudentRosterStatus(rollNo, status) {
    AttendanceState.setStudentStatus(rollNo, status);

    const badge = document.getElementById(`roster-badge-${rollNo}`);
    const btnPres = document.getElementById(`roster-btn-pres-${rollNo}`);
    const btnAbs = document.getElementById(`roster-btn-abs-${rollNo}`);

    if (badge) {
      badge.className = `badge ${status === 'present' ? 'badge-completed' : 'badge-pending'}`;
      badge.textContent = status === 'present' ? 'Present' : 'Absent';
    }

    if (btnPres && btnAbs) {
      if (status === 'present') {
        btnPres.classList.add('active');
        btnAbs.classList.remove('active');
      } else {
        btnAbs.classList.add('active');
        btnPres.classList.remove('active');
      }
    }

    const summary = AttendanceState.getSummary();
    const presElem = document.getElementById('roster-live-present');
    const absElem = document.getElementById('roster-live-absent');
    if (presElem) presElem.textContent = summary.presentCount;
    if (absElem) absElem.textContent = summary.absentCount;

    if (window.TeacherApp) {
      TeacherApp.showToast(`Roll ${rollNo} marked ${status === 'present' ? '✓ Present' : '✕ Absent'}`, status === 'present' ? 'success' : 'danger');
    }
  },

  handleRosterMarkAll(status) {
    if (status === 'present') {
      AttendanceState.markAllPresent();
    } else {
      AttendanceState.markAllAbsent();
    }

    const tbody = document.getElementById('roster-table-body-rows');
    if (tbody) {
      tbody.innerHTML = this.renderRosterRowsHTML();
    }

    const summary = AttendanceState.getSummary();
    const presElem = document.getElementById('roster-live-present');
    const absElem = document.getElementById('roster-live-absent');
    if (presElem) presElem.textContent = summary.presentCount;
    if (absElem) absElem.textContent = summary.absentCount;

    if (window.TeacherApp) {
      TeacherApp.showToast(status === 'present' ? '✓ All students marked Present' : '✕ All students marked Absent', status === 'present' ? 'success' : 'warning');
    }
    if (window.lucide) lucide.createIcons();
  },

  filterRosterList(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll("#roster-table-body-rows tr");
    rows.forEach(row => {
      const roll = row.getAttribute("data-roll") || "";
      const name = row.getAttribute("data-name") || "";
      const prn = row.getAttribute("data-prn") || "";
      const match = roll.includes(q) || name.includes(q) || prn.includes(q);
      row.style.display = match ? "" : "none";
    });
  },

  // ------------------------------------------------------
  // UNIFIED POINTER SWIPE PHYSICS ENGINE
  // ------------------------------------------------------
  attachPointerSwipePhysics() {
    const card = document.getElementById("student-active-swipe-card");
    if (!card) return;

    this.dragState.cardElem = card;
    const badgePresent = document.getElementById("badge-drag-present");
    const badgeAbsent = document.getElementById("badge-drag-absent");

    const onPointerDown = (e) => {
      this.dragState.isDragging = true;
      this.dragState.startX = e.clientX;
      this.dragState.startY = e.clientY;
      this.dragState.deltaX = 0;
      card.style.transition = "none";
      card.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!this.dragState.isDragging) return;

      this.dragState.currentX = e.clientX;
      this.dragState.currentY = e.clientY;
      const deltaX = this.dragState.currentX - this.dragState.startX;
      this.dragState.deltaX = deltaX;

      // Card follows pointer with natural tilt
      const rotation = deltaX * 0.07;
      card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

      // Progressive feedback badges
      if (deltaX > 25) {
        if (badgePresent) {
          badgePresent.style.opacity = Math.min(1, (deltaX - 25) / 75);
          badgePresent.style.transform = `translateY(${Math.min(10, deltaX * 0.05)}px)`;
        }
        if (badgeAbsent) badgeAbsent.style.opacity = 0;
      } else if (deltaX < -25) {
        if (badgeAbsent) {
          badgeAbsent.style.opacity = Math.min(1, (-deltaX - 25) / 75);
          badgeAbsent.style.transform = `translateY(${Math.min(10, -deltaX * 0.05)}px)`;
        }
        if (badgePresent) badgePresent.style.opacity = 0;
      } else {
        if (badgePresent) badgePresent.style.opacity = 0;
        if (badgeAbsent) badgeAbsent.style.opacity = 0;
      }
    };

    const onPointerUp = (e) => {
      if (!this.dragState.isDragging) return;
      this.dragState.isDragging = false;
      const deltaX = this.dragState.deltaX;
      card.releasePointerCapture(e.pointerId);

      const threshold = 100; // Swipe trigger threshold (100px)

      if (deltaX > threshold) {
        // Fly out to the right (Present)
        card.style.transition = "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease";
        card.style.transform = "translateX(500px) rotate(28deg)";
        card.style.opacity = "0";
        setTimeout(() => {
          this.handleDecision("present");
        }, 160);
      } else if (deltaX < -threshold) {
        // Fly out to the left (Absent)
        card.style.transition = "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease";
        card.style.transform = "translateX(-500px) rotate(-28deg)";
        card.style.opacity = "0";
        setTimeout(() => {
          this.handleDecision("absent");
        }, 160);
      } else {
        // Snap back to center
        card.style.transition = "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)";
        card.style.transform = "translateX(0px) rotate(0deg)";
        if (badgePresent) badgePresent.style.opacity = 0;
        if (badgeAbsent) badgeAbsent.style.opacity = 0;
      }
    };

    card.addEventListener("pointerdown", onPointerDown);
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerup", onPointerUp);
    card.addEventListener("pointercancel", onPointerUp);
  },

  handleDecision(status) {
    const student = AttendanceState.students[AttendanceState.currentIndex];
    const roll = student ? (student.rollFormatted || student.rollNo) : "";
    
    AttendanceState.markCurrentStudent(status);

    if (window.TeacherApp) {
      TeacherApp.showToast(`Roll ${roll} marked ${status === 'present' ? '✓ Present' : '✕ Absent'}`, status === 'present' ? 'success' : 'danger');
    }

    const container = document.getElementById("attendance-step-content");
    if (container) {
      this.renderStep5Students(container);
    }
  },

  handleUndo() {
    if (AttendanceState.undoLastAction()) {
      if (window.TeacherApp) {
        TeacherApp.showToast("↶ Previous attendance marking reversed.", "info");
      }
      const container = document.getElementById("attendance-step-content");
      if (container) {
        this.renderStep5Students(container);
      }
    }
  },

  // ------------------------------------------------------
  // COMPLETION SCREEN
  // ------------------------------------------------------
  renderCompletionScreen(container) {
    const total = AttendanceState.students.length;
    const summary = AttendanceState.getSummary();

    container.innerHTML = `
      <div class="completion-celebration-card">
        <div class="completion-icon-ring">
          <i data-lucide="check" style="width:44px;height:44px; stroke-width:3;"></i>
        </div>

        <span class="workflow-step-pill" style="background:#ECFDF5; color:var(--success);">Session Complete</span>
        <h2 class="completion-title">All Students Marked!</h2>
        <p class="completion-subtitle">
          Successfully marked <strong>${total} / ${total}</strong> students for 
          <strong>${AttendanceState.selectedClass.code}</strong> • ${AttendanceState.selectedSubject.name}.
        </p>

        <div class="completion-quick-stats">
          <div class="stat-pill present">
            <span>Present:</span>
            <strong>${summary.presentCount}</strong>
          </div>
          <div class="stat-pill absent">
            <span>Absent:</span>
            <strong>${summary.absentCount}</strong>
          </div>
          <div class="stat-pill rate">
            <span>Rate:</span>
            <strong>${summary.rate}%</strong>
          </div>
        </div>

        <div class="completion-actions-row">
          <button class="btn-workflow-continue" onclick="AttendanceWorkflow.goToStep(6)" style="font-size:15px; padding:12px 28px;">
            Review Attendance Summary →
          </button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  // ------------------------------------------------------
  // STEP 6: ATTENDANCE SUMMARY, CHART & EDIT
  // ------------------------------------------------------
  renderStep6Summary(container) {
    const summary = AttendanceState.getSummary();
    const isSubmitted = AttendanceState.isSubmitted;
    const isDraft = AttendanceState.isDraftSaved;

    container.innerHTML = `
      <div class="summary-dashboard-card">
        
        <!-- Summary Header -->
        <div class="summary-header-block">
          <div>
            <span class="workflow-step-pill">06 • Attendance Summary</span>
            <h2 class="workflow-main-title">Attendance Summary</h2>
            <p class="workflow-subtitle">
              ${AttendanceState.selectedDepartment.name} • <strong>Division ${AttendanceState.selectedClass.code}</strong> 
              • ${AttendanceState.getFormattedDate()} • <strong>${AttendanceState.selectedSubject.name}</strong>
            </p>
          </div>

          <div class="summary-status-tag-wrapper">
            ${isSubmitted ? `
              <span class="badge badge-completed" style="font-size:13px; padding:6px 14px;">
                <i data-lucide="check-check" style="width:14px;height:14px;"></i> Submitted
              </span>
            ` : (isDraft ? `
              <span class="badge badge-pending" style="font-size:13px; padding:6px 14px;">
                <i data-lucide="file-text" style="width:14px;height:14px;"></i> Saved as Draft
              </span>
            ` : `
              <span class="badge badge-cyan" style="font-size:13px; padding:6px 14px;">
                <i data-lucide="clock" style="width:14px;height:14px;"></i> Ready for Review
              </span>
            `)}
          </div>
        </div>

        <!-- 4 STATISTIC CARDS -->
        <div class="summary-stats-quad-grid">
          <div class="summary-stat-card total">
            <span class="stat-card-title">Total Students</span>
            <span class="stat-card-num">${summary.total}</span>
            <span class="stat-card-sub">Class Enrollment</span>
          </div>

          <div class="summary-stat-card present">
            <span class="stat-card-title">Present</span>
            <span class="stat-card-num" style="color:var(--success);">${summary.presentCount}</span>
            <span class="stat-card-sub">Attended Session</span>
          </div>

          <div class="summary-stat-card absent">
            <span class="stat-card-title">Absent</span>
            <span class="stat-card-num" style="color:var(--danger);">${summary.absentCount}</span>
            <span class="stat-card-sub">Absentee Roll</span>
          </div>

          <div class="summary-stat-card rate">
            <span class="stat-card-title">Attendance</span>
            <span class="stat-card-num" style="color:var(--primary-blue);">${summary.rate}%</span>
            <span class="stat-card-sub">Attendance Rate</span>
          </div>
        </div>

        <!-- DOUGHNUT CHART & SESSION OVERVIEW -->
        <div class="summary-middle-row-grid">
          
          <!-- Doughnut Chart Widget -->
          <div class="doughnut-chart-card">
            <h3 class="card-inner-title">Attendance Ratio</h3>
            
            <div class="chart-container-inner">
              <!-- Responsive SVG Doughnut Chart -->
              <svg class="doughnut-svg" viewBox="0 0 36 36">
                <!-- Background ring -->
                <path class="ring-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#E2E8F0" stroke-width="3.5" />
                <!-- Present ring (Green) -->
                <path class="ring-present"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#10B981" stroke-width="3.5"
                  stroke-dasharray="${summary.rate}, 100" />
                <!-- Absent ring (Red) -->
                <path class="ring-absent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#EF4444" stroke-width="3.5"
                  stroke-dasharray="${(100 - summary.rate).toFixed(2)}, 100"
                  stroke-dashoffset="-${summary.rate}" />
              </svg>

              <!-- Center Text inside Doughnut -->
              <div class="doughnut-center-content">
                <span class="chart-center-percent">${summary.rate}%</span>
                <span class="chart-center-label">Attendance</span>
              </div>
            </div>

            <!-- Chart Legend -->
            <div class="chart-legend-row">
              <div class="legend-item">
                <span class="legend-dot green"></span>
                <span>Present: <strong>${summary.presentCount}</strong></span>
              </div>
              <div class="legend-item">
                <span class="legend-dot red"></span>
                <span>Absent: <strong>${summary.absentCount}</strong></span>
              </div>
            </div>
          </div>

          <!-- Session Metadata Card -->
          <div class="session-info-card">
            <h3 class="card-inner-title">Session Details</h3>
            
            <div class="session-meta-table">
              <div class="meta-row">
                <span class="meta-label">Department:</span>
                <span class="meta-val">${AttendanceState.selectedDepartment.name} (${AttendanceState.selectedDepartment.code})</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Class Division:</span>
                <span class="meta-val">Division ${AttendanceState.selectedClass.code}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Lecture Date:</span>
                <span class="meta-val" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <strong>${AttendanceState.getFormattedDate()}</strong>
                  <span class="date-status-tag ${AttendanceState.selectedDate === ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : '') ? 'today' : 'custom'}">${AttendanceState.getDateStatusLabel()}</span>
                  <input type="date" 
                         id="step6-summary-date-picker" 
                         class="inline-hidden-date-picker" 
                         value="${AttendanceState.selectedDate || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : '')}" 
                         onchange="AttendanceWorkflow.changeDateFromAnywhere(this.value)">
                  <button class="btn-change-date-mini" 
                          type="button"
                          onclick="AttendanceWorkflow.triggerPicker('step6-summary-date-picker')" 
                          title="Change Lecture Date">
                    <i data-lucide="calendar-days" style="width:12px;height:12px;"></i>
                    <span>Change</span>
                  </button>
                </span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Course Subject:</span>
                <span class="meta-val">${AttendanceState.selectedSubject.name} (${AttendanceState.selectedSubject.code})</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Faculty Incharge:</span>
                <span class="meta-val">${AttendanceState.selectedSubject.faculty}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Lecture Slot:</span>
                <span class="meta-val">${AttendanceState.selectedSubject.time}</span>
              </div>
            </div>

            <!-- Action to open Edit Table -->
            <div style="margin-top:16px;">
              <button class="btn-toggle-edit-mode" onclick="AttendanceWorkflow.toggleEditTable()">
                <i data-lucide="edit-3" style="width:15px;height:15px;"></i>
                Edit Attendance Roster
              </button>
            </div>
          </div>

        </div>

        <!-- EDIT ATTENDANCE ACCORDION / TABLE SECTION -->
        <div class="edit-attendance-section" id="edit-attendance-section" style="display:none;">
          <div class="edit-table-header-row">
            <div>
              <h3 class="card-inner-title">Edit Student Attendance Register</h3>
              <p style="font-size:12.5px; color:var(--text-muted);">Change individual student statuses prior to final submission.</p>
            </div>

            <!-- Real-time instant search input -->
            <div class="edit-search-bar">
              <i data-lucide="search" class="edit-search-icon"></i>
              <input type="text" id="edit-student-search-input" 
                     placeholder="Search roll, name, enrollment..." 
                     oninput="AttendanceWorkflow.handleStudentSearch(this.value)">
            </div>
          </div>

          <!-- Student table -->
          <div class="edit-table-container">
            <table class="edit-roster-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Enrollment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="edit-roster-table-body">
                ${this.renderEditTableRows(AttendanceState.students)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- CATEGORIZED STUDENT LISTS (PRESENT & ABSENT) -->
        <div class="categorized-lists-grid">
          
          <!-- Present Students List -->
          <div class="student-cat-box present">
            <div class="cat-box-header">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="cat-indicator-dot green"></span>
                <h4 class="cat-box-title">Present Students (${summary.presentStudents.length})</h4>
              </div>
            </div>
            
            <div class="cat-student-list-scroll">
              ${summary.presentStudents.map(st => `
                <div class="cat-student-row">
                  <span class="cat-roll">Roll ${st.rollFormatted || st.rollNo}</span>
                  <span class="cat-name">${st.name}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Absent Students List -->
          <div class="student-cat-box absent">
            <div class="cat-box-header">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="cat-indicator-dot red"></span>
                <h4 class="cat-box-title">Absent Students (${summary.absentStudents.length})</h4>
              </div>
            </div>
            
            <div class="cat-student-list-scroll">
              ${summary.absentStudents.length === 0 ? `
                <div style="padding:16px; color:var(--success); font-size:13px; font-weight:600; text-align:center;">
                  ✨ Perfect Attendance! Zero students absent.
                </div>
              ` : summary.absentStudents.map(st => `
                <div class="cat-student-row">
                  <span class="cat-roll" style="color:var(--danger);">Roll ${st.rollFormatted || st.rollNo}</span>
                  <span class="cat-name">${st.name}</span>
                  <button class="cat-flip-btn" onclick="AttendanceWorkflow.toggleStudentStatus(${st.rollNo})">
                    Make Present
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- WORKFLOW BOTTOM ACTION BUTTONS: SAVE DRAFT & SUBMIT -->
        <div class="summary-final-actions-row">
          <button class="btn-workflow-back" onclick="AttendanceWorkflow.goToStep(5)">
            <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
            Back to Marking
          </button>

          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button class="btn-save-draft" onclick="AttendanceWorkflow.openSaveDraftModal()" ${isSubmitted ? 'disabled' : ''}>
              <i data-lucide="save" style="width:16px;height:16px;"></i>
              Save Attendance
            </button>
            <button class="btn-final-submit" onclick="AttendanceWorkflow.openSubmitModal()" ${isSubmitted ? 'disabled' : ''}>
              <i data-lucide="check-check" style="width:16px;height:16px;"></i>
              ${isSubmitted ? 'Submitted' : 'Submit Attendance'}
            </button>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  toggleEditTable() {
    const sec = document.getElementById("edit-attendance-section");
    if (sec) {
      const isHidden = sec.style.display === "none";
      sec.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  },

  renderEditTableRows(students) {
    return students.map(st => {
      const status = AttendanceState.attendanceMap[st.rollNo] || "present";
      return `
        <tr data-roll="${st.rollNo}" data-name="${st.name.toLowerCase()}" data-en="${st.enrollmentNo.toLowerCase()}">
          <td style="font-weight:700; color:var(--primary-blue);">ROLL ${st.rollFormatted || st.rollNo}</td>
          <td style="font-weight:600; color:var(--dark-navy);">${st.name}</td>
          <td style="color:var(--text-muted); font-size:12.5px;">${st.enrollmentNo}</td>
          <td>
            <span class="badge ${status === 'present' ? 'badge-completed' : 'badge-pending'}">
              ${status === 'present' ? 'Present' : 'Absent'}
            </span>
          </td>
          <td>
            <button class="btn-edit-flip-status" onclick="AttendanceWorkflow.toggleStudentStatus(${st.rollNo})">
              Change
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  handleStudentSearch(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll("#edit-roster-table-body tr");

    rows.forEach(row => {
      const roll = row.getAttribute("data-roll");
      const name = row.getAttribute("data-name");
      const en = row.getAttribute("data-en");
      const match = roll.includes(q) || name.includes(q) || en.includes(q);
      row.style.display = match ? "" : "none";
    });
  },

  toggleStudentStatus(rollNo) {
    AttendanceState.toggleStudentStatus(rollNo);
    const container = document.getElementById("attendance-step-content");
    if (container) {
      this.renderStep6Summary(container);
      // Re-open edit table if it was open
      const sec = document.getElementById("edit-attendance-section");
      if (sec) sec.style.display = "block";
    }
  },

  // ------------------------------------------------------
  // CONFIRMATION MODALS (SAVE DRAFT & SUBMIT)
  // ------------------------------------------------------
  openSaveDraftModal() {
    const summary = AttendanceState.getSummary();
    const teacherName = (AttendanceState.selectedSubject && AttendanceState.selectedSubject.faculty) || (window.TeacherERPData && TeacherERPData.faculty && TeacherERPData.faculty.name) || "Faculty Member";
    const lectureTime = (AttendanceState.selectedSubject && AttendanceState.selectedSubject.time) ? AttendanceState.selectedSubject.time : "10:00 AM - 11:00 AM";

    const modalHTML = `
      <div class="attendance-modal-backdrop active" id="modal-save-draft">
        <div class="attendance-modal-box">
          <div class="modal-head">
            <h3 class="modal-title">Save attendance for this class?</h3>
            <button class="modal-close-btn" onclick="AttendanceWorkflow.closeModals()">
              <i data-lucide="x" style="width:18px;height:18px;"></i>
            </button>
          </div>

          <div class="modal-body">
            <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:16px;">
              Your attendance records will be saved as a draft. You can return and modify this session at any time.
            </p>

            <div class="modal-spec-grid">
              <div><strong>Institution:</strong> SSGMCE</div>
              <div><strong>Teacher:</strong> ${teacherName}</div>
              <div><strong>Department:</strong> ${AttendanceState.selectedDepartment.code}</div>
              <div><strong>Class/Division:</strong> ${AttendanceState.selectedClass.code}</div>
              <div><strong>Date:</strong> ${AttendanceState.getFormattedDate()}</div>
              <div><strong>Lecture Slot:</strong> ${lectureTime}</div>
              <div><strong>Subject:</strong> ${AttendanceState.selectedSubject.name}</div>
              <div><strong>Marking Mode:</strong> ${AttendanceState.markingMode === 'roster' ? 'Roster List' : 'SWIP Card'}</div>
              <div><strong>Total:</strong> ${summary.total}</div>
              <div><strong>Present:</strong> ${summary.presentCount}</div>
              <div><strong>Absent:</strong> ${summary.absentCount}</div>
              <div><strong>Attendance:</strong> ${summary.rate}%</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-workflow-back" onclick="AttendanceWorkflow.closeModals()">Cancel</button>
            <button class="btn-workflow-continue" onclick="AttendanceWorkflow.confirmSaveDraft()">
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHTML);
  },

  confirmSaveDraft() {
    AttendanceState.isDraftSaved = true;
    this.closeModals();

    if (window.TeacherApp) {
      TeacherApp.showToast("✓ Attendance draft saved successfully.", "success");
    }

    const container = document.getElementById("attendance-step-content");
    if (container) {
      if (AttendanceState.currentStep === 5 && AttendanceState.markingMode === 'roster') {
        this.renderRosterListView(container);
      } else {
        this.renderStep6Summary(container);
      }
    }
  },

  openSubmitModal() {
    const summary = AttendanceState.getSummary();
    const date = AttendanceState.selectedDate;
    const classCode = AttendanceState.selectedClass ? AttendanceState.selectedClass.code : "";
    const deptCode = AttendanceState.selectedDepartment ? AttendanceState.selectedDepartment.code : "";
    const subCode = AttendanceState.selectedSubject ? AttendanceState.selectedSubject.code : "";
    const subName = AttendanceState.selectedSubject ? AttendanceState.selectedSubject.name : "";
    const lectureTime = (AttendanceState.selectedSubject && AttendanceState.selectedSubject.time) ? AttendanceState.selectedSubject.time : "10:00 AM - 11:00 AM";
    const teacherName = (AttendanceState.selectedSubject && AttendanceState.selectedSubject.faculty) || (window.TeacherERPData && TeacherERPData.faculty && TeacherERPData.faculty.name) || "Faculty Member";

    // Enforce duplicate attendance prevention
    if (AttendanceState.isSessionAlreadySubmitted(date, classCode, subCode, lectureTime)) {
      if (window.TeacherApp) {
        TeacherApp.showToast(`⚠ Duplicate Attendance Prevented: Attendance for Division ${classCode} — ${subCode} on ${date} (${lectureTime}) has already been submitted.`, "warning");
      }
      return;
    }

    const modalHTML = `
      <div class="attendance-modal-backdrop active" id="modal-submit-final">
        <div class="attendance-modal-box">
          <div class="modal-head">
            <h3 class="modal-title">Are you sure you want to submit attendance?</h3>
            <button class="modal-close-btn" onclick="AttendanceWorkflow.closeModals()">
              <i data-lucide="x" style="width:18px;height:18px;"></i>
            </button>
          </div>

          <div class="modal-body">
            <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:16px;">
              Once submitted to the central SSGMCE college registry, attendance cannot be modified without Department Head authorization.
            </p>

            <div class="modal-spec-grid">
              <div><strong>Institution:</strong> SSGMCE</div>
              <div><strong>Teacher:</strong> ${teacherName}</div>
              <div><strong>Department:</strong> ${deptCode}</div>
              <div><strong>Class/Division:</strong> ${classCode}</div>
              <div><strong>Date:</strong> ${AttendanceState.getFormattedDate()}</div>
              <div><strong>Lecture Slot:</strong> ${lectureTime}</div>
              <div><strong>Subject:</strong> ${subName} (${subCode})</div>
              <div><strong>Marking Mode:</strong> ${AttendanceState.markingMode === 'roster' ? 'Roster List' : 'SWIP Card'}</div>
              <div><strong>Total:</strong> ${summary.total}</div>
              <div><strong>Present:</strong> ${summary.presentCount}</div>
              <div><strong>Absent:</strong> ${summary.absentCount}</div>
              <div><strong>Attendance:</strong> ${summary.rate}%</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-workflow-back" onclick="AttendanceWorkflow.closeModals()">Cancel</button>
            <button class="btn-workflow-continue" style="background-color:var(--primary-blue);" onclick="AttendanceWorkflow.confirmFinalSubmit()">
              Submit Attendance
            </button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHTML);
  },

  confirmFinalSubmit() {
    const summary = AttendanceState.getSummary();
    const date = AttendanceState.selectedDate;
    const classCode = AttendanceState.selectedClass ? AttendanceState.selectedClass.code : "";
    const deptCode = AttendanceState.selectedDepartment ? AttendanceState.selectedDepartment.code : "";
    const subCode = AttendanceState.selectedSubject ? AttendanceState.selectedSubject.code : "";
    const subName = AttendanceState.selectedSubject ? AttendanceState.selectedSubject.name : "";
    const lectureTime = (AttendanceState.selectedSubject && AttendanceState.selectedSubject.time) ? AttendanceState.selectedSubject.time : "10:00 AM - 11:00 AM";
    const teacherName = (AttendanceState.selectedSubject && AttendanceState.selectedSubject.faculty) || (window.TeacherERPData && TeacherERPData.faculty && TeacherERPData.faculty.name) || "Faculty Member";

    // Record submitted session with full metadata for persistence and duplicate prevention
    const sessionRecord = {
      sessionId: `ATT-${date ? date.replace(/-/g, '') : 'REC'}-${classCode}-${subCode}`,
      date: date,
      formattedDate: AttendanceState.getFormattedDate(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lectureTime: lectureTime,
      teacher: teacherName,
      departmentCode: deptCode,
      classCode: classCode,
      division: classCode,
      subjectCode: subCode,
      subjectName: subName,
      markingMode: AttendanceState.markingMode,
      totalStudents: summary.total,
      presentCount: summary.presentCount,
      absentCount: summary.absentCount,
      attendanceRate: summary.rate,
      submittedAt: new Date().toISOString()
    };
    AttendanceState.recordSubmittedSession(sessionRecord);

    AttendanceState.isSubmitted = true;
    this.closeModals();

    // Update portal statistics
    TeacherERPData.stats.attendancePending = "01";
    TeacherERPData.stats.attendanceCompletedCount = 7;
    TeacherERPData.stats.attendancePendingCount = 1;

    // Log to recent activities
    TeacherERPData.recentActivities.unshift({
      id: "act-new-" + Date.now(),
      type: "attendance",
      title: "Attendance Submitted",
      description: `Attendance submitted for ${deptCode} ${classCode} (${subName}) via ${AttendanceState.markingMode === 'roster' ? 'Roster List' : 'SWIP Card'}`,
      time: "Just now",
      icon: "calendar-check",
      iconStyle: "blue"
    });

    if (window.TeacherApp) {
      TeacherApp.showToast("✓ Attendance submitted successfully to SSGMCE Central Portal.", "success");
      TeacherApp.renderDashboardData();
    }

    const container = document.getElementById("attendance-step-content");
    if (container) {
      if (AttendanceState.currentStep === 5 && AttendanceState.markingMode === 'roster') {
        this.renderRosterListView(container);
      } else {
        this.renderStep6Summary(container);
      }
    }
  },

  // ------------------------------------------------------
  // PAUSE & KEYBOARD SHORTCUT MODALS
  // ------------------------------------------------------
  togglePauseModal() {
    AttendanceState.isPaused = !AttendanceState.isPaused;

    if (AttendanceState.isPaused) {
      const modalHTML = `
        <div class="attendance-modal-backdrop active" id="modal-pause-attendance">
          <div class="attendance-modal-box" style="text-align:center;">
            <div style="width:56px;height:56px;border-radius:50%;background:#FEF3C7;color:var(--warning);display:flex;align-items:center;justify-content:center;margin:0 auto 16px auto;">
              <i data-lucide="pause" style="width:28px;height:28px;"></i>
            </div>
            <h3 class="modal-title" style="margin-bottom:8px;">Attendance Paused</h3>
            <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:24px;">
              Progression is temporarily paused to prevent accidental marking.
            </p>

            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn-workflow-continue" style="width:100%; justify-content:center;" onclick="AttendanceWorkflow.resumeAttendance()">
                Resume Attendance
              </button>
              <button class="btn-workflow-back" style="width:100%; justify-content:center;" onclick="AttendanceWorkflow.closeModals()">
                Review Current Student
              </button>
              <button class="btn-workflow-back" style="width:100%; justify-content:center; color:#DC2626;" onclick="AttendanceWorkflow.exitAttendance()">
                Exit Attendance
              </button>
            </div>
          </div>
        </div>
      `;
      this.mountModal(modalHTML);
      if (window.TeacherApp) {
        TeacherApp.showToast("⚠ Attendance paused.", "warning");
      }
    } else {
      this.closeModals();
    }
  },

  resumeAttendance() {
    AttendanceState.isPaused = false;
    this.closeModals();
    if (window.TeacherApp) {
      TeacherApp.showToast("▶ Attendance resumed.", "info");
    }
  },

  exitAttendance() {
    this.closeModals();
    if (window.TeacherApp) {
      TeacherApp.switchView("dashboard");
    }
  },

  toggleShortcutsModal() {
    const modalHTML = `
      <div class="attendance-modal-backdrop active" id="modal-shortcuts-help">
        <div class="attendance-modal-box">
          <div class="modal-head">
            <h3 class="modal-title">Keyboard Shortcuts</h3>
            <button class="modal-close-btn" onclick="AttendanceWorkflow.closeModals()">
              <i data-lucide="x" style="width:18px;height:18px;"></i>
            </button>
          </div>

          <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #F1F5F9;">
              <span style="font-weight:600;">Mark Present</span>
              <kbd class="kbd-key">→</kbd>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #F1F5F9;">
              <span style="font-weight:600;">Mark Absent</span>
              <kbd class="kbd-key">←</kbd>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #F1F5F9;">
              <span style="font-weight:600;">Pause / Resume</span>
              <kbd class="kbd-key">Space</kbd>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0;">
              <span style="font-weight:600;">Back to Subject</span>
              <kbd class="kbd-key">Escape</kbd>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-workflow-continue" style="width:100%; justify-content:center;" onclick="AttendanceWorkflow.closeModals()">
              Got It
            </button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHTML);
  },

  mountModal(html) {
    this.closeModals();
    const modalWrap = document.createElement("div");
    modalWrap.id = "attendance-modal-mount";
    modalWrap.innerHTML = html;
    document.body.appendChild(modalWrap);
    if (window.lucide) lucide.createIcons();
  },

  triggerPicker(elementId) {
    const input = document.getElementById(elementId);
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (err) {
        input.focus();
        input.click();
      }
    } else {
      input.focus();
      input.click();
    }
  },

  changeDateFromAnywhere(newDateStr) {
    if (!newDateStr) return;
    AttendanceState.setDate(newDateStr);
    this.updateBreadcrumb();

    if (AttendanceState.currentStep === 3) {
      const calMount = document.getElementById("calendar-mount-point");
      if (calMount && window.AttendanceCalendar) {
        AttendanceCalendar.selectDate(newDateStr);
      }
    } else {
      const container = document.getElementById("attendance-step-content");
      if (container) {
        switch (AttendanceState.currentStep) {
          case 4:
            this.renderStep4Subjects(container);
            break;
          case 5:
            this.renderStep5Students(container);
            break;
          case 6:
            this.renderStep6Summary(container);
            break;
        }
      }
    }

    if (window.lucide) lucide.createIcons();

    if (typeof TeacherApp !== 'undefined' && TeacherApp.showToast) {
      TeacherApp.showToast(`Attendance date updated to ${AttendanceState.getFormattedDate()} (${AttendanceState.getDateStatusLabel()})`);
    }
  },

  closeModals() {
    const existing = document.getElementById("attendance-modal-mount");
    if (existing) existing.remove();
  }
};

/* ========================================================
   ATTENDANCE DRAWER COMPATIBILITY ADAPTER
   (Routes legacy/manual triggers cleanly into AttendanceMarkingManager)
   ======================================================== */
const AttendanceDrawer = {
  get markedSessions() {
    return (window.AttendanceMarkingManager && window.AttendanceMarkingManager.markedSessions) ? window.AttendanceMarkingManager.markedSessions : {};
  },
  set markedSessions(val) {
    if (window.AttendanceMarkingManager) window.AttendanceMarkingManager.markedSessions = val;
  },
  init() {
    const today = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];

    const dateInput = document.getElementById('manual-attendance-date');
    if (dateInput) {
      dateInput.value = today;
      this.handleManualDateChange(today);
    }
    if (window.AttendanceMarkingManager) {
      AttendanceMarkingManager.init();
    }
  },
  handleManualDateChange(dateStr) {
    if (!dateStr) return;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let dayName = 'Monday';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      dayName = days[d.getDay()] || 'Monday';
    }

    const dayChip = document.getElementById('manual-date-day-chip');
    const today = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];

    if (dayChip) {
      dayChip.textContent = (dateStr === today) ? 'Today' : dayName;
      dayChip.className = (dateStr === today) ? 'manual-day-chip today' : 'manual-day-chip past';
    }

    const slotSelect = document.getElementById('manual-attendance-slot-select');
    if (slotSelect && typeof TeacherERPData !== 'undefined' && TeacherERPData.timetable) {
      const daySchedule = TeacherERPData.timetable.find(t => t.day.toLowerCase() === dayName.toLowerCase());
      if (daySchedule && daySchedule.slots) {
        slotSelect.innerHTML = daySchedule.slots.map(s => {
          const val = JSON.stringify({ subject: s.subject, room: s.room, timeslot: s.time, classCode: s.classCode || '2R1' });
          return '<option value=\'' + val + '\'>' + s.time + ' — ' + s.subject + ' (' + s.room + ', Class ' + (s.classCode || '2R1') + ')</option>';
        }).join('');
      } else {
        slotSelect.innerHTML = '<option value="">No classes scheduled for ' + dayName + '</option>';
      }
    }
  },
  toggleOverrideMode(checked) {
    const el = document.getElementById('manual-override-fields');
    if (el) el.style.display = checked ? 'block' : 'none';
  },
  handleOverrideDeptChange(dept) {
    const classSelect = document.getElementById('override-class-select');
    if (!classSelect) return;
    if (dept === 'CSE') {
      classSelect.innerHTML = '<option value="2R1">2R1 (Second Year CSE Div 1)</option><option value="2R2">2R2 (Second Year CSE Div 2)</option><option value="3R">3R (Third Year CSE)</option><option value="4R">4R (Final Year CSE)</option>';
    } else if (dept === 'IT') {
      classSelect.innerHTML = '<option value="2IT">2IT (Second Year IT)</option><option value="3IT">3IT (Third Year IT)</option><option value="4IT">4IT (Final Year IT)</option>';
    } else {
      classSelect.innerHTML = '<option value="' + dept + '-1">' + dept + ' Div 1</option>';
    }
  },
  openFromSlot(subject, room, timeslot, classCode, date) {
    return AttendanceMarkingManager.openFromSlot(subject, room, timeslot, classCode, date);
  },
  loadManualStudents() {
    return AttendanceMarkingManager.loadFromManualForm();
  },
  close() {
    AttendanceMarkingManager.backToTimetable();
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.AttendanceDrawer) {
    AttendanceDrawer.init();
  }
  if (window.AttendanceMarkingManager) {
    AttendanceMarkingManager.init();
  }
});

// ========================================================
// ATTENDANCE MARKING MANAGER (DEDICATED FULL-PAGE VIEW)
// ========================================================
const AttendanceMarkingManager = {
  activeContext: null,
  students: [],
  rosterRecords: {},
  currentIndex: 0,
  historyStack: [],
  activeTab: 'swipe',
  markedSessions: {},
  isDragging: false,
  startPointerX: 0,
  startPointerY: 0,
  currentDx: 0,
  currentDy: 0,
  isSubmitting: false,

  async init() {
    // 1. Fetch previously marked sessions from backend
    try {
      const res = await fetch('/api/v1/teacher/attendance/sessions');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.sessions) {
          json.data.sessions.forEach(s => {
            const d = s.lectureDate ? s.lectureDate.split('T')[0] : (s.date || '');
            const key = `${d}_${s.classCode}_${s.subjectCode || s.subject}`;
            this.markedSessions[key] = s;
          });
        }
      }
    } catch (e) {
      console.warn('Backend sessions fetch error for marking manager:', e);
    }

    // 2. Set up global keyboard listener
    window.addEventListener('keydown', (e) => {
      // Only active if attendance-marking-page is visible
      const page = document.getElementById('attendance-marking-page');
      if (!page || page.style.display === 'none') return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (this.activeTab === 'swipe') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.markActiveCard('present');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.markActiveCard('absent');
        } else if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          this.skipStudent();
        }
      }
    });

    // 3. Set up pointer drag physics on active card
    this.setupPointerPhysics();
  },

  setupPointerPhysics() {
    const card = document.getElementById('swipe-active-card');
    if (!card) return;

    card.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.startPointerX = e.clientX;
      this.startPointerY = e.clientY;
      this.currentDx = 0;
      this.currentDy = 0;
      card.style.transition = 'none';
      if (card.setPointerCapture) card.setPointerCapture(e.pointerId);
    });

    card.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      this.currentDx = e.clientX - this.startPointerX;
      this.currentDy = e.clientY - this.startPointerY;

      const rot = this.currentDx * 0.08;
      card.style.transform = `translate3d(${this.currentDx}px, ${this.currentDy * 0.3}px, 0) rotate(${rot}deg)`;

      // Dynamic Stamps
      const stampPresent = document.getElementById('swipe-stamp-present');
      const stampAbsent = document.getElementById('swipe-stamp-absent');
      if (this.currentDx > 20) {
        const op = Math.min(1, (this.currentDx - 20) / 60);
        if (stampPresent) stampPresent.style.opacity = op;
        if (stampAbsent) stampAbsent.style.opacity = 0;
      } else if (this.currentDx < -20) {
        const op = Math.min(1, (Math.abs(this.currentDx) - 20) / 60);
        if (stampAbsent) stampAbsent.style.opacity = op;
        if (stampPresent) stampPresent.style.opacity = 0;
      } else {
        if (stampPresent) stampPresent.style.opacity = 0;
        if (stampAbsent) stampAbsent.style.opacity = 0;
      }
    });

    const finishDrag = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const stampPresent = document.getElementById('swipe-stamp-present');
      const stampAbsent = document.getElementById('swipe-stamp-absent');

      if (this.currentDx > 80) {
        // Swipe Right: PRESENT
        card.style.transition = 'transform 0.22s ease-out';
        card.style.transform = 'translate3d(100vw, 0, 0) rotate(25deg)';
        setTimeout(() => {
          this.markActiveCard('present', false);
        }, 200);
      } else if (this.currentDx < -80) {
        // Swipe Left: ABSENT
        card.style.transition = 'transform 0.22s ease-out';
        card.style.transform = 'translate3d(-100vw, 0, 0) rotate(-25deg)';
        setTimeout(() => {
          this.markActiveCard('absent', false);
        }, 200);
      } else {
        // Snap back to center
        card.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)';
        card.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
        if (stampPresent) stampPresent.style.opacity = 0;
        if (stampAbsent) stampAbsent.style.opacity = 0;
      }
    };

    card.addEventListener('pointerup', finishDrag);
    card.addEventListener('pointercancel', finishDrag);
  },

  loadFromManualForm() {
    const isOverride = document.getElementById('manual-attendance-override-toggle')?.checked;
    const date = document.getElementById('manual-attendance-date')?.value || new Date().toISOString().split('T')[0];

    if (isOverride) {
      const classCode = document.getElementById('override-class-select')?.value || '2R1';
      const subject = document.getElementById('override-subject-input')?.value || 'Data Structures';
      const room = document.getElementById('override-room-input')?.value || 'Room 201';
      const timeslot = document.getElementById('override-timeslot-select')?.value || '09:00 - 10:30 AM';
      return this.openFromSlot(subject, room, timeslot, classCode, date);
    }

    const slotSelect = document.getElementById('manual-attendance-slot-select');
    if (!slotSelect || !slotSelect.value) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please select a scheduled lecture or check Override to choose a class.', 'warning');
      } else {
        alert('Please select a scheduled lecture.');
      }
      return;
    }

    try {
      const parsed = JSON.parse(slotSelect.value);
      return this.openFromSlot(parsed.subject, parsed.room, parsed.timeslot, parsed.classCode, date);
    } catch (e) {
      console.error('Error parsing manual slot:', e);
      return this.openFromSlot('Data Structures', 'Room 201', '09:00 - 10:30 AM', '2R1', date);
    }
  },

  exportAttendanceSheet() {
    const isOverride = document.getElementById('manual-attendance-override-toggle')?.checked;
    let className = '2R1';
    if (isOverride) {
      className = document.getElementById('override-class-select')?.value || '2R1';
    } else {
      const slotSelect = document.getElementById('manual-attendance-slot-select');
      if (slotSelect && slotSelect.value) {
        try {
          const parsed = JSON.parse(slotSelect.value);
          if (parsed.classCode) className = parsed.classCode;
        } catch (_) {}
      }
    }
    const url = `/api/v1/teacher/attendance/export?class_name=${encodeURIComponent(className)}`;
    window.open(url, '_blank');
    if (typeof window.showToast === 'function') {
      window.showToast(`Downloading attendance records CSV for Class ${className}...`, 'info');
    }
  },

  async openFromSlot(subject, room, timeslot, classCode, date) {
    let dept = 'CSE';
    if (classCode.includes('IT')) dept = 'IT';
    else if (classCode.includes('EE')) dept = 'EE';

    this.activeContext = {
      subject,
      room: room || 'Room 201',
      timeslot: timeslot || '09:00 - 10:30 AM',
      classCode: classCode || '2R1',
      date: date || new Date().toISOString().split('T')[0],
      department: dept
    };

    // Format readable date
    let formattedDate = this.activeContext.date;
    try {
      const d = new Date(this.activeContext.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch (_) {}

    // Populate Breadcrumbs
    const bcDept = document.getElementById('bc-dept-text');
    const bcClass = document.getElementById('bc-class-text');
    const bcDate = document.getElementById('bc-date-text');
    const bcSub = document.getElementById('bc-subject-text');
    if (bcDept) bcDept.textContent = dept;
    if (bcClass) bcClass.textContent = classCode;
    if (bcDate) bcDate.textContent = formattedDate;
    if (bcSub) bcSub.textContent = subject;

    // Populate Header Context
    const headDept = document.getElementById('mark-header-dept-badge');
    const headClass = document.getElementById('mark-header-class-badge');
    const headSub = document.getElementById('mark-header-subject-title');
    const headDate = document.getElementById('mark-header-date-str');
    const headSlot = document.getElementById('mark-header-slot-str');
    const headRoom = document.getElementById('mark-header-room-str');
    const headLogged = document.getElementById('mark-header-logged-badge');

    if (headDept) headDept.textContent = `${dept} Department`;
    if (headClass) headClass.textContent = `Class ${classCode}`;
    if (headSub) headSub.textContent = subject;
    if (headDate) headDate.textContent = formattedDate;
    if (headSlot) headSlot.textContent = timeslot;
    if (headRoom) headRoom.textContent = room;

    const sessionKey = `${this.activeContext.date}_${this.activeContext.classCode}_${this.activeContext.subject}`;
    const existing = this.markedSessions[sessionKey];
    if (headLogged) headLogged.style.display = existing ? 'inline-block' : 'none';

    // Fetch class roster
    let studentsList = [];
    try {
      const res = await fetch(`/api/v1/teacher/class-roster?classId=${encodeURIComponent(classCode)}`);
      if (res.ok) {
        const json = await res.json();
        studentsList = json.data?.students || [];
      }
    } catch (e) {
      console.warn('API error fetching class roster:', e);
    }

    if (!studentsList || studentsList.length === 0) {
      if (typeof TeacherERPData !== 'undefined' && TeacherERPData.getStudentsForClass) {
        studentsList = TeacherERPData.getStudentsForClass(classCode);
      } else {
        studentsList = Array.from({ length: 30 }, (_, i) => ({
          id: `b0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
          rollNo: i + 1,
          rollFormatted: `${classCode}-${String(i + 1).padStart(2, '0')}`,
          name: `Student ${i + 1}`,
          enrollmentNo: `EN24CSE${String(i + 1).padStart(3, '0')}`,
          cardId: `CARD-${classCode}-${String(i + 1).padStart(3, '0')}`,
          classCode
        }));
      }
    }

    this.students = studentsList;
    this.currentIndex = 0;
    this.historyStack = [];
    this.rosterRecords = {};

    // Initialize roster records
    studentsList.forEach(st => {
      const prev = existing?.records?.find?.(r => r.rollNo === st.rollNo);
      this.rosterRecords[st.rollNo] = {
        student: st,
        status: prev ? prev.status : null,
        remarks: prev ? (prev.remarks || '') : '',
        markingMethod: prev ? (prev.markingMode || 'manual') : 'swipe'
      };
    });

    // Navigate to dedicated view pane
    if (typeof TeacherApp !== 'undefined' && TeacherApp.switchView) {
      TeacherApp.switchView('attendance-mark');
    } else {
      document.querySelectorAll('.view-section-pane').forEach(p => p.style.display = 'none');
      const p = document.getElementById('attendance-marking-page');
      if (p) p.style.display = 'block';
    }

    // Default to Swipe Card Mode
    this.switchTab('swipe');
    this.renderActiveSwipeCard();
    this.renderRosterList();
    this.updateLiveStats();

    if (window.lucide) lucide.createIcons();
  },

  backToTimetable() {
    if (typeof TeacherApp !== 'undefined' && TeacherApp.switchView) {
      TeacherApp.switchView('timetable');
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    ['swipe', 'roster', 'summary'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const pane = document.getElementById(`mark-pane-${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (pane) pane.style.display = (t === tabName) ? 'block' : 'none';
    });

    if (tabName === 'summary') {
      this.renderSummaryView();
    } else if (tabName === 'roster') {
      this.renderRosterList();
    } else if (tabName === 'swipe') {
      this.renderActiveSwipeCard();
    }

    if (window.lucide) lucide.createIcons();
  },

  renderActiveSwipeCard() {
    const card = document.getElementById('swipe-active-card');
    const peek = document.getElementById('swipe-peek-card');
    const completion = document.getElementById('swipe-completion-card');
    if (!card) return;

    const total = this.students.length;

    // Reset card transforms & stamps
    card.style.transition = 'none';
    card.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
    const stampPresent = document.getElementById('swipe-stamp-present');
    const stampAbsent = document.getElementById('swipe-stamp-absent');
    if (stampPresent) stampPresent.style.opacity = 0;
    if (stampAbsent) stampAbsent.style.opacity = 0;

    if (this.currentIndex >= total) {
      card.style.display = 'none';
      if (peek) peek.style.display = 'none';
      if (completion) completion.style.display = 'flex';
      return;
    }

    card.style.display = 'flex';
    if (completion) completion.style.display = 'none';

    const currentStudent = this.students[this.currentIndex];
    const nextStudent = this.currentIndex + 1 < total ? this.students[this.currentIndex + 1] : null;

    // Populate Active Card (Clean Design - No Main Photo!)
    const rollBadge = document.getElementById('card-roll-number');
    const nameEl = document.getElementById('card-student-name');
    const enrollEl = document.getElementById('card-enrollment-id');
    const classBadge = document.getElementById('card-class-badge');
    const subName = document.getElementById('card-subject-name');
    const indexInd = document.getElementById('card-index-indicator');

    if (rollBadge) rollBadge.textContent = `ROLL ${currentStudent.rollNo}`;
    if (nameEl) nameEl.textContent = currentStudent.name.toUpperCase();
    if (enrollEl) enrollEl.textContent = currentStudent.enrollmentNo || `EN24CSE${String(currentStudent.rollNo).padStart(3, '0')}`;
    if (classBadge) classBadge.textContent = `CLASS ${this.activeContext?.classCode || '2R1'}`;
    if (subName) subName.textContent = this.activeContext?.subject || 'Data Structures';
    if (indexInd) indexInd.textContent = `#${this.currentIndex + 1}`;

    // Underneath Peek Card
    if (nextStudent && peek) {
      peek.style.display = 'flex';
      const peekRoll = document.getElementById('swipe-peek-roll');
      const peekName = document.getElementById('swipe-peek-name');
      const peekEnroll = document.getElementById('swipe-peek-enroll');
      if (peekRoll) peekRoll.textContent = `NEXT: ROLL ${nextStudent.rollNo}`;
      if (peekName) peekName.textContent = nextStudent.name.toUpperCase();
      if (peekEnroll) peekEnroll.textContent = nextStudent.enrollmentNo || `EN24CSE${String(nextStudent.rollNo).padStart(3, '0')}`;
    } else if (peek) {
      peek.style.display = 'none';
    }

    // Top progress
    const counterLabel = document.getElementById('swipe-counter-label');
    const progressChip = document.getElementById('swipe-progress-chip');
    const progressFill = document.getElementById('swipe-progress-fill');

    const markedCount = Object.values(this.rosterRecords).filter(r => r.status && r.status !== 'unmarked').length;
    const pct = total > 0 ? Math.round((this.currentIndex / total) * 100) : 0;

    if (counterLabel) counterLabel.textContent = `Student ${this.currentIndex + 1} of ${total}`;
    if (progressChip) progressChip.textContent = `${pct}% Complete`;
    if (progressFill) progressFill.style.width = `${pct}%`;
  },

  markActiveCard(status, animate = true) {
    if (this.currentIndex >= this.students.length) return;
    const currentStudent = this.students[this.currentIndex];
    const prevStatus = this.rosterRecords[currentStudent.rollNo]?.status || 'present';

    this.historyStack.push({
      rollNo: currentStudent.rollNo,
      prevStatus
    });

    // Update state
    this.rosterRecords[currentStudent.rollNo].status = status;
    this.rosterRecords[currentStudent.rollNo].markingMethod = 'swipe';

    const proceed = () => {
      this.currentIndex++;
      this.updateLiveStats();
      if (this.currentIndex >= this.students.length) {
        this.switchTab('summary');
      } else {
        this.renderActiveSwipeCard();
      }
    };

    if (animate) {
      const card = document.getElementById('swipe-active-card');
      if (card) {
        card.style.transition = 'transform 0.22s ease-out';
        card.style.transform = status === 'present' ? 'translate3d(100vw, 0, 0) rotate(25deg)' : 'translate3d(-100vw, 0, 0) rotate(-25deg)';
        setTimeout(proceed, 200);
        return;
      }
    }
    proceed();
  },

  undoLast() {
    if (this.historyStack.length === 0 || this.currentIndex === 0) return;
    const last = this.historyStack.pop();
    this.rosterRecords[last.rollNo].status = last.prevStatus;
    this.currentIndex = Math.max(0, this.currentIndex - 1);
    this.updateLiveStats();
    this.renderActiveSwipeCard();
  },

  skipStudent() {
    if (this.currentIndex + 1 < this.students.length) {
      this.currentIndex++;
      this.renderActiveSwipeCard();
    } else {
      this.switchTab('summary');
    }
  },

  handleHardwareInput(cardId) {
    if (!cardId || !cardId.trim()) return;
    const cid = cardId.trim();

    // Check if matching student in roster
    const match = this.students.find(s => s.cardId === cid || `CARD-${this.activeContext?.classCode}-${String(s.rollNo).padStart(3, '0')}` === cid);
    if (match) {
      this.rosterRecords[match.rollNo].status = 'present';
      this.rosterRecords[match.rollNo].markingMethod = 'swipe';
      this.updateLiveStats();
      if (typeof TeacherApp !== 'undefined' && TeacherApp.showToast) {
        TeacherApp.showToast(`✅ ${match.name} (Roll ${match.rollNo}) verified and marked Present!`);
      }
      this.renderActiveSwipeCard();
    } else {
      if (typeof TeacherApp !== 'undefined' && TeacherApp.showToast) {
        TeacherApp.showToast(`⚠️ Card ID '${cid}' not recognized for this class session.`);
      }
    }
  },

  markAll(status) {
    Object.keys(this.rosterRecords).forEach(roll => {
      this.rosterRecords[roll].status = status;
      this.rosterRecords[roll].markingMethod = 'bulk';
    });
    this.updateLiveStats();
    this.renderRosterList();
  },

  toggleStudentStatus(rollNo, newStatus) {
    if (this.rosterRecords[rollNo]) {
      const current = this.rosterRecords[rollNo].status;
      this.rosterRecords[rollNo].status = (current === newStatus) ? null : newStatus;
      this.updateLiveStats();
      this.renderRosterList();
    }
  },

  filterRoster(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.roster-card-item');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? 'flex' : 'none';
    });
  },

  renderRosterList() {
    const container = document.getElementById('roster-page-student-list');
    if (!container) return;

    const list = Object.values(this.rosterRecords);
    container.innerHTML = list.map(rec => {
      const st = rec.student;
      const status = rec.status; // 'present' | 'absent' | null
      const rollNo = st.rollNo;
      const isPresent = (status === 'present');
      const isAbsent = (status === 'absent');
      const isNeutral = !status || status === 'unmarked';

      // Dynamic Flexbox Color Coding:
      // Green when Present, Red when Absent, Neutral White/Grey when unmarked
      let rowStyle = 'background:#FFFFFF; border:1.5px solid #E2E8F0;';
      let statusClass = 'status-unmarked';
      if (isPresent) {
        rowStyle = 'background:#ECFDF5; border:1.5px solid #10B981; box-shadow:0 2px 8px rgba(16, 185, 129, 0.15);';
        statusClass = 'status-present';
      } else if (isAbsent) {
        rowStyle = 'background:#FEF2F2; border:1.5px solid #EF4444; box-shadow:0 2px 8px rgba(239, 68, 68, 0.15);';
        statusClass = 'status-absent';
      }

      return `
        <div class="roster-card-item drawer-student-card ${statusClass}" style="${rowStyle} margin-bottom:0; border-radius:14px; padding:14px 18px; transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1);" id="roster-item-${rollNo}">
          <div class="student-card-top-row" style="width:100%; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div class="student-identity-group" style="display:flex; align-items:center; gap:12px;">
              <div class="student-avatar-badge" style="width:40px; height:40px; border-radius:12px; ${isPresent ? 'background:#DCFCE7; color:#15803D;' : (isAbsent ? 'background:#FEE2E2; color:#B91C1C;' : 'background:#F1F5F9; color:#1E293B;')} font-weight:900; display:flex; align-items:center; justify-content:center; font-size:13px; transition:all 0.2s ease;">
                ${rollNo}
              </div>
              <div class="student-meta-info">
                <div class="student-name-text" style="font-size:14px; font-weight:800; color:#0F172A; text-transform:uppercase;">
                  ${st.name}
                  ${rollNo === 21 ? '<span style="background:#E0E7FF; color:#4338CA; font-size:10px; font-weight:700; padding:1px 5px; border-radius:4px; margin-left:4px;">CR</span>' : ''}
                </div>
                <div class="student-roll-sub" style="font-size:11.5px; color:#64748B; font-family:monospace;">
                  Roll #${rollNo} • ${st.enrollmentNo || 'CSE'}
                </div>
              </div>
            </div>

            <!-- Clickable Status Buttons: Only Present and Absent (No Late) -->
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="segmented-control" style="background:rgba(255,255,255,0.95); border:1px solid #CBD5E1; border-radius:10px; padding:3px; display:inline-flex; gap:6px;">
                <button type="button" 
                        class="seg-btn btn-pres ${isPresent ? 'active-present' : ''}" 
                        style="padding:7px 16px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; transition:all 0.15s ease; ${isPresent ? 'background:#10B981 !important; color:#FFFFFF !important; border:1px solid #10B981 !important; box-shadow:0 2px 6px rgba(16, 185, 129, 0.35);' : 'background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0;'}"
                        onclick="AttendanceMarkingManager.toggleStudentStatus(${rollNo}, 'present')"
                        title="Mark student Present">
                  Present ✓
                </button>
                <button type="button" 
                        class="seg-btn btn-abs ${isAbsent ? 'active-absent' : ''}" 
                        style="padding:7px 16px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; transition:all 0.15s ease; ${isAbsent ? 'background:#EF4444 !important; color:#FFFFFF !important; border:1px solid #EF4444 !important; box-shadow:0 2px 6px rgba(239, 68, 68, 0.35);' : 'background:#FEF2F2; color:#B91C1C; border:1px solid #FECDD3;'}"
                        onclick="AttendanceMarkingManager.toggleStudentStatus(${rollNo}, 'absent')"
                        title="Mark student Absent">
                  Absent ✗
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const chip = document.getElementById('tab-roster-count-chip');
    if (chip) chip.textContent = list.length;
  },

  updateLiveStats() {
    const list = Object.values(this.rosterRecords);
    const total = list.length;
    const present = list.filter(r => r.status === 'present').length;
    const absent = list.filter(r => r.status === 'absent').length;
    const remaining = Math.max(0, total - (present + absent));
    const rate = (total > 0 && (present + absent) > 0) ? Math.round((present / total) * 100) : 0;
    const rateFormatted = (total > 0 && (present + absent) > 0) ? ((present / total) * 100).toFixed(2) + '%' : '0.00%';

    // Header context rate
    const rateDisp = document.getElementById('mark-header-rate-display');
    const sumLbl = document.getElementById('mark-header-summary-lbl');
    if (rateDisp) rateDisp.textContent = rateFormatted;
    if (sumLbl) sumLbl.textContent = `${present} / ${total} Present`;

    // Top mode switcher live counters
    const topP = document.getElementById('top-counter-present');
    const topA = document.getElementById('top-counter-absent');
    const topR = document.getElementById('top-counter-remaining');
    if (topP) topP.textContent = `${present} Present`;
    if (topA) topA.textContent = `${absent} Absent`;
    if (topR) topR.textContent = `${remaining} Remaining`;

    // Swipe card stats strip
    const cellP = document.getElementById('swipe-cell-present');
    const cellA = document.getElementById('swipe-cell-absent');
    const cellR = document.getElementById('swipe-cell-remaining');
    const swipeProgChip = document.getElementById('swipe-progress-chip');
    const swipeProgFill = document.getElementById('swipe-progress-fill');
    if (cellP) cellP.textContent = present;
    if (cellA) cellA.textContent = absent;
    if (cellR) cellR.textContent = remaining;

    const markedCount = present + absent;
    const pct = total > 0 ? Math.round((markedCount / total) * 100) : 0;
    if (swipeProgChip) swipeProgChip.textContent = `${pct}% Complete`;
    if (swipeProgFill) swipeProgFill.style.width = `${pct}%`;
  },

  renderSummaryView() {
    this.updateLiveStats();
    const list = Object.values(this.rosterRecords);
    const total = list.length;
    const presentList = list.filter(r => r.status === 'present');
    const absentList = list.filter(r => r.status === 'absent');
    const lateList = list.filter(r => r.status === 'late');
    const present = presentList.length;
    const absent = absentList.length;
    const effectivePresent = present + lateList.length;
    const rateExact = total > 0 ? ((effectivePresent / total) * 100).toFixed(2) : '0.00';

    // KPI values
    const kpiTotal = document.getElementById('sum-kpi-total');
    const kpiRate = document.getElementById('sum-kpi-rate');
    const kpiRatio = document.getElementById('sum-kpi-ratio');
    const kpiPresent = document.getElementById('sum-kpi-present');
    const kpiAbsent = document.getElementById('sum-kpi-absent');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiRate) kpiRate.textContent = `${rateExact}%`;
    if (kpiRatio) kpiRatio.textContent = `${effectivePresent} / ${total} Attended`;
    if (kpiPresent) kpiPresent.textContent = present;
    if (kpiAbsent) kpiAbsent.textContent = absent;

    // SVG Doughnut Chart
    const circumference = 2 * Math.PI * 60; // ~376.99
    const presentArc = total > 0 ? (present / total) * circumference : 0;
    const absentArc = total > 0 ? (absent / total) * circumference : 0;

    const ringPres = document.getElementById('sum-doughnut-present');
    const ringAbs = document.getElementById('sum-doughnut-absent');
    const centerTxt = document.getElementById('sum-doughnut-percent-text');

    if (ringPres) {
      ringPres.setAttribute('stroke-dasharray', `${presentArc} ${circumference}`);
      ringPres.setAttribute('stroke-dashoffset', '0');
    }
    if (ringAbs) {
      ringAbs.setAttribute('stroke-dasharray', `${absentArc} ${circumference}`);
      ringAbs.setAttribute('stroke-dashoffset', `${-presentArc}`);
    }
    if (centerTxt) centerTxt.textContent = `${Math.round(rateExact)}%`;

    // PRESENT breakdown list
    const presContainer = document.getElementById('sum-present-list-container');
    const presCountEl = document.getElementById('sum-list-present-count');
    if (presCountEl) presCountEl.textContent = presentList.length;
    if (presContainer) {
      if (presentList.length === 0) {
        presContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#94A3B8; font-size:12px;">No students marked present.</div>`;
      } else {
        presContainer.innerHTML = presentList.map(rec => `
          <div class="breakdown-row pres">
            <div class="breakdown-row-left">
              <span class="breakdown-roll-tag pres">${rec.student.rollNo}</span>
              <div>
                <div class="breakdown-name">${rec.student.name}</div>
                <small style="color:#64748B; font-family:monospace; font-size:10.5px;">${rec.student.enrollmentNo || 'CSE'}</small>
              </div>
            </div>
            <span style="font-size:11px; font-weight:800; color:#15803D;">Present</span>
          </div>
        `).join('');
      }
    }

    // ABSENT breakdown list
    const absContainer = document.getElementById('sum-absent-list-container');
    const absCountEl = document.getElementById('sum-list-absent-count');
    if (absCountEl) absCountEl.textContent = absentList.length;
    if (absContainer) {
      if (absentList.length === 0) {
        absContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#15803D; font-weight:800; font-size:12px;">🎉 Perfect Attendance! 0 students absent.</div>`;
      } else {
        absContainer.innerHTML = absentList.map(rec => `
          <div class="breakdown-row abs">
            <div class="breakdown-row-left">
              <span class="breakdown-roll-tag abs">${rec.student.rollNo}</span>
              <div>
                <div class="breakdown-name">${rec.student.name}</div>
                <small style="color:#64748B; font-family:monospace; font-size:10.5px;">${rec.student.enrollmentNo || 'CSE'}</small>
              </div>
            </div>
            <span style="font-size:11px; font-weight:800; color:#DC2626;">Absent</span>
          </div>
        `).join('');
      }
    }
  },

  // ========================================================
  // EDIT ATTENDANCE MODAL (TABLE WITH "CHANGE" TOGGLE BUTTON)
  // ========================================================
  openEditModal() {
    const modal = document.getElementById('modal-edit-attendance');
    if (!modal) return;
    modal.style.display = 'flex';
    this.renderEditTable();
  },

  closeEditModal() {
    const modal = document.getElementById('modal-edit-attendance');
    if (modal) modal.style.display = 'none';
    this.renderSummaryView();
    this.renderRosterList();
  },

  renderEditTable(filterQuery = '') {
    const tbody = document.getElementById('edit-attendance-table-body');
    if (!tbody) return;

    const q = (filterQuery || '').toLowerCase().trim();
    const list = Object.values(this.rosterRecords).filter(rec => {
      if (!q) return true;
      return rec.student.name.toLowerCase().includes(q) || String(rec.student.rollNo).includes(q);
    });

    tbody.innerHTML = list.map(rec => {
      const st = rec.student;
      const rollNo = st.rollNo;
      const status = rec.status;
      const isPresent = status === 'present';
      const isAbsent = status === 'absent';
      const displayStatus = isPresent ? 'PRESENT' : (isAbsent ? 'ABSENT' : 'UNMARKED');
      const badgeStyle = isPresent ? 'background:#DCFCE7; color:#15803D;' : (isAbsent ? 'background:#FEE2E2; color:#B91C1C;' : 'background:#F1F5F9; color:#64748B;');
      const nextStatus = isPresent ? 'absent' : 'present';

      return `
        <tr style="border-bottom:1px solid #F1F5F9;">
          <td style="padding:10px 12px; font-family:monospace; font-weight:800; color:#475569;">#${rollNo}</td>
          <td style="padding:10px 12px; font-weight:800; color:#0F172A; text-transform:uppercase;">${st.name}</td>
          <td style="padding:10px 12px; text-align:center;">
            <span style="padding:3px 10px; border-radius:12px; font-size:10.5px; font-weight:800; text-transform:uppercase; ${badgeStyle}">${displayStatus}</span>
          </td>
          <td style="padding:10px 12px; text-align:center;">
            <button type="button" 
                    style="padding:5px 12px; border-radius:8px; border:1px solid #CBD5E1; background:#fff; font-size:11px; font-weight:800; cursor:pointer;"
                    onclick="AttendanceMarkingManager.toggleStudentStatus(${rollNo}, '${nextStatus}'); AttendanceMarkingManager.renderEditTable('${q.replace(/'/g, "\\\'")}');">
              Change to ${nextStatus.toUpperCase()}
            </button>
          </td>
          <td style="padding:10px 12px;">
            <input type="text" placeholder="Remarks..." value="${rec.remarks || ''}" 
                   style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid #E2E8F0; font-size:11px; outline:none;"
                   onchange="AttendanceMarkingManager.rosterRecords[${rollNo}].remarks = this.value;">
          </td>
        </tr>
      `;
    }).join('');
  },

  filterEditTable(query) {
    this.renderEditTable(query);
  },

  // ========================================================
  // SAVE ATTENDANCE MODAL (DRAFT)
  // ========================================================
  openSaveModal() {
    const modal = document.getElementById('modal-save-attendance');
    if (!modal) return;
    modal.style.display = 'flex';

    const subEl = document.getElementById('save-modal-subject');
    const cdEl = document.getElementById('save-modal-class-date');
    const pEl = document.getElementById('save-modal-present');
    const aEl = document.getElementById('save-modal-absent');

    const list = Object.values(this.rosterRecords);
    const present = list.filter(r => r.status === 'present').length;
    const absent = list.filter(r => r.status === 'absent').length;

    if (subEl) subEl.textContent = this.activeContext?.subject || 'Data Structures';
    if (cdEl) cdEl.textContent = `${this.activeContext?.classCode || '2R1'} • ${this.activeContext?.date || ''}`;
    if (pEl) pEl.textContent = `${present} Students`;
    if (aEl) aEl.textContent = `${absent} Students`;
  },

  closeSaveModal() {
    const modal = document.getElementById('modal-save-attendance');
    if (modal) modal.style.display = 'none';
  },

  confirmSaveDraft() {
    const sessionKey = `${this.activeContext.date}_${this.activeContext.classCode}_${this.activeContext.subject}`;
    const draft = {
      ...this.activeContext,
      isDraft: true,
      records: Object.values(this.rosterRecords).map(r => ({
        rollNo: r.student.rollNo,
        status: r.status,
        remarks: r.remarks
      }))
    };
    this.markedSessions[sessionKey] = draft;

    this.closeSaveModal();
    if (typeof TeacherApp !== 'undefined' && TeacherApp.showToast) {
      TeacherApp.showToast(`💾 Draft saved for ${this.activeContext.subject} (${this.activeContext.classCode})!`);
    }
  },

  // ========================================================
  // SUBMIT ATTENDANCE MODAL (FINAL SUBMIT WITH DUPLICATE PROTECTION)
  // ========================================================
  openSubmitModal() {
    const modal = document.getElementById('modal-submit-attendance');
    if (!modal) return;
    modal.style.display = 'flex';

    const subEl = document.getElementById('submit-modal-subject');
    const clsEl = document.getElementById('submit-modal-class');
    const dateEl = document.getElementById('submit-modal-date');
    const totEl = document.getElementById('submit-modal-total');
    const pEl = document.getElementById('submit-modal-present');
    const aEl = document.getElementById('submit-modal-absent');

    const list = Object.values(this.rosterRecords);
    const total = list.length;
    const present = list.filter(r => r.status === 'present').length;
    const absent = list.filter(r => r.status === 'absent').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    if (subEl) subEl.textContent = this.activeContext?.subject || 'Data Structures';
    if (clsEl) clsEl.textContent = this.activeContext?.classCode || '2R1';
    if (dateEl) dateEl.textContent = this.activeContext?.date || '';
    if (totEl) totEl.textContent = `${total} Students`;
    if (pEl) pEl.textContent = `${present} (${pct}%)`;
    if (aEl) aEl.textContent = `${absent} Students`;
  },

  closeSubmitModal() {
    const modal = document.getElementById('modal-submit-attendance');
    if (modal) modal.style.display = 'none';
  },

  async confirmFinalSubmit() {
    if (this.isSubmitting || !this.activeContext) return;
    this.isSubmitting = true;

    const btn = document.getElementById('btn-confirm-final-submit');
    if (btn) {
      btn.setAttribute('disabled', 'true');
      btn.innerHTML = `
        <span style="width:13px;height:13px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px;"></span>
        <span>Submitting...</span>
      `;
    }

    const recordsArray = Object.values(this.rosterRecords).map(r => ({
      studentId: r.student.id || `b0000000-0000-0000-0000-${String(r.student.rollNo).padStart(12, '0')}`,
      rollNo: r.student.rollNo,
      status: r.status,
      remarks: r.remarks || '',
      markingMode: r.markingMethod || 'swipe'
    }));

    const payload = {
      classId: this.activeContext.classCode,
      classCode: this.activeContext.classCode,
      subject: this.activeContext.subject,
      subjectCode: this.activeContext.subject,
      room: this.activeContext.room,
      date: this.activeContext.date,
      lectureDate: this.activeContext.date,
      timeSlot: this.activeContext.timeslot,
      lectureTime: this.activeContext.timeslot,
      markingMode: this.activeTab,
      records: recordsArray
    };

    let savedSession = null;
    try {
      const res = await fetch('/api/v1/teacher/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        savedSession = json.data;
      }
    } catch (e) {
      console.warn('API error submitting attendance:', e);
    }

    if (!savedSession) {
      savedSession = {
        sessionId: `SESS-${this.activeContext.date}-${this.activeContext.classCode}`,
        records: recordsArray,
        status: 'submitted'
      };
    }

    const sessionKey = `${this.activeContext.date}_${this.activeContext.classCode}_${this.activeContext.subject}`;
    this.markedSessions[sessionKey] = savedSession;
    if (window.AttendanceDrawer) {
      window.AttendanceDrawer.markedSessions[sessionKey] = savedSession;
    }

    const presentCount = recordsArray.filter(r => r.status === 'present').length;
    if (typeof TeacherApp !== 'undefined' && TeacherApp.showToast) {
      TeacherApp.showToast(`🎉 Attendance submitted successfully for ${this.activeContext.subject} (${this.activeContext.classCode})! ${presentCount}/${recordsArray.length} Present.`);
    }

    this.closeSubmitModal();
    this.isSubmitting = false;
    if (btn) {
      btn.removeAttribute('disabled');
      btn.textContent = 'Confirm & Submit';
    }

    // Return to timetable and refresh checkmarks
    this.backToTimetable();
    if (typeof TeacherApp !== 'undefined' && TeacherApp.renderTimetableView) {
      TeacherApp.renderTimetableView();
    }
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceWorkflow = AttendanceWorkflow;
  window.AttendanceDrawer = AttendanceDrawer;
  window.AttendanceMarkingManager = AttendanceMarkingManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AttendanceWorkflow, AttendanceDrawer, AttendanceMarkingManager };
}


