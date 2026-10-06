import { useState, useCallback, useMemo } from 'react';

/**
 * Prototype College ERP Data Model:
 * Department -> Classes -> Students -> Subjects -> Timetable
 */
export const PROTOTYPE_ERP_DATA = {
  departments: [
    {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      classes: [
        {
          code: '2R1',
          name: 'Second Year CSE Div 1',
          subjects: [
            { code: 'CS201', name: 'Data Structures', isLab: false, room: 'Room 201' },
            { code: 'CS201L', name: 'Data Structures Lab', isLab: true, room: 'Lab 01' },
            { code: 'CS203', name: 'Discrete Mathematics', isLab: false, room: 'Room 201' }
          ],
          students: Array.from({ length: 60 }, (_, i) => {
            const roll = i + 1;
            const names = [
              'Aarav Sharma', 'Aditi Patel', 'Aditya Verma', 'Akash Kulkarni', 'Ananya Deshmukh',
              'Aniket Joshi', 'Anushka Raut', 'Aryan Patil', 'Atharva Kale', 'Bhavika Shah',
              'Chetan Shinde', 'Darshan Gaikwad', 'Deepika Mane', 'Devendra More', 'Divya Chauhan',
              'Gaurav Rathod', 'Harshada Wagh', 'Isha Kulkarni', 'Karan Mehta', 'Kavita Jadhav',
              'Shivam Aghao', 'Manish Sawant', 'Mayur Gawande', 'Neha Badokar', 'Nikhil Shelke',
              'Omkar Bhise', 'Pooja Tiwari', 'Pranav Kadam', 'Pranita Ingle', 'Prasad Muley',
              'Prathamesh Dhole', 'Priya Deshpande', 'Rahul Sangle', 'Rani Shinde', 'Riddhi Thakare',
              'Ritesh Kharat', 'Rohit Solanke', 'Ruchita Tayade', 'Rushikesh Borse', 'Sakshi Wankhade',
              'Samarth Wagh', 'Sanket Dhumal', 'Sanika Joshi', 'Sarang Gite', 'Saurabh Tayade',
              'Sayali Choudhary', 'Shantanu Gore', 'Shreya Pande', 'Shrikant Mohite', 'Shubham Dhoke',
              'Siddhesh Pawar', 'Snehal Ingle', 'Soham Kulkarni', 'Sumit Tayade', 'Suraj Nemade',
              'Tanmay Wankhede', 'Tejas Solanke', 'Vaibhav Shinde', 'Vedant Deshmukh', 'Yash Pachpor'
            ];
            return {
              id: `std-2r1-${String(roll).padStart(3, '0')}`,
              rollNo: roll,
              rollFormatted: `2R1-${String(roll).padStart(2, '0')}`,
              name: names[i] || `Student ${roll}`,
              enrollmentNo: `EN24CSE${String(roll).padStart(3, '0')}`,
              classCode: '2R1',
              department: 'CSE',
              isCR: roll === 21
            };
          })
        },
        {
          code: '2R2',
          name: 'Second Year CSE Div 2',
          subjects: [
            { code: 'CS202', name: 'Java Programming', isLab: false, room: 'Room 305' },
            { code: 'CS204', name: 'Digital Logic', isLab: false, room: 'Room 305' }
          ],
          students: Array.from({ length: 58 }, (_, i) => ({
            id: `std-2r2-${String(i + 1).padStart(3, '0')}`,
            rollNo: i + 1,
            rollFormatted: `2R2-${String(i + 1).padStart(2, '0')}`,
            name: `Student 2R2-${i + 1}`,
            enrollmentNo: `EN24CSE1${String(i + 1).padStart(2, '0')}`,
            classCode: '2R2',
            department: 'CSE'
          }))
        },
        {
          code: '3R',
          name: 'Third Year CSE',
          subjects: [
            { code: 'CS301', name: 'Database Systems', isLab: false, room: 'Room 304' },
            { code: 'CS302', name: 'Operating Systems', isLab: false, room: 'Room 201' },
            { code: 'CS301L', name: 'Database Systems Lab', isLab: true, room: 'Lab 03' }
          ],
          students: Array.from({ length: 62 }, (_, i) => ({
            id: `std-3r-${String(i + 1).padStart(3, '0')}`,
            rollNo: i + 1,
            rollFormatted: `3R-${String(i + 1).padStart(2, '0')}`,
            name: `Student 3R-${i + 1}`,
            enrollmentNo: `EN23CSE${String(i + 1).padStart(3, '0')}`,
            classCode: '3R',
            department: 'CSE'
          }))
        },
        {
          code: '4R',
          name: 'Final Year CSE',
          subjects: [
            { code: 'CS401', name: 'Algorithms', isLab: false, room: 'Room 304' },
            { code: 'CS402', name: 'Project Guidance', isLab: false, room: 'Seminar Hall' }
          ],
          students: Array.from({ length: 60 }, (_, i) => ({
            id: `std-4r-${String(i + 1).padStart(3, '0')}`,
            rollNo: i + 1,
            rollFormatted: `4R-${String(i + 1).padStart(2, '0')}`,
            name: `Student 4R-${i + 1}`,
            enrollmentNo: `EN22CSE${String(i + 1).padStart(3, '0')}`,
            classCode: '4R',
            department: 'CSE'
          }))
        }
      ]
    }
  ]
};

