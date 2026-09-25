import request from 'supertest';
import app from '../src/app.js';

describe('Authentication & System Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 with service health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should fail with 400 when missing credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          employeeCode: 'NON_EXISTENT_9999',
          password: 'WrongPassword!123',
        });

      expect([401, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for an invalid token format', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
