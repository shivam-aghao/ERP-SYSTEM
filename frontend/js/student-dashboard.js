/**
 * SSGMCE Student ERP Dashboard Interactive Script
 * Shri Sant Gajanan Maharaj College of Engineering, Shegaon
 * Student: Shivam Aghao | Roll: 21 | CSE 2R1 (CSE2401)
 */

let attendanceChartInstance = null;
let syllabusChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initAttendanceChart();
  initSyllabusProgressChart();
  initSubjectAttendanceToggle();
  initMobileDrawer();
  initSidebarLinks();
  initDropdowns();
  initGlobalSearch();
  initQuickAccessTiles();
  initQuickActionStrip();
  initCampusShowcase();
  initCampusLightbox();
  initTimetableDayTabs();
  initStudentModules();

  // Dynamic API & Supabase Hydration Engine (Removes all static placeholders)
  hydrateDashboardData();
});

/* ==========================================================================
   1. OVERALL ATTENDANCE DOUGHNUT CHART (Chart.js + SVG Fallback)
   ========================================================================== */
function initAttendanceChart() {
  renderAttendanceChart(82, 18, 157, 34);
}

function renderAttendanceChart(presentPercentage, absentPercentage, attendedLectures = 157, absentLectures = 34) {
  const canvas = document.getElementById('overallAttendanceChart');
  if (!canvas) return;

  if (attendanceChartInstance) {
    attendanceChartInstance.destroy();
    attendanceChartInstance = null;
  }

  if (typeof Chart !== 'undefined') {
    try {
      attendanceChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent'],
          datasets: [
            {
              data: [presentPercentage, absentPercentage],
              backgroundColor: ['#00A6D6', '#E2E8F0'],
              hoverBackgroundColor: ['#0093be', '#CBD5E1'],
              borderWidth: 0,
              borderRadius: 4,
              spacing: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '74%',
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0B1F3A',
              titleFont: { family: 'Poppins', size: 12, weight: 'bold' },
              bodyFont: { family: 'Inter', size: 12 },
              padding: 10,
              cornerRadius: 6,
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const val = context.parsed || 0;
                  const lectures = val === presentPercentage ? `${attendedLectures} lectures` : `${absentLectures} lectures`;
                  return ` ${label}: ${val}% (${lectures})`;
                }
              }
            }
          }
        }
      });
      return;
    } catch (err) {
      console.warn('Chart.js error, rendering SVG fallback:', err);
    }
  }

  // Fallback: Pure SVG Ring
  renderSvgDoughnutFallback(canvas, presentPercentage);
}

function renderSvgDoughnutFallback(canvas, presentPct) {
  const container = canvas.parentElement;
  if (!container) return;

  canvas.style.display = 'none';
  const circumference = 2 * Math.PI * 75;
  const offset = circumference - (presentPct / 100) * circumference;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 190 190');
  svg.setAttribute('width', '190');
  svg.setAttribute('height', '190');
  svg.style.transform = 'rotate(-90deg)';

  svg.innerHTML = `
    <circle cx="95" cy="95" r="75" stroke="#E2E8F0" stroke-width="20" fill="none" />
    <circle cx="95" cy="95" r="75" stroke="#00A6D6" stroke-width="20" stroke-linecap="round" fill="none"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
  `;

  container.insertBefore(svg, container.firstChild);
}

/* ==========================================================================
   2. CURRICULUM ANALYTICS: SYLLABUS COMPLETED GRADIENT BAR CHART
   ========================================================================== */
function initSyllabusProgressChart() {
  const defaultSubjects = ['Data Struct.', 'Java Prog.', 'Operating Sys.', 'Database Mgmt', 'Comp. Networks'];
  const defaultData = [82, 80, 75, 78, 65];
  renderSyllabusChart(defaultSubjects, defaultData);
}

function renderSyllabusChart(subjects, progressData) {
  const canvas = document.getElementById('syllabusProgressBarChart');
  if (!canvas) return;

  if (syllabusChartInstance) {
    syllabusChartInstance.destroy();
    syllabusChartInstance = null;
  }

  if (typeof Chart !== 'undefined') {
    try {
      const ctx = canvas.getContext('2d');

      const barGradient = ctx.createLinearGradient(0, 10, 0, 200);
      barGradient.addColorStop(0, '#00A6D6');
      barGradient.addColorStop(1, '#0B5CAD');

      const hoverGradient = ctx.createLinearGradient(0, 10, 0, 200);
      hoverGradient.addColorStop(0, '#38BDF8');
      hoverGradient.addColorStop(1, '#1565C0');

      syllabusChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: subjects,
          datasets: [
            {
              label: 'Syllabus Completed (%)',
              data: progressData,
              backgroundColor: barGradient,
              hoverBackgroundColor: hoverGradient,
              borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
              borderSkipped: false,
              barPercentage: 0.58,
              categoryPercentage: 0.75
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { family: 'Inter', size: 12, weight: '600' },
                color: '#263238'
              }
            },
            y: {
              min: 0,
              max: 100,
              ticks: {
                stepSize: 25,
                callback: (value) => value + '%',
                font: { family: 'Inter', size: 10 },
                color: '#64748B'
              },
              grid: { color: '#F1F5F9' }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0B1F3A',
              titleFont: { family: 'Poppins', size: 12, weight: 'bold' },
              bodyFont: { family: 'Inter', size: 12 },
              padding: 10,
              cornerRadius: 6,
              callbacks: {
                label: (ctx) => ` Syllabus Covered: ${ctx.parsed.y}%`
              }
            }
          }
        }
      });
      return;
    } catch (err) {
      console.warn('Syllabus chart initialization error:', err);
    }
  }
}

function initSubjectAttendanceToggle() {
  const btnToggle = document.getElementById('btnToggleSubjectAtt');
  const collapsible = document.getElementById('subjectAttendanceCollapsible');
  const toggleText = document.getElementById('toggleSubjectAttText');
  const toggleBadge = document.getElementById('toggleSubjectAttBadge');

  if (!btnToggle || !collapsible) return;

  function toggleSubjectAttendance(forceOpen) {
    const isShowing = collapsible.classList.contains('show');
    const shouldOpen = forceOpen !== undefined ? forceOpen : !isShowing;

    if (shouldOpen) {
      collapsible.classList.add('show');
      btnToggle.classList.add('active');
      btnToggle.setAttribute('aria-expanded', 'true');
      if (toggleText) toggleText.textContent = 'Hide Subject-wise Attendance';
      if (toggleBadge) toggleBadge.textContent = 'Close Breakdown ▲';
      showToast('Showing 5 registered engineering subjects', 'info');
    } else {
      collapsible.classList.remove('show');
      btnToggle.classList.remove('active');
      btnToggle.setAttribute('aria-expanded', 'false');
      if (toggleText) toggleText.textContent = 'Show Subject-wise Attendance';
      if (toggleBadge) toggleBadge.textContent = '5 Subjects ▼';
      showToast('Subject attendance breakdown closed', 'info');
    }
  }

  btnToggle.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSubjectAttendance();
  });

  if (window.location.hash === '#attendance' || window.location.hash === '#attendanceCard') {
    setTimeout(() => {
      toggleSubjectAttendance(true);
      const targetCard = document.getElementById('attendanceCard');
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 400);
  }
}