/**
 * Unified Single Source of Truth for Student Attendance
 * Strictly implements:
 * - Only Present and Absent states (No Late)
 * - Starts in neutral/unmarked state
 * - Synchronized live counters
 * - Undo stack & Draft save
 */
export function useAttendanceState(initialSession = null) {
  // Session context: Department, Class, Date, Subject, Timeslot, Room
  const [session, setSession] = useState(
    initialSession || {
      department: 'CSE',
      classCode: '2R1',
      date: new Date().toISOString().split('T')[0],
      subject: 'Data Structures',
      timeslot: '09:00 - 10:30 AM',
      room: 'Room 201',
      isLab: false
    }
  );

  // Tab mode: 'swipe' | 'roster' | 'summary'
  const [activeTab, setActiveTab] = useState('swipe');

  // Enrolled students for current class
  const students = useMemo(() => {
    const dept = PROTOTYPE_ERP_DATA.departments.find(
      (d) => d.code === (session.department || 'CSE')
    );
    const cls = dept?.classes.find((c) => c.code === (session.classCode || '2R1'));
    return cls?.students || [];
  }, [session.department, session.classCode]);

  // UNIFIED ATTENDANCE STATE: Map of student rollNo -> record
  // Initially neutral/unmarked map
  const [records, setRecords] = useState({});

  // Swipe Card deck index
  const [currentIndex, setCurrentCardIndex] = useState(0);

  // History stack for Undo: [{ rollNo, previousStatus }]
  const [historyStack, setHistoryStack] = useState([]);

  // Draft sessions & Submitted sessions storage
  const [savedDrafts, setSavedDrafts] = useState({});
  const [submittedSessions, setSubmittedSessions] = useState({});

  // Loading & submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Computed Live Attendance Statistics (Single Source of Truth)
  const stats = useMemo(() => {
    const total = students.length;
    let present = 0;
    let absent = 0;
    let marked = 0;

    students.forEach((st) => {
      const rec = records[st.rollNo];
      if (rec && rec.status) {
        if (rec.status === 'present') {
          present++;
          marked++;
        } else if (rec.status === 'absent') {
          absent++;
          marked++;
        }
      }
    });

    const remaining = Math.max(0, total - marked);
    const percentage = (total > 0 && marked > 0) ? ((present / total) * 100).toFixed(2) : '0.00';

    return {
      total,
      present,
      absent,
      marked,
      remaining,
      percentage: Number(percentage),
      percentageFormatted: `${percentage}%`
    };
  }, [students, records]);

  // Unified single student marking action
  const markStudent = useCallback((rollNo, status, method = 'roster', remarks = '') => {
    setRecords((prev) => {
      if (!status || status === 'unmarked') {
        const next = { ...prev };
        delete next[rollNo];
        return next;
      }
      const prevRec = prev[rollNo];
      return {
        ...prev,
        [rollNo]: {
          status, // 'present' | 'absent'
          remarks: remarks !== undefined ? remarks : prevRec?.remarks || '',
          method,
          updatedAt: new Date().toISOString()
        }
      };
    });
  }, []);

  // Swipe decision: marks current card, adds to undo history, and auto-advances
  const handleSwipeDecision = useCallback(
    (decision) => {
      if (currentIndex >= students.length) return;
      const currentStudent = students[currentIndex];
      const prevStatus = records[currentStudent.rollNo]?.status || null;

      // Push to history for undo
      setHistoryStack((prev) => [
        ...prev,
        { rollNo: currentStudent.rollNo, previousStatus: prevStatus }
      ]);

      // Update unified state
      markStudent(currentStudent.rollNo, decision, 'swipe');

      // Auto-advance card
      if (currentIndex + 1 < students.length) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        // Last card swiped -> transition to Review & Summary
        setCurrentCardIndex(students.length);
        setActiveTab('summary');
      }
    },
    [currentIndex, students, records, markStudent]
  );

  // Undo last action
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0 || currentIndex === 0) return;

    const last = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    // Restore previous status
    setRecords((prev) => {
      const next = { ...prev };
      if (!last.previousStatus) {
        delete next[last.rollNo];
      } else {
        next[last.rollNo] = {
          ...next[last.rollNo],
          status: last.previousStatus
        };
      }
      return next;
    });

    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
    if (activeTab === 'summary') {
      setActiveTab('swipe');
    }
  }, [historyStack, currentIndex, activeTab]);

  // Skip student without marking
  const handleSkip = useCallback(() => {
    if (currentIndex + 1 < students.length) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setActiveTab('summary');
    }
  }, [currentIndex, students.length]);

  // Bulk actions: Mark All Present / Mark All Absent
  const handleMarkAll = useCallback(
    (status) => {
      setRecords(() => {
        const next = {};
        students.forEach((st) => {
          next[st.rollNo] = {
            status,
            remarks: '',
            method: 'bulk',
            updatedAt: new Date().toISOString()
          };
        });
        return next;
      });
      setCurrentCardIndex(students.length);
    },
    [students]
  );

  // Set remarks for individual student
  const handleSetRemarks = useCallback((rollNo, remarks) => {
    setRecords((prev) => ({
      ...prev,
      [rollNo]: {
        ...(prev[rollNo] || { status: 'present', method: 'manual' }),
        remarks
      }
    }));
  }, []);

  // Save attendance as Draft
  const handleSaveDraft = useCallback(async () => {
    const sessionKey = `${session.date}_${session.classCode}_${session.subject}`;
    const draftPayload = {
      session,
      records,
      stats,
      savedAt: new Date().toISOString()
    };
    setSavedDrafts((prev) => ({ ...prev, [sessionKey]: draftPayload }));

    setToast({
      type: 'success',
      text: 'Attendance draft saved successfully. You can resume editing anytime.'
    });
    setTimeout(() => setToast(null), 4000);
    return true;
  }, [session, records, stats]);

  // Submit attendance officially (With duplicate submission prevention)
  const handleSubmitFinal = useCallback(async () => {
    const sessionKey = `${session.date}_${session.classCode}_${session.subject}`;
    if (submittedSessions[sessionKey]) {
      setToast({
        type: 'warning',
        text: 'Attendance has already been submitted for this session.'
      });
      setTimeout(() => setToast(null), 4000);
      return false;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        department: session.department,
        classCode: session.classCode,
        subject: session.subject,
        date: session.date,
        timeSlot: session.timeslot,
        room: session.room,
        stats,
        records: students.map((st) => ({
          studentId: st.id,
          rollNo: st.rollNo,
          name: st.name,
          status: records[st.rollNo]?.status || 'absent',
          remarks: records[st.rollNo]?.remarks || '',
          method: records[st.rollNo]?.method || 'roster'
        }))
      };

      try {
        await fetch('http://localhost:5001/api/teacher/attendance/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Backend REST call skipped or offline, saving to state:', err);
      }

      setSubmittedSessions((prev) => ({
        ...prev,
        [sessionKey]: { ...payload, submittedAt: new Date().toISOString() }
      }));

      setToast({
        type: 'success',
        text: `Attendance submitted successfully for ${session.subject} (${session.classCode})! Present: ${stats.present}/${stats.total}`
      });
      setTimeout(() => setToast(null), 5000);
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }, [session, submittedSessions, students, records, stats]);

  // Open session from timetable click
  const openSession = useCallback((newSession) => {
    setSession(newSession);
    setActiveTab('swipe');
    setCurrentCardIndex(0);
    setHistoryStack([]);

    const sessionKey = `${newSession.date}_${newSession.classCode}_${newSession.subject}`;
    const prev = submittedSessions[sessionKey] || savedDrafts[sessionKey];
    if (prev && prev.records) {
      setRecords(prev.records);
    } else {
      setRecords({});
    }
  }, [submittedSessions, savedDrafts]);

  return {
    session,
    setSession,
    openSession,
    students,
    records,
    activeTab,
    setActiveTab,
    currentIndex,
    stats,
    isSubmitting,
    toast,
    setToast,
    markStudent,
    handleSwipeDecision,
    handleUndo,
    handleSkip,
    handleMarkAll,
    handleSetRemarks,
    handleSaveDraft,
    handleSubmitFinal,
    isAlreadySubmitted: Boolean(
      submittedSessions[`${session.date}_${session.classCode}_${session.subject}`]
    )
  };
}

export { useAttendanceState as useTeacherAttendance };
export default useAttendanceState;
