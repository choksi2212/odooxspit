import prisma from '../../db/client.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';
import { parsePaginationParams } from '../../common/utils.js';

/**
 * Location Service
 * Handles CRUD operations for warehouse locations
 */
export class LocationService {
  /**
   * Get all locations with optional filtering
   */
  async getAll(filters: {
    page?: number | string;
    limit?: number | string;
    warehouseId?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const { page, limit } = parsePaginationParams(filters);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { shortCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              shortCode: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.location.count({ where }),
    ]);

    return {
      data: locations,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + locations.length < total,
      },
    };
  }

  /**
   * Get location by ID
   */
  async getById(id: string) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundError('Location');
    }

    return location;
  }

  /**
   * Create new location
   */
  async create(data: {
    warehouseId: string;
    name: string;
    shortCode: string;
  }) {
    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundError('Warehouse');
    }

    // Check if shortCode already exists in this warehouse
    const existing = await prisma.location.findFirst({
      where: {
        warehouseId: data.warehouseId,
        shortCode: data.shortCode,
      },
    });

    if (existing) {
      throw new ConflictError('Location with this short code already exists in this warehouse');
    }

    const location = await prisma.location.create({
      data,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    });

    return location;
  }

  /**
   * Update location
   */
  async update(
    id: string,
    data: {
      name?: string;
      shortCode?: string;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.location.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Location');
    }

    // If updating shortCode, check for conflicts within the same warehouse
    if (data.shortCode && data.shortCode !== existing.shortCode) {
      const conflict = await prisma.location.findFirst({
        where: {
          warehouseId: existing.warehouseId,
          shortCode: data.shortCode,
          id: { not: id },
        },
      });

      if (conflict) {
        throw new ConflictError('Location with this short code already exists in this warehouse');
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    });

    return location;
  }

  /**
   * Delete location (soft delete)
   */
  async delete(id: string) {
    const existing = await prisma.location.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Location');
    }

    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Location deleted successfully' };
  }
}

export const locationService = new LocationService();

