import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  sectionsApi,
  tablesApi,
  categoriesApi,
  productsApi,
  ordersApi,
  kitchenApi,
  inventoryApi,
  reportsApi,
  usersApi,
} from "../services/endpoints";
import { useAuthStore } from "../store/auth-store";
import { useCartStore } from "../store/cart-store";
import { toast } from "../utils/toast";

// ============ Auth Hooks ============
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email).then((r) => r.data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: Record<string, string>) => authApi.resetPassword(data).then((r) => r.data),
  });
}

// ============ Section Hooks ============
export function useSections(params?: Record<string, any>, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["sections", params],
    queryFn: () => sectionsApi.getAll(params).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useAddSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => sectionsApi.create(data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["sections"] }); toast.success(res.data?.message || "Section created!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create section"),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => sectionsApi.create(data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["sections"] }); toast.success(res.data?.message || "Section created!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create section"),
  });
}

// ============ Table Hooks ============
export function useTables(params?: Record<string, string>, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["tables", params],
    queryFn: () => tablesApi.getAll(params).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableNumber: number; sectionId: string }) => tablesApi.create(data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["tables"] }); toast.success(res.data?.message || "Table created!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create table"),
  });
}

// ============ Category Hooks ============
export function useCategories(params?: Record<string, string>, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesApi.getAll(params).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => categoriesApi.create(data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success(res.data?.message || "Category created!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create category"),
  });
}

// ============ Product Hooks ============
export function useProducts(params?: Record<string, string>, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getAll(params).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => productsApi.create(data as never),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success(res.data?.message || "Product created!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create product"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => productsApi.update(id, data as never),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success(res.data?.message || "Product updated!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update product"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: (res: any) => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success(res?.data?.message || "Product deleted!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to delete product"),
  });
}

// ============ Order Hooks ============
export function useOrders(params?: Record<string, string>, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.getAll(params).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  return useMutation({
    mutationFn: (data: { tableId: string; items: Array<{ productId: string; quantity: number }>; notes?: string }) => ordersApi.create(data),
    onSuccess: (res) => {
      clearCart();
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      toast.success(res.data?.message || "Order placed successfully!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to place order"),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success(res.data?.message || "Order status updated!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update status"),
  });
}

export function useAddOrderItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: Array<{ productId: string; quantity: number }> }) => ordersApi.addItems(id, items),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ["order", vars.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      toast.success(res.data?.message || "Items added to order!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to add items"),
  });
}

export function useRemoveOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) => ordersApi.removeItem(orderId, itemId),
    onSuccess: (res: any, vars) => {
      qc.invalidateQueries({ queryKey: ["order", vars.orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(res?.data?.message || "Item removed!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to remove item"),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.deleteOrder(id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success(res?.data?.message || "Order deleted!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to delete order"),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod: string }) => ordersApi.recordPayment(id, paymentMethod),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success(res.data?.message || "Payment recorded!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to record payment"),
  });
}

export function useUpdateItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) => ordersApi.updateItemStatus(itemId, status),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(res.data?.message || "Item status updated!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update item status"),
  });
}

// ============ Kitchen Hooks ============
export function useKitchenDashboard(sectionId?: string, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["kitchen", sectionId],
    queryFn: () => kitchenApi.getDashboard(sectionId).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useKitchenSummary(sectionId?: string, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["kitchen-summary", sectionId],
    queryFn: () => kitchenApi.getSummary(sectionId).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

// ============ Inventory Hooks ============
export function useInventory(params?: Record<string, string>, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["inventory", params],
    queryFn: () => inventoryApi.getAll(params).then((r) => r.data),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryApi.create(data as never),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast.success(res.data?.message || "Inventory item created!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create item"),
  });
}

export function useAddStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity: number; type: string; cost: number; notes: string } }) => inventoryApi.addStock(id, data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast.success(res.data?.message || "Stock added!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to add stock"),
  });
}

export function useRecordUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantityUsed: number; note?: string } }) => inventoryApi.recordUsage(id, data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast.success(res.data?.message || "Usage recorded!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to record usage"),
  });
}

// ============ Reports Hooks ============
export function useSalesReport(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["reports-sales", params],
    queryFn: () => reportsApi.getSales(params).then((r) => r.data),
  });
}

export function useUsers(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.getAll(params).then((r) => r.data),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.create(data as never),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(res.data?.message || "User created successfully!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create user"),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => usersApi.update(id, data as never),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success(res.data?.message || "User updated!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update user"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(res?.data?.message || "User deleted successfully!");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to delete user"),
  });
}
