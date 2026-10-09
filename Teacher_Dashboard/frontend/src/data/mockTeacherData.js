/**
 * mockTeacherData.js
 * Centralized data store for Teacher ERP Dashboard.
 * Faculty-specific timetables, student rosters, leave management, and attendance records.
 */

export const mockTeacherData = {
  activeFacultyId: "EMP-CSE-1001",

  teachers: [
    {
      id: "T-001",
      facultyId: "EMP-CSE-1001",
      empCode: "EMP-CSE-1001",
      name: "Dr. Rohan Deshmukh",
      title: "Assistant Professor",
      department: "Computer Science & Engineering",
      email: "rdeshmukh@ssgmce.ac.in",
      phone: "+91 94228 12345",
      totalLoad: 16
    },
    {
      id: "T-002",
      facultyId: "EMP-CSE-1002",
      empCode: "EMP-CSE-1002",
      name: "Prof. Priya Kulkarni",
      title: "Assistant Professor",
      department: "Computer Science & Engineering",
      email: "pkulkarni@ssgmce.ac.in",
      phone: "+91 98220 54321",
      totalLoad: 16
    },
    {
      id: "T-003",
      facultyId: "EMP-CSE-1003",
      empCode: "EMP-CSE-1003",
      name: "Dr. J. M. Patil",
      title: "Professor & Head of Department",
      department: "Computer Science & Engineering",
      email: "jmpatil@ssgmce.ac.in",
      phone: "+91 94228 98765",
      totalLoad: 14
    }
  ],

  // Faculty Personal Timetable Sessions
  timetable: [
    // Dr. Rohan Deshmukh (EMP-CSE-1001)
    { id: "TT-01", facultyId: "EMP-CSE-1001", day: "Monday", timeSlot: "09:00 - 10:30 AM", slotIndex: 0, subject: "Data Structures", classId: "2R1", room: "Room 201", isLab: false, status: "pending" },
    { id: "TT-02", facultyId: "EMP-CSE-1001", day: "Monday", timeSlot: "11:00 - 12:30 PM", slotIndex: 1, subject: "DS Lab (Batch A)", classId: "2R1", room: "Lab 02", isLab: true, status: "pending" },
    { id: "TT-03", facultyId: "EMP-CSE-1001", day: "Monday", timeSlot: "01:15 - 02:15 PM", slotIndex: 2, subject: "DS Lab (Batch B)", classId: "2R1", room: "Lab 02", isLab: true, status: "pending" },
    { id: "TT-04", facultyId: "EMP-CSE-1001", day: "Tuesday", timeSlot: "09:00 - 10:30 AM", slotIndex: 0, subject: "Data Structures", classId: "2R1", room: "Room 201", isLab: false, status: "pending" },
    { id: "TT-05", facultyId: "EMP-CSE-1001", day: "Tuesday", timeSlot: "11:00 - 12:30 PM", slotIndex: 1, subject: "Discrete Mathematics", classId: "2R1", room: "Room 201", isLab: false, status: "pending" },
    { id: "TT-06", facultyId: "EMP-CSE-1001", day: "Tuesday", timeSlot: "02:15 - 03:15 PM", slotIndex: 3, subject: "OOP with Java", classId: "2R2", room: "Room 305", isLab: false, status: "pending" },
    { id: "TT-07", facultyId: "EMP-CSE-1001", day: "Wednesday", timeSlot: "09:00 - 10:30 AM", slotIndex: 0, subject: "Data Structures", classId: "2R1", room: "Room 201", isLab: false, status: "pending" },
    { id: "TT-08", facultyId: "EMP-CSE-1001", day: "Wednesday", timeSlot: "01:15 - 02:15 PM", slotIndex: 2, subject: "OOP Java Lab (Batch C)", classId: "2R2", room: "Lab 03", isLab: true, status: "pending" },
    { id: "TT-09", facultyId: "EMP-CSE-1001", day: "Thursday", timeSlot: "11:00 - 12:30 PM", slotIndex: 1, subject: "Discrete Mathematics", classId: "2R1", room: "Room 201", isLab: false, status: "pending" },
    { id: "TT-10", facultyId: "EMP-CSE-1001", day: "Thursday", timeSlot: "02:15 - 03:15 PM", slotIndex: 3, subject: "OOP with Java", classId: "2R2", room: "Room 305", isLab: false, status: "pending" },
    { id: "TT-11", facultyId: "EMP-CSE-1001", day: "Friday", timeSlot: "09:00 - 10:30 AM", slotIndex: 0, subject: "Data Structures", classId: "2R1", room: "Room 201", isLab: false, status: "pending" },
    { id: "TT-12", facultyId: "EMP-CSE-1001", day: "Friday", timeSlot: "11:00 - 12:30 PM", slotIndex: 1, subject: "OOP Java Lab (Batch D)", classId: "2R2", room: "Lab 03", isLab: true, status: "pending" },

    // Prof. Priya Kulkarni (EMP-CSE-1002)
    { id: "TT-21", facultyId: "EMP-CSE-1002", day: "Monday", timeSlot: "09:00 - 10:30 AM", slotIndex: 0, subject: "Operating Systems", classId: "3R", room: "Room 102", isLab: false, status: "pending" },
    { id: "TT-22", facultyId: "EMP-CSE-1002", day: "Monday", timeSlot: "11:00 - 12:30 PM", slotIndex: 1, subject: "OS Lab (Batch A)", classId: "3R", room: "Lab 01", isLab: true, status: "pending" },
    { id: "TT-23", facultyId: "EMP-CSE-1002", day: "Wednesday", timeSlot: "09:00 - 10:30 AM", slotIndex: 0, subject: "Operating Systems", classId: "3R", room: "Room 102", isLab: false, status: "pending" },
    { id: "TT-24", facultyId: "EMP-CSE-1002", day: "Friday", timeSlot: "11:00 - 12:30 PM", slotIndex: 1, subject: "Computer Networks", classId: "3R", room: "Room 102", isLab: false, status: "pending" }
  ],

  // Student Roster
  students: {
    "2R1": [
      { id: "st-01", rollNo: 1, rollFormatted: "2R1-01", name: "Aarav Sharma", enrollmentNo: "EN24CSE001", cardId: "CARD-2R1-001", classCode: "2R1" },
      { id: "st-02", rollNo: 2, rollFormatted: "2R1-02", name: "Ananya Patel", enrollmentNo: "EN24CSE002", cardId: "CARD-2R1-002", classCode: "2R1" },
      { id: "st-03", rollNo: 3, rollFormatted: "2R1-03", name: "Aditya Deshmukh", enrollmentNo: "EN24CSE003", cardId: "CARD-2R1-003", classCode: "2R1" },
      { id: "st-04", rollNo: 4, rollFormatted: "2R1-04", name: "Bhavna Joshi", enrollmentNo: "EN24CSE004", cardId: "CARD-2R1-004", classCode: "2R1" },
      { id: "st-05", rollNo: 5, rollFormatted: "2R1-05", name: "Chetan Verma", enrollmentNo: "EN24CSE005", cardId: "CARD-2R1-005", classCode: "2R1" },
      { id: "st-06", rollNo: 6, rollFormatted: "2R1-06", name: "Divya Nair", enrollmentNo: "EN24CSE006", cardId: "CARD-2R1-006", classCode: "2R1" },
      { id: "st-07", rollNo: 7, rollFormatted: "2R1-07", name: "Gaurav Kulkarni", enrollmentNo: "EN24CSE007", cardId: "CARD-2R1-007", classCode: "2R1" },
      { id: "st-08", rollNo: 8, rollFormatted: "2R1-08", name: "Isha Wankhade", enrollmentNo: "EN24CSE008", cardId: "CARD-2R1-008", classCode: "2R1" },
      { id: "st-09", rollNo: 9, rollFormatted: "2R1-09", name: "Karan Johar", enrollmentNo: "EN24CSE009", cardId: "CARD-2R1-009", classCode: "2R1" },
      { id: "st-10", rollNo: 10, rollFormatted: "2R1-10", name: "Meera Sen", enrollmentNo: "EN24CSE010", cardId: "CARD-2R1-010", classCode: "2R1" }
    ],
    "2R2": [
      { id: "st-21", rollNo: 1, rollFormatted: "2R2-01", name: "Nikhil Raut", enrollmentNo: "EN24CSE021", cardId: "CARD-2R2-001", classCode: "2R2" },
      { id: "st-22", rollNo: 2, rollFormatted: "2R2-02", name: "Pooja Hegde", enrollmentNo: "EN24CSE022", cardId: "CARD-2R2-002", classCode: "2R2" },
      { id: "st-23", rollNo: 3, rollFormatted: "2R2-03", name: "Rahul Dravid", enrollmentNo: "EN24CSE023", cardId: "CARD-2R2-003", classCode: "2R2" }
    ],
    "3R": [
      { id: "st-31", rollNo: 1, rollFormatted: "3R-01", name: "Siddharth Roy", enrollmentNo: "EN23CSE001", cardId: "CARD-3R-001", classCode: "3R" },
      { id: "st-32", rollNo: 2, rollFormatted: "3R-02", name: "Tanvi Dixit", enrollmentNo: "EN23CSE002", cardId: "CARD-3R-002", classCode: "3R" }
    ]
  },

  leaves: [
    {
      id: "LEAVE-01",
      facultyId: "EMP-CSE-1002",
      empCode: "EMP-CSE-1002",
      facultyName: "Prof. Priya Kulkarni",
      startDate: "2026-10-14",
      endDate: "2026-10-15",
      status: "Approved",
      reason: "National Research Symposium Presentation"
    }
  ],

  engagements: [],

  markedSessions: {},

  // Centralized Syllabus Tracking Collection (Multi-Subject, Multi-Faculty)
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
            {
              topicId: "T1",
              topicName: "Introduction to Arrays",
              topicDescription: "1D & 2D array representation in memory, row/column major ordering",
              noOfLectures: 2,
              estimatedLectures: 2,
              lecturesTaken: 2,
              weightage: 1,
              weightagePercent: 12,
              status: "Completed"
            },
            {
              topicId: "T2",
              topicName: "Array Operations & Complexities",
              topicDescription: "Insertion, deletion, traversal, searching (linear & binary)",
              noOfLectures: 2,
              estimatedLectures: 2,
              lecturesTaken: 2,
              weightage: 1,
              weightagePercent: 12,
              status: "Completed"
            },
            {
              topicId: "T3",
              topicName: "Sparse Matrices",
              topicDescription: "Triplet representation and fast transpose algorithms",
              noOfLectures: 2,
              estimatedLectures: 2,
              lecturesTaken: 2,
              weightage: 2,
              weightagePercent: 12,
              status: "Completed"
            },
            {
              topicId: "T4",
              topicName: "Stack Concepts & Implementation",
              topicDescription: "LIFO principle, push/pop/peek operations using arrays & pointers",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 3,
              weightage: 1,
              weightagePercent: 12,
              status: "Completed"
            },
            {
              topicId: "T5",
              topicName: "Stack Applications",
              topicDescription: "Infix to postfix/prefix conversion and expression evaluation",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 3,
              weightage: 1,
              weightagePercent: 12,
              status: "Completed"
            }
          ]
        },
        {
          unitId: "U2",
          unitName: "UNIT-II: Linked Lists & Queues",
          estimatedLectures: 14,
          lecturesTaken: 14,
          status: "Completed",
          topics: [
            {
              topicId: "T6",
              topicName: "Singly Linked Lists",
              topicDescription: "Node structure, dynamic allocation, insertion and deletion at ends/middle",
              noOfLectures: 4,
              estimatedLectures: 4,
              lecturesTaken: 4,
              weightage: 1,
              weightagePercent: 14,
              status: "Completed"
            },
            {
              topicId: "T7",
              topicName: "Circular & Doubly Linked Lists",
              topicDescription: "Two-way traversal, header nodes and circular queue using list",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 3,
              weightage: 1,
              weightagePercent: 14,
              status: "Completed"
            },
            {
              topicId: "T8",
              topicName: "Queue Structures & Circular Queues",
              topicDescription: "FIFO principle, linear queue drawback, circular queue wrapping",
              noOfLectures: 4,
              estimatedLectures: 4,
              lecturesTaken: 4,
              weightage: 1,
              weightagePercent: 14,
              status: "Completed"
            },
            {
              topicId: "T9",
              topicName: "Priority Queues & Deque",
              topicDescription: "Double-ended queues, ascending/descending priority queues and applications",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 3,
              weightage: 2,
              weightagePercent: 14,
              status: "Completed"
            }
          ]
        },
        {
          unitId: "U3",
          unitName: "UNIT-III: Non-Linear Structures: Trees & BST",
          estimatedLectures: 14,
          lecturesTaken: 11,
          status: "In Progress",
          topics: [
            {
              topicId: "T10",
              topicName: "Tree Terminology & Binary Trees",
              topicDescription: "Root, leaf, height, depth, strict/complete binary tree properties",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 3,
              weightage: 1,
              weightagePercent: 16,
              status: "Completed"
            },
            {
              topicId: "T11",
              topicName: "Binary Tree Traversals",
              topicDescription: "Inorder, preorder, postorder traversals with recursive & iterative algorithms",
              noOfLectures: 4,
              estimatedLectures: 4,
              lecturesTaken: 4,
              weightage: 2,
              weightagePercent: 16,
              status: "Completed"
            },
            {
              topicId: "T12",
              topicName: "Binary Search Trees (BST)",
              topicDescription: "BST property, insertion, deletion cases and search complexities",
              noOfLectures: 4,
              estimatedLectures: 4,
              lecturesTaken: 4,
              weightage: 2,
              weightagePercent: 16,
              status: "Completed"
            },
            {
              topicId: "T13",
              topicName: "Balanced Trees & AVL Concepts",
              topicDescription: "Balance factor, LL/RR/LR/RL rotations and self-balancing BSTs",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 0,
              weightage: 1,
              weightagePercent: 16,
              status: "Not Started"
            }
          ]
        },
        {
          unitId: "U4",
          unitName: "UNIT-IV: Graph Theory & Algorithms",
          estimatedLectures: 10,
          lecturesTaken: 5,
          status: "In Progress",
          topics: [
            {
              topicId: "T14",
              topicName: "Graph Representations",
              topicDescription: "Adjacency matrix, adjacency list, incidence matrix and space comparisons",
              noOfLectures: 2,
              estimatedLectures: 2,
              lecturesTaken: 2,
              weightage: 1,
              weightagePercent: 18,
              status: "Completed"
            },
            {
              topicId: "T15",
              topicName: "Graph Traversals (BFS & DFS)",
              topicDescription: "Breadth-First and Depth-First Search with visited array and stack/queue",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 3,
              weightage: 1,
              weightagePercent: 18,
              status: "Completed"
            },
            {
              topicId: "T16",
              topicName: "Spanning Trees (Prim & Kruskal)",
              topicDescription: "Minimum cost spanning trees and greedy strategy",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 0,
              weightage: 2,
              weightagePercent: 18,
              status: "Not Started"
            },
            {
              topicId: "T17",
              topicName: "Shortest Path Algorithms",
              topicDescription: "Dijkstra single-source shortest path and Bellman-Ford relaxation",
              noOfLectures: 2,
              estimatedLectures: 2,
              lecturesTaken: 0,
              weightage: 2,
              weightagePercent: 18,
              status: "Not Started"
            }
          ]
        },
        {
          unitId: "U5",
          unitName: "UNIT-V: Searching, Sorting & Hashing",
          estimatedLectures: 10,
          lecturesTaken: 0,
          status: "Not Started",
          topics: [
            {
              topicId: "T18",
              topicName: "Advanced Sorting Techniques",
              topicDescription: "Merge sort, Quick sort, Heap sort with divide-and-conquer recurrences",
              noOfLectures: 4,
              estimatedLectures: 4,
              lecturesTaken: 0,
              weightage: 2,
              weightagePercent: 20,
              status: "Not Started"
            },
            {
              topicId: "T19",
              topicName: "Hashing & Collision Resolution",
              topicDescription: "Hash functions, linear probing, quadratic probing and chaining",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 0,
              weightage: 1,
              weightagePercent: 20,
              status: "Not Started"
            },
            {
              topicId: "T20",
              topicName: "File Structures & B-Trees",
              topicDescription: "Sequential access, indexed sequential files, B-tree search and insertion intro",
              noOfLectures: 3,
              estimatedLectures: 3,
              lecturesTaken: 0,
              weightage: 1,
              weightagePercent: 20,
              status: "Not Started"
            }
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
    },
    {
      facultyId: "EMP-CSE-1002",
      facultyName: "Prof. Priya Kulkarni",
      subjectId: "SUB-OS-3R",
      subjectCode: "CS501",
      subjectName: "Operating Systems",
      classId: "3R",
      totalLecturesPlanned: 55,
      totalLecturesTaken: 32,
      progress: 58,
      units: [
        {
          unitId: "U1",
          unitName: "UNIT-I: OS Architecture & System Calls",
          estimatedLectures: 11,
          lecturesTaken: 11,
          status: "Completed",
          topics: [
            { topicId: "OS-T1", topicName: "OS Functions & Structure", topicDescription: "Monolithic, layered, microkernel architectures and system calls", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 5, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "OS-T2", topicName: "Process Management & PCB", topicDescription: "Process states, context switching, inter-process communication", noOfLectures: 6, estimatedLectures: 6, lecturesTaken: 6, weightage: 2, weightagePercent: 20, status: "Completed" }
          ]
        },
        {
          unitId: "U2",
          unitName: "UNIT-II: CPU Scheduling & Synchronization",
          estimatedLectures: 11,
          lecturesTaken: 11,
          status: "Completed",
          topics: [
            { topicId: "OS-T3", topicName: "Scheduling Algorithms", topicDescription: "FCFS, SJF, Priority, Round Robin, Multilevel feedback queues", noOfLectures: 6, estimatedLectures: 6, lecturesTaken: 6, weightage: 2, weightagePercent: 20, status: "Completed" },
            { topicId: "OS-T4", topicName: "Classical Synchronization Problems", topicDescription: "Critical section, Peterson solution, semaphores and mutex locks", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 5, weightage: 2, weightagePercent: 20, status: "Completed" }
          ]
        },
        {
          unitId: "U3",
          unitName: "UNIT-III: Deadlocks & Handling",
          estimatedLectures: 11,
          lecturesTaken: 10,
          status: "In Progress",
          topics: [
            { topicId: "OS-T5", topicName: "Deadlock Conditions & Prevention", topicDescription: "Mutual exclusion, hold & wait, no preemption, circular wait", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 5, weightage: 1, weightagePercent: 20, status: "Completed" },
            { topicId: "OS-T6", topicName: "Banker's Algorithm & Recovery", topicDescription: "Resource allocation graph, safety check, resource-request algorithm", noOfLectures: 6, estimatedLectures: 6, lecturesTaken: 5, weightage: 2, weightagePercent: 20, status: "In Progress" }
          ]
        },
        {
          unitId: "U4",
          unitName: "UNIT-IV: Memory Management & Virtual Memory",
          estimatedLectures: 11,
          lecturesTaken: 0,
          status: "Not Started",
          topics: [
            { topicId: "OS-T7", topicName: "Paging & Segmentation", topicDescription: "Logical vs physical address space, page table structure, TLB", noOfLectures: 6, estimatedLectures: 6, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" },
            { topicId: "OS-T8", topicName: "Page Replacement Algorithms", topicDescription: "FIFO, LRU, Optimal, Belady anomaly, thrashing", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 0, weightage: 2, weightagePercent: 20, status: "Not Started" }
          ]
        },
        {
          unitId: "U5",
          unitName: "UNIT-V: Storage & File Systems",
          estimatedLectures: 11,
          lecturesTaken: 0,
          status: "Not Started",
          topics: [
            { topicId: "OS-T9", topicName: "Disk Scheduling & File Concepts", topicDescription: "SSTF, SCAN, C-SCAN, LOOK, directory structures and access methods", noOfLectures: 6, estimatedLectures: 6, lecturesTaken: 0, weightage: 1, weightagePercent: 20, status: "Not Started" },
            { topicId: "OS-T10", topicName: "Protection & Security", topicDescription: "Access matrix, authentication, access control lists", noOfLectures: 5, estimatedLectures: 5, lecturesTaken: 0, weightage: 1, weightagePercent: 20, status: "Not Started" }
          ]
        }
      ]
    }
  ]
};

