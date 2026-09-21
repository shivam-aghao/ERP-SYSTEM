/* ========================================================
   TEACHER ERP MAIN APPLICATION CONTROLLER
   ======================================================== */

const TeacherApp = {
  currentView: 'dashboard',

  init() {
    this.bindEvents();
    this.renderDashboardData();
    this.renderTimetableView();
    this.renderStudentsView();
    this.renderSyllabusView();
    this.renderResultsView();
    this.renderNotificationsList();
    this.initLucideIcons();
  },

  initLucideIcons() {
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  bindEvents() {
    // Mobile hamburger menu toggle
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (hamburgerBtn && sidebar && overlay) {
      hamburgerBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }

    // Header Profile Dropdown toggle
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

    // Header Notification Dropdown toggle
    const notifBtn = document.getElementById("header-notification-btn");
    const notifMenu = document.getElementById("notification-dropdown-menu");

    if (notifBtn && notifMenu) {
      notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = notifMenu.classList.contains("show");
        this.closeAllDropdowns();
        if (!isOpen) {
          notifMenu.classList.add("show");
          // Hide badge when opened
          const badge = document.getElementById("header-notif-badge");
          if (badge) badge.style.display = "none";
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", () => {
      this.closeAllDropdowns();
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

  closeAllDropdowns() {
    const profileMenu = document.getElementById("profile-dropdown-menu");
    const profileTrigger = document.getElementById("profile-dropdown-trigger");
    const notifMenu = document.getElementById("notification-dropdown-menu");

    if (profileMenu) profileMenu.classList.remove("show");
    if (profileTrigger) profileTrigger.classList.remove("active");
    if (notifMenu) notifMenu.classList.remove("show");
  },

  // ----------------------------------------------------
  // VIEW ROUTING / SWITCHING
  // ----------------------------------------------------
  switchView(viewName) {
    this.currentView = viewName;

    // Update navigation active state
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      item.classList.remove("active");
      if (item.dataset.view === viewName) {
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

    // Hide all view containers
    document.querySelectorAll(".view-section-pane").forEach(pane => {
      pane.style.display = "none";
    });

    // Update Header Page Title
    const titleElem = document.getElementById("header-page-title");

    switch (viewName) {
      case 'dashboard':
        document.getElementById("dashboard-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Teacher Dashboard";
        break;
      case 'attendance':
        document.getElementById("attendance-module").style.display = "block";
        if (titleElem) titleElem.textContent = "Teacher Attendance Management";
        AttendanceWorkflow.init();
        break;
      case 'timetable':
        document.getElementById("timetable-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Weekly Timetable & Schedule";
        break;
      case 'classes':
        document.getElementById("classes-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Assigned Classes & Divisions";
        break;
      case 'students':
        document.getElementById("students-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Students Directory & Roster";
        break;
      case 'syllabus':
        document.getElementById("syllabus-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Curriculum & Syllabus Tracker";
        break;
      case 'results':
        document.getElementById("results-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Examination & Internal Results";
        break;
      case 'notifications':
        document.getElementById("notifications-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Faculty Notifications Center";
        break;
      case 'profile':
      case 'information':
      case 'settings':
        document.getElementById("profile-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Faculty Profile & Preferences";
        break;
      default:
        document.getElementById("dashboard-view").style.display = "block";
        if (titleElem) titleElem.textContent = "Teacher Dashboard";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const completedPercent = Math.round((completedCount / totalCount) * 100);
      const pendingPercent = 100 - completedPercent;

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

  openAttendanceModule() {
    this.switchView('attendance');
    AttendanceWorkflow.goToStep(1);
  },

  openAttendanceForClass(classCode, subject) {
    this.switchView('attendance');
    AttendanceState.setClass(classCode);
    if (subject) {
      const subs = TeacherERPData.subjects[classCode] || [];
      const match = subs.find(s => s.name.toLowerCase().includes(subject.toLowerCase()));
      if (match) AttendanceState.setSubject(match.code);
    }
    AttendanceWorkflow.goToStep(3);
  },

  // ----------------------------------------------------
  // NOTIFICATIONS LIST
  // ----------------------------------------------------
  renderNotificationsList() {
    const container = document.getElementById("notification-items-list");
    if (!container) return;

    container.innerHTML = TeacherERPData.notifications.map(notif => `
      <div class="notification-item ${notif.unread ? 'unread' : ''}" onclick="TeacherApp.handleNotificationClick('${notif.id}')">
        <div class="notif-icon-box" style="background:#EBF3FC; color:var(--primary-blue);">
          <i data-lucide="${notif.icon}" style="width:16px;height:16px;"></i>
        </div>
        <div class="notif-content">
          <div class="notif-title">${notif.title}</div>
          <div class="notif-desc">${notif.description}</div>
          <div class="notif-time">${notif.time}</div>
        </div>
      </div>
    `).join('');
  },

  handleNotificationClick(id) {
    const notif = TeacherERPData.notifications.find(n => n.id === id);
    if (notif) {
      notif.unread = false;
      this.renderNotificationsList();
      this.showToast(`Viewing: ${notif.title}`);
    }
  },

  // ----------------------------------------------------
  // TIMETABLE MODULE VIEW
  // ----------------------------------------------------
  renderTimetableView() {
    const container = document.getElementById("timetable-content");
    if (!container) return;

    const timeHeaders = ["Day", "09:00 - 10:30 AM", "11:00 - 12:30 PM", "01:30 - 03:00 PM", "03:30 - 05:00 PM"];

    container.innerHTML = `
      <div class="timetable-grid-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h3 style="font-size:16px; color:var(--dark-navy);">Weekly Lecture & Lab Schedule</h3>
            <p style="font-size:12.5px; color:var(--text-muted);">Academic Term: 2026-2027 • Odd Semester</p>
          </div>
          <button class="quick-action-btn" onclick="window.print()">
            <i data-lucide="printer" style="width:14px;height:14px;"></i> Print Schedule
          </button>
        </div>

        <table class="timetable-table">
          <thead>
            <tr>
              ${timeHeaders.map(th => `<th>${th}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${TeacherERPData.timetable.map(row => `
              <tr>
                <td style="font-weight:700; color:var(--dark-navy); background:#FAFCFE;">${row.day}</td>
                ${row.slots.map(slot => {
                  if (slot === "Free Slot") {
                    return `<td style="color:var(--text-light); font-size:12px; font-style:italic;">Off / Prep</td>`;
                  }
                  const isLab = slot.toLowerCase().includes("lab");
                  return `
                    <td>
                      <div class="timetable-slot ${isLab ? 'lab' : ''}">
                        <div class="slot-sub">${slot.split('(')[0]}</div>
                        <div class="slot-room">${slot.split('(')[1] ? '(' + slot.split('(')[1] : ''}</div>
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ----------------------------------------------------
  // STUDENTS ROSTER VIEW
  // ----------------------------------------------------
  renderStudentsView() {
    const container = document.getElementById("students-content");
    if (!container) return;

    const allStudents = TeacherERPData.students["2R1"];

    container.innerHTML = `
      <div class="card" style="padding:20px;">
        <div class="students-roster-controls">
          <div style="display:flex; gap:12px; align-items:center;">
            <input type="text" id="roster-filter-input" class="roster-search-input" 
                   placeholder="Filter student name or roll..." oninput="TeacherApp.filterStudentRoster(this.value)">
            <select style="padding:8px 12px; border:1px solid var(--border-light); border-radius:var(--radius-sm);" 
                    onchange="TeacherApp.changeRosterClass(this.value)">
              <option value="2R1">CSE 2R1 (Data Structures)</option>
              <option value="2R2">CSE 2R2 (Java Programming)</option>
              <option value="3R">CSE 3R (Database Management)</option>
            </select>
          </div>
          <button class="quick-action-btn primary" onclick="TeacherApp.openAttendanceModule()">
            <i data-lucide="check-square" style="width:14px;height:14px;"></i> Take Attendance for Batch
          </button>
        </div>

        <table class="roster-table" id="students-roster-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Full Name</th>
              <th>Institute Email</th>
              <th>Attendance Rate</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="roster-table-body">
            ${this.generateRosterRows(allStudents)}
          </tbody>
        </table>
      </div>
    `;
  },

  generateRosterRows(students) {
    return students.map(st => `
      <tr>
        <td style="font-weight:700; color:var(--primary-blue);">ROLL ${st.rollNo}</td>
        <td style="font-weight:600; color:var(--dark-navy);">${st.name}</td>
        <td style="color:var(--text-muted);">${st.email}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:70px; height:6px; background:#E2E8F0; border-radius:10px; overflow:hidden;">
              <div style="width:${st.attendance}%; height:100%; background:${st.attendance >= 85 ? 'var(--primary-blue)' : 'var(--warning)'};"></div>
            </div>
            <span style="font-weight:700; font-size:12px;">${st.attendance}%</span>
          </div>
        </td>
        <td>
          <span class="badge ${st.attendance >= 85 ? 'badge-completed' : 'badge-pending'}">
            ${st.attendance >= 85 ? 'Eligible' : 'Low Attendance'}
          </span>
        </td>
        <td>
          <button style="font-size:12px; color:var(--primary-blue); font-weight:600;" 
                  onclick="TeacherApp.showToast('Student academic record opened for ${st.name}')">
            View Details
          </button>
        </td>
      </tr>
    `).join('');
  },

  filterStudentRoster(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll("#roster-table-body tr");
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  },

  changeRosterClass(classCode) {
    const list = TeacherERPData.students[classCode] || TeacherERPData.students["2R1"];
    const tbody = document.getElementById("roster-table-body");
    if (tbody) {
      tbody.innerHTML = this.generateRosterRows(list);
    }
  },

  // ----------------------------------------------------
  // SYLLABUS VIEW
  // ----------------------------------------------------
  renderSyllabusView() {
    const container = document.getElementById("syllabus-content");
    if (!container) return;

    container.innerHTML = `
      <div class="syllabus-units-grid">
        ${TeacherERPData.syllabus.map(syl => `
          <div class="syllabus-unit-card">
            <div class="syllabus-header-row">
              <div>
                <h3 class="unit-title">${syl.subject}</h3>
                <span style="font-size:12px; color:var(--text-muted); font-weight:500;">Class: ${syl.classCode} • Course Completion</span>
              </div>
              <div class="unit-progress-badge">Overall: ${syl.progress}%</div>
            </div>

            <div class="progress-track" style="height:8px; margin-bottom:18px;">
              <div class="progress-fill completed" style="width: ${syl.progress}%;"></div>
            </div>

            <div class="topics-checklist">
              ${syl.units.map(unit => `
                <div class="topic-item">
                  <i data-lucide="${unit.percent === 100 ? 'check-circle' : (unit.percent > 0 ? 'clock' : 'circle')}" 
                     style="color:${unit.percent === 100 ? 'var(--success)' : (unit.percent > 0 ? 'var(--primary-blue)' : 'var(--text-light)')}; width:16px; height:16px;"></i>
                  <span>${unit.name} <strong>(${unit.percent}%)</strong></span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ----------------------------------------------------
  // RESULTS VIEW
  // ----------------------------------------------------
  renderResultsView() {
    const container = document.getElementById("results-content");
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h3 style="font-size:16px; color:var(--dark-navy);">Internal Assessment 1 Marks Entry</h3>
            <p style="font-size:12.5px; color:var(--text-muted);">CSE 2R1 • Data Structures • Max Marks: 30</p>
          </div>
          <button class="quick-action-btn primary" onclick="TeacherApp.showToast('Results spreadsheet successfully synchronized!', 'success')">
            <i data-lucide="upload" style="width:14px;height:14px;"></i> Upload Marksheet (.xlsx)
          </button>
        </div>

        <div class="results-grid-summary">
          <div class="result-stat-box">
            <div style="font-size:24px; font-weight:800; color:var(--primary-blue);">26.4</div>
            <div style="font-size:12px; color:var(--text-muted);">Class Average Score</div>
          </div>
          <div class="result-stat-box">
            <div style="font-size:24px; font-weight:800; color:var(--success);">98.2%</div>
            <div style="font-size:12px; color:var(--text-muted);">Passing Rate</div>
          </div>
          <div class="result-stat-box">
            <div style="font-size:24px; font-weight:800; color:var(--dark-navy);">30 / 30</div>
            <div style="font-size:12px; color:var(--text-muted);">Highest Score</div>
          </div>
        </div>
      </div>
    `;
  },

  // ----------------------------------------------------
  // GLOBAL SEARCH FILTER
  // ----------------------------------------------------
  handleGlobalSearch(query) {
    if (!query) return;
    // Show toast with match preview
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
  }
};

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  TeacherApp.init();
});

