import React, { useState } from 'react';
import { useAttendanceState } from './useAttendanceState';
import { SwipeCardAttendance } from './SwipeCardAttendance';
import { RosterListAttendance } from './RosterListAttendance';
import { AttendanceSummaryView } from './AttendanceSummaryView';
import { EditAttendanceModal } from './EditAttendanceModal';
import { SaveDraftModal, SubmitAttendanceModal } from './ConfirmationModals';

/**
 * AttendanceMarkingPage Component
 * 
 * Top-Level Attendance Marking View
 * Specifications:
 * - Rendered strictly inside the Teacher Dashboard main content area (Dark navy sidebar and top header remain visible)
 * - Breadcrumb Navigation: Attendance > [Department] > [Class] > [Date] > [Subject]
 * - Back Button: Returns to timetable without losing state
 * - Top Header: Department, Class, Date, Subject, Timeslot, Room
 * - Dual-Method Tab Switcher: [ Swipe Card Mode ] and [ Roster List Mode ] + [ Review & Summary ]
 * - Live Counters Strip: Present | Absent | Remaining | Attendance Rate
 * - Single source of truth via useAttendanceState hook
 */
export function AttendanceMarkingPage({
  initialSession,
  onBackToTimetable
}) {
  const {
    session,
    students,
    records,
    activeTab,
    setActiveTab,
    currentIndex,
    stats,
    isSubmitting,
    toast,
    markStudent,
    handleSwipeDecision,
    handleUndo,
    handleSkip,
    handleMarkAll,
    handleSetRemarks,
    handleSaveDraft,
    handleSubmitFinal,
    isAlreadySubmitted
  } = useAttendanceState(initialSession);

  // Modal visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Format readable date
  const formattedDate = (() => {
    try {
      if (!session?.date) return 'Today';
      const parts = session.date.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch (_) {}
    return session?.date || 'Today';
  })();

  return (
    <div className="w-full min-h-full pb-16 space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toast.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* 1. TOP BAR: Back Link & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onBackToTimetable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition duration-150 shadow-xs cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Timetable</span>
          </button>

          {/* Breadcrumb Navigation: Attendance > Department > Class > Date > Subject */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span
              onClick={onBackToTimetable}
              className="hover:text-blue-600 cursor-pointer"
            >
              Attendance
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-700">{session?.department || 'CSE'}</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-700">{session?.classCode || '2R1'}</span>
            <span className="text-slate-300">/</span>
            <span>{formattedDate}</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 font-bold truncate max-w-[180px]">
              {session?.subject || 'Data Structures'}
            </span>
          </nav>
        </div>

        {/* Top Action Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-xs cursor-pointer"
          >
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={isAlreadySubmitted}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer ${
              isAlreadySubmitted
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span>{isAlreadySubmitted ? 'Submitted' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* 2. CONTEXT HEADER: Dark Navy Card matching dashboard theme */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-full">
                {session?.department || 'CSE'} Department
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-full">
                Class {session?.classCode || '2R1'}
              </span>
              {isAlreadySubmitted && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1">
                  ✓ Officially Logged
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {session?.subject || 'Data Structures'}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-medium">
                📅 <strong>{formattedDate}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                ⏰ {session?.timeslot || '09:00 - 10:30 AM'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                📍 {session?.room || 'Room 201'}
              </span>
            </div>
          </div>

          {/* Header Live Counter Pill */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-4 text-right flex md:flex-col justify-between items-end min-w-[160px]">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {stats?.percentageFormatted || '0.00%'}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              {stats?.present || 0} / {stats?.total || 0} Present
            </div>
          </div>
        </div>

        {/* 3. DUAL-METHOD TAB SWITCHER */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex bg-slate-900/60 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('swipe')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'swipe'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Swipe Card Mode</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-white/20 text-white font-mono">
                Interactive
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Roster List Mode</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-white/20 text-white font-mono">
                {students.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Review & Summary</span>
            </button>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold px-2">
            <span className="text-emerald-400">{stats?.present || 0} Present</span>
            <span>•</span>
            <span className="text-rose-400">{stats?.absent || 0} Absent</span>
            <span>•</span>
            <span className="text-blue-300">{stats?.remaining || 0} Remaining</span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE TAB CONTENT PANES */}
      <div className="w-full">
        {/* Tab 1: Swipe Card Mode */}
        {activeTab === 'swipe' && (
          <SwipeCardAttendance
            session={session}
            students={students}
            currentIndex={currentIndex}
            stats={stats}
            onSwipeDecision={handleSwipeDecision}
            onUndo={handleUndo}
            onSkip={handleSkip}
            onReviewSummary={() => setActiveTab('summary')}
          />
        )}

        {/* Tab 2: Roster List Mode */}
        {activeTab === 'roster' && (
          <RosterListAttendance
            students={students}
            records={records}
            onMarkStudent={markStudent}
            onMarkAll={handleMarkAll}
            onSetRemarks={handleSetRemarks}
            stats={stats}
          />
        )}

        {/* Tab 3: Review & Summary View */}
        {activeTab === 'summary' && (
          <AttendanceSummaryView
            session={session}
            students={students}
            records={records}
            stats={stats}
            onOpenEditModal={() => setIsEditModalOpen(true)}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            isAlreadySubmitted={isAlreadySubmitted}
          />
        )}
      </div>

      {/* Modals */}
      <EditAttendanceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        students={students}
        records={records}
        onMarkStudent={markStudent}
        onSetRemarks={handleSetRemarks}
      />

      <SaveDraftModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleSaveDraft}
        session={session}
        stats={stats}
      />

      <SubmitAttendanceModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmitFinal}
        session={session}
        stats={stats}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default AttendanceMarkingPage;
