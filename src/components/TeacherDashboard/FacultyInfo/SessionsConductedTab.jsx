import React, { useState } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';
import InfoCard from './common/InfoCard';
import AddEditModal from './common/AddEditModal';

/**
 * SessionsConductedTab.jsx
 * Displays and manages workshops, FDPs, and guest lectures conducted by faculty.
 */
export default function SessionsConductedTab() {
  const { facultyInfo, addItem, updateItem, deleteItem } = useFacultyInfo();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const conductedList = facultyInfo?.sessionsConducted || [];

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
      updateItem('sessionsConducted', editingItem.id, itemData);
    } else {
      addItem('sessionsConducted', itemData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this conducted session record?')) {
      deleteItem('sessionsConducted', id);
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Workshops, FDPs &amp; Seminars Conducted
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Delivered guest lectures, resource person engagements, and organized national bootcamps.
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
          + Add Conducted Session
        </button>
      </div>

      {conductedList.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎙️</div>
          <h4 style={{ margin: '0 0 6px 0', color: '#0B1F3A' }}>No Conducted Sessions Logged</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
            Record training sessions, workshops, and seminars where you served as speaker or coordinator.
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
            + Add Session
          </button>
        </div>
      ) : (
        <div>
          {conductedList.map(item => (
            <InfoCard
              key={item.id}
              icon="🎙️"
              title={item.title}
              subtitle={`Role: ${item.role || 'Resource Person'} • Organizers: ${item.organizedBy}`}
              badgeText={item.type || 'FDP'}
              badgeType="navy"
              meta={
                <>
                  <span>📅 Date: <strong>{item.date}</strong></span>
                  {item.duration && <span>⏱️ Duration: <strong>{item.duration}</strong></span>}
                  {item.venue && <span>📍 Venue: <strong>{item.venue}</strong></span>}
                  {item.participants && <span>👥 Participants: <strong>{item.participants} Attendees</strong></span>}
                </>
              }
              description={item.description}
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
        sectionKey="sessionsConducted"
        initialData={editingItem}
      />
    </div>
  );
}

