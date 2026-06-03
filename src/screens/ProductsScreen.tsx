import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Button, LoadingSpinner, EmptyState, Input } from "../components/ui";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories, useSections } from "../hooks/useApi";
import { useIsFocused } from "@react-navigation/native";
import { useAuthStore } from "../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "../types";

export default function ProductsScreen() {
  const isFocused = useIsFocused();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  
  const { data, isLoading, refetch } = useProducts(undefined, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const products = (Array.isArray(data?.data) ? [...data.data] : []).sort((a, b) => a.name.localeCompare(b.name));
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const { data: catData } = useCategories(undefined, { enabled: modalVisible });
  const { data: secData } = useSections(undefined, { enabled: modalVisible });

  const categories = Array.isArray(catData?.data) ? catData.data : [];
  const sections = Array.isArray(secData?.data) ? secData.data : [];

  if (isLoading) return <LoadingSpinner />;

  const openEditModal = (item: Product) => {
    setName(item.name);
    setPrice(item.price.toString());
    setCategoryId(item.category?.id || item.categoryId || "");
    setSectionId(item.section?.id || item.sectionId || "");
    setIsEditing(item.id);
    setModalVisible(true);
  };

  const handleCreateOrUpdate = () => {
    if (!name.trim() || !price || !categoryId || !sectionId) {
      Alert.alert("Missing Details", "Please provide a name, price, and select both a category and a section to save the product.");
      return;
    }

    if (isEditing) {
      updateProduct.mutate({
        id: isEditing,
        data: {
          name: name.trim(),
          price: Number(price),
          categoryId,
          sectionId,
        }
      });
    } else {
      createProduct.mutate({
        name: name.trim(),
        price: Number(price),
        categoryId,
        sectionId,
        isAvailable: true,
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(null);
    setName("");
    setPrice("");
    setCategoryId("");
    setSectionId("");
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDelete = (id: string) => {
    deleteProduct.mutate(id);
    setDeleteConfirmId(null);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        ListEmptyComponent={<EmptyState title="No Products Available" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
        renderItem={({ item }: { item: Product }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.category?.name || "No Category"} • {item.section?.name || "No Section"}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.price}>₹{item.price}</Text>
                <View style={[styles.avail, { backgroundColor: item.isAvailable ? COLORS.success + "20" : COLORS.danger + "20" }]}>
                  <Text style={[styles.availText, { color: item.isAvailable ? COLORS.success : COLORS.danger }]}>
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </Text>
                </View>
              </View>
            </View>
            {isAdmin && (
              deleteConfirmId === item.id ? (
                <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md, alignItems: "center" }}>
                  <Text style={{ flex: 1, fontSize: 12, color: COLORS.danger, fontWeight: "600" }}>Delete this product?</Text>
                  <Button title="Yes, Delete" onPress={() => handleDelete(item.id)} size="sm" variant="danger" />
                  <Button title="Cancel" onPress={() => setDeleteConfirmId(null)} size="sm" variant="outline" />
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
                  <Button title="Edit" onPress={() => openEditModal(item)} size="sm" variant="outline" style={{ flex: 1 }} />
                  <Button title="Delete" onPress={() => confirmDelete(item.id)} size="sm" variant="outline" style={{ flex: 1, borderColor: COLORS.danger }} textStyle={{ color: COLORS.danger }} />
                </View>
              )
            )}
          </Card>
        )}
      />

      {isAdmin && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => { setIsEditing(null); setModalVisible(true); }}>
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Create/Edit Product Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 400 }}
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{isEditing ? "Edit Product" : "Add New Product"}</Text>
                <Input
                  label="Product Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Masala Dosa"
                />
                <Input
                  label="Price (₹)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="e.g., 150"
                />
                
                <Text style={styles.chipLabel}>Category</Text>
                <View style={styles.chipContainer}>
                  {categories.map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.7}
                      style={[styles.chip, categoryId === c.id && styles.chipActive]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.chipLabel}>Section</Text>
                <View style={styles.chipContainer}>
                  {sections.map((s: any) => (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.7}
                      style={[styles.chip, sectionId === s.id && styles.chipActive]}
                      onPress={() => setSectionId(s.id)}
                    >
                      <Text style={[styles.chipText, sectionId === s.id && styles.chipTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <Button title="Cancel" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                  <Button title={isEditing ? "Update" : "Create"} onPress={handleCreateOrUpdate} style={{ flex: 1 }} />
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
  card: { marginBottom: SPACING.sm },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  price: { fontSize: 18, fontWeight: "800", color: COLORS.success },
  avail: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  availText: { fontSize: 11, fontWeight: "700" },
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
  chipLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.xs, fontWeight: "500" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + "10",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: COLORS.white },
});
