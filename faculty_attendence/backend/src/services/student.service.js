import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export class StudentService {
  static async getStudentsByClass(departmentCode, classCode) {
    const students = await prisma.student.findMany({
      where: {
        departmentCode,
        classCode
      },
      orderBy: { rollNumber: 'asc' }
    });

    return students.map((s) => ({
      id: s.id,
      studentId: s.id,
      rollNo: s.rollFormatted,
      rollNumber: s.rollNumber,
      studentCode: s.prn,
      prn: s.prn,
      name: s.name,
      fullName: s.name,
      isProvisional: s.isProvisional,
      history: ['P', 'P', 'P', 'P', 'A', 'P', 'P', 'P', 'P', 'P']
    }));
  }
}
