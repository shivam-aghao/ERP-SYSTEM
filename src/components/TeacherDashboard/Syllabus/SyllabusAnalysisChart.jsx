import React from 'react';

/**
 * SyllabusAnalysisChart.jsx
 * Displays top-level syllabus analysis card:
 * - Total Planned Lectures, Total Engaged Lectures, Remaining Lectures
 * - Coverage Percentage and Pace Status ("On Track" / "Behind Schedule")
 * - Donut / Circular Progress indicator
 * - Unit-wise and Topic-wise progress breakdown bars
 */
export default function SyllabusAnalysisChart({ subject, onDownloadReport }) {
  if (!subject) return null;

  let totalPlanned = 0;
  let totalEngaged = 0;
  const unitBreakdown = [];
  const topicBreakdown = [];

  (subject.units || []).forEach(unit => {
    let uPlanned = 0;
    let uEngaged = 0;

    (unit.topics || []).forEach(t => {
      const p = Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 0);
      const e = Array.isArray(t.lectures)
        ? t.lectures.length
        : Number(t.engagedLectures || t.lecturesTaken || 0);
      uPlanned += p;
      uEngaged += e;

      const tProgress = p > 0 ? Math.min(100, Math.round((e / p) * 100)) : 0;
      topicBreakdown.push({
        topicId: t.topicId,
        topicName: t.topicName,
        unitName: unit.unitName ? unit.unitName.split(':')[0] : 'Unit',
        planned: p,
        engaged: e,
        progress: tProgress,
        status: t.status || (tProgress >= 100 ? 'Completed' : (e > 0 ? 'In Progress' : 'Not Started'))
      });
    });

    const uProgress = uPlanned > 0 ? Math.min(100, Math.round((uEngaged / uPlanned) * 100)) : 0;
    unitBreakdown.push({
      unitId: unit.unitId,
      unitName: unit.unitName,
      planned: uPlanned,
      engaged: uEngaged,
      progress: uProgress
    });

    totalPlanned += uPlanned;
    totalEngaged += uEngaged;
  });

  totalPlanned = totalPlanned || Number(subject.totalLecturesPlanned || 60);
  const remaining = Math.max(0, totalPlanned - totalEngaged);
  const coveragePercent = totalPlanned > 0 ? Math.min(100, Math.round((totalEngaged / totalPlanned) * 100)) : 0;

  // Status calculation: On Track if >= 45% of planned lectures delivered
  const isOnTrack = coveragePercent >= 45;
  const statusLabel = isOnTrack ? 'On Track' : 'Behind Schedule';

  // Circular Donut Progress
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (coveragePercent / 100) * circumference;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '14px',
      padding: '22px 26px',
      marginBottom: '22px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
    }}>
      {/* Title & Action Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0B1F3A' }}>
              Syllabus Coverage &amp; Lecture Delivery Analysis
            </h3>
            <span style={{
              background: isOnTrack ? '#DCFCE7' : '#FEF3C7',
              color: isOnTrack ? '#15803D' : '#B45309',
              border: isOnTrack ? '1px solid #86EFAC' : '1px solid #FDE047',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              ● {statusLabel}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Subject: <strong style={{ color: '#0B1F3A' }}>{subject.subjectName}</strong> ({subject.subjectCode || 'CS302'}) • Class: <strong style={{ color: '#0B1F3A' }}>{subject.classId}</strong>
          </p>
        </div>

        {onDownloadReport && (
          <button
            type="button"
            onClick={onDownloadReport}
            style={{
              background: '#F8FAFC',
              color: '#0B5CAD',
              border: '1px solid #CBD5E1',
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📥 Download Syllabus Report (CSV)
          </button>
        )}
      </div>

      {/* Main Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Metric 1: Donut Circular Chart */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 16px',
          background: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#E2E8F0"
                strokeWidth="11"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke={isOnTrack ? '#10B981' : '#F59E0B'}
                strokeWidth="11"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 800,
              color: '#0B1F3A'
            }}>
              {coveragePercent}%
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Coverage
            </span>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0B1F3A' }}>
              {coveragePercent}% Completed
            </div>
            <span style={{ fontSize: '11px', color: isOnTrack ? '#15803D' : '#B45309', fontWeight: 600 }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Metric 2: Planned Lectures */}
        <div style={{
          padding: '14px 16px',
          background: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Total Planned Lectures
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0B1F3A', marginTop: '2px' }}>
            {totalPlanned}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Per academic syllabus
          </span>
        </div>

        {/* Metric 3: Engaged Lectures */}
        <div style={{
          padding: '14px 16px',
          background: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Lectures Engaged
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0B5CAD', marginTop: '2px' }}>
            {totalEngaged}
          </div>
          <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 600 }}>
            Delivered &amp; tracked
          </span>
        </div>

        {/* Metric 4: Remaining Lectures */}
        <div style={{
          padding: '14px 16px',
          background: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Remaining Lectures
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: remaining > 0 ? '#B45309' : '#10B981', marginTop: '2px' }}>
            {remaining}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            {remaining === 0 ? 'Syllabus finished!' : 'To be conducted'}
          </span>
        </div>
      </div>

      {/* Unit-Wise Breakdown */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
          Unit-wise Delivery Breakdown
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {unitBreakdown.map((u, i) => (
            <div
              key={u.unitId || i}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0B1F3A', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.unitName.split(':')[0] || `Unit ${i+1}`}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: u.progress >= 100 ? '#10B981' : '#0B5CAD' }}>
                  {u.engaged}/{u.planned} ({u.progress}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${u.progress}%`,
                  height: '100%',
                  background: u.progress >= 100 ? '#10B981' : (u.progress > 0 ? '#0B5CAD' : '#94A3B8'),
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
