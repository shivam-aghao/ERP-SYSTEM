"""
Seed All 15 Faculty Personal Timetables from SSGMCE Official PDF:
DATA/Personal Timtable for teacher.pdf
"""

import sqlite3
import uuid
import json

DB_PATH = "backend/erp.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Ensure columns in timetable_entries
cur.execute("PRAGMA table_info(timetable_entries)")
existing_cols = [c[1] for c in cur.fetchall()]

new_cols = {
    "teacher_id": "VARCHAR(36)",
    "emp_code": "VARCHAR(50)",
    "class_code": "VARCHAR(50)",
    "slot_index": "INTEGER",
    "is_lab": "BOOLEAN DEFAULT 0",
    "batch": "VARCHAR(20)",
    "subject_abbr": "VARCHAR(100)"
}

for col, dtype in new_cols.items():
    if col not in existing_cols:
        try:
            cur.execute(f"ALTER TABLE timetable_entries ADD COLUMN {col} {dtype}")
            print(f"Added column {col} to timetable_entries")
        except Exception as e:
            print(f"Notice: {e}")

# Fetch all teachers
cur.execute("SELECT id, emp_code, full_name FROM teachers")
teacher_db = {row[1]: (row[0], row[2]) for row in cur.fetchall()}
print(f"Found {len(teacher_db)} teachers in database")

# Define time slots mapping
TIME_SLOTS = {
    1: ("Period 1", "11:00 AM - 12:00 PM"),
    2: ("Period 2", "12:00 PM - 01:00 PM"),
    3: ("Period 3", "01:15 PM - 02:15 PM"),
    4: ("Period 4", "02:15 PM - 03:15 PM"),
    5: ("Period 5", "03:45 PM - 04:45 PM"),
    6: ("Period 6", "04:45 PM - 05:45 PM"),
}

