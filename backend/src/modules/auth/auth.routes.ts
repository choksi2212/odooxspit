import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authenticate } from '../../common/middleware.js';
import {
  signupSchema,
  loginSchema,
  requestOtpSchema,
  resetPasswordSchema,
} from '../../common/validators.js';

/**
 * Authentication Routes
 * Handles user signup, login, token refresh, OTP-based password reset
 */
export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/signup', {
    schema: {
      body: signupSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            user: { type: 'object' },
            accessToken: { type: 'string' },
          },
        },
      },
    },
    handler: authController.signup.bind(authController),
  });

  fastify.post('/login', {
    schema: {
      body: loginSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            user: { type: 'object' },
            accessToken: { type: 'string' },
          },
        },
      },
    },
    handler: authController.login.bind(authController),
  });

  fastify.post('/refresh', {
    handler: authController.refresh.bind(authController),
  });

  fastify.post('/request-otp', {
    schema: {
      body: requestOtpSchema,
    },
    handler: authController.requestOtp.bind(authController),
  });

  fastify.post('/reset-password', {
    schema: {
      body: resetPasswordSchema,
    },
    handler: authController.resetPassword.bind(authController),
  });

  // Protected routes
  fastify.get('/me', {
    preHandler: [authenticate],
    handler: authController.me.bind(authController),
  });

  fastify.post('/logout', {
    preHandler: [authenticate],
    handler: authController.logout.bind(authController),
  });
}

