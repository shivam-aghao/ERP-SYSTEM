import { StudentService } from '../services/student.service.js';
import { successResponse } from '../utils/response.js';

export class StudentController {
  static async getRoster(req, res, next) {
    try {
      const { classId } = req.params;
      const { subject } = req.query;
      const students = await StudentService.getStudentsByClass(classId, subject);
      return successResponse(res, students, 'Student roster retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
