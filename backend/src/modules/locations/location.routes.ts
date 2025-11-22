import { FastifyInstance } from 'fastify';
import { locationController } from './location.controller.js';
import { authenticate, requireRole } from '../../common/middleware.js';
import { UserRole } from '@prisma/client';
import {
  createLocationSchema,
  updateLocationSchema,
} from '../../common/validators.js';

export default async function locationRoutes(fastify: FastifyInstance) {
  // All location routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    handler: locationController.getAll.bind(locationController),
  });

  fastify.get('/:id', {
    handler: locationController.getById.bind(locationController),
  });

  fastify.post('/', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    schema: {
      body: createLocationSchema,
    },
    handler: locationController.create.bind(locationController),
  });

  fastify.patch('/:id', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    schema: {
      body: updateLocationSchema,
    },
    handler: locationController.update.bind(locationController),
  });

  fastify.delete('/:id', {
    preHandler: [requireRole(UserRole.ADMIN)],
    handler: locationController.delete.bind(locationController),
  });
}

