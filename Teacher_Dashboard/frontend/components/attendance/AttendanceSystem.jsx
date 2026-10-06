import React from 'react';
import useTeacherAttendance from './useTeacherAttendance';
import TimetableGrid from './TimetableGrid';
import AttendanceMarkingPage from './AttendanceMarkingPage';

/**
 * AttendanceSystem (Main Parent Component)
 * Clean Teacher Dashboard attendance workflow:
 * - Faculty marks attendance exclusively by clicking scheduled class blocks in the Timetable.
 * - Clicking an active or completed slot opens the dedicated AttendanceMarkingPage.
 * - Full dual-method interface: Swipe Card Mode & Roster List Mode with real-time state synchronization.
 * - Submitting updates the backend and renders a green "Completed" checkmark on the timetable slot.
 */
export function AttendanceSystem() {
  const {
    selectedDate,
    setSelectedDate,
    timetableSchedule,
    markedSessions,
    activeSession,
    studentsRoster,
    attendanceRecords,
    isLoading,
    isSubmitting,
    toastMessage,
    openAttendancePage,
    closeAttendancePage,
    handleSwipeInput,
    handleStatusChange,
    handleRemarkChange,
    handleMarkAll,
    saveDraftAttendance,
    submitAttendance,
  } = useTeacherAttendance();

  // If a session has been opened by clicking a timetable slot, render the dedicated AttendanceMarkingPage
  if (activeSession) {
    return (
      <AttendanceMarkingPage
        session={activeSession}
        students={studentsRoster}
        records={attendanceRecords}
        onBack={closeAttendancePage}
        onStatusChange={handleStatusChange}
        onRemarkChange={handleRemarkChange}
        onMarkAll={handleMarkAll}
        onSwipeInput={handleSwipeInput}
        onSaveDraft={saveDraftAttendance}
        onSubmitFinal={submitAttendance}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-white border border-emerald-300 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-fadeIn">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">
              {toastMessage.type === 'success' ? 'Attendance Recorded' : 'Action Failed'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Main Header & Date Picker Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Teacher Timetable & Attendance
            </h1>
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
              Dual-Method Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any scheduled class block below to open the Student Attendance Marking Page (Swipe Card / Roster List).
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Timetable Module (Click-to-Mark) */}
      <div className="max-w-7xl mx-auto">
        <TimetableGrid
          timetableSchedule={timetableSchedule}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          markedSessions={markedSessions}
          onSelectSlot={openAttendancePage}
        />
      </div>

    </div>
  );
}

export default AttendanceSystem;
