import { prisma } from '../config/db.js';

export const AttendanceSessionModel = {
  findMany: (args) => prisma.attendanceSession.findMany(args),
  findUnique: (args) => prisma.attendanceSession.findUnique(args),
  findFirst: (args) => prisma.attendanceSession.findFirst(args),
  create: (args) => prisma.attendanceSession.create(args),
  update: (args) => prisma.attendanceSession.update(args),
  delete: (args) => prisma.attendanceSession.delete(args),
};

export default AttendanceSessionModel;

