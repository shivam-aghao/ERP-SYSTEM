import React, { useState, useMemo } from 'react';

/**
 * RosterListAttendance Component
 * 
 * Strict Enhancements:
 * 1. REMOVE "Late" Option: Only "Present" and "Absent" status buttons exist.
 * 2. Clickable Status Buttons: "Present" and "Absent" buttons are fully clickable and toggle the student's status.
 * 3. Dynamic Flexbox Color Coding (CRITICAL):
 *    - Present: Entire student's flexbox/row turns GREEN (light green success bg with green border).
 *    - Absent: Entire student's flexbox/row turns RED (light red danger bg with red border).
 *    - Unmarked: Default neutral state (clean white/light grey).
 *    - Color change happens instantly upon click and syncs with overall attendance counters.
 * 4. Search bar & Bulk actions ("Mark All Present", "Mark All Absent").
 */
export function RosterListAttendance({
  students = [],
  records = {},
  onMarkStudent,
  onMarkAll,
  onSetRemarks,
  stats
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter students by roll number or name
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase().trim();
    return students.filter(
      (st) =>
        String(st.rollNo).includes(q) ||
        st.name.toLowerCase().includes(q) ||
        (st.enrollmentNo && st.enrollmentNo.toLowerCase().includes(q))
    );
  }, [students, searchTerm]);

  return (
    <div className="w-full space-y-4">
      {/* Top Toolbar: Quick Bulk Actions + Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Quick Bulk Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onMarkAll('present')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={() => onMarkAll('absent')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Mark All Absent</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by roll number or student name..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Roster Cards / Rows List */}
      <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
        {filteredStudents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm font-semibold text-slate-600">No students matched "{searchTerm}"</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query</p>
          </div>
        ) : (
          filteredStudents.map((st) => {
            const currentStatus = records[st.rollNo]?.status; // 'present' | 'absent' | undefined
            const remarks = records[st.rollNo]?.remarks || '';

            const isPresent = currentStatus === 'present';
            const isAbsent = currentStatus === 'absent';
            const isNeutral = !currentStatus || currentStatus === 'unmarked';

            // Dynamic Flexbox Row Color Coding
            let rowClasses = 'bg-white border-slate-200 hover:border-slate-300 shadow-xs';
            let avatarBadgeClasses = 'bg-slate-100 text-slate-700';

            if (isPresent) {
              rowClasses = 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20';
              avatarBadgeClasses = 'bg-emerald-100 text-emerald-800 font-bold';
            } else if (isAbsent) {
              rowClasses = 'bg-rose-50/90 border-rose-500 shadow-sm ring-1 ring-rose-500/20';
              avatarBadgeClasses = 'bg-rose-100 text-rose-800 font-bold';
            }

            return (
              <div
                key={st.id || st.rollNo}
                className={`w-full rounded-2xl border-1.5 p-3.5 sm:p-4 transition-all duration-200 ease-in-out flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rowClasses}`}
              >
                {/* Left: Student Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 transition-colors ${avatarBadgeClasses}`}
                  >
                    {st.rollNo}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                        {st.name}
                      </span>
                      {st.isCR && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-md">
                          CR
                        </span>
                      )}
                      {isPresent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                          Present ✓
                        </span>
                      )}
                      {isAbsent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300">
                          Absent ✗
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>Roll #{st.rollNo}</span>
                      <span>•</span>
                      <span>{st.enrollmentNo || `EN24CSE${String(st.rollNo).padStart(3, '0')}`}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Clickable Segmented Controls (Only Present & Absent) + Remarks */}
                <div className="flex items-center gap-3 justify-end flex-wrap">
                  {/* Status Buttons: Strictly ONLY Present and Absent (No Late) */}
                  <div className="inline-flex bg-white/90 p-1 rounded-xl border border-slate-200 shadow-2xs gap-1.5">
                    {/* Present Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onMarkStudent(
                          st.rollNo,
                          isPresent ? null : 'present',
                          'roster'
                        )
                      }
                      className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all duration-150 cursor-pointer active:scale-95 ${
                        isPresent
                          ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title="Click to mark Present"
                    >
                      Present ✓
                    </button>

                    {/* Absent Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onMarkStudent(
                          st.rollNo,
                          isAbsent ? null : 'absent',
                          'roster'
                        )
                      }
                      className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all duration-150 cursor-pointer active:scale-95 ${
                        isAbsent
                          ? 'bg-rose-600 text-white shadow-xs border border-rose-600'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                      title="Click to mark Absent"
                    >
                      Absent ✗
                    </button>
                  </div>

                  {/* Remarks Input */}
                  <div className="w-40 sm:w-48">
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => onSetRemarks(st.rollNo, e.target.value)}
                      placeholder="Remarks..."
                      className="w-full px-2.5 py-1 text-xs bg-white/80 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Live Counters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of{' '}
          <strong className="text-slate-900">{students.length}</strong> students
        </span>
        <div className="flex items-center gap-3 font-semibold">
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {stats?.present || 0} Present
          </span>
          <span>•</span>
          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            {stats?.absent || 0} Absent
          </span>
          <span>•</span>
          <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {stats?.remaining || 0} Remaining
          </span>
          <span>•</span>
          <span className="text-blue-700 font-black font-mono">
            {stats?.percentageFormatted || '0.00%'} Rate
          </span>
        </div>
      </div>
    </div>
  );
}

export default RosterListAttendance;
