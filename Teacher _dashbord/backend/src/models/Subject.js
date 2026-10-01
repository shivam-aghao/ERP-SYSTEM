import { prisma } from '../config/db.js';

export const SubjectModel = {
  findMany: (args) => prisma.subject.findMany(args),
  findUnique: (args) => prisma.subject.findUnique(args),
  findFirst: (args) => prisma.subject.findFirst(args),
};

export default SubjectModel;

