import prisma from '../../db/client.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';
import { parsePaginationParams } from '../../common/utils.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Product Service
 * Handles CRUD operations for products
 */
export class ProductService {
  /**
   * Get all products with optional filtering
   * Time complexity: O(n) where n = number of products matching filter
   */
  async getAll(filters: {
    page?: number | string;
    limit?: number | string;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    warehouseId?: string;
    locationId?: string;
  }) {
    const { page, limit } = parsePaginationParams(filters);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate current stock for each product
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        // Get all movements for this product
        const movements = await prisma.stockMovement.findMany({
          where: { productId: product.id },
          select: { 
            quantityDelta: true, 
            locationToId: true, 
            locationFromId: true,
            locationTo: { select: { warehouseId: true } },
            locationFrom: { select: { warehouseId: true } },
          },
        });

        let totalStock = 0;
        const stockByLocation = new Map<string, number>();

        // Calculate stock for each location
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

        // Apply filters to calculate total stock
        if (filters.locationId) {
          // Specific location: only count that location's stock
          totalStock = stockByLocation.get(filters.locationId) || 0;
        } else if (filters.warehouseId) {
          // Specific warehouse: sum stock from all locations in that warehouse
          const warehouseLocations = await prisma.location.findMany({
            where: { warehouseId: filters.warehouseId },
            select: { id: true },
          });
          const locationIds = new Set(warehouseLocations.map(l => l.id));
          
          for (const [locationId, qty] of stockByLocation.entries()) {
            if (locationIds.has(locationId)) {
              totalStock += qty;
            }
          }
        } else {
          // No filter: sum all stock
          totalStock = Array.from(stockByLocation.values()).reduce((sum, qty) => sum + qty, 0);
        }

        return {
          ...product,
          currentStock: totalStock,
          lowStockThreshold: product.reorderLevel,
          category: product.category?.name || null,
          cost: parseFloat(product.costPrice.toString()), // Add cost field for frontend
        };
      })
    );

    return {
      data: productsWithStock,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + products.length < total,
      },
    };
  }

  /**
   * Get product by ID
   */
  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    return product;
  }

  /**
   * Get stock levels for a product across all locations
   * Time complexity: O(n) where n = number of stock movements for the product
   */
  async getProductStock(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    // Get stock by location
    // Current stock = SUM(quantityDelta) for movements where locationToId = location
    //                - SUM(quantityDelta) for movements where locationFromId = location
    const movements = await prisma.stockMovement.findMany({
      where: {
        productId,
      },
      include: {
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
      },
    });

    // Calculate stock per location
    const stockByLocation = new Map<string, {
      locationId: string;
      locationName: string;
      warehouseId: string;
      warehouseName: string;
      quantity: Decimal;
    }>();

    for (const movement of movements) {
      // Add to destination location
      if (movement.locationToId && movement.locationTo) {
        const key = movement.locationToId;
        const existing = stockByLocation.get(key);
        
        if (existing) {
          existing.quantity = new Decimal(existing.quantity).plus(movement.quantityDelta) as any;
        } else {
          stockByLocation.set(key, {
            locationId: movement.locationTo.id,
            locationName: movement.locationTo.name,
            warehouseId: movement.locationTo.warehouse.id,
            warehouseName: movement.locationTo.warehouse.name,
            quantity: movement.quantityDelta,
          });
        }
      }

      // Subtract from source location
      if (movement.locationFromId && movement.locationFrom) {
        const key = movement.locationFromId;
        const existing = stockByLocation.get(key);
        
        if (existing) {
          existing.quantity = new Decimal(existing.quantity).minus(movement.quantityDelta) as any;
        } else {
          stockByLocation.set(key, {
            locationId: movement.locationFrom.id,
            locationName: movement.locationFrom.name,
            warehouseId: movement.locationFrom.warehouse.id,
            warehouseName: movement.locationFrom.warehouse.name,
            quantity: new Decimal(0).minus(movement.quantityDelta) as any,
          });
        }
      }
    }

    const stockLevels = Array.from(stockByLocation.values()).map(item => ({
      ...item,
      quantity: parseFloat(item.quantity.toString()),
    }));

    const totalStock = stockLevels.reduce((sum, item) => sum + item.quantity, 0);

    return {
      product,
      totalStock,
      stockByLocation: stockLevels,
    };
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts() {
    // Get all products with reorder levels
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        reorderLevel: {
          gt: 0,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // For each product, calculate current stock
    const lowStockProducts = [];

    for (const product of products) {
      const movements = await prisma.stockMovement.findMany({
        where: {
          productId: product.id,
        },
        select: {
          quantityDelta: true,
          locationToId: true,
          locationFromId: true,
        },
      });

      // Calculate total stock
      let totalStock = 0;
      const stockByLocation = new Map<string, number>();

      for (const movement of movements) {
        if (movement.locationToId) {
          const current = stockByLocation.get(movement.locationToId) || 0;
          stockByLocation.set(movement.locationToId, current + parseFloat(movement.quantityDelta.toString()));
        }
        if (movement.locationFromId) {
          const current = stockByLocation.get(movement.locationFromId) || 0;
          stockByLocation.set(movement.locationFromId, current - parseFloat(movement.quantityDelta.toString()));
        }
      }

      totalStock = Array.from(stockByLocation.values()).reduce((sum, qty) => sum + qty, 0);

      if (totalStock <= product.reorderLevel) {
        lowStockProducts.push({
          ...product,
          currentStock: totalStock,
          reorderLevel: product.reorderLevel,
        });
      }
    }

    return lowStockProducts;
  }

  /**
   * Create new product
   */
  async create(data: {
    name: string;
    sku: string;
    categoryId?: string;
    unitOfMeasure?: string;
    reorderLevel?: number;
  }) {
    // Check if SKU already exists
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      throw new ConflictError('Product with this SKU already exists');
    }

    // If categoryId provided, verify it exists
    if (data.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundError('Category');
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId || null,
        unitOfMeasure: data.unitOfMeasure || 'Units',
        reorderLevel: data.reorderLevel || 0,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return product;
  }

  /**
   * Update product
   */
  async update(
    id: string,
    data: {
      name?: string;
      sku?: string;
      categoryId?: string | null;
      unitOfMeasure?: string;
      reorderLevel?: number;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Product');
    }

    // If updating SKU, check for conflicts
    if (data.sku && data.sku !== existing.sku) {
      const conflict = await prisma.product.findFirst({
        where: { sku: data.sku, id: { not: id } },
      });

      if (conflict) {
        throw new ConflictError('Product with this SKU already exists');
      }
    }

    // If categoryId provided, verify it exists
    if (data.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundError('Category');
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async delete(id: string) {
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Product');
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Product deleted successfully' };
  }
}

export const productService = new ProductService();

