import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Button, LoadingSpinner, EmptyState, Input } from "../components/ui";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSections,
} from "../hooks/useApi";
import { useIsFocused } from "@react-navigation/native";
import { useAuthStore } from "../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "../types";

export default function CategoriesScreen() {
  const isFocused = useIsFocused();
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data, isLoading, refetch } = useCategories(
    {
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      ...(selectedSectionId ? { sectionId: selectedSectionId } : {}),
    },
    { refetchInterval: isFocused ? 10000 : false, enabled: isFocused }
  );

  const categories = Array.isArray(data?.data) ? data.data : [];
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Load all sections for filtering and dropdowns
  const { data: secData } = useSections(undefined, { enabled: isFocused });
  const sections = Array.isArray(secData?.data) ? secData.data : [];

  const openEditModal = (item: Category) => {
    setName(item.name);
    setSectionId(item.section?.id || item.sectionId || "");
    setIsEditing(item.id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setName("");
    setSectionId("");
    setIsEditing(null);
  };

  const handleCreateOrUpdate = () => {
    if (!name.trim() || !sectionId) {
      Alert.alert("Missing Details", "Please provide a name and select a section.");
      return;
    }

    if (isEditing) {
      updateCategory.mutate({
        id: isEditing,
        data: {
          name: name.trim(),
          sectionId,
        },
      });
    } else {
      createCategory.mutate({
        name: name.trim(),
        sectionId,
      });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id);
    setDeleteConfirmId(null);
  };

  const confirmDelete = (item: Category) => {
    const message = `Are you sure you want to deactivate the category "${item.name}"?`;
    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        handleDelete(item.id);
      }
    } else {
      Alert.alert("Confirm Delete", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive", onPress: () => handleDelete(item.id) },
      ]);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Top Filter & Search Header */}
      <View style={styles.filterHeader}>
        <View style={{ maxWidth: 800, width: "100%", alignSelf: "center" }}>
          <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
            <Ionicons
              name="search-outline"
              size={20}
              color={isSearchFocused ? COLORS.primary : COLORS.textSecondary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Section Filters Horizontal Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.filterChip, !selectedSectionId && styles.filterChipActive]}
              onPress={() => setSelectedSectionId(undefined)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedSectionId && styles.filterChipTextActive,
                ]}
              >
                All Sections
              </Text>
            </TouchableOpacity>

            {sections.map((sec) => (
              <TouchableOpacity
                key={sec.id}
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  selectedSectionId === sec.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedSectionId(sec.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSectionId === sec.id && styles.filterChipTextActive,
                  ]}
                >
                  {sec.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md, maxWidth: 800, width: "100%", alignSelf: "center" }}
        ListEmptyComponent={
          <EmptyState
            title="No Categories"
            description="No categories found matching filters"
            icon={<Ionicons name="list" size={48} color={COLORS.textMuted} />}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refetch();
              setRefreshing(false);
            }}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.badgeRow}>
                  {item.section?.name ? (
                    <View style={styles.sectionBadge}>
                      <Ionicons
                        name="storefront-outline"
                        size={12}
                        color={COLORS.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.sectionBadgeText}>{item.section.name}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.meta}>
                    {item._count?.products || 0} products
                  </Text>
                </View>
              </View>

              {isAdmin && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Card>
        )}
      />

      {/* FAB - Create Category (restricted to Admin) */}
      {isAdmin && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={closeModal}>
          <TouchableOpacity
            style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}
            onPress={() => {
              setIsEditing(null);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={32} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Create/Edit Category Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 380 }}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {isEditing ? "Edit Category" : "Add New Category"}
                </Text>
                <Input
                  label="Category Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Starters, Beverages"
                />

                <Text style={styles.chipLabel}>Select Section</Text>
                <View style={styles.chipContainer}>
                  {sections.map((sec) => (
                    <TouchableOpacity
                      key={sec.id}
                      activeOpacity={0.7}
                      style={[styles.chip, sectionId === sec.id && styles.chipActive]}
                      onPress={() => setSectionId(sec.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          sectionId === sec.id && styles.chipTextActive,
                        ]}
                      >
                        {sec.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <Button title="Cancel" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                  <Button
                    title={isEditing ? "Update" : "Create"}
                    onPress={handleCreateOrUpdate}
                    style={{ flex: 1 }}
                  />
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
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
      default: {},
    }),
  },
  filterRow: {
    paddingHorizontal: SPACING.md,
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
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
  card: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginTop: 2,
  },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  actionBtn: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  chipLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: SPACING.md,
    fontWeight: "500",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
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
  chipText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextActive: {
    color: COLORS.white,
  },
});
