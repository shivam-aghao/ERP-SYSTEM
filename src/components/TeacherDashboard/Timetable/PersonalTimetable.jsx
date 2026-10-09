import React, { useState, useEffect } from 'react';
import {
  mockTeacherData,
  getFacultyTimetable,
  isClassInFuture,
  isSessionMarked
} from '../../../data/mockTeacherData';

const TIME_SLOTS = [
  "09:00 - 10:30 AM",
  "11:00 - 12:30 PM",
  "01:15 - 02:15 PM",
  "02:15 - 03:15 PM"
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function PersonalTimetable({ facultyId = "EMP-CSE-1001", onSelectClass }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [markedSessions, setMarkedSessions] = useState({});

  const teacher = mockTeacherData.teachers.find(t => t.empCode === facultyId) || mockTeacherData.teachers[0];
  const todayISO = new Date().toISOString().split('T')[0];

  // Load marked sessions from localStorage on mount & listen to changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ssgmce_marked_sessions');
      if (stored) {
        setMarkedSessions(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  // Compute ISO date for each day row in active week
  const getDateForDay = (dayName) => {
    const d = new Date(selectedDate);
    const currentDay = d.getDay(); // 0 is Sunday, 1 is Monday ...
    const distanceToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
    const monday = new Date(d);
    monday.setDate(d.getDate() + distanceToMonday);

    const targetIdx = DAYS.indexOf(dayName);
    if (targetIdx === -1) return selectedDate;

    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + targetIdx);
    return targetDate.toISOString().split('T')[0];
  };

  const timetableEntries = getFacultyTimetable(facultyId);

  const handleSlotClick = (slot, slotDate) => {
    const future = isClassInFuture(slotDate, slot.timeSlot);
    if (future) {
      alert("Cannot mark attendance for future classes.");
      return;
    }

    if (onSelectClass) {
      onSelectClass({
        subject: slot.subject,
        classId: slot.classId,
        date: slotDate,
        timeSlot: slot.timeSlot,
        room: slot.room,
        isLab: slot.isLab
      });
    }
  };

  return (
    <div className="personal-timetable-container" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* 1. Locked Personal Faculty Header Strip */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%)',
        color: '#fff',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '18px',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            {teacher.name.charAt(4) || 'T'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{teacher.name}</h3>
              <span style={{ background: '#10B981', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {teacher.empCode}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#E0F2FE', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                {teacher.title}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#BAE6FD' }}>
              {teacher.department} • Weekly Load: <strong>{teacher.totalLoad} Hours</strong>
            </p>
          </div>
        </div>

        {/* Locked Personal Timetable Badge (No faculty switcher) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ✓ Personal Timetable • {teacher.empCode}
          </span>
        </div>
      </div>

      {/* 2. Controls Toolbar: Date Filter & Today Button */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#FAFAFA'
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#0B1F3A', fontWeight: 700 }}>
            Personal Lecture &amp; Lab Timetable
          </h4>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Click on any lecture block to mark or view attendance
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#0B1F3A' }}>View Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px'
            }}
          />
          <button
            type="button"
            onClick={() => setSelectedDate(todayISO)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #0B5CAD',
              background: selectedDate === todayISO ? '#0B5CAD' : '#fff',
              color: selectedDate === todayISO ? '#fff' : '#0B5CAD',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* 3. Timetable Grid */}
      <div style={{ overflowX: 'auto', padding: '16px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
          <thead>
            <tr>
              <th style={{
                background: '#0B1F3A',
                color: '#fff',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '12.5px',
                fontWeight: 700,
                width: '120px'
              }}>
                Day
              </th>
              {TIME_SLOTS.map((slot) => (
                <th key={slot} style={{
                  background: '#0B1F3A',
                  color: '#fff',
                  padding: '12px 14px',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: 700
                }}>
                  {slot}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const rowDate = getDateForDay(day);
              const isTodayRow = (rowDate === todayISO);

              return (
                <tr
                  key={day}
                  style={{
                    background: isTodayRow ? '#EFF6FF' : '#fff',
                    borderBottom: '1px solid #E2E8F0'
                  }}
                >
                  {/* Day Header Column */}
                  <td style={{
                    padding: '14px',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: '#0B1F3A',
                    background: isTodayRow ? '#DBEAFE' : '#F8FAFC',
                    borderLeft: isTodayRow ? '4px solid #0B5CAD' : 'none'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>{day}</span>
                      {isTodayRow && (
                        <span style={{
                          background: '#059669',
                          color: '#fff',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          width: 'fit-content'
                        }}>
                          TODAY
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Slot Cells */}
                  {TIME_SLOTS.map((timeSlot) => {
                    const entry = timetableEntries.find(
                      (e) => e.day.toLowerCase() === day.toLowerCase() && e.timeSlot === timeSlot
                    );

                    if (!entry) {
                      return (
                        <td
                          key={timeSlot}
                          style={{
                            padding: '10px',
                            background: isTodayRow ? '#F8FAFC' : '#FCFCFC',
                            textAlign: 'center',
                            color: '#94A3B8',
                            fontSize: '12px',
                            fontStyle: 'italic'
                          }}
                        >
                          Off / Prep
                        </td>
                      );
                    }

                    // Check status
                    const sessionKey = `${rowDate}_${entry.classId}_${entry.subject}`;
                    const isCompleted = Boolean(isSessionMarked(sessionKey) || markedSessions[sessionKey]);
                    const isFuture = isClassInFuture(rowDate, timeSlot);
                    const isPending = !isCompleted && !isFuture;

                    if (isFuture) {
                      return (
                        <td key={timeSlot} style={{ padding: '8px' }}>
                          <div
                            title="Cannot mark attendance for future classes"
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderLeft: '4px solid #94A3B8',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              opacity: 0.65,
                              cursor: 'not-allowed'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>{entry.subject}</span>
                              <span style={{ background: '#E2E8F0', color: '#64748B', fontSize: '9.5px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                Upcoming
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
                              <span>({entry.room})</span>
                              <span style={{ fontWeight: 700 }}>{entry.classId}</span>
                            </div>
                            <div style={{ marginTop: '4px', fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>
                              Cannot mark ahead
                            </div>
                          </div>
                        </td>
                      );
                    }

                    if (isCompleted) {
                      return (
                        <td key={timeSlot} style={{ padding: '8px' }}>
                          <div
                            onClick={() => handleSlotClick(entry, rowDate)}
                            title="Attendance already submitted. Click to view or edit roster."
                            style={{
                              background: '#F0FDF4',
                              border: '1.5px solid #BBF7D0',
                              borderLeft: '4px solid #10B981',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(16,185,129,0.12)',
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: '#14532D' }}>{entry.subject}</span>
                              <span style={{ background: '#10B981', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                ✓ Completed
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#15803D' }}>
                              <span>({entry.room})</span>
                              <span style={{ fontWeight: 700, color: '#166534' }}>{entry.classId}</span>
                            </div>
                            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                              <span style={{ color: '#15803D', fontWeight: 600 }}>Attendance Recorded</span>
                              <span style={{ color: '#047857', fontWeight: 800 }}>View &rarr;</span>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Pending
                    return (
                      <td key={timeSlot} style={{ padding: '8px' }}>
                        <div
                          onClick={() => handleSlotClick(entry, rowDate)}
                          title="Attendance pending! Click to mark attendance immediately."
                          style={{
                            background: '#FEFCE8',
                            border: '1.5px solid #FDE047',
                            borderLeft: '4px solid #F59E0B',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(245,158,11,0.15)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#854D0E' }}>{entry.subject}</span>
                            <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE047', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              🟡 Pending
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#92400E' }}>
                            <span>({entry.room})</span>
                            <span style={{ fontWeight: 700, color: '#B45309' }}>{entry.classId}</span>
                          </div>
                          <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span style={{ color: '#B45309', fontWeight: 700 }}>Click to Mark</span>
                            <span style={{ color: '#D97706', fontWeight: 800 }}>Mark &rarr;</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Legend Bar */}
      <div style={{
        padding: '12px 24px',
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FEFCE8', border: '1px solid #FDE047', borderLeft: '3px solid #F59E0B', display: 'inline-block' }}></span>
            <span style={{ fontWeight: 600, color: '#854D0E' }}>Attendance Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderLeft: '3px solid #10B981', display: 'inline-block' }}></span>
            <span style={{ fontWeight: 600, color: '#14532D' }}>Attendance Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderLeft: '3px solid #94A3B8', display: 'inline-block' }}></span>
            <span style={{ color: '#64748B' }}>Upcoming (Future)</span>
          </div>
        </div>
        <div style={{ color: '#64748B', fontSize: '11.5px' }}>
          Break: 1:00 PM – 1:15 PM • Recess: 3:15 PM – 3:45 PM
        </div>
      </div>
    </div>
  );
}

