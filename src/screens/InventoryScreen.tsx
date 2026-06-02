import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert, Modal, TouchableOpacity, ScrollView } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Button, Badge, LoadingSpinner, Input } from "../components/ui";
import { useInventory, useAddStock, useRecordUsage, useCreateInventoryItem } from "../hooks/useApi";
import { useAuthStore } from "../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { InventoryItem } from "../types";
import { useIsFocused } from "@react-navigation/native";

export default function InventoryScreen() {
  const isFocused = useIsFocused();
  const { data, isLoading, refetch } = useInventory(undefined, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const addStock = useAddStock();
  const createItem = useCreateInventoryItem();
  const recordUsage = useRecordUsage();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const items = Array.isArray(data?.data) ? data.data : [];
  const [refreshing, setRefreshing] = useState(false);

  // Add Stock Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addStockModalVisible, setAddStockModalVisible] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");

  // Create Item Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");

  if (isLoading) return <LoadingSpinner />;

  const handleAddStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockQuantity("");
    setAddStockModalVisible(true);
  };

  const submitAddStock = () => {
    const qty = Number(stockQuantity);
    if (selectedItem && qty > 0) {
      addStock.mutate({ id: selectedItem.id, data: { quantity: qty, type: "PURCHASE", cost: 0, notes: "Added from app" } });
    }
    setAddStockModalVisible(false);
  };

  const handleCreateItem = () => {
    if (newItemName.trim() && newItemUnit.trim()) {
      createItem.mutate({
        name: newItemName.trim(),
        unit: newItemUnit,
        pricePerUnit: Number(newItemPrice) || 0,
        quantity: Number(newItemQuantity) || 0,
        minStock: 10,
      });
      setCreateModalVisible(false);
      setNewItemName("");
      setNewItemUnit("");
      setNewItemPrice("");
      setNewItemQuantity("");
    }
  };

  const handleRecordUsage = (item: InventoryItem) => {
    Alert.alert("Record Usage", `Record usage for ${item.name} not implemented yet`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />
        }
        renderItem={({ item }: { item: InventoryItem }) => (
          <Card style={styles.card}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.location}>{item.location || "No location"}</Text>
              </View>
              {item.isLowStock && <Badge text="LOW STOCK" bgColor={COLORS.danger} />}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.quantity}</Text>
                <Text style={styles.statLabel}>{item.unit}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹{item.pricePerUnit}</Text>
                <Text style={styles.statLabel}>Per Unit</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.success }]}>₹{item.totalPrice?.toFixed(0) || 0}</Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Button title="Add Stock" onPress={() => handleAddStock(item)} size="sm" style={{ flex: 1 }} />
              <Button title="Record Usage" onPress={() => handleRecordUsage(item)} size="sm" variant="outline" style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />

      {isAdmin && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Add Stock Modal */}
      <Modal visible={addStockModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Stock to {selectedItem?.name}</Text>
            <Input
              label={`Quantity (${selectedItem?.unit})`}
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setAddStockModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Add" onPress={submitAddStock} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create New Item Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Inventory Item</Text>
              <Input
                label="Item Name"
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="e.g., Rice"
              />
              <Input
                label="Price Per Unit (₹)"
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                keyboardType="numeric"
                placeholder="e.g., 50"
              />
              <Input
                label="Initial Quantity"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="numeric"
                placeholder="e.g., 100"
              />
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.xs, fontWeight: "500" }}>Unit</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md }}>
                {["KG", "GRAM", "LITER", "ML", "PIECE", "PACKET", "BOX"].map((u) => (
                  <TouchableOpacity
                    key={u}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: BORDER_RADIUS.md,
                      backgroundColor: newItemUnit === u ? COLORS.primary : COLORS.primary + "10",
                      borderWidth: 1,
                      borderColor: newItemUnit === u ? COLORS.primary : "transparent",
                    }}
                    onPress={() => setNewItemUnit(u)}
                  >
                    <Text style={{ color: newItemUnit === u ? COLORS.white : COLORS.primary, fontWeight: "600", fontSize: 13 }}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setCreateModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Create" onPress={handleCreateItem} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { marginBottom: SPACING.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.sm },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  location: { fontSize: 12, color: COLORS.textSecondary },
  statsRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: "row", gap: SPACING.sm },
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  modalActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
});