/* ==========================================================================
   4. MOBILE DRAWER NAVIGATION
   ========================================================================== */
function initMobileDrawer() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (!toggleBtn || !sidebar || !backdrop) return;

  function openDrawer() {
    sidebar.classList.add('drawer-open');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    sidebar.classList.remove('drawer-open');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar.classList.contains('drawer-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  backdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('drawer-open')) {
      closeDrawer();
    }
  });

  const navLinks = sidebar.querySelectorAll('.sidebar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeDrawer();
      }
    });
  });
}

/* ==========================================================================
   5. SIDEBAR INTERACTIVE MODULE LINKS & ALL 18 NAVIGATION HANDLERS
   ========================================================================== */
function initSidebarLinks() {
  const sidebar = document.getElementById('dashboardSidebar');
  if (!sidebar) return;

  const navLinks = sidebar.querySelectorAll('.sidebar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const navKey = link.getAttribute('data-nav') || link.closest('[data-module]')?.getAttribute('data-module');
      const href = link.getAttribute('href');

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Auto-close mobile drawer when any link is clicked
      const backdrop = document.getElementById('sidebarBackdrop');
      if (sidebar.classList.contains('drawer-open')) {
        sidebar.classList.remove('drawer-open');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
      }

      // --- Standalone page navigations: allow the browser to follow the href ---
      // Attendance page
      if (navKey === 'attendance') {
        return;
      }

      // Profile page
      if (navKey === 'profile') {
        return;
      }

      // Syllabus page
      if (navKey === 'syllabus') {
        return;
      }

      // Timetable page navigation
      if (navKey === 'timetable') {
        if (href && !href.startsWith('#') && href !== 'javascript:void(0)') {
          return;
        }
        e.preventDefault();
        const timetableCard = document.getElementById('timetableCard');
        if (timetableCard) {
          timetableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          timetableCard.classList.add('card-highlight-pulse');
          setTimeout(() => timetableCard.classList.remove('card-highlight-pulse'), 1500);
          showToast("Viewing Today's Timetable", 'info');
        }
        return;
      }

      // Check on-page scroll targets
      if (href === '#timetableCard') {
        e.preventDefault();
        const timetableCard = document.getElementById('timetableCard');
        if (timetableCard) {
          timetableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          timetableCard.classList.add('card-highlight-pulse');
          setTimeout(() => timetableCard.classList.remove('card-highlight-pulse'), 1500);
          showToast("Viewing Today's Timetable (CSE 2R1)", 'info');
        }
        return;
      }

      if (navKey === 'dashboard') {
        if (!href || href === 'index.html' || href === '#' || href === 'javascript:void(0)') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast('Welcome to SSGMCE Student ERP Dashboard', 'info');
        }
        return;
      }

      if (navKey === 'documents') {
        e.preventDefault();
        openStudentModule('dwallet', 'download-document');
        return;
      }

      // If registered module exists in config, open its modal
      if (navKey && studentModuleConfig[navKey]) {
        e.preventDefault();
        openStudentModule(navKey);
        return;
      }

      if (href && href.startsWith('#') && href !== '#') {
        const targetCard = document.querySelector(href);
        if (targetCard) {
          e.preventDefault();
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          targetCard.classList.add('card-highlight-pulse');
          setTimeout(() => targetCard.classList.remove('card-highlight-pulse'), 1500);
          return;
        }
      }
    });
  });
}

/* ==========================================================================
   6. HEADER DROPDOWNS (NOTIFICATIONS & PROFILE)
   ========================================================================== */
function initDropdowns() {
  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  const profileBtn = document.getElementById('profileBtn');
  const profilePanel = document.getElementById('profilePanel');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const notifBadge = document.querySelector('.notif-badge');

  function closeAllPanels() {
    if (notifPanel) notifPanel.classList.remove('open');
    if (profilePanel) profilePanel.classList.remove('open');
    if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
    if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
  }

  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifPanel.classList.contains('open');
      closeAllPanels();
      if (!isOpen) {
        notifPanel.classList.add('open');
        notifBtn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  if (profileBtn && profilePanel) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = profilePanel.classList.contains('open');
      closeAllPanels();
      if (!isOpen) {
        profilePanel.classList.add('open');
        profileBtn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-wrapper') && !e.target.closest('.profile-wrapper')) {
      closeAllPanels();
    }
  });

  if (markAllReadBtn && notifBadge) {
    markAllReadBtn.addEventListener('click', () => {
      const unreadItems = notifPanel.querySelectorAll('.notif-item.unread');
      unreadItems.forEach(item => item.classList.remove('unread'));
      notifBadge.style.display = 'none';
      const unreadTag = notifPanel.querySelector('.unread-tag');
      if (unreadTag) unreadTag.textContent = '0 New';
      showToast('All notifications marked as read', 'info');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      showToast('Signing out from SSGMCE Autonomous Portal...', 'warning');
      setTimeout(() => {
        if (typeof window.handleLogout === 'function') {
          window.handleLogout();
        } else if (window.ERP_AUTH && typeof window.ERP_AUTH.logout === 'function') {
          window.ERP_AUTH.logout();
        } else {
          window.location.href = 'login.html';
        }
      }, 500);
    });
  }
}

/* ==========================================================================
   7. GLOBAL SEARCH SYSTEM
   ========================================================================== */
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  if (!searchInput) return;

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      showToast('Type to search courses, timetable, and campus services...', 'info');
    }
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    // Filter quick access tiles
    const tiles = document.querySelectorAll('.qa-tile-btn');
    let matchedTiles = 0;
    tiles.forEach(tile => {
      const label = tile.querySelector('.qa-tile-label')?.textContent.toLowerCase() || '';
      const match = !query || label.includes(query);
      tile.style.display = match ? '' : 'none';
      if (match) matchedTiles++;
    });

    // Filter timetable periods
    const periods = document.querySelectorAll('.timetable-period');
    let matchedPeriods = 0;
    periods.forEach(p => {
      const course = p.querySelector('.period-course')?.textContent.toLowerCase() || '';
      const meta = p.querySelector('.period-meta')?.textContent.toLowerCase() || '';
      const match = !query || course.includes(query) || meta.includes(query);
      p.style.display = match ? '' : 'none';
      if (match) matchedPeriods++;
    });
  });
}

