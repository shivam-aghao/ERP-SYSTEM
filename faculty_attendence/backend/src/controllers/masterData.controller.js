import { MasterDataService } from '../services/masterData.service.js';
import { successResponse } from '../utils/response.js';

export class MasterDataController {
  static async getDepartments(req, res, next) {
    try {
      const depts = await MasterDataService.getDepartments();
      return successResponse(res, depts, 'Departments retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getClasses(req, res, next) {
    try {
      const { department } = req.query;
      const classes = await MasterDataService.getClasses(department);
      return successResponse(res, classes, 'Classes retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getSubjects(req, res, next) {
    try {
      const { department, semester } = req.query;
      const subjects = await MasterDataService.getSubjects(department, semester);
      return successResponse(res, subjects, 'Subjects retrieved');
    } catch (error) {
      next(error);
    }
  }
}
