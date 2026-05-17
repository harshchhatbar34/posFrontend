import React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, Button, LoadingSpinner } from "../components/ui";
import { useOrders, useUpdateOrderStatus, useRecordPayment } from "../hooks/useApi";
import { Order } from "../types";

export default function OrdersScreen({ navigation }: any) {
  const { data, isLoading, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const recordPayment = useRecordPayment();
  const orders = data?.data || [];
  const [refreshing, setRefreshing] = React.useState(false);

  if (isLoading) return <LoadingSpinner />;

  const handleServe = (id: string) => {
    updateStatus.mutate({ id, status: "SERVED" });
  };

  const handlePayment = (id: string) => {
    Alert.alert("Payment Method", "Select payment method", [
      { text: "Cash", onPress: () => recordPayment.mutate({ id, paymentMethod: "CASH" }) },
      { text: "Online", onPress: () => recordPayment.mutate({ id, paymentMethod: "ONLINE" }) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleCancel = (order: Order) => {
    if (order.status !== "PENDING") return;
    Alert.alert("Cancel Order", "Are you sure?", [
      { text: "No", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: () => updateStatus.mutate({ id: order.id, status: "CANCELLED" }) },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
        renderItem={({ item: order }: { item: Order }) => (
          <Card style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.table}>Table #{order.table?.tableNumber} • {order.table?.section?.name}</Text>
                <Text style={styles.time}>{new Date(order.createdAt).toLocaleString()}</Text>
                <Text style={styles.takenBy}>By: {order.takenBy?.name}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={order.status} />
                <Text style={styles.amount}>₹{order.totalAmount}</Text>
                <StatusBadge status={order.paymentStatus} />
              </View>
            </View>
            {/* Items */}
            {order.items?.slice(0, 3).map((item) => (
              <Text key={item.id} style={styles.item}>• {item.product?.name} × {item.quantity} — ₹{item.price * item.quantity}</Text>
            ))}
            {(order.items?.length || 0) > 3 && <Text style={styles.more}>+{(order.items?.length || 0) - 3} more items</Text>}
            {/* Actions */}
            <View style={styles.actions}>
              {order.status === "COMPLETED" && (
                <Button title="Mark Served" onPress={() => handleServe(order.id)} size="sm" variant="secondary" />
              )}
              {order.status === "SERVED" && order.paymentStatus === "UNPAID" && (
                <Button title="Record Payment" onPress={() => handlePayment(order.id)} size="sm" />
              )}
              {order.status === "PENDING" && (
                <Button title="Cancel" onPress={() => handleCancel(order)} size="sm" variant="danger" />
              )}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { marginBottom: SPACING.sm },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm },
  table: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  time: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  takenBy: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: "800", color: COLORS.success, marginVertical: 4 },
  item: { fontSize: 13, color: COLORS.textSecondary, marginLeft: SPACING.sm },
  more: { fontSize: 12, color: COLORS.primary, marginLeft: SPACING.sm, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: SPACING.md },
});
