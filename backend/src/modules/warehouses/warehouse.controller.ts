import { FastifyRequest, FastifyReply } from 'fastify';
import { warehouseService } from './warehouse.service.js';

export class WarehouseController {
  async getAll(
    request: FastifyRequest<{
      Querystring: {
        page?: string;
        limit?: string;
        search?: string;
        isActive?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const result = await warehouseService.getAll({
      ...request.query,
      isActive: request.query.isActive === 'true' ? true : request.query.isActive === 'false' ? false : undefined,
    });

    return reply.send(result);
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const warehouse = await warehouseService.getById(request.params.id);
    return reply.send(warehouse);
  }

  async create(
    request: FastifyRequest<{
      Body: {
        name: string;
        shortCode: string;
        address?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const warehouse = await warehouseService.create(request.body);
    return reply.status(201).send(warehouse);
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        name?: string;
        shortCode?: string;
        address?: string;
        isActive?: boolean;
      };
    }>,
    reply: FastifyReply
  ) {
    const warehouse = await warehouseService.update(
      request.params.id,
      request.body
    );
    return reply.send(warehouse);
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const result = await warehouseService.delete(request.params.id);
    return reply.send(result);
  }
}

export const warehouseController = new WarehouseController();

