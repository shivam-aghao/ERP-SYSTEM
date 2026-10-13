import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';

/**
 * AddEditModal.jsx
 * Unified modal for adding and editing entries across all sections:
 * Education, Experience, Achievements, Sessions Conducted, Sessions Attended, Publications, Documents.
 */
export default function AddEditModal({
  isOpen,
  onClose,
  onSave,
  sectionKey, // "education", "experience", "achievements", "sessionsConducted", "sessionsAttended", "publications", "documents"
  initialData = null
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({});
    }
  }, [initialData, sectionKey, isOpen]);

  if (!isOpen) return null;

  const getSectionTitle = () => {
    const isEdit = Boolean(initialData && initialData.id);
    const prefix = isEdit ? "Edit" : "Add New";
    switch (sectionKey) {
      case 'education': return `${prefix} Qualification / Degree`;
      case 'experience': return `${prefix} Professional Experience`;
      case 'achievements': return `${prefix} Academic Award & Achievement`;
      case 'sessionsConducted': return `${prefix} Conducted Session / Workshop`;
      case 'sessionsAttended': return `${prefix} Attended Session / FDP`;
      case 'publications': return `${prefix} Research Publication`;
      case 'documents': return "Upload Document to Vault";
      default: return `${prefix} Record`;
    }
  };

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(11, 31, 58, 0.55)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E2E8F0'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0B1F3A' }}>
            {getSectionTitle()}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* SECTION: EDUCATION */}
          {sectionKey === 'education' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Degree / Certification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ph.D. in Computer Engineering, M.Tech, B.E."
                  value={formData.degree || ''}
                  onChange={e => handleInputChange('degree', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Specialization / Field of Study *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Distributed Systems, Machine Learning"
                  value={formData.specialization || ''}
                  onChange={e => handleInputChange('specialization', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>University / Institution *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., SGBAU Amravati / IIT Bombay"
                    value={formData.university || ''}
                    onChange={e => handleInputChange('university', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Year of Passing *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2023"
                    value={formData.yearOfPassing || ''}
                    onChange={e => handleInputChange('yearOfPassing', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Grade / Percentage / CGPA</label>
                <input
                  type="text"
                  placeholder="e.g., 8.92 CGPA or First Class with Distinction"
                  value={formData.grade || ''}
                  onChange={e => handleInputChange('grade', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <FileUpload
                label="Upload Degree Certificate (PDF / Image)"
                value={formData.certificateUrl || ''}
                onChange={url => handleInputChange('certificateUrl', url)}
              />
            </>
          )}

          {/* SECTION: EXPERIENCE */}
          {sectionKey === 'experience' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Organization / Institution Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SSGMCE Shegaon, TCS Labs"
                  value={formData.organization || ''}
                  onChange={e => handleInputChange('organization', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Designation / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Assistant Professor, Research Associate"
                  value={formData.designation || ''}
                  onChange={e => handleInputChange('designation', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>From Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate || ''}
                    onChange={e => handleInputChange('fromDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>To Date (or "Present")</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD or Present"
                    value={formData.toDate || ''}
                    onChange={e => handleInputChange('toDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Key Responsibilities &amp; Portfolios</label>
                <textarea
                  rows="3"
                  placeholder="Describe academic duties, laboratory administration, or committee roles..."
                  value={formData.responsibilities || ''}
                  onChange={e => handleInputChange('responsibilities', e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <FileUpload
                label="Experience Certificate (Optional)"
                value={formData.certificateUrl || ''}
                onChange={url => handleInputChange('certificateUrl', url)}
              />
            </>
          )}

          {/* SECTION: ACHIEVEMENTS */}
          {sectionKey === 'achievements' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Achievement / Award Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Best Faculty Researcher Award 2025"
                  value={formData.title || ''}
                  onChange={e => handleInputChange('title', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Awarding Body / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., SSGMCE Academic Council / IEEE"
                    value={formData.awardingBody || ''}
                    onChange={e => handleInputChange('awardingBody', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Year / Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2025"
                    value={formData.year || ''}
                    onChange={e => handleInputChange('year', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Description / Citation</label>
                <textarea
                  rows="3"
                  placeholder="Details of the award, criteria, or notable milestone achieved..."
                  value={formData.description || ''}
                  onChange={e => handleInputChange('description', e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <FileUpload
                label="Upload Award Proof / Certificate"
                value={formData.proofUrl || ''}
                onChange={url => handleInputChange('proofUrl', url)}
              />
            </>
          )}

          {/* SECTION: SESSIONS CONDUCTED */}
          {sectionKey === 'sessionsConducted' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Session / Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., National Hands-on FDP on Advanced Algorithms"
                  value={formData.title || ''}
                  onChange={e => handleInputChange('title', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Session Type *</label>
                  <select
                    value={formData.type || 'Workshop'}
                    onChange={e => handleInputChange('type', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="FDP">Faculty Development Program (FDP)</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Training">Hands-on Training</option>
                    <option value="STTP">Short Term Training Program (STTP)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select
                    value={formData.role || 'Speaker'}
                    onChange={e => handleInputChange('role', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Speaker">Speaker</option>
                    <option value="Resource Person">Resource Person</option>
                    <option value="Coordinator">Program Coordinator</option>
                    <option value="Trainer">Hands-on Trainer</option>
                    <option value="Convener">Convener</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Organized By (Institution / Association) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SSGMCE in association with IEEE Bombay Section"
                  value={formData.organizedBy || ''}
                  onChange={e => handleInputChange('organizedBy', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={e => handleInputChange('date', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 5 Days / 4 Hrs"
                    value={formData.duration || ''}
                    onChange={e => handleInputChange('duration', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Participants</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 65"
                    value={formData.participants || ''}
                    onChange={e => handleInputChange('participants', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Venue / Mode</label>
                <input
                  type="text"
                  placeholder="e.g., Offline (Computing Lab 2) or Online (Google Meet)"
                  value={formData.venue || ''}
                  onChange={e => handleInputChange('venue', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Description / Topics Covered</label>
                <textarea
                  rows="3"
                  placeholder="Topics covered, outcomes, software packages demonstrated..."
                  value={formData.description || ''}
                  onChange={e => handleInputChange('description', e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <FileUpload
                label="Session Conduction Certificate / Photograph"
                value={formData.certificateUrl || ''}
                onChange={url => handleInputChange('certificateUrl', url)}
              />
            </>
          )}

          {/* SECTION: SESSIONS ATTENDED */}
          {sectionKey === 'sessionsAttended' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Event / Training Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AICTE ATAL FDP on Deep Learning & Generative AI"
                  value={formData.title || ''}
                  onChange={e => handleInputChange('title', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Event Type *</label>
                  <select
                    value={formData.type || 'FDP'}
                    onChange={e => handleInputChange('type', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="FDP">Faculty Development Program (FDP)</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Conference">International / National Conference</option>
                    <option value="STTP">STTP</option>
                    <option value="Industrial Training">Industrial Training</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 1 Week / 3 Days"
                    value={formData.duration || ''}
                    onChange={e => handleInputChange('duration', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Organized By (Host Institution) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., VNIT Nagpur / IIT Bombay"
                  value={formData.organizedBy || ''}
                  onChange={e => handleInputChange('organizedBy', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Date of Completion *</label>
                <input
                  type="date"
                  required
                  value={formData.date || ''}
                  onChange={e => handleInputChange('date', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <FileUpload
                label="Upload Participation / Completion Certificate"
                value={formData.certificateUrl || ''}
                onChange={url => handleInputChange('certificateUrl', url)}
              />
            </>
          )}

          {/* SECTION: PUBLICATIONS */}
          {sectionKey === 'publications' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Research Paper Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Optimized Graph Partitioning in Distributed Memory Architectures"
                  value={formData.title || ''}
                  onChange={e => handleInputChange('title', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Journal / Conference Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., IEEE Transactions on Parallel and Distributed Systems"
                  value={formData.journal || ''}
                  onChange={e => handleInputChange('journal', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Publication Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2025"
                    value={formData.year || ''}
                    onChange={e => handleInputChange('year', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>DOI / ISSN</label>
                  <input
                    type="text"
                    placeholder="e.g., 10.1109/TPDS.2025.889214"
                    value={formData.doi || ''}
                    onChange={e => handleInputChange('doi', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <FileUpload
                label="Upload Paper PDF / Acceptance Letter"
                value={formData.proofUrl || ''}
                onChange={url => handleInputChange('proofUrl', url)}
              />
            </>
          )}

          {/* SECTION: DOCUMENTS VAULT */}
          {sectionKey === 'documents' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Document Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Doctoral Degree Certificate, Appointment Letter"
                  value={formData.name || ''}
                  onChange={e => handleInputChange('name', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Category *</label>
                <select
                  value={formData.category || 'Education'}
                  onChange={e => handleInputChange('category', e.target.value)}
                  style={inputStyle}
                >
                  <option value="Education">Education &amp; Degrees</option>
                  <option value="Achievement">Achievement &amp; Awards</option>
                  <option value="Session">Session / Workshop Proof</option>
                  <option value="Publication">Publication &amp; Research</option>
                  <option value="Other">Official Identity / Other</option>
                </select>
              </div>

              <FileUpload
                label="Select File (PDF, JPG, PNG) *"
                required
                value={formData.fileUrl || ''}
                onChange={url => handleInputChange('fileUrl', url)}
              />
            </>
          )}

          {/* Footer Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            borderTop: '1px solid #E2E8F0',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                padding: '9px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#0B5CAD',
                border: 'none',
                padding: '9px 22px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(11, 92, 173, 0.25)'
              }}
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '700',
  color: '#334155',
  marginBottom: '5px'
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '6px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  color: '#0F172A',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#ffffff'
};

