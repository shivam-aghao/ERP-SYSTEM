import React, { useState, useEffect } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';
import FileUpload from './common/FileUpload';
import Avatar from '../common/Avatar';

/**
 * PersonalDetailsTab.jsx
 * Displays and allows editing faculty personal & institutional information.
 */
export default function PersonalDetailsTab() {
  const { facultyInfo, updatePersonalDetails } = useFacultyInfo();
  const [formData, setFormData] = useState({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (facultyInfo?.personalDetails) {
      setFormData({ ...facultyInfo.personalDetails });
    }
  }, [facultyInfo]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = updatePersonalDetails(formData);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const pd = formData;

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Faculty Identity &amp; Personal Profile
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Official institutional attributes, contact coordinates, and academic biography.
          </p>
        </div>
        {isSaved && (
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534', background: '#DCFCE7', padding: '6px 12px', borderRadius: '6px' }}>
            ✓ Changes Saved Successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Avatar / Photo Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', background: '#F8FAFC', padding: '18px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
          <Avatar
            imageUrl={pd.profileImageUrl || pd.profilePhoto}
            name={pd.name || 'Faculty Member'}
            size={84}
            fontSize="28px"
            showBorder
            borderColor="#00A6D6"
          />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#0B1F3A' }}>
              {pd.name || 'Faculty Member'}
            </h4>
            <div style={{ fontSize: '13px', color: '#0B5CAD', fontWeight: '600' }}>
              {pd.designation || 'Faculty'} • {pd.department || 'Computer Science & Engineering'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Employee ID: <strong>{pd.facultyId || '--'}</strong>
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '18px' }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input
              type="text"
              required
              value={pd.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Faculty / Employee ID (Immutable)</label>
            <input
              type="text"
              readOnly
              value={pd.facultyId || ''}
              style={{ ...inputStyle, background: '#F1F5F9', cursor: 'not-allowed', color: '#64748B' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Institutional Email *</label>
            <input
              type="email"
              required
              value={pd.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Contact Phone Number *</label>
            <input
              type="tel"
              required
              value={pd.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Department</label>
            <input
              type="text"
              value={pd.department || ''}
              onChange={e => handleChange('department', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Designation *</label>
            <select
              value={pd.designation || 'Assistant Professor'}
              onChange={e => handleChange('designation', e.target.value)}
              style={inputStyle}
            >
              <option value="Professor">Professor</option>
              <option value="Professor & Head of Department">Professor &amp; Head of Department</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Adjunct Faculty">Adjunct Faculty</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Date of Joining *</label>
            <input
              type="date"
              value={pd.dateOfJoining || ''}
              onChange={e => handleChange('dateOfJoining', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Profile Photo URL / Mock Avatar</label>
            <input
              type="text"
              placeholder="https://... or /uploads/photo.jpg"
              value={pd.profilePhoto || ''}
              onChange={e => handleChange('profilePhoto', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Bio / About Me */}
        <div style={{ marginBottom: '22px' }}>
          <label style={labelStyle}>Professional Bio &amp; Research Interests</label>
          <textarea
            rows="4"
            placeholder="Summarize academic specialization, research domain, pedagogy philosophy, and institutional contributions..."
            value={pd.bio || ''}
            onChange={e => handleChange('bio', e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
          <button
            type="submit"
            style={{
              background: '#0B5CAD',
              color: '#ffffff',
              border: 'none',
              padding: '10px 28px',
              borderRadius: '7px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(11, 92, 173, 0.25)'
            }}
          >
            💾 Save Profile Details
          </button>
        </div>
      </form>
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

