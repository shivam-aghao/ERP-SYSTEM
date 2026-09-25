/* =========================================================
   SSGMCE COLLEGE ERP
   SYLLABUS MODULE
   JAVASCRIPT
========================================================= */


/* =========================================================
   HELPER
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   SUBJECT DATA
========================================================= */

const subjects = [

    {
        id: 1,
        name: "Database Management Systems",
        code: "5IT220PC",
        type: "Core",
        credits: 3,
        faculty: "M. Faizan I. Khandwani",
        short: "Database systems, SQL, normalization, transactions and indexing."
    },

    {
        id: 2,
        name: "Operating Systems",
        code: "5IT221PC",
        type: "Core",
        credits: 3,
        faculty: "Sumit Muddalkar",
        short: "Processes, memory management, file systems and OS security."
    },

    {
        id: 3,
        name: "Theory of Computation",
        code: "5IT222PC",
        type: "Core",
        credits: 3,
        faculty: "Sumit Muddalkar",
        short: "Automata, regular languages, grammars, PDA and Turing machines."
    },

    {
        id: 4,
        name: "Data Science & Statistics",
        code: "5IT223PE",
        type: "PE1",
        credits: 3,
        faculty: "A. S. Manekar",
        short: "Statistics, data analysis, visualization and predictive analytics."
    },

    {
        id: 5,
        name: "Computer Networks",
        code: "5IT227MD",
        type: "MD",
        credits: 3,
        faculty: "Rahul Patil",
        short: "Networking models, LAN, routing, transport and application protocols."
    },

    {
        id: 6,
        name: "Object Oriented Programming",
        code: "5IT228MD",
        type: "MD",
        credits: 3,
        faculty: "Sneha Kulkarni",
        short: "Classes, objects, inheritance, polymorphism, collections and design."
    },

    {
        id: 7,
        name: "Fundamentals of Cyber Security",
        code: "5IT230OE",
        type: "OE",
        credits: 3,
        faculty: "Rohit Joshi",
        short: "Cyber threats, cryptography, network security and secure practices."
    }

];


/* =========================================================
   FACULTY DATA
========================================================= */

const faculty = [

    {
        name: "M. Faizan I. Khandwani",
        role: "Assistant Professor · IT",
        subjects: "Database Management Systems",
        email: "faizankhandwani@ssgmce.ac.in",
        tag: "DBMS"
    },

    {
        name: "Sumit Muddalkar",
        role: "Assistant Professor · IT",
        subjects: "Operating Systems · Theory of Computation",
        email: "sumitmuddalkar@gmail.com",
        tag: "OS / ToC"
    },

    {
        name: "A. S. Manekar",
        role: "Faculty · IT",
        subjects: "Data Science & Statistics",
        email: "faculty@ssgmce.ac.in",
        tag: "Data Science · Demo"
    },

    {
        name: "Rahul Patil",
        role: "Faculty · IT",
        subjects: "Computer Networks",
        email: "faculty@ssgmce.ac.in",
        tag: "Networks · Demo"
    },

    {
        name: "Sneha Kulkarni",
        role: "Faculty · IT",
        subjects: "Object Oriented Programming",
        email: "faculty@ssgmce.ac.in",
        tag: "OOP · Demo"
    },

    {
        name: "Rohit Joshi",
        role: "Faculty · IT",
        subjects: "Fundamentals of Cyber Security",
        email: "faculty@ssgmce.ac.in",
        tag: "Cyber Security · Demo"
    },

    {
        name: "Dr. S. D. Padiya",
        role: "Associate Professor & Head · IT",
        subjects: "Information Technology Department",
        email: "sdpadiya@ssgmce.ac.in",
        tag: "HOD"
    }

];


/* =========================================================
   UNIVERSITY SYLLABUS DATA
========================================================= */

