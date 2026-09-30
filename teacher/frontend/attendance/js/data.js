/**
 * College ERP - Teacher Attendance Management System
 * Data Store & Prototype Data Structure
 * Integrated directly with Supabase Database
 */

const SUPABASE_STUDENTS_LIST = [
  "Aaditya Sanjay Chaudhari", "Aakanksha Kishor Patil", "Aarav Nitin Deshmukh", "Abhishek Vilas Kale",
  "Aditi Gajanan Deshpande", "Akash Pramod Solanke", "Amey Vijay Kadam", "Ananya Rajesh Joshi",
  "Aniket Dilip Kharche", "Anushka Sunil More", "Ashwin Ramesh Shelke", "Atharva Sandip Patil",
  "Bhavesh Vinod Kulkarni", "Chetan Arun Bhoyar", "Darshan Sanjay Tale", "Devendra Ashok Shinde",
  "Dhanashree Mohan Nemade", "Divya Santosh Mahajan", "Gaurav Eknath Gawande", "Harshada Umesh Dhote",
  "Hrishikesh Manoj Zope", "Ishaan Satish Rathod", "Jayesh Pandurang Sonone", "Kalyani Dinesh Warade",
  "Kaustubh Pravin Bharad", "Ketaki Suresh Dandge", "Madhura Vinayak Borse", "Mansi Devidas Wankhade",
  "Mayur Dipak Wagh", "Neha Kishor Pachpor", "Nikhil Vijay Raut", "Nisha Madhav Hiwale",
  "Omkar Sunil Jadhav", "Pallavi Ganesh Gawali", "Piyush Rajendra Saraf", "Pooja Ramkrishna Deshmukh",
  "Pranav Sanjay Sarnaik", "Prathamesh Dilip Bobade", "Pratiksha Vijay Tayade", "Radhika Kailash Kute",
  "Rajat Vinod Sharma", "Rashmi Omprakash Tapadiya", "Riddhi Jugalkishor Mundhada", "Rohan Vilas Ingle",
  "Rucha Pramod Kulkarni", "Rushikesh Dilip Chavan", "Sahil Sunil Mundhada", "Sakshi Narendra Thakare",
  "Samiksha Satish Kolte", "Sanket Ashok Patil", "Sayali Sanjay Junghare", "Shivam Rajesh Aghao",
  "Shravani Sandip Khandare", "Shubham Santosh Agrawal", "Siddhesh Pradeep Pande", "Snehal Gopal Ghuge",
  "Sudarshan Sanjay Kale", "Swapnil Sudhakar Tale", "Tanvi Shrikant Wagh", "Tejaswini Anil Sawale",
  "Utkarsh Vasant Wankhade", "Vaibhav Prabhakar Kale", "Vedant Gajanan Deshmukh", "Yash Pradip Chopade",
  "Yogesh Suresh Gawande", "Zaid Khan Pathan", "Bhakti Rajesh Mundada", "Chaitanya Vijay Joshi",
  "Dhiraj Sanjay Gawali"
];

const ERP_DATA = {
  teacher: {
    name: "Prof. Rajesh Sharma",
    id: "EMP-CSE-1042",
    designation: "Associate Professor",
    department: "Computer Science & Engineering",
    email: "rajesh.sharma@ssgmce.ac.in",
    avatar: "RS",
    unreadNotifications: 3
  },

  departments: [
    {
      id: "CSE",
      code: "CSE",
      name: "Computer Science & Engineering",
      icon: "💻",
      classesCount: 4,
      color: "#0B5CAD",
      description: "Department of Computer Science & Engineering"
    },
    {
      id: "IT",
      code: "IT",
      name: "Information Technology",
      icon: "🌐",
      classesCount: 4,
      color: "#1565C0",
      description: "Department of Information Technology"
    },
    {
      id: "ASH",
      code: "ASH",
      name: "Applied Sciences & Humanities",
      icon: "🔬",
      classesCount: 4,
      color: "#00A6D6",
      description: "Department of Applied Sciences & Humanities (First Year)"
    },
    {
      id: "MECH",
      code: "MECH",
      name: "Mechanical Engineering",
      icon: "⚙️",
      classesCount: 4,
      color: "#37474F",
      description: "Department of Mechanical Engineering"
    },
    {
      id: "EE",
      code: "EE",
      name: "Electrical Engineering",
      icon: "⚡",
      classesCount: 4,
      color: "#E65100",
      description: "Department of Electrical Engineering"
    },
    {
      id: "ENTC",
      code: "ENTC",
      name: "Electronics & Telecommunication Engineering",
      icon: "📡",
      classesCount: 4,
      color: "#4527A0",
      description: "Department of Electronics & Telecommunication"
    }
  ],

  classes: {
    CSE: [
      { id: "2R1", name: "2R1", year: "2nd Year - Sem 3", division: "Div 1", studentCount: 69, room: "Lab 301 / Hall A" },
      { id: "2R2", name: "2R2", year: "2nd Year - Sem 3", division: "Div 2", studentCount: 60, room: "Hall B" },
      { id: "3R",  name: "3R",  year: "3rd Year - Sem 5", division: "Div 1", studentCount: 60, room: "Hall C" },
      { id: "4R",  name: "4R",  year: "4th Year - Sem 7", division: "Div 1", studentCount: 58, room: "Seminar Hall" }
    ],
    IT: [
      { id: "2N1", name: "2N1", year: "2nd Year - Sem 3", division: "Div 1", studentCount: 60, room: "IT Lab 1" },
      { id: "2N2", name: "2N2", year: "2nd Year - Sem 3", division: "Div 2", studentCount: 60, room: "IT Lab 2" },
      { id: "3N",  name: "3N",  year: "3rd Year - Sem 5", division: "Div 1", studentCount: 60, room: "Classroom 204" },
      { id: "4N",  name: "4N",  year: "4th Year - Sem 7", division: "Div 1", studentCount: 55, room: "Classroom 205" }
    ],
    EE: [
      { id: "2S1", name: "2S1", year: "2nd Year - Sem 3", division: "Div 1", studentCount: 60, room: "Power Lab" },
      { id: "2S2", name: "2S2", year: "2nd Year - Sem 3", division: "Div 2", studentCount: 58, room: "Circuits Lab" },
      { id: "3S",  name: "3S",  year: "3rd Year - Sem 5", division: "Div 1", studentCount: 56, room: "Classroom 108" },
      { id: "4S",  name: "4S",  year: "4th Year - Sem 7", division: "Div 1", studentCount: 54, room: "Control Lab" }
    ],
    MECH: [
      { id: "2M1", name: "2M1", year: "2nd Year - Sem 3", division: "Div 1", studentCount: 60, room: "Workshop Hall" },
      { id: "2M2", name: "2M2", year: "2nd Year - Sem 3", division: "Div 2", studentCount: 60, room: "Thermodynamics Lab" },
      { id: "3M",  name: "3M",  year: "3rd Year - Sem 5", division: "Div 1", studentCount: 58, room: "CAD Lab" },
      { id: "4M",  name: "4M",  year: "4th Year - Sem 7", division: "Div 1", studentCount: 52, room: "Classroom 302" }
    ],
    ENTC: [
      { id: "2U1", name: "2U1", year: "2nd Year - Sem 3", division: "Div 1", studentCount: 60, room: "DSP Lab" },
      { id: "2U2", name: "2U2", year: "2nd Year - Sem 3", division: "Div 2", studentCount: 59, room: "VLSI Lab" },
      { id: "3U",  name: "3U",  year: "3rd Year - Sem 5", division: "Div 1", studentCount: 57, room: "Comm Lab" },
      { id: "4U",  name: "4U",  year: "4th Year - Sem 7", division: "Div 1", studentCount: 55, room: "Microwave Lab" }
    ],
    ASH: [
      { id: "FE-A", name: "FE-A", year: "1st Year - Sem 1", division: "Div A", studentCount: 60, room: "Physics Hall" },
      { id: "FE-B", name: "FE-B", year: "1st Year - Sem 1", division: "Div B", studentCount: 60, room: "Chemistry Hall" },
      { id: "FE-C", name: "FE-C", year: "1st Year - Sem 1", division: "Div C", studentCount: 60, room: "Maths Hall" },
      { id: "FE-D", name: "FE-D", year: "1st Year - Sem 1", division: "Div D", studentCount: 60, room: "Drawing Hall" }
    ]
  },

  subjects: {
    CSE: [
      { code: "CS302", name: "Data Structures", icon: "📘", teacher: "Prof. Rajesh Sharma", time: "10:00 AM – 11:00 AM", type: "Theory" },
      { code: "CS303", name: "Java Programming", icon: "☕", teacher: "Prof. Rajesh Sharma", time: "11:15 AM – 12:15 PM", type: "Theory + Lab" },
      { code: "CS304", name: "Operating Systems", icon: "🖥️", teacher: "Dr. Anita Joshi", time: "01:00 PM – 02:00 PM", type: "Theory" },
      { code: "CS305", name: "Database Management", icon: "🗄️", teacher: "Prof. Rajesh Sharma", time: "02:15 PM – 03:15 PM", type: "Theory" },
      { code: "CS306", name: "Computer Networks", icon: "🌐", teacher: "Prof. Vikram Kulkarni", time: "03:30 PM – 04:30 PM", type: "Theory" },
      { code: "CS307", name: "Web Development", icon: "⚡", teacher: "Prof. Neha Gupta", time: "04:30 PM – 05:30 PM", type: "Practical" }
    ],
    IT: [
      { code: "IT301", name: "Object Oriented Design", icon: "📦", teacher: "Prof. Rajesh Sharma", time: "09:00 AM – 10:00 AM", type: "Theory" },
      { code: "IT302", name: "Data Warehousing & Mining", icon: "📊", teacher: "Prof. Sneha Patil", time: "10:00 AM – 11:00 AM", type: "Theory" },
      { code: "IT303", name: "Cloud Computing", icon: "☁️", teacher: "Dr. Alok Verma", time: "11:15 AM – 12:15 PM", type: "Theory" },
      { code: "IT304", name: "Cyber Security", icon: "🔒", teacher: "Prof. Rajesh Sharma", time: "01:30 PM – 02:30 PM", type: "Theory" }
    ],
    EE: [
      { code: "EE301", name: "Power Systems", icon: "⚡", teacher: "Dr. S. K. Mahajan", time: "10:00 AM – 11:00 AM", type: "Theory" },
      { code: "EE302", name: "Control Systems", icon: "🎛️", teacher: "Prof. Kavita Rao", time: "11:15 AM – 12:15 PM", type: "Theory" },
      { code: "EE303", name: "Electrical Machines", icon: "🔄", teacher: "Prof. Dinesh More", time: "01:00 PM – 02:00 PM", type: "Theory + Lab" }
    ],
    MECH: [
      { code: "ME301", name: "Thermodynamics", icon: "🔥", teacher: "Dr. R. V. Shinde", time: "10:00 AM – 11:00 AM", type: "Theory" },
      { code: "ME302", name: "Fluid Mechanics", icon: "💧", teacher: "Prof. Manoj Kadam", time: "11:15 AM – 12:15 PM", type: "Theory" },
      { code: "ME303", name: "Machine Design", icon: "⚙️", teacher: "Prof. Anand Ingle", time: "01:00 PM – 02:00 PM", type: "Theory" }
    ],
    ENTC: [
      { code: "ET301", name: "Digital Signal Processing", icon: "📈", teacher: "Dr. P. B. Mane", time: "10:00 AM – 11:00 AM", type: "Theory" },
      { code: "ET302", name: "Microcontrollers & Embedded", icon: "🖲️", teacher: "Prof. Sunita Wagh", time: "11:15 AM – 12:15 PM", type: "Theory + Lab" },
      { code: "ET303", name: "VLSI Design", icon: "🔬", teacher: "Prof. T. K. Jadhav", time: "02:00 PM – 03:00 PM", type: "Theory" }
    ],
    ASH: [
      { code: "AS101", name: "Engineering Mathematics I", icon: "📐", teacher: "Dr. H. K. Bhatia", time: "09:00 AM – 10:00 AM", type: "Theory" },
      { code: "AS102", name: "Engineering Physics", icon: "⚛️", teacher: "Prof. S. R. Chougule", time: "10:00 AM – 11:00 AM", type: "Theory" },
      { code: "AS103", name: "Engineering Chemistry", icon: "🧪", teacher: "Dr. Meera Iyer", time: "11:15 AM – 12:15 PM", type: "Theory" },
      { code: "AS104", name: "Basic Electrical Engineering", icon: "💡", teacher: "Prof. V. N. Gaikwad", time: "01:00 PM – 02:00 PM", type: "Theory" }
    ]
  },

  _liveStudentsCache: null,

  // Generate students roster - dynamically links with 69 Supabase students
  generateStudentRoster(deptCode, classId) {
    const list = this._liveStudentsCache || SUPABASE_STUDENTS_LIST;
    console.log(`%c[Supabase] Generating Roster: ${list.length} students for ${deptCode} - ${classId}`, "color: #3B82F6; font-weight: bold;");
    return list.map((name, index) => {
      const roll = index + 1;
      const rollStr = roll < 10 ? `0${roll}` : `${roll}`;
      const prn = `PRN2024${deptCode}${1000 + roll}`;
      return {
        roll: roll,
        rollFormatted: `ROLL ${rollStr}`,
        name: name,
        prn: prn,
        isProvisional: roll > 66,
        status: null,
        recentHistory: [true, true, true, false, true, true, true, true, true, true]
      };
    });
  },

  // Prepopulated recent attendance records
  recentAttendance: [
    {
      id: "REC-2026-0916-01",
      department: "CSE",
      departmentName: "Computer Science & Engineering",
      classId: "3R",
      subjectCode: "CS305",
      subjectName: "Database Management",
      date: "2026-09-16",
      dateFormatted: "16 Sep 2026",
      totalStudents: 69,
      presentCount: 63,
      absentCount: 6,
      percentage: "91.3%",
      status: "Submitted",
      savedAt: "Yesterday, 03:15 PM"
    },
    {
      id: "REC-2026-0916-02",
      department: "CSE",
      departmentName: "Computer Science & Engineering",
      classId: "2R1",
      subjectCode: "CS303",
      subjectName: "Java Programming",
      date: "2026-09-16",
      dateFormatted: "16 Sep 2026",
      totalStudents: 69,
      presentCount: 63,
      absentCount: 6,
      percentage: "91.3%",
      status: "Submitted",
      savedAt: "Yesterday, 11:05 AM"
    }
  ]
};

window.ERP_DATA = ERP_DATA;

// Auto-sync with Supabase Database
(async function syncWithSupabase() {
  console.log("%c[ERP Data] Initializing Supabase Data Synchronization...", "color: #6366F1; font-weight: bold; font-size: 13px;");

  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && typeof window.supabase.createClient === "function") {
      window.supabaseClient = window.supabase.createClient(
        "https://gftqvclenyplnuoocbwe.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY"
      );
      return window.supabaseClient;
    }
    return null;
  }

  const client = getClient();
  if (!client) {
    console.warn("[Supabase] Supabase client not ready yet. Retrying in 500ms...");
    setTimeout(syncWithSupabase, 500);
    return;
  }

  try {
    // 1. Fetch Class Cards
    const { data: cards, error: cardErr } = await client
      .from("teacher_class_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (!cardErr && cards && cards.length > 0) {
      console.log(`%c[Supabase] SUCCESS! Loaded ${cards.length} LIVE class cards from Supabase!`, "color: #10B981; font-weight: bold; font-size: 14px;");
      const mappedCards = cards.map((c) => ({
        id: c.id,
        teacher_id: "EMP-CSE-1042",
        department: c.department_code,
        department_name: c.department_code === "CSE" ? "Computer Science & Engineering" : c.department_code,
        class: c.class_code,
        subject_code: c.subject_code,
        subject_name: c.subject_code === "CS305" ? "Database Management" : c.subject_code === "CS303" ? "Java Programming" : c.subject_code === "CS302" ? "Data Structures" : c.subject_code,
        created_at: c.created_at
      }));
      localStorage.setItem("erp_teacher_class_cards", JSON.stringify(mappedCards));
    }

    // 2. Fetch 69 Students for CSE 2R1
    const { data: students, error: studentErr } = await client
      .from("students")
      .select("*")
      .eq("department_code", "CSE")
      .eq("class_code", "2R1")
      .order("roll_number", { ascending: true });

    if (!studentErr && students && students.length > 0) {
      console.log(`%c[Supabase] SUCCESS! Loaded ${students.length} LIVE students from Supabase database!`, "color: #10B981; font-weight: bold; font-size: 14px;");
      ERP_DATA._liveStudentsCache = students.map((s) => s.name);
    }
  } catch (err) {
    console.error("[Supabase Sync Error]:", err);
  }
})();
