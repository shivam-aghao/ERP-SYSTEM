import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { resultService } from '../services/result.service.js';

export const getResults = asyncHandler(async (req, res) => {
  const results = await resultService.getResults(req.query);
  return res.status(200).json(new ApiResponse(200, results, 'Results retrieved successfully'));
});

export const createResult = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const result = await resultService.createResult(req.body, facultyId);
  return res.status(201).json(new ApiResponse(201, result, 'Result saved successfully'));
});

export const bulkUploadResults = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const result = await resultService.bulkUploadResults(req.body, facultyId);
  return res.status(200).json(new ApiResponse(200, result, 'Results bulk uploaded successfully'));
});

export default {
  getResults,
  createResult,
  bulkUploadResults,
};

