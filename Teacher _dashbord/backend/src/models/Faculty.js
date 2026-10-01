import { prisma } from '../config/db.js';

export const FacultyModel = {
  findMany: (args) => prisma.faculty.findMany(args),
  findUnique: (args) => prisma.faculty.findUnique(args),
  findFirst: (args) => prisma.faculty.findFirst(args),
  update: (args) => prisma.faculty.update(args),
};

export default FacultyModel;

