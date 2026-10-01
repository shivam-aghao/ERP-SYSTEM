import request from 'supertest';
import app from '../../src/app.js';

describe('Health and Public Routes Integration Tests', () => {
  test('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy');
  });

  test('GET /unknown-route returns 404', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
