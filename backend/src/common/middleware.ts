import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError, AuthenticationError, AuthorizationError } from './errors.js';
import { UserRole } from '@prisma/client';
import { AuthUser } from './types.js';

/**
 * Middleware to authenticate requests using JWT
 * Expects JWT to be verified by @fastify/jwt plugin
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Middleware factory for role-based access control
 * Checks if authenticated user has required role
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user as AuthUser;
    
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AuthorizationError(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }
  };
}

/**
 * Global error handler for Fastify
 * Converts errors to consistent JSON format
 */
export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error details server-side (with correlation ID)
  request.log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  // Handle AppError instances
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(error.toJSON());
  }

  // Handle Fastify validation errors
  if (error.name === 'FastifyError' && 'validation' in error) {
    return reply.status(400).send({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: (error as any).validation,
      },
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      error: {
        message: 'Invalid or expired token',
        code: 'AUTHENTICATION_ERROR',
      },
    });
  }

  // Default to 500 for unknown errors
  return reply.status(500).send({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}

/**
 * Async handler wrapper to catch errors in route handlers
 */
export function asyncHandler(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Correlation ID plugin
 * Adds a unique correlation ID to each request for tracing
 */
export async function correlationIdPlugin(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const correlationId = request.headers['x-correlation-id'] || 
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  request.headers['x-correlation-id'] = correlationId as string;
}

