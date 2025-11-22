import { FastifyRequest, FastifyReply } from 'fastify';
import { categoryService } from './category.service.js';

/**
 * Product Category Controller
 * Handles HTTP requests for category endpoints
 */
export class CategoryController {
  /**
   * Get all categories
   */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const categories = await categoryService.getAll();
    return reply.send({ categories });
  }

  /**
   * Get category by ID
   */
  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const category = await categoryService.getById(request.params.id);
    return reply.send({ category });
  }

  /**
   * Create category
   */
  async create(
    request: FastifyRequest<{ Body: { name: string } }>,
    reply: FastifyReply
  ) {
    const category = await categoryService.create(request.body);
    return reply.status(201).send({ category });
  }

  /**
   * Update category
   */
  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { name: string };
    }>,
    reply: FastifyReply
  ) {
    const category = await categoryService.update(request.params.id, request.body);
    return reply.send({ category });
  }

  /**
   * Delete category
   */
  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const result = await categoryService.delete(request.params.id);
    return reply.send(result);
  }
}

export const categoryController = new CategoryController();

