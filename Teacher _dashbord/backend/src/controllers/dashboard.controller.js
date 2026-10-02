import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { dashboardService } from '../services/dashboard.service.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const summary = await dashboardService.getDashboardSummary(facultyId);
  return res.status(200).json(new ApiResponse(200, summary, 'Dashboard summary retrieved successfully'));
});

export default {
  getDashboardSummary,
};

