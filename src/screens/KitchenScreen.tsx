import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, Button, LoadingSpinner } from "../components/ui";
import { useOrders, useUpdateOrderStatus, useUpdateItemStatus, useRemoveOrderItem } from "../hooks/useApi";
import { Order, OrderItem } from "../types";
// removed useIsFocused import as it's no longer needed
import { useAuthStore } from "../store/auth-store";
import { toast } from "../utils/toast";

export default function KitchenScreen({ navigation }: any) {

  const role = useAuthStore((s) => s.user?.role);
  const allowed = ["SUPER_ADMIN", "ADMIN", "CHEF"].includes(role);

  const { data, isLoading, error, refetch } = useOrders(undefined, { enabled: true });
  const updateStatus = useUpdateOrderStatus();
  const updateItem = useUpdateItemStatus();
  const removeItem = useRemoveOrderItem();
  const [refreshing, setRefreshing] = useState(false);
  const orders = React.useMemo(() => data?.data ?? [], [data?.data]);
  // Exclude cancelled orders from the list
  const visibleOrders = React.useMemo(() => orders.filter((o) => o.status !== "CANCELLED"), [orders]);
  // Sort orders by creation time (ascending) so the earliest order appears first
  const sortedOrders = React.useMemo(() => {
    return [...visibleOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [visibleOrders]);
  const [now, setNow] = useState(Date.now());

  // Update clock every second but only when the second value changes to avoid unnecessary renders
  useEffect(() => {
    const timer = setInterval(() => {
      const newNow = Date.now();
      if (Math.floor(newNow / 1000) !== Math.floor(now / 1000)) {
        setNow(newNow);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [now]);

  if (!allowed) {
    return (
      <View style={styles.container}>
        <Text style={{ color: COLORS.text, textAlign: "center", marginTop: 20 }}>
          Access denied. Kitchen view is for admin, super admin and chef only.
        </Text>
      </View>
    );
  }

  if (isLoading) return <LoadingSpinner />;
  // Show toast only when an error occurs (side‑effect)
  // Show toast only once per error occurrence
  const hasShownError = React.useRef(false);
  React.useEffect(() => {
    if (error && !hasShownError.current) {
      toast.show({ type: "error", text1: "Failed to load orders", text2: error?.message ?? "Error" });
      hasShownError.current = true;
    }
    if (!error) {
      hasShownError.current = false; // reset when error clears
    }
  }, [error]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: COLORS.text, textAlign: "center", marginTop: 20 }}>Unable to load orders.</Text>
      </View>
    );
  }

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((now - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getNextStatus = (status: string) => {
    if (status === "PENDING") return "UNDER_COOK";
    if (status === "UNDER_COOK") return "COOKED";
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
        renderItem={({ item: order }: { item: Order }) => (
          <Card style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderTable}>Table #{order.table?.tableNumber}</Text>
                <Text style={styles.orderSection}>{order.table?.section?.name}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={order.status} />
                <Text style={styles.timer}>{getElapsed(order.createdAt)}</Text>
              </View>
            </View>
            {order.items?.map((item: OrderItem) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.product?.name} × {item.quantity}</Text>
                </View>
                <StatusBadge status={item.status} />
                {getNextStatus(item.status) && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => updateItem.mutate({ itemId: item.id, status: getNextStatus(item.status)! })}
                  >
                    <Text style={styles.actionText}>{item.status === "PENDING" ? "Start" : "Done"}</Text>
                  </TouchableOpacity>
                )}
                {/* Remove item button disabled on Kitchen page */}
              </View>
            ))}
            <View style={styles.actionsRow}>
                {/* Cancel button removed from kitchen view */}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orderCard: { marginBottom: SPACING.md },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm },
  orderTable: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  orderSection: { fontSize: 12, color: COLORS.textSecondary },
  timer: { fontSize: 14, fontWeight: "700", color: COLORS.warning, marginTop: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  itemName: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  actionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm },
  actionText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: SPACING.sm },
});
