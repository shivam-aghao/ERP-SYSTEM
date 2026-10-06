import React, { useState } from 'react';

/**
 * StudentAttendanceRow Component
 * Tablet & iPad optimized student attendance row featuring:
 * - Avatar placeholder / initials
 * - Roll Number & Name
 * - 3-state segmented toggle: Present (Emerald), Absent (Rose), Late (Amber)
 * - Collapsible remarks input with quick tags (Medical, Late Pass, Unexcused)
 */
export function StudentAttendanceRow({
  student,
  status = 'present',
  remarks = '',
  markingMethod = 'manual',
  onStatusChange,
  onRemarkChange,
  index
}) {
  const [showRemarksInput, setShowRemarksInput] = useState(Boolean(remarks));

  const avatarColors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-teal-100 text-teal-700 border-teal-200',
  ];
  const colorClass = avatarColors[student.rollNo % avatarColors.length];

  const initials = student.name
    ? student.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 ${
        status === 'absent'
          ? 'bg-rose-50/40 border-rose-200/80 shadow-xs'
          : status === 'late'
          ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Student Identity: Avatar, Roll Number, Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${colorClass} ${
                student.avatarUrl ? 'hidden' : 'flex'
              }`}
            >
              {initials}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                status === 'present'
                  ? 'bg-emerald-500'
                  : status === 'absent'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm truncate">
                {student.name}
              </span>
              {student.rollNo === 21 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Class Rep
                </span>
              )}
              {markingMethod === 'swipe' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-2.5 h-2.5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  RFID
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                Roll #{student.rollFormatted || student.rollNo}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline truncate">{student.enrollmentNo}</span>
            </div>
          </div>
        </div>

        {/* 3-State Segmented Control: [Present | Absent | Late] */}
        <div className="flex items-center gap-2 sm:self-center">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-lg border border-slate-200 gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onStatusChange(student.id, 'present')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all touch-manipulation min-w-[70px] ${
                status === 'present'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Present</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusChange(student.id, 'absent')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all touch-manipulation min-w-[70px] ${
                status === 'absent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/60'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Absent</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusChange(student.id, 'late')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all touch-manipulation min-w-[65px] ${
                status === 'late'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/60'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Late</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowRemarksInput(!showRemarksInput)}
            title="Add notes/remarks for this student"
            className={`p-1.5 rounded-lg border transition-colors ${
              remarks
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {showRemarksInput && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={remarks}
              onChange={(e) => onRemarkChange(student.id, e.target.value)}
              placeholder="Add remark (e.g., Medical leave, approved on-duty, traffic delay)..."
              className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
            />
            {remarks && (
              <button
                type="button"
                onClick={() => onRemarkChange(student.id, '')}
                className="text-xs text-slate-400 hover:text-rose-500 px-1"
                title="Clear remark"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Quick Tag:</span>
            {['Medical Leave', 'Late Pass', 'College Event Duty', 'Unexcused'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onRemarkChange(student.id, tag)}
                className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentAttendanceRow;
