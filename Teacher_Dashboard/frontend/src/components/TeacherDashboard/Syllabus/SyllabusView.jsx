import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getSyllabusForFaculty,
  getSubjectSyllabus,
  addLectureToTopic,
  undoLectureFromTopic,
  markLectureAttendance
} from '../../../data/mockTeacherData';
import SyllabusAnalysisChart from './SyllabusAnalysisChart';
import SyllabusUnitCard from './SyllabusUnitCard';
import LectureAttendanceModal from './LectureAttendanceModal';

/**
 * SyllabusView.jsx
 * Master Container for the Lecture-Based Syllabus Tracking System.
 * Strictly isolates subjects for the logged-in faculty.
 * Enables adding lectures per topic, specifying topics covered tags,
 * marking attendance per lecture, and viewing delivery logs.
 */
export default function SyllabusView({ facultyId }) {
  // Resolve active logged-in faculty ID from prop or storage
  const resolveFacultyId = () => {
    if (facultyId) return facultyId;
    try {
      const stored = JSON.parse(localStorage.getItem('ssgmce_user') || localStorage.getItem('ssgmce_active_teacher') || '{}');
      if (stored.emp_code) return stored.emp_code;
      if (stored.id) return stored.id;
    } catch (_) {}
    return "EMP-CSE-1005"; // Default to active session
  };

  const currentFacultyId = resolveFacultyId();
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [activeSubject, setActiveSubject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' or 'history'
  const [attendanceModal, setAttendanceModal] = useState({ isOpen: false, lectureContext: null });
  const [historySearch, setHistorySearch] = useState('');

  // 1. Strict Faculty-Specific Subject Loading
  useEffect(() => {
    const list = getSyllabusForFaculty(currentFacultyId);
    setFacultySubjects(list);
    if (list.length > 0) {
      const existing = list.find(s => s.subjectId === selectedSubjectId);
      const chosen = existing ? selectedSubjectId : list[0].subjectId;
      setSelectedSubjectId(chosen);
      const sub = getSubjectSyllabus(chosen);
      setActiveSubject(sub || list[0]);
    } else {
      setSelectedSubjectId("");
      setActiveSubject(null);
    }
  }, [currentFacultyId]);

  // Subject selector change handler
  const handleSelectSubject = (subjectId) => {
    setSelectedSubjectId(subjectId);
    const sub = getSubjectSyllabus(subjectId);
    setActiveSubject(sub);
  };

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // 2. Add Lecture Handler (with topics covered & notes support)
  const handleAddLecture = (subjectId, unitId, topicId, lectureData = {}) => {
    const res = addLectureToTopic(subjectId, unitId, topicId, lectureData);
    if (res && res.updatedSubject) {
      setActiveSubject(res.updatedSubject);
      setFacultySubjects(prev =>
        prev.map(s => s.subjectId === subjectId ? res.updatedSubject : s)
      );
      const tagCount = Array.isArray(res.newLecture.topicsCovered) ? res.newLecture.topicsCovered.length : 1;
      showToast(`✓ Lecture ${res.newLecture.lectureNo} added for "${res.newLecture.topicName}" (${tagCount} topics covered). You can now mark attendance.`);
    }
  };

  // 3. Undo Lecture Handler
  const handleUndoLecture = (subjectId, unitId, topicId) => {
    const res = undoLectureFromTopic(subjectId, unitId, topicId);
    if (res && res.updatedSubject) {
      setActiveSubject(res.updatedSubject);
      setFacultySubjects(prev =>
        prev.map(s => s.subjectId === subjectId ? res.updatedSubject : s)
      );
      showToast(`↩ Lecture ${res.removedLecture.lectureNo} removed.`);
    }
  };

  // 4. Open Attendance Modal for a Specific Lecture
  const handleOpenAttendanceModal = (lectureContext) => {
    setAttendanceModal({
      isOpen: true,
      lectureContext: {
        ...lectureContext,
        subjectId: lectureContext.subjectId || selectedSubjectId,
        subjectName: lectureContext.subjectName || (activeSubject ? activeSubject.subjectName : ''),
        classId: lectureContext.classId || (activeSubject ? activeSubject.classId : '2R1')
      }
    });
  };

  // 5. Save Attendance from Modal
  const handleSaveAttendance = (subjectId, unitId, topicId, lectureId, attendancePayload) => {
    const res = markLectureAttendance(subjectId, unitId, topicId, lectureId, attendancePayload);
    if (res && res.updatedSubject) {
      setActiveSubject(res.updatedSubject);
      setFacultySubjects(prev =>
        prev.map(s => s.subjectId === subjectId ? res.updatedSubject : s)
      );
      showToast(`✓ Attendance marked for Lecture ${res.lecture.lectureNo}. Record saved.`);
    }
  };

  // 6. Compute Flattened Lecture History for Active Subject
  const allLecturesList = useMemo(() => {
    if (!activeSubject) return [];
    const list = [];
    (activeSubject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        (topic.lectures || []).forEach(lec => {
          list.push({
            ...lec,
            unitId: unit.unitId,
            unitName: unit.unitName,
            topicId: topic.topicId,
            topicName: topic.topicName,
            subjectId: activeSubject.subjectId,
            subjectName: activeSubject.subjectName,
            classId: activeSubject.classId
          });
        });
      });
    });
    return list.sort((a, b) => (b.lectureNo || 0) - (a.lectureNo || 0));
  }, [activeSubject]);

  // Filtered lecture history for search
  const filteredLectures = useMemo(() => {
    if (!historySearch.trim()) return allLecturesList;
    const q = historySearch.toLowerCase();
    return allLecturesList.filter(l => {
      const topMatch = (l.topicName || '').toLowerCase().includes(q);
      const unitMatch = (l.unitName || '').toLowerCase().includes(q);
      const tagsMatch = Array.isArray(l.topicsCovered) && l.topicsCovered.some(t => t.toLowerCase().includes(q));
      const dateMatch = (l.date || '').includes(q);
      const numMatch = `lecture ${l.lectureNo}`.includes(q);
      return topMatch || unitMatch || tagsMatch || dateMatch || numMatch;
    });
  }, [allLecturesList, historySearch]);

  // 7. CSV Report Generator
  const handleDownloadReport = () => {
    if (!activeSubject) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Subject Name,${activeSubject.subjectName}\n`;
    csvContent += `Class,${activeSubject.classId}\n`;
    csvContent += `Faculty Name,${activeSubject.facultyName || 'Faculty'}\n`;
    csvContent += `Total Planned Lectures,${activeSubject.totalLecturesPlanned || 60}\n`;
    csvContent += `Total Lectures Taken,${activeSubject.totalLecturesTaken || 0}\n`;
    csvContent += `Overall Coverage,${activeSubject.progress || 0}%\n\n`;

    csvContent += "Lecture No,Date,Unit,Topic,Topics Covered,Attendance Status,Attendance ID,Notes\n";

    allLecturesList.forEach(lec => {
      const lNo = lec.lectureNo;
      const date = lec.date || '';
      const uName = `"${(lec.unitName || '').replace(/"/g, '""')}"`;
      const tName = `"${(lec.topicName || '').replace(/"/g, '""')}"`;
      const covered = `"${(Array.isArray(lec.topicsCovered) ? lec.topicsCovered.join('; ') : lec.topicsCovered || '').replace(/"/g, '""')}"`;
      const status = lec.attendanceMarked ? 'Marked' : 'Not Marked';
      const attId = lec.attendanceId || '';
      const notes = `"${(lec.notes || '').replace(/"/g, '""')}"`;

      csvContent += `${lNo},${date},${uName},${tName},${covered},${status},${attId},${notes}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Syllabus_Lectures_${activeSubject.subjectId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '4px 0', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0B1F3A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          fontSize: '13.5px',
          fontWeight: 700,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* 1. Subject Selector Toolbar (STRICT FACULTY VISIBILITY) */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Assigned Teaching Load ({facultySubjects.length} Subjects)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSelectSubject(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0B1F3A',
                  cursor: 'pointer',
                  minWidth: '280px'
                }}
              >
                {facultySubjects.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.subjectName} ({s.classId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Subject Pills for Faculty */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {facultySubjects.map(sub => {
              const isSelected = sub.subjectId === selectedSubjectId;
              return (
                <button
                  key={sub.subjectId}
                  type="button"
                  onClick={() => handleSelectSubject(sub.subjectId)}
                  style={{
                    background: isSelected ? '#0B1F3A' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    border: isSelected ? '1px solid #0B1F3A' : '1px solid #CBD5E1',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sub.subjectName} ({sub.classId})
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: '#64748B' }}>
          Faculty ID: <strong style={{ color: '#0B1F3A' }}>{currentFacultyId}</strong>
        </div>
      </div>

      {/* Fallback if Faculty Has No Subjects Assigned */}
      {facultySubjects.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: '#64748B'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0B1F3A' }}>
            No Subjects Scheduled for Your Faculty Profile
          </h4>
          <p style={{ margin: 0, fontSize: '13px' }}>
            There are no teaching assignments linked to faculty ID <strong>{currentFacultyId}</strong>.
          </p>
        </div>
      ) : activeSubject ? (
        <>
          {/* 2. Top Syllabus Analysis Card */}
          <SyllabusAnalysisChart
            subject={activeSubject}
            onDownloadReport={handleDownloadReport}
          />

          {/* 3. View Mode Navigation Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '2px solid #E2E8F0',
            paddingBottom: '8px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('curriculum')}
                style={{
                  background: activeTab === 'curriculum' ? '#0B1F3A' : '#F1F5F9',
                  color: activeTab === 'curriculum' ? '#FFFFFF' : '#475569',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📚 Curriculum &amp; Lecture Delivery ({activeSubject.units?.length || 0} Units)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                style={{
                  background: activeTab === 'history' ? '#0B1F3A' : '#F1F5F9',
                  color: activeTab === 'history' ? '#FFFFFF' : '#475569',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📋 Lecture Delivery History Log ({allLecturesList.length} Lectures)
              </button>
            </div>

            {activeTab === 'history' && (
              <input
                type="text"
                placeholder="Search lectures, topics covered, dates..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  minWidth: '260px'
                }}
              />
            )}
          </div>

          {/* Tab Content A: Units & Topics Section */}
          {activeTab === 'curriculum' ? (
            <div style={{ marginBottom: '16px' }}>
              {activeSubject.units && activeSubject.units.map((unit) => (
                <SyllabusUnitCard
                  key={unit.unitId}
                  unit={unit}
                  subjectId={activeSubject.subjectId}
                  subjectName={activeSubject.subjectName}
                  classId={activeSubject.classId}
                  onAddLecture={handleAddLecture}
                  onUndoLecture={handleUndoLecture}
                  onOpenAttendanceModal={handleOpenAttendanceModal}
                />
              ))}
            </div>
          ) : (
            /* Tab Content B: Complete Lecture History Log */
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0B1F3A' }}>
                  Delivered Lectures &amp; Topics Covered Log
                </h4>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Showing {filteredLectures.length} of {allLecturesList.length} total recorded lectures
                </span>
              </div>

              {filteredLectures.length === 0 ? (
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  color: '#64748B',
                  fontSize: '13px'
                }}>
                  No lectures found matching your filter. Click "+ Add Lecture" under any curriculum topic to record one.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 12px', width: '90px' }}>Lecture #</th>
                        <th style={{ padding: '10px 12px', width: '110px' }}>Date</th>
                        <th style={{ padding: '10px 12px', width: '160px' }}>Unit &amp; Topic</th>
                        <th style={{ padding: '10px 12px' }}>Topics Covered</th>
                        <th style={{ padding: '10px 12px', width: '130px', textAlign: 'center' }}>Attendance</th>
                        <th style={{ padding: '10px 12px', width: '130px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLectures.map((lec) => {
                        const isMarked = !!lec.attendanceMarked || lec.attendanceStatus === 'Marked';
                        const covered = Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0
                          ? lec.topicsCovered
                          : [lec.topicName];

                        return (
                          <tr key={lec.id || `${lec.topicId}-${lec.lectureNo}`} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                            <td style={{ padding: '12px', fontWeight: 800, color: '#0B1F3A' }}>
                              <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px' }}>
                                Lec {lec.lectureNo}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#475569' }}>
                              {lec.date}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 700, color: '#0B1F3A' }}>{lec.topicName}</div>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>{lec.unitName ? lec.unitName.split(':')[0] : 'Unit'}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {covered.map((tag, tIdx) => (
                                  <span key={tIdx} style={{
                                    background: '#F1F5F9',
                                    color: '#1E293B',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '12px',
                                    padding: '1px 7px',
                                    fontSize: '11px',
                                    fontWeight: 600
                                  }}>
                                    🏷️ {tag}
                                  </span>
                                ))}
                              </div>
                              {lec.notes && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                                  📝 {lec.notes}
                                </p>
                              )}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {isMarked ? (
                                <span style={{
                                  background: '#DCFCE7',
                                  color: '#15803D',
                                  border: '1px solid #86EFAC',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 800
                                }}>
                                  ✓ Marked
                                </span>
                              ) : (
                                <span style={{
                                  background: '#FEF3C7',
                                  color: '#B45309',
                                  border: '1px solid #FDE047',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}>
                                  Not Marked
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenAttendanceModal({
                                  ...lec,
                                  topicsCovered: covered
                                })}
                                style={{
                                  background: isMarked ? '#FFFFFF' : '#0B5CAD',
                                  color: isMarked ? '#0B5CAD' : '#FFFFFF',
                                  border: isMarked ? '1px solid #0B5CAD' : 'none',
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {isMarked ? 'View / Edit' : 'Mark Attendance'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* 4. Interactive Lecture Attendance Modal */}
      <LectureAttendanceModal
        isOpen={attendanceModal.isOpen}
        onClose={() => setAttendanceModal({ isOpen: false, lectureContext: null })}
        lectureContext={attendanceModal.lectureContext}
        onSaveAttendance={handleSaveAttendance}
      />
    </div>
  );
}
