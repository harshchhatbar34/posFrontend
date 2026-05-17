import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, Button, LoadingSpinner } from "../components/ui";
import { useKitchenDashboard, useKitchenSummary, useUpdateItemStatus } from "../hooks/useApi";
import { Order, OrderItem } from "../types";

export default function KitchenScreen() {
  const { data, isLoading, refetch } = useKitchenDashboard();
  const { data: summaryData } = useKitchenSummary();
  const updateItem = useUpdateItemStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Timer update every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) return <LoadingSpinner />;

  const orders = data?.data?.orders || [];
  const stats = data?.data?.stats;
  const summary = summaryData?.data || [];

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
      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: COLORS.statusPending + "20" }]}>
            <Text style={[styles.statNum, { color: COLORS.statusPending }]}>{stats.pending}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: COLORS.statusInProgress + "20" }]}>
            <Text style={[styles.statNum, { color: COLORS.statusInProgress }]}>{stats.inProgress}</Text>
            <Text style={styles.statLbl}>Cooking</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: COLORS.success + "20" }]}>
            <Text style={[styles.statNum, { color: COLORS.success }]}>{stats.completed}</Text>
            <Text style={styles.statLbl}>Done</Text>
          </View>
        </View>
      )}

      {/* Summary */}
      {summary.length > 0 && (
        <View style={styles.summaryRow}>
          {summary.slice(0, 5).map((s: any, i: number) => (
            <View key={i} style={styles.summaryChip}>
              <Text style={styles.summaryName}>{s.name}</Text>
              <Text style={styles.summaryQty}>×{s.quantity}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Orders */}
      <FlatList
        data={orders}
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
                    <Text style={styles.actionText}>
                      {item.status === "PENDING" ? "Start" : "Done"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsRow: { flexDirection: "row", padding: SPACING.md, gap: SPACING.sm },
  stat: { flex: 1, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLbl: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: SPACING.md, gap: 6, marginBottom: SPACING.sm },
  summaryChip: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  summaryName: { fontSize: 12, color: COLORS.text, fontWeight: "600" },
  summaryQty: { fontSize: 12, color: COLORS.primary, fontWeight: "800", marginLeft: 4 },
  orderCard: { marginBottom: SPACING.md },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm },
  orderTable: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  orderSection: { fontSize: 12, color: COLORS.textSecondary },
  timer: { fontSize: 14, fontWeight: "700", color: COLORS.warning, marginTop: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  itemName: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  actionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm },
  actionText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
});
