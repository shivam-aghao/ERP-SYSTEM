import React from 'react';

/**
 * SaveDraftModal Component
 * Confirms saving attendance progress as an in-progress draft.
 */
export function SaveDraftModal({
  isOpen,
  onClose,
  onConfirm,
  session,
  stats
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              💾
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Save Attendance Draft
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed">
          Save your current attendance progress as a draft. You can reopen this lecture block anytime to resume or modify values before official submission.
        </p>

        {/* Summary Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 font-medium">
          <div className="flex justify-between text-slate-600">
            <span>Subject:</span>
            <strong className="text-slate-900">{session?.subject}</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Class & Dept:</span>
            <strong className="text-slate-900">{session?.classCode} ({session?.department})</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Marked Status:</span>
            <span className="text-emerald-700 font-bold">
              {stats?.present || 0} Present / {stats?.absent || 0} Absent
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SubmitAttendanceModal Component
 * Confirms official submission of attendance with duplicate prevention safeguards.
 */
export function SubmitAttendanceModal({
  isOpen,
  onClose,
  onConfirm,
  session,
  stats,
  isSubmitting = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
              ✓
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Submit Official Attendance
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Warning / Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
          <strong>Notice:</strong> Submitting will record this attendance session permanently into institutional ERP records. Ensure all student records have been verified.
        </div>

        {/* Summary Table */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Subject:</span>
            <strong className="text-slate-900">{session?.subject}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Class:</span>
            <strong className="text-slate-900">{session?.classCode}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date:</span>
            <strong className="text-slate-900">{session?.date}</strong>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="text-slate-500">Present Count:</span>
            <strong className="text-emerald-700 font-mono font-bold">{stats?.present || 0} students</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Absent Count:</span>
            <strong className="text-rose-700 font-mono font-bold">{stats?.absent || 0} students</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Attendance Rate:</span>
            <strong className="text-blue-700 font-mono font-bold">{stats?.percentageFormatted || '0.00%'}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            Review Again
          </button>
          <button
            type="button"
            onClick={async () => {
              const ok = await onConfirm();
              if (ok) onClose();
            }}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Confirm & Submit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default { SaveDraftModal, SubmitAttendanceModal };
