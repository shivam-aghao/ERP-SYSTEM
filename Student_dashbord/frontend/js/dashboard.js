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
  initToastSystem();
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
              backgroundColor: ['#00A6D6', '#E2E8F0'], // Accent cyan & slate
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
      barGradient.addColorStop(0, '#00A6D6'); // Bright cyan accent at top
      barGradient.addColorStop(1, '#0B5CAD'); // Deep blue primary at bottom

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

  // Click handler on the button
  btnToggle.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSubjectAttendance();
  });

  // Sidebar Attendance link handler
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

  // Check URL hash on page load (#attendance or #attendanceCard)
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
   4b. SIDEBAR INTERACTIVE MODULE LINKS & FEEDBACK
   ========================================================================== */
function initSidebarLinks() {
  const sidebar = document.getElementById('dashboardSidebar');
  if (!sidebar) return;

  const moduleMessages = {
    'dashboard': 'Navigating to Student Dashboard...',
    'attendance': 'Displaying Semester IV Subject-wise Attendance Breakdown...',
    'syllabus': 'Displaying Semester IV Syllabus & Subject Progress...',
    'fees': 'Accessing Student Accounts & Academic Fees Portal...',
    'profile': 'Opening Shivam Aghao - Verified Student Profile...',
    'elearning': 'Connecting to SSGMCE E-Learning & LMS...',
    'change-info': 'Opening Student Change of Information Application...',
    'update-info': 'Opening Student Information Verification & Updation Form...',
    'dwallet': 'Opening SSGMCE D-Wallet (Digital Credentials & Balance)...',
    'examination': 'Accessing Examination Cell, Hall Ticket & Exam Timetable...',
    'course-choices': 'Opening Autonomous Course Choices Application Form...',
    'internal-marks': 'Loading Semester IV Continuous Internal Evaluation (CIE) Marks...',
    'documents': 'Accessing Student Documents Repository & Certificates...',
    'hostel': 'Connecting to Campus Hostel Management...',
    'library': 'Connecting to Central Digital Library & OPAC...',
    'training': 'Opening Training & Placement Cell Portal...',
    'grievance': 'Opening Student Grievance Redressal Cell...',
    'settings': 'Opening Portal Account Preferences & Settings...'
  };

  const navLinks = sidebar.querySelectorAll('.sidebar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const navKey = link.getAttribute('data-nav');
      const href = link.getAttribute('href');
      const parentItem = link.closest('.sidebar-item');
      const hasDropdown = parentItem && (parentItem.classList.contains('has-dropdown') || parentItem.classList.contains('has-submenu'));

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      if (hasDropdown) {
        e.preventDefault();
        const willExpand = !parentItem.classList.contains('expanded');
        
        // Accordion behavior: close other open dropdowns
        if (willExpand) {
          sidebar.querySelectorAll('.sidebar-item.has-dropdown.expanded, .sidebar-item.has-submenu.expanded').forEach(otherItem => {
            if (otherItem !== parentItem) {
              otherItem.classList.remove('expanded');
            }
          });
        }
        parentItem.classList.toggle('expanded', willExpand);

        // Smooth scroll to card if an on-page section exists
        if (href && href.startsWith('#') && href !== '#') {
          const targetCard = document.querySelector(href);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetCard.classList.add('card-highlight-pulse');
            setTimeout(() => targetCard.classList.remove('card-highlight-pulse'), 1500);
          }
        }

        // Also open syllabus module directly if syllabus sidebar item is clicked
        const modKey = parentItem.getAttribute('data-module');
        if (modKey === 'syllabus') {
          openStudentModule('syllabus', 'subject');
        }
        return;
      }

      if (href && href.startsWith('#')) {
        const targetCard = document.querySelector(href);
        if (targetCard) {
          e.preventDefault();
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          targetCard.classList.add('card-highlight-pulse');
          setTimeout(() => targetCard.classList.remove('card-highlight-pulse'), 1500);
        } else if (moduleMessages[navKey]) {
          showToast(moduleMessages[navKey], 'info');
        }
      }
    });
  });

  // Clicking any sub-tab link in the sidebar dropdown
  const subtabLinks = sidebar.querySelectorAll('.dropdown-subtab-link, .submenu-link');
  subtabLinks.forEach(subLink => {
    subLink.addEventListener('click', (e) => {
      const moduleKey = subLink.getAttribute('data-module');
      const subtabKey = subLink.getAttribute('data-subtab');
      const href = subLink.getAttribute('href');

      if (moduleKey && subtabKey) {
        e.preventDefault();
        subtabLinks.forEach(s => s.classList.remove('active'));
        subLink.classList.add('active');
        openStudentModule(moduleKey, subtabKey);

        // Close mobile drawer if open
        if (window.innerWidth <= 768) {
          const backdrop = document.getElementById('sidebarBackdrop');
          if (sidebar.classList.contains('drawer-open')) {
            sidebar.classList.remove('drawer-open');
            if (backdrop) backdrop.classList.remove('active');
            document.body.style.overflow = '';
          }
        }
      } else if (href && href.endsWith('.html')) {
        window.location.href = href;
      }
    });
  });
}

