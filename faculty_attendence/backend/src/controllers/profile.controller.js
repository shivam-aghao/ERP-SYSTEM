import { ProfileService } from '../services/profile.service.js';
import { successResponse } from '../utils/response.js';

export class ProfileController {
  static async getProfile(req, res, next) {
    try {
      const profile = await ProfileService.getProfile(req.user.id);
      return successResponse(res, profile, 'Profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const updated = await ProfileService.updateProfile(req.user.id, req.body);
      return successResponse(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getNotifications(req, res, next) {
    try {
      const notifications = await ProfileService.getNotifications(req.user.id);
      return successResponse(res, notifications, 'Notifications fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req, res, next) {
    try {
      const { id } = req.params;
      await ProfileService.markNotificationAsRead(req.user.id, id);
      return successResponse(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}
