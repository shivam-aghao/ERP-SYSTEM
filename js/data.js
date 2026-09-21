/* ========================================================
   TEACHER ERP DATA STORE - EXPANDED ACADEMIC MODEL
   ======================================================== */

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
    academicYear: "2026-2027",
    currentSemester: "Semester 5 (Odd)"
  },

  institution: {
    name: "SHRI SANT GANJANA MAHARAJ COLLEGE OF ENGINEERING",
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
    "Shivam Aghao", "Shreya Thakur", "Siddhant Rao", "Snehal Wagh", "Sujay Bhosale",
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
      // Special highlight for Roll 21 as specified in the prompt!
      if (i === 21) {
        name = "Shivam Aghao";
      }

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

  // Today's classes schedule for Dashboard
  todayClasses: [
    {
      time: "09:00 AM",
      subject: "Data Structures",
      department: "CSE",
      classCode: "2R1",
      room: "Room 201",
      status: "completed",
      isCurrent: false
    },
    {
      time: "11:00 AM",
      subject: "Java Programming",
      department: "CSE",
      classCode: "2R2",
      room: "Room 305",
      status: "upcoming",
      isCurrent: true
    },
    {
      time: "01:00 PM",
      subject: "Database Management System",
      department: "CSE",
      classCode: "3R",
      room: "Lab 02",
      status: "upcoming",
      isCurrent: false
    },
    {
      time: "03:00 PM",
      subject: "Operating Systems",
      department: "CSE",
      classCode: "3R",
      room: "Lab 04",
      status: "upcoming",
      isCurrent: false
    }
  ],

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
