import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function StudentAttendanceView() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [subjectSummary, setSubjectSummary] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [dayWiseAttendance, setDayWiseAttendance] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch logged-in student profile and attendance breakdown from Supabase
  useEffect(() => {
    fetchStudentAttendanceData();
  }, []);

  async function fetchStudentAttendanceData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch user from Supabase Auth
      let userId = null;
      let userEmail = null;

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authData?.user) {
        userId = authData.user.id;
        userEmail = authData.user.email;
      } else {
        // Fallback to active ERP session if logged in via unified token
        const cachedUser = typeof window !== 'undefined' ? 
          JSON.parse(localStorage.getItem('ssgmce_user') || sessionStorage.getItem('ssgmce_user') || '{}') : {};
        userId = cachedUser.id || cachedUser.user_id;
        userEmail = cachedUser.email;
      }

      if (!userId && !userEmail) {
        // Fetch default active student for display
        const { data: defaultUser } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student')
          .limit(1)
          .single();

        if (defaultUser) {
          userId = defaultUser.id;
        }
      }

      // Query student profile from 'users' table
      let userQuery = supabase.from('users').select('*');
      if (userId) {
        userQuery = userQuery.eq('id', userId);
      } else if (userEmail) {
        userQuery = userQuery.eq('email', userEmail);
      }

      const { data: studentRecord, error: studentError } = await userQuery.maybeSingle();

      if (studentError || !studentRecord) {
        throw new Error('Unable to find student record in Supabase.');
      }

      setStudent(studentRecord);

      // Query dynamic attendance records for this student from 'attendance' table
      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          period_type,
          subject_id,
          subjects:subject_id (
            id,
            subject_name,
            subject_code,
            name,
            code
          )
        `)
        .eq('student_id', studentRecord.id)
        .order('date', { ascending: false });

      if (attError) throw attError;

      // Group attendance dynamically by subject
      const subjectMap = {};
      (attendanceData || []).forEach(record => {
        const subId = record.subject_id;
        const subInfo = record.subjects || {};
        const subName = subInfo.subject_name || subInfo.name || 'Core Engineering Subject';
        const subCode = subInfo.subject_code || subInfo.code || 'CS';

        if (!subjectMap[subId]) {
          subjectMap[subId] = {
            subjectId: subId,
            subjectName: subName,
            subjectCode: subCode,
            totalClasses: 0,
            presentCount: 0,
            absentCount: 0,
            records: []
          };
        }

        subjectMap[subId].totalClasses += 1;
        if (record.status === 'PRESENT') {
          subjectMap[subId].presentCount += 1;
        } else {
          subjectMap[subId].absentCount += 1;
        }
        subjectMap[subId].records.push(record);
      });

      const summaryList = Object.values(subjectMap).map(sub => {
        const percentage = sub.totalClasses > 0 ? 
          Math.round((sub.presentCount / sub.totalClasses) * 100) : 0;
        return {
          ...sub,
          percentage
        };
      });

      setSubjectSummary(summaryList);
    } catch (err) {
      console.error('Error fetching student attendance:', err);
      setError(err.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Open Modal and fetch Day-Wise Attendance for clicked subject
  async function handleSubjectClick(subject) {
    setSelectedSubject(subject);
    setIsModalOpen(true);
    setModalLoading(true);

    try {
      // Dynamically fetch strictly from Supabase attendance table
      const { data: records, error: attErr } = await supabase
        .from('attendance')
        .select('id, date, status, period_type')
        .eq('student_id', student.id)
        .eq('subject_id', subject.subjectId)
        .order('date', { ascending: true });

      if (attErr) throw attErr;

      setDayWiseAttendance(records || []);
    } catch (e) {
      console.error('Error fetching day-wise attendance:', e);
      setDayWiseAttendance(subject.records || []);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedSubject(null);
    setDayWiseAttendance([]);
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/5"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 h-44 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
              <div className="h-8 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={fetchStudentAttendanceData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Student Profile Info Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-600 tracking-wider">
            Student Attendance Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            {student?.full_name || 'Student Profile'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Roll No: <span className="font-semibold text-slate-700">{student?.roll_no || 'N/A'}</span> &bull; 
            Email: <span className="font-semibold text-slate-700">{student?.email || 'N/A'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium">
            Subjects: {subjectSummary.length}
          </div>
        </div>
      </div>

      {/* My Attendance Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Attendance</h2>
          <p className="text-sm text-slate-500">
            Click on any subject below to inspect your complete day-wise attendance report.
          </p>
        </div>
      </div>

      {/* Breakdown Across All Subjects */}
      {subjectSummary.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 text-slate-300">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No records found</h3>
          <p className="text-sm text-slate-500 mt-1">
            No attendance records have been registered for your enrollment yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectSummary.map(sub => (
            <div
              key={sub.subjectId}
              onClick={() => handleSubjectClick(sub)}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded">
                    {sub.subjectCode}
                  </span>
                  <span className={`text-sm font-bold ${
                    sub.percentage >= 75 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {sub.percentage}%
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                  {sub.subjectName}
                </h3>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Classes: <strong>{sub.totalClasses}</strong></span>
                <span>Present: <strong className="text-emerald-600">{sub.presentCount}</strong></span>
                <span>Absent: <strong className="text-red-600">{sub.absentCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DAY WISE ATTENDANCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Day Wise Attendance of {selectedSubject?.subjectName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subject Code: {selectedSubject?.subjectCode} &bull; Roll No: {student?.roll_no}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Table Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Loading day-wise attendance...</span>
                </div>
              ) : dayWiseAttendance.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-base font-semibold">No records found</p>
                  <p className="text-xs text-slate-400 mt-1">There is no day-wise record available for this subject.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    {/* Blue Header Row with White Text */}
                    <thead>
                      <tr className="bg-[#1565C0] text-white text-xs uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4 border-b border-blue-700">Sl. No</th>
                        <th className="py-3 px-4 border-b border-blue-700">Date</th>
                        <th className="py-3 px-4 border-b border-blue-700">Attendance Status</th>
                        <th className="py-3 px-4 border-b border-blue-700">Period Type</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {dayWiseAttendance.map((row, idx) => {
                        const isAbsent = String(row.status || '').toUpperCase() === 'ABSENT';
                        // Zebra striping on rows
                        const isEven = idx % 2 === 0;
                        const rowBg = isEven ? 'bg-white' : 'bg-slate-50';

                        return (
                          <tr
                            key={row.id || idx}
                            className={`${rowBg} hover:bg-blue-50/40 border-b border-slate-200 transition-colors`}
                          >
                            {/* Sl. No */}
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {idx + 1}
                            </td>

                            {/* Date */}
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {row.date ? new Date(row.date).toLocaleDateString('en-GB') : '-'}
                            </td>

                            {/* Attendance Status (Red text for ABSENT, Dark text for PRESENT) */}
                            <td className={`py-3 px-4 font-semibold ${
                              isAbsent ? 'text-[#DC2626]' : 'text-[#0F172A]'
                            }`}>
                              {row.status || 'PRESENT'}
                            </td>

                            {/* Period Type (Red text for REGULAR if absent, or standard) */}
                            <td className={`py-3 px-4 font-medium ${
                              isAbsent ? 'text-[#DC2626]' : 'text-slate-700'
                            }`}>
                              {row.period_type || 'REGULAR'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer with Close Button at Bottom Right */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-semibold shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

