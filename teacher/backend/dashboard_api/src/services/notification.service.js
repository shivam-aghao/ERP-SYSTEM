import { prisma } from '../config/db.js';

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Low Attendance Alert',
    description: 'Student Roll No 2R1-05 (Siddharth Joshi) has attendance below 75% in CS302.',
    icon: 'alert-triangle',
    type: 'warning',
    isRead: false,
    actionUrl: '/attendance',
    createdAt: new Date(),
  },
  {
    id: 'notif-2',
    title: 'Mid-Sem Marks Submission',
    description: 'Deadline for submitting Mid-Semester Examination marks is October 25, 2024.',
    icon: 'calendar',
    type: 'info',
    isRead: false,
    actionUrl: '/results',
    createdAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    id: 'notif-3',
    title: 'Department Meeting',
    description: 'HOD has scheduled an academic progress review meeting on Friday at 4:00 PM.',
    icon: 'users',
    type: 'info',
    isRead: true,
    actionUrl: '/schedule',
    createdAt: new Date(Date.now() - 3600000 * 48),
  },
];

export const notificationService = {
  async getNotifications(facultyId) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          OR: [{ recipientFacultyId: facultyId }, { recipientFacultyId: null }],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (notifications && notifications.length > 0) return notifications;
    } catch (_) {}

    return MOCK_NOTIFICATIONS;
  },

  async markAsRead(id) {
    try {
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return updated;
    } catch (_) {
      return { id, isRead: true };
    }
  },

  async markAllAsRead(facultyId) {
    try {
      await prisma.notification.updateMany({
        where: {
          OR: [{ recipientFacultyId: facultyId }, { recipientFacultyId: null }],
          isRead: false,
        },
        data: { isRead: true },
      });
      return { success: true };
    } catch (_) {
      return { success: true };
    }
  },

  async createNotification(data) {
    try {
      const notif = await prisma.notification.create({
        data,
      });
      return notif;
    } catch (_) {
      return {
        id: 'mock-notif-' + Date.now(),
        ...data,
        createdAt: new Date(),
        isRead: false,
      };
    }
  },
};

export default notificationService;

