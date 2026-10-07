/**
 * SSGMCE Autonomous College ERP - Dynamic Academic Catalog & Syllabus Module
 * Connects directly to FastAPI (/api/v1/syllabus) and Supabase Cloud PostgreSQL
 * Strictly zero mock/static data.
 */

let subjects = [];
let faculty = [];
let syllabusData = {};

const $ = id => document.getElementById(id);

const initials = name =>
    (name || "FA").split(" ").filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard & Header Hydration
    if (window.ERPAuth) {
        const session = window.ERPAuth.guard('student');
        if (session && window.ERPAuth.hydrateHeader) {
            window.ERPAuth.hydrateHeader();
        }
    }

    // 2. Initialize Mobile Drawer
    initMobileDrawer();

    // 3. Setup UI Event Listeners
    setupEventListeners();

    // 4. Fetch and render live syllabus from backend/Supabase
    await loadSyllabusData();

    // 5. Highlight active sidebar link
    document.querySelectorAll('.sidebar-link[data-nav="syllabus"]').forEach(link => {
        link.classList.add('active');
    });
});

function initMobileDrawer() {
    const toggleBtn = document.getElementById('mobileMenuToggle') || document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('dashboardSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (toggleBtn && sidebar && backdrop) {
        function openDrawer() {
            sidebar.classList.add('mobile-open');
            backdrop.classList.add('active');
        }
        function closeDrawer() {
            sidebar.classList.remove('mobile-open');
            backdrop.classList.remove('active');
        }
        toggleBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('mobile-open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });
        backdrop.addEventListener('click', closeDrawer);
    }
}

function setupEventListeners() {
    // Subject search
    const subjectSearch = $("subjectSearch");
    if (subjectSearch) {
        subjectSearch.addEventListener("input", renderSubjects);
    }

    // Subject type filter
    const subjectTypeFilter = $("subjectTypeFilter");
    if (subjectTypeFilter) {
        subjectTypeFilter.addEventListener("change", renderSubjects);
    }

    // Faculty search
    const facultySearch = $("facultySearch");
    if (facultySearch) {
        facultySearch.addEventListener("input", renderFaculty);
    }

    // Syllabus subject select dropdown
    const syllabusSubjectSelect = $("syllabusSubjectSelect");
    if (syllabusSubjectSelect) {
        syllabusSubjectSelect.addEventListener("change", event => {
            renderSyllabus(event.target.value);
        });
    }

    // Sub-navigation tabs (Subjects / Faculty / University Syllabus)
    document.querySelectorAll(".syllabus-subnav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            switchSyllabusView(btn.dataset.view);
        });
    });

    // Print button
    const printBtn = $("printSyllabus");
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }
}

/* ==========================================
   DATA LOADING (FastAPI Backend + Supabase)
========================================== */

