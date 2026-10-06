import React, { useState, useMemo } from 'react';

/**
 * ManualAttendanceView Component
 * Dedicated module view accessed via Sidebar "Attendance":
 * - Date Picker (defaults to today)
 * - Dynamic Scheduled Classes dropdown for that day
 * - "Override / Other Class" substitute selector
 * - "Load Students" action launching the shared drawer
 */
export function ManualAttendanceView({
  selectedDate,
  onDateChange,
  timetableSchedule,
  pendingCount,
  onLoadStudents
}) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [isOverrideMode, setIsOverrideMode] = useState(false);

  // Override form fields
  const [overrideDept, setOverrideDept] = useState('CSE');
  const [overrideClass, setOverrideClass] = useState('2R1');
  const [overrideSubject, setOverrideSubject] = useState('Data Structures');
  const [overrideRoom, setOverrideRoom] = useState('Room 201');
  const [overrideTimeslot, setOverrideTimeslot] = useState('09:00 - 10:30 AM');

  // Compute day of week for selected date
  const dayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return days[d.getDay()];
    }
    return days[new Date(selectedDate).getDay()] || 'Monday';
  }, [selectedDate]);

  // Find classes scheduled on this day
  const daySchedule = useMemo(() => {
    const row = timetableSchedule.find((r) => r.day.toLowerCase() === dayName.toLowerCase());
    if (!row) return [];
    return row.slots.filter((s) => s.subject !== 'Free Slot');
  }, [timetableSchedule, dayName]);

  const handleLaunchDrawer = (e) => {
    e.preventDefault();
    if (isOverrideMode) {
      onLoadStudents({
        subject: overrideSubject,
        room: overrideRoom,
        timeslot: overrideTimeslot,
        classCode: overrideClass,
        departmentCode: overrideDept,
        date: selectedDate,
        isOverride: true
      });
    } else {
      const slot = daySchedule[selectedSlotIndex];
      if (!slot) return;
      onLoadStudents({
        subject: slot.subject,
        room: slot.room,
        timeslot: slot.time,
        classCode: slot.classCode,
        date: selectedDate,
        isOverride: false
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Attendance Management</h2>
            {pendingCount > 0 ? (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {String(pendingCount).padStart(2, '0')} Pending Today
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All Caught Up
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mark attendance manually by selecting a date, scheduled lecture, or marking an override/substitute class.
          </p>
        </div>
      </div>

      {/* Manual Selection Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl">
        <form onSubmit={handleLaunchDrawer} className="space-y-6">
          
          {/* Step 1: Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Step 1: Select Attendance Date
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  onDateChange(e.target.value);
                  setSelectedSlotIndex(0);
                }}
                className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
              />
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200">
                {dayName}
              </span>
            </div>
          </div>

          {/* Override Checkbox */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOverrideMode}
                onChange={(e) => setIsOverrideMode(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-sm font-bold text-slate-800">
                  Override / Other Class (Substitute Lecture)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check this box if you are conducting an unscheduled lecture, lab session, or taking a substitute class for another faculty member.
                </p>
              </div>
            </label>
          </div>

          {/* Step 2A: Scheduled Class Dropdown (Standard Mode) */}
          {!isOverrideMode ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Step 2: Scheduled Lectures for {dayName}
              </label>
              {daySchedule.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedSlotIndex}
                    onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs bg-white"
                  >
                    {daySchedule.map((slot, idx) => (
                      <option key={idx} value={idx}>
                        {slot.subject} ({slot.room}) • {slot.time} • Class {slot.classCode}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Showing {daySchedule.length} scheduled class block(s) from your weekly timetable.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  No classes scheduled on {dayName}. If you took a class, check <strong>"Override / Other Class"</strong> above.
                </div>
              )}
            </div>
          ) : (
            /* Step 2B: Override Form Fields */
            <div className="space-y-4 p-5 rounded-xl border border-blue-200 bg-blue-50/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Substitute Class Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={overrideDept}
                    onChange={(e) => setOverrideDept(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="CSE">Computer Science & Eng (CSE)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Division</label>
                  <select
                    value={overrideClass}
                    onChange={(e) => setOverrideClass(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="2R1">2R1 (Second Year CSE Div 1)</option>
                    <option value="2R2">2R2 (Second Year CSE Div 2)</option>
                    <option value="3R">3R (Third Year CSE)</option>
                    <option value="4R">4R (Final Year CSE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Topic Name</label>
                  <input
                    type="text"
                    value={overrideSubject}
                    onChange={(e) => setOverrideSubject(e.target.value)}
                    placeholder="e.g. Data Structures (Substitute)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Lab Number</label>
                  <input
                    type="text"
                    value={overrideRoom}
                    onChange={(e) => setOverrideRoom(e.target.value)}
                    placeholder="e.g. Room 201 or Lab 02"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Timeslot</label>
                  <select
                    value={overrideTimeslot}
                    onChange={(e) => setOverrideTimeslot(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="09:00 - 10:30 AM">09:00 - 10:30 AM</option>
                    <option value="11:00 - 12:30 PM">11:00 - 12:30 PM</option>
                    <option value="01:30 - 03:00 PM">01:30 - 03:00 PM</option>
                    <option value="03:30 - 05:00 PM">03:30 - 05:00 PM</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Trigger Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isOverrideMode && daySchedule.length === 0}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Load Students & Open Marking Drawer</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ManualAttendanceView;
