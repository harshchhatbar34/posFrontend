import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, TextInput } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, StatusBadge, LoadingSpinner } from "../components/ui";
import { useAuthStore } from "../store/auth-store";
import { useOrders, useKitchenDashboard, useKitchenSummary, useSections } from "../hooks/useApi";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

export default function DashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isFocused = useIsFocused();

  const [selectedSectionId, setSelectedSectionId] = React.useState<string | undefined>();
  const [itemSearch, setItemSearch] = React.useState("");

  const { data: ordersData, isLoading, refetch } = useOrders(undefined, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const { data: kitchenData, refetch: refetchKitchen } = useKitchenDashboard(selectedSectionId, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const { data: summaryData, refetch: refetchSummary } = useKitchenSummary(selectedSectionId, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const { data: secData, refetch: refetchSections } = useSections(undefined, { enabled: isFocused });

  const orders = Array.isArray(ordersData?.data) ? ordersData.data : [];
  const sections = Array.isArray(secData?.data) ? secData.data : [];
  const summaryItems = Array.isArray(summaryData?.data) ? summaryData.data : [];
  
  const totalPendingItems = summaryItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const pendingOrdersCount = (kitchenData?.data as any)?.stats?.pending || 0;
  const inProgressOrdersCount = (kitchenData?.data as any)?.stats?.inProgress || 0;
  const cookedOrdersCount = (kitchenData?.data as any)?.stats?.cooked || 0;
  const todayOrdersCount = (kitchenData?.data as any)?.stats?.todayOrders || 0;

  const filteredItems = React.useMemo(() => {
    if (!itemSearch.trim()) return summaryItems;
    return summaryItems.filter((item: any) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [summaryItems, itemSearch]);

  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a: any, b: any) => {
      const isAPending = a.status === "PENDING" || a.status === "IN_PROGRESS";
      const isBPending = b.status === "PENDING" || b.status === "IN_PROGRESS";

      if (isAPending && !isBPending) return -1;
      if (!isAPending && isBPending) return 1;

      // Both are pending or both are done: sort oldest first (which came first)
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
  }, [orders]);

  const filteredOrders = React.useMemo(() => {
    if (!selectedSectionId) return sortedOrders;
    return sortedOrders.filter((order: any) => order.table?.section?.id === selectedSectionId || order.table?.sectionId === selectedSectionId);
  }, [sortedOrders, selectedSectionId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return COLORS.statusPending;
      case "IN_PROGRESS": return COLORS.statusInProgress;
      case "COOKED": return COLORS.statusCooked;
      case "SERVED": return COLORS.statusServed;
      case "CANCELLED": return COLORS.statusCancelled;
      default: return COLORS.border;
    }
  };

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchKitchen(), refetchSummary(), refetchSections()]);
    setRefreshing(false);
  };
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, maxWidth: 850, width: "100%", alignSelf: "center" }}
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

      {/* Section Filters Horizontal Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ marginBottom: SPACING.md }}
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

        {sections.map((sec: any) => (
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

      {/* Stats Section */}
      <View style={{ marginBottom: SPACING.md }}>
        <View style={[styles.statsRow, { marginBottom: SPACING.sm }]}>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{pendingOrdersCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.statusInProgress }]}>{inProgressOrdersCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </Card>
        </View>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{cookedOrdersCount}</Text>
            <Text style={styles.statLabel}>Cooked</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.info }]}>{todayOrdersCount}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </Card>
        </View>
      </View>

      {/* Items to Prepare Section */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Items to Prepare</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search items to prepare..."
            placeholderTextColor={COLORS.textMuted}
            value={itemSearch}
            onChangeText={setItemSearch}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Product</Text>
          <Text style={styles.headerText}>Quantity</Text>
        </View>
        <View style={styles.itemsList}>
          {filteredItems.length === 0 ? (
            <Text style={styles.emptyText}>No items to prepare</Text>
          ) : (
            filteredItems.map((item: any) => (
              <View key={item.name} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Recent Orders */}
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {filteredOrders.slice(0, 5).map((order: any) => {
        const itemSummary = order.items?.map((i: any) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(" • ") || "No items";

        const leftBorderColor = order.paymentStatus === "PAID" ? COLORS.success : getStatusColor(order.status);

        return (
          <Card
            key={order.id}
            style={{ ...styles.orderCard, borderLeftWidth: 4, borderLeftColor: leftBorderColor }}
            onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}
          >
            <View style={styles.orderRow}>
              {/* Left Side: Table & Icon */}
              <View style={styles.orderLeft}>
                <View style={styles.tableIconContainer}>
                  <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.tableDetails}>
                  <Text style={styles.orderTable}>
                    Table #{order.table?.tableNumber}
                  </Text>
                  {!selectedSectionId && order.table?.section?.name ? (
                    <Text style={styles.sectionBadgeText}>{order.table?.section?.name}</Text>
                  ) : null}
                </View>
              </View>

              {/* Right Side: Status, Amount, & Chevron */}
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
                <View style={{ flexDirection: "row", gap: 4, alignItems: "center", marginTop: 4 }}>
                  {order.paymentStatus === "PAID" ? (
                    <StatusBadge status="PAID" />
                  ) : (
                    <>
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.paymentStatus} />
                    </>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Bottom Section: Customer Details & Items */}
            <View style={styles.cardBottom}>
              {/* Customer Row */}
              {(order.customerName || order.customerNumber) ? (
                <View style={styles.customerRow}>
                  <Ionicons name="person-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.customerText} numberOfLines={1}>
                    {order.customerName || "Walk-in"} {order.customerNumber ? `(${order.customerNumber})` : ""}
                  </Text>
                </View>
              ) : null}

              {/* Items Row */}
              <View style={styles.itemsSummaryRow}>
                <Ionicons name="fast-food-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.itemsText} numberOfLines={2}>
                  {itemSummary}
                </Text>
              </View>

              {/* Client message (notes) */}
              {order.notes ? (
                <View style={styles.notesRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.secondaryDark} style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.notesText} numberOfLines={2}>
                    Note: "{order.notes}"
                  </Text>
                </View>
              ) : null}

              {/* Time stamp */}
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                <Text style={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
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
  customerText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" },
  orderTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  orderAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.success,
    marginTop: 4,
  },
  summaryContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
    fontWeight: "500",
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
      default: {},
    }),
  },
  itemsList: {
    paddingHorizontal: SPACING.sm,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  qtyBadge: {
    backgroundColor: COLORS.secondary + "15",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.secondaryDark,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingVertical: SPACING.md,
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
    backgroundColor: COLORS.surface,
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
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 1,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  tableIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  tableDetails: {
    justifyContent: "center",
  },
  orderRight: {
    alignItems: "flex-end",
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  cardBottom: {
    gap: 6,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemsSummaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
  },
  itemsText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
    flex: 1,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.warning + "12",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.secondaryDark,
    fontStyle: "italic",
    fontWeight: "600",
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});
