import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';

describe('Teacher Dashboard Routes Integration Tests', () => {
  jest.setTimeout(25000);

  test('GET /api/teacher/summary returns 200 with dashboard metrics', async () => {
    const res = await request(app).get('/api/teacher/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('metrics');
    expect(res.body.data).toHaveProperty('todaySchedule');
  });

  test('GET /api/teacher/profile returns 200 with faculty details', async () => {
    const res = await request(app).get('/api/teacher/profile');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name');
  });

  test('GET /api/teacher/classes returns 200 with assigned classes', async () => {
    const res = await request(app).get('/api/teacher/classes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/teacher/schedule returns 200 with timetable', async () => {
    const res = await request(app).get('/api/teacher/schedule');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
