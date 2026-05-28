import type {
  ApiResponse,
  AdminLoginResponse,
  StoreSetting,
  StoreSettingForm,
  Category,
  CategoryForm,
  Banner,
  BannerForm,
  Product,
  ProductForm,
  ProductFilters,
  Order,
  OrderForm,
  OrderItem,
  StockMovement,
  StockMovementForm,
  FinanceRecord,
  FinanceRecordForm,
  FinanceSummary,
  DashboardStats,
  StoreStatus,
  PaginatedResponse,
  Favorite,
} from './types';

// ============================================================
// Generic Fetch Helper
// ============================================================

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${res.status}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

function authHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return { 'x-admin-token': token };
}

// ============================================================
// Admin Auth
// ============================================================

export const adminAuth = {
  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<AdminLoginResponse>> => {
    return apiFetch<AdminLoginResponse>('/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

// ============================================================
// Store Settings
// ============================================================

export const storeSettings = {
  get: async (): Promise<ApiResponse<StoreSetting>> => {
    return apiFetch<StoreSetting>('/api/admin/settings');
  },

  update: async (
    data: StoreSettingForm,
    token: string | null
  ): Promise<ApiResponse<StoreSetting>> => {
    return apiFetch<StoreSetting>('/api/admin/settings', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// Banners
// ============================================================

export const banners = {
  getPublic: async (): Promise<ApiResponse<Banner[]>> => {
    return apiFetch<Banner[]>('/api/banners');
  },

  getAll: async (token: string | null): Promise<ApiResponse<Banner[]>> => {
    return apiFetch<Banner[]>('/api/admin/banners', {
      headers: authHeaders(token),
    });
  },

  create: async (
    data: BannerForm,
    token: string | null
  ): Promise<ApiResponse<Banner>> => {
    return apiFetch<Banner>('/api/admin/banners', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<BannerForm>,
    token: string | null
  ): Promise<ApiResponse<Banner>> => {
    return apiFetch<Banner>('/api/admin/banners', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ id, ...data }),
    });
  },

  delete: async (
    id: string,
    token: string | null
  ): Promise<ApiResponse> => {
    return apiFetch(`/api/admin/banners?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },
};

// ============================================================
// Categories
// ============================================================

export const categories = {
  getPublic: async (): Promise<ApiResponse<Category[]>> => {
    return apiFetch<Category[]>('/api/categories');
  },

  getAll: async (token: string | null): Promise<ApiResponse<Category[]>> => {
    return apiFetch<Category[]>('/api/admin/categories', {
      headers: authHeaders(token),
    });
  },

  create: async (
    data: CategoryForm,
    token: string | null
  ): Promise<ApiResponse<Category>> => {
    return apiFetch<Category>('/api/admin/categories', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<CategoryForm>,
    token: string | null
  ): Promise<ApiResponse<Category>> => {
    return apiFetch<Category>('/api/admin/categories', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ id, ...data }),
    });
  },

  delete: async (
    id: string,
    token: string | null
  ): Promise<ApiResponse> => {
    return apiFetch(`/api/admin/categories?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },
};

// ============================================================
// Products
// ============================================================

export const products = {
  getPublic: async (
    filters?: ProductFilters
  ): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.set('search', filters.search);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.sortBy) params.set('sort', filters.sortBy);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('limit', String(filters.pageSize));
    }
    const query = params.toString();
    const url = `/api/products${query ? `?${query}` : ''}`;
    return apiFetch<PaginatedResponse<Product>>(url);
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    return apiFetch<Product>(`/api/products/${id}`);
  },

  getAll: async (
    token: string | null,
    search?: string
  ): Promise<ApiResponse<Product[]>> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const query = params.toString();
    const url = `/api/admin/products${query ? `?${query}` : ''}`;
    return apiFetch<Product[]>(url, {
      headers: authHeaders(token),
    });
  },

  create: async (
    data: ProductForm,
    token: string | null
  ): Promise<ApiResponse<Product>> => {
    return apiFetch<Product>('/api/admin/products', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<ProductForm>,
    token: string | null
  ): Promise<ApiResponse<Product>> => {
    return apiFetch<Product>('/api/admin/products', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ id, ...data }),
    });
  },

  delete: async (
    id: string,
    token: string | null
  ): Promise<ApiResponse> => {
    return apiFetch(`/api/admin/products?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },
};

// ============================================================
// Orders
// ============================================================

export const orders = {
  create: async (data: OrderForm): Promise<ApiResponse<Order>> => {
    return apiFetch<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (
    token: string | null,
    status?: string
  ): Promise<ApiResponse<Order[]>> => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const query = params.toString();
    const url = `/api/admin/orders${query ? `?${query}` : ''}`;
    return apiFetch<Order[]>(url, {
      headers: authHeaders(token),
    });
  },

  updateStatus: async (
    id: string,
    status: string,
    token: string | null
  ): Promise<ApiResponse<Order>> => {
    return apiFetch<Order>('/api/admin/orders', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ id, status }),
    });
  },
};

// ============================================================
// Stock
// ============================================================

export const stock = {
  getMovements: async (
    token: string | null,
    productId?: string
  ): Promise<ApiResponse<StockMovement[]>> => {
    const params = new URLSearchParams();
    if (productId) params.set('productId', productId);
    const query = params.toString();
    const url = `/api/admin/stock${query ? `?${query}` : ''}`;
    return apiFetch<StockMovement[]>(url, {
      headers: authHeaders(token),
    });
  },

  createMovement: async (
    data: StockMovementForm,
    token: string | null
  ): Promise<ApiResponse<StockMovement>> => {
    return apiFetch<StockMovement>('/api/admin/stock', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// Finance
// ============================================================

export const finance = {
  getRecords: async (
    token: string | null,
    params?: { type?: string; startDate?: string; endDate?: string }
  ): Promise<ApiResponse<FinanceRecord[]>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.type) searchParams.set('type', params.type);
      if (params.startDate) searchParams.set('startDate', params.startDate);
      if (params.endDate) searchParams.set('endDate', params.endDate);
    }
    const query = searchParams.toString();
    const url = `/api/admin/finance${query ? `?${query}` : ''}`;
    return apiFetch<FinanceRecord[]>(url, {
      headers: authHeaders(token),
    });
  },

  createRecord: async (
    data: FinanceRecordForm,
    token: string | null
  ): Promise<ApiResponse<FinanceRecord>> => {
    return apiFetch<FinanceRecord>('/api/admin/finance', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  },

  getSummary: async (
    token: string | null,
    params?: { startDate?: string; endDate?: string }
  ): Promise<ApiResponse<FinanceSummary>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.startDate) searchParams.set('startDate', params.startDate);
      if (params.endDate) searchParams.set('endDate', params.endDate);
    }
    const query = searchParams.toString();
    const url = `/api/admin/finance/summary${query ? `?${query}` : ''}`;
    return apiFetch<FinanceSummary>(url, {
      headers: authHeaders(token),
    });
  },
};

// ============================================================
// Upload
// ============================================================

export const upload = {
  uploadFile: async (
    file: File,
    token: string | null
  ): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...authHeaders(token),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `Upload failed with status ${res.status}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  },
};

// ============================================================
// Dashboard
// ============================================================

export const dashboard = {
  getStats: async (
    token: string | null
  ): Promise<ApiResponse<DashboardStats>> => {
    return apiFetch<DashboardStats>('/api/admin/dashboard', {
      headers: authHeaders(token),
    });
  },
};

// ============================================================
// Favorites
// ============================================================

export const favorites = {
  get: async (sessionId: string): Promise<ApiResponse<Favorite[]>> => {
    return apiFetch<Favorite[]>(`/api/favorites?sessionId=${sessionId}`);
  },

  add: async (
    productId: string,
    sessionId: string
  ): Promise<ApiResponse<Favorite>> => {
    return apiFetch<Favorite>('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ productId, sessionId }),
    });
  },

  remove: async (
    productId: string,
    sessionId: string
  ): Promise<ApiResponse> => {
    return apiFetch(`/api/favorites?productId=${productId}&sessionId=${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// Store Status
// ============================================================

export const storeStatusApi = {
  get: async (): Promise<ApiResponse<StoreStatus>> => {
    return apiFetch<StoreStatus>('/api/store/status');
  },
};
