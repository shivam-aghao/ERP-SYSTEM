import { CardService } from '../services/card.service.js';
import { successResponse } from '../utils/response.js';

export class CardController {
  static async getCards(req, res, next) {
    try {
      const teacherId = req.query.teacherId || req.user.id;
      const cards = await CardService.getCardsByTeacher(teacherId);
      return successResponse(res, cards, 'Class cards retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createCard(req, res, next) {
    try {
      const teacherId = req.body.teacherId || req.user.id;
      const card = await CardService.createCard(teacherId, req.body);
      return successResponse(res, card, 'Class card created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCard(req, res, next) {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const card = await CardService.updateCard(teacherId, id, req.body);
      return successResponse(res, card, 'Class card updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteCard(req, res, next) {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      await CardService.deleteCard(teacherId, id);
      return successResponse(res, null, 'Class card deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async checkDuplicate(req, res, next) {
    try {
      const teacherId = req.user.id;
      const { department, classId, subjectCode } = req.query;
      const isDuplicate = await CardService.checkCardDuplicate(teacherId, department, classId, subjectCode);
      return successResponse(res, { isDuplicate }, isDuplicate ? 'Card already exists' : 'Card is unique');
    } catch (error) {
      next(error);
    }
  }
}
