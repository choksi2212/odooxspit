/**
 * API Client for StockMaster Backend
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // For refresh token cookies
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An unexpected error occurred',
      }));
      throw error;
    }

    return response.json();
  }

  // Auth endpoints
  async signup(data: {
    loginId: string;
    email: string;
    password: string;
    name: string;
  }) {
    return this.request<{ user: any; accessToken: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { loginIdOrEmail: string; password: string }) {
    return this.request<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refresh() {
    return this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout() {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async requestOtp(email: string) {
    return this.request<void>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: { email: string; otp: string; newPassword: string }) {
    return this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Dashboard endpoints
  async getDashboardKpis() {
    return this.request<any>('/dashboard/kpis');
  }

  async getDashboardSummaryByWarehouse() {
    return this.request<any>('/dashboard/summary-by-warehouse');
  }

  // Warehouses
  async getWarehouses() {
    const response = await this.request<{data: any[], pagination: any}>('/warehouses');
    return response.data;
  }

  async getWarehouse(id: string) {
    return this.request<any>(`/warehouses/${id}`);
  }

  async createWarehouse(data: any) {
    return this.request<any>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWarehouse(id: string, data: any) {
    return this.request<any>(`/warehouses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Locations
  async getLocations(warehouseId?: string) {
    const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
    const response = await this.request<{data: any[], pagination: any}>(`/locations${query}`);
    return response.data;
  }

  async createLocation(data: any) {
    return this.request<any>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Products
  async getProducts() {
    const response = await this.request<{data: any[], pagination: any}>('/products');
    return response.data;
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async getProductStock(id: string) {
    return this.request<any>(`/products/${id}/stock`);
  }

  async getLowStockProducts() {
    const response = await this.request<{data: any[], pagination: any}>('/products/low-stock');
    return response.data;
  }

  // Operations
  async getOperations(filters?: {
    type?: string;
    status?: string;
    warehouseId?: string;
    reference?: string;
    contact?: string;
    productId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<{data: any[], pagination: any}>(`/operations${query}`);
    return response;
  }

  async getOperation(id: string) {
    return this.request<any>(`/operations/${id}`);
  }

  async createReceipt(data: any) {
    return this.request<any>('/operations/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createDelivery(data: any) {
    return this.request<any>('/operations/deliveries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createTransfer(data: any) {
    return this.request<any>('/operations/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createAdjustment(data: any) {
    return this.request<any>('/operations/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOperation(id: string, data: any) {
    return this.request<any>(`/operations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async transitionOperation(id: string, action: string) {
    return this.request<any>(`/operations/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // Move History
  async getMoveHistory(filters?: {
    reference?: string;
    contact?: string;
    type?: string;
    warehouseId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<{data: any[], pagination: any}>(`/move-history${query}`);
    return response;
  }

  // Offline Sync
  async syncOperations(data: {
    clientId: string;
    operations: Array<{
      clientTempId: string;
      type: string;
      header: any;
      items: any[];
      lastModifiedAt: string;
    }>;
  }) {
    return this.request<any>('/sync/operations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
