import { FastifyRequest, FastifyReply } from 'fastify';
import { locationService } from './location.service.js';

export class LocationController {
  async getAll(
    request: FastifyRequest<{
      Querystring: {
        page?: string;
        limit?: string;
        warehouseId?: string;
        search?: string;
        isActive?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const result = await locationService.getAll({
      ...request.query,
      isActive: request.query.isActive === 'true' ? true : request.query.isActive === 'false' ? false : undefined,
    });

    return reply.send(result);
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const location = await locationService.getById(request.params.id);
    return reply.send(location);
  }

  async create(
    request: FastifyRequest<{
      Body: {
        warehouseId: string;
        name: string;
        shortCode: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const location = await locationService.create(request.body);
    return reply.status(201).send(location);
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        name?: string;
        shortCode?: string;
        isActive?: boolean;
      };
    }>,
    reply: FastifyReply
  ) {
    const location = await locationService.update(
      request.params.id,
      request.body
    );
    return reply.send(location);
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const result = await locationService.delete(request.params.id);
    return reply.send(result);
  }
}

export const locationController = new LocationController();

