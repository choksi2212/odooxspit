import { FastifyInstance } from 'fastify';
import { warehouseController } from './warehouse.controller.js';
import { authenticate, requireRole } from '../../common/middleware.js';
import { UserRole } from '@prisma/client';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from '../../common/validators.js';

export default async function warehouseRoutes(fastify: FastifyInstance) {
  // All warehouse routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    handler: warehouseController.getAll.bind(warehouseController),
  });

  fastify.get('/:id', {
    handler: warehouseController.getById.bind(warehouseController),
  });

  fastify.post('/', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    handler: warehouseController.create.bind(warehouseController),
  });

  fastify.patch('/:id', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    handler: warehouseController.update.bind(warehouseController),
  });

  fastify.delete('/:id', {
    preHandler: [requireRole(UserRole.ADMIN)],
    handler: warehouseController.delete.bind(warehouseController),
  });
}

