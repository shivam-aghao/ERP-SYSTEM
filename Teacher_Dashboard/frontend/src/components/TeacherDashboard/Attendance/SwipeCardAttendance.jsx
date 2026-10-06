import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * SwipeCardAttendance Component
 * 
 * Strict Design Specifications:
 * - Clean card design (Do NOT use profile pictures)
 * - Large high-contrast typography in College ERP style
 * - "ROLL [Number]" (e.g. ROLL 21)
 * - "[Student Name]" (e.g. SHIVAM AGHAO)
 * - "← SWIPE →" instruction
 * - Top Progress: "Student X of Y" and clean progress bar
 * - Live Counters: Present: X | Absent: Y | Remaining: Z
 * - Pointer physics (Touch, Mouse, Pointer Events) with drag threshold
 * - Dynamic Live Stamps: "PRESENT" (green) and "ABSENT" (red)
 * - Desktop Fallback: [ ← ABSENT ] and [ PRESENT → ] buttons, Undo, and Skip
 * - Keyboard Shortcuts: Arrow Left -> Absent, Arrow Right -> Present, Space -> Skip/Review
 * - Pure card swiping/tapping interaction WITHOUT manual RFID reader bar!
 */
export function SwipeCardAttendance({
  session,
  students = [],
  currentIndex = 0,
  stats,
  onSwipeDecision,
  onUndo,
  onSkip,
  onReviewSummary
}) {
  const currentStudent = students[currentIndex];
  const nextStudent = currentIndex + 1 < students.length ? students[currentIndex + 1] : null;

  // Pointer drag state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(null); // 'left' | 'right' | null

  const cardRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 85;

  // Execute swipe decision with smooth fly-out animation
  const triggerDecision = useCallback(
    (decision) => {
      if (!currentStudent || exitDirection) return;
      setExitDirection(decision);

      setTimeout(() => {
        onSwipeDecision(decision);
        setDragOffset({ x: 0, y: 0 });
        setExitDirection(null);
      }, 200);
    },
    [currentStudent, exitDirection, onSwipeDecision]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerDecision('present');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerDecision('absent');
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (onSkip) onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDecision, onSkip]);

  // Pointer event handlers (Works seamlessly on desktop mouse, tablet stylus, and mobile touch)
  const handlePointerDown = (e) => {
    if (exitDirection || !currentStudent) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    if (cardRef.current && e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > SWIPE_THRESHOLD) {
      triggerDecision('present');
    } else if (dragOffset.x < -SWIPE_THRESHOLD) {
      triggerDecision('absent');
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Card dynamics & live stamp opacity calculations
  const rotation = dragOffset.x * 0.08;
  const presentStampOpacity = Math.max(0, Math.min(1, (dragOffset.x - 20) / 60));
  const absentStampOpacity = Math.max(0, Math.min(1, (-dragOffset.x - 20) / 60));

  let transformStyle = `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.3}px, 0) rotate(${rotation}deg)`;
  let transitionStyle = isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)';

  if (exitDirection === 'right') {
    transformStyle = 'translate3d(120vw, 0, 0) rotate(25deg)';
    transitionStyle = 'transform 0.22s ease-out';
  } else if (exitDirection === 'left') {
    transformStyle = 'translate3d(-120vw, 0, 0) rotate(-25deg)';
    transitionStyle = 'transform 0.22s ease-out';
  }

  const totalStudents = students.length;
  const progressPct = totalStudents > 0 ? Math.round((currentIndex / totalStudents) * 100) : 0;
  const isDeckComplete = currentIndex >= totalStudents;

  return (
    <div className="w-full flex flex-col items-center select-none space-y-4">
      {/* 1. TOP PROGRESS & LIVE COUNTERS CARD */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Progress Header */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-extrabold text-slate-800 tracking-tight">
              {isDeckComplete
                ? 'All Students Marked'
                : `Student ${currentIndex + 1} of ${totalStudents}`}
            </span>
          </div>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {progressPct}% Complete
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Live Counters Strip */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl py-1.5 px-2">
            <span className="text-[11px] font-semibold text-emerald-700 block">Present</span>
            <strong className="text-base font-extrabold text-emerald-800 font-mono">
              {stats?.present || 0}
            </strong>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl py-1.5 px-2">
            <span className="text-[11px] font-semibold text-rose-700 block">Absent</span>
            <strong className="text-base font-extrabold text-rose-800 font-mono">
              {stats?.absent || 0}
            </strong>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2">
            <span className="text-[11px] font-semibold text-slate-600 block">Remaining</span>
            <strong className="text-base font-extrabold text-slate-800 font-mono">
              {stats?.remaining || 0}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. SWIPE DECK STAGE */}
      <div className="relative w-full max-w-md h-[400px] flex items-center justify-center overflow-visible">
        {/* Next Card Preview (Underneath Peek) */}
        {nextStudent && !isDeckComplete && (
          <div
            className="absolute inset-0 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between pointer-events-none transform scale-95 translate-y-3 opacity-60"
            style={{ zIndex: 1 }}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600">
                NEXT: ROLL {nextStudent.rollNo}
              </span>
              <span className="text-xs font-mono text-slate-400">
                #{currentIndex + 2}
              </span>
            </div>
            <div className="text-center py-8">
              <h4 className="text-xl font-black text-slate-700 uppercase">
                {nextStudent.name}
              </h4>
              <p className="text-xs font-mono text-slate-400 mt-1">
                {nextStudent.enrollmentNo || `EN24CSE${String(nextStudent.rollNo).padStart(3, '0')}`}
              </p>
            </div>
            <div className="text-center text-xs text-slate-300 font-medium">
              Next in queue
            </div>
          </div>
        )}

        {/* Active Swipe Card */}
        {!isDeckComplete && currentStudent ? (
          <div
            ref={cardRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-lg flex flex-col justify-between cursor-grab active:cursor-grabbing touch-none select-none transition-shadow"
            style={{
              zIndex: 10,
              transform: transformStyle,
              transition: transitionStyle
            }}
          >
            {/* Top Row: Context & Index Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  CLASS {session?.classCode || '2R1'}
                </span>
                <span className="text-xs font-semibold text-slate-500 truncate max-w-[170px]">
                  {session?.subject || 'Data Structures'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                #{currentIndex + 1}
              </span>
            </div>

            {/* Dynamic Live Stamps */}
            <div className="relative w-full h-0 pointer-events-none">
              {/* PRESENT STAMP (Green, Top Right) */}
              <div
                className="absolute right-2 -top-2 transform rotate-12 border-3 border-emerald-500 text-emerald-600 bg-emerald-50/90 rounded-2xl px-4 py-1 text-base font-black tracking-wider uppercase shadow-md transition-opacity"
                style={{ opacity: presentStampOpacity }}
              >
                PRESENT ✓
              </div>

              {/* ABSENT STAMP (Red, Top Left) */}
              <div
                className="absolute left-2 -top-2 transform -rotate-12 border-3 border-rose-500 text-rose-600 bg-rose-50/90 rounded-2xl px-4 py-1 text-base font-black tracking-wider uppercase shadow-md transition-opacity"
                style={{ opacity: absentStampOpacity }}
              >
                ABSENT ✗
              </div>
            </div>

            {/* High-Contrast Body Center (NO Photo) */}
            <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
              {/* Large Bold Roll Number Badge */}
              <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white font-mono font-black text-2xl tracking-tight shadow-md border border-slate-800">
                ROLL {currentStudent.rollNo}
              </div>

              {/* High-Contrast Bold Name */}
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                {currentStudent.name}
              </h3>

              {/* Enrollment / Meta ID */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-bold border border-slate-200">
                <span>{currentStudent.enrollmentNo || `EN24CSE${String(currentStudent.rollNo).padStart(3, '0')}`}</span>
                {currentStudent.isCR && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-200 text-indigo-800 rounded">
                    CR
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Instruction: "← SWIPE →" */}
            <div className="flex flex-col items-center gap-1.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between w-full text-xs font-bold px-2">
                <span className="text-rose-600 flex items-center gap-1">
                  <span>←</span> <span>ABSENT</span>
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-mono font-extrabold text-[11px] border border-slate-200 tracking-wider">
                  ← SWIPE →
                </span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <span>PRESENT</span> <span>→</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Drag card or use keyboard Arrow keys
              </span>
            </div>
          </div>
        ) : (
          /* Completion State */
          <div className="w-full h-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                All Students Swiped!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                All {totalStudents} students for this lecture have been marked. Review the breakdown or proceed to submit attendance.
              </p>
            </div>
            <button
              type="button"
              onClick={onReviewSummary}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
            >
              Review Attendance Summary &rarr;
            </button>
          </div>
        )}
      </div>

      {/* 3. DESKTOP FALLBACK ACTION BUTTONS */}
      <div className="w-full max-w-md flex items-center justify-between gap-2.5 pt-1">
        {/* ABSENT BUTTON */}
        <button
          type="button"
          onClick={() => triggerDecision('absent')}
          disabled={isDeckComplete}
          className="flex-1 py-3 px-4 rounded-xl bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-50 active:scale-95 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-40"
        >
          <span>←</span>
          <span>ABSENT</span>
        </button>

        {/* Undo Button */}
        <button
          type="button"
          onClick={onUndo}
          disabled={currentIndex === 0}
          className="py-3 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition disabled:opacity-40"
          title="Undo last student"
        >
          <span>⟲</span>
          <span className="hidden sm:inline">Undo</span>
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={onSkip}
          disabled={isDeckComplete}
          className="py-3 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition disabled:opacity-40"
          title="Skip to next student"
        >
          <span>Skip</span>
        </button>

        {/* PRESENT BUTTON */}
        <button
          type="button"
          onClick={() => triggerDecision('present')}
          disabled={isDeckComplete}
          className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-40"
        >
          <span>PRESENT</span>
          <span>→</span>
        </button>
      </div>

      {/* 4. KEYBOARD SHORTCUTS HINT BAR */}
      <div className="w-full max-w-md text-center text-[11px] text-slate-500 flex items-center justify-center gap-2 font-medium">
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">←</kbd> Mark Absent</span>
        <span className="text-slate-300">•</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">→</kbd> Mark Present</span>
        <span className="text-slate-300">•</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">Space</kbd> Skip</span>
      </div>
    </div>
  );
}

export default SwipeCardAttendance;
