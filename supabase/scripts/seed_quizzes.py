"""
SSGMCE Autonomous College ERP — Assessment & Quiz Seeder
Seeds accredited quiz assessments and question banks into:
1. Supabase Cloud PostgreSQL
2. Local SQLite (backend/erp.db)
"""

import sys
import os
import json
import uuid
from datetime import datetime, timezone, timedelta

# Supabase direct REST or Client
import urllib.request
from backend.config.settings import settings
from backend.config.database import SessionLocal
from sqlalchemy import text

# Target Class IDs from Supabase Cloud:
# 3R: 'f6f20676-7307-415f-8e4b-92bc9f347646'
# 2R1: '51e6fba4-bd51-43ba-8cd1-aef0248c97c8'
# 2R2: 'c63be68c-b5de-4d27-9a95-ad4b42e42d09'
# 4R: '08827e9b-22ac-49f8-a452-ee3c787fb003'

CLASS_3R = "f6f20676-7307-415f-8e4b-92bc9f347646"
CLASS_2R1 = "51e6fba4-bd51-43ba-8cd1-aef0248c97c8"
CLASS_2R2 = "c63be68c-b5de-4d27-9a95-ad4b42e42d09"
CLASS_4R = "08827e9b-22ac-49f8-a452-ee3c787fb003"

now = datetime.now(timezone.utc)
start_time = (now - timedelta(days=1)).isoformat()
end_time = (now + timedelta(days=30)).isoformat()

