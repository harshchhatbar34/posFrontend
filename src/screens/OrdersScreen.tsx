import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Modal } from "react-native";
import { toast } from "../utils/toast";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, Button, LoadingSpinner } from "../components/ui";
import { useOrders, useUpdateOrderStatus, useRecordPayment } from "../hooks/useApi";
import { Order } from "../types";
// removed useIsFocused import

export default function OrdersScreen({ navigation }: any) {
  const { data, isLoading, error, refetch } = useOrders(undefined, { enabled: true });
  const updateStatus = useUpdateOrderStatus();
  const recordPayment = useRecordPayment();

  const orders = Array.isArray(data?.data) ? data.data : [];
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (error) {
    toast.show({ type: "error", text1: "Failed to fetch orders", text2: error.message });
    return (
      <View style={styles.container}>
        <Text style={{ color: COLORS.text, textAlign: "center", marginTop: 20 }}>Unable to load orders.</Text>
      </View>
    );
  }

  const handleServe = (id: string) => {
    updateStatus.mutate({ id, status: "SERVED" });
  };

  const handlePayment = (id: string) => {
    setSelectedOrderId(id);
    setPaymentModalVisible(true);
  };
  const confirmPayment = (method: string) => {
    if (selectedOrderId) {
      recordPayment.mutate({ id: selectedOrderId, paymentMethod: method });
    }
    setPaymentModalVisible(false);
    setSelectedOrderId(null);
  };

  const handleCancel = (order: Order) => {
    if (order.status !== "PENDING") return;
    toast.show({ type: "info", text1: "Cancelling order..." });
    updateStatus.mutate(
      { id: order.id, status: "CANCELLED" },
      {
        onSuccess: () => {
          toast.show({ type: "success", text1: "Order cancelled" });
          refetch();
        },
        onError: (err: any) => {
          toast.show({ type: "error", text1: "Cancel failed", text2: err?.message || "Error" });
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
        renderItem={({ item: order }: { item: Order }) => (
          <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}>
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
                  <Button title="Mark Paid" onPress={() => handlePayment(order.id)} size="sm" />
                )}
                {order.status === "PENDING" && (
                  <Button title="Cancel" onPress={() => handleCancel(order)} size="sm" variant="danger" />
                )}
              </View>
            </Card>
          </TouchableOpacity>
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
