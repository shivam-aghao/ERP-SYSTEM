import React, { useState } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';
import InfoCard from './common/InfoCard';
import AddEditModal from './common/AddEditModal';

/**
 * ExperienceTab.jsx
 * Displays and manages teaching, research, and industrial work experience.
 */
export default function ExperienceTab() {
  const { facultyInfo, addItem, updateItem, deleteItem } = useFacultyInfo();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const experienceList = facultyInfo?.experience || [];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = (itemData) => {
    if (editingItem && editingItem.id) {
      updateItem('experience', editingItem.id, itemData);
    } else {
      addItem('experience', itemData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this experience record?')) {
      deleteItem('experience', id);
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Professional &amp; Teaching Experience
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Chronological academic, research, and corporate appointments.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            background: '#0B5CAD',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(11, 92, 173, 0.2)'
          }}
        >
          + Add Experience
        </button>
      </div>

      {experienceList.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>💼</div>
          <h4 style={{ margin: '0 0 6px 0', color: '#0B1F3A' }}>No Work Experience Logged</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
            Add your current and previous academic or industrial positions.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              background: '#0B5CAD',
              color: '#ffffff',
              border: 'none',
              padding: '7px 16px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            + Add Position
          </button>
        </div>
      ) : (
        <div>
          {experienceList.map(exp => {
            const isCurrent = (exp.toDate || '').toLowerCase().includes('present');
            return (
              <InfoCard
                key={exp.id}
                icon="💼"
                title={exp.organization}
                subtitle={exp.designation}
                badgeText={isCurrent ? "Current Appointment" : `${exp.fromDate} to ${exp.toDate}`}
                badgeType={isCurrent ? "success" : "navy"}
                meta={
                  <>
                    <span>🗓️ Duration: <strong>{exp.fromDate}</strong> – <strong>{exp.toDate || 'Present'}</strong></span>
                  </>
                }
                description={exp.responsibilities}
                certificateUrl={exp.certificateUrl}
                onEdit={() => handleOpenEdit(exp)}
                onDelete={() => handleDelete(exp.id)}
              />
            );
          })}
        </div>
      )}

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        sectionKey="experience"
        initialData={editingItem}
      />
    </div>
  );
}

