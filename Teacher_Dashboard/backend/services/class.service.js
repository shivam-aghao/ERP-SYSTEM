import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const MOCK_CLASSES = [
  {
    code: '2R1',
    departmentCode: 'CSE',
    name: 'Second Year CSE - Div A',
    semester: 'Semester 3',
    studentsCount: 60,
    room: 'Room 201',
    academicYear: '2026-2027',
    subjects: [
      { code: 'CS301', name: 'Data Structures', lectureTime: '09:00 - 10:30 AM' },
      { code: 'CS302', name: 'Data Structures Lab', lectureTime: '03:30 - 05:00 PM' },
    ],
  },
  {
    code: '2R2',
    departmentCode: 'CSE',
    name: 'Second Year CSE - Div B',
    semester: 'Semester 3',
    studentsCount: 58,
    room: 'Room 305',
    academicYear: '2026-2027',
    subjects: [
      { code: 'CS303', name: 'Java Programming', lectureTime: '11:00 - 12:30 PM' },
    ],
  },
  {
    code: '3R',
    departmentCode: 'CSE',
    name: 'Third Year CSE',
    semester: 'Semester 5',
    studentsCount: 62,
    room: 'Room 304',
    academicYear: '2026-2027',
    subjects: [
      { code: 'CS501', name: 'Database Systems', lectureTime: '01:30 - 03:00 PM' },
      { code: 'CS502', name: 'Operating Systems', lectureTime: '03:30 - 05:00 PM' },
    ],
  },
  {
    code: '4R',
    departmentCode: 'CSE',
    name: 'Final Year CSE',
    semester: 'Semester 7',
    studentsCount: 60,
    room: 'Room 401',
    academicYear: '2026-2027',
    subjects: [
      { code: 'CS701', name: 'Algorithms', lectureTime: '11:00 - 12:30 PM' },
      { code: 'CS702', name: 'Project Guidance', lectureTime: '03:30 - 05:00 PM' },
    ],
  },
];

export const classService = {
  async getAllClasses(filters = {}) {
    const departmentCode = typeof filters === 'string' ? filters : filters?.departmentCode;
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

    if (departmentCode && typeof departmentCode === 'string') {
      return MOCK_CLASSES.filter((c) => c.departmentCode.toLowerCase() === departmentCode.toLowerCase());
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

