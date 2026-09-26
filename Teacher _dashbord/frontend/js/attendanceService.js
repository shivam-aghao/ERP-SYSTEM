/**
 * College ERP - Attendance Service Layer
 * Simulates REST API / Backend DB interactions (PostgreSQL, Supabase, MySQL)
 * with LocalStorage fallback for true state persistence.
 */

const AttendanceService = {
  STORAGE_KEY_ATTENDANCE: "erp_attendance_records",
  STORAGE_KEY_DRAFTS: "erp_attendance_drafts",
  STORAGE_KEY_CLASS_CARDS: "erp_teacher_class_cards",

  defaultClassCards: [
    {
      id: "CARD-1001",
      teacher_id: "EMP-CSE-1042",
      department: "CSE",
      department_name: "Computer Science & Engineering",
      class: "3R",
      subject_code: "CS305",
      subject_name: "Database Management",
      created_at: "2026-09-01T08:00:00.000Z"
    },
    {
      id: "CARD-1002",
      teacher_id: "EMP-CSE-1042",
      department: "CSE",
      department_name: "Computer Science & Engineering",
      class: "2R1",
      subject_code: "CS303",
      subject_name: "Java Programming",
      created_at: "2026-09-02T09:30:00.000Z"
    },
    {
      id: "CARD-1003",
      teacher_id: "EMP-CSE-1042",
      department: "CSE",
      department_name: "Computer Science & Engineering",
      class: "2R2",
      subject_code: "CS302",
      subject_name: "Data Structures",
      created_at: "2026-09-03T10:15:00.000Z"
    }
  ],

  init() {
    if (!localStorage.getItem(this.STORAGE_KEY_ATTENDANCE)) {
      localStorage.setItem(
        this.STORAGE_KEY_ATTENDANCE,
        JSON.stringify(ERP_DATA.recentAttendance)
      );
    }
    if (!localStorage.getItem(this.STORAGE_KEY_DRAFTS)) {
      localStorage.setItem(this.STORAGE_KEY_DRAFTS, JSON.stringify({}));
    }
    if (!localStorage.getItem(this.STORAGE_KEY_CLASS_CARDS)) {
      localStorage.setItem(
        this.STORAGE_KEY_CLASS_CARDS,
        JSON.stringify(this.defaultClassCards)
      );
    }
  },

  getAllRecords() {
    this.init();
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_ATTENDANCE);
      return JSON.parse(data) || [];
    } catch (e) {
      console.error("Failed to parse attendance records from storage:", e);
      return ERP_DATA.recentAttendance;
    }
  },

  checkDuplicate(department, classId, date, subjectCode) {
    const records = this.getAllRecords();
    return records.some(
      (r) =>
        r.department === department &&
        r.classId === classId &&
        r.date === date &&
        r.subjectCode === subjectCode &&
        r.status === "Submitted"
    );
  },

  getDraft(department, classId, date, subjectCode) {
    this.init();
    try {
      const drafts = JSON.parse(localStorage.getItem(this.STORAGE_KEY_DRAFTS)) || {};
      const key = `${department}_${classId}_${date}_${subjectCode}`;
      return drafts[key] || null;
    } catch (e) {
      return null;
    }
  },

  saveDraft(sessionData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.init();
        const drafts = JSON.parse(localStorage.getItem(this.STORAGE_KEY_DRAFTS)) || {};
        const key = `${sessionData.department}_${sessionData.classId}_${sessionData.date}_${sessionData.subjectCode}`;
        drafts[key] = {
          ...sessionData,
          savedAt: new Date().toISOString(),
          status: "Draft"
        };
        localStorage.setItem(this.STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
        resolve({ success: true, message: "Attendance saved as draft successfully." });
      }, 300);
    });
  },

  submitAttendance(sessionData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.init();
        if (this.checkDuplicate(sessionData.department, sessionData.classId, sessionData.date, sessionData.subjectCode)) {
          reject({
            duplicate: true,
            message: `Attendance for ${sessionData.classId} - ${sessionData.subjectName} on ${sessionData.date} is already submitted!`
          });
          return;
        }

        const records = this.getAllRecords();
        const newRecord = {
          id: `REC-${Date.now().toString().slice(-6)}`,
          department: sessionData.department,
          departmentName: sessionData.departmentName,
          classId: sessionData.classId,
          subjectCode: sessionData.subjectCode,
          subjectName: sessionData.subjectName,
          date: sessionData.date,
          dateFormatted: sessionData.dateFormatted,
          totalStudents: sessionData.totalStudents,
          presentCount: sessionData.presentCount,
          absentCount: sessionData.absentCount,
          percentage: sessionData.percentage,
          students: sessionData.students,
          status: "Submitted",
          savedAt: "Just now"
        };

        records.unshift(newRecord);
        localStorage.setItem(this.STORAGE_KEY_ATTENDANCE, JSON.stringify(records));

        // Clear any corresponding draft
        const drafts = JSON.parse(localStorage.getItem(this.STORAGE_KEY_DRAFTS)) || {};
        const key = `${sessionData.department}_${sessionData.classId}_${sessionData.date}_${sessionData.subjectCode}`;
        delete drafts[key];
        localStorage.setItem(this.STORAGE_KEY_DRAFTS, JSON.stringify(drafts));

        resolve({ success: true, record: newRecord, message: "Attendance submitted successfully." });
      }, 400);
    });
  },

  deleteRecord(id) {
    const records = this.getAllRecords().filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
    return records;
  },

  // =========================================================================
  // TEACHER CLASS CARDS (Table / Collection: teacher_class_cards)
  // Endpoints verify ownership: cards belong to the logged-in teacher.
  // =========================================================================

  getAllClassCards() {
    this.init();
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_CLASS_CARDS);
      return JSON.parse(data) || [];
    } catch (e) {
      console.error("Failed to parse class cards from storage:", e);
      return [...this.defaultClassCards];
    }
  },

  getTeacherCards(teacherId) {
    return new Promise((resolve, reject) => {
      if (!teacherId) {
        return reject(new Error("Unauthorized: Teacher ID is required."));
      }
      const all = this.getAllClassCards();
      const teacherCards = all.filter((card) => card.teacher_id === teacherId);
      resolve(teacherCards);
    });
  },

  checkCardDuplicate(teacherId, department, classId, subjectCode, excludeCardId = null) {
    const all = this.getAllClassCards();
    return all.some(
      (c) =>
        c.teacher_id === teacherId &&
        c.department === department &&
        c.class === classId &&
        c.subject_code === subjectCode &&
        (!excludeCardId || c.id !== excludeCardId)
    );
  },

  createCard(teacherId, cardData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!teacherId) {
          return reject(new Error("Unauthorized: Teacher ID is missing."));
        }

        const { department, department_name, class: classId, subject_code, subject_name } = cardData;

        if (!department || !classId || !subject_code) {
          return reject(new Error("Department, Class, and Subject are all required."));
        }

        if (this.checkCardDuplicate(teacherId, department, classId, subject_code)) {
          return reject(new Error("Duplicate card: You already have a class card for this Department, Class, and Subject."));
        }

        const all = this.getAllClassCards();
        const newCard = {
          id: `CARD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          teacher_id: teacherId,
          department: department,
          department_name: department_name || department,
          class: classId,
          subject_code: subject_code,
          subject_name: subject_name || subject_code,
          created_at: new Date().toISOString()
        };

        all.unshift(newCard);
        localStorage.setItem(this.STORAGE_KEY_CLASS_CARDS, JSON.stringify(all));
        resolve({ success: true, card: newCard, message: "Class card created successfully." });
      }, 150);
    });
  },

  updateCard(teacherId, cardId, cardData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!teacherId) {
          return reject(new Error("Unauthorized: Teacher ID is missing."));
        }

        const all = this.getAllClassCards();
        const cardIndex = all.findIndex((c) => c.id === cardId);

        if (cardIndex === -1) {
          return reject(new Error("Card not found."));
        }

        // Security verify: Card must belong to the logged-in teacher
        if (all[cardIndex].teacher_id !== teacherId) {
          return reject(new Error("Forbidden: You do not have permission to modify this card."));
        }

        const { department, department_name, class: classId, subject_code, subject_name } = cardData;

        if (this.checkCardDuplicate(teacherId, department, classId, subject_code, cardId)) {
          return reject(new Error("Duplicate card: Another card already exists with this combination."));
        }

        all[cardIndex] = {
          ...all[cardIndex],
          department: department || all[cardIndex].department,
          department_name: department_name || all[cardIndex].department_name,
          class: classId || all[cardIndex].class,
          subject_code: subject_code || all[cardIndex].subject_code,
          subject_name: subject_name || all[cardIndex].subject_name,
          updated_at: new Date().toISOString()
        };

        localStorage.setItem(this.STORAGE_KEY_CLASS_CARDS, JSON.stringify(all));
        resolve({ success: true, card: all[cardIndex], message: "Class card updated successfully." });
      }, 150);
    });
  },

  deleteCard(teacherId, cardId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!teacherId) {
          return reject(new Error("Unauthorized: Teacher ID is missing."));
        }

        const all = this.getAllClassCards();
        const card = all.find((c) => c.id === cardId);

        if (!card) {
          return reject(new Error("Card not found."));
        }

        // Security verify: Card must belong to the logged-in teacher
        if (card.teacher_id !== teacherId) {
          return reject(new Error("Forbidden: You do not have permission to delete this card."));
        }

        const filtered = all.filter((c) => c.id !== cardId);
        localStorage.setItem(this.STORAGE_KEY_CLASS_CARDS, JSON.stringify(filtered));

        // Note: Past attendance records (STORAGE_KEY_ATTENDANCE) are explicitly untouched.
        resolve({ success: true, message: "Class card deleted successfully without affecting past attendance records." });
      }, 150);
    });
  }
};

window.AttendanceService = AttendanceService;


