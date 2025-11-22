import { FastifyRequest, FastifyReply } from 'fastify';
import { moveHistoryService } from './moveHistory.service.js';
import { MovementType, OperationStatus } from '@prisma/client';

/**
 * Move History Controller
 * Handles HTTP requests for stock movement history
 */
export class MoveHistoryController {
  /**
   * Get move history
   */
  async getHistory(
    request: FastifyRequest<{
      Querystring: {
        page?: string | number;
        limit?: string | number;
        type?: MovementType;
        status?: OperationStatus;
        reference?: string;
        warehouseId?: string;
        locationId?: string;
        productId?: string;
        dateFrom?: string;
        dateTo?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const result = await moveHistoryService.getHistory(request.query);
    return reply.send(result);
  }

  /**
   * Get product ledger
   */
  async getProductLedger(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
  ) {
    const result = await moveHistoryService.getProductLedger(request.params.productId);
    return reply.send(result);
  }
}

export const moveHistoryController = new MoveHistoryController();

