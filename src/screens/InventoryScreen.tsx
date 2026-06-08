import React, { useState, useRef, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Animated } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Button, Badge, LoadingSpinner, Input } from "../components/ui";
import { useInventory, useAddStock, useRecordUsage, useCreateInventoryItem, useUpdateInventoryItem } from "../hooks/useApi";
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
  const updateItem = useUpdateInventoryItem();
  const canManage = useAuthStore((s) => s.hasRole("SUPER_ADMIN", "ADMIN", "MANAGER", "CHEF"));
  const items = Array.isArray(data?.data) ? data.data : [];
  const [refreshing, setRefreshing] = useState(false);

  // Picker Modal (Option A: Add New, Option B: Update Stock/Usage)
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const popoverScale = useRef(new Animated.Value(0.9)).current;
  const popoverOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (optionModalVisible) {
      popoverScale.setValue(0.9);
      popoverOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(popoverOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(popoverScale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [optionModalVisible]);

  const closeOptionMenu = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(popoverOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(popoverScale, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOptionModalVisible(false);
      if (callback) callback();
    });
  };

  // Add Stock Modal State (for list row action)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addStockModalVisible, setAddStockModalVisible] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [stockError, setStockError] = useState("");

  // Record Usage Modal State (for list row action)
  const [recordUsageModalVisible, setRecordUsageModalVisible] = useState(false);
  const [usageQuantity, setUsageQuantity] = useState("");
  const [usageNote, setUsageNote] = useState("");
  const [usageError, setUsageError] = useState("");

  // Create Item Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemLocation, setNewItemLocation] = useState("");
  const [newItemMinStock, setNewItemMinStock] = useState("10");
  const [createItemError, setCreateItemError] = useState("");

  // Unified Update Modal State (accessible from FAB picker)
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateSearchQuery, setUpdateSearchQuery] = useState("");
  const [updateSelectedItem, setUpdateSelectedItem] = useState<InventoryItem | null>(null);
  const [updateTxType, setUpdateTxType] = useState<"ADD" | "USE">("USE"); // Default to usage
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updateError, setUpdateError] = useState("");

  if (isLoading) return <LoadingSpinner />;

  const handleAddStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockQuantity("");
    setStockNote("");
    setStockError("");
    setAddStockModalVisible(true);
  };

  const handleRecordUsage = (item: InventoryItem) => {
    setSelectedItem(item);
    setUsageQuantity("");
    setUsageNote("");
    setUsageError("");
    setRecordUsageModalVisible(true);
  };

  const submitAddStock = () => {
    if (!stockQuantity.trim()) {
      setStockError("Quantity is required");
      return;
    }
    const qty = Number(stockQuantity);
    if (isNaN(qty) || qty <= 0) {
      setStockError("Please enter a valid positive number");
      return;
    }
    if (selectedItem) {
      addStock.mutate(
        { id: selectedItem.id, data: { quantityAdded: qty, note: stockNote.trim() || "Stock refilled via list row" } },
        {
          onSuccess: () => {
            setAddStockModalVisible(false);
            setStockError("");
            refetch();
          },
          onError: (err: any) => {
            setStockError(err?.response?.data?.error || "Failed to add stock");
          },
        }
      );
    }
  };

  const submitRecordUsage = () => {
    if (!usageQuantity.trim()) {
      setUsageError("Quantity is required");
      return;
    }
    const qty = Number(usageQuantity);
    if (isNaN(qty) || qty <= 0) {
      setUsageError("Please enter a valid positive number");
      return;
    }
    if (!usageNote.trim()) {
      setUsageError("Usage note is required");
      return;
    }
    if (selectedItem) {
      recordUsage.mutate(
        { id: selectedItem.id, data: { quantityUsed: qty, note: usageNote.trim() } },
        {
          onSuccess: () => {
            setRecordUsageModalVisible(false);
            setUsageError("");
            refetch();
          },
          onError: (err: any) => {
            setUsageError(err?.response?.data?.error || "Failed to record usage");
          },
        }
      );
    }
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) {
      setCreateItemError("Item name is required");
      return;
    }
    if (!newItemUnit) {
      setCreateItemError("Please select a unit");
      return;
    }
    createItem.mutate(
      {
        name: newItemName.trim(),
        unit: newItemUnit,
        pricePerUnit: Number(newItemPrice) || 0,
        initialQuantity: Number(newItemQuantity) || 0,
        minStock: Number(newItemMinStock) || 0,
        location: newItemLocation.trim() || undefined,
      },
      {
        onSuccess: () => {
          setCreateModalVisible(false);
          resetCreateForm();
          refetch();
        },
        onError: (err: any) => {
          setCreateItemError(err?.response?.data?.error || "Failed to create item");
        },
      }
    );
  };

  const submitInventoryUpdate = () => {
    if (!updateSelectedItem) {
      setUpdateError("Please select an item first");
      return;
    }
    const qty = Number(updateQuantity);
    if (isNaN(qty) || qty <= 0) {
      setUpdateError("Please enter a valid positive quantity");
      return;
    }
    if (updateTxType === "USE" && !updateNote.trim()) {
      setUpdateError("Note is required for recording usage");
      return;
    }

    if (updateTxType === "USE") {
      recordUsage.mutate(
        {
          id: updateSelectedItem.id,
          data: {
            quantityUsed: qty,
            note: updateNote.trim(),
          },
        },
        {
          onSuccess: () => {
            setUpdateModalVisible(false);
            resetUpdateForm();
            refetch();
          },
          onError: (err: any) => {
            setUpdateError(err?.response?.data?.error || "Failed to record usage");
          },
        }
      );
    } else {
      // ADD STOCK manually (via addStock endpoint for proper log creation)
      addStock.mutate(
        {
          id: updateSelectedItem.id,
          data: {
            quantityAdded: qty,
            note: updateNote.trim() || "Stock refilled",
          },
        },
        {
          onSuccess: () => {
            setUpdateModalVisible(false);
            resetUpdateForm();
            refetch();
          },
          onError: (err: any) => {
            setUpdateError(err?.response?.data?.error || "Failed to add stock");
          },
        }
      );
    }
  };

  const resetCreateForm = () => {
    setNewItemName("");
    setNewItemUnit("");
    setNewItemPrice("");
    setNewItemQuantity("");
    setNewItemLocation("");
    setNewItemMinStock("10");
    setCreateItemError("");
  };

  const resetUpdateForm = () => {
    setUpdateSearchQuery("");
    setUpdateSelectedItem(null);
    setUpdateTxType("USE");
    setUpdateQuantity("");
    setUpdateNote("");
    setUpdateError("");
  };

  const handleSelectUpdate = (item: InventoryItem) => {
    resetUpdateForm();
    setUpdateSelectedItem(item);
    setUpdateModalVisible(true);
  };


  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md, maxWidth: 800, width: "100%", alignSelf: "center" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCol, { flex: 2 }]}>Item</Text>
            <Text style={[styles.headerCol, { flex: 1.2, textAlign: "right" }]}>Stock</Text>
            <Text style={[styles.headerCol, { flex: 1, textAlign: "right" }]}>Price</Text>
            <Text style={[styles.headerCol, { flex: 1.2, textAlign: "right" }]}>Value</Text>
          </View>
        }
        renderItem={({ item }: { item: InventoryItem }) => (
          <TouchableOpacity
            style={styles.tableRow}
            activeOpacity={canManage ? 0.7 : 1}
            onPress={() => {
              if (canManage) {
                handleSelectUpdate(item);
              }
            }}
          >
            <View style={{ flex: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.isLowStock && (
                  <View style={styles.lowStockDot} />
                )}
              </View>
              <Text style={styles.itemLocation}>{item.location || "No location"}</Text>
            </View>
            
            <View style={{ flex: 1.2, alignItems: "flex-end" }}>
              <Text style={[styles.rowText, item.isLowStock && { color: COLORS.danger, fontWeight: "600" }]}>
                {item.quantity}
              </Text>
              <Text style={styles.rowSubtext}>{item.unit}</Text>
            </View>

            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.rowText}>₹{item.pricePerUnit}</Text>
            </View>

            <View style={{ flex: 1.2, alignItems: "flex-end" }}>
              <Text style={[styles.rowText, { color: COLORS.success, fontWeight: "700" }]}>
                ₹{item.totalPrice?.toFixed(0) || 0}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {canManage && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => {
            setOptionModalVisible(true);
          }}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Option Picker Modal (Floating Context Popover) */}
      <Modal visible={optionModalVisible} transparent animationType="none" onRequestClose={() => closeOptionMenu()}>
        <TouchableOpacity
          style={styles.popoverOverlay}
          activeOpacity={1}
          onPress={() => closeOptionMenu()}
        >
          <Animated.View
            style={[
              styles.popoverMenu,
              {
                opacity: popoverOpacity,
                transform: [
                  { scale: popoverScale },
                  {
                    translateY: popoverOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.popoverHeader}>Manage Inventory</Text>
            
            <TouchableOpacity
              style={styles.popoverItem}
              activeOpacity={0.7}
              onPress={() => {
                closeOptionMenu(() => {
                  resetCreateForm();
                  setCreateModalVisible(true);
                });
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} style={styles.popoverIcon} />
              <View style={styles.popoverTextContainer}>
                <Text style={styles.popoverText}>New</Text>
                <Text style={styles.popoverSubtext}>Create a new item in the list</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.popoverSeparator} />

            <TouchableOpacity
              style={styles.popoverItem}
              activeOpacity={0.7}
              onPress={() => {
                closeOptionMenu(() => {
                  resetUpdateForm();
                  setUpdateModalVisible(true);
                });
              }}
            >
              <Ionicons name="sync-outline" size={20} color={COLORS.primary} style={styles.popoverIcon} />
              <View style={styles.popoverTextContainer}>
                <Text style={styles.popoverText}>Update</Text>
                <Text style={styles.popoverSubtext}>Add stock or record usage log</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Unified Update Stock / Usage Modal */}
      <Modal visible={updateModalVisible} transparent animationType="fade" onRequestClose={() => { setUpdateModalVisible(false); resetUpdateForm(); }}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%", maxWidth: 400 }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Stock / Usage</Text>

              {/* Item Selector / Search */}
              {!updateSelectedItem ? (
                <View>
                  <Input
                    label="Search Item"
                    value={updateSearchQuery}
                    onChangeText={setUpdateSearchQuery}
                    placeholder="Search inventory by name..."
                    error={updateError}
                  />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 4 }}>Select Item:</Text>
                  <View style={styles.searchSelectorContainer}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                      {items.filter((item: InventoryItem) => item.name.toLowerCase().includes(updateSearchQuery.toLowerCase())).length === 0 ? (
                        <Text style={{ padding: SPACING.sm, color: COLORS.textMuted, fontSize: 13, textAlign: "center" }}>No items found</Text>
                      ) : (
                        items
                          .filter((item: InventoryItem) => item.name.toLowerCase().includes(updateSearchQuery.toLowerCase()))
                          .map((item: InventoryItem) => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.searchSelectorRow}
                              onPress={() => {
                                setUpdateSelectedItem(item);
                                setUpdateError("");
                              }}
                            >
                              <Text style={styles.searchSelectorText}>{item.name}</Text>
                              <Text style={styles.searchSelectorUnit}>Current: {item.quantity} {item.unit} • Location: {item.location || "No location"}</Text>
                            </TouchableOpacity>
                          ))
                      )}
                    </ScrollView>
                  </View>
                </View>
              ) : (
                <View style={styles.selectedItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedItemName}>{updateSelectedItem.name}</Text>
                    <Text style={styles.selectedItemStock}>
                      Current Stock: {updateSelectedItem.quantity} {updateSelectedItem.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setUpdateSelectedItem(null)}
                    style={{ padding: 6, backgroundColor: COLORS.danger + "15", borderRadius: 6 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}

              {updateSelectedItem && (
                <View>
                  {/* Transaction Type Selection */}
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: "500" }}>Transaction Type</Text>
                  <View style={styles.txTypeContainer}>
                    <TouchableOpacity
                      style={[styles.txTypeChip, updateTxType === "USE" && styles.txTypeChipActive]}
                      onPress={() => {
                        setUpdateTxType("USE");
                        setUpdateError("");
                      }}
                    >
                      <Text style={[styles.txTypeText, updateTxType === "USE" && styles.txTypeTextActive]}>Record Usage</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.txTypeChip, updateTxType === "ADD" && styles.txTypeChipActive]}
                      onPress={() => {
                        setUpdateTxType("ADD");
                        setUpdateError("");
                      }}
                    >
                      <Text style={[styles.txTypeText, updateTxType === "ADD" && styles.txTypeTextActive]}>Add Stock</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quantity Input */}
                  <Input
                    label={updateTxType === "USE" ? `Quantity to Use (${updateSelectedItem.unit})` : `Quantity to Add (${updateSelectedItem.unit})`}
                    value={updateQuantity}
                    onChangeText={(text) => {
                      setUpdateQuantity(text);
                      setUpdateError("");
                    }}
                    keyboardType="numeric"
                    placeholder="Enter quantity"
                    error={updateError}
                  />

                  {/* Note Input */}
                  <Input
                    label={updateTxType === "USE" ? "Usage Note (Required)" : "Stock Note (Optional)"}
                    value={updateNote}
                    onChangeText={(text) => {
                      setUpdateNote(text);
                      setUpdateError("");
                    }}
                    placeholder={updateTxType === "USE" ? "e.g., Used for Masala Dosa prep" : "e.g., Monthly restock"}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setUpdateModalVisible(false);
                    resetUpdateForm();
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Submit"
                  onPress={submitInventoryUpdate}
                  style={{ flex: 1 }}
                  disabled={!updateSelectedItem}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Record Usage Modal (For row action) */}
      <Modal visible={recordUsageModalVisible} transparent animationType="fade" onRequestClose={() => setRecordUsageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 340 }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Record Usage for {selectedItem?.name}</Text>
              <Input
                label={`Quantity Used (${selectedItem?.unit})`}
                value={usageQuantity}
                onChangeText={(text) => {
                  setUsageQuantity(text);
                  setUsageError("");
                }}
                keyboardType="numeric"
                placeholder="Enter quantity used"
                error={usageError}
              />
              <Input
                label="Usage Note (Required)"
                value={usageNote}
                onChangeText={(text) => {
                  setUsageNote(text);
                  setUsageError("");
                }}
                placeholder="e.g., prep spill, ingredient expired"
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setRecordUsageModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Submit" onPress={submitRecordUsage} style={{ flex: 1 }} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Stock Modal */}
      <Modal visible={addStockModalVisible} transparent animationType="fade" onRequestClose={() => setAddStockModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 340 }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Stock to {selectedItem?.name}</Text>
              <Input
                label={`Quantity (${selectedItem?.unit})`}
                value={stockQuantity}
                onChangeText={(text) => {
                  setStockQuantity(text);
                  setStockError("");
                }}
                keyboardType="numeric"
                placeholder="Enter quantity"
                error={stockError}
              />
              <Input
                label="Stock Note (Optional)"
                value={stockNote}
                onChangeText={setStockNote}
                placeholder="e.g., Refilled supply"
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setAddStockModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Add" onPress={submitAddStock} style={{ flex: 1 }} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Create New Item Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 400 }}
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create Inventory Item</Text>
                <Input
                  label="Item Name"
                  value={newItemName}
                  onChangeText={(text) => {
                    setNewItemName(text);
                    setCreateItemError("");
                  }}
                  placeholder="e.g., Rice"
                  error={createItemError}
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
                <Input
                  label="Location"
                  value={newItemLocation}
                  onChangeText={setNewItemLocation}
                  placeholder="e.g., Main Store, Kitchen Rack"
                />
                <Input
                  label="Min Stock Alert Level"
                  value={newItemMinStock}
                  onChangeText={setNewItemMinStock}
                  keyboardType="numeric"
                  placeholder="e.g., 20"
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
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary + "15",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerCol: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    textTransform: "capitalize",
  },
  itemLocation: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  lowStockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  rowText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  rowSubtext: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
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
    zIndex: 99,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
  modalActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  
  // Custom Styles
  popoverOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  popoverMenu: {
    position: "absolute",
    bottom: 96,
    right: 24,
    width: 260,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  popoverHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  popoverItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
  },
  popoverIcon: {
    marginRight: 12,
  },
  popoverTextContainer: {
    flex: 1,
  },
  popoverText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  popoverSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  popoverSeparator: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
  },
  searchSelectorContainer: {
    maxHeight: 180,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  searchSelectorRow: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  searchSelectorUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  selectedItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
    marginBottom: SPACING.md,
  },
  selectedItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  selectedItemStock: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txTypeContainer: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  txTypeChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  txTypeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  txTypeText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  txTypeTextActive: {
    color: COLORS.white,
  },
});
