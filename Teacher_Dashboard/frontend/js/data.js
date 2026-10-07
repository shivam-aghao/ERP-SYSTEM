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
    "name": "Dr. J. M. Patil",
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

const TeacherERPData = {
  faculty: {
    name: "Dr. Rohan Deshmukh",
    prefix: "Prof.",
    title: "Associate Professor",
    department: "Computer Science & Engineering",
    departmentCode: "CSE",
    employeeId: "FAC-CSE-1048",
    email: "rohan.deshmukh@college.edu",
    phone: "+91 98230 45678",
    avatarInitials: "RD",
    academicYear: AcademicDateUtils.getCurrentAcademicTerm().academicYear,
    currentSemester: AcademicDateUtils.getCurrentAcademicTerm().semesterName
  },

  institution: {
    name: "Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
    subTitle: "(An Autonomous Institute)",
    shortName: "SSGMCE"
  },

  stats: {
    totalClasses: "08",
    todayClasses: "04",
    totalStudents: "240",
    attendancePending: "02",
    attendanceCompletedCount: 6,
    attendancePendingCount: 2,
    attendancePercent: 75
  },

  // ------------------------------------------------------
  // 6 CORE DEPARTMENTS
  // ------------------------------------------------------
  departments: [
    {
      code: "CSE",
      name: "Computer Science & Engineering",
      icon: "laptop",
      classesCount: 4,
      classCodes: ["2R1", "2R2", "3R", "4R"],
      description: "Algorithms, Software Systems, Cloud & AI",
      headOfDept: "Dr. Arvind Shinde"
    },
    {
      code: "IT",
      name: "Information Technology",
      icon: "server",
      classesCount: 4,
      classCodes: ["2N1", "2N2", "3N", "4N"],
      description: "Enterprise Systems, Networks & Web Tech",
      headOfDept: "Dr. Sneha Chitnis"
    },
    {
      code: "EE",
      name: "Electrical Engineering",
      icon: "zap",
      classesCount: 4,
      classCodes: ["2S1", "2S2", "3S", "4S"],
      description: "Power Grids, Electrical Machines & Circuits",
      headOfDept: "Dr. Rajesh Kulkarni"
    },
    {
      code: "MECH",
      name: "Mechanical Engineering",
      icon: "settings",
      classesCount: 4,
      classCodes: ["2M1", "2M2", "3M", "4M"],
      description: "Thermodynamics, Robotics & Manufacturing",
      headOfDept: "Dr. Vivek Patwardhan"
    },
    {
      code: "ENTC",
      name: "Electronics & Telecommunication",
      icon: "radio",
      classesCount: 4,
      classCodes: ["2U1", "2U2", "3U", "4U"],
      description: "Signal Processing, VLSI & Communications",
      headOfDept: "Dr. Pallavi Joshi"
    },
    {
      code: "ASH",
      name: "Applied Sciences & Humanities",
      icon: "flask-conical",
      classesCount: 3,
      classCodes: ["1A1", "1A2", "1A3"],
      description: "First Year Foundation, Mathematics & Physics",
      headOfDept: "Dr. Mahendra Dixit"
    }
  ],

  // ------------------------------------------------------
  // CLASS MAPPINGS & DETAILS
  // ------------------------------------------------------
  classes: {
    // CSE
    "2R1": { code: "2R1", department: "CSE", name: "Second Year CSE - Div 1", semester: "Semester 3", studentsCount: 60, room: "Room 201" },
    "2R2": { code: "2R2", department: "CSE", name: "Second Year CSE - Div 2", semester: "Semester 3", studentsCount: 58, room: "Room 305" },
    "3R": { code: "3R", department: "CSE", name: "Third Year CSE", semester: "Semester 5", studentsCount: 62, room: "Lab 02" },
    "4R": { code: "4R", department: "CSE", name: "Final Year CSE", semester: "Semester 7", studentsCount: 60, room: "Room 402" },

    // IT
    "2N1": { code: "2N1", department: "IT", name: "Second Year IT - Div 1", semester: "Semester 3", studentsCount: 60, room: "IT Lab 1" },
    "2N2": { code: "2N2", department: "IT", name: "Second Year IT - Div 2", semester: "Semester 3", studentsCount: 56, room: "IT Lab 2" },
    "3N": { code: "3N", department: "IT", name: "Third Year IT", semester: "Semester 5", studentsCount: 58, room: "Room 312" },
    "4N": { code: "4N", department: "IT", name: "Final Year IT", semester: "Semester 7", studentsCount: 55, room: "Room 410" },

    // EE
    "2S1": { code: "2S1", department: "EE", name: "Second Year EE - Div 1", semester: "Semester 3", studentsCount: 58, room: "EE Hall 1" },
    "2S2": { code: "2S2", department: "EE", name: "Second Year EE - Div 2", semester: "Semester 3", studentsCount: 55, room: "EE Hall 2" },
    "3S": { code: "3S", department: "EE", name: "Third Year EE", semester: "Semester 5", studentsCount: 60, room: "Power Lab" },
    "4S": { code: "4S", department: "EE", name: "Final Year EE", semester: "Semester 7", studentsCount: 52, room: "Room 215" },

    // MECH
    "2M1": { code: "2M1", department: "MECH", name: "Second Year ME - Div 1", semester: "Semester 3", studentsCount: 62, room: "Mech Hall A" },
    "2M2": { code: "2M2", department: "MECH", name: "Second Year ME - Div 2", semester: "Semester 3", studentsCount: 60, room: "Mech Hall B" },
    "3M": { code: "3M", department: "MECH", name: "Third Year ME", semester: "Semester 5", studentsCount: 64, room: "CAD Lab" },
    "4M": { code: "4M", department: "MECH", name: "Final Year ME", semester: "Semester 7", studentsCount: 58, room: "Room 108" },

    // ENTC
    "2U1": { code: "2U1", department: "ENTC", name: "Second Year ENTC - Div 1", semester: "Semester 3", studentsCount: 58, room: "VLSI Lab" },
    "2U2": { code: "2U2", department: "ENTC", name: "Second Year ENTC - Div 2", semester: "Semester 3", studentsCount: 55, room: "Comm Lab" },
    "3U": { code: "3U", department: "ENTC", name: "Third Year ENTC", semester: "Semester 5", studentsCount: 60, room: "Room 320" },
    "4U": { code: "4U", department: "ENTC", name: "Final Year ENTC", semester: "Semester 7", studentsCount: 54, room: "Room 418" },

    // ASH
    "1A1": { code: "1A1", department: "ASH", name: "First Year Engineering - Div A", semester: "Semester 1", studentsCount: 65, room: "Lecture Complex 101" },
    "1A2": { code: "1A2", department: "ASH", name: "First Year Engineering - Div B", semester: "Semester 1", studentsCount: 65, room: "Lecture Complex 102" },
    "1A3": { code: "1A3", department: "ASH", name: "First Year Engineering - Div C", semester: "Semester 1", studentsCount: 65, room: "Lecture Complex 103" }
  },

  // ------------------------------------------------------
  // SUBJECTS CATALOG BY CLASS
  // ------------------------------------------------------
  subjects: {
    // CSE 2R1
    "2R1": [
      { code: "CS302", name: "Data Structures", faculty: "Dr. Rohan Deshmukh", time: "10:00 AM – 11:00 AM", icon: "book-open", credits: "4 Credits" },
      { code: "CS304", name: "Java Programming", faculty: "Prof. Priya Sharma", time: "11:15 AM – 12:15 PM", icon: "code", credits: "4 Credits" },
      { code: "CS301", name: "Discrete Mathematics", faculty: "Prof. Aniket Roy", time: "01:30 PM – 02:30 PM", icon: "binary", credits: "3 Credits" },
      { code: "CS303", name: "Digital Logic & Design", faculty: "Prof. Sunita Rao", time: "02:45 PM – 03:45 PM", icon: "cpu", credits: "3 Credits" }
    ],
    // CSE 2R2
    "2R2": [
      { code: "CS304", name: "Java Programming", faculty: "Dr. Rohan Deshmukh", time: "11:00 AM – 12:00 PM", icon: "code", credits: "4 Credits" },
      { code: "CS302", name: "Data Structures", faculty: "Prof. Priya Sharma", time: "01:30 PM – 02:30 PM", icon: "book-open", credits: "4 Credits" },
      { code: "CS305", name: "Computer Organization", faculty: "Prof. Manoj Verma", time: "02:45 PM – 03:45 PM", icon: "cpu", credits: "3 Credits" }
    ],
    // CSE 3R
    "3R": [
      { code: "CS501", name: "Database Management System", faculty: "Dr. Rohan Deshmukh", time: "09:00 AM – 10:00 AM", icon: "database", credits: "4 Credits" },
      { code: "CS502", name: "Operating Systems", faculty: "Prof. Vikram Sen", time: "10:15 AM – 11:15 AM", icon: "terminal", credits: "4 Credits" },
      { code: "CS503", name: "Computer Networks", faculty: "Prof. Neha Gupta", time: "12:00 PM – 01:00 PM", icon: "network", credits: "4 Credits" },
      { code: "CS504", name: "Theory of Computation", faculty: "Dr. Arvind Shinde", time: "02:00 PM – 03:00 PM", icon: "brain", credits: "3 Credits" }
    ],
    // CSE 4R
    "4R": [
      { code: "CS701", name: "Cloud Computing", faculty: "Dr. Arvind Shinde", time: "10:00 AM – 11:00 AM", icon: "cloud", credits: "4 Credits" },
      { code: "CS702", name: "Information Security", faculty: "Dr. Rohan Deshmukh", time: "11:15 AM – 12:15 PM", icon: "shield-check", credits: "4 Credits" },
      { code: "CS703", name: "Machine Learning", faculty: "Prof. Amit Patel", time: "02:00 PM – 03:00 PM", icon: "sparkles", credits: "4 Credits" }
    ],

    // IT 2N1
    "2N1": [
      { code: "IT301", name: "Data Structures & Algorithms", faculty: "Prof. Sneha Chitnis", time: "10:00 AM – 11:00 AM", icon: "book-open", credits: "4 Credits" },
      { code: "IT302", name: "OOP with Java", faculty: "Prof. Rohit Nair", time: "11:15 AM – 12:15 PM", icon: "code", credits: "4 Credits" },
      { code: "IT303", name: "Web Development", faculty: "Prof. Shweta Joshi", time: "01:30 PM – 02:30 PM", icon: "globe", credits: "3 Credits" },
      { code: "IT304", name: "Database Systems", faculty: "Prof. Kunal Mehta", time: "02:45 PM – 03:45 PM", icon: "database", credits: "4 Credits" }
    ],
    // IT 2N2
    "2N2": [
      { code: "IT301", name: "Data Structures & Algorithms", faculty: "Prof. Sneha Chitnis", time: "09:00 AM – 10:00 AM", icon: "book-open", credits: "4 Credits" },
      { code: "IT302", name: "OOP with Java", faculty: "Prof. Rohit Nair", time: "10:15 AM – 11:15 AM", icon: "code", credits: "4 Credits" }
    ],
    // IT 3N
    "3N": [
      { code: "IT501", name: "Software Engineering", faculty: "Prof. Kunal Mehta", time: "10:00 AM – 11:00 AM", icon: "layers", credits: "4 Credits" },
      { code: "IT502", name: "Computer Networks", faculty: "Prof. Rohit Nair", time: "11:15 AM – 12:15 PM", icon: "network", credits: "4 Credits" }
    ],
    // IT 4N
    "4N": [
      { code: "IT701", name: "DevOps & Cloud Architecture", faculty: "Prof. Shweta Joshi", time: "10:00 AM – 11:00 AM", icon: "cloud", credits: "4 Credits" }
    ],

    // EE 2S1
    "2S1": [
      { code: "EE301", name: "Circuit Theory & Networks", faculty: "Dr. Rajesh Kulkarni", time: "10:00 AM – 11:00 AM", icon: "activity", credits: "4 Credits" },
      { code: "EE302", name: "Electrical Machines I", faculty: "Prof. Suresh Mane", time: "11:15 AM – 12:15 PM", icon: "zap", credits: "4 Credits" },
      { code: "EE303", name: "Electromagnetic Fields", faculty: "Prof. Deepa Patil", time: "01:30 PM – 02:30 PM", icon: "radio", credits: "3 Credits" }
    ],
    "2S2": [
      { code: "EE301", name: "Circuit Theory & Networks", faculty: "Dr. Rajesh Kulkarni", time: "09:00 AM – 10:00 AM", icon: "activity", credits: "4 Credits" },
      { code: "EE302", name: "Electrical Machines I", faculty: "Prof. Suresh Mane", time: "10:15 AM – 11:15 AM", icon: "zap", credits: "4 Credits" }
    ],
    "3S": [
      { code: "EE501", name: "Power Systems I", faculty: "Dr. Rajesh Kulkarni", time: "10:00 AM – 11:00 AM", icon: "zap", credits: "4 Credits" },
      { code: "EE502", name: "Control Systems", faculty: "Prof. Deepa Patil", time: "11:15 AM – 12:15 PM", icon: "sliders", credits: "4 Credits" }
    ],
    "4S": [
      { code: "EE701", name: "Renewable Energy Systems", faculty: "Prof. Suresh Mane", time: "10:00 AM – 11:00 AM", icon: "sun", credits: "4 Credits" }
    ],

    // MECH 2M1
    "2M1": [
      { code: "ME301", name: "Engineering Thermodynamics", faculty: "Dr. Vivek Patwardhan", time: "10:00 AM – 11:00 AM", icon: "flame", credits: "4 Credits" },
      { code: "ME302", name: "Fluid Mechanics", faculty: "Prof. Santosh More", time: "11:15 AM – 12:15 PM", icon: "droplets", credits: "4 Credits" },
      { code: "ME303", name: "Material Science & Metallurgy", faculty: "Prof. Alka Ranade", time: "01:30 PM – 02:30 PM", icon: "box", credits: "3 Credits" }
    ],
    "2M2": [
      { code: "ME301", name: "Engineering Thermodynamics", faculty: "Dr. Vivek Patwardhan", time: "09:00 AM – 10:00 AM", icon: "flame", credits: "4 Credits" },
      { code: "ME302", name: "Fluid Mechanics", faculty: "Prof. Santosh More", time: "10:15 AM – 11:15 AM", icon: "droplets", credits: "4 Credits" }
    ],
    "3M": [
      { code: "ME501", name: "Heat Transfer", faculty: "Dr. Vivek Patwardhan", time: "10:00 AM – 11:00 AM", icon: "flame", credits: "4 Credits" },
      { code: "ME502", name: "Design of Machine Elements", faculty: "Prof. Santosh More", time: "11:15 AM – 12:15 PM", icon: "settings", credits: "4 Credits" }
    ],
    "4M": [
      { code: "ME701", name: "Robotics & Automation", faculty: "Prof. Alka Ranade", time: "10:00 AM – 11:00 AM", icon: "cpu", credits: "4 Credits" }
    ],

    // ENTC 2U1
    "2U1": [
      { code: "EC301", name: "Electronic Devices & Circuits", faculty: "Dr. Pallavi Joshi", time: "10:00 AM – 11:00 AM", icon: "cpu", credits: "4 Credits" },
      { code: "EC302", name: "Signals & Systems", faculty: "Prof. Chetan Kulkarni", time: "11:15 AM – 12:15 PM", icon: "activity", credits: "4 Credits" },
      { code: "EC303", name: "Digital System Design", faculty: "Prof. Meena Shah", time: "01:30 PM – 02:30 PM", icon: "binary", credits: "3 Credits" }
    ],
    "2U2": [
      { code: "EC301", name: "Electronic Devices & Circuits", faculty: "Dr. Pallavi Joshi", time: "09:00 AM – 10:00 AM", icon: "cpu", credits: "4 Credits" },
      { code: "EC302", name: "Signals & Systems", faculty: "Prof. Chetan Kulkarni", time: "10:15 AM – 11:15 AM", icon: "activity", credits: "4 Credits" }
    ],
    "3U": [
      { code: "EC501", name: "Microcontrollers & Embedded Systems", faculty: "Dr. Pallavi Joshi", time: "10:00 AM – 11:00 AM", icon: "cpu", credits: "4 Credits" },
      { code: "EC502", name: "Analog Communication", faculty: "Prof. Chetan Kulkarni", time: "11:15 AM – 12:15 PM", icon: "radio", credits: "4 Credits" }
    ],
    "4U": [
      { code: "EC701", name: "VLSI Design & Technology", faculty: "Prof. Meena Shah", time: "10:00 AM – 11:00 AM", icon: "cpu", credits: "4 Credits" }
    ],

    // ASH 1A1
    "1A1": [
      { code: "AS101", name: "Engineering Mathematics I", faculty: "Dr. Mahendra Dixit", time: "10:00 AM – 11:00 AM", icon: "calculator", credits: "4 Credits" },
      { code: "AS102", name: "Engineering Physics", faculty: "Dr. Vandana Rao", time: "11:15 AM – 12:15 PM", icon: "atom", credits: "4 Credits" },
      { code: "AS103", name: "Basic Electrical Engineering", faculty: "Prof. Tushar Kale", time: "01:30 PM – 02:30 PM", icon: "zap", credits: "3 Credits" }
    ],
    "1A2": [
      { code: "AS101", name: "Engineering Mathematics I", faculty: "Dr. Mahendra Dixit", time: "09:00 AM – 10:00 AM", icon: "calculator", credits: "4 Credits" },
      { code: "AS102", name: "Engineering Physics", faculty: "Dr. Vandana Rao", time: "10:15 AM – 11:15 AM", icon: "atom", credits: "4 Credits" }
    ],
    "1A3": [
      { code: "AS101", name: "Engineering Mathematics I", faculty: "Dr. Mahendra Dixit", time: "11:15 AM – 12:15 PM", icon: "calculator", credits: "4 Credits" }
    ]
  },

  // ------------------------------------------------------
  // REALISTIC STUDENT ROSTER DATA (60 students with Roll No + Name)
  // ------------------------------------------------------
  baseStudentNames: [
    "Aarav Patil", "Aditya Joshi", "Ananya Kulkarni", "Chetan Shinde", "Diya Verma",
    "Gaurav More", "Harshal Jadhav", "Ishaan Deshmukh", "Janhavi Pawar", "Krunal Chavan",
    "Manasi Kale", "Nikhil Bhole", "Pooja Mishra", "Pranav Salunkhe", "Rohit Gupta",
    "Rutuja Gaikwad", "Sahil Khan", "Sakshi Mane", "Sameer Inamdar", "Sanjana Kadam",
    "Sarang Patil", "Shreya Thakur", "Siddhant Rao", "Snehal Wagh", "Sujay Bhosale",
    "Tanvi Sawant", "Tejas Shirodkar", "Utkarsh Narvekar", "Vaishnavi Naik", "Varun Mahajan",
    "Abhishek Sutar", "Aniket Phadke", "Avani Date", "Bhavesh Mehta", "Chinmayee Bapat",
    "Deepak Soni", "Gayatri Dixit", "Hrishikesh Gore", "Isha Ranade", "Jayesh Patil",
    "Kavya Nambiar", "Mandar Kulkarni", "Neha Pendse", "Omkar Thorat", "Prachi Godbole",
    "Rahul Deshpande", "Rhea Shenoy", "Saurabh Jog", "Shruti Apte", "Swapnil Lad",
    "Tanmay Chitale", "Urvi Gokhale", "Vedant Kelkar", "Yashasvi Rane", "Zaid Shaikh",
    "Alok Agnihotri", "Devika Nene", "Karthik Pillai", "Monika Sharma", "Pawan Wadekar"
  ],

  getStudentsForClass(classCode) {
    const cls = this.classes[classCode] || this.classes["2R1"];
    const count = cls.studentsCount || 60;
    const dept = cls.department || "CSE";
    const students = [];

    for (let i = 1; i <= count; i++) {
      const nameIndex = (i - 1) % this.baseStudentNames.length;
      let name = this.baseStudentNames[nameIndex];

      const rollStr = i < 10 ? `0${i}` : `${i}`;
      students.push({
        rollNo: i,
        rollFormatted: rollStr,
        name: name,
        enrollmentNo: `EN2024${dept}${rollStr}`,
        division: classCode,
        department: dept,
        defaultAttendance: i % 7 === 0 ? "absent" : "present" // natural sample
      });
    }

    return students;
  },

  // Directory students roster getter
  get students() {
    return {
      "2R1": this.getStudentsForClass("2R1").map(s => ({
        rollNo: s.rollFormatted,
        name: s.name,
        email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@student.ssgmce.ac.in`,
        attendance: 75 + (s.rollNo % 22)
      })),
      "2R2": this.getStudentsForClass("2R2").map(s => ({
        rollNo: s.rollFormatted,
        name: s.name,
        email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@student.ssgmce.ac.in`,
        attendance: 80 + (s.rollNo % 18)
      })),
      "3R": this.getStudentsForClass("3R").map(s => ({
        rollNo: s.rollFormatted,
        name: s.name,
        email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@student.ssgmce.ac.in`,
        attendance: 82 + (s.rollNo % 16)
      }))
    };
  },

  // Today's classes schedule for Dashboard
    // All 15 Faculty Members from Official PDF
  facultyList: [
    { empCode: "EMP-CSE-1001", name: "Dr. J. M. Patil", title: "Professor & Head, CSE", totalLoad: 12 },
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
    return daysOrder.map(day => {
      const daySlots = facData.schedule[day] || [];
      const slotsArr = ["Free Slot", "Free Slot", "Free Slot", "Free Slot", "Free Slot", "Free Slot"];
      daySlots.forEach(s => {
        const slotIdx = (s.slot || 1) - 1;
        if (slotIdx >= 0 && slotIdx < 6) {
          const venue = s.venue ? ` (${s.venue})` : '';
          slotsArr[slotIdx] = `${s.subject}${venue}`;
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
      subject: "Data Structures (CS302)",
      classCode: "CSE 2R1",
      progress: 68,
      units: [
        { name: "Unit 1: Linear Data Structures & Stacks", percent: 100 },
        { name: "Unit 2: Queues & Linked Lists", percent: 100 },
        { name: "Unit 3: Binary Trees & BST", percent: 75 },
        { name: "Unit 4: Graph Algorithms & Traversals", percent: 35 },
        { name: "Unit 5: Hashing & File Structures", percent: 0 }
      ]
    },
    {
      subject: "Java Programming (CS304)",
      classCode: "CSE 2R2",
      progress: 55,
      units: [
        { name: "Unit 1: OOP Principles & Classes", percent: 100 },
        { name: "Unit 2: Inheritance & Interfaces", percent: 80 },
        { name: "Unit 3: Exception Handling & Multithreading", percent: 40 },
        { name: "Unit 4: Java Collections Framework", percent: 0 }
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
  ]
};

if (typeof window !== 'undefined') {
  window.AcademicDateUtils = AcademicDateUtils;
  window.TeacherERPData = TeacherERPData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AcademicDateUtils, TeacherERPData };
}
