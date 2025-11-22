import prisma from '../../db/client.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';

/**
 * Product Category Service
 * Handles CRUD operations for product categories
 */
export class CategoryService {
  /**
   * Get all categories
   */
  async getAll() {
    const categories = await prisma.productCategory.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  /**
   * Get category by ID
   */
  async getById(id: string) {
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sku: true,
            unitOfMeasure: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  }

  /**
   * Create new category
   */
  async create(data: { name: string }) {
    // Check if name already exists
    const existing = await prisma.productCategory.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    const category = await prisma.productCategory.create({
      data,
    });

    return category;
  }

  /**
   * Update category
   */
  async update(id: string, data: { name: string }) {
    const existing = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Category');
    }

    // Check for name conflicts
    if (data.name !== existing.name) {
      const conflict = await prisma.productCategory.findFirst({
        where: { name: data.name, id: { not: id } },
      });

      if (conflict) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data,
    });

    return category;
  }

  /**
   * Delete category
   */
  async delete(id: string) {
    const existing = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Category');
    }

    if (existing._count.products > 0) {
      throw new ConflictError(
        `Cannot delete category with ${existing._count.products} associated products`
      );
    }

    await prisma.productCategory.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}

export const categoryService = new CategoryService();

