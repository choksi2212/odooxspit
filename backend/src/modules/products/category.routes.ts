import { FastifyInstance } from 'fastify';
import { categoryController } from './category.controller.js';
import { authenticate, requireRole } from '../../common/middleware.js';
import {
  createProductCategorySchema,
  updateProductCategorySchema,
} from '../../common/validators.js';
import { UserRole } from '@prisma/client';

/**
 * Category Routes
 * Handles product category CRUD operations
 */
export default async function categoryRoutes(fastify: FastifyInstance) {
  // Get all categories
  fastify.get('/', {
    preHandler: [authenticate],
    handler: categoryController.getAll.bind(categoryController),
  });

  // Get category by ID
  fastify.get('/:id', {
    preHandler: [authenticate],
    handler: categoryController.getById.bind(categoryController),
  });

  // Create category
  fastify.post('/', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    schema: {
      body: createProductCategorySchema,
    },
    handler: categoryController.create.bind(categoryController),
  });

  // Update category
  fastify.patch('/:id', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    schema: {
      body: updateProductCategorySchema,
    },
    handler: categoryController.update.bind(categoryController),
  });

  // Delete category
  fastify.delete('/:id', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    handler: categoryController.delete.bind(categoryController),
  });
}

