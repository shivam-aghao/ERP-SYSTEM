import { prisma } from '../config/db.js';

export const StudentModel = {
  findMany: (args) => prisma.student.findMany(args),
  findUnique: (args) => prisma.student.findUnique(args),
  findFirst: (args) => prisma.student.findFirst(args),
  count: (args) => prisma.student.count(args),
  create: (args) => prisma.student.create(args),
  update: (args) => prisma.student.update(args),
};

export default StudentModel;

