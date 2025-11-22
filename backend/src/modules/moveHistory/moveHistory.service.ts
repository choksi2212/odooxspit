import prisma from '../../db/client.js';
import { parsePaginationParams } from '../../common/utils.js';
import { MovementType, OperationStatus, Prisma } from '@prisma/client';

/**
 * Move History Service
 * Provides stock movement ledger with filtering
 */
export class MoveHistoryService {
  /**
   * Get move history with filters
   * Time complexity: O(n) where n = number of movements matching filter
   */
  async getHistory(filters: {
    page?: number | string;
    limit?: number | string;
    type?: MovementType;
    status?: OperationStatus;
    reference?: string;
    warehouseId?: string;
    locationId?: string;
    productId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page, limit } = parsePaginationParams(filters);
    const skip = (page - 1) * limit;

    // Build the where clause for operations first
    const operationWhere: Prisma.OperationWhereInput = {};

    if (filters.status) {
      operationWhere.status = filters.status;
    }

    if (filters.reference) {
      operationWhere.reference = { contains: filters.reference, mode: 'insensitive' };
    }

    if (filters.warehouseId) {
      operationWhere.OR = [
        { warehouseFromId: filters.warehouseId },
        { warehouseToId: filters.warehouseId },
      ];
    }

    // Build where clause for movements
    const movementWhere: Prisma.StockMovementWhereInput = {};

    if (filters.type) {
      movementWhere.movementType = filters.type;
    }

    if (filters.locationId) {
      movementWhere.OR = [
        { locationFromId: filters.locationId },
        { locationToId: filters.locationId },
      ];
    }

    if (filters.productId) {
      movementWhere.productId = filters.productId;
    }

    if (filters.dateFrom || filters.dateTo) {
      movementWhere.createdAt = {};
      if (filters.dateFrom) {
        movementWhere.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        movementWhere.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Add operation filter to movement where
    if (Object.keys(operationWhere).length > 0) {
      movementWhere.operation = operationWhere;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: movementWhere,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unitOfMeasure: true,
            },
          },
          locationFrom: {
            select: {
              id: true,
              name: true,
              shortCode: true,
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  shortCode: true,
                },
              },
            },
          },
          locationTo: {
            select: {
              id: true,
              name: true,
              shortCode: true,
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  shortCode: true,
                },
              },
            },
          },
          operation: {
            select: {
              id: true,
              reference: true,
              type: true,
              status: true,
              contactName: true,
              scheduleDate: true,
              createdAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where: movementWhere }),
    ]);

    // Transform to flattened format
    const history = movements.map((movement) => ({
      id: movement.id,
      reference: movement.operation.reference,
      date: movement.createdAt,
      scheduleDate: movement.operation.scheduleDate,
      type: movement.movementType,
      status: movement.operation.status,
      product: movement.product,
      from: movement.locationFrom
        ? {
            location: {
              id: movement.locationFrom.id,
              name: movement.locationFrom.name,
              shortCode: movement.locationFrom.shortCode,
            },
            warehouse: movement.locationFrom.warehouse,
          }
        : null,
      to: movement.locationTo
        ? {
            location: {
              id: movement.locationTo.id,
              name: movement.locationTo.name,
              shortCode: movement.locationTo.shortCode,
            },
            warehouse: movement.locationTo.warehouse,
          }
        : null,
      quantity: parseFloat(movement.quantityDelta.toString()),
      contactName: movement.operation.contactName,
    }));

    return {
      data: history,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + movements.length < total,
      },
    };
  }

  /**
   * Get stock ledger for a specific product
   */
  async getProductLedger(productId: string) {
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unitOfMeasure: true,
          },
        },
        locationFrom: {
          select: {
            id: true,
            name: true,
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        locationTo: {
          select: {
            id: true,
            name: true,
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        operation: {
          select: {
            id: true,
            reference: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate running balance
    let runningBalance = 0;
    const ledger = movements.reverse().map((movement) => {
      const change = parseFloat(movement.quantityDelta.toString());
      
      // Adjust for from/to
      let balanceChange = 0;
      if (movement.locationToId) {
        balanceChange += change;
      }
      if (movement.locationFromId) {
        balanceChange -= change;
      }
      
      runningBalance += balanceChange;

      return {
        id: movement.id,
        date: movement.createdAt,
        reference: movement.operation.reference,
        type: movement.movementType,
        status: movement.operation.status,
        from: movement.locationFrom?.name || 'External',
        to: movement.locationTo?.name || 'External',
        quantity: change,
        balanceChange,
        runningBalance,
      };
    });

    return {
      product: movements[0]?.product || null,
      ledger: ledger.reverse(),
    };
  }
}

export const moveHistoryService = new MoveHistoryService();

