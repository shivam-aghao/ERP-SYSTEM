import { ApiResponse } from '../../src/utils/ApiResponse.js';
import { ApiError } from '../../src/utils/ApiError.js';

describe('ApiResponse and ApiError Unit Tests', () => {
  test('ApiResponse correctly initializes with success status', () => {
    const payload = { id: 1, name: 'Test' };
    const res = new ApiResponse(200, payload, 'Retrieved successfully');

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(payload);
    expect(res.message).toBe('Retrieved successfully');
    expect(res.success).toBe(true);
  });

  test('ApiResponse handles 201 Created', () => {
    const res = new ApiResponse(201, { id: 2 }, 'Created');
    expect(res.statusCode).toBe(201);
    expect(res.success).toBe(true);
  });

  test('ApiError correctly initializes error details', () => {
    const err = new ApiError(404, 'Resource not found', ['Detail error']);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');
    expect(err.errors).toEqual(['Detail error']);
    expect(err.success).toBe(false);
  });

  test('ApiError defaults to 500 when not provided', () => {
    const err = new ApiError(500, 'Internal Server Error');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('Internal Server Error');
    expect(err.success).toBe(false);
  });
});

