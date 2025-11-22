import { FastifyRequest, FastifyReply } from 'fastify';
import { productService } from './product.service.js';

/**
 * Product Controller
 * Handles HTTP requests for product endpoints
 */
export class ProductController {
  /**
   * Get all products
   */
  async getAll(
    request: FastifyRequest<{
      Querystring: {
        page?: string | number;
        limit?: string | number;
        search?: string;
        categoryId?: string;
        isActive?: string | boolean;
        warehouseId?: string;
        locationId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const filters = {
      ...request.query,
      isActive: request.query.isActive !== undefined 
        ? request.query.isActive === 'true' || request.query.isActive === true
        : undefined,
    };

    const result = await productService.getAll(filters);
    return reply.send(result);
  }

  /**
   * Get product by ID
   */
  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const product = await productService.getById(request.params.id);
    return reply.send({ product });
  }

  /**
   * Get product stock levels
   */
  async getProductStock(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const result = await productService.getProductStock(request.params.id);
    return reply.send(result);
  }

  /**
   * Get low stock products
   */
  async getLowStock(request: FastifyRequest, reply: FastifyReply) {
    const products = await productService.getLowStockProducts();
    return reply.send({ products });
  }

  /**
   * Create product
   */
  async create(
    request: FastifyRequest<{
      Body: {
        name: string;
        sku: string;
        categoryId?: string;
        unitOfMeasure?: string;
        reorderLevel?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    const product = await productService.create(request.body);
    return reply.status(201).send({ product });
  }

  /**
   * Update product
   */
  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        name?: string;
        sku?: string;
        categoryId?: string | null;
        unitOfMeasure?: string;
        reorderLevel?: number;
        isActive?: boolean;
      };
    }>,
    reply: FastifyReply
  ) {
    const product = await productService.update(request.params.id, request.body);
    return reply.send({ product });
  }

  /**
   * Delete product
   */
  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const result = await productService.delete(request.params.id);
    return reply.send(result);
  }
}

export const productController = new ProductController();

