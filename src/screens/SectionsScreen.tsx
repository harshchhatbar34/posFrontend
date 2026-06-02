import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Modal } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, LoadingSpinner, EmptyState, Button, Input } from "../components/ui";
import { useSections, useAddSection } from "../hooks/useApi";
import { useAuthStore } from "../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { Section } from "../types";
import { useIsFocused } from "@react-navigation/native";

export default function SectionsScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { data, isLoading, refetch } = useSections(undefined, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const addSection = useAddSection();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  
  const sections = Array.isArray(data?.data) ? data.data : [];
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");

  if (isLoading) return <LoadingSpinner />;

  const handleCreateSection = () => {
    if (sectionName.trim()) {
      addSection.mutate({ name: sectionName.trim(), description: sectionDesc.trim() });
      setModalVisible(false);
      setSectionName("");
      setSectionDesc("");
    }
  };

  const renderSection = ({ item }: { item: Section }) => (
    <Card
      style={styles.sectionCard}
      onPress={() => navigation.navigate("Tables", { sectionId: item.id, sectionName: item.name })}
    >
      <View style={styles.sectionIcon}>
        <Ionicons name="storefront-outline" size={28} color={COLORS.primary} />
      </View>
      <View style={styles.sectionInfo}>
        <Text style={styles.sectionName}>{item.name}</Text>
        <Text style={styles.sectionMeta}>
          {item._count?.tables || 0} tables • {item._count?.products || 0} products
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        ListEmptyComponent={
          <EmptyState title="No Sections" description="Add sections to get started" />
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
      />

      {isAdmin && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Section</Text>
            <Input
              label="Section Name"
              value={sectionName}
              onChangeText={setSectionName}
              placeholder="e.g., Main Hall"
            />
            <Input
              label="Description (Optional)"
              value={sectionDesc}
              onChangeText={setSectionDesc}
              placeholder="e.g., Ground floor dining area"
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Create" onPress={handleCreateSection} style={{ flex: 1 }} isLoading={addSection.isPending} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  sectionIcon: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  sectionInfo: { flex: 1 },
  sectionName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  sectionMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
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
