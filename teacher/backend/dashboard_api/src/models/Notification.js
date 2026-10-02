import { prisma } from '../config/db.js';

export const NotificationModel = {
  findMany: (args) => prisma.notification.findMany(args),
  findUnique: (args) => prisma.notification.findUnique(args),
  findFirst: (args) => prisma.notification.findFirst(args),
  create: (args) => prisma.notification.create(args),
  update: (args) => prisma.notification.update(args),
  updateMany: (args) => prisma.notification.updateMany(args),
  delete: (args) => prisma.notification.delete(args),
};

export default NotificationModel;

