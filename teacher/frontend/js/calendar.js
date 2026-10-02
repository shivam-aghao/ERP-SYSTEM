/* ========================================================
   INTERACTIVE ACADEMIC CALENDAR CONTROLLER
   ======================================================== */

const AttendanceCalendar = {
  // Calendar state (defaults to current system date)
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-indexed
  todayYear: new Date().getFullYear(),
  todayMonth: new Date().getMonth(),
  todayDate: new Date().getDate(),

  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],

  dayNames: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],

  init() {
    const now = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getNow() : new Date();
    this.todayYear = now.getFullYear();
    this.todayMonth = now.getMonth();
    this.todayDate = now.getDate();

    // Parse selected date from state if available
    if (AttendanceState && AttendanceState.selectedDate) {
      const parts = AttendanceState.selectedDate.split("-");
      if (parts.length === 3) {
        this.viewYear = parseInt(parts[0], 10);
        this.viewMonth = parseInt(parts[1], 10) - 1;
      }
    } else {
      this.viewYear = this.todayYear;
      this.viewMonth = this.todayMonth;
      if (AttendanceState && typeof AcademicDateUtils !== 'undefined') {
        AttendanceState.setDate(AcademicDateUtils.getTodayISO(now));
      }
    }
  },

  render(container) {
    if (!container) return;

    const monthName = this.monthNames[this.viewMonth];
    const daysHTML = this.generateDaysGrid();
    const todayISO = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0];
    const isTodaySelected = (AttendanceState.selectedDate === todayISO);
    const dateStatus = AttendanceState.getDateStatusLabel();

    container.innerHTML = `
      <div class="calendar-component-wrapper">
        <!-- Quick Manual Date Input & Presets Bar -->
        <div class="cal-quick-picker-bar">
          <div class="cal-picker-left">
            <label for="cal-manual-picker-input" class="cal-picker-label">
              <i data-lucide="calendar" style="width:15px;height:15px; color:var(--primary-blue);"></i>
              <span>Date Picker:</span>
            </label>
            <input type="date" 
                   id="cal-manual-picker-input" 
                   class="cal-manual-date-input" 
                   value="${AttendanceState.selectedDate || todayISO}" 
                   onchange="AttendanceCalendar.handleManualDateInput(this.value)">
          </div>

          <div class="cal-quick-chips">
            <button type="button" 
                    class="cal-chip-btn ${this.isRelativeSelected(-1) ? 'active' : ''}" 
                    onclick="AttendanceCalendar.selectRelativeDays(-1)" 
                    title="Select Yesterday's Date">
              Yesterday
            </button>
            <button type="button" 
                    class="cal-chip-btn ${this.isTodaySelected() ? 'active' : ''}" 
                    onclick="AttendanceCalendar.goToToday()" 
                    title="Select Today's Date">
              Today
            </button>
            <button type="button" 
                    class="cal-chip-btn ${this.isRelativeSelected(1) ? 'active' : ''}" 
                    onclick="AttendanceCalendar.selectRelativeDays(1)" 
                    title="Select Tomorrow's Date">
              Tomorrow
            </button>
          </div>
        </div>

        <!-- Calendar Header Controls -->
        <div class="calendar-header-nav">
          <div class="calendar-current-month-label">
            <i data-lucide="calendar-days" style="width:18px;height:18px; color:var(--primary-blue);"></i>
            <span>${monthName} ${this.viewYear}</span>
          </div>

          <div class="calendar-nav-buttons">
            <button class="cal-nav-btn" onclick="AttendanceCalendar.prevMonth()" title="Previous Month" aria-label="Previous Month">
              <i data-lucide="chevron-left" style="width:16px;height:16px;"></i>
            </button>
            <button class="cal-nav-today-btn" onclick="AttendanceCalendar.goToToday()">
              Today
            </button>
            <button class="cal-nav-btn" onclick="AttendanceCalendar.nextMonth()" title="Next Month" aria-label="Next Month">
              <i data-lucide="chevron-right" style="width:16px;height:16px;"></i>
            </button>
          </div>
        </div>

        <!-- Days of Week Header -->
        <div class="calendar-weekdays-grid">
          ${this.dayNames.map(day => `<div class="cal-weekday-cell">${day}</div>`).join('')}
        </div>

        <!-- Days Grid -->
        <div class="calendar-days-grid" id="calendar-days-grid">
          ${daysHTML}
        </div>

        <!-- Selected Date Summary Banner -->
        <div class="calendar-selection-banner">
          <div class="selection-banner-left">
            <span class="selection-label">Selected Date:</span>
            <span class="selection-date-text" id="selected-date-display">${AttendanceState.getFormattedDate()}</span>
          </div>
          <div class="selection-banner-status">
            <span class="badge ${isTodaySelected ? 'badge-completed' : (AttendanceState.selectedDate > todayISO ? 'badge-cyan' : 'badge-pending')}">
              <i data-lucide="${isTodaySelected ? 'check-circle' : 'calendar'}" style="width:12px;height:12px;"></i>
              ${dateStatus}
            </span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  generateDaysGrid() {
    const year = this.viewYear;
    const month = this.viewMonth;

    // First day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Convert to Monday-start (0 = Monday, 6 = Sunday)
    const startOffset = (firstDay + 6) % 7;

    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let cells = [];

    // Previous month filler days
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = daysInPrevMonth - i;
      cells.push(`
        <div class="cal-day-cell prev-month disabled">
          <span class="day-number">${prevDate}</span>
        </div>
      `);
    }

    // Parse currently selected date (default to today if not selected)
    let selYear = this.todayYear, selMonth = this.todayMonth, selDay = this.todayDate;
    if (AttendanceState && AttendanceState.selectedDate) {
      const parts = AttendanceState.selectedDate.split("-");
      if (parts.length === 3) {
        selYear = parseInt(parts[0], 10);
        selMonth = parseInt(parts[1], 10) - 1;
        selDay = parseInt(parts[2], 10);
      }
    }

    // Current month days (all clickable - past, today, and future)
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = (year === selYear && month === selMonth && day === selDay);
      const isToday = (year === this.todayYear && month === this.todayMonth && day === this.todayDate);

      const isFuture = (year > this.todayYear) ||
                       (year === this.todayYear && month > this.todayMonth) ||
                       (year === this.todayYear && month === this.todayMonth && day > this.todayDate);

      const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      let cellClass = "cal-day-cell current-month";
      if (isSelected) cellClass += " selected";
      if (isToday) cellClass += " today";
      if (isFuture) cellClass += " future-date";

      const titleAttr = isToday ? "Today's Date" : (isFuture ? "Future Session Date (Click to select)" : "Past Session Date (Click to select)");

      cells.push(`
        <div class="${cellClass}" 
             data-date="${dayDateStr}"
             onclick="AttendanceCalendar.selectDate('${dayDateStr}')"
             title="${titleAttr}">
          <span class="day-number">${day}</span>
          ${isToday ? '<span class="today-dot" title="Today"></span>' : ''}
          ${isSelected ? '<span class="selected-indicator-pill">Selected</span>' : ''}
          ${isFuture && !isSelected ? '<span class="future-dot" title="Future"></span>' : ''}
        </div>
      `);
    }

    // Next month filler days to complete grid (42 cells: 6 rows of 7)
    const totalCells = cells.length;
    const remaining = (totalCells <= 35 ? 35 : 42) - totalCells;
    for (let day = 1; day <= remaining; day++) {
      cells.push(`
        <div class="cal-day-cell next-month disabled">
          <span class="day-number">${day}</span>
        </div>
      `);
    }

    return cells.join('');
  },

  handleManualDateInput(dateVal) {
    if (!dateVal) return;
    this.selectDate(dateVal);
  },

  selectRelativeDays(deltaDays) {
    const d = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getNow() : new Date();
    d.setDate(d.getDate() + deltaDays);
    const iso = (typeof AcademicDateUtils !== 'undefined') 
      ? AcademicDateUtils.getTodayISO(d)
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.selectDate(iso);
  },

  isTodaySelected() {
    const todayISO = (typeof AcademicDateUtils !== 'undefined') 
      ? AcademicDateUtils.getTodayISO() 
      : new Date().toISOString().split('T')[0];
    return AttendanceState.selectedDate === todayISO;
  },

  isRelativeSelected(deltaDays) {
    const d = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getNow() : new Date();
    d.setDate(d.getDate() + deltaDays);
    const iso = (typeof AcademicDateUtils !== 'undefined') 
      ? AcademicDateUtils.getTodayISO(d)
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return AttendanceState.selectedDate === iso;
  },

  selectDate(dateStr) {
    if (!dateStr) return;

    // Sync view year/month if selected date is in another month
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      this.viewYear = parseInt(parts[0], 10);
      this.viewMonth = parseInt(parts[1], 10) - 1;
    }

    AttendanceState.setDate(dateStr);

    // Re-render calendar to update selected state
    const container = document.getElementById("calendar-mount-point");
    if (container) {
      this.render(container);
    }

    // Enable continue button
    const btnNext = document.getElementById("btn-calendar-continue");
    if (btnNext) {
      btnNext.removeAttribute("disabled");
      btnNext.classList.remove("disabled");
    }

    // Update breadcrumb
    if (window.AttendanceWorkflow) {
      AttendanceWorkflow.updateBreadcrumb();
    }
  },

  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear--;
    }
    const container = document.getElementById("calendar-mount-point");
    if (container) this.render(container);
  },

  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear++;
    }
    const container = document.getElementById("calendar-mount-point");
    if (container) this.render(container);
  },

  goToToday() {
    const now = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getNow() : new Date();
    this.todayYear = now.getFullYear();
    this.todayMonth = now.getMonth();
    this.todayDate = now.getDate();

    this.viewYear = this.todayYear;
    this.viewMonth = this.todayMonth;
    const todayStr = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO(now)
      : `${this.todayYear}-${String(this.todayMonth + 1).padStart(2, '0')}-${String(this.todayDate).padStart(2, '0')}`;
    this.selectDate(todayStr);
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceCalendar = AttendanceCalendar;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AttendanceCalendar };
}

