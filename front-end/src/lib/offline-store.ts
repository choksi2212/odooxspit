/**
 * Simple offline storage for operations and reference data
 * Uses localStorage for simplicity (can be upgraded to IndexedDB)
 */

interface PendingOperation {
  clientTempId: string;
  type: string;
  header: any;
  items: any[];
  lastModifiedAt: string;
}

const STORAGE_KEYS = {
  PENDING_OPERATIONS: 'stockmaster_pending_operations',
  WAREHOUSES: 'stockmaster_warehouses',
  LOCATIONS: 'stockmaster_locations',
  PRODUCTS: 'stockmaster_products',
};

export const offlineStore = {
  // Pending operations
  getPendingOperations(): PendingOperation[] {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
    return data ? JSON.parse(data) : [];
  },

  addPendingOperation(operation: PendingOperation) {
    const operations = this.getPendingOperations();
    operations.push(operation);
    localStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(operations));
  },

  clearPendingOperations() {
    localStorage.removeItem(STORAGE_KEYS.PENDING_OPERATIONS);
  },

  // Reference data caching
  cacheWarehouses(warehouses: any[]) {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  },

  getCachedWarehouses(): any[] | null {
    const data = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return data ? JSON.parse(data) : null;
  },

  cacheLocations(locations: any[]) {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  },

  getCachedLocations(): any[] | null {
    const data = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return data ? JSON.parse(data) : null;
  },

  cacheProducts(products: any[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCachedProducts(): any[] | null {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : null;
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
