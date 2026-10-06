/**
 * ==========================================================================
 * SSGMCE TEACHER ERP — TIMETABLE MODULE
 * File: Teacher_Dashboard/frontend/timetable/timetable.js
 * Dedicated, modular Timetable management for SSGMCE Teacher ERP Portal.
 * Handles timetable rendering, active day highlights, dynamic date filtering,
 * click-to-mark attendance hooks, and schedule printing.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const TimetableModule = {
    selectedDate: null,
    activeTerm: null,
    timeHeaders: ["Day", "09:00 - 10:30 AM", "11:00 - 12:30 PM", "01:30 - 03:00 PM", "03:30 - 05:00 PM"],
    daysOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],

    /**
     * Initialize the timetable module
     */
    init(containerId = "timetable-content") {
      this.selectedDate = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0];

      this.activeTerm = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getCurrentAcademicTerm()
        : { academicYear: "2026-2027", semesterType: "Odd" };

      this.render(containerId);
      this.attachGlobalBridge();
    },

    /**
     * Handle date picker change
     */
    handleDateChange(dateVal, containerId = "timetable-content") {
      if (!dateVal) return;
      this.selectedDate = dateVal;
      this.render(containerId);

      // Notify external observers
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timetable:datechange', { detail: { date: dateVal } }));
      }
    },

    /**
     * Reset selected date to current date (Today)
     */
    resetToToday(containerId = "timetable-content") {
      this.selectedDate = (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0];
      this.render(containerId);
    },

    /**
     * Trigger print dialog for timetable schedule
     */
    printSchedule() {
      window.print();
    },

    /**
     * Determine class code from subject name
     */
    getClassCodeForSubject(subjectName) {
      if (!subjectName) return '2R1';
      if (subjectName.includes('Java')) return '2R2';
      if (subjectName.includes('Database') || subjectName.includes('Operating')) return '3R';
      if (subjectName.includes('Algorithms') || subjectName.includes('Project')) return '4R';
      return '2R1';
    },

    /**
     * Check if session has been marked (synced with AttendanceMarkingManager)
     */
    isSessionMarked(sessionKey) {
      if (typeof window !== 'undefined' && window.AttendanceMarkingManager && window.AttendanceMarkingManager.markedSessions) {
        return Boolean(window.AttendanceMarkingManager.markedSessions[sessionKey]);
      }
      return false;
    },

    /**
     * Slot click handler - triggers Click-to-Mark flow
     */
    handleSlotClick(subjectName, roomPart, timeSlotHeader, classCode, selectedDate) {
      if (typeof window !== 'undefined' && window.AttendanceMarkingManager && typeof window.AttendanceMarkingManager.openFromSlot === 'function') {
        window.AttendanceMarkingManager.openFromSlot(subjectName, roomPart, timeSlotHeader, classCode, selectedDate);
      } else if (typeof window !== 'undefined' && window.TeacherApp && typeof window.TeacherApp.showToast === 'function') {
        window.TeacherApp.showToast(`Selected: ${subjectName} (${classCode}) on ${selectedDate}`);
      }
    },

    /**
     * Generate HTML markup for the entire Timetable grid card
     */
    getHTML(dateISO) {
      const selectedDate = dateISO || this.selectedDate || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0]);
      const currentDayName = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getDayName(selectedDate) : "Monday";
      const readableDate = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.formatReadableDate(selectedDate) : selectedDate;
      const todayISO = (typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getTodayISO() : new Date().toISOString().split('T')[0];
      const isToday = (selectedDate === todayISO);
      const isWeekend = (currentDayName === "Saturday" || currentDayName === "Sunday");
      const term = this.activeTerm || ((typeof AcademicDateUtils !== 'undefined') ? AcademicDateUtils.getCurrentAcademicTerm() : { academicYear: "2026-2027", semesterType: "Odd" });

      // Fallback schedule rows if TeacherERPData is not loaded
      const timetableData = (typeof TeacherERPData !== 'undefined' && TeacherERPData.timetable) ? TeacherERPData.timetable : [
        { day: "Monday", slots: ["Data Structures (Room 201)", "Java Programming (Room 305)", "Free Slot", "Data Structures Lab (Lab 02)"] },
        { day: "Tuesday", slots: ["Free Slot", "Data Structures (Room 201)", "Database Systems (Room 304)", "Operating Systems (Lab 04)"] },
        { day: "Wednesday", slots: ["Operating Systems (Room 201)", "Free Slot", "Data Structures Lab (Lab 01)", "Data Structures Lab (Lab 01)"] },
        { day: "Thursday", slots: ["Data Structures (Room 201)", "Algorithms (Room 304)", "Free Slot", "Project Guidance (Seminar Hall)"] },
        { day: "Friday", slots: ["Software Engg (Room 105)", "Operating Systems (Room 201)", "Free Slot", "Faculty Meeting (Dept Library)"] }
      ];

      return `
      <div class="timetable-grid-card">
        <!-- 1. Header Toolbar -->
        <div class="timetable-header-toolbar">
          <div>
            <h3>Weekly Lecture & Lab Schedule</h3>
            <p id="timetable-academic-term">Academic Term: ${term.academicYear} • ${term.semesterType} Semester</p>
          </div>

          <!-- Date Picker & Filter Controls -->
          <div class="timetable-date-filter-bar">
            <div class="timetable-picker-group">
              <i data-lucide="calendar" style="width:15px;height:15px; color:var(--primary-blue, #0B5CAD);"></i>
              <span style="font-size:12.5px; font-weight:600; color:var(--dark-navy, #0B1F3A);">View Date:</span>
              <input type="date" 
                     id="timetable-date-picker-input" 
                     class="timetable-date-input" 
                     value="${selectedDate}" 
                     onchange="TimetableModule.handleDateChange(this.value)">
            </div>
            <button class="btn-timetable-today ${isToday ? 'active' : ''}" 
                    type="button"
                    onclick="TimetableModule.resetToToday()" 
                    title="Reset to today's schedule">
              <i data-lucide="calendar-check" style="width:13px;height:13px;"></i>
              Today
            </button>
            <button class="btn-timetable-print" type="button" onclick="TimetableModule.printSchedule()">
              <i data-lucide="printer" style="width:14px;height:14px;"></i> Print Schedule
            </button>
          </div>
        </div>

        <!-- 2. Status Banner -->
        <div class="timetable-schedule-status-banner">
          <div class="status-left">
            <span class="status-pulse-indicator"></span>
            <span>Schedule for: <strong>${currentDayName}, ${readableDate}</strong></span>
            <span class="badge ${isToday ? 'badge-completed' : 'badge-cyan'}">${isToday ? "Today's Schedule" : "Selected Date"}</span>
          </div>
          <div class="status-hint">
            ${isWeekend ? '<em>Note: Weekend - regular weekday schedule displayed below</em>' : `Highlighting <strong>${currentDayName}</strong> in the schedule`}
          </div>
        </div>

        <!-- 3. Table Schedule Grid -->
        <table class="timetable-table">
          <thead>
            <tr>
              ${this.timeHeaders.map(th => `<th>${th}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timetableData.map(row => {
              const isHighlightRow = (row.day.toLowerCase() === currentDayName.toLowerCase());
              return `
              <tr class="${isHighlightRow ? 'active-day-row' : ''}">
                <td class="timetable-day-cell ${isHighlightRow ? 'active-day-cell' : ''}">
                  <div class="day-cell-content">
                    <span class="day-name">${row.day}</span>
                    ${isHighlightRow ? `<span class="active-day-pill">${isToday ? 'Today' : 'Active'}</span>` : ''}
                  </div>
                </td>
                ${row.slots.map((slot, slotIndex) => {
                  if (slot === "Free Slot") {
                    return `<td style="color:var(--text-light, #94A3B8); font-size:12px; font-style:italic;">Off / Prep</td>`;
                  }
                  const isLab = slot.toLowerCase().includes("lab");
                  const timeSlotHeader = this.timeHeaders[slotIndex + 1] || "09:00 - 10:30 AM";
                  const subjectName = slot.split('(')[0].trim();
                  const roomPart = slot.split('(')[1] ? slot.split('(')[1].replace(')', '').trim() : 'Room 201';
                  const classCode = this.getClassCodeForSubject(subjectName);

                  // Determine future day state relative to selectedDate or today
                  const todayDayIndex = new Date().getDay();
                  const rowDayIndex = this.daysOfWeek.indexOf(row.day);
                  const isFutureSlot = (selectedDate > todayISO) || (selectedDate === todayISO && rowDayIndex > todayDayIndex);

                  // Session key for marked attendance check
                  const sessionKey = `${selectedDate}_${classCode}_${subjectName}`;
                  const isMarked = this.isSessionMarked(sessionKey);

                  const safeSubject = subjectName.replace(/'/g, "\\'");
                  const safeRoom = roomPart.replace(/'/g, "\\'");

                  return `
                    <td>
                      <div class="timetable-slot ${isLab ? 'lab' : ''} ${isHighlightRow ? 'active-slot' : ''} ${isMarked ? 'slot-marked' : ''} ${isFutureSlot ? 'slot-future' : 'slot-clickable'}"
                           ${!isFutureSlot ? `onclick="TimetableModule.handleSlotClick('${safeSubject}', '${safeRoom}', '${timeSlotHeader}', '${classCode}', '${selectedDate}')"` : ''}
                           title="${isFutureSlot ? 'Future session cannot be marked ahead' : (isMarked ? 'Attendance Marked. Click to view/edit' : 'Click to mark attendance for this lecture')}">
                        <div class="slot-sub" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                          <span>${subjectName}</span>
                          ${isMarked ? '<span class="slot-marked-badge"><i data-lucide="check-circle" style="width:10px;height:10px;"></i> Marked</span>' : (isFutureSlot ? '<span class="slot-future-badge">Future</span>' : '<span class="slot-hover-badge">Mark</span>')}
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:3px;">
                          <div class="slot-room">(${roomPart})</div>
                          ${isMarked && !isFutureSlot ? '<span class="slot-view-edit-link">View/Edit &rarr;</span>' : `<span class="slot-class">Class ${classCode}</span>`}
                        </div>
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- 4. Legend Bar -->
        <div class="timetable-legend-bar">
          <div class="legend-item">
            <span class="legend-swatch lecture"></span>
            <span>Regular Lecture</span>
          </div>
          <div class="legend-item">
            <span class="legend-swatch lab"></span>
            <span>Laboratory Session</span>
          </div>
          <div class="legend-item">
            <span class="legend-swatch marked"></span>
            <span>Attendance Marked</span>
          </div>
          <div class="legend-item">
            <span class="legend-swatch future"></span>
            <span>Future Session</span>
          </div>
        </div>
      </div>
      `;
    },

    /**
     * Render the timetable into the specified DOM container
     */
    render(containerId = "timetable-content") {
      let container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!container) return;

      container.innerHTML = this.getHTML(this.selectedDate);

      // Re-initialize Lucide Icons
      if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      // Notify observers
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timetable:rendered', { detail: { date: this.selectedDate } }));
      }
    },

    /**
     * Bridge with existing TeacherApp for backwards-compatibility
     */
    attachGlobalBridge() {
      if (typeof window !== 'undefined' && window.TeacherApp) {
        window.TeacherApp.selectedTimetableDate = this.selectedDate;
        window.TeacherApp.handleTimetableDateChange = (dateVal) => this.handleDateChange(dateVal);
        window.TeacherApp.resetTimetableToToday = () => this.resetToToday();
        window.TeacherApp.renderTimetableView = () => this.render("timetable-content");
      }
    }
  };

  // Expose TimetableModule globally
  global.TimetableModule = TimetableModule;

  // Auto-bind to TeacherApp when script evaluates
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => {
      TimetableModule.attachGlobalBridge();
    });
  }

})(typeof window !== 'undefined' ? window : this);
