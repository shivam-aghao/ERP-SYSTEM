import { prisma } from '../config/db.js';

export class MasterDataService {
  static async getDepartments() {
    return await prisma.department.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  }

  static async getClasses(departmentCodeOrId) {
    const where = {};
    if (departmentCodeOrId) {
      where.department = {
        OR: [
          { id: departmentCodeOrId },
          { code: departmentCodeOrId },
        ],
      };
    }

    return await prisma.class.findMany({
      where,
      orderBy: [{ year: 'asc' }, { division: 'asc' }],
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  static async getSubjects(departmentCodeOrId, semester) {
    const where = {};
    if (departmentCodeOrId) {
      where.department = {
        OR: [
          { id: departmentCodeOrId },
          { code: departmentCodeOrId },
        ],
      };
    }
    if (semester) {
      where.semester = parseInt(semester, 10);
    }

    return await prisma.subject.findMany({
      where,
      orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }
}
