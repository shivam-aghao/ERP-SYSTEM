import { prisma } from '../config/db.js';

export const ClassModel = {
  findMany: (args) => prisma.class.findMany(args),
  findUnique: (args) => prisma.class.findUnique(args),
  findFirst: (args) => prisma.class.findFirst(args),
};

export default ClassModel;

