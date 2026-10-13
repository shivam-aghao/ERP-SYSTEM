/**
 * mockTeacherData.js
 * Centralized data store for Teacher ERP Dashboard.
 * Faculty-specific timetables, student rosters, leave management, and attendance records.
 */

export const mockTeacherData = {
  // 1. Basic Profile Data (Minimal Glanceable Faculty Identity)
  profileData: [
    {
      facultyId: "EMP-CSE-1001",
      altFacultyId: "T-001",
      name: "Dr. Rohan Deshmukh",
      designation: "Assistant Professor",
      department: "Computer Science & Engineering",
      email: "rdeshmukh@ssgmce.ac.in",
      phone: "+91 94228 12345",
      dateOfJoining: "2018-07-02",
      profileImageUrl: null,
      profilePhoto: null,
      shortBio: "Assistant Professor in CSE specializing in Data Structures, Distributed Algorithms, and Machine Learning."
    },
    {
      facultyId: "EMP-CSE-1005",
      altFacultyId: "T-005",
      name: "Dr. P. K. Bharne",
      designation: "Associate Professor",
      department: "Computer Science & Engineering",
      email: "pkbharne@ssgmce.ac.in",
      phone: "+91 94228 55555",
      dateOfJoining: "2012-08-16",
      profileImageUrl: null,
      profilePhoto: null,
      shortBio: "Associate Professor in CSE with 14+ years of academic service in Database Systems."
    },
    {
      facultyId: "EMP-CSE-1002",
      altFacultyId: "T-002",
      name: "Prof. Priya Kulkarni",
      designation: "Assistant Professor",
      department: "Computer Science & Engineering",
      email: "pkulkarni@ssgmce.ac.in",
      phone: "+91 98220 54321",
      dateOfJoining: "2019-01-15",
      profileImageUrl: null,
      profilePhoto: null,
      shortBio: "Assistant Professor specializing in Java Programming and Object-Oriented Software Design."
    }
  ],

  // 2. Comprehensive Faculty Portfolio Records (Detailed Information Module)
  facultyInfo: [
    {
      facultyId: "EMP-CSE-1001",
      altFacultyId: "T-001",
      personalDetails: {
        name: "Dr. Rohan Deshmukh",
        facultyId: "EMP-CSE-1001",
        email: "rdeshmukh@ssgmce.ac.in",
        phone: "+91 94228 12345",
        department: "Computer Science & Engineering",
        designation: "Assistant Professor",
        profileImageUrl: null,
        profilePhoto: null,
        bio: "Assistant Professor in Department of CSE with 8+ years of teaching & research experience in Data Structures, Distributed Algorithms, and Machine Learning. Passionate about project-based engineering education and mentoring student innovators."
      },
      education: [
        {
          id: "edu-1",
          degree: "Ph.D. in Computer Science & Engineering",
          specialization: "Distributed Algorithms & Machine Learning",
          university: "Sant Gadge Baba Amravati University",
          yearOfPassing: "2023",
          grade: "Awarded (Distinction)",
          certificateUrl: "/certificates/phd_degree.pdf"
        },
        {
          id: "edu-2",
          degree: "M.Tech in Computer Science & Engineering",
          specialization: "Software Engineering & Data Mining",
          university: "Government College of Engineering, Amravati",
          yearOfPassing: "2017",
          grade: "8.92 CGPA (First Class with Distinction)",
          certificateUrl: "/certificates/mtech_degree.pdf"
        },
        {
          id: "edu-3",
          degree: "B.E. in Information Technology",
          specialization: "Computer Science & Information Technology",
          university: "SSGMCE Shegaon (SGBAU)",
          yearOfPassing: "2014",
          grade: "76.4% (First Class with Distinction)",
          certificateUrl: "/certificates/be_degree.pdf"
        }
      ],
      experience: [
        {
          id: "exp-1",
          organization: "Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
          designation: "Assistant Professor",
          fromDate: "2018-07-02",
          toDate: "Present",
          responsibilities: "Course coordinator for Data Structures & Algorithms, in-charge of Departmental Innovation Cell, accreditation NBA documentation committee member.",
          certificateUrl: "/certificates/experience_ssgmce.pdf"
        },
        {
          id: "exp-2",
          organization: "TCS Innovation Labs, Pune",
          designation: "Associate Systems Engineer",
          fromDate: "2014-08-01",
          toDate: "2015-06-30",
          responsibilities: "Enterprise backend development in Java/Spring Boot and data pipeline automation for global clients.",
          certificateUrl: "/certificates/experience_tcs.pdf"
        }
      ],
      achievements: [
        {
          id: "ach-1",
          title: "Best Faculty Researcher Award 2025",
          awardingBody: "SSGMCE Autonomous Academic Council",
          year: "2025",
          date: "2025-09-05",
          description: "Awarded for exceptional research publication output and highest citation impact in the Department of CSE.",
          proofUrl: "/certificates/best_faculty_2025.pdf"
        },
        {
          id: "ach-2",
          title: "NPTEL Elite + Gold Certification - Data Structures",
          awardingBody: "IIT Madras / NPTEL",
          year: "2024",
          date: "2024-11-20",
          description: "Ranked among top 1% faculty nationwide in Advanced Data Structures with a score of 93%.",
          proofUrl: "/certificates/nptel_gold_2024.pdf"
        }
      ],
      sessionsConducted: [
        {
          id: "cond-1",
          title: "National Hands-on FDP on Advanced Data Structures & Graph Algorithms",
          type: "FDP",
          organizedBy: "SSGMCE in association with IEEE Bombay Section",
          role: "Resource Person & Lead Trainer",
          date: "2026-02-14",
          duration: "5 Days",
          venue: "Seminar Hall 2 & Offline Computing Lab",
          participants: 68,
          description: "Hands-on implementation of non-linear data structures, segment trees, and network flow algorithms with live competitive coding sessions.",
          certificateUrl: "/certificates/fdp_conducted_2026.pdf"
        },
        {
          id: "cond-2",
          title: "Workshop on Problem Solving for Placement Drives",
          type: "Workshop",
          organizedBy: "Department Training & Placement Cell",
          role: "Trainer",
          date: "2025-08-22",
          duration: "2 Days",
          venue: "Central Auditorium",
          participants: 140,
          description: "Fast-track technical preparation for Tier-1 product campus placements covering dynamic programming and trees.",
          certificateUrl: "/certificates/workshop_conducted_2025.pdf"
        }
      ],
      sessionsAttended: [
        {
          id: "att-1",
          title: "AICTE ATAL FDP on Deep Learning and Generative AI",
          type: "FDP",
          organizedBy: "VNIT Nagpur",
          date: "2026-01-08",
          duration: "1 Week",
          certificateUrl: "/certificates/vnit_atal_fdp_2026.pdf"
        },
        {
          id: "att-2",
          title: "International Conference on Advanced Computing & Informatics (ICACI)",
          type: "Conference",
          organizedBy: "IEEE Computer Society",
          date: "2025-10-18",
          duration: "3 Days",
          certificateUrl: "/certificates/icaci_conference_2025.pdf"
        }
      ],
      publications: [
        {
          id: "pub-1",
          title: "Optimized Graph Partitioning in Distributed Memory Architectures",
          journal: "IEEE Transactions on Parallel and Distributed Systems",
          year: "2025",
          date: "2025-06-15",
          doi: "10.1109/TPDS.2025.889214",
          citations: 14,
          proofUrl: "/certificates/ieee_paper_2025.pdf"
        }
      ],
      documents: [
        {
          id: "doc-1",
          name: "Doctoral Degree Certificate - Ph.D.",
          category: "Education",
          uploadedDate: "2026-01-10",
          fileUrl: "/certificates/phd_degree.pdf",
          fileSize: "2.4 MB"
        },
        {
          id: "doc-2",
          name: "Best Faculty Researcher Award Citation",
          category: "Achievement",
          uploadedDate: "2025-09-06",
          fileUrl: "/certificates/best_faculty_2025.pdf",
          fileSize: "1.1 MB"
        },
        {
          id: "doc-3",
          name: "IEEE FDP Conduction Official Certificate",
          category: "Session",
          uploadedDate: "2026-02-15",
          fileUrl: "/certificates/fdp_conducted_2026.pdf",
          fileSize: "1.8 MB"
        },
        {
          id: "doc-4",
          name: "AICTE ATAL FDP Participation Certificate",
          category: "Session",
          uploadedDate: "2026-01-15",
          fileUrl: "/certificates/vnit_atal_fdp_2026.pdf",
          fileSize: "850 KB"
        }
      ]
    },
    {
      facultyId: "EMP-CSE-1005",
      altFacultyId: "T-005",
      personalDetails: {
        name: "Dr. P. K. Bharne",
        facultyId: "EMP-CSE-1005",
        email: "pkbharne@ssgmce.ac.in",
        phone: "+91 94228 55555",
        department: "Computer Science & Engineering",
        designation: "Associate Professor",
        profileImageUrl: null,
        profilePhoto: null,
        bio: "Associate Professor in CSE with 14+ years of academic service. Specializes in Database Engineering, Big Data Systems, and Autonomous Curriculum Design."
      },
      education: [
        {
          id: "edu-b1",
          degree: "Ph.D. in Computer Engineering",
          specialization: "High Performance Data Storage Systems",
          university: "SGBAU Amravati",
          yearOfPassing: "2019",
          grade: "Awarded",
          certificateUrl: "/certificates/phd_bharne.pdf"
        },
        {
          id: "edu-b2",
          degree: "M.E. in Computer Science",
          specialization: "Database Systems",
          university: "SGBAU Amravati",
          yearOfPassing: "2011",
          grade: "Distinction",
          certificateUrl: "/certificates/me_bharne.pdf"
        }
      ],
      experience: [
        {
          id: "exp-b1",
          organization: "SSGMCE Shegaon",
          designation: "Associate Professor",
          fromDate: "2019-09-01",
          toDate: "Present",
          responsibilities: "Senior faculty in Database & Cloud labs, NAAC criteria coordinator.",
          certificateUrl: "/certificates/exp_ssgmce_pkb.pdf"
        }
      ],
      achievements: [
        {
          id: "ach-b1",
          title: "Distinguished Academician Award 2024",
          awardingBody: "Maharashtra Engineering Teachers Forum",
          year: "2024",
          date: "2024-03-12",
          description: "Recognized for exemplary pedagogy in undergraduate database design.",
          proofUrl: "/certificates/dist_academician_2024.pdf"
        }
      ],
      sessionsConducted: [
        {
          id: "cond-b1",
          title: "State Level Hands-on Workshop on PostgreSQL & Autonomous Indexing",
          type: "Workshop",
          organizedBy: "SSGMCE Shegaon",
          role: "Coordinator & Trainer",
          date: "2025-11-10",
          duration: "3 Days",
          venue: "DBMS Lab",
          participants: 80,
          description: "Relational database tuning, query plan analysis, and distributed indexing.",
          certificateUrl: "/certificates/pg_workshop_2025.pdf"
        }
      ],
      sessionsAttended: [
        {
          id: "att-b1",
          title: "Cloud Native Database Summit 2026",
          type: "Seminar",
          organizedBy: "AWS Academic Initiative",
          date: "2026-02-02",
          duration: "2 Days",
          certificateUrl: "/certificates/aws_summit_2026.pdf"
        }
      ],
      publications: [],
      documents: [
        {
          id: "doc-b1",
          name: "Doctoral Degree Certificate - Dr. P. K. Bharne",
          category: "Education",
          uploadedDate: "2024-05-10",
          fileUrl: "/certificates/phd_bharne.pdf",
          fileSize: "2.1 MB"
        }
      ]
    },
    {
      facultyId: "EMP-CSE-1002",
      altFacultyId: "T-002",
      personalDetails: {
        name: "Prof. Priya Kulkarni",
        facultyId: "EMP-CSE-1002",
        email: "pkulkarni@ssgmce.ac.in",
        phone: "+91 98220 54321",
        department: "Computer Science & Engineering",
        designation: "Assistant Professor",
        profileImageUrl: null,
        profilePhoto: null,
        bio: "Assistant Professor specializing in Java Programming, Object-Oriented Software Design, and Mobile Application Architectures."
      },
      education: [
        {
          id: "edu-k1",
          degree: "M.Tech in Software Engineering",
          specialization: "Object-Oriented Design & Microservices",
          university: "Pune University",
          yearOfPassing: "2018",
          grade: "First Class with Distinction",
          certificateUrl: "/certificates/mtech_kulkarni.pdf"
        }
      ],
      experience: [
        {
          id: "exp-k1",
          organization: "SSGMCE Shegaon",
          designation: "Assistant Professor",
          fromDate: "2019-01-15",
          toDate: "Present",
          responsibilities: "Lead instructor for Java Programming & OOP Labs, Student Mentorship cell in-charge.",
          certificateUrl: "/certificates/exp_kulkarni.pdf"
        }
      ],
      achievements: [
        {
          id: "ach-k1",
          title: "Oracle Certified Professional: Java SE 11 Developer",
          awardingBody: "Oracle University",
          year: "2024",
          date: "2024-08-10",
          description: "Global industry certification in core Java concurrency and stream APIs.",
          proofUrl: "/certificates/oracle_cert.pdf"
        }
      ],
      sessionsConducted: [
        {
          id: "cond-k1",
          title: "Bootcamp on Spring Boot & Microservices for 3rd Year Students",
          type: "Training",
          organizedBy: "SSGMCE Department of CSE",
          role: "Resource Person",
          date: "2025-09-18",
          duration: "3 Days",
          venue: "Software Lab 3",
          participants: 95,
          description: "Building production-ready RESTful APIs with Spring Boot, Hibernate, and JWT authentication.",
          certificateUrl: "/certificates/springboot_bootcamp.pdf"
        }
      ],
      sessionsAttended: [
        {
          id: "att-k1",
          title: "National FDP on Enterprise Cloud Architecture",
          type: "FDP",
          organizedBy: "IIT Bombay",
          date: "2025-12-05",
          duration: "5 Days",
          certificateUrl: "/certificates/iitb_fdp.pdf"
        }
      ],
      publications: [],
      documents: [
        {
          id: "doc-k1",
          name: "Oracle Java SE 11 Certificate",
          category: "Achievement",
          uploadedDate: "2024-08-12",
          fileUrl: "/certificates/oracle_cert.pdf",
          fileSize: "1.4 MB"
        }
      ]
    }
  ],

  activeFacultyId: "EMP-CSE-1001",

  teachers: [
    {
      id: "T-005",
      facultyId: "EMP-CSE-1005",
      empCode: "EMP-CSE-1005",
      name: "Dr. P. K. Bharne",
      title: "Assistant Professor",
      department: "Computer Science & Engineering",
      email: "pkbharne@ssgmce.ac.in",
      phone: "+91 94228 55555",
      totalLoad: 16
    },
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
    "facultyId": "EMP-CSE-1001",
    "facultyName": "Dr. Rohan Deshmukh",
    "subjectId": "SUB-DS-2R1",
    "subjectCode": "CS302",
    "subjectName": "Data Structures",
    "classId": "2R1",
    "totalLecturesPlanned": 60,
    "totalLecturesTaken": 42,
    "progress": 70,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: Linear Data Structures & Arrays",
        "estimatedLectures": 12,
        "lecturesTaken": 12,
        "status": "Completed",
        "topics": [
          {
            "topicId": "T1",
            "topicName": "Introduction to Arrays",
            "topicDescription": "1D & 2D array representation in memory, row/column major ordering",
            "noOfLectures": 2,
            "estimatedLectures": 2,
            "lecturesTaken": 2,
            "weightage": 1,
            "weightagePercent": 12,
            "status": "Completed",
            "plannedLectures": 2,
            "engagedLectures": 2,
            "lectures": [
              {
                "id": "LEC-T1-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "1D & 2D array representation in memory",
                  "row/column major ordering"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T1-1",
                "attendanceRecordId": "ATT-T1-1",
                "notes": "Completed classroom delivery of 1D & 2D array representation in memory."
              },
              {
                "id": "LEC-T1-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "row/column major ordering",
                  "1D & 2D array representation in memory"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T1-2",
                "attendanceRecordId": "ATT-T1-2",
                "notes": "Completed classroom delivery of row/column major ordering."
              }
            ]
          },
          {
            "topicId": "T2",
            "topicName": "Array Operations & Complexities",
            "topicDescription": "Insertion, deletion, traversal, searching (linear & binary)",
            "noOfLectures": 2,
            "estimatedLectures": 2,
            "lecturesTaken": 2,
            "weightage": 1,
            "weightagePercent": 12,
            "status": "Completed",
            "plannedLectures": 2,
            "engagedLectures": 2,
            "lectures": [
              {
                "id": "LEC-T2-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Insertion",
                  "deletion"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T2-1",
                "attendanceRecordId": "ATT-T2-1",
                "notes": "Completed classroom delivery of Insertion."
              },
              {
                "id": "LEC-T2-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "deletion",
                  "traversal"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T2-2",
                "attendanceRecordId": "ATT-T2-2",
                "notes": "Completed classroom delivery of deletion."
              }
            ]
          },
          {
            "topicId": "T3",
            "topicName": "Sparse Matrices",
            "topicDescription": "Triplet representation and fast transpose algorithms",
            "noOfLectures": 2,
            "estimatedLectures": 2,
            "lecturesTaken": 2,
            "weightage": 2,
            "weightagePercent": 12,
            "status": "Completed",
            "plannedLectures": 2,
            "engagedLectures": 2,
            "lectures": [
              {
                "id": "LEC-T3-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Triplet representation and fast transpose algorithms"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T3-1",
                "attendanceRecordId": "ATT-T3-1",
                "notes": "Completed classroom delivery of Triplet representation and fast transpose algorithms."
              },
              {
                "id": "LEC-T3-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Triplet representation and fast transpose algorithms"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T3-2",
                "attendanceRecordId": "ATT-T3-2",
                "notes": "Completed classroom delivery of Triplet representation and fast transpose algorithms."
              }
            ]
          },
          {
            "topicId": "T4",
            "topicName": "Stack Concepts & Implementation",
            "topicDescription": "LIFO principle, push/pop/peek operations using arrays & pointers",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 12,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-T4-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "LIFO principle",
                  "push/pop/peek operations using arrays & pointers"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T4-1",
                "attendanceRecordId": "ATT-T4-1",
                "notes": "Completed classroom delivery of LIFO principle."
              },
              {
                "id": "LEC-T4-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "push/pop/peek operations using arrays & pointers",
                  "LIFO principle"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T4-2",
                "attendanceRecordId": "ATT-T4-2",
                "notes": "Completed classroom delivery of push/pop/peek operations using arrays & pointers."
              },
              {
                "id": "LEC-T4-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "LIFO principle",
                  "push/pop/peek operations using arrays & pointers"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T4-3",
                "attendanceRecordId": "ATT-T4-3",
                "notes": "Completed classroom delivery of LIFO principle."
              }
            ]
          },
          {
            "topicId": "T5",
            "topicName": "Stack Applications",
            "topicDescription": "Infix to postfix/prefix conversion and expression evaluation",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 12,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-T5-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Infix to postfix/prefix conversion and expression evaluation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T5-1",
                "attendanceRecordId": "ATT-T5-1",
                "notes": "Completed classroom delivery of Infix to postfix/prefix conversion and expression evaluation."
              },
              {
                "id": "LEC-T5-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Infix to postfix/prefix conversion and expression evaluation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T5-2",
                "attendanceRecordId": "ATT-T5-2",
                "notes": "Completed classroom delivery of Infix to postfix/prefix conversion and expression evaluation."
              },
              {
                "id": "LEC-T5-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Infix to postfix/prefix conversion and expression evaluation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T5-3",
                "attendanceRecordId": "ATT-T5-3",
                "notes": "Completed classroom delivery of Infix to postfix/prefix conversion and expression evaluation."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: Linked Lists & Queues",
        "estimatedLectures": 14,
        "lecturesTaken": 14,
        "status": "Completed",
        "topics": [
          {
            "topicId": "T6",
            "topicName": "Singly Linked Lists",
            "topicDescription": "Node structure, dynamic allocation, insertion and deletion at ends/middle",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 1,
            "weightagePercent": 14,
            "status": "Completed",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "lectures": [
              {
                "id": "LEC-T6-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Node structure",
                  "dynamic allocation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T6-1",
                "attendanceRecordId": "ATT-T6-1",
                "notes": "Completed classroom delivery of Node structure."
              },
              {
                "id": "LEC-T6-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "dynamic allocation",
                  "insertion and deletion at ends/middle"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T6-2",
                "attendanceRecordId": "ATT-T6-2",
                "notes": "Completed classroom delivery of dynamic allocation."
              },
              {
                "id": "LEC-T6-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "insertion and deletion at ends/middle",
                  "Node structure"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T6-3",
                "attendanceRecordId": "ATT-T6-3",
                "notes": "Completed classroom delivery of insertion and deletion at ends/middle."
              },
              {
                "id": "LEC-T6-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Node structure",
                  "dynamic allocation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T6-4",
                "attendanceRecordId": "ATT-T6-4",
                "notes": "Completed classroom delivery of Node structure."
              }
            ]
          },
          {
            "topicId": "T7",
            "topicName": "Circular & Doubly Linked Lists",
            "topicDescription": "Two-way traversal, header nodes and circular queue using list",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 14,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-T7-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Two-way traversal",
                  "header nodes and circular queue using list"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T7-1",
                "attendanceRecordId": "ATT-T7-1",
                "notes": "Completed classroom delivery of Two-way traversal."
              },
              {
                "id": "LEC-T7-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "header nodes and circular queue using list",
                  "Two-way traversal"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T7-2",
                "attendanceRecordId": "ATT-T7-2",
                "notes": "Completed classroom delivery of header nodes and circular queue using list."
              },
              {
                "id": "LEC-T7-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Two-way traversal",
                  "header nodes and circular queue using list"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T7-3",
                "attendanceRecordId": "ATT-T7-3",
                "notes": "Completed classroom delivery of Two-way traversal."
              }
            ]
          },
          {
            "topicId": "T8",
            "topicName": "Queue Structures & Circular Queues",
            "topicDescription": "FIFO principle, linear queue drawback, circular queue wrapping",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 1,
            "weightagePercent": 14,
            "status": "Completed",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "lectures": [
              {
                "id": "LEC-T8-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "FIFO principle",
                  "linear queue drawback"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T8-1",
                "attendanceRecordId": "ATT-T8-1",
                "notes": "Completed classroom delivery of FIFO principle."
              },
              {
                "id": "LEC-T8-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "linear queue drawback",
                  "circular queue wrapping"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T8-2",
                "attendanceRecordId": "ATT-T8-2",
                "notes": "Completed classroom delivery of linear queue drawback."
              },
              {
                "id": "LEC-T8-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "circular queue wrapping",
                  "FIFO principle"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T8-3",
                "attendanceRecordId": "ATT-T8-3",
                "notes": "Completed classroom delivery of circular queue wrapping."
              },
              {
                "id": "LEC-T8-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "FIFO principle",
                  "linear queue drawback"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T8-4",
                "attendanceRecordId": "ATT-T8-4",
                "notes": "Completed classroom delivery of FIFO principle."
              }
            ]
          },
          {
            "topicId": "T9",
            "topicName": "Priority Queues & Deque",
            "topicDescription": "Double-ended queues, ascending/descending priority queues and applications",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 14,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-T9-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Double-ended queues",
                  "ascending/descending priority queues and applications"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T9-1",
                "attendanceRecordId": "ATT-T9-1",
                "notes": "Completed classroom delivery of Double-ended queues."
              },
              {
                "id": "LEC-T9-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "ascending/descending priority queues and applications",
                  "Double-ended queues"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T9-2",
                "attendanceRecordId": "ATT-T9-2",
                "notes": "Completed classroom delivery of ascending/descending priority queues and applications."
              },
              {
                "id": "LEC-T9-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Double-ended queues",
                  "ascending/descending priority queues and applications"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T9-3",
                "attendanceRecordId": "ATT-T9-3",
                "notes": "Completed classroom delivery of Double-ended queues."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: Non-Linear Structures: Trees & BST",
        "estimatedLectures": 14,
        "lecturesTaken": 11,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "T10",
            "topicName": "Tree Terminology & Binary Trees",
            "topicDescription": "Root, leaf, height, depth, strict/complete binary tree properties",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 16,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-T10-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Root",
                  "leaf"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T10-1",
                "attendanceRecordId": "ATT-T10-1",
                "notes": "Completed classroom delivery of Root."
              },
              {
                "id": "LEC-T10-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "leaf",
                  "height"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T10-2",
                "attendanceRecordId": "ATT-T10-2",
                "notes": "Completed classroom delivery of leaf."
              },
              {
                "id": "LEC-T10-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "height",
                  "depth"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T10-3",
                "attendanceRecordId": "ATT-T10-3",
                "notes": "Completed classroom delivery of height."
              }
            ]
          },
          {
            "topicId": "T11",
            "topicName": "Binary Tree Traversals",
            "topicDescription": "Inorder, preorder, postorder traversals with recursive & iterative algorithms",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 16,
            "status": "Completed",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "lectures": [
              {
                "id": "LEC-T11-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Inorder",
                  "preorder"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T11-1",
                "attendanceRecordId": "ATT-T11-1",
                "notes": "Completed classroom delivery of Inorder."
              },
              {
                "id": "LEC-T11-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "preorder",
                  "postorder traversals with recursive & iterative algorithms"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T11-2",
                "attendanceRecordId": "ATT-T11-2",
                "notes": "Completed classroom delivery of preorder."
              },
              {
                "id": "LEC-T11-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "postorder traversals with recursive & iterative algorithms",
                  "Inorder"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T11-3",
                "attendanceRecordId": "ATT-T11-3",
                "notes": "Completed classroom delivery of postorder traversals with recursive & iterative algorithms."
              },
              {
                "id": "LEC-T11-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Inorder",
                  "preorder"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T11-4",
                "attendanceRecordId": "ATT-T11-4",
                "notes": "Completed classroom delivery of Inorder."
              }
            ]
          },
          {
            "topicId": "T12",
            "topicName": "Binary Search Trees (BST)",
            "topicDescription": "BST property, insertion, deletion cases and search complexities",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 16,
            "status": "Completed",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "lectures": [
              {
                "id": "LEC-T12-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "BST property",
                  "insertion"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T12-1",
                "attendanceRecordId": "ATT-T12-1",
                "notes": "Completed classroom delivery of BST property."
              },
              {
                "id": "LEC-T12-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "insertion",
                  "deletion cases and search complexities"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T12-2",
                "attendanceRecordId": "ATT-T12-2",
                "notes": "Completed classroom delivery of insertion."
              },
              {
                "id": "LEC-T12-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "deletion cases and search complexities",
                  "BST property"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T12-3",
                "attendanceRecordId": "ATT-T12-3",
                "notes": "Completed classroom delivery of deletion cases and search complexities."
              },
              {
                "id": "LEC-T12-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "BST property",
                  "insertion"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T12-4",
                "attendanceRecordId": "ATT-T12-4",
                "notes": "Completed classroom delivery of BST property."
              }
            ]
          },
          {
            "topicId": "T13",
            "topicName": "Balanced Trees & AVL Concepts",
            "topicDescription": "Balance factor, LL/RR/LR/RL rotations and self-balancing BSTs",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 16,
            "status": "Not Started",
            "plannedLectures": 3,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 79
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: Graph Theory & Algorithms",
        "estimatedLectures": 10,
        "lecturesTaken": 5,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "T14",
            "topicName": "Graph Representations",
            "topicDescription": "Adjacency matrix, adjacency list, incidence matrix and space comparisons",
            "noOfLectures": 2,
            "estimatedLectures": 2,
            "lecturesTaken": 2,
            "weightage": 1,
            "weightagePercent": 18,
            "status": "Completed",
            "plannedLectures": 2,
            "engagedLectures": 2,
            "lectures": [
              {
                "id": "LEC-T14-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Adjacency matrix",
                  "adjacency list"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T14-1",
                "attendanceRecordId": "ATT-T14-1",
                "notes": "Completed classroom delivery of Adjacency matrix."
              },
              {
                "id": "LEC-T14-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "adjacency list",
                  "incidence matrix and space comparisons"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T14-2",
                "attendanceRecordId": "ATT-T14-2",
                "notes": "Completed classroom delivery of adjacency list."
              }
            ]
          },
          {
            "topicId": "T15",
            "topicName": "Graph Traversals (BFS & DFS)",
            "topicDescription": "Breadth-First and Depth-First Search with visited array and stack/queue",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 18,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-T15-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Breadth-First and Depth-First Search with visited array and stack/queue"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T15-1",
                "attendanceRecordId": "ATT-T15-1",
                "notes": "Completed classroom delivery of Breadth-First and Depth-First Search with visited array and stack/queue."
              },
              {
                "id": "LEC-T15-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Breadth-First and Depth-First Search with visited array and stack/queue"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T15-2",
                "attendanceRecordId": "ATT-T15-2",
                "notes": "Completed classroom delivery of Breadth-First and Depth-First Search with visited array and stack/queue."
              },
              {
                "id": "LEC-T15-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Breadth-First and Depth-First Search with visited array and stack/queue"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-T15-3",
                "attendanceRecordId": "ATT-T15-3",
                "notes": "Completed classroom delivery of Breadth-First and Depth-First Search with visited array and stack/queue."
              }
            ]
          },
          {
            "topicId": "T16",
            "topicName": "Spanning Trees (Prim & Kruskal)",
            "topicDescription": "Minimum cost spanning trees and greedy strategy",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 18,
            "status": "Not Started",
            "plannedLectures": 3,
            "engagedLectures": 0,
            "lectures": []
          },
          {
            "topicId": "T17",
            "topicName": "Shortest Path Algorithms",
            "topicDescription": "Dijkstra single-source shortest path and Bellman-Ford relaxation",
            "noOfLectures": 2,
            "estimatedLectures": 2,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 18,
            "status": "Not Started",
            "plannedLectures": 2,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 50
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: Searching, Sorting & Hashing",
        "estimatedLectures": 10,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "T18",
            "topicName": "Advanced Sorting Techniques",
            "topicDescription": "Merge sort, Quick sort, Heap sort with divide-and-conquer recurrences",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "lectures": []
          },
          {
            "topicId": "T19",
            "topicName": "Hashing & Collision Resolution",
            "topicDescription": "Hash functions, linear probing, quadratic probing and chaining",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 3,
            "engagedLectures": 0,
            "lectures": []
          },
          {
            "topicId": "T20",
            "topicName": "File Structures & B-Trees",
            "topicDescription": "Sequential access, indexed sequential files, B-tree search and insertion intro",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 3,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 70
  },
  {
    "facultyId": "EMP-CSE-1001",
    "facultyName": "Dr. Rohan Deshmukh",
    "subjectId": "SUB-DM-2R1",
    "subjectCode": "CS301",
    "subjectName": "Discrete Mathematics",
    "classId": "2R1",
    "totalLecturesPlanned": 45,
    "totalLecturesTaken": 28,
    "progress": 62,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: Mathematical Logic & Proofs",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "DM-T1",
            "topicName": "Propositions & Truth Tables",
            "topicDescription": "Compound propositions, logical connectives, tautology and contradiction",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T1-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Compound propositions",
                  "logical connectives"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T1-1",
                "attendanceRecordId": "ATT-DM-T1-1",
                "notes": "Completed classroom delivery of Compound propositions."
              },
              {
                "id": "LEC-DM-T1-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "logical connectives",
                  "tautology and contradiction"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T1-2",
                "attendanceRecordId": "ATT-DM-T1-2",
                "notes": "Completed classroom delivery of logical connectives."
              },
              {
                "id": "LEC-DM-T1-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "tautology and contradiction",
                  "Compound propositions"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T1-3",
                "attendanceRecordId": "ATT-DM-T1-3",
                "notes": "Completed classroom delivery of tautology and contradiction."
              }
            ]
          },
          {
            "topicId": "DM-T2",
            "topicName": "Predicates & Quantifiers",
            "topicDescription": "Universal and existential quantification, nested quantifiers",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T2-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Universal and existential quantification",
                  "nested quantifiers"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T2-1",
                "attendanceRecordId": "ATT-DM-T2-1",
                "notes": "Completed classroom delivery of Universal and existential quantification."
              },
              {
                "id": "LEC-DM-T2-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "nested quantifiers",
                  "Universal and existential quantification"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T2-2",
                "attendanceRecordId": "ATT-DM-T2-2",
                "notes": "Completed classroom delivery of nested quantifiers."
              },
              {
                "id": "LEC-DM-T2-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Universal and existential quantification",
                  "nested quantifiers"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T2-3",
                "attendanceRecordId": "ATT-DM-T2-3",
                "notes": "Completed classroom delivery of Universal and existential quantification."
              }
            ]
          },
          {
            "topicId": "DM-T3",
            "topicName": "Methods of Proof",
            "topicDescription": "Direct proof, proof by contradiction, mathematical induction",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T3-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Direct proof",
                  "proof by contradiction"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T3-1",
                "attendanceRecordId": "ATT-DM-T3-1",
                "notes": "Completed classroom delivery of Direct proof."
              },
              {
                "id": "LEC-DM-T3-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "proof by contradiction",
                  "mathematical induction"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T3-2",
                "attendanceRecordId": "ATT-DM-T3-2",
                "notes": "Completed classroom delivery of proof by contradiction."
              },
              {
                "id": "LEC-DM-T3-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "mathematical induction",
                  "Direct proof"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T3-3",
                "attendanceRecordId": "ATT-DM-T3-3",
                "notes": "Completed classroom delivery of mathematical induction."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: Set Theory & Relations",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "DM-T4",
            "topicName": "Sets, Subsets & Power Sets",
            "topicDescription": "Set operations, Venn diagrams, principle of inclusion-exclusion",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T4-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Set operations",
                  "Venn diagrams"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T4-1",
                "attendanceRecordId": "ATT-DM-T4-1",
                "notes": "Completed classroom delivery of Set operations."
              },
              {
                "id": "LEC-DM-T4-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Venn diagrams",
                  "principle of inclusion-exclusion"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T4-2",
                "attendanceRecordId": "ATT-DM-T4-2",
                "notes": "Completed classroom delivery of Venn diagrams."
              },
              {
                "id": "LEC-DM-T4-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "principle of inclusion-exclusion",
                  "Set operations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T4-3",
                "attendanceRecordId": "ATT-DM-T4-3",
                "notes": "Completed classroom delivery of principle of inclusion-exclusion."
              }
            ]
          },
          {
            "topicId": "DM-T5",
            "topicName": "Relations & Properties",
            "topicDescription": "Reflexive, symmetric, transitive relations, equivalence relations",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T5-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Reflexive",
                  "symmetric"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T5-1",
                "attendanceRecordId": "ATT-DM-T5-1",
                "notes": "Completed classroom delivery of Reflexive."
              },
              {
                "id": "LEC-DM-T5-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "symmetric",
                  "transitive relations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T5-2",
                "attendanceRecordId": "ATT-DM-T5-2",
                "notes": "Completed classroom delivery of symmetric."
              },
              {
                "id": "LEC-DM-T5-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "transitive relations",
                  "equivalence relations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T5-3",
                "attendanceRecordId": "ATT-DM-T5-3",
                "notes": "Completed classroom delivery of transitive relations."
              }
            ]
          },
          {
            "topicId": "DM-T6",
            "topicName": "Partitions & Partial Orders",
            "topicDescription": "Posets, Hasse diagrams, lattices and extremal elements",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T6-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Posets",
                  "Hasse diagrams"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T6-1",
                "attendanceRecordId": "ATT-DM-T6-1",
                "notes": "Completed classroom delivery of Posets."
              },
              {
                "id": "LEC-DM-T6-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Hasse diagrams",
                  "lattices and extremal elements"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T6-2",
                "attendanceRecordId": "ATT-DM-T6-2",
                "notes": "Completed classroom delivery of Hasse diagrams."
              },
              {
                "id": "LEC-DM-T6-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "lattices and extremal elements",
                  "Posets"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T6-3",
                "attendanceRecordId": "ATT-DM-T6-3",
                "notes": "Completed classroom delivery of lattices and extremal elements."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: Combinatorics & Recurrences",
        "estimatedLectures": 9,
        "lecturesTaken": 6,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "DM-T7",
            "topicName": "Permutations & Combinations",
            "topicDescription": "Counting principles, binomial theorem and coefficients",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T7-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Counting principles",
                  "binomial theorem and coefficients"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T7-1",
                "attendanceRecordId": "ATT-DM-T7-1",
                "notes": "Completed classroom delivery of Counting principles."
              },
              {
                "id": "LEC-DM-T7-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "binomial theorem and coefficients",
                  "Counting principles"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T7-2",
                "attendanceRecordId": "ATT-DM-T7-2",
                "notes": "Completed classroom delivery of binomial theorem and coefficients."
              },
              {
                "id": "LEC-DM-T7-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Counting principles",
                  "binomial theorem and coefficients"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T7-3",
                "attendanceRecordId": "ATT-DM-T7-3",
                "notes": "Completed classroom delivery of Counting principles."
              }
            ]
          },
          {
            "topicId": "DM-T8",
            "topicName": "Pigeonhole Principle",
            "topicDescription": "Generalized pigeonhole principle with applications",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "lectures": [
              {
                "id": "LEC-DM-T8-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Generalized pigeonhole principle with applications"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T8-1",
                "attendanceRecordId": "ATT-DM-T8-1",
                "notes": "Completed classroom delivery of Generalized pigeonhole principle with applications."
              },
              {
                "id": "LEC-DM-T8-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Generalized pigeonhole principle with applications"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T8-2",
                "attendanceRecordId": "ATT-DM-T8-2",
                "notes": "Completed classroom delivery of Generalized pigeonhole principle with applications."
              },
              {
                "id": "LEC-DM-T8-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Generalized pigeonhole principle with applications"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T8-3",
                "attendanceRecordId": "ATT-DM-T8-3",
                "notes": "Completed classroom delivery of Generalized pigeonhole principle with applications."
              }
            ]
          },
          {
            "topicId": "DM-T9",
            "topicName": "Recurrence Relations",
            "topicDescription": "Linear homogeneous recurrences with constant coefficients",
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 3,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 67
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: Algebraic Structures",
        "estimatedLectures": 9,
        "lecturesTaken": 4,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "DM-T10",
            "topicName": "Groups & Semigroups",
            "topicDescription": "Binary operations, monoids, subgroups, cyclic groups",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "In Progress",
            "plannedLectures": 5,
            "engagedLectures": 4,
            "lectures": [
              {
                "id": "LEC-DM-T10-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Binary operations",
                  "monoids"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T10-1",
                "attendanceRecordId": "ATT-DM-T10-1",
                "notes": "Completed classroom delivery of Binary operations."
              },
              {
                "id": "LEC-DM-T10-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "monoids",
                  "subgroups"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T10-2",
                "attendanceRecordId": "ATT-DM-T10-2",
                "notes": "Completed classroom delivery of monoids."
              },
              {
                "id": "LEC-DM-T10-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "subgroups",
                  "cyclic groups"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DM-T10-3",
                "attendanceRecordId": "ATT-DM-T10-3",
                "notes": "Completed classroom delivery of subgroups."
              },
              {
                "id": "LEC-DM-T10-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "cyclic groups",
                  "Binary operations"
                ],
                "attendanceStatus": "Not Marked",
                "attendanceMarked": false,
                "attendanceId": null,
                "attendanceRecordId": null,
                "notes": ""
              }
            ]
          },
          {
            "topicId": "DM-T11",
            "topicName": "Rings & Fields Intro",
            "topicDescription": "Ring definitions, integral domains and field axioms",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 44
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: Graph Theory & Boolean Algebra",
        "estimatedLectures": 9,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "DM-T12",
            "topicName": "Eulerian & Hamiltonian Graphs",
            "topicDescription": "Cycles, paths, planar graphs, Kuratowski theorem",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "lectures": []
          },
          {
            "topicId": "DM-T13",
            "topicName": "Boolean Algebra & Gates",
            "topicDescription": "Boolean expressions, Karnaugh maps, logic circuit minimization",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 62
  },
  {
    "facultyId": "EMP-CSE-1001",
    "facultyName": "Dr. Rohan Deshmukh",
    "subjectId": "SUB-JAVA-2R2",
    "subjectCode": "CS304",
    "subjectName": "OOP with Java",
    "classId": "2R2",
    "totalLecturesPlanned": 50,
    "totalLecturesTaken": 35,
    "progress": 70,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: Java Language Essentials",
        "estimatedLectures": 10,
        "lecturesTaken": 10,
        "status": "Completed",
        "topics": [
          {
            "topicId": "JV-T1",
            "topicName": "JVM Architecture & Bytecode",
            "topicDescription": "JDK, JRE, JVM, garbage collection, data types and operators",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "lectures": [
              {
                "id": "LEC-JV-T1-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "JDK",
                  "JRE"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T1-1",
                "attendanceRecordId": "ATT-JV-T1-1",
                "notes": "Completed classroom delivery of JDK."
              },
              {
                "id": "LEC-JV-T1-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "JRE",
                  "JVM"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T1-2",
                "attendanceRecordId": "ATT-JV-T1-2",
                "notes": "Completed classroom delivery of JRE."
              },
              {
                "id": "LEC-JV-T1-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "JVM",
                  "garbage collection"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T1-3",
                "attendanceRecordId": "ATT-JV-T1-3",
                "notes": "Completed classroom delivery of JVM."
              },
              {
                "id": "LEC-JV-T1-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "garbage collection",
                  "data types and operators"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T1-4",
                "attendanceRecordId": "ATT-JV-T1-4",
                "notes": "Completed classroom delivery of garbage collection."
              }
            ]
          },
          {
            "topicId": "JV-T2",
            "topicName": "Classes, Objects & Constructors",
            "topicDescription": "Encapsulation, constructor overloading, this keyword",
            "noOfLectures": 6,
            "estimatedLectures": 6,
            "lecturesTaken": 6,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 6,
            "engagedLectures": 6,
            "lectures": [
              {
                "id": "LEC-JV-T2-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Encapsulation",
                  "constructor overloading"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T2-1",
                "attendanceRecordId": "ATT-JV-T2-1",
                "notes": "Completed classroom delivery of Encapsulation."
              },
              {
                "id": "LEC-JV-T2-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "constructor overloading",
                  "this keyword"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T2-2",
                "attendanceRecordId": "ATT-JV-T2-2",
                "notes": "Completed classroom delivery of constructor overloading."
              },
              {
                "id": "LEC-JV-T2-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "this keyword",
                  "Encapsulation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T2-3",
                "attendanceRecordId": "ATT-JV-T2-3",
                "notes": "Completed classroom delivery of this keyword."
              },
              {
                "id": "LEC-JV-T2-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Encapsulation",
                  "constructor overloading"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T2-4",
                "attendanceRecordId": "ATT-JV-T2-4",
                "notes": "Completed classroom delivery of Encapsulation."
              },
              {
                "id": "LEC-JV-T2-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "constructor overloading",
                  "this keyword"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T2-5",
                "attendanceRecordId": "ATT-JV-T2-5",
                "notes": "Completed classroom delivery of constructor overloading."
              },
              {
                "id": "LEC-JV-T2-6",
                "lectureNo": 6,
                "date": "2026-10-13",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "this keyword",
                  "Encapsulation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T2-6",
                "attendanceRecordId": "ATT-JV-T2-6",
                "notes": "Completed classroom delivery of this keyword."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: Inheritance & Polymorphism",
        "estimatedLectures": 10,
        "lecturesTaken": 10,
        "status": "Completed",
        "topics": [
          {
            "topicId": "JV-T3",
            "topicName": "Inheritance Types & Super",
            "topicDescription": "Single, multilevel, hierarchical inheritance and super keyword",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "lectures": [
              {
                "id": "LEC-JV-T3-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Single",
                  "multilevel"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T3-1",
                "attendanceRecordId": "ATT-JV-T3-1",
                "notes": "Completed classroom delivery of Single."
              },
              {
                "id": "LEC-JV-T3-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "multilevel",
                  "hierarchical inheritance and super keyword"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T3-2",
                "attendanceRecordId": "ATT-JV-T3-2",
                "notes": "Completed classroom delivery of multilevel."
              },
              {
                "id": "LEC-JV-T3-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "hierarchical inheritance and super keyword",
                  "Single"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T3-3",
                "attendanceRecordId": "ATT-JV-T3-3",
                "notes": "Completed classroom delivery of hierarchical inheritance and super keyword."
              },
              {
                "id": "LEC-JV-T3-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Single",
                  "multilevel"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T3-4",
                "attendanceRecordId": "ATT-JV-T3-4",
                "notes": "Completed classroom delivery of Single."
              },
              {
                "id": "LEC-JV-T3-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "multilevel",
                  "hierarchical inheritance and super keyword"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T3-5",
                "attendanceRecordId": "ATT-JV-T3-5",
                "notes": "Completed classroom delivery of multilevel."
              }
            ]
          },
          {
            "topicId": "JV-T4",
            "topicName": "Abstract Classes & Interfaces",
            "topicDescription": "Dynamic method dispatch, interface implementation, default methods",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "lectures": [
              {
                "id": "LEC-JV-T4-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Dynamic method dispatch",
                  "interface implementation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T4-1",
                "attendanceRecordId": "ATT-JV-T4-1",
                "notes": "Completed classroom delivery of Dynamic method dispatch."
              },
              {
                "id": "LEC-JV-T4-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "interface implementation",
                  "default methods"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T4-2",
                "attendanceRecordId": "ATT-JV-T4-2",
                "notes": "Completed classroom delivery of interface implementation."
              },
              {
                "id": "LEC-JV-T4-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "default methods",
                  "Dynamic method dispatch"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T4-3",
                "attendanceRecordId": "ATT-JV-T4-3",
                "notes": "Completed classroom delivery of default methods."
              },
              {
                "id": "LEC-JV-T4-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Dynamic method dispatch",
                  "interface implementation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T4-4",
                "attendanceRecordId": "ATT-JV-T4-4",
                "notes": "Completed classroom delivery of Dynamic method dispatch."
              },
              {
                "id": "LEC-JV-T4-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "interface implementation",
                  "default methods"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T4-5",
                "attendanceRecordId": "ATT-JV-T4-5",
                "notes": "Completed classroom delivery of interface implementation."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: Exceptions & Multithreading",
        "estimatedLectures": 10,
        "lecturesTaken": 9,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "JV-T5",
            "topicName": "Exception Hierarchy & Handling",
            "topicDescription": "Try, catch, finally, throw, throws, custom exception classes",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "lectures": [
              {
                "id": "LEC-JV-T5-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Try",
                  "catch"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T5-1",
                "attendanceRecordId": "ATT-JV-T5-1",
                "notes": "Completed classroom delivery of Try."
              },
              {
                "id": "LEC-JV-T5-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "catch",
                  "finally"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T5-2",
                "attendanceRecordId": "ATT-JV-T5-2",
                "notes": "Completed classroom delivery of catch."
              },
              {
                "id": "LEC-JV-T5-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "finally",
                  "throw"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T5-3",
                "attendanceRecordId": "ATT-JV-T5-3",
                "notes": "Completed classroom delivery of finally."
              },
              {
                "id": "LEC-JV-T5-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "throw",
                  "throws"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T5-4",
                "attendanceRecordId": "ATT-JV-T5-4",
                "notes": "Completed classroom delivery of throw."
              },
              {
                "id": "LEC-JV-T5-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "throws",
                  "custom exception classes"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T5-5",
                "attendanceRecordId": "ATT-JV-T5-5",
                "notes": "Completed classroom delivery of throws."
              }
            ]
          },
          {
            "topicId": "JV-T6",
            "topicName": "Thread Lifecycle & Synchronization",
            "topicDescription": "Runnable interface, Thread class, synchronized blocks and deadlocks",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "In Progress",
            "plannedLectures": 5,
            "engagedLectures": 4,
            "lectures": [
              {
                "id": "LEC-JV-T6-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Runnable interface",
                  "Thread class"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T6-1",
                "attendanceRecordId": "ATT-JV-T6-1",
                "notes": "Completed classroom delivery of Runnable interface."
              },
              {
                "id": "LEC-JV-T6-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Thread class",
                  "synchronized blocks and deadlocks"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T6-2",
                "attendanceRecordId": "ATT-JV-T6-2",
                "notes": "Completed classroom delivery of Thread class."
              },
              {
                "id": "LEC-JV-T6-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "synchronized blocks and deadlocks",
                  "Runnable interface"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T6-3",
                "attendanceRecordId": "ATT-JV-T6-3",
                "notes": "Completed classroom delivery of synchronized blocks and deadlocks."
              },
              {
                "id": "LEC-JV-T6-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Runnable interface",
                  "Thread class"
                ],
                "attendanceStatus": "Not Marked",
                "attendanceMarked": false,
                "attendanceId": null,
                "attendanceRecordId": null,
                "notes": ""
              }
            ]
          }
        ],
        "progress": 90
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: Java Collections Framework",
        "estimatedLectures": 10,
        "lecturesTaken": 6,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "JV-T7",
            "topicName": "List, Set & Map Interfaces",
            "topicDescription": "ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap",
            "noOfLectures": 6,
            "estimatedLectures": 6,
            "lecturesTaken": 6,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 6,
            "engagedLectures": 6,
            "lectures": [
              {
                "id": "LEC-JV-T7-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "ArrayList",
                  "LinkedList"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T7-1",
                "attendanceRecordId": "ATT-JV-T7-1",
                "notes": "Completed classroom delivery of ArrayList."
              },
              {
                "id": "LEC-JV-T7-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "LinkedList",
                  "HashSet"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T7-2",
                "attendanceRecordId": "ATT-JV-T7-2",
                "notes": "Completed classroom delivery of LinkedList."
              },
              {
                "id": "LEC-JV-T7-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "HashSet",
                  "TreeSet"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T7-3",
                "attendanceRecordId": "ATT-JV-T7-3",
                "notes": "Completed classroom delivery of HashSet."
              },
              {
                "id": "LEC-JV-T7-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "TreeSet",
                  "HashMap"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T7-4",
                "attendanceRecordId": "ATT-JV-T7-4",
                "notes": "Completed classroom delivery of TreeSet."
              },
              {
                "id": "LEC-JV-T7-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "HashMap",
                  "TreeMap"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T7-5",
                "attendanceRecordId": "ATT-JV-T7-5",
                "notes": "Completed classroom delivery of HashMap."
              },
              {
                "id": "LEC-JV-T7-6",
                "lectureNo": 6,
                "date": "2026-10-13",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "TreeMap",
                  "ArrayList"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-JV-T7-6",
                "attendanceRecordId": "ATT-JV-T7-6",
                "notes": "Completed classroom delivery of TreeMap."
              }
            ]
          },
          {
            "topicId": "JV-T8",
            "topicName": "Generics & Streams API",
            "topicDescription": "Type safety, generic methods, lambda expressions, stream filtering",
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 60
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: GUI Programming with JavaFX",
        "estimatedLectures": 10,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "JV-T9",
            "topicName": "JavaFX Stage, Scene & Panes",
            "topicDescription": "Layout panes, UI controls, FXML design",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "lectures": []
          },
          {
            "topicId": "JV-T10",
            "topicName": "Event Handling & Database Connectivity",
            "topicDescription": "Action events, listeners, JDBC Driver and PreparedStatement",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 70
  },
  {
    "facultyId": "EMP-CSE-1002",
    "facultyName": "Prof. Priya Kulkarni",
    "subjectId": "SUB-OS-3R",
    "subjectCode": "CS501",
    "subjectName": "Operating Systems",
    "classId": "3R",
    "totalLecturesPlanned": 55,
    "totalLecturesTaken": 27,
    "progress": 49,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: OS Architecture & System Calls",
        "estimatedLectures": 11,
        "lecturesTaken": 11,
        "status": "Completed",
        "topics": [
          {
            "topicId": "OS-T1",
            "topicName": "OS Functions & Structure",
            "topicDescription": "Monolithic, layered, microkernel architectures and system calls",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "lectures": [
              {
                "id": "LEC-OS-T1-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Monolithic",
                  "layered"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T1-1",
                "attendanceRecordId": "ATT-OS-T1-1",
                "notes": "Completed classroom delivery of Monolithic."
              },
              {
                "id": "LEC-OS-T1-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "layered",
                  "microkernel architectures and system calls"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T1-2",
                "attendanceRecordId": "ATT-OS-T1-2",
                "notes": "Completed classroom delivery of layered."
              },
              {
                "id": "LEC-OS-T1-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "microkernel architectures and system calls",
                  "Monolithic"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T1-3",
                "attendanceRecordId": "ATT-OS-T1-3",
                "notes": "Completed classroom delivery of microkernel architectures and system calls."
              },
              {
                "id": "LEC-OS-T1-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Monolithic",
                  "layered"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T1-4",
                "attendanceRecordId": "ATT-OS-T1-4",
                "notes": "Completed classroom delivery of Monolithic."
              },
              {
                "id": "LEC-OS-T1-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "layered",
                  "microkernel architectures and system calls"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T1-5",
                "attendanceRecordId": "ATT-OS-T1-5",
                "notes": "Completed classroom delivery of layered."
              }
            ]
          },
          {
            "topicId": "OS-T2",
            "topicName": "Process Management & PCB",
            "topicDescription": "Process states, context switching, inter-process communication",
            "noOfLectures": 6,
            "estimatedLectures": 6,
            "lecturesTaken": 6,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 6,
            "engagedLectures": 6,
            "lectures": [
              {
                "id": "LEC-OS-T2-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Process states",
                  "context switching"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T2-1",
                "attendanceRecordId": "ATT-OS-T2-1",
                "notes": "Completed classroom delivery of Process states."
              },
              {
                "id": "LEC-OS-T2-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "context switching",
                  "inter-process communication"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T2-2",
                "attendanceRecordId": "ATT-OS-T2-2",
                "notes": "Completed classroom delivery of context switching."
              },
              {
                "id": "LEC-OS-T2-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "inter-process communication",
                  "Process states"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T2-3",
                "attendanceRecordId": "ATT-OS-T2-3",
                "notes": "Completed classroom delivery of inter-process communication."
              },
              {
                "id": "LEC-OS-T2-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Process states",
                  "context switching"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T2-4",
                "attendanceRecordId": "ATT-OS-T2-4",
                "notes": "Completed classroom delivery of Process states."
              },
              {
                "id": "LEC-OS-T2-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "context switching",
                  "inter-process communication"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T2-5",
                "attendanceRecordId": "ATT-OS-T2-5",
                "notes": "Completed classroom delivery of context switching."
              },
              {
                "id": "LEC-OS-T2-6",
                "lectureNo": 6,
                "date": "2026-10-13",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "inter-process communication",
                  "Process states"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T2-6",
                "attendanceRecordId": "ATT-OS-T2-6",
                "notes": "Completed classroom delivery of inter-process communication."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: CPU Scheduling & Synchronization",
        "estimatedLectures": 11,
        "lecturesTaken": 11,
        "status": "Completed",
        "topics": [
          {
            "topicId": "OS-T3",
            "topicName": "Scheduling Algorithms",
            "topicDescription": "FCFS, SJF, Priority, Round Robin, Multilevel feedback queues",
            "noOfLectures": 6,
            "estimatedLectures": 6,
            "lecturesTaken": 6,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 6,
            "engagedLectures": 6,
            "lectures": [
              {
                "id": "LEC-OS-T3-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "FCFS",
                  "SJF"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T3-1",
                "attendanceRecordId": "ATT-OS-T3-1",
                "notes": "Completed classroom delivery of FCFS."
              },
              {
                "id": "LEC-OS-T3-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "SJF",
                  "Priority"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T3-2",
                "attendanceRecordId": "ATT-OS-T3-2",
                "notes": "Completed classroom delivery of SJF."
              },
              {
                "id": "LEC-OS-T3-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Priority",
                  "Round Robin"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T3-3",
                "attendanceRecordId": "ATT-OS-T3-3",
                "notes": "Completed classroom delivery of Priority."
              },
              {
                "id": "LEC-OS-T3-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Round Robin",
                  "Multilevel feedback queues"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T3-4",
                "attendanceRecordId": "ATT-OS-T3-4",
                "notes": "Completed classroom delivery of Round Robin."
              },
              {
                "id": "LEC-OS-T3-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Multilevel feedback queues",
                  "FCFS"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T3-5",
                "attendanceRecordId": "ATT-OS-T3-5",
                "notes": "Completed classroom delivery of Multilevel feedback queues."
              },
              {
                "id": "LEC-OS-T3-6",
                "lectureNo": 6,
                "date": "2026-10-13",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "FCFS",
                  "SJF"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T3-6",
                "attendanceRecordId": "ATT-OS-T3-6",
                "notes": "Completed classroom delivery of FCFS."
              }
            ]
          },
          {
            "topicId": "OS-T4",
            "topicName": "Classical Synchronization Problems",
            "topicDescription": "Critical section, Peterson solution, semaphores and mutex locks",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "lectures": [
              {
                "id": "LEC-OS-T4-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Critical section",
                  "Peterson solution"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T4-1",
                "attendanceRecordId": "ATT-OS-T4-1",
                "notes": "Completed classroom delivery of Critical section."
              },
              {
                "id": "LEC-OS-T4-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Peterson solution",
                  "semaphores and mutex locks"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T4-2",
                "attendanceRecordId": "ATT-OS-T4-2",
                "notes": "Completed classroom delivery of Peterson solution."
              },
              {
                "id": "LEC-OS-T4-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "semaphores and mutex locks",
                  "Critical section"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T4-3",
                "attendanceRecordId": "ATT-OS-T4-3",
                "notes": "Completed classroom delivery of semaphores and mutex locks."
              },
              {
                "id": "LEC-OS-T4-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Critical section",
                  "Peterson solution"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T4-4",
                "attendanceRecordId": "ATT-OS-T4-4",
                "notes": "Completed classroom delivery of Critical section."
              },
              {
                "id": "LEC-OS-T4-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Peterson solution",
                  "semaphores and mutex locks"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T4-5",
                "attendanceRecordId": "ATT-OS-T4-5",
                "notes": "Completed classroom delivery of Peterson solution."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: Deadlocks & Handling",
        "estimatedLectures": 11,
        "lecturesTaken": 5,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "OS-T5",
            "topicName": "Deadlock Conditions & Prevention",
            "topicDescription": "Mutual exclusion, hold & wait, no preemption, circular wait",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "lectures": [
              {
                "id": "LEC-OS-T5-1",
                "lectureNo": 1,
                "date": "2026-08-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Mutual exclusion",
                  "hold & wait"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T5-1",
                "attendanceRecordId": "ATT-OS-T5-1",
                "notes": "Completed classroom delivery of Mutual exclusion."
              },
              {
                "id": "LEC-OS-T5-2",
                "lectureNo": 2,
                "date": "2026-08-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "hold & wait",
                  "no preemption"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T5-2",
                "attendanceRecordId": "ATT-OS-T5-2",
                "notes": "Completed classroom delivery of hold & wait."
              },
              {
                "id": "LEC-OS-T5-3",
                "lectureNo": 3,
                "date": "2026-09-07",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "no preemption",
                  "circular wait"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T5-3",
                "attendanceRecordId": "ATT-OS-T5-3",
                "notes": "Completed classroom delivery of no preemption."
              },
              {
                "id": "LEC-OS-T5-4",
                "lectureNo": 4,
                "date": "2026-09-09",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "circular wait",
                  "Mutual exclusion"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T5-4",
                "attendanceRecordId": "ATT-OS-T5-4",
                "notes": "Completed classroom delivery of circular wait."
              },
              {
                "id": "LEC-OS-T5-5",
                "lectureNo": 5,
                "date": "2026-09-11",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Mutual exclusion",
                  "hold & wait"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-OS-T5-5",
                "attendanceRecordId": "ATT-OS-T5-5",
                "notes": "Completed classroom delivery of Mutual exclusion."
              }
            ]
          },
          {
            "topicId": "OS-T6",
            "topicName": "Banker's Algorithm & Recovery",
            "topicDescription": "Resource allocation graph, safety check, resource-request algorithm",
            "noOfLectures": 6,
            "estimatedLectures": 6,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 6,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 45
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: Memory Management & Virtual Memory",
        "estimatedLectures": 11,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "OS-T7",
            "topicName": "Paging & Segmentation",
            "topicDescription": "Logical vs physical address space, page table structure, TLB",
            "noOfLectures": 6,
            "estimatedLectures": 6,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 6,
            "engagedLectures": 0,
            "lectures": []
          },
          {
            "topicId": "OS-T8",
            "topicName": "Page Replacement Algorithms",
            "topicDescription": "FIFO, LRU, Optimal, Belady anomaly, thrashing",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 0
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: Storage & File Systems",
        "estimatedLectures": 11,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "OS-T9",
            "topicName": "Disk Scheduling & File Concepts",
            "topicDescription": "SSTF, SCAN, C-SCAN, LOOK, directory structures and access methods",
            "noOfLectures": 6,
            "estimatedLectures": 6,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 6,
            "engagedLectures": 0,
            "lectures": []
          },
          {
            "topicId": "OS-T10",
            "topicName": "Protection & Security",
            "topicDescription": "Access matrix, authentication, access control lists",
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 49
  },
  {
    "facultyId": "EMP-CSE-1005",
    "facultyName": "Dr. P. K. Bharne",
    "subjectId": "SUB-ADB-4R",
    "subjectCode": "CS701",
    "subjectName": "Advanced Database Management Systems",
    "classId": "4R",
    "totalLecturesPlanned": 50,
    "totalLecturesTaken": 28,
    "progress": 56,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: Distributed & Parallel Databases",
        "estimatedLectures": 10,
        "lecturesTaken": 10,
        "status": "Completed",
        "topics": [
          {
            "topicId": "ADB-T1",
            "topicName": "Distributed DB Architecture",
            "topicDescription": "Distributed catalog, fragmentation (horizontal/vertical), allocation schemas",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-ADBT1-1",
                "lectureNo": 1,
                "date": "2026-09-02",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Distributed catalog",
                  "fragmentation (horizontal/vertical)"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T1-1",
                "attendanceRecordId": "ATT-ADB-T1-1",
                "notes": "Completed classroom delivery of Distributed catalog."
              },
              {
                "id": "LEC-ADBT1-2",
                "lectureNo": 2,
                "date": "2026-09-04",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "fragmentation (horizontal/vertical)",
                  "allocation schemas"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T1-2",
                "attendanceRecordId": "ATT-ADB-T1-2",
                "notes": "Completed classroom delivery of fragmentation (horizontal/vertical)."
              },
              {
                "id": "LEC-ADBT1-3",
                "lectureNo": 3,
                "date": "2026-09-08",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "allocation schemas",
                  "Distributed catalog"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T1-3",
                "attendanceRecordId": "ATT-ADB-T1-3",
                "notes": "Completed classroom delivery of allocation schemas."
              },
              {
                "id": "LEC-ADBT1-4",
                "lectureNo": 4,
                "date": "2026-09-10",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Distributed catalog",
                  "fragmentation (horizontal/vertical)"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T1-4",
                "attendanceRecordId": "ATT-ADB-T1-4",
                "notes": "Completed classroom delivery of Distributed catalog."
              },
              {
                "id": "LEC-ADBT1-5",
                "lectureNo": 5,
                "date": "2026-09-12",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "fragmentation (horizontal/vertical)",
                  "allocation schemas"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T1-5",
                "attendanceRecordId": "ATT-ADB-T1-5",
                "notes": "Completed classroom delivery of fragmentation (horizontal/vertical)."
              }
            ]
          },
          {
            "topicId": "ADB-T2",
            "topicName": "Distributed Query Optimization",
            "topicDescription": "Semijoin strategy, query trees, cost-based distributed query optimization",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-ADBT2-1",
                "lectureNo": 1,
                "date": "2026-09-15",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Semijoin strategy",
                  "query trees"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T2-1",
                "attendanceRecordId": "ATT-ADB-T2-1",
                "notes": "Completed classroom delivery of Semijoin strategy."
              },
              {
                "id": "LEC-ADBT2-2",
                "lectureNo": 2,
                "date": "2026-09-17",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "query trees",
                  "cost-based distributed query optimization"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T2-2",
                "attendanceRecordId": "ATT-ADB-T2-2",
                "notes": "Completed classroom delivery of query trees."
              },
              {
                "id": "LEC-ADBT2-3",
                "lectureNo": 3,
                "date": "2026-09-19",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "cost-based distributed query optimization",
                  "Semijoin strategy"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T2-3",
                "attendanceRecordId": "ATT-ADB-T2-3",
                "notes": "Completed classroom delivery of cost-based distributed query optimization."
              },
              {
                "id": "LEC-ADBT2-4",
                "lectureNo": 4,
                "date": "2026-09-22",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Semijoin strategy",
                  "query trees"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T2-4",
                "attendanceRecordId": "ATT-ADB-T2-4",
                "notes": "Completed classroom delivery of Semijoin strategy."
              },
              {
                "id": "LEC-ADBT2-5",
                "lectureNo": 5,
                "date": "2026-09-24",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "query trees",
                  "cost-based distributed query optimization"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T2-5",
                "attendanceRecordId": "ATT-ADB-T2-5",
                "notes": "Completed classroom delivery of query trees."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: Distributed Concurrency & 2PC",
        "estimatedLectures": 10,
        "lecturesTaken": 10,
        "status": "Completed",
        "topics": [
          {
            "topicId": "ADB-T3",
            "topicName": "Two-Phase Commit Protocol",
            "topicDescription": "Prepare, commit, abort phases, coordinator and participant failure handling",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-ADBT3-1",
                "lectureNo": 1,
                "date": "2026-09-26",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Prepare",
                  "commit"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T3-1",
                "attendanceRecordId": "ATT-ADB-T3-1",
                "notes": "Completed classroom delivery of Prepare."
              },
              {
                "id": "LEC-ADBT3-2",
                "lectureNo": 2,
                "date": "2026-09-29",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "commit",
                  "abort phases"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T3-2",
                "attendanceRecordId": "ATT-ADB-T3-2",
                "notes": "Completed classroom delivery of commit."
              },
              {
                "id": "LEC-ADBT3-3",
                "lectureNo": 3,
                "date": "2026-10-01",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "abort phases",
                  "coordinator and participant failure handling"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T3-3",
                "attendanceRecordId": "ATT-ADB-T3-3",
                "notes": "Completed classroom delivery of abort phases."
              },
              {
                "id": "LEC-ADBT3-4",
                "lectureNo": 4,
                "date": "2026-10-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "coordinator and participant failure handling",
                  "Prepare"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T3-4",
                "attendanceRecordId": "ATT-ADB-T3-4",
                "notes": "Completed classroom delivery of coordinator and participant failure handling."
              },
              {
                "id": "LEC-ADBT3-5",
                "lectureNo": 5,
                "date": "2026-10-06",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Prepare",
                  "commit"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T3-5",
                "attendanceRecordId": "ATT-ADB-T3-5",
                "notes": "Completed classroom delivery of Prepare."
              }
            ]
          },
          {
            "topicId": "ADB-T4",
            "topicName": "Distributed Deadlock Detection",
            "topicDescription": "Wait-for graphs, centralized vs edge-chasing algorithms",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-ADBT4-1",
                "lectureNo": 1,
                "date": "2026-10-08",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Wait-for graphs",
                  "centralized vs edge-chasing algorithms"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T4-1",
                "attendanceRecordId": "ATT-ADB-T4-1",
                "notes": "Completed classroom delivery of Wait-for graphs."
              },
              {
                "id": "LEC-ADBT4-2",
                "lectureNo": 2,
                "date": "2026-10-10",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "centralized vs edge-chasing algorithms",
                  "Wait-for graphs"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T4-2",
                "attendanceRecordId": "ATT-ADB-T4-2",
                "notes": "Completed classroom delivery of centralized vs edge-chasing algorithms."
              },
              {
                "id": "LEC-ADBT4-3",
                "lectureNo": 3,
                "date": "2026-10-13",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Wait-for graphs",
                  "centralized vs edge-chasing algorithms"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T4-3",
                "attendanceRecordId": "ATT-ADB-T4-3",
                "notes": "Completed classroom delivery of Wait-for graphs."
              },
              {
                "id": "LEC-ADBT4-4",
                "lectureNo": 4,
                "date": "2026-10-15",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "centralized vs edge-chasing algorithms",
                  "Wait-for graphs"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T4-4",
                "attendanceRecordId": "ATT-ADB-T4-4",
                "notes": "Completed classroom delivery of centralized vs edge-chasing algorithms."
              },
              {
                "id": "LEC-ADBT4-5",
                "lectureNo": 5,
                "date": "2026-10-17",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Wait-for graphs",
                  "centralized vs edge-chasing algorithms"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T4-5",
                "attendanceRecordId": "ATT-ADB-T4-5",
                "notes": "Completed classroom delivery of Wait-for graphs."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: NoSQL Architectures & MongoDB",
        "estimatedLectures": 10,
        "lecturesTaken": 8,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "ADB-T5",
            "topicName": "CAP Theorem & Base Properties",
            "topicDescription": "Consistency vs Availability tradeoffs, event-driven consistency",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-ADBT5-1",
                "lectureNo": 1,
                "date": "2026-10-20",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Consistency vs Availability tradeoffs",
                  "event-driven consistency"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T5-1",
                "attendanceRecordId": "ATT-ADB-T5-1",
                "notes": "Completed classroom delivery of Consistency vs Availability tradeoffs."
              },
              {
                "id": "LEC-ADBT5-2",
                "lectureNo": 2,
                "date": "2026-10-22",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "event-driven consistency",
                  "Consistency vs Availability tradeoffs"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T5-2",
                "attendanceRecordId": "ATT-ADB-T5-2",
                "notes": "Completed classroom delivery of event-driven consistency."
              },
              {
                "id": "LEC-ADBT5-3",
                "lectureNo": 3,
                "date": "2026-10-24",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Consistency vs Availability tradeoffs",
                  "event-driven consistency"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T5-3",
                "attendanceRecordId": "ATT-ADB-T5-3",
                "notes": "Completed classroom delivery of Consistency vs Availability tradeoffs."
              },
              {
                "id": "LEC-ADBT5-4",
                "lectureNo": 4,
                "date": "2026-10-27",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "event-driven consistency",
                  "Consistency vs Availability tradeoffs"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T5-4",
                "attendanceRecordId": "ATT-ADB-T5-4",
                "notes": "Completed classroom delivery of event-driven consistency."
              },
              {
                "id": "LEC-ADBT5-5",
                "lectureNo": 5,
                "date": "2026-10-29",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Consistency vs Availability tradeoffs",
                  "event-driven consistency"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T5-5",
                "attendanceRecordId": "ATT-ADB-T5-5",
                "notes": "Completed classroom delivery of Consistency vs Availability tradeoffs."
              }
            ]
          },
          {
            "topicId": "ADB-T6",
            "topicName": "Document Stores & Aggregation Pipeline",
            "topicDescription": "BSON, indexing in Mongo, Map-Reduce and aggregation expressions",
            "plannedLectures": 5,
            "engagedLectures": 3,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "In Progress",
            "lectures": [
              {
                "id": "LEC-ADBT6-1",
                "lectureNo": 1,
                "date": "2026-11-01",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "BSON",
                  "indexing in Mongo"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T6-1",
                "attendanceRecordId": "ATT-ADB-T6-1",
                "notes": "Completed classroom delivery of BSON."
              },
              {
                "id": "LEC-ADBT6-2",
                "lectureNo": 2,
                "date": "2026-11-03",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "indexing in Mongo",
                  "Map-Reduce and aggregation expressions"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-ADB-T6-2",
                "attendanceRecordId": "ATT-ADB-T6-2",
                "notes": "Completed classroom delivery of indexing in Mongo."
              },
              {
                "id": "LEC-ADBT6-3",
                "lectureNo": 3,
                "date": "2026-11-05",
                "timeSlot": "09:00 - 10:30 AM",
                "topicsCovered": [
                  "Map-Reduce and aggregation expressions",
                  "BSON"
                ],
                "attendanceStatus": "Not Marked",
                "attendanceMarked": false,
                "attendanceId": null,
                "attendanceRecordId": null,
                "notes": ""
              }
            ]
          }
        ],
        "progress": 80
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: Columnar & Graph Databases",
        "estimatedLectures": 10,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "ADB-T7",
            "topicName": "Cassandra Architecture & CQL",
            "topicDescription": "Gossip protocol, partition keys, clustering columns, write path",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "ADB-T8",
            "topicName": "Neo4j & Property Graph Models",
            "topicDescription": "Nodes, relationships, Cypher query language pattern matching",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: Data Warehousing & OLAP",
        "estimatedLectures": 10,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "ADB-T9",
            "topicName": "Star & Snowflake Schemas",
            "topicDescription": "Fact tables, dimension tables, slowly changing dimensions (SCD)",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "ADB-T10",
            "topicName": "OLAP Operations & Materialized Views",
            "topicDescription": "Roll-up, drill-down, slice, dice and pivot queries",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 56
  },
  {
    "facultyId": "EMP-CSE-1005",
    "facultyName": "Dr. P. K. Bharne",
    "subjectId": "SUB-CC-4R",
    "subjectCode": "CS702",
    "subjectName": "Cloud Computing & DevOps",
    "classId": "4R",
    "totalLecturesPlanned": 45,
    "totalLecturesTaken": 20,
    "progress": 44,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: Cloud Virtualization & Hypervisors",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "CC-T1",
            "topicName": "Type-1 & Type-2 Virtualization",
            "topicDescription": "KVM, Xen, ESXi, full vs para-virtualization, memory ballooning",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CCT1-1",
                "lectureNo": 1,
                "date": "2026-09-03",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "KVM",
                  "Xen"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T1-1",
                "attendanceRecordId": "ATT-CC-T1-1",
                "notes": "Completed classroom delivery of KVM."
              },
              {
                "id": "LEC-CCT1-2",
                "lectureNo": 2,
                "date": "2026-09-05",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "Xen",
                  "ESXi"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T1-2",
                "attendanceRecordId": "ATT-CC-T1-2",
                "notes": "Completed classroom delivery of Xen."
              },
              {
                "id": "LEC-CCT1-3",
                "lectureNo": 3,
                "date": "2026-09-09",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "ESXi",
                  "full vs para-virtualization"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T1-3",
                "attendanceRecordId": "ATT-CC-T1-3",
                "notes": "Completed classroom delivery of ESXi."
              },
              {
                "id": "LEC-CCT1-4",
                "lectureNo": 4,
                "date": "2026-09-11",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "full vs para-virtualization",
                  "memory ballooning"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T1-4",
                "attendanceRecordId": "ATT-CC-T1-4",
                "notes": "Completed classroom delivery of full vs para-virtualization."
              },
              {
                "id": "LEC-CCT1-5",
                "lectureNo": 5,
                "date": "2026-09-13",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "memory ballooning",
                  "KVM"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T1-5",
                "attendanceRecordId": "ATT-CC-T1-5",
                "notes": "Completed classroom delivery of memory ballooning."
              }
            ]
          },
          {
            "topicId": "CC-T2",
            "topicName": "Containerization with Docker",
            "topicDescription": "Namespaces, cgroups, UnionFS, multi-stage builds and Docker Compose",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CCT2-1",
                "lectureNo": 1,
                "date": "2026-09-16",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "Namespaces",
                  "cgroups"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T2-1",
                "attendanceRecordId": "ATT-CC-T2-1",
                "notes": "Completed classroom delivery of Namespaces."
              },
              {
                "id": "LEC-CCT2-2",
                "lectureNo": 2,
                "date": "2026-09-18",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "cgroups",
                  "UnionFS"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T2-2",
                "attendanceRecordId": "ATT-CC-T2-2",
                "notes": "Completed classroom delivery of cgroups."
              },
              {
                "id": "LEC-CCT2-3",
                "lectureNo": 3,
                "date": "2026-09-20",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "UnionFS",
                  "multi-stage builds and Docker Compose"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T2-3",
                "attendanceRecordId": "ATT-CC-T2-3",
                "notes": "Completed classroom delivery of UnionFS."
              },
              {
                "id": "LEC-CCT2-4",
                "lectureNo": 4,
                "date": "2026-09-23",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "multi-stage builds and Docker Compose",
                  "Namespaces"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T2-4",
                "attendanceRecordId": "ATT-CC-T2-4",
                "notes": "Completed classroom delivery of multi-stage builds and Docker Compose."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: Cloud Service Models (IaaS, PaaS, SaaS)",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "CC-T3",
            "topicName": "AWS Core Infrastructure",
            "topicDescription": "VPC, Subnets, EC2, EBS, S3 storage tiers and IAM policies",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CCT3-1",
                "lectureNo": 1,
                "date": "2026-09-25",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "VPC",
                  "Subnets"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T3-1",
                "attendanceRecordId": "ATT-CC-T3-1",
                "notes": "Completed classroom delivery of VPC."
              },
              {
                "id": "LEC-CCT3-2",
                "lectureNo": 2,
                "date": "2026-09-27",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "Subnets",
                  "EC2"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T3-2",
                "attendanceRecordId": "ATT-CC-T3-2",
                "notes": "Completed classroom delivery of Subnets."
              },
              {
                "id": "LEC-CCT3-3",
                "lectureNo": 3,
                "date": "2026-09-30",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "EC2",
                  "EBS"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T3-3",
                "attendanceRecordId": "ATT-CC-T3-3",
                "notes": "Completed classroom delivery of EC2."
              },
              {
                "id": "LEC-CCT3-4",
                "lectureNo": 4,
                "date": "2026-10-02",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "EBS",
                  "S3 storage tiers and IAM policies"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T3-4",
                "attendanceRecordId": "ATT-CC-T3-4",
                "notes": "Completed classroom delivery of EBS."
              },
              {
                "id": "LEC-CCT3-5",
                "lectureNo": 5,
                "date": "2026-10-04",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "S3 storage tiers and IAM policies",
                  "VPC"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T3-5",
                "attendanceRecordId": "ATT-CC-T3-5",
                "notes": "Completed classroom delivery of S3 storage tiers and IAM policies."
              }
            ]
          },
          {
            "topicId": "CC-T4",
            "topicName": "Serverless Computing",
            "topicDescription": "AWS Lambda, API Gateway, event-driven microservices architecture",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CCT4-1",
                "lectureNo": 1,
                "date": "2026-10-07",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "AWS Lambda",
                  "API Gateway"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T4-1",
                "attendanceRecordId": "ATT-CC-T4-1",
                "notes": "Completed classroom delivery of AWS Lambda."
              },
              {
                "id": "LEC-CCT4-2",
                "lectureNo": 2,
                "date": "2026-10-09",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "API Gateway",
                  "event-driven microservices architecture"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T4-2",
                "attendanceRecordId": "ATT-CC-T4-2",
                "notes": "Completed classroom delivery of API Gateway."
              },
              {
                "id": "LEC-CCT4-3",
                "lectureNo": 3,
                "date": "2026-10-11",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "event-driven microservices architecture",
                  "AWS Lambda"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T4-3",
                "attendanceRecordId": "ATT-CC-T4-3",
                "notes": "Completed classroom delivery of event-driven microservices architecture."
              },
              {
                "id": "LEC-CCT4-4",
                "lectureNo": 4,
                "date": "2026-10-14",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "AWS Lambda",
                  "API Gateway"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T4-4",
                "attendanceRecordId": "ATT-CC-T4-4",
                "notes": "Completed classroom delivery of AWS Lambda."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: Kubernetes Container Orchestration",
        "estimatedLectures": 9,
        "lecturesTaken": 2,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "CC-T5",
            "topicName": "K8s Architecture & Pods",
            "topicDescription": "Control plane components, worker nodes, Kubelet, Pod specs",
            "plannedLectures": 5,
            "engagedLectures": 2,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 2,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "In Progress",
            "lectures": [
              {
                "id": "LEC-CCT5-1",
                "lectureNo": 1,
                "date": "2026-10-16",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "Control plane components",
                  "worker nodes"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CC-T5-1",
                "attendanceRecordId": "ATT-CC-T5-1",
                "notes": "Completed classroom delivery of Control plane components."
              },
              {
                "id": "LEC-CCT5-2",
                "lectureNo": 2,
                "date": "2026-10-18",
                "timeSlot": "11:00 - 12:30 PM",
                "topicsCovered": [
                  "worker nodes",
                  "Kubelet"
                ],
                "attendanceStatus": "Not Marked",
                "attendanceMarked": false,
                "attendanceId": null,
                "attendanceRecordId": null,
                "notes": ""
              }
            ]
          },
          {
            "topicId": "CC-T6",
            "topicName": "Services, Ingress & Deployments",
            "topicDescription": "ClusterIP, NodePort, LoadBalancer, rolling updates and Helm charts",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 22
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: CI/CD Pipelines & Infrastructure as Code",
        "estimatedLectures": 9,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "CC-T7",
            "topicName": "GitLab CI & GitHub Actions",
            "topicDescription": "Runners, pipeline stages, automated testing and artifact registry",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "CC-T8",
            "topicName": "Terraform IaC Fundamentals",
            "topicDescription": "HCL syntax, state files, providers, plans and resource modules",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: Cloud Security, Compliance & Observability",
        "estimatedLectures": 9,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "CC-T9",
            "topicName": "Cloud Security Shared Responsibility",
            "topicDescription": "Encryption at rest/in transit, KMS, WAF and Zero Trust principles",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "CC-T10",
            "topicName": "Observability (Prometheus, Grafana, OpenTelemetry)",
            "topicDescription": "Metrics, logs, distributed tracing, alerting and SLO/SLAs",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 44
  },
  {
    "facultyId": "EMP-CSE-1009",
    "facultyName": "Prof. R. V. Deshmukh",
    "empCode": "EMP-CSE-1009",
    "subjectId": "SUB-CG-4R",
    "subjectCode": "7KS02",
    "subjectName": "Computer Graphics",
    "classId": "4R",
    "totalLecturesPlanned": 45,
    "totalLecturesTaken": 26,
    "progress": 58,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: Graphics Hardware & Output Primitives",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "CG-T1",
            "topicName": "Display Devices & Raster Scan Displays",
            "topicDescription": "CRT, Flat-panel, Video controllers, Refresh rates and Frame buffer",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CGT1-1",
                "lectureNo": 1,
                "date": "2026-09-01",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "CRT",
                  "Flat-panel"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T1-1",
                "attendanceRecordId": "ATT-CGT1-1",
                "notes": "Completed classroom delivery of CRT."
              },
              {
                "id": "LEC-CGT1-2",
                "lectureNo": 2,
                "date": "2026-09-03",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Flat-panel",
                  "Video controllers"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T1-2",
                "attendanceRecordId": "ATT-CGT1-2",
                "notes": "Completed classroom delivery of Flat-panel."
              },
              {
                "id": "LEC-CGT1-3",
                "lectureNo": 3,
                "date": "2026-09-05",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Video controllers",
                  "Refresh rates and Frame buffer"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T1-3",
                "attendanceRecordId": "ATT-CGT1-3",
                "notes": "Completed classroom delivery of Video controllers."
              }
            ]
          },
          {
            "topicId": "CG-T2",
            "topicName": "Bresenham Line Generation Algorithm",
            "topicDescription": "DDA vs Bresenham line algorithm, integer decision parameter derivations",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CGT2-1",
                "lectureNo": 1,
                "date": "2026-09-08",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "DDA vs Bresenham line algorithm",
                  "integer decision parameter derivations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T2-1",
                "attendanceRecordId": "ATT-CGT2-1",
                "notes": "Completed classroom delivery of DDA vs Bresenham line algorithm."
              },
              {
                "id": "LEC-CGT2-2",
                "lectureNo": 2,
                "date": "2026-09-10",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "integer decision parameter derivations",
                  "DDA vs Bresenham line algorithm"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T2-2",
                "attendanceRecordId": "ATT-CGT2-2",
                "notes": "Completed classroom delivery of integer decision parameter derivations."
              },
              {
                "id": "LEC-CGT2-3",
                "lectureNo": 3,
                "date": "2026-09-12",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "DDA vs Bresenham line algorithm",
                  "integer decision parameter derivations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T2-3",
                "attendanceRecordId": "ATT-CGT2-3",
                "notes": "Completed classroom delivery of DDA vs Bresenham line algorithm."
              }
            ]
          },
          {
            "topicId": "CG-T3",
            "topicName": "Midpoint Circle & Ellipse Generation",
            "topicDescription": "8-way circle symmetry, Midpoint circle algorithm and polygon scan conversion",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CGT3-1",
                "lectureNo": 1,
                "date": "2026-09-15",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "8-way circle symmetry",
                  "Midpoint circle algorithm and polygon scan conversion"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T3-1",
                "attendanceRecordId": "ATT-CGT3-1",
                "notes": "Completed classroom delivery of 8-way circle symmetry."
              },
              {
                "id": "LEC-CGT3-2",
                "lectureNo": 2,
                "date": "2026-09-17",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Midpoint circle algorithm and polygon scan conversion",
                  "8-way circle symmetry"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T3-2",
                "attendanceRecordId": "ATT-CGT3-2",
                "notes": "Completed classroom delivery of Midpoint circle algorithm and polygon scan conversion."
              },
              {
                "id": "LEC-CGT3-3",
                "lectureNo": 3,
                "date": "2026-09-19",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "8-way circle symmetry",
                  "Midpoint circle algorithm and polygon scan conversion"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T3-3",
                "attendanceRecordId": "ATT-CGT3-3",
                "notes": "Completed classroom delivery of 8-way circle symmetry."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: 2D Transformations & Clipping",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "CG-T4",
            "topicName": "2D Geometric Transformations",
            "topicDescription": "Translation, Scaling, Rotation, Matrix representations, Homogeneous coordinates",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CGT4-1",
                "lectureNo": 1,
                "date": "2026-09-22",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Translation",
                  "Scaling"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T4-1",
                "attendanceRecordId": "ATT-CG-T4-1",
                "notes": "Completed classroom delivery of Translation."
              },
              {
                "id": "LEC-CGT4-2",
                "lectureNo": 2,
                "date": "2026-09-24",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Scaling",
                  "Rotation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T4-2",
                "attendanceRecordId": "ATT-CG-T4-2",
                "notes": "Completed classroom delivery of Scaling."
              },
              {
                "id": "LEC-CGT4-3",
                "lectureNo": 3,
                "date": "2026-09-26",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Rotation",
                  "Matrix representations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T4-3",
                "attendanceRecordId": "ATT-CG-T4-3",
                "notes": "Completed classroom delivery of Rotation."
              }
            ]
          },
          {
            "topicId": "CG-T5",
            "topicName": "Composite Transformations",
            "topicDescription": "Inverse transformations, Fixed point rotation and scaling",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CGT5-1",
                "lectureNo": 1,
                "date": "2026-09-29",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Inverse transformations",
                  "Fixed point rotation and scaling"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T5-1",
                "attendanceRecordId": "ATT-CG-T5-1",
                "notes": "Completed classroom delivery of Inverse transformations."
              },
              {
                "id": "LEC-CGT5-2",
                "lectureNo": 2,
                "date": "2026-10-01",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Fixed point rotation and scaling",
                  "Inverse transformations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T5-2",
                "attendanceRecordId": "ATT-CG-T5-2",
                "notes": "Completed classroom delivery of Fixed point rotation and scaling."
              },
              {
                "id": "LEC-CGT5-3",
                "lectureNo": 3,
                "date": "2026-10-03",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Inverse transformations",
                  "Fixed point rotation and scaling"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T5-3",
                "attendanceRecordId": "ATT-CG-T5-3",
                "notes": "Completed classroom delivery of Inverse transformations."
              }
            ]
          },
          {
            "topicId": "CG-T6",
            "topicName": "Cohen-Sutherland & Liang-Barsky Clipping",
            "topicDescription": "Viewing pipeline, 4-bit region outcodes, Line and Polygon clipping",
            "plannedLectures": 3,
            "engagedLectures": 3,
            "noOfLectures": 3,
            "estimatedLectures": 3,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CGT6-1",
                "lectureNo": 1,
                "date": "2026-10-06",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Viewing pipeline",
                  "4-bit region outcodes"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T6-1",
                "attendanceRecordId": "ATT-CG-T6-1",
                "notes": "Completed classroom delivery of Viewing pipeline."
              },
              {
                "id": "LEC-CGT6-2",
                "lectureNo": 2,
                "date": "2026-10-08",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "4-bit region outcodes",
                  "Line and Polygon clipping"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T6-2",
                "attendanceRecordId": "ATT-CG-T6-2",
                "notes": "Completed classroom delivery of 4-bit region outcodes."
              },
              {
                "id": "LEC-CGT6-3",
                "lectureNo": 3,
                "date": "2026-10-10",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Line and Polygon clipping",
                  "Viewing pipeline"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T6-3",
                "attendanceRecordId": "ATT-CG-T6-3",
                "notes": "Completed classroom delivery of Line and Polygon clipping."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: 3D Concepts & Visible Surface Detection",
        "estimatedLectures": 9,
        "lecturesTaken": 8,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "CG-T7",
            "topicName": "3D Object Representations & Projections",
            "topicDescription": "Parallel and Perspective projections, 3D translation, rotation, scaling",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-CGT7-1",
                "lectureNo": 1,
                "date": "2026-10-13",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Parallel and Perspective projections",
                  "3D translation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T7-1",
                "attendanceRecordId": "ATT-CG-T7-1",
                "notes": "Completed classroom delivery of Parallel and Perspective projections."
              },
              {
                "id": "LEC-CGT7-2",
                "lectureNo": 2,
                "date": "2026-10-15",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "3D translation",
                  "rotation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T7-2",
                "attendanceRecordId": "ATT-CG-T7-2",
                "notes": "Completed classroom delivery of 3D translation."
              },
              {
                "id": "LEC-CGT7-3",
                "lectureNo": 3,
                "date": "2026-10-17",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "rotation",
                  "scaling"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T7-3",
                "attendanceRecordId": "ATT-CG-T7-3",
                "notes": "Completed classroom delivery of rotation."
              },
              {
                "id": "LEC-CGT7-4",
                "lectureNo": 4,
                "date": "2026-10-20",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "scaling",
                  "Parallel and Perspective projections"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T7-4",
                "attendanceRecordId": "ATT-CG-T7-4",
                "notes": "Completed classroom delivery of scaling."
              },
              {
                "id": "LEC-CGT7-5",
                "lectureNo": 5,
                "date": "2026-10-22",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Parallel and Perspective projections",
                  "3D translation"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T7-5",
                "attendanceRecordId": "ATT-CG-T7-5",
                "notes": "Completed classroom delivery of Parallel and Perspective projections."
              }
            ]
          },
          {
            "topicId": "CG-T8",
            "topicName": "Visible Surface Detection Algorithms",
            "topicDescription": "Back-face detection, Depth buffer (Z-buffer), A-buffer, Scan-line method",
            "plannedLectures": 4,
            "engagedLectures": 3,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 3,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "In Progress",
            "lectures": [
              {
                "id": "LEC-CGT8-1",
                "lectureNo": 1,
                "date": "2026-10-24",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Back-face detection",
                  "Depth buffer (Z-buffer)"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T8-1",
                "attendanceRecordId": "ATT-CG-T8-1",
                "notes": "Completed classroom delivery of Back-face detection."
              },
              {
                "id": "LEC-CGT8-2",
                "lectureNo": 2,
                "date": "2026-10-27",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "Depth buffer (Z-buffer)",
                  "A-buffer"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-CG-T8-2",
                "attendanceRecordId": "ATT-CG-T8-2",
                "notes": "Completed classroom delivery of Depth buffer (Z-buffer)."
              },
              {
                "id": "LEC-CGT8-3",
                "lectureNo": 3,
                "date": "2026-10-29",
                "timeSlot": "11:00 AM - 12:00 PM",
                "topicsCovered": [
                  "A-buffer",
                  "Scan-line method"
                ],
                "attendanceStatus": "Not Marked",
                "attendanceMarked": false,
                "attendanceId": null,
                "attendanceRecordId": null,
                "notes": ""
              }
            ]
          }
        ],
        "progress": 89
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: Illumination Models & Shading",
        "estimatedLectures": 9,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "CG-T9",
            "topicName": "Light Sources & Basic Illumination Models",
            "topicDescription": "Ambient light, Diffuse reflection, Specular reflection, Phong model",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "CG-T10",
            "topicName": "Polygon Shading & Color Models",
            "topicDescription": "Constant shading, Gouraud shading, Phong shading, RGB, HSV color models",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: Curves, Surfaces & Computer Animation",
        "estimatedLectures": 9,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "CG-T11",
            "topicName": "Bezier & B-Spline Curves",
            "topicDescription": "Spline representation, Cubic Bezier curves, blending functions, properties",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "CG-T12",
            "topicName": "Computer Animation Principles",
            "topicDescription": "Design of animation sequences, Key-framing, Morphing, Kinematics intro",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 58
  },
  {
    "facultyId": "EMP-CSE-1009",
    "facultyName": "Prof. R. V. Deshmukh",
    "empCode": "EMP-CSE-1009",
    "subjectId": "SUB-DBMS-3R",
    "subjectCode": "5CS220PC",
    "subjectName": "Database Management Systems",
    "classId": "3R",
    "totalLecturesPlanned": 45,
    "totalLecturesTaken": 22,
    "progress": 49,
    "units": [
      {
        "unitId": "U1",
        "unitName": "UNIT-I: Database Concepts & ER Modeling",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "DBMS-T1",
            "topicName": "Database Architecture & 3-Schema Concept",
            "topicDescription": "Data abstraction, Data independence, DBMS components, Data models",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-DBMST1-1",
                "lectureNo": 1,
                "date": "2026-09-02",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Data abstraction",
                  "Data independence"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T1-1",
                "attendanceRecordId": "ATT-DBMS-T1-1",
                "notes": "Completed classroom delivery of Data abstraction."
              },
              {
                "id": "LEC-DBMST1-2",
                "lectureNo": 2,
                "date": "2026-09-04",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Data independence",
                  "DBMS components"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T1-2",
                "attendanceRecordId": "ATT-DBMS-T1-2",
                "notes": "Completed classroom delivery of Data independence."
              },
              {
                "id": "LEC-DBMST1-3",
                "lectureNo": 3,
                "date": "2026-09-09",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "DBMS components",
                  "Data models"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T1-3",
                "attendanceRecordId": "ATT-DBMS-T1-3",
                "notes": "Completed classroom delivery of DBMS components."
              },
              {
                "id": "LEC-DBMST1-4",
                "lectureNo": 4,
                "date": "2026-09-11",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Data models",
                  "Data abstraction"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T1-4",
                "attendanceRecordId": "ATT-DBMS-T1-4",
                "notes": "Completed classroom delivery of Data models."
              }
            ]
          },
          {
            "topicId": "DBMS-T2",
            "topicName": "Entity-Relationship (ER) Diagram",
            "topicDescription": "Entities, attributes, relationships, keys, constraints, Enhanced ER features",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-DBMST2-1",
                "lectureNo": 1,
                "date": "2026-09-16",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Entities",
                  "attributes"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T2-1",
                "attendanceRecordId": "ATT-DBMS-T2-1",
                "notes": "Completed classroom delivery of Entities."
              },
              {
                "id": "LEC-DBMST2-2",
                "lectureNo": 2,
                "date": "2026-09-18",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "attributes",
                  "relationships"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T2-2",
                "attendanceRecordId": "ATT-DBMS-T2-2",
                "notes": "Completed classroom delivery of attributes."
              },
              {
                "id": "LEC-DBMST2-3",
                "lectureNo": 3,
                "date": "2026-09-23",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "relationships",
                  "keys"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T2-3",
                "attendanceRecordId": "ATT-DBMS-T2-3",
                "notes": "Completed classroom delivery of relationships."
              },
              {
                "id": "LEC-DBMST2-4",
                "lectureNo": 4,
                "date": "2026-09-25",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "keys",
                  "constraints"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T2-4",
                "attendanceRecordId": "ATT-DBMS-T2-4",
                "notes": "Completed classroom delivery of keys."
              },
              {
                "id": "LEC-DBMST2-5",
                "lectureNo": 5,
                "date": "2026-09-30",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "constraints",
                  "Enhanced ER features"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T2-5",
                "attendanceRecordId": "ATT-DBMS-T2-5",
                "notes": "Completed classroom delivery of constraints."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U2",
        "unitName": "UNIT-II: Relational Model & SQL Querying",
        "estimatedLectures": 9,
        "lecturesTaken": 9,
        "status": "Completed",
        "topics": [
          {
            "topicId": "DBMS-T3",
            "topicName": "Relational Algebra Operations",
            "topicDescription": "Select, Project, Cartesian product, Joins, Set operations, Division",
            "plannedLectures": 4,
            "engagedLectures": 4,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-DBMST3-1",
                "lectureNo": 1,
                "date": "2026-10-02",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Select",
                  "Project"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T3-1",
                "attendanceRecordId": "ATT-DBMS-T3-1",
                "notes": "Completed classroom delivery of Select."
              },
              {
                "id": "LEC-DBMST3-2",
                "lectureNo": 2,
                "date": "2026-10-07",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Project",
                  "Cartesian product"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T3-2",
                "attendanceRecordId": "ATT-DBMS-T3-2",
                "notes": "Completed classroom delivery of Project."
              },
              {
                "id": "LEC-DBMST3-3",
                "lectureNo": 3,
                "date": "2026-10-09",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Cartesian product",
                  "Joins"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T3-3",
                "attendanceRecordId": "ATT-DBMS-T3-3",
                "notes": "Completed classroom delivery of Cartesian product."
              },
              {
                "id": "LEC-DBMST3-4",
                "lectureNo": 4,
                "date": "2026-10-14",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Joins",
                  "Set operations"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T3-4",
                "attendanceRecordId": "ATT-DBMS-T3-4",
                "notes": "Completed classroom delivery of Joins."
              }
            ]
          },
          {
            "topicId": "DBMS-T4",
            "topicName": "Complex SQL Queries & Constraints",
            "topicDescription": "Nested subqueries, Aggregate functions, Group by, Having, Views, Triggers",
            "plannedLectures": 5,
            "engagedLectures": 5,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 5,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Completed",
            "lectures": [
              {
                "id": "LEC-DBMST4-1",
                "lectureNo": 1,
                "date": "2026-10-16",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Nested subqueries",
                  "Aggregate functions"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T4-1",
                "attendanceRecordId": "ATT-DBMS-T4-1",
                "notes": "Completed classroom delivery of Nested subqueries."
              },
              {
                "id": "LEC-DBMST4-2",
                "lectureNo": 2,
                "date": "2026-10-21",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Aggregate functions",
                  "Group by"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T4-2",
                "attendanceRecordId": "ATT-DBMS-T4-2",
                "notes": "Completed classroom delivery of Aggregate functions."
              },
              {
                "id": "LEC-DBMST4-3",
                "lectureNo": 3,
                "date": "2026-10-23",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Group by",
                  "Having"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T4-3",
                "attendanceRecordId": "ATT-DBMS-T4-3",
                "notes": "Completed classroom delivery of Group by."
              },
              {
                "id": "LEC-DBMST4-4",
                "lectureNo": 4,
                "date": "2026-10-28",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Having",
                  "Views"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T4-4",
                "attendanceRecordId": "ATT-DBMS-T4-4",
                "notes": "Completed classroom delivery of Having."
              },
              {
                "id": "LEC-DBMST4-5",
                "lectureNo": 5,
                "date": "2026-10-30",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Views",
                  "Triggers"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T4-5",
                "attendanceRecordId": "ATT-DBMS-T4-5",
                "notes": "Completed classroom delivery of Views."
              }
            ]
          }
        ],
        "progress": 100
      },
      {
        "unitId": "U3",
        "unitName": "UNIT-III: Normalization & Schema Design",
        "estimatedLectures": 9,
        "lecturesTaken": 4,
        "status": "In Progress",
        "topics": [
          {
            "topicId": "DBMS-T5",
            "topicName": "Functional Dependencies & 1NF to 3NF",
            "topicDescription": "Armstrong's axioms, Canonical cover, 1NF, 2NF, 3NF decomposition algorithms",
            "plannedLectures": 5,
            "engagedLectures": 4,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 4,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "In Progress",
            "lectures": [
              {
                "id": "LEC-DBMST5-1",
                "lectureNo": 1,
                "date": "2026-11-04",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Armstrong's axioms",
                  "Canonical cover"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T5-1",
                "attendanceRecordId": "ATT-DBMS-T5-1",
                "notes": "Completed classroom delivery of Armstrong's axioms."
              },
              {
                "id": "LEC-DBMST5-2",
                "lectureNo": 2,
                "date": "2026-11-06",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "Canonical cover",
                  "1NF"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T5-2",
                "attendanceRecordId": "ATT-DBMS-T5-2",
                "notes": "Completed classroom delivery of Canonical cover."
              },
              {
                "id": "LEC-DBMST5-3",
                "lectureNo": 3,
                "date": "2026-11-11",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "1NF",
                  "2NF"
                ],
                "attendanceStatus": "Marked",
                "attendanceMarked": true,
                "attendanceId": "ATT-DBMS-T5-3",
                "attendanceRecordId": "ATT-DBMS-T5-3",
                "notes": "Completed classroom delivery of 1NF."
              },
              {
                "id": "LEC-DBMST5-4",
                "lectureNo": 4,
                "date": "2026-11-13",
                "timeSlot": "12:00 PM - 01:00 PM",
                "topicsCovered": [
                  "2NF",
                  "3NF decomposition algorithms"
                ],
                "attendanceStatus": "Not Marked",
                "attendanceMarked": false,
                "attendanceId": null,
                "attendanceRecordId": null,
                "notes": ""
              }
            ]
          },
          {
            "topicId": "DBMS-T6",
            "topicName": "Boyce-Codd Normal Form (BCNF) & Higher Forms",
            "topicDescription": "BCNF definition, Lossless join decomposition, Dependency preservation",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 44
      },
      {
        "unitId": "U4",
        "unitName": "UNIT-IV: Transactions & Concurrency Control",
        "estimatedLectures": 9,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "DBMS-T7",
            "topicName": "Transaction Processing & ACID Properties",
            "topicDescription": "States, Atomicity, Consistency, Isolation, Durability, Schedules",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "DBMS-T8",
            "topicName": "Concurrency Control Protocols",
            "topicDescription": "Two-phase locking (2PL), Timestamp-ordering, Deadlock handling",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      },
      {
        "unitId": "U5",
        "unitName": "UNIT-V: Query Processing & Indexing",
        "estimatedLectures": 9,
        "lecturesTaken": 0,
        "status": "Not Started",
        "topics": [
          {
            "topicId": "DBMS-T9",
            "topicName": "Query Optimization & Evaluation",
            "topicDescription": "Query parsing, Relational algebra equivalents, Cost estimation",
            "plannedLectures": 4,
            "engagedLectures": 0,
            "noOfLectures": 4,
            "estimatedLectures": 4,
            "lecturesTaken": 0,
            "weightage": 1,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          },
          {
            "topicId": "DBMS-T10",
            "topicName": "Indexing Techniques: B-Trees & B+ Trees",
            "topicDescription": "Ordered indices, Dense/sparse index, Multi-level indexing, B+ tree operations",
            "plannedLectures": 5,
            "engagedLectures": 0,
            "noOfLectures": 5,
            "estimatedLectures": 5,
            "lecturesTaken": 0,
            "weightage": 2,
            "weightagePercent": 20,
            "status": "Not Started",
            "lectures": []
          }
        ],
        "progress": 0
      }
    ],
    "completionPercentage": 49
  }
],
};

