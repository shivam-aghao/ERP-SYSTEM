import React from 'react';

/**
 * TimetableGrid Component
 * Weekly Lecture & Lab Schedule with Click-to-Mark attendance capabilities:
 * - Interactive hover effects on scheduled class cards
 * - Past / Today / Future date detection
 * - Marked state visual indicators (green checkmark badge)
 * - Click handler opening the shared Attendance Drawer
 * - Future slots disabled with informational tooltips
 */
export function TimetableGrid({
  timetableSchedule,
  selectedDate,
  onDateChange,
  markedSessions = {},
  onSelectSlot
}) {
  const timeHeaders = [
    'Day',
    '09:00 - 10:30 AM',
    '11:00 - 12:30 PM',
    '01:30 - 03:00 PM',
    '03:30 - 05:00 PM'
  ];

  const todayISO = new Date().toISOString().split('T')[0];
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Helper to test if a slot's day is in the future relative to today
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayIndex = dayOrder.indexOf(todayDayName);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Timetable Header Toolbar */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Weekly Lecture & Lab Schedule</h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              Click Slot to Mark
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Academic Term: 2026-2027 • Odd Semester | Click any current/past lecture to open the attendance drawer.
          </p>
        </div>

        {/* Date Filter & Quick Today Jump */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs text-slate-800 bg-transparent font-medium focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => onDateChange(todayISO)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedDate === todayISO
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {/* Timetable Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200">
              {timeHeaders.map((th, idx) => (
                <th
                  key={th}
                  className={`py-3.5 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider ${
                    idx === 0 ? 'w-32 bg-slate-200/60' : ''
                  }`}
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {timetableSchedule.map((row) => {
              const isTodayRow = row.day.toLowerCase() === todayDayName.toLowerCase();
              const rowDayIndex = dayOrder.indexOf(row.day);
              // Relative day state
              const isFutureDay = rowDayIndex > todayDayIndex;

              return (
                <tr
                  key={row.day}
                  className={`transition-colors ${
                    isTodayRow ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Day Column Cell */}
                  <td className="py-4 px-4 align-top border-r border-slate-200 bg-slate-50/40">
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-bold ${isTodayRow ? 'text-blue-700' : 'text-slate-800'}`}>
                        {row.day}
                      </span>
                      {isTodayRow && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white w-max shadow-2xs">
                          Today
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 4 Time Slot Cells */}
                  {row.slots.map((slot, sIdx) => {
                    if (slot.subject === 'Free Slot') {
                      return (
                        <td key={sIdx} className="p-3 align-top">
                          <div className="h-full min-h-[90px] rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-3 text-slate-400 text-xs italic">
                            Off / Prep
                          </div>
                        </td>
                      );
                    }

                    // Slot Key for Marked Session check
                    const sessionKey = `${selectedDate}_${slot.classCode}_${slot.subject}`;
                    const isMarked = Boolean(markedSessions[sessionKey]);

                    return (
                      <td key={sIdx} className="p-2.5 sm:p-3 align-top">
                        <div
                          onClick={() => {
                            if (isFutureDay) return;
                            onSelectSlot({
                              subject: slot.subject,
                              room: slot.room,
                              timeslot: slot.time,
                              classCode: slot.classCode,
                              date: selectedDate,
                              isMarked
                            });
                          }}
                          className={`group relative h-full min-h-[96px] p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                            isFutureDay
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isMarked
                              ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 hover:shadow-md cursor-pointer'
                              : slot.isLab
                              ? 'bg-cyan-50/60 border-cyan-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                              : 'bg-blue-50/40 border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                          } ${!isFutureDay ? 'hover:-translate-y-0.5 active:translate-y-0' : ''}`}
                          title={
                            isFutureDay
                              ? 'Future session cannot be marked ahead'
                              : isMarked
                              ? 'Attendance marked. Click to View or Edit'
                              : 'Click to mark attendance'
                          }
                        >
                          {/* Top row: Subject name & Status indicator */}
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-blue-700 transition-colors">
                                {slot.subject}
                              </span>

                              {/* Marked Badge vs Click Prompt */}
                              {isMarked ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs flex-shrink-0">
                                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Marked
                                </span>
                              ) : isFutureDay ? (
                                <span className="bg-slate-200 text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0">
                                  Future
                                </span>
                              ) : (
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                                  Mark
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              Class {slot.classCode} • {slot.isLab ? 'Lab Session' : 'Lecture'}
                            </span>
                          </div>

                          {/* Bottom row: Room and View/Edit link */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                            <span className="font-semibold text-blue-700">
                              {slot.room}
                            </span>
                            {isMarked && !isFutureDay && (
                              <span className="text-emerald-700 font-semibold group-hover:underline">
                                View / Edit →
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TimetableGrid;
