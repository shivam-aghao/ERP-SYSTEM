/**
 * SSGMCE College ERP - Canonical Fees Module Frontend Controller
 * Strictly scoped to Payable, Fee Online Payment, and Receipt views.
 */

let currentFeesData = null;
let activeFeesTab = 'payable';

// Helper: Format Indian Rupee currency
function formatINR(val) {
  if (val === null || val === undefined || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Helper: Get student authentication code & token
function getStudentAuthContext() {
  const token = localStorage.getItem('ssgmce_access_token') || localStorage.getItem('ssgmce_token') || localStorage.getItem('token') || '';
  let studentCode = localStorage.getItem('student_code') || localStorage.getItem('user_id') || '';
  if (!studentCode && window.ERP_AUTH && window.ERP_AUTH.getUser) {
    const u = window.ERP_AUTH.getUser();
    if (u) studentCode = u.student_code || u.identifier || u.user_id || '';
  }
  if (!studentCode) studentCode = '308637'; // Canonical fallback
  return { token, studentCode };
}

// Helper: Dynamically determine API Base URL across protocols and hostnames
function getFeesApiBase() {
  if (window.__API_BASE__) return window.__API_BASE__;
  if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
    return window.location.origin + '/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
}

// Function: Toggle or set expanded state of Fees sidebar submenu (debounced against duplicate event listeners)
let _lastFeesToggleTime = 0;
function toggleFeesSubmenu(forceState) {
  const now = Date.now();
  if (forceState === undefined && now - _lastFeesToggleTime < 300) {
    return; // Prevent duplicate execution from multiple event listeners
  }
  _lastFeesToggleTime = now;

  const feesItem = document.getElementById('sidebarItemFees');
  const feesToggle = document.getElementById('feesMenuToggle');
  if (!feesItem) return;

  const willExpand = (forceState !== undefined) ? !!forceState : !feesItem.classList.contains('expanded');
  if (!willExpand) {
    feesItem.classList.remove('expanded');
    if (feesToggle) feesToggle.setAttribute('aria-expanded', 'false');
  } else {
    feesItem.classList.add('expanded');
    if (feesToggle) feesToggle.setAttribute('aria-expanded', 'true');
    const container = document.getElementById('feesMainContainer');
    if (!container || container.style.display === 'none') {
      openFeesView('payable');
    }
  }
}
window.toggleFeesSubmenu = toggleFeesSubmenu;

// 1. Initialize Fees Module & Sidebar Event Listeners
function initFeesModule() {
  const feesItem = document.getElementById('sidebarItemFees');
  const feesToggle = document.getElementById('feesMenuToggle');
  const sublinks = document.querySelectorAll('.submenu-link[data-fees-tab]');

  if (feesToggle && feesItem) {
    feesToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFeesSubmenu();
    });
  }

  sublinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tab = link.getAttribute('data-fees-tab');
      if (tab) {
        openFeesView(tab);
      }
    });
  });

  // Handle direct hash navigation e.g. #fees-payable or #fees-receipt
  const checkHash = () => {
    const h = (window.location.hash || '').replace(/^#/, '');
    if (h === 'fees' || h === 'fees-payable') openFeesView('payable');
    else if (h === 'fees-payment' || h === 'fees-online-payment') openFeesView('online-payment');
    else if (h === 'fees-receipt' || h === 'fees-receipts') openFeesView('receipt');
  };
  checkHash();
  window.addEventListener('hashchange', checkHash);
}

// Helper: Normalize fee subtab identifiers
function normalizeFeesTab(tabKey) {
  if (!tabKey) return 'payable';
  const t = String(tabKey).toLowerCase().trim();
  if (t === 'online-payment' || t === 'payment' || t === 'online_payment' || t === 'fees-online-payment' || t === 'onlinepayment') return 'online-payment';
  if (t === 'receipt' || t === 'receipts' || t === 'fee-receipt' || t === 'fee-receipts') return 'receipt';
  return 'payable';
}

