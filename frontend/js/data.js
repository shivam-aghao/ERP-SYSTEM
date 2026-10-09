/* ========================================================
   ACADEMIC DATE UTILITIES - DYNAMIC DATE HANDLING
   ======================================================== */
const AcademicDateUtils = {
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],

  shortMonthNames: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],

  dayNames: [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ],

  shortDayNames: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],

  getNow() {
    return new Date();
  },

  getTodayISO(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Returns formatted readable date "DD Month YYYY" (e.g. "21 September 2026")
  formatReadableDate(dateInput) {
    let year, monthIndex, day;
    if (!dateInput) {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
      day = now.getDate();
    } else if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        monthIndex = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const parsed = new Date(dateInput);
        if (isNaN(parsed.getTime())) return dateInput;
        year = parsed.getFullYear();
        monthIndex = parsed.getMonth();
        day = parsed.getDate();
      }
    } else if (dateInput instanceof Date) {
      year = dateInput.getFullYear();
      monthIndex = dateInput.getMonth();
      day = dateInput.getDate();
    } else {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
      day = now.getDate();
    }
    const monthName = this.monthNames[monthIndex] || "";
    const formattedDay = String(day).padStart(2, '0');
    return `${formattedDay} ${monthName} ${year}`;
  },

  // Returns "Weekday, DD Month YYYY" (e.g., "Monday, 21 September 2026")
  formatFullWeekdayDate(dateInput = new Date()) {
    let d;
    if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput || new Date();
    }
    const weekday = this.dayNames[d.getDay()];
    const formatted = this.formatReadableDate(d);
    return `${weekday}, ${formatted}`;
  },

  // Returns relative date in "DD Month YYYY" (or short month "DD Mon YYYY")
  getRelativeFutureDate(daysAhead, shortMonth = false) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const day = String(d.getDate()).padStart(2, '0');
    const monthName = shortMonth ? this.shortMonthNames[d.getMonth()] : this.monthNames[d.getMonth()];
    return `${day} ${monthName} ${d.getFullYear()}`;
  },

  // Dynamic Academic Term calculation
  getCurrentAcademicTerm(d = new Date()) {
    const year = d.getFullYear();
    const month = d.getMonth(); // 0 = Jan, 11 = Dec
    if (month >= 6) { // July to Dec
      return {
        academicYear: `${year}-${year + 1}`,
        semesterType: "Odd",
        semesterName: "Semester 5 (Odd)",
        fullTerm: `${year}-${year + 1} (Odd Semester)`
      };
    } else { // Jan to June
      return {
        academicYear: `${year - 1}-${year}`,
        semesterType: "Even",
        semesterName: "Semester 6 (Even)",
        fullTerm: `${year - 1}-${year} (Even Semester)`
      };
    }
  },

  getDayName(dateInput) {
    let d;
    if (!dateInput) d = new Date();
    else if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput;
    }
    return this.dayNames[d.getDay()] || "Monday";
  }
};

if (typeof window !== 'undefined') {
  window.AcademicDateUtils = AcademicDateUtils;
}

/* ========================================================
   TEACHER ERP DATA STORE - EXPANDED ACADEMIC MODEL
   ======================================================== */

/* ========================================================
   OFFICIAL SSGMCE CSE FACULTY PERSONAL TIMETABLES
   Extracted directly from DATA/Personal Timtable for teacher.pdf
   Department of Computer Science & Engineering, Session 2026-2027 (Autumn)
   ======================================================== */