const syllabusData = {

    "5IT220PC": {

        name: "Database Management Systems",
        code: "5IT220PC",
        type: "Core",
        credits: 3,

        units: [

            {
                title: "Unit I — Introduction to DBMS",
                hours: 7,

                topics: [
                    "Database system concepts and architecture",
                    "Data models and database schemas",
                    "ER model and ER diagrams",
                    "Relational model, keys and constraints",
                    "Relational algebra fundamentals"
                ]
            },

            {
                title: "Unit II — SQL & Normalization",
                hours: 8,

                topics: [
                    "SQL, DDL, DML and DCL",
                    "Operators, aggregate functions, GROUP BY and HAVING",
                    "Joins and nested queries",
                    "Functional dependencies",
                    "1NF, 2NF, 3NF and BCNF"
                ]
            },

            {
                title: "Unit III — Transactions & Concurrency",
                hours: 7,

                topics: [
                    "Transaction concepts and states",
                    "ACID properties",
                    "Serializability and schedules",
                    "Lock-based concurrency control",
                    "Deadlocks and recovery"
                ]
            },

            {
                title: "Unit IV — Indexing & Storage",
                hours: 6,

                topics: [
                    "File and storage organization",
                    "Primary and secondary indexes",
                    "Dense and sparse indexes",
                    "B-tree and B+ tree",
                    "Hashing techniques"
                ]
            },

            {
                title: "Unit V — NoSQL & Emerging Trends",
                hours: 6,

                topics: [
                    "Need for NoSQL databases",
                    "Document and key-value databases",
                    "Column-family and graph databases",
                    "Distributed database concepts",
                    "Emerging database technologies"
                ]
            }

        ],

        outcomes: [
            "Design an ER model",
            "Write SQL queries",
            "Apply normalization",
            "Explain transactions and concurrency"
        ],

        books: [
            "Silberschatz, Korth & Sudarshan — Database System Concepts",
            "Elmasri & Navathe — Fundamentals of Database Systems"
        ]

    },


    /* =====================================================
       OPERATING SYSTEMS
    ===================================================== */

    "5IT221PC": {

        name: "Operating Systems",
        code: "5IT221PC",
        type: "Core",
        credits: 3,

        units: [

            {
                title: "Unit I — OS Basics",
                hours: 7,

                topics: [
                    "OS functions and services",
                    "System calls and system programs",
                    "OS structures and architectures",
                    "Processes and process states"
                ]
            },

            {
                title: "Unit II — Process Management",
                hours: 8,

                topics: [
                    "CPU scheduling",
                    "Threads",
                    "Inter-process communication",
                    "Process synchronization"
                ]
            },

            {
                title: "Unit III — Memory Management",
                hours: 7,

                topics: [
                    "Contiguous memory allocation",
                    "Paging and segmentation",
                    "Virtual memory",
                    "Page replacement algorithms"
                ]
            },

            {
                title: "Unit IV — File & Storage",
                hours: 6,

                topics: [
                    "File systems",
                    "Directories",
                    "File allocation methods",
                    "Disk scheduling"
                ]
            },

            {
                title: "Unit V — Protection & Security",
                hours: 6,

                topics: [
                    "Protection mechanisms",
                    "Access control",
                    "Security threats",
                    "Authentication and security"
                ]
            }

        ],

        outcomes: [
            "Explain OS structures and services",
            "Apply CPU scheduling techniques",
            "Explain memory management and virtual memory",
            "Understand file, storage and protection mechanisms"
        ],

        books: [
            "Silberschatz, Galvin & Gagne — Operating System Concepts",
            "Tanenbaum — Modern Operating Systems"
        ]

    },


    /* =====================================================
       THEORY OF COMPUTATION
    ===================================================== */

    "5IT222PC": {

        name: "Theory of Computation",
        code: "5IT222PC",
        type: "Core",
        credits: 3,

        units: [

            {
                title: "Unit I — Finite Automata",
                hours: 7,

                topics: [
                    "Alphabet, strings and languages",
                    "DFA and NFA",
                    "Regular expressions",
                    "Equivalence of automata"
                ]
            },

            {
                title: "Unit II — Regular Languages",
                hours: 7,

                topics: [
                    "Regular grammars",
                    "Closure properties",
                    "Pumping lemma",
                    "Applications of regular languages"
                ]
            },

            {
                title: "Unit III — Context Free Grammar",
                hours: 8,

                topics: [
                    "CFG and derivations",
                    "Parse trees",
                    "Ambiguity",
                    "Normal forms"
                ]
            },

            {
                title: "Unit IV — Pushdown Automata",
                hours: 7,

                topics: [
                    "Definition of PDA",
                    "Acceptance by PDA",
                    "CFG and PDA equivalence",
                    "Deterministic PDA"
                ]
            },

            {
                title: "Unit V — Turing Machines",
                hours: 6,

                topics: [
                    "Turing machine model and languages",
                    "Variants of Turing machines",
                    "Decidability",
                    "Undecidability and complexity basics"
                ]
            }

        ],

        outcomes: [
            "Construct finite automata",
            "Use regular expressions and grammars",
            "Design and analyze pushdown automata",
            "Explain Turing machines and decidability"
        ],

        books: [
            "John C. Martin — Introduction to Languages and the Theory of Computation",
            "Michael Sipser — Introduction to the Theory of Computation"
        ]

    },


    /* =====================================================
       DATA SCIENCE
    ===================================================== */

    "5IT223PE": {

        name: "Data Science & Statistics",
        code: "5IT223PE",
        type: "PE1",
        credits: 3,

        units: [

            {
                title: "Unit I — Foundations",
                hours: 7,

                topics: [
                    "Data science lifecycle",
                    "Data types",
                    "Data collection and cleaning",
                    "Exploratory data analysis"
                ]
            },

            {
                title: "Unit II — Statistics",
                hours: 7,

                topics: [
                    "Descriptive statistics",
                    "Probability",
                    "Sampling and estimation",
                    "Hypothesis testing"
                ]
            },

            {
                title: "Unit III — Visualization",
                hours: 6,

                topics: [
                    "Principles of data visualization",
                    "Charts and plots",
                    "Dashboards",
                    "Data storytelling"
                ]
            },

            {
                title: "Unit IV — Predictive Analytics",
                hours: 8,

                topics: [
                    "Correlation and regression",
                    "Classification",
                    "Model evaluation",
                    "Feature preparation"
                ]
            },

            {
                title: "Unit V — Practical",
                hours: 6,

                topics: [
                    "Python tools for data science",
                    "Case studies",
                    "Ethics in data science",
                    "Communicating analytical results"
                ]
            }

        ],

        outcomes: [
            "Prepare and explore datasets",
            "Apply statistical techniques",
            "Create meaningful visualizations",
            "Interpret data science results"
        ],

        books: [
            "Wes McKinney — Python for Data Analysis",
            "Joel Grus — Data Science from Scratch"
        ]

    },


    /* =====================================================
       COMPUTER NETWORKS
    ===================================================== */

    "5IT227MD": {

        name: "Computer Networks",
        code: "5IT227MD",
        type: "MD",
        credits: 3,

        units: [

            {
                title: "Unit I — Foundations",
                hours: 7,

                topics: [
                    "Network models and protocols",
                    "OSI and TCP/IP models",
                    "Physical layer",
                    "Data link layer"
                ]
            },

            {
                title: "Unit II — Data Link & LAN",
                hours: 7,

                topics: [
                    "Ethernet and switching",
                    "MAC addressing",
                    "Error detection",
                    "Local Area Networks"
                ]
            },

            {
                title: "Unit III — Network Layer",
                hours: 8,

                topics: [
                    "IPv4 and IPv6",
                    "Routing",
                    "ARP and ICMP",
                    "Routing algorithms"
                ]
            },

            {
                title: "Unit IV — Transport",
                hours: 7,

                topics: [
                    "TCP and UDP",
                    "Flow control",
                    "Congestion control",
                    "Ports and sockets"
                ]
            },

            {
                title: "Unit V — Application",
                hours: 6,

                topics: [
                    "DNS and HTTP",
                    "Email protocols",
                    "DHCP",
                    "Common network applications"
                ]
            }

        ],

        outcomes: [
            "Explain network architectures and protocols",
            "Understand LAN technologies and routing",
            "Compare TCP and UDP",
            "Explain common application layer protocols"
        ],

        books: [
            "Tanenbaum — Computer Networks",
            "Forouzan — Data Communications and Networking"
        ]

    },


    /* =====================================================
       OOP
    ===================================================== */

    "5IT228MD": {

        name: "Object Oriented Programming",
        code: "5IT228MD",
        type: "MD",
        credits: 3,

        units: [

            {
                title: "Unit I — OOP Fundamentals",
                hours: 7,

                topics: [
                    "Objects and classes",
                    "Encapsulation",
                    "Abstraction",
                    "Constructors and methods"
                ]
            },

            {
                title: "Unit II — Inheritance & Polymorphism",
                hours: 7,

                topics: [
                    "Types of inheritance",
                    "Method overriding",
                    "Polymorphism",
                    "Interfaces"
                ]
            },

            {
                title: "Unit III — Exception & File Handling",
                hours: 7,

                topics: [
                    "Exception hierarchy",
                    "Custom exceptions",
                    "Streams and files",
                    "Serialization"
                ]
            },

            {
                title: "Unit IV — Collections & Generics",
                hours: 7,

                topics: [
                    "Collection framework",
                    "Lists, sets and maps",
                    "Generics",
                    "Iterators"
                ]
            },

            {
                title: "Unit V — Software Design",
                hours: 6,

                topics: [
                    "Packages and modules",
                    "Software design principles",
                    "Reusable components",
                    "Testing"
                ]
            }

        ],

        outcomes: [
            "Apply object-oriented programming concepts",
            "Use inheritance and polymorphism",
            "Handle exceptions and files",
            "Build reusable object-oriented programs"
        ],

        books: [
            "Herbert Schildt — Java: The Complete Reference",
            "Robert C. Martin — Clean Code"
        ]

    },


    /* =====================================================
       CYBER SECURITY
    ===================================================== */

    "5IT230OE": {

        name: "Fundamentals of Cyber Security",
        code: "5IT230OE",
        type: "OE",
        credits: 3,

        units: [

            {
                title: "Unit I — Foundations",
                hours: 7,

                topics: [
                    "Security goals and principles",
                    "Threats and vulnerabilities",
                    "Security policies",
                    "Risk management"
                ]
            },

            {
                title: "Unit II — Cryptography",
                hours: 7,

                topics: [
                    "Symmetric cryptography",
                    "Asymmetric cryptography",
                    "Hash functions",
                    "Digital signatures"
                ]
            },

            {
                title: "Unit III — Network Security",
                hours: 7,

                topics: [
                    "Firewalls",
                    "IDS and IPS",
                    "Secure protocols",
                    "Wireless security"
                ]
            },

            {
                title: "Unit IV — Application Security",
                hours: 7,

                topics: [
                    "Web security threats",
                    "Authentication and authorization",
                    "Secure coding",
                    "Data protection"
                ]
            },

            {
                title: "Unit V — Cyber Law & Best Practices",
                hours: 6,

                topics: [
                    "Cyber security incidents",
                    "Privacy",
                    "Cyber law basics",
                    "Security awareness"
                ]
            }

        ],

        outcomes: [
            "Identify common cyber security threats",
            "Explain cryptographic techniques",
            "Understand network security controls",
            "Apply secure computing practices"
        ],

        books: [
            "William Stallings — Cryptography and Network Security",
            "Easttom — Computer Security Fundamentals"
        ]

    }

};


