import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput } from "react-native";
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
  const isManager = useAuthStore((s) => s.isManager());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>();
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [selectedSectionName, setSelectedSectionName] = useState<string | undefined>();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const { data, isLoading, refetch } = useProducts({
    ...(searchQuery.trim() ? { name: searchQuery.trim() } : {}),
    ...(selectedCategoryName ? { category: selectedCategoryName } : {}),
    ...(selectedSectionName ? { section: selectedSectionName } : {}),
  }, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  
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

  // Load sections (all, always)
  const { data: secData } = useSections(undefined, { enabled: isFocused });
  const sections = Array.isArray(secData?.data) ? secData.data : [];

  // Load categories filtered by the selected section in the modal
  const { data: catData } = useCategories(
    sectionId ? { sectionId } : undefined,
    { enabled: isFocused && !!sectionId }
  );
  const categories = Array.isArray(catData?.data) ? catData.data : [];

  // Load categories for the top filter bar (filtered by selected section)
  const { data: filterCatData } = useCategories(
    selectedSectionId ? { sectionId: selectedSectionId } : undefined,
    { enabled: isFocused }
  );
  const filterCategories = Array.isArray(filterCatData?.data) ? filterCatData.data : [];

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

  // When section changes in the modal, reset category
  const handleModalSectionSelect = (id: string) => {
    setSectionId(id);
    setCategoryId(""); // reset so user must re-pick
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
      {/* Search & Filter Header */}
      <View style={styles.filterHeader}>
        <View style={{ maxWidth: 800, width: "100%", alignSelf: "center" }}>
          <View style={[
            styles.searchBar,
            isSearchFocused && styles.searchBarFocused
          ]}>
            <Ionicons
              name="search"
              size={18}
              color={isSearchFocused ? COLORS.primary : COLORS.textSecondary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products by name..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              underlineColorAndroid="transparent"
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Categories row — filtered by selected section */}
          <View style={{ marginBottom: SPACING.xs }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: undefined, name: "All Categories" } as any, ...filterCategories]}
              contentContainerStyle={styles.filterRow}
              keyExtractor={(item) => item.id || "all-cats"}
              renderItem={({ item }) => {
                const isActive = (!selectedCategoryName && !item.id) || selectedCategoryName === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedCategoryName(item.id ? item.name : undefined)}
                  >
                    <Ionicons
                      name={item.id ? "pricetag-outline" : "grid-outline"}
                      size={13}
                      color={isActive ? COLORS.white : COLORS.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Sections row */}
          <View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: undefined, name: "All Sections" } as any, ...sections]}
              contentContainerStyle={styles.filterRow}
              keyExtractor={(item) => item.id || "all-secs"}
              renderItem={({ item }) => {
                const isActive = (!selectedSectionName && !item.id) || selectedSectionName === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => {
                      setSelectedSectionName(item.id ? item.name : undefined);
                      setSelectedSectionId(item.id || undefined);
                      setSelectedCategoryName(undefined); // reset category filter when section changes
                    }}
                  >
                    <Ionicons
                      name={item.id ? "location-outline" : "map-outline"}
                      size={13}
                      color={isActive ? COLORS.white : COLORS.info}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100, maxWidth: 800, width: "100%", alignSelf: "center" }}
        ListEmptyComponent={<EmptyState title="No Products Available" description="Try clearing your filters" />}
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
            {isManager && (
              deleteConfirmId === item.id ? (
                isAdmin ? (
                  <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md, alignItems: "center" }}>
                    <Text style={{ flex: 1, fontSize: 12, color: COLORS.danger, fontWeight: "600" }}>Delete this product?</Text>
                    <Button title="Yes, Delete" onPress={() => handleDelete(item.id)} size="sm" variant="danger" />
                    <Button title="Cancel" onPress={() => setDeleteConfirmId(null)} size="sm" variant="outline" />
                  </View>
                ) : null
              ) : (
                <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
                  <Button title="Edit" onPress={() => openEditModal(item)} size="sm" variant="outline" style={{ flex: 1 }} />
                  {isAdmin && (
                    <Button title="Delete" onPress={() => confirmDelete(item.id)} size="sm" variant="outline" style={{ flex: 1, borderColor: COLORS.danger }} textStyle={{ color: COLORS.danger }} />
                  )}
                </View>
              )
            )}
          </Card>
        )}
      />

      {isManager && (
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
                {/* STEP 1 — Pick Section first */}
                <Text style={styles.chipLabel}>Section</Text>
                <View style={styles.chipContainer}>
                  {sections.map((s: any) => (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.7}
                      style={[styles.chip, sectionId === s.id && styles.chipActive]}
                      onPress={() => handleModalSectionSelect(s.id)}
                    >
                      <Text style={[styles.chipText, sectionId === s.id && styles.chipTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* STEP 2 — Category appears only after section is selected */}
                {sectionId ? (
                  <>
                    <Text style={styles.chipLabel}>
                      Category {categories.length === 0 ? "(no categories for this section yet)" : ""}
                    </Text>
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
                  </>
                ) : (
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.md }}>
                    👆 Pick a section above to see its categories
                  </Text>
                )}

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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: SPACING.lg },
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
  filterHeader: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 3,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    marginBottom: SPACING.md,
  },
  searchBarFocused: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
    fontWeight: "500",
  },
  filterRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },
});