/**
 * Load active syllabus collection (with localStorage state persistence)
 */
export function loadSyllabusData() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const storedVer = window.localStorage.getItem("ssgmce_syllabus_ver");
      const stored = window.localStorage.getItem("ssgmce_syllabus_data");
      if (stored && storedVer === "v5") {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(s => {
            (s.units || []).forEach(u => {
              (u.topics || []).forEach(t => {
                if (!Array.isArray(t.lectures)) t.lectures = [];
                t.lectures.forEach(l => {
                  if (!Array.isArray(l.topicsCovered)) {
                    l.topicsCovered = l.topicsCovered ? [l.topicsCovered] : [t.topicName];
                  }
                  if (!l.attendanceStatus) {
                    l.attendanceStatus = l.attendanceMarked ? "Marked" : "Not Marked";
                  }
                });
                t.plannedLectures = Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 1);
                t.engagedLectures = Array.isArray(t.lectures) ? t.lectures.length : Number(t.engagedLectures || t.lecturesTaken || 0);
                t.lecturesTaken = t.engagedLectures;
              });
            });
          });
          mockTeacherData.syllabus = parsed;
          return parsed;
        }
      }
      try {
        window.localStorage.setItem("ssgmce_syllabus_ver", "v5");
        window.localStorage.setItem("ssgmce_syllabus_data", JSON.stringify(mockTeacherData.syllabus));
      } catch (_) {}
      return mockTeacherData.syllabus;
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
/**
 * Get all subjects taught by a faculty member.
 * STRICT ISOLATION: Faculty can ONLY see the subjects they teach.
 */
