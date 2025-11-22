import { FastifyRequest, FastifyReply } from 'fastify';
import { operationService } from './operation.service.js';
import { AuthUser } from '../../common/types.js';
import { OperationType, OperationStatus } from '@prisma/client';

/**
 * Operation Controller
 * Handles HTTP requests for inventory operations
 */
export class OperationController {
  /**
   * Get all operations
   */
  async getAll(
    request: FastifyRequest<{
      Querystring: {
        page?: string | number;
        limit?: string | number;
        type?: OperationType;
        status?: OperationStatus;
        warehouseId?: string;
        locationId?: string;
        reference?: string;
        contactName?: string;
        dateFrom?: string;
        dateTo?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const result = await operationService.getAll(request.query);
    return reply.send(result);
  }

  /**
   * Get operation by ID
   */
  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const operation = await operationService.getById(request.params.id);
    return reply.send({ operation });
  }

  /**
   * Create receipt
   */
  async createReceipt(
    request: FastifyRequest<{
      Body: {
        warehouseToId?: string;
        locationToId: string;
        contactName?: string;
        scheduleDate?: string;
        notes?: string;
        items: Array<{ productId: string; quantity: number }>;
        responsibleUserId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const user = request.user as AuthUser;
    const operation = await operationService.createReceipt(user.id, request.body);
    return reply.status(201).send({ operation });
  }

  /**
   * Create delivery
   */
  async createDelivery(
    request: FastifyRequest<{
      Body: {
        warehouseFromId?: string;
        locationFromId: string;
        contactName?: string;
        scheduleDate?: string;
        notes?: string;
        items: Array<{ productId: string; quantity: number }>;
        responsibleUserId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const user = request.user as AuthUser;
    const operation = await operationService.createDelivery(user.id, request.body);
    return reply.status(201).send({ operation });
  }

  /**
   * Create transfer
   */
  async createTransfer(
    request: FastifyRequest<{
      Body: {
        warehouseFromId?: string;
        locationFromId: string;
        warehouseToId?: string;
        locationToId: string;
        scheduleDate?: string;
        notes?: string;
        items: Array<{ productId: string; quantity: number }>;
        responsibleUserId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const user = request.user as AuthUser;
    const operation = await operationService.createTransfer(user.id, request.body);
    return reply.status(201).send({ operation });
  }

  /**
   * Create adjustment
   */
  async createAdjustment(
    request: FastifyRequest<{
      Body: {
        warehouseId?: string;
        locationId: string;
        notes?: string;
        items: Array<{ productId: string; countedQuantity: number }>;
        responsibleUserId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const user = request.user as AuthUser;
    const operation = await operationService.createAdjustment(user.id, request.body);
    return reply.status(201).send({ operation });
  }

  /**
   * Update operation
   */
  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        contactName?: string;
        scheduleDate?: string;
        notes?: string;
        items?: Array<{ productId: string; quantity: number }>;
        responsibleUserId?: string | null;
      };
    }>,
    reply: FastifyReply
  ) {
    const operation = await operationService.update(request.params.id, request.body);
    return reply.send({ operation });
  }

  /**
   * Transition operation status
   */
  async transition(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { action: 'mark_ready' | 'mark_done' | 'cancel' };
    }>,
    reply: FastifyReply
  ) {
    const operation = await operationService.transition(
      request.params.id,
      request.body.action
    );
    return reply.send({ operation });
  }
}

export const operationController = new OperationController();

