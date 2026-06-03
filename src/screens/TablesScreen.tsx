import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { StatusBadge, LoadingSpinner, EmptyState, Button, Input } from "../components/ui";
import { useTables, useCreateTable } from "../hooks/useApi";
import { useAuthStore } from "../store/auth-store";
import { useCartStore } from "../store/cart-store";
import { Ionicons } from "@expo/vector-icons";
import { Table } from "../types";
import { useIsFocused } from "@react-navigation/native";

export default function TablesScreen({ navigation, route }: any) {
  const isFocused = useIsFocused();
  const { sectionId, sectionName } = route.params;
  const { data, isLoading, refetch } = useTables({ sectionId }, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const createTable = useCreateTable();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  
  const tables = (Array.isArray(data?.data) ? [...data.data] : []).sort(
    (a, b) => a.tableNumber - b.tableNumber
  );
  const setTable = useCartStore((s) => s.setTable);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [tableNumber, setTableNumber] = useState("");

  if (isLoading) return <LoadingSpinner />;

  const handleSelectTable = (table: Table) => {
    setTable(table.id, sectionId);
    navigation.navigate("ProductListing", {
      sectionId, sectionName,
      tableId: table.id,
      tableNumber: table.tableNumber,
    });
  };

  const handleCreateTable = () => {
    const num = parseInt(tableNumber, 10);
    if (!isNaN(num)) {
      createTable.mutate({ sectionId, tableNumber: num });
      setModalVisible(false);
      setTableNumber("");
    }
  };

  const getColor = (s: string) =>
    s === "AVAILABLE" ? COLORS.success : s === "OCCUPIED" ? COLORS.danger : COLORS.warning;

  return (
    <View style={styles.container}>
      <FlatList
        data={tables}
        numColumns={2}
        contentContainerStyle={{ padding: SPACING.md }}
        columnWrapperStyle={{ gap: SPACING.sm }}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title={`No Tables in ${sectionName}`} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { borderColor: getColor(item.status) + "50" }]} activeOpacity={0.7} onPress={() => handleSelectTable(item)}>
            <View style={[styles.num, { backgroundColor: getColor(item.status) + "20" }]}>
              <Text style={[styles.numTxt, { color: getColor(item.status) }]}>{item.tableNumber}</Text>
            </View>
            <Text style={styles.label}>Table {item.tableNumber}</Text>
            <StatusBadge status={item.status} />
          </TouchableOpacity>
        )}
      />

      {isAdmin && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", maxWidth: 340 }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Table</Text>
              <Input
                label="Table Number"
                value={tableNumber}
                onChangeText={setTableNumber}
                placeholder="e.g., 5"
                keyboardType="numeric"
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Create" onPress={handleCreateTable} style={{ flex: 1 }} loading={createTable.isPending} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: "center", borderWidth: 1.5 },
  num: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: SPACING.sm },
  numTxt: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.xs },
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
