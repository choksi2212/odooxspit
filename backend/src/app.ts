import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { errorHandler } from './common/middleware.js';
import { redisClient } from './db/redis.js';

// Module routes
import authRoutes from './modules/auth/auth.routes.js';
import warehouseRoutes from './modules/warehouses/warehouse.routes.js';
import locationRoutes from './modules/locations/location.routes.js';
import productRoutes from './modules/products/product.routes.js';
import categoryRoutes from './modules/products/category.routes.js';
import operationRoutes from './modules/operations/operation.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import moveHistoryRoutes from './modules/moveHistory/moveHistory.routes.js';
import { setupWebSocketHandler } from './modules/realtime/websocket.handler.js';

/**
 * Build and configure Fastify application
 * Applies plugins, middleware, and route handlers
 */
export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport:
        config.server.env === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
              },
            }
          : undefined,
    },
    disableRequestLogging: false,
    requestIdHeader: 'x-correlation-id',
    requestIdLogLabel: 'correlationId',
  });

  // ============================================
  // PLUGINS
  // ============================================

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  // CORS
  await app.register(cors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Cookie parser (for refresh tokens)
  await app.register(cookie, {
    secret: config.jwt.refreshSecret,
    parseOptions: {},
  });

  // JWT authentication
  await app.register(jwt, {
    secret: config.jwt.accessSecret,
    sign: {
      expiresIn: config.jwt.accessExpiresIn,
    },
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  });

  // Rate limiting using Redis
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    redis: redisClient,
    allowList: (req) => {
      // Skip rate limiting for health checks
      return req.url === '/health' || req.url === '/ready';
    },
    keyGenerator: (req) => {
      // Rate limit by IP and user ID (if authenticated)
      const ip = req.ip;
      const userId = (req.user as any)?.id || 'anonymous';
      return `rate-limit:${ip}:${userId}`;
    },
  });

  // WebSocket support
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      clientTracking: true,
    },
  });

  // ============================================
  // ERROR HANDLER
  // ============================================
  app.setErrorHandler(errorHandler);

  // ============================================
  // HEALTH CHECKS
  // ============================================
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async (request, reply) => {
    try {
      // Check database connection
      await app.prisma.$queryRaw`SELECT 1`;
      
      // Check Redis connection
      await redisClient.ping();
      
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: 'ok',
          redis: 'ok',
        },
      };
    } catch (error) {
      request.log.error('Readiness check failed:', error);
      reply.status(503).send({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Service dependencies unavailable',
      });
    }
  });

  // ============================================
  // API ROUTES
  // ============================================
  await app.register(
    async (instance) => {
      instance.register(authRoutes, { prefix: '/auth' });
      instance.register(warehouseRoutes, { prefix: '/warehouses' });
      instance.register(locationRoutes, { prefix: '/locations' });
      instance.register(productRoutes, { prefix: '/products' });
      instance.register(categoryRoutes, { prefix: '/categories' });
      instance.register(operationRoutes, { prefix: '/operations' });
      instance.register(dashboardRoutes, { prefix: '/dashboard' });
      instance.register(moveHistoryRoutes, { prefix: '/move-history' });
    },
    { prefix: '/api' }
  );

  // ============================================
  // WEBSOCKET
  // ============================================
  setupWebSocketHandler(app);

  // ============================================
  // NOT FOUND HANDLER
  // ============================================
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        message: `Route ${request.method}:${request.url} not found`,
        code: 'NOT_FOUND',
      },
    });
  });

  return app;
}

