import prisma from '../../db/client.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';
import { parsePaginationParams } from '../../common/utils.js';

/**
 * Warehouse Service
 * Handles CRUD operations for warehouses
 */
export class WarehouseService {
  /**
   * Get all warehouses with optional filtering
   * Time complexity: O(n) where n = number of warehouses matching filter
   */
  async getAll(filters: {
    page?: number | string;
    limit?: number | string;
    search?: string;
    isActive?: boolean;
  }) {
    const { page, limit } = parsePaginationParams(filters);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { shortCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: {
          locations: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              shortCode: true,
            },
          },
          _count: {
            select: {
              locations: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return {
      data: warehouses,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + warehouses.length < total,
      },
    };
  }

  /**
   * Get warehouse by ID
   */
  async getById(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            shortCode: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            locations: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundError('Warehouse');
    }

    return warehouse;
  }

  /**
   * Create new warehouse
   */
  async create(data: {
    name: string;
    shortCode: string;
    address?: string;
  }) {
    // Check if shortCode already exists
    const existing = await prisma.warehouse.findFirst({
      where: { shortCode: data.shortCode },
    });

    if (existing) {
      throw new ConflictError('Warehouse with this short code already exists');
    }

    const warehouse = await prisma.warehouse.create({
      data,
      include: {
        locations: true,
      },
    });

    return warehouse;
  }

  /**
   * Update warehouse
   */
  async update(
    id: string,
    data: {
      name?: string;
      shortCode?: string;
      address?: string;
      isActive?: boolean;
    }
  ) {
    // Check if warehouse exists
    const existing = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Warehouse');
    }

    // If updating shortCode, check for conflicts
    if (data.shortCode && data.shortCode !== existing.shortCode) {
      const conflict = await prisma.warehouse.findFirst({
        where: { shortCode: data.shortCode, id: { not: id } },
      });

      if (conflict) {
        throw new ConflictError('Warehouse with this short code already exists');
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data,
      include: {
        locations: {
          where: { isActive: true },
        },
      },
    });

    return warehouse;
  }

  /**
   * Delete warehouse (soft delete by setting isActive = false)
   */
  async delete(id: string) {
    const existing = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Warehouse');
    }

    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Warehouse deleted successfully' };
  }
}

export const warehouseService = new WarehouseService();

