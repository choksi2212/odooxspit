import prisma from '../../db/client.js';
import { OperationStatus, OperationType } from '@prisma/client';
import { cacheService } from '../../db/redis.js';

/**
 * Dashboard Service
 * Provides KPIs and summary data for the dashboard
 */
export class DashboardService {
  private CACHE_TTL = 60; // 60 seconds cache

  /**
   * Get dashboard KPIs
   * Time complexity: O(n) where n = number of operations/movements
   * Results are cached for performance
   */
  async getKpis() {
    // Try to get from cache first
    const cached = await cacheService.get<any>('dashboard:kpis');
    if (cached) {
      return cached;
    }

    // Calculate total products in stock
    // Get unique products that have stock movements
    const productsWithStock = await prisma.stockMovement.findMany({
      select: {
        productId: true,
      },
      distinct: ['productId'],
    });

    const totalProductsInStock = productsWithStock.length;

    // Calculate low stock count
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        reorderLevel: { gt: 0 },
      },
      select: {
        id: true,
        reorderLevel: true,
      },
    });

    let lowStockCount = 0;
    for (const product of products) {
      const movements = await prisma.stockMovement.findMany({
        where: { productId: product.id },
        select: { quantityDelta: true, locationToId: true, locationFromId: true },
      });

      let totalStock = 0;
      const stockByLocation = new Map<string, number>();

      for (const movement of movements) {
        if (movement.locationToId) {
          const current = stockByLocation.get(movement.locationToId) || 0;
          stockByLocation.set(
            movement.locationToId,
            current + parseFloat(movement.quantityDelta.toString())
          );
        }
        if (movement.locationFromId) {
          const current = stockByLocation.get(movement.locationFromId) || 0;
          stockByLocation.set(
            movement.locationFromId,
            current - parseFloat(movement.quantityDelta.toString())
          );
        }
      }

      totalStock = Array.from(stockByLocation.values()).reduce((sum, qty) => sum + qty, 0);

      if (totalStock <= product.reorderLevel) {
        lowStockCount++;
      }
    }

    // Count pending operations by type
    const [pendingReceipts, pendingDeliveries, pendingTransfers] = await Promise.all([
      prisma.operation.count({
        where: {
          type: OperationType.RECEIPT,
          status: {
            in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY],
          },
        },
      }),
      prisma.operation.count({
        where: {
          type: OperationType.DELIVERY,
          status: {
            in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY],
          },
        },
      }),
      prisma.operation.count({
        where: {
          type: OperationType.TRANSFER,
          status: {
            in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY],
          },
        },
      }),
    ]);

    // Calculate out of stock count
    let outOfStockCount = 0;
    for (const product of products) {
      const movements = await prisma.stockMovement.findMany({
        where: { productId: product.id },
        select: { quantityDelta: true, locationToId: true, locationFromId: true },
      });

      let totalStock = 0;
      const stockByLocation = new Map<string, number>();

      for (const movement of movements) {
        if (movement.locationToId) {
          const current = stockByLocation.get(movement.locationToId) || 0;
          stockByLocation.set(
            movement.locationToId,
            current + parseFloat(movement.quantityDelta.toString())
          );
        }
        if (movement.locationFromId) {
          const current = stockByLocation.get(movement.locationFromId) || 0;
          stockByLocation.set(
            movement.locationFromId,
            current - parseFloat(movement.quantityDelta.toString())
          );
        }
      }

      totalStock = Array.from(stockByLocation.values()).reduce((sum, qty) => sum + qty, 0);

      if (totalStock <= 0) {
        outOfStockCount++;
      }
    }

    const kpis = {
      totalProducts: totalProductsInStock,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
    };

    // Cache the result
    await cacheService.set('dashboard:kpis', kpis, this.CACHE_TTL);

    return kpis;
  }

  /**
   * Get summary by warehouse
   */
  async getSummaryByWarehouse() {
    const cached = await cacheService.get<any>('dashboard:warehouse-summary');
    if (cached) {
      return cached;
    }

    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        locations: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    const summary = [];

    for (const warehouse of warehouses) {
      const locationIds = warehouse.locations.map((l) => l.id);

      // Count operations for this warehouse
      const [receipts, deliveries, transfers] = await Promise.all([
        prisma.operation.count({
          where: {
            type: OperationType.RECEIPT,
            locationToId: { in: locationIds },
            status: { not: OperationStatus.CANCELED },
          },
        }),
        prisma.operation.count({
          where: {
            type: OperationType.DELIVERY,
            locationFromId: { in: locationIds },
            status: { not: OperationStatus.CANCELED },
          },
        }),
        prisma.operation.count({
          where: {
            type: OperationType.TRANSFER,
            OR: [
              { locationFromId: { in: locationIds } },
              { locationToId: { in: locationIds } },
            ],
            status: { not: OperationStatus.CANCELED },
          },
        }),
      ]);

      // Get unique products in this warehouse
      const movements = await prisma.stockMovement.findMany({
        where: {
          OR: [
            { locationToId: { in: locationIds } },
            { locationFromId: { in: locationIds } },
          ],
        },
        select: {
          productId: true,
        },
        distinct: ['productId'],
      });

      summary.push({
        warehouse: {
          id: warehouse.id,
          name: warehouse.name,
          shortCode: warehouse.shortCode,
        },
        totalProducts: movements.length,
        totalLocations: warehouse.locations.length,
        receipts,
        deliveries,
        transfers,
      });
    }

    await cacheService.set('dashboard:warehouse-summary', summary, this.CACHE_TTL);

    return summary;
  }

  /**
   * Get summary by product category
   */
  async getSummaryByCategory() {
    const cached = await cacheService.get<any>('dashboard:category-summary');
    if (cached) {
      return cached;
    }

    const categories = await prisma.productCategory.findMany({
      include: {
        products: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    const summary = [];

    for (const category of categories) {
      const productIds = category.products.map((p) => p.id);

      // Calculate total stock for products in this category
      let totalStock = 0;
      for (const productId of productIds) {
        const movements = await prisma.stockMovement.findMany({
          where: { productId },
          select: { quantityDelta: true, locationToId: true, locationFromId: true },
        });

        const stockByLocation = new Map<string, number>();
        for (const movement of movements) {
          if (movement.locationToId) {
            const current = stockByLocation.get(movement.locationToId) || 0;
            stockByLocation.set(
              movement.locationToId,
              current + parseFloat(movement.quantityDelta.toString())
            );
          }
          if (movement.locationFromId) {
            const current = stockByLocation.get(movement.locationFromId) || 0;
            stockByLocation.set(
              movement.locationFromId,
              current - parseFloat(movement.quantityDelta.toString())
            );
          }
        }

        totalStock += Array.from(stockByLocation.values()).reduce((sum, qty) => sum + qty, 0);
      }

      summary.push({
        category: {
          id: category.id,
          name: category.name,
        },
        totalProducts: category.products.length,
        totalStock,
      });
    }

    await cacheService.set('dashboard:category-summary', summary, this.CACHE_TTL);

    return summary;
  }

  /**
   * Invalidate dashboard cache
   * Called when operations or stock changes
   */
  async invalidateCache() {
    await Promise.all([
      cacheService.del('dashboard:kpis'),
      cacheService.del('dashboard:warehouse-summary'),
      cacheService.del('dashboard:category-summary'),
    ]);
  }
}

export const dashboardService = new DashboardService();