/* ==========================================================================
   5. HEADER DROPDOWNS (NOTIFICATIONS & PROFILE)
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
      showToast('Signing out from SSGMCE ERP Portal...', 'warning');
      setTimeout(() => {
        showToast('Logged out successfully.', 'info');
      }, 1200);
    });
  }
}

/* ==========================================================================
   6. GLOBAL SEARCH SYSTEM
   ========================================================================== */
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  if (!searchInput) return;

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      showToast('Search SSGMCE ERP: Start typing...', 'info');
    }
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    // Filter quick access tiles
    const tiles = document.querySelectorAll('.qa-tile-btn');
    tiles.forEach(tile => {
      const label = tile.querySelector('.qa-tile-label').textContent.toLowerCase();
      tile.style.display = (!query || label.includes(query)) ? '' : 'none';
    });

    // Filter timetable periods
    const periods = document.querySelectorAll('.timetable-period');
    periods.forEach(p => {
      const course = p.querySelector('.period-course').textContent.toLowerCase();
      p.style.display = (!query || course.includes(query)) ? '' : 'none';
    });
  });
}

/* ==========================================================================
   7. QUICK ACCESS TILES
   ========================================================================== */
function initQuickAccessTiles() {
  const tiles = document.querySelectorAll('.qa-tile-btn');
  const actionMessages = {
    'timetable': 'Opening Semester IV Academic Time Table (CSE)...',
    'exam-form': 'Redirecting to Autonomous Exam Form Portal...',
    'result': 'Fetching Semester III Autonomous Grade Card...',
    'bonafide': 'Generating Bonafide Certificate request...',
    'hostel-app': 'Opening SSGMCE Campus Hostel Portal...',
    'library-portal': 'Connecting to Central Digital Library & OPAC...',
    'training-placement': 'Opening Training & Placement Cell Dashboard...',
    'more-services': 'Loading Student Academic Services Directory...'
  };

  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const action = tile.getAttribute('data-action');
      const message = actionMessages[action] || 'Opening service...';
      
      tile.style.transform = 'scale(0.96)';
      setTimeout(() => {
        tile.style.transform = '';
      }, 150);

      showToast(message, 'info');
    });
  });
}

/* ==========================================================================
   8. QUICK ACTION STRIP (HALL TICKET & STUDENT ID)
   ========================================================================== */
function initQuickActionStrip() {
  const actionBtns = document.querySelectorAll('.btn-strip-action');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'hall-ticket') {
        showToast('Generating Mid-Term Examination Digital Hall Ticket...', 'success');
      } else if (action === 'download-id') {
        showToast('Downloading verified SSGMCE Student ID Card...', 'info');
      }
    });
  });
}

/* ==========================================================================
   9. TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function initToastSystem() {}

function showToast(message, type = 'info') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

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
   10. SSGMCE CAMPUS UNIFIED SHOWCASE & LIGHTBOX
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

/* ==========================================================================
   11. CAMPUS HIGH-RES LIGHTBOX MODAL
   ========================================================================== */
function openCampusLightbox() {
  const modal = document.getElementById('campusLightboxModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
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

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCampusLightbox);
  }
  if (overlay) {
    overlay.addEventListener('click', closeCampusLightbox);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeCampusLightbox();
    }
  });
}


