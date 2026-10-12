import React, { useState, useEffect } from 'react';
import {
  getStudentsByClass,
  submitAttendance
} from '../../../data/mockTeacherData';

export default function AttendanceMarkingPage({
  session = {
    subject: "Data Structures",
    classId: "2R1",
    date: new Date().toISOString().split('T')[0],
    timeSlot: "09:00 - 10:30 AM",
    room: "Room 201"
  },
  onBackToTimetable,
  onSubmitSuccess
}) {
  const [activeTab, setActiveTab] = useState('swipe'); // 'swipe' or 'roster'
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [cardIndex, setCardIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize students and records
  useEffect(() => {
    const list = getStudentsByClass(session.classId || "2R1");
    setStudents(list);

    // Check if session was already marked or has drafts
    const sessionKey = `${session.date}_${session.classId}_${session.subject}`;
    let prevRecords = {};
    try {
      const stored = localStorage.getItem('ssgmce_marked_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[sessionKey] && parsed[sessionKey].records) {
          parsed[sessionKey].records.forEach(r => {
            prevRecords[r.rollNo] = r.status;
          });
        }
      }
    } catch (_) {}

    const initial = {};
    list.forEach(st => {
      initial[st.rollNo] = prevRecords[st.rollNo] || null;
    });
    setAttendanceRecords(initial);
    setCardIndex(0);
  }, [session.classId, session.date, session.subject]);

  const toggleStudentStatus = (rollNo, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [rollNo]: prev[rollNo] === status ? null : status
    }));
  };

  const markAll = (status) => {
    const next = {};
    students.forEach(st => {
      next[st.rollNo] = status;
    });
    setAttendanceRecords(next);
  };

  const handleCardSwipe = (status) => {
    if (cardIndex < students.length) {
      const currentStudent = students[cardIndex];
      setAttendanceRecords(prev => ({
        ...prev,
        [currentStudent.rollNo]: status
      }));
      setCardIndex(prev => prev + 1);
    }
  };

  const totalStudents = students.length;
  const presentCount = Object.values(attendanceRecords).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter(s => s === 'absent').length;
  const markedCount = presentCount + absentCount;
  const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const handleSaveDraft = () => {
    const sessionKey = `${session.date}_${session.classId}_${session.subject}`;
    const draftPayload = {
      ...session,
      isDraft: true,
      records: students.map(st => ({
        rollNo: st.rollNo,
        status: attendanceRecords[st.rollNo] || null
      }))
    };

    try {
      const stored = JSON.parse(localStorage.getItem('ssgmce_marked_sessions') || '{}');
      stored[sessionKey] = draftPayload;
      localStorage.setItem('ssgmce_marked_sessions', JSON.stringify(stored));
    } catch (_) {}

    setToastMessage(`💾 Draft saved for ${session.subject} (${session.classId})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    const recordsArray = students.map(st => ({
      studentId: st.id,
      rollNo: st.rollNo,
      status: attendanceRecords[st.rollNo] || 'present'
    }));

    const result = submitAttendance({
      classId: session.classId,
      subject: session.subject,
      date: session.date,
      timeSlot: session.timeSlot,
      records: recordsArray
    });

    setToastMessage(`✅ Attendance marked successfully! ${presentCount}/${totalStudents} Present.`);

    setTimeout(() => {
      setSubmitting(false);
      if (onSubmitSuccess) onSubmitSuccess(result);
      if (onBackToTimetable) onBackToTimetable();
    }, 1200);
  };

  const currentStudent = students[cardIndex];

  return (
    <div className="attendance-marking-wrapper" style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0B1F3A',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 700,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* 1. TOP BAR: BACK BUTTON & BREADCRUMBS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onBackToTimetable}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              color: '#0B1F3A',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            &larr; Back to Timetable
          </button>

          {/* Breadcrumb: Timetable > [Subject] > [Class] > [Date] */}
          <nav style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              onClick={onBackToTimetable}
              style={{ color: '#0B5CAD', fontWeight: 700, cursor: 'pointer' }}
            >
              Timetable
            </span>
            <span>&gt;</span>
            <span style={{ color: '#0B1F3A', fontWeight: 700 }}>{session.subject}</span>
            <span>&gt;</span>
            <span style={{ color: '#0B5CAD', fontWeight: 700 }}>{session.classId}</span>
            <span>&gt;</span>
            <span>{session.date}</span>
          </nav>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSaveDraft}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              background: '#10B981',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)'
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </div>
      </div>

      {/* 2. CLASS CONTEXT HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%)',
        color: '#fff',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 14px rgba(11,31,58,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#10B981', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                Class {session.classId}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                CSE Department
              </span>
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800 }}>{session.subject}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#BAE6FD' }}>
              <span>📅 {session.date}</span>
              <span>•</span>
              <span>⏰ {session.timeSlot}</span>
              <span>•</span>
              <span>📍 {session.room}</span>
            </div>
          </div>

          {/* Live Attendance Rate Pill */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            padding: '12px 20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{percentage}%</div>
            <div style={{ fontSize: '11.5px', color: '#E0F2FE' }}>
              {presentCount} / {totalStudents} Present
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODE SWITCHER & QUICK ACTIONS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('swipe')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'swipe' ? '#fff' : 'transparent',
              fontWeight: 700,
              fontSize: '12.5px',
              color: activeTab === 'swipe' ? '#0B1F3A' : '#64748B',
              cursor: 'pointer',
              boxShadow: activeTab === 'swipe' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Swipe Card Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'roster' ? '#fff' : 'transparent',
              fontWeight: 700,
              fontSize: '12.5px',
              color: activeTab === 'roster' ? '#0B1F3A' : '#64748B',
              cursor: 'pointer',
              boxShadow: activeTab === 'roster' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Roster List Mode
          </button>
        </div>

        {/* Quick Bulk Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => markAll('present')}
            style={{
              background: '#F0FDF4',
              color: '#15803D',
              border: '1px solid #BBF7D0',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✓ Mark All Present
          </button>
          <button
            type="button"
            onClick={() => markAll('absent')}
            style={{
              background: '#FEF2F2',
              color: '#B91C1C',
              border: '1px solid #FECDD3',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Mark All Absent
          </button>
        </div>
      </div>

      {/* 4. MARKING INTERFACE */}
      {activeTab === 'swipe' ? (
        /* SWIPE CARD INTERFACE */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
          {cardIndex < totalStudents && currentStudent ? (
            <div style={{
              width: '360px',
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ background: '#0B5CAD', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                  ROLL {currentStudent.rollNo}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {cardIndex + 1} of {totalStudents}
                </span>
              </div>

              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#EFF6FF',
                color: '#0B5CAD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                fontSize: '24px',
                fontWeight: 800,
                border: '2px solid #BFDBFE'
              }}>
                {currentStudent.name.charAt(0)}
              </div>

              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#0B1F3A' }}>
                {currentStudent.name}
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#64748B' }}>
                {currentStudent.enrollmentNo} • {currentStudent.classCode}
              </p>

              {/* Current Status Badge */}
              <div style={{ marginBottom: '20px' }}>
                {attendanceRecords[currentStudent.rollNo] === 'present' && (
                  <span style={{ background: '#10B981', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
                    ✓ Marked Present
                  </span>
                )}
                {attendanceRecords[currentStudent.rollNo] === 'absent' && (
                  <span style={{ background: '#EF4444', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
                    ✕ Marked Absent
                  </span>
                )}
                {!attendanceRecords[currentStudent.rollNo] && (
                  <span style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                    Awaiting Decision
                  </span>
                )}
              </div>

              {/* Swipe Buttons (Present / Absent strictly) */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleCardSwipe('absent')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1.5px solid #EF4444',
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Absent (&larr;)
                </button>
                <button
                  type="button"
                  onClick={() => handleCardSwipe('present')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1.5px solid #10B981',
                    background: '#F0FDF4',
                    color: '#15803D',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Present (&rarr;)
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#F0FDF4',
              borderRadius: '16px',
              border: '1.5px solid #BBF7D0',
              maxWidth: '420px',
              width: '100%'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#166534', fontWeight: 800 }}>
                All Students Reviewed!
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#15803D' }}>
                {presentCount} Present • {absentCount} Absent
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCardIndex(0)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Review Again
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#10B981',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Submit Attendance
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ROSTER LIST INTERFACE */
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Roll No</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Student Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Enrollment</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Attendance Status (Present / Absent)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => {
                const status = attendanceRecords[st.rollNo];
                const isPresent = status === 'present';
                const isAbsent = status === 'absent';

                return (
                  <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '13px', color: '#0B1F3A' }}>
                      {st.rollNo}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                      {st.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                      {st.enrollmentNo}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(st.rollNo, 'present')}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            border: isPresent ? '1.5px solid #10B981' : '1px solid #CBD5E1',
                            background: isPresent ? '#10B981' : '#F0FDF4',
                            color: isPresent ? '#fff' : '#15803D'
                          }}
                        >
                          Present ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(st.rollNo, 'absent')}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            border: isAbsent ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                            background: isAbsent ? '#EF4444' : '#FEF2F2',
                            color: isAbsent ? '#fff' : '#B91C1C'
                          }}
                        >
                          Absent ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

