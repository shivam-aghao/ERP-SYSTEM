import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ClassCardService } from '../services/classCard.service.js';

export const getTeacherCards = asyncHandler(async (req, res) => {
  const teacherId = req.query.teacherId || req.teacher.id;
  const cards = await ClassCardService.getTeacherCards(teacherId);
  return res.status(200).json(new ApiResponse(200, cards, 'Class cards retrieved'));
});

export const createCard = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  const card = await ClassCardService.createCard(teacherId, req.body);
  return res.status(201).json(new ApiResponse(201, card, 'Class card created successfully'));
});

export const deleteCard = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  const result = await ClassCardService.deleteCard(req.params.id, teacherId);
  return res.status(200).json(new ApiResponse(200, result, 'Class card deleted'));
});