/* ==========================================================================
   8. QUICK ACCESS TILES
   ========================================================================== */
function initQuickAccessTiles() {
  const tiles = document.querySelectorAll('.qa-tile-btn');

  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const action = tile.getAttribute('data-action');

      tile.style.transform = 'scale(0.96)';
      setTimeout(() => {
        tile.style.transform = '';
      }, 150);

      switch (action) {
        case 'timetable': {
          const target = document.getElementById('timetableCard');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.classList.add('card-highlight-pulse');
            setTimeout(() => target.classList.remove('card-highlight-pulse'), 1500);
            showToast("Viewing Today's Timetable Schedule", 'info');
          }
          break;
        }
        case 'exam-form':
          openStudentModule('examination', 'revaluation');
          break;
        case 'result':
          openStudentModule('examination', 'view-marks');
          break;
        case 'bonafide':
          openStudentModule('dwallet', 'download-document');
          break;
        case 'hostel-app':
          openStudentModule('hostel', 'room');
          break;
        case 'library-portal':
          openStudentModule('library', 'borrowed');
          break;
        case 'training-placement':
          openStudentModule('placement', 'drives');
          break;
        case 'more-services':
          openStudentModule('grievance', 'lodge');
          break;
        default:
          showToast('Opening requested service...', 'info');
      }
    });
  });
}

/* ==========================================================================
   9. QUICK ACTION STRIP (HALL TICKET & STUDENT ID)
   ========================================================================== */
function initQuickActionStrip() {
  const actionBtns = document.querySelectorAll('.btn-strip-action');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'hall-ticket') {
        openStudentModule('hall-ticket', 'view-hall-ticket');
      } else if (action === 'download-id') {
        openStudentModule('student-id', 'card-view');
      }
    });
  });
}

/* ==========================================================================
   10. TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(message, type = 'info') {
  let stack = document.getElementById('toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" style="width:18px;height:18px;flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" style="width:18px;height:18px;flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  } else {
    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#00A6D6" stroke-width="2.5" style="width:18px;height:18px;flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

/* ==========================================================================
   11. SSGMCE CAMPUS SHOWCASE & HIGH-RES LIGHTBOX
   ========================================================================== */
function initCampusShowcase() {
  const expandBtn = document.getElementById('campusExpandBtn');
  if (expandBtn) {
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCampusLightbox();
    });
  }
}

function openCampusLightbox() {
  const modal = document.getElementById('campusLightboxModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  showToast('Viewing Vidya Bhavan Campus Photograph', 'info');
}

function closeCampusLightbox() {
  const modal = document.getElementById('campusLightboxModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function initCampusLightbox() {
  const modal = document.getElementById('campusLightboxModal');
  const closeBtn = document.getElementById('lightboxCloseBtn');
  const overlay = document.getElementById('lightboxOverlay');

  if (!modal) return;

  if (closeBtn) closeBtn.addEventListener('click', closeCampusLightbox);
  if (overlay) overlay.addEventListener('click', closeCampusLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeCampusLightbox();
    }
  });
}

/* ==========================================================================
   12. CARD TAB DROPDOWN (SYLLABUS & OTHERS)
   ========================================================================== */
function toggleCardTabDropdown(menuId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const isShown = menu.classList.contains('show');
  document.querySelectorAll('.card-dropdown-menu').forEach(m => m.classList.remove('show'));

  if (!isShown) {
    menu.classList.add('show');
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.card-tab-dropdown-wrap')) {
    document.querySelectorAll('.card-dropdown-menu').forEach(m => m.classList.remove('show'));
  }
  if (!e.target.closest('.modal-tab-dropdown-wrap')) {
    const modalMenu = document.getElementById('modalTabDropdownMenu');
    if (modalMenu) modalMenu.classList.remove('show');
  }
});

function initTimetableDayTabs() {
  const dayTabBtns = document.querySelectorAll('.day-tab-btn');
  const badge = document.getElementById('scheduleDayBadge');
  const grid = document.getElementById('timetableHorizontalGrid');

  if (!dayTabBtns.length || !grid) return;

  dayTabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      dayTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const dayKey = btn.getAttribute('data-day');
      const dayCapitalized = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);

      if (badge) badge.textContent = `Loading ${dayCapitalized} Schedule...`;

      try {
        if (typeof StudentApi !== 'undefined' && typeof StudentApi.getTimetable === 'function') {
          const res = await StudentApi.getTimetable(dayCapitalized);
          if (res && res.data && res.data.length > 0) {
            if (badge) badge.textContent = `${dayCapitalized} • ${res.data.length} Periods Scheduled`;
            renderTimetablePeriods(res.data);
            showToast(`Switched schedule to ${dayCapitalized}`, 'info');
            return;
          }
        }
      } catch (err) {
        console.warn(`Dynamic timetable fetch failed for ${dayKey}:`, err);
      }

      if (badge) badge.textContent = `${dayCapitalized} • No Periods Scheduled`;
      renderTimetablePeriods([]);
    });
  });
}

/* ==========================================================================
   14. ALL 18 STUDENT MODULE CONFIGURATIONS & MODAL MANAGER
   ========================================================================== */
