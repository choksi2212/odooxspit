import { buildApp } from './app.js';
import { config } from './config/index.js';
import prisma, { disconnectDB } from './db/client.js';
import { disconnectRedis } from './db/redis.js';

/**
 * Server entry point
 * Starts the Fastify server and handles graceful shutdown
 */
async function start() {
  let app;

  try {
    // Build Fastify app
    app = await buildApp();

    // Decorate app with Prisma client for easy access
    app.decorate('prisma', prisma);

    // Start server
    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    app.log.info(
      `🚀 StockMaster API server is running on http://${config.server.host}:${config.server.port}`
    );
    app.log.info(`📊 Environment: ${config.server.env}`);
    app.log.info(`🔌 WebSocket endpoint: ws://${config.server.host}:${config.server.port}/ws`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================
  const signals = ['SIGINT', 'SIGTERM'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      if (app) {
        try {
          // Close HTTP server (stops accepting new connections)
          await app.close();
          console.log('HTTP server closed');

          // Close database connections
          await disconnectDB();
          console.log('Database disconnected');

          // Close Redis connections
          await disconnectRedis();
          console.log('Redis disconnected');

          console.log('Graceful shutdown complete');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      }
    });
  });

  // Handle uncaught exceptions and rejections
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Start the server
start();

