import { z } from 'zod';
import { OperationType, OperationStatus, UserRole, MovementType } from '@prisma/client';

/**
 * Zod validation schemas for request payloads
 * Centralized validation ensures consistency and type safety
 */

// ============================================
// AUTH SCHEMAS
// ============================================

export const signupSchema = z.object({
  loginId: z.string().min(6).max(12).regex(/^[a-zA-Z0-9]+$/, 'LoginId must be alphanumeric'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(255),
  role: z.nativeEnum(UserRole).optional(),
});

export const loginSchema = z.object({
  loginIdOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export const requestOtpSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8),
});

// ============================================
// WAREHOUSE & LOCATION SCHEMAS
// ============================================

export const createWarehouseSchema = z.object({
  name: z.string().min(1).max(255),
  shortCode: z.string().min(1).max(10),
  address: z.string().optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  shortCode: z.string().min(1).max(10).optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createLocationSchema = z.object({
  warehouseId: z.string().cuid(),
  name: z.string().min(1).max(255),
  shortCode: z.string().min(1).max(20),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  shortCode: z.string().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const createProductCategorySchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateProductCategorySchema = z.object({
  name: z.string().min(1).max(255),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  categoryId: z.string().cuid().optional(),
  unitOfMeasure: z.string().min(1).max(50).default('Units'),
  reorderLevel: z.number().int().min(0).default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().min(1).max(100).optional(),
  categoryId: z.string().cuid().nullable().optional(),
  unitOfMeasure: z.string().min(1).max(50).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// OPERATION SCHEMAS
// ============================================

export const operationItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().positive(),
});

export const createReceiptSchema = z.object({
  warehouseToId: z.string().cuid().optional(),
  locationToId: z.string().cuid(),
  contactName: z.string().max(255).optional(),
  scheduleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(operationItemSchema).min(1),
  responsibleUserId: z.string().cuid().optional(),
});

export const createDeliverySchema = z.object({
  warehouseFromId: z.string().cuid().optional(),
  locationFromId: z.string().cuid(),
  contactName: z.string().max(255).optional(),
  scheduleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(operationItemSchema).min(1),
  responsibleUserId: z.string().cuid().optional(),
});

export const createTransferSchema = z.object({
  warehouseFromId: z.string().cuid().optional(),
  locationFromId: z.string().cuid(),
  warehouseToId: z.string().cuid().optional(),
  locationToId: z.string().cuid(),
  scheduleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(operationItemSchema).min(1),
  responsibleUserId: z.string().cuid().optional(),
});

export const createAdjustmentSchema = z.object({
  warehouseId: z.string().cuid().optional(),
  locationId: z.string().cuid(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      countedQuantity: z.number().nonnegative(),
    })
  ).min(1),
  responsibleUserId: z.string().cuid().optional(),
});

export const updateOperationSchema = z.object({
  contactName: z.string().max(255).optional(),
  scheduleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(operationItemSchema).optional(),
  responsibleUserId: z.string().cuid().nullable().optional(),
});

export const transitionOperationSchema = z.object({
  action: z.enum(['mark_ready', 'mark_done', 'cancel']),
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const operationsQuerySchema = paginationSchema.extend({
  type: z.nativeEnum(OperationType).optional(),
  status: z.nativeEnum(OperationStatus).optional(),
  warehouseId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  reference: z.string().optional(),
  contactName: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const moveHistoryQuerySchema = paginationSchema.extend({
  type: z.nativeEnum(MovementType).optional(),
  status: z.nativeEnum(OperationStatus).optional(),
  reference: z.string().optional(),
  warehouseId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const productsQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

// ============================================
// SYNC SCHEMA
// ============================================

export const syncOperationsSchema = z.object({
  clientId: z.string(),
  operations: z.array(
    z.object({
      clientTempId: z.string(),
      type: z.nativeEnum(OperationType),
      header: z.record(z.unknown()),
      items: z.array(operationItemSchema),
      lastModifiedAt: z.string().datetime(),
    })
  ),
});

