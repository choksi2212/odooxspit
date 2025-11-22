import { FastifyInstance } from 'fastify';
import { operationController } from './operation.controller.js';
import { authenticate, requireRole } from '../../common/middleware.js';
import {
  createReceiptSchema,
  createDeliverySchema,
  createTransferSchema,
  createAdjustmentSchema,
  updateOperationSchema,
  transitionOperationSchema,
  operationsQuerySchema,
} from '../../common/validators.js';
import { UserRole } from '@prisma/client';

/**
 * Operation Routes
 * Handles all inventory operation endpoints
 */
export default async function operationRoutes(fastify: FastifyInstance) {
  // Get all operations
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      querystring: operationsQuerySchema,
    },
    handler: operationController.getAll.bind(operationController),
  });

  // Get operation by ID
  fastify.get('/:id', {
    preHandler: [authenticate],
    handler: operationController.getById.bind(operationController),
  });

  // Create receipt
  fastify.post('/receipts', {
    preHandler: [authenticate],
    schema: {
      body: createReceiptSchema,
    },
    handler: operationController.createReceipt.bind(operationController),
  });

  // Create delivery
  fastify.post('/deliveries', {
    preHandler: [authenticate],
    schema: {
      body: createDeliverySchema,
    },
    handler: operationController.createDelivery.bind(operationController),
  });

  // Create transfer
  fastify.post('/transfers', {
    preHandler: [authenticate],
    schema: {
      body: createTransferSchema,
    },
    handler: operationController.createTransfer.bind(operationController),
  });

  // Create adjustment
  fastify.post('/adjustments', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    schema: {
      body: createAdjustmentSchema,
    },
    handler: operationController.createAdjustment.bind(operationController),
  });

  // Update operation
  fastify.patch('/:id', {
    preHandler: [authenticate],
    schema: {
      body: updateOperationSchema,
    },
    handler: operationController.update.bind(operationController),
  });

  // Transition operation status
  fastify.post('/:id/transition', {
    preHandler: [authenticate],
    schema: {
      body: transitionOperationSchema,
    },
    handler: operationController.transition.bind(operationController),
  });
}

