import React, { useState, useMemo } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';
import AddEditModal from './common/AddEditModal';

/**
 * DocumentsTab.jsx
 * Centralized verification document vault with category filtering,
 * preview links, file sizes, and deletion governance.
 */
export default function DocumentsTab() {
  const { facultyInfo, addDocument, deleteDocument } = useFacultyInfo();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const documentsList = facultyInfo?.documents || [];

  const categories = ['All', 'Education', 'Achievement', 'Session', 'Publication', 'Other'];

  const filteredDocs = useMemo(() => {
    return documentsList.filter(doc => {
      const matchCat = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchQuery = !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [documentsList, selectedCategory, searchQuery]);

  const handleSaveDoc = (data) => {
    addDocument(data);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this document from the vault?')) {
      deleteDocument(id);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Education':
        return { background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' };
      case 'Achievement':
        return { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      case 'Session':
        return { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' };
      case 'Publication':
        return { background: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF' };
      default:
        return { background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' };
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Central Document Vault &amp; Verification Repository
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Official digitized degrees, appointment orders, awards, and participation proofs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
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
          + Upload New Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: selectedCategory === cat ? '700' : '500',
                border: selectedCategory === cat ? '1px solid #00A6D6' : '1px solid #CBD5E1',
                background: selectedCategory === cat ? '#E0F2FE' : '#F8FAFC',
                color: selectedCategory === cat ? '#0369A1' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search document name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: '7px 14px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
            minWidth: '220px'
          }}
        />
      </div>

      {/* Documents Table / Grid */}
      {filteredDocs.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📁</div>
          <h4 style={{ margin: '0 0 6px 0', color: '#0B1F3A' }}>No Documents in this Category</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
            Upload certificates, degree transcripts, or appraisal reports.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
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
            + Upload Document
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#334155' }}>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Document Title</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Category</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Upload Date</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>File Size</th>
                <th style={{ padding: '12px 14px', fontWeight: '700', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => {
                const bStyle = getCategoryBadge(doc.category);
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0B1F3A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📄</span>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', ...bStyle }}>
                        {doc.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>
                      {doc.uploadedDate || 'Recent'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748B', fontFamily: 'monospace', fontSize: '12px' }}>
                      {doc.fileSize || '1.2 MB'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#EFF6FF',
                            color: '#0B5CAD',
                            border: '1px solid #BFDBFE',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            fontSize: '11.5px',
                            fontWeight: '700'
                          }}
                        >
                          View ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            padding: '4px 8px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '11.5px'
                          }}
                          title="Delete File"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveDoc}
        sectionKey="documents"
      />
    </div>
  );
}
