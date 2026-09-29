import request from 'supertest';
import app from '../src/app.js';

describe('Attendance Endpoints', () => {
  describe('POST /api/v1/attendance/submit', () => {
    it('should reject unauthenticated submissions with 401', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/submit')
        .send({
          classId: '2R1',
          date: '2026-09-25',
          records: [{ rollNo: 1, status: 'PRESENT' }],
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/attendance/check-duplicate', () => {
    it('should return 401 when accessed without authentication token', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/check-duplicate?classId=2R1&date=2026-09-25&subjectCode=3CS205MD');

      expect(res.status).toBe(401);
    });
  });
});
