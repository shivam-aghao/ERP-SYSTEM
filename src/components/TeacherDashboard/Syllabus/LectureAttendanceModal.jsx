import React, { useState, useEffect } from 'react';
import { getStudentsByClass } from '../../../data/mockTeacherData';

/**
 * LectureAttendanceModal.jsx
 * Interactive modal dialog for marking student attendance tied to a specific lecture.
 * Receives context (Subject, Topic, Lecture Number, Class, Date) and stores attendance records.
 */
export default function LectureAttendanceModal({
  isOpen,
  onClose,
  lectureContext,
  onSaveAttendance
}) {
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'swipe'
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !lectureContext) return;

    const classId = lectureContext.classId || "2R1";
    const roster = getStudentsByClass(classId);
    setStudents(roster);

    // If lecture already has previous records, initialize them
    const initial = {};
    if (Array.isArray(lectureContext.records) && lectureContext.records.length > 0) {
      lectureContext.records.forEach(r => {
        initial[r.rollNo] = r.status;
      });
    } else {
      // Default to null or present
      roster.forEach(st => {
        initial[st.rollNo] = null;
      });
    }

    setAttendanceMap(initial);
    setSwipeIndex(0);
  }, [isOpen, lectureContext]);

  if (!isOpen || !lectureContext) return null;

  const totalStudents = students.length;
  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length;
  const unmarkedCount = totalStudents - presentCount - absentCount;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const handleSetStatus = (rollNo, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [rollNo]: prev[rollNo] === status ? null : status
    }));
  };

  const handleMarkAll = (status) => {
    const next = {};
    students.forEach(st => {
      next[st.rollNo] = status;
    });
    setAttendanceMap(next);
  };

  const handleSwipeAction = (status) => {
    if (swipeIndex < students.length) {
      const current = students[swipeIndex];
      handleSetStatus(current.rollNo, status);
      setSwipeIndex(prev => Math.min(students.length - 1, prev + 1));
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    const records = students.map(st => ({
      studentId: st.id,
      rollNo: st.rollNo,
      name: st.name,
      status: attendanceMap[st.rollNo] || 'present'
    }));

    const attendancePayload = {
      lectureId: lectureContext.id,
      lectureNo: lectureContext.lectureNo,
      topicId: lectureContext.topicId,
      unitId: lectureContext.unitId,
      subjectId: lectureContext.subjectId,
      classId: lectureContext.classId,
      date: lectureContext.date,
      topicsCovered: lectureContext.topicsCovered || [],
      attendanceStatus: 'Marked',
      presentCount: records.filter(r => r.status === 'present').length,
      absentCount: records.filter(r => r.status === 'absent').length,
      records
    };

    onSaveAttendance(
      lectureContext.subjectId,
      lectureContext.unitId,
      lectureContext.topicId,
      lectureContext.id || lectureContext.lectureNo,
      attendancePayload
    );

    setSubmitting(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 31, 58, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}>
        {/* 1. Header */}
        <div style={{
          background: '#0B1F3A',
          color: '#FFFFFF',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: '#0B5CAD',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>
                LECTURE {lectureContext.lectureNo}
              </span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                Mark Lecture Attendance
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#94A3B8' }}>
              <strong>{lectureContext.subjectName || 'Subject'}</strong> • Topic: <strong>{lectureContext.topicName}</strong> • Class: <strong>{lectureContext.classId}</strong> • Date: <strong>{lectureContext.date}</strong>
            </p>
            {Array.isArray(lectureContext.topicsCovered) && lectureContext.topicsCovered.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>Topics Covered:</span>
                {lectureContext.topicsCovered.map((t, i) => (
                  <span key={i} style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    padding: '1px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    🏷️ {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* 2. Metrics & Controls Bar */}
        <div style={{
          background: '#F8FAFC',
          padding: '12px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12.5px', color: '#475569' }}>
              Enrolled: <strong style={{ color: '#0B1F3A' }}>{totalStudents}</strong>
            </span>
            <span style={{ fontSize: '12.5px', color: '#166534' }}>
              Present: <strong style={{ color: '#15803D' }}>{presentCount}</strong>
            </span>
            <span style={{ fontSize: '12.5px', color: '#991B1B' }}>
              Absent: <strong style={{ color: '#B91C1C' }}>{absentCount}</strong>
            </span>
            <span style={{ fontSize: '12.5px', color: '#0B5CAD' }}>
              Rate: <strong style={{ color: '#0B5CAD' }}>{attendanceRate}%</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleMarkAll('present')}
              style={{
                background: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✓ All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              style={{
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FCA5A5',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ All Absent
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'roster' ? 'swipe' : 'roster')}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {activeTab === 'roster' ? '📱 Swipe Mode' : '📋 Roster Mode'}
            </button>
          </div>
        </div>

        {/* 3. Body: Roster List or Swipe Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {activeTab === 'roster' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '12px' }}>
                  <th style={{ padding: '8px 10px', width: '70px' }}>Roll No</th>
                  <th style={{ padding: '8px 10px' }}>Student Name</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '180px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st, idx) => {
                  const status = attendanceMap[st.rollNo];
                  return (
                    <tr
                      key={st.id || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: status === 'present' ? '#F0FDF4' : (status === 'absent' ? '#FEF2F2' : '#FFFFFF')
                      }}
                    >
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: 700, color: '#0B1F3A' }}>
                        {st.rollFormatted || st.rollNo}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {st.name}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(st.rollNo, 'present')}
                            style={{
                              background: status === 'present' ? '#15803D' : '#F1F5F9',
                              color: status === 'present' ? '#FFFFFF' : '#475569',
                              border: status === 'present' ? 'none' : '1px solid #CBD5E1',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(st.rollNo, 'absent')}
                            style={{
                              background: status === 'absent' ? '#B91C1C' : '#F1F5F9',
                              color: status === 'absent' ? '#FFFFFF' : '#475569',
                              border: status === 'absent' ? 'none' : '1px solid #CBD5E1',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Swipe Card View */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              {students[swipeIndex] ? (
                <div style={{
                  background: '#F8FAFC',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '30px',
                  width: '320px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                    STUDENT {swipeIndex + 1} OF {students.length}
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#0B1F3A', margin: '10px 0 4px 0' }}>
                    {students[swipeIndex].rollFormatted || students[swipeIndex].rollNo}
                  </div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#334155' }}>
                    {students[swipeIndex].name}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => handleSwipeAction('absent')}
                      style={{
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwipeAction('present')}
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Present
                    </button>
                  </div>
                </div>
              ) : (
                <p>All cards swiped!</p>
              )}
            </div>
          )}
        </div>

        {/* 4. Footer */}
        <div style={{
          background: '#F8FAFC',
          padding: '14px 24px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            style={{
              background: '#0B5CAD',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 22px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(11, 92, 173, 0.3)'
            }}
          >
            {submitting ? 'Saving...' : `Save Attendance (${presentCount}/${totalStudents})`}
          </button>
        </div>
      </div>
    </div>
  );
}

