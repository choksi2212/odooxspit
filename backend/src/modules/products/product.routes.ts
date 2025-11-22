import { FastifyInstance } from 'fastify';
import { productController } from './product.controller.js';
import { authenticate, requireRole } from '../../common/middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productsQuerySchema,
} from '../../common/validators.js';
import { UserRole } from '@prisma/client';

/**
 * Product Routes
 * Handles product CRUD operations
 */
export default async function productRoutes(fastify: FastifyInstance) {
  // Get all products
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      querystring: productsQuerySchema,
    },
    handler: productController.getAll.bind(productController),
  });

  // Get low stock products
  fastify.get('/low-stock', {
    preHandler: [authenticate],
    handler: productController.getLowStock.bind(productController),
  });

  // Get product by ID
  fastify.get('/:id', {
    preHandler: [authenticate],
    handler: productController.getById.bind(productController),
  });

  // Get product stock levels
  fastify.get('/:id/stock', {
    preHandler: [authenticate],
    handler: productController.getProductStock.bind(productController),
  });

  // Create product
  fastify.post('/', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    schema: {
      body: createProductSchema,
    },
    handler: productController.create.bind(productController),
  });

  // Update product
  fastify.patch('/:id', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    schema: {
      body: updateProductSchema,
    },
    handler: productController.update.bind(productController),
  });

  // Delete product
  fastify.delete('/:id', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)],
    handler: productController.delete.bind(productController),
  });
}

