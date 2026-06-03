import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Modal, Alert, Platform } from "react-native";
import { toast } from "../utils/toast";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, Button, LoadingSpinner } from "../components/ui";
import { useOrders, useUpdateOrderStatus, useRecordPayment } from "../hooks/useApi";
import { Order } from "../types";

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
    toast.error("Failed to fetch orders", error.message);
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
      recordPayment.mutate(
        { id: selectedOrderId, paymentMethod: method },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
    setPaymentModalVisible(false);
    setSelectedOrderId(null);
  };

  const handleCancel = (order: Order) => {
    if (order.status !== "PENDING") return;

    const doCancel = () => {
      toast.info("Cancelling order...");
      updateStatus.mutate(
        { id: order.id, status: "CANCELLED" },
        {
          onSuccess: () => {
            toast.success("Order cancelled");
            refetch();
          },
          onError: (err: any) => {
            toast.error("Cancel failed", err?.message || "Error");
          },
        }
      );
    };

    const message = `Are you sure you want to cancel the order for Table #${order.table?.tableNumber}?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        doCancel();
      }
    } else {
      Alert.alert("Confirm Cancel", message, [
        { text: "No", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: doCancel },
      ]);
    }
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
            <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })} activeOpacity={0.7}>
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
            </TouchableOpacity>

            {/* Actions (Separated so clicking actions does not trigger page navigation) */}
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
        )}
      />

      {/* Payment Selection Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade" onRequestClose={() => { setPaymentModalVisible(false); setSelectedOrderId(null); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalSubtitle}>
              Please select how the customer paid for this order:
            </Text>

            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[styles.paymentOptionBtn, { borderColor: COLORS.success }]}
                onPress={() => confirmPayment("CASH")}
              >
                <Text style={styles.paymentOptionEmoji}>💵</Text>
                <Text style={[styles.paymentOptionText, { color: COLORS.success }]}>Cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOptionBtn, { borderColor: COLORS.info }]}
                onPress={() => confirmPayment("ONLINE")}
              >
                <Text style={styles.paymentOptionEmoji}>📱</Text>
                <Text style={[styles.paymentOptionText, { color: COLORS.info }]}>UPI / Online</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setPaymentModalVisible(false);
                setSelectedOrderId(null);
              }}
              fullWidth
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>
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
  
  // Payment Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, width: "100%", maxWidth: 340, elevation: 5, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg, textAlign: "center", lineHeight: 18 },
  paymentOptions: { flexDirection: "row", gap: SPACING.md, justifyContent: "space-between", marginBottom: SPACING.sm },
  paymentOptionBtn: { flex: 1, alignItems: "center", paddingVertical: SPACING.md, borderWidth: 1.5, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.card },
  paymentOptionEmoji: { fontSize: 32, marginBottom: SPACING.xs },
  paymentOptionText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
});
