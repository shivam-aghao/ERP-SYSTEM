import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { notificationService } from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const notifications = await notificationService.getNotifications(facultyId);
  return res.status(200).json(new ApiResponse(200, notifications, 'Notifications retrieved'));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const updated = await notificationService.markAsRead(req.params.id);
  return res.status(200).json(new ApiResponse(200, updated, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const result = await notificationService.markAllAsRead(facultyId);
  return res.status(200).json(new ApiResponse(200, result, 'All notifications marked as read'));
});

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

