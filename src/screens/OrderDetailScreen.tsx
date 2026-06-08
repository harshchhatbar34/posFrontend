import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, useWindowDimensions } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, LoadingSpinner, EmptyState, Button } from "../components/ui";
import {
  useOrderDetail,
  useUpdateOrderStatus,
  useAddOrderItems,
  useRemoveOrderItem,
  useProducts,
  useCategories,
  useRecordPayment,
  useDeleteOrder,
} from "../hooks/useApi";
import { useAuthStore } from "../store/auth-store";
import { OrderItem, Product } from "../types";
import { Ionicons } from "@expo/vector-icons";

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const { data, isLoading, refetch } = useOrderDetail(orderId);
  const updateStatus = useUpdateOrderStatus();
  const addItems = useAddOrderItems();
  const removeItem = useRemoveOrderItem();
  const recordPayment = useRecordPayment();
  const deleteOrder = useDeleteOrder();
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const order = data?.data;

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  // Fetch products for the order's section when modal opens
  const sectionId = order?.table?.section?.id || order?.table?.sectionId;
  const { data: productsData } = useProducts(
    sectionId ? { 
      sectionId, 
      ...(selectedCategory ? { categoryId: selectedCategory } : {}), 
      isAvailable: "true" 
    } : undefined,
    { enabled: addModalVisible && !!sectionId }
  );
  
  const { data: categoriesData } = useCategories(
    sectionId ? { sectionId } : undefined,
    { enabled: addModalVisible && !!sectionId }
  );
  
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const availableProducts = (Array.isArray(productsData?.data) ? [...productsData.data] : []).sort(
    (a: Product, b: Product) => a.name.localeCompare(b.name)
  );

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <EmptyState title="Order Not Found" />;

  const isPending = order.status === "PENDING";
  const isCancelled = order.status === "CANCELLED";
  const isPaid = order.paymentStatus === "PAID";
  const canModify = isPending && !isPaid;
  const canCancel = (order.status === "PENDING" || order.status === "COOKED") && !isPaid;

  const handleCancel = () => {
    updateStatus.mutate(
      { id: order.id, status: "CANCELLED" },
      { onSuccess: () => { setShowCancelConfirm(false); refetch(); } }
    );
  };

  const handleServe = () => {
    updateStatus.mutate(
      { id: order.id, status: "SERVED" },
      { onSuccess: () => { refetch(); } }
    );
  };

  const handleDeleteOrder = () => {
    deleteOrder.mutate(order.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        navigation.navigate("Dashboard");
      }
    });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem.mutate(
      { orderId: order.id, itemId },
      { onSuccess: () => { setRemoveConfirmId(null); refetch(); } }
    );
  };

  const confirmPayment = (method: string) => {
    recordPayment.mutate(
      { id: order.id, paymentMethod: method },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
    setPaymentModalVisible(false);
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
    <ScrollView style={styles.container} contentContainerStyle={{ maxWidth: 800, width: "100%", alignSelf: "center" }}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Table #{order.table?.tableNumber} • {order.table?.section?.name}
            </Text>
            <Text style={styles.metaText}>{new Date(order.createdAt).toLocaleString()}</Text>
            <Text style={styles.metaText}>By: {order.takenBy?.name}</Text>
            {order.customerName ? (
              <Text style={styles.customerText}>
                Customer: {order.customerName}{order.customerNumber ? ` (${order.customerNumber})` : ""}
              </Text>
            ) : order.customerNumber ? (
              <Text style={styles.customerText}>Customer Phone: {order.customerNumber}</Text>
            ) : null}
            {order.notes ? (
              <View style={styles.notesBlock}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.secondaryDark} style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={styles.notesText}>
                  Special Instructions: "{order.notes}"
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            {order.paymentStatus === "PAID" ? (
              <StatusBadge status="PAID" />
            ) : (
              <>
                <StatusBadge status={order.status} />
                <StatusBadge status={order.paymentStatus} />
              </>
            )}
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

            {/* Serve Button */}
            {order.status === "COOKED" && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleServe} activeOpacity={0.8} disabled={updateStatus.isPending}>
                <Ionicons name="checkmark-done-circle-outline" size={22} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.actionTitle, { color: COLORS.primary }]}>Serve</Text>
                  <Text style={styles.actionSub}>Deliver the COOKED dishes to the table</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Pay Button */}
            {order.status === "SERVED" && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setPaymentModalVisible(true)} activeOpacity={0.8}>
                <Ionicons name="card-outline" size={22} color={COLORS.success} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.actionTitle, { color: COLORS.success }]}>Pay</Text>
                  <Text style={styles.actionSub}>Record cash or UPI payment</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Delete Order Button (Admin only, when order is done) */}
            {isAdmin && (order.status === "COOKED" || order.status === "SERVED") && !showDeleteConfirm && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => setShowDeleteConfirm(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.actionTitle, { color: COLORS.danger }]}>Delete Order</Text>
                  <Text style={styles.actionSub}>Irreversibly delete this order from the system</Text>
                </View>
              </TouchableOpacity>
            )}

            {showDeleteConfirm && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>Are you sure you want to permanently delete this order?</Text>
                <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
                  <Button
                    title="Yes, Delete"
                    variant="danger"
                    onPress={handleDeleteOrder}
                    style={{ flex: 1 }}
                    loading={deleteOrder.isPending}
                  />
                  <Button title="Go Back" variant="outline" onPress={() => setShowDeleteConfirm(false)} style={{ flex: 1 }} />
                </View>
              </View>
            )}

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
            {canCancel && !showCancelConfirm && (
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
          </>
        )}
      </Card>

      {/* Add Items Modal */}
      <Modal visible={addModalVisible} transparent animationType={isTablet ? "fade" : "slide"}>
        <View style={[styles.modalOverlay, isTablet && styles.modalOverlayTablet]}>
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
              <Text style={styles.modalTitle}>Add Items to Order</Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setSelectedProducts({}); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <View style={{ marginBottom: SPACING.sm }}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: undefined, name: "All" }, ...categories]}
                keyExtractor={(item) => item.id || "all"}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.catChip, selectedCategory === item.id && styles.catChipActive]}
                    onPress={() => setSelectedCategory(item.id)}
                  >
                    <Text style={[styles.catText, selectedCategory === item.id && styles.catTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
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

      {/* Payment Selection Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.payModalOverlay}>
          <View style={styles.payModalContent}>
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
              onPress={() => setPaymentModalVisible(false)}
              fullWidth
              style={{ marginTop: SPACING.md }}
            />
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
  customerText: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 4 },
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
  modalOverlayTablet: {
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xxl },
  modalContentTablet: {
    width: "100%",
    maxWidth: 480,
    borderRadius: BORDER_RADIUS.lg,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingBottom: SPACING.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg, textAlign: "center", lineHeight: 18 },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  productName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  productPrice: { fontSize: 13, color: COLORS.success, marginTop: 2, fontWeight: "700" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm, padding: 6, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 16, fontWeight: "800", color: COLORS.text, minWidth: 24, textAlign: "center" },
  
  // Payment Modal Specific styles
  payModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  payModalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, width: "100%", maxWidth: 340, elevation: 5, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  paymentOptions: { flexDirection: "row", gap: SPACING.md, justifyContent: "space-between", marginBottom: SPACING.sm },
  paymentOptionBtn: { flex: 1, alignItems: "center", paddingVertical: SPACING.md, borderWidth: 1.5, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.card },
  paymentOptionEmoji: { fontSize: 32, marginBottom: SPACING.xs },
  paymentOptionText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surfaceLight, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  catTextActive: { color: COLORS.white },
  notesBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.warning + "12",
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.warning + "30",
  },
  notesText: {
    fontSize: 13,
    color: COLORS.secondaryDark,
    fontWeight: "600",
    fontStyle: "italic",
    flex: 1,
  },
});
