import React, { useMemo } from 'react';
import SwipeCardMode from './SwipeCardMode';
import RosterListMode from './RosterListMode';

/**
 * AttendanceDrawer Component
 * Full-screen / large slide-out drawer that opens when a teacher clicks a class block in the Timetable.
 * Provides a dual-method interface:
 * - Mode Tab Switcher: [ 🎴 Swipe Card Mode ] and [ 📋 Roster List Mode ]
 * - Both modes operate over the same underlying attendance state in real time.
 * - Shared submission footer at the bottom.
 */
export function AttendanceDrawer({
  isOpen,
  session,
  activeMode = 'swipe',
  setActiveMode,
  students,
  records,
  liveSwipedList = [],
  swipeFeedback = null,
  isLoading,
  isSubmitting,
  onClose,
  onSwipeInput,
  onStatusChange,
  onRemarkChange,
  onMarkAll,
  onSubmit,
}) {
  if (!isOpen || !session) return null;

  // Compute live statistics across all enrolled students
  const stats = useMemo(() => {
    const list = Object.values(records || {});
    const total = students.length || list.length || 0;
    const present = list.filter((r) => r.status === 'present').length;
    const absent = list.filter((r) => r.status === 'absent').length;
    const late = list.filter((r) => r.status === 'late').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, percentage };
  }, [records, students]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Large Slide-out Drawer Panel (Tablet & iPad optimized) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <aside className="w-screen max-w-2xl lg:max-w-3xl bg-slate-100 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-slate-200">
          
          {/* ========================================================
              DRAWER HEADER: CLASS DETAILS & CLOSE BUTTON
              ======================================================== */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 flex-shrink-0 shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {session.classCode || 'Class Session'}
                  </span>
                  {session.isLab && (
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Practical Lab
                    </span>
                  )}
                  {session.isMarked && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Previously Marked (Editing)
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {session.subject}
                </h2>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 mt-2 flex-wrap font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {session.date}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {session.timeslot || 'Scheduled Slot'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {session.room || 'Classroom'}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ========================================================
                TAB SWITCHER: [ 🎴 Swipe Card Mode ] and [ 📋 Roster List Mode ]
                ======================================================== */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
              <div className="inline-flex p-1 bg-black/30 backdrop-blur-md rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveMode('swipe')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'swipe'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Swipe Card Mode</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeMode === 'swipe' ? 'bg-blue-800 text-blue-200' : 'bg-white/10 text-slate-400'
                  }`}>
                    RFID/NFC
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('roster')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'roster'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Roster List Mode</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeMode === 'roster' ? 'bg-blue-800 text-blue-200' : 'bg-white/10 text-slate-400'
                  }`}>
                    {students.length}
                  </span>
                </button>
              </div>

              {/* Shared Live Stat Pill */}
              <div className="flex items-center gap-2 text-xs bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                <span className="font-semibold text-emerald-300">{stats.present} Present</span>
                <span className="text-white/40">•</span>
                <span className="font-semibold text-rose-300">{stats.absent} Absent</span>
                {stats.late > 0 && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="font-semibold text-amber-300">{stats.late} Late</span>
                  </>
                )}
                <span className="text-white/40">•</span>
                <span className="font-bold text-white bg-blue-500/40 px-2 py-0.5 rounded-md">
                  {stats.percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              DRAWER BODY: DUAL INTERFACE VIEW
              ======================================================== */}
          <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col min-h-0 bg-slate-100">
            {activeMode === 'swipe' ? (
              <SwipeCardMode
                session={session}
                students={students}
                records={records}
                liveSwipedList={liveSwipedList}
                swipeFeedback={swipeFeedback}
                stats={stats}
                onSwipeInput={onSwipeInput}
              />
            ) : (
              <RosterListMode
                session={session}
                students={students}
                records={records}
                stats={stats}
                isLoading={isLoading}
                onStatusChange={onStatusChange}
                onRemarkChange={onRemarkChange}
                onMarkAll={onMarkAll}
              />
            )}
          </div>

          {/* ========================================================
              DRAWER FOOTER: SHARED SUBMISSION & VALIDATION
              ======================================================== */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shadow-xl flex-shrink-0 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Session Mode: <strong className="text-slate-800 font-semibold uppercase">{activeMode}</strong> | Enrolled:{' '}
              <strong className="text-slate-800 font-semibold">{stats.total}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || isLoading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Attendance...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Submit Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

export default AttendanceDrawer;

