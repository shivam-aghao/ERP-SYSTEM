import { ReportService } from '../services/report.service.js';
import { successResponse } from '../utils/response.js';

export class ReportController {
  static async getClassStats(req, res, next) {
    try {
      const { classId } = req.params;
      const stats = await ReportService.getClassStats(classId);
      return successResponse(res, stats, 'Class statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { filename, content } = await ReportService.generateSessionCsv(sessionId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(content);
    } catch (error) {
      next(error);
    }
  }
}
