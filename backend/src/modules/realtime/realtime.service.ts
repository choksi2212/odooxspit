import { redisPubClient } from '../../db/redis.js';
import { dashboardService } from '../dashboard/dashboard.service.js';

/**
 * Realtime Service
 * Publishes events to Redis Pub/Sub for WebSocket broadcasting
 */
export class RealtimeService {
  private readonly CHANNEL = 'stockmaster:events';

  /**
   * Publish event to Redis Pub/Sub
   */
  private async publish(event: { type: string; payload: unknown }) {
    await redisPubClient.publish(this.CHANNEL, JSON.stringify(event));
  }

  /**
   * Publish dashboard KPIs updated event
   */
  async publishDashboardKpisUpdated() {
    // Invalidate cache first
    await dashboardService.invalidateCache();
    
    // Get fresh KPIs
    const kpis = await dashboardService.getKpis();

    await this.publish({
      type: 'dashboard.kpisUpdated',
      payload: kpis,
    });
  }

  /**
   * Publish stock level changed event
   */
  async publishStockLevelChanged(productId: string, locationId: string) {
    // Calculate new quantity
    const movements = await prisma.stockMovement.findMany({
      where: {
        productId,
        OR: [{ locationToId: locationId }, { locationFromId: locationId }],
      },
    });

    let newQty = 0;
    for (const movement of movements) {
      if (movement.locationToId === locationId) {
        newQty += parseFloat(movement.quantityDelta.toString());
      }
      if (movement.locationFromId === locationId) {
        newQty -= parseFloat(movement.quantityDelta.toString());
      }
    }

    await this.publish({
      type: 'stock.levelChanged',
      payload: {
        productId,
        locationId,
        newQty,
      },
    });

    // Also update dashboard KPIs
    await this.publishDashboardKpisUpdated();
  }

  /**
   * Publish operation created event
   */
  async publishOperationCreated(operation: {
    id: string;
    type: string;
    status: string;
    reference: string;
  }) {
    await this.publish({
      type: 'operation.created',
      payload: {
        operationId: operation.id,
        type: operation.type,
        status: operation.status,
        reference: operation.reference,
      },
    });

    // Update dashboard KPIs
    await this.publishDashboardKpisUpdated();
  }

  /**
   * Publish operation updated event
   */
  async publishOperationUpdated(operation: {
    id: string;
    type: string;
    status: string;
    reference: string;
  }) {
    await this.publish({
      type: 'operation.updated',
      payload: {
        operationId: operation.id,
        type: operation.type,
        status: operation.status,
        reference: operation.reference,
      },
    });
  }

  /**
   * Publish operation status changed event
   */
  async publishOperationStatusChanged(
    operationId: string,
    oldStatus: string,
    newStatus: string
  ) {
    await this.publish({
      type: 'operation.statusChanged',
      payload: {
        operationId,
        oldStatus,
        newStatus,
      },
    });

    // Update dashboard KPIs
    await this.publishDashboardKpisUpdated();
  }

  /**
   * Publish low stock alert created event
   */
  async publishLowStockAlert(productId: string, currentQty: number, threshold: number) {
    await this.publish({
      type: 'lowStock.alertCreated',
      payload: {
        productId,
        currentQty,
        threshold,
      },
    });
  }
}

export const realtimeService = new RealtimeService();

// Import prisma (needed for stock calculations)
import prisma from '../../db/client.js';

