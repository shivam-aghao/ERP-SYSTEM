import { prisma } from '../config/db.js';
import { parseDateOnly, formatDateToYMD, getPeriodTiming } from '../utils/dateHelpers.js';
import { CardService } from './card.service.js';

export class AttendanceService {
  static async resolveSessionEntities({ department, classId, subjectCode, subjectName, subject, teacherId }) {
    const subjStr = subject || (subjectCode ? (subjectName ? `${subjectCode} - ${subjectName}` : subjectCode) : '');
    const { dept, cls, subj } = await CardService.resolveEntities({
      department: department || 'CSE',
      classId,
      subject: subjStr,
      teacherId,
    });
    return { dept, cls, subj };
  }

  static async checkDuplicate({ department, classId, date, subjectCode, period }) {
    const sessionDate = parseDateOnly(date);

    const cls = await prisma.class.findFirst({
      where: {
        OR: [
          { id: classId },
          { name: classId },
        ],
      },
    });

    if (!cls) return false;

    const subj = await prisma.subject.findFirst({
      where: {
        OR: [
          { id: subjectCode },
          { code: subjectCode },
        ],
      },
    });

    if (!subj) return false;

    const where = {
      classId: cls.id,
      subjectId: subj.id,
      sessionDate,
      status: 'SUBMITTED',
    };

    if (period) {
      where.periodNo = parseInt(period, 10);
    }

    const session = await prisma.attendanceSession.findFirst({
      where,
    });

    return Boolean(session);
  }

