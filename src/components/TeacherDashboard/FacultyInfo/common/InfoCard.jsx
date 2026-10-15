import React from 'react';

/**
 * InfoCard.jsx
 * Reusable display card for education, experience, achievements, and sessions entries.
 */
export default function InfoCard({
  icon = "🎓",
  title,
  subtitle,
  meta,
  badgeText,
  badgeType = "info", // "info", "success", "warning", "navy"
  description,
  certificateUrl,
  onEdit,
  onDelete
}) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return { background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' };
      case 'warning':
        return { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      case 'navy':
        return { background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #DBEAFE' };
      default:
        return { background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' };
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #E2E8F0',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: '260px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}>
            {icon}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0B1F3A' }}>
                {title}
              </h4>
              {badgeText && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  ...getBadgeStyle()
                }}>
                  {badgeText}
                </span>
              )}
            </div>

            {subtitle && (
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0B5CAD', marginBottom: '4px' }}>
                {subtitle}
              </div>
            )}

            {meta && (
              <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {meta}
              </div>
            )}

            {description && (
              <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {certificateUrl && (
            <a
              href={certificateUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#0B5CAD',
                background: '#EFF6FF',
                padding: '5px 10px',
                borderRadius: '6px',
                textDecoration: 'none',
                border: '1px solid #BFDBFE'
              }}
            >
              📄 View Proof
            </a>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit Record"
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '5px 9px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ✏️ Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete Record"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '5px 9px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

