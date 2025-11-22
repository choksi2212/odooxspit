/**
 * KPI calculation utilities
 * Business logic for dashboard metrics
 */

interface Operation {
  id: string;
  type: string;
  status: string;
  scheduleDate: string;
}

/**
 * Count operations by status
 * Time complexity: O(n)
 */
export function countByStatus(operations: Operation[], status: string): number {
  return operations.filter((op) => op.status === status).length;
}

/**
 * Count late operations (schedule date < today and not done/canceled)
 * Time complexity: O(n)
 */
export function countLateOperations(operations: Operation[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return operations.filter((op) => {
    if (op.status === 'DONE' || op.status === 'CANCELED') {
      return false;
    }

    const scheduled = new Date(op.scheduleDate);
    scheduled.setHours(0, 0, 0, 0);

    return scheduled < today;
  }).length;
}

/**
 * Calculate stock health percentage
 */
export function calculateStockHealth(
  totalProducts: number,
  lowStockCount: number,
  outOfStockCount: number
): number {
  if (totalProducts === 0) return 100;

  const healthyProducts = totalProducts - lowStockCount - outOfStockCount;
  return Math.round((healthyProducts / totalProducts) * 100);
}

/**
 * Group operations by type and count
 * Time complexity: O(n)
 */
export function groupOperationsByType(operations: Operation[]): Record<string, number> {
  return operations.reduce((acc, op) => {
    acc[op.type] = (acc[op.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
