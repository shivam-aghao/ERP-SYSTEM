/**
 * ATTENDANCE PORTAL JAVASCRIPT
 * Apex Institute of Technology • College ERP
 * Student: Shivam Aghao (Roll No: 21, Class: 2R1, CSE - 3rd Semester)
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileDrawer();
  initFilterTabs();
  initAttendanceCalculator();
  initAttendanceSearch();
  initActionButtons();
});

/* ==========================================================================
   1. MOBILE DRAWER NAVIGATION
   ========================================================================== */
function initMobileDrawer() {
  const hamburgerBtn = document.getElementById('mobileHamburgerBtn');
  const sidebar = document.getElementById('dashboardSidebar');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (!hamburgerBtn || !sidebar) return;

  const openDrawer = () => {
    sidebar.classList.add('drawer-open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    sidebar.classList.remove('drawer-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  hamburgerBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
}

/* ==========================================================================
   2. SUBJECT CATEGORY FILTER TABS
   ========================================================================== */
function initFilterTabs() {
  const tabs = document.querySelectorAll('.att-filter-tab');
  const cards = document.querySelectorAll('.att-subject-card');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.getAttribute('data-filter');

      cards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const status = card.getAttribute('data-status');

        if (filter === 'all') {
          card.style.display = 'flex';
        } else if (filter === 'theory' && category === 'theory') {
          card.style.display = 'flex';
        } else if (filter === 'lab' && category === 'lab') {
          card.style.display = 'flex';
        } else if (filter === 'warning' && status === 'warning') {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   3. "WHAT-IF" TARGET ATTENDANCE CALCULATOR
   ========================================================================== */
function initAttendanceCalculator() {
  const subjectSelect = document.getElementById('calcSubjectSelect');
  const targetSelect = document.getElementById('calcTargetSelect');
  const highlightText = document.getElementById('crHighlightText');
  const descText = document.getElementById('crDescText');

  if (!subjectSelect || !targetSelect || !highlightText || !descText) return;

  const calculate = () => {
    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
    const conducted = parseInt(selectedOption.getAttribute('data-conducted'), 10) || 40;
    const attended = parseInt(selectedOption.getAttribute('data-attended'), 10) || 30;
    const target = parseInt(targetSelect.value, 10) || 75;
    const subjectName = selectedOption.text.split('•')[0].trim();

    const currentPct = ((attended / conducted) * 100).toFixed(1);

    if (currentPct >= target) {
      highlightText.textContent = 'Target Already Achieved! ✓';
      highlightText.style.color = '#15803D';
      
      // Calculate how many classes student can miss while staying >= target
      // (attended) / (conducted + canMiss) >= target/100
      // 100 * attended >= target * (conducted + canMiss)
      // canMiss <= (100 * attended - target * conducted) / target
      const canMiss = Math.floor((100 * attended - target * conducted) / target);
      if (canMiss > 0) {
        descText.innerHTML = `Your attendance for <strong>${subjectName}</strong> is currently <strong>${currentPct}%</strong>. You can safely miss up to <strong>${canMiss} classes</strong> and still maintain <strong>${target}%</strong>.`;
      } else {
        descText.innerHTML = `Your attendance for <strong>${subjectName}</strong> is currently <strong>${currentPct}%</strong>. You must attend all upcoming classes to avoid dropping below <strong>${target}%</strong>.`;
      }
      return;
    }

    // Solve for X consecutive classes needed:
    // (attended + X) / (conducted + X) >= target / 100
    // 100 * (attended + X) >= target * (conducted + X)
    // 100 * attended + 100 * X >= target * conducted + target * X
    // (100 - target) * X >= target * conducted - 100 * attended
    // X >= (target * conducted - 100 * attended) / (100 - target)
    const numerator = target * conducted - 100 * attended;
    const denominator = 100 - target;
    const needed = Math.ceil(numerator / denominator);

    highlightText.textContent = `Attend Next ${needed} Lectures`;
    highlightText.style.color = target > 75 ? '#0B5CAD' : '#DC2626';

    const newAttended = attended + needed;
    const newConducted = conducted + needed;
    const newPct = ((newAttended / newConducted) * 100).toFixed(1);

    descText.innerHTML = `By attending the next <strong>${needed} consecutive lectures</strong> without missing, your ${subjectName} attendance will rise from <strong>${currentPct}% to ${newPct}%</strong> (${newAttended}/${newConducted} attended).`;
  };

  subjectSelect.addEventListener('change', calculate);
  targetSelect.addEventListener('change', calculate);
  calculate();
}

/* ==========================================================================
   4. SUBJECT SEARCH FILTER
   ========================================================================== */
function initAttendanceSearch() {
  const searchInput = document.getElementById('attendanceSearchInput');
  const cards = document.querySelectorAll('.att-subject-card');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      if (text.includes(query)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

/* ==========================================================================
   5. ACTION BUTTONS & TOAST NOTIFICATIONS
   ========================================================================== */
function initActionButtons() {
  const btnExport = document.getElementById('btnExportPDF');
  const btnLeave = document.getElementById('btnApplyLeave');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      showToast('Generating official Subject-wise Attendance Report (PDF)...');
      setTimeout(() => {
        showToast('✓ Attendance report downloaded successfully: Shivam_Aghao_Attendance_S3.pdf');
      }, 1200);
    });
  }

  if (btnLeave) {
    btnLeave.addEventListener('click', () => {
      showToast('Opening Student Academic Leave Application Portal (Form 4B)...');
    });
  }
}

function showSubjectLog(code, name) {
  showToast(`Loading complete lecture attendance history for ${name} (${code})...`);
}

function openDiscrepancyModal(code, name) {
  showToast(`Submitting attendance discrepancy review request for ${name} (${code}) to Academic Office.`);
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'dashboard-toast';
  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.5rem;">
      <span style="font-size:1rem;">ℹ️</span>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards ease';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, 3500);
}