/**
 * Filter timetable strictly by faculty ID
 */
export function getFacultyTimetable(facultyId) {
  const target = String(facultyId || mockTeacherData.activeFacultyId).toUpperCase();
  return mockTeacherData.timetable.filter(
    item => String(item.facultyId).toUpperCase() === target
  );
}

/**
 * Get students for specific class
 */
export function getStudentsByClass(classId = "2R1") {
  return mockTeacherData.students[classId] || mockTeacherData.students["2R1"] || [];
}

/**
 * Check if a class time is in future
 */
export function isClassInFuture(dateISO, timeSlotString) {
  if (!dateISO) return false;
  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];

  if (dateISO > todayISO) return true;
  if (dateISO < todayISO) return false;

  if (!timeSlotString) return false;
  const startPart = timeSlotString.split("-")[0].trim();
  const match = startPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return false;

  let hour = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  let meridiem = match[3] ? match[3].toUpperCase() : null;

  if (!meridiem) {
    if (timeSlotString.toUpperCase().includes("PM")) {
      if (hour >= 1 && hour <= 7) meridiem = "PM";
      else if (hour === 12) meridiem = "PM";
      else meridiem = "AM";
    } else {
      meridiem = "AM";
    }
  }

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const slotStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, 0);
  return now < slotStartDate;
}

