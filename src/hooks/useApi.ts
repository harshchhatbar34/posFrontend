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
import { Alert } from "react-native";

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
export function useSections(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["sections", params],
    queryFn: () => sectionsApi.getAll(params).then((r) => r.data),
    refetchInterval: 10000,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => sectionsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });
}

// ============ Table Hooks ============
export function useTables(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["tables", params],
    queryFn: () => tablesApi.getAll(params).then((r) => r.data),
    refetchInterval: 10000,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableNumber: number; sectionId: string }) =>
      tablesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

// ============ Category Hooks ============
export function useCategories(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesApi.getAll(params).then((r) => r.data),
    refetchInterval: 10000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => categoriesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ============ Product Hooks ============
export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getAll(params).then((r) => r.data),
    refetchInterval: 10000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => productsApi.create(data as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ============ Order Hooks ============
export function useOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.getAll(params).then((r) => r.data),
    refetchInterval: 10000, // Auto-refetch every 10s
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
    mutationFn: (data: {
      tableId: string;
      items: Array<{ productId: string; quantity: number }>;
      notes?: string;
    }) => ordersApi.create(data),
    onSuccess: () => {
      clearCart();
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      Alert.alert("Success", "Order created successfully!");
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      paymentMethod,
    }: {
      id: string;
      paymentMethod: string;
    }) => ordersApi.recordPayment(id, paymentMethod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      Alert.alert("Success", "Payment recorded!");
    },
  });
}

export function useUpdateItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) =>
      ordersApi.updateItemStatus(itemId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ============ Kitchen Hooks ============
export function useKitchenDashboard(sectionId?: string) {
  return useQuery({
    queryKey: ["kitchen", sectionId],
    queryFn: () => kitchenApi.getDashboard(sectionId).then((r) => r.data),
    refetchInterval: 10000,
  });
}

export function useKitchenSummary(sectionId?: string) {
  return useQuery({
    queryKey: ["kitchen-summary", sectionId],
    queryFn: () => kitchenApi.getSummary(sectionId).then((r) => r.data),
    refetchInterval: 10000,
  });
}

// ============ Inventory Hooks ============
export function useInventory(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["inventory", params],
    queryFn: () => inventoryApi.getAll(params).then((r) => r.data),
    refetchInterval: 10000,
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryApi.create(data as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useAddStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { quantity: number; type: string; cost: number; notes: string };
    }) => inventoryApi.addStock(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useRecordUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { quantityUsed: number; note?: string };
    }) => inventoryApi.recordUsage(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      Alert.alert("Success", "User account registered! Welcome onboarding email has been sent successfully.");
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      usersApi.update(id, data as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      const message = res?.data?.message || "User deleted successfully";
      Alert.alert("User Management", message);
    },
  });
}
