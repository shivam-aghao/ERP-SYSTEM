/* ========================================================
   STUDENT ERP - TIMETABLE MODULE CONTROLLER
   student_timetable.js
   SSGMCE Student Portal
   Read-Only Timetable & Scheduled Test/Assessment Display
   ======================================================== */

// ========================================================
// OFFICIAL SSGMCE CLASS TIMETABLE DATASETS (3R, 2R1, 2R2, 4R)
// Sourced directly from SSGMCE Academic Department
// Primary focus: Class 3R (Third Year B.Tech CSE • Gargi Mane)
// ========================================================
const SSGMCE_CLASS_TIMETABLES = {
  "3R": {
    code: "3R",
    label: "Class 3R (Third Year • Section A)",
    fullTitle: "Third Year B.Tech CSE - Section A (3R)",
    classRoom: "B206",
    term: "Semester - V",
    semester: "Semester - V • Autumn 2026-2027",
    wef: "21/07/2026",
    rev: "01",
    sessionYear: "Session: 2026-2027 (Autumn)",
    scheduleRows: [
      {
        day: "Monday",
        dayShort: "Mon",
        part1: [
          { subject: "CA&O", faculty: "RAZ", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "CD", faculty: "CMM", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DBMS Lab (D) / CD Lab (B)", faculty: "JMP / CMM", batch: "Batches D, B", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM#3 / ICS", faculty: "CMM / VSM", batch: "C1 / DBMS Lab", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "PE-I DSS", faculty: "PKB", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Tuesday",
        dayShort: "Tue",
        part1: [
          { subject: "DBMS", faculty: "RVD", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "CD", faculty: "CMM", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DBMS(B) / CD(A) / DSS(G)", faculty: "JMP / CMM / PKB", batch: "Batches B, A, G", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM#3 / ICS", faculty: "CMM / VSM", batch: "C1 / DBMS Lab", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "PE-I DSS", faculty: "PKB", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Wednesday",
        dayShort: "Wed",
        part1: [
          { subject: "DBMS", faculty: "RVD", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "CA&O", faculty: "RAZ", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "ICS Lab (H) / DSS Lab (E)", faculty: "VSM / PKB", batch: "Batches H, E", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM#4", faculty: "RAZ", batch: "Lecture • C2", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "Off / Prep", faculty: "", batch: "Self Study / Library", isFree: true, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Thursday",
        dayShort: "Thu",
        part1: [
          { subject: "CA&O", faculty: "RAZ", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "CD", faculty: "CMM", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DBMS Lab (C) / CD Lab (D)", faculty: "JMP / CMM", batch: "Batches C, D", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "MDM#4", faculty: "RAZ", batch: "Lecture • C2", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "Off / Prep", faculty: "", batch: "Self Study / Library", isFree: true, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Friday",
        dayShort: "Fri",
        part1: [
          { subject: "ICS / PE-I DSS", faculty: "VSM / PKB", batch: "DBMS Lab / B206", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "DBMS", faculty: "RVD", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DBMS Lab (A) / CD Lab (C)", faculty: "JMP / CMM", batch: "Batches A, C", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "DSS Lab (Batch F)", faculty: "PKB", batch: "ET Lab I", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      }
    ],
    saturdayRow: {
      day: "Saturday",
      dayShort: "Sat",
      part1: [
        { subject: "MDM Lab -I (WT-B1)", faculty: "RAZ", batch: "Lab 01 (Batch B1)", isLab: true, colspan: 2, slotIndices: [0, 1] }
      ],
      part2: [
        { subject: "MDM Lab -I (WT-B4)", faculty: "KPS", batch: "Lab 04 (Batch B4)", isLab: true, colspan: 2, slotIndices: [2, 3] }
      ],
      part3: [
        { subject: "Off / Prep", faculty: "", batch: "Self Study / Library", isFree: true, colspan: 2, slotIndices: [4, 5] }
      ]
    },
    facultyKey: [
      { abbr: "JMP", name: "Dr. J. M. Patil", desig: "Professor & Head, CSE" },
      { abbr: "CMM", name: "Prof. C. M. Mankar", desig: "Assistant Professor" },
      { abbr: "RAZ", name: "Dr. R. A. Zamare", desig: "Assistant Professor" },
      { abbr: "RVD", name: "Prof. R. V. Deshmukh", desig: "Assistant Professor" },
      { abbr: "VSM", name: "Dr. V. S. Mahalle", desig: "Assistant Professor" },
      { abbr: "PKB", name: "Dr. P. K. Bharne", desig: "Assistant Professor" },
      { abbr: "KPS", name: "Prof. K. P. Sable", desig: "Assistant Professor" }
    ],
    subjectKey: [
      { abbr: "CA&O", name: "Computer Architecture & Organization", code: "5CS201PC" },
      { abbr: "CD", name: "Compiler Design (Theory & Lab)", code: "5CS202PC" },
      { abbr: "DBMS", name: "Database Management Systems (Theory & Lab)", code: "5CS203PC" },
      { abbr: "MDM#3 / #4", name: "Multidisciplinary Minor III & IV", code: "5CS228MD" },
      { abbr: "ICS", name: "Information & Cyber Security", code: "5CS204PE" },
      { abbr: "PE-I DSS", name: "Decision Support Systems (Theory & Lab)", code: "5CS204PE" },
      { abbr: "WT", name: "Web Technology Lab (MDM Lab-I)", code: "5CS229ML" }
    ],
    practicalsTable: [
      { code: "5CS202PC", name: "Compiler Design Lab (CD Lab)", lab: "Lab 02 / B206" },
      { code: "5CS203PC", name: "Database Management Systems Lab", lab: "DBMS Lab" },
      { code: "5CS204PE", name: "Decision Support Systems Lab / ICS Lab", lab: "ET Lab I / DBMS Lab" },
      { code: "5CS229ML", name: "Web Technology Lab (MDM Lab-I)", lab: "Lab 01 / Lab 04" }
    ],
    batchesTable: [
      { batch: "A", rolls: "01-20" },
      { batch: "B", rolls: "21-40" },
      { batch: "C", rolls: "41-60" },
      { batch: "D", rolls: "61-80" }
    ],
    signDate: "18/07/2026",
    signatories: ["Time Table Coordinator", "Head of Department", "Dean (Academics)", "Principal"]
  },

  "2R1": {
    code: "2R1",
    label: "Class 2R1 (Second Year • Section A)",
    fullTitle: "Second Year B.Tech CSE - Section A (2R 1)",
    classRoom: "B007/B108/B206",
    term: "Semester - III",
    semester: "Semester - III • Autumn 2026-2027",
    wef: "17/08/2026",
    rev: "02",
    sessionYear: "Session:2026-2027 (Autumn)",
    scheduleRows: [
      {
        day: "Monday",
        dayShort: "Mon",
        part1: [
          { subject: "DS", faculty: "KPS", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "OOP", faculty: "SBP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DS&GT", faculty: "TAP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "MDM#1", faculty: "-", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "Skill Development", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Tuesday",
        dayShort: "Tue",
        part1: [
          { subject: "DS", faculty: "KPS", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "DS&GT", faculty: "TAP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "OOP", faculty: "SBP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "MDM#1", faculty: "-", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "OOP(A) / CEP(B) / DS(C) / CEP(D)", faculty: "SBP / RAZ / KPS / KVK", batch: "Batches A, B, C, D", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Wednesday",
        dayShort: "Wed",
        part1: [
          { subject: "DS", faculty: "KPS", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "OOP", faculty: "SBP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "DS&GT", faculty: "TAP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "OE-I", faculty: "-", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "OOP(D) / CEP(A) / DS(B) / CEP(C)", faculty: "SBP / SMJ / KPS / CMM", batch: "Batches D, A, B, C", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Thursday",
        dayShort: "Thu",
        part1: [
          { subject: "Skill Development", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "DSGT", faculty: "TAP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "OOP", faculty: "SBP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "OE-I", faculty: "-", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "OOP(B) / CEP(A) / DS(D) / CEP(C)", faculty: "SBP / SMJ / KPS / CMM", batch: "Batches B, A, D, C", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Friday",
        dayShort: "Fri",
        part1: [
          { subject: "OOP(C) / CEP(B) / DS(A) / CEP(D)", faculty: "SBP / RAZ / KPS / KVK", batch: "Batches C, B, A, D", isLab: true, colspan: 2, slotIndices: [0, 1] }
        ],
        part2: [
          { subject: "DS", faculty: "KPS", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "OE-I", faculty: "-", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "ES", faculty: "KVK", batch: "Lecture • B108", isLab: false, colspan: 2, slotIndices: [4, 5] }
        ]
      }
    ],
    saturdayRow: {
      day: "Saturday",
      dayShort: "Sat",
      part1: [
        { subject: "Skill Development", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 2, slotIndices: [0, 1] }
      ],
      part2: [
        { subject: "ED(D5)", faculty: "VVP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [2] },
        { subject: "Off / Prep", faculty: "", batch: "-", isFree: true, colspan: 1, slotIndices: [3] }
      ],
      part3: [
        { subject: "Off / Prep", faculty: "", batch: "-", isFree: true, colspan: 2, slotIndices: [4, 5] }
      ]
    },
    facultyKey: [
      { abbr: "TAP", name: "Prof. T. A. Puranik", desig: "Assistant Professor" },
      { abbr: "SBP", name: "Prof. S. B. Bagrut", desig: "Assistant Professor" },
      { abbr: "KPS", name: "Prof. Ms. K. P. Sable", desig: "Assistant Professor" },
      { abbr: "VVP", name: "Prof. V. V. Patil", desig: "Assistant Professor" },
      { abbr: "KVK", name: "Prof. K. V. Karale", desig: "Assistant Professor" },
      { abbr: "RAZ", name: "Dr. R. A. Zamare", desig: "Assistant Professor" },
      { abbr: "SMJ", name: "Prof. S. M. Jain", desig: "Assistant Professor" },
      { abbr: "CMM", name: "Prof. C. M. Mankar", desig: "Assistant Professor" }
    ],
    subjectKey: [
      { abbr: "3CS200PC", name: "Discrete Structure & Graph Theory", faculty: "Prof. T. A. Puranik" },
      { abbr: "3CS201PC", name: "Object Oriented Programming", faculty: "Prof. S. B. Bagrut" },
      { abbr: "3CS202PC", name: "Data Structures", faculty: "Prof. Ms. K. P. Sable" },
      { abbr: "3CS205MD", name: "Multi-disciplinary Minor#1 (MDM#1)", faculty: "-" },
      { abbr: "3CS206OE", name: "Open Elective -I", faculty: "-" },
      { abbr: "3CS207EM", name: "Entrepreneurship Development", faculty: "Prof. V. V. Patil" },
      { abbr: "3SH208VE", name: "Environmental Science", faculty: "Prof. K. V. Karale" }
    ],
    practicalsTable: [
      { code: "3CS203PC", name: "Object Oriented Programming Lab", lab: "OOP Lab" },
      { code: "3CS204PC", name: "Data Structures", lab: "OS Lab" },
      { code: "3CS400EL", name: "Comm. Engag. Project/ Field Project", lab: "Data Science Lab & ML & IOT Lab" }
    ],
    batchesTable: [
      { batch: "A", rolls: "01-23" },
      { batch: "B", rolls: "24-46" },
      { batch: "C", rolls: "47-69" },
      { batch: "D", rolls: "For Diploma Students" }
    ],
    signDate: "13/08/2026",
    signatories: ["Time Table Coordinator", "Head of Department", "Dean (Academics)", "Principal"]
  },

  "2R2": {
    code: "2R2",
    label: "Class 2R2 (Second Year • Section B)",
    fullTitle: "Second Year B.Tech CSE - Section B (2R 2)",
    classRoom: "B007/B108/B206",
    term: "Semester - III",
    semester: "Semester - III • Autumn 2026-2027",
    wef: "03/08/2026",
    rev: "01",
    sessionYear: "Session:2026-2027 (Autumn)",
    scheduleRows: [
      {
        day: "Monday",
        dayShort: "Mon",
        part1: [
          { subject: "OOP(D) / CEP(B) / DS(A) / CEP(C)", faculty: "VSM / TAP / NNF / RVD", batch: "Batches D, B, A, C", isLab: true, colspan: 2, slotIndices: [0, 1] }
        ],
        part2: [
          { subject: "OOP", faculty: "VSM", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "MDM", faculty: "-", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "ES", faculty: "KVK", batch: "Lecture • B007", isLab: false, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Tuesday",
        dayShort: "Tue",
        part1: [
          { subject: "OOP(B) / CEP(A) / DS(C) / CEP(D)", faculty: "VSM / VSK / NNF / NMK", batch: "Batches B, A, C, D", isLab: true, colspan: 2, slotIndices: [0, 1] }
        ],
        part2: [
          { subject: "OOP", faculty: "VSM", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "MDM", faculty: "-", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "DSGT", faculty: "TAP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "DS", faculty: "NNF", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Wednesday",
        dayShort: "Wed",
        part1: [
          { subject: "OOP(C) / CEP(A) / DS(D) / CEP(B)", faculty: "VSM / VSK / NNF / TAP", batch: "Batches C, A, D, B", isLab: true, colspan: 2, slotIndices: [0, 1] }
        ],
        part2: [
          { subject: "DS", faculty: "NNF", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "OE-I", faculty: "-", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "DS&GT", faculty: "TAP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "OOP", faculty: "VSM", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Thursday",
        dayShort: "Thu",
        part1: [
          { subject: "OOP(A) / CEP(D) / DS(B) / CEP(C)", faculty: "VSM / NMK / NNF / RVD", batch: "Batches A, D, B, C", isLab: true, colspan: 2, slotIndices: [0, 1] }
        ],
        part2: [
          { subject: "DS", faculty: "NNF", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "OE-I", faculty: "-", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "DS&GT", faculty: "TAP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [4] },
          { subject: "Skill Development", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 1, slotIndices: [5] }
        ]
      },
      {
        day: "Friday",
        dayShort: "Fri",
        part1: [
          { subject: "DS", faculty: "NNF", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "DS&GT", faculty: "TAP", batch: "Lecture • B108", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "OOP", faculty: "VSM", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "OE-I", faculty: "-", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "Skill Development", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 2, slotIndices: [4, 5] }
        ]
      }
    ],
    saturdayRow: {
      day: "Saturday",
      dayShort: "Sat",
      part1: [
        { subject: "Skill Development", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 2, slotIndices: [0, 1] }
      ],
      part2: [
        { subject: "ED(D5)", faculty: "VVP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [2] },
        { subject: "Off / Prep", faculty: "", batch: "-", isFree: true, colspan: 1, slotIndices: [3] }
      ],
      part3: [
        { subject: "Off / Prep", faculty: "", batch: "-", isFree: true, colspan: 2, slotIndices: [4, 5] }
      ]
    },
    facultyKey: [
      { abbr: "TAP", name: "Prof. T. A. Puranik", desig: "Assistant Professor" },
      { abbr: "VSM", name: "Dr. V. S. Mahalle", desig: "Assistant Professor" },
      { abbr: "NNF", name: "Prof. N. N. Fatkar", desig: "Assistant Professor" },
      { abbr: "VVP", name: "Prof. V. V. Patil", desig: "Assistant Professor" },
      { abbr: "KVK", name: "Prof. K. V. Karale", desig: "Assistant Professor" },
      { abbr: "VSK", name: "Prof. V. S. Kanherkar", desig: "Assistant Professor" },
      { abbr: "NMK", name: "Dr. N. M. Kandoi", desig: "Associate Professor" },
      { abbr: "RVD", name: "Prof. R. V. Deshmukh", desig: "Assistant Professor" }
    ],
    subjectKey: [
      { abbr: "3CS200PC", name: "Discrete Structure & Graph Theory", faculty: "Prof. T. A. Puranik" },
      { abbr: "3CS201PC", name: "Object Oriented Programming", faculty: "Dr. V. S. Mahalle" },
      { abbr: "3CS202PC", name: "Data Structures", faculty: "Prof. N. N. Fatkar" },
      { abbr: "3CS205MD", name: "Multi-disciplinary Minor#1 (MDM#1)", faculty: "-" },
      { abbr: "3CS206OE", name: "Open Elective -I", faculty: "-" },
      { abbr: "3CS207EM", name: "Entrepreneurship Development", faculty: "Prof. V. V. Patil" },
      { abbr: "3SH208VE", name: "Environmental Science", faculty: "Prof. K. V. Karale" }
    ],
    practicalsTable: [
      { code: "3CS203PC", name: "Object Oriented Programming Lab", lab: "OOP Lab" },
      { code: "3CS204PC", name: "Data Structure", lab: "DBMS Lab" },
      { code: "3CS400EL", name: "Comm. Engag. Project/ Field Project", lab: "Data Science Lab & ML & IOT Lab" }
    ],
    batchesTable: [
      { batch: "A", rolls: "01-23" },
      { batch: "B", rolls: "24-46" },
      { batch: "C", rolls: "47-69" },
      { batch: "D", rolls: "For Diploma Students" }
    ],
    signDate: "31/07/2026",
    signatories: ["Time Table Coordinator", "Head of Department", "Dean (Academics)", "Principal"]
  },

  "4R": {
    code: "4R",
    label: "Class 4R (Final Year • Section A)",
    fullTitle: "Final Year B.Tech CSE - Section A (4R)",
    classRoom: "B007/B206",
    term: "Semester - VII",
    semester: "Semester - VII • Autumn 2026-2027",
    wef: "21/07/2026",
    rev: "01",
    sessionYear: "Session: 2026-2027 (Autumn)",
    scheduleRows: [
      {
        day: "Monday",
        dayShort: "Mon",
        part1: [
          { subject: "CC", faculty: "JMP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "BF", faculty: "NMK", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "SSEE", faculty: "KPS", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "PE - III DF / DW&M", faculty: "SBP / PKB", batch: "Lecture • B6/B206", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "CG (C) / BF (B) / Project & Seminar (A & D)", faculty: "RVD / NMK", batch: "Batches C, B, A & D", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Tuesday",
        dayShort: "Tue",
        part1: [
          { subject: "CC", faculty: "JMP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "PE - III DF / DW&M", faculty: "SBP / PKB", batch: "Lecture • DBMS Lab/B007", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "SSEE", faculty: "KPS", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "CG", faculty: "RVD", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "CG (D) / BF (C) / Project & Seminar (A & B)", faculty: "RVD / NMK", batch: "Batches D, C, A & B", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Wednesday",
        dayShort: "Wed",
        part1: [
          { subject: "CC", faculty: "JMP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "BF", faculty: "NMK", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "SSEE", faculty: "KPS", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "CG", faculty: "RVD", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "CG (B) / BF (A) / ET Lab III-DW&M (G)", faculty: "RVD / NMK / PKB", batch: "Batches B, A, G", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Thursday",
        dayShort: "Thu",
        part1: [
          { subject: "Project", faculty: "Department Faculty", batch: "Major Project Work", isFree: false, isLab: false, colspan: 2, slotIndices: [0, 1] }
        ],
        part2: [
          { subject: "CG", faculty: "RVD", batch: "Lecture • B206", isLab: false, colspan: 1, slotIndices: [2] },
          { subject: "PE - III DF / DW&M", faculty: "SBP / PKB", batch: "Lecture • B2/B206", isLab: false, colspan: 1, slotIndices: [3] }
        ],
        part3: [
          { subject: "ET Lab III - DW&M (F)", faculty: "PKB", batch: "Batch F (DW&M)", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      },
      {
        day: "Friday",
        dayShort: "Fri",
        part1: [
          { subject: "CC", faculty: "JMP", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [0] },
          { subject: "BF", faculty: "NMK", batch: "Lecture • B007", isLab: false, colspan: 1, slotIndices: [1] }
        ],
        part2: [
          { subject: "ET Lab III - DF (H) / DW&M (E)", faculty: "SBP / PKB", batch: "Batches H, E", isLab: true, colspan: 2, slotIndices: [2, 3] }
        ],
        part3: [
          { subject: "CG (A) / BF (D) / Project & Seminar (B & C)", faculty: "RVD / NMK", batch: "Batches A, D, B & C", isLab: true, colspan: 2, slotIndices: [4, 5] }
        ]
      }
    ],
    saturdayRow: {
      day: "Saturday",
      dayShort: "Sat",
      part1: [{ subject: "Skill Development Program", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 2, slotIndices: [0, 1] }],
      part2: [{ subject: "Skill Development Program", faculty: "SDP Mentor", batch: "All Batches", isLab: false, colspan: 2, slotIndices: [2, 3] }],
      part3: [{ subject: "Off / Prep", faculty: "", batch: "-", isFree: true, colspan: 2, slotIndices: [4, 5] }]
    },
    facultyKey: [
      { abbr: "JMP", name: "Dr. J. M. Patil", desig: "Head Of Department & Professor" },
      { abbr: "NMK", name: "Dr. N. M. Kandoi", desig: "Associate Professor" },
      { abbr: "RVD", name: "Prof. R. V. Deshmukh", desig: "Assistant Professor" },
      { abbr: "KPS", name: "Prof. K. P. Sable", desig: "Assistant Professor" },
      { abbr: "SBP", name: "Prof. S. B. Pagrut", desig: "Assistant Professor" },
      { abbr: "PKB", name: "Dr. P. K. Bharne", desig: "Assistant Professor" }
    ],
    subjectKey: [
      { abbr: "7KS01", name: "Social Science & Engineering Economics", faculty: "Prof. K. P. Sable" },
      { abbr: "7KS02", name: "Computer Graphics", faculty: "Prof. R. V. Deshmukh" },
      { abbr: "7KS03", name: "Cloud Computing", faculty: "Dr. J. M. Patil" },
      { abbr: "7KS04", name: "PE III - Digital Forensics / Data Warehousing & Mining", faculty: "Prof. S. B. Pagrut / Dr. P. K. Bharne" },
      { abbr: "7KS05", name: "Professional Elective-IV (Blockchain Fundamentals)", faculty: "Dr. N. M. Kandoi" }
    ],
    practicalsTable: [
      { code: "7KS06", name: "Computer Graphics - CG", lab: "DBMS Lab" },
      { code: "7KS07", name: "Emerging Technology Lab III: DW&M and DF", lab: "DW&M - Project Lab / DF - Data Science Lab" },
      { code: "7KS08", name: "Emerging Technology Lab IV: BF", lab: "SS Lab" },
      { code: "7KS09", name: "Project & Seminar", lab: "--" }
    ],
    batchesTable: [
      { batch: "A", rolls: "01-20" },
      { batch: "B", rolls: "21-40" },
      { batch: "C", rolls: "41-60" },
      { batch: "D", rolls: "61-80" },
      { batch: "E-DW&M", rolls: "1-19 (17)" },
      { batch: "F-DW&M", rolls: "20-40 (16)" },
      { batch: "G-DW&M", rolls: "41-79 (18)" },
      { batch: "DF", rolls: "28" }
    ],
    signDate: "18/07/2026",
    signatories: ["Time Table Coordinator", "Head of Department", "Dean (Academics)", "Principal"]
  }
};

const StudentTimetableApp = {
  selectedTimetableDate: null,
  selectedClassCode: null,
  tests: [],
  timetableEntries: [],
  studentSession: null,
  serverTimeOffsetMs: 0,
  realtimeChannel: null,
  _tickerInterval: null,

  getClassCode() {
    if (this.selectedClassCode) return this.selectedClassCode;
    try {
      const storedCls = sessionStorage.getItem('ssgmce_selected_timetable_class') || localStorage.getItem('ssgmce_selected_timetable_class');
      if (storedCls && SSGMCE_CLASS_TIMETABLES[storedCls]) return storedCls;
    } catch (_) {}

    const s = this.studentSession;
    if (s) {
      const raw = String(s.className || s.class_name || s.class_code || s.classCode || '').trim().toUpperCase();
      if (raw.includes('2R2')) return '2R2';
      if (raw.includes('2R1')) return '2R1';
      if (raw.includes('3R')) return '3R';
      if (raw.includes('4R')) return '4R';
    }
    return '2R2'; // Default to 2R2
  },

  switchClass(classCode) {
    const validCode = (classCode || "").toUpperCase();
    if (!validCode || !SSGMCE_CLASS_TIMETABLES[validCode]) return;
    this.selectedClassCode = validCode;
    try {
      sessionStorage.setItem('ssgmce_selected_timetable_class', validCode);
    } catch (_) {}
    this.loadTests(); // Refresh assessments for newly selected class
    this.renderTimetableView();
    this.initLucideIcons();
    this.showToast(`Active Timetable switched to Class ${validCode}`, 'info');
  },

  init() {
    this.loadStudentSession();
    this.bindEvents();
    this.renderHeaderProfile();
    // 1. Instant local render (0ms response time - zero blank delay)
    this.loadCachedTests();
    this.renderTimetableView();
    this.initLucideIcons();

    // 2. Background async refresh (Stale-While-Revalidate)
    Promise.allSettled([
      this.syncServerTime(),
      this.loadTimetable(),
      this.loadTests()
    ]).then(() => {
      this.renderTimetableView();
      this.initLucideIcons();
    });

    this.initRealtimeSubscription();
    this.startLiveStatusTicker();
  },

  loadCachedTests() {
    try {
      const local = localStorage.getItem('ssgmce_scheduled_tests');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tests = parsed.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
        }
      }
    } catch (_) {}
  },

  async syncServerTime() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.getApiBase()}/server-time`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.timestamp_ms) {
          this.serverTimeOffsetMs = json.data.timestamp_ms - Date.now();
        }
      }
    } catch (_) {}
  },

  getServerNow() {
    const serverTimestamp = Date.now() + (this.serverTimeOffsetMs || 0);
    return new Date(serverTimestamp);
  },

  getApiBase() {
    return (typeof window !== 'undefined' && (window.__API_BASE__ || window.__STUDENT_API_BASE__)) || '/api/v1';
  },

  // ----------------------------------------------------
  // LOAD REAL STUDENT TIMETABLE FROM BACKEND API
  // ----------------------------------------------------
  async loadTimetable() {
    const activeClass = this.getClassCode();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      let res = await fetch(`${this.getApiBase()}/student/timetable?class_code=${encodeURIComponent(activeClass)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const c2 = new AbortController();
        const t2 = setTimeout(() => c2.abort(), 1500);
        res = await fetch(`${this.getApiBase()}/timetable?class_code=${encodeURIComponent(activeClass)}`, { signal: c2.signal });
        clearTimeout(t2);
      }
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          this.timetableEntries = json.data;
          return;
        }
      }
    } catch (e) {
      // Background timetable fetch
    }

    try {
      if (typeof StudentApi !== 'undefined' && typeof StudentApi.getTimetable === 'function') {
        const res = await StudentApi.getTimetable();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.timetableEntries = res.data;
          return;
        }
      }
    } catch (_) {}
  },

  // ----------------------------------------------------
  // AUTHENTICATED STUDENT SESSION
  // ----------------------------------------------------
  loadStudentSession() {
    try {
      const stored = localStorage.getItem('ssgmce_erp_session') || localStorage.getItem('ssgmce_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'student' || parsed.studentCode || parsed.rollNo || parsed.className) {
          const nameStr = String(parsed.fullName || parsed.full_name || parsed.name || "");
          const isGargi = nameStr.toLowerCase().includes("gargi") || nameStr.toLowerCase().includes("mane") || String(parsed.studentCode) === "308653" || String(parsed.rollNo).toUpperCase() === "3R9";
          
          let rawClass = String(parsed.className || parsed.class_name || parsed.classCode || parsed.class_code || "").toUpperCase();
          if (rawClass.includes("2R2") || isGargi) {
            parsed.className = "2R2";
            parsed.classCode = "2R2";
            parsed.class_name = "2R2";
            parsed.fullName = parsed.fullName || "Mane Gargi Manoj";
            parsed.shortName = parsed.shortName || "Gargi Mane";
            parsed.initials = "GM";
            parsed.rollNo = parsed.rollNo && parsed.rollNo.toUpperCase().includes("2RB") ? parsed.rollNo : "2RB9";
            parsed.studentCode = parsed.studentCode || "308653";
            parsed.email = parsed.email || "308653@ssgmce.ac.in";
            parsed.semester = "III";
          } else if (rawClass.includes("2R1")) {
            parsed.className = "2R1";
            parsed.classCode = "2R1";
          } else if (rawClass.includes("3R")) {
            parsed.className = "3R";
            parsed.classCode = "3R";
          } else if (rawClass.includes("4R")) {
            parsed.className = "4R";
            parsed.classCode = "4R";
          } else {
            parsed.className = "2R2";
            parsed.classCode = "2R2";
          }

          this.studentSession = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse student session:", e);
    }

    // Default student context from ERP model: Gargi Mane (Class 2R2)
    this.studentSession = {
      id: "0086f6eb-0d55-4b92-b5df-e6bac0958cab",
      fullName: "Mane Gargi Manoj",
      shortName: "Gargi Mane",
      initials: "GM",
      rollNo: "2RB9",
      studentCode: "308653",
      className: "2R2",
      classCode: "2R2",
      semester: "III",
      academicYear: "2026-2027",
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
      email: "308653@ssgmce.ac.in",
      role: "student"
    };
  },

  // ----------------------------------------------------
  // LOAD SCHEDULED TESTS / ASSESSMENTS (MULTI-TIER: API + SUPABASE + LOCAL CACHE)
  // ----------------------------------------------------
  async loadTests() {
    let localTests = [];
    let apiTests = [];

    // 1. Read local cache for immediate offline/cross-tab sync
    try {
      const local = localStorage.getItem('ssgmce_scheduled_tests');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          localTests = parsed.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
        }
      }
    } catch (_) {}

    // 2. Backend REST API with fast timeout
    try {
      let classCode = this.getClassCode();
      const studentCode = (this.studentSession && (this.studentSession.studentCode || this.studentSession.student_code || this.studentSession.id)) || '308653';

      const params = new URLSearchParams();
      if (classCode) params.append('class_code', classCode);
      if (studentCode) params.append('student_code', studentCode);

      const url = `${this.getApiBase()}/timetable/tests?${params.toString()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          apiTests = json.data.filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"));
        }
      }
    } catch (e) {
      // Backend fetch finished or timed out
    }

    // 3. Direct Supabase Client if API returned empty and client is already ready
    if (apiTests.length === 0 && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('timetable_assessments')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (!error && Array.isArray(data) && data.length > 0) {
          apiTests = data
            .filter(t => t && t.id && String(t.id).startsWith("test-") && !String(t.id).startsWith("quiz-tt-"))
            .map(t => ({
              id: t.id,
              teacher_id: t.teacher_id || 'FAC-CSE-1001',
              type: t.type || 'Quiz',
              subject: t.subject || '',
              title: t.title || '',
              date: t.date || '',
              start: t.start_time || t.start || '',
              end: t.end_time || t.end || '',
              link: t.link || '',
              class_code: t.class_code || '2R1'
            }));
        }
      } catch (sbErr) {}
    }

    // Combine & merge: ensure tests scheduled on either side are immediately present
    const testMap = new Map();
    localTests.forEach(t => testMap.set(t.id, t));
    apiTests.forEach(t => testMap.set(t.id, t));

    this.tests = Array.from(testMap.values());
    try {
      localStorage.setItem('ssgmce_scheduled_tests', JSON.stringify(this.tests));
    } catch (_) {}
  },

  bindEvents() {
    // Mobile Drawer Toggle (identical to Student Dashboard & Attendance)
    const toggleBtn = document.getElementById("mobileMenuToggle") || document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("dashboardSidebar") || document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebarBackdrop") || document.getElementById("sidebar-overlay");
    const closeBtn = document.getElementById("sidebar-close-btn");

    const closeSidebarDrawer = () => {
      if (sidebar) {
        sidebar.classList.remove("drawer-open");
        sidebar.classList.remove("open");
      }
      if (backdrop) {
        backdrop.classList.remove("active");
        backdrop.classList.remove("open");
      }
      document.body.style.overflow = "";
    };

    const openSidebarDrawer = () => {
      if (sidebar) {
        sidebar.classList.add("drawer-open");
        sidebar.classList.add("open");
      }
      if (backdrop) {
        backdrop.classList.add("active");
        backdrop.classList.add("open");
      }
      document.body.style.overflow = "hidden";
    };

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("drawer-open") || sidebar.classList.contains("open");
        if (isOpen) {
          closeSidebarDrawer();
        } else {
          openSidebarDrawer();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeSidebarDrawer);
    }

    if (backdrop) {
      backdrop.addEventListener("click", closeSidebarDrawer);
    }

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById("profileBtn") || document.getElementById("profile-dropdown-trigger");
    const profilePanel = document.getElementById("profilePanel") || document.getElementById("profile-dropdown-menu");
    if (profileBtn && profilePanel) {
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = profilePanel.classList.contains("active") || profilePanel.classList.contains("show");
        this.closeAllDropdowns();
        if (!isOpen) {
          profilePanel.classList.add("active");
          profilePanel.classList.add("show");
          profileBtn.classList.add("active");
        }
      });
    }

    // Notifications Dropdown Toggle
    const notifBtn = document.getElementById("notifBtn");
    const notifPanel = document.getElementById("notifPanel");
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = notifPanel.classList.contains("active") || notifPanel.classList.contains("show");
        this.closeAllDropdowns();
        if (!isOpen) {
          notifPanel.classList.add("active");
          notifPanel.classList.add("show");
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", () => {
      this.closeAllDropdowns();
    });

    // Close modals and popovers on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllDropdowns();
        this.closeTestDetailsModal();
      }
    });

    // Close modal on clicking outside modal container
    const detailsModal = document.getElementById("testDetailsModal");
    if (detailsModal) {
      detailsModal.addEventListener("click", (e) => {
        if (e.target === detailsModal) {
          this.closeTestDetailsModal();
        }
      });
    }

    // Live Cross-Tab & Window Focus Synchronization with Teacher Portal
    window.addEventListener("storage", async (e) => {
      if (e.key === "ssgmce_scheduled_tests") {
        await this.loadTests();
        this.renderTimetableView();
      }
    });

    window.addEventListener("tests:updated", async () => {
      await this.loadTests();
      this.renderTimetableView();
    });

    window.addEventListener("focus", async () => {
      await this.loadTests();
      this.renderTimetableView();
    });
  },

  closeAllDropdowns() {
    const profilePanel = document.getElementById("profilePanel") || document.getElementById("profile-dropdown-menu");
    const profileBtn = document.getElementById("profileBtn") || document.getElementById("profile-dropdown-trigger");
    const notifPanel = document.getElementById("notifPanel");

    if (profilePanel) {
      profilePanel.classList.remove("active");
      profilePanel.classList.remove("show");
    }
    if (profileBtn) profileBtn.classList.remove("active");
    if (notifPanel) {
      notifPanel.classList.remove("active");
      notifPanel.classList.remove("show");
    }
  },

  initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  renderHeaderProfile() {
    const s = this.studentSession;
    if (!s) return;

    const displayName = s.shortName || s.fullName || s.name || "Student";
    const displayClass = s.className ? `${s.className} • Roll ${s.rollNo || '--'}` : (s.role || "Student");
    const initials = s.initials || (displayName ? displayName.substring(0, 2).toUpperCase() : "ST");

    // Standard IDs
    const headerName = document.getElementById("header-profile-name");
    const headerDept = document.getElementById("header-profile-dept");
    const avatarElem = document.getElementById("header-profile-avatar");
    const menuName = document.getElementById("profile-menu-name");
    const menuTitle = document.getElementById("profile-menu-title");

    if (headerName) headerName.textContent = displayName;
    if (headerDept) headerDept.textContent = displayClass;
    if (menuName) menuName.textContent = s.fullName || displayName;
    if (menuTitle) menuTitle.textContent = `${displayClass} • ${s.departmentCode || 'CSE'}`;
    if (avatarElem) avatarElem.innerHTML = `<span>${initials}</span>`;

    // Common Dashboard classes
    document.querySelectorAll('.avatar-circle, .large-avatar').forEach(el => {
      el.textContent = initials;
    });
    document.querySelectorAll('.student-name, .p-name').forEach(el => {
      el.textContent = displayName;
    });
    document.querySelectorAll('.student-meta').forEach(el => {
      el.textContent = `Roll: ${s.rollNo || 21} • ${s.className || 'CSE 2R1'} (${s.studentCode || 'CSE2401'})`;
    });
  },

  handleTimetableDateChange(dateVal) {
    if (!dateVal) return;
    this.selectedTimetableDate = dateVal;
    this.renderTimetableView();
  },

  resetTimetableToToday() {
    this.selectedTimetableDate = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];
    this.renderTimetableView();
  },

  // ----------------------------------------------------
  // TEST TIMING & SLOT MAPPING
  // ----------------------------------------------------
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const str = String(timeStr).trim().replace('.', ':');
    const match = str.match(/^(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meridiem = match[3] ? match[3].toUpperCase() : null;
      if (meridiem === "PM" && h < 12) h += 12;
      else if (meridiem === "AM" && h === 12) h = 0;
      else if (!meridiem && h >= 1 && h <= 7) h += 12; // College academic afternoon (1:00 - 7:59 -> PM)
      return h * 60 + m;
    }
    const parts = str.split(":");
    let hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    if (hours >= 1 && hours <= 7) hours += 12;
    return hours * 60 + mins;
  },

  formatTime12Hour(timeStr) {
    if (!timeStr) return "";
    const mins = this.timeToMinutes(timeStr);
    let h = Math.floor(mins / 60);
    const m = String(mins % 60).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  },

  subjectsMatch(sub1, sub2) {
    if (!sub1 || !sub2) return false;
    const s1 = sub1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = sub2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return true;
    if (s1.includes(s2) || s2.includes(s1)) return true;

    const aliases = [
      ['databasemanagementsystems', 'databasesystems', 'dbms'],
      ['datastructuresandalgorithms', 'datastructures', 'dsa'],
      ['operatingsystems', 'os', 'operatingsystem'],
      ['computernetworks', 'cn', 'networks'],
      ['javaprogrammingandoop', 'javaprogramming', 'java', 'javalab', 'javaprogramminglab']
    ];

    for (const group of aliases) {
      const match1 = group.some(alias => s1.includes(alias));
      const match2 = group.some(alias => s2.includes(alias));
      if (match1 && match2) return true;
    }
    return false;
  },

  getSlotIndexForTime(timeStr, isSat = false) {
    const mins = this.timeToMinutes(timeStr);
    if (isSat) {
      if (mins < 570) return 0; // < 09:30 AM -> Sat Slot 1 (8:30 - 9:30)
      if (mins < 645) return 1; // < 10:45 AM -> Sat Slot 2 (9:30 - 10:30)
      if (mins < 705) return 2; // < 11:45 AM -> Sat Slot 3 (10:45 - 11:45)
      if (mins < 765) return 3; // < 12:45 PM -> Sat Slot 4 (11:45 - 12:45)
      if (mins < 945) return 4;
      return 5;
    }
    // Weekday 6-Slot System (11:00 AM - 05:45 PM)
    if (mins < 720) return 0;   // < 12:00 PM -> Slot 1 (11.00 am - 12.00 pm)
    if (mins < 795) return 1;   // < 01:15 PM -> Slot 2 (12.00 pm - 01.00 pm)
    if (mins < 855) return 2;   // < 02:15 PM -> Slot 3 (01.15 pm - 02.15 pm)
    if (mins < 945) return 3;   // < 03:45 PM -> Slot 4 (02.15 pm - 03.15 pm)
    if (mins < 1005) return 4;  // < 04:45 PM -> Slot 5 (03.45 pm - 04.45 pm)
    return 5;                   // >= 04:45 PM -> Slot 6 (04.45 pm - 05.45 pm)
  },

  getTestStatus(test) {
    if (!test || !test.date || !test.start || !test.end) {
      return { status: "Upcoming", badgeClass: "status-upcoming", label: "Upcoming" };
    }

    const now = this.getServerNow();
    const [year, month, day] = test.date.split("-").map(Number);
    const startMins = this.timeToMinutes(test.start);
    const endMins = this.timeToMinutes(test.end);

    const startH = Math.floor(startMins / 60);
    const startM = startMins % 60;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

    const startDateTime = new Date(year, month - 1, day, startH, startM, 0);
    const endDateTime = new Date(year, month - 1, day, endH, endM, 0);

    const start12 = this.formatTime12Hour(test.start);

    if (now < startDateTime) {
      return {
        status: "Upcoming",
        badgeClass: "status-upcoming",
        label: "Upcoming",
        caption: `Starts at ${start12}`
      };
    } else if (now >= startDateTime && now < endDateTime) {
      return {
        status: "Live",
        badgeClass: "status-live",
        label: "Live Now",
        caption: "Assessment Active"
      };
    } else {
      return {
        status: "Ended",
        badgeClass: "status-ended",
        label: "Closed",
        caption: "Submission Closed"
      };
    }
  },

  isTargetedForCurrentStudent(test, targetClassCode) {
    if (!test) return false;
    const rawClass = targetClassCode || this.getClassCode() || '3R';
    const studentClass = rawClass.trim().toLowerCase();
    const testClass = (test.class_code || test.class || '').trim().toLowerCase();

    if (!testClass || testClass === 'all' || testClass === 'any' || testClass === 'global') return true;
    if (testClass === studentClass) return true;

    const extractToken = (s) => (s.match(/[1-4][a-z][1-2]?/g) || []);
    const tTokens = extractToken(testClass);
    const sTokens = extractToken(studentClass);
    if (tTokens.length > 0 && sTokens.length > 0) {
      return tTokens.some(t => sTokens.includes(t));
    }
    return testClass.includes(studentClass) || studentClass.includes(testClass);
  },

  // ----------------------------------------------------
  // REAL-TIME SUPABASE SUBSCRIPTION & LIVE STATUS TICKER
  // ----------------------------------------------------
  async initRealtimeSubscription() {
    try {
      const getClient = window.getSupabaseClient || (typeof getSupabaseClient === 'function' ? getSupabaseClient : null);
      const client = getClient ? await getClient() : (window.supabaseClient || null);

      if (!client) {
        console.warn("[StudentTimetable] Supabase client initialization in progress or offline fallback.");
        return;
      }

      if (this.realtimeChannel) {
        try { client.removeChannel(this.realtimeChannel); } catch (_) {}
      }

      this.realtimeChannel = client
        .channel('realtime:student_timetable_assessments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_assessments' }, async (payload) => {
          console.log('[StudentTimetable Realtime Event]', payload.eventType, payload);
          const record = payload.new || payload.old || {};
          const tid = String(record.id || '');

          // Strictly ignore permanent quizzes or non-scheduled records
          if (!tid.startsWith('test-')) return;

          const isTargeted = this.isTargetedForCurrentStudent(record);

          if (payload.eventType === 'DELETE') {
            this.tests = this.tests.filter(t => t.id !== record.id);
            this.renderTimetableView();
            this.initLucideIcons();
            return;
          }

          if (!isTargeted) return;

          // Re-fetch tests with authoritative server URLs & re-render
          await this.loadTests();
          this.renderTimetableView();
          this.initLucideIcons();
        })
        .subscribe((status) => {
          console.info('[StudentTimetable Realtime] Channel status:', status);
        });
    } catch (err) {
      console.warn('[StudentTimetable Realtime] Subscription note:', err);
    }
  },

  startLiveStatusTicker() {
    if (this._tickerInterval) clearInterval(this._tickerInterval);
    this._tickerInterval = setInterval(async () => {
      let needsRefresh = false;
      for (const t of this.tests) {
        const oldStatus = t._lastStatus;
        const currentStatus = this.getTestStatus(t).status;
        if (oldStatus && oldStatus !== currentStatus) {
          needsRefresh = true;
          break;
        }
        t._lastStatus = currentStatus;
      }
      if (needsRefresh) {
        await this.loadTests();
        this.renderTimetableView();
        this.initLucideIcons();
      }
    }, 10000);
  },

  // ----------------------------------------------------
  // TEST DETAILS MODAL (READ-ONLY FOR STUDENT)
  // ----------------------------------------------------
  openTestDetails(testId) {
    const test = this.tests.find(t => t.id === testId);
    if (!test) return;

    const modal = document.getElementById("testDetailsModal");
    const typeBadge = document.getElementById("detailsModalTypeBadge");
    const modalTitle = document.getElementById("detailsModalTitle");
    const body = document.getElementById("testDetailsBody");

    const statusObj = this.getTestStatus(test);
    const start12 = this.formatTime12Hour(test.start);
    const end12 = this.formatTime12Hour(test.end);

    // Formatted readable date
    let readableDate = test.date;
    try {
      const [y, m, d] = test.date.split("-");
      const dt = new Date(y, m - 1, d);
      readableDate = dt.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch (_) {}

    // Student launch action button based on test type and live status
    let actionBtnHTML = "";
    let linkRowHTML = "";

    if (statusObj.status === "Ended") {
      actionBtnHTML = `
        <button type="button" class="btn-test-action disabled" disabled aria-disabled="true">
          <i data-lucide="lock" style="width:15px;height:15px;"></i>
          <span>Assessment Closed</span>
        </button>
      `;
      linkRowHTML = `
        <span class="detail-val text-muted" style="font-size:13px;">
          <em>Assessment closed</em>
        </span>
      `;
    } else if (statusObj.status === "Live" && test.link) {
      let actionLabel = "Start Assessment";
      if (test.type === "Quiz") actionLabel = "Start Quiz";
      else if (test.type === "Assignment") actionLabel = "Submit Assignment";
      else if (test.type === "TEC") actionLabel = "Start TEC Evaluation";

      actionBtnHTML = `
        <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="btn-test-action live">
          <i data-lucide="external-link" style="width:15px;height:15px;"></i>
          <span>${actionLabel}</span>
        </a>
      `;
      linkRowHTML = `
        <span class="detail-val">
          <a href="${test.link}" target="_blank" rel="noopener noreferrer" class="test-external-link">
            ${test.link}
          </a>
        </span>
      `;
    } else {
      actionBtnHTML = `
        <button type="button" class="btn-test-action upcoming" disabled aria-disabled="true">
          <i data-lucide="clock" style="width:15px;height:15px;"></i>
          <span>${statusObj.caption || "Upcoming Assessment"}</span>
        </button>
      `;
      linkRowHTML = `
        <span class="detail-val text-muted" style="font-size:13px;">
          <em>Link unlocks at exact scheduled start time (${start12})</em>
        </span>
      `;
    }

    if (typeBadge) {
      typeBadge.textContent = `${test.type.toUpperCase()} OVERVIEW`;
    }
    if (modalTitle) {
      modalTitle.textContent = test.title;
    }

    if (body) {
      body.innerHTML = `
        <div class="test-details-info-grid">
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="book-open" style="width:14px;height:14px;"></i> Course:</span>
            <span class="detail-val"><strong>${test.subject}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="layers" style="width:14px;height:14px;"></i> Assessment Type:</span>
            <span class="detail-val"><span class="test-type-badge ${test.type.toLowerCase()}-type">${test.type}</span></span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="calendar" style="width:14px;height:14px;"></i> Scheduled Date:</span>
            <span class="detail-val">${readableDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="clock" style="width:14px;height:14px;"></i> Time Slot:</span>
            <span class="detail-val">${start12} - ${end12}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i data-lucide="activity" style="width:14px;height:14px;"></i> Current Status:</span>
            <span class="detail-val">
              <span class="test-status-pill ${statusObj.badgeClass}">${statusObj.label}</span>
              ${statusObj.caption ? `<span class="status-caption">${statusObj.caption}</span>` : ''}
            </span>
          </div>
          <div class="detail-row link-row">
            <span class="detail-label"><i data-lucide="link-2" style="width:14px;height:14px;"></i> Portal Link:</span>
            ${linkRowHTML}
          </div>
        </div>

        <div class="test-details-action-bar" style="justify-content: flex-end;">
          <div class="student-action-wrap" style="width: 100%;">
            ${actionBtnHTML}
          </div>
        </div>
      `;
    }

    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }
    this.initLucideIcons();
  },

  closeTestDetailsModal() {
    const modal = document.getElementById("testDetailsModal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  },

  // ----------------------------------------------------
  // MAIN TIMETABLE RENDERING (IDENTICAL STRUCTURE TO TEACHER)
  // ----------------------------------------------------
  renderTimetableView() {
    const container = document.getElementById("timetable-content");
    if (!container) return;

    const selectedDate = this.selectedTimetableDate || (
      (typeof AcademicDateUtils !== 'undefined')
        ? AcademicDateUtils.getTodayISO()
        : new Date().toISOString().split('T')[0]
    );

    const currentDayName = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getDayName(selectedDate)
      : "Monday";

    const readableDate = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.formatReadableDate(selectedDate)
      : selectedDate;

    const todayISO = (typeof AcademicDateUtils !== 'undefined')
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];

    const isToday = (selectedDate === todayISO);
    const isWeekend = (currentDayName === "Saturday" || currentDayName === "Sunday");

    // Check if Sunday has scheduled tests
    const hasSundayTest = (this.tests || []).some(t => {
      if (!t.date) return false;
      const [y, m, d] = t.date.split("-").map(Number);
      const dayName = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
      return dayName.toLowerCase() === "sunday";
    });
    const includeSunday = hasSundayTest || currentDayName.toLowerCase() === "sunday";

    // Resolve active class and timetable dataset (3R, 2R1, 2R2, 4R)
    const activeClass = this.getClassCode() || '3R';
    const classData = SSGMCE_CLASS_TIMETABLES[activeClass] || SSGMCE_CLASS_TIMETABLES['3R'];
    const scheduleRows = classData.scheduleRows || [];
    const saturdayRow = classData.saturdayRow;

    // Compute upcoming assessments for alert strip
    const upcomingTests = (this.tests || []).filter(t => {
      if (!t.date) return false;
      if (!this.isTargetedForCurrentStudent(t, activeClass)) return false;
      const st = this.getTestStatus(t);
      if (st.status === "Ended") return false;

      const [ty, tm, td] = t.date.split("-").map(Number);
      const [cy, cm, cd] = todayISO.split("-").map(Number);
      const tDt = new Date(ty, tm - 1, td);
      const cDt = new Date(cy, cm - 1, cd);
      const diffTime = tDt.getTime() - cDt.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      return diffDays >= 0 || st.status === "Live";
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.start || "").localeCompare(b.start || "");
    });

    let upcomingAlertStripHTML = "";
    if (upcomingTests.length > 0) {
      const alertCardsHTML = upcomingTests.map(t => {
        const st = this.getTestStatus(t);
        const start12 = this.formatTime12Hour(t.start);
        const end12 = this.formatTime12Hour(t.end);

        const [ty, tm, td] = t.date.split("-").map(Number);
        const [cy, cm, cd] = todayISO.split("-").map(Number);
        const tDt = new Date(ty, tm - 1, td);
        const cDt = new Date(cy, cm - 1, cd);
        const diffDays = Math.round((tDt - cDt) / (1000 * 3600 * 24));

        let badgeClass = "in-days";
        let countdownText = `In ${diffDays} Days`;

        if (st.status === "Live") {
          badgeClass = "today-badge";
          countdownText = "LIVE NOW";
        } else if (diffDays === 0) {
          badgeClass = "today-badge";
          countdownText = "TODAY";
        } else if (diffDays === 1) {
          badgeClass = "tomorrow";
          countdownText = "TOMORROW";
        } else if (diffDays === 2) {
          badgeClass = "in-days";
          countdownText = "IN 2 DAYS";
        }

        let readableTestDate = t.date;
        try {
          readableTestDate = tDt.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
          });
        } catch (_) {}

        return `
          <div class="upcoming-alert-item-card"
               onclick="StudentTimetableApp.openTestDetails('${t.id}')"
               role="button"
               tabindex="0"
               aria-label="Upcoming Assessment: ${t.title}"
               onkeydown="if(event.key==='Enter') StudentTimetableApp.openTestDetails('${t.id}')">
            <div class="upcoming-item-left">
              <div class="upcoming-item-top">
                <span class="upcoming-countdown-badge ${badgeClass}">
                  <i data-lucide="${diffDays === 0 || st.status === 'Live' ? 'zap' : 'clock'}" style="width:10px;height:10px;"></i>
                  ${countdownText}
                </span>
                <span class="test-type-badge ${t.type.toLowerCase()}-type" style="font-size:10px; padding:1px 6px;">
                  ${t.type.toUpperCase()}
                </span>
                <span class="upcoming-item-subject">${t.subject}</span>
              </div>
              <div class="upcoming-item-title-meta">
                <strong>${t.title}</strong>
                <span style="opacity:0.6;">•</span>
                <span><i data-lucide="calendar" style="width:11px;height:11px;display:inline;vertical-align:-1px;"></i> ${readableTestDate}</span>
                <span style="opacity:0.6;">•</span>
                <span><i data-lucide="clock" style="width:11px;height:11px;display:inline;vertical-align:-1px;"></i> ${start12} - ${end12}</span>
              </div>
            </div>
            <div class="upcoming-item-right">
              <button type="button" class="btn-view-upcoming-detail" onclick="event.stopPropagation(); StudentTimetableApp.openTestDetails('${t.id}')">
                <span>View Details</span>
                <i data-lucide="arrow-right" style="width:12px;height:12px;"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      upcomingAlertStripHTML = `
        <div class="upcoming-assessments-alert-strip">
          <div class="upcoming-alert-header">
            <div class="upcoming-alert-title-wrap">
              <span class="upcoming-pulse-icon">
                <i data-lucide="bell-ring" style="width:13px;height:13px;"></i>
              </span>
              <span>Upcoming Assessments &amp; Tests Notice (${upcomingTests.length})</span>
            </div>
            <span style="font-size:11.5px; color:#92400E; font-weight:600;">Advance Notice</span>
          </div>
          <div class="upcoming-items-grid">
            ${alertCardsHTML}
          </div>
        </div>
      `;
    }

    // Helper: Render block cell (supports single slot or colspan 2 labs or scheduled tests)
    const renderBlockHTML = (block, dayName, isSat = false) => {
      // Find tests scheduled for this day & slot from backend data
      const slotTests = (this.tests || []).filter(t => {
        if (!t.date || !t.start) return false;
        if (!this.isTargetedForCurrentStudent(t, activeClass)) return false;
        const [y, m, d] = t.date.split("-").map(Number);
        const testDateObj = new Date(y, m - 1, d, 12, 0, 0);
        const testDayName = testDateObj.toLocaleDateString("en-US", { weekday: "long" });
        if (testDayName.toLowerCase() !== dayName.toLowerCase()) return false;

        const testSlotIdx = this.getSlotIndexForTime(t.start, isSat);
        return block.slotIndices.includes(testSlotIdx);
      });

      if (slotTests.length > 0) {
        const testsHTML = slotTests.map(t => {
          const st = this.getTestStatus(t);
          const start12 = this.formatTime12Hour(t.start);
          const end12 = this.formatTime12Hour(t.end);

          return `
            <div class="test-card ${t.type.toLowerCase()}-card"
                 onclick="StudentTimetableApp.openTestDetails('${t.id}')"
                 role="button"
                 tabindex="0"
                 aria-label="Assessment: ${t.title}"
                 onkeydown="if(event.key==='Enter') StudentTimetableApp.openTestDetails('${t.id}')">
              <div class="test-card-top">
                <span class="test-type-badge ${t.type.toLowerCase()}-type">
                  <i data-lucide="file-text" style="width:11px;height:11px;"></i>
                  ${t.type.toUpperCase()}
                </span>
                <span class="test-status-pill ${st.badgeClass}">
                  ${st.label}
                </span>
              </div>
              <div class="test-subject">${t.subject}</div>
              <div class="test-title" title="${t.title}">${t.title}</div>
              <div class="test-time">
                <i data-lucide="calendar" style="width:11px;height:11px;"></i>
                <span>${t.date}</span>
                <span style="margin: 0 4px; opacity:0.5;">•</span>
                <i data-lucide="clock" style="width:11px;height:11px;"></i>
                <span>${start12} - ${end12}</span>
              </div>
            </div>
          `;
        }).join('');

        return `
          <td class="schedule-cell" colspan="${block.colspan || 1}">
            <div class="cell-stack-container">
              ${testsHTML}
            </div>
          </td>
        `;
      }

      if (block.isFree) {
        return `
          <td class="schedule-cell off-prep-cell" colspan="${block.colspan || 1}">
            <div class="off-prep">
              <span class="off-prep-pill">
                <i data-lucide="coffee" style="width:12px;height:12px;"></i>
                OFF / PREP
              </span>
              <span class="off-prep-caption">No Class Scheduled</span>
            </div>
          </td>
        `;
      }

      const isHighlightRow = (dayName.toLowerCase() === currentDayName.toLowerCase());

      return `
        <td class="schedule-cell" colspan="${block.colspan || 1}">
          <div class="class-card ${block.isLab ? 'class-lab' : 'class-lecture'} ${isHighlightRow ? 'class-card-highlighted' : ''}">
            <div class="class-card-top">
              <span class="class-type ${block.isLab ? 'type-lab' : 'type-lecture'}">
                <i data-lucide="${block.isLab ? 'flask-conical' : 'book-open'}" style="width:11px;height:11px;"></i>
                ${block.isLab ? 'LAB SESSION' : 'LECTURE'}
              </span>
            </div>
            
            <div class="class-subject-title" title="${block.subject}">
              ${block.subject}
            </div>

            <div class="class-card-meta">
              ${block.faculty ? `<span class="class-faculty-pill"><i data-lucide="user" style="width:10px;height:10px;display:inline;vertical-align:-1px;"></i> ${block.faculty}</span>` : ''}
              ${block.batch ? `<span class="class-batch-pill">${block.batch}</span>` : ''}
            </div>
          </div>
        </td>
      `;
    };

    // Helper: Render full schedule row
    const renderRowHTML = (row, isSat = false) => {
      const isHighlightRow = (row.day.toLowerCase() === currentDayName.toLowerCase());

      return `
        <tr class="schedule-row ${isHighlightRow ? 'active-day-row' : ''}" role="row">
          <!-- Day Cell -->
          <td class="day-cell ${isHighlightRow ? 'active-day-cell' : ''}" scope="row">
            <div class="day-cell-inner">
              <span class="day-label">${row.dayShort || row.day.substring(0, 3)}</span>
              ${isHighlightRow ? `
                <span class="today-badge ${isToday ? 'today-badge-current' : 'today-badge-active'}">
                  ${isToday ? 'TODAY' : 'ACTIVE'}
                </span>
              ` : ''}
            </div>
          </td>

          <!-- Part 1: Slots 1 & 2 (11.00 - 01.00 / Sat: 8.30 - 10.30) -->
          ${row.part1.map(b => renderBlockHTML(b, row.day, isSat)).join('')}

          <!-- BREAK Column (15 Mins) -->
          <td class="timetable-break-cell body-break">
            <div class="break-vertical-text">
              <span>B</span><span>R</span><span>E</span><span>A</span><span>K</span>
            </div>
          </td>

          <!-- Part 2: Slots 3 & 4 (01.15 - 03.15 / Sat: 10.45 - 12.45) -->
          ${row.part2.map(b => renderBlockHTML(b, row.day, isSat)).join('')}

          <!-- RECESS Column (30 Mins) -->
          <td class="timetable-recess-cell body-recess">
            <div class="recess-vertical-text">
              <span>R</span><span>E</span><span>C</span><span>E</span><span>S</span><span>S</span>
            </div>
          </td>

          <!-- Part 3: Slots 5 & 6 (03.45 - 05.45 / Sat: Afternoon) -->
          ${row.part3.map(b => renderBlockHTML(b, row.day, isSat)).join('')}
        </tr>
      `;
    };

    const isSaturdayStandardTimes = (classData.code === '2R1' || classData.code === '2R2');
    const saturdayHeaderRowHTML = isSaturdayStandardTimes ? '' : `
      <tr class="saturday-time-header-row" role="row">
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy); text-align:center;">Day</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">8.30 am - 9.30 am</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">9.30 am - 10.30 am</th>
        <th scope="col" class="timetable-break-cell header-break">15 Mins</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">10.45 am - 11.45 am</th>
        <th scope="col" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy);">11.45 am - 12.45 pm</th>
        <th scope="col" class="timetable-recess-cell header-recess">30 Mins</th>
        <th scope="col" colspan="2" style="background:#EEF2F6; font-weight:700; color:var(--tt-navy); text-align:center;">Afternoon (Off / Prep)</th>
      </tr>
    `;

    let sundayRowHTML = "";
    if (includeSunday) {
      const sundayRow = {
        day: "Sunday",
        dayShort: "Sun",
        part1: [{ subject: "Off / Prep", faculty: "", batch: "", isFree: true, colspan: 2, slotIndices: [0, 1] }],
        part2: [{ subject: "Off / Prep", faculty: "", batch: "", isFree: true, colspan: 2, slotIndices: [2, 3] }],
        part3: [{ subject: "Off / Prep", faculty: "", batch: "", isFree: true, colspan: 2, slotIndices: [4, 5] }]
      };
      sundayRowHTML = renderRowHTML(sundayRow, false);
    }

    container.innerHTML = `
      <div class="timetable-card">
        
        <!-- ==================== OFFICIAL SSGMCE HEADER ==================== -->
        <div class="timetable-header">
          <div class="official-timetable-header-card">
            <div class="official-tt-top">
              <div class="official-college-branding">
                <div class="official-college-info">
                  <h4 class="inst-name">Shri Sant Gajanan Maharaj College of Engineering, Shegaon</h4>
                  <p class="inst-dept">Department of Computer Science &amp; Engineering • Autonomous Curriculum</p>
                </div>
              </div>
              <div class="official-tt-session-wrap">
                <span class="session-badge-text">Session: 2026-2027 (Autumn)</span>
                <h2 class="official-main-heading">TIME-TABLE</h2>
              </div>
            </div>
            <div class="official-tt-submeta">
              <div class="submeta-left">
                ${classData.classRoom ? `<span>Class Room: <strong style="color:var(--tt-navy);">${classData.classRoom}</strong></span> <span style="margin: 0 8px; opacity:0.4;">|</span>` : ''}
                <span>Class: <span class="class-tag">${classData.code}</span></span>
                ${classData.term ? `<span style="margin: 0 8px; opacity:0.4;">|</span><span style="font-weight:700; color:#334155;">${classData.term}</span>` : ''}
                <span class="submeta-div-desc" style="margin-left: 10px; font-weight:600; color:var(--tt-navy); font-size:12px;">${classData.fullTitle}</span>
              </div>
              <div class="submeta-right">
                ${classData.rev ? `<span>rev: <strong style="color:#475569;">${classData.rev}</strong></span> <span style="margin: 0 8px; opacity:0.4;">|</span>` : ''}
                <span>w.e.f.: <span class="wef-tag">${classData.wef}</span></span>
              </div>
            </div>
          </div>

          <!-- Schedule Controls Toolbar -->
          <div class="timetable-header-content" style="margin-top:14px; margin-bottom:12px;">
            <div class="schedule-meta">
              <span class="schedule-term-badge">
                <i data-lucide="graduation-cap" style="width:13px;height:13px;"></i>
                Academic Term: ${classData.semester || '2026-2027 • Autumn Semester'}
              </span>
            </div>

            <div class="schedule-controls">
              <!-- Class Selector Toolbar (Supports 2R2, 2R1, 3R, 4R) -->
              <div class="class-selector-control">
                <label for="student-timetable-class-select" class="date-control-label">
                  <i data-lucide="layers" style="width:14px;height:14px;"></i>
                  <span>Class:</span>
                </label>
                <select id="student-timetable-class-select"
                        class="class-select-dropdown"
                        aria-label="Select Class Timetable"
                        onchange="StudentTimetableApp.switchClass(this.value)">
                  <option value="2R2" ${activeClass === '2R2' ? 'selected' : ''}>Class 2R2 (Second Year Sec B • Gargi Mane)</option>
                  <option value="2R1" ${activeClass === '2R1' ? 'selected' : ''}>Class 2R1 (Second Year Sec A)</option>
                  <option value="3R" ${activeClass === '3R' ? 'selected' : ''}>Class 3R (Third Year Sec A)</option>
                  <option value="4R" ${activeClass === '4R' ? 'selected' : ''}>Class 4R (Final Year Sec A)</option>
                </select>
              </div>

              <div class="date-control">
                <label for="student-timetable-date-input" class="date-control-label">
                  <i data-lucide="calendar" style="width:14px;height:14px;"></i>
                  <span>View Date</span>
                </label>
                <input type="date"
                       id="student-timetable-date-input"
                       class="date-input"
                       value="${selectedDate}"
                       aria-label="Select date to highlight"
                       onchange="StudentTimetableApp.handleTimetableDateChange(this.value)">
              </div>

              <button class="today-button ${isToday ? 'active' : ''}"
                      type="button"
                      onclick="StudentTimetableApp.resetTimetableToToday()"
                      aria-label="Reset timetable view to today">
                <i data-lucide="calendar-check" style="width:14px;height:14px;"></i>
                <span>Today</span>
              </button>

              <button class="print-button"
                      type="button"
                      onclick="window.print()"
                      aria-label="Print timetable schedule">
                <i data-lucide="printer" style="width:14px;height:14px;"></i>
                <span>Print Schedule</span>
              </button>
            </div>
          </div>

          <!-- Schedule Status Banner -->
          <div class="schedule-status ${isToday ? 'status-today' : 'status-custom'}">
            <div class="status-left">
              <span class="status-pulse-dot" aria-hidden="true"></span>
              <span class="status-date-text">
                Schedule for: <strong>${currentDayName}, ${readableDate}</strong>
              </span>
              <span class="status-badge ${isToday ? 'badge-today' : 'badge-selected'}">
                ${isToday ? "Today's Classes" : "Selected Date"}
              </span>
            </div>
            <div class="status-hint">
              ${isWeekend
                ? '<i data-lucide="info" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> <em>Weekend schedule highlighted below</em>'
                : `<i data-lucide="check" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Highlighting <strong>${currentDayName}</strong> in the schedule`
              }
            </div>
          </div>

          <!-- Advance Alert Strip for Upcoming Tests (e.g. In 2 Days, Tomorrow, Today) -->
          ${upcomingAlertStripHTML}
        </div>

        <!-- ==================== TIMETABLE GRID TABLE ==================== -->
        <div class="timetable-wrapper">
          <table class="timetable" role="table" aria-label="Student Weekly Timetable">
            <thead>
              <tr role="row">
                <th class="timetable-header-cell day-col-header" scope="col">
                  <div class="th-content">
                    <i data-lucide="calendar-days" style="width:14px;height:14px;"></i>
                    <span>Day</span>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 1</span>
                    <div class="th-time-range"><span>11.00 am - 12.00 pm</span></div>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 2</span>
                    <div class="th-time-range"><span>12.00 pm - 01.00 pm</span></div>
                  </div>
                </th>
                <th class="timetable-break-cell header-break" scope="col">
                  <span>15 Mins</span>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 3</span>
                    <div class="th-time-range"><span>01.15 pm - 02.15 pm</span></div>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 4</span>
                    <div class="th-time-range"><span>02.15 pm - 03.15 pm</span></div>
                  </div>
                </th>
                <th class="timetable-recess-cell header-recess" scope="col">
                  <span>30 Mins</span>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 5</span>
                    <div class="th-time-range"><span>03.45 pm - 04.45 pm</span></div>
                  </div>
                </th>
                <th class="timetable-header-cell time-slot-header" scope="col">
                  <div class="th-time-slot">
                    <span class="th-slot-num">Slot 6</span>
                    <div class="th-time-range"><span>04.45 pm - 05.45 pm</span></div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              ${scheduleRows.map(r => renderRowHTML(r, false)).join('')}
              ${saturdayHeaderRowHTML}
              ${renderRowHTML(saturdayRow, true)}
              ${sundayRowHTML}
            </tbody>
          </table>
        </div>

        <!-- ==================== OFFICIAL FOOTER & LEGEND ==================== -->
        <div class="official-legend-container">
          ${classData.practicalsTable && classData.batchesTable ? `
            <div class="official-tables-stack" style="margin-bottom:16px;">
              <!-- Subject & Code Table -->
              <div class="official-subtable-card" style="margin-bottom:12px;">
                <h5 style="font-size:12.5px; font-weight:800; color:var(--tt-navy); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                  <i data-lucide="book-open" style="width:14px;height:14px;"></i> Subject &amp; Code:
                </h5>
                <div style="overflow-x:auto;">
                  <table class="tt-subtable" style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #CBD5E1;">
                    <thead>
                      <tr style="background:#F1F5F9; font-weight:700; color:#1E293B; text-align:left;">
                        <th style="border:1px solid #CBD5E1; padding:6px 10px; width:85px; text-align:center;">Code</th>
                        <th style="border:1px solid #CBD5E1; padding:6px 10px;">Name of Subject (Full Name)</th>
                        <th style="border:1px solid #CBD5E1; padding:6px 10px;">Name of Faculty</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(classData.subjectKey || []).map(s => `
                        <tr>
                          <td style="border:1px solid #CBD5E1; padding:5px 10px; font-weight:700; text-align:center; background:#F8FAFC; color:var(--tt-navy);">${s.abbr}</td>
                          <td style="border:1px solid #CBD5E1; padding:5px 10px; font-weight:600;">${s.name}</td>
                          <td style="border:1px solid #CBD5E1; padding:5px 10px; color:#475569;">${s.faculty || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Practical Table -->
              <div class="official-subtable-card" style="margin-bottom:12px;">
                <h5 style="font-size:12.5px; font-weight:800; color:var(--tt-navy); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                  <i data-lucide="flask-conical" style="width:14px;height:14px;"></i> Practical:
                </h5>
                <div style="overflow-x:auto;">
                  <table class="tt-subtable" style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #CBD5E1;">
                    <thead>
                      <tr style="background:#F1F5F9; font-weight:700; color:#1E293B; text-align:left;">
                        <th style="border:1px solid #CBD5E1; padding:6px 10px; width:85px; text-align:center;">Code</th>
                        <th style="border:1px solid #CBD5E1; padding:6px 10px;">Name of Subject</th>
                        <th style="border:1px solid #CBD5E1; padding:6px 10px;">Name of Lab</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(classData.practicalsTable || []).map(p => `
                        <tr>
                          <td style="border:1px solid #CBD5E1; padding:5px 10px; font-weight:700; text-align:center; background:#F8FAFC; color:var(--tt-navy);">${p.code}</td>
                          <td style="border:1px solid #CBD5E1; padding:5px 10px; font-weight:600;">${p.name}</td>
                          <td style="border:1px solid #CBD5E1; padding:5px 10px; color:#475569;">${p.lab}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Practical Batches Table -->
              <div class="official-subtable-card" style="margin-bottom:12px;">
                <h5 style="font-size:12.5px; font-weight:800; color:var(--tt-navy); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                  <i data-lucide="users" style="width:14px;height:14px;"></i> Practical Batches:
                </h5>
                <div style="overflow-x:auto;">
                  <table class="tt-subtable" style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #CBD5E1; text-align:center;">
                    <thead>
                      <tr style="background:#F1F5F9; font-weight:700; color:#1E293B;">
                        <th style="border:1px solid #CBD5E1; padding:6px 10px; width:95px; background:#EEF2F6;">Batch</th>
                        ${(classData.batchesTable || []).map(b => `<th style="border:1px solid #CBD5E1; padding:6px 10px; font-weight:700;">${b.batch}</th>`).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="border:1px solid #CBD5E1; padding:6px 10px; font-weight:700; background:#F8FAFC; color:var(--tt-navy);">Roll No.</td>
                        ${(classData.batchesTable || []).map(b => `<td style="border:1px solid #CBD5E1; padding:6px 10px; font-weight:600; color:#334155;">${b.rolls}</td>`).join('')}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Official Signatures Footer -->
              <div class="tt-sign-footer" style="display:flex; justify-content:space-between; align-items:flex-end; padding:16px 12px 8px 12px; border-top:1px dashed #CBD5E1; margin-top:14px; font-size:12.5px; font-weight:700; color:#334155; flex-wrap:wrap; gap:16px;">
                <div><span>Date: <strong style="color:var(--tt-navy);">${classData.signDate || '18/07/2026'}</strong></span></div>
                <div><span>Time Table Coordinator</span></div>
                <div><span>Head of Department</span></div>
                <div><span>Dean (Academics)</span></div>
                <div><span>Principal</span></div>
              </div>
            </div>
          ` : `
            <div class="official-legend-grid">
              <div class="legend-box faculty-legend">
                <h5 class="legend-box-title"><i data-lucide="users" style="width:13px;height:13px;"></i> Faculty Key (${classData.code}):</h5>
                <div class="legend-tag-list">
                  ${(classData.facultyKey || []).map(f => `<span class="faculty-tag"><strong>${f.abbr}:</strong> ${f.name}</span>`).join('')}
                </div>
              </div>
              <div class="legend-box subject-legend">
                <h5 class="legend-box-title"><i data-lucide="book-open" style="width:13px;height:13px;"></i> Subject Key (${classData.code}):</h5>
                <div class="legend-tag-list">
                  ${(classData.subjectKey || []).map(s => `<span class="subject-tag"><strong>${s.abbr}:</strong> ${s.name}</span>`).join('')}
                </div>
              </div>
            </div>
          `}
          <div class="timetable-legend-bar" style="border-top:1px solid #E2E8F0; padding-top:10px;">
            <div class="legend-items">
              <span class="legend-title">Legend:</span>
              <div class="legend-item"><span class="legend-dot lecture-dot"></span><span>Theory Lecture (1 Hr)</span></div>
              <div class="legend-item"><span class="legend-dot lab-dot"></span><span>Practical Lab Session (2 Hrs)</span></div>
              <div class="legend-item"><span class="legend-dot test-dot"></span><span>Scheduled Test / Assessment</span></div>
              <div class="legend-item"><span class="legend-dot off-dot"></span><span>Break / Recess / Prep</span></div>
            </div>
          </div>
        </div>

      </div>
    `;

    this.initLucideIcons();
  },

  showToast(message, type = 'info') {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-stack";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `dashboard-toast toast-${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'}" style="width:16px;height:16px;flex-shrink:0;"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    this.initLucideIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Global expose
window.StudentTimetableApp = StudentTimetableApp;

// Auto initialize on DOM load or immediately if already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    StudentTimetableApp.init();
  });
} else {
  StudentTimetableApp.init();
}
