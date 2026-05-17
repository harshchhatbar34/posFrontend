import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Button, Card, Input } from "../components/ui";
import { useCartStore } from "../store/cart-store";
import { useCreateOrder } from "../hooks/useApi";
import { Ionicons } from "@expo/vector-icons";

export default function CartScreen({ navigation }: any) {
  const { items, tableId, notes, updateQuantity, removeItem, setNotes, getTotal, clearCart } = useCartStore();
  const createOrder = useCreateOrder();

  const handlePlaceOrder = () => {
    if (!tableId || items.length === 0) return;
    createOrder.mutate(
      {
        tableId,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        notes: notes || undefined,
      },
      { onSuccess: () => navigation.navigate("Dashboard") }
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={{ padding: SPACING.md }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>₹{item.product.price} each</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                  <Ionicons name="remove" size={18} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>₹{item.product.price * item.quantity}</Text>
              <TouchableOpacity onPress={() => removeItem(item.product.id)} style={{ marginLeft: 8 }}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={{ marginTop: SPACING.md }}>
              <Input label="Order Notes" value={notes} onChangeText={setNotes} placeholder="Special instructions..." multiline />
            </View>
          ) : null
        }
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{getTotal()}</Text>
          </View>
          <Button title="Place Order" onPress={handlePlaceOrder} loading={createOrder.isPending} fullWidth size="lg" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyText: { color: COLORS.textMuted, fontSize: 16, marginTop: SPACING.md },
  itemCard: { marginBottom: SPACING.sm },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  itemPrice: { fontSize: 12, color: COLORS.textSecondary },
  qtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, marginHorizontal: SPACING.sm },
  qtyBtn: { padding: 8 },
  qtyText: { fontSize: 15, fontWeight: "700", color: COLORS.text, minWidth: 24, textAlign: "center" },
  itemTotal: { fontSize: 15, fontWeight: "700", color: COLORS.success, minWidth: 60, textAlign: "right" },
  footer: { padding: SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.md },
  totalLabel: { fontSize: 16, color: COLORS.textSecondary },
  totalAmount: { fontSize: 22, fontWeight: "800", color: COLORS.success },
});
