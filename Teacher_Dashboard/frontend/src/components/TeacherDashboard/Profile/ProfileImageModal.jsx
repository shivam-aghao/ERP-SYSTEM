import React from 'react';
import Avatar from './Avatar';

/**
 * ProfileImageModal
 * Handles View Photo, Upload Preview (with 2MB validation), and Delete Confirmation.
 */
export default function ProfileImageModal({
  isOpen,
  mode = 'view', // 'view' | 'upload_preview' | 'delete_confirm'
  imageUrl,
  previewUrl,
  selectedFile,
  facultyName = 'Faculty Member',
  onClose,
  onSaveUpload,
  onConfirmDelete,
  onTriggerUpload,
  onSwitchToDelete
}) {
  if (!isOpen) return null;

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const isFileOversized = selectedFile && selectedFile.size > MAX_FILE_SIZE;

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 31, 58, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: mode === 'view' ? '480px' : (mode === 'upload_preview' ? '500px' : '420px'),
          boxShadow: '0 25px 50px -12px rgba(11, 31, 58, 0.35)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            background: '#0B1F3A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>
              {mode === 'view' ? '👁️' : (mode === 'upload_preview' ? '📷' : '🗑️')}
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>
              {mode === 'view' && 'Profile Photo'}
              {mode === 'upload_preview' && 'Preview Profile Photo'}
              {mode === 'delete_confirm' && 'Remove Profile Photo'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          
          {/* ========================================================
               MODE 1: VIEW PHOTO
               ======================================================== */}
          {mode === 'view' && (
            <div style={{ textAlign: 'center' }}>
              {imageUrl ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '240px',
                      height: '240px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '4px solid #0B5CAD',
                      boxShadow: '0 8px 24px rgba(11, 92, 173, 0.2)',
                      background: '#F8FAFC'
                    }}>
                      <img
                        src={imageUrl}
                        alt={facultyName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>
                    {facultyName}
                  </h4>
                  <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748B' }}>
                    Current active faculty profile photograph
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={onTriggerUpload}
                      style={{
                        background: '#0B5CAD',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      ✏️ Upload New Photo
                    </button>
                    <button
                      type="button"
                      onClick={onSwitchToDelete}
                      style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      🗑️ Remove Photo
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                    <Avatar name={facultyName} size={180} fontSize="54px" showBorder borderColor="#E2E8F0" />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '700', color: '#0F172A' }}>
                    No Profile Photo Uploaded
                  </h4>
                  <p style={{ margin: '0 0 22px 0', fontSize: '13.5px', color: '#64748B', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Your default initials avatar is currently displayed across the ERP dashboard. Upload a picture to personalize your profile.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={onTriggerUpload}
                      style={{
                        background: '#0B5CAD',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📷 Upload Photo Now
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================
               MODE 2: UPLOAD PREVIEW (Before Saving)
               ======================================================== */}
          {mode === 'upload_preview' && (
            <div>
              {/* Preview Avatar Image */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: isFileOversized ? '4px solid #EF4444' : '4px solid #10B981',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  background: '#F8FAFC'
                }}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Upload Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      No preview
                    </div>
                  )}
                </div>
              </div>

              {/* File Metadata Info */}
              {selectedFile && (
                <div style={{
                  background: isFileOversized ? '#FEF2F2' : '#F8FAFC',
                  border: isFileOversized ? '1px solid #FECACA' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  fontSize: '13px',
                  color: isFileOversized ? '#991B1B' : '#334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600' }}>File:</span>
                    <span style={{ color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>Size:</span>
                    <span style={{ fontWeight: '700', color: isFileOversized ? '#DC2626' : '#0B5CAD' }}>
                      {formatFileSize(selectedFile.size)} {isFileOversized && '(Exceeds 2MB Limit)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Oversized File Warning */}
              {isFileOversized && (
                <div style={{
                  background: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
                  <span>File size exceeds 2MB limit. Please select an image smaller than 2MB.</span>
                </div>
              )}

              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748B', textAlign: 'center' }}>
                This image will appear across your Teacher Dashboard, header avatar, and class rosters.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveUpload}
                  disabled={isFileOversized}
                  style={{
                    background: isFileOversized ? '#94A3B8' : '#0B5CAD',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isFileOversized ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isFileOversized ? 'none' : '0 2px 6px rgba(11, 92, 173, 0.25)'
                  }}
                >
                  ✓ Save Photo
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
               MODE 3: DELETE CONFIRMATION
               ======================================================== */}
          {mode === 'delete_confirm' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 16px auto'
              }}>
                🗑️
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                Remove Profile Photo?
              </h4>
              <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                Are you sure you want to remove your profile photo? Your avatar will revert to your default initials avatar across the ERP system.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  Remove Photo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
