import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, LoadingSpinner } from "../components/ui";
import { useSalesReport } from "../hooks/useApi";
import { SalesReportItem } from "../types";

export default function ReportsScreen() {
  const { data, isLoading, refetch } = useSalesReport();
  const report = data?.data || [];
  const [refreshing, setRefreshing] = React.useState(false);

  if (isLoading) return <LoadingSpinner />;

  // Calculate totals from the daily array
  const totalSales = report.reduce((sum, item: SalesReportItem) => sum + item.revenue, 0);
  const totalOrders = report.reduce((sum, item: SalesReportItem) => sum + item.orderCount, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={COLORS.primary} />}
    >
      {/* Total Sales */}
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Sales</Text>
        <Text style={styles.totalAmount}>₹{totalSales.toFixed(0)}</Text>
        <Text style={styles.totalOrders}>{totalOrders} orders</Text>
      </Card>

      {/* Daily Breakdown */}
      <Text style={styles.sectionTitle}>Daily Breakdown</Text>
      {report.length === 0 && (
        <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>No sales data for this period.</Text>
      )}
      {report.map((day: SalesReportItem, i: number) => (
        <Card key={i} style={styles.dayRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dayDate}>{new Date(day.date).toLocaleDateString()}</Text>
            <Text style={styles.dayOrders}>{day.orderCount} orders</Text>
          </View>
          <Text style={styles.dayRevenue}>₹{day.revenue.toFixed(0)}</Text>
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
  dayRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xs },
  dayDate: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  dayOrders: { fontSize: 11, color: COLORS.textSecondary },
  dayRevenue: { fontSize: 16, fontWeight: "700", color: COLORS.success },
});
