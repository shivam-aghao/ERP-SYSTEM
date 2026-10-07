"""
Generate Comprehensive Historical Attendance Data for Supabase and SQLite
Fetches Master IDs (teachers, subjects, students) directly from Supabase Cloud
so that Foreign Key constraints are 100% satisfied.
"""

import os
import sys
import json
import uuid
import random
from datetime import date, timedelta
import urllib.request
import ctypes
from ctypes import wintypes
import sqlite3

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD), ('Type', wintypes.DWORD), ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR), ('LastWritten', wintypes.FILETIME), ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_char)), ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD), ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR), ('UserName', wintypes.LPWSTR)
    ]

def get_supabase_token():
    advapi32 = ctypes.windll.advapi32
    cred_ptr = ctypes.POINTER(CREDENTIAL)()
    res = advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_ptr))
    if not res:
        raise RuntimeError("Failed to read Supabase CLI credential from Windows Credential Manager.")
    return ctypes.string_at(cred_ptr.contents.CredentialBlob, cred_ptr.contents.CredentialBlobSize).decode('utf-8')

def run_supabase_query(sql, token):
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql}).encode('utf-8'),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def run():
    token = get_supabase_token()
    print("Acquired Supabase token. Fetching master tables from Supabase Cloud...")

    # 1. Fetch Students from Supabase
    st_rows = run_supabase_query("SELECT id, student_code, roll_no, full_name, class_name FROM public.students;", token)
    students_by_class = {}
    student_map = {}
    for st in st_rows:
        cname = st.get('class_name') or '3R'
        students_by_class.setdefault(cname, []).append(st)
        student_map[st['student_code']] = st
    print(f"Loaded {len(student_map)} students from Supabase across classes {list(students_by_class.keys())}.")

    # 2. Fetch Teachers from Supabase
    t_rows = run_supabase_query("SELECT id, emp_code, full_name FROM public.teachers;", token)
    teachers = {t['emp_code']: t for t in t_rows}
    print(f"Loaded {len(teachers)} teachers from Supabase.")

    # 3. Fetch Subjects from Supabase
    sub_rows = run_supabase_query("SELECT id, code, name, type FROM public.subjects;", token)
    subjects = {s['code']: s for s in sub_rows}
    print(f"Loaded {len(subjects)} subjects from Supabase.")

    # 4. Fetch Classes from Supabase
    cls_rows = run_supabase_query("SELECT id, class_name FROM public.classes;", token)
    classes = {c['class_name']: c['id'] for c in cls_rows}
    print(f"Loaded {len(classes)} classes from Supabase: {classes}")

    # Set up student attendance rates
    student_rate = {}
    for cname, st_list in students_by_class.items():
        st_list.sort(key=lambda x: str(x['roll_no']))
        defaulters = set([st_list[3]['student_code'], st_list[11]['student_code'], st_list[22]['student_code']])
        for st in st_list:
            sc = st['student_code']
            if sc == "308637":
                student_rate[sc] = 0.865 # Shivam Aghao high attendance
            elif sc in defaulters:
                student_rate[sc] = random.uniform(0.64, 0.71)
            else:
                student_rate[sc] = random.uniform(0.79, 0.94)

    # Curriculum mapping
    curriculum = {
        '3R': [
            {
                'subject_code': '5CS220PC',
                'teacher_emp': 'EMP-CSE-1001', # Dr. J. M. Patil
                'days': [0, 2, 4], # Mon, Wed, Fri
                'period': '1',
                'time_slot': '09:00 - 10:00',
                'type': 'Theory',
                'topics': [
                    "Introduction to DBMS & Architecture", "Relational Model & Relational Algebra",
                    "Tuple Relational Calculus", "SQL DDL & Integrity Constraints",
                    "Advanced SQL Queries & Joins", "Views, Assertions & Triggers",
                    "Entity Relationship (ER) Modeling", "Mapping ER Diagrams to Relational Tables",
                    "Functional Dependencies & Keys", "First and Second Normal Forms (1NF, 2NF)",
                    "Third Normal Form (3NF) & BCNF", "Lossless Join & Dependency Preservation",
                    "Query Processing & Cost Estimation", "Query Optimization Techniques",
                    "Transaction Concepts & ACID Properties", "Schedules & Serializability",
                    "Concurrency Control & 2-Phase Locking", "Deadlock Detection & Prevention",
                    "Recovery Techniques & Write-Ahead Logging", "Checkpointing & Shadow Paging",
                    "Indexing: B-Tree & B+ Tree Indices", "Hash-based Indexing Techniques"
                ]
            },
            {
                'subject_code': '5CS221PC',
                'teacher_emp': 'EMP-CSE-1002', # Dr. N. M. Kandoi
                'days': [1, 3], # Tue, Thu
                'period': '2',
                'time_slot': '10:00 - 11:00',
                'type': 'Theory',
                'topics': [
                    "Introduction to Language Translators & Compilers", "Phases of a Compiler & Cousins",
                    "Lexical Analysis & Role of Lexer", "Regular Expressions & Finite Automata",
                    "LEX / Flex Tool Architecture", "Context-Free Grammars & Derivations",
                    "Ambiguity & Elimination of Left Recursion", "Top-Down Parsing & LL(1) Parser Design",
                    "Recursive Descent Parsing", "Bottom-Up Parsing & Shift-Reduce Conflicts",
                    "LR(0) and SLR(1) Parsing Tables", "Canonical LR(1) Parsing",
                    "LALR(1) Parsing & YACC / Bison Parser", "Syntax Directed Definitions (SDD)",
                    "Syntax Directed Translation Schemes (SDTS)", "Intermediate Code: Three-Address Code",
                    "Quadruples, Triples and Indirect Triples", "Symbol Table Organization"
                ]
            },
            {
                'subject_code': '5CS222PC',
                'teacher_emp': 'EMP-CSE-1009', # Prof. R. V. Deshmukh
                'days': [0, 3], # Mon, Thu
                'period': '3',
                'time_slot': '11:15 - 12:15',
                'type': 'Theory',
                'topics': [
                    "Evolution of Computer Architectures", "Bus Architecture & Interconnection",
                    "Memory Hierarchy & Cache Mapping Techniques", "Cache Coherence Protocols",
                    "Instruction Set Architecture (ISA)", "Addressing Modes & Instruction Formats",
                    "Data Path & Control Unit Design", "Hardwired vs Microprogrammed Control",
                    "Pipelining Principles & Speedup", "Pipelining Hazards: Structural, Data, Control",
                    "Branch Prediction Techniques", "Superscalar and VLIW Processors",
                    "Multicore Architectures & SMP", "I/O Organization & Interrupts"
                ]
            },
            {
                'subject_code': '5CS223PE',
                'teacher_emp': 'EMP-CSE-1008', # Dr. R. A. Zamare
                'days': [2, 4], # Wed, Fri
                'period': '4',
                'time_slot': '01:15 - 02:15',
                'type': 'Theory',
                'topics': [
                    "Data Science Ecosystem Overview", "Data Wrangling & Preprocessing with Pandas",
                    "Descriptive Statistics & Summary Metrics", "Probability Distributions & PDF/CDF",
                    "Sampling Distributions & Central Limit Theorem", "Hypothesis Testing & Z-test, T-test",
                    "Chi-Square Test & ANOVA", "Covariance & Pearson Correlation",
                    "Simple Linear Regression Analysis", "Multiple Linear Regression & Regularization",
                    "Logistic Regression for Classification", "Exploratory Data Analysis (EDA) Techniques"
                ]
            },
            {
                'subject_code': '5CS224PC',
                'teacher_emp': 'EMP-CSE-1001', # Dr. J. M. Patil (Lab)
                'days': [1], # Tuesdays
                'period': '5-6',
                'time_slot': '02:15 - 04:15',
                'type': 'Practical',
                'topics': [
                    "Lab 1: DDL Commands & Table Creation in PostgreSQL",
                    "Lab 2: DML Statements & Integrity Constraints",
                    "Lab 3: Complex Subqueries and Aggregate Functions",
                    "Lab 4: Inner, Outer, Cross Joins & Views",
                    "Lab 5: PL/pgSQL Procedures and Stored Functions",
                    "Lab 6: Database Triggers & Audit Logging",
                    "Lab 7: B+ Tree Indexing Performance Benchmarks"
                ]
            },
            {
                'subject_code': '5CS225PC',
                'teacher_emp': 'EMP-CSE-1002', # Dr. N. M. Kandoi (Lab)
                'days': [3], # Thursdays
                'period': '5-6',
                'time_slot': '02:15 - 04:15',
                'type': 'Practical',
                'topics': [
                    "Lab 1: Design of Lexical Analyzer in C/C++",
                    "Lab 2: Implementation of Lexer using FLEX",
                    "Lab 3: Recursive Descent Parser Implementation",
                    "Lab 4: Design of LL(1) Parsing Table",
                    "Lab 5: YACC Implementation of Calculator",
                    "Lab 6: Intermediate Code Generator for Arithmetic Expressions",
                    "Lab 7: Code Optimization Techniques Implementation"
                ]
            }
        ],
        '2R1': [
            {
                'subject_code': '3CS201PC',
                'teacher_emp': 'EMP-CSE-1004', # Dr. V. S. Mahalle
                'days': [0, 2, 4],
                'period': '1',
                'time_slot': '09:00 - 10:00',
                'type': 'Theory',
                'topics': ["Array and Matrix Operations", "Singly Linked List Implementation", "Doubly and Circular Linked Lists", "Stack and Applications", "Queue and Priority Queue", "Binary Search Trees", "AVL Tree Balancing", "Graph Traversals (BFS & DFS)", "Sorting Algorithms Analysis"]
            },
            {
                'subject_code': '3CS202PC',
                'teacher_emp': 'EMP-CSE-1003', # Prof. C. M. Mankar
                'days': [1, 3],
                'period': '2',
                'time_slot': '10:00 - 11:00',
                'type': 'Theory',
                'topics': ["JVM Architecture & Bytecode", "OOP Principles in Java", "Class & Objects Constructor Overloading", "Inheritance & Polymorphism", "Interfaces and Abstract Classes", "Package and Access Modifiers", "Exception Handling Mechanism", "Multithreading & Synchronization"]
            },
            {
                'subject_code': '3CS204PC',
                'teacher_emp': 'EMP-CSE-1006', # Prof. K. P. Sable
                'days': [0, 3],
                'period': '3',
                'time_slot': '11:15 - 12:15',
                'type': 'Theory',
                'topics': ["Operating System Evolution", "System Calls & Dual Mode Operation", "Process State & Process Control Block", "CPU Scheduling Algorithms", "Inter-Process Communication (IPC)", "Critical Section Problem & Semaphores", "Deadlock Characterization & Avoidance", "Paging & Virtual Memory Concepts"]
            },
            {
                'subject_code': '3CS205MD',
                'teacher_emp': 'EMP-CSE-1007', # Prof. S. B. Pagrut
                'days': [1, 4],
                'period': '4',
                'time_slot': '01:15 - 02:15',
                'type': 'Theory',
                'topics': ["OSI and TCP/IP Reference Models", "Transmission Media & Nyquist Theorem", "Data Link Layer & Framing", "Error Detection (CRC & Checksum)", "Sliding Window Protocols (Go-Back-N)", "Medium Access Control (CSMA/CD)", "IPv4 Addressing & Subnetting", "Routing Algorithms"]
            }
        ],
        '2R2': [
            {
                'subject_code': '3CS201PC',
                'teacher_emp': 'EMP-CSE-1004',
                'days': [0, 2, 4],
                'period': '2',
                'time_slot': '10:00 - 11:00',
                'type': 'Theory',
                'topics': ["Array and Matrix Operations", "Singly Linked List Implementation", "Doubly and Circular Linked Lists", "Stack and Applications", "Queue and Priority Queue", "Binary Search Trees", "AVL Trees", "Graph BFS and DFS", "Heap Sort and Quick Sort"]
            },
            {
                'subject_code': '3CS202PC',
                'teacher_emp': 'EMP-CSE-1003',
                'days': [1, 3],
                'period': '1',
                'time_slot': '09:00 - 10:00',
                'type': 'Theory',
                'topics': ["Java JVM and Bytecode", "Encapsulation & Constructors", "Inheritance Hierarchies", "Interfaces & Abstract Classes", "Exception Handling with Try-Catch", "Collections Framework Overview", "Multithreading in Java", "File I/O Streams"]
            },
            {
                'subject_code': '3CS204PC',
                'teacher_emp': 'EMP-CSE-1006',
                'days': [0, 3],
                'period': '4',
                'time_slot': '01:15 - 02:15',
                'type': 'Theory',
                'topics': ["OS Kernel and System Calls", "Process Control Block & Context Switching", "CPU Scheduling (FCFS, SJF, Round Robin)", "Process Synchronization & Semaphores", "Deadlock Detection and Banker's Algorithm", "Memory Management: Paging & Segmentation", "Page Replacement Algorithms", "File Systems and Disk Scheduling"]
            },
            {
                'subject_code': '3CS205MD',
                'teacher_emp': 'EMP-CSE-1007',
                'days': [1, 4],
                'period': '3',
                'time_slot': '11:15 - 12:15',
                'type': 'Theory',
                'topics': ["Network Topologies and Standards", "Physical Layer Transmission", "Data Link Protocols & Flow Control", "Ethernet Architecture and Switches", "Network Layer & IPv4/IPv6", "Subnet Masking & CIDR", "TCP vs UDP Transport Layer", "DNS, HTTP, and Application Protocols"]
            }
        ],
        '4R': [
            {
                'subject_code': '7KS01',
                'teacher_emp': 'EMP-CSE-1010', # Prof. S. M. Jawake
                'days': [0, 2, 4],
                'period': '1',
                'time_slot': '09:00 - 10:00',
                'type': 'Theory',
                'topics': ["Cloud Computing Architecture & NIST Model", "IaaS, PaaS, SaaS Service Models", "Public, Private, Hybrid Cloud Deployment", "Virtualization Concepts: Hypervisors", "Containerization: Docker & Kubernetes", "AWS & Cloud Storage Infrastructure", "Serverless Computing & Cloud Security", "Cloud Resource Scheduling & Auto-scaling"]
            },
            {
                'subject_code': '7KS02',
                'teacher_emp': 'EMP-CSE-1011', # Prof. T. A. Puranik
                'days': [1, 3],
                'period': '2',
                'time_slot': '10:00 - 11:00',
                'type': 'Theory',
                'topics': ["Data Warehousing Architecture & Schemas", "Star, Snowflake, Fact Constellation Schemas", "ETL Process: Extraction, Transformation, Loading", "OLAP vs OLTP Operations (Rollup, Drilldown)", "Data Mining Tasks & Process (CRISP-DM)", "Association Rule Mining: Apriori Algorithm", "Classification: Decision Trees & Naive Bayes", "Clustering: K-Means & Hierarchical Methods"]
            }
        ]
    }

    start_date = date(2026, 8, 18)
    end_date = date(2026, 10, 6)

    all_sessions = []
    all_records = []
    student_subject_counts = {}

    for cname, st_list in students_by_class.items():
        courses = curriculum.get(cname, [])
        for st in st_list:
            sc = st['student_code']
            for course in courses:
                sub_code = course['subject_code']
                student_subject_counts[(sc, sub_code)] = [0, 0]

    cur = start_date
    date_list = []
    while cur <= end_date:
        if cur.weekday() < 5:
            date_list.append(cur)
        cur += timedelta(days=1)

    for cname, courses in curriculum.items():
        st_list = students_by_class.get(cname, [])
        if not st_list:
            continue
        c_id = classes.get(cname)

        for course in courses:
            sub_code = course['subject_code']
            sub_obj = subjects.get(sub_code)
            teacher_emp = course['teacher_emp']
            teacher_obj = teachers.get(teacher_emp)
            days_of_week = course['days']
            topics = course['topics']
            topic_idx = 0

            for d in date_list:
                if d.weekday() in days_of_week:
                    sess_id = str(uuid.uuid4())
                    session_code = f"REC-{d.strftime('%Y%m%d')}-{cname}-{sub_code[:5]}-P{course['period'][:1]}"
                    topic = topics[topic_idx % len(topics)]
                    topic_idx += 1

                    pres_count = 0
                    abs_count = 0

                    for st in st_list:
                        sc = st['student_code']
                        rate = student_rate.get(sc, 0.85)
                        is_present = (random.random() < rate)
                        if is_present:
                            pres_count += 1
                            student_subject_counts[(sc, sub_code)][0] += 1
                        else:
                            abs_count += 1
                        student_subject_counts[(sc, sub_code)][1] += 1

                        rec_id = str(uuid.uuid4())
                        all_records.append({
                            'id': rec_id,
                            'session_id': sess_id,
                            'student_id': st['id'],
                            'student_code': sc,
                            'roll_no': str(st.get('roll_no', '')),
                            'student_name': st.get('full_name', ''),
                            'is_present': is_present,
                            'status': 'PRESENT' if is_present else 'ABSENT',
                            'remarks': 'On Time' if is_present else 'Absent'
                        })

                    total_st = len(st_list)
                    att_rate = round((pres_count / total_st * 100), 2) if total_st > 0 else 0.0

                    all_sessions.append({
                        'id': sess_id,
                        'session_code': session_code,
                        'teacher_id': teacher_obj['id'] if teacher_obj else None,
                        'class_id': c_id,
                        'class_name': cname,
                        'department_code': 'CSE',
                        'subject_id': sub_obj['id'] if sub_obj else None,
                        'subject_code': sub_code,
                        'subject_name': sub_obj['name'] if sub_obj else sub_code,
                        'session_date': d.strftime('%Y-%m-%d'),
                        'period_number': course['period'],
                        'period': course['period'],
                        'time_slot': course['time_slot'],
                        'session_type': course['type'],
                        'topic_taught': topic,
                        'remark': f"Completed lecture on {topic}",
                        'total_students': total_st,
                        'present_count': pres_count,
                        'absent_count': abs_count,
                        'attendance_rate': att_rate,
                        'status': 'SUBMITTED'
                    })

    print(f"Generated {len(all_sessions)} attendance sessions and {len(all_records)} individual records.")

    # Write output to SQL script
    sql_file = "backend/supabase_attendance_seed.sql"
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write("-- Attendance Sessions & Records Seed Script\n")
        f.write("DELETE FROM public.attendance_records;\n")
        f.write("DELETE FROM public.attendance_sessions;\n\n")

        # Sessions in batches of 50
        batch_size = 50
        for i in range(0, len(all_sessions), batch_size):
            batch = all_sessions[i:i+batch_size]
            vals = []
            for s in batch:
                topic_escaped = s['topic_taught'].replace("'", "''")
                remark_escaped = s['remark'].replace("'", "''")
                sname_escaped = s['subject_name'].replace("'", "''")
                t_id = f"'{s['teacher_id']}'" if s['teacher_id'] else "NULL"
                c_id = f"'{s['class_id']}'" if s['class_id'] else "NULL"
                sub_id = f"'{s['subject_id']}'" if s['subject_id'] else "NULL"
                vals.append(f"""(
                    '{s['id']}', '{s['session_code']}', {t_id}, {c_id},
                    '{s['class_name']}', '{s['department_code']}', {sub_id},
                    '{s['subject_code']}', '{sname_escaped}', '{s['session_date']}',
                    '{s['period_number']}', '{s['period']}', '{s['time_slot']}',
                    '{s['session_type']}', '{topic_escaped}', '{remark_escaped}',
                    {s['total_students']}, {s['present_count']}, {s['absent_count']},
                    {s['attendance_rate']}, '{s['status']}', '{s['session_date']}'::date
                )""")
            f.write(f"""INSERT INTO public.attendance_sessions (
                id, session_code, teacher_id, class_id, class_name, department_code,
                subject_id, subject_code, subject_name, session_date, period_number,
                period, time_slot, session_type, topic_taught, remark,
                total_students, present_count, absent_count, attendance_rate, status, attendance_date
            ) VALUES \n{', '.join(vals)};\n\n""")

        # Records in batches of 400
        rec_batch_size = 400
        for i in range(0, len(all_records), rec_batch_size):
            batch = all_records[i:i+rec_batch_size]
            vals = []
            for r in batch:
                sname_escaped = r['student_name'].replace("'", "''")
                is_pres = "TRUE" if r['is_present'] else "FALSE"
                st_id = f"'{r['student_id']}'" if r['student_id'] else "NULL"
                vals.append(f"""(
                    '{r['id']}', '{r['session_id']}', {st_id}, '{r['student_code']}',
                    '{r['roll_no']}', '{sname_escaped}', {is_pres}, '{r['status']}', '{r['remarks']}'
                )""")
            f.write(f"""INSERT INTO public.attendance_records (
                id, session_id, student_id, student_code, roll_no, student_name, is_present, status, remarks
            ) VALUES \n{', '.join(vals)};\n\n""")

        # Aggregates
        for (scode, subcode), (p_cnt, t_cnt) in student_subject_counts.items():
            f.write(f"""UPDATE public.student_attendance_subjects 
                SET present_periods = {p_cnt}, total_periods = {t_cnt}, updated_at = NOW()
                WHERE student_code = '{scode}' AND subject_code = '{subcode}';\n""")

    print(f"Generated {sql_file} with Supabase IDs successfully.")

if __name__ == "__main__":
    run()

