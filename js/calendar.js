/* ========================================================
   INTERACTIVE ACADEMIC CALENDAR CONTROLLER
   ======================================================== */

const AttendanceCalendar = {
  // Calendar state (defaults to September 2026)
  viewYear: 2026,
  viewMonth: 8, // 0-indexed: 8 is September
  todayYear: 2026,
  todayMonth: 8,
  todayDate: 18, // current date in context

  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],

  dayNames: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],

  init() {
    // Parse selected date from state if available
    if (AttendanceState.selectedDate) {
      const parts = AttendanceState.selectedDate.split("-");
      if (parts.length === 3) {
        this.viewYear = parseInt(parts[0], 10);
        this.viewMonth = parseInt(parts[1], 10) - 1;
      }
    }
  },

  render(container) {
    if (!container) return;

    const monthName = this.monthNames[this.viewMonth];
    const daysHTML = this.generateDaysGrid();

    container.innerHTML = `
      <div class="calendar-component-wrapper">
        <!-- Calendar Header Controls -->
        <div class="calendar-header-nav">
          <div class="calendar-current-month-label">
            <i data-lucide="calendar" style="width:18px;height:18px; color:var(--primary-blue);"></i>
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
            <span class="badge badge-completed">
              <i data-lucide="check-circle" style="width:12px;height:12px;"></i> Valid Academic Session
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

    // Parse currently selected date
    let selYear = 2026, selMonth = 8, selDay = 17;
    if (AttendanceState.selectedDate) {
      const parts = AttendanceState.selectedDate.split("-");
      if (parts.length === 3) {
        selYear = parseInt(parts[0], 10);
        selMonth = parseInt(parts[1], 10) - 1;
        selDay = parseInt(parts[2], 10);
      }
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = (year === selYear && month === selMonth && day === selDay);
      const isToday = (year === this.todayYear && month === this.todayMonth && day === this.todayDate);

      // Disable future dates beyond today (context is September 18, 2026)
      const isFuture = (year > this.todayYear) ||
                       (year === this.todayYear && month > this.todayMonth) ||
                       (year === this.todayYear && month === this.todayMonth && day > this.todayDate);

      const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      let cellClass = "cal-day-cell current-month";
      if (isSelected) cellClass += " selected";
      if (isToday) cellClass += " today";
      if (isFuture) cellClass += " disabled future";

      cells.push(`
        <div class="${cellClass}" 
             data-date="${dayDateStr}"
             ${isFuture ? '' : `onclick="AttendanceCalendar.selectDate('${dayDateStr}')"`}>
          <span class="day-number">${day}</span>
          ${isToday ? '<span class="today-dot"></span>' : ''}
          ${isSelected ? '<span class="selected-indicator-pill">Selected</span>' : ''}
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

  selectDate(dateStr) {
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
    this.viewYear = this.todayYear;
    this.viewMonth = this.todayMonth;
    const todayStr = `${this.todayYear}-${String(this.todayMonth + 1).padStart(2, '0')}-${String(this.todayDate).padStart(2, '0')}`;
    this.selectDate(todayStr);
  }
};

