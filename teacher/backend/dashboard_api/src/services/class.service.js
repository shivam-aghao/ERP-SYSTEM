import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const MOCK_CLASSES = [
  { code: '2R1', departmentCode: 'CSE', name: 'Second Year CSE - Div A', semester: 'Semester 3', studentsCount: 65, room: 'Room 201', academicYear: '2024-2025' },
  { code: '2R2', departmentCode: 'CSE', name: 'Second Year CSE - Div B', semester: 'Semester 3', studentsCount: 63, room: 'Room 202', academicYear: '2024-2025' },
  { code: '3R', departmentCode: 'CSE', name: 'Third Year CSE', semester: 'Semester 5', studentsCount: 68, room: 'Room 301', academicYear: '2024-2025' },
  { code: '4R', departmentCode: 'CSE', name: 'Final Year CSE', semester: 'Semester 7', studentsCount: 62, room: 'Room 401', academicYear: '2024-2025' },
];

export const classService = {
  async getAllClasses(departmentCode) {
    try {
      const where = departmentCode ? { departmentCode } : {};
      const classes = await prisma.class.findMany({
        where,
        include: {
          department: true,
          subjects: true,
          _count: { select: { students: true } },
        },
        orderBy: { code: 'asc' },
      });
      if (classes && classes.length > 0) return classes;
    } catch (_) {}

    if (departmentCode) {
      return MOCK_CLASSES.filter((c) => c.departmentCode === departmentCode);
    }
    return MOCK_CLASSES;
  },

  async getClassByCode(code) {
    try {
      const cls = await prisma.class.findUnique({
        where: { code },
        include: {
          department: true,
          subjects: { include: { faculty: true } },
          students: { orderBy: { rollNo: 'asc' } },
        },
      });
      if (cls) return cls;
    } catch (_) {}

    const found = MOCK_CLASSES.find((c) => c.code === code);
    if (!found) throw new ApiError(404, `Class ${code} not found`);
    return found;
  },
};

export default classService;

