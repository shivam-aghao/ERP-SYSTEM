import React, { useState } from 'react';
import { FacultyInfoProvider, useFacultyInfo } from '../../../context/FacultyInfoContext';
import PersonalDetailsTab from './PersonalDetailsTab';
import EducationTab from './EducationTab';
import ExperienceTab from './ExperienceTab';
import AchievementsTab from './AchievementsTab';
import SessionsConductedTab from './SessionsConductedTab';
import SessionsAttendedTab from './SessionsAttendedTab';
import PublicationsTab from './PublicationsTab';
import DocumentsTab from './DocumentsTab';
import YearlyReportTab from './YearlyReportTab';

/**
 * FacultyInfoViewInner
 * Child container consuming FacultyInfoContext.
 */
function FacultyInfoViewInner() {
  const { facultyInfo, profileCompletion, toast } = useFacultyInfo();
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Details', icon: '👤' },
    { id: 'education', label: 'Education & Qualifications', icon: '🎓' },
    { id: 'experience', label: 'Professional Experience', icon: '💼' },
    { id: 'achievements', label: 'Achievements & Awards', icon: '🏆' },
    { id: 'conducted', label: 'Sessions Conducted', icon: '🎙️' },
    { id: 'attended', label: 'Sessions Attended', icon: '📚' },
    { id: 'publications', label: 'Publications & Research', icon: '📄' },
    { id: 'documents', label: 'Documents & Vault', icon: '📁' },
    { id: 'report', label: 'Yearly Appraisal Report', icon: '📊' }
  ];

  const pd = facultyInfo?.personalDetails || {};
  const completionPct = profileCompletion?.percentage || 0;

  const getProgressColor = () => {
    if (completionPct >= 80) return '#10B981';
    if (completionPct >= 50) return '#0B5CAD';
    return '#F59E0B';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'error' ? '#EF4444' : '#0B5CAD',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '13px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Profile Summary & Completion Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1F3A 0%, #173863 100%)',
        borderRadius: '14px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '22px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Left: Avatar & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#ffffff',
            border: '2px solid #00A6D6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: '800',
            color: '#0B1F3A',
            flexShrink: 0
          }}>
            {pd.profilePhoto ? (
              <img src={pd.profilePhoto} alt={pd.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (pd.name ? pd.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FC')
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                {pd.name || 'Faculty Member'}
              </h2>
              <span style={{
                background: 'rgba(0, 166, 214, 0.25)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {pd.facultyId || '--'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#93C5FD', marginTop: '3px', fontWeight: '500' }}>
              {pd.designation || 'Faculty'} • {pd.department || 'Computer Science & Engineering'}
            </div>
            <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px' }}>
              ✉️ {pd.email || '--'} • 📞 {pd.phone || '--'}
            </div>
          </div>
        </div>

        {/* Right: Profile Completion Progress Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          padding: '14px 18px',
          minWidth: '240px',
          maxWidth: '320px',
          flex: 1
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#E2E8F0' }}>Profile Completion</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: getProgressColor() }}>{completionPct}% Complete</span>
          </div>

          <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{
              width: `${completionPct}%`,
              height: '100%',
              background: getProgressColor(),
              borderRadius: '10px',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {profileCompletion?.missingItems && profileCompletion.missingItems.length > 0 && (
            <div style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: '1.3' }}>
              💡 <em>Tip: {profileCompletion.missingItems[0]}</em>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        borderBottom: '1px solid #CBD5E1',
        marginBottom: '20px',
        paddingBottom: '2px',
        scrollbarWidth: 'thin'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                border: 'none',
                background: isActive ? '#0B1F3A' : '#F8FAFC',
                color: isActive ? '#ffffff' : '#475569',
                borderRadius: '8px 8px 0 0',
                fontSize: '12.5px',
                fontWeight: isActive ? '700' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 -2px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div>
        {activeTab === 'personal' && <PersonalDetailsTab />}
        {activeTab === 'education' && <EducationTab />}
        {activeTab === 'experience' && <ExperienceTab />}
        {activeTab === 'achievements' && <AchievementsTab />}
        {activeTab === 'conducted' && <SessionsConductedTab />}
        {activeTab === 'attended' && <SessionsAttendedTab />}
        {activeTab === 'publications' && <PublicationsTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'report' && <YearlyReportTab />}
      </div>
    </div>
  );
}

/**
 * Main Export wrapped in FacultyInfoProvider
 */
export default function FacultyInfoView({ facultyId }) {
  return (
    <FacultyInfoProvider facultyId={facultyId}>
      <FacultyInfoViewInner />
    </FacultyInfoProvider>
  );
}
