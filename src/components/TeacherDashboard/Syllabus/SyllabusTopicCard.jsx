import React, { useState } from 'react';
import AddLectureModal from './AddLectureModal';

/**
 * SyllabusTopicCard.jsx
 * Component representing a single syllabus topic, its lecture delivery count,
 * individual lecture sessions with topics covered tags, "+ Add Lecture" modal trigger,
 * and lecture-level attendance marking triggers.
 */
export default function SyllabusTopicCard({
  topic,
  unitId,
  unitName,
  subjectId,
  subjectName,
  classId = "2R1",
  onAddLecture,
  onUndoLecture,
  onOpenAttendanceModal
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const planned = Number(topic.plannedLectures || topic.noOfLectures || topic.estimatedLectures || 1);
  const lectures = Array.isArray(topic.lectures) ? topic.lectures : [];
  const engaged = lectures.length || Number(topic.engagedLectures || topic.lecturesTaken || 0);

  const isCompleted = topic.status === 'Completed' || engaged >= planned;
  const isInProgress = topic.status === 'In Progress' || (engaged > 0 && !isCompleted);
  const progressPercent = planned > 0 ? Math.min(100, Math.round((engaged / planned) * 100)) : 0;

  // Status badge styling
  let statusBadge = { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1', label: 'Not Started' };
  if (isCompleted) {
    statusBadge = { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', label: 'Completed' };
  } else if (isInProgress) {
    statusBadge = { bg: '#FEF3C7', color: '#B45309', border: '#FDE047', label: 'In Progress' };
  }

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Today';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  };

  const handleLectureAdded = (subId, uId, topId, lecturePayload) => {
    if (typeof onAddLecture === 'function') {
      onAddLecture(subId, uId, topId, lecturePayload);
    }
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '10px',
      padding: '16px 18px',
      marginBottom: '14px',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
    }}>
      {/* 1. Header: Topic Name, Status & Action Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '10px'
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#0B1F3A' }}>
              {topic.topicName}
            </h4>
            <span style={{
              background: statusBadge.bg,
              color: statusBadge.color,
              border: `1px solid ${statusBadge.border}`,
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {statusBadge.label}
            </span>
          </div>
          {topic.topicDescription && (
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
              {topic.topicDescription}
            </p>
          )}
        </div>

        {/* Action Controls: Add Lecture Modal Trigger & Undo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: '#0B5CAD',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(11, 92, 173, 0.2)',
              transition: 'background-color 0.15s ease'
            }}
          >
            + Add Lecture
          </button>

          {engaged > 0 && (
            <button
              type="button"
              onClick={() => onUndoLecture(subjectId, unitId, topic.topicId)}
              title="Remove last recorded lecture"
              style={{
                background: '#F8FAFC',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ↩ Undo
            </button>
          )}
        </div>
      </div>

      {/* 2. Topic Progress Summary */}
      <div style={{
        background: '#F8FAFC',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#475569' }}>
            Lectures Engaged: <strong style={{ color: '#0B1F3A' }}>{engaged}</strong> of <strong style={{ color: '#0B1F3A' }}>{planned}</strong> planned
          </span>
          <span style={{ fontSize: '12px', color: '#475569' }}>
            Coverage: <strong style={{ color: isCompleted ? '#10B981' : '#0B5CAD' }}>{progressPercent}%</strong>
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '180px', height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: isCompleted ? '#10B981' : (isInProgress ? '#0B5CAD' : '#94A3B8'),
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* 3. Lectures List & Attendance Tracking */}
      <div style={{ marginTop: '10px' }}>
        <h5 style={{
          margin: '0 0 8px 0',
          fontSize: '12px',
          fontWeight: 700,
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Engaged Lectures &amp; Topics Covered ({lectures.length})
        </h5>

        {lectures.length === 0 ? (
          <div style={{
            padding: '14px',
            background: '#FAFAFA',
            border: '1px dashed #CBD5E1',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748B'
          }}>
            No lectures recorded for this topic yet. Click <strong>+ Add Lecture</strong> after conducting your class to specify topics covered and mark attendance.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '10px'
          }}>
            {lectures.map((lec) => {
              const isMarked = !!lec.attendanceMarked || lec.attendanceStatus === 'Marked';
              const coveredList = Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0
                ? lec.topicsCovered
                : (lec.topicsCovered ? [String(lec.topicsCovered)] : [topic.topicName]);

              return (
                <div
                  key={lec.id || lec.lectureNo}
                  style={{
                    background: isMarked ? '#F0FDF4' : '#FFFBEB',
                    border: isMarked ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    {/* Top row: Lecture No & Attendance Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isMarked ? '#166534' : '#92400E'
                      }}>
                        Lecture {lec.lectureNo}
                      </span>
                      {isMarked ? (
                        <span style={{
                          background: '#DCFCE7',
                          color: '#15803D',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '1px 8px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          ✓ Marked
                        </span>
                      ) : (
                        <span style={{
                          background: '#FEF3C7',
                          color: '#B45309',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '1px 8px',
                          borderRadius: '10px'
                        }}>
                          Not Marked
                        </span>
                      )}
                    </div>

                    {/* Date and Time Slot */}
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '8px' }}>
                      📅 {formatDate(lec.date)} {lec.timeSlot ? `• ${lec.timeSlot}` : ''}
                    </div>

                    {/* Topics Covered Tag Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                      {coveredList.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #BFDBFE',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            lineHeight: 1.3
                          }}
                        >
                          🏷️ {tag}
                        </span>
                      ))}
                    </div>

                    {/* Lecture Notes if present */}
                    {lec.notes && (
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '11px',
                        color: '#475569',
                        fontStyle: 'italic',
                        lineHeight: 1.3
                      }}>
                        📝 {lec.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom: Mark Attendance Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px', borderTop: isMarked ? '1px solid #DCFCE7' : '1px solid #FEF3C7' }}>
                    <button
                      type="button"
                      onClick={() => onOpenAttendanceModal({
                        ...lec,
                        topicId: topic.topicId,
                        topicName: topic.topicName,
                        unitId,
                        unitName,
                        subjectId,
                        subjectName,
                        classId,
                        topicsCovered: coveredList
                      })}
                      style={{
                        background: isMarked ? '#FFFFFF' : '#0B5CAD',
                        color: isMarked ? '#0B5CAD' : '#FFFFFF',
                        border: isMarked ? '1px solid #0B5CAD' : 'none',
                        padding: '5px 12px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isMarked ? 'none' : '0 1px 3px rgba(11, 92, 173, 0.25)'
                      }}
                    >
                      {isMarked ? 'View / Edit Attendance' : 'Mark Attendance'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Lecture Modal Dialog */}
      <AddLectureModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        topicContext={{
          subjectId,
          subjectName,
          classId,
          unitId,
          unitName,
          topicId: topic.topicId,
          topicName: topic.topicName,
          topicDescription: topic.topicDescription,
          plannedLectures: planned,
          engagedLectures: engaged,
          nextLectureNo: lectures.length + 1
        }}
        onAddLecture={handleLectureAdded}
      />
    </div>
  );
}