/**
 * Check if a session has been marked
 */
export function isSessionMarked(sessionKey) {
  if (mockTeacherData.markedSessions[sessionKey]) return true;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem("ssgmce_marked_sessions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[sessionKey]) return true;
      }
    } catch (_) {}
  }
  return false;
}

/**
 * Submit attendance records
 */
export function submitAttendance(sessionKey, sessionData) {
  mockTeacherData.markedSessions[sessionKey] = sessionData;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("ssgmce_marked_sessions", JSON.stringify(mockTeacherData.markedSessions));
    } catch (_) {}
  }
  return sessionData;
}

/**
 * Load active syllabus collection (with localStorage state persistence)
 */
export function loadSyllabusData() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem("ssgmce_syllabus_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          mockTeacherData.syllabus = parsed;
          return parsed;
        }
      }
    } catch (_) {}
  }
  return mockTeacherData.syllabus;
}

/**
 * Save syllabus state to localStorage
 */
export function saveSyllabusData(syllabusList) {
  mockTeacherData.syllabus = syllabusList;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("ssgmce_syllabus_data", JSON.stringify(syllabusList));
    } catch (_) {}
  }
  return syllabusList;
}

/**
 * Get all subjects taught by a faculty member
 */
export function getSyllabusForFaculty(facultyId = "EMP-CSE-1001") {
  const all = loadSyllabusData();
  const target = String(facultyId || "EMP-CSE-1001").toUpperCase();
  const filtered = all.filter(s => String(s.facultyId).toUpperCase() === target);
  return filtered.length > 0 ? filtered : all.filter(s => s.facultyId === "EMP-CSE-1001");
}

