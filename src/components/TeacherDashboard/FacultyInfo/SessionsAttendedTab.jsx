import React, { useState } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';
import InfoCard from './common/InfoCard';
import AddEditModal from './common/AddEditModal';

/**
 * SessionsAttendedTab.jsx
 * Displays and manages workshops, FDPs, and STTP programs attended by faculty.
 */
export default function SessionsAttendedTab() {
  const { facultyInfo, addItem, updateItem, deleteItem } = useFacultyInfo();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const attendedList = facultyInfo?.sessionsAttended || [];

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
      updateItem('sessionsAttended', editingItem.id, itemData);
    } else {
      addItem('sessionsAttended', itemData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this attended session record?')) {
      deleteItem('sessionsAttended', id);
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Workshops, FDPs &amp; Conferences Attended
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Faculty continuous professional development programs, AICTE ATAL trainings, and symposia.
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
          + Add Attended Program
        </button>
      </div>

      {attendedList.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📚</div>
          <h4 style={{ margin: '0 0 6px 0', color: '#0B1F3A' }}>No Attended Programs Logged</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
            Record FDPs, STTPs, and international conferences you have completed.
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
            + Add Program
          </button>
        </div>
      ) : (
        <div>
          {attendedList.map(item => (
            <InfoCard
              key={item.id}
              icon="📚"
              title={item.title}
              subtitle={`Host Organization: ${item.organizedBy}`}
              badgeText={item.type || 'FDP'}
              badgeType="info"
              meta={
                <>
                  <span>📅 Completion Date: <strong>{item.date}</strong></span>
                  {item.duration && <span>⏱️ Duration: <strong>{item.duration}</strong></span>}
                </>
              }
              certificateUrl={item.certificateUrl}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        sectionKey="sessionsAttended"
        initialData={editingItem}
      />
    </div>
  );
}