const studentModuleConfig = {
  syllabus: {
    title: 'Syllabus & Curriculum Overview',
    eyebrow: 'ACADEMIC MODULE',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    subtabs: [
      { key: 'subject', label: 'Subject' },
      { key: 'faculty', label: 'Faculty' },
      { key: 'university-syllabus', label: 'University Syllabus' }
    ]
  },
  fees: {
    title: 'Fees & Accounts Management',
    eyebrow: 'STUDENT FINANCE',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line><circle cx="7" cy="15" r="1"></circle></svg>',
    subtabs: [
      { key: 'payable-fee', label: 'Payable Fee' },
      { key: 'online-payment', label: 'Online Payment' },
      { key: 'payment-receipt', label: 'Payment Receipt' }
    ]
  },
  elearning: {
    title: 'E-Learning & Digital Classroom',
    eyebrow: 'ACADEMIC RESOURCES',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><polygon points="10 8 15 10 10 12"></polygon></svg>',
    subtabs: [
      { key: 'assignments', label: 'Assignments' },
      { key: 'e-content', label: 'E-Content' },
      { key: 'quizzes', label: 'Quizzes' }
    ]
  },
  'change-info': {
    title: 'Change Official Information',
    eyebrow: 'STUDENT RECORDS & DEAN OFFICE',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>',
    subtabs: [
      { key: 'name', label: 'Name' },
      { key: 'employee', label: 'Employee' },
      { key: 'caste', label: 'Caste' },
      { key: 'personal-photo', label: 'Personal Photo' }
    ]
  },
  'update-info': {
    title: 'Updation of Information & Portfolio',
    eyebrow: 'ACCREDITATION & AICTE 100 POINTS',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    subtabs: [
      { key: 'industrial-visit', label: 'Industrial Visit' },
      { key: 'seminar', label: 'Seminar' },
      { key: 'workshop', label: 'Workshop' },
      { key: 'activities', label: 'Activities' }
    ]
  },
  dwallet: {
    title: 'D-Wallet Digital Vault',
    eyebrow: 'DIGITAL REPOSITORY & CREDENTIALS',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>',
    subtabs: [
      { key: 'upload-document', label: 'Upload Document' },
      { key: 'download-document', label: 'Download Document' }
    ]
  },
  examination: {
    title: 'Examination & Evaluation Cell',
    eyebrow: 'SGBAU AUTONOMOUS EXAMINATIONS',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    subtabs: [
      { key: 'view-marks', label: 'View Marks' },
      { key: 'revaluation', label: 'Application for Revaluation' },
      { key: 'backlog', label: 'Backlog' }
    ]
  },
  'course-choices': {
    title: 'Course Choices & Electives',
    eyebrow: 'ACADEMIC SELECTION',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
    subtabs: [
      { key: 'electives', label: 'Professional Electives' },
      { key: 'open-elective', label: 'Open Electives' }
    ]
  },
  'internal-marks': {
    title: 'Continuous Internal Evaluation (CIE)',
    eyebrow: 'INTERNAL ASSESSMENT',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    subtabs: [
      { key: 'cie-tests', label: 'CIE Class Tests' },
      { key: 'lab-eval', label: 'Lab Assessment' }
    ]
  },
  profile: {
    title: 'Student Profile & Academic Record',
    eyebrow: 'OFFICIAL STUDENT DOSSIER',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    subtabs: [
      { key: 'academic', label: 'Academic Details' },
      { key: 'personal', label: 'Personal Information' },
      { key: 'mentor', label: 'Proctor / Guardian' }
    ]
  },
  hostel: {
    title: 'Hostel & Residential Services',
    eyebrow: 'CAMPUS RESIDENCE CELL',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>',
    subtabs: [
      { key: 'room', label: 'Room Allotment' },
      { key: 'mess', label: 'Mess Schedule' },
      { key: 'gatepass', label: 'Digital Leave Pass' }
    ]
  },
  library: {
    title: 'Central Digital Library & OPAC',
    eyebrow: 'LEARNING RESOURCE CENTER',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    subtabs: [
      { key: 'borrowed', label: 'Borrowed Books' },
      { key: 'search-book', label: 'Book Search (OPAC)' },
      { key: 'e-journals', label: 'E-Journals & IEEE' }
    ]
  },
  placement: {
    title: 'Training & Placement (T&P) Cell',
    eyebrow: 'CAREER ADVANCEMENT & DRIVES',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    subtabs: [
      { key: 'drives', label: 'Upcoming Drives' },
      { key: 'eligibility', label: 'Eligibility Status' },
      { key: 'resume', label: 'Verified Resume' }
    ]
  },
  grievance: {
    title: 'Student Grievance & Redressal',
    eyebrow: 'INSTITUTIONAL OMBUDSMAN & ETHICS',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    subtabs: [
      { key: 'lodge', label: 'Lodge Grievance' },
      { key: 'status', label: 'Ticket Status' },
      { key: 'antiragging', label: 'Anti-Ragging Helpline' }
    ]
  },
  settings: {
    title: 'Account Settings & Preferences',
    eyebrow: 'STUDENT PORTAL CONFIGURATION',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    subtabs: [
      { key: 'password', label: 'Security & Password' },
      { key: 'notifications', label: 'Notifications' },
      { key: 'contact', label: 'Contact Preferences' }
    ]
  },
  'hall-ticket': {
    title: 'Autonomous Examination Digital Hall Ticket',
    eyebrow: 'OFFICIAL EXAMINATION ADMIT CARD',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    subtabs: [
      { key: 'view-hall-ticket', label: 'Hall Ticket Preview' },
      { key: 'instructions', label: 'Exam Rules & Instructions' }
    ]
  },
  'student-id': {
    title: 'Digital Student Identity Card',
    eyebrow: 'INSTITUTIONAL SMART CARD',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    subtabs: [
      { key: 'card-view', label: 'Identity Card' },
      { key: 'card-details', label: 'Card Information & Validity' }
    ]
  },
  timetable: {
    title: 'Academic Timetable & Schedule',
    eyebrow: 'SEMESTER IV SCHEDULE',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    subtabs: [
      { key: 'today', label: "Today's Schedule" },
      { key: 'weekly', label: 'Weekly Matrix' },
      { key: 'rooms', label: 'Classrooms & Labs' }
    ]
  },
  attendance: {
    title: 'Attendance Monitoring & Eligibility',
    eyebrow: 'ACADEMIC REGULATIONS',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    subtabs: [
      { key: 'subject-wise', label: 'Subject-wise Attendance' },
      { key: 'eligibility', label: 'Autonomous Eligibility' }
    ]
  }
};

let activeModuleKey = 'syllabus';

function initStudentModules() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStudentModule();
    }
  });
}

