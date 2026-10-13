import React, { useState } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';
import InfoCard from './common/InfoCard';
import AddEditModal from './common/AddEditModal';

/**
 * EducationTab.jsx
 * Displays and manages degrees, doctoral qualifications, and diplomas.
 */
export default function EducationTab() {
  const { facultyInfo, addItem, updateItem, deleteItem } = useFacultyInfo();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const educationList = facultyInfo?.education || [];

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
      updateItem('education', editingItem.id, itemData);
    } else {
      addItem('education', itemData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this qualification record?')) {
      deleteItem('education', id);
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Education &amp; Academic Qualifications
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Undergraduate, postgraduate, and doctoral degrees with university endorsements.
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
          + Add New Qualification
        </button>
      </div>

      {educationList.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎓</div>
          <h4 style={{ margin: '0 0 6px 0', color: '#0B1F3A' }}>No Qualifications Recorded</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
            Add your degrees, doctorates, and certified academic credentials.
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
            + Add Degree
          </button>
        </div>
      ) : (
        <div>
          {educationList.map(edu => (
            <InfoCard
              key={edu.id}
              icon="🎓"
              title={edu.degree}
              subtitle={edu.specialization}
              badgeText={edu.grade || 'Completed'}
              badgeType={edu.grade?.toLowerCase().includes('distinction') ? 'success' : 'info'}
              meta={
                <>
                  <span>🏛️ {edu.university}</span>
                  <span>📅 Passing Year: <strong>{edu.yearOfPassing}</strong></span>
                </>
              }
              certificateUrl={edu.certificateUrl}
              onEdit={() => handleOpenEdit(edu)}
              onDelete={() => handleDelete(edu.id)}
            />
          ))}
        </div>
      )}

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        sectionKey="education"
        initialData={editingItem}
      />
    </div>
  );
}