export function getSyllabusForFaculty(facultyId) {
  const all = loadSyllabusData();
  if (!facultyId) return [];
  const target = String(facultyId).trim().toUpperCase();
  return all.filter(s => {
    const fid = String(s.facultyId || "").toUpperCase();
    const emp = String(s.empCode || "").toUpperCase();
    return (
      fid === target ||
      emp === target ||
      (target === "T-001" && fid === "EMP-CSE-1001") ||
      (target === "T-002" && fid === "EMP-CSE-1002") ||
      (target === "T-003" && fid === "EMP-CSE-1003") ||
      (target === "T-005" && fid === "EMP-CSE-1005") ||
      (target === "EMP-CSE-1001" && fid === "T-001") ||
      (target === "EMP-CSE-1002" && fid === "T-002") ||
      (target === "EMP-CSE-1005" && fid === "T-005")
    );
  });
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



/**
 * Add a lecture to a specific topic (increments engagedLectures, appends new lecture)
 */
export function addLectureToTopic(subjectId, unitId, topicId, lectureData = {}) {
  const all = loadSyllabusData();
  const subIdx = all.findIndex(s => s.subjectId === subjectId);
  if (subIdx === -1) return null;

  const subject = JSON.parse(JSON.stringify(all[subIdx]));
  const unit = subject.units?.find(u => u.unitId === unitId);
  if (!unit) return null;

  const topic = unit.topics?.find(t => t.topicId === topicId);
  if (!topic) return null;

  if (!Array.isArray(topic.lectures)) {
    topic.lectures = [];
  }

  const nextLectureNo = topic.lectures.length + 1;
  const today = new Date().toISOString().split("T")[0];
  const newLecture = {
    id: `LEC-${topicId}-${nextLectureNo}-${Date.now().toString(36)}`,
    lectureNo: nextLectureNo,
    date: lectureData.date || today,
    timeSlot: lectureData.timeSlot || "09:00 - 10:30 AM",
    topicName: topic.topicName,
    subjectName: subject.subjectName,
    classId: subject.classId,
    topicsCovered: Array.isArray(lectureData.topicsCovered) && lectureData.topicsCovered.length > 0
      ? lectureData.topicsCovered
      : (lectureData.topicsCovered ? [String(lectureData.topicsCovered).trim()] : [topic.topicName]),
    notes: lectureData.notes || "",
    attendanceStatus: "Not Marked",
    attendanceMarked: false,
    attendanceRecordId: null,
    attendanceId: null,
    records: []
  };

  topic.lectures.push(newLecture);
  topic.engagedLectures = topic.lectures.length;
  topic.lecturesTaken = topic.engagedLectures;

  const planned = Number(topic.plannedLectures || topic.noOfLectures || topic.estimatedLectures || 1);
  if (topic.engagedLectures >= planned) {
    topic.status = "Completed";
  } else if (topic.engagedLectures > 0) {
    topic.status = "In Progress";
  } else {
    topic.status = "Not Started";
  }

  const updatedSubject = recalculateSubjectTotals(subject);
  all[subIdx] = updatedSubject;
  saveSyllabusData(all);

  return { updatedSubject, newLecture };
}

/**
 * Undo the last added lecture from a topic
 */
export function undoLectureFromTopic(subjectId, unitId, topicId) {
  const all = loadSyllabusData();
  const subIdx = all.findIndex(s => s.subjectId === subjectId);
  if (subIdx === -1) return null;

  const subject = JSON.parse(JSON.stringify(all[subIdx]));
  const unit = subject.units?.find(u => u.unitId === unitId);
  if (!unit) return null;

  const topic = unit.topics?.find(t => t.topicId === topicId);
  if (!topic || !Array.isArray(topic.lectures) || topic.lectures.length === 0) return null;

  const removedLecture = topic.lectures.pop();
  topic.engagedLectures = topic.lectures.length;
  topic.lecturesTaken = topic.engagedLectures;

  const planned = Number(topic.plannedLectures || topic.noOfLectures || topic.estimatedLectures || 1);
  if (topic.engagedLectures >= planned) {
    topic.status = "Completed";
  } else if (topic.engagedLectures > 0) {
    topic.status = "In Progress";
  } else {
    topic.status = "Not Started";
  }

  const updatedSubject = recalculateSubjectTotals(subject);
  all[subIdx] = updatedSubject;
  saveSyllabusData(all);

  return { updatedSubject, removedLecture };
}

/**
 * Mark attendance for a specific lecture under a topic
 */
export function markLectureAttendance(subjectId, unitId, topicId, lectureNoOrId, attendanceDetails = {}) {
  const all = loadSyllabusData();
  const subIdx = all.findIndex(s => s.subjectId === subjectId);
  if (subIdx === -1) return null;

  const subject = JSON.parse(JSON.stringify(all[subIdx]));
  const unit = subject.units?.find(u => u.unitId === unitId);
  if (!unit) return null;

  const topic = unit.topics?.find(t => t.topicId === topicId);
  if (!topic || !Array.isArray(topic.lectures)) return null;

  const lecture = topic.lectures.find(
    l => l.id === lectureNoOrId || l.lectureNo === Number(lectureNoOrId)
  );
  if (!lecture) return null;

  lecture.attendanceMarked = true;
  lecture.attendanceStatus = "Marked";
  lecture.attendanceId = attendanceDetails.recordId || `ATT-LEC-${lecture.id || Date.now()}`;
  lecture.attendanceRecordId = attendanceDetails.recordId || `ATT-LEC-${lecture.id || Date.now()}`;
  lecture.attendanceDate = attendanceDetails.date || lecture.date;
  lecture.markedAt = new Date().toISOString();
  lecture.presentCount = attendanceDetails.presentCount ?? 0;
  lecture.absentCount = attendanceDetails.absentCount ?? 0;
  lecture.records = attendanceDetails.records || [];

  // Also sync to global markedSessions store for live reflection in Timetable & Attendance
  const sessionKey = `${lecture.date}_${subject.classId}_${subject.subjectName}_LEC${lecture.lectureNo}`;
  submitAttendance(sessionKey, {
    subject: subject.subjectName,
    classId: subject.classId,
    topic: topic.topicName,
    lectureNo: lecture.lectureNo,
    date: lecture.date,
    records: lecture.records,
    presentCount: lecture.presentCount,
    absentCount: lecture.absentCount,
    isSyllabusLecture: true
  });

  const updatedSubject = recalculateSubjectTotals(subject);
  all[subIdx] = updatedSubject;
  saveSyllabusData(all);

  return { updatedSubject, lecture };
}

/**
 * Get attendance records for a specific lecture
 */
export function getLectureAttendance(subjectId, unitId, topicId, lectureNoOrId) {
  const all = loadSyllabusData();
  const subject = all.find(s => s.subjectId === subjectId);
  if (!subject) return null;

  const unit = subject.units?.find(u => u.unitId === unitId);
  if (!unit) return null;

  const topic = unit.topics?.find(t => t.topicId === topicId);
  if (!topic || !Array.isArray(topic.lectures)) return null;

  return topic.lectures.find(
    l => l.id === lectureNoOrId || l.lectureNo === Number(lectureNoOrId)
  ) || null;
}


// ============================================================================
// FACULTY PROFILE & PORTFOLIO MANAGEMENT UTILITIES (SEPARATE STORES)
// ============================================================================

export const STORAGE_KEY_FACULTY_PROFILE = "ssgmce_faculty_profile";
export const STORAGE_KEY_FACULTY_INFO = "ssgmce_faculty_info";

/**
 * Load all basic profile records from localStorage or initial mock data
 */
export function loadProfileData() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_FACULTY_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
  }
  return mockTeacherData.profileData;
}

