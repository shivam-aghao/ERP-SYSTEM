import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { NotificationService } from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  const notifications = await NotificationService.getTeacherNotifications(teacherId);
  return res.status(200).json(new ApiResponse(200, notifications, 'Notifications retrieved'));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  await NotificationService.markAsRead(req.params.id, teacherId);
  return res.status(200).json(new ApiResponse(200, null, 'Notification marked as read'));
});
