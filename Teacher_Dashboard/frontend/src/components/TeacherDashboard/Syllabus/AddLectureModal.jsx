import React, { useState, useEffect } from 'react';

/**
 * AddLectureModal.jsx
 * Interactive modal dialog allowing faculty to add a new lecture under a specific syllabus topic.
 * Supports:
 * - Date of lecture (defaults to today)
 * - Time slot selection
 * - Interactive tag/chip input for multiple "Topics Covered"
 * - Suggested topic chips based on topic curriculum description
 * - Optional lecture notes
 */
export default function AddLectureModal({
  isOpen,
  onClose,
  topicContext,
  onAddLecture
}) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 - 10:30 AM');
  const [tagInput, setTagInput] = useState('');
  const [topicsCovered, setTopicsCovered] = useState([]);
  const [notes, setNotes] = useState('');

  // Initialize form when opened
  useEffect(() => {
    if (!isOpen || !topicContext) return;

    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setTimeSlot('09:00 - 10:30 AM');
    setTagInput('');
    setNotes('');

    // Pre-populate suggested topics if available
    const desc = topicContext.topicDescription || '';
    const suggestions = desc
      .split(/[,;•\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !s.toLowerCase().startsWith('such as') && !s.toLowerCase().startsWith('e.g.'));

    if (suggestions.length > 0) {
      // Pick first 1-2 suggestions by default or let user pick
      const nextNo = topicContext.nextLectureNo || (topicContext.engagedLectures + 1) || 1;
      const initialTag = suggestions[(nextNo - 1) % suggestions.length] || topicContext.topicName;
      setTopicsCovered([initialTag]);
    } else {
      setTopicsCovered([topicContext.topicName || 'Main Curriculum Topic']);
    }
  }, [isOpen, topicContext]);

  if (!isOpen || !topicContext) return null;

  const nextLecNo = topicContext.nextLectureNo || (topicContext.engagedLectures + 1) || 1;

  // Extract suggestions from description that aren't yet added
  const desc = topicContext.topicDescription || '';
  const availableSuggestions = desc
    .split(/[,;•\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && !topicsCovered.includes(s));

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!topicsCovered.includes(trimmed)) {
      setTopicsCovered([...topicsCovered, trimmed]);
    }
    setTagInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTopicsCovered(topicsCovered.filter(t => t !== tagToRemove));
  };

  const handleSelectSuggestion = (suggestion) => {
    if (!topicsCovered.includes(suggestion)) {
      setTopicsCovered([...topicsCovered, suggestion]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTopics = topicsCovered.length > 0
      ? topicsCovered
      : [topicContext.topicName || 'Core Topic Delivery'];

    onAddLecture(
      topicContext.subjectId,
      topicContext.unitId,
      topicContext.topicId,
      {
        date: date || new Date().toISOString().split('T')[0],
        timeSlot: timeSlot || '09:00 - 10:30 AM',
        topicsCovered: finalTopics,
        notes: notes.trim()
      }
    );
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 31, 58, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: '#0B1F3A',
          color: '#FFFFFF',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: '#0B5CAD',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>
                LECTURE {nextLecNo}
              </span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                Record New Lecture
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#94A3B8' }}>
              <strong>{topicContext.subjectName}</strong> • {topicContext.unitName ? topicContext.unitName.split(':')[0] : 'Unit'} • <strong>{topicContext.topicName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          {/* Row 1: Date & Time Slot */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '18px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Date of Lecture <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  color: '#0B1F3A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Class Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  color: '#0B1F3A',
                  outline: 'none',
                  background: '#FFFFFF',
                  boxSizing: 'border-box'
                }}
              >
                <option value="09:00 - 10:30 AM">09:00 - 10:30 AM (Slot 1)</option>
                <option value="11:00 - 12:30 PM">11:00 - 12:30 PM (Slot 2)</option>
                <option value="01:15 - 02:15 PM">01:15 - 02:15 PM (Slot 3)</option>
                <option value="02:15 - 03:15 PM">02:15 - 03:15 PM (Slot 4)</option>
                <option value="03:30 - 05:00 PM">03:30 - 05:00 PM (Slot 5)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Topics Covered (Interactive Tag / Chip Input) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Topics Covered in This Lecture <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: '#64748B' }}>
              Specify the exact concepts, theorems, or modules delivered. Type and press <strong>Enter</strong> or click <strong>+ Add</strong>.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Row-Major Ordering, Base Address calculation..."
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{
                  background: '#0B5CAD',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Add Topic
              </button>
            </div>

            {/* Rendered Chips */}
            <div style={{
              minHeight: '44px',
              padding: '8px 12px',
              background: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center'
            }}>
              {topicsCovered.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  No topic tags added yet. Please add at least one topic covered.
                </span>
              ) : (
                topicsCovered.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      border: '1px solid #BFDBFE',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🏷️ {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#1D4ED8',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                        lineHeight: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Suggestions from Topic Curriculum */}
            {availableSuggestions.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                  Quick add from syllabus curriculum:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {availableSuggestions.slice(0, 4).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '12px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        color: '#475569',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Notes (Optional) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Lecture Delivery Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Conducted live coding demo on blackboard, assigned homework questions 1-4, class participation was active."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                color: '#0B1F3A',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Info Banner */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💡</span>
            <span>
              Once this lecture is created, you will be able to mark student attendance for it immediately from the topic card or lecture history log.
            </span>
          </div>

          {/* Footer Controls */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#0B5CAD',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 22px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(11, 92, 173, 0.25)'
              }}
            >
              + Record &amp; Add Lecture
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