/**
 * Save basic profile records to localStorage
 */
export function saveProfileData(data) {
  mockTeacherData.profileData = data;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_FACULTY_PROFILE, JSON.stringify(data));
    } catch (_) {}
  }
}

/**
 * Retrieve strictly faculty-specific basic profile (quick view only)
 */
export function getProfileData(facultyId) {
  const all = loadProfileData();
  const fid = String(facultyId || "").trim().toUpperCase();
  if (!fid) return all[0] || null;

  const found = all.find(p => {
    const mainId = String(p.facultyId || "").toUpperCase();
    const altId = String(p.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid || (fid === "T-001" && mainId === "EMP-CSE-1001") || (fid === "EMP-CSE-1001" && altId === "T-001");
  });

  if (found) {
    const copy = JSON.parse(JSON.stringify(found));
    copy.profileImageUrl = copy.profileImageUrl !== undefined ? copy.profileImageUrl : (copy.profilePhoto || null);
    copy.profilePhoto = copy.profileImageUrl;
    return copy;
  }

  const newBasic = {
    facultyId: facultyId,
    name: "Faculty Member",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    email: `${facultyId.toLowerCase()}@ssgmce.ac.in`,
    phone: "+91 94228 00000",
    dateOfJoining: new Date().toISOString().split("T")[0],
    profileImageUrl: null,
    profilePhoto: null,
    shortBio: "Faculty member at SSGMCE Shegaon."
  };
  all.push(newBasic);
  saveProfileData(all);
  return newBasic;
}

/**
 * Update basic profile fields and sync with detailed portfolio's personalDetails
 */
export function updateProfileData(facultyId, basicInfo) {
  const allProfiles = loadProfileData();
  const fid = String(facultyId || "").trim().toUpperCase();
  const pIdx = allProfiles.findIndex(p => {
    const mainId = String(p.facultyId || "").toUpperCase();
    const altId = String(p.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  const photoVal = basicInfo.profileImageUrl !== undefined 
    ? basicInfo.profileImageUrl 
    : (basicInfo.profilePhoto !== undefined ? basicInfo.profilePhoto : undefined);

  if (pIdx !== -1) {
    allProfiles[pIdx] = {
      ...allProfiles[pIdx],
      ...basicInfo,
      profileImageUrl: photoVal !== undefined ? photoVal : (allProfiles[pIdx].profileImageUrl ?? allProfiles[pIdx].profilePhoto ?? null),
      profilePhoto: photoVal !== undefined ? photoVal : (allProfiles[pIdx].profilePhoto ?? allProfiles[pIdx].profileImageUrl ?? null),
      facultyId: allProfiles[pIdx].facultyId
    };
    saveProfileData(allProfiles);
  }

  // Synchronize single source of truth with detailed portfolio
  const allInfo = loadFacultyInfoData();
  const iIdx = allInfo.findIndex(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  if (iIdx !== -1) {
    allInfo[iIdx].personalDetails = {
      ...allInfo[iIdx].personalDetails,
      name: basicInfo.name ?? allInfo[iIdx].personalDetails.name,
      email: basicInfo.email ?? allInfo[iIdx].personalDetails.email,
      phone: basicInfo.phone ?? allInfo[iIdx].personalDetails.phone,
      department: basicInfo.department ?? allInfo[iIdx].personalDetails.department,
      designation: basicInfo.designation ?? allInfo[iIdx].personalDetails.designation,
      dateOfJoining: basicInfo.dateOfJoining ?? allInfo[iIdx].personalDetails.dateOfJoining,
      profileImageUrl: photoVal !== undefined ? photoVal : (allInfo[iIdx].personalDetails.profileImageUrl ?? allInfo[iIdx].personalDetails.profilePhoto ?? null),
      profilePhoto: photoVal !== undefined ? photoVal : (allInfo[iIdx].personalDetails.profilePhoto ?? allInfo[iIdx].personalDetails.profileImageUrl ?? null),
      bio: basicInfo.shortBio ?? allInfo[iIdx].personalDetails.bio
    };
    saveFacultyInfoData(allInfo);
  }

  return pIdx !== -1 ? allProfiles[pIdx] : basicInfo;
}

/**
 * Update or upload profile image for a faculty member
 */
export function updateProfileImage(facultyId, imageUrl) {
  return updateProfileData(facultyId, {
    profileImageUrl: imageUrl || null,
    profilePhoto: imageUrl || null
  });
}

/**
 * Delete profile image (reverts to default initials avatar)
 */
export function deleteProfileImage(facultyId) {
  return updateProfileImage(facultyId, null);
}

export const uploadProfileImage = updateProfileImage;

/**
 * Load all faculty info records from localStorage or initial mock data
 */
export function loadFacultyInfoData() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_FACULTY_INFO);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
  }
  return mockTeacherData.facultyInfo;
}

/**
 * Save faculty info records to localStorage
 */
export function saveFacultyInfoData(data) {
  mockTeacherData.facultyInfo = data;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_FACULTY_INFO, JSON.stringify(data));
    } catch (_) {}
  }
}

