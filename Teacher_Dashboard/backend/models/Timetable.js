import { prisma } from '../config/db.js';

export const TimetableModel = {
  findMany: (args) => prisma.timetable.findMany(args),
  findUnique: (args) => prisma.timetable.findUnique(args),
  findFirst: (args) => prisma.timetable.findFirst(args),
};

export default TimetableModel;

