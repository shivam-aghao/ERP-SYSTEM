import { prisma } from '../config/db.js';

export const SyllabusModel = {
  findMany: (args) => prisma.syllabusProgress.findMany(args),
  findUnique: (args) => prisma.syllabusProgress.findUnique(args),
  findFirst: (args) => prisma.syllabusProgress.findFirst(args),
  create: (args) => prisma.syllabusProgress.create(args),
  update: (args) => prisma.syllabusProgress.update(args),
  upsert: (args) => prisma.syllabusProgress.upsert(args),
  delete: (args) => prisma.syllabusProgress.delete(args),
};

export default SyllabusModel;

