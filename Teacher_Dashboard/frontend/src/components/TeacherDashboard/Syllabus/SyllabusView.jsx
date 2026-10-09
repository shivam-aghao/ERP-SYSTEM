import React, { useState, useEffect } from 'react';
import {
  getSyllabusForFaculty,
  getSubjectSyllabus,
  markTopicCovered,
  undoTopicCovered,
  saveSyllabusData
} from '../../../data/mockTeacherData';
import SyllabusAnalysisChart from './SyllabusAnalysisChart';
import SyllabusUnitCard from './SyllabusUnitCard';

/**
 * SyllabusView.jsx
 * Main container for Syllabus Coverage Tracking System.
 * Supports multi-subject selector, live analytics, unit & topic tracking, and report exports.
 */
export default function SyllabusView({ facultyId = "EMP-CSE-1001" }) {
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [activeSubject, setActiveSubject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load faculty's subjects on mount or facultyId change
  useEffect(() => {
    const list = getSyllabusForFaculty(facultyId);
    setFacultySubjects(list);
    if (list.length > 0) {
      const initialId = list[0].subjectId;
      setSelectedSubjectId(initialId);
      setActiveSubject(list[0]);
    }
  }, [facultyId]);

  // When selectedSubjectId changes, load subject details
  const handleSelectSubject = (subjectId) => {
    setSelectedSubjectId(subjectId);
    const sub = getSubjectSyllabus(subjectId);
    setActiveSubject(sub);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Mark topic covered handler
  const handleMarkTopic = (subjectId, unitId, topicId, count = 1) => {
    const updated = markTopicCovered(subjectId, unitId, topicId, count);
    if (updated) {
      setActiveSubject(updated);
      setFacultySubjects(prev => prev.map(s => s.subjectId === subjectId ? updated : s));
      showToast("✓ Topic marked as covered. Progress updated.");
    }
  };

  // Undo topic handler
  const handleUndoTopic = (subjectId, unitId, topicId, count = 1) => {
    const updated = undoTopicCovered(subjectId, unitId, topicId, count);
    if (updated) {
      setActiveSubject(updated);
      setFacultySubjects(prev => prev.map(s => s.subjectId === subjectId ? updated : s));
      showToast("↩ Topic coverage reverted. Progress updated.");
    }
  };

  // CSV Report Generator
  const handleDownloadReport = () => {
    if (!activeSubject) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Subject Name,${activeSubject.subjectName}\n`;
    csvContent += `Class,${activeSubject.classId}\n`;
    csvContent += `Faculty Name,${activeSubject.facultyName || 'Faculty'}\n`;
    csvContent += `Total Planned Lectures,${activeSubject.totalLecturesPlanned}\n`;
    csvContent += `Total Lectures Taken,${activeSubject.totalLecturesTaken}\n`;
    csvContent += `Overall Coverage,${activeSubject.progress}%\n\n`;

    csvContent += "Unit Name,Topic Name,Topic Description,No of Lect,Lectures Taken,Weightage,Weightage %,Status\n";

    activeSubject.units?.forEach(unit => {
      unit.topics?.forEach(topic => {
        const uName = `"${unit.unitName.replace(/"/g, '""')}"`;
        const tName = `"${topic.topicName.replace(/"/g, '""')}"`;
        const tDesc = `"${(topic.topicDescription || '').replace(/"/g, '""')}"`;
        const planned = topic.noOfLectures || topic.estimatedLectures || 1;
        const taken = topic.lecturesTaken || 0;
        const weightage = topic.weightage || 1;
        const wtPct = topic.weightagePercent ? `${topic.weightagePercent}%` : '—';
        const status = topic.status || 'Not Started';

        csvContent += `${uName},${tName},${tDesc},${planned},${taken},${weightage},${wtPct},${status}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Syllabus_Report_${activeSubject.subjectId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📥 Syllabus report downloaded successfully.");
  };

  if (!facultySubjects || facultySubjects.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
        <h3 style={{ color: '#1E293B' }}>No Syllabus Assigned</h3>
        <p style={{ color: '#64748B', fontSize: '13px' }}>There are currently no subjects mapped to your faculty profile.</p>
      </div>
    );
  }

  return (
    <div className="syllabus-tracker-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0B1F3A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 700,
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* 1. Header & Subject Selector Toolbar */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1F3A 0%, #0B5CAD 100%)',
        color: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(11, 31, 58, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#10B981', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                SSGMCE Academic Portal
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                Curriculum Delivery Tracker
              </span>
            </div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800 }}>
              Syllabus Coverage Tracking System
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#BAE6FD' }}>
              Faculty: <strong>{activeSubject?.facultyName || 'Dr. Rohan Deshmukh'}</strong> • Record topic coverage and evaluate teaching pace
            </p>
          </div>

          {/* Subject Switcher Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#E0F2FE' }}>
              Select Subject:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSelectSubject(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.4)',
                background: '#FFFFFF',
                color: '#0B1F3A',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                minWidth: '220px'
              }}
            >
              {facultySubjects.map(sub => (
                <option key={sub.subjectId} value={sub.subjectId}>
                  {sub.subjectName} ({sub.classId}) — {sub.progress}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-Subject Cards Bar (If faculty teaches multiple subjects) */}
        {facultySubjects.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {facultySubjects.map(sub => {
              const isSelected = sub.subjectId === selectedSubjectId;
              return (
                <div
                  key={sub.subjectId}
                  onClick={() => handleSelectSubject(sub.subjectId)}
                  style={{
                    background: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.12)',
                    color: isSelected ? '#0B1F3A' : '#FFFFFF',
                    border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.2)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{sub.subjectName} ({sub.classId})</span>
                  <span style={{
                    background: isSelected ? '#0B5CAD' : 'rgba(255,255,255,0.25)',
                    color: '#FFFFFF',
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>
                    {sub.progress}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Visual Analysis Dashboard (Donut & Metrics) */}
      {activeSubject && (
        <SyllabusAnalysisChart
          subject={activeSubject}
          onDownloadReport={handleDownloadReport}
        />
      )}

      {/* 3. Overall Progress Summary Banner */}
      {activeSubject && (
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
          gap: '12px'
        }}>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 800, color: '#0B1F3A' }}>
              Overall Syllabus Coverage: {activeSubject.progress}%
            </h4>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {activeSubject.totalLecturesTaken} of {activeSubject.totalLecturesPlanned} Lectures Completed across {activeSubject.units?.length || 0} Modules
            </span>
          </div>

          <div style={{ width: '220px', height: '10px', background: '#E2E8F0', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              width: `${activeSubject.progress}%`,
              height: '100%',
              background: activeSubject.progress >= 75 ? '#10B981' : '#0B5CAD',
              borderRadius: '5px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* 4. Unit-wise & Topic-wise Breakdown Cards */}
      <div>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0B1F3A' }}>
            Detailed Curriculum Modules &amp; Topics
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Click on any module to expand/collapse topics
          </span>
        </div>

        {activeSubject?.units && activeSubject.units.map((unit) => (
          <SyllabusUnitCard
            key={unit.unitId}
            unit={unit}
            subjectId={activeSubject.subjectId}
            onMarkTopic={handleMarkTopic}
            onUndoTopic={handleUndoTopic}
          />
        ))}
      </div>
    </div>
  );
}
