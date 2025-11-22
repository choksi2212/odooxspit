import prisma from '../../db/client.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../common/errors.js';
import { generateOperationReference, parsePaginationParams } from '../../common/utils.js';
import {
  OperationType,
  OperationStatus,
  MovementType,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { realtimeService } from '../realtime/realtime.service.js';

/**
 * Operation Service
 * Handles all inventory operations: Receipts, Deliveries, Transfers, and Adjustments
 * Implements state machine for operation status transitions
 */
export class OperationService {
  /**
   * Get all operations with filtering
   * Time complexity: O(n) where n = number of operations matching filter
   */
  async getAll(filters: {
    page?: number | string;
    limit?: number | string;
    type?: OperationType;
    status?: OperationStatus;
    warehouseId?: string;
    locationId?: string;
    reference?: string;
    contactName?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page, limit } = parsePaginationParams(filters);
    const skip = (page - 1) * limit;

    const where: Prisma.OperationWhereInput = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.reference) {
      where.reference = { contains: filters.reference, mode: 'insensitive' };
    }

    if (filters.contactName) {
      where.contactName = { contains: filters.contactName, mode: 'insensitive' };
    }

    if (filters.warehouseId) {
      where.OR = [
        { warehouseFromId: filters.warehouseId },
        { warehouseToId: filters.warehouseId },
      ];
    }

    if (filters.locationId) {
      where.OR = [
        { locationFromId: filters.locationId },
        { locationToId: filters.locationId },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.scheduleDate = {};
      if (filters.dateFrom) {
        where.scheduleDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.scheduleDate.lte = new Date(filters.dateTo);
      }
    }

    const [operations, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        include: {
          warehouseFrom: { select: { id: true, name: true, shortCode: true } },
          warehouseTo: { select: { id: true, name: true, shortCode: true } },
          locationFrom: { select: { id: true, name: true, shortCode: true } },
          locationTo: { select: { id: true, name: true, shortCode: true } },
          createdBy: { select: { id: true, name: true, loginId: true } },
          responsible: { select: { id: true, name: true, loginId: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unitOfMeasure: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operation.count({ where }),
    ]);

    return {
      data: operations,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + operations.length < total,
      },
    };
  }

  /**
   * Get operation by ID
   */
  async getById(id: string) {
    const operation = await prisma.operation.findUnique({
      where: { id },
      include: {
        warehouseFrom: { select: { id: true, name: true, shortCode: true } },
        warehouseTo: { select: { id: true, name: true, shortCode: true } },
        locationFrom: { select: { id: true, name: true, shortCode: true } },
        locationTo: { select: { id: true, name: true, shortCode: true } },
        createdBy: { select: { id: true, name: true, loginId: true } },
        responsible: { select: { id: true, name: true, loginId: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitOfMeasure: true,
              },
            },
          },
        },
        stockMovements: true,
      },
    });

    if (!operation) {
      throw new NotFoundError('Operation');
    }

    return operation;
  }

  /**
   * Generate next reference for operation type
   */
  private async generateReference(type: OperationType): Promise<string> {
    // Get the last operation of this type
    const lastOperation = await prisma.operation.findFirst({
      where: { type },
      orderBy: { createdAt: 'desc' },
      select: { reference: true },
    });

    let sequence = 1;
    if (lastOperation) {
      // Extract sequence from reference (e.g., "WH/IN/0001" -> 1)
      const parts = lastOperation.reference.split('/');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    return generateOperationReference(type, sequence);
  }

  /**
   * Create Receipt operation
   */
  async createReceipt(
    userId: string,
    data: {
      warehouseToId?: string;
      locationToId: string;
      contactName?: string;
      scheduleDate?: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
      responsibleUserId?: string;
    }
  ) {
    // Validate location exists
    const location = await prisma.location.findUnique({
      where: { id: data.locationToId },
    });

    if (!location) {
      throw new NotFoundError('Location');
    }

    // Generate reference
    const reference = await this.generateReference(OperationType.RECEIPT);

    // Create operation with items
    const operation = await prisma.operation.create({
      data: {
        type: OperationType.RECEIPT,
        reference,
        status: OperationStatus.DRAFT,
        warehouseToId: data.warehouseToId || location.warehouseId,
        locationToId: data.locationToId,
        contactName: data.contactName,
        scheduleDate: data.scheduleDate ? new Date(data.scheduleDate) : null,
        notes: data.notes,
        createdByUserId: userId,
        responsibleUserId: data.responsibleUserId || userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        locationTo: { select: { id: true, name: true } },
        warehouseTo: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    // Publish real-time event
    await realtimeService.publishOperationCreated(operation);

    return operation;
  }

  /**
   * Create Delivery operation
   */
  async createDelivery(
    userId: string,
    data: {
      warehouseFromId?: string;
      locationFromId: string;
      contactName?: string;
      scheduleDate?: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
      responsibleUserId?: string;
    }
  ) {
    const location = await prisma.location.findUnique({
      where: { id: data.locationFromId },
    });

    if (!location) {
      throw new NotFoundError('Location');
    }

    const reference = await this.generateReference(OperationType.DELIVERY);

    const operation = await prisma.operation.create({
      data: {
        type: OperationType.DELIVERY,
        reference,
        status: OperationStatus.DRAFT,
        warehouseFromId: data.warehouseFromId || location.warehouseId,
        locationFromId: data.locationFromId,
        contactName: data.contactName,
        scheduleDate: data.scheduleDate ? new Date(data.scheduleDate) : null,
        notes: data.notes,
        createdByUserId: userId,
        responsibleUserId: data.responsibleUserId || userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        locationFrom: { select: { id: true, name: true } },
        warehouseFrom: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    await realtimeService.publishOperationCreated(operation);

    return operation;
  }

  /**
   * Create Transfer operation
   */
  async createTransfer(
    userId: string,
    data: {
      warehouseFromId?: string;
      locationFromId: string;
      warehouseToId?: string;
      locationToId: string;
      scheduleDate?: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
      responsibleUserId?: string;
    }
  ) {
    // Validate locations
    const [locationFrom, locationTo] = await Promise.all([
      prisma.location.findUnique({ where: { id: data.locationFromId } }),
      prisma.location.findUnique({ where: { id: data.locationToId } }),
    ]);

    if (!locationFrom) {
      throw new NotFoundError('Source location');
    }
    if (!locationTo) {
      throw new NotFoundError('Destination location');
    }

    if (data.locationFromId === data.locationToId) {
      throw new BadRequestError('Source and destination locations cannot be the same');
    }

    const reference = await this.generateReference(OperationType.TRANSFER);

    const operation = await prisma.operation.create({
      data: {
        type: OperationType.TRANSFER,
        reference,
        status: OperationStatus.DRAFT,
        warehouseFromId: data.warehouseFromId || locationFrom.warehouseId,
        locationFromId: data.locationFromId,
        warehouseToId: data.warehouseToId || locationTo.warehouseId,
        locationToId: data.locationToId,
        scheduleDate: data.scheduleDate ? new Date(data.scheduleDate) : null,
        notes: data.notes,
        createdByUserId: userId,
        responsibleUserId: data.responsibleUserId || userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        locationFrom: { select: { id: true, name: true } },
        locationTo: { select: { id: true, name: true } },
        warehouseFrom: { select: { id: true, name: true } },
        warehouseTo: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    await realtimeService.publishOperationCreated(operation);

    return operation;
  }

  /**
   * Create Adjustment operation
   * Calculates difference between counted and current stock
   */
  async createAdjustment(
    userId: string,
    data: {
      warehouseId?: string;
      locationId: string;
      notes?: string;
      items: Array<{ productId: string; countedQuantity: number }>;
      responsibleUserId?: string;
    }
  ) {
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    });

    if (!location) {
      throw new NotFoundError('Location');
    }

    const reference = await this.generateReference(OperationType.ADJUSTMENT);

    // Calculate current stock for each product
    const adjustmentItems = [];

    for (const item of data.items) {
      // Get current stock for this product at this location
      const movements = await prisma.stockMovement.findMany({
        where: {
          productId: item.productId,
          OR: [
            { locationToId: data.locationId },
            { locationFromId: data.locationId },
          ],
        },
      });

      let currentStock = 0;
      for (const movement of movements) {
        if (movement.locationToId === data.locationId) {
          currentStock += parseFloat(movement.quantityDelta.toString());
        }
        if (movement.locationFromId === data.locationId) {
          currentStock -= parseFloat(movement.quantityDelta.toString());
        }
      }

      // Calculate adjustment quantity (difference)
      const adjustmentQty = item.countedQuantity - currentStock;

      adjustmentItems.push({
        productId: item.productId,
        quantity: Math.abs(adjustmentQty),
      });
    }

    const operation = await prisma.operation.create({
      data: {
        type: OperationType.ADJUSTMENT,
        reference,
        status: OperationStatus.DRAFT,
        warehouseToId: data.warehouseId || location.warehouseId,
        locationToId: data.locationId,
        notes: data.notes,
        createdByUserId: userId,
        responsibleUserId: data.responsibleUserId || userId,
        items: {
          create: adjustmentItems,
        },
      },
      include: {
        locationTo: { select: { id: true, name: true } },
        warehouseTo: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    await realtimeService.publishOperationCreated(operation);

    return operation;
  }

  /**
   * Update operation (only allowed in DRAFT or WAITING status)
   */
  async update(
    id: string,
    data: {
      contactName?: string;
      scheduleDate?: string;
      notes?: string;
      items?: Array<{ productId: string; quantity: number }>;
      responsibleUserId?: string | null;
    }
  ) {
    const operation = await prisma.operation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!operation) {
      throw new NotFoundError('Operation');
    }

    if (![OperationStatus.DRAFT, OperationStatus.WAITING].includes(operation.status)) {
      throw new BadRequestError('Can only update operations in DRAFT or WAITING status');
    }

    // Update operation
    const updateData: any = {};

    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.scheduleDate !== undefined) {
      updateData.scheduleDate = data.scheduleDate ? new Date(data.scheduleDate) : null;
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.responsibleUserId !== undefined) {
      updateData.responsibleUserId = data.responsibleUserId;
    }

    // If items are being updated, delete old items and create new ones
    if (data.items) {
      await prisma.operationItem.deleteMany({
        where: { operationId: id },
      });

      updateData.items = {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };
    }

    const updated = await prisma.operation.update({
      where: { id },
      data: updateData,
      include: {
        locationFrom: { select: { id: true, name: true } },
        locationTo: { select: { id: true, name: true } },
        warehouseFrom: { select: { id: true, name: true } },
        warehouseTo: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    await realtimeService.publishOperationUpdated(updated);

    return updated;
  }

  /**
   * Transition operation status
   * Implements state machine logic
   */
  async transition(id: string, action: 'mark_ready' | 'mark_done' | 'cancel') {
    const operation = await prisma.operation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!operation) {
      throw new NotFoundError('Operation');
    }

    const currentStatus = operation.status;
    let newStatus: OperationStatus;

    // State machine logic
    if (action === 'cancel') {
      if (currentStatus === OperationStatus.DONE) {
        throw new BadRequestError('Cannot cancel completed operation');
      }
      newStatus = OperationStatus.CANCELED;
    } else if (action === 'mark_ready') {
      if (operation.type === OperationType.RECEIPT && currentStatus === OperationStatus.DRAFT) {
        newStatus = OperationStatus.READY;
      } else if (operation.type === OperationType.DELIVERY && currentStatus === OperationStatus.WAITING) {
        newStatus = OperationStatus.READY;
      } else if (operation.type === OperationType.TRANSFER && currentStatus === OperationStatus.DRAFT) {
        newStatus = OperationStatus.READY;
      } else {
        throw new BadRequestError(`Cannot transition from ${currentStatus} to READY`);
      }
    } else if (action === 'mark_done') {
      if (currentStatus === OperationStatus.READY || currentStatus === OperationStatus.DRAFT) {
        newStatus = OperationStatus.DONE;
      } else {
        throw new BadRequestError(`Cannot transition from ${currentStatus} to DONE`);
      }
    } else {
      throw new BadRequestError('Invalid action');
    }

    // Create stock movements when transitioning to DONE
    const stockMovements = [];
    if (newStatus === OperationStatus.DONE && currentStatus !== OperationStatus.DONE) {
      for (const item of operation.items) {
        let movementType: MovementType;
        let locationFromId: string | null = null;
        let locationToId: string | null = null;
        let quantityDelta: Decimal;

        switch (operation.type) {
          case OperationType.RECEIPT:
            movementType = MovementType.RECEIPT;
            locationToId = operation.locationToId;
            quantityDelta = item.quantity;
            break;
          case OperationType.DELIVERY:
            movementType = MovementType.DELIVERY;
            locationFromId = operation.locationFromId;
            quantityDelta = item.quantity;
            break;
          case OperationType.TRANSFER:
            movementType = MovementType.TRANSFER;
            locationFromId = operation.locationFromId;
            locationToId = operation.locationToId;
            quantityDelta = item.quantity;
            break;
          case OperationType.ADJUSTMENT:
            movementType = MovementType.ADJUSTMENT;
            locationToId = operation.locationToId;
            quantityDelta = item.quantity;
            break;
          default:
            throw new BadRequestError('Invalid operation type');
        }

        stockMovements.push({
          productId: item.productId,
          locationFromId,
          locationToId,
          quantityDelta,
          operationId: operation.id,
          movementType,
        });
      }
    }

    // Update operation and create movements in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const op = await tx.operation.update({
        where: { id },
        data: { status: newStatus },
        include: {
          locationFrom: { select: { id: true, name: true } },
          locationTo: { select: { id: true, name: true } },
          warehouseFrom: { select: { id: true, name: true } },
          warehouseTo: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });

      if (stockMovements.length > 0) {
        await tx.stockMovement.createMany({
          data: stockMovements,
        });
      }

      return op;
    });

    // Publish real-time events
    await realtimeService.publishOperationStatusChanged(
      updated.id,
      currentStatus,
      newStatus
    );

    // If stock changed, publish stock level changes
    if (stockMovements.length > 0) {
      for (const movement of stockMovements) {
        if (movement.locationToId) {
          await realtimeService.publishStockLevelChanged(
            movement.productId,
            movement.locationToId
          );
        }
      }
    }

    return updated;
  }
}

export const operationService = new OperationService();