/* ==========================================================================
   13. TIMETABLE DAY SWITCHER TABS (MONDAY - SATURDAY FULL SCHEDULE)
   ========================================================================== */
const timetableScheduleData = {
  monday: {
    dayLabel: 'Monday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-303', name: 'Operating Systems', venue: 'LH-301 • Prof. V. K. Ramanujan', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-301', name: 'Data Structures & Algorithms', venue: 'LH-204 • Prof. R. Sharma', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-304', name: 'Database Management Systems', venue: 'LH-112 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 4', time: '01:30 PM - 02:30 PM', code: 'CS-305', name: 'Computer Networks', venue: 'LH-108 • Dr. Ananya Sen', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 5', time: '02:45 PM - 04:45 PM', code: 'CS-301L', name: 'DSA Lab (Batch 2R1)', venue: 'Software Lab 2 • Prof. R. Sharma', status: 'Completed ✓', statusClass: 'status-done', att: 'Practical Present' }
    ]
  },
  tuesday: {
    dayLabel: 'Tuesday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-302', name: 'Java Programming & OOP', venue: 'LH-201 • Dr. S. Kulkarni', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-305', name: 'Computer Networks', venue: 'LH-108 • Dr. Ananya Sen', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-301', name: 'Data Structures', venue: 'LH-204 • Prof. R. Sharma', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 4', time: '01:30 PM - 03:30 PM', code: 'CS-302L', name: 'Java Lab (Batch 2R1)', venue: 'Advanced Systems Lab 3 • Dr. S. Kulkarni', status: 'Completed ✓', statusClass: 'status-done', att: 'Practical Present' },
      { num: 'Period 5', time: '03:45 PM - 04:45 PM', code: 'CS-304', name: 'Database Management Tutorial', venue: 'LH-112 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Tutorial Active' }
    ]
  },
  wednesday: {
    dayLabel: 'Wednesday • 5 Periods Scheduled',
    periods: [
      { num: 'Period 1', time: '09:00 AM - 10:00 AM', code: 'CS-304', name: 'Database Management Systems', venue: 'LH-112 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 2', time: '10:15 AM - 11:15 AM', code: 'CS-303', name: 'Operating Systems', venue: 'LH-301 • Prof. V. K. Ramanujan', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 3', time: '11:30 AM - 12:30 PM', code: 'CS-302', name: 'Java Programming', venue: 'LH-201 • Dr. S. Kulkarni', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 4', time: '01:30 PM - 02:30 PM', code: 'CS-305', name: 'Computer Networks', venue: 'LH-108 • Dr. Ananya Sen', status: 'Completed ✓', statusClass: 'status-done', att: 'Attendance: Present' },
      { num: 'Period 5', time: '02:45 PM - 04:45 PM', code: 'CS-304L', name: 'DBMS Lab (Batch 2R1)', venue: 'Database Lab 1 • Dr. P. Deshmukh', status: 'Completed ✓', statusClass: 'status-done', att: 'Practical Present' }
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
   14. STUDENT MODULE MODAL MANAGEMENT
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
      { key: 'cie1', label: 'CIE Test 1' }
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

  // Update modal header dropdown menu with all tabs
  const dropdownMenu = document.getElementById('modalTabDropdownMenu');
  const dropdownLabel = document.getElementById('modalTabDropdownLabel');
  if (dropdownLabel) dropdownLabel.textContent = (cfg.title.split(' ')[0] || 'All Tabs') + ' ▾';
  if (dropdownMenu) {
    let dropHtml = '';
    Object.keys(studentModuleConfig).forEach(k => {
      const isCur = k === moduleKey;
      dropHtml += `<button type="button" class="modal-tab-dropdown-item ${isCur ? 'active' : ''}" onclick="openStudentModule('${k}'); toggleModalTabDropdown(event);">${studentModuleConfig[k].title}</button>`;
    });
    dropdownMenu.innerHTML = dropHtml;
  }

  // Show corresponding module pane wrapper (.module-content-pane or .module-pane-wrapper)
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
      const isMatch = pill.getAttribute('data-subtab') === subtabKey;
      pill.classList.toggle('active', isMatch);
      pill.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  if (!activeModuleKey) {
    activeModuleKey = 'syllabus';
  }

  let activeWrapper = document.querySelector(`.module-content-pane[data-module="${activeModuleKey}"], .module-pane-wrapper[data-module="${activeModuleKey}"]`);
  if (!activeWrapper) {
    activeWrapper = document.querySelector('.module-content-pane[data-module="syllabus"]');
  }

  if (activeWrapper) {
    activeWrapper.querySelectorAll('.subtab-pane').forEach(pane => {
      const isThisSub = pane.getAttribute('data-subpane') === subtabKey;
      pane.style.display = isThisSub ? 'block' : 'none';
      pane.classList.toggle('active', isThisSub);
    });
  }

  // Trigger dynamic database-driven data loading for Syllabus
  if (activeModuleKey === 'syllabus') {
    if (subtabKey === 'subject') {
      if (typeof window.loadDynamicSubjects === 'function') window.loadDynamicSubjects();
    } else if (subtabKey === 'faculty') {
      if (typeof window.loadDynamicFaculty === 'function') window.loadDynamicFaculty();
    } else if (subtabKey === 'university-syllabus') {
      const sel = document.getElementById('dashSyllabusSubjectSelect');
      const code = sel ? sel.value : null;
      if (typeof window.loadDynamicUniversitySyllabus === 'function') {
        window.loadDynamicUniversitySyllabus(code);
      } else if (typeof window.renderDashSubjectUnits === 'function') {
        window.renderDashSubjectUnits(code || '5IT220PC');
      }
    }
  }
}

function toggleModalTabDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('modalTabDropdownMenu');
  if (menu) menu.classList.toggle('show');
}

