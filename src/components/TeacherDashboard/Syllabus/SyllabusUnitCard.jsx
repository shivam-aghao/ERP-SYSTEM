import React, { useState } from 'react';
import MarkCoveredButton from './MarkCoveredButton';

/**
 * SyllabusUnitCard.jsx
 * Renders each unit and its topics in the exact tabular format requested (Unit Name, Topic Name, Topic Description, No of Lect, Weightage, Weightage %, Status, Action).
 */
export default function SyllabusUnitCard({
  unit,
  subjectId,
  onMarkTopic,
  onUndoTopic
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const estimated = Number(unit.estimatedLectures || 0);
  const taken = Number(unit.lecturesTaken || 0);
  const progress = estimated > 0 ? Math.min(100, Math.round((taken / estimated) * 100)) : 0;
  const isCompleted = unit.status === 'Completed' || progress === 100;
  const isInProgress = unit.status === 'In Progress' || (progress > 0 && progress < 100);

  // Status badge styling
  let badgeStyle = { background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1' };
  if (isCompleted) {
    badgeStyle = { background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' };
  } else if (isInProgress) {
    badgeStyle = { background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE047' };
  }

  // Unit short title for table cells (e.g., "UNIT-I")
  const unitShortName = unit.unitName ? unit.unitName.split(':')[0].trim() : 'UNIT-I';

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
              {unit.topics?.length || 0} Topics • {taken} of {estimated} Lectures Delivered
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
            ...badgeStyle,
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800
          }}>
            {unit.status || 'Not Started'}
          </span>
        </div>
      </div>

      {/* 2. Topic Breakdown Table (Matches Attached PDF Specification) */}
      {isExpanded && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
            <thead>
              <tr style={{ background: '#FCE7F3', borderBottom: '1.5px solid #F472B6' }}>
                <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, color: '#831843', width: '100px' }}>
                  Unit Name
                </th>
                <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, color: '#831843', width: '220px' }}>
                  Topic Name
                </th>
                <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, color: '#831843' }}>
                  Topic Description
                </th>
                <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 800, color: '#831843', textAlign: 'center', width: '90px' }}>
                  No of Lect
                </th>
                <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 800, color: '#831843', textAlign: 'center', width: '90px' }}>
                  Weightage
                </th>
                <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 800, color: '#831843', textAlign: 'center', width: '100px' }}>
                  Weightage %
                </th>
                <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, color: '#831843', textAlign: 'center', width: '110px' }}>
                  Status
                </th>
                <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, color: '#831843', textAlign: 'center', width: '150px' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {unit.topics && unit.topics.map((topic, idx) => {
                const topicPlanned = Number(topic.noOfLectures || topic.estimatedLectures || 1);
                const topicTaken = Number(topic.lecturesTaken || 0);
                const topicCompleted = topic.status === 'Completed' || topicTaken >= topicPlanned;
                const topicInProgress = topic.status === 'In Progress' || (topicTaken > 0 && !topicCompleted);

                let statusBadge = { bg: '#F1F5F9', color: '#64748B', label: 'Not Started' };
                if (topicCompleted) {
                  statusBadge = { bg: '#DCFCE7', color: '#15803D', label: 'Completed' };
                } else if (topicInProgress) {
                  statusBadge = { bg: '#FEF3C7', color: '#B45309', label: 'In Progress' };
                }

                return (
                  <tr
                    key={topic.topicId || idx}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: topicCompleted ? '#F0FDF4' : (idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'),
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Unit Name */}
                    <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                      {unitShortName}
                    </td>

                    {/* Topic Name */}
                    <td style={{ padding: '10px 14px', fontSize: '12.5px', fontWeight: 700, color: '#0B1F3A' }}>
                      {topic.topicName}
                    </td>

                    {/* Topic Description */}
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                      {topic.topicDescription || '—'}
                    </td>

                    {/* No of Lectures */}
                    <td style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 700, textAlign: 'center', color: '#0B1F3A' }}>
                      {topicPlanned}
                    </td>

                    {/* Weightage */}
                    <td style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 600, textAlign: 'center', color: '#475569' }}>
                      {topic.weightage || 1}
                    </td>

                    {/* Weightage % */}
                    <td style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: 700, textAlign: 'center', color: '#0B5CAD' }}>
                      {topic.weightagePercent ? `${topic.weightagePercent}%` : '—'}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-block'
                      }}>
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Action Button: Mark as Covered & Undo */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <MarkCoveredButton
                        topic={topic}
                        unitId={unit.unitId}
                        subjectId={subjectId}
                        onMark={onMarkTopic}
                        onUndo={onUndoTopic}
                      />
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

