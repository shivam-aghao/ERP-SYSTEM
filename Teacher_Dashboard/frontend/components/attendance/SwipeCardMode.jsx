import React, { useState, useEffect, useRef } from 'react';

/**
 * SwipeCardMode Component
 * Optimized for tablet/iPad and desktop environments.
 * Features:
 * - High-contrast dark navy visual panel with glowing radar/pulse animations
 * - Auto-focused invisible/accessible input accepting hardware RFID/NFC keyboard-emulating card readers
 * - Instant real-time feedback banner showing student photo, name, roll number, and status
 * - Error alert handling for unregistered cards or students not enrolled in this class
 * - Live feed running list of recently swiped students with live counter (e.g. "24 / 60 Students Present")
 * - Quick-test helper buttons for fast simulation without physical hardware
 */
export function SwipeCardMode({
  session,
  students,
  records,
  liveSwipedList,
  swipeFeedback,
  stats,
  onSwipeInput,
}) {
  const [cardInputValue, setCardInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  // Keep input focused automatically so RFID reader input is never missed
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    focusInput();
    const interval = setInterval(focusInput, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle hardware card reader input (emulates keyboard typing followed by Enter)
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = cardInputValue.trim();
    if (!trimmed || isProcessing) return;

    setIsProcessing(true);
    try {
      await onSwipeInput(trimmed);
      setCardInputValue('');
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ========================================================
          SWIPE SCANNER ZONE (HIGH CONTRAST DARK NAVY)
          ======================================================== */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 shadow-xl border border-slate-800 cursor-pointer select-none transition-all hover:border-blue-500/50"
      >
        {/* Decorative background glow rings */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          {/* Pulsing RFID Radar & Animation */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-25" />
              <span className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Waiting for Card Swipe...
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tap RFID / NFC Smart Card on the scanner or type Card ID below.
              </p>
            </div>
          </div>

          {/* Live Attendance Counter Pill */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-medium">Present in Class</div>
              <div className="text-xl font-extrabold text-emerald-400">
                {stats.present} <span className="text-sm font-normal text-slate-400">/ {stats.total}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-400/40 flex items-center justify-center bg-emerald-500/10">
              <span className="text-xs font-bold text-emerald-300">{stats.percentage}%</span>
            </div>
          </div>
        </div>

        {/* Form with Auto-focused Hardware Input */}
        <form onSubmit={handleSubmit} className="mt-5 relative z-10 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={cardInputValue}
              onChange={(e) => setCardInputValue(e.target.value)}
              placeholder="Scanner active — Scan card or enter CARD-2R1-001..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoComplete="off"
            />
            {isProcessing && (
              <div className="absolute inset-y-0 right-16 flex items-center pr-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!cardInputValue.trim() || isProcessing}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all shadow-md disabled:opacity-40"
          >
            Mark
          </button>
        </form>

        {/* Quick Simulator Buttons for Testing */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span className="text-[11px] font-semibold text-slate-400">Simulator:</span>
          {students.slice(0, 3).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSwipeInput(s.cardId || `CARD-${session.classCode}-${String(s.rollNo).padStart(3, '0')}`)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-[11px] border border-slate-700 transition-colors"
            >
              Scan Roll {s.rollNo}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSwipeInput('CARD-3R-099')}
            className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-mono text-[11px] border border-amber-800/50 transition-colors"
          >
            Wrong Class
          </button>
          <button
            type="button"
            onClick={() => onSwipeInput('UNKNOWN-CARD-999')}
            className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-mono text-[11px] border border-rose-800/50 transition-colors"
          >
            Unregistered
          </button>
        </div>
      </div>

      {/* ========================================================
          REAL-TIME FEEDBACK NOTIFICATION CARD
          ======================================================== */}
      {swipeFeedback && (
        <div
          className={`p-4 rounded-2xl shadow-lg border transition-all animate-bounce-short ${
            swipeFeedback.type === 'success'
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950'
              : 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {swipeFeedback.type === 'success' ? (
              swipeFeedback.student?.avatarUrl ? (
                <img
                  src={swipeFeedback.student.avatarUrl}
                  alt={swipeFeedback.student.name}
                  className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-sm object-cover bg-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  ✓
                </div>
              )
            ) : (
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                !
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    swipeFeedback.type === 'success'
                      ? 'bg-emerald-200/70 text-emerald-800'
                      : 'bg-rose-200/70 text-rose-800'
                  }`}
                >
                  {swipeFeedback.type === 'success' ? 'Verified & Present' : 'Swipe Alert'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 truncate mt-0.5">
                {swipeFeedback.message}
              </h4>

              {swipeFeedback.student && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Roll: <strong className="text-slate-800">{swipeFeedback.student.rollFormatted || swipeFeedback.student.rollNo}</strong> | Class: {swipeFeedback.student.classCode}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          LIVE FEED: RECENTLY SWIPED STUDENTS STREAM
          ======================================================== */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h4 className="text-sm font-bold text-slate-800">
              Live Swiped Feed ({liveSwipedList.length})
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Real-time scanner updates
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 pr-1">
          {liveSwipedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-xs font-medium">No cards swiped yet for this session.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Students will appear here instantly as they tap their cards.</p>
            </div>
          ) : (
            liveSwipedList.map((item, idx) => (
              <div
                key={item.student?.id || idx}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-400 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <img
                    src={item.student?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${item.student?.name}`}
                    alt={item.student?.name}
                    className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {item.student?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {item.student?.rollFormatted || `Roll #${item.student?.rollNo}`} • {item.student?.enrollmentNo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Present
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SwipeCardMode;

