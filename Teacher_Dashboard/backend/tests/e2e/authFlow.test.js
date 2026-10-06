import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';

describe('Auth & Dashboard E2E Flow', () => {
  jest.setTimeout(25000);
  let authToken = '';

  test('POST /api/v1/auth/login logs in faculty and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rohan.deshmukh@ssgmce.ac.in',
        password: 'Faculty@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('rohan.deshmukh@ssgmce.ac.in');
    authToken = res.body.data.token;
  });

  test('GET /api/v1/auth/profile returns profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Dr. Rohan Deshmukh');
  });

  test('GET /api/v1/dashboard/summary returns metrics for faculty', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('metrics');
    expect(res.body.data).toHaveProperty('todaySchedule');
  });

  test('GET /api/v1/departments returns department list', async () => {
    const res = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

