import React from 'react';

/**
 * MarkCoveredButton.jsx
 * Reusable action button for marking topics as covered and providing undo capability.
 */
export default function MarkCoveredButton({
  topic,
  unitId,
  subjectId,
  onMark,
  onUndo
}) {
  const isCompleted = topic.status === 'Completed';
  const isInProgress = topic.status === 'In Progress';
  const planned = topic.noOfLectures || topic.estimatedLectures || 1;
  const taken = topic.lecturesTaken || 0;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {isCompleted ? (
        <>
          <span style={{
            background: '#F0FDF4',
            color: '#15803D',
            border: '1px solid #BBF7D0',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ✓ Covered ({taken}/{planned})
          </span>
          <button
            type="button"
            onClick={() => onUndo(subjectId, unitId, topic.topicId, 1)}
            title="Undo last lecture marked"
            style={{
              background: '#F1F5F9',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Undo
          </button>
        </>
      ) : isInProgress ? (
        <>
          <button
            type="button"
            onClick={() => onMark(subjectId, unitId, topic.topicId, 1)}
            style={{
              background: '#FEF3C7',
              color: '#B45309',
              border: '1.5px solid #F59E0B',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 3px rgba(245, 158, 11, 0.2)'
            }}
          >
            +1 Lecture ({taken}/{planned})
          </button>
          <button
            type="button"
            onClick={() => onUndo(subjectId, unitId, topic.topicId, 1)}
            title="Undo last lecture marked"
            style={{
              background: '#F1F5F9',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Undo
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => onMark(subjectId, unitId, topic.topicId, 1)}
          style={{
            background: '#0B5CAD',
            color: '#FFFFFF',
            border: 'none',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(11, 92, 173, 0.25)',
            transition: 'background-color 0.15s ease'
          }}
        >
          Mark as Covered
        </button>
      )}
    </div>
  );
}
