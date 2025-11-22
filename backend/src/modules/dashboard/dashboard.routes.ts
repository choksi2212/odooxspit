import { FastifyInstance } from 'fastify';
import { dashboardController } from './dashboard.controller.js';
import { authenticate } from '../../common/middleware.js';

/**
 * Dashboard Routes
 * Provides KPI and summary endpoints
 */
export default async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard KPIs
  fastify.get('/kpis', {
    preHandler: [authenticate],
    handler: dashboardController.getKpis.bind(dashboardController),
  });

  // Get summary by warehouse
  fastify.get('/summary-by-warehouse', {
    preHandler: [authenticate],
    handler: dashboardController.getSummaryByWarehouse.bind(dashboardController),
  });

  // Get summary by category
  fastify.get('/summary-by-product-category', {
    preHandler: [authenticate],
    handler: dashboardController.getSummaryByCategory.bind(dashboardController),
  });
}

