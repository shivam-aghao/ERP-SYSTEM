import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { generateSessionCode } from '../utils/dateHelpers.js';
import { serializeAttendanceSession } from '../serializers/attendance.serializer.js';

export class AttendanceService {
  static async checkDuplicate(teacherId, dept, cls, sub, date, period) {
    const sessionDate = new Date(date);
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        teacherId,
        departmentCode: dept,
        classCode: cls,
        subjectCode: sub,
        sessionDate,
        ...(period ? { period: Number(period) } : {})
      }
    });

    return {
      isDuplicate: Boolean(existing),
      session: existing ? serializeAttendanceSession(existing) : null
    };
  }

  static async submitAttendance(teacherId, payload, isDraft = false) {
    const dept = payload.departmentCode || payload.department;
    const cls = payload.classCode || payload.classId;
    const sub = payload.subjectCode;
    const sessionDate = new Date(payload.date);
    const period = payload.period ? Number(payload.period) : 1;

    const sessionCode = generateSessionCode(dept, cls, sub, payload.date, period);

    const totalStudents = payload.students.length;
    const presentCount = payload.students.filter(
      (s) => s.status?.toUpperCase() === 'PRESENT'
    ).length;
    const absentCount = totalStudents - presentCount;
    const percentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    const session = await prisma.$transaction(async (tx) => {
      const savedSession = await tx.attendanceSession.upsert({
        where: {
          unique_session: {
            teacherId,
            departmentCode: dept,
            classCode: cls,
            subjectCode: sub,
            sessionDate,
            period
          }
        },
        create: {
          sessionCode,
          teacherId,
          departmentCode: dept,
          classCode: cls,
          subjectCode: sub,
          sessionDate,
          period,
          timeSlot: payload.timeSlot || '09:00 AM - 10:00 AM',
          topicTaught: payload.topicTaught || 'General Lecture',
          remark: payload.remark || '',
          totalStudents,
          presentCount,
          absentCount,
          percentage,
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
          submittedAt: isDraft ? null : new Date()
        },
        update: {
          totalStudents,
          presentCount,
          absentCount,
          percentage,
          timeSlot: payload.timeSlot || undefined,
          topicTaught: payload.topicTaught || undefined,
          remark: payload.remark || undefined,
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
          submittedAt: isDraft ? null : new Date()
        }
      });

      await tx.attendanceRecord.deleteMany({
        where: { sessionId: savedSession.id }
      });

      const recordsData = payload.students.map((st) => ({
        sessionId: savedSession.id,
        studentId: st.id || st.studentId,
        status: st.status?.toUpperCase() === 'PRESENT' ? 'PRESENT' : 'ABSENT',
        previousHistory: st.history || []
      }));

      await tx.attendanceRecord.createMany({
        data: recordsData
      });

      return await tx.attendanceSession.findUnique({
        where: { id: savedSession.id },
        include: {
          department: true,
          class: true,
          subject: true,
          records: {
            include: { student: true }
          }
        }
      });
    });

    return serializeAttendanceSession(session);
  }

  static async getTeacherSessions(teacherId) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { teacherId },
      include: {
        department: true,
        class: true,
        subject: true
      },
      orderBy: { sessionDate: 'desc' }
    });

    return sessions.map(serializeAttendanceSession);
  }

  static async getSessionDetails(sessionId, teacherId) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        department: true,
        class: true,
        subject: true,
        records: {
          include: { student: true }
        }
      }
    });

    if (!session) throw new ApiError(404, 'Attendance session not found');
    if (session.teacherId !== teacherId) throw new ApiError(403, 'Forbidden');

    return serializeAttendanceSession(session);
  }
}
