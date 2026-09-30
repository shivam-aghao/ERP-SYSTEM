import { prisma } from '../config/db.js';

export class StudentService {
  static async getStudentsByClass(classIdentifier, subjectIdentifier = null) {
    const cls = await prisma.class.findFirst({
      where: {
        OR: [
          { id: classIdentifier },
          { name: classIdentifier },
        ],
      },
    });

    if (!cls) {
      return [];
    }

    let subjectId = null;
    if (subjectIdentifier) {
      const subj = await prisma.subject.findFirst({
        where: {
          OR: [
            { id: subjectIdentifier },
            { code: subjectIdentifier },
          ],
        },
      });
      if (subj) subjectId = subj.id;
    }

    const students = await prisma.student.findMany({
      where: {
        classId: cls.id,
        isActive: true,
      },
      orderBy: { rollNo: 'asc' },
      include: {
        histories: subjectId
          ? { where: { subjectId } }
          : true,
      },
    });

    return students.map((s) => {
      const historySummary = s.histories?.[0]?.last10Statuses || 'PPPPPPPPPP';
      return {
        id: s.id,
        studentId: s.id,
        studentCode: s.studentCode,
        rollNo: s.rollNo,
        name: s.fullName,
        fullName: s.fullName,
        isProvisional: s.isProvisional,
        history: historySummary,
        classId: cls.id,
        className: cls.name,
      };
    });
  }
}
