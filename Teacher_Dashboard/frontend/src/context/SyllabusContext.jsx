import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  getSyllabusForFaculty,
  getSubjectSyllabus,
  addLectureToTopic,
  undoLectureFromTopic,
  markLectureAttendance,
  getLectureAttendance,
  saveSyllabusData
} from '../data/mockTeacherData';

const SyllabusContext = createContext(null);

export function SyllabusProvider({ children, facultyId = "EMP-CSE-1005" }) {
  const [activeFacultyId, setActiveFacultyId] = useState(facultyId);
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [activeSubject, setActiveSubject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, lectureContext: null });

  // Update active faculty if prop changes or on mount
  useEffect(() => {
    setActiveFacultyId(facultyId);
  }, [facultyId]);

  // Load faculty-specific subjects with strict isolation
  useEffect(() => {
    const list = getSyllabusForFaculty(activeFacultyId);
    setFacultySubjects(list);
    if (list.length > 0) {
      // Retain selection if valid, else pick first subject
      const stillValid = list.find(s => s.subjectId === selectedSubjectId);
      const chosenId = stillValid ? selectedSubjectId : list[0].subjectId;
      setSelectedSubjectId(chosenId);
      const sub = getSubjectSyllabus(chosenId);
      setActiveSubject(sub || list[0]);
    } else {
      setSelectedSubjectId("");
      setActiveSubject(null);
    }
  }, [activeFacultyId]);

  // Toast notification helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Select subject handler
  const selectSubject = useCallback((subjectId) => {
    setSelectedSubjectId(subjectId);
    const sub = getSubjectSyllabus(subjectId);
    setActiveSubject(sub);
  }, []);

  // Add Lecture to Topic
  const handleAddLecture = useCallback((subjectId, unitId, topicId, lectureData = {}) => {
    const res = addLectureToTopic(subjectId, unitId, topicId, lectureData);
    if (res && res.updatedSubject) {
      setActiveSubject(res.updatedSubject);
      setFacultySubjects(prev =>
        prev.map(s => s.subjectId === subjectId ? res.updatedSubject : s)
      );
      showToast(`✓ Lecture ${res.newLecture.lectureNo} added for ${res.newLecture.topicName}. You can now mark attendance.`);
      return res;
    }
    return null;
  }, [showToast]);

  // Undo Last Added Lecture
  const handleUndoLecture = useCallback((subjectId, unitId, topicId) => {
    const res = undoLectureFromTopic(subjectId, unitId, topicId);
    if (res && res.updatedSubject) {
      setActiveSubject(res.updatedSubject);
      setFacultySubjects(prev =>
        prev.map(s => s.subjectId === subjectId ? res.updatedSubject : s)
      );
      showToast(`↩ Lecture ${res.removedLecture.lectureNo} undone for topic.`);
      return res;
    }
    return null;
  }, [showToast]);

  // Mark Attendance for a Specific Lecture
  const handleMarkAttendance = useCallback((subjectId, unitId, topicId, lectureNoOrId, attendanceDetails = {}) => {
    const res = markLectureAttendance(subjectId, unitId, topicId, lectureNoOrId, attendanceDetails);
    if (res && res.updatedSubject) {
      setActiveSubject(res.updatedSubject);
      setFacultySubjects(prev =>
        prev.map(s => s.subjectId === subjectId ? res.updatedSubject : s)
      );
      showToast(`✓ Attendance marked for Lecture ${res.lecture.lectureNo}. Record updated.`);
      return res;
    }
    return null;
  }, [showToast]);

  // Open Attendance Marking Modal
  const openAttendanceModal = useCallback((lectureContext) => {
    setModalState({
      isOpen: true,
      lectureContext: {
        ...lectureContext,
        subjectId: lectureContext.subjectId || selectedSubjectId,
        subjectName: lectureContext.subjectName || (activeSubject ? activeSubject.subjectName : ''),
        classId: lectureContext.classId || (activeSubject ? activeSubject.classId : '2R1')
      }
    });
  }, [selectedSubjectId, activeSubject]);

  // Close Attendance Modal
  const closeAttendanceModal = useCallback(() => {
    setModalState({ isOpen: false, lectureContext: null });
  }, []);

  // Compute Syllabus Analytics for active subject
  const analytics = useMemo(() => {
    if (!activeSubject) {
      return {
        totalPlanned: 0,
        totalEngaged: 0,
        remaining: 0,
        coveragePercent: 0,
        paceStatus: 'Not Started',
        unitBreakdown: []
      };
    }

    let planned = 0;
    let engaged = 0;
    const unitBreakdown = [];

    (activeSubject.units || []).forEach(unit => {
      let uPlanned = 0;
      let uEngaged = 0;

      (unit.topics || []).forEach(t => {
        const p = Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 0);
        const e = Array.isArray(t.lectures)
          ? t.lectures.length
          : Number(t.engagedLectures || t.lecturesTaken || 0);
        uPlanned += p;
        uEngaged += e;
      });

      const uPct = uPlanned > 0 ? Math.min(100, Math.round((uEngaged / uPlanned) * 100)) : 0;
      unitBreakdown.push({
        unitId: unit.unitId,
        unitName: unit.unitName,
        planned: uPlanned,
        engaged: uEngaged,
        progress: uPct,
        status: uPct >= 100 ? 'Completed' : (uEngaged > 0 ? 'In Progress' : 'Not Started')
      });

      planned += uPlanned;
      engaged += uEngaged;
    });

    const totalPlanned = planned || Number(activeSubject.totalLecturesPlanned || 60);
    const totalEngaged = engaged;
    const remaining = Math.max(0, totalPlanned - totalEngaged);
    const coveragePercent = totalPlanned > 0 ? Math.min(100, Math.round((totalEngaged / totalPlanned) * 100)) : 0;
    const paceStatus = coveragePercent >= 50 ? 'On Track' : 'Behind Schedule';

    return {
      totalPlanned,
      totalEngaged,
      remaining,
      coveragePercent,
      paceStatus,
      unitBreakdown
    };
  }, [activeSubject]);

  const value = {
    activeFacultyId,
    setActiveFacultyId,
    facultySubjects,
    selectedSubjectId,
    activeSubject,
    toastMessage,
    modalState,
    analytics,
    showToast,
    selectSubject,
    addLecture: handleAddLecture,
    undoLecture: handleUndoLecture,
    markAttendance: handleMarkAttendance,
    openAttendanceModal,
    closeAttendanceModal
  };

  return (
    <SyllabusContext.Provider value={value}>
      {children}
    </SyllabusContext.Provider>
  );
}

export function useSyllabus() {
  const ctx = useContext(SyllabusContext);
  if (!ctx) {
    throw new Error('useSyllabus must be used within a SyllabusProvider');
  }
  return ctx;
}