function openStudentModule(moduleKey, requestedSubtab) {
  const modal = document.getElementById('studentModuleModal');
  const cfg = studentModuleConfig[moduleKey];
  if (!modal || !cfg) return;

  activeModuleKey = moduleKey;

  const titleEl = document.getElementById('modalTitle');
  const subEl = document.getElementById('modalSubtitle') || document.getElementById('modalEyebrow');
  const iconEl = document.getElementById('modalHeaderIcon') || document.getElementById('modalIconBox');

  if (titleEl) titleEl.textContent = cfg.title;
  if (subEl) subEl.textContent = cfg.eyebrow;
  if (iconEl) iconEl.innerHTML = cfg.icon;

  const subtabNav = document.getElementById('modalSubtabBar') || document.getElementById('modalSubtabNav');
  const targetSubtab = requestedSubtab || cfg.subtabs[0].key;

  if (subtabNav) {
    let navHtml = '';
    cfg.subtabs.forEach(st => {
      const isActive = st.key === targetSubtab;
      navHtml += `<button type="button" class="modal-subtab-pill ${isActive ? 'active' : ''}" data-subtab="${st.key}" onclick="switchModalSubtab('${st.key}')">${st.label}</button>`;
    });
    subtabNav.innerHTML = navHtml;
  }

  // Update modal header dropdown menu with all registered modules
  const dropdownMenu = document.getElementById('modalTabDropdownMenu');
  const dropdownLabel = document.getElementById('modalTabDropdownLabel');
  if (dropdownLabel) dropdownLabel.textContent = cfg.title.split(' ')[0] + ' ▾';
  if (dropdownMenu) {
    let dropHtml = '';
    Object.keys(studentModuleConfig).forEach(k => {
      const isCur = k === moduleKey;
      dropHtml += `<button type="button" class="modal-tab-dropdown-item ${isCur ? 'active' : ''}" onclick="openStudentModule('${k}'); toggleModalTabDropdown(event);">${studentModuleConfig[k].title}</button>`;
    });
    dropdownMenu.innerHTML = dropHtml;
  }

  // Show corresponding module pane wrapper
  document.querySelectorAll('.module-content-pane, .module-pane-wrapper').forEach(w => {
    const isThisModule = w.getAttribute('data-module') === moduleKey;
    w.style.display = isThisModule ? 'block' : 'none';
    w.classList.toggle('active', isThisModule);
  });

  // Activate selected subtab pane
  switchModalSubtab(targetSubtab, false);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeStudentModule() {
  const modal = document.getElementById('studentModuleModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function switchModalSubtab(subtabKey, updatePill = true) {
  if (updatePill) {
    document.querySelectorAll('.modal-subtab-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-subtab') === subtabKey);
    });
  }

  const activeWrapper = document.querySelector(`.module-content-pane[data-module="${activeModuleKey}"], .module-pane-wrapper[data-module="${activeModuleKey}"]`);
  if (activeWrapper) {
    activeWrapper.querySelectorAll('.subtab-pane').forEach(pane => {
      const isThisSub = pane.getAttribute('data-subpane') === subtabKey;
      pane.style.display = isThisSub ? 'block' : 'none';
      pane.classList.toggle('active', isThisSub);
    });
  }
}

function toggleModalTabDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('modalTabDropdownMenu');
  if (menu) menu.classList.toggle('show');
}

/* ==========================================================================
   15. INTERACTIVE FORM & BUTTON ACTIONS
   ========================================================================== */

function handleOnlinePayment(event) {
  if (event) event.preventDefault();
  const amountInput = document.getElementById('payAmountInput');
  const amount = amountInput ? amountInput.value : '25,000';
  showToast(`Connecting to BillDesk Payment Gateway for ₹${amount}...`, 'info');
  setTimeout(() => {
    const txn = `TXN-SSG-${Math.floor(100000 + Math.random() * 900000)}`;
    showToast(`Payment Successful! Reference: ${txn}`, 'success');
    
    // Add verified receipt
    const receiptsContainer = document.querySelector('.receipts-list');
    if (receiptsContainer) {
      const newReceipt = document.createElement('div');
      newReceipt.className = 'receipt-item';
      newReceipt.innerHTML = `
        <div class="receipt-meta">
          <span class="receipt-id">Receipt #SSGMCE-2026-${Math.floor(1000 + Math.random() * 9000)}</span>
          <span class="receipt-date">Paid on Just Now • Online UPI</span>
          <span class="receipt-head">Autonomous Tuition & Academic Fee Payment</span>
        </div>
        <div class="receipt-amount-block">
          <span class="receipt-val">₹${amount}</span>
          <button type="button" class="btn-receipt-dl" onclick="showToast('Downloading verified receipt PDF...', 'success')">Download Receipt PDF</button>
        </div>
      `;
      receiptsContainer.insertBefore(newReceipt, receiptsContainer.firstChild);
    }
    setTimeout(() => switchModalSubtab('payment-receipt'), 800);
  }, 1200);
}

function calculateRevalFee() {
  const checks = document.querySelectorAll('input[name="revalSubject"]:checked');
  const count = checks.length;
  const total = count * 300;
  const display = document.getElementById('revalFeeDisplay');
  const submitBtn = document.getElementById('btnSubmitReval');
  if (display) display.textContent = '₹' + total;
  if (submitBtn) submitBtn.disabled = count === 0;
}

function handleRevaluationSubmit(event) {
  if (event) event.preventDefault();
  const checks = document.querySelectorAll('input[name="revalSubject"]:checked');
  if (!checks.length) {
    showToast('Please select at least 1 subject for revaluation.', 'warning');
    return;
  }
  const total = checks.length * 300;
  showToast(`Revaluation request submitted for ${checks.length} subject(s) (₹${total}). Forwarded to Controller of Examinations.`, 'success');
  setTimeout(() => {
    closeStudentModule();
  }, 1500);
}

function handleDWalletUpload(event) {
  const file = event?.target?.files?.[0];
  const docTypeSelect = document.getElementById('dwalletDocType');
  const docType = docTypeSelect ? docTypeSelect.options[docTypeSelect.selectedIndex].text : 'Document';
  const fileName = file ? file.name : `${docType}.pdf`;

  showToast(`Uploading "${fileName}" to encrypted SSGMCE vault...`, 'info');
  setTimeout(() => {
    showToast(`"${docType}" successfully uploaded & verified!`, 'success');
    const list = document.querySelector('.wallet-download-list');
    if (list) {
      const item = document.createElement('div');
      item.className = 'wallet-doc-item';
      item.innerHTML = `
        <div class="w-doc-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        </div>
        <div class="w-doc-info">
          <h5>${docType}</h5>
          <p>Uploaded Just Now • Verified Student Document</p>
          <span class="file-size-tag">Verified PDF</span>
        </div>
        <button type="button" class="btn-download-action" onclick="showToast('Downloading ${docType} PDF...', 'success')">Download PDF</button>
      `;
      list.insertBefore(item, list.firstChild);
    }
    setTimeout(() => switchModalSubtab('download-document'), 800);
  }, 1000);
}

function handlePhotoUploadPreview(event) {
  const file = event?.target?.files?.[0] || event?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('studentPhotoPreview');
    if (preview) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Student New Photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
    showToast('Photo selected! Click "Save as Profile Photo" to apply.', 'info');
  };
  reader.readAsDataURL(file);
}

function selectCourseChoice(btn, courseCode) {
  const card = btn.closest('.course-choice-card');
  if (!card) return;
  const grid = card.parentElement;
  grid.querySelectorAll('.course-choice-card').forEach(c => {
    c.classList.remove('selected-course');
    const b = c.querySelector('.btn-course-select');
    if (b) {
      b.textContent = 'Select Elective';
      b.classList.remove('selected');
    }
  });
  card.classList.add('selected-course');
  btn.textContent = 'Selected ✓';
  btn.classList.add('selected');
  showToast(`Successfully registered for elective: ${courseCode}!`, 'success');
}

function renewLibraryBook(btn, bookTitle) {
  btn.textContent = 'Renewed ✓ (+14 Days)';
  btn.disabled = true;
  btn.style.opacity = '0.75';
  showToast(`"${bookTitle}" renewal approved! Extended by 14 days.`, 'success');
}

