import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Card, LoadingSpinner, EmptyState } from "../components/ui";
import { useSections } from "../hooks/useApi";
import { Ionicons } from "@expo/vector-icons";
import { Section } from "../types";

export default function SectionsScreen({ navigation }: any) {
  const { data, isLoading, refetch } = useSections();
  const sections = data?.data || [];
  const [refreshing, setRefreshing] = React.useState(false);

  if (isLoading) return <LoadingSpinner />;

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
});
