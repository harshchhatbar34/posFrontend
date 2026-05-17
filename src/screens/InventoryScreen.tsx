import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Button, Badge, LoadingSpinner, Input } from "../components/ui";
import { useInventory, useAddStock, useRecordUsage } from "../hooks/useApi";
import { InventoryItem } from "../types";

export default function InventoryScreen() {
  const { data, isLoading, refetch } = useInventory();
  const addStock = useAddStock();
  const recordUsage = useRecordUsage();
  const items = data?.data || [];
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading) return <LoadingSpinner />;

  const handleAddStock = (item: InventoryItem) => {
    if (Alert.prompt) {
      Alert.prompt(
        "Add Stock",
        `Add quantity for ${item.name} (${item.unit})`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add",
            onPress: (qty?: string) => {
              if (qty && Number(qty) > 0) {
                addStock.mutate({ id: item.id, data: { quantityAdded: Number(qty) } });
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Add Stock",
        `Enter quantity to add for ${item.name} in the dashboard.`
      );
    }
  };

  const handleRecordUsage = (item: InventoryItem) => {
    Alert.alert("Record Usage", `Enter quantity used for ${item.name}`);
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
                <Text style={[styles.statValue, { color: COLORS.success }]}>₹{item.totalPrice?.toFixed(0)}</Text>
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
});
