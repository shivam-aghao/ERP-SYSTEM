import React, { useState } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';
import InfoCard from './common/InfoCard';
import AddEditModal from './common/AddEditModal';

/**
 * AchievementsTab.jsx
 * Displays and manages honors, awards, institutional recognitions, and competitive certifications.
 */
export default function AchievementsTab() {
  const { facultyInfo, addItem, updateItem, deleteItem } = useFacultyInfo();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const achievementsList = facultyInfo?.achievements || [];

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
      updateItem('achievements', editingItem.id, itemData);
    } else {
      addItem('achievements', itemData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this achievement record?')) {
      deleteItem('achievements', id);
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Academic Honors, Awards &amp; Certifications
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Merit citations, NPTEL gold medals, institutional best teacher accolades, and patents.
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
          + Add Achievement
        </button>
      </div>

      {achievementsList.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
          <h4 style={{ margin: '0 0 6px 0', color: '#0B1F3A' }}>No Honors or Awards Added</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
            Record prestigious accolades, research grants, and peer recognitions.
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
            + Add Award
          </button>
        </div>
      ) : (
        <div>
          {achievementsList.map(ach => (
            <InfoCard
              key={ach.id}
              icon="🏆"
              title={ach.title}
              subtitle={ach.awardingBody}
              badgeText={`Year ${ach.year}`}
              badgeType="warning"
              meta={
                <>
                  <span>🏛️ Conferred by: <strong>{ach.awardingBody}</strong></span>
                  {ach.date && <span>📅 Date: <strong>{ach.date}</strong></span>}
                </>
              }
              description={ach.description}
              certificateUrl={ach.proofUrl}
              onEdit={() => handleOpenEdit(ach)}
              onDelete={() => handleDelete(ach.id)}
            />
          ))}
        </div>
      )}

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        sectionKey="achievements"
        initialData={editingItem}
      />
    </div>
  );
}

