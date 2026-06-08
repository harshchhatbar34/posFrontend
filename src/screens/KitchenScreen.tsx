import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, Button, LoadingSpinner } from "../components/ui";
import { useOrders, useUpdateOrderStatus, useUpdateItemStatus, useRemoveOrderItem } from "../hooks/useApi";
import { Order, OrderItem } from "../types";
// removed useIsFocused import as it's no longer needed
import { useAuthStore } from "../store/auth-store";
import { toast } from "../utils/toast";
import { Ionicons } from "@expo/vector-icons";

export default function KitchenScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<"active" | "cooked">("active");

  const role = useAuthStore((s) => s.user?.role);
  const allowed = role ? ["SUPER_ADMIN", "ADMIN", "CHEF"].includes(role) : false;

  const { data, isLoading, error, refetch } = useOrders(undefined, { enabled: true });
  const updateStatus = useUpdateOrderStatus();
  const updateItem = useUpdateItemStatus();
  const removeItem = useRemoveOrderItem();
  const [refreshing, setRefreshing] = useState(false);
  
  const orders = React.useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (data?.data && Array.isArray((data.data as any).orders)) return (data.data as any).orders;
    return [];
  }, [data?.data]);

  // Exclude cancelled orders from the list
  const visibleOrders = React.useMemo(() => orders.filter((o: Order) => o.status !== "CANCELLED"), [orders]);

  const activeOrders = React.useMemo(() => {
    return visibleOrders.filter((o: Order) => o.status === "PENDING" || o.status === "IN_PROGRESS");
  }, [visibleOrders]);

  const cookedOrders = React.useMemo(() => {
    return visibleOrders.filter((o: Order) => o.status === "COOKED" || o.status === "SERVED");
  }, [visibleOrders]);

  // Sort orders by creation time (ascending) so the earliest order appears first
  const sortedActiveOrders = React.useMemo(() => {
    return [...activeOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activeOrders]);

  // Sort cooked orders by cooked timestamp (descending, latest cooked first)
  const sortedCookedOrders = React.useMemo(() => {
    return [...cookedOrders].sort((a, b) => {
      const timeA = a.cookedAt ? new Date(a.cookedAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.cookedAt ? new Date(b.cookedAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [cookedOrders]);

  const currentOrders = activeTab === "active" ? sortedActiveOrders : sortedCookedOrders;

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

  // Show toast only when an error occurs (side‑effect)
  // Show toast only once per error occurrence
  const hasShownError = React.useRef(false);
  React.useEffect(() => {
    if (error && !hasShownError.current) {
      toast.error("Failed to load orders", error?.message ?? "Error");
      hasShownError.current = true;
    }
    if (!error) {
      hasShownError.current = false; // reset when error clears
    }
  }, [error]);

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
      {/* Styled Segmented Control Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "active" && styles.tabButtonActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Active Prep ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "cooked" && styles.tabButtonActive]}
          onPress={() => setActiveTab("cooked")}
        >
          <Text style={[styles.tabText, activeTab === "cooked" && styles.tabTextActive]}>
            Cooked & Done ({cookedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md, maxWidth: 800, width: "100%", alignSelf: "center" }}
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
                {order.cookedAt ? (
                  <Text style={styles.cookedTime}>
                    Cooked: {new Date(order.cookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : (
                  <Text style={styles.timer}>{getElapsed(order.createdAt)}</Text>
                )}
              </View>
            </View>
            {order.notes ? (
              <View style={styles.orderNotesBlock}>
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.secondaryDark} style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={styles.orderNotesText} numberOfLines={2}>
                  Order Note: "{order.notes}"
                </Text>
              </View>
            ) : null}
            {order.items?.map((item: OrderItem) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.product?.name} × {item.quantity}</Text>
                  {item.notes ? (
                    <Text style={styles.itemNotes}>Note: {item.notes}</Text>
                  ) : null}
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceLight,
    padding: 4,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 800,
    width: "90%",
    alignSelf: "center",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
  },
  tabButtonActive: {
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  orderCard: { marginBottom: SPACING.md },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm },
  orderTable: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  orderSection: { fontSize: 12, color: COLORS.textSecondary },
  timer: { fontSize: 14, fontWeight: "700", color: COLORS.warning, marginTop: 4 },
  cookedTime: { fontSize: 13, fontWeight: "600", color: COLORS.success, marginTop: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  itemName: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  itemNotes: { fontSize: 12, color: COLORS.primaryDark, marginTop: 2, fontWeight: "500" },
  actionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm },
  actionText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: SPACING.sm },
  orderNotesBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.warning + "12",
    padding: 8,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.warning + "25",
  },
  orderNotesText: {
    fontSize: 12,
    color: COLORS.secondaryDark,
    fontWeight: "600",
    fontStyle: "italic",
    flex: 1,
  },
});
