import { FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from './dashboard.service.js';

/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard endpoints
 */
export class DashboardController {
  /**
   * Get dashboard KPIs
   */
  async getKpis(request: FastifyRequest, reply: FastifyReply) {
    const kpis = await dashboardService.getKpis();
    return reply.send(kpis);
  }

  /**
   * Get summary by warehouse
   */
  async getSummaryByWarehouse(request: FastifyRequest, reply: FastifyReply) {
    const summary = await dashboardService.getSummaryByWarehouse();
    return reply.send({ summary });
  }

  /**
   * Get summary by category
   */
  async getSummaryByCategory(request: FastifyRequest, reply: FastifyReply) {
    const summary = await dashboardService.getSummaryByCategory();
    return reply.send({ summary });
  }
}

export const dashboardController = new DashboardController();