/**
 * Get detailed syllabus for a specific subject
 */
export function getSubjectSyllabus(subjectId) {
  const all = loadSyllabusData();
  return all.find(s => s.subjectId === subjectId) || all[0];
}

/**
 * Recalculate status and totals for a subject
 */
export function recalculateSubjectTotals(subjectObj) {
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

  return subjectObj;
}

/**
 * Mark a topic as covered (increments lecturesTaken and auto-updates status)
 */
export function markTopicCovered(subjectId, unitId, topicId, count = 1) {
  const all = loadSyllabusData();
  const subjectIndex = all.findIndex(s => s.subjectId === subjectId);
  if (subjectIndex === -1) return null;

  const subject = JSON.parse(JSON.stringify(all[subjectIndex]));
  const unit = subject.units.find(u => u.unitId === unitId);
  if (!unit) return null;

  const topic = unit.topics.find(t => t.topicId === topicId);
  if (!topic) return null;

  const planned = Number(topic.noOfLectures || topic.estimatedLectures || 1);
  const current = Number(topic.lecturesTaken || 0);

  // If already at or above planned, still allow +1 or toggle
  const nextTaken = Math.min(planned, current + count);
  topic.lecturesTaken = nextTaken;
  topic.lastCoveredDate = new Date().toISOString().split("T")[0];

  const updatedSubject = recalculateSubjectTotals(subject);
  all[subjectIndex] = updatedSubject;
  saveSyllabusData(all);

  return updatedSubject;
}

/**
 * Undo topic coverage (decrements lecturesTaken or resets topic)
 */
export function undoTopicCovered(subjectId, unitId, topicId, count = 1) {
  const all = loadSyllabusData();
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

  const updatedSubject = recalculateSubjectTotals(subject);
  all[subjectIndex] = updatedSubject;
  saveSyllabusData(all);

  return updatedSubject;
}

