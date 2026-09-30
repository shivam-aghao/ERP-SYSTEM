import { prisma } from '../config/db.js';

export const DepartmentModel = {
  findMany: (args) => prisma.department.findMany(args),
  findUnique: (args) => prisma.department.findUnique(args),
  findFirst: (args) => prisma.department.findFirst(args),
};

export default DepartmentModel;

