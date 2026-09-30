import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const MOCK_SUBJECTS = [
  { code: 'CS302', name: 'Data Structures & Algorithms', classCode: '2R1', facultyId: 'a0000000-0000-0000-0000-000000000001', credits: '4 Credits', icon: 'binary', lectureTime: '10:00 AM - 11:00 AM', semester: 'Semester 3' },
  { code: 'CS501', name: 'Database Management Systems', classCode: '3R', facultyId: 'a0000000-0000-0000-0000-000000000001', credits: '4 Credits', icon: 'database', lectureTime: '11:15 AM - 12:15 PM', semester: 'Semester 5' },
  { code: 'CS702', name: 'Information & Cyber Security', classCode: '4R', facultyId: 'a0000000-0000-0000-0000-000000000001', credits: '3 Credits', icon: 'shield', lectureTime: '02:00 PM - 03:00 PM', semester: 'Semester 7' },
];

export const subjectService = {
  async getAllSubjects(filters = {}) {
    const { classCode, facultyId } = filters;
    try {
      const where = {};
      if (classCode) where.classCode = classCode;
      if (facultyId) where.facultyId = facultyId;

      const subjects = await prisma.subject.findMany({
        where,
        include: {
          class: true,
          faculty: true,
        },
        orderBy: { code: 'asc' },
      });
      if (subjects && subjects.length > 0) return subjects;
    } catch (_) {}

    let filtered = [...MOCK_SUBJECTS];
    if (classCode) filtered = filtered.filter((s) => s.classCode === classCode);
    if (facultyId) filtered = filtered.filter((s) => s.facultyId === facultyId);
    return filtered;
  },

  async getSubjectByCode(code) {
    try {
      const subject = await prisma.subject.findUnique({
        where: { code },
        include: {
          class: true,
          faculty: true,
          syllabusProgress: { orderBy: { unitNumber: 'asc' } },
        },
      });
      if (subject) return subject;
    } catch (_) {}

    const found = MOCK_SUBJECTS.find((s) => s.code === code);
    if (!found) throw new ApiError(404, `Subject ${code} not found`);
    return found;
  },
};

export default subjectService;