/**
 * Retrieve strictly faculty-specific information record
 */
export function getFacultyInfo(facultyId) {
  const all = loadFacultyInfoData();
  const fid = String(facultyId || "").trim().toUpperCase();
  if (!fid) return all[0] || null;

  const found = all.find(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid || (fid === "T-001" && mainId === "EMP-CSE-1001") || (fid === "EMP-CSE-1001" && altId === "T-001");
  });

  if (found) return JSON.parse(JSON.stringify(found));

  // Initialize blank profile for new faculty
  const newProfile = {
    facultyId: facultyId,
    personalDetails: {
      name: "Faculty Member",
      facultyId: facultyId,
      email: `${facultyId.toLowerCase()}@ssgmce.ac.in`,
      phone: "+91 94228 00000",
      department: "Computer Science & Engineering",
      designation: "Assistant Professor",
      dateOfJoining: new Date().toISOString().split("T")[0],
      profilePhoto: "",
      bio: "Faculty member at SSGMCE Shegaon."
    },
    education: [],
    experience: [],
    achievements: [],
    sessionsConducted: [],
    sessionsAttended: [],
    publications: [],
    documents: []
  };

  all.push(newProfile);
  saveFacultyInfoData(all);
  return newProfile;
}

/**
 * Calculate profile completion percentage and missing items
 */
