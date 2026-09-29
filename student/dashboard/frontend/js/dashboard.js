/**
 * SSGMCE Student ERP Dashboard Interactive Script
 * Shri Sant Gajanan Maharaj College of Engineering, Shegaon
 * Student: Shivam Aghao | Roll: 21 | CSE 2R1 (CSE2401)
 */

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
});

/* ==========================================================================
   1. OVERALL ATTENDANCE DOUGHNUT CHART (Chart.js + SVG Fallback)
   ========================================================================== */
function initAttendanceChart() {
  const canvas = document.getElementById('overallAttendanceChart');
  if (!canvas) return;

  const presentPercentage = 82;
  const absentPercentage = 18;

  if (typeof Chart !== 'undefined') {
    try {
      new Chart(canvas, {
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
            duration: 1200
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
                  const lectures = val === 82 ? '157 lectures' : '34 lectures';
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
  const canvas = document.getElementById('syllabusProgressBarChart');
  if (!canvas) return;

  const subjects = ['Data Struct.', 'Java Prog.', 'Operating Sys.', 'Database Mgmt', 'Comp. Networks'];
  const progressData = [82, 80, 75, 78, 65];

  if (typeof Chart !== 'undefined') {
    try {
      const ctx = canvas.getContext('2d');

      const barGradient = ctx.createLinearGradient(0, 10, 0, 200);
      barGradient.addColorStop(0, '#00A6D6');
      barGradient.addColorStop(1, '#0B5CAD');

      const hoverGradient = ctx.createLinearGradient(0, 10, 0, 200);
      hoverGradient.addColorStop(0, '#38BDF8');
      hoverGradient.addColorStop(1, '#1565C0');

      new Chart(canvas, {
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
            duration: 1200,
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

/* ==========================================================================
   3. SUBJECT ATTENDANCE TOGGLE (SHOW / HIDE 5 SUBJECTS)
   ========================================================================== */
function initSubjectAttendanceToggle() {
  const btnToggle = document.getElementById('btnToggleSubjectAtt');
  const collapsible = document.getElementById('subjectAttendanceCollapsible');
  const toggleText = document.getElementById('toggleSubjectAttText');
  const toggleBadge = document.getElementById('toggleSubjectAttBadge');
  const sidebarAttLink = document.querySelector('.sidebar-link[data-nav="attendance"]');

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

  if (sidebarAttLink) {
    sidebarAttLink.addEventListener('click', (e) => {
      const targetCard = document.getElementById('attendanceCard');
      if (targetCard) {
        e.preventDefault();
        toggleSubjectAttendance(true);
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

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

      // Check on-page scroll targets
      if (navKey === 'timetable' || href === '#timetableCard') {
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

      if (navKey === 'attendance' || href === '#attendanceCard') {
        e.preventDefault();
        const attendanceCard = document.getElementById('attendanceCard');
        if (attendanceCard) {
          attendanceCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          attendanceCard.classList.add('card-highlight-pulse');
          setTimeout(() => attendanceCard.classList.remove('card-highlight-pulse'), 1500);
          showToast("Viewing Overall & Subject Attendance", 'info');
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
        showToast('Logged out successfully.', 'info');
        if (window.ERPAuth) {
          ERPAuth.logout();
        } else {
          window.location.href = '../../login page/frontend/login.html';
        }
      }, 800);
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

/* ==========================================================================
   13. TIMETABLE DAY SWITCHER TABS (MONDAY - SATURDAY FULL SCHEDULE)
   ========================================================================== */
const timetableScheduleData = {
  monday: {
    dayLabel: 'Monday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-303', name: 'Operating Systems', venue: 'LH-301 • Prof. V. K. Ramanujan', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-301', name: 'Data Structures & Algorithms', venue: 'LH-204 • Prof. R. Sharma', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-304', name: 'Database Management Systems', venue: 'LH-112 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 4', time: '01:30 PM - 02:30 PM', code: 'CS-305', name: 'Computer Networks', venue: 'LH-108 • Dr. Ananya Sen', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 5', time: '02:45 PM - 04:45 PM', code: 'CS-301L', name: 'DSA Lab (Batch 2R1)', venue: 'Software Lab 2 • Prof. R. Sharma', status: 'Completed ✓', statusClass: 'status-done', att: 'Practical Present', isCompleted: true }
    ]
  },
  tuesday: {
    dayLabel: 'Tuesday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-302', name: 'Java Programming & OOP', venue: 'LH-201 • Dr. S. Kulkarni', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-305', name: 'Computer Networks', venue: 'LH-108 • Dr. Ananya Sen', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-301', name: 'Data Structures', venue: 'LH-204 • Prof. R. Sharma', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 4', time: '01:30 PM - 03:30 PM', code: 'CS-302L', name: 'Java Lab (Batch 2R1)', venue: 'Advanced Systems Lab 3 • Dr. S. Kulkarni', status: 'Completed ✓', statusClass: 'status-done', att: 'Practical Present', isCompleted: true },
      { num: 'Period 5', time: '03:45 PM - 04:45 PM', code: 'CS-304', name: 'Database Management Tutorial', venue: 'LH-112 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Tutorial Active', isCompleted: true }
    ]
  },
  wednesday: {
    dayLabel: 'Wednesday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-304', name: 'Database Management Systems', venue: 'LH-112 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-303', name: 'Operating Systems', venue: 'LH-301 • Prof. V. K. Ramanujan', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-302', name: 'Java Programming', venue: 'LH-201 • Dr. S. Kulkarni', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 4', time: '01:30 PM - 02:30 PM', code: 'CS-305', name: 'Computer Networks', venue: 'LH-108 • Dr. Ananya Sen', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 5', time: '02:45 PM - 04:45 PM', code: 'CS-304L', name: 'DBMS Lab (Batch 2R1)', venue: 'Database Lab 1 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Practical Present', isCompleted: true }
    ]
  },
  thursday: {
    dayLabel: 'Thursday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-301', name: 'Data Structures (CS-301)', venue: 'Lecture Hall 204 • Prof. R. Sharma', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present', isCompleted: true },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-302L', name: 'Java Programming Lab (CS-302L)', venue: 'Advanced Systems Lab 3 • Dr. S. Kulkarni', status: 'Live Now', statusClass: 'status-live', att: 'Biometric Logged In', isActiveNow: true },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-303', name: 'Operating Systems (CS-303)', venue: 'Lecture Hall 301 • Prof. V. K. Ramanujan', status: 'Next Up', statusClass: 'status-upcoming', att: 'Starts in 15 mins' },
      { num: 'Period 4', time: '01:30 PM - 02:30 PM', code: 'CS-305', name: 'Computer Networks (CS-305)', venue: 'Lecture Hall 108 • Dr. Ananya Sen', status: 'Must Attend', statusClass: 'status-critical', att: 'Critical for 75% threshold', isCritical: true },
      { num: 'Period 5', time: '02:45 PM - 03:45 PM', code: 'CS-304', name: 'Database Management (CS-304)', venue: 'Seminar Hall 1 • Tutorial Batch B', status: 'Tutorial', statusClass: 'status-upcoming', att: 'Problem Solving Session' }
    ]
  },
  friday: {
    dayLabel: 'Friday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-305', name: 'Computer Networks', venue: 'LH-108 • Dr. Ananya Sen', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Mandatory Lecture' },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-301', name: 'Data Structures', venue: 'LH-204 • Prof. R. Sharma', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Regular Lecture' },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-302', name: 'Java Programming', venue: 'LH-201 • Dr. S. Kulkarni', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Regular Lecture' },
      { num: 'Period 4', time: '01:30 PM - 03:30 PM', code: 'CS-303L', name: 'OS Linux Kernel Lab', venue: 'Systems Lab 1 • Prof. Ramanujan', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Practical Session' },
      { num: 'Period 5', time: '03:45 PM - 04:45 PM', code: 'CS-306', name: 'Mini-Project / AICTE Activity', venue: 'Project Lab 4 • Mentors', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Team Mentoring' }
    ]
  },
  saturday: {
    dayLabel: 'Saturday • 3 Periods (Half Day)',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:30 AM', code: 'SEM-01', name: 'Technical Seminar Presentations', venue: 'Seminar Hall 2 • Evaluation Committee', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Continuous Evaluation' },
      { num: 'Period 2', time: '10:45 AM - 12:15 PM', code: 'CLUB-01', name: 'Coding Club & Hackathon Practice', venue: 'Advanced Computing Lab • CSI SSGMCE', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Skill Enhancement' },
      { num: 'Period 3', time: '12:30 PM - 01:30 PM', code: 'PROCTOR', name: 'Teacher-Guardian (Proctor) Meeting', venue: 'Faculty Cabins • Designated Mentors', status: 'Scheduled', statusClass: 'status-upcoming', att: 'Mentorship Session' }
    ]
  }
};

function initTimetableDayTabs() {
  const dayTabBtns = document.querySelectorAll('.day-tab-btn');
  const badge = document.getElementById('scheduleDayBadge');
  const grid = document.getElementById('timetableHorizontalGrid');

  if (!dayTabBtns.length || !grid) return;

  dayTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dayTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const dayKey = btn.getAttribute('data-day');
      const dayData = timetableScheduleData[dayKey];
      if (!dayData) return;

      if (badge) badge.textContent = dayData.dayLabel;

      let html = '';
      dayData.periods.forEach(p => {
        let cardClass = 'timetable-period';
        if (p.isCompleted) cardClass += ' completed';
        if (p.isActiveNow) cardClass += ' active-now';
        if (p.isCritical) cardClass += ' upcoming critical-period';
        else if (!p.isCompleted && !p.isActiveNow) cardClass += ' upcoming';

        let slotClass = 'period-slot-badge';
        if (p.isActiveNow) slotClass += ' slot-live';
        if (p.isCritical) slotClass += ' slot-critical';

        html += `
          <div class="${cardClass}">
            <div class="period-top-row">
              <div class="${slotClass}">${p.num}</div>
              <span class="period-status-tag ${p.statusClass}">${p.status}</span>
            </div>
            <div class="period-time">
              <span class="time-main ${p.isActiveNow ? 'text-primary' : ''}">${p.time}</span>
            </div>
            <div class="period-course ${p.isActiveNow ? 'text-primary' : ''}">${p.name}</div>
            <div class="period-meta">${p.venue}</div>
            <div class="period-att-status ${p.isCritical ? 'text-warning' : p.isActiveNow ? 'text-accent' : p.isCompleted ? 'text-success' : 'text-muted'}">${p.att}</div>
          </div>
        `;
      });
      grid.innerHTML = html;
      showToast('Switched schedule to ' + dayData.dayLabel.split('•')[0].trim(), 'info');
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