  static async getDraft(teacherId, { classId, subjectCode, date, period }) {
    const sessionDate = parseDateOnly(date);

    const cls = await prisma.class.findFirst({
      where: { OR: [{ id: classId }, { name: classId }] },
    });
    if (!cls) return null;

    const subj = await prisma.subject.findFirst({
      where: { OR: [{ id: subjectCode }, { code: subjectCode }] },
    });
    if (!subj) return null;

    const session = await prisma.attendanceSession.findFirst({
      where: {
        teacherId,
        classId: cls.id,
        subjectId: subj.id,
        sessionDate,
        status: 'DRAFT',
      },
      include: {
        records: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!session) return null;

    return {
      id: session.id,
      teacherId: session.teacherId,
      classId: cls.name,
      subjectCode: subj.code,
      subjectName: subj.name,
      date: formatDateToYMD(session.sessionDate),
      period: session.periodNo,
      sessionType: session.sessionType,
      topic: session.topicTaught,
      remark: session.remark,
      status: session.status,
      records: session.records.map((r) => ({
        studentId: r.studentId,
        rollNo: r.student.rollNo,
        name: r.student.fullName,
        status: r.status,
      })),
    };
  }

  static async saveDraft(teacherId, data) {
    const { dept, cls, subj } = await this.resolveSessionEntities({
      department: data.department,
      classId: data.classId,
      subjectCode: data.subjectCode,
      subjectName: data.subjectName,
      subject: data.subject,
      teacherId,
    });

    const sessionDate = parseDateOnly(data.date);
    const periodNo = data.period || data.periodNo || 1;
    const timing = getPeriodTiming(periodNo);

    const existing = await prisma.attendanceSession.findFirst({
      where: {
        classId: cls.id,
        subjectId: subj.id,
        sessionDate,
        periodNo,
      },
    });

    if (existing && existing.status === 'SUBMITTED') {
      const err = new Error('This session has already been submitted and cannot be modified as a draft.');
      err.statusCode = 423;
      err.code = 'SESSION_LOCKED';
      throw err;
    }

    const totalStudents = data.records ? data.records.length : (cls.strength || 60);
    const presentCount = data.records ? data.records.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length : 0;
    const absentCount = data.records ? data.records.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length : 0;
    const rate = totalStudents > 0 ? parseFloat(((presentCount / totalStudents) * 100).toFixed(1)) : 0.0;

    let sessionId;
    if (existing) {
      const updated = await prisma.attendanceSession.update({
        where: { id: existing.id },
        data: {
          teacherId,
          topicTaught: data.topic || data.topicTaught || existing.topicTaught,
          additionalTopics: data.additionalTopics || existing.additionalTopics,
          remark: data.remark || existing.remark,
          sessionType: data.sessionType || existing.sessionType,
          totalStudents,
          presentCount,
          absentCount,
          attendanceRate: rate,
          status: 'DRAFT',
        },
      });
      sessionId = updated.id;
    } else {
      const created = await prisma.attendanceSession.create({
        data: {
          teacherId,
          classId: cls.id,
          subjectId: subj.id,
          sessionDate,
          periodNo,
          startTime: data.startTime || timing.start,
          endTime: data.endTime || timing.end,
          sessionType: data.sessionType || 'REGULAR',
          topicTaught: data.topic || data.topicTaught || '',
          additionalTopics: data.additionalTopics || '',
          remark: data.remark || '',
          status: 'DRAFT',
          totalStudents,
          presentCount,
          absentCount,
          attendanceRate: rate,
        },
      });
      sessionId = created.id;
    }

    if (data.records && Array.isArray(data.records)) {
      for (const rec of data.records) {
        let studentId = rec.studentId;
        if (!studentId && rec.rollNo) {
          const student = await prisma.student.findFirst({
            where: { classId: cls.id, rollNo: parseInt(rec.rollNo, 10) },
          });
          if (student) studentId = student.id;
        }

        if (studentId) {
          const status = (rec.status || 'UNMARKED').toUpperCase();
          await prisma.attendanceRecord.upsert({
            where: {
              sessionId_studentId: {
                sessionId,
                studentId,
              },
            },
            create: {
              sessionId,
              studentId,
              status,
            },
            update: {
              status,
            },
          });
        }
      }
    }

    return {
      sessionId,
      message: 'Draft saved successfully',
      status: 'DRAFT',
    };
  }

  static async submitAttendance(teacherId, data) {
    const { dept, cls, subj } = await this.resolveSessionEntities({
      department: data.department,
      classId: data.classId,
      subjectCode: data.subjectCode,
      subjectName: data.subjectName,
      subject: data.subject,
      teacherId,
    });

    const sessionDate = parseDateOnly(data.date);
    const periodNo = data.period || data.periodNo || 1;
    const timing = getPeriodTiming(periodNo);

    const existing = await prisma.attendanceSession.findFirst({
      where: {
        classId: cls.id,
        subjectId: subj.id,
        sessionDate,
        periodNo,
      },
    });

    if (existing && existing.status === 'LOCKED') {
      const err = new Error('Attendance session is locked and cannot be modified.');
      err.statusCode = 423;
      err.code = 'SESSION_LOCKED';
      throw err;
    }

    const records = data.records || [];
    const totalStudents = records.length > 0 ? records.length : cls.strength;
    const presentCount = records.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;
    const absentCount = records.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length;
    const rate = totalStudents > 0 ? parseFloat(((presentCount / totalStudents) * 100).toFixed(1)) : 0.0;

    const result = await prisma.$transaction(async (tx) => {
      let session;
      if (existing) {
        session = await tx.attendanceSession.update({
          where: { id: existing.id },
          data: {
            teacherId,
            status: 'SUBMITTED',
            topicTaught: data.topic || data.topicTaught || existing.topicTaught,
            additionalTopics: data.additionalTopics || existing.additionalTopics,
            remark: data.remark || existing.remark,
            sessionType: data.sessionType || existing.sessionType,
            totalStudents,
            presentCount,
            absentCount,
            attendanceRate: rate,
            submittedAt: new Date(),
          },
        });
      } else {
        session = await tx.attendanceSession.create({
          data: {
            teacherId,
            classId: cls.id,
            subjectId: subj.id,
            sessionDate,
            periodNo,
            startTime: data.startTime || timing.start,
            endTime: data.endTime || timing.end,
            sessionType: data.sessionType || 'REGULAR',
            topicTaught: data.topic || data.topicTaught || '',
            additionalTopics: data.additionalTopics || '',
            remark: data.remark || '',
            status: 'SUBMITTED',
            totalStudents,
            presentCount,
            absentCount,
            attendanceRate: rate,
            submittedAt: new Date(),
          },
        });
      }

      for (const rec of records) {
        let studentId = rec.studentId;
        if (!studentId && rec.rollNo) {
          const student = await tx.student.findFirst({
            where: { classId: cls.id, rollNo: parseInt(rec.rollNo, 10) },
          });
          if (student) studentId = student.id;
        }

        if (studentId) {
          const stStatus = (rec.status || 'ABSENT').toUpperCase();
          const charCode = stStatus === 'PRESENT' ? 'P' : 'A';

          await tx.attendanceRecord.upsert({
            where: {
              sessionId_studentId: {
                sessionId: session.id,
                studentId,
              },
            },
            create: {
              sessionId: session.id,
              studentId,
              status: stStatus,
            },
            update: {
              status: stStatus,
            },
          });

          const existingSummary = await tx.attendanceHistorySummary.findUnique({
            where: {
              studentId_subjectId: {
                studentId,
                subjectId: subj.id,
              },
            },
          });

          const currentHistory = existingSummary?.last10Statuses || '';
          const newHistory = (currentHistory + charCode).slice(-10);

          await tx.attendanceHistorySummary.upsert({
            where: {
              studentId_subjectId: {
                studentId,
                subjectId: subj.id,
              },
            },
            create: {
              studentId,
              classId: cls.id,
              subjectId: subj.id,
              last10Statuses: newHistory,
            },
            update: {
              last10Statuses: newHistory,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'SUBMIT_ATTENDANCE',
          entity: 'AttendanceSession',
          entityId: session.id,
          payload: {
            class: cls.name,
            subject: subj.code,
            date: formatDateToYMD(sessionDate),
            presentCount,
            absentCount,
            totalStudents,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: teacherId,
          title: 'Attendance Submitted',
          message: `Attendance marked for ${cls.name} (${subj.name}) on ${formatDateToYMD(sessionDate)}. ${presentCount}/${totalStudents} present (${rate}%).`,
          type: 'SUCCESS',
        },
      });

      return session;
    });

    return {
      sessionId: result.id,
      message: 'Attendance submitted successfully',
      status: 'SUBMITTED',
      summary: {
        total: totalStudents,
        present: presentCount,
        absent: absentCount,
        attendanceRate: rate,
      },
    };
  }

  static async getAllRecords(teacherId = null) {
    const where = {
      status: 'SUBMITTED',
    };
    if (teacherId) {
      where.teacherId = teacherId;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      orderBy: { sessionDate: 'desc' },
      include: {
        class: {
          include: {
            department: true,
          },
        },
        subject: true,
        teacher: true,
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      teacherId: s.teacherId,
      teacherName: s.teacher.fullName,
      department: s.class.department.code,
      departmentName: s.class.department.name,
      classId: s.class.name,
      subjectCode: s.subject.code,
      subjectName: s.subject.name,
      subject: `${s.subject.code} - ${s.subject.name}`,
      date: formatDateToYMD(s.sessionDate),
      period: s.periodNo,
      sessionType: s.sessionType,
      topic: s.topicTaught,
      remark: s.remark,
      status: s.status,
      totalStudents: s.totalStudents,
      presentCount: s.presentCount,
      absentCount: s.absentCount,
      attendanceRate: s.attendanceRate,
      submittedAt: s.submittedAt,
    }));
  }

  static async getSessionDetails(sessionId) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class: { include: { department: true } },
        subject: true,
        teacher: true,
        records: {
          include: {
            student: true,
          },
          orderBy: {
            student: { rollNo: 'asc' },
          },
        },
      },
    });

    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    return {
      id: session.id,
      teacherId: session.teacherId,
      teacherName: session.teacher.fullName,
      department: session.class.department.code,
      classId: session.class.name,
      subjectCode: session.subject.code,
      subjectName: session.subject.name,
      date: formatDateToYMD(session.sessionDate),
      period: session.periodNo,
      sessionType: session.sessionType,
      topic: session.topicTaught,
      remark: session.remark,
      status: session.status,
      totalStudents: session.totalStudents,
      presentCount: session.presentCount,
      absentCount: session.absentCount,
      attendanceRate: session.attendanceRate,
      records: session.records.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        rollNo: r.student.rollNo,
        studentCode: r.student.studentCode,
        fullName: r.student.fullName,
        status: r.status,
      })),
    };
  }
}
