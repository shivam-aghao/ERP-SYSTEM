import React from 'react';

/**
 * AttendanceSummaryView Component
 * 
 * Specifications:
 * - KPI Cards: Total Students, Present Count, Absent Count, Attendance Rate %
 * - SVG Doughnut chart showing proportional attendance breakdown
 * - Two separate breakdown lists:
 *   1. Present Students List (with status badge)
 *   2. Absent Students List (with attention badge and remarks)
 * - Action buttons:
 *   - "Edit Attendance" (opens modal to toggle/edit students)
 *   - "Save Draft" (opens draft confirmation)
 *   - "Submit Attendance" (opens final submission modal with duplicate prevention)
 */
export function AttendanceSummaryView({
  session,
  students = [],
  records = {},
  stats,
  onOpenEditModal,
  onOpenSaveModal,
  onOpenSubmitModal,
  isAlreadySubmitted = false
}) {
  const total = stats?.total || students.length;
  const present = stats?.present || 0;
  const absent = stats?.absent || 0;
  const late = stats?.late || 0;
  const percentage = stats?.percentage || 0;
  const percentageFormatted = stats?.percentageFormatted || `${percentage}%`;

  // Filter Present & Absent student lists
  const presentList = students.filter((st) => {
    const s = records[st.rollNo]?.status || 'present';
    return s === 'present' || s === 'late';
  });

  const absentList = students.filter((st) => {
    const s = records[st.rollNo]?.status;
    return s === 'absent';
  });

  // Calculate SVG Doughnut stroke-dasharray (circumference = 2 * PI * 60 ~= 376.99)
  const circumference = 377;
  const presentDash = total > 0 ? (present / total) * circumference : 0;
  const lateDash = total > 0 ? (late / total) * circumference : 0;
  const absentDash = total > 0 ? (absent / total) * circumference : 0;

  return (
    <div className="w-full space-y-6">
      {/* 1. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Students
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
            {total}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Enrolled in {session?.classCode || '2R1'}
          </span>
        </div>

        {/* Attendance Rate */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Attendance Rate
          </span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
            {percentageFormatted}
          </div>
          <span className="text-xs text-slate-300 mt-1 block">
            {present + late} of {total} Attended
          </span>
        </div>

        {/* Present Students */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Present Students
          </span>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1 font-mono">
            {present}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">
            Physically verified present
          </span>
        </div>

        {/* Absent Students */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
            Absent Students
          </span>
          <div className="text-3xl font-extrabold text-rose-700 mt-1 font-mono">
            {absent}
          </div>
          <span className="text-xs text-rose-600 mt-1 block">
            Marked absent for session
          </span>
        </div>
      </div>

      {/* 2. Doughnut Chart & Summary Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-8">
        {/* SVG Doughnut Chart */}
        <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="#F1F5F9"
              strokeWidth="18"
              fill="none"
            />
            {/* Absent Arc (Red) */}
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="#EF4444"
              strokeWidth="18"
              strokeDasharray={`${absentDash} ${circumference}`}
              strokeDashoffset={-presentDash - lateDash}
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
            {/* Present Arc (Green) */}
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="#10B981"
              strokeWidth="18"
              strokeDasharray={`${presentDash} ${circumference}`}
              strokeDashoffset="0"
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Rate Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Math.round(percentage)}%
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Attended
            </span>
          </div>
        </div>

        {/* Narrative & Action Buttons */}
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-lg font-bold text-slate-900">
              Attendance Verification & Review
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Records are cross-synchronized across Swipe Card Mode and Roster List Mode.
              Verify all records before official ERP submission. You can adjust individual statuses using the Edit tool.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenEditModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition duration-150 shadow-xs cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit Attendance</span>
            </button>

            <button
              type="button"
              onClick={onOpenSaveModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition duration-150 shadow-xs cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={onOpenSubmitModal}
              disabled={isAlreadySubmitted}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition duration-150 shadow-sm cursor-pointer active:scale-95 ${
                isAlreadySubmitted
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{isAlreadySubmitted ? 'Already Submitted' : 'Submit Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Two Breakdown Lists: PRESENT & ABSENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PRESENT Students List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h5 className="font-bold text-slate-900 text-sm">
                Present Students ({presentList.length})
              </h5>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
              Verified
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto p-2">
            {presentList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No students marked present.
              </div>
            ) : (
              presentList.map((st) => (
                <div
                  key={st.id || st.rollNo}
                  className="px-3 py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 flex items-center justify-center font-mono font-bold bg-slate-100 text-slate-700 rounded-md text-[11px]">
                      {st.rollNo}
                    </span>
                    <span className="font-semibold text-slate-800">{st.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Present ✓
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ABSENT Students List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h5 className="font-bold text-slate-900 text-sm">
                Absent Students ({absentList.length})
              </h5>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full">
              Attention
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto p-2">
            {absentList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Perfect attendance! No students absent.
              </div>
            ) : (
              absentList.map((st) => {
                const remarks = records[st.rollNo]?.remarks;
                return (
                  <div
                    key={st.id || st.rollNo}
                    className="px-3 py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 flex items-center justify-center font-mono font-bold bg-rose-100 text-rose-700 rounded-md text-[11px]">
                        {st.rollNo}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800">{st.name}</span>
                        {remarks && (
                          <span className="block text-[10px] text-slate-400 italic">
                            Note: {remarks}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Absent ✗
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceSummaryView;
