import React, { useState, useMemo } from 'react';

/**
 * EditAttendanceModal Component
 * 
 * Specifications:
 * - Table view inside modal
 * - Search bar to filter students by name or roll number
 * - Columns: Roll, Student Name, Current Status, Action ("Change" toggle button), Remarks
 * - Only Present and Absent status options (No Late)
 * - Toggling status immediately updates the unified attendance state
 * - "Done Editing" closes the modal
 */
export function EditAttendanceModal({
  isOpen,
  onClose,
  students = [],
  records = {},
  onMarkStudent,
  onSetRemarks
}) {
  const [searchTerm, setSearchTerm] = useState('');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Edit Attendance Records
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle student attendance status or update remarks before submission.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-2.5 px-2">Roll</th>
                <th className="py-2.5 px-2">Student Name</th>
                <th className="py-2.5 px-2 text-center">Current Status</th>
                <th className="py-2.5 px-2 text-center">Action</th>
                <th className="py-2.5 px-2">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => {
                const currentStatus = records[st.rollNo]?.status; // 'present' | 'absent' | undefined
                const nextStatus = currentStatus === 'present' ? 'absent' : 'present';
                const remarks = records[st.rollNo]?.remarks || '';

                const isPresent = currentStatus === 'present';
                const isAbsent = currentStatus === 'absent';

                return (
                  <tr key={st.id || st.rollNo} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-700">
                      {st.rollNo}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-slate-900">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {st.enrollmentNo || `EN24CSE${String(st.rollNo).padStart(3, '0')}`}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isAbsent
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isPresent ? 'Present ✓' : isAbsent ? 'Absent ✗' : 'Unmarked'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onMarkStudent(st.rollNo, nextStatus, 'manual')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition active:scale-95 cursor-pointer ${
                          nextStatus === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        Change to {nextStatus === 'present' ? 'Present' : 'Absent'}
                      </button>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => onSetRemarks(st.rollNo, e.target.value)}
                        placeholder="Remarks..."
                        className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Changes update and sync in real time.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            Done Editing
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditAttendanceModal;
