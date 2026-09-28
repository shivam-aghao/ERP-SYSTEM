import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthService } from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

export const getMe = asyncHandler(async (req, res) => {
  const teacher = await AuthService.getCurrentTeacher(req.teacher.id);
  return res.status(200).json(new ApiResponse(200, teacher, 'Profile retrieved'));
});

export const logout = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});
