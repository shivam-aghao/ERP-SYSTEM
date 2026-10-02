import request from 'supertest';
import app from '../src/app.js';

describe('Cards & Students Endpoints', () => {
  describe('GET /api/v1/cards', () => {
    it('should reject unauthorized access with 401', async () => {
      const res = await request(app).get('/api/v1/cards');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/students/class/:classId', () => {
    it('should reject unauthorized roster requests with 401', async () => {
      const res = await request(app).get('/api/v1/students/class/2R1');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
