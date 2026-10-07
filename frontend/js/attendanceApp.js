/**
 * SSGMCE AUTONOMOUS COLLEGE ERP - STUDENT ATTENDANCE PORTAL CONTROLLER
 * Institution: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
 * 
 * STRICT ARCHITECTURAL PRINCIPLE:
 * This script runs independently for System B (Attendance Portal).
 * It communicates ONLY with AttendanceService and AttendanceCalculations.
 * It does NOT modify or access Student Dashboard state.
 */

(function () {
  'use strict';

  // Local Attendance State
  let state = {
    profile: null,
    subjects: [],
    summary: null,
    insights: null,
    activeFilter: 'all',
    searchQuery: '',
    selectedSubjectForModal: null,
    charts: {
      donut: null,
      subjectBar: null,
      categoryBar: null
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadAttendanceData();
      initUI();
    } catch (err) {
      console.error('Failed to initialize Student Attendance Portal:', err);
    }
  });

  /**
   * Load data from AttendanceService
   */
  async function loadAttendanceData() {
    const profileRes = await window.AttendanceService.getStudentProfile();
    const subjectsRes = await window.AttendanceService.getAttendanceList();
    const summaryRes = await window.AttendanceService.getSummaryCards();
    const insightsRes = await window.AttendanceService.getInsights();

    state.profile = profileRes.data;
    state.subjects = subjectsRes.data;
    state.summary = summaryRes.data;
    state.insights = insightsRes.data;
  }

  /**
   * Initialize UI Components
   */
  function initUI() {
    renderStudentHeader();
    renderAlertBanner();
    renderSummaryCards();
    renderInsights();
    renderAttendanceTable();
    initCharts();
    initFilters();
    initCalculator();
    initModalEvents();
    initMobileNavAndDropdowns();
  }

  /* ==========================================================================
     1. STUDENT PROFILE & HEADER
     ========================================================================== */
  function renderStudentHeader() {
    const p = state.profile || {};
    const nameEl = document.getElementById('studentFullName');
    const classMetaEl = document.getElementById('studentClassMeta');

    if (nameEl && p.name) {
      nameEl.textContent = p.name;
    }

    if (classMetaEl) {
      classMetaEl.innerHTML = `
        <span class="att-meta-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Roll: ${p.rollNo || '21'}
        </span>
        <span class="att-meta-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          PRN: ${p.prn || '202401088219'}
        </span>
        <span class="att-meta-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
          ${p.class || 'TY B.E. Computer Science and Engineering-A'}
        </span>
        <span class="att-meta-chip" style="background:#EFF6FF; color:#1D4ED8; border-color:#DBEAFE;">
          A.Y. ${p.academicYear || '2026–2027'} • Sem ${p.semester || 'V'}
        </span>
      `;
    }
  }

  /* ==========================================================================
     2. DYNAMIC ATTENDANCE ALERT BANNER
     ========================================================================== */
  function renderAlertBanner() {
    const banner = document.getElementById('attendanceAlertBanner');
    if (!banner) return;

    const overallPct = state.summary?.overall?.percentage || 35.14;
    const isCritical = overallPct < 50;
    const isWarning = overallPct >= 50 && overallPct < 75;

    let alertClass = 'alert-danger';
    let iconSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
    let title = '⚠ Mandatory 75% Attendance Shortage Alert';
    let desc = `Your current overall attendance is <strong>${overallPct}%</strong> (26 / 74 periods), which is below the mandatory autonomous threshold of <strong>75.00%</strong>. ${state.insights?.below75Count || 8} of your subjects are currently in shortage. Attend consecutive upcoming sessions to regain examination eligibility.`;

    if (!isCritical && !isWarning) {
      alertClass = 'alert-success';
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
      title = '✓ Attendance in Good Standing';
      desc = `Your current overall attendance is <strong>${overallPct}%</strong>. You satisfy the autonomous college eligibility requirement.`;
    } else if (isWarning) {
      alertClass = 'alert-warning';
      title = '▲ Attendance Warning Notice';
      desc = `Your overall attendance is at <strong>${overallPct}%</strong>. Maintain consistency to remain above 75.00%.`;
    }

    banner.className = `att-alert-banner ${alertClass}`;
    banner.innerHTML = `
      <div class="att-alert-left">
        <div class="att-alert-icon-circle">${iconSvg}</div>
        <div class="att-alert-text">
          <h4>${title}</h4>
          <p>${desc}</p>
        </div>
      </div>
      <div class="att-alert-actions">
        <button type="button" class="att-alert-btn" onclick="document.getElementById('attendanceCalculatorCard').scrollIntoView({behavior:'smooth'})">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="16" y2="14"></line><line x1="8" y1="18" x2="16" y2="18"></line></svg>
          Plan Target Classes
        </button>
      </div>
    `;
  }

  /* ==========================================================================
     3. FOUR SUMMARY CARDS
     ========================================================================== */
  function renderSummaryCards() {
    const grid = document.getElementById('attendanceSummaryCardsGrid');
    if (!grid) return;

    const s = state.summary;
    if (!s) return;

    const cards = [
      {
        key: 'overall',
        label: s.overall.label,
        pct: s.overall.percentage,
        sub: s.overall.subtext,
        status: s.overall.status,
        cardClass: 'card-overall',
        iconClass: 'icon-overall',
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
      },
      {
        key: 'theory',
        label: s.theory.label,
        pct: s.theory.percentage,
        sub: s.theory.subtext,
        status: s.theory.status,
        cardClass: 'card-theory',
        iconClass: 'icon-theory',
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
      },
      {
        key: 'practical',
        label: s.practical.label,
        pct: s.practical.percentage,
        sub: s.practical.subtext,
        status: s.practical.status,
        cardClass: 'card-practical',
        iconClass: 'icon-practical',
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"></path><line x1="8.5" y1="2" x2="15.5" y2="2"></line></svg>`
      },
      {
        key: 'tutorial',
        label: s.tutorial.label,
        pct: s.tutorial.percentage,
        sub: s.tutorial.subtext,
        status: s.tutorial.status,
        cardClass: 'card-tutorial',
        iconClass: 'icon-tutorial',
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
      }
    ];

    grid.innerHTML = cards.map(c => {
      const fillClass = c.pct >= 80 ? 'fill-safe' : (c.pct >= 75 ? 'fill-warning' : (c.pct >= 50 ? 'fill-low' : (c.pct > 0 ? 'fill-critical' : 'fill-neutral')));
      const badgeClass = c.status.badgeClass || (c.pct >= 80 ? 'badge-safe' : 'badge-critical');

      return `
        <div class="att-summary-card ${c.cardClass}">
          <div class="att-card-top">
            <div class="att-card-icon-box ${c.iconClass}">
              ${c.iconSvg}
            </div>
            <span class="att-card-badge ${badgeClass}">${c.status.label}</span>
          </div>
          <div>
            <div class="att-card-title">${c.label}</div>
            <div class="att-card-pct">${c.pct.toFixed(2)}%</div>
            <div class="att-card-period-stat">${c.sub}</div>
          </div>
          <div class="attendance-progress-bar">
            <div class="attendance-progress-fill ${fillClass}" style="width: ${c.pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     4. ATTENDANCE INSIGHTS (7 TILES)
     ========================================================================== */
  function renderInsights() {
    const grid = document.getElementById('attendanceInsightsGrid');
    if (!grid) return;

    const ins = state.insights;
    if (!ins) return;

    const tiles = [
      {
        label: 'Total Classes Attended',
        val: ins.totalAttended,
        sub: 'Conducted in Sem V',
        color: '#10B981'
      },
      {
        label: 'Total Classes Missed',
        val: ins.totalMissed,
        sub: 'Absences recorded',
        color: '#EF4444'
      },
      {
        label: 'Overall Attendance',
        val: `${ins.overallPct}%`,
        sub: 'Required: ≥ 75%',
        color: '#0B5CAD'
      },
      {
        label: 'Subjects Below 75%',
        val: ins.below75Count,
        sub: 'Eligiblity at risk',
        color: '#D97706'
      },
      {
        label: 'Subjects Below 50%',
        val: ins.below50Count,
        sub: 'Critical shortage',
        color: '#EF4444'
      },
      {
        label: 'Highest Attendance',
        val: ins.highestSubject ? `${ins.highestSubject.percentage}%` : '—',
        sub: ins.highestSubject ? ins.highestSubject.subject.split('-')[0] : 'None',
        color: '#10B981'
      },
      {
        label: 'Lowest Attendance',
        val: ins.lowestSubject ? `${ins.lowestSubject.percentage}%` : '—',
        sub: ins.lowestSubject ? ins.lowestSubject.subject.split('-')[0] : 'None',
        color: '#EF4444'
      }
    ];

    grid.innerHTML = tiles.map(t => `
      <div class="att-insight-tile">
        <span class="att-insight-label">${t.label}</span>
        <span class="att-insight-val" style="color:${t.color};">${t.val}</span>
        <span class="att-insight-sub" title="${t.sub}">${t.sub}</span>
      </div>
    `).join('');
  }

  /* ==========================================================================
     5. CHARTS INITIALIZATION (Chart.js)
     ========================================================================== */
  function initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded.');
      return;
    }

    initDonutChart();
    initSubjectBarChart();
    initCategoryChart();
  }

  // 5A. Donut Chart (Present vs Absent)
  function initDonutChart() {
    const canvas = document.getElementById('attendanceDonutChart');
    if (!canvas) return;

    if (state.charts.donut) {
      state.charts.donut.destroy();
    }

    const present = state.summary?.overall?.present || 26;
    const absent = (state.summary?.overall?.total || 74) - present;

    state.charts.donut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Present Periods', 'Absent Periods'],
        datasets: [{
          data: [present, absent],
          backgroundColor: ['#0B5CAD', '#EF4444'],
          hoverBackgroundColor: ['#08498b', '#DC2626'],
          borderWidth: 0,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 900
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0B1F3A',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: function (ctx) {
                const total = present + absent;
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed} periods (${pct}%)`;
              }
            }
          }
        }
      }
    });

    const centerPct = document.getElementById('donutCenterPct');
    if (centerPct) {
      centerPct.textContent = `${state.summary?.overall?.percentage || 35.14}%`;
    }
  }

  // 5B. Subject Attendance Bar Chart
  function initSubjectBarChart() {
    const canvas = document.getElementById('subjectAttendanceBarChart');
    if (!canvas) return;

    if (state.charts.subjectBar) {
      state.charts.subjectBar.destroy();
    }

    const labels = state.subjects.map(s => {
      const parts = s.subject.split('-');
      const name = parts[0].trim();
      return name.length > 20 ? name.substring(0, 18) + '...' : name;
    });

    const data = state.subjects.map(s => s.percentage);
    const bgColors = data.map(pct => {
      if (pct >= 80) return '#10B981';
      if (pct >= 75) return '#F59E0B';
      if (pct >= 50) return '#EA580C';
      return '#EF4444';
    });

    state.charts.subjectBar = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Attendance %',
          data: data,
          backgroundColor: bgColors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: {
              callback: val => `${val}%`,
              font: { size: 10, family: 'Inter' },
              color: '#64748B'
            },
            grid: { color: '#F1F5F9' }
          },
          y: {
            ticks: {
              font: { size: 10, family: 'Inter', weight: '600' },
              color: '#1E293B'
            },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0B1F3A',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                return state.subjects[idx].subject;
              },
              label: (ctx) => {
                const idx = ctx.dataIndex;
                const sub = state.subjects[idx];
                return ` Attendance: ${sub.percentage}% (${sub.present}/${sub.total} periods) [${sub.type}]`;
              }
            }
          }
        }
      }
    });
  }

  // 5C. Category Comparison Chart
  function initCategoryChart() {
    const canvas = document.getElementById('attendanceCategoryChart');
    if (!canvas) return;

    if (state.charts.categoryBar) {
      state.charts.categoryBar.destroy();
    }

    const s = state.summary;
    if (!s) return;

    state.charts.categoryBar = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Theory (TH)', 'Practical (PR)', 'Tutorial (TUT)'],
        datasets: [{
          label: 'Attendance %',
          data: [s.theory.percentage, s.practical.percentage, s.tutorial.percentage],
          backgroundColor: ['#1565C0', '#10B981', '#8B5CF6'],
          borderRadius: 6,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: val => `${val}%`,
              font: { size: 10, family: 'Inter' },
              color: '#64748B'
            },
            grid: { color: '#F1F5F9' }
          },
          x: {
            ticks: {
              font: { size: 11, family: 'Inter', weight: '600' },
              color: '#1E293B'
            },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0B1F3A',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => ` Attendance: ${ctx.parsed.y}%`
            }
          }
        }
      }
    });
  }

  /* ==========================================================================
     6. SUBJECT-WISE TABLE & SEARCH/FILTER
     ========================================================================== */
  function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    const emptyState = document.getElementById('tableEmptyState');
    if (!tbody) return;

    const filtered = window.AttendanceCalculations.filterSubjects(
      state.subjects,
      state.activeFilter,
      state.searchQuery
    );

    // Update filter count pills
    updateFilterCounts();

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map((item, idx) => {
      const typeLower = (item.type || 'TH').toLowerCase();
      const pct = item.percentage;
      const statusObj = item.status || window.AttendanceCalculations.getStatus(pct);

      const fillClass = pct >= 80 ? 'fill-safe' : (pct >= 75 ? 'fill-warning' : (pct >= 50 ? 'fill-low' : 'fill-critical'));
      const pctClass = pct >= 80 ? 'pct-good' : (pct >= 75 ? 'pct-warning' : (pct >= 50 ? 'pct-low' : 'pct-critical'));

      return `
        <tr class="attendance-table-row" data-type="${typeLower}">
          <td style="color:#64748B; font-weight:600; text-align:center;">${idx + 1}</td>
          <td>
            <div class="subject-cell-wrap">
              <span class="subject-main-name">${escapeHTML(item.subject)}</span>
              <span class="subject-sub-code">${escapeHTML(item.code)} • ${escapeHTML(item.faculty || 'SSGMCE Faculty')}</span>
            </div>
          </td>
          <td>
            <span class="badge-type ${typeLower}">${escapeHTML(item.type)}</span>
          </td>
          <td style="font-weight:700; color:var(--navy);">${item.present}</td>
          <td style="color:var(--text-secondary);">${item.total}</td>
          <td class="${pctClass}">${pct.toFixed(2)}%</td>
          <td>
            <div class="attendance-progress-bar">
              <div class="attendance-progress-fill ${fillClass}" style="width:${pct}%;"></div>
            </div>
          </td>
          <td>
            <span class="att-card-badge ${statusObj.badgeClass}">${statusObj.label}</span>
          </td>
          <td style="text-align:center;">
            <button type="button" class="btn-table-view" data-subject-id="${item.id}" title="View Detailed Lecture Breakdown">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              View
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click listeners to "View" buttons
    tbody.querySelectorAll('.btn-table-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-subject-id'), 10);
        const subject = state.subjects.find(s => s.id === id);
        if (subject) openSubjectModal(subject);
      });
    });
  }

  function updateFilterCounts() {
    const allCount = state.subjects.length;
    const thCount = state.subjects.filter(s => (s.type || '').toUpperCase() === 'TH').length;
    const prCount = state.subjects.filter(s => (s.type || '').toUpperCase() === 'PR').length;
    const tutCount = state.subjects.filter(s => (s.type || '').toUpperCase() === 'TUT').length;

    const elAll = document.getElementById('countAll');
    const elTh = document.getElementById('countTheory');
    const elPr = document.getElementById('countPractical');
    const elTut = document.getElementById('countTutorial');

    if (elAll) elAll.textContent = `(${allCount})`;
    if (elTh) elTh.textContent = `(${thCount})`;
    if (elPr) elPr.textContent = `(${prCount})`;
    if (elTut) elTut.textContent = `(${tutCount})`;
  }

  function initFilters() {
    // Tab filters
    const filterButtons = document.querySelectorAll('.att-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeFilter = btn.getAttribute('data-filter') || 'all';
        renderAttendanceTable();
      });
    });

    // Search filter
    const searchInput = document.getElementById('attendanceSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderAttendanceTable();
      });
    }
  }

  /* ==========================================================================
     7. ATTENDANCE "WHAT-IF" TARGET CALCULATOR
     ========================================================================== */
  function initCalculator() {
    const subjectSelect = document.getElementById('calcSubjectSelect');
    const presentInput = document.getElementById('calcPresentInput');
    const totalInput = document.getElementById('calcTotalInput');
    const targetSelect = document.getElementById('calcTargetSelect');
    const resTitle = document.getElementById('calcResultTitle');
    const resDesc = document.getElementById('calcResultDesc');

    if (!subjectSelect || !presentInput || !totalInput || !targetSelect) return;

    // Populate subject select
    subjectSelect.innerHTML = `
      <option value="overall" selected>Overall Attendance (26 / 74 Conducted)</option>
      ${state.subjects.map(s => `
        <option value="${s.id}">${escapeHTML(s.subject)} (${s.present}/${s.total})</option>
      `).join('')}
    `;

    const runCalculation = () => {
      const p = parseInt(presentInput.value, 10) || 0;
      const t = parseInt(totalInput.value, 10) || 0;
      const targetPct = parseInt(targetSelect.value, 10) || 75;

      const result = window.AttendanceCalculations.calculateConsecutiveNeeded(p, t, targetPct);

      if (result.isMet) {
        resTitle.textContent = `✓ Target Met (${result.currentPct}%)`;
        resTitle.style.color = '#10B981';
        if (result.canMiss > 0) {
          resDesc.innerHTML = `You are currently above <strong>${targetPct}%</strong>. You can safely miss up to <strong>${result.canMiss} lecture${result.canMiss > 1 ? 's' : ''}</strong> without dropping below the autonomous requirement.`;
        } else {
          resDesc.innerHTML = `You are currently right at <strong>${targetPct}%</strong>. Do not miss any upcoming sessions to avoid falling into shortage.`;
        }
      } else {
        resTitle.textContent = `⚠ Attend Next ${result.needed} Consecutive Classes`;
        resTitle.style.color = '#DC2626';
        const finalAttended = p + result.needed;
        const finalTotal = t + result.needed;
        const finalPct = ((finalAttended / finalTotal) * 100).toFixed(1);
        resDesc.innerHTML = `To reach the <strong>${targetPct}%</strong> threshold from your current standing (${result.currentPct}%), you must attend the next <strong>${result.needed} consecutive lectures</strong> without absence (${finalAttended}/${finalTotal} = ${finalPct}%).`;
      }
    };

    // When subject changes, populate present and total inputs
    subjectSelect.addEventListener('change', () => {
      const val = subjectSelect.value;
      if (val === 'overall') {
        presentInput.value = state.summary?.overall?.present || 26;
        totalInput.value = state.summary?.overall?.total || 74;
      } else {
        const id = parseInt(val, 10);
        const sub = state.subjects.find(s => s.id === id);
        if (sub) {
          presentInput.value = sub.present;
          totalInput.value = sub.total;
        }
      }
      runCalculation();
    });

    presentInput.addEventListener('input', runCalculation);
    totalInput.addEventListener('input', runCalculation);
    targetSelect.addEventListener('change', runCalculation);

    // Initial run
    runCalculation();
  }

  /* ==========================================================================
     8. SUBJECT DETAILS MODAL
     ========================================================================== */
  function openSubjectModal(subject) {
    const backdrop = document.getElementById('subjectModalBackdrop');
    const titleEl = document.getElementById('modalSubjectName');
    const codeEl = document.getElementById('modalSubjectCode');
    const bodyEl = document.getElementById('modalSubjectContent');

    if (!backdrop || !bodyEl) return;

    state.selectedSubjectForModal = subject;

    const typeFull = subject.type === 'TH' ? 'Theory' : (subject.type === 'PR' ? 'Practical / Laboratory' : 'Tutorial');
    if (codeEl) codeEl.textContent = `${subject.code} • ${typeFull}`;
    if (titleEl) titleEl.textContent = subject.subject;

    const absent = subject.total - subject.present;
    const calc75 = window.AttendanceCalculations.calculateConsecutiveNeeded(subject.present, subject.total, 75);

    let adviceHtml = '';
    if (calc75.isMet) {
      adviceHtml = `
        <div class="modal-prediction-card" style="border-left-color:#10B981; background:#ECFDF5;">
          <h4 style="color:#065F46;">Target Met (Above 75%)</h4>
          <p style="color:#047857;">Your attendance for this subject is safe. You can miss up to <strong>${calc75.canMiss} lecture${calc75.canMiss > 1 ? 's' : ''}</strong> without falling below 75%.</p>
        </div>
      `;
    } else {
      adviceHtml = `
        <div class="modal-prediction-card" style="border-left-color:#EF4444; background:#FEF2F2;">
          <h4 style="color:#991B1B;">Classes Needed for 75% Minimum: ${calc75.needed}</h4>
          <p style="color:#B91C1C;">You must attend the next <strong>${calc75.needed} consecutive ${subject.type} sessions</strong> without missing to reach the minimum 75% requirement (${subject.present + calc75.needed} / ${subject.total + calc75.needed} periods).</p>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <div class="modal-stat-grid">
        <div class="modal-stat-card">
          <div class="label">Present Classes</div>
          <div class="val" style="color:#10B981;">${subject.present}</div>
        </div>
        <div class="modal-stat-card">
          <div class="label">Absent Classes</div>
          <div class="val" style="color:#EF4444;">${absent}</div>
        </div>
        <div class="modal-stat-card">
          <div class="label">Total Conducted</div>
          <div class="val">${subject.total}</div>
        </div>
        <div class="modal-stat-card">
          <div class="label">Attendance %</div>
          <div class="val" style="color:${subject.percentage >= 75 ? '#10B981' : '#EF4444'};">${subject.percentage}%</div>
        </div>
        <div class="modal-stat-card">
          <div class="label">Course Credits</div>
          <div class="val">${subject.credits || '3.0'}</div>
        </div>
        <div class="modal-stat-card">
          <div class="label">Classroom / Venue</div>
          <div class="val" style="font-size:0.95rem; line-height:1.8;">${subject.room || 'LH-204'}</div>
        </div>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:0.8rem; font-weight:600;">
          <span style="color:var(--text-secondary);">Course Instructor:</span>
          <strong style="color:var(--navy);">${escapeHTML(subject.faculty || 'SSGMCE Faculty')}</strong>
        </div>
        <div class="attendance-progress-bar" style="height:8px;">
          <div class="attendance-progress-fill ${subject.percentage >= 75 ? 'fill-safe' : 'fill-critical'}" style="width:${subject.percentage}%;"></div>
        </div>
      </div>

      ${adviceHtml}

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:4px;">
        <button type="button" class="btn btn-outline" onclick="closeSubjectModal()" style="font-size:0.8rem; padding:6px 14px;">Close</button>
        <button type="button" class="btn btn-primary" onclick="showToast('Syllabus sheet requested for ${escapeHTML(subject.code)}', 'info')" style="font-size:0.8rem; padding:6px 14px;">View Subject Syllabus</button>
      </div>
    `;

    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.closeSubjectModal = function () {
    const backdrop = document.getElementById('subjectModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  function initModalEvents() {
    const backdrop = document.getElementById('subjectModalBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeSubjectModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSubjectModal();
    });
  }

  /* ==========================================================================
     9. MOBILE DRAWER, PROFILE, AND ACTION BUTTONS
     ========================================================================== */
  function initMobileNavAndDropdowns() {
    // Mobile Drawer Toggle
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('dashboardSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('drawer-open');
        if (isOpen) {
          sidebar.classList.remove('drawer-open');
          if (backdrop) backdrop.classList.remove('active');
          document.body.style.overflow = '';
        } else {
          sidebar.classList.add('drawer-open');
          if (backdrop) backdrop.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });

      if (backdrop) {
        backdrop.addEventListener('click', () => {
          sidebar.classList.remove('drawer-open');
          backdrop.classList.remove('active');
          document.body.style.overflow = '';
        });
      }
    }

    // Profile Dropdown
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
      });
    }

    // Notifications Dropdown
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('active');
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== profileBtn) {
        profileDropdown.classList.remove('active');
      }
      if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('active');
      }
    });

    // Action buttons
    const btnExport = document.getElementById('btnExportPDF');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        showToast('Generating official Subject-wise Attendance Report (PDF)...', 'info');
        setTimeout(() => {
          showToast('✓ Report ready: Student_Attendance_Report.pdf', 'success');
        }, 1200);
      });
    }

    const btnLeave = document.getElementById('btnApplyLeave');
    if (btnLeave) {
      btnLeave.addEventListener('click', () => {
        showToast('Opening SSGMCE Duty Leave Application Form 4B...', 'info');
      });
    }
  }

  // Toast Notification Helper
  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toastStack');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'dashboard-toast';
    const icon = type === 'success' ? '✓' : (type === 'danger' ? '⚠' : 'ℹ');
    toast.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <strong style="color:var(--accent); font-size:1rem;">${icon}</strong>
        <span>${escapeHTML(message)}</span>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s forwards ease';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 3500);
  };

  // Basic HTML entity escaping
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