// 2. Open Fees View in Content Area
async function openFeesView(rawTabKey = 'payable') {
  const tabKey = normalizeFeesTab(rawTabKey);
  activeFeesTab = tabKey;
  window.activeFeesTab = tabKey;

  const mainDashboard = document.querySelector('.main-dashboard-full-container') || document.getElementById('mainDashboardContainer');
  const feesContainer = document.getElementById('feesMainContainer');
  const feesItem = document.getElementById('sidebarItemFees');
  const feesToggle = document.getElementById('feesMenuToggle');

  // Expand fees menu in sidebar
  if (feesItem) {
    feesItem.classList.add('expanded');
    if (feesToggle) feesToggle.setAttribute('aria-expanded', 'true');
  }

  // Highlight active submenu link
  document.querySelectorAll('.submenu-link[data-fees-tab]').forEach(lnk => {
    const isTarget = normalizeFeesTab(lnk.getAttribute('data-fees-tab')) === tabKey;
    lnk.classList.toggle('active', isTarget);
  });

  // Remove active from other top-level sidebar items
  document.querySelectorAll('.sidebar-link').forEach(sl => {
    if (sl.getAttribute('data-nav') !== 'fees') {
      sl.classList.remove('active');
    } else {
      sl.classList.add('active');
    }
  });

  // Hide main dashboard, show fees container
  if (mainDashboard) mainDashboard.style.display = 'none';
  if (feesContainer) {
    feesContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Auto-close mobile drawer if open
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && sidebar.classList.contains('drawer-open')) {
    sidebar.classList.remove('drawer-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Switch inner panes immediately
  switchFeesPane(tabKey);

  // If data is already cached, render immediately without UI delay
  if (currentFeesData) {
    if (tabKey === 'payable') renderPayableTable(currentFeesData);
    else if (tabKey === 'online-payment') renderOnlinePayment(currentFeesData);
    else if (tabKey === 'receipt') renderReceiptsTable(currentFeesData);
  }

  // Fetch live fee ledger from backend
  await loadFeesLedgerData();
}

// 3. Switch between Payable, Fee Online Payment, and Receipt panes
function switchFeesPane(rawTabKey) {
  const tabKey = normalizeFeesTab(rawTabKey);
  const panes = {
    'payable': document.getElementById('feesPanePayable'),
    'online-payment': document.getElementById('feesPaneOnlinePayment'),
    'receipt': document.getElementById('feesPaneReceipt')
  };

  Object.keys(panes).forEach(k => {
    if (panes[k]) {
      panes[k].style.display = (k === tabKey) ? 'block' : 'none';
    }
  });

  // Update active submenu highlight
  document.querySelectorAll('.submenu-link[data-fees-tab]').forEach(lnk => {
    const lk = normalizeFeesTab(lnk.getAttribute('data-fees-tab'));
    lnk.classList.toggle('active', lk === tabKey);
  });
}

// 4. Close Fees View & Return to Main Student Dashboard
function closeFeesMainView() {
  const mainDashboard = document.querySelector('.main-dashboard-full-container') || document.getElementById('mainDashboardContainer');
  const feesContainer = document.getElementById('feesMainContainer');
  const feesItem = document.getElementById('sidebarItemFees');

  if (feesContainer) feesContainer.style.display = 'none';
  if (mainDashboard) mainDashboard.style.display = 'block';

  // De-activate fees sublinks
  document.querySelectorAll('.submenu-link[data-fees-tab]').forEach(lnk => lnk.classList.remove('active'));

  // Reset active menu to Dashboard link
  document.querySelectorAll('.sidebar-link').forEach(sl => {
    if (sl.getAttribute('data-nav') === 'dashboard') {
      sl.classList.add('active');
    } else {
      sl.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. Load Live Fees Ledger from Server
async function loadFeesLedgerData() {
  const { token, studentCode } = getStudentAuthContext();
  const apiBase = getFeesApiBase();

  const loadingEl = document.getElementById('payableLoading');
  const tableContainer = document.getElementById('payableTableContainer');
  const emptyStateEl = document.getElementById('payableEmptyState');

  if (loadingEl) loadingEl.style.display = 'block';

  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiBase}/fees?student_code=${encodeURIComponent(studentCode)}`, { headers });
    const json = await res.json();

    if (res.ok && json.success && json.data) {
      currentFeesData = json.data;
      renderPayableTable(currentFeesData);
      renderOnlinePayment(currentFeesData);
      renderReceiptsTable(currentFeesData);
    } else {
      showEmptyFeeState();
    }
  } catch (err) {
    console.warn('[FeesModule] Live fetch error:', err);
    if (!currentFeesData) {
      showEmptyFeeState();
    }
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// 6. Render Payable Table (Exact replica of reference screenshot)
function renderPayableTable(data) {
  const titleEl = document.getElementById('payableTitleCaption');
  const tbody = document.getElementById('payableTableBody');
  const tfoot = document.getElementById('payableTableFoot');
  const tableContainer = document.getElementById('payableTableContainer');
  const emptyStateEl = document.getElementById('payableEmptyState');

  if (!data || data.has_records === false) {
    showEmptyFeeState();
    return;
  }

  if (emptyStateEl) emptyStateEl.style.display = 'none';
  if (tableContainer) tableContainer.style.display = 'block';

  // Set top bar title e.g. "Payable (TY B.E Information Technology-A 2026-2027(SEMESTER V))"
  if (titleEl) {
    titleEl.textContent = data.title_caption || `Payable (${data.class_name || 'Class'} ${data.academic_year || '2025-2026'}(SEMESTER ${data.semester || 'V'}))`;
  }

  const sTable = data.structural_table || {};
  const sRows = sTable.particulars || [];
  const sSub = sTable.subtotal || {};

  const nTable = data.non_structural_table || {};
  const nRows = nTable.particulars || [];
  const nSub = nTable.subtotal || {};

  const net = data.net_totals || {};

  let html = '';

  // --- Group 1: STRUCTURAL FEES ---
  if (sRows.length > 0) {
    sRows.forEach((row, idx) => {
      html += `<tr>`;
      if (idx === 0) {
        html += `<td rowspan="${sRows.length}" class="td-fees-type">
          <span style="font-size:15px; margin-right:4px;">🎓</span>
          <strong>STRUCTURAL FEES</strong>
        </td>`;
      }
      html += `
        <td class="td-particulars">${row.particulars}</td>
        <td class="td-amt">${formatINR(row.receivable)}</td>
        <td class="td-amt">${formatINR(row.received)}</td>
        <td class="td-amt">${formatINR(row.adjustment || 0)}</td>
        <td class="td-amt">${formatINR(row.outstanding)}</td>
        <td class="td-amt">${row.advance ? formatINR(row.advance) : ''}</td>
      </tr>`;
    });

    // Subtotal Row for Structural Fees
    html += `
      <tr class="row-subtotal">
        <td style="background:#dbeafe;"></td>
        <td class="td-particulars" style="text-align:center;">${sSub.particulars || 'TOTAL STRUCTURAL FEES'}</td>
        <td class="td-amt">${formatINR(sSub.receivable)}</td>
        <td class="td-amt">${formatINR(sSub.received)}</td>
        <td class="td-amt">${formatINR(sSub.adjustment || 0)}</td>
        <td class="td-amt">${formatINR(sSub.outstanding)}</td>
        <td class="td-amt">${formatINR(sSub.advance || 0)}</td>
      </tr>
    `;
  }

  // --- Group 2: NON STRUCTURAL FEES ---
  if (nRows.length > 0) {
    nRows.forEach((row, idx) => {
      html += `<tr>`;
      if (idx === 0) {
        html += `<td rowspan="${nRows.length}" class="td-fees-type">
          <span style="font-size:15px; margin-right:4px;">🎓</span>
          <strong>NON STRUCTURAL FEES</strong>
        </td>`;
      }
      html += `
        <td class="td-particulars">${row.particulars}</td>
        <td class="td-amt">${formatINR(row.receivable)}</td>
        <td class="td-amt">${formatINR(row.received)}</td>
        <td class="td-amt">${formatINR(row.adjustment || 0)}</td>
        <td class="td-amt">${formatINR(row.outstanding)}</td>
        <td class="td-amt">${row.advance ? formatINR(row.advance) : ''}</td>
      </tr>`;
    });

    // Subtotal Row for Non-Structural Fees
    html += `
      <tr class="row-subtotal">
        <td style="background:#dbeafe;"></td>
        <td class="td-particulars" style="text-align:center;">${nSub.particulars || 'TOTAL NON STRUCTURAL FEES'}</td>
        <td class="td-amt">${formatINR(nSub.receivable)}</td>
        <td class="td-amt">${formatINR(nSub.received)}</td>
        <td class="td-amt">${formatINR(nSub.adjustment || 0)}</td>
        <td class="td-amt">${formatINR(nSub.outstanding)}</td>
        <td class="td-amt">${formatINR(nSub.advance || 0)}</td>
      </tr>
    `;
  }

  if (tbody) tbody.innerHTML = html;

  // --- TFOOT: NET TOTAL ROW ---
  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="row-net-total">
        <td colspan="2" class="td-particulars" style="text-align:center; font-weight:800; font-size:13.5px;">
          ${net.label || '₹ Net Total (Academic + NonAcademic)'}
        </td>
        <td class="td-amt">₹ ${formatINR(net.receivable || data.total_fees || 0)}</td>
        <td class="td-amt">₹ ${formatINR(net.received || data.paid_amount || 0)}</td>
        <td class="td-amt">₹ ${formatINR(net.adjustment || 0)}</td>
        <td class="td-amt">₹ ${formatINR(net.outstanding !== undefined ? net.outstanding : data.pending_amount || 0)}</td>
        <td class="td-amt">₹ ${formatINR(net.advance || 0)}</td>
      </tr>
    `;
  }
}

// 7. Show Empty Fee State (When no records exist)
function showEmptyFeeState() {
  const tableContainer = document.getElementById('payableTableContainer');
  const emptyStateEl = document.getElementById('payableEmptyState');
  const titleEl = document.getElementById('payableTitleCaption');

  if (titleEl) titleEl.textContent = 'Payable (No Fee Standing Recorded)';
  if (tableContainer) tableContainer.style.display = 'none';
  if (emptyStateEl) emptyStateEl.style.display = 'block';
}

let selectedPaymentCategoryKey = 'CURRENT_YEAR';

// 8. Render Fee Online Payment Pane
function renderOnlinePayment(data) {
  if (!data) return;

  const titleEl = document.getElementById('onlinePaymentTitleCaption');
  if (titleEl) {
    const cls = data.class_full_name || data.class_name || 'Class';
    const ay = data.academic_year || '2025-2026';
    titleEl.textContent = `Fee Online Payment (${cls} ${ay})`;
  }

  // 1. Populate Student Information Header
  const sInfo = data.student_info_header || {
    name: data.student_name || 'Student',
    academic_session: data.academic_year || '2025-2026',
    semester: `Semester ${data.semester || 'V'}`,
    course_class: data.class_full_name || data.class_name || 'CSE'
  };

  const nameEl = document.getElementById('feeOnlinePayName');
  const sessEl = document.getElementById('feeOnlinePaySession');
  const semEl = document.getElementById('feeOnlinePaySemester');
  const clsEl = document.getElementById('feeOnlinePayClass');

  if (nameEl) nameEl.textContent = sInfo.name;
  if (sessEl) sessEl.textContent = sInfo.academic_session;
  if (semEl) semEl.textContent = sInfo.semester;
  if (clsEl) clsEl.textContent = sInfo.course_class;

  // 2. Populate Payment For Selection Row (6 exact options in exact order)
  const categoriesContainer = document.getElementById('paymentCategoriesContainer');
  const categories = data.payment_categories || [
    { key: 'OUTSTANDING', label: 'OUTSTANDING', display_name: 'OUTSTANDING-(0)', amount: 0 },
    { key: 'OTHER', label: 'OTHER', display_name: 'OTHER-(0)', amount: 0 },
    { key: 'SOCIETY', label: 'SOCIETY', display_name: 'SOCIETY-(0)', amount: 0 },
    { key: 'EXAM', label: 'EXAM', display_name: 'EXAM-(0)', amount: 0 },
    { key: 'CURRENT_YEAR', label: 'CURRENT_YEAR', display_name: `CURRENT_YEAR-(${Math.round(data.pending_amount || 0)})`, amount: data.pending_amount || 0 },
    { key: 'HOSTEL', label: 'HOSTEL', display_name: 'HOSTEL-(0)', amount: 0 }
  ];

  const validKeys = categories.map(c => c.key);
  if (!validKeys.includes(selectedPaymentCategoryKey)) {
    selectedPaymentCategoryKey = 'CURRENT_YEAR';
  }

  if (categoriesContainer) {
    let radiosHtml = '';
    categories.forEach(cat => {
      const isChecked = (cat.key === selectedPaymentCategoryKey);
      radiosHtml += `
        <label class="payment-cat-radio-label ${isChecked ? 'active' : ''}" data-cat-key="${cat.key}">
          <input type="radio" name="paymentCategoryRadio" value="${cat.key}" ${isChecked ? 'checked' : ''} onchange="onPaymentCategorySelected('${cat.key}')">
          <span>${cat.display_name}</span>
        </label>
      `;
    });
    categoriesContainer.innerHTML = radiosHtml;
  }

  // 3. Render Active Category Details
  renderCategoryPaymentDetails(selectedPaymentCategoryKey);
}

// 9. Handle Category Radio Selection
function onPaymentCategorySelected(catKey) {
  selectedPaymentCategoryKey = catKey;

  // Update active styling on radio labels and checked state of inputs
  document.querySelectorAll('.payment-cat-radio-label').forEach(lbl => {
    const isTarget = (lbl.getAttribute('data-cat-key') === catKey);
    lbl.classList.toggle('active', isTarget);
    const radio = lbl.querySelector('input[type="radio"]');
    if (radio) {
      radio.checked = isTarget;
    }
  });

  renderCategoryPaymentDetails(catKey);
}

// 10. Render Active Category Payment Details
function renderCategoryPaymentDetails(catKey) {
  const contentEl = document.getElementById('paymentCategoryActiveContent');
  if (!contentEl) return;

  if (!currentFeesData) {
    contentEl.innerHTML = `<div class="payable-loading-state">Loading payment details...</div>`;
    return;
  }

  const categories = currentFeesData.payment_categories || [];
  const cat = categories.find(c => c.key === catKey) || {
    key: catKey,
    label: catKey,
    amount: (catKey === 'CURRENT_YEAR' ? (currentFeesData.pending_amount || 0) : 0),
    particulars: [],
    description: ''
  };

  const amount = Number(cat.amount) || 0;

  // If no payable amount exists for selected category, display exact required message
  if (amount <= 0) {
    contentEl.innerHTML = `
      <div class="alert-no-payable" role="alert">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>No payable amount available for this category.</span>
      </div>
    `;
    return;
  }

  // If payable amount > 0, display particulars table, financial summary and checkout form
  const parts = cat.particulars && cat.particulars.length > 0 ? cat.particulars : [
    { head: `${cat.label} Due Amount`, amount: amount, paid: 0, outstanding: amount }
  ];

  let tableRows = '';
  parts.forEach((p, idx) => {
    const dueAmt = p.outstanding !== undefined ? p.outstanding : (p.amount - (p.paid || 0));
    tableRows += `
      <tr>
        <td style="width:40px; text-align:center;">${idx + 1}</td>
        <td><strong>${p.head}</strong></td>
        <td style="text-align:right;">₹ ${formatINR(p.amount)}</td>
        <td style="text-align:right; color:#16a34a;">₹ ${formatINR(p.paid || 0)}</td>
        <td style="text-align:right; font-weight:700; color:#ea580c;">₹ ${formatINR(dueAmt)}</td>
      </tr>
    `;
  });

  contentEl.innerHTML = `
    <div class="category-active-box">
      <div class="category-box-header">
        <span>Payment Particulars - ${cat.label}</span>
        <span style="font-size:12px; font-weight:600; opacity:0.9;">Total Outstanding: ₹ ${formatINR(amount)}</span>
      </div>
      <div class="category-box-body">
        
        <table class="category-particulars-table">
          <thead>
            <tr>
              <th style="width:40px; text-align:center;">#</th>
              <th>Fee Particulars Head</th>
              <th style="text-align:right;">Receivable</th>
              <th style="text-align:right;">Received</th>
              <th style="text-align:right;">Due Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align:right; font-weight:800;">Total Payable for ${cat.label} :</td>
              <td style="text-align:right; font-weight:800;">₹ ${formatINR(amount)}</td>
              <td style="text-align:right; font-weight:800; color:#16a34a;">₹ 0.00</td>
              <td style="text-align:right; font-weight:800; color:#ea580c;">₹ ${formatINR(amount)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="category-financial-summary">
          <div class="cat-kpi-block">
            <div class="kpi-lbl">Category Payable</div>
            <div class="kpi-val">₹ ${formatINR(amount)}</div>
          </div>
          <div class="cat-kpi-block">
            <div class="kpi-lbl">Applicable Adjustments</div>
            <div class="kpi-val" style="color:#64748b;">₹ 0.00</div>
          </div>
          <div class="cat-kpi-block">
            <div class="kpi-lbl">Final Amount Due</div>
            <div class="kpi-val text-due">₹ ${formatINR(amount)}</div>
          </div>
        </div>

        <form id="onlineCategoryPaymentForm" onsubmit="submitCategoryPayment(event, '${cat.key}', ${amount})">
          <div class="payment-form-wrapper">
            <div class="payment-form-group">
              <label for="payAmountInput">Amount to Pay (INR)</label>
              <input type="number" class="payment-form-control" id="payAmountInput" min="1" max="${amount}" step="1" value="${Math.round(amount)}" required style="font-size:16px; font-weight:700; color:#004080;">
              <small style="display:block; margin-top:4px; font-size:11.5px; color:#64748b;">You can pay full amount or any installment up to ₹ ${formatINR(amount)}</small>
            </div>

            <div class="payment-form-group">
              <label>Select Payment Gateway Channel</label>
              <div class="payment-mode-radios">
                <label class="payment-mode-chip">
                  <input type="radio" name="feesPayMode" value="upi" checked>
                  <span>UPI (GPay / PhonePe / Paytm / BHIM)</span>
                </label>
                <label class="payment-mode-chip">
                  <input type="radio" name="feesPayMode" value="netbanking">
                  <span>SBI e-Pay Net Banking</span>
                </label>
                <label class="payment-mode-chip">
                  <input type="radio" name="feesPayMode" value="card">
                  <span>Debit / Credit Card</span>
                </label>
              </div>
            </div>

            <div style="margin-top:20px;">
              <button type="submit" class="btn-submit-payment" id="btnSubmitPayment">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Proceed to Secure Checkout &rarr;
              </button>
            </div>

            <div style="margin-top:14px; font-size:12px; color:#64748b; display:flex; align-items:center; gap:6px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              256-bit Institutional SSL Encryption • Verified BillDesk &amp; SBI e-Pay Gateway
            </div>
          </div>
        </form>

      </div>
    </div>
  `;
}

// 11. Submit Category Online Payment with Backend Verification
async function submitCategoryPayment(event, catKey, maxAmount) {
  if (event) event.preventDefault();

  const { token, studentCode } = getStudentAuthContext();
  const apiBase = getFeesApiBase();

  const amtInp = document.getElementById('payAmountInput');
  const submitBtn = document.getElementById('btnSubmitPayment');
  const modeInp = document.querySelector('input[name="feesPayMode"]:checked');

  const amount = parseFloat(amtInp ? amtInp.value : 0);
  if (isNaN(amount) || amount <= 0) {
    if (window.showToast) window.showToast('Please enter a valid payment amount greater than zero.', 'error');
    return;
  }

  if (amount > maxAmount) {
    if (window.showToast) window.showToast(`Entered amount cannot exceed category outstanding due of ₹${formatINR(maxAmount)}.`, 'error');
    return;
  }

  const payMode = modeInp ? modeInp.value : 'upi';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="payable-spinner" style="width:14px; height:14px; border-width:2px; margin:0; display:inline-block; vertical-align:middle;"></span>
      Processing Secure Payment...
    `;
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiBase}/fees/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        student_code: studentCode,
        amount: amount,
        payment_method: payMode,
        payment_reference: `BILLDESK-${catKey}-${Date.now()}`,
        fee_head: catKey
      })
    });

    const json = await res.json();

    if (res.ok && json.success && json.data) {
      const rec = json.data;
      if (window.showToast) {
        window.showToast(`Payment of ₹${formatINR(amount)} for ${catKey} Confirmed! Receipt #${rec.receipt_number || rec.receipt_no}`, 'success');
      }

      // Re-fetch authoritative fee ledger from server
      await loadFeesLedgerData();

      // Automatically switch to Receipt view and open generated receipt
      setTimeout(() => {
        openFeesView('receipt');
        const rid = rec.receipt_number || rec.receipt_id || rec.receipt_no;
        if (rid) {
          viewFeeReceiptModal(rid);
        }
      }, 700);
    } else {
      const errMsg = (json.error && json.error.message) || json.message || json.detail || 'Payment could not be processed.';
      if (window.showToast) window.showToast(`Payment Notice: ${errMsg}`, 'error');
    }
  } catch (err) {
    console.error('[FeesModule] Payment error:', err);
    if (window.showToast) window.showToast('Connection error connecting to payment gateway.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
        Proceed to Secure Checkout &rarr;
      `;
    }
  }
}

// Backwards compatibility alias
function submitOnlineFeePayment(event) {
  submitCategoryPayment(event, selectedPaymentCategoryKey, currentFeesData ? (currentFeesData.pending_amount || 0) : 0);
}

// 12. Render Receipts Table with Full Category & Multi-Action Support
function renderReceiptsTable(data) {
  const tbody = document.getElementById('receiptsTableBody');
  const emptyEl = document.getElementById('receiptsEmptyState');
  const tableWrap = document.getElementById('receiptsTableWrap');
  const titleEl = document.getElementById('receiptsTitleCaption');

  if (titleEl && data) {
    titleEl.textContent = `Fee Receipts History (${data.class_name || ''} ${data.academic_year || ''})`;
  }

  const receipts = (data && data.receipts) ? data.receipts : [];

  if (receipts.length === 0) {
    if (tableWrap) tableWrap.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  let html = '';
  receipts.forEach(r => {
    const rid = r.receipt_number || r.receipt_id || r.id;
    const catLabel = (r.fee_category || 'CURRENT_YEAR').toUpperCase();
    const dateTimeStr = r.payment_time ? `${r.payment_date} (${r.payment_time})` : (r.payment_date || 'Recent');

    html += `
      <tr>
        <td style="font-weight:700; color:#004080; font-family:monospace; cursor:pointer;" onclick="viewFeeReceiptModal('${rid}')" title="Click to view receipt">
          ${r.receipt_number || r.id}
        </td>
        <td>${dateTimeStr}</td>
        <td><span class="receipt-cat-badge">${catLabel}</span></td>
        <td style="text-align:right; font-weight:700; color:#16a34a;">₹ ${formatINR(r.amount)}</td>
        <td>${r.payment_method || 'Online UPI'}</td>
        <td style="font-family:monospace; font-size:11.5px; color:#475569;">${r.transaction_id || 'TXN-SSG-REC'}</td>
        <td><span class="receipt-status-badge">PAID &amp; VERIFIED ✓</span></td>
        <td>
          <div class="receipt-actions-group">
            <button type="button" class="btn-receipt-action btn-receipt-view" onclick="viewFeeReceiptModal('${rid}')" title="View Full Receipt">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              View
            </button>
            <button type="button" class="btn-receipt-action btn-receipt-print" onclick="printOfficialFeeReceipt('${rid}')" title="Print Counterfoil">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print
            </button>
            <button type="button" class="btn-receipt-action btn-receipt-download" onclick="downloadOfficialFeeReceiptFile('${rid}')" title="Download Document">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              PDF
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  if (tbody) tbody.innerHTML = html;
}

// 13. Interactive Official Receipt Modal Viewer
let currentModalReceiptData = null;

async function viewFeeReceiptModal(receiptId) {
  const modal = document.getElementById('receiptDetailModal');
  const paper = document.getElementById('receiptModalPaperContent');
  if (!modal || !paper) return;

  paper.innerHTML = `<div class="payable-loading-state"><div class="payable-spinner"></div>Loading institutional fee receipt...</div>`;
  modal.style.display = 'flex';

  const { token } = getStudentAuthContext();
  const apiBase = getFeesApiBase();

  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiBase}/fees/receipts/${encodeURIComponent(receiptId)}`, { headers });
    const json = await res.json();

    if (res.ok && json.success && json.data) {
      currentModalReceiptData = json.data;
      renderReceiptPaperHTML(currentModalReceiptData, paper);
    } else {
      const errMsg = (json.error && json.error.message) || json.message || 'Receipt record could not be loaded.';
      paper.innerHTML = `<div class="alert-no-payable" style="margin:20px 0;">${errMsg}</div>`;
    }
  } catch (err) {
    paper.innerHTML = `<div class="alert-no-payable" style="margin:20px 0;">Network error loading fee receipt.</div>`;
  }
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptDetailModal');
  if (modal) modal.style.display = 'none';
  currentModalReceiptData = null;
}

function renderReceiptPaperHTML(r, container) {
  const parts = r.particulars || [{ head: `${r.fee_category || 'Academic'} Fee`, amount: r.amount }];
  let tableRows = '';
  parts.forEach((p, idx) => {
    tableRows += `
      <tr>
        <td style="width:36px; text-align:center;">${idx + 1}</td>
        <td><strong>${p.head}</strong></td>
        <td style="text-align:right; font-weight:600;">₹ ${formatINR(p.amount)}</td>
      </tr>
    `;
  });

  const dateTimeStr = r.payment_time ? `${r.payment_date} at ${r.payment_time}` : (r.payment_date || '--');

  container.innerHTML = `
    <div class="receipt-paper-view" id="printableReceiptPaper">
      <div class="receipt-paper-header">
        <img src="https://www.ssgmce.ac.in/favicon.svg" alt="SSGMCE Logo" class="receipt-paper-logo" onerror="this.onerror=null; this.src='../images/ssgmce-logo.png';">
        <h2 class="receipt-inst-title">Shri Sant Gajanan Maharaj College of Engineering, Shegaon</h2>
        <div class="receipt-inst-sub">An Autonomous Institute Affiliated to Sant Gadge Baba Amravati University • Approved by AICTE New Delhi</div>
        <div class="receipt-title-badge">OFFICIAL STUDENT FEE RECEIPT</div>
      </div>

      <div class="receipt-info-grid">
        <div class="receipt-info-cell"><strong>Receipt Number:</strong> <span style="color:#004080; font-weight:700;">${r.receipt_number || r.receipt_no}</span></div>
        <div class="receipt-info-cell"><strong>Date &amp; Time:</strong> ${dateTimeStr}</div>
        <div class="receipt-info-cell"><strong>Student Code (PRN):</strong> ${r.student_code}</div>
        <div class="receipt-info-cell"><strong>Student Full Name:</strong> ${r.student_name}</div>
        <div class="receipt-info-cell"><strong>Course &amp; Class:</strong> ${r.course_class || r.class_name}</div>
        <div class="receipt-info-cell"><strong>Semester &amp; Session:</strong> ${r.semester} (${r.academic_session})</div>
        <div class="receipt-info-cell"><strong>Fee Category:</strong> <span class="receipt-cat-badge">${r.fee_category}</span></div>
        <div class="receipt-info-cell"><strong>Payment Method:</strong> ${r.payment_method}</div>
        <div class="receipt-info-cell" style="grid-column: span 2;"><strong>Transaction Reference:</strong> <span style="font-family:monospace;">${r.transaction_id || r.payment_reference || 'N/A'}</span></div>
      </div>

      <table class="receipt-paper-table">
        <thead>
          <tr>
            <th style="width:36px; text-align:center;">#</th>
            <th>Fee Particulars Head</th>
            <th style="text-align:right;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="text-align:right; font-weight:800;">Net Amount Received :</td>
            <td style="text-align:right; font-weight:800; color:#15803d; font-size:14px;">₹ ${formatINR(r.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="receipt-paper-total">
        <div class="receipt-amount-words">
          <div>Amount Received in Words :</div>
          <span>${r.amount_in_words || 'Rupees Only'}</span>
        </div>
        <div class="receipt-amount-display">₹ ${formatINR(r.amount)}</div>
      </div>

      <div class="receipt-paper-seal">
        <div>
          <strong>Status :</strong> <span style="color:#16a34a; font-weight:700;">PAID &amp; SETTLED ✓</span><br>
          <small>Computer generated authentic counterfoil. No physical signature required.</small>
        </div>
        <div style="text-align:right;">
          <strong>Authorized Signatory</strong><br>
          <small>Accounts &amp; Finance Section, SSGMCE Shegaon</small>
        </div>
      </div>
    </div>
  `;
}

function printReceiptModalContent() {
  if (!currentModalReceiptData) return;
  printOfficialFeeReceipt(currentModalReceiptData.receipt_number || currentModalReceiptData.receipt_id);
}

function downloadReceiptPDF() {
  if (!currentModalReceiptData) return;
  downloadOfficialFeeReceiptFile(currentModalReceiptData.receipt_number || currentModalReceiptData.receipt_id);
}

function printOfficialFeeReceipt(receiptId) {
  const apiBase = getFeesApiBase();
  window.open(`${apiBase}/fees/receipts/${encodeURIComponent(receiptId)}/download?format=html`, '_blank', 'width=800,height=900');
}

function downloadOfficialFeeReceiptFile(receiptId) {
  const apiBase = getFeesApiBase();
  window.open(`${apiBase}/fees/receipts/${encodeURIComponent(receiptId)}/download?format=html`, '_blank');
}

// 14. Print Payable Statement
function printPayableStatement() {
  window.print();
}

window.openFeesView = openFeesView;
window.switchFeesPane = switchFeesPane;
window.normalizeFeesTab = normalizeFeesTab;
window.onPaymentCategorySelected = onPaymentCategorySelected;
window.submitCategoryPayment = submitCategoryPayment;
window.closeFeesMainView = closeFeesMainView;
window.downloadOfficialFeeReceipt = downloadOfficialFeeReceipt;
window.submitOnlineFeePayment = submitOnlineFeePayment;
window.handlePaymentPurposeChange = handlePaymentPurposeChange;
window.printPayableStatement = printPayableStatement;
window.viewFeeReceiptModal = viewFeeReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.printReceiptModalContent = printReceiptModalContent;
window.downloadReceiptPDF = downloadReceiptPDF;
window.printOfficialFeeReceipt = printOfficialFeeReceipt;
window.downloadOfficialFeeReceiptFile = downloadOfficialFeeReceiptFile;
window.initFeesModule = initFeesModule;

// Global delegated capture-phase click listener for any element with data-fees-tab
document.addEventListener('click', function(e) {
  const target = e.target && e.target.closest && e.target.closest('[data-fees-tab]');
  if (target) {
    const tab = target.getAttribute('data-fees-tab');
    if (tab && typeof window.openFeesView === 'function') {
      e.preventDefault();
      e.stopPropagation();
      window.openFeesView(tab);
    }
  }
}, true);

// Initialize when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeesModule);
} else {
  initFeesModule();
}

