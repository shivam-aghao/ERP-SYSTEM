import React, { useState, useEffect, useMemo } from 'react';

/**
 * Deterministic color generator for faculty initials avatar.
 * Generates an elegant, collegiate dark-tone background color based on name hash.
 */
const AVATAR_PALETTE = [
  '#0B1F3A', // SSGMCE Deep Navy
  '#0B5CAD', // SSGMCE Primary Blue
  '#1E40AF', // Royal Blue
  '#0F766E', // Deep Teal
  '#047857', // Emerald Green
  '#4338CA', // Indigo
  '#6D28D9', // Deep Purple
  '#854D0E', // Amber Bronze
  '#991B1B', // Dark Crimson
  '#374151'  // Slate Charcoal
];

export function getAvatarColor(name = '') {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/**
 * Extracts 1-2 uppercase initials from faculty full name,
 * cleanly stripping titles/honorifics.
 */
export function getInitials(name = '') {
  if (!name || typeof name !== 'string') return 'FM';
  const clean = name
    .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Er\.|Shri|Smt\.)\s+/i, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FM';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Reusable Avatar component
 * Displays either the uploaded profile photo or a dynamic initials avatar fallback.
 */
export default function Avatar({
  imageUrl = null,
  name = 'Faculty Member',
  size = 40,
  className = '',
  style = {},
  alt = '',
  showBorder = false,
  borderColor = '#FFFFFF',
  borderWidth = 3,
  fontSize,
  onClick,
  hoverable = false
}) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when imageUrl prop changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const initials = useMemo(() => getInitials(name), [name]);
  const bgColor = useMemo(() => getAvatarColor(name), [name]);

  // Calculated dimension
  const pxSize = typeof size === 'number' ? `${size}px` : size;
  const computedFontSize = fontSize || (typeof size === 'number' ? `${Math.round(size * 0.4)}px` : '15px');

  const containerStyle = {
    width: pxSize,
    height: pxSize,
    minWidth: pxSize,
    minHeight: pxSize,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    boxSizing: 'border-box',
    border: showBorder ? `${borderWidth}px solid ${borderColor}` : 'none',
    cursor: onClick ? 'pointer' : (hoverable ? 'pointer' : 'default'),
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ...style
  };

  const hasValidImage = Boolean(imageUrl && imageUrl.trim && imageUrl.trim().length > 0 && !imageError);

  if (hasValidImage) {
    return (
      <div
        className={`ssgmce-avatar ssgmce-avatar-image ${className}`}
        style={containerStyle}
        onClick={onClick}
        title={alt || name}
      >
        <img
          src={imageUrl}
          alt={alt || name}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`ssgmce-avatar ssgmce-avatar-initials ${className}`}
      style={{
        ...containerStyle,
        backgroundColor: bgColor,
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: computedFontSize,
        letterSpacing: '0.02em'
      }}
      onClick={onClick}
      title={alt || name}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
}

