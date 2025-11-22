/**
 * Business logic for filtering, sorting, and searching
 * Pure functions for better testability
 */

/**
 * Filter array of items by search term
 * Time complexity: O(n) where n is array length
 */
export function searchFilter<T>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm) return items;

  const searchLower = searchTerm.toLowerCase();

  return items.filter((item) => {
    return fields.some((field) => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      return false;
    });
  });
}

/**
 * Sort array by field and direction
 * Time complexity: O(n log n) due to native sort
 */
export function sortByField<T>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Group array items by a field value
 * Time complexity: O(n)
 */
export function groupBy<T>(items: T[], field: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = String(item[field]);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate if operation is late based on schedule date
 */
export function isOperationLate(scheduleDate: string, status: string): boolean {
  if (status === 'DONE' || status === 'CANCELED') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const scheduled = new Date(scheduleDate);
  scheduled.setHours(0, 0, 0, 0);

  return scheduled < today;
}

/**
 * Paginate array of items
 * Time complexity: O(1) for slice operation
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; totalPages: number; hasNext: boolean; hasPrev: boolean } {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const totalPages = Math.ceil(items.length / pageSize);

  return {
    items: items.slice(startIndex, endIndex),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
