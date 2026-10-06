/**
 * SSGMCE Autonomous College ERP - Syllabus Module Script (syllabus.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchAndHydrateLiveSyllabus();
    // Auth Guard & Header Hydration
    if (window.ERPAuth) {
        const session = window.ERPAuth.guard('student');
        if (session && window.ERPAuth.hydrateHeader) {
            window.ERPAuth.hydrateHeader();
        }
    }

    // Initialize Mobile Drawer
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
});

/* ==========================================
           SYLLABUS DATA
        ========================================== */

        const subjects = [
            { name: "Database Management Systems", code: "5IT220PC", type: "Core", credits: 3, faculty: "M. Faizan I. Khandwani", short: "DBMS" },
            { name: "Operating Systems", code: "5IT221PC", type: "Core", credits: 3, faculty: "Sumit Muddalkar", short: "OS" },
            { name: "Theory of Computation", code: "5IT222PC", type: "Core", credits: 3, faculty: "Sumit Muddalkar", short: "ToC" },
            { name: "Data Science & Statistics", code: "5IT223PE", type: "PE1", credits: 3, faculty: "A. S. Manekar", short: "Data Science" },
            { name: "Computer Networks", code: "5IT227MD", type: "MD", credits: 3, faculty: "Rahul Patil", short: "Computer Networks" },
            { name: "Object Oriented Programming", code: "5IT228MD", type: "MD", credits: 3, faculty: "Sneha Kulkarni", short: "OOP" },
            { name: "Fundamentals of Cyber Security", code: "5IT230OE", type: "OE", credits: 3, faculty: "Rohit Joshi", short: "Cyber Security" }
        ];

        const faculty = [
            { name: "M. Faizan I. Khandwani", role: "Assistant Professor · IT", subjects: "Database Management Systems", email: "faizankhandwani@ssgmce.ac.in", tag: "DBMS" },
            { name: "Sumit Muddalkar", role: "Assistant Professor · IT", subjects: "Operating Systems · Theory of Computation", email: "sumitmuddalkar@gmail.com", tag: "OS / ToC" },
            { name: "A. S. Manekar", role: "Faculty · IT", subjects: "Data Science & Statistics", email: "faculty@ssgmce.ac.in", tag: "Data Science · Demo" },
            { name: "Rahul Patil", role: "Faculty · IT", subjects: "Computer Networks", email: "faculty@ssgmce.ac.in", tag: "Networks · Demo" },
            { name: "Sneha Kulkarni", role: "Faculty · IT", subjects: "Object Oriented Programming", email: "faculty@ssgmce.ac.in", tag: "OOP · Demo" },
            { name: "Rohit Joshi", role: "Faculty · IT", subjects: "Fundamentals of Cyber Security", email: "faculty@ssgmce.ac.in", tag: "Cyber Security · Demo" },
            { name: "Dr. S. D. Padiya", role: "Associate Professor & Head · IT", subjects: "Information Technology Department", email: "sdpadiya@ssgmce.ac.in", tag: "HOD" }
        ];

        const syllabusData = {
            "5IT220PC": {
                units: [
                    ["Unit I · Introduction to DBMS", 7, ["Database system concepts and architecture", "Data models and database schemas", "ER model and ER diagrams", "Relational model, keys and constraints", "Relational algebra fundamentals"]],
                    ["Unit II · SQL & Normalization", 8, ["SQL, DDL, DML and DCL", "Operators, aggregate functions, GROUP BY and HAVING", "Joins and nested queries", "Functional dependencies", "1NF, 2NF, 3NF and BCNF"]],
                    ["Unit III · Transactions & Concurrency", 7, ["Transaction concepts and states", "ACID properties", "Serializability and schedules", "Lock-based concurrency control", "Deadlocks and recovery"]],
                    ["Unit IV · Indexing & Storage", 6, ["File and storage organization", "Primary and secondary indexes", "Dense and sparse indexes", "B-tree and B+ tree", "Hashing techniques"]],
                    ["Unit V · NoSQL & Emerging Trends", 6, ["Need for NoSQL databases", "Document and key-value databases", "Column-family and graph databases", "Distributed database concepts", "Emerging database technologies"]]
                ],
                outcomes: ["Design an ER model for a database application", "Write SQL queries for database operations", "Apply normalization using functional dependencies", "Explain transactions and concurrency control"],
                books: ["Abraham Silberschatz, Henry Korth & S. Sudarshan — Database System Concepts", "Ramez Elmasri & Shamkant Navathe — Fundamentals of Database Systems"]
            },
            "5IT221PC": {
                units: [
                    ["Unit I · Operating System Basics", 7, ["OS functions and services", "System calls and system programs", "OS structures and architectures", "Processes and process states"]],
                    ["Unit II · Process Management", 8, ["Process scheduling", "Threads and multithreading", "Inter-process communication", "Synchronization and critical sections"]],
                    ["Unit III · Memory Management", 7, ["Contiguous allocation", "Paging and segmentation", "Virtual memory", "Page replacement algorithms"]],
                    ["Unit IV · File & Storage Management", 6, ["File system concepts", "Directory structures", "File allocation methods", "Disk scheduling"]],
                    ["Unit V · Protection & Security", 6, ["Protection mechanisms", "Access control", "Security threats", "Authentication and system security"]]
                ],
                outcomes: ["Explain OS structures and services", "Apply CPU scheduling concepts", "Explain memory management and virtual memory", "Understand file, storage and protection mechanisms"],
                books: ["Silberschatz, Galvin & Gagne — Operating System Concepts", "Andrew S. Tanenbaum — Modern Operating Systems"]
            },
            "5IT222PC": {
                units: [
                    ["Unit I · Finite Automata", 7, ["Alphabet, strings and languages", "DFA and NFA", "Regular expressions", "Equivalence of automata"]],
                    ["Unit II · Regular Languages", 7, ["Regular grammars", "Closure properties", "Pumping lemma", "Applications of regular languages"]],
                    ["Unit III · Context Free Grammars", 8, ["CFG and derivations", "Parse trees", "Ambiguity", "Normal forms"]],
                    ["Unit IV · Pushdown Automata", 7, ["PDA definition", "Acceptance by PDA", "CFG and PDA equivalence", "Deterministic PDA"]],
                    ["Unit V · Turing Machines", 6, ["TM model and languages", "Variants of Turing machines", "Decidability", "Undecidability and complexity basics"]]
                ],
                outcomes: ["Construct finite automata for regular languages", "Use regular expressions and grammars", "Design and analyze pushdown automata", "Explain Turing machines and decidability"],
                books: ["John C. Martin — Introduction to Languages and the Theory of Computation", "Michael Sipser — Introduction to the Theory of Computation"]
            },
            "5IT223PE": {
                units: [
                    ["Unit I · Data Science Foundations", 7, ["Data science lifecycle", "Types of data", "Data collection and cleaning", "Exploratory data analysis"]],
                    ["Unit II · Statistics", 7, ["Descriptive statistics", "Probability distributions", "Sampling and estimation", "Hypothesis testing"]],
                    ["Unit III · Data Visualization", 6, ["Visualization principles", "Charts and plots", "Dashboards", "Storytelling with data"]],
                    ["Unit IV · Predictive Analytics", 8, ["Correlation and regression", "Classification basics", "Model evaluation", "Feature preparation"]],
                    ["Unit V · Practical Data Science", 6, ["Python data tools", "Case studies", "Data ethics", "Communicating results"]]
                ],
                outcomes: ["Prepare and explore datasets", "Apply basic statistical methods", "Create meaningful visualizations", "Interpret analytical results"],
                books: ["Wes McKinney — Python for Data Analysis", "Joel Grus — Data Science from Scratch"]
            },
            "5IT227MD": {
                units: [
                    ["Unit I · Networking Foundations", 7, ["Network models and protocols", "OSI and TCP/IP models", "Physical and data link concepts"]],
                    ["Unit II · Data Link & LAN", 7, ["Ethernet and switching", "MAC addressing", "Error detection", "LAN technologies"]],
                    ["Unit III · Network Layer", 8, ["IPv4 and IPv6", "Routing concepts", "ARP and ICMP", "Routing algorithms"]],
                    ["Unit IV · Transport Layer", 7, ["TCP and UDP", "Flow and congestion control", "Ports and sockets"]],
                    ["Unit V · Application Layer", 6, ["DNS and HTTP", "Email protocols", "DHCP", "Network applications"]]
                ],
                outcomes: ["Explain network architectures and protocols", "Understand LAN and routing concepts", "Compare TCP and UDP", "Explain common application protocols"],
                books: ["Andrew S. Tanenbaum — Computer Networks", "Behrouz A. Forouzan — Data Communications and Networking"]
            },
            "5IT228MD": {
                units: [
                    ["Unit I · OOP Fundamentals", 7, ["Objects and classes", "Encapsulation", "Abstraction", "Constructors and methods"]],
                    ["Unit II · Inheritance & Polymorphism", 7, ["Inheritance types", "Method overriding", "Polymorphism", "Interfaces"]],
                    ["Unit III · Exception & File Handling", 7, ["Exception hierarchy", "Custom exceptions", "Streams and files", "Serialization"]],
                    ["Unit IV · Collections & Generics", 7, ["Collections framework", "Lists, sets and maps", "Generics", "Iterators"]],
                    ["Unit V · Software Design", 6, ["Packages and modules", "Design principles", "Reusable components", "Basic testing"]]
                ],
                outcomes: ["Apply object-oriented principles", "Use inheritance and polymorphism", "Handle exceptions and files", "Build reusable object-oriented programs"],
                books: ["Herbert Schildt — Java: The Complete Reference", "Robert C. Martin — Clean Code"]
            },
            "5IT230OE": {
                units: [
                    ["Unit I · Cyber Security Foundations", 7, ["Security goals and principles", "Threats and vulnerabilities", "Security policies", "Risk basics"]],
                    ["Unit II · Cryptography", 7, ["Symmetric encryption", "Asymmetric encryption", "Hash functions", "Digital signatures"]],
                    ["Unit III · Network Security", 7, ["Firewalls", "IDS and IPS", "Secure protocols", "Wireless security"]],
                    ["Unit IV · Application Security", 7, ["Web threats", "Authentication and authorization", "Secure coding", "Data protection"]],
                    ["Unit V · Cyber Law & Best Practices", 6, ["Cyber incidents", "Privacy principles", "Cyber law basics", "Security awareness"]]
                ],
                outcomes: ["Identify common cyber threats", "Explain basic cryptographic mechanisms", "Understand network security controls", "Apply secure computing practices"],
                books: ["William Stallings — Cryptography and Network Security", "William Easttom — Computer Security Fundamentals"]
            }
        };

        /* ==========================================
           HELPER FUNCTIONS
        ========================================== */

        const $ = id => document.getElementById(id);

        const initials = name =>
            name.split(" ").filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();

        /* ==========================================
           RENDER SUBJECTS
        ========================================== */

        function renderSubjects() {
            const query = $("subjectSearch").value.toLowerCase().trim();
            const type = $("subjectTypeFilter").value;

            const rows = subjects.filter(subject =>
                (type === "all" || subject.type === type) &&
                (!query || `${subject.name} ${subject.code} ${subject.faculty}`.toLowerCase().includes(query))
            );

            $("subjectTableBody").innerHTML = rows.map((subject, index) => `
                <tr>
                    <td>${String(index + 1).padStart(2, "0")}</td>
                    <td>
                        <span class="syllabus-subject-name">${subject.name}</span>
                        <span class="syllabus-subject-desc">Semester V · Information Technology</span>
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
                        No subjects found.
                    </td>
                </tr>
            `;
        }

        /* ==========================================
           RENDER FACULTY
        ========================================== */

        function renderFaculty() {
            const query = $("facultySearch").value.toLowerCase().trim();

            $("facultyTableBody").innerHTML = faculty
                .filter(member => `${member.name} ${member.subjects} ${member.tag}`.toLowerCase().includes(query))
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
                            <span class="syllabus-meta-pill">${member.tag}</span>
                        </div>
                    </article>
                `).join("") || `
                    <div style="padding:30px; color:#8aa0b3;">No faculty found.</div>
                `;
        }

        /* ==========================================
           SUBJECT DROPDOWN
        ========================================== */

        function populateSubjectDropdown() {
            $("syllabusSubjectSelect").innerHTML = subjects.map(subject => `
                <option value="${subject.code}">${subject.name} · ${subject.code}</option>
            `).join("");
        }

        /* ==========================================
           RENDER SYLLABUS
        ========================================== */

        function renderSyllabus(code = $("syllabusSubjectSelect").value) {
            const subject = subjects.find(item => item.code === code);
            const data = syllabusData[code];

            if (!subject || !data) return;

            $("subjectSummary").innerHTML = `
                <span class="syllabus-summary-pill"><strong>Code</strong> ${subject.code}</span>
                <span class="syllabus-summary-pill"><strong>Credits</strong> ${subject.credits}</span>
                <span class="syllabus-summary-pill"><strong>Type</strong> ${subject.type}</span>
            `;

            $("syllabusBody").innerHTML = `
                <div class="syllabus-hero">
                    <div class="code">${subject.code} · ${subject.type}</div>
                    <h3>${subject.name}</h3>
                    <p>B.E. Information Technology · Semester V · Academic Year 2026–27</p>
                </div>
                ${data.units.map(unit => `
                    <div class="syllabus-unit-section">
                        <div class="syllabus-unit-head">
                            <strong>${unit[0]}</strong>
                            <span class="syllabus-hours">${unit[1]} Hrs</span>
                        </div>
                        <ul>
                            ${unit[2].map(topic => `<li>${topic}</li>`).join("")}
                        </ul>
                    </div>
                `).join("")}
                <div class="syllabus-unit-section">
                    <div class="syllabus-unit-head">
                        <strong>Course Outcomes</strong>
                    </div>
                    <div class="syllabus-outcomes">
                        ${data.outcomes.map((outcome, index) => `
                            <div class="syllabus-outcome">
                                <b>CO${index + 1}</b> ${outcome}
                            </div>
                        `).join("")}
                    </div>
                </div>
                <div class="syllabus-unit-section">
                    <div class="syllabus-unit-head">
                        <strong>Recommended Books</strong>
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
            `;
        }

        /* ==========================================
           OPEN SYLLABUS (from View button in subjects table)
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
            $("view-university").classList.add("active");

            // Set the selected subject and render
            $("syllabusSubjectSelect").value = code;
            renderSyllabus(code);

            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        /* ==========================================
           SWITCH SYLLABUS VIEW (via sub-nav buttons)
        ========================================== */

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

        /* ==========================================
           TOAST (delegates to dashboard toast if available)
        ========================================== */

        function showToast(message) {
            if (window.showToast) {
                window.showToast(message, 'info');
                return;
            }
            const toast = $("toast");
            if (toast) {
                toast.querySelector("span").textContent = message;
                toast.classList.add("show");
                setTimeout(() => toast.classList.remove("show"), 2200);
            }
        }

        /* ==========================================
           DOM READY
        ========================================== */

        document.addEventListener("DOMContentLoaded", () => {
            /* SUBJECTS */
            renderSubjects();

            /* FACULTY */
            renderFaculty();

            /* DROPDOWN */
            populateSubjectDropdown();

            /* DEFAULT SYLLABUS */
            renderSyllabus(subjects[0].code);

            /* SEARCH */
            $("subjectSearch").addEventListener("input", renderSubjects);

            /* SUBJECT FILTER */
            $("subjectTypeFilter").addEventListener("change", renderSubjects);

            /* FACULTY SEARCH */
            $("facultySearch").addEventListener("input", renderFaculty);

            /* SYLLABUS SELECT */
            $("syllabusSubjectSelect").addEventListener("change", event => {
                renderSyllabus(event.target.value);
            });

            /* SUB-NAVIGATION BUTTONS (Subjects / Faculty / University Syllabus) */
            document.querySelectorAll(".syllabus-subnav-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    switchSyllabusView(btn.dataset.view);
                });
            });

            /* PRINT */
            $("printSyllabus").addEventListener("click", () => {
                window.print();
            });

            /* STAT COUNTS */
            $("facultyCount").textContent = faculty.length;
            $("subjectCount").textContent = String(subjects.length).padStart(2, "0");
            $("coreCount").textContent = subjects.filter(subject => subject.type === "Core").length;

            /* Mark Syllabus sidebar link as active */
            document.querySelectorAll('.sidebar-link[data-nav="syllabus"]').forEach(link => {
                link.classList.add('active');
            });
        });

async function fetchAndHydrateLiveSyllabus() {
    try {
        if (typeof window.StudentApi === 'undefined' || typeof window.StudentApi.getSyllabus !== 'function') return;
        const res = await window.StudentApi.getSyllabus();
        if (!res || !res.data || res.data.length === 0) return;

        const liveList = res.data;
        const tbody = document.querySelector('.syllabus-data-table tbody, .table-body, tbody');
        if (tbody) {
            let html = '';
            liveList.forEach(s => {
                const code = s.subjectCode || s.code || 'CS-301';
                const name = s.subjectName || s.name || 'Course';
                const credits = s.credits || 4.0;
                const faculty = s.faculty?.name || s.faculty || 'Faculty Advisor';
                const progress = s.syllabusProgress || 80;

                html += `
                    <tr>
                        <td><strong>${code}</strong></td>
                        <td>${name}</td>
                        <td>${credits}</td>
                        <td>Core Theory + Lab</td>
                        <td>${faculty}</td>
                        <td><span class="badge ${progress >= 75 ? 'badge-cyan' : 'badge-warning'}">${progress}% Covered</span></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    } catch (e) {
        console.warn('Error fetching live syllabus data:', e);
    }
}
