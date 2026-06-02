import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { StatusBadge, LoadingSpinner, EmptyState } from "../components/ui";
import { useTables } from "../hooks/useApi";
import { useCartStore } from "../store/cart-store";
import { Table } from "../types";

export default function TablesScreen({ navigation, route }: any) {
  const { sectionId, sectionName } = route.params;
  const { data, isLoading, refetch } = useTables({ sectionId });
  const tables = data?.data?.tables || [];
  const setTable = useCartStore((s) => s.setTable);
  const [refreshing, setRefreshing] = React.useState(false);

  if (isLoading) return <LoadingSpinner />;

  const handleSelectTable = (table: Table) => {
    setTable(table.id, sectionId);
    navigation.navigate("ProductListing", {
      sectionId, sectionName,
      tableId: table.id,
      tableNumber: table.tableNumber,
    });
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
        ListEmptyComponent={<EmptyState title="No Tables" />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: "center", borderWidth: 1.5 },
  num: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: SPACING.sm },
  numTxt: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.xs },
});
