import { prisma } from '../config/db.js';

export const AttendanceRecordModel = {
  findMany: (args) => prisma.attendanceRecord.findMany(args),
  findUnique: (args) => prisma.attendanceRecord.findUnique(args),
  findFirst: (args) => prisma.attendanceRecord.findFirst(args),
  create: (args) => prisma.attendanceRecord.create(args),
  update: (args) => prisma.attendanceRecord.update(args),
  upsert: (args) => prisma.attendanceRecord.upsert(args),
  delete: (args) => prisma.attendanceRecord.delete(args),
};

export default AttendanceRecordModel;

