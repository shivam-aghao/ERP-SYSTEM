import { AuthService } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { employeeCode, email, password } = req.body;
      const result = await AuthService.login({ employeeCode, email, password });
      return successResponse(res, result, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      return successResponse(res, result, 'Token refreshed successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const accessToken = req.token;
      const { refreshToken } = req.body;
      await AuthService.logout(accessToken, refreshToken);
      return successResponse(res, null, 'Logged out successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const user = req.user;
      return successResponse(res, {
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
      }, 'User details fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
