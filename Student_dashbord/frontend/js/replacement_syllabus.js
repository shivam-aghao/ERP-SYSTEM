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

  const code = subjectCode || (select ? select.value : null) || (cachedSubjects[0]?.code) || '5IT220PC';

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

// Global scope bindings
window.openStudentModule = openStudentModule;
window.closeStudentModule = closeStudentModule;
window.switchModalSubtab = switchModalSubtab;
window.toggleModalTabDropdown = toggleModalTabDropdown;
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