document.addEventListener('click', () => {
  const menu = document.getElementById('modalTabDropdownMenu');
  if (menu) menu.classList.remove('show');
});

function handleOnlinePayment() {
  const amount = document.getElementById('customPayAmount')?.value || '24,700';
  showToast(`Initiating BillDesk secure transaction for ₹${amount}...`, 'info');
  setTimeout(() => {
    showToast(`Payment Successful! Transaction Reference: TXN-SSG-${Math.floor(100000 + Math.random() * 900000)}`, 'success');
  }, 1200);
}

function calculateRevalFee() {
  const checks = document.querySelectorAll('input[name="revalSubject"]:checked');
  const count = checks.length;
  const total = count * 300;
  const countElem = document.getElementById('revalSubjectCount');
  const totalElem = document.getElementById('revalFeeTotal');
  if (countElem) countElem.textContent = count;
  if (totalElem) totalElem.textContent = '₹' + total;
}

function handleRevaluationSubmit() {
  const checks = document.querySelectorAll('input[name="revalSubject"]:checked');
  if (!checks.length) {
    showToast('Please select at least 1 subject for revaluation.', 'warning');
    return;
  }
  showToast(`Revaluation application submitted for ${checks.length} subject(s). Dean evaluation in progress.`, 'success');
  setTimeout(() => {
    closeStudentModule();
  }, 1500);
}

function handleDWalletUpload() {
  const type = document.getElementById('dwalletDocType')?.value || 'Document';
  showToast(`Uploading ${type} to secure cloud vault...`, 'info');
  setTimeout(() => {
    showToast(`${type} successfully verified and saved to D-Wallet.`, 'success');
  }, 1000);
}

function handlePhotoUploadPreview(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const container = document.getElementById('studentPhotoPreview');
      if (container) {
        container.innerHTML = `<img src="${e.target.result}" alt="Student New Photo">`;
      }
      showToast('Photo selected! Click "Save & Update ID Photo" to apply.', 'info');
    };
    reader.readAsDataURL(input.files[0]);
  }
}


// Merge extra data
Object.assign(syllabusData, extraSyllabusData);

/* ==========================================================================
   DYNAMIC BACKEND SYLLABUS CONTROLLER & SUPABASE INTEGRATION
   ========================================================================== */

const SYLLABUS_API_BASE = 'http://127.0.0.1:8000/api/syllabus';
let cachedSubjects = [];
let cachedFaculty = [];
let isSubjectsLoading = false;
let isFacultyLoading = false;

