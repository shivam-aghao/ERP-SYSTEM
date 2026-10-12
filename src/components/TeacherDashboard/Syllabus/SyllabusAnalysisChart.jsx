import React from 'react';

/**
 * SyllabusAnalysisChart.jsx
 * Displays visual Donut chart, key metric summary cards, pace calculation, and export report option.
 */
export default function SyllabusAnalysisChart({ subject, onDownloadReport }) {
  if (!subject) return null;

  const totalPlanned = Number(subject.totalLecturesPlanned || 60);
  const totalTaken = Number(subject.totalLecturesTaken || 0);
  const remaining = Math.max(0, totalPlanned - totalTaken);
  const coveragePercent = totalPlanned > 0 ? Math.min(100, Math.round((totalTaken / totalPlanned) * 100)) : 0;

  // Pace status calculation (Assuming a standard mid-semester target of 50-60%)
  const isOnTrack = coveragePercent >= 55;

  // Calculate estimated completion date based on standard 4 lectures/week pace
  const calculateEstimatedCompletion = () => {
    if (remaining === 0) return "Syllabus Completed!";
    const weeksNeeded = Math.ceil(remaining / 4);
    const date = new Date();
    date.setDate(date.getDate() + (weeksNeeded * 7));
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Donut SVG parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (coveragePercent / 100) * circumference;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '20px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0B1F3A' }}>
            Syllabus Coverage Analytics &amp; Delivery Pace
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B' }}>
            Subject: <strong>{subject.subjectName}</strong> ({subject.subjectCode || 'CS302'}) • Class {subject.classId}
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
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            📥 Download Syllabus Report (CSV)
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        alignItems: 'center'
      }}>
        {/* 1. Donut Chart Visual */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px',
          background: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Circle */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="#E2E8F0"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Progress Circle */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={coveragePercent >= 75 ? '#10B981' : (coveragePercent >= 40 ? '#0B5CAD' : '#F59E0B')}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#0B1F3A', display: 'block', lineHeight: 1 }}>
                {coveragePercent}%
              </span>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Covered</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              <span style={{ fontSize: '12px', color: '#334155' }}>Covered: <strong>{totalTaken} hrs</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }}></span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Remaining: <strong>{remaining} hrs</strong></span>
            </div>
          </div>
        </div>

        {/* 2. Total & Taken Lectures Card */}
        <div style={{
          padding: '14px 18px',
          background: '#EFF6FF',
          borderRadius: '10px',
          border: '1px solid #BFDBFE'
        }}>
          <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            LECTURES ENGAGED
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E3A8A' }}>
            {totalTaken} <span style={{ fontSize: '14px', fontWeight: 600, color: '#3B82F6' }}>/ {totalPlanned}</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#2563EB', marginTop: '2px', display: 'block' }}>
            {totalPlanned - remaining} completed as scheduled
          </span>
        </div>

        {/* 3. Pending Lectures Card */}
        <div style={{
          padding: '14px 18px',
          background: '#FEF9C3',
          borderRadius: '10px',
          border: '1px solid #FDE047'
        }}>
          <span style={{ fontSize: '12px', color: '#854D0E', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            PENDING LECTURES
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#713F12' }}>
            {remaining} <span style={{ fontSize: '14px', fontWeight: 600, color: '#A16207' }}>Hrs Left</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#A16207', marginTop: '2px', display: 'block' }}>
            Required to conclude term
          </span>
        </div>

        {/* 4. Pace & Completion Date Card */}
        <div style={{
          padding: '14px 18px',
          background: isOnTrack ? '#F0FDF4' : '#FFF7ED',
          borderRadius: '10px',
          border: isOnTrack ? '1px solid #BBF7D0' : '1px solid #FED7AA'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: isOnTrack ? '#15803D' : '#C2410C', fontWeight: 700 }}>
              CURRICULUM PACE
            </span>
            <span style={{
              background: isOnTrack ? '#10B981' : '#F97316',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px'
            }}>
              {isOnTrack ? '✓ On Track' : '⚠ Behind Schedule'}
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: isOnTrack ? '#14532D' : '#9A3412', marginTop: '4px' }}>
            Est. End: {calculateEstimatedCompletion()}
          </div>
          <span style={{ fontSize: '11.5px', color: isOnTrack ? '#166534' : '#C2410C', marginTop: '2px', display: 'block' }}>
            Based on ~4 weekly lecture slots
          </span>
        </div>
      </div>
    </div>
  );
}

