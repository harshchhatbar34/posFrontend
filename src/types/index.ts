// ============ TypeScript Types ============

export type Role = "SUPER_ADMIN" | "ADMIN" | "CHEF" | "HELPER";
export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SERVED" | "CANCELLED";
export type OrderItemStatus = "PENDING" | "UNDER_COOK" | "COOKED";
export type PaymentMethod = "CASH" | "ONLINE";
export type PaymentStatus = "UNPAID" | "PAID";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface Section {
  id: string;
  name: string;
  isActive: boolean;
  _count?: {
    tables: number;
    products: number;
  };
}

export interface Table {
  id: string;
  tableNumber: number;
  sectionId: string;
  status: TableStatus;
  section?: { id: string; name: string };
  orders?: Order[];
}

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  sectionId: string;
  isAvailable: boolean;
  image?: string;
  category?: { id: string; name: string };
  section?: { id: string; name: string };
}

export interface Order {
  id: string;
  tableId: string;
  status: OrderStatus;
  takenById: string;
  chefId?: string;
  servedById?: string;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  table?: Table & { section?: { id: string; name: string } };
  takenBy?: { id: string; name: string };
  chef?: { id: string; name: string };
  servedBy?: { id: string; name: string };
  items?: OrderItem[];
  _count?: { items: number };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  status: OrderItemStatus;
  product?: Product;
}

export interface OrderLog {
  id: string;
  orderId: string;
  action: string;
  details?: string;
  userId: string;
  user?: { id: string; name: string };
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location?: string;
  pricePerUnit: number;
  minStock: number;
  totalPrice?: number;
  isLowStock?: boolean;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface KitchenSummaryItem {
  name: string;
  price: number;
  quantity: number;
  totalAmount: number;
}

export interface KitchenData {
  orders: Order[];
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
    todayOrders: number;
  };
}

export interface SalesReport {
  totalSales: number;
  orderCount: number;
  paymentBreakdown: Array<{
    method: PaymentMethod;
    total: number;
    count: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  sectionWiseSales: Array<{
    section: string;
    orderCount: number;
    revenue: number;
  }>;
}
