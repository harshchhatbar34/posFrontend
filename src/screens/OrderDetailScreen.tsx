import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, LoadingSpinner, EmptyState, Button } from "../components/ui";
import {
  useOrderDetail,
  useUpdateOrderStatus,
  useAddOrderItems,
  useRemoveOrderItem,
  useDeleteOrder,
  useProducts,
} from "../hooks/useApi";
import { OrderItem, Product } from "../types";
import { Ionicons } from "@expo/vector-icons";

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { data, isLoading, refetch } = useOrderDetail(orderId);
  const updateStatus = useUpdateOrderStatus();
  const addItems = useAddOrderItems();
  const removeItem = useRemoveOrderItem();
  const deleteOrder = useDeleteOrder();

  const order = data?.data;

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  // Fetch products for the order's section when modal opens
  const sectionId = order?.table?.section?.id || order?.table?.sectionId;
  const { data: productsData } = useProducts(
    { sectionId, isAvailable: "true" },
    { enabled: addModalVisible && !!sectionId }
  );
  const availableProducts = (Array.isArray(productsData?.data) ? [...productsData.data] : []).sort(
    (a: Product, b: Product) => a.name.localeCompare(b.name)
  );

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <EmptyState title="Order Not Found" />;

  const isPending = order.status === "PENDING";
  const isCancelled = order.status === "CANCELLED";
  const isPaid = order.paymentStatus === "PAID";
  const canModify = isPending && !isPaid;

  const handleCancel = () => {
    updateStatus.mutate(
      { id: order.id, status: "CANCELLED" },
      { onSuccess: () => { setShowCancelConfirm(false); refetch(); } }
    );
  };

  const handleDelete = () => {
    deleteOrder.mutate(order.id, {
      onSuccess: () => navigation.goBack(),
    });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem.mutate(
      { orderId: order.id, itemId },
      { onSuccess: () => { setRemoveConfirmId(null); refetch(); } }
    );
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const current = prev[productId] || 0;
      if (current === 0) return { ...prev, [productId]: 1 };
      return { ...prev, [productId]: current + 1 };
    });
  };

  const decrementProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const handleAddItems = () => {
    const items = Object.entries(selectedProducts)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;
    addItems.mutate(
      { id: order.id, items },
      {
        onSuccess: () => {
          setAddModalVisible(false);
          setSelectedProducts({});
          refetch();
        },
      }
    );
  };

  const totalSelected = Object.values(selectedProducts).reduce((a, b) => a + b, 0);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Table #{order.table?.tableNumber} • {order.table?.section?.name}
            </Text>
            <Text style={styles.metaText}>{new Date(order.createdAt).toLocaleString()}</Text>
            <Text style={styles.metaText}>By: {order.takenBy?.name}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <Text style={styles.sectionTitle}>Items Ordered</Text>
        {order.items?.map((item: OrderItem, index: number) => {
          const canRemove = item.status === "PENDING" && canModify;
          return (
            <View key={item.id || index} style={styles.itemBlock}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.quantity}x {item.product?.name}</Text>
                  {item.notes ? <Text style={styles.itemNotes}>Note: {item.notes}</Text> : null}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  <StatusBadge status={item.status} />
                </View>
              </View>
              {/* Remove item inline confirm */}
              {canRemove && (
                removeConfirmId === item.id ? (
                  <View style={styles.inlineConfirm}>
                    <Text style={{ fontSize: 12, color: COLORS.danger, fontWeight: "600", flex: 1 }}>Remove this item?</Text>
                    <Button title="Yes" onPress={() => handleRemoveItem(item.id)} size="sm" variant="danger" loading={removeItem.isPending} />
                    <Button title="No" onPress={() => setRemoveConfirmId(null)} size="sm" variant="outline" />
                  </View>
                ) : (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => setRemoveConfirmId(item.id)}>
                    <Ionicons name="trash-outline" size={13} color={COLORS.danger} />
                    <Text style={{ fontSize: 12, color: COLORS.danger, marginLeft: 4, fontWeight: "600" }}>Remove</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          );
        })}

        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
        </View>

        {isPaid && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={[styles.statusRowText, { color: COLORS.success }]}>Paid via {order.paymentMethod}</Text>
          </View>
        )}

        {isCancelled && (
          <View style={[styles.statusRow, { backgroundColor: COLORS.danger + "15" }]}>
            <Ionicons name="close-circle" size={18} color={COLORS.danger} />
            <Text style={[styles.statusRowText, { color: COLORS.danger }]}>This order has been cancelled</Text>
          </View>
        )}

        {/* Actions */}
        {!isCancelled && !isPaid && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Actions</Text>

            {/* Add More Items */}
            {canModify && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setAddModalVisible(true)} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.actionTitle}>Add Items to Order</Text>
                  <Text style={styles.actionSub}>Pick more items from the menu</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Cancel Order */}
            {canModify && !showCancelConfirm && !showDeleteConfirm && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => setShowCancelConfirm(true)} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.actionTitle, { color: COLORS.danger }]}>Cancel Order</Text>
                  <Text style={styles.actionSub}>Frees the table, keeps the record</Text>
                </View>
              </TouchableOpacity>
            )}

            {showCancelConfirm && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>Are you sure you want to cancel this order?</Text>
                <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
                  <Button title="Yes, Cancel" variant="danger" onPress={handleCancel} style={{ flex: 1 }} loading={updateStatus.isPending} />
                  <Button title="Go Back" variant="outline" onPress={() => setShowCancelConfirm(false)} style={{ flex: 1 }} />
                </View>
              </View>
            )}

            {/* Delete Order */}
            {!showDeleteConfirm && !showCancelConfirm && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => setShowDeleteConfirm(true)} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.actionTitle, { color: COLORS.danger }]}>Delete Order</Text>
                  <Text style={styles.actionSub}>Permanently removes this order and all its items</Text>
                </View>
              </TouchableOpacity>
            )}

            {showDeleteConfirm && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>⚠️ Permanently delete this entire order?</Text>
                <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
                  <Button title="Yes, Delete" variant="danger" onPress={handleDelete} style={{ flex: 1 }} loading={deleteOrder.isPending} />
                  <Button title="Go Back" variant="outline" onPress={() => setShowDeleteConfirm(false)} style={{ flex: 1 }} />
                </View>
              </View>
            )}
          </>
        )}
      </Card>

      {/* Add Items Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
              <Text style={styles.modalTitle}>Add Items to Order</Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setSelectedProducts({}); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableProducts}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }: { item: Product }) => {
                const qty = selectedProducts[item.id] || 0;
                return (
                  <View style={styles.productRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>₹{item.price}</Text>
                    </View>
                    <View style={styles.qtyControl}>
                      {qty > 0 ? (
                        <>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementProduct(item.id)}>
                            <Ionicons name="remove" size={16} color={COLORS.white} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{qty}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => toggleProduct(item.id)}>
                            <Ionicons name="add" size={16} color={COLORS.white} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity style={[styles.qtyBtn, { paddingHorizontal: 16 }]} onPress={() => toggleProduct(item.id)}>
                          <Ionicons name="add" size={16} color={COLORS.white} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />

            <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => { setAddModalVisible(false); setSelectedProducts({}); }}
                style={{ flex: 1 }}
              />
              <Button
                title={totalSelected > 0 ? `Add ${totalSelected} Item${totalSelected > 1 ? "s" : ""}` : "Add Items"}
                onPress={handleAddItems}
                style={{ flex: 1 }}
                disabled={totalSelected === 0}
                loading={addItems.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  card: { padding: SPACING.lg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.sm },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.md },
  itemBlock: { marginBottom: SPACING.md },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  itemName: { fontSize: 15, fontWeight: "500", color: COLORS.text },
  itemNotes: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  removeBtn: { flexDirection: "row", alignItems: "center", marginTop: 6, alignSelf: "flex-start" },
  inlineConfirm: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: 8, backgroundColor: COLORS.danger + "10", padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  totalValue: { fontSize: 22, fontWeight: "800", color: COLORS.success },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.md, padding: SPACING.sm, backgroundColor: COLORS.success + "20", borderRadius: BORDER_RADIUS.sm },
  statusRowText: { fontWeight: "600", fontSize: 14 },
  actionBtn: { flexDirection: "row", alignItems: "center", padding: SPACING.md, backgroundColor: COLORS.primary + "10", borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary + "30" },
  actionBtnDanger: { backgroundColor: COLORS.danger + "10", borderColor: COLORS.danger + "30" },
  actionTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  actionSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  confirmBox: { backgroundColor: COLORS.danger + "10", borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.danger + "40", marginBottom: SPACING.sm },
  confirmText: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xxl },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  productName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  productPrice: { fontSize: 13, color: COLORS.success, marginTop: 2, fontWeight: "700" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm, padding: 6, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 16, fontWeight: "800", color: COLORS.text, minWidth: 24, textAlign: "center" },
});