// Extract authenticated student details
function getStudentAuthContext() {
  let loginData = null;
  try {
    const raw = localStorage.getItem('loginData') || sessionStorage.getItem('loginData');
    if (raw) loginData = JSON.parse(raw);
  } catch (e) {
    console.warn('[SYLLABUS] Could not parse loginData:', e);
  }

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || loginData?.access_token || '';
  const user = loginData?.user || {};

  let department = 'IT';
  const branchStr = (user.branch || '').toUpperCase();
  if (branchStr.includes('COMPUTER') || branchStr.includes('CSE')) {
    department = 'CSE';
  } else if (branchStr.includes('INFORMATION') || branchStr.includes('IT')) {
    department = 'IT';
  }

  const semester = user.semester || 'Semester V';
  return { token, user, department, semester };
}

// 1. Fetch Subjects from Backend API
async function fetchSyllabusSubjects(dept, sem) {
  const auth = getStudentAuthContext();
  const d = dept || auth.department;
  const s = sem || auth.semester;
  let url = `${SYLLABUS_API_BASE}/subjects`;
  const params = [];
  if (d && d !== 'all') params.push(`department=${encodeURIComponent(d)}`);
  if (s && s !== 'all') params.push(`semester=${encodeURIComponent(s)}`);
  if (params.length) url += `?${params.join('&')}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
      }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.subjects) {
        return json.data.subjects;
      }
    }
  } catch (err) {
    console.error('[SYLLABUS] Error fetching subjects from API:', err);
  }
  return [];
}

// 2. Fetch Faculty Directory from Backend API
async function fetchSyllabusFaculty(dept) {
  const auth = getStudentAuthContext();
  const d = dept || auth.department;
  let url = `${SYLLABUS_API_BASE}/faculty`;
  if (d && d !== 'all') url += `?department=${encodeURIComponent(d)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
      }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.faculty) {
        return json.data.faculty;
      }
    }
  } catch (err) {
    console.error('[SYLLABUS] Error fetching faculty from API:', err);
  }
  return [];
}

// 3. Fetch University Syllabus for Subject from Backend API
async function fetchUniversitySyllabus(code) {
  if (!code) return null;
  const auth = getStudentAuthContext();
  const url = `${SYLLABUS_API_BASE}/university/${encodeURIComponent(code)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
      }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.error(`[SYLLABUS] Error fetching syllabus for ${code}:`, err);
  }
  return null;
}

// 4. Load & Render Dynamic Subjects
async function loadDynamicSubjects(forceRefresh = false) {
  if (isSubjectsLoading) return;
  const tableBody = document.getElementById('dashSubjectTableBody');
  const countBadge = document.getElementById('dashSubjectCountBadge') || document.querySelector('.subtab-pane[data-subpane="subject"] .badge-status-safe');

  if (!cachedSubjects.length || forceRefresh) {
    isSubjectsLoading = true;
    if (tableBody && !cachedSubjects.length) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748B;">Connecting to database & loading courses...</td></tr>`;
    }

    const auth = getStudentAuthContext();
    let subjects = await fetchSyllabusSubjects(auth.department, auth.semester);
    if (!subjects || !subjects.length) {
      subjects = await fetchSyllabusSubjects(); // fallback to all
    }

    cachedSubjects = subjects || [];
    isSubjectsLoading = false;
  }

  renderDynamicSubjectsTable(cachedSubjects);

  if (countBadge) {
    countBadge.textContent = `${cachedSubjects.length} Courses Active`;
  }

  populateSubjectDropdown(cachedSubjects);
}

