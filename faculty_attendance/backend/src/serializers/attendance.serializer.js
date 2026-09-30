import { formatDisplayDate } from '../utils/dateHelpers.js';

export const serializeAttendanceSession = (session) => {
  if (!session) return null;
  return {
    id: session.id,
    sessionCode: session.sessionCode,
    department: session.departmentCode,
    departmentName: session.department?.name || session.departmentCode,
    classId: session.classCode,
    className: session.class?.name || session.classCode,
    subjectCode: session.subjectCode,
    subjectName: session.subject?.name || session.subjectCode,
    date: session.sessionDate.toISOString().split('T')[0],
    dateFormatted: formatDisplayDate(session.sessionDate),
    period: session.period,
    timeSlot: session.timeSlot,
    sessionType: session.sessionType,
    topicTaught: session.topicTaught,
    remark: session.remark,
    totalStudents: session.totalStudents,
    presentCount: session.presentCount,
    absentCount: session.absentCount,
    percentage: Number(session.percentage),
    status: session.status,
    submittedAt: session.submittedAt,
    students: session.records?.map((r) => ({
      id: r.studentId,
      studentId: r.studentId,
      name: r.student?.name,
      rollNo: r.student?.rollFormatted || String(r.student?.rollNumber),
      prn: r.student?.prn,
      status: r.status,
      isProvisional: r.student?.isProvisional || false,
      history: r.previousHistory || []
    }))
  };
};
