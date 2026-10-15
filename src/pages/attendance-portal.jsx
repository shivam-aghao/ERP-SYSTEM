import React, { useState } from 'react';
import StudentAttendanceView from '../components/StudentDashboard/StudentAttendanceView';
import StudentAttendanceReportProfile from '../components/TeacherDashboard/Attendance/StudentAttendanceReportProfile';
import TeacherCertificationWallet from '../components/TeacherDashboard/CertificationWallet/TeacherCertificationWallet';

export default function AttendancePortalPage() {
  const [activePersona, setActivePersona] = useState('teacher'); // 'student' or 'teacher'
  const [teacherTab, setTeacherTab] = useState('attendance'); // 'attendance' or 'wallet'

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Top Navigation Bar */}
      <header className="bg-[#0B5CAD] text-white px-6 py-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">SSGMCE COLLEGE ERP</h1>
          <p className="text-xs text-blue-200">Autonomous Student Attendance & Faculty Credentials Portal</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-900/60 p-1 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setActivePersona('student')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activePersona === 'student' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'
              }`}
            >
              Student View
            </button>
            <button
              onClick={() => setActivePersona('teacher')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activePersona === 'teacher' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'
              }`}
            >
              Teacher View
            </button>
          </div>
        </div>
      </header>

      {/* Persona Sub-nav for Teacher */}
      {activePersona === 'teacher' && (
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-4 text-sm font-medium">
          <button
            onClick={() => setTeacherTab('attendance')}
            className={`pb-1 border-b-2 transition-colors ${
              teacherTab === 'attendance'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Attendance Report & Profile
          </button>
          <button
            onClick={() => setTeacherTab('wallet')}
            className={`pb-1 border-b-2 transition-colors ${
              teacherTab === 'wallet'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Certification Wallet
          </button>
        </div>
      )}

      {/* Main View Render */}
      <main className="py-6">
        {activePersona === 'student' ? (
          <StudentAttendanceView />
        ) : (
          teacherTab === 'attendance' ? (
            <StudentAttendanceReportProfile />
          ) : (
            <TeacherCertificationWallet />
          )
        )}
      </main>
    </div>
  );
}