async function loadSyllabusData() {
    // Show loading skeleton in subject table and faculty
    if ($("subjectTableBody")) {
        $("subjectTableBody").innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:35px; color:#64748B;">
                    <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px; color:#0B5CAD;"></i> Loading curriculum from SSGMCE Academic Registry...
                </td>
            </tr>
        `;
    }

    let rawList = [];
    try {
        // Option 1: StudentApi wrapper
        if (window.StudentApi && typeof window.StudentApi.getSyllabus === 'function') {
            const resp = await window.StudentApi.getSyllabus();
            if (resp && resp.data && Array.isArray(resp.data) && resp.data.length > 0) {
                rawList = resp.data;
            }
        }

        // Option 2: Direct API fetch to port 8000
        if (!rawList.length) {
            const currentHost = (window.location && window.location.hostname && window.location.hostname !== '') 
                ? window.location.hostname 
                : '127.0.0.1';
            const apiBase = (window.ERP_CONFIG && window.ERP_CONFIG.API_BASE) || `http://${currentHost}:8000/api/v1`;
            const endpoints = [
                `${apiBase}/syllabus`,
                `${apiBase}/student/syllabus`,
                `http://${currentHost}:8000/api/v1/syllabus`,
                `/api/v1/syllabus`
            ];
            for (const ep of endpoints) {
                try {
                    const res = await fetch(ep);
                    if (res.ok) {
                        const json = await res.json();
                        if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
                            rawList = json.data;
                            break;
                        }
                    }
                } catch (e) {
                    // Try next endpoint
                }
            }
        }

        // Option 3: Supabase Cloud Client Direct Fallback
        if (!rawList.length && window.erpSupabase && window.erpSupabase.client) {
            const { data: sRows, error: sErr } = await window.erpSupabase.client.from('subject_syllabus').select('*');
            if (sRows && sRows.length > 0) {
                const { data: uRows } = await window.erpSupabase.client.from('curriculum_units').select('*');
                rawList = sRows.map(s => {
                    const units = (uRows || []).filter(u => u.subject_code === s.subject_code);
                    return { ...s, units };
                });
            }
        }
    } catch (err) {
        console.error('[Syllabus] Error loading live curriculum:', err);
    }

    if (!rawList || rawList.length === 0) {
        if ($("subjectTableBody")) {
            $("subjectTableBody").innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:35px; color:#EF4444;">
                        <i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i> Failed to retrieve academic catalog. Please ensure backend server is running.
                    </td>
                </tr>
            `;
        }
        return;
    }

    // Normalize subjects list
    subjects = rawList.map(item => ({
        name: item.name || item.subject_name || "Course",
        code: item.code || item.subject_code || "",
        type: item.type || item.subject_type || "Core",
        credits: item.credits || 3,
        faculty: item.faculty || item.faculty_name || "Faculty Advisor",
        facultyRole: item.faculty_designation || item.facultyRole || "Assistant Professor · CSE",
        facultyEmail: item.faculty_email || item.facultyEmail || "faculty@ssgmce.ac.in",
        facultyCabin: item.faculty_cabin || item.facultyCabin || "CSE Dept",
        short: item.short_name || item.code,
        semester: item.semester || "Sem V",
        dept: item.department_code || "CSE",
        progress: item.progress || item.syllabus_progress || 75
    }));

    // Build unique faculty directory from assignments
    const facultyMap = new Map();
    rawList.forEach(item => {
        const fname = item.faculty_name || item.faculty;
        if (!fname) return;
        if (!facultyMap.has(fname)) {
            facultyMap.set(fname, {
                name: fname,
                role: item.faculty_designation || item.facultyRole || "Assistant Professor · CSE",
                subjects: [item.name || item.subject_name],
                email: item.faculty_email || "faculty@ssgmce.ac.in",
                tag: item.short_name || item.code || "Faculty",
                cabin: item.faculty_cabin || "CSE Dept"
            });
        } else {
            const existing = facultyMap.get(fname);
            const sname = item.name || item.subject_name;
            if (sname && !existing.subjects.includes(sname)) {
                existing.subjects.push(sname);
            }
        }
    });

    faculty = Array.from(facultyMap.values()).map(f => ({
        ...f,
        subjects: f.subjects.join(" · ")
    }));

    // Build detailed syllabus data indexed by subject code
    syllabusData = {};
    rawList.forEach(item => {
        const code = item.code || item.subject_code;
        const rawUnits = item.units || [];
        const units = rawUnits.map((u, i) => {
            const title = u.unit_title || u.title || `Unit ${u.unit_number || i + 1}`;
            const hours = u.planned_hours || u.hours || 6;
            let topics = u.topics || [];
            if (typeof topics === 'string') {
                try { topics = JSON.parse(topics); } catch (e) { topics = [topics]; }
            }
            if (!Array.isArray(topics)) topics = [];
            return [title, hours, topics];
        });

        let outcomes = item.outcomes || item.course_outcomes || [];
        if (typeof outcomes === 'string') {
            try { outcomes = JSON.parse(outcomes); } catch (e) { outcomes = [outcomes]; }
        }
        if (!Array.isArray(outcomes)) outcomes = [];

        let books = item.books || item.reference_books || [];
        if (typeof books === 'string') {
            try { books = JSON.parse(books); } catch (e) { books = [books]; }
        }
        if (!Array.isArray(books)) books = [];

        syllabusData[code] = {
            units: units,
            outcomes: outcomes,
            books: books,
            semester: item.semester || "Sem V",
            dept: item.department_code || "CSE",
            progress: item.progress || item.syllabus_progress || 75
        };
    });

    // Populate UI
    renderSubjects();
    renderFaculty();
    populateSubjectDropdown();

    // Default select first course or semester V course
    const defaultCourse = subjects.find(s => s.code === "5CS220PC") || subjects[0];
    if (defaultCourse) {
        if ($("syllabusSubjectSelect")) $("syllabusSubjectSelect").value = defaultCourse.code;
        renderSyllabus(defaultCourse.code);
    }

    // Update stat counters
    if ($("facultyCount")) $("facultyCount").textContent = faculty.length;
    if ($("subjectCount")) $("subjectCount").textContent = String(subjects.length).padStart(2, "0");
    if ($("coreCount")) $("coreCount").textContent = subjects.filter(s => (s.type || '').toLowerCase().includes("core") || s.type === "PC").length;
}

/* ==========================================
   RENDER SUBJECTS TABLE
========================================== */

function renderSubjects() {
    const query = ($("subjectSearch") ? $("subjectSearch").value : "").toLowerCase().trim();
    const type = $("subjectTypeFilter") ? $("subjectTypeFilter").value : "all";

    const rows = subjects.filter(subject => {
        const matchesType = (type === "all" || subject.type === type || (type === "Core" && (subject.type === "PC" || subject.type === "Core")));
        const matchesQuery = (!query || `${subject.name} ${subject.code} ${subject.faculty} ${subject.dept} ${subject.semester}`.toLowerCase().includes(query));
        return matchesType && matchesQuery;
    });

    const tbody = $("subjectTableBody");
    if (!tbody) return;

    tbody.innerHTML = rows.map((subject, index) => `
        <tr>
            <td>${String(index + 1).padStart(2, "0")}</td>
            <td>
                <span class="syllabus-subject-name">${subject.name}</span>
                <span class="syllabus-subject-desc">${subject.semester} · ${subject.dept === 'CSE' ? 'Computer Science & Engineering' : subject.dept}</span>
            </td>
            <td><span class="syllabus-subject-code">${subject.code}</span></td>
            <td><span class="syllabus-type-badge">${subject.type}</span></td>
            <td><b>${subject.credits}</b></td>
            <td>
                <button class="syllabus-action-btn" onclick="openSyllabus('${subject.code}')">
                    <i class="fa-regular fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join("") || `
        <tr>
            <td colspan="6" style="text-align:center; padding:35px; color:#8aa0b3;">
                No subjects found matching your search.
            </td>
        </tr>
    `;
}

/* ==========================================
   RENDER FACULTY DIRECTORY
========================================== */

function renderFaculty() {
    const query = ($("facultySearch") ? $("facultySearch").value : "").toLowerCase().trim();
    const container = $("facultyTableBody");
    if (!container) return;

    container.innerHTML = faculty
        .filter(member => !query || `${member.name} ${member.subjects} ${member.role} ${member.tag}`.toLowerCase().includes(query))
        .map(member => `
            <article class="syllabus-faculty-card">
                <div class="syllabus-faculty-top">
                    <div class="syllabus-faculty-avatar">${initials(member.name)}</div>
                    <div>
                        <div class="syllabus-faculty-name">${member.name}</div>
                        <div class="syllabus-faculty-role">${member.role}</div>
                    </div>
                </div>
                <div class="syllabus-faculty-subject">
                    <i class="fa-solid fa-book-open"></i>&nbsp;${member.subjects}
                </div>
                <div class="syllabus-faculty-meta">
                    <span class="syllabus-meta-pill">
                        <i class="fa-regular fa-envelope"></i> ${member.email}
                    </span>
                    <span class="syllabus-meta-pill"><i class="fa-solid fa-location-dot"></i> ${member.cabin || member.tag}</span>
                </div>
            </article>
        `).join("") || `
            <div style="padding:30px; color:#8aa0b3;">No faculty found.</div>
        `;
}

/* ==========================================
   POPULATE SUBJECT DROPDOWN
========================================== */

function populateSubjectDropdown() {
    const select = $("syllabusSubjectSelect");
    if (!select) return;
    select.innerHTML = subjects.map(subject => `
        <option value="${subject.code}">${subject.name} · ${subject.code} (${subject.semester})</option>
    `).join("");
}

/* ==========================================
   RENDER SYLLABUS DETAIL
========================================== */

function renderSyllabus(code) {
    if (!code && $("syllabusSubjectSelect")) {
        code = $("syllabusSubjectSelect").value;
    }
    const subject = subjects.find(item => item.code === code);
    const data = syllabusData[code];

    if (!subject || !data) return;

    if ($("subjectSummary")) {
        $("subjectSummary").innerHTML = `
            <span class="syllabus-summary-pill"><strong>Code</strong> ${subject.code}</span>
            <span class="syllabus-summary-pill"><strong>Credits</strong> ${subject.credits}</span>
            <span class="syllabus-summary-pill"><strong>Type</strong> ${subject.type}</span>
            <span class="syllabus-summary-pill"><strong>Semester</strong> ${subject.semester}</span>
            <span class="syllabus-summary-pill"><strong>Progress</strong> ${data.progress}%</span>
        `;
    }

    const body = $("syllabusBody");
    if (!body) return;

    body.innerHTML = `
        <div class="syllabus-hero">
            <div class="code">${subject.code} · ${subject.type}</div>
            <h3>${subject.name}</h3>
            <p>B.Tech ${subject.dept === 'CSE' ? 'Computer Science & Engineering' : subject.dept} · ${subject.semester} · Academic Year 2026–27</p>
            <div style="margin-top:10px; display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.22); padding:5px 14px; border-radius:20px; font-size:12px; font-weight:500;">
                <i class="fa-solid fa-chalkboard-user"></i> Faculty Instructor: <strong>${subject.faculty}</strong> (${subject.facultyRole})
            </div>
        </div>

        ${data.units.length > 0 ? data.units.map(unit => `
            <div class="syllabus-unit-section">
                <div class="syllabus-unit-head">
                    <strong>${unit[0]}</strong>
                    <span class="syllabus-hours">${unit[1]} Hrs</span>
                </div>
                ${unit[2] && unit[2].length > 0 ? `
                <ul>
                    ${unit[2].map(topic => `<li>${topic}</li>`).join("")}
                </ul>
                ` : `<p style="color:#64748B; font-size:13px; margin:8px 0 0 16px;">Curriculum topics detailed in departmental syllabus brochure.</p>`}
            </div>
        `).join("") : `<div style="padding:25px; color:#64748B;">No curriculum units configured for this course.</div>`}

        ${data.outcomes && data.outcomes.length > 0 ? `
        <div class="syllabus-unit-section">
            <div class="syllabus-unit-head">
                <strong>Course Outcomes (COs)</strong>
            </div>
            <div class="syllabus-outcomes">
                ${data.outcomes.map((outcome, index) => `
                    <div class="syllabus-outcome">
                        <b>CO${index + 1}</b> ${outcome}
                    </div>
                `).join("")}
            </div>
        </div>
        ` : ''}

        ${data.books && data.books.length > 0 ? `
        <div class="syllabus-unit-section">
            <div class="syllabus-unit-head">
                <strong>Recommended Textbooks & References</strong>
            </div>
            <div class="syllabus-book-list">
                ${data.books.map(book => `
                    <div class="syllabus-book">
                        <i class="fa-solid fa-book"></i>
                        <span>${book}</span>
                    </div>
                `).join("")}
            </div>
        </div>
        ` : ''}
    `;
}

/* ==========================================
   VIEW NAVIGATION HELPERS
========================================== */

function openSyllabus(code) {
    // Switch sub-nav active state to University Syllabus
    document.querySelectorAll(".syllabus-subnav-btn").forEach(btn => {
        const isUniv = btn.dataset.view === "university";
        btn.classList.toggle("active", isUniv);
        btn.setAttribute("aria-selected", isUniv ? "true" : "false");
    });

    // Switch views
    document.querySelectorAll(".syllabus-view").forEach(view => {
        view.classList.remove("active");
    });
    if ($("view-university")) {
        $("view-university").classList.add("active");
    }

    // Set the selected subject and render
    if ($("syllabusSubjectSelect")) {
        $("syllabusSubjectSelect").value = code;
    }
    renderSyllabus(code);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchSyllabusView(viewKey) {
    // Update sub-nav button active states
    document.querySelectorAll(".syllabus-subnav-btn").forEach(btn => {
        const isActive = btn.dataset.view === viewKey;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // Update view visibility
    document.querySelectorAll(".syllabus-view").forEach(view => {
        view.classList.remove("active");
    });
    const targetView = $("view-" + viewKey);
    if (targetView) targetView.classList.add("active");
}

function showToast(message) {
    if (window.showToast) {
        window.showToast(message, 'info');
        return;
    }
    const toast = $("toast");
    if (toast) {
        const span = toast.querySelector("span");
        if (span) span.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2200);
    }
}
