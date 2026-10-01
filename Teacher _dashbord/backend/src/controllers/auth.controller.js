import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { authService } from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return res.status(200).json(new ApiResponse(200, result, 'Logged in successfully'));
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return res.status(201).json(new ApiResponse(201, result, 'Faculty registered successfully'));
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const profile = await authService.getProfile(userId);
  return res.status(200).json(new ApiResponse(200, profile, 'Faculty profile retrieved'));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const updated = await authService.updateProfile(userId, req.body);
  return res.status(200).json(new ApiResponse(200, updated, 'Profile updated successfully'));
});

export default {
  login,
  register,
  getProfile,
  updateProfile,
};

