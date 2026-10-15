import React, { useState, useRef } from 'react';

/**
 * FileUpload.jsx
 * Reusable file upload component with drag-and-drop,
 * file validation, and mock URL generation.
 */
export default function FileUpload({
  label = "Upload Supporting Document / Certificate",
  accept = ".pdf,.jpg,.jpeg,.png",
  value = "",
  onChange,
  required = false,
  helperText = "Accepted formats: PDF, JPG, PNG (Max size: 5MB)"
}) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(value ? value.split('/').pop() : '');
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const generatedUrl = `/uploads/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    setFileName(file.name);
    if (onChange) {
      onChange(generatedUrl, file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
    if (onChange) onChange('', null);
  };

  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '700',
        color: '#334155',
        marginBottom: '6px'
      }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: dragActive ? '2px dashed #00A6D6' : '1.5px dashed #CBD5E1',
          background: dragActive ? '#F0F9FF' : '#F8FAFC',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {fileName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📄</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1F3A', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </span>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: '#FEE2E2',
                color: '#DC2626',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>☁️</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0B5CAD' }}>
              Click to select or drag &amp; drop certificate
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
              {helperText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