function renderDynamicSubjectsTable(subjects) {
  const tableBody = document.getElementById('dashSubjectTableBody');
  if (!tableBody) return;

  if (!subjects || !subjects.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="syllabus-empty-state">
            <h5>No subjects available for this student.</h5>
            <p>Please check your course registration or contact academic coordinator.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  subjects.forEach(sub => {
    const rawType = (sub.type || 'Core').toUpperCase();
    let badgeTypeClass = 'badge-subject-core';
    if (rawType.includes('PE')) badgeTypeClass = 'badge-subject-pe';
    else if (rawType.includes('MD')) badgeTypeClass = 'badge-subject-md';
    else if (rawType.includes('OE')) badgeTypeClass = 'badge-subject-oe';

    const progress = sub.syllabus_progress || 75;
    const progressBadge = progress >= 80 ? 'badge-cyan' : progress >= 70 ? 'badge-primary' : 'badge-warning';

    html += `
      <tr data-type="${sub.type || 'Core'}" data-code="${sub.code}">
        <td><strong>${sub.code}</strong></td>
        <td>${sub.name}</td>
        <td>${sub.credits ? Number(sub.credits).toFixed(1) : '3.0'}</td>
        <td><span class="${badgeTypeClass}">${sub.type || 'Core'}</span></td>
        <td>${sub.faculty_name || 'Department Faculty'}</td>
        <td><span class="badge ${progressBadge}">${progress}% Covered</span></td>
        <td>
          <button type="button" class="btn-view-syllabus" onclick="viewSubjectUnitsInModal('${sub.code}')">
            View Syllabus ↗
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// 5. Load & Render Dynamic Faculty
async function loadDynamicFaculty(forceRefresh = false) {
  if (isFacultyLoading) return;
  const grid = document.getElementById('dashFacultyGrid');
  const countBadge = document.getElementById('dashFacultyCountBadge') || document.querySelector('.subtab-pane[data-subpane="faculty"] .badge-status-safe');

  if (!cachedFaculty.length || forceRefresh) {
    isFacultyLoading = true;
    if (grid && !cachedFaculty.length) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 30px; color:#64748B;">Connecting to database & loading faculty directory...</div>`;
    }

    const auth = getStudentAuthContext();
    let faculty = await fetchSyllabusFaculty(auth.department);
    if (!faculty || !faculty.length) {
      faculty = await fetchSyllabusFaculty(); // fallback to all
    }

    cachedFaculty = faculty || [];
    isFacultyLoading = false;
  }

  renderDynamicFacultyGrid(cachedFaculty);

  if (countBadge) {
    countBadge.textContent = `${cachedFaculty.length} Mentors Active`;
  }
}

function renderDynamicFacultyGrid(facultyList) {
  const grid = document.getElementById('dashFacultyGrid');
  if (!grid) return;

  if (!facultyList || !facultyList.length) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1;">
        <div class="syllabus-empty-state">
          <h5>No faculty assigned yet.</h5>
          <p>Faculty details for this department are being synchronized.</p>
        </div>
      </div>
    `;
    return;
  }

  let html = '';
  facultyList.forEach(fac => {
    const names = (fac.name || 'Faculty').split(' ').filter(Boolean);
    let initials = 'FC';
    if (names.length >= 2) {
      initials = (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else if (names.length === 1) {
      initials = (names[0][0] || 'F').toUpperCase();
    }

    const email = fac.email || 'faculty@ssgmce.ac.in';
    const cabin = fac.cabin ? `• Cabin ${fac.cabin}` : '';
    const subjectInfo = fac.subjects ? `Course: ${fac.subjects} ${cabin}` : (cabin ? `Cabin: ${fac.cabin}` : '');
    const searchable = `${fac.name} ${fac.role} ${fac.department} ${fac.subjects} ${fac.cabin}`.toLowerCase();

    html += `
      <div class="faculty-contact-card" data-faculty-text="${searchable}">
        <div class="fac-avatar">${initials}</div>
        <div class="fac-details">
          <h5>${fac.name}</h5>
          <p class="fac-designation">${fac.role || 'Assistant Professor'} · Department of ${fac.department || 'Engineering'}</p>
          ${subjectInfo ? `<p class="fac-meta">${subjectInfo}</p>` : ''}
          <a href="mailto:${email}" class="fac-email-link">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            ${email}
          </a>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

// 6. Load & Render Dynamic University Syllabus
async function loadDynamicUniversitySyllabus(subjectCode) {
  const container = document.getElementById('dashSyllabusUnitContainer');
  const select = document.getElementById('dashSyllabusSubjectSelect');
  if (!container) return;

  if (!cachedSubjects || !cachedSubjects.length) {
    await loadDynamicSubjects();
  }

  const code = subjectCode || (select && select.value ? select.value : null) || (cachedSubjects[0]?.code) || 'CS-301';

  if (select && select.value !== code) {
    select.value = code;
  }

  container.innerHTML = `
    <div style="padding: 28px; text-align: center; color: #64748B;">
      <p style="margin: 0; font-weight: 600;">Loading university syllabus for <strong>${code}</strong>...</p>
    </div>
  `;

  const data = await fetchUniversitySyllabus(code);

  if (!data || !data.subject) {
    // Check fallback in local syllabusData
    const local = (typeof syllabusData !== 'undefined' && syllabusData[code]) ? syllabusData[code] : null;
    if (local) {
      renderLocalUnitsFallback(local, container);
      return;
    }

    container.innerHTML = `
      <div class="syllabus-empty-state">
        <h5>University syllabus is not available for this subject yet.</h5>
        <p>Curriculum records for <strong>${code}</strong> are currently being updated.</p>
      </div>
    `;
    return;
  }

  const sub = data.subject;
  const units = data.units || [];
  const outcomes = data.outcomes || [];
  const books = data.books || [];

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #EFF6FF; border-left: 4px solid #0B5CAD; border-radius: 8px;">
      <div>
        <h4 style="margin: 0; font-size: 1.05rem; color: #0B1F3A; font-weight: 700;">${sub.code} — ${sub.name}</h4>
        <span style="font-size: 0.82rem; color: #475569;">Course Category: <strong>${sub.type || 'Core'}</strong> &bull; Total Credits: <strong>${sub.credits || 3.0}</strong> &bull; Department: <strong>${sub.department || 'Engineering'}</strong></span>
      </div>
      <span style="background: #0B5CAD; color: #FFFFFF; font-size: 0.76rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; white-space: nowrap;">${units.length} Units Defined</span>
    </div>
  `;

  if (units.length === 0) {
    html += `
      <div class="syllabus-empty-state">
        <h5>University syllabus is not available for this subject yet.</h5>
        <p>No unit syllabus topics have been entered for <strong>${sub.code}</strong>.</p>
      </div>
    `;
  } else {
    html += `<div style="display: flex; flex-direction: column; gap: 14px;">`;
    units.forEach((unit, idx) => {
      let topicsArr = Array.isArray(unit.topics) ? unit.topics : [];
      if (typeof unit.topics === 'string') {
        try { topicsArr = JSON.parse(unit.topics); } catch (e) { topicsArr = [unit.topics]; }
      }
      const topicsList = topicsArr.map(t => `<li style="margin-bottom: 5px; color: #334155; font-size: 0.85rem;">${t}</li>`).join('');

      html += `
        <div class="unit-card-box">
          <div class="unit-card-title">
            <span>${unit.title || `Unit ${unit.unit_number || (idx + 1)}`}</span>
            <span class="unit-hours-badge">${unit.hours || 7} Teaching Hours</span>
          </div>
          <ul class="unit-topics-list">
            ${topicsList || '<li style="color:#94A3B8;">Topics in preparation.</li>'}
          </ul>
        </div>
      `;
    });
    html += `</div>`;
  }

  if (outcomes.length > 0) {
    const outcomeItems = outcomes.map(o => `<li style="margin-bottom: 4px; font-size: 0.84rem; color: #1E293B;">${o}</li>`).join('');
    html += `
      <div style="margin-top: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 18px;">
        <h5 style="margin: 0 0 8px 0; font-size: 0.9rem; font-weight: 700; color: #0F172A;">Course Outcomes (COs)</h5>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">${outcomeItems}</ul>
      </div>
    `;
  }

  if (books.length > 0) {
    const bookItems = books.map(b => `<li style="margin-bottom: 4px; font-size: 0.84rem; color: #1E293B;">${b}</li>`).join('');
    html += `
      <div style="margin-top: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 18px;">
        <h5 style="margin: 0 0 8px 0; font-size: 0.9rem; font-weight: 700; color: #0F172A;">Recommended Textbooks & References</h5>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">${bookItems}</ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderLocalUnitsFallback(data, container) {
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #EFF6FF; border-left: 4px solid #0B5CAD; border-radius: 8px;">
      <div>
        <h4 style="margin: 0; font-size: 1.05rem; color: #0B1F3A; font-weight: 700;">${data.code} — ${data.name}</h4>
        <span style="font-size: 0.82rem; color: #475569;">Course Category: <strong>${data.type || 'Core'}</strong> &bull; Total Credits: <strong>${data.credits || 3.0}</strong></span>
      </div>
      <span style="background: #0B5CAD; color: #FFFFFF; font-size: 0.76rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; white-space: nowrap;">5 Units Defined</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 14px;">
  `;
  (data.units || []).forEach(unit => {
    const topicsList = (unit.topics || []).map(t => `<li style="margin-bottom: 5px; color: #334155; font-size: 0.85rem;">${t}</li>`).join('');
    html += `
      <div class="unit-card-box">
        <div class="unit-card-title">
          <span>${unit.title}</span>
          <span class="unit-hours-badge">${unit.hours || 7} Teaching Hours</span>
        </div>
        <ul class="unit-topics-list">
          ${topicsList}
        </ul>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

function populateSubjectDropdown(subjects) {
  const select = document.getElementById('dashSyllabusSubjectSelect');
  if (!select || !subjects || !subjects.length) return;

  const currentVal = select.value;
  let optionsHtml = '';
  subjects.forEach(sub => {
    optionsHtml += `<option value="${sub.code}">${sub.code} - ${sub.name} (${sub.credits ? Number(sub.credits).toFixed(1) : '3.0'} Credits)</option>`;
  });
  select.innerHTML = optionsHtml;

  if (currentVal && subjects.some(s => s.code === currentVal)) {
    select.value = currentVal;
  } else {
    select.value = subjects[0].code;
  }
}

// 7. Filter Functions
function filterDashSubjects() {
  const query = (document.getElementById('dashSubjectSearch')?.value || '').toLowerCase().trim();
  const filterType = (document.getElementById('dashSubjectFilter')?.value || 'all').toLowerCase();
  const rows = document.querySelectorAll('#dashSubjectTableBody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const type = (row.getAttribute('data-type') || '').toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesType = filterType === 'all' || type.includes(filterType);

    row.style.display = (matchesQuery && matchesType) ? '' : 'none';
  });
}

function filterDashFaculty() {
  const query = (document.getElementById('dashFacultySearch')?.value || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.faculty-contact-card');

  cards.forEach(card => {
    const text = (card.getAttribute('data-faculty-text') || card.textContent).toLowerCase();
    const matches = !query || text.includes(query);
    card.style.display = matches ? 'flex' : 'none';
  });
}

// 8. View Units in Modal from Subject table
function viewSubjectUnitsInModal(subjectCode) {
  openStudentModule('syllabus', 'university-syllabus');
  const sel = document.getElementById('dashSyllabusSubjectSelect');
  if (sel) {
    sel.value = subjectCode;
  }
  loadDynamicUniversitySyllabus(subjectCode);
  setTimeout(() => {
    const unitBox = document.getElementById('dashSyllabusUnitContainer');
    if (unitBox) {
      unitBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}

// 9. Card Dropdown Toggle
function toggleCardTabDropdown(menuId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const menu = document.getElementById(menuId);
  if (!menu) return;
  const isShow = menu.classList.contains('show');
  document.querySelectorAll('.card-dropdown-menu.show').forEach(m => m.classList.remove('show'));
  if (!isShow) {
    menu.classList.add('show');
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.card-tab-dropdown-wrap')) {
    document.querySelectorAll('.card-dropdown-menu.show').forEach(m => m.classList.remove('show'));
  }
});

// Global scope bindings
window.openStudentModule = openStudentModule;
window.closeStudentModule = closeStudentModule;
window.switchModalSubtab = switchModalSubtab;
window.toggleModalTabDropdown = toggleModalTabDropdown;
window.toggleCardTabDropdown = toggleCardTabDropdown;
window.filterDashSubjects = filterDashSubjects;
window.filterDashFaculty = filterDashFaculty;
window.renderDashSubjectUnits = loadDynamicUniversitySyllabus;
window.loadDynamicSubjects = loadDynamicSubjects;
window.loadDynamicFaculty = loadDynamicFaculty;
window.loadDynamicUniversitySyllabus = loadDynamicUniversitySyllabus;
window.viewSubjectUnitsInModal = viewSubjectUnitsInModal;

// Auto-initialize when dashboard loads
document.addEventListener('DOMContentLoaded', () => {
  loadDynamicSubjects();
  loadDynamicFaculty();
});