export function calculateProfileCompletion(info) {
  if (!info) return { percentage: 0, missingItems: [] };

  let score = 0;
  const missingItems = [];

  // Personal details (30%)
  const pd = info.personalDetails || {};
  if (pd.name && pd.email && pd.phone) score += 15;
  else missingItems.push("Complete basic contact information");

  if (pd.bio && pd.bio.length > 20) score += 10;
  else missingItems.push("Add a professional bio / summary");

  if (pd.profilePhoto) score += 5;
  else missingItems.push("Upload profile photograph");

  // Education (20%)
  if (Array.isArray(info.education) && info.education.length > 0) score += 20;
  else missingItems.push("Add education qualifications & degrees");

  // Experience (15%)
  if (Array.isArray(info.experience) && info.experience.length > 0) score += 15;
  else missingItems.push("Add professional experience history");

  // Achievements (15%)
  if (Array.isArray(info.achievements) && info.achievements.length > 0) score += 15;
  else missingItems.push("Record academic awards or certifications");

  // Sessions conducted or attended (10%)
  const conducted = Array.isArray(info.sessionsConducted) ? info.sessionsConducted.length : 0;
  const attended = Array.isArray(info.sessionsAttended) ? info.sessionsAttended.length : 0;
  if (conducted + attended > 0) score += 10;
  else missingItems.push("Record conducted or attended workshops/FDPs");

  // Documents uploaded (10%)
  if (Array.isArray(info.documents) && info.documents.length > 0) score += 10;
  else missingItems.push("Upload verification certificates / documents");

  return {
    percentage: Math.min(100, score),
    missingItems
  };
}

