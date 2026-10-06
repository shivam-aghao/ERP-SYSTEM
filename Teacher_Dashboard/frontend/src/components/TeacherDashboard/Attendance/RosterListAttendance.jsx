import React, { useState, useMemo } from 'react';

/**
 * RosterListAttendance Component
 * 
 * Specifications:
 * - Clean table/list of students: Roll No, Name, Present / Absent / Late segmented controls
 * - Quick bulk buttons: "Mark All Present", "Mark All Absent"
 * - Instant search bar to filter by roll number or name
 * - Remarks / notes field per student
 * - Fully synchronized with the shared state (stats, swipe cards, review summary)
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
      {/* Top Toolbar: Quick Actions + Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Quick Bulk Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onMarkAll('present')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={() => onMarkAll('absent')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition duration-150 cursor-pointer shadow-xs active:scale-95"
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

      {/* Roster Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <div className="col-span-1 text-center">Roll</div>
          <div className="col-span-4">Student Details</div>
          <div className="col-span-4 text-center">Status</div>
          <div className="col-span-3 text-right">Remarks / Notes</div>
        </div>

        {/* Student Rows */}
        <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">No students matched "{searchTerm}"</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query</p>
            </div>
          ) : (
            filteredStudents.map((st) => {
              const currentStatus = records[st.rollNo]?.status || 'present';
              const remarks = records[st.rollNo]?.remarks || '';

              return (
                <div
                  key={st.id || st.rollNo}
                  className={`grid grid-cols-12 gap-3 px-5 py-3 items-center transition duration-150 ${
                    currentStatus === 'absent'
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : currentStatus === 'late'
                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Roll Number */}
                  <div className="col-span-1 flex justify-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                      {st.rollNo}
                    </span>
                  </div>

                  {/* Student Details */}
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {st.name}
                      </span>
                      {st.isCR && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md">
                          CR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{st.enrollmentNo || `EN24CSE${String(st.rollNo).padStart(3, '0')}`}</span>
                    </div>
                  </div>

                  {/* Status Toggle Segment */}
                  <div className="col-span-4 flex justify-center">
                    <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      {/* Present Button */}
                      <button
                        type="button"
                        onClick={() => onMarkStudent(st.rollNo, 'present', 'roster')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Present
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        onClick={() => onMarkStudent(st.rollNo, 'absent', 'roster')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Absent
                      </button>

                      {/* Late Button */}
                      <button
                        type="button"
                        onClick={() => onMarkStudent(st.rollNo, 'late', 'roster')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </div>

                  {/* Remarks Input */}
                  <div className="col-span-3 text-right">
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => onSetRemarks(st.rollNo, e.target.value)}
                      placeholder="Optional remarks..."
                      className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary Strip */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          <div className="flex items-center gap-3 font-medium">
            <span className="text-emerald-700 font-bold">{stats?.present || 0} Present</span>
            <span>•</span>
            <span className="text-rose-700 font-bold">{stats?.absent || 0} Absent</span>
            <span>•</span>
            <span className="text-slate-700 font-bold">{stats?.percentageFormatted || '0.00%'} Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RosterListAttendance;
