import { FastifyInstance } from 'fastify';
import { moveHistoryController } from './moveHistory.controller.js';
import { authenticate } from '../../common/middleware.js';
import { moveHistoryQuerySchema } from '../../common/validators.js';

/**
 * Move History Routes
 * Provides stock movement ledger endpoints
 */
export default async function moveHistoryRoutes(fastify: FastifyInstance) {
  // Get move history
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      querystring: moveHistoryQuerySchema,
    },
    handler: moveHistoryController.getHistory.bind(moveHistoryController),
  });

  // Get product ledger
  fastify.get('/product/:productId', {
    preHandler: [authenticate],
    handler: moveHistoryController.getProductLedger.bind(moveHistoryController),
  });
}

