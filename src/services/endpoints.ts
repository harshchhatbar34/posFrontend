import api from "./api";
import {
  LoginResponse,
  User,
  Section,
  Table,
  Category,
  Product,
  Order,
  OrderItem,
  InventoryItem,
  KitchenSummaryItem,
  SalesReportItem,
  ApiResponse,
  PaginatedData,
} from "../types";

// ============ Auth API ============
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", { email, password }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      "/auth/refresh",
      { refreshToken }
    ),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ email: string }>>("/auth/forgot-password", { email }),

  resetPassword: (data: Record<string, string>) =>
    api.post<ApiResponse<{ success: boolean }>>("/auth/reset-password", data),
};

// ============ Users API ============
export const usersApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<PaginatedData<"users", User>>>("/users", { params }),

  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: Partial<User> & { password: string }) =>
    api.post<ApiResponse<User>>("/users", data),

  update: (id: string, data: Partial<User> | { action: string }) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),
};

// ============ Sections API ============
export const sectionsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<PaginatedData<"sections", Section>>>("/sections", { params }),

  getById: (id: string) => api.get<ApiResponse<Section>>(`/sections/${id}`),

  create: (data: { name: string }) =>
    api.post<ApiResponse<Section>>("/sections", data),

  update: (id: string, data: Partial<Section>) =>
    api.patch<ApiResponse<Section>>(`/sections/${id}`, data),

  delete: (id: string) => api.delete(`/sections/${id}`),
};

// ============ Tables API ============
export const tablesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<PaginatedData<"tables", Table>>>("/tables", { params }),

  getById: (id: string) => api.get<ApiResponse<Table>>(`/tables/${id}`),

  create: (data: { tableNumber: number; sectionId: string }) =>
    api.post<ApiResponse<Table>>("/tables", data),

  update: (id: string, data: Partial<Table>) =>
    api.patch<ApiResponse<Table>>(`/tables/${id}`, data),

  delete: (id: string) => api.delete(`/tables/${id}`),
};

// ============ Categories API ============
export const categoriesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<PaginatedData<"categories", Category>>>("/categories", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Category>>(`/categories/${id}`),

  create: (data: { name: string }) =>
    api.post<ApiResponse<Category>>("/categories", data),

  update: (id: string, data: Partial<Category>) =>
    api.patch<ApiResponse<Category>>(`/categories/${id}`, data),

  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ============ Products API ============
export const productsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<PaginatedData<"products", Product>>>("/products", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Product>>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    api.post<ApiResponse<Product>>("/products", data),

  update: (id: string, data: Partial<Product>) =>
    api.patch<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),
};

// ============ Orders API ============
export const ordersApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<PaginatedData<"orders", Order>>>("/orders", { params }),

  getById: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  create: (data: {
    tableId: string;
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }) => api.post<ApiResponse<Order>>("/orders", data),

  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),

  recordPayment: (id: string, paymentMethod: string) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/payment`, { paymentMethod }),

  updateItemStatus: (itemId: string, status: string) =>
    api.patch<ApiResponse<OrderItem>>(`/order-items/${itemId}/status`, { status }),

  addItems: (id: string, items: Array<{ productId: string; quantity: number }>) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/items`, { items }),

  removeItem: (orderId: string, itemId: string) =>
    api.delete(`/orders/${orderId}/items/${itemId}`),

  deleteOrder: (id: string) =>
    api.delete(`/orders/${id}`),
};

// ============ Kitchen API ============
export const kitchenApi = {
  getDashboard: (sectionId?: string) =>
    api.get<ApiResponse<Order[]>>("/kitchen", {
      params: sectionId ? { sectionId } : {},
    }),

  getSummary: (sectionId?: string) =>
    api.get<ApiResponse<KitchenSummaryItem[]>>("/kitchen/summary", {
      params: sectionId ? { sectionId } : {},
    }),
};

// ============ Inventory API ============
export const inventoryApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<PaginatedData<"inventory", InventoryItem>>>("/inventory", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<InventoryItem>>(`/inventory/${id}`),

  create: (data: Partial<InventoryItem>) =>
    api.post<ApiResponse<InventoryItem>>("/inventory", data),

  update: (id: string, data: Partial<InventoryItem>) =>
    api.patch<ApiResponse<InventoryItem>>(`/inventory/${id}`, data),

  addStock: (id: string, data: { quantity: number; type: string; cost: number; notes: string }) =>
    api.post<ApiResponse<InventoryItem>>(`/inventory/${id}/stock`, data),

  recordUsage: (id: string, data: { quantityUsed: number; note?: string }) =>
    api.post<ApiResponse<InventoryItem>>(`/inventory/${id}/usage`, data),
};

// ============ Reports API ============
export const reportsApi = {
  getSales: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<SalesReportItem[]>>("/reports/sales", { params }),

  getOrders: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<unknown>>("/reports/orders", { params }),

  getInventory: () =>
    api.get<ApiResponse<unknown>>("/reports/inventory"),
};
