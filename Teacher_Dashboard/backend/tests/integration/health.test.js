import request from 'supertest';
import app from '../../app.js';

describe('Healthcheck Integration Tests', () => {
  test('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.service).toBe('ssgmce-teacher-dashboard-backend');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /api/v1/health returns 200 OK', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('GET non-existent route returns 404 with error message', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-path');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

