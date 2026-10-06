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
 * - Top Progress: "Student X of Y" and progress bar (e.g. 35%)
 * - Live Counters: Present: X | Absent: Y | Remaining: Z
 * - Pointer physics (Touch, Mouse, Pointer Events) with drag threshold
 * - Dynamic Live Stamps: "PRESENT" (green) and "ABSENT" (red)
 * - Desktop Fallback: [ ← ABSENT ] and [ PRESENT → ] buttons
 * - Keyboard Shortcuts: Arrow Left -> Absent, Arrow Right -> Present, Space -> Skip/Review
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
      // Spring back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Stamp opacities & card rotation calculations
  const rotationDeg = dragOffset.x * 0.08;
  const presentOpacity = Math.max(0, Math.min(1, (dragOffset.x - 15) / 60));
  const absentOpacity = Math.max(0, Math.min(1, (-dragOffset.x - 15) / 60));

  const cardTransformStyle = {
    transform: exitDirection
      ? `translate3d(${exitDirection === 'right' ? '120vw' : '-120vw'}, 0, 0) rotate(${
          exitDirection === 'right' ? '28deg' : '-28deg'
        })`
      : isDragging
      ? `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.25}px, 0) rotate(${rotationDeg}deg)`
      : 'translate3d(0, 0, 0) rotate(0deg)',
    transition: isDragging ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)',
  };

  // Completed State: If all cards have been swiped
  if (!currentStudent || currentIndex >= students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black mb-4">
          ✓
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          All Students Swiped!
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          You have marked all {students.length} students in {session?.subject || 'this lecture'}.
        </p>

        <div className="grid grid-cols-3 gap-3 w-full my-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-xs">
          <div>
            <div className="text-slate-500 font-bold uppercase">Present</div>
            <div className="text-2xl font-black text-emerald-600">{stats.present}</div>
          </div>
          <div>
            <div className="text-slate-500 font-bold uppercase">Absent</div>
            <div className="text-2xl font-black text-rose-600">{stats.absent}</div>
          </div>
          <div>
            <div className="text-slate-500 font-bold uppercase">Rate</div>
            <div className="text-2xl font-black text-blue-600">{stats.percentage}%</div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              ⟲ Undo Last
            </button>
          )}
          <button
            type="button"
            onClick={onReviewSummary}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all"
          >
            Review Summary →
          </button>
        </div>
      </div>
    );
  }

  const progressPercent =
    students.length > 0 ? Math.round(((currentIndex + 1) / students.length) * 100) : 0;

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto space-y-5 select-none">
      
      {/* ========================================================
          TOP PROGRESS BAR & LIVE COUNTERS
          "Student X of Y", Progress bar, Present: X | Absent: Y | Remaining: Z
          ======================================================== */}
      <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              Student {currentIndex + 1} of {students.length}
            </span>
          </div>
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {progressPercent}%
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Live Counters Pill */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
          <div className="bg-emerald-50/80 border border-emerald-100 py-1.5 rounded-xl text-emerald-800 font-extrabold">
            Present: <span className="text-emerald-900">{stats.present}</span>
          </div>
          <div className="bg-rose-50/80 border border-rose-100 py-1.5 rounded-xl text-rose-800 font-extrabold">
            Absent: <span className="text-rose-900">{stats.absent}</span>
          </div>
          <div className="bg-slate-100/90 border border-slate-200 py-1.5 rounded-xl text-slate-700 font-extrabold">
            Remaining: <span className="text-slate-900">{stats.remaining}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          SWIPE CARD DECK STAGE (CLEAN CARD - NO MAIN PHOTO)
          ======================================================== */}
      <div className="relative w-full h-[370px] sm:h-[400px] flex items-center justify-center touch-none">
        
        {/* Next Card Peek Layer Underneath */}
        {nextStudent && (
          <div
            className="absolute inset-x-4 top-3 bottom-0 bg-slate-100/90 rounded-3xl border-2 border-slate-300/80 shadow-sm flex flex-col items-center justify-center p-8 opacity-75 pointer-events-none transform scale-[0.96] -translate-y-2"
            aria-hidden="true"
          >
            <div className="px-5 py-1.5 rounded-full bg-slate-200 text-slate-600 text-xs font-black tracking-widest uppercase">
              NEXT: ROLL {nextStudent.rollNo}
            </div>
            <h4 className="text-2xl font-black text-slate-700 uppercase tracking-tight mt-3">
              {nextStudent.name}
            </h4>
            <span className="text-xs text-slate-500 mt-1 font-mono">
              {nextStudent.enrollmentNo || `Roll #${nextStudent.rollNo}`}
            </span>
          </div>
        )}

        {/* Active Swipe Card */}
        <div
          ref={cardRef}
          style={cardTransformStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="absolute inset-0 bg-white rounded-3xl border-2 border-slate-800/10 shadow-2xl flex flex-col justify-between p-6 sm:p-8 cursor-grab active:cursor-grabbing overflow-hidden hover:shadow-3xl transition-shadow"
        >
          {/* Top Row: Class & Subject Badge */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                CLASS {session?.classCode || '2R1'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {session?.subject || 'Data Structures'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              #{currentIndex + 1}
            </span>
          </div>

          {/* DYNAMIC LIVE STAMPS */}
          <div className="relative my-auto flex flex-col items-center justify-center text-center py-4">
            {/* Green PRESENT Stamp (Emerges on right drag) */}
            <div
              style={{ opacity: presentOpacity }}
              className="absolute -top-3 right-2 border-4 border-emerald-500 text-emerald-600 font-black tracking-widest text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl rotate-12 uppercase pointer-events-none shadow-lg bg-emerald-50/95 z-20 transition-opacity"
            >
              PRESENT ✓
            </div>

            {/* Red ABSENT Stamp (Emerges on left drag) */}
            <div
              style={{ opacity: absentOpacity }}
              className="absolute -top-3 left-2 border-4 border-rose-500 text-rose-600 font-black tracking-widest text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl -rotate-12 uppercase pointer-events-none shadow-lg bg-rose-50/95 z-20 transition-opacity"
            >
              ABSENT ✗
            </div>

            {/* LARGE CLEAN ROLL NUMBER BADGE */}
            <div className="inline-block px-7 py-2 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white text-2xl sm:text-3xl font-black tracking-widest shadow-lg shadow-blue-900/20 mb-4 uppercase">
              ROLL {currentStudent.rollNo}
            </div>

            {/* HIGH-CONTRAST BOLD STUDENT NAME */}
            <h3 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight max-w-md mx-auto line-clamp-2">
              {currentStudent.name}
            </h3>

            {/* Enrollment Number / CR Badge */}
            <p className="text-xs sm:text-sm font-mono text-slate-500 mt-2 font-semibold">
              {currentStudent.enrollmentNo || `EN24CSE${String(currentStudent.rollNo).padStart(3, '0')}`}
              {currentStudent.isCR && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-sans font-bold text-[11px]">
                  Class Representative
                </span>
              )}
            </p>
          </div>

          {/* Card Footer: Instruction "← SWIPE →" */}
          <div className="border-t border-slate-100 pt-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400 font-black tracking-wider text-xs uppercase">
              <span className="text-rose-500">← ABSENT</span>
              <span className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 font-black tracking-widest border border-slate-200">
                SWIPE
              </span>
              <span className="text-emerald-500">PRESENT →</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Drag card or press Left/Right arrow keys
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          DESKTOP FALLBACK BUTTONS & SHORTCUT HINTS
          ======================================================== */}
      <div className="w-full flex items-center justify-between gap-3">
        {/* ABSENT BUTTON */}
        <button
          type="button"
          onClick={() => triggerDecision('absent')}
          disabled={!currentStudent || exitDirection}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-white hover:bg-rose-50 active:bg-rose-100 border-2 border-rose-500 text-rose-600 font-black text-sm tracking-wide shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-40"
        >
          <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
          <span>ABSENT</span>
        </button>

        {/* UNDO BUTTON */}
        {onUndo && currentIndex > 0 && (
          <button
            type="button"
            onClick={onUndo}
            title="Undo previous student"
            className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center justify-center"
          >
            ⟲ Undo
          </button>
        )}

        {/* REVIEW SUMMARY BUTTON */}
        <button
          type="button"
          onClick={onReviewSummary}
          title="Review summary"
          className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors"
        >
          Review
        </button>

        {/* PRESENT BUTTON */}
        <button
          type="button"
          onClick={() => triggerDecision('present')}
          disabled={!currentStudent || exitDirection}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-40"
        >
          <span>PRESENT</span>
          <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* KEYBOARD SHORTCUT HELPER STRIP */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[10px]">←</kbd> Absent
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[10px]">→</kbd> Present
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[10px]">Space</kbd> Skip / Review
        </span>
      </div>

    </div>
  );
}

export default SwipeCardAttendance;
