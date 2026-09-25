import { prisma } from '../config/db.js';

export class ProfileService {
  static async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const totalSessions = await prisma.attendanceSession.count({
      where: { teacherId: userId, status: 'SUBMITTED' },
    });

    const activeCards = await prisma.classCard.count({
      where: { teacherId: userId },
    });

    const unreadNotifications = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      id: user.id,
      employeeCode: user.employeeCode,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      designation: user.designation,
      phone: user.phone,
      avatarInitials: user.avatarInitials,
      department: user.department ? {
        id: user.department.id,
        code: user.department.code,
        name: user.department.name,
      } : null,
      stats: {
        totalSessions,
        activeCards,
        unreadNotifications,
      },
    };
  }

  static async updateProfile(userId, data) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        designation: data.designation,
        avatarInitials: data.avatarInitials,
      },
      include: { department: true },
    });

    return {
      id: updated.id,
      employeeCode: updated.employeeCode,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      designation: updated.designation,
      phone: updated.phone,
      avatarInitials: updated.avatarInitials,
      department: updated.department,
    };
  }

  static async getNotifications(userId) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  static async markNotificationAsRead(userId, notificationId) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}