/* =========================================================
   INITIALS
========================================================= */

function initials(name) {

    if (!name) {
        return "NA";
    }

    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {
        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects() {

    const tbody = $("subjectTableBody");

    if (!tbody) {
        return;
    }


    const searchInput = $("subjectSearch");

    const filterInput = $("subjectTypeFilter");


    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";


    const filter = filterInput
        ? filterInput.value
        : "all";


    const filteredSubjects = subjects.filter((subject) => {

        const matchesSearch =
            subject.name.toLowerCase().includes(search) ||
            subject.code.toLowerCase().includes(search) ||
            subject.type.toLowerCase().includes(search) ||
            subject.faculty.toLowerCase().includes(search);


        const matchesFilter =
            filter === "all" ||
            subject.type === filter;


        return matchesSearch && matchesFilter;

    });


    if (filteredSubjects.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:35px;
                        color:#647F9C;
                    "
                >

                    <i
                        class="fa-solid fa-magnifying-glass"
                        style="
                            margin-right:6px;
                            color:#0B5CAD;
                        "
                    ></i>

                    No subjects found.

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML = filteredSubjects.map((subject, index) => {

        return `

            <tr>

                <td>
                    ${String(index + 1).padStart(2, "0")}
                </td>


                <td>

                    <span class="subject-name">
                        ${subject.name}
                    </span>

                    <span class="subject-desc">
                        Semester V · Information Technology
                    </span>

                </td>


                <td>

                    <span class="subject-code">
                        ${subject.code}
                    </span>

                </td>


                <td>

                    <span class="type-badge">
                        ${subject.type}
                    </span>

                </td>


                <td>

                    <strong>
                        ${subject.credits}
                    </strong>

                </td>


                <td>

                    <button
                        class="action-btn"
                        type="button"
                        onclick="openSyllabus('${subject.code}')"
                    >

                        <i class="fa-regular fa-eye"></i>

                        View

                    </button>

                </td>

            </tr>

        `;

    }).join("");

}


/* =========================================================
   RENDER FACULTY
========================================================= */

function renderFaculty() {

    const container = $("facultyTableBody");

    if (!container) {
        return;
    }


    const searchInput = $("facultySearch");

    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";


    const filteredFaculty = faculty.filter((person) => {

        return (
            person.name.toLowerCase().includes(search) ||
            person.role.toLowerCase().includes(search) ||
            person.subjects.toLowerCase().includes(search) ||
            person.email.toLowerCase().includes(search) ||
            person.tag.toLowerCase().includes(search)
        );

    });


    if (filteredFaculty.length === 0) {

        container.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:40px;
                    color:#647F9C;
                    font-size:11px;
                "
            >

                <i
                    class="fa-solid fa-user-slash"
                    style="
                        display:block;
                        font-size:24px;
                        color:#0B5CAD;
                        margin-bottom:10px;
                    "
                ></i>

                No faculty found.

            </div>

        `;

        return;
    }


    container.innerHTML = filteredFaculty.map((person) => {

        return `

            <article class="faculty-card">


                <div class="faculty-top">

                    <div class="faculty-avatar">
                        ${initials(person.name)}
                    </div>


                    <div>

                        <div class="faculty-name">
                            ${person.name}
                        </div>

                        <div class="faculty-role">
                            ${person.role}
                        </div>

                    </div>

                </div>



                <div class="faculty-subject">

                    <i class="fa-solid fa-book-open"></i>

                    ${person.subjects}

                </div>



                <div class="faculty-meta">

                    <span class="meta-pill">

                        <i class="fa-regular fa-envelope"></i>

                        ${person.email}

                    </span>


                    <span class="meta-pill">

                        ${person.tag}

                    </span>

                </div>


            </article>

        `;

    }).join("");

}


/* =========================================================
   POPULATE SUBJECT DROPDOWN
========================================================= */

function populateSubjectDropdown() {

    const select = $("syllabusSubjectSelect");

    if (!select) {
        return;
    }


    select.innerHTML = subjects.map((subject) => {

        return `

            <option value="${subject.code}">
                ${subject.name} (${subject.code})
            </option>

        `;

    }).join("");


    if (subjects.length > 0) {

        select.value =
            subjects[0].code;

    }

}


/* =========================================================
   RENDER SYLLABUS
========================================================= */

function renderSyllabus(code) {

    const body = $("syllabusBody");

    const summary = $("subjectSummary");


    if (!body) {
        return;
    }


    const data = syllabusData[code];


    if (!data) {

        body.innerHTML = `

            <div
                style="
                    padding:40px;
                    text-align:center;
                    color:#647F9C;
                "
            >
                Syllabus not available.
            </div>

        `;

        if (summary) {
            summary.innerHTML = "";
        }

        return;
    }


    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    if (summary) {

        summary.innerHTML = `

            <span class="summary-pill">

                <strong>
                    Code:
                </strong>

                ${data.code}

            </span>


            <span class="summary-pill">

                <strong>
                    Type:
                </strong>

                ${data.type}

            </span>


            <span class="summary-pill">

                <strong>
                    Credits:
                </strong>

                ${data.credits}

            </span>

        `;

    }


    /* -----------------------------------------
       UNITS
    ----------------------------------------- */

    const unitsHTML = data.units.map((unit) => {

        const topicsHTML = unit.topics.map((topic) => {

            return `
                <li>
                    ${topic}
                </li>
            `;

        }).join("");


        return `

            <div class="syllabus-section">


                <div class="syllabus-section-head">

                    <strong>
                        ${unit.title}
                    </strong>


                    <span class="hours">
                        ${unit.hours} Hrs
                    </span>

                </div>


                <ul>
                    ${topicsHTML}
                </ul>


            </div>

        `;

    }).join("");


    /* -----------------------------------------
       OUTCOMES
    ----------------------------------------- */

    const outcomesHTML = data.outcomes.map((outcome, index) => {

        return `

            <div class="outcome">

                <b>
                    CO${index + 1}
                </b>

                ${outcome}

            </div>

        `;

    }).join("");


    /* -----------------------------------------
       BOOKS
    ----------------------------------------- */

    const booksHTML = data.books.map((book) => {

        return `

            <div class="book">

                <i class="fa-solid fa-book"></i>

                ${book}

            </div>

        `;

    }).join("");


    /* -----------------------------------------
       COMPLETE SYLLABUS
    ----------------------------------------- */

    body.innerHTML = `


        <!-- Syllabus Hero -->

        <div class="syllabus-hero">

            <div class="code">
                ${data.code}
            </div>


            <h3>
                ${data.name}
            </h3>


            <p>
                Semester V · Information Technology ·
                ${data.credits} Credits · ${data.type}
            </p>

        </div>



        <!-- Course Units -->

        ${unitsHTML}



        <!-- Course Outcomes -->

        <div class="syllabus-section">

            <div class="syllabus-section-head">

                <strong>
                    Course Outcomes
                </strong>

                <span class="hours">
                    CO
                </span>

            </div>


            <div class="outcomes">

                ${outcomesHTML}

            </div>

        </div>



        <!-- Reference Books -->

        <div class="syllabus-section">

            <div class="syllabus-section-head">

                <strong>
                    Recommended Books
                </strong>

                <span class="hours">
                    References
                </span>

            </div>


            <div class="book-list">

                ${booksHTML}

            </div>

        </div>

    `;

}


/* =========================================================
   SHOW VIEW
========================================================= */

function showView(viewName) {

    const views = document.querySelectorAll(".view");


    views.forEach((view) => {

        view.classList.remove("active");

    });


    const target = $(`view-${viewName}`);


    if (target) {

        target.classList.add("active");

    }


    /* -----------------------------------------
       Update Sidebar
    ----------------------------------------- */

    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach((item) => {

        item.classList.remove("active");

    });


    const activeItem =
        document.querySelector(
            `.nav-item[data-view="${viewName}"]`
        );


    if (activeItem) {

        activeItem.classList.add("active");

    }


    /* -----------------------------------------
       Scroll to top
    ----------------------------------------- */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    /* -----------------------------------------
       Close mobile sidebar
    ----------------------------------------- */

    const sidebar = $("sidebar");


    if (sidebar) {

        sidebar.classList.remove("open");

    }

}


/* =========================================================
   OPEN SYLLABUS
========================================================= */

function openSyllabus(code) {

    const select = $("syllabusSubjectSelect");


    if (select && code) {

        select.value = code;

    }


    showView("university");


    if (code) {

        renderSyllabus(code);

    } else if (select) {

        renderSyllabus(select.value);

    }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    const toast = $("toast");


    if (!toast) {
        return;
    }


    const text = toast.querySelector("span");


    if (text) {

        text.textContent = message;

    }


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2200);

}


/* =========================================================
   DOM CONTENT LOADED
========================================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =========================================
       INITIAL RENDER
    ========================================== */

    renderSubjects();

    renderFaculty();

    populateSubjectDropdown();


    const subjectSelect =
        $("syllabusSubjectSelect");


    if (subjectSelect) {

        renderSyllabus(
            subjectSelect.value
        );

    }


    /* =========================================
       STAT COUNTS
    ========================================== */

    const subjectCount =
        $("subjectCount");


    const coreCount =
        $("coreCount");


    const facultyCount =
        $("facultyCount");


    if (subjectCount) {

        subjectCount.textContent =
            String(subjects.length).padStart(2, "0");

    }


    if (coreCount) {

        coreCount.textContent =
            subjects.filter(
                subject => subject.type === "Core"
            ).length;

    }


    if (facultyCount) {

        facultyCount.textContent =
            faculty.length;

    }


    /* =========================================
       SUBJECT SEARCH
    ========================================== */

    const subjectSearch =
        $("subjectSearch");


    if (subjectSearch) {

        subjectSearch.addEventListener(
            "input",
            renderSubjects
        );

    }


    /* =========================================
       SUBJECT FILTER
    ========================================== */

    const subjectTypeFilter =
        $("subjectTypeFilter");


    if (subjectTypeFilter) {

        subjectTypeFilter.addEventListener(
            "change",
            renderSubjects
        );

    }


    /* =========================================
       FACULTY SEARCH
    ========================================== */

    const facultySearch =
        $("facultySearch");


    if (facultySearch) {

        facultySearch.addEventListener(
            "input",
            renderFaculty
        );

    }


    /* =========================================
       SYLLABUS SELECT
    ========================================== */

    if (subjectSelect) {

        subjectSelect.addEventListener(
            "change",
            () => {

                renderSyllabus(
                    subjectSelect.value
                );

            }
        );

    }


    /* =========================================
       SIDEBAR NAVIGATION
    ========================================== */

    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach((item) => {

        item.addEventListener(
            "click",
            () => {

                const view =
                    item.dataset.view;


                if (view) {

                    showView(view);

                }

            }
        );

    });


    /* =========================================
       MOBILE MENU
    ========================================== */

    const menuToggle =
        $("menuToggle");


    const sidebar =
        $("sidebar");


    if (menuToggle && sidebar) {

        menuToggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle("open");

            }
        );

    }


    /* =========================================
       PRINT SYLLABUS
    ========================================== */

    const printButton =
        $("printSyllabus");


    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =========================================
       CLOSE SIDEBAR WHEN CLICKING OUTSIDE
       ON MOBILE
    ========================================== */

    document.addEventListener(
        "click",
        (event) => {

            if (
                window.innerWidth <= 800 &&
                sidebar &&
                sidebar.classList.contains("open")
            ) {

                const clickedInsideSidebar =
                    sidebar.contains(event.target);


                const clickedMenu =
                    menuToggle &&
                    menuToggle.contains(event.target);


                if (
                    !clickedInsideSidebar &&
                    !clickedMenu
                ) {

                    sidebar.classList.remove("open");

                }

            }

        }
    );


});


/* =========================================================
   MAKE FUNCTIONS AVAILABLE TO HTML
========================================================= */

window.openSyllabus = openSyllabus;

window.showToast = showToast;

window.showView = showView;