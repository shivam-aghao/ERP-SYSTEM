# Script to update mockTeacherData.js with facultyInfo and helpers

faculty_info_code = '''
  // Comprehensive Faculty Profile & Portfolio Records
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
        dateOfJoining: "2018-07-02",
        profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
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
        dateOfJoining: "2012-08-16",
        profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
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
        dateOfJoining: "2019-01-15",
        profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
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
'''

helper_functions_code = '''
// ============================================================================
// FACULTY INFORMATION & PORTFOLIO MANAGEMENT UTILITIES
// ============================================================================

const STORAGE_KEY_FACULTY_INFO = "ssgmce_faculty_info";

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
  return all[idx];
}

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
'''
print('Loaded faculty info code definitions')

for target_path in ['src/data/mockTeacherData.js', 'Teacher_Dashboard/frontend/src/data/mockTeacherData.js']:
    with open(target_path, 'r', encoding='utf-8') as tf:
        content = tf.read()

    # Insert facultyInfo inside mockTeacherData = {
    insert_point = content.find('export const mockTeacherData = {') + len('export const mockTeacherData = {')
    content = content[:insert_point] + faculty_info_code + content[insert_point:]

    # Append helper functions at the end
    content = content + '\n' + helper_functions_code

    with open(target_path, 'w', encoding='utf-8', newline='\n') as tf:
        tf.write(content)
    print(f'Successfully updated {target_path}')
