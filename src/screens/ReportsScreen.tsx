import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, LoadingSpinner } from "../components/ui";
import { useSalesReport } from "../hooks/useApi";

export default function ReportsScreen() {
  const { data, isLoading, refetch } = useSalesReport();
  const report = data?.data;
  const [refreshing, setRefreshing] = React.useState(false);

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, maxWidth: 800, width: "100%", alignSelf: "center" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
    >
      {/* Total Sales */}
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Sales</Text>
        <Text style={styles.totalAmount}>₹{report?.totalSales?.toFixed(0) || 0}</Text>
        <Text style={styles.totalOrders}>{report?.orderCount || 0} orders</Text>
      </Card>

      {/* Payment Breakdown */}
      <Text style={styles.sectionTitle}>Payment Breakdown</Text>
      <View style={styles.row}>
        {report?.paymentBreakdown?.map((p: any, i: number) => (
          <Card key={i} style={styles.payCard}>
            <Text style={styles.payMethod}>{p.method}</Text>
            <Text style={styles.payAmount}>₹{p.total?.toFixed(0)}</Text>
            <Text style={styles.payCount}>{p.count} orders</Text>
          </Card>
        ))}
      </View>

      {/* Top Products */}
      <Text style={styles.sectionTitle}>Top Products</Text>
      {report?.topProducts?.slice(0, 10).map((p: any, i: number) => (
        <Card key={i} style={styles.productRow}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>#{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{p.name}</Text>
            <Text style={styles.productQty}>{p.quantity} sold</Text>
          </View>
          <Text style={styles.productRevenue}>₹{p.revenue?.toFixed(0)}</Text>
        </Card>
      ))}

      {/* Section Sales */}
      <Text style={styles.sectionTitle}>Section-wise Sales</Text>
      {report?.sectionWiseSales?.map((s: any, i: number) => (
        <Card key={i} style={styles.sectionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionName}>{s.section}</Text>
            <Text style={styles.sectionOrders}>{s.orderCount} orders</Text>
          </View>
          <Text style={styles.sectionRevenue}>₹{s.revenue?.toFixed(0)}</Text>
        </Card>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  totalCard: { alignItems: "center", padding: SPACING.xl, marginBottom: SPACING.lg, backgroundColor: COLORS.primary + "15", borderColor: COLORS.primary + "30" },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },
  totalAmount: { fontSize: 36, fontWeight: "800", color: COLORS.success, marginVertical: 4 },
  totalOrders: { fontSize: 13, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.md },
  row: { flexDirection: "row", gap: SPACING.sm },
  payCard: { flex: 1, alignItems: "center" },
  payMethod: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  payAmount: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginVertical: 2 },
  payCount: { fontSize: 11, color: COLORS.textMuted },
  productRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xs },
  rank: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + "20", justifyContent: "center", alignItems: "center", marginRight: SPACING.md },
  rankText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  productName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  productQty: { fontSize: 11, color: COLORS.textSecondary },
  productRevenue: { fontSize: 16, fontWeight: "700", color: COLORS.success },
  sectionRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xs },
  sectionName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  sectionOrders: { fontSize: 11, color: COLORS.textSecondary },
  sectionRevenue: { fontSize: 16, fontWeight: "700", color: COLORS.success },
});
