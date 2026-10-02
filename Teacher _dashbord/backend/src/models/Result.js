import { prisma } from '../config/db.js';

export const ResultModel = {
  findMany: (args) => prisma.result.findMany(args),
  findUnique: (args) => prisma.result.findUnique(args),
  findFirst: (args) => prisma.result.findFirst(args),
  create: (args) => prisma.result.create(args),
  update: (args) => prisma.result.update(args),
  upsert: (args) => prisma.result.upsert(args),
  delete: (args) => prisma.result.delete(args),
};

export default ResultModel;

