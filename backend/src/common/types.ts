import { UserRole } from '@prisma/client';

/**
 * Common types used across the application
 */

export interface AuthUser {
  id: string;
  loginId: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
    cursor?: string;
  };
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

// WebSocket message types
export interface WSMessage {
  type: string;
  payload: unknown;
}

export interface WSSubscribeMessage {
  type: 'subscribe' | 'unsubscribe';
  topics: string[];
}

// Real-time event types
export type RealtimeEvent = 
  | DashboardKpisUpdatedEvent
  | StockLevelChangedEvent
  | OperationCreatedEvent
  | OperationUpdatedEvent
  | OperationStatusChangedEvent
  | LowStockAlertCreatedEvent;

export interface DashboardKpisUpdatedEvent {
  type: 'dashboard.kpisUpdated';
  payload: {
    totalProductsInStock: number;
    lowStockCount: number;
    pendingReceipts: number;
    pendingDeliveries: number;
    pendingTransfers: number;
  };
}

export interface StockLevelChangedEvent {
  type: 'stock.levelChanged';
  payload: {
    productId: string;
    locationId: string;
    newQty: number;
  };
}

export interface OperationCreatedEvent {
  type: 'operation.created';
  payload: {
    operationId: string;
    type: string;
    status: string;
    reference: string;
  };
}

export interface OperationUpdatedEvent {
  type: 'operation.updated';
  payload: {
    operationId: string;
    type: string;
    status: string;
    reference: string;
  };
}

export interface OperationStatusChangedEvent {
  type: 'operation.statusChanged';
  payload: {
    operationId: string;
    oldStatus: string;
    newStatus: string;
  };
}

export interface LowStockAlertCreatedEvent {
  type: 'lowStock.alertCreated';
  payload: {
    productId: string;
    currentQty: number;
    threshold: number;
  };
}