QUIZZES = [
    {
        "id": "quiz-dbms-midsem-01",
        "teacher_id": "FAC-CSE-101",
        "class_id": CLASS_3R,
        "subject_id": "5CS220PC",
        "subject_name": "Database Management Systems",
        "title": "DBMS Mid-Semester Assessment — Relational Algebra & SQL",
        "description": "Comprehensive mid-semester assessment covering ER models, Relational Algebra, SQL subqueries, Normalization (1NF to BCNF), and ACID transactions.",
        "instructions": "1. Answer all questions within 30 minutes.\n2. Each correct MCQ awards 2 marks.\n3. Question navigation is enabled.\n4. Ensure steady network connectivity.",
        "start_at": start_time,
        "end_at": end_time,
        "duration_minutes": 30,
        "total_marks": 20.0,
        "passing_marks": 8.0,
        "max_attempts": 1,
        "shuffle_questions": False,
        "shuffle_options": False,
        "allow_question_navigation": True,
        "allow_back_navigation": True,
        "show_result_immediately": True,
        "show_correct_answers": True,
        "result_release_mode": "IMMEDIATE",
        "negative_marking": False,
        "negative_marks": 0.0,
        "require_all_questions": False,
        "allow_unanswered": True,
        "status": "ACTIVE",
        "is_published": 1,
        "questions": [
            {
                "id": "q-dbms-01",
                "text": "Which normal form deals with removing Transitive Functional Dependencies (X -> Y and Y -> Z)?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "First Normal Form (1NF)", "is_correct": 0},
                    {"key": "B", "text": "Second Normal Form (2NF)", "is_correct": 0},
                    {"key": "C", "text": "Third Normal Form (3NF)", "is_correct": 1},
                    {"key": "D", "text": "Boyce-Codd Normal Form (BCNF)", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-02",
                "text": "In relational algebra, which operator is represented by the Greek letter Sigma (σ)?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Projection (selecting specific attributes)", "is_correct": 0},
                    {"key": "B", "text": "Selection (filtering rows based on condition)", "is_correct": 1},
                    {"key": "C", "text": "Cartesian Product", "is_correct": 0},
                    {"key": "D", "text": "Natural Join", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-03",
                "text": "Which ACID property guarantees that all database updates within a transaction either succeed completely or are rolled back?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Atomicity", "is_correct": 1},
                    {"key": "B", "text": "Consistency", "is_correct": 0},
                    {"key": "C", "text": "Isolation", "is_correct": 0},
                    {"key": "D", "text": "Durability", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-04",
                "text": "What type of index is created automatically when a PRIMARY KEY constraint is defined on a table in PostgreSQL/MySQL?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Secondary Non-Clustered Index", "is_correct": 0},
                    {"key": "B", "text": "Unique Clustered / B-Tree Index", "is_correct": 1},
                    {"key": "C", "text": "Bitmap Index", "is_correct": 0},
                    {"key": "D", "text": "Full-Text Hash Index", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-05",
                "text": "Which SQL clause is strictly mandatory when using aggregate functions like COUNT() or AVG() filtered by group conditions?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "WHERE", "is_correct": 0},
                    {"key": "B", "text": "ORDER BY", "is_correct": 0},
                    {"key": "C", "text": "HAVING (in conjunction with GROUP BY)", "is_correct": 1},
                    {"key": "D", "text": "DISTINCT", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-06",
                "text": "In the ER model, what is an entity set that does not have sufficient attributes to form a primary key called?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Super Entity", "is_correct": 0},
                    {"key": "B", "text": "Weak Entity Set", "is_correct": 1},
                    {"key": "C", "text": "Associative Entity", "is_correct": 0},
                    {"key": "D", "text": "Recursive Entity", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-07",
                "text": "What lock type permits concurrent transactions to read a data item but prevents any transaction from writing to it?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Exclusive Lock (X-Lock)", "is_correct": 0},
                    {"key": "B", "text": "Shared Lock (S-Lock)", "is_correct": 1},
                    {"key": "C", "text": "Intent Exclusive Lock", "is_correct": 0},
                    {"key": "D", "text": "Update Lock", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-08",
                "text": "In SQL, which constraint enforces that values in a foreign key column must match an existing primary key value in another table?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Entity Integrity", "is_correct": 0},
                    {"key": "B", "text": "Referential Integrity", "is_correct": 1},
                    {"key": "C", "text": "Domain Integrity", "is_correct": 0},
                    {"key": "D", "text": "User-Defined Integrity", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-09",
                "text": "A schedule in which the operations of multiple concurrent transactions are equivalent to some serial order is called:",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Conflict-Serializable Schedule", "is_correct": 1},
                    {"key": "B", "text": "Cascadeless Schedule", "is_correct": 0},
                    {"key": "C", "text": "Strict Schedule", "is_correct": 0},
                    {"key": "D", "text": "Recoverable Schedule", "is_correct": 0}
                ]
            },
            {
                "id": "q-dbms-10",
                "text": "Which NoSQL database category does MongoDB belong to?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Graph Database", "is_correct": 0},
                    {"key": "B", "text": "Column-Family Store", "is_correct": 0},
                    {"key": "C", "text": "Document Store (BSON/JSON)", "is_correct": 1},
                    {"key": "D", "text": "Key-Value Store", "is_correct": 0}
                ]
            }
        ]
    },
    {
        "id": "quiz-os-concurrency-01",
        "teacher_id": "FAC-CSE-102",
        "class_id": CLASS_3R,
        "subject_id": "5CS221PC",
        "subject_name": "Operating Systems",
        "title": "Operating Systems Assessment — Process Synchronization & Memory",
        "description": "Evaluation on CPU scheduling algorithms, Critical Section problem, Semaphores, Deadlock Avoidance, and Virtual Memory Paging.",
        "instructions": "1. 10 Questions, 25 minutes allotted.\n2. Total: 20 marks.\n3. Automatic evaluation on final submission.",
        "start_at": start_time,
        "end_at": end_time,
        "duration_minutes": 25,
        "total_marks": 20.0,
        "passing_marks": 8.0,
        "max_attempts": 1,
        "shuffle_questions": False,
        "shuffle_options": False,
        "allow_question_navigation": True,
        "allow_back_navigation": True,
        "show_result_immediately": True,
        "show_correct_answers": True,
        "result_release_mode": "IMMEDIATE",
        "negative_marking": False,
        "negative_marks": 0.0,
        "require_all_questions": False,
        "allow_unanswered": True,
        "status": "ACTIVE",
        "is_published": 1,
        "questions": [
            {
                "id": "q-os-01",
                "text": "Which condition is NOT one of Coffman's four necessary conditions for a Deadlock to occur?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Mutual Exclusion", "is_correct": 0},
                    {"key": "B", "text": "Hold and Wait", "is_correct": 0},
                    {"key": "C", "text": "Preemption of Resources", "is_correct": 1},
                    {"key": "D", "text": "Circular Wait", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-02",
                "text": "What synchronization tool solves the Critical Section problem using atomic wait() and signal() operations?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Pipe", "is_correct": 0},
                    {"key": "B", "text": "Counting Semaphore", "is_correct": 1},
                    {"key": "C", "text": "Message Queue", "is_correct": 0},
                    {"key": "D", "text": "Socket", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-03",
                "text": "Which CPU scheduling algorithm can cause process Starvation if short bursts continuously arrive?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "First-Come First-Served (FCFS)", "is_correct": 0},
                    {"key": "B", "text": "Round Robin (RR)", "is_correct": 0},
                    {"key": "C", "text": "Shortest Job First (SJF) / SRTF", "is_correct": 1},
                    {"key": "D", "text": "Earliest Deadline First", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-04",
                "text": "In Virtual Memory management, what hardware component translates logical virtual addresses to physical RAM frames?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Memory Management Unit (MMU)", "is_correct": 1},
                    {"key": "B", "text": "Direct Memory Access (DMA) Controller", "is_correct": 0},
                    {"key": "C", "text": "Arithmetic Logic Unit (ALU)", "is_correct": 0},
                    {"key": "D", "text": "Instruction Register", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-05",
                "text": "What phenomenon occurs in FIFO page replacement when allocating more physical frames leads to an INCREASE in page faults?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Thrashing", "is_correct": 0},
                    {"key": "B", "text": "Belady's Anomaly", "is_correct": 1},
                    {"key": "C", "text": "Convoy Effect", "is_correct": 0},
                    {"key": "D", "text": "Aging Effect", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-06",
                "text": "What is the primary role of the Translation Lookaside Buffer (TLB)?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Fast hardware cache for recent virtual-to-physical page mappings", "is_correct": 1},
                    {"key": "B", "text": "Disk swap buffer for dirty pages", "is_correct": 0},
                    {"key": "C", "text": "Kernel stack register", "is_correct": 0},
                    {"key": "D", "text": "Interrupt vector table", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-07",
                "text": "Which algorithm is used for Deadlock Avoidance in systems with multiple instances of each resource type?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Round Robin", "is_correct": 0},
                    {"key": "B", "text": "Banker's Algorithm", "is_correct": 1},
                    {"key": "C", "text": "Dekker's Algorithm", "is_correct": 0},
                    {"key": "D", "text": "Peterson's Algorithm", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-08",
                "text": "What state does a process transition to when it requests an I/O operation?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Ready", "is_correct": 0},
                    {"key": "B", "text": "Running", "is_correct": 0},
                    {"key": "C", "text": "Waiting / Blocked", "is_correct": 1},
                    {"key": "D", "text": "Terminated", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-09",
                "text": "Which page replacement policy replaces the page that has not been used for the longest period of time?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Least Recently Used (LRU)", "is_correct": 1},
                    {"key": "B", "text": "First In First Out (FIFO)", "is_correct": 0},
                    {"key": "C", "text": "Optimal Page Replacement (OPT)", "is_correct": 0},
                    {"key": "D", "text": "Most Frequently Used (MFU)", "is_correct": 0}
                ]
            },
            {
                "id": "q-os-10",
                "text": "When the CPU spends more time paging than executing user processes, the system is said to be:",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Deadlocked", "is_correct": 0},
                    {"key": "B", "text": "Thrashing", "is_correct": 1},
                    {"key": "C", "text": "Preempted", "is_correct": 0},
                    {"key": "D", "text": "Context switching", "is_correct": 0}
                ]
            }
        ]
    },
    {
        "id": "quiz-cn-protocols-01",
        "teacher_id": "FAC-CSE-103",
        "class_id": CLASS_3R,
        "subject_id": "5CS224PC",
        "subject_name": "Computer Networks",
        "title": "Computer Networks Evaluation — OSI & TCP/IP Layer Protocols",
        "description": "Assessment testing understanding of subnetting, IPv4/IPv6 headers, TCP 3-way handshake, Flow Control, and Congestion Avoidance.",
        "instructions": "1. 8 Questions, 20 minutes allotted.\n2. Total: 16 marks.",
        "start_at": start_time,
        "end_at": end_time,
        "duration_minutes": 20,
        "total_marks": 16.0,
        "passing_marks": 6.0,
        "max_attempts": 1,
        "shuffle_questions": False,
        "shuffle_options": False,
        "allow_question_navigation": True,
        "allow_back_navigation": True,
        "show_result_immediately": True,
        "show_correct_answers": True,
        "result_release_mode": "IMMEDIATE",
        "negative_marking": False,
        "negative_marks": 0.0,
        "require_all_questions": False,
        "allow_unanswered": True,
        "status": "ACTIVE",
        "is_published": 1,
        "questions": [
            {
                "id": "q-cn-01",
                "text": "What is the subnet mask for a /26 CIDR prefix in IPv4?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "255.255.255.0", "is_correct": 0},
                    {"key": "B", "text": "255.255.255.128", "is_correct": 0},
                    {"key": "C", "text": "255.255.255.192", "is_correct": 1},
                    {"key": "D", "text": "255.255.255.224", "is_correct": 0}
                ]
            },
            {
                "id": "q-cn-02",
                "text": "Which OSI layer is responsible for end-to-end communication, flow control, and error recovery (e.g. TCP)?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Network Layer", "is_correct": 0},
                    {"key": "B", "text": "Transport Layer", "is_correct": 1},
                    {"key": "C", "text": "Data Link Layer", "is_correct": 0},
                    {"key": "D", "text": "Session Layer", "is_correct": 0}
                ]
            },
            {
                "id": "q-cn-03",
                "text": "In the TCP Three-Way Handshake, which sequence of flags establishes a reliable connection?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "SYN -> SYN-ACK -> ACK", "is_correct": 1},
                    {"key": "B", "text": "ACK -> SYN -> SYN-ACK", "is_correct": 0},
                    {"key": "C", "text": "FIN -> FIN-ACK -> ACK", "is_correct": 0},
                    {"key": "D", "text": "SYN -> ACK -> DATA", "is_correct": 0}
                ]
            },
            {
                "id": "q-cn-04",
                "text": "Which protocol resolves a known IP address to its corresponding physical MAC address on a local Ethernet segment?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "DNS", "is_correct": 0},
                    {"key": "B", "text": "ARP (Address Resolution Protocol)", "is_correct": 1},
                    {"key": "C", "text": "DHCP", "is_correct": 0},
                    {"key": "D", "text": "ICMP", "is_correct": 0}
                ]
            },
            {
                "id": "q-cn-05",
                "text": "What default port number is used by secure HTTPS traffic?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "80", "is_correct": 0},
                    {"key": "B", "text": "8080", "is_correct": 0},
                    {"key": "C", "text": "443", "is_correct": 1},
                    {"key": "D", "text": "22", "is_correct": 0}
                ]
            },
            {
                "id": "q-cn-06",
                "text": "What mechanism does TCP use to prevent a fast sender from overwhelming a slow receiver?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Congestion Window", "is_correct": 0},
                    {"key": "B", "text": "Sliding Window Flow Control (Receive Window)", "is_correct": 1},
                    {"key": "C", "text": "Additive Increase Multiplicative Decrease", "is_correct": 0},
                    {"key": "D", "text": "Fast Retransmit", "is_correct": 0}
                ]
            },
            {
                "id": "q-cn-07",
                "text": "What is the size of an IPv6 address in bits?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "32 bits", "is_correct": 0},
                    {"key": "B", "text": "64 bits", "is_correct": 0},
                    {"key": "C", "text": "128 bits", "is_correct": 1},
                    {"key": "D", "text": "256 bits", "is_correct": 0}
                ]
            },
            {
                "id": "q-cn-08",
                "text": "Which error reporting protocol is used by the ping utility to verify host reachability?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "IGMP", "is_correct": 0},
                    {"key": "B", "text": "ICMP (Internet Control Message Protocol)", "is_correct": 1},
                    {"key": "C", "text": "SNMP", "is_correct": 0},
                    {"key": "D", "text": "BGP", "is_correct": 0}
                ]
            }
        ]
    },
    {
        "id": "quiz-dsa-trees-01",
        "teacher_id": "FAC-CSE-104",
        "class_id": CLASS_2R1,
        "subject_id": "3CS201PC",
        "subject_name": "Data Structures & Algorithms",
        "title": "DSA Fundamental Test — Binary Trees & Graph Traversal",
        "description": "Assessment for Semester III students covering Binary Search Trees, Tree Traversal Orders, and Graph Depth-First / Breadth-First search.",
        "instructions": "1. 10 Questions, 30 minutes allotted.\n2. Total: 20 marks.",
        "start_at": start_time,
        "end_at": end_time,
        "duration_minutes": 30,
        "total_marks": 20.0,
        "passing_marks": 8.0,
        "max_attempts": 1,
        "shuffle_questions": False,
        "shuffle_options": False,
        "allow_question_navigation": True,
        "allow_back_navigation": True,
        "show_result_immediately": True,
        "show_correct_answers": True,
        "result_release_mode": "IMMEDIATE",
        "negative_marking": False,
        "negative_marks": 0.0,
        "require_all_questions": False,
        "allow_unanswered": True,
        "status": "ACTIVE",
        "is_published": 1,
        "questions": [
            {
                "id": "q-dsa-01",
                "text": "Which tree traversal order yields elements of a Binary Search Tree (BST) in sorted ascending order?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Preorder Traversal", "is_correct": 0},
                    {"key": "B", "text": "Inorder Traversal (Left, Root, Right)", "is_correct": 1},
                    {"key": "C", "text": "Postorder Traversal", "is_correct": 0},
                    {"key": "D", "text": "Level Order Traversal", "is_correct": 0}
                ]
            },
            {
                "id": "q-dsa-02",
                "text": "What is the worst-case time complexity of searching in a completely skewed Binary Search Tree?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "O(1)", "is_correct": 0},
                    {"key": "B", "text": "O(log N)", "is_correct": 0},
                    {"key": "C", "text": "O(N)", "is_correct": 1},
                    {"key": "D", "text": "O(N log N)", "is_correct": 0}
                ]
            },
            {
                "id": "q-dsa-03",
                "text": "Which fundamental data structure is utilized to implement Breadth-First Search (BFS) in a graph?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Stack", "is_correct": 0},
                    {"key": "B", "text": "Queue (FIFO)", "is_correct": 1},
                    {"key": "C", "text": "Priority Queue", "is_correct": 0},
                    {"key": "D", "text": "Hash Map", "is_correct": 0}
                ]
            },
            {
                "id": "q-dsa-04",
                "text": "What is the balance factor allowed for any node in an AVL Self-Balancing Tree?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Only 0", "is_correct": 0},
                    {"key": "B", "text": "-1, 0, or +1", "is_correct": 1},
                    {"key": "C", "text": "-2, 0, or +2", "is_correct": 0},
                    {"key": "D", "text": "Any positive integer", "is_correct": 0}
                ]
            },
            {
                "id": "q-dsa-05",
                "text": "Which algorithm is used to find the Single-Source Shortest Path in a weighted graph with non-negative edge weights?",
                "type": "MCQ",
                "marks": 2.0,
                "options": [
                    {"key": "A", "text": "Dijkstra's Algorithm", "is_correct": 1},
                    {"key": "B", "text": "Kruskal's Algorithm", "is_correct": 0},
                    {"key": "C", "text": "Prim's Algorithm", "is_correct": 0},
                    {"key": "D", "text": "Bellman-Ford Algorithm", "is_correct": 0}
                ]
            }
        ]
    }
]

