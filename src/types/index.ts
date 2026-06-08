// ============ TypeScript Types ============

export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CHEF" | "HELPER";
export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COOKED" | "SERVED" | "CANCELLED";
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
  sectionId: string;
  isActive: boolean;
  section?: { id: string; name: string; isActive?: boolean };
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
  cookedAt?: string;
  notes?: string;
  customerName?: string;
  customerNumber?: string;
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
  notes?: string;
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
}

export type PaginatedData<K extends string, T> = {
  [key in K]: T[];
} & {
  meta: PaginationMeta;
};

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
  productId: string;
  productName: string;
  totalQuantity: number;
}

export interface SalesReportItem {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface SalesReportResponse {
  totalSales: number;
  orderCount: number;
  paymentBreakdown: Array<{ method: string; total: number; count: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  sectionWiseSales: Array<{ section: string; orderCount: number; revenue: number }>;
}