# The 15 Faculty Schedules extracted from DATA/Personal Timtable for teacher.pdf
FACULTY_SCHEDULES = {
    "EMP-CSE-1001": { # Dr. J. M. Patil
        "name": "Dr. J. M. Patil",
        "teaching_load": [
            {"semester": "VII", "code": "7KS03", "abbr": "CC", "theory": 4, "practical": 0, "total": 12},
            {"semester": "V", "code": "5CS224PC", "abbr": "DBMS", "theory": 0, "practical": 8, "total": 8}
        ],
        "schedule": {
            "Monday": [
                {"slot": 1, "subject": "CC", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "DBMS Lab (Batch D)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "D"},
                {"slot": 4, "subject": "DBMS Lab (Batch D)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "D"},
            ],
            "Tuesday": [
                {"slot": 1, "subject": "CC", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "DBMS Lab (Batch B)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "B"},
                {"slot": 4, "subject": "DBMS Lab (Batch B)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "B"},
            ],
            "Wednesday": [
                {"slot": 1, "subject": "CC", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Thursday": [
                {"slot": 3, "subject": "DBMS Lab (Batch C)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "C"},
                {"slot": 4, "subject": "DBMS Lab (Batch C)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "C"},
            ],
            "Friday": [
                {"slot": 1, "subject": "CC", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "DBMS Lab (Batch A)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "A"},
                {"slot": 4, "subject": "DBMS Lab (Batch A)", "class": "3R", "venue": "DBMS Lab", "is_lab": True, "batch": "A"},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1002": { # Dr. N. M. Kandoi
        "name": "Dr. N. M. Kandoi",
        "teaching_load": [
            {"semester": "VII", "code": "7KS05", "abbr": "BF", "theory": 3, "practical": 0, "total": 15},
            {"semester": "VII", "code": "7KS08", "abbr": "ET LAB IV BF", "theory": 0, "practical": 8, "total": 8},
            {"semester": "III", "code": "3CS400EL", "abbr": "Community / Field Project", "theory": 0, "practical": 4, "total": 4}
        ],
        "schedule": {
            "Monday": [
                {"slot": 2, "subject": "BF", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "BF Lab (Batch B)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "B"},
                {"slot": 6, "subject": "BF Lab (Batch B)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "B"},
            ],
            "Tuesday": [
                {"slot": 1, "subject": "CEP (Batch D)", "class": "2R2", "venue": "Seminar Hall", "is_lab": True, "batch": "D"},
                {"slot": 2, "subject": "CEP (Batch D)", "class": "2R2", "venue": "Seminar Hall", "is_lab": True, "batch": "D"},
                {"slot": 5, "subject": "BF Lab (Batch C)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "C"},
                {"slot": 6, "subject": "BF Lab (Batch C)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "C"},
            ],
            "Wednesday": [
                {"slot": 2, "subject": "BF", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "BF Lab (Batch A)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "A"},
                {"slot": 4, "subject": "BF Lab (Batch A)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "A"},
            ],
            "Thursday": [
                {"slot": 1, "subject": "CEP (Batch D)", "class": "2R2", "venue": "Seminar Hall", "is_lab": True, "batch": "D"},
                {"slot": 2, "subject": "CEP (Batch D)", "class": "2R2", "venue": "Seminar Hall", "is_lab": True, "batch": "D"},
            ],
            "Friday": [
                {"slot": 2, "subject": "BF", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "BF Lab (Batch D)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "D"},
                {"slot": 6, "subject": "BF Lab (Batch D)", "class": "4R", "venue": "ET Lab IV", "is_lab": True, "batch": "D"},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1003": { # Prof. C. M. Mankar
        "name": "Prof. C. M. Mankar",
        "teaching_load": [
            {"semester": "V", "code": "5CS221PC", "abbr": "CD", "theory": 3, "practical": 8, "total": 17},
            {"semester": "V", "code": "5CS227MD", "abbr": "MDM#3", "theory": 2, "practical": 0, "total": 2},
            {"semester": "III", "code": "3CS400EL", "abbr": "Community / Field Project", "theory": 0, "practical": 4, "total": 4}
        ],
        "schedule": {
            "Monday": [
                {"slot": 2, "subject": "CD (Compiler Design)", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "CD Lab (Batch B)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "B"},
                {"slot": 4, "subject": "CD Lab (Batch B)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "B"},
                {"slot": 5, "subject": "MDM#3", "class": "3R", "venue": "C1", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 2, "subject": "CD (Compiler Design)", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "CD Lab (Batch A)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "A"},
                {"slot": 4, "subject": "CD Lab (Batch A)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "A"},
                {"slot": 5, "subject": "MDM#3", "class": "3R", "venue": "C1", "is_lab": False, "batch": None},
            ],
            "Wednesday": [
                {"slot": 5, "subject": "CEP (2R1 Batch C)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "C"},
                {"slot": 6, "subject": "CEP (2R1 Batch C)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "C"},
            ],
            "Thursday": [
                {"slot": 2, "subject": "CD (Compiler Design)", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "CD Lab (Batch D)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "D"},
                {"slot": 4, "subject": "CD Lab (Batch D)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "D"},
                {"slot": 5, "subject": "CEP (2R1 Batch C)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "C"},
                {"slot": 6, "subject": "CEP (2R1 Batch C)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "C"},
            ],
            "Friday": [
                {"slot": 3, "subject": "CD Lab (Batch C)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "C"},
                {"slot": 4, "subject": "CD Lab (Batch C)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "C"},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1004": { # Dr. V. S. Mahalle
        "name": "Dr. V. S. Mahalle",
        "teaching_load": [
            {"semester": "III", "code": "3CS201PC", "abbr": "OOP", "theory": 4, "practical": 0, "total": 17},
            {"semester": "III", "code": "3CS203PC", "abbr": "OOP_LAB", "theory": 0, "practical": 8, "total": 8},
            {"semester": "V", "code": "5KS04", "abbr": "PE-I (ICS)", "theory": 3, "practical": 0, "total": 3},
            {"semester": "V", "code": "5KS08", "abbr": "ET LAB-I (ICS)", "theory": 0, "practical": 2, "total": 2}
        ],
        "schedule": {
            "Monday": [
                {"slot": 1, "subject": "OOP Lab (Batch D)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "D"},
                {"slot": 2, "subject": "OOP Lab (Batch D)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "D"},
                {"slot": 3, "subject": "OOP", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "ICS", "class": "3R", "venue": "DBMS Lab", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 1, "subject": "OOP Lab (Batch B)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "B"},
                {"slot": 2, "subject": "OOP Lab (Batch B)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "B"},
                {"slot": 3, "subject": "OOP", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "ICS", "class": "3R", "venue": "DBMS Lab", "is_lab": False, "batch": None},
            ],
            "Wednesday": [
                {"slot": 1, "subject": "OOP Lab (Batch C)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "C"},
                {"slot": 2, "subject": "OOP Lab (Batch C)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "C"},
                {"slot": 3, "subject": "ET Lab: ICS (Batch H)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "H"},
                {"slot": 4, "subject": "ET Lab: ICS (Batch H)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "H"},
                {"slot": 5, "subject": "OOP", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Thursday": [
                {"slot": 1, "subject": "OOP Lab (Batch A)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "A"},
                {"slot": 2, "subject": "OOP Lab (Batch A)", "class": "2R2", "venue": "Computer Lab 1", "is_lab": True, "batch": "A"},
            ],
            "Friday": [
                {"slot": 1, "subject": "ICS", "class": "3R", "venue": "DBMS Lab", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "OOP", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1005": { # Dr. P. K. Bharne
        "name": "Dr. P. K. Bharne",
        "teaching_load": [
            {"semester": "V", "code": "5CS223PE", "abbr": "PE-I DSS", "theory": 3, "practical": 6, "total": 18},
            {"semester": "VII", "code": "7KS04", "abbr": "PE-III DWM", "theory": 3, "practical": 6, "total": 9}
        ],
        "schedule": {
            "Monday": [
                {"slot": 4, "subject": "DWM", "class": "4R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 6, "subject": "PE-I DSS", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 2, "subject": "DWM", "class": "4R", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "ET Lab-I DSS (Batch G)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "G"},
                {"slot": 4, "subject": "ET Lab-I DSS (Batch G)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "G"},
                {"slot": 6, "subject": "PE-I DSS", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
            ],
            "Wednesday": [
                {"slot": 3, "subject": "ET Lab-I DSS (Batch E)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "E"},
                {"slot": 4, "subject": "ET Lab-I DSS (Batch E)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "E"},
                {"slot": 5, "subject": "ET Lab III - DW&M (Batch G)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "G"},
                {"slot": 6, "subject": "ET Lab III - DW&M (Batch G)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "G"},
            ],
            "Thursday": [
                {"slot": 4, "subject": "DWM", "class": "4R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "ET Lab III- DWM (Batch F)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "F"},
                {"slot": 6, "subject": "ET Lab III- DWM (Batch F)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "F"},
            ],
            "Friday": [
                {"slot": 1, "subject": "PE-I DSS", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "ET Lab III - DW&M (Batch E)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "E"},
                {"slot": 4, "subject": "ET Lab III - DW&M (Batch E)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "E"},
                {"slot": 5, "subject": "ET Lab-I DSS (Batch F)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "F"},
                {"slot": 6, "subject": "ET Lab-I DSS (Batch F)", "class": "3R", "venue": "ET Lab I", "is_lab": True, "batch": "F"},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1006": { # Prof. K. P. Sable
        "name": "Prof. K. P. Sable",
        "teaching_load": [
            {"semester": "III", "code": "3CS202PC", "abbr": "DS", "theory": 4, "practical": 8, "total": 17},
            {"semester": "VII", "code": "7KS01", "abbr": "SSEE", "theory": 3, "practical": 0, "total": 3},
            {"semester": "V", "code": "5CS229ML", "abbr": "MDM#5", "theory": 0, "practical": 2, "total": 2}
        ],
        "schedule": {
            "Monday": [
                {"slot": 1, "subject": "DS (Data Structures)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "SSEE", "class": "4R", "venue": "Room 402", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 1, "subject": "DS (Data Structures)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "SSEE", "class": "4R", "venue": "Room 402", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "DS Lab (2R1 Batch C)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "C"},
                {"slot": 6, "subject": "DS Lab (2R1 Batch C)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "C"},
            ],
            "Wednesday": [
                {"slot": 1, "subject": "DS (Data Structures)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "SSEE", "class": "4R", "venue": "Room 402", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "DS Lab (2R1 Batch B)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "B"},
                {"slot": 6, "subject": "DS Lab (2R1 Batch B)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "B"},
            ],
            "Thursday": [
                {"slot": 5, "subject": "DS Lab (2R1 Batch D)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "D"},
                {"slot": 6, "subject": "DS Lab (2R1 Batch D)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "D"},
            ],
            "Friday": [
                {"slot": 1, "subject": "DS Lab (2R1 Batch A)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "A"},
                {"slot": 2, "subject": "DS Lab (2R1 Batch A)", "class": "2R1", "venue": "Lab 01", "is_lab": True, "batch": "A"},
                {"slot": 3, "subject": "DS (Data Structures)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
            ],
            "Saturday": [
                {"slot": 3, "subject": "MDM (WT-B4)", "class": "3R", "venue": "Lab 04", "is_lab": True, "batch": "B4"},
                {"slot": 4, "subject": "MDM (WT-B4)", "class": "3R", "venue": "Lab 04", "is_lab": True, "batch": "B4"},
            ]
        }
    },
    "EMP-CSE-1007": { # Prof. S. B. Pagrut
        "name": "Prof. S. B. Pagrut",
        "teaching_load": [
            {"semester": "III", "code": "3CS201PC", "abbr": "OOP", "theory": 4, "practical": 8, "total": 17},
            {"semester": "VII", "code": "7KS04", "abbr": "PE-III DF", "theory": 3, "practical": 2, "total": 5}
        ],
        "schedule": {
            "Monday": [
                {"slot": 2, "subject": "OOP (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 4, "subject": "PE-III DF (Batch B6)", "class": "4R", "venue": "Room 402", "is_lab": False, "batch": "B6"},
            ],
            "Tuesday": [
                {"slot": 2, "subject": "PE-III DF", "class": "4R", "venue": "Room 402", "is_lab": False, "batch": None},
                {"slot": 3, "subject": "OOP (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "OOP Lab (2R1 Batch A)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "A"},
                {"slot": 6, "subject": "OOP Lab (2R1 Batch A)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "A"},
            ],
            "Wednesday": [
                {"slot": 2, "subject": "OOP (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "OOP Lab (2R1 Batch D)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "D"},
                {"slot": 6, "subject": "OOP Lab (2R1 Batch D)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "D"},
            ],
            "Thursday": [
                {"slot": 3, "subject": "OOP (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 4, "subject": "PE-III DF (Batch B2)", "class": "4R", "venue": "Room 402", "is_lab": False, "batch": "B2"},
                {"slot": 5, "subject": "OOP Lab (2R1 Batch B)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "B"},
                {"slot": 6, "subject": "OOP Lab (2R1 Batch B)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "B"},
            ],
            "Friday": [
                {"slot": 1, "subject": "OOP Lab (2R1 Batch C)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "C"},
                {"slot": 2, "subject": "OOP Lab (2R1 Batch C)", "class": "2R1", "venue": "Lab 02", "is_lab": True, "batch": "C"},
                {"slot": 3, "subject": "ET Lab III - DF (Batch H)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "H"},
                {"slot": 4, "subject": "ET Lab III - DF (Batch H)", "class": "4R", "venue": "ET Lab III", "is_lab": True, "batch": "H"},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1008": { # Dr. R. A. Zamare
        "name": "Dr. R. A. Zamare",
        "teaching_load": [
            {"semester": "V", "code": "5CS222PC", "abbr": "CAO", "theory": 3, "practical": 0, "total": 17},
            {"semester": "III", "code": "3CS400EL", "abbr": "Community / Field Project", "theory": 0, "practical": 4, "total": 4},
            {"semester": "I", "code": "WS-R1", "abbr": "WS(R1)", "theory": 0, "practical": 6, "total": 6},
            {"semester": "V", "code": "5CS228MD", "abbr": "WT (MDM#4 / MDM#5)", "theory": 2, "practical": 2, "total": 4}
        ],
        "schedule": {
            "Monday": [
                {"slot": 1, "subject": "CA&O (Computer Arch & Org)", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 5, "subject": "CEP (2R1 Batch B)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "B"},
                {"slot": 6, "subject": "CEP (2R1 Batch B)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "B"},
            ],
            "Wednesday": [
                {"slot": 2, "subject": "CA&O (Computer Arch & Org)", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "MDM#4", "class": "3R", "venue": "C2", "is_lab": False, "batch": None},
            ],
            "Thursday": [
                {"slot": 1, "subject": "CA&O (Computer Arch & Org)", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "MDM#4", "class": "3R", "venue": "C2", "is_lab": False, "batch": None},
            ],
            "Friday": [
                {"slot": 1, "subject": "CEP (2R1 Batch B)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "B"},
                {"slot": 2, "subject": "CEP (2R1 Batch B)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "B"},
            ],
            "Saturday": [
                {"slot": 1, "subject": "MDM (WT-B1)", "class": "3R", "venue": "Lab 01", "is_lab": True, "batch": "B1"},
                {"slot": 2, "subject": "MDM (WT-B1)", "class": "3R", "venue": "Lab 01", "is_lab": True, "batch": "B1"},
            ]
        }
    },
    "EMP-CSE-1009": { # Prof. R. V. Deshmukh (Dr. Rohan Deshmukh)
        "name": "Prof. R. V. Deshmukh",
        "teaching_load": [
            {"semester": "VII", "code": "7KS02 / 7KS06", "abbr": "CG (Computer Graphics)", "theory": 3, "practical": 8, "total": 18},
            {"semester": "V", "code": "5CS220PC", "abbr": "DBMS", "theory": 3, "practical": 0, "total": 3},
            {"semester": "III", "code": "3CS400EL", "abbr": "Community / Field Project", "theory": 0, "practical": 4, "total": 4}
        ],
        "schedule": {
            "Monday": [
                {"slot": 1, "subject": "CEP (2R2 Batch C)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "C"},
                {"slot": 2, "subject": "CEP (2R2 Batch C)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "C"},
                {"slot": 5, "subject": "CG Lab (Batch C)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "C"},
                {"slot": 6, "subject": "CG Lab (Batch C)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "C"},
            ],
            "Tuesday": [
                {"slot": 1, "subject": "DBMS", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 4, "subject": "CG (Computer Graphics)", "class": "4R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "CG Lab (Batch D)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "D"},
                {"slot": 6, "subject": "CG Lab (Batch D)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "D"},
            ],
            "Wednesday": [
                {"slot": 1, "subject": "DBMS", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 4, "subject": "CG (Computer Graphics)", "class": "4R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "CG Lab (Batch B)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "B"},
                {"slot": 6, "subject": "CG Lab (Batch B)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "B"},
            ],
            "Thursday": [
                {"slot": 1, "subject": "CEP (2R2 Batch C)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "C"},
                {"slot": 2, "subject": "CEP (2R2 Batch C)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "C"},
                {"slot": 3, "subject": "CG (Computer Graphics)", "class": "4R", "venue": "B206", "is_lab": False, "batch": None},
            ],
            "Friday": [
                {"slot": 2, "subject": "DBMS", "class": "3R", "venue": "B206", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "CG Lab (Batch A)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "A"},
                {"slot": 6, "subject": "CG Lab (Batch A)", "class": "4R", "venue": "Graphics Lab", "is_lab": True, "batch": "A"},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1010": { # Prof. S. M. Jawake
        "name": "Prof. S. M. Jawake",
        "teaching_load": [
            {"semester": "I", "code": "CP-101", "abbr": "CP (Computer Prog)", "theory": 4, "practical": 6, "total": 18},
            {"semester": "V", "code": "5CS227MD", "abbr": "DBMS", "theory": 2, "practical": 0, "total": 2}
        ],
        "schedule": {
            "Monday": [
                {"slot": 5, "subject": "MDM#3", "class": "3R", "venue": "C2", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 5, "subject": "MDM#3", "class": "3R", "venue": "C2", "is_lab": False, "batch": None},
            ],
            "Wednesday": [
                {"slot": 5, "subject": "CEP (2R1 Batch A)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "A"},
                {"slot": 6, "subject": "CEP (2R1 Batch A)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "A"},
            ],
            "Thursday": [
                {"slot": 5, "subject": "CEP (2R1 Batch A)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "A"},
                {"slot": 6, "subject": "CEP (2R1 Batch A)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "A"},
            ],
            "Friday": [],
            "Saturday": [
                {"slot": 3, "subject": "MDM (WT-B2)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "B2"},
                {"slot": 4, "subject": "MDM (WT-B2)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "B2"},
            ]
        }
    },
    "EMP-CSE-1011": { # Prof. T. A. Puranik
        "name": "Prof. T. A. Puranik",
        "teaching_load": [
            {"semester": "III", "code": "3CS200PC", "abbr": "DSGT-R1", "theory": 4, "practical": 0, "total": 19},
            {"semester": "III", "code": "3CS200PC", "abbr": "DSGT-R2", "theory": 4, "practical": 0, "total": 4},
            {"semester": "I", "code": "SKL-101", "abbr": "Skill lab-I", "theory": 1, "practical": 6, "total": 7},
            {"semester": "III", "code": "3CS400EL", "abbr": "Community / Field Project", "theory": 0, "practical": 4, "total": 4}
        ],
        "schedule": {
            "Monday": [
                {"slot": 1, "subject": "CEP (2R2 Batch B)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "B"},
                {"slot": 2, "subject": "CEP (2R2 Batch B)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "B"},
                {"slot": 3, "subject": "DS&GT (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 2, "subject": "DS&GT (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "DSGT (2R2)", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Wednesday": [
                {"slot": 1, "subject": "CEP (2R2 Batch B)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "B"},
                {"slot": 2, "subject": "CEP (2R2 Batch B)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "B"},
                {"slot": 3, "subject": "DS&GT (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "DS&GT (2R2)", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Thursday": [
                {"slot": 2, "subject": "DSGT (2R1)", "class": "2R1", "venue": "B108", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "DS&GT (2R2)", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Friday": [
                {"slot": 2, "subject": "DS&GT (2R2)", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Saturday": []
        }
    },
    "EMP-CSE-1012": { # Prof. V. S. Kanherkar
        "name": "Prof. V. S. Kanherkar",
        "teaching_load": [
            {"semester": "II", "code": "1AL102ES", "abbr": "CP", "theory": 4, "practical": 6, "total": 18},
            {"semester": "III", "code": "3CS205MD", "abbr": "MDM#1", "theory": 2, "practical": 0, "total": 2},
            {"semester": "III", "code": "3CS400EL", "abbr": "Community / Field Project", "theory": 0, "practical": 4, "total": 4},
            {"semester": "V", "code": "5CS229ML", "abbr": "MDM#5", "theory": 0, "practical": 2, "total": 2}
        ],
        "schedule": {
            "Monday": [
                {"slot": 4, "subject": "MDM#1", "class": "3R", "venue": "C2", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 1, "subject": "CEP (2R2 Batch A)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "A"},
                {"slot": 2, "subject": "CEP (2R2 Batch A)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "A"},
                {"slot": 4, "subject": "MDM#1", "class": "3R", "venue": "C2", "is_lab": False, "batch": None},
            ],
            "Wednesday": [
                {"slot": 1, "subject": "CEP (2R2 Batch A)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "A"},
                {"slot": 2, "subject": "CEP (2R2 Batch A)", "class": "2R2", "venue": "Room 305", "is_lab": True, "batch": "A"},
            ],
            "Thursday": [],
            "Friday": [],
            "Saturday": [
                {"slot": 1, "subject": "MDM (WT-B3)", "class": "3R", "venue": "Lab 03", "is_lab": True, "batch": "B3"},
                {"slot": 2, "subject": "MDM (WT-B3)", "class": "3R", "venue": "Lab 03", "is_lab": True, "batch": "B3"},
            ]
        }
    },
    "EMP-CSE-1013": { # Prof. N. N. Fatkar
        "name": "Prof. N. N. Fatkar",
        "teaching_load": [
            {"semester": "III", "code": "3CS202PC", "abbr": "DS-R2", "theory": 4, "practical": 8, "total": 18},
            {"semester": "V", "code": "5CS229ML", "abbr": "(MDM#5)", "theory": 0, "practical": 4, "total": 4},
            {"semester": "V", "code": "5CS230OE", "abbr": "OE-III", "theory": 2, "practical": 0, "total": 2}
        ],
        "schedule": {
            "Monday": [
                {"slot": 1, "subject": "DS Lab (2R2 Batch A)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "A"},
                {"slot": 2, "subject": "DS Lab (2R2 Batch A)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "A"},
            ],
            "Tuesday": [
                {"slot": 1, "subject": "DS Lab (2R2 Batch C)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "C"},
                {"slot": 2, "subject": "DS Lab (2R2 Batch C)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "C"},
                {"slot": 6, "subject": "DS (2R2)", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
            ],
            "Wednesday": [
                {"slot": 1, "subject": "DS Lab (2R2 Batch D)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "D"},
                {"slot": 2, "subject": "DS Lab (2R2 Batch D)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "D"},
                {"slot": 3, "subject": "DS (2R2)", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 6, "subject": "OE-III", "class": "3R", "venue": "C1", "is_lab": False, "batch": None},
            ],
            "Thursday": [
                {"slot": 1, "subject": "DS Lab (2R2 Batch B)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "B"},
                {"slot": 2, "subject": "DS Lab (2R2 Batch B)", "class": "2R2", "venue": "Lab 01", "is_lab": True, "batch": "B"},
                {"slot": 3, "subject": "DS (2R2)", "class": "2R2", "venue": "B007", "is_lab": False, "batch": None},
                {"slot": 6, "subject": "OE-III", "class": "3R", "venue": "C1", "is_lab": False, "batch": None},
            ],
            "Friday": [
                {"slot": 1, "subject": "DS (2R2)", "class": "2R2", "venue": "B108", "is_lab": False, "batch": None},
            ],
            "Saturday": [
                {"slot": 1, "subject": "MDM (WT-B6)", "class": "3R", "venue": "Lab 01", "is_lab": True, "batch": "B6"},
                {"slot": 2, "subject": "MDM (WT-B6)", "class": "3R", "venue": "Lab 01", "is_lab": True, "batch": "B6"},
                {"slot": 3, "subject": "MDM (WT-B7)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "B7"},
                {"slot": 4, "subject": "MDM (WT-B7)", "class": "3R", "venue": "Lab 02", "is_lab": True, "batch": "B7"},
            ]
        }
    },
    "EMP-CSE-1014": { # Prof. M. D. Rakhonde
        "name": "Prof. M. D. Rakhonde",
        "teaching_load": [
            {"semester": "V", "code": "5CS228MD", "abbr": "(MDM#4)", "theory": 2, "practical": 0, "total": 16},
            {"semester": "V", "code": "5CS229ML", "abbr": "MDM#5", "theory": 0, "practical": 4, "total": 4},
            {"semester": "III", "code": "3CS206OE", "abbr": "OE -I", "theory": 3, "practical": 0, "total": 3},
            {"semester": "I", "code": "SKL-102", "abbr": "Skill Lab-I(R2)", "theory": 1, "practical": 6, "total": 7}
        ],
        "schedule": {
            "Monday": [],
            "Tuesday": [],
            "Wednesday": [
                {"slot": 4, "subject": "OE-I", "class": "2R1", "venue": "A3", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "MDM#4", "class": "3R", "venue": "C1", "is_lab": False, "batch": None},
            ],
            "Thursday": [
                {"slot": 4, "subject": "OE-I", "class": "2R1", "venue": "A3", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "MDM#4", "class": "3R", "venue": "C1", "is_lab": False, "batch": None},
            ],
            "Friday": [
                {"slot": 4, "subject": "OE-I", "class": "2R1", "venue": "A3", "is_lab": False, "batch": None},
            ],
            "Saturday": [
                {"slot": 1, "subject": "MDM (WT-B5)", "class": "3R", "venue": "Lab 03", "is_lab": True, "batch": "B5"},
                {"slot": 2, "subject": "MDM (WT-B5)", "class": "3R", "venue": "Lab 03", "is_lab": True, "batch": "B5"},
                {"slot": 3, "subject": "MDM (WT-8)", "class": "3R", "venue": "Lab 04", "is_lab": True, "batch": "WT-8"},
                {"slot": 4, "subject": "MDM (WT-8)", "class": "3R", "venue": "Lab 04", "is_lab": True, "batch": "WT-8"},
            ]
        }
    },
    "EMP-CSE-1015": { # Mr. Krushan. V. Kulthe
        "name": "Mr. Krushan. V. Kulthe",
        "teaching_load": [
            {"semester": "I", "code": "WS-102", "abbr": "WS(R2)", "theory": 1, "practical": 6, "total": 13},
            {"semester": "III", "code": "3CS400EL", "abbr": "Community / Field Project", "theory": 0, "practical": 4, "total": 4},
            {"semester": "III", "code": "5CS205MD", "abbr": "MDM#1", "theory": 2, "practical": 0, "total": 2}
        ],
        "schedule": {
            "Monday": [
                {"slot": 4, "subject": "MDM#1", "class": "2R1", "venue": "A4", "is_lab": False, "batch": None},
            ],
            "Tuesday": [
                {"slot": 4, "subject": "MDM#1", "class": "2R1", "venue": "A4", "is_lab": False, "batch": None},
                {"slot": 5, "subject": "CEP (2R1 Batch D)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "D"},
                {"slot": 6, "subject": "CEP (2R1 Batch D)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "D"},
            ],
            "Wednesday": [],
            "Thursday": [],
            "Friday": [
                {"slot": 1, "subject": "CEP (2R1 Batch D)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "D"},
                {"slot": 2, "subject": "CEP (2R1 Batch D)", "class": "2R1", "venue": "Room 201", "is_lab": True, "batch": "D"},
            ],
            "Saturday": []
        }
    }
}

# Clear old entries that have teacher_id
cur.execute("DELETE FROM timetable_entries")

total_inserted = 0

for emp_code, data in FACULTY_SCHEDULES.items():
    if emp_code not in teacher_db:
        print(f"Warning: {emp_code} not found in teachers table")
        continue
    
    t_id, t_name = teacher_db[emp_code]
    
    for day, slots in data["schedule"].items():
        for item in slots:
            slot_idx = item["slot"]
            p_num, p_time = TIME_SLOTS[slot_idx]
            
            entry_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO timetable_entries (
                    id, teacher_id, emp_code, teacher_name, day,
                    period_num, period_time, slot_index,
                    course_code, course_name, subject_abbr, class_code,
                    venue, is_lab, batch,
                    status, status_class, att_label,
                    is_completed, is_active_now, is_critical
                ) VALUES (
                    :id, :tid, :emp, :tname, :day,
                    :pnum, :ptime, :sidx,
                    :ccode, :cname, :sabbr, :clscode,
                    :venue, :lab, :batch,
                    'Scheduled', 'status-scheduled', 'Attendance: Pending',
                    0, 0, 0
                )
            """, {
                "id": entry_id,
                "tid": t_id,
                "emp": emp_code,
                "tname": t_name,
                "day": day.lower(),
                "pnum": p_num,
                "ptime": p_time,
                "sidx": slot_idx,
                "ccode": item.get("course_code") or f"CS-{slot_idx}01",
                "cname": item["subject"],
                "sabbr": item["subject"],
                "clscode": item["class"],
                "venue": item["venue"],
                "lab": 1 if item["is_lab"] else 0,
                "batch": item["batch"]
            })
            total_inserted += 1

conn.commit()
print(f"Successfully seeded {total_inserted} personal timetable entries across all 15 faculty members in SQLite!")

# Write JSON cache for fast frontend fallback
with open("backend/data_teacher_timetables.json", "w", encoding="utf-8") as f:
    json.dump(FACULTY_SCHEDULES, f, indent=2)
print("Saved cache to backend/data_teacher_timetables.json")

conn.close()

