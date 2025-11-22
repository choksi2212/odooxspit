import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';

/**
 * Authentication Tests
 * Tests user signup, login, token refresh, and OTP-based password reset
 */
describe('Authentication', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/signup',
      payload: {
        loginId: 'testuser1',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.user).toBeDefined();
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
    
    userId = body.user.id;
    accessToken = body.accessToken;
  });

  it('should not register user with duplicate loginId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/signup',
      payload: {
        loginId: 'testuser1',
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User',
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should login with loginId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        loginIdOrEmail: 'testuser1',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user).toBeDefined();
    expect(body.accessToken).toBeDefined();
  });

  it('should login with email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        loginIdOrEmail: 'test@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user).toBeDefined();
  });

  it('should fail login with wrong password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        loginIdOrEmail: 'testuser1',
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should get current user with valid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.id).toBe(userId);
  });

  it('should fail to access protected route without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should request OTP for password reset', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: {
        email: 'test@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBeDefined();
    // In demo mode, OTP is returned in response
    expect(body.otpForDemo).toBeDefined();
  });
});