/**
 * Update personal details for a faculty member
 */
export function updateFacultyPersonalDetails(facultyId, details) {
  const all = loadFacultyInfoData();
  const fid = String(facultyId || "").trim().toUpperCase();
  const idx = all.findIndex(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  if (idx === -1) return null;

  all[idx].personalDetails = {
    ...all[idx].personalDetails,
    ...details
  };

  saveFacultyInfoData(all);

  // Sync to basic profile data store
  const allProfiles = loadProfileData();
  const pIdx = allProfiles.findIndex(p => {
    const mainId = String(p.facultyId || "").toUpperCase();
    const altId = String(p.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });
  if (pIdx !== -1) {
    allProfiles[pIdx] = {
      ...allProfiles[pIdx],
      name: details.name ?? allProfiles[pIdx].name,
      email: details.email ?? allProfiles[pIdx].email,
      phone: details.phone ?? allProfiles[pIdx].phone,
      department: details.department ?? allProfiles[pIdx].department,
      designation: details.designation ?? allProfiles[pIdx].designation,
      dateOfJoining: details.dateOfJoining ?? allProfiles[pIdx].dateOfJoining,
      profilePhoto: details.profilePhoto ?? allProfiles[pIdx].profilePhoto,
      shortBio: details.bio ?? details.shortBio ?? allProfiles[pIdx].shortBio
    };
    saveProfileData(allProfiles);
  }

  return all[idx];
}

export const getFacultyInfoData = getFacultyInfo;

/**
 * Add a new entry to a specific section (education, experience, achievements, etc.)
 */
export function addFacultySectionItem(facultyId, sectionKey, item) {
  const all = loadFacultyInfoData();
  const fid = String(facultyId || "").trim().toUpperCase();
  const idx = all.findIndex(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  if (idx === -1) return null;

  if (!Array.isArray(all[idx][sectionKey])) {
    all[idx][sectionKey] = [];
  }

  const newItem = {
    ...item,
    id: item.id || `${sectionKey.slice(0, 3)}-${Date.now()}`
  };

  all[idx][sectionKey].unshift(newItem);

  // If item includes certificate, also link into documents vault
  if (newItem.certificateUrl || newItem.proofUrl) {
    const fileUrl = newItem.certificateUrl || newItem.proofUrl;
    const catMap = {
      education: "Education",
      experience: "Experience",
      achievements: "Achievement",
      sessionsConducted: "Session",
      sessionsAttended: "Session",
      publications: "Publication"
    };
    if (!Array.isArray(all[idx].documents)) all[idx].documents = [];
    all[idx].documents.unshift({
      id: `doc-${Date.now()}`,
      name: `${newItem.title || newItem.degree || newItem.organization || 'Document'} Certificate`,
      category: catMap[sectionKey] || "Other",
      uploadedDate: new Date().toISOString().split("T")[0],
      fileUrl: fileUrl,
      fileSize: "1.2 MB"
    });
  }

  saveFacultyInfoData(all);
  return { updatedFaculty: all[idx], newItem };
}

/**
 * Update an existing item in a section
 */
export function updateFacultySectionItem(facultyId, sectionKey, itemId, updatedItem) {
  const all = loadFacultyInfoData();
  const fid = String(facultyId || "").trim().toUpperCase();
  const idx = all.findIndex(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  if (idx === -1 || !Array.isArray(all[idx][sectionKey])) return null;

  const itemIdx = all[idx][sectionKey].findIndex(i => i.id === itemId);
  if (itemIdx === -1) return null;

  all[idx][sectionKey][itemIdx] = {
    ...all[idx][sectionKey][itemIdx],
    ...updatedItem,
    id: itemId
  };

  saveFacultyInfoData(all);
  return all[idx];
}

/**
 * Delete an item from a section
 */
export function deleteFacultySectionItem(facultyId, sectionKey, itemId) {
  const all = loadFacultyInfoData();
  const fid = String(facultyId || "").trim().toUpperCase();
  const idx = all.findIndex(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  if (idx === -1 || !Array.isArray(all[idx][sectionKey])) return null;

  all[idx][sectionKey] = all[idx][sectionKey].filter(i => i.id !== itemId);
  saveFacultyInfoData(all);
  return all[idx];
}

/**
 * Add document to vault
 */
export function addFacultyDocument(facultyId, doc) {
  const all = loadFacultyInfoData();
  const fid = String(facultyId || "").trim().toUpperCase();
  const idx = all.findIndex(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  if (idx === -1) return null;

  if (!Array.isArray(all[idx].documents)) all[idx].documents = [];

  const newDoc = {
    id: doc.id || `doc-${Date.now()}`,
    name: doc.name || "Uploaded Document",
    category: doc.category || "Other",
    uploadedDate: doc.uploadedDate || new Date().toISOString().split("T")[0],
    fileUrl: doc.fileUrl || "/uploads/document.pdf",
    fileSize: doc.fileSize || "1.0 MB"
  };

  all[idx].documents.unshift(newDoc);
  saveFacultyInfoData(all);
  return newDoc;
}

/**
 * Delete document from vault
 */
export function deleteFacultyDocument(facultyId, docId) {
  const all = loadFacultyInfoData();
  const fid = String(facultyId || "").trim().toUpperCase();
  const idx = all.findIndex(f => {
    const mainId = String(f.facultyId || "").toUpperCase();
    const altId = String(f.altFacultyId || "").toUpperCase();
    return mainId === fid || altId === fid;
  });

  if (idx === -1 || !Array.isArray(all[idx].documents)) return null;

  all[idx].documents = all[idx].documents.filter(d => d.id !== docId);
  saveFacultyInfoData(all);
  return all[idx];
}

/**
 * Compile consolidated Yearly Faculty Appraisal & Activity Report
 */
export function generateYearlyReport(facultyId, year = "2026") {
  const info = getFacultyInfo(facultyId);
  if (!info) return null;

  const yStr = String(year);

  // Filter items matching target year
  const matchYear = (dateOrYear) => {
    if (!dateOrYear) return false;
    const s = String(dateOrYear);
    return s.includes(yStr);
  };

  const yearlyAchievements = (info.achievements || []).filter(a => matchYear(a.year) || matchYear(a.date));
  const yearlyConducted = (info.sessionsConducted || []).filter(s => matchYear(s.date) || matchYear(s.year));
  const yearlyAttended = (info.sessionsAttended || []).filter(s => matchYear(s.date) || matchYear(s.year));
  const yearlyPublications = (info.publications || []).filter(p => matchYear(p.year) || matchYear(p.date));
  const totalDocs = (info.documents || []).length;

  return {
    academicYear: `${year}-${Number(year) + 1}`,
    generatedAt: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    faculty: info.personalDetails || {},
    educationSummary: info.education || [],
    experienceSummary: info.experience || [],
    achievements: yearlyAchievements,
    sessionsConducted: yearlyConducted,
    sessionsAttended: yearlyAttended,
    publications: yearlyPublications,
    totalDocuments: totalDocs,
    statistics: {
      achievementsCount: yearlyAchievements.length,
      conductedCount: yearlyConducted.length,
      attendedCount: yearlyAttended.length,
      publicationsCount: yearlyPublications.length,
      totalActivityScore: (yearlyAchievements.length * 10) + (yearlyConducted.length * 15) + (yearlyAttended.length * 5) + (yearlyPublications.length * 20)
    }
  };
}
