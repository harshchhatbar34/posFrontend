import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, Button, LoadingSpinner, Badge } from "../components/ui";
import { useProducts, useCategories } from "../hooks/useApi";
import { useCartStore } from "../store/cart-store";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "../types";
import { useIsFocused } from "@react-navigation/native";

export default function ProductListingScreen({ navigation, route }: any) {
  const isFocused = useIsFocused();
  const { sectionId, sectionName, tableNumber } = route.params;
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { data: productsData, isLoading } = useProducts({
    sectionId,
    ...(selectedCategory ? { categoryId: selectedCategory } : {}),
    isAvailable: "true",
  }, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const { data: categoriesData } = useCategories(undefined, { refetchInterval: isFocused ? 10000 : false, enabled: isFocused });
  const products = (Array.isArray(productsData?.data) ? [...productsData.data] : []).sort((a, b) => a.name.localeCompare(b.name));
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const { addItem, items, getItemCount, getTotal } = useCartStore();

  if (isLoading) return <LoadingSpinner />;

  const getCartQty = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    return item?.quantity || 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{sectionName} - Table #{tableNumber}</Text>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: undefined, name: "All" }, ...categories]}
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}
        keyExtractor={(item) => item.id || "all"}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, selectedCategory === item.id && styles.catChipActive]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={[styles.catText, selectedCategory === item.id && styles.catTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Product Grid */}
      <FlatList
        data={products}
        numColumns={2}
        contentContainerStyle={{ padding: SPACING.md }}
        columnWrapperStyle={{ gap: SPACING.sm }}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Product }) => {
          const qty = getCartQty(item.id);
          return (
            <TouchableOpacity
              style={[styles.productCard, qty > 0 && styles.productCardActive]}
              activeOpacity={0.7}
              onPress={() => addItem(item)}
            >
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>₹{item.price}</Text>
              <Text style={styles.productCategory}>{item.category?.name}</Text>
              {qty > 0 && (
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{qty}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Cart Footer */}
      {getItemCount() > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Cart")}
        >
          <View style={styles.cartInfo}>
            <Ionicons name="cart" size={22} color={COLORS.white} />
            <Text style={styles.cartCount}>{getItemCount()} items</Text>
          </View>
          <Text style={styles.cartTotal}>₹{getTotal()} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  catTextActive: { color: COLORS.white },
  productCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border },
  productCardActive: { borderColor: COLORS.primary },
  productName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  productPrice: { fontSize: 18, fontWeight: "800", color: COLORS.success, marginTop: 4 },
  productCategory: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  qtyBadge: { position: "absolute", top: -6, right: -6, backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  qtyText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  cartBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.primary, padding: SPACING.md, paddingHorizontal: SPACING.lg, marginHorizontal: SPACING.md, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  cartInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  cartCount: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  cartTotal: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
});