function applyPlacementDrive(btn, companyName) {
  btn.textContent = 'Applied ✓';
  btn.disabled = true;
  btn.style.background = '#059669';
  showToast(`Application submitted for ${companyName} Campus Recruitment Drive!`, 'success');
}

function printHallTicket() {
  window.print();
}

/* ==========================================================================
   16. DYNAMIC BACKEND & SUPABASE HYDRATION ENGINE (REMOVES ALL STATIC DATA)
   ========================================================================== */

function renderTimetablePeriods(periods) {
  const grid = document.getElementById('timetableHorizontalGrid');
  if (!grid) return;
  if (!periods || periods.length === 0) {
    grid.innerHTML = '<div class="timetable-period" style="grid-column: 1 / -1; text-align: center; padding: 24px; color: #64748B;">No periods scheduled for this day.</div>';
    return;
  }

  let html = '';
  periods.forEach(p => {
    const isCompleted = Boolean(p.isCompleted || p.is_completed);
    const isActiveNow = Boolean(p.isActiveNow || p.is_active_now);
    const isCritical = Boolean(p.isCritical || p.is_critical);
    const isQuiz = Boolean(p.is_assessment || p.type === 'quiz' || (p.code && p.code.toLowerCase().includes('quiz')) || (p.num && p.num.includes('QUIZ')));

    let cardClass = 'timetable-period';
    if (isQuiz) cardClass += ' quiz-period-card';
    if (isCompleted) cardClass += ' completed';
    if (isActiveNow) cardClass += ' active-now';
    if (isCritical && !isQuiz) cardClass += ' upcoming critical-period';
    else if (!isCompleted && !isActiveNow) cardClass += ' upcoming';

    let slotClass = 'period-slot-badge';
    if (isQuiz) slotClass += ' slot-quiz';
    else if (isActiveNow) slotClass += ' slot-live';
    else if (isCritical) slotClass += ' slot-critical';

    const num = p.num || (p.period_num ? `Period ${p.period_num}` : `Period ${p.periodNumber || 1}`);
    const status = p.status || (isCompleted ? 'Completed ✓' : isActiveNow ? 'Live Now' : 'Scheduled');
    const statusClass = isQuiz ? 'status-quiz-tag' : (p.statusClass || p.status_class || (isCompleted ? 'status-done' : isActiveNow ? 'status-live' : 'status-upcoming'));
    const time = p.time || p.period_time || `${p.startTime || '09:00'} - ${p.endTime || '10:00'}`;
    const name = p.name || p.course_name || p.subjectName || p.subject_name || p.code || 'Course Period';
    const venue = p.venue || `${p.classroom || 'LH-204'} • ${p.teacher_name || p.teacher || 'Faculty'}`;
    const att = p.att || p.att_label || (isCompleted ? 'Attendance: Present' : isCritical ? 'Critical for 75%' : isActiveNow ? 'Live in Session' : 'Scheduled');
    const quizLink = p.link || 'student-quiz.html';

    html += `
      <div class="${cardClass}" ${isQuiz ? `onclick="window.location.href='${quizLink}'" style="cursor:pointer; border-color: rgba(225, 29, 72, 0.4); background: linear-gradient(135deg, rgba(225,29,72,0.04) 0%, rgba(255,255,255,0.98) 100%);"` : ''}>
        <div class="period-top-row">
          <div class="${slotClass}">${num}</div>
          <span class="period-status-tag ${statusClass}">${status}</span>
        </div>
        <div class="period-time">
          <span class="time-main ${isActiveNow ? 'text-primary' : ''}">${time}</span>
        </div>
        <div class="period-course ${isQuiz ? 'text-danger' : (isActiveNow ? 'text-primary' : '')}" style="${isQuiz ? 'font-weight:700;' : ''}">${name}</div>
        <div class="period-meta">${venue}</div>
        <div class="period-att-status ${isQuiz ? 'text-danger' : (isCritical ? 'text-warning' : isActiveNow ? 'text-accent' : isCompleted ? 'text-success' : 'text-muted')}">
          ${isQuiz ? `🎯 Click to Open Quiz Portal →` : att}
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

function renderSubjectWiseAttendance(subjects) {
  const container = document.getElementById('subjectAttendanceList');
  const countBadge = document.getElementById('toggleSubjectAttBadge');
  if (!container) return;

  if (!subjects || subjects.length === 0) {
    container.innerHTML = '<div style="padding:16px; text-align:center; color:#64748B;">No registered courses found.</div>';
    return;
  }

  if (countBadge) {
    countBadge.textContent = `${subjects.length} Subjects ▼`;
  }

  let html = '';
  subjects.forEach(sub => {
    const code = sub.code || sub.subjectCode || sub.subject_code || 'SUB-101';
    const name = sub.name || sub.subjectName || sub.subject_name || 'Course';
    const attended = sub.attended !== undefined ? sub.attended : (sub.present_periods !== undefined ? sub.present_periods : (sub.attendedLectures || 0));
    const total = sub.total !== undefined ? sub.total : (sub.total_periods !== undefined ? sub.total_periods : (sub.totalLectures || 0));
    const pct = sub.percentage !== undefined ? Math.round(sub.percentage) : (total > 0 ? Math.round((attended / total) * 100) : 0);
    
    const isWarning = pct < 75;
    const isHigh = pct >= 85;
    const badgeClass = isWarning ? 'pct-warning' : (isHigh ? 'pct-high' : 'pct-safe');
    const barClass = isWarning ? 'bg-warning' : (isHigh ? 'bg-accent' : 'bg-primary');
    const itemClass = isWarning ? 'subject-row-item warning-subject-item' : 'subject-row-item';

    html += `
      <div class="${itemClass}">
        <div class="subject-info-head">
          <div class="sub-name-group">
            <span class="sub-code ${isWarning ? 'code-warning' : ''}">${code}</span>
            <h5 class="sub-name">${name}</h5>
            ${isWarning ? '<span class="shortage-badge">Low Attendance</span>' : ''}
          </div>
          <div class="sub-stats-group">
            <span class="sub-lectures-count">${attended} / ${total} lectures</span>
            <span class="sub-pct-badge ${badgeClass}">${pct}%</span>
          </div>
        </div>
        <div class="sub-progress-track">
          <div class="sub-progress-bar ${barClass}" style="width: ${pct}%;" aria-valuenow="${pct}"></div>
        </div>
        ${isWarning ? `
          <div class="subject-warning-alert">
            <svg class="alert-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            <span>Attendance below threshold (${pct}% &lt; 75%). Attend upcoming lectures to regain exam eligibility.</span>
          </div>
        ` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderNotifications(notifs) {
  const badge = document.getElementById('topNotifBadge');
  const tag = document.getElementById('topUnreadTag');
  const list = document.getElementById('topNotifList');
  if (!list) return;

  if (!notifs || notifs.length === 0) {
    if (badge) badge.style.display = 'none';
    if (tag) tag.textContent = '0 New';
    list.innerHTML = '<li class="notif-item"><div class="notif-info"><p class="notif-msg">No unread notifications.</p><span class="notif-time">All caught up</span></div></li>';
    return;
  }

  const unreadCount = notifs.filter(n => !n.isRead && !n.is_read).length;
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? '' : 'none';
  }
  if (tag) {
    tag.textContent = `${unreadCount} New`;
  }

  let html = '';
  notifs.forEach(n => {
    const isUnread = !(n.isRead || n.is_read);
    const isQuiz = (n.type && n.type.toLowerCase().includes('quiz')) || (n.title && n.title.toLowerCase().includes('quiz'));
    const bulletBg = isQuiz ? 'bg-danger' : (n.severity === 'error' || n.category === 'ATTENDANCE' ? 'bg-warning' : (n.category === 'EXAM' ? 'bg-error' : 'bg-success'));
    const timeFormatted = n.created_at || n.createdAt ? new Date(n.created_at || n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';
    const category = isQuiz ? 'Online Quiz Portal' : (n.category || 'Academic Cell');

    html += `
      <li class="notif-item ${isUnread ? 'unread' : ''}" data-id="${n.id}" ${isQuiz ? `onclick="window.location.href='student-quiz.html'"` : ''} style="${isQuiz ? 'cursor: pointer; background: rgba(225,29,72,0.03);' : ''}">
        <span class="notif-bullet ${bulletBg}" style="${isQuiz ? 'background: #E11D48 !important;' : ''}"></span>
        <div class="notif-info">
          <p class="notif-msg" style="${isQuiz ? 'font-weight: 600; color: #1E293B;' : ''}">${n.message || n.title}</p>
          <span class="notif-time">${timeFormatted} • <strong style="${isQuiz ? 'color: #E11D48;' : ''}">${category}</strong></span>
        </div>
      </li>
    `;
  });
  list.innerHTML = html;
}

async function hydrateSyllabusAnalytics() {
  try {
    let syllabusList = [];
    if (typeof StudentApi !== 'undefined' && typeof StudentApi.getSyllabus === 'function') {
      try {
        const res = await StudentApi.getSyllabus();
        if (res && res.data && res.data.length > 0) {
          syllabusList = res.data;
        }
      } catch (err) {
        console.warn('StudentApi.getSyllabus error, using institutional defaults:', err);
      }
    }

    if (!syllabusList) {
      syllabusList = [];
    }


    const subjects = syllabusList.map(s => {
      const code = s.subject_code || s.subjectCode || s.code || 'Course';
      const name = s.subject_name || s.subjectName || s.name || '';
      if (name.includes('Data Struct')) return 'Data Struct.';
      if (name.includes('Java')) return 'Java Prog.';
      if (name.includes('Operating')) return 'Operating Sys.';
      if (name.includes('Database')) return 'Database Mgmt';
      if (name.includes('Networks')) return 'Comp. Networks';
      return code;
    });

    const progressData = syllabusList.map(s => {
      const p = s.syllabus_progress !== undefined ? s.syllabus_progress : (s.syllabusProgress !== undefined ? s.syllabusProgress : (s.progress || 75));
      return Number(p);
    });

    renderSyllabusChart(subjects, progressData);

    const totalPct = progressData.reduce((a, b) => a + b, 0);
    const avgPct = Math.round(totalPct / (progressData.length || 1));
    const avgBadge = document.getElementById('syllabusAvgPct');
    if (avgBadge) avgBadge.textContent = `${avgPct}% Average`;

    const summaryVal = document.getElementById('syllabusUnitsSummary');
    if (summaryVal) {
      const totalUnits = syllabusList.length * 5;
      const completedUnits = (totalUnits * (avgPct / 100)).toFixed(1);
      summaryVal.textContent = `${completedUnits} / ${totalUnits} Units`;
    }

    const footerGrid = document.getElementById('syllabusUnitsFooterGrid');
    if (footerGrid) {
      let pillsHtml = '';
      syllabusList.forEach(s => {
        const code = s.subject_code || s.subjectCode || s.code || 'CS-301';
        const prog = s.syllabus_progress !== undefined ? s.syllabus_progress : (s.syllabusProgress !== undefined ? s.syllabusProgress : (s.progress || 75));
        const units = (5 * (Number(prog) / 100)).toFixed(1);
        const fullName = s.subject_name || s.subjectName || s.name || code;
        pillsHtml += `
          <div class="s-unit-pill" title="${fullName}">
            <span class="sup-code">${code}</span>
            <strong class="sup-val text-primary">${prog}%</strong>
            <span class="sup-units">${units} / 5 Units</span>
          </div>
        `;
      });
      footerGrid.innerHTML = pillsHtml;
    }
  } catch (e) {
    console.warn('Error hydrating syllabus analytics:', e);
  }
}

async function hydrateDashboardData() {
  try {
    let overview = null;
    if (typeof StudentApi !== 'undefined' && typeof StudentApi.getOverview === 'function') {
      try {
        const res = await StudentApi.getOverview();
        if (res && res.data) {
          overview = res.data;
        }
      } catch (e) {
        console.warn('StudentApi overview fetch failed, attempting fallback...', e);
      }
    }

    if (!overview && typeof StudentSupabase !== 'undefined' && typeof StudentSupabase.getDashboardOverview === 'function') {
      try {
        const res = await StudentSupabase.getDashboardOverview();
        if (res && res.data) {
          overview = res.data;
        }
      } catch (e) {
        console.warn('StudentSupabase overview fetch failed:', e);
      }
    }

    if (!overview) {
      console.warn('No dynamic overview source reached; retaining local view');
      return;
    }

    window.__currentStudentOverview = overview;
    // Update Live Connection Badge in Top Header
    const statusBadge = document.getElementById('liveBackendStatusBadge');
    const statusText = document.getElementById('liveStatusText');
    const statusDot = document.getElementById('liveStatusDot');
    if (statusText) {
      const source = overview.systemStatus?.dataSource || 'SSGMCE Live Database';
      statusText.textContent = 'Backend & DB Online';
      if (statusDot) statusDot.style.background = '#10B981';
      if (statusBadge) {
        statusBadge.style.background = 'rgba(16, 185, 129, 0.12)';
        statusBadge.style.color = '#059669';
        statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        statusBadge.onclick = () => {
          showToast(`Live Connection Active • Source: ${source} (FastAPI :8000)`, 'success');
        };
      }
    }

    // 1. Student Identity
    const s = overview.student || {};
    const fullName = s.fullName || s.full_name || 'Shivam Sanjay Aghao';
    const rollNo = s.rollNo || s.roll_no || 21;
    const studentCode = s.studentCode || s.student_code || s.prn || '308637';
    const dept = s.department || 'Computer Science & Engineering';
    const div = s.division || '2R1';
    const cls = s.className || s.class_name || '2R1';
    const sem = s.semester || s.current_semester || 4;
    const yr = s.academicYear || '2026-2027';

    const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SA';
    const topAvatar = document.getElementById('topAvatarInitials');
    const topName = document.getElementById('topStudentName');
    const topMeta = document.getElementById('topStudentMeta');
    const dropAvatar = document.getElementById('dropdownAvatarInitials');
    const dropName = document.getElementById('dropdownStudentName');
    const dropDept = document.getElementById('dropdownStudentDept');
    const dropRoll = document.getElementById('dropdownStudentRoll');
    const heroTitle = document.getElementById('heroGreetingTitle');
    const heroDept = document.getElementById('heroDeptTitle');
    const heroYearSem = document.getElementById('heroYearSemRoll');
    const heroAcadBadge = document.getElementById('heroAcadYearSem');

    if (topAvatar) topAvatar.textContent = initials;
    if (topName) topName.textContent = fullName;
    if (topMeta) topMeta.textContent = `Roll: ${rollNo} • CSE ${div}`;

    if (dropAvatar) dropAvatar.textContent = initials;
    if (dropName) dropName.textContent = fullName;
    if (dropDept) dropDept.textContent = `B.Tech - ${dept}`;
    if (dropRoll) dropRoll.textContent = `Roll No: ${rollNo} • Class: ${cls} • Sem ${sem} (${studentCode})`;

    if (heroTitle) {
      const firstName = fullName.split(' ')[0] || 'Student';
      heroTitle.textContent = `Welcome back, ${firstName}!`;
    }
    if (heroDept) heroDept.textContent = dept.includes('Computer') ? dept : 'Computer Science & Engineering';
    if (heroYearSem) {
      heroYearSem.textContent = `Year ${Math.ceil(Number(sem) / 2)} (Semester ${sem}) • Class: ${cls} • Roll No: ${rollNo} (${studentCode})`;
    }
    if (heroAcadBadge) {
      heroAcadBadge.textContent = `Class ${cls} • Semester ${sem} • Academic Year ${yr}`;
    }

    // 2. Notifications
    if (overview.recentNotifications) {
      renderNotifications(overview.recentNotifications);
    }

    // 3. Attendance
    const att = overview.attendanceSummary || {};
    const overallPct = Math.round(att.overallPercentage !== undefined ? att.overallPercentage : (overview.metrics?.overallAttendancePct || 82));
    const absentPct = 100 - overallPct;
    const attendedCount = att.attendedLectures !== undefined ? att.attendedLectures : 157;
    const absentCount = att.absentLectures !== undefined ? att.absentLectures : 34;

    const centerPct = document.getElementById('overallAttCenterPct');
    const presentPctEl = document.getElementById('overallAttPresentPct');
    const presentCountEl = document.getElementById('overallAttPresentCount');
    const absentPctEl = document.getElementById('overallAttAbsentPct');
    const absentCountEl = document.getElementById('overallAttAbsentCount');
    const sbAttBadge = document.getElementById('sidebarAttendanceBadge');
    const dropAttPct = document.getElementById('dropdownAttPct');
    const threshText = document.getElementById('attThresholdText');

    if (centerPct) centerPct.textContent = `${overallPct}%`;
    if (presentPctEl) presentPctEl.textContent = `${overallPct}%`;
    if (presentCountEl) presentCountEl.textContent = `(${attendedCount} Lectures)`;
    if (absentPctEl) absentPctEl.textContent = `${absentPct}%`;
    if (absentCountEl) absentCountEl.textContent = `(${absentCount} Lectures)`;
    if (sbAttBadge) sbAttBadge.textContent = `${overallPct}%`;
    if (dropAttPct) dropAttPct.textContent = `${overallPct}%`;

    if (threshText) {
      if (overallPct >= 75) {
        const diff = overallPct - 75;
        threshText.innerHTML = `Your overall attendance is currently <strong>${diff}% above</strong> the autonomous institutional requirement.`;
      } else {
        const diff = 75 - overallPct;
        threshText.innerHTML = `<span class="text-warning"><strong>Attendance Deficit (${overallPct}% &lt; 75%)</strong>: You need to attend upcoming lectures to clear eligibility threshold.</span>`;
      }
    }

    renderAttendanceChart(overallPct, absentPct, attendedCount, absentCount);

    if (att.subjectWise && att.subjectWise.length > 0) {
      renderSubjectWiseAttendance(att.subjectWise);
    }

    // 4. Timetable
    if (overview.todayTimetable && overview.todayTimetable.length > 0) {
      renderTimetablePeriods(overview.todayTimetable);
      const scheduleDayBadge = document.getElementById('scheduleDayBadge');
      if (scheduleDayBadge) {
        const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        scheduleDayBadge.textContent = `${todayDay} • ${overview.todayTimetable.length} Periods Scheduled`;
      }
    }

    // 5. Syllabus Progress
    hydrateSyllabusAnalytics();

    // 6. Quizzes Notification Pill on Sidebar
    try {
      const qRes = await fetch(`/api/v1/student/quizzes?student_code=${studentCode}`);
      if (qRes.ok) {
        const qData = await qRes.json();
        const quizzes = (qData && qData.data) ? qData.data : [];
        const unattempted = quizzes.filter(q => !q.attempt_status || !['submitted', 'auto_submitted', 'SUBMITTED'].includes(q.attempt_status));
        const sbQuizBadge = document.getElementById('sidebarQuizBadge');
        if (sbQuizBadge) {
          if (unattempted.length > 0) {
            sbQuizBadge.textContent = `${unattempted.length} New`;
            sbQuizBadge.style.background = '#E11D48';
            sbQuizBadge.style.color = '#FFFFFF';
            sbQuizBadge.style.boxShadow = '0 0 10px rgba(225, 29, 72, 0.45)';
          } else if (quizzes.length > 0) {
            sbQuizBadge.textContent = 'Active';
            sbQuizBadge.style.background = '#10B981';
            sbQuizBadge.style.color = '#FFFFFF';
            sbQuizBadge.style.boxShadow = 'none';
          } else {
            sbQuizBadge.textContent = 'None';
            sbQuizBadge.style.background = '#64748B';
            sbQuizBadge.style.color = '#FFFFFF';
            sbQuizBadge.style.boxShadow = 'none';
          }
        }
      }
    } catch (qErr) {
      console.warn('Could not update sidebar quiz badge:', qErr);
    }

  } catch (err) {
    console.error('Error during dashboard dynamic hydration:', err);
  }
}
