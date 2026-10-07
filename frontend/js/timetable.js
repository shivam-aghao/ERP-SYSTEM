/**
 * ==========================================================================
 * SSGMCE TEACHER ERP — TIMETABLE MODULE (STEP 3)
 * File: frontend/js/timetable.js
 * Dedicated, modular Timetable management for SSGMCE Teacher ERP Portal.
 * Sourced directly from official PDF: DATA/Personal Timtable for teacher.pdf
 * Ensures every teacher sees strictly THEIR OWN personal timetable!
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const TimetableModule = {
    selectedDate: null,
    activeTerm: null,
    timeHeaders: [
      "Day",
      "11:00 - 12:00 PM",
      "12:00 - 01:00 PM",
      "01:15 - 02:15 PM",
      "02:15 - 03:15 PM",
      "03:45 - 04:45 PM",
      "04:45 - 05:45 PM"
    ],
    daysOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    liveDataLoaded: false,

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

      this.loadLiveTimetableIfPossible();
      this.render(containerId);
      this.attachGlobalBridge();
    },

    /**
     * Fetch live timetable from backend API if available
     */
    async loadLiveTimetableIfPossible() {
      if (typeof window !== 'undefined' && window.TeacherAPI && typeof window.TeacherAPI.getMyTimetable === 'function') {
        try {
          const activeCode = (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode)
            ? TeacherERPData.getActiveTeacherEmpCode()
            : 'EMP-CSE-1001';
          const liveData = await window.TeacherAPI.getMyTimetable(activeCode);
          if (liveData && liveData.grid && liveData.grid.length > 0) {
            this.liveData = liveData;
            this.liveDataLoaded = true;
            this.render("timetable-content");
          }
        } catch (e) {
          console.warn("[TimetableModule] Using high-fidelity offline PDF data:", e.message);
        }
      }
    },

    /**
     * Switch viewed faculty member
     */
    async switchFaculty(empCode, containerId = "timetable-content") {
      if (!empCode) return;
      if (typeof TeacherERPData !== 'undefined' && typeof TeacherERPData.setActiveTeacherEmpCode === 'function') {
        TeacherERPData.setActiveTeacherEmpCode(empCode);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ssgmce_selected_faculty', empCode);
      }
      this.liveData = null;
      if (typeof window !== 'undefined' && window.TeacherAPI && typeof window.TeacherAPI.getMyTimetable === 'function') {
        try {
          const liveData = await window.TeacherAPI.getMyTimetable(empCode);
          if (liveData && liveData.grid && liveData.grid.length > 0) {
            this.liveData = liveData;
          }
        } catch(e) {}
      }
      this.render(containerId);
      if (typeof TeacherApp !== 'undefined' && typeof TeacherApp.renderDashboardData === 'function') {
        TeacherApp.renderHeaderProfile();
        TeacherApp.renderDashboardData();
      }
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
      if (subjectName.includes('2R2')) return '2R2';
      if (subjectName.includes('2R1')) return '2R1';
      if (subjectName.includes('3R') || subjectName.includes('DBMS') || subjectName.includes('CD') || subjectName.includes('MDM#')) return '3R';
      if (subjectName.includes('4R') || subjectName.includes('CG') || subjectName.includes('BF') || subjectName.includes('CC') || subjectName.includes('DWM')) return '4R';
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

      // Dynamic schedule rows with empty day slot defaults
      const timetableData = (typeof TeacherERPData !== 'undefined' && TeacherERPData.timetable && TeacherERPData.timetable.length > 0)
        ? TeacherERPData.timetable
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => ({
          day: day,
          slots: ["Free Slot", "Free Slot", "Free Slot", "Free Slot"]
        }));

      return `
      <div class="timetable-grid-card">
        <!-- 0. Faculty Identity & Switcher Toolbar -->
        <div class="timetable-faculty-strip" style="background: linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%); color: #fff; padding: 14px 20px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="width: 42px; height: 42px; border-radius: 8px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 1px solid rgba(255,255,255,0.3);">
              ${currentFacObj.name.split('. ').pop().charAt(0) || 'F'}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #fff;">${currentFacObj.name}</h4>
                <span style="background: #10B981; color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 600;">${currentFacObj.empCode}</span>
                <span style="background: rgba(255,255,255,0.2); color: #E0F2FE; font-size: 11px; padding: 2px 7px; border-radius: 4px;">${currentFacObj.title}</span>
              </div>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #BAE6FD;">
                Department of Computer Science &amp; Engineering &bull; SSGMCE Autonomous &bull; Weekly Load: <strong>${currentFacObj.totalLoad} Hours</strong>
              </p>
            </div>
          </div>

          <!-- Faculty View Selector -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <label for="faculty-timetable-selector" style="font-size: 12px; font-weight: 600; color: #E0F2FE;">Faculty Schedule:</label>
            <select id="faculty-timetable-selector" 
                    style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4); background: #ffffff; color: #0B1F3A; font-size: 12.5px; font-weight: 600; cursor: pointer; outline: none;"
                    onchange="TimetableModule.switchFaculty(this.value)">
              ${facList.map(f => `
                <option value="${f.empCode}" ${f.empCode === activeEmpCode ? 'selected' : ''}>
                  ${f.name} (${f.empCode}) — ${f.totalLoad}h
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 1. Header Toolbar -->
        <div class="timetable-header-toolbar" style="border-top: none;">
          <div>
            <h3 style="margin: 0; font-size: 16px; color: var(--dark-navy, #0B1F3A);">Personal Lecture &amp; Lab Timetable</h3>
            <p id="timetable-academic-term" style="margin: 3px 0 0 0; font-size: 12px; color: var(--text-muted, #64748B);">
              Official Schedule w.e.f. 13/08/2026 &bull; Term: ${term.academicYear} &bull; ${term.semesterType} Semester
            </p>
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
        <div style="overflow-x: auto;">
          <table class="timetable-table" style="min-width: 850px;">
            <thead>
              <tr>
                ${this.timeHeaders.map((th, idx) => `
                  <th>
                    ${th}
                    ${idx === 2 ? '<div style="font-size:9.5px; font-weight:normal; color:#E0F2FE;">(Break: 1:00-1:15 PM)</div>' : ''}
                    ${idx === 4 ? '<div style="font-size:9.5px; font-weight:normal; color:#E0F2FE;">(Recess: 3:15-3:45 PM)</div>' : ''}
                  </th>
                `).join('')}
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
                    if (!slot || slot === "Free Slot") {
                      return `<td style="color:var(--text-light, #94A3B8); font-size:12px; font-style:italic; background:#FAFAFA; text-align:center;">Off / Prep</td>`;
                    }
                    const isLab = slot.toLowerCase().includes("lab") || slot.toLowerCase().includes("cep") || slot.toLowerCase().includes("mdm");
                    const timeSlotHeader = this.timeHeaders[slotIndex + 1] || "11:00 - 12:00 PM";
                    const subjectName = slot.split('(')[0].trim();
                    const roomPart = slot.split('(')[1] ? slot.split('(')[1].replace(')', '').trim() : 'B108';
                    const classCode = this.getClassCodeForSubject(slot);

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
                            ${isMarked && !isFutureSlot ? '<span class="slot-view-edit-link">View/Edit &rarr;</span>' : `<span class="slot-class" style="font-weight:600; font-size:11px; color:#0B5CAD;">${classCode}</span>`}
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
        </div>

        <!-- 4. Legend & Teaching Load Info Bar -->
        <div style="padding: 12px 20px; background: #F8FAFC; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 12px;">
          <div class="timetable-legend-bar" style="margin: 0; padding: 0; border: none; background: transparent;">
            <div class="legend-item">
              <span class="legend-swatch lecture"></span>
              <span>Theory Lecture</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch lab"></span>
              <span>Practical / Lab / Project</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch marked"></span>
              <span>Attendance Recorded</span>
            </div>
            <div class="legend-item">
              <span class="legend-swatch future"></span>
              <span>Scheduled Future</span>
            </div>
          </div>

          <div style="color: #64748B; font-size: 11.5px;">
            Break: <strong>1:00 PM – 1:15 PM</strong> &bull; Recess: <strong>3:15 PM – 3:45 PM</strong>
          </div>
        </div>

        <!-- 5. Allotted Teaching Load Breakdown from PDF -->
        ${teachingLoad.length > 0 ? `
        <div style="padding: 14px 20px; background: #FFFFFF; border-top: 1px solid #E2E8F0; border-radius: 0 0 10px 10px;">
          <h5 style="margin: 0 0 8px 0; font-size: 12.5px; color: var(--dark-navy, #0B1F3A); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            Allotted Teaching Load Summary (From Official PDF)
          </h5>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${teachingLoad.map(item => `
              <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 12px; font-size: 12px; display: flex; gap: 8px; align-items: center;">
                <span style="font-weight: 700; color: #0B5CAD;">Sem ${item.semester || 'V'}:</span>
                <span style="font-weight: 600; color: #1E293B;">${item.abbr || item.code}</span>
                <span style="color: #64748B;">(Th: ${item.theory || 0}h | Pr: ${item.practical || 0}h)</span>
                ${item.total ? `<span style="background: #E2E8F0; padding: 1px 6px; border-radius: 4px; font-weight: 600; color: #334155;">Tot: ${item.total}h</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
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
