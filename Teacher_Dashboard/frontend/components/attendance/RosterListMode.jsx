import React, { useState, useMemo } from 'react';
import StudentAttendanceRow from './StudentAttendanceRow';

/**
 * RosterListMode Component
 * Provides manual / fallback attendance marking with full student roster view.
 * Features:
 * - Real-time search filter by student name, roll number, or enrollment ID
 * - Quick action bulk buttons ("Mark All Present", "Mark All Absent")
 * - 3-state segmented toggles (Present / Late / Absent) for each student
 * - Remarks input field
 * - Cross-sync: Automatically updates when cards are swiped in Swipe Card Mode
 */
export function RosterListMode({
  session,
  students,
  records,
  stats,
  isLoading,
  onStatusChange,
  onRemarkChange,
  onMarkAll,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.rollFormatted && s.rollFormatted.toLowerCase().includes(q)) ||
        String(s.rollNo).includes(q) ||
        (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q)) ||
        (s.cardId && s.cardId.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ========================================================
          TOOLBAR: SEARCH BAR & QUICK BULK ACTION BUTTONS
          ======================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick Action Bulk Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onMarkAll('present')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => onMarkAll('absent')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Mark All Absent
          </button>
        </div>
      </div>

      {/* ========================================================
          STUDENT ROSTER LIST (SCROLLABLE)
          ======================================================== */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">Loading enrolled student roster...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <p className="text-sm font-semibold">No students match your query "{searchQuery}"</p>
            <p className="text-xs text-slate-400 mt-1">Try searching by roll number or clearing the search box.</p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => {
            const rec = records[student.id] || {};
            return (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                status={rec.status || 'present'}
                remarks={rec.remarks || ''}
                markedAt={rec.markedAt}
                markingMethod={rec.method || (rec.markedAt ? 'swipe' : 'manual')}
                onStatusChange={onStatusChange}
                onRemarkChange={onRemarkChange}
                index={idx}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default RosterListMode;

