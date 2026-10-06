import { prisma } from '../config/db.js';

const MOCK_SYLLABUS = [
  { unitNumber: 1, unitName: 'Introduction to Data Structures & Arrays', completionPercent: 100 },
  { unitNumber: 2, unitName: 'Stacks, Queues and Recursion', completionPercent: 90 },
  { unitNumber: 3, unitName: 'Linked Lists (Singly, Doubly, Circular)', completionPercent: 75 },
  { unitNumber: 4, unitName: 'Trees, Binary Search Trees & AVL Trees', completionPercent: 40 },
  { unitNumber: 5, unitName: 'Graphs, BFS, DFS & Shortest Path', completionPercent: 10 },
  { unitNumber: 6, unitName: 'Hashing, Sorting & Searching Techniques', completionPercent: 0 },
];

export const syllabusService = {
  async getSyllabusProgress(subjectCode, classCode) {
    try {
      const units = await prisma.syllabusProgress.findMany({
        where: { subjectCode, classCode },
        orderBy: { unitNumber: 'asc' },
      });
      if (units && units.length > 0) return units;
    } catch (_) {}

    return MOCK_SYLLABUS.map((u) => ({
      id: `syl-${subjectCode}-${u.unitNumber}`,
      subjectCode,
      classCode,
      ...u,
      updatedAt: new Date(),
    }));
  },

  async updateUnitProgress(subjectCode, classCode, unitNumber, completionPercent, facultyId) {
    try {
      const updated = await prisma.syllabusProgress.upsert({
        where: {
          subjectCode_classCode_unitNumber: {
            subjectCode,
            classCode,
            unitNumber: Number(unitNumber),
          },
        },
        update: {
          completionPercent: Number(completionPercent),
          updatedAt: new Date(),
        },
        create: {
          subjectCode,
          classCode,
          unitNumber: Number(unitNumber),
          unitName: `Unit ${unitNumber}`,
          completionPercent: Number(completionPercent),
          facultyId: facultyId || 'a0000000-0000-0000-0000-000000000001',
        },
      });
      return updated;
    } catch (_) {
      return {
        subjectCode,
        classCode,
        unitNumber: Number(unitNumber),
        completionPercent: Number(completionPercent),
        updatedAt: new Date(),
      };
    }
  },
};

export default syllabusService;

