import { AttendanceService } from '../services/attendance.service.js';
import { successResponse } from '../utils/response.js';

export class AttendanceController {
  static async submitAttendance(req, res, next) {
    try {
      const teacherId = req.user.id;
      const result = await AttendanceService.submitAttendance(teacherId, req.body);
      return successResponse(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  static async saveDraft(req, res, next) {
    try {
      const teacherId = req.user.id;
      const result = await AttendanceService.saveDraft(teacherId, req.body);
      return successResponse(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getDraft(req, res, next) {
    try {
      const teacherId = req.user.id;
      const { classId, subjectCode, date, period } = req.query;
      const draft = await AttendanceService.getDraft(teacherId, { classId, subjectCode, date, period });
      return successResponse(res, draft, draft ? 'Draft retrieved' : 'No draft found');
    } catch (error) {
      next(error);
    }
  }

  static async checkDuplicate(req, res, next) {
    try {
      const { department, classId, date, subjectCode, period } = req.query;
      const isDuplicate = await AttendanceService.checkDuplicate({ department, classId, date, subjectCode, period });
      return successResponse(res, { isDuplicate }, isDuplicate ? 'Attendance session already submitted' : 'Session slot is available');
    } catch (error) {
      next(error);
    }
  }

  static async getAllRecords(req, res, next) {
    try {
      const teacherId = req.query.teacherId || (req.user.role === 'TEACHER' ? req.user.id : null);
      const records = await AttendanceService.getAllRecords(teacherId);
      return successResponse(res, records, 'Attendance records retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getSessionDetails(req, res, next) {
    try {
      const { id } = req.params;
      const session = await AttendanceService.getSessionDetails(id);
      return successResponse(res, session, 'Session details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