def seed_to_supabase():
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    print("\n--- SEEDING QUIZZES TO SUPABASE CLOUD ---")
    for q in QUIZZES:
        quiz_payload = {
            "id": q["id"],
            "teacher_id": q["teacher_id"],
            "class_id": q["class_id"],
            "subject_id": q["subject_id"],
            "subject_name": q["subject_name"],
            "title": q["title"],
            "description": q["description"],
            "instructions": q["instructions"],
            "start_at": q["start_at"],
            "end_at": q["end_at"],
            "duration_minutes": q["duration_minutes"],
            "total_marks": q["total_marks"],
            "passing_marks": q["passing_marks"],
            "max_attempts": q["max_attempts"],
            "shuffle_questions": q["shuffle_questions"],
            "shuffle_options": q["shuffle_options"],
            "allow_question_navigation": q["allow_question_navigation"],
            "allow_back_navigation": q["allow_back_navigation"],
            "show_result_immediately": q["show_result_immediately"],
            "show_correct_answers": q["show_correct_answers"],
            "result_release_mode": q["result_release_mode"],
            "negative_marking": q["negative_marking"],
            "negative_marks": q["negative_marks"],
            "require_all_questions": q["require_all_questions"],
            "allow_unanswered": q["allow_unanswered"],
            "status": q["status"],
            "is_published": q["is_published"]
        }
        
        req = urllib.request.Request(
            f"{settings.SUPABASE_URL}/rest/v1/quizzes",
            data=json.dumps(quiz_payload).encode("utf-8"),
            headers=headers
        )
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"[Supabase] Quiz inserted: {q['title']}")
        except urllib.error.HTTPError as e:
            print(f"[Supabase ERROR] Quiz {q['id']}: {e.code} - {e.read().decode('utf-8')[:200]}")

        # Seed Questions & Options
        for order, question in enumerate(q["questions"], start=1):
            qbank_payload = {
                "id": question["id"],
                "subject_id": q["subject_id"],
                "question_text": question["text"],
                "question_type": question["type"],
                "marks": question["marks"],
                "negative_marks": 0.0,
                "difficulty": "MEDIUM",
                "created_by": q["teacher_id"]
            }
            req_qb = urllib.request.Request(
                f"{settings.SUPABASE_URL}/rest/v1/question_bank",
                data=json.dumps(qbank_payload).encode("utf-8"),
                headers=headers
            )
            try:
                with urllib.request.urlopen(req_qb) as resp:
                    pass
            except Exception as ex:
                pass

            # Question Options
            for opt in question["options"]:
                opt_payload = {
                    "id": f"{question['id']}-{opt['key']}",
                    "question_id": question["id"],
                    "option_key": opt["key"],
                    "option_text": opt["text"],
                    "is_correct": opt["is_correct"]
                }
                req_opt = urllib.request.Request(
                    f"{settings.SUPABASE_URL}/rest/v1/question_options",
                    data=json.dumps(opt_payload).encode("utf-8"),
                    headers=headers
                )
                try:
                    with urllib.request.urlopen(req_opt) as resp:
                        pass
                except Exception as ex:
                    pass

            # Quiz Questions link
            link_payload = {
                "id": f"link-{q['id']}-{question['id']}",
                "quiz_id": q["id"],
                "question_id": question["id"],
                "question_order": order,
                "marks": question["marks"],
                "negative_marks": 0.0
            }
            req_link = urllib.request.Request(
                f"{settings.SUPABASE_URL}/rest/v1/quiz_questions",
                data=json.dumps(link_payload).encode("utf-8"),
                headers=headers
            )
            try:
                with urllib.request.urlopen(req_link) as resp:
                    pass
            except Exception as ex:
                pass

        # Seed timetable_assessments
        tt_payload = {
            "id": f"quiz-tt-{q['id']}",
            "teacher_id": q["teacher_id"],
            "type": "Quiz",
            "subject": q["subject_name"],
            "title": q["title"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "start_time": "10:00",
            "end_time": "11:00",
            "link": f"student-quiz.html?quiz_id={q['id']}",
            "class_code": "3R" if q["class_id"] == CLASS_3R else "2R1"
        }
        req_tt = urllib.request.Request(
            f"{settings.SUPABASE_URL}/rest/v1/timetable_assessments",
            data=json.dumps(tt_payload).encode("utf-8"),
            headers=headers
        )
        try:
            with urllib.request.urlopen(req_tt) as resp:
                print(f"[Supabase] Timetable assessment added: {tt_payload['title']}")
        except Exception as ex:
            pass

def seed_to_sqlite():
    print("\n--- SEEDING QUIZZES TO LOCAL SQLITE DATABASE ---")
    db = SessionLocal()
    try:
        # Also ensure classes table in SQLite has the 4 classes
        db.execute(text("""
            INSERT OR REPLACE INTO classes (id, class_name, department_id, semester, academic_year)
            VALUES 
                ('f6f20676-7307-415f-8e4b-92bc9f347646', '3R', '945f3faf-8b04-45d8-a274-a96908abb7d9', 5, '2026-27'),
                ('51e6fba4-bd51-43ba-8cd1-aef0248c97c8', '2R1', '945f3faf-8b04-45d8-a274-a96908abb7d9', 3, '2026-27'),
                ('c63be68c-b5de-4d27-9a95-ad4b42e42d09', '2R2', '945f3faf-8b04-45d8-a274-a96908abb7d9', 3, '2026-27'),
                ('08827e9b-22ac-49f8-a452-ee3c787fb003', '4R', '945f3faf-8b04-45d8-a274-a96908abb7d9', 7, '2026-27')
        """))

        for q in QUIZZES:
            # Upsert Quiz
            db.execute(text("""
                INSERT OR REPLACE INTO quizzes (
                    id, teacher_id, class_id, subject_id, subject_name, title, description, instructions,
                    start_at, end_at, duration_minutes, total_marks, passing_marks, max_attempts,
                    shuffle_questions, shuffle_options, allow_question_navigation, allow_back_navigation,
                    show_result_immediately, show_correct_answers, result_release_mode, negative_marking, negative_marks,
                    status, is_published, created_at, updated_at
                ) VALUES (
                    :id, :teacher_id, :class_id, :subject_id, :subject_name, :title, :description, :instructions,
                    :start_at, :end_at, :duration_minutes, :total_marks, :passing_marks, :max_attempts,
                    :shuffle_questions, :shuffle_options, :allow_question_navigation, :allow_back_navigation,
                    :show_result_immediately, :show_correct_answers, :result_release_mode, :negative_marking, :negative_marks,
                    :status, :is_published, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            """), {
                "id": q["id"], "teacher_id": q["teacher_id"], "class_id": q["class_id"],
                "subject_id": q["subject_id"], "subject_name": q["subject_name"], "title": q["title"],
                "description": q["description"], "instructions": q["instructions"],
                "start_at": q["start_at"], "end_at": q["end_at"], "duration_minutes": q["duration_minutes"],
                "total_marks": q["total_marks"], "passing_marks": q["passing_marks"], "max_attempts": q["max_attempts"],
                "shuffle_questions": 1 if q["shuffle_questions"] else 0, "shuffle_options": 1 if q["shuffle_options"] else 0,
                "allow_question_navigation": 1 if q["allow_question_navigation"] else 0,
                "allow_back_navigation": 1 if q["allow_back_navigation"] else 0,
                "show_result_immediately": 1 if q["show_result_immediately"] else 0,
                "show_correct_answers": 1 if q["show_correct_answers"] else 0,
                "result_release_mode": q["result_release_mode"],
                "negative_marking": 1 if q["negative_marking"] else 0,
                "negative_marks": q["negative_marks"],
                "status": q["status"], "is_published": q["is_published"]
            })

            # Upsert Questions and Options
            for order, question in enumerate(q["questions"], start=1):
                db.execute(text("""
                    INSERT OR REPLACE INTO question_bank (
                        id, subject_id, question_text, question_type, marks, negative_marks, difficulty, created_by, created_at
                    ) VALUES (
                        :id, :subject_id, :question_text, :question_type, :marks, 0.0, 'MEDIUM', :created_by, CURRENT_TIMESTAMP
                    )
                """), {
                    "id": question["id"], "subject_id": q["subject_id"], "question_text": question["text"],
                    "question_type": question["type"], "marks": question["marks"], "created_by": q["teacher_id"]
                })

                for opt in question["options"]:
                    db.execute(text("""
                        INSERT OR REPLACE INTO question_options (
                            id, question_id, option_key, option_text, is_correct
                        ) VALUES (
                            :id, :question_id, :option_key, :option_text, :is_correct
                        )
                    """), {
                        "id": f"{question['id']}-{opt['key']}", "question_id": question["id"],
                        "option_key": opt["key"], "option_text": opt["text"], "is_correct": opt["is_correct"]
                    })

                db.execute(text("""
                    INSERT OR REPLACE INTO quiz_questions (
                        id, quiz_id, question_id, question_order, marks, negative_marks, created_at
                    ) VALUES (
                        :id, :quiz_id, :question_id, :question_order, :marks, 0.0, CURRENT_TIMESTAMP
                    )
                """), {
                    "id": f"link-{q['id']}-{question['id']}", "quiz_id": q["id"],
                    "question_id": question["id"], "question_order": order, "marks": question["marks"]
                })

            # Upsert timetable_assessments
            db.execute(text("""
                INSERT OR REPLACE INTO timetable_assessments (
                    id, teacher_id, type, subject, title, date, start_time, end_time, link, class_code, created_at, updated_at
                ) VALUES (
                    :id, :teacher_id, 'Quiz', :subject, :title, :date, :start_time, :end_time, :link, :class_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            """), {
                "id": f"quiz-tt-{q['id']}", "teacher_id": q["teacher_id"],
                "subject": q["subject_name"], "title": q["title"],
                "date": datetime.now().strftime("%Y-%m-%d"),
                "start_time": "10:00", "end_time": "11:00",
                "link": f"student-quiz.html?quiz_id={q['id']}",
                "class_code": "3R" if q["class_id"] == CLASS_3R else "2R1"
            })

            print(f"[SQLite] Quiz inserted: {q['title']} with {len(q['questions'])} questions")

        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed_to_supabase()
    seed_to_sqlite()
    print("\n[SUCCESS] Quiz & assessment seeding completed across Supabase Cloud & SQLite.")

