import React, { useState } from 'react';
import SyllabusTopicCard from './SyllabusTopicCard';

/**
 * SyllabusUnitCard.jsx
 * Unit Container Card rendering Unit Header with progress and collapsible topics.
 * Each topic is rendered using SyllabusTopicCard with lecture delivery and attendance support.
 */
export default function SyllabusUnitCard({
  unit,
  subjectId,
  subjectName,
  classId = "2R1",
  onAddLecture,
  onUndoLecture,
  onOpenAttendanceModal
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute unit totals based on topic lectures
  let unitPlanned = 0;
  let unitEngaged = 0;
  (unit.topics || []).forEach(t => {
    unitPlanned += Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 0);
    const lecs = Array.isArray(t.lectures) ? t.lectures.length : Number(t.engagedLectures || t.lecturesTaken || 0);
    unitEngaged += lecs;
  });

  const progress = unitPlanned > 0 ? Math.min(100, Math.round((unitEngaged / unitPlanned) * 100)) : 0;
  const isCompleted = progress >= 100;
  const isInProgress = progress > 0 && !isCompleted;

  let badgeStyle = { background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', label: 'Not Started' };
  if (isCompleted) {
    badgeStyle = { background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', label: 'Completed' };
  } else if (isInProgress) {
    badgeStyle = { background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE047', label: 'In Progress' };
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      marginBottom: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
    }}>
      {/* 1. Unit Header Banner */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: '#F8FAFC',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '14px',
            color: '#64748B',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block'
          }}>
            ▶
          </span>
          <div>
            <h4 style={{ margin: '0 0 3px 0', fontSize: '15px', fontWeight: 800, color: '#0B1F3A' }}>
              {unit.unitName}
            </h4>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {unit.topics?.length || 0} Topics • {unitEngaged} of {unitPlanned} Lectures Engaged
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Progress bar */}
          <div style={{ width: '130px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: isCompleted ? '#10B981' : (isInProgress ? '#0B5CAD' : '#94A3B8'),
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <span style={{
            background: badgeStyle.background,
            color: badgeStyle.color,
            border: badgeStyle.border,
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800
          }}>
            {badgeStyle.label}
          </span>
        </div>
      </div>

      {/* 2. Topic Cards List */}
      {isExpanded && (
        <div style={{ padding: '16px 20px', background: '#FAFAFA' }}>
          {unit.topics && unit.topics.map((topic, idx) => (
            <SyllabusTopicCard
              key={topic.topicId || idx}
              topic={topic}
              unitId={unit.unitId}
              unitName={unit.unitName}
              subjectId={subjectId}
              subjectName={subjectName}
              classId={classId}
              onAddLecture={onAddLecture}
              onUndoLecture={onUndoLecture}
              onOpenAttendanceModal={onOpenAttendanceModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
