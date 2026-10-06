import { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE = 'http://localhost:5001/api/teacher';

/**
 * Custom React Hook: useTeacherAttendance
 * Manages complete state and network lifecycle for student attendance marking:
 * - Timetable weekly schedule & completed block tracking
 * - Full-page navigation to AttendanceMarkingPage
 * - Dual-method attendance state: Swipe Card Mode vs Roster List Mode
 * - RFID/NFC Hardware Scanner ingestion & server verification
 * - Cross-synchronized attendance records across both modes
 * - Draft session saving and bulk attendance submission with duplicate protection
 */
export function useTeacherAttendance(initialDate = new Date().toISOString().split('T')[0]) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [activeSession, setActiveSession] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('swipe'); // 'swipe' | 'roster' | 'summary'

  const [studentsRoster, setStudentsRoster] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [liveSwipedList, setLiveSwipedList] = useState([]);
  const [swipeFeedback, setSwipeFeedback] = useState(null);

  const [markedSessions, setMarkedSessions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Timetable weekly schedule configuration
  const timetableSchedule = useMemo(() => [
    {
      day: 'Monday',
      slots: [
        { time: '09:00 - 10:30 AM', subject: 'Data Structures', room: 'Room 201', classCode: '2R1', department: 'CSE', isLab: false },
        { time: '11:00 - 12:30 PM', subject: 'Java Programming', room: 'Room 305', classCode: '2R2', department: 'CSE', isLab: false },
        { time: '01:30 - 03:00 PM', subject: 'Free Slot', room: '', classCode: '', department: 'CSE', isLab: false },
        { time: '03:30 - 05:00 PM', subject: 'Data Structures Lab', room: 'Lab 02', classCode: '2R1', department: 'CSE', isLab: true }
      ]
    },
    {
      day: 'Tuesday',
      slots: [
        { time: '09:00 - 10:30 AM', subject: 'Free Slot', room: '', classCode: '', department: 'CSE', isLab: false },
        { time: '11:00 - 12:30 PM', subject: 'Data Structures', room: 'Room 201', classCode: '2R1', department: 'CSE', isLab: false },
        { time: '01:30 - 03:00 PM', subject: 'Database Systems', room: 'Room 304', classCode: '3R', department: 'CSE', isLab: false },
        { time: '03:30 - 05:00 PM', subject: 'Operating Systems Lab', room: 'Lab 04', classCode: '3R', department: 'CSE', isLab: true }
      ]
    },
    {
      day: 'Wednesday',
      slots: [
        { time: '09:00 - 10:30 AM', subject: 'Operating Systems', room: 'Room 201', classCode: '3R', department: 'CSE', isLab: false },
        { time: '11:00 - 12:30 PM', subject: 'Free Slot', room: '', classCode: '', department: 'CSE', isLab: false },
        { time: '01:30 - 03:00 PM', subject: 'Data Structures Lab', room: 'Lab 01', classCode: '2R1', department: 'CSE', isLab: true },
        { time: '03:30 - 05:00 PM', subject: 'Data Structures Lab', room: 'Lab 01', classCode: '2R1', department: 'CSE', isLab: true }
      ]
    },
    {
      day: 'Thursday',
      slots: [
        { time: '09:00 - 10:30 AM', subject: 'Data Structures', room: 'Room 201', classCode: '2R1', department: 'CSE', isLab: false },
        { time: '11:00 - 12:30 PM', subject: 'Algorithms', room: 'Room 304', classCode: '4R', department: 'CSE', isLab: false },
        { time: '01:30 - 03:00 PM', subject: 'Free Slot', room: '', classCode: '', department: 'CSE', isLab: false },
        { time: '03:30 - 05:00 PM', subject: 'Project Guidance', room: 'Seminar Hall', classCode: '4R', department: 'CSE', isLab: false }
      ]
    },
    {
      day: 'Friday',
      slots: [
        { time: '09:00 - 10:30 AM', subject: 'Java Programming', room: 'Room 305', classCode: '2R2', department: 'CSE', isLab: false },
        { time: '11:00 - 12:30 PM', subject: 'Free Slot', room: '', classCode: '', department: 'CSE', isLab: false },
        { time: '01:30 - 03:00 PM', subject: 'Database Systems Lab', room: 'Lab 03', classCode: '3R', department: 'CSE', isLab: true },
        { time: '03:30 - 05:00 PM', subject: 'Database Systems Lab', room: 'Lab 03', classCode: '3R', department: 'CSE', isLab: true }
      ]
    },
    {
      day: 'Saturday',
      slots: [
        { time: '09:00 - 10:30 AM', subject: 'Remedial Session', room: 'Room 201', classCode: '2R1', department: 'CSE', isLab: false },
        { time: '11:00 - 12:30 PM', subject: 'Free Slot', room: '', classCode: '', department: 'CSE', isLab: false },
        { time: '01:30 - 03:00 PM', subject: 'Department Meeting', room: 'Conf Room', classCode: 'CSE', department: 'CSE', isLab: false },
        { time: '03:30 - 05:00 PM', subject: 'Free Slot', room: '', classCode: '', department: 'CSE', isLab: false }
      ]
    }
  ], []);

  // Fetch previously marked sessions from backend on startup
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch(`${API_BASE}/attendance/sessions`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.sessions) {
            const map = {};
            json.data.sessions.forEach((s) => {
              const d = s.lectureDate ? s.lectureDate.split('T')[0] : selectedDate;
              const key = `${d}_${s.classCode}_${s.subjectCode || s.subject}`;
              map[key] = s;
            });
            setMarkedSessions((prev) => ({ ...prev, ...map }));
          }
        }
      } catch (err) {
        console.warn('Backend session fetch error (using memory state):', err);
      }
    }
    loadSessions();
  }, [selectedDate]);

  // Helper to construct session key
  const getSessionKey = useCallback((slot, date) => {
    if (!slot) return '';
    return `${date}_${slot.classCode}_${slot.subject}`;
  }, []);

  // Open the dedicated attendance marking page for a clicked timetable block
  const openAttendancePage = useCallback(async (slot) => {
    if (!slot || !slot.subject || slot.subject === 'Free Slot') return;

    const sessionKey = getSessionKey(slot, selectedDate);
    const existingSession = markedSessions[sessionKey];

    const sessionData = {
      ...slot,
      department: slot.department || 'CSE',
      date: selectedDate,
      timeslot: slot.time,
      isMarked: Boolean(existingSession),
      isLab: Boolean(slot.isLab),
    };

    setActiveSession(sessionData);
    setIsDrawerOpen(true);
    setActiveMode('swipe');
    setLiveSwipedList([]);
    setSwipeFeedback(null);
    setIsLoading(true);

    try {
      // 1. Load initial student roster for class
      const classId = slot.classCode || '2R1';
      const res = await fetch(`${API_BASE}/class-roster?classId=${encodeURIComponent(classId)}`);
      let students = [];
      if (res.ok) {
        const json = await res.json();
        students = json.data?.students || [];
      }

      // Fallback mock students if backend roster empty
      if (!students || students.length === 0) {
        students = Array.from({ length: 30 }, (_, i) => ({
          id: `b0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
          rollNo: i + 1,
          rollFormatted: `${classId}-${String(i + 1).padStart(2, '0')}`,
          name: i === 20 ? 'SHIVAM AGHAO' : `Student ${i + 1}`,
          enrollmentNo: `EN24CSE${String(i + 1).padStart(3, '0')}`,
          cardId: `CARD-${classId}-${String(i + 1).padStart(3, '0')}`,
          classCode: classId,
        }));
      }

      setStudentsRoster(students);

      // 2. If editing existing session, restore records; otherwise default all to 'present' or 'absent'
      const recordMap = {};
      if (existingSession && existingSession.records && existingSession.records.length > 0) {
        existingSession.records.forEach((r) => {
          recordMap[r.studentId || r.rollNo] = {
            status: r.status?.toLowerCase() || 'present',
            remarks: r.remarks || '',
            markedAt: r.markedAt || null,
            method: r.markingMode || 'manual',
          };
        });
      } else {
        students.forEach((s) => {
          recordMap[s.id || s.rollNo] = {
            status: 'present',
            remarks: '',
            markedAt: null,
            method: 'roster',
          };
        });
      }
      setAttendanceRecords(recordMap);
    } catch (err) {
      console.error('Failed to load class roster:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, markedSessions, getSessionKey]);

  // Close / Return to Timetable
  const closeAttendancePage = useCallback(() => {
    setActiveSession(null);
    setIsDrawerOpen(false);
    setSwipeFeedback(null);
  }, []);

  // Handle hardware or manual card reader swipe
  const handleSwipeInput = useCallback(async (cardId) => {
    if (!activeSession || !cardId) return;

    try {
      const res = await fetch(`${API_BASE}/attendance/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: activeSession.classCode,
          cardId: cardId.trim(),
          date: activeSession.date,
          timeSlot: activeSession.timeslot,
          subject: activeSession.subject,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const student = data.data?.student || data.student;

        // 1. Cross-sync: Update student status in underlying attendanceRecords
        setAttendanceRecords((prev) => ({
          ...prev,
          [student.id || student.rollNo]: {
            status: 'present',
            remarks: '',
            markedAt: student.markedAt || new Date().toISOString(),
            method: 'swipe',
          },
        }));

        // 2. Prepend to live swiped feed
        setLiveSwipedList((prev) => [
          {
            student,
            timestamp: new Date().toISOString(),
            status: 'present',
          },
          ...prev.filter((item) => item.student?.rollNo !== student.rollNo),
        ]);

        // 3. Success feedback toast/card
        setSwipeFeedback({
          type: 'success',
          message: data.message || `✅ ${student.name} marked Present`,
          student,
          timestamp: Date.now(),
        });
      } else {
        setSwipeFeedback({
          type: 'error',
          message: data.message || `Card ID '${cardId}' could not be verified.`,
          student: data.data || null,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      setSwipeFeedback({
        type: 'error',
        message: `Network error verifying card swipe: ${err.message}`,
        timestamp: Date.now(),
      });
    }
  }, [activeSession]);

  // Manual status change in Roster List Mode
  const handleStatusChange = useCallback((studentKey, newStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentKey]: {
        ...(prev[studentKey] || {}),
        status: newStatus,
        method: 'manual',
      },
    }));
  }, []);

  // Remark change
  const handleRemarkChange = useCallback((studentKey, remarks) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentKey]: {
        ...(prev[studentKey] || {}),
        remarks,
      },
    }));
  }, []);

  // Bulk actions: Mark All Present / Mark All Absent
  const handleMarkAll = useCallback((status) => {
    setAttendanceRecords((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], status, method: 'bulk' };
      });
      return next;
    });
  }, []);

  // Save draft attendance
  const saveDraftAttendance = useCallback(async () => {
    if (!activeSession) return;
    const sessionKey = getSessionKey(activeSession, activeSession.date);
    const draftSession = {
      ...activeSession,
      isDraft: true,
      records: Object.keys(attendanceRecords).map((k) => ({
        studentId: k,
        status: attendanceRecords[k].status,
        remarks: attendanceRecords[k].remarks,
      })),
    };
    setMarkedSessions((prev) => ({
      ...prev,
      [sessionKey]: draftSession,
    }));
  }, [activeSession, attendanceRecords, getSessionKey]);

  // Final Submit Attendance
  const submitAttendance = useCallback(async () => {
    if (!activeSession || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const recordsArray = studentsRoster.map((s) => {
        const rec = attendanceRecords[s.id] || attendanceRecords[s.rollNo] || {};
        return {
          studentId: s.id || `b0000000-0000-0000-0000-${String(s.rollNo).padStart(12, '0')}`,
          rollNo: s.rollNo,
          status: rec.status || 'present',
          remarks: rec.remarks || '',
          markingMode: rec.method || activeMode,
        };
      });

      const payload = {
        classId: activeSession.classCode,
        subject: activeSession.subject,
        room: activeSession.room,
        date: activeSession.date,
        timeSlot: activeSession.timeslot,
        markingMode: activeMode,
        records: recordsArray,
      };

      const res = await fetch(`${API_BASE}/attendance/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const savedSession = data.data || payload;

      // Update markedSessions state to render "Completed" checkmark on timetable
      const sessionKey = getSessionKey(activeSession, activeSession.date);
      setMarkedSessions((prev) => ({
        ...prev,
        [sessionKey]: {
          ...savedSession,
          isMarked: true,
          records: recordsArray,
        },
      }));

      // Show success toast notification
      const presentTotal = recordsArray.filter((r) => r.status === 'present').length;
      const successMsg = `Attendance submitted successfully for ${activeSession.subject}! (${presentTotal}/${recordsArray.length} Present)`;
      setToastMessage({
        type: 'success',
        text: successMsg,
      });
      setTimeout(() => setToastMessage(null), 5000);

      // Return to timetable
      closeAttendancePage();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: `Error submitting attendance: ${err.message}`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeSession, isSubmitting, studentsRoster, attendanceRecords, activeMode, getSessionKey, closeAttendancePage]);

  return {
    selectedDate,
    setSelectedDate,
    timetableSchedule,
    markedSessions,
    activeSession,
    isDrawerOpen,
    activeMode,
    setActiveMode,
    studentsRoster,
    attendanceRecords,
    liveSwipedList,
    swipeFeedback,
    isLoading,
    isSubmitting,
    toastMessage,
    openAttendancePage,
    openDrawer: openAttendancePage,
    closeAttendancePage,
    closeDrawer: closeAttendancePage,
    handleSwipeInput,
    handleStatusChange,
    handleRemarkChange,
    handleMarkAll,
    saveDraftAttendance,
    submitAttendance,
  };
}

export default useTeacherAttendance;
