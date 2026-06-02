import React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Button, LoadingSpinner } from "../components/ui";
import { useProducts } from "../hooks/useApi";
import { Product } from "../types";

export default function ProductsScreen() {
  const { data, isLoading, refetch } = useProducts();
  const products = data?.data?.products || [];
  const [refreshing, setRefreshing] = React.useState(false);

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
        renderItem={({ item }: { item: Product }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.category?.name} • {item.section?.name}</Text>
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
          </Card>
        )}
      />
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
});
