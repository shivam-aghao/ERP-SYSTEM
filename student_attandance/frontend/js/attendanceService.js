/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL
 * Independent Attendance Service Layer
 * 
 * Future Backend Ready:
 * Prepared for GET /api/student-attendance or custom backend route.
 * Currently serves isolated mock data.
 * 
 * STRICT ARCHITECTURAL PRINCIPLE:
 * Attendance API logic is completely separate from Student Dashboard API logic.
 */

(function () {
  'use strict';

  const root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global);

  class AttendanceService {
    constructor() {
      // Configuration for future backend connectivity
      this.apiBaseUrl = '/api/student-attendance';
      this.useMockData = true; // Set to false when live backend endpoint is connected
    }

    _getData() {
      return root.AttendanceData || {};
    }

    _getCalculations() {
      return root.AttendanceCalculations || {};
    }

    /**
     * Fetch active student metadata
     */
    async getStudentProfile() {
      if (this.useMockData) {
        const data = this._getData().studentProfile || {};
        return Promise.resolve({ success: true, data });
      }

      try {
        const response = await fetch(`${this.apiBaseUrl}/profile`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (err) {
        console.warn('AttendanceService: Fetch failed, using isolated mock data fallback', err);
        return { success: true, data: this._getData().studentProfile };
      }
    }

    /**
     * Fetch all subject-wise attendance entries
     */
    async getAttendanceList() {
      const calc = this._getCalculations();
      if (this.useMockData) {
        const rawList = this._getData().attendanceData || [];
        const list = rawList.map(item => {
          const pct = calc.calculatePercentage ? calc.calculatePercentage(item.present, item.total) : Number(((item.present / item.total) * 100).toFixed(2));
          const status = calc.getStatus ? calc.getStatus(pct) : { label: 'Active', badgeClass: 'att-badge-good' };
          return {
            ...item,
            absent: item.total - item.present,
            percentage: pct,
            status
          };
        });
        return Promise.resolve({ success: true, data: list });
      }

      try {
        const response = await fetch(`${this.apiBaseUrl}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        return result;
      } catch (err) {
        console.warn('AttendanceService: Fetch failed, using isolated mock data fallback', err);
        return { success: true, data: this._getData().attendanceData || [] };
      }
    }

    /**
     * Fetch aggregated 4-card metrics
     */
    async getSummaryCards() {
      const { data } = await this.getAttendanceList();
      const calc = this._getCalculations();
      const summary = calc.computeSummary ? calc.computeSummary(data) : {};
      return { success: true, data: summary };
    }

    /**
     * Fetch analytical insights & risk metrics
     */
    async getInsights() {
      const { data } = await this.getAttendanceList();
      const calc = this._getCalculations();
      const insights = calc.computeInsights ? calc.computeInsights(data) : {};
      return { success: true, data: insights };
    }

    /**
     * Calculate target consecutive classes needed
     */
    calculateTarget(present, total, targetPct) {
      const calc = this._getCalculations();
      return calc.calculateConsecutiveNeeded ? calc.calculateConsecutiveNeeded(present, total, targetPct) : { needed: 0 };
    }
  }

  const serviceInstance = new AttendanceService();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = serviceInstance;
  }
  root.AttendanceService = serviceInstance;

})();
