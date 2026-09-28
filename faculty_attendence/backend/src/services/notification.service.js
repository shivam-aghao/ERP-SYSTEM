import { prisma } from '../config/db.js';

export class NotificationService {
  static async getTeacherNotifications(teacherId) {
    return await prisma.notification.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async markAsRead(id, teacherId) {
    return await prisma.notification.updateMany({
      where: { id, teacherId },
      data: { isRead: true }
    });
  }
}
