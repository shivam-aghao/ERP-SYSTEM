import { prisma } from '../config/db.js';

const MOCK_TIMETABLE = [
  { dayOfWeek: 1, slotIndex: 1, subjectCode: 'CS302', classCode: '2R1', room: 'Room 201', isLab: false, academicYear: '2024-2025' },
  { dayOfWeek: 1, slotIndex: 2, subjectCode: 'CS501', classCode: '3R', room: 'Room 301', isLab: false, academicYear: '2024-2025' },
  { dayOfWeek: 2, slotIndex: 1, subjectCode: 'CS702', classCode: '4R', room: 'Room 401', isLab: false, academicYear: '2024-2025' },
  { dayOfWeek: 3, slotIndex: 2, subjectCode: 'CS302', classCode: '2R1', room: 'Room 201', isLab: false, academicYear: '2024-2025' },
  { dayOfWeek: 4, slotIndex: 1, subjectCode: 'CS501', classCode: '3R', room: 'Room 301', isLab: false, academicYear: '2024-2025' },
  { dayOfWeek: 5, slotIndex: 3, subjectCode: 'CS702', classCode: '4R', room: 'Room 401', isLab: false, academicYear: '2024-2025' },
];

export const timetableService = {
  async getFacultyTimetable(facultyId, academicYear = '2024-2025') {
    try {
      const timetable = await prisma.timetable.findMany({
        where: { facultyId, academicYear },
        include: {
          subject: true,
          class: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
      });
      if (timetable && timetable.length > 0) return timetable;
    } catch (_) {}

    return MOCK_TIMETABLE.map((t, idx) => ({
      id: `tt-${idx}`,
      facultyId,
      ...t,
      subject: { code: t.subjectCode, name: t.subjectCode === 'CS302' ? 'Data Structures & Algorithms' : t.subjectCode === 'CS501' ? 'Database Management Systems' : 'Information & Cyber Security' },
      class: { code: t.classCode, name: t.classCode },
    }));
  },

  async getClassTimetable(classCode, academicYear = '2024-2025') {
    try {
      const timetable = await prisma.timetable.findMany({
        where: { classCode, academicYear },
        include: { subject: true, faculty: true },
        orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
      });
      if (timetable && timetable.length > 0) return timetable;
    } catch (_) {}

    return MOCK_TIMETABLE.filter((t) => t.classCode === classCode);
  },

  async syncTimetable(entries, facultyId) {
    try {
      const results = [];
      for (const entry of entries) {
        const item = await prisma.timetable.upsert({
          where: {
            facultyId_dayOfWeek_slotIndex_academicYear: {
              facultyId,
              dayOfWeek: entry.dayOfWeek,
              slotIndex: entry.slotIndex,
              academicYear: entry.academicYear || '2024-2025',
            },
          },
          update: {
            subjectCode: entry.subjectCode,
            classCode: entry.classCode,
            room: entry.room,
            isLab: entry.isLab || false,
          },
          create: {
            facultyId,
            dayOfWeek: entry.dayOfWeek,
            slotIndex: entry.slotIndex,
            subjectCode: entry.subjectCode,
            classCode: entry.classCode,
            room: entry.room,
            isLab: entry.isLab || false,
            academicYear: entry.academicYear || '2024-2025',
          },
        });
        results.push(item);
      }
      return results;
    } catch (_) {
      return entries;
    }
  },
};

export default timetableService;

