/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL
 * Independent Attendance Calculations & Analytic Engine
 * 
 * STRICT ARCHITECTURAL PRINCIPLE:
 * Isolated pure calculation utility.
 * Operates purely on Attendance data without external side effects.
 */

(function (global) {
  'use strict';

  const AttendanceCalculations = {
    /**
     * Compute clean attendance percentage to 2 decimal places.
     */
    calculatePercentage(present, total) {
      if (!total || total <= 0) return 0;
      const pct = (present / total) * 100;
      return Number(pct.toFixed(2));
    },

    /**
     * Return semantic status metadata based on percentage thresholds:
     * 80%+       -> Good
     * 75–79%     -> Warning
     * 50–74%     -> Low
     * Below 50%  -> Critical
     */
    getStatus(percentage) {
      const pct = Number(percentage);
      if (pct >= 80) {
        return {
          key: 'good',
          label: 'Good',
          badgeClass: 'att-badge-good',
          color: '#16A34A',
          bgColor: 'rgba(22, 163, 74, 0.12)',
          icon: '✓'
        };
      }
      if (pct >= 75) {
        return {
          key: 'warning',
          label: 'Warning',
          badgeClass: 'att-badge-warning',
          color: '#D97706',
          bgColor: 'rgba(217, 119, 6, 0.12)',
          icon: '▲'
        };
      }
      if (pct >= 50) {
        return {
          key: 'low',
          label: 'Low',
          badgeClass: 'att-badge-low',
          color: '#EA580C',
          bgColor: 'rgba(234, 88, 12, 0.12)',
          icon: '!'
        };
      }
      return {
        key: 'critical',
        label: 'Critical',
        badgeClass: 'att-badge-critical',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        icon: '⚠'
      };
    },

    /**
     * Compute the 4 summary cards dynamically from subject data.
     */
    computeSummary(subjectList) {
      const list = subjectList || [];
      
      let totPresent = 0, totClasses = 0;
      let thPresent = 0, thClasses = 0;
      let prPresent = 0, prClasses = 0;
      let tutPresent = 0, tutClasses = 0;

      list.forEach(item => {
        const p = item.present || 0;
        const t = item.total || 0;
        const type = (item.type || '').toUpperCase();

        totPresent += p;
        totClasses += t;

        if (type === 'TH') {
          thPresent += p;
          thClasses += t;
        } else if (type === 'PR') {
          prPresent += p;
          prClasses += t;
        } else if (type === 'TUT') {
          tutPresent += p;
          tutClasses += t;
        }
      });

      const overallPct = this.calculatePercentage(totPresent, totClasses);
      const theoryPct = this.calculatePercentage(thPresent, thClasses);
      const practicalPct = this.calculatePercentage(prPresent, prClasses);
      const tutorialPct = this.calculatePercentage(tutPresent, tutClasses);

      return {
        overall: {
          present: totPresent,
          total: totClasses,
          percentage: overallPct,
          status: this.getStatus(overallPct),
          label: 'Overall Attendance',
          subtext: `${totPresent} / ${totClasses} Periods`
        },
        theory: {
          present: thPresent,
          total: thClasses,
          percentage: theoryPct,
          status: this.getStatus(theoryPct),
          label: 'Theory Attendance',
          subtext: `${thPresent} / ${thClasses} Periods`
        },
        practical: {
          present: prPresent,
          total: prClasses,
          percentage: practicalPct,
          status: this.getStatus(practicalPct),
          label: 'Practical Attendance',
          subtext: `${prPresent} / ${prClasses} Periods`
        },
        tutorial: {
          present: tutPresent,
          total: tutClasses,
          percentage: tutorialPct,
          status: tutClasses > 0 ? this.getStatus(tutorialPct) : { key: 'na', label: 'No Sessions', badgeClass: 'att-badge-na', color: '#64748B' },
          label: 'Tutorial Attendance',
          subtext: `${tutPresent} / ${tutClasses} Periods`
        }
      };
    },

    /**
     * Compute analytical insights across all subjects.
     */
    computeInsights(subjectList) {
      const list = subjectList || [];
      if (!list.length) {
        return {
          totalAttended: 0,
          totalMissed: 0,
          overallPct: 0,
          below75Count: 0,
          below50Count: 0,
          highestSubject: null,
          lowestSubject: null
        };
      }

      let totalAttended = 0;
      let totalConducted = 0;
      let below75Count = 0;
      let below50Count = 0;

      let highest = null;
      let lowest = null;

      list.forEach(item => {
        const p = item.present || 0;
        const t = item.total || 0;
        const pct = this.calculatePercentage(p, t);

        totalAttended += p;
        totalConducted += t;

        if (pct < 75) below75Count++;
        if (pct < 50) below50Count++;

        const itemWithPct = { ...item, percentage: pct };
        if (!highest || pct > highest.percentage) {
          highest = itemWithPct;
        }
        if (!lowest || pct < lowest.percentage) {
          lowest = itemWithPct;
        }
      });

      const totalMissed = totalConducted - totalAttended;
      const overallPct = this.calculatePercentage(totalAttended, totalConducted);

      return {
        totalAttended,
        totalMissed,
        overallPct,
        below75Count,
        below50Count,
        highestSubject: highest,
        lowestSubject: lowest
      };
    },

    /**
     * Calculate consecutive classes required to reach a target percentage (e.g. 75% or 80%)
     * Formula: (Present + x) / (Total + x) >= Target
     * x * (1 - Target) >= (Target * Total - Present)
     * x = ceil((Target * Total - Present) / (1 - Target))
     */
    calculateConsecutiveNeeded(present, total, targetPct) {
      const target = Number(targetPct) / 100;
      const p = Number(present) || 0;
      const t = Number(total) || 0;

      if (t === 0) return { needed: 0, canMiss: 0, isMet: true };

      const currentPct = this.calculatePercentage(p, t);

      if (currentPct >= Number(targetPct)) {
        // Target is already met; calculate how many consecutive classes can be missed
        // p / (t + m) >= target => p >= target * (t + m) => m <= (p - target * t) / target
        const canMiss = Math.floor((p - target * t) / target);
        return {
          needed: 0,
          canMiss: Math.max(0, canMiss),
          isMet: true,
          currentPct
        };
      }

      // Target not yet met; calculate consecutive classes needed
      const numerator = target * t - p;
      const denominator = 1 - target;
      if (denominator <= 0) return { needed: Infinity, canMiss: 0, isMet: false };

      const needed = Math.ceil(numerator / denominator);
      return {
        needed: Math.max(0, needed),
        canMiss: 0,
        isMet: false,
        currentPct
      };
    },

    /**
     * Filter subject list by category and search keyword.
     */
    filterSubjects(list, filterType, query) {
      const items = list || [];
      const filter = (filterType || 'all').toLowerCase();
      const q = (query || '').trim().toLowerCase();

      return items.filter(item => {
        // Category filter
        const type = (item.type || '').toLowerCase();
        let matchesType = false;
        if (filter === 'all') {
          matchesType = true;
        } else if (filter === 'theory' && type === 'th') {
          matchesType = true;
        } else if (filter === 'practical' && type === 'pr') {
          matchesType = true;
        } else if (filter === 'tutorial' && type === 'tut') {
          matchesType = true;
        }

        if (!matchesType) return false;

        // Search query
        if (!q) return true;
        const nameMatch = (item.subject || '').toLowerCase().includes(q);
        const codeMatch = (item.code || '').toLowerCase().includes(q);
        const facultyMatch = (item.faculty || '').toLowerCase().includes(q);
        return nameMatch || codeMatch || facultyMatch;
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttendanceCalculations;
  } else {
    global.AttendanceCalculations = AttendanceCalculations;
  }
})(typeof window !== 'undefined' ? window : this);
