/**
 * Academic Date Utilities - Mirror of frontend AcademicDateUtils
 * Provides standard date parsing, formatting, academic term calculation, and calendar tools.
 */

export const AcademicDateUtils = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  shortMonthNames: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],

  dayNames: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ],

  shortDayNames: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],

  getNow() {
    return new Date();
  },

  getTodayISO(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatReadableDate(dateInput) {
    let year, monthIndex, day;
    if (!dateInput) {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
      day = now.getDate();
    } else if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        monthIndex = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const parsed = new Date(dateInput);
        if (isNaN(parsed.getTime())) return dateInput;
        year = parsed.getFullYear();
        monthIndex = parsed.getMonth();
        day = parsed.getDate();
      }
    } else if (dateInput instanceof Date) {
      year = dateInput.getFullYear();
      monthIndex = dateInput.getMonth();
      day = dateInput.getDate();
    } else {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
      day = now.getDate();
    }
    const monthName = this.monthNames[monthIndex] || '';
    const formattedDay = String(day).padStart(2, '0');
    return `${formattedDay} ${monthName} ${year}`;
  },

  formatFullWeekdayDate(dateInput = new Date()) {
    let d;
    if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput || new Date();
    }
    const weekday = this.dayNames[d.getDay()];
    const formatted = this.formatReadableDate(d);
    return `${weekday}, ${formatted}`;
  },

  getRelativeFutureDate(daysAhead, shortMonth = false) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const day = String(d.getDate()).padStart(2, '0');
    const monthName = shortMonth ? this.shortMonthNames[d.getMonth()] : this.monthNames[d.getMonth()];
    return `${day} ${monthName} ${d.getFullYear()}`;
  },

  getCurrentAcademicTerm(d = new Date()) {
    const year = d.getFullYear();
    const month = d.getMonth();
    if (month >= 6) {
      return {
        academicYear: `${year}-${year + 1}`,
        semesterType: 'Odd',
        semesterName: 'Semester 5 (Odd)',
        fullTerm: `${year}-${year + 1} (Odd Semester)`
      };
    } else {
      return {
        academicYear: `${year - 1}-${year}`,
        semesterType: 'Even',
        semesterName: 'Semester 6 (Even)',
        fullTerm: `${year - 1}-${year} (Even Semester)`
      };
    }
  },

  getDayName(dateInput) {
    let d;
    if (!dateInput) d = new Date();
    else if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput;
    }
    return this.dayNames[d.getDay()] || 'Monday';
  }
};

export default AcademicDateUtils;