const SSGMCE_FACULTY_TIMETABLES = {
  "EMP-CSE-1001": {
    "name": "Prof. J. M. Patil",
    "teaching_load": [
      {
        "semester": "VII",
        "code": "7KS03",
        "abbr": "CC",
        "theory": 4,
        "practical": 0,
        "total": 12
      },
      {
        "semester": "V",
        "code": "5CS224PC",
        "abbr": "DBMS",
        "theory": 0,
        "practical": 8,
        "total": 8
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 1,
          "subject": "CC",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "DBMS Lab (Batch D)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 4,
          "subject": "DBMS Lab (Batch D)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Tuesday": [
        {
          "slot": 1,
          "subject": "CC",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "DBMS Lab (Batch B)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 4,
          "subject": "DBMS Lab (Batch B)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "B"
        }
      ],
      "Wednesday": [
        {
          "slot": 1,
          "subject": "CC",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Thursday": [
        {
          "slot": 3,
          "subject": "DBMS Lab (Batch C)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 4,
          "subject": "DBMS Lab (Batch C)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "C"
        }
      ],
      "Friday": [
        {
          "slot": 1,
          "subject": "CC",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "DBMS Lab (Batch A)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 4,
          "subject": "DBMS Lab (Batch A)",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1002": {
    "name": "Dr. N. M. Kandoi",
    "teaching_load": [
      {
        "semester": "VII",
        "code": "7KS05",
        "abbr": "BF",
        "theory": 3,
        "practical": 0,
        "total": 15
      },
      {
        "semester": "VII",
        "code": "7KS08",
        "abbr": "ET LAB IV BF",
        "theory": 0,
        "practical": 8,
        "total": 8
      },
      {
        "semester": "III",
        "code": "3CS400EL",
        "abbr": "Community / Field Project",
        "theory": 0,
        "practical": 4,
        "total": 4
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 2,
          "subject": "BF",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "BF Lab (Batch B)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 6,
          "subject": "BF Lab (Batch B)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "B"
        }
      ],
      "Tuesday": [
        {
          "slot": 1,
          "subject": "CEP (Batch D)",
          "class": "2R2",
          "venue": "Seminar Hall",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 2,
          "subject": "CEP (Batch D)",
          "class": "2R2",
          "venue": "Seminar Hall",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 5,
          "subject": "BF Lab (Batch C)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 6,
          "subject": "BF Lab (Batch C)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "C"
        }
      ],
      "Wednesday": [
        {
          "slot": 2,
          "subject": "BF",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "BF Lab (Batch A)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 4,
          "subject": "BF Lab (Batch A)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Thursday": [
        {
          "slot": 1,
          "subject": "CEP (Batch D)",
          "class": "2R2",
          "venue": "Seminar Hall",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 2,
          "subject": "CEP (Batch D)",
          "class": "2R2",
          "venue": "Seminar Hall",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Friday": [
        {
          "slot": 2,
          "subject": "BF",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "BF Lab (Batch D)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 6,
          "subject": "BF Lab (Batch D)",
          "class": "4R",
          "venue": "ET Lab IV",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1003": {
    "name": "Prof. C. M. Mankar",
    "teaching_load": [
      {
        "semester": "V",
        "code": "5CS221PC",
        "abbr": "CD",
        "theory": 3,
        "practical": 8,
        "total": 17
      },
      {
        "semester": "V",
        "code": "5CS227MD",
        "abbr": "MDM#3",
        "theory": 2,
        "practical": 0,
        "total": 2
      },
      {
        "semester": "III",
        "code": "3CS400EL",
        "abbr": "Community / Field Project",
        "theory": 0,
        "practical": 4,
        "total": 4
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 2,
          "subject": "CD (Compiler Design)",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "CD Lab (Batch B)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 4,
          "subject": "CD Lab (Batch B)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 5,
          "subject": "MDM#3",
          "class": "3R",
          "venue": "C1",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 2,
          "subject": "CD (Compiler Design)",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "CD Lab (Batch A)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 4,
          "subject": "CD Lab (Batch A)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 5,
          "subject": "MDM#3",
          "class": "3R",
          "venue": "C1",
          "is_lab": false,
          "batch": null
        }
      ],
      "Wednesday": [
        {
          "slot": 5,
          "subject": "CEP (2R1 Batch C)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 6,
          "subject": "CEP (2R1 Batch C)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "C"
        }
      ],
      "Thursday": [
        {
          "slot": 2,
          "subject": "CD (Compiler Design)",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "CD Lab (Batch D)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 4,
          "subject": "CD Lab (Batch D)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 5,
          "subject": "CEP (2R1 Batch C)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 6,
          "subject": "CEP (2R1 Batch C)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "C"
        }
      ],
      "Friday": [
        {
          "slot": 3,
          "subject": "CD Lab (Batch C)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 4,
          "subject": "CD Lab (Batch C)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "C"
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1004": {
    "name": "Dr. V. S. Mahalle",
    "teaching_load": [
      {
        "semester": "III",
        "code": "3CS201PC",
        "abbr": "OOP",
        "theory": 4,
        "practical": 0,
        "total": 17
      },
      {
        "semester": "III",
        "code": "3CS203PC",
        "abbr": "OOP_LAB",
        "theory": 0,
        "practical": 8,
        "total": 8
      },
      {
        "semester": "V",
        "code": "5KS04",
        "abbr": "PE-I (ICS)",
        "theory": 3,
        "practical": 0,
        "total": 3
      },
      {
        "semester": "V",
        "code": "5KS08",
        "abbr": "ET LAB-I (ICS)",
        "theory": 0,
        "practical": 2,
        "total": 2
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 1,
          "subject": "OOP Lab (Batch D)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 2,
          "subject": "OOP Lab (Batch D)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 3,
          "subject": "OOP",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "ICS",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 1,
          "subject": "OOP Lab (Batch B)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 2,
          "subject": "OOP Lab (Batch B)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 3,
          "subject": "OOP",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "ICS",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": false,
          "batch": null
        }
      ],
      "Wednesday": [
        {
          "slot": 1,
          "subject": "OOP Lab (Batch C)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 2,
          "subject": "OOP Lab (Batch C)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 3,
          "subject": "ET Lab: ICS (Batch H)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "H"
        },
        {
          "slot": 4,
          "subject": "ET Lab: ICS (Batch H)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "H"
        },
        {
          "slot": 5,
          "subject": "OOP",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Thursday": [
        {
          "slot": 1,
          "subject": "OOP Lab (Batch A)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 2,
          "subject": "OOP Lab (Batch A)",
          "class": "2R2",
          "venue": "Computer Lab 1",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Friday": [
        {
          "slot": 1,
          "subject": "ICS",
          "class": "3R",
          "venue": "DBMS Lab",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "OOP",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1005": {
    "name": "Dr. P. K. Bharne",
    "teaching_load": [
      {
        "semester": "V",
        "code": "5CS223PE",
        "abbr": "PE-I DSS",
        "theory": 3,
        "practical": 6,
        "total": 18
      },
      {
        "semester": "VII",
        "code": "7KS04",
        "abbr": "PE-III DWM",
        "theory": 3,
        "practical": 6,
        "total": 9
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 4,
          "subject": "DWM",
          "class": "4R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 6,
          "subject": "PE-I DSS",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 2,
          "subject": "DWM",
          "class": "4R",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "ET Lab-I DSS (Batch G)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "G"
        },
        {
          "slot": 4,
          "subject": "ET Lab-I DSS (Batch G)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "G"
        },
        {
          "slot": 6,
          "subject": "PE-I DSS",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        }
      ],
      "Wednesday": [
        {
          "slot": 3,
          "subject": "ET Lab-I DSS (Batch E)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "E"
        },
        {
          "slot": 4,
          "subject": "ET Lab-I DSS (Batch E)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "E"
        },
        {
          "slot": 5,
          "subject": "ET Lab III - DW&M (Batch G)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "G"
        },
        {
          "slot": 6,
          "subject": "ET Lab III - DW&M (Batch G)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "G"
        }
      ],
      "Thursday": [
        {
          "slot": 4,
          "subject": "DWM",
          "class": "4R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "ET Lab III- DWM (Batch F)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "F"
        },
        {
          "slot": 6,
          "subject": "ET Lab III- DWM (Batch F)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "F"
        }
      ],
      "Friday": [
        {
          "slot": 1,
          "subject": "PE-I DSS",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "ET Lab III - DW&M (Batch E)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "E"
        },
        {
          "slot": 4,
          "subject": "ET Lab III - DW&M (Batch E)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "E"
        },
        {
          "slot": 5,
          "subject": "ET Lab-I DSS (Batch F)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "F"
        },
        {
          "slot": 6,
          "subject": "ET Lab-I DSS (Batch F)",
          "class": "3R",
          "venue": "ET Lab I",
          "is_lab": true,
          "batch": "F"
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1006": {
    "name": "Prof. K. P. Sable",
    "teaching_load": [
      {
        "semester": "III",
        "code": "3CS202PC",
        "abbr": "DS",
        "theory": 4,
        "practical": 8,
        "total": 17
      },
      {
        "semester": "VII",
        "code": "7KS01",
        "abbr": "SSEE",
        "theory": 3,
        "practical": 0,
        "total": 3
      },
      {
        "semester": "V",
        "code": "5CS229ML",
        "abbr": "MDM#5",
        "theory": 0,
        "practical": 2,
        "total": 2
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 1,
          "subject": "DS (Data Structures)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "SSEE",
          "class": "4R",
          "venue": "Room 402",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 1,
          "subject": "DS (Data Structures)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "SSEE",
          "class": "4R",
          "venue": "Room 402",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "DS Lab (2R1 Batch C)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 6,
          "subject": "DS Lab (2R1 Batch C)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "C"
        }
      ],
      "Wednesday": [
        {
          "slot": 1,
          "subject": "DS (Data Structures)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "SSEE",
          "class": "4R",
          "venue": "Room 402",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "DS Lab (2R1 Batch B)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 6,
          "subject": "DS Lab (2R1 Batch B)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B"
        }
      ],
      "Thursday": [
        {
          "slot": 5,
          "subject": "DS Lab (2R1 Batch D)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 6,
          "subject": "DS Lab (2R1 Batch D)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Friday": [
        {
          "slot": 1,
          "subject": "DS Lab (2R1 Batch A)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 2,
          "subject": "DS Lab (2R1 Batch A)",
          "class": "2R1",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 3,
          "subject": "DS (Data Structures)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        }
      ],
      "Saturday": [
        {
          "slot": 3,
          "subject": "MDM (WT-B4)",
          "class": "3R",
          "venue": "Lab 04",
          "is_lab": true,
          "batch": "B4"
        },
        {
          "slot": 4,
          "subject": "MDM (WT-B4)",
          "class": "3R",
          "venue": "Lab 04",
          "is_lab": true,
          "batch": "B4"
        }
      ]
    }
  },
  "EMP-CSE-1007": {
    "name": "Prof. S. B. Pagrut",
    "teaching_load": [
      {
        "semester": "III",
        "code": "3CS201PC",
        "abbr": "OOP",
        "theory": 4,
        "practical": 8,
        "total": 17
      },
      {
        "semester": "VII",
        "code": "7KS04",
        "abbr": "PE-III DF",
        "theory": 3,
        "practical": 2,
        "total": 5
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 2,
          "subject": "OOP (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 4,
          "subject": "PE-III DF (Batch B6)",
          "class": "4R",
          "venue": "Room 402",
          "is_lab": false,
          "batch": "B6"
        }
      ],
      "Tuesday": [
        {
          "slot": 2,
          "subject": "PE-III DF",
          "class": "4R",
          "venue": "Room 402",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 3,
          "subject": "OOP (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "OOP Lab (2R1 Batch A)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 6,
          "subject": "OOP Lab (2R1 Batch A)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Wednesday": [
        {
          "slot": 2,
          "subject": "OOP (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "OOP Lab (2R1 Batch D)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 6,
          "subject": "OOP Lab (2R1 Batch D)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Thursday": [
        {
          "slot": 3,
          "subject": "OOP (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 4,
          "subject": "PE-III DF (Batch B2)",
          "class": "4R",
          "venue": "Room 402",
          "is_lab": false,
          "batch": "B2"
        },
        {
          "slot": 5,
          "subject": "OOP Lab (2R1 Batch B)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 6,
          "subject": "OOP Lab (2R1 Batch B)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B"
        }
      ],
      "Friday": [
        {
          "slot": 1,
          "subject": "OOP Lab (2R1 Batch C)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 2,
          "subject": "OOP Lab (2R1 Batch C)",
          "class": "2R1",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 3,
          "subject": "ET Lab III - DF (Batch H)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "H"
        },
        {
          "slot": 4,
          "subject": "ET Lab III - DF (Batch H)",
          "class": "4R",
          "venue": "ET Lab III",
          "is_lab": true,
          "batch": "H"
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1008": {
    "name": "Dr. R. A. Zamare",
    "teaching_load": [
      {
        "semester": "V",
        "code": "5CS222PC",
        "abbr": "CAO",
        "theory": 3,
        "practical": 0,
        "total": 17
      },
      {
        "semester": "III",
        "code": "3CS400EL",
        "abbr": "Community / Field Project",
        "theory": 0,
        "practical": 4,
        "total": 4
      },
      {
        "semester": "I",
        "code": "WS-R1",
        "abbr": "WS(R1)",
        "theory": 0,
        "practical": 6,
        "total": 6
      },
      {
        "semester": "V",
        "code": "5CS228MD",
        "abbr": "WT (MDM#4 / MDM#5)",
        "theory": 2,
        "practical": 2,
        "total": 4
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 1,
          "subject": "CA&O (Computer Arch & Org)",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 5,
          "subject": "CEP (2R1 Batch B)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 6,
          "subject": "CEP (2R1 Batch B)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "B"
        }
      ],
      "Wednesday": [
        {
          "slot": 2,
          "subject": "CA&O (Computer Arch & Org)",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "MDM#4",
          "class": "3R",
          "venue": "C2",
          "is_lab": false,
          "batch": null
        }
      ],
      "Thursday": [
        {
          "slot": 1,
          "subject": "CA&O (Computer Arch & Org)",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "MDM#4",
          "class": "3R",
          "venue": "C2",
          "is_lab": false,
          "batch": null
        }
      ],
      "Friday": [
        {
          "slot": 1,
          "subject": "CEP (2R1 Batch B)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 2,
          "subject": "CEP (2R1 Batch B)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "B"
        }
      ],
      "Saturday": [
        {
          "slot": 1,
          "subject": "MDM (WT-B1)",
          "class": "3R",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B1"
        },
        {
          "slot": 2,
          "subject": "MDM (WT-B1)",
          "class": "3R",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B1"
        }
      ]
    }
  },
  "EMP-CSE-1009": {
    "name": "Prof. R. V. Deshmukh",
    "teaching_load": [
      {
        "semester": "VII",
        "code": "7KS02 / 7KS06",
        "abbr": "CG (Computer Graphics)",
        "theory": 3,
        "practical": 8,
        "total": 18
      },
      {
        "semester": "V",
        "code": "5CS220PC",
        "abbr": "DBMS",
        "theory": 3,
        "practical": 0,
        "total": 3
      },
      {
        "semester": "III",
        "code": "3CS400EL",
        "abbr": "Community / Field Project",
        "theory": 0,
        "practical": 4,
        "total": 4
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 1,
          "subject": "CEP (2R2 Batch C)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 2,
          "subject": "CEP (2R2 Batch C)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 5,
          "subject": "CG Lab (Batch C)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 6,
          "subject": "CG Lab (Batch C)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "C"
        }
      ],
      "Tuesday": [
        {
          "slot": 1,
          "subject": "DBMS",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 4,
          "subject": "CG (Computer Graphics)",
          "class": "4R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "CG Lab (Batch D)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 6,
          "subject": "CG Lab (Batch D)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Wednesday": [
        {
          "slot": 1,
          "subject": "DBMS",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 4,
          "subject": "CG (Computer Graphics)",
          "class": "4R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "CG Lab (Batch B)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 6,
          "subject": "CG Lab (Batch B)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "B"
        }
      ],
      "Thursday": [
        {
          "slot": 1,
          "subject": "CEP (2R2 Batch C)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 2,
          "subject": "CEP (2R2 Batch C)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 3,
          "subject": "CG (Computer Graphics)",
          "class": "4R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        }
      ],
      "Friday": [
        {
          "slot": 2,
          "subject": "DBMS",
          "class": "3R",
          "venue": "B206",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "CG Lab (Batch A)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 6,
          "subject": "CG Lab (Batch A)",
          "class": "4R",
          "venue": "Graphics Lab",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1010": {
    "name": "Prof. S. M. Jawake",
    "teaching_load": [
      {
        "semester": "I",
        "code": "CP-101",
        "abbr": "CP (Computer Prog)",
        "theory": 4,
        "practical": 6,
        "total": 18
      },
      {
        "semester": "V",
        "code": "5CS227MD",
        "abbr": "DBMS",
        "theory": 2,
        "practical": 0,
        "total": 2
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 5,
          "subject": "MDM#3",
          "class": "3R",
          "venue": "C2",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 5,
          "subject": "MDM#3",
          "class": "3R",
          "venue": "C2",
          "is_lab": false,
          "batch": null
        }
      ],
      "Wednesday": [
        {
          "slot": 5,
          "subject": "CEP (2R1 Batch A)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 6,
          "subject": "CEP (2R1 Batch A)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Thursday": [
        {
          "slot": 5,
          "subject": "CEP (2R1 Batch A)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 6,
          "subject": "CEP (2R1 Batch A)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Friday": [],
      "Saturday": [
        {
          "slot": 3,
          "subject": "MDM (WT-B2)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B2"
        },
        {
          "slot": 4,
          "subject": "MDM (WT-B2)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B2"
        }
      ]
    }
  },
  "EMP-CSE-1011": {
    "name": "Prof. T. A. Puranik",
    "teaching_load": [
      {
        "semester": "III",
        "code": "3CS200PC",
        "abbr": "DSGT-R1",
        "theory": 4,
        "practical": 0,
        "total": 19
      },
      {
        "semester": "III",
        "code": "3CS200PC",
        "abbr": "DSGT-R2",
        "theory": 4,
        "practical": 0,
        "total": 4
      },
      {
        "semester": "I",
        "code": "SKL-101",
        "abbr": "Skill lab-I",
        "theory": 1,
        "practical": 6,
        "total": 7
      },
      {
        "semester": "III",
        "code": "3CS400EL",
        "abbr": "Community / Field Project",
        "theory": 0,
        "practical": 4,
        "total": 4
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 1,
          "subject": "CEP (2R2 Batch B)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 2,
          "subject": "CEP (2R2 Batch B)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 3,
          "subject": "DS&GT (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 2,
          "subject": "DS&GT (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "DSGT (2R2)",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Wednesday": [
        {
          "slot": 1,
          "subject": "CEP (2R2 Batch B)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 2,
          "subject": "CEP (2R2 Batch B)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 3,
          "subject": "DS&GT (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "DS&GT (2R2)",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Thursday": [
        {
          "slot": 2,
          "subject": "DSGT (2R1)",
          "class": "2R1",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "DS&GT (2R2)",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Friday": [
        {
          "slot": 2,
          "subject": "DS&GT (2R2)",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Saturday": []
    }
  },
  "EMP-CSE-1012": {
    "name": "Prof. V. S. Kanherkar",
    "teaching_load": [
      {
        "semester": "II",
        "code": "1AL102ES",
        "abbr": "CP",
        "theory": 4,
        "practical": 6,
        "total": 18
      },
      {
        "semester": "III",
        "code": "3CS205MD",
        "abbr": "MDM#1",
        "theory": 2,
        "practical": 0,
        "total": 2
      },
      {
        "semester": "III",
        "code": "3CS400EL",
        "abbr": "Community / Field Project",
        "theory": 0,
        "practical": 4,
        "total": 4
      },
      {
        "semester": "V",
        "code": "5CS229ML",
        "abbr": "MDM#5",
        "theory": 0,
        "practical": 2,
        "total": 2
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 4,
          "subject": "MDM#1",
          "class": "3R",
          "venue": "C2",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 1,
          "subject": "CEP (2R2 Batch A)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 2,
          "subject": "CEP (2R2 Batch A)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 4,
          "subject": "MDM#1",
          "class": "3R",
          "venue": "C2",
          "is_lab": false,
          "batch": null
        }
      ],
      "Wednesday": [
        {
          "slot": 1,
          "subject": "CEP (2R2 Batch A)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 2,
          "subject": "CEP (2R2 Batch A)",
          "class": "2R2",
          "venue": "Room 305",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Thursday": [],
      "Friday": [],
      "Saturday": [
        {
          "slot": 1,
          "subject": "MDM (WT-B3)",
          "class": "3R",
          "venue": "Lab 03",
          "is_lab": true,
          "batch": "B3"
        },
        {
          "slot": 2,
          "subject": "MDM (WT-B3)",
          "class": "3R",
          "venue": "Lab 03",
          "is_lab": true,
          "batch": "B3"
        }
      ]
    }
  },
  "EMP-CSE-1013": {
    "name": "Prof. N. N. Fatkar",
    "teaching_load": [
      {
        "semester": "III",
        "code": "3CS202PC",
        "abbr": "DS-R2",
        "theory": 4,
        "practical": 8,
        "total": 18
      },
      {
        "semester": "V",
        "code": "5CS229ML",
        "abbr": "(MDM#5)",
        "theory": 0,
        "practical": 4,
        "total": 4
      },
      {
        "semester": "V",
        "code": "5CS230OE",
        "abbr": "OE-III",
        "theory": 2,
        "practical": 0,
        "total": 2
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 1,
          "subject": "DS Lab (2R2 Batch A)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "A"
        },
        {
          "slot": 2,
          "subject": "DS Lab (2R2 Batch A)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "A"
        }
      ],
      "Tuesday": [
        {
          "slot": 1,
          "subject": "DS Lab (2R2 Batch C)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 2,
          "subject": "DS Lab (2R2 Batch C)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "C"
        },
        {
          "slot": 6,
          "subject": "DS (2R2)",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        }
      ],
      "Wednesday": [
        {
          "slot": 1,
          "subject": "DS Lab (2R2 Batch D)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 2,
          "subject": "DS Lab (2R2 Batch D)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 3,
          "subject": "DS (2R2)",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 6,
          "subject": "OE-III",
          "class": "3R",
          "venue": "C1",
          "is_lab": false,
          "batch": null
        }
      ],
      "Thursday": [
        {
          "slot": 1,
          "subject": "DS Lab (2R2 Batch B)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 2,
          "subject": "DS Lab (2R2 Batch B)",
          "class": "2R2",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B"
        },
        {
          "slot": 3,
          "subject": "DS (2R2)",
          "class": "2R2",
          "venue": "B007",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 6,
          "subject": "OE-III",
          "class": "3R",
          "venue": "C1",
          "is_lab": false,
          "batch": null
        }
      ],
      "Friday": [
        {
          "slot": 1,
          "subject": "DS (2R2)",
          "class": "2R2",
          "venue": "B108",
          "is_lab": false,
          "batch": null
        }
      ],
      "Saturday": [
        {
          "slot": 1,
          "subject": "MDM (WT-B6)",
          "class": "3R",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B6"
        },
        {
          "slot": 2,
          "subject": "MDM (WT-B6)",
          "class": "3R",
          "venue": "Lab 01",
          "is_lab": true,
          "batch": "B6"
        },
        {
          "slot": 3,
          "subject": "MDM (WT-B7)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B7"
        },
        {
          "slot": 4,
          "subject": "MDM (WT-B7)",
          "class": "3R",
          "venue": "Lab 02",
          "is_lab": true,
          "batch": "B7"
        }
      ]
    }
  },
  "EMP-CSE-1014": {
    "name": "Prof. M. D. Rakhonde",
    "teaching_load": [
      {
        "semester": "V",
        "code": "5CS228MD",
        "abbr": "(MDM#4)",
        "theory": 2,
        "practical": 0,
        "total": 16
      },
      {
        "semester": "V",
        "code": "5CS229ML",
        "abbr": "MDM#5",
        "theory": 0,
        "practical": 4,
        "total": 4
      },
      {
        "semester": "III",
        "code": "3CS206OE",
        "abbr": "OE -I",
        "theory": 3,
        "practical": 0,
        "total": 3
      },
      {
        "semester": "I",
        "code": "SKL-102",
        "abbr": "Skill Lab-I(R2)",
        "theory": 1,
        "practical": 6,
        "total": 7
      }
    ],
    "schedule": {
      "Monday": [],
      "Tuesday": [],
      "Wednesday": [
        {
          "slot": 4,
          "subject": "OE-I",
          "class": "2R1",
          "venue": "A3",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "MDM#4",
          "class": "3R",
          "venue": "C1",
          "is_lab": false,
          "batch": null
        }
      ],
      "Thursday": [
        {
          "slot": 4,
          "subject": "OE-I",
          "class": "2R1",
          "venue": "A3",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "MDM#4",
          "class": "3R",
          "venue": "C1",
          "is_lab": false,
          "batch": null
        }
      ],
      "Friday": [
        {
          "slot": 4,
          "subject": "OE-I",
          "class": "2R1",
          "venue": "A3",
          "is_lab": false,
          "batch": null
        }
      ],
      "Saturday": [
        {
          "slot": 1,
          "subject": "MDM (WT-B5)",
          "class": "3R",
          "venue": "Lab 03",
          "is_lab": true,
          "batch": "B5"
        },
        {
          "slot": 2,
          "subject": "MDM (WT-B5)",
          "class": "3R",
          "venue": "Lab 03",
          "is_lab": true,
          "batch": "B5"
        },
        {
          "slot": 3,
          "subject": "MDM (WT-8)",
          "class": "3R",
          "venue": "Lab 04",
          "is_lab": true,
          "batch": "WT-8"
        },
        {
          "slot": 4,
          "subject": "MDM (WT-8)",
          "class": "3R",
          "venue": "Lab 04",
          "is_lab": true,
          "batch": "WT-8"
        }
      ]
    }
  },
  "EMP-CSE-1015": {
    "name": "Mr. Krushan. V. Kulthe",
    "teaching_load": [
      {
        "semester": "I",
        "code": "WS-102",
        "abbr": "WS(R2)",
        "theory": 1,
        "practical": 6,
        "total": 13
      },
      {
        "semester": "III",
        "code": "3CS400EL",
        "abbr": "Community / Field Project",
        "theory": 0,
        "practical": 4,
        "total": 4
      },
      {
        "semester": "III",
        "code": "5CS205MD",
        "abbr": "MDM#1",
        "theory": 2,
        "practical": 0,
        "total": 2
      }
    ],
    "schedule": {
      "Monday": [
        {
          "slot": 4,
          "subject": "MDM#1",
          "class": "2R1",
          "venue": "A4",
          "is_lab": false,
          "batch": null
        }
      ],
      "Tuesday": [
        {
          "slot": 4,
          "subject": "MDM#1",
          "class": "2R1",
          "venue": "A4",
          "is_lab": false,
          "batch": null
        },
        {
          "slot": 5,
          "subject": "CEP (2R1 Batch D)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 6,
          "subject": "CEP (2R1 Batch D)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Wednesday": [],
      "Thursday": [],
      "Friday": [
        {
          "slot": 1,
          "subject": "CEP (2R1 Batch D)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "D"
        },
        {
          "slot": 2,
          "subject": "CEP (2R1 Batch D)",
          "class": "2R1",
          "venue": "Room 201",
          "is_lab": true,
          "batch": "D"
        }
      ],
      "Saturday": []
    }
  }
};

if (typeof window !== 'undefined') {
  window.SSGMCE_FACULTY_TIMETABLES = SSGMCE_FACULTY_TIMETABLES;
}

const getSessionFaculty = () => {
  try {
    if (typeof window !== 'undefined' && window.ERP_AUTH) {
      const u = window.ERP_AUTH.getCurrentUser();
      if (u && (u.role === 'teacher' || u.role === 'faculty')) {
        return {
          name: u.fullName || u.name || "Faculty Member",
          prefix: "Prof.",
          title: u.designation || "Faculty Member",
          department: u.department || "Computer Science & Engineering",
          departmentCode: u.departmentCode || "CSE",
          employeeId: u.empCode || u.emp_code || "",
          email: u.email || "",
          phone: u.phone || "",
          avatarInitials: u.initials || "FA",
          academicYear: AcademicDateUtils.getCurrentAcademicTerm().academicYear,
          currentSemester: AcademicDateUtils.getCurrentAcademicTerm().semesterName
        };
      }
    }
  } catch (_) {}
  return {
    name: "Prof. J. M. Patil",
    prefix: "Prof.",
    title: "Professor & Head, CSE",
    department: "Computer Science & Engineering",
    departmentCode: "CSE",
    employeeId: "EMP-CSE-1001",
    email: "jmpatil@ssgmce.ac.in",
    phone: "+91 94228 12345",
    avatarInitials: "JP",
    academicYear: AcademicDateUtils.getCurrentAcademicTerm().academicYear,
    currentSemester: AcademicDateUtils.getCurrentAcademicTerm().semesterName
  };
};

const TeacherERPData = {
  get faculty() {
    return getSessionFaculty();
  },

  institution: {
    name: "Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
    subTitle: "(An Autonomous Institute)",
    shortName: "SSGMCE"
  },

  stats: {
    totalClasses: "0",
    todayClasses: "0",
    totalStudents: "0",
    attendancePending: "0",
    attendanceCompletedCount: 0,
    attendancePendingCount: 0,
    attendancePercent: 0
  },

  departments: [],
  classes: {},
  subjects: {},

  _studentsData: {
    "2R1": [
      { rollNo: "01", name: "Aarav Sharma", email: "aarav.sharma@student.ssgmce.ac.in", attendance: 88 },
      { rollNo: "02", name: "Ananya Patel", email: "ananya.patel@student.ssgmce.ac.in", attendance: 92 },
      { rollNo: "03", name: "Devansh Deshmukh", email: "devansh.deshmukh@student.ssgmce.ac.in", attendance: 78 },
      { rollNo: "04", name: "Isha Kulkarni", email: "isha.kulkarni@student.ssgmce.ac.in", attendance: 95 },
      { rollNo: "05", name: "Rohan Joshi", email: "rohan.joshi@student.ssgmce.ac.in", attendance: 84 }
    ],
    "2R2": [
      { rollNo: "01", name: "Tanvi Wankhade", email: "tanvi.wankhade@student.ssgmce.ac.in", attendance: 90 },
      { rollNo: "02", name: "Aditya Raut", email: "aditya.raut@student.ssgmce.ac.in", attendance: 82 },
      { rollNo: "03", name: "Snehal Kale", email: "snehal.kale@student.ssgmce.ac.in", attendance: 94 }
    ],
    "3R": [
      { rollNo: "01", name: "Pranav Gawande", email: "pranav.gawande@student.ssgmce.ac.in", attendance: 86 },
      { rollNo: "02", name: "Pooja Thakare", email: "pooja.thakare@student.ssgmce.ac.in", attendance: 91 },
      { rollNo: "03", name: "Kunal Chopade", email: "kunal.chopade@student.ssgmce.ac.in", attendance: 79 }
    ]
  },

  getStudentsForClass(classCode) {
    if (this._studentsData && this._studentsData[classCode]) {
      return this._studentsData[classCode];
    }
    return [];
  },

  get students() {
    return this._studentsData || {};
  },

  set students(val) {
    if (val && typeof val === 'object') {
      this._studentsData = val;
    }
  },

  // Today's classes schedule for Dashboard
    // All 15 Faculty Members from Official PDF
  facultyList: [
    { empCode: "EMP-CSE-1001", name: "Prof. J. M. Patil", title: "Professor & Head, CSE", totalLoad: 12 },
    { empCode: "EMP-CSE-1002", name: "Dr. N. M. Kandoi", title: "Associate Professor", totalLoad: 15 },
    { empCode: "EMP-CSE-1003", name: "Prof. C. M. Mankar", title: "Assistant Professor", totalLoad: 17 },
    { empCode: "EMP-CSE-1004", name: "Dr. V. S. Mahalle", title: "Associate Professor", totalLoad: 17 },
    { empCode: "EMP-CSE-1005", name: "Dr. P. K. Bharne", title: "Associate Professor", totalLoad: 18 },
    { empCode: "EMP-CSE-1006", name: "Prof. K. P. Sable", title: "Assistant Professor", totalLoad: 17 },
    { empCode: "EMP-CSE-1007", name: "Prof. S. B. Pagrut", title: "Assistant Professor", totalLoad: 17 },
    { empCode: "EMP-CSE-1008", name: "Dr. R. A. Zamare", title: "Associate Professor", totalLoad: 17 },
    { empCode: "EMP-CSE-1009", name: "Prof. R. V. Deshmukh", title: "Associate Professor", totalLoad: 18 },
    { empCode: "EMP-CSE-1010", name: "Prof. S. M. Jawake", title: "Assistant Professor", totalLoad: 18 },
    { empCode: "EMP-CSE-1011", name: "Prof. T. A. Puranik", title: "Assistant Professor", totalLoad: 19 },
    { empCode: "EMP-CSE-1012", name: "Prof. V. S. Kanherkar", title: "Assistant Professor", totalLoad: 18 },
    { empCode: "EMP-CSE-1013", name: "Prof. N. N. Fatkar", title: "Assistant Professor", totalLoad: 18 },
    { empCode: "EMP-CSE-1014", name: "Prof. M. D. Rakhonde", title: "Assistant Professor", totalLoad: 16 },
    { empCode: "EMP-CSE-1015", name: "Mr. Krushan. V. Kulthe", title: "Assistant Professor", totalLoad: 13 }
  ],

  facultyTimetables: SSGMCE_FACULTY_TIMETABLES,

  // Get active teacher employee code from storage or default (Strict personal timetable)
  getActiveTeacherEmpCode() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Priority 1: Check authenticated teacher user session so each teacher sees strictly their own timetable
        const userStr = window.localStorage.getItem('ssgmce_user') || window.localStorage.getItem('ssgmce_active_teacher') || window.localStorage.getItem('ssgmce_logged_in_teacher');
        if (userStr) {
          const u = typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
          if (u.emp_code && SSGMCE_FACULTY_TIMETABLES[u.emp_code]) return u.emp_code;
          if (u.employeeId && SSGMCE_FACULTY_TIMETABLES[u.employeeId]) return u.employeeId;
          if (u.name) {
            for (const [code, fac] of Object.entries(SSGMCE_FACULTY_TIMETABLES)) {
              if (fac.name && (fac.name.toLowerCase().includes(u.name.toLowerCase()) || u.name.toLowerCase().includes(fac.name.split('. ').pop().toLowerCase()))) {
                return code;
              }
            }
          }
        }
        // Priority 2: Check manual selected faculty switcher
        const selected = window.localStorage.getItem('ssgmce_selected_faculty');
        if (selected && SSGMCE_FACULTY_TIMETABLES[selected]) return selected;
      }
    } catch (e) {}
    return "EMP-CSE-1001"; // Default to Dr. J. M. Patil (HOD / First Faculty)
  },

  // Switch active teacher view
  setActiveTeacherEmpCode(empCode) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('ssgmce_selected_faculty', empCode);
    }
    const fac = SSGMCE_FACULTY_TIMETABLES[empCode];
    if (fac) {
      this.faculty.name = fac.name;
      this.faculty.employeeId = empCode;
    }
  },

  // Get strict personal weekly timetable for specific teacher
  getTimetableForTeacher(empCodeInput) {
    const code = empCodeInput || this.getActiveTeacherEmpCode();
    const facData = SSGMCE_FACULTY_TIMETABLES[code] || SSGMCE_FACULTY_TIMETABLES["EMP-CSE-1009"];
    if (!facData || !facData.schedule) return [];

    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const slotTimeMap = {
      1: "11:00 AM - 12:00 PM",
      2: "12:00 PM - 01:00 PM",
      3: "01:15 PM - 02:15 PM",
      4: "02:15 PM - 03:15 PM",
      5: "03:45 PM - 04:45 PM",
      6: "04:45 PM - 05:45 PM"
    };

    return daysOrder.map(day => {
      const daySlots = facData.schedule[day] || [];
      const slotsArr = Array.from({ length: 6 }, (_, i) => ({
        slot: i + 1,
        time: slotTimeMap[i + 1] || "11:00 AM - 12:00 PM",
        status: "free",
        subject: "",
        room: "",
        classId: ""
      }));

      daySlots.forEach(s => {
        const slotIdx = (s.slot || 1) - 1;
        if (slotIdx >= 0 && slotIdx < 6) {
          slotsArr[slotIdx] = {
            slot: s.slot,
            time: slotTimeMap[s.slot] || "11:00 AM - 12:00 PM",
            status: "scheduled",
            subject: s.subject,
            room: s.venue || "Room 201",
            classId: s.class || "2R1",
            classCode: s.class || "2R1",
            isLab: Boolean(s.is_lab),
            batch: s.batch || null
          };
        }
      });

      return {
        day: day,
        slots: slotsArr
      };
    });
  },

  // Get today's classes dynamically from personal timetable
  getTodayClassesForTeacher(empCodeInput, dateInput) {
    const code = empCodeInput || this.getActiveTeacherEmpCode();
    const facData = SSGMCE_FACULTY_TIMETABLES[code] || SSGMCE_FACULTY_TIMETABLES["EMP-CSE-1009"];
    if (!facData || !facData.schedule) return [];

    const dayName = AcademicDateUtils.getDayName(dateInput || new Date());
    const daySlots = facData.schedule[dayName] || [];

    const slotTimeMap = {
      1: "11:00 AM - 12:00 PM",
      2: "12:00 PM - 01:00 PM",
      3: "01:15 PM - 02:15 PM",
      4: "02:15 PM - 03:15 PM",
      5: "03:45 PM - 04:45 PM",
      6: "04:45 PM - 05:45 PM"
    };

    return daySlots.map((s, idx) => ({
      time: slotTimeMap[s.slot] || "11:00 AM - 12:00 PM",
      subject: s.subject,
      department: "CSE",
      classCode: s.class || "2R1",
      room: s.venue || "Room 201",
      status: idx === 0 ? "completed" : "upcoming",
      isCurrent: idx === 1
    }));
  },

  // Get teaching load summary from PDF
  getTeachingLoadForTeacher(empCodeInput) {
    const code = empCodeInput || this.getActiveTeacherEmpCode();
    const facData = SSGMCE_FACULTY_TIMETABLES[code] || SSGMCE_FACULTY_TIMETABLES["EMP-CSE-1009"];
    return facData ? (facData.teaching_load || []) : [];
  },

  // Getter for personal weekly timetable
  get timetable() {
    return this.getTimetableForTeacher();
  },

  // Getter for personal today classes
  get todayClasses() {
    return this.getTodayClassesForTeacher();
  },

  // Assigned classes summary cards
  assignedClasses: [
    {
      id: "cls-cse-2r1",
      department: "CSE",
      classCode: "2R1",
      subject: "Data Structures",
      studentsCount: 60,
      attendanceStatus: "Completed",
      room: "Room 201",
      semester: "Sem 3"
    },
    {
      id: "cls-cse-2r2",
      department: "CSE",
      classCode: "2R2",
      subject: "Java Programming",
      studentsCount: 58,
      attendanceStatus: "Pending",
      room: "Room 305",
      semester: "Sem 3"
    },
    {
      id: "cls-cse-3r-dbms",
      department: "CSE",
      classCode: "3R",
      subject: "Database Management System",
      studentsCount: 62,
      attendanceStatus: "Pending",
      room: "Lab 02",
      semester: "Sem 5"
    },
    {
      id: "cls-cse-3r-os",
      department: "CSE",
      classCode: "3R",
      subject: "Operating Systems",
      studentsCount: 60,
      attendanceStatus: "Completed",
      room: "Lab 04",
      semester: "Sem 5"
    }
  ],

  syllabus: [
    {
      facultyId: "EMP-CSE-1001",
      facultyName: "Dr. Rohan Deshmukh",
      subjectId: "SUB-DS-2R1",
      subjectCode: "CS302",
      subjectName: "Data Structures",
      classId: "2R1",
      totalLecturesPlanned: 60,
      totalLecturesTaken: 42,
      progress: 70,
      units: [
        {
          unitId: "U1",
          unitName: "UNIT-I: Linear Data Structures & Arrays",
          estimatedLectures: 12,
          lecturesTaken: 12,
          status: "Completed",
          topics: [
            { topicId: "T1", topicName: "Introduction to Arrays", topicDescription: "1D & 2D array representation in memory, row/column major ordering", noOfLectures: 2, estimatedLectures: 2, lecturesTaken: 2, weightage: 1, weightagePercent: 12, status: "Completed" },
            { topicId: "T2", topicName: "Array Operations & Complexities", topicDescription: "Insertion, deletion, traversal, searching (linear & binary)", noOfLectures: 2, estimatedLectures: 2, lecturesTaken: 2, weightage: 1, weightagePercent: 12, status: "Completed" },
            { topicId: "T3", topicName: "Sparse Matrices", topicDescription: "Triplet representation and fast transpose algorithms", noOfLectures: 2, estimatedLectures: 2, lecturesTaken: 2, weightage: 2, weightagePercent: 12, status: "Completed" },
            { topicId: "T4", topicName: "Stack Concepts & Implementation", topicDescription: "LIFO principle, push/pop/peek operations using arrays & pointers", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 12, status: "Completed" },
            { topicId: "T5", topicName: "Stack Applications", topicDescription: "Infix to postfix/prefix conversion and expression evaluation", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 12, status: "Completed" }
          ]
        },
        {
          unitId: "U2",
          unitName: "UNIT-II: Linked Lists & Queues",
          estimatedLectures: 14,
          lecturesTaken: 14,
          status: "Completed",
          topics: [
            { topicId: "T6", topicName: "Singly Linked Lists", topicDescription: "Node structure, dynamic allocation, insertion and deletion at ends/middle", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 4, weightage: 1, weightagePercent: 14, status: "Completed" },
            { topicId: "T7", topicName: "Circular & Doubly Linked Lists", topicDescription: "Two-way traversal, header nodes and circular queue using list", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 14, status: "Completed" },
            { topicId: "T8", topicName: "Queue Structures & Circular Queues", topicDescription: "FIFO principle, linear queue drawback, circular queue wrapping", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 4, weightage: 1, weightagePercent: 14, status: "Completed" },
            { topicId: "T9", topicName: "Priority Queues & Deque", topicDescription: "Double-ended queues, ascending/descending priority queues and applications", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 2, weightagePercent: 14, status: "Completed" }
          ]
        },
        {
          unitId: "U3",
          unitName: "UNIT-III: Non-Linear Structures: Trees & BST",
          estimatedLectures: 14,
          lecturesTaken: 11,
          status: "In Progress",
          topics: [
            { topicId: "T10", topicName: "Tree Terminology & Binary Trees", topicDescription: "Root, leaf, height, depth, strict/complete binary tree properties", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 16, status: "Completed" },
            { topicId: "T11", topicName: "Binary Tree Traversals", topicDescription: "Inorder, preorder, postorder traversals with recursive & iterative algorithms", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 4, weightage: 2, weightagePercent: 16, status: "Completed" },
            { topicId: "T12", topicName: "Binary Search Trees (BST)", topicDescription: "BST property, insertion, deletion cases and search complexities", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 4, weightage: 2, weightagePercent: 16, status: "Completed" },
            { topicId: "T13", topicName: "Balanced Trees & AVL Concepts", topicDescription: "Balance factor, LL/RR/LR/RL rotations and self-balancing BSTs", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 0, weightage: 1, weightagePercent: 16, status: "Not Started" }
          ]
        },
        {
          unitId: "U4",
          unitName: "UNIT-IV: Graph Theory & Algorithms",
          estimatedLectures: 10,
          lecturesTaken: 5,
          status: "In Progress",
          topics: [
            { topicId: "T14", topicName: "Graph Representations", topicDescription: "Adjacency matrix, adjacency list, incidence matrix and space comparisons", noOfLectures: 2, estimatedLectures: 2, lecturesTaken: 2, weightage: 1, weightagePercent: 18, status: "Completed" },
            { topicId: "T15", topicName: "Graph Traversals (BFS & DFS)", topicDescription: "Breadth-First and Depth-First Search with visited array and stack/queue", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 18, status: "Completed" },
            { topicId: "T16", topicName: "Spanning Trees (Prim & Kruskal)", topicDescription: "Minimum cost spanning trees and greedy strategy", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 0, weightage: 2, weightagePercent: 18, status: "Not Started" },
            { topicId: "T17", topicName: "Shortest Path Algorithms", topicDescription: "Dijkstra single-source shortest path and Bellman-Ford relaxation", noOfLectures: 2, estimatedLectures: 2, lecturesTaken: 0, weightage: 2, weightagePercent: 18, status: "Not Started" }
          ]
        },
        {
          unitId: "U5",
          unitName: "UNIT-V: Searching, Sorting & Hashing",
          estimatedLectures: 10,
          lecturesTaken: 0,
          status: "Not Started",
          topics: [
            { topicId: "T18", topicName: "Advanced Sorting Techniques", topicDescription: "Merge sort, Quick sort, Heap sort with divide-and-conquer recurrences", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" },
            { topicId: "T19", topicName: "Hashing & Collision Resolution", topicDescription: "Hash functions, linear probing, quadratic probing and chaining", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 0, weightage: 1, weightagePercent: 20, status: "Not Started" },
            { topicId: "T20", topicName: "File Structures & B-Trees", topicDescription: "Sequential access, indexed sequential files, B-tree search and insertion intro", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 0, weightage: 1, weightagePercent: 20, status: "Not Started" }
          ]
        }
      ]
    },
    {
      facultyId: "EMP-CSE-1001",
      facultyName: "Dr. Rohan Deshmukh",
      subjectId: "SUB-DM-2R1",
      subjectCode: "CS301",
      subjectName: "Discrete Mathematics",
      classId: "2R1",
      totalLecturesPlanned: 45,
      totalLecturesTaken: 28,
      progress: 62,
      units: [
        {
          unitId: "U1",
          unitName: "UNIT-I: Mathematical Logic & Proofs",
          estimatedLectures: 9,
          lecturesTaken: 9,
          status: "Completed",
          topics: [
            { topicId: "DM-T1", topicName: "Propositions & Truth Tables", topicDescription: "Compound propositions, logical connectives, tautology and contradiction", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "DM-T2", topicName: "Predicates & Quantifiers", topicDescription: "Universal and existential quantification, nested quantifiers", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "DM-T3", topicName: "Methods of Proof", topicDescription: "Direct proof, proof by contradiction, mathematical induction", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 2, weightagePercent: 20, status: "Completed" }
          ]
        },
        {
          unitId: "U2",
          unitName: "UNIT-II: Set Theory & Relations",
          estimatedLectures: 9,
          lecturesTaken: 9,
          status: "Completed",
          topics: [
            { topicId: "DM-T4", topicName: "Sets, Subsets & Power Sets", topicDescription: "Set operations, Venn diagrams, principle of inclusion-exclusion", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "DM-T5", topicName: "Relations & Properties", topicDescription: "Reflexive, symmetric, transitive relations, equivalence relations", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "DM-T6", topicName: "Partitions & Partial Orders", topicDescription: "Posets, Hasse diagrams, lattices and extremal elements", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 2, weightagePercent: 20, status: "Completed" }
          ]
        },
        {
          unitId: "U3",
          unitName: "UNIT-III: Combinatorics & Recurrences",
          estimatedLectures: 9,
          lecturesTaken: 6,
          status: "In Progress",
          topics: [
            { topicId: "DM-T7", topicName: "Permutations & Combinations", topicDescription: "Counting principles, binomial theorem and coefficients", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "DM-T8", topicName: "Pigeonhole Principle", topicDescription: "Generalized pigeonhole principle with applications", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 3, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "DM-T9", topicName: "Recurrence Relations", topicDescription: "Linear homogeneous recurrences with constant coefficients", noOfLectures: 3, estimatedLectures: 3, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" }
          ]
        },
        {
          unitId: "U4",
          unitName: "UNIT-IV: Algebraic Structures",
          estimatedLectures: 9,
          lecturesTaken: 4,
          status: "In Progress",
          topics: [
            { topicId: "DM-T10", topicName: "Groups & Semigroups", topicDescription: "Binary operations, monoids, subgroups, cyclic groups", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 4, weightage: 2, weightagePercent: 20, status: "In Progress" },
            { topicId: "DM-T11", topicName: "Rings & Fields Intro", topicDescription: "Ring definitions, integral domains and field axioms", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" }
          ]
        },
        {
          unitId: "U5",
          unitName: "UNIT-V: Graph Theory & Boolean Algebra",
          estimatedLectures: 9,
          lecturesTaken: 0,
          status: "Not Started",
          topics: [
            { topicId: "DM-T12", topicName: "Eulerian & Hamiltonian Graphs", topicDescription: "Cycles, paths, planar graphs, Kuratowski theorem", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" },
            { topicId: "DM-T13", topicName: "Boolean Algebra & Gates", topicDescription: "Boolean expressions, Karnaugh maps, logic circuit minimization", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" }
          ]
        }
      ]
    },
    {
      facultyId: "EMP-CSE-1001",
      facultyName: "Dr. Rohan Deshmukh",
      subjectId: "SUB-JAVA-2R2",
      subjectCode: "CS304",
      subjectName: "OOP with Java",
      classId: "2R2",
      totalLecturesPlanned: 50,
      totalLecturesTaken: 35,
      progress: 70,
      units: [
        {
          unitId: "U1",
          unitName: "UNIT-I: Java Language Essentials",
          estimatedLectures: 10,
          lecturesTaken: 10,
          status: "Completed",
          topics: [
            { topicId: "JV-T1", topicName: "JVM Architecture & Bytecode", topicDescription: "JDK, JRE, JVM, garbage collection, data types and operators", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 4, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "JV-T2", topicName: "Classes, Objects & Constructors", topicDescription: "Encapsulation, constructor overloading, this keyword", noOfLectures: 6, estimatedLectures: 6, lecturesTaken: 6, weightage: 2, weightagePercent: 20, status: "Completed" }
          ]
        },
        {
          unitId: "U2",
          unitName: "UNIT-II: Inheritance & Polymorphism",
          estimatedLectures: 10,
          lecturesTaken: 10,
          status: "Completed",
          topics: [
            { topicId: "JV-T3", topicName: "Inheritance Types & Super", topicDescription: "Single, multilevel, hierarchical inheritance and super keyword", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 5, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "JV-T4", topicName: "Abstract Classes & Interfaces", topicDescription: "Dynamic method dispatch, interface implementation, default methods", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 5, weightage: 2, weightagePercent: 20, status: "Completed" }
          ]
        },
        {
          unitId: "U3",
          unitName: "UNIT-III: Exceptions & Multithreading",
          estimatedLectures: 10,
          lecturesTaken: 9,
          status: "In Progress",
          topics: [
            { topicId: "JV-T5", topicName: "Exception Hierarchy & Handling", topicDescription: "Try, catch, finally, throw, throws, custom exception classes", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 5, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "JV-T6", topicName: "Thread Lifecycle & Synchronization", topicDescription: "Runnable interface, Thread class, synchronized blocks and deadlocks", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 4, weightage: 2, weightagePercent: 20, status: "In Progress" }
          ]
        },
        {
          unitId: "U4",
          unitName: "UNIT-IV: Java Collections Framework",
          estimatedLectures: 10,
          lecturesTaken: 6,
          status: "In Progress",
          topics: [
            { topicId: "JV-T7", topicName: "List, Set & Map Interfaces", topicDescription: "ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap", noOfLectures: 6, estimatedLectures: 6, lecturesTaken: 6, weightage: 2, weightagePercent: 20, status: "Completed" },
            { topicId: "JV-T8", topicName: "Generics & Streams API", topicDescription: "Type safety, generic methods, lambda expressions, stream filtering", noOfLectures: 4, estimatedLectures: 4, lecturesTaken: 0, weightage: 1, weightagePercent: 20, status: "Not Started" }
          ]
        },
        {
          unitId: "U5",
          unitName: "UNIT-V: GUI Programming with JavaFX",
          estimatedLectures: 10,
          lecturesTaken: 0,
          status: "Not Started",
          topics: [
            { topicId: "JV-T9", topicName: "JavaFX Stage, Scene & Panes", topicDescription: "Layout panes, UI controls, FXML design", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 0, weightage: 1, weightagePercent: 20, status: "Not Started" },
            { topicId: "JV-T10", topicName: "Event Handling & Database Connectivity", topicDescription: "Action events, listeners, JDBC Driver and PreparedStatement", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" }
          ]
        }
      ]
    }
  ],

  recentActivities: [
    {
      id: "act-1",
      type: "attendance",
      title: "Attendance Submitted",
      description: "Attendance submitted for CSE 2R1",
      time: "20 minutes ago",
      icon: "calendar-check",
      iconStyle: "blue"
    },
    {
      id: "act-2",
      type: "syllabus",
      title: "Syllabus Updated",
      description: "Data Structures syllabus updated",
      time: "1 hour ago",
      icon: "book",
      iconStyle: "cyan"
    },
    {
      id: "act-3",
      type: "results",
      title: "Result Uploaded",
      description: "Internal assessment results uploaded",
      time: "2 hours ago",
      icon: "bar-chart-2",
      iconStyle: "green"
    },
    {
      id: "act-4",
      type: "notification",
      title: "New Notification",
      description: "Department meeting scheduled",
      time: "3 hours ago",
      icon: "bell",
      iconStyle: "navy"
    }
  ],

  notifications: [
    {
      id: "notif-1",
      title: "New attendance reminder",
      description: "Please submit pending attendance for CSE 2R2 before 4:00 PM.",
      time: "15 mins ago",
      unread: true,
      icon: "clock"
    },
    {
      id: "notif-2",
      title: "Department meeting",
      description: "Department academic progress review scheduled at 4:30 PM in Seminar Hall A.",
      time: "1 hour ago",
      unread: true,
      icon: "users"
    },
    {
      id: "notif-3",
      title: "Result submission deadline",
      description: "Internal Assessment 1 marks portal will close on Friday 5:00 PM.",
      time: "3 hours ago",
      unread: false,
      icon: "file-text"
    },
    {
      id: "notif-4",
      title: "Syllabus update notification",
      description: "NBA accreditation module mappings revised by Academic Council.",
      time: "1 day ago",
      unread: false,
      icon: "book-open"
    }
  ],

  leaves: [
    {
      id: "LEAVE-001",
      facultyId: "T-002",
      empCode: "EMP-CSE-1002",
      facultyName: "Prof. Priya Kulkarni",
      facultyEmail: "pkulkarni@ssgmce.ac.in",
      phone: "9822198765",
      startDate: "2026-10-12",
      endDate: "2026-10-16",
      daysCount: 5,
      reason: "Attending IEEE International Conference on AI & Cloud Computing.",
      status: "Approved",
      createdAt: "2026-10-08T09:30:00Z"
    }
  ],

  engagements: [
    {
      id: "ENG-001",
      originalFacultyId: "T-002",
      originalEmpCode: "EMP-CSE-1002",
      originalFacultyName: "Prof. Priya Kulkarni",
      engagingFacultyId: "T-001",
      engagingEmpCode: "EMP-CSE-1001",
      engagingFacultyName: "Dr. Rohan Deshmukh",
      classId: "2R1",
      date: "2026-10-12",
      day: "Monday",
      timeSlot: "09:00 - 10:30 AM",
      subject: "Data Structures",
      room: "Room 201",
      status: "Engaged",
      createdAt: "2026-10-08T11:00:00Z"
    }
  ],

  applyForLeave(leaveData) {
    if (!this.leaves) this.leaves = [];
    const newLeave = {
      id: `LEAVE-${Date.now()}`,
      facultyId: leaveData.facultyId || "T-001",
      empCode: leaveData.empCode || "EMP-CSE-1001",
      facultyName: leaveData.facultyName || "Faculty Member",
      facultyEmail: leaveData.facultyEmail || "faculty@ssgmce.ac.in",
      phone: leaveData.phone || "",
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      daysCount: leaveData.startDate && leaveData.endDate
        ? Math.max(1, Math.round((new Date(leaveData.endDate) - new Date(leaveData.startDate)) / (1000 * 60 * 60 * 24)) + 1)
        : 1,
      reason: leaveData.reason || "",
      status: "Approved",
      createdAt: new Date().toISOString()
    };
    this.leaves.unshift(newLeave);

    const notif = {
      id: `notif-leave-${Date.now()}`,
      title: "Leave Application Approved",
      description: `Your leave application from ${newLeave.startDate} to ${newLeave.endDate} has been approved. Your scheduled classes are now open for faculty substitution.`,
      time: "Just now",
      unread: true,
      icon: "calendar"
    };
    if (this.notifications) this.notifications.unshift(notif);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("ssgmce_leaves", JSON.stringify(this.leaves));
        window.dispatchEvent(new CustomEvent("leaves:updated", { detail: { leave: newLeave, leaves: this.leaves } }));
      } catch (_) {}
    }
    return newLeave;
  },

  getFacultyLeaves(empOrId) {
    if (!this.leaves) return [];
    if (!empOrId) return this.leaves;
    const target = String(empOrId).toUpperCase();
    return this.leaves.filter(l =>
      (l.facultyId && l.facultyId.toUpperCase() === target) ||
      (l.empCode && l.empCode.toUpperCase() === target)
    );
  },

  isFacultyOnLeave(empOrId, dateOrDay) {
    if (!this.leaves) return false;
    const target = String(empOrId || "").toUpperCase();
    const activeLeaves = this.leaves.filter(l =>
      l.status === "Approved" &&
      (!empOrId || (l.facultyId && l.facultyId.toUpperCase() === target) || (l.empCode && l.empCode.toUpperCase() === target))
    );
    if (activeLeaves.length === 0) return false;
    if (!dateOrDay) return activeLeaves.length > 0;

    const dateStr = String(dateOrDay);
    if (dateStr.includes("-") && dateStr.length === 10) {
      return activeLeaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);
    }
    return activeLeaves.length > 0;
  },

  engageClass(data) {
    if (!this.engagements) this.engagements = [];
    const newEng = {
      id: `ENG-${Date.now()}`,
      originalFacultyId: data.originalFacultyId || "T-002",
      originalEmpCode: data.originalEmpCode || "EMP-CSE-1002",
      originalFacultyName: data.originalFacultyName || "Original Faculty",
      engagingFacultyId: data.engagingFacultyId || "T-001",
      engagingEmpCode: data.engagingEmpCode || "EMP-CSE-1001",
      engagingFacultyName: data.engagingFacultyName || "Engaging Faculty",
      classId: data.classId || "2R1",
      date: data.date || new Date().toISOString().split("T")[0],
      day: data.day || "Monday",
      timeSlot: data.timeSlot || "09:00 - 10:30 AM",
      subject: data.subject || "Data Structures",
      room: data.room || "Room 201",
      status: "Engaged",
      createdAt: new Date().toISOString()
    };
    this.engagements.unshift(newEng);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("ssgmce_engagements", JSON.stringify(this.engagements));
        window.dispatchEvent(new CustomEvent("engagements:updated", { detail: { engagement: newEng, engagements: this.engagements } }));
      } catch (_) {}
    }
    return newEng;
  },

  getClassEngagement(empOrId, day, timeSlot, date) {
    if (!this.engagements || this.engagements.length === 0) return null;
    const target = String(empOrId || "").toUpperCase();
    return this.engagements.find(eng => {
      const facMatch = !empOrId ||
        (eng.originalFacultyId && eng.originalFacultyId.toUpperCase() === target) ||
        (eng.originalEmpCode && eng.originalEmpCode.toUpperCase() === target) ||
        (eng.engagingFacultyId && eng.engagingFacultyId.toUpperCase() === target) ||
        (eng.engagingEmpCode && eng.engagingEmpCode.toUpperCase() === target);
      const dayMatch = !day || (eng.day && eng.day.toLowerCase() === String(day).toLowerCase());
      const slotMatch = !timeSlot || eng.timeSlot === timeSlot || eng.timeSlot.includes(String(timeSlot).split(" ")[0]);
      return facMatch && dayMatch && slotMatch;
    });
  },

  canMarkAttendance(activeEmpOrId, classSession) {
    if (!activeEmpOrId || !classSession) return { allowed: true };
    const active = String(activeEmpOrId).toUpperCase();
    const origFac = String(classSession.facultyId || classSession.empCode || classSession.originalFacultyId || "").toUpperCase();

    const eng = this.getClassEngagement(
      origFac || active,
      classSession.day,
      classSession.timeSlot || classSession.time,
      classSession.date
    );

    if (eng) {
      const engFac = String(eng.engagingFacultyId || eng.engagingEmpCode || "").toUpperCase();
      if (active === engFac || active.includes("1001") && engFac.includes("1001") || active === "T-001" && engFac.includes("1001")) {
        return { allowed: true, isEngaged: true, isSubstitute: true, engagingFacultyName: eng.engagingFacultyName };
      }
      if (active === String(eng.originalFacultyId).toUpperCase() || active === String(eng.originalEmpCode).toUpperCase()) {
        return {
          allowed: false,
          isEngaged: true,
          onLeave: true,
          reason: `You are on leave for this class. Attendance is being managed by ${eng.engagingFacultyName}.`,
          engagingFacultyName: eng.engagingFacultyName
        };
      }
      return {
        allowed: false,
        isEngaged: true,
        reason: `Attendance for this class is being managed by substitute faculty: ${eng.engagingFacultyName}.`,
        engagingFacultyName: eng.engagingFacultyName
      };
    }

    if (this.isFacultyOnLeave(origFac || active, classSession.date || classSession.day)) {
      if (active === origFac || !origFac) {
        return {
          allowed: false,
          onLeave: true,
          reason: "You are on leave for this class. Attendance marking is disabled."
        };
      }
    }

    return { allowed: true };
  },

  loadSyllabusData() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem("ssgmce_syllabus_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.syllabus = parsed;
            return parsed;
          }
        }
      } catch (_) {}
    }
    return this.syllabus;
  },

  saveSyllabusData(syllabusList) {
    this.syllabus = syllabusList;
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("ssgmce_syllabus_data", JSON.stringify(syllabusList));
      } catch (_) {}
    }
    return syllabusList;
  },

  getSyllabusForTeacher(empCode) {
    const all = this.loadSyllabusData();
    const target = String(empCode || this.getActiveTeacherEmpCode()).toUpperCase();
    const filtered = all.filter(s => String(s.facultyId).toUpperCase() === target);
    return filtered.length > 0 ? filtered : all.filter(s => s.facultyId === "EMP-CSE-1001");
  },

  getSubjectSyllabus(subjectId) {
    const all = this.loadSyllabusData();
    return all.find(s => s.subjectId === subjectId) || all[0];
  },

  recalculateSubjectTotals(subjectObj) {
    let subjectTaken = 0;
    let subjectPlanned = 0;

    subjectObj.units = (subjectObj.units || []).map(unit => {
      let unitTaken = 0;
      let unitPlanned = 0;

      unit.topics = (unit.topics || []).map(topic => {
        const planned = Number(topic.noOfLectures || topic.estimatedLectures || 1);
        const taken = Number(topic.lecturesTaken || 0);

        let status = "Not Started";
        if (taken >= planned && taken > 0) {
          status = "Completed";
        } else if (taken > 0) {
          status = "In Progress";
        }

        unitTaken += taken;
        unitPlanned += planned;

        return {
          ...topic,
          noOfLectures: planned,
          estimatedLectures: planned,
          lecturesTaken: taken,
          status
        };
      });

      let unitStatus = "Not Started";
      if (unitTaken >= unitPlanned && unitPlanned > 0) {
        unitStatus = "Completed";
      } else if (unitTaken > 0) {
        unitStatus = "In Progress";
      }

      const unitProgress = unitPlanned > 0 ? Math.min(100, Math.round((unitTaken / unitPlanned) * 100)) : 0;

      subjectTaken += unitTaken;
      subjectPlanned += unitPlanned;

      return {
        ...unit,
        estimatedLectures: unitPlanned,
        lecturesTaken: unitTaken,
        status: unitStatus,
        progress: unitProgress
      };
    });

    subjectObj.totalLecturesPlanned = subjectPlanned || subjectObj.totalLecturesPlanned || 60;
    subjectObj.totalLecturesTaken = subjectTaken;
    subjectObj.progress = subjectObj.totalLecturesPlanned > 0
      ? Math.min(100, Math.round((subjectTaken / subjectObj.totalLecturesPlanned) * 100))
      : 0;
    subjectObj.completionPercentage = subjectObj.progress;

    return subjectObj;
  },

  markTopicCovered(subjectId, unitId, topicId, count = 1) {
    const all = this.loadSyllabusData();
    const subjectIndex = all.findIndex(s => s.subjectId === subjectId);
    if (subjectIndex === -1) return null;

    const subject = JSON.parse(JSON.stringify(all[subjectIndex]));
    const unit = subject.units.find(u => u.unitId === unitId);
    if (!unit) return null;

    const topic = unit.topics.find(t => t.topicId === topicId);
    if (!topic) return null;

    const planned = Number(topic.noOfLectures || topic.estimatedLectures || 1);
    const current = Number(topic.lecturesTaken || 0);
    const nextTaken = Math.min(planned, current + count);
    topic.lecturesTaken = nextTaken;
    topic.lastCoveredDate = new Date().toISOString().split("T")[0];

    const updatedSubject = this.recalculateSubjectTotals(subject);
    all[subjectIndex] = updatedSubject;
    this.saveSyllabusData(all);

    return updatedSubject;
  },

  undoTopicCovered(subjectId, unitId, topicId, count = 1) {
    const all = this.loadSyllabusData();
    const subjectIndex = all.findIndex(s => s.subjectId === subjectId);
    if (subjectIndex === -1) return null;

    const subject = JSON.parse(JSON.stringify(all[subjectIndex]));
    const unit = subject.units.find(u => u.unitId === unitId);
    if (!unit) return null;

    const topic = unit.topics.find(t => t.topicId === topicId);
    if (!topic) return null;

    const current = Number(topic.lecturesTaken || 0);
    const nextTaken = Math.max(0, current - count);
    topic.lecturesTaken = nextTaken;
    if (nextTaken === 0) {
      topic.lastCoveredDate = null;
    }

    const updatedSubject = this.recalculateSubjectTotals(subject);
    all[subjectIndex] = updatedSubject;
    this.saveSyllabusData(all);

    return updatedSubject;
  }
};

if (typeof window !== 'undefined') {
  window.AcademicDateUtils = AcademicDateUtils;
  window.TeacherERPData = TeacherERPData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AcademicDateUtils, TeacherERPData };
}

