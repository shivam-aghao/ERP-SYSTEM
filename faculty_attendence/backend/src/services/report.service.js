import { prisma } from '../config/db.js';
import { formatDateToYMD } from '../utils/dateHelpers.js';

export class ReportService {
  static async getClassStats(classId) {
    const cls = await prisma.class.findFirst({
      where: { OR: [{ id: classId }, { name: classId }] },
    });

    if (!cls) {
      const err = new Error('Class not found');
      err.statusCode = 404;
      err.code = 'CLASS_NOT_FOUND';
      throw err;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: { classId: cls.id, status: 'SUBMITTED' },
      include: { subject: true },
    });

    const totalSessions = sessions.length;
    const avgAttendance = totalSessions > 0
      ? parseFloat((sessions.reduce((acc, s) => acc + s.attendanceRate, 0) / totalSessions).toFixed(1))
      : 0;

    return {
      classId: cls.name,
      totalStudents: cls.strength,
      totalSessions,
      averageAttendanceRate: avgAttendance,
      recentSessions: sessions.slice(-5).map(s => ({
        id: s.id,
        date: formatDateToYMD(s.sessionDate),
        subject: s.subject.code,
        attendanceRate: s.attendanceRate,
      })),
    };
  }

  static async generateSessionCsv(sessionId) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class: { include: { department: true } },
        subject: true,
        teacher: true,
        records: {
          include: { student: true },
          orderBy: { student: { rollNo: 'asc' } },
        },
      },
    });

    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    const header = ['Roll No', 'Student Code', 'Full Name', 'Status', 'Date', 'Class', 'Subject', 'Teacher'];
    const rows = session.records.map((r) => [
      r.student.rollNo,
      `"${r.student.studentCode}"`,
      `"${r.student.fullName}"`,
      r.status,
      formatDateToYMD(session.sessionDate),
      `"${session.class.name}"`,
      `"${session.subject.code} - ${session.subject.name}"`,
      `"${session.teacher.fullName}"`,
    ]);

    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    return {
      filename: `attendance_${session.class.name}_${formatDateToYMD(session.sessionDate)}.csv`,
      content: csvContent,
    };
  }
}
