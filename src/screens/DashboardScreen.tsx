import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, LoadingSpinner } from "../components/ui";
import { useAuthStore } from "../store/auth-store";
import { useOrders, useKitchenDashboard } from "../hooks/useApi";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

export default function DashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isFocused = useIsFocused();

  const { data: ordersData, isLoading, refetch } = useOrders(undefined, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const { data: kitchenData } = useKitchenDashboard(undefined, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });

  const orders = Array.isArray(ordersData?.data) ? ordersData.data : [];

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const menuItems = [
    {
      title: "Sections",
      icon: "grid-outline" as const,
      color: COLORS.primary,
      screen: "Sections",
      roles: ["SUPER_ADMIN", "ADMIN", "HELPER"],
    },
    {
      title: "Products",
      icon: "pricetag-outline" as const,
      color: "#F59E0B",
      screen: "Products",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Orders",
      icon: "receipt-outline" as const,
      color: "#10B981",
      screen: "Orders",
      roles: ["SUPER_ADMIN", "ADMIN", "HELPER"],
    },
    {
      title: "Kitchen",
      icon: "flame-outline" as const,
      color: "#EF4444",
      screen: "Kitchen",
      roles: ["SUPER_ADMIN", "ADMIN", "CHEF"],
    },
    {
      title: "Inventory",
      icon: "cube-outline" as const,
      color: "#8B5CF6",
      screen: "Inventory",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Reports",
      icon: "bar-chart-outline" as const,
      color: "#3B82F6",
      screen: "Reports",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Users",
      icon: "people-outline" as const,
      color: "#EC4899",
      screen: "Users",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.some((role) => hasRole(role as any))
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name} 👋</Text>
          <Text style={styles.role}>{user?.role?.replace(/_/g, " ")}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}


      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.menuGrid}>
        {visibleMenuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + "20" }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Orders */}
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {orders.slice(0, 5).map((order: any) => {
        const productNames = order.items?.map((i: any) => i.product?.name).filter(Boolean) || [];
        const itemSummary = productNames.length > 2 
          ? `${productNames.slice(0, 2).join(", ")} + ${productNames.length - 2} more`
          : productNames.join(", ");

        return (
          <Card
            key={order.id}
            style={styles.orderCard}
            onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}
          >
            <View style={styles.orderHeader}>
              <View style={{ flex: 1, paddingRight: SPACING.md }}>
                <Text style={styles.orderTable}>
                  Table #{order.table?.tableNumber} • {order.table?.section?.name}
                </Text>
                {itemSummary ? (
                  <Text style={{ fontSize: 13, color: COLORS.text, marginTop: 4, fontWeight: "500" }} numberOfLines={1}>
                    {itemSummary}
                  </Text>
                ) : null}
                <Text style={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={order.status} />
                <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
              </View>
            </View>
          </Card>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  role: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.danger + "15",
    borderRadius: BORDER_RADIUS.md,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
  },
  statNumber: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    width: "30%",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  orderCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderTable: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  orderTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  orderAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.success,
    marginTop: 4,
  },
});
