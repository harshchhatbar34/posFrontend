import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { useNavigationStore } from "../store/navigation-store";
import { useAuthStore } from "../store/auth-store";
import { navigationRef } from "../navigation/AppNavigation";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(width * 0.85, 300);

export default function SidebarDrawer() {
  const { isSidebarOpen, closeSidebar } = useNavigationStore();
  const { user, hasRole, logout } = useAuthStore();
  const [currentRoute, setCurrentRoute] = useState<string>("Dashboard");

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Track the active route when sidebar is opened
  useEffect(() => {
    if (isSidebarOpen && navigationRef.isReady()) {
      const activeRouteName = (navigationRef.getCurrentRoute() as any)?.name;
      if (activeRouteName) {
        setCurrentRoute(activeRouteName);
      }
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (isSidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarOpen]);

  const handleNavigate = (screenName: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(screenName as never);
      closeSidebar();
    }
  };

  const handleLogout = () => {
    closeSidebar();
    logout();
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: "home-outline" as const,
      color: COLORS.primary,
      screen: "Dashboard",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "HELPER", "CHEF"],
    },
    {
      title: "Sections",
      icon: "grid-outline" as const,
      color: COLORS.primary,
      screen: "Sections",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "HELPER"],
    },
    {
      title: "Category",
      icon: "list-outline" as const,
      color: "#14B8A6",
      screen: "Categories",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
    {
      title: "Orders",
      icon: "receipt-outline" as const,
      color: "#10B981",
      screen: "Orders",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "HELPER"],
    },
    {
      title: "Kitchen",
      icon: "flame-outline" as const,
      color: "#EF4444",
      screen: "Kitchen",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CHEF"],
    },
    {
      title: "Product",
      icon: "pricetag-outline" as const,
      color: "#F59E0B",
      screen: "Products",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
    {
      title: "Inventory",
      icon: "cube-outline" as const,
      color: "#8B5CF6",
      screen: "Inventory",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
    {
      title: "Reports",
      icon: "bar-chart-outline" as const,
      color: "#3B82F6",
      screen: "Reports",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
    {
      title: "Users",
      icon: "people-outline" as const,
      color: "#EC4899",
      screen: "Users",
      roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.some((role) => hasRole(role as any))
  );

  // Sub-component for MenuItem with hover effect
  const SidebarMenuItem = ({ item, isActive, onPress }: { item: any; isActive: boolean; onPress: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={[
          styles.menuItem,
          isActive && styles.menuItemActive,
          isHovered && styles.menuItemHovered,
        ]}
      >
        <Ionicons
          name={item.icon}
          size={22}
          color={item.color}
          style={styles.menuIcon}
        />
        <Text
          style={[
            styles.menuLabel,
            isActive && styles.menuLabelActive,
            isHovered && styles.menuLabelHovered,
          ]}
        >
          {item.title}
        </Text>
        {isActive && (
          <View style={styles.activeIndicator} />
        )}
      </Pressable>
    );
  };

  // Sub-component for Logout button with hover effect
  const LogoutButton = ({ onPress }: { onPress: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={[
          styles.logoutBtn,
          isHovered && styles.logoutBtnHovered,
        ]}
      >
        <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        <Text style={[styles.logoutText, isHovered && styles.logoutTextHovered]}>Logout</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { pointerEvents: isSidebarOpen ? "auto" : "none" },
      ]}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={closeSidebar} />
      </Animated.View>

      {/* Sidebar Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.drawerLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Jay Goga Cafe</Text>
            <Text style={styles.userName}>{user?.name || "Guest"}</Text>
            <Text style={styles.userRole}>
              {user?.role?.replace(/_/g, " ") || ""}
            </Text>
          </View>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem
              key={item.screen}
              item={item}
              isActive={currentRoute === item.screen}
              onPress={() => handleNavigate(item.screen)}
            />
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <LogoutButton onPress={handleLogout} />
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.black,
  },
  panel: {
    width: SIDEBAR_WIDTH,
    height: "100%",
    backgroundColor: COLORS.surface,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    elevation: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  brand: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  userRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "capitalize",
  },
  closeBtn: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.border + "40",
  },
  menuContainer: {
    flex: 1,
    paddingVertical: SPACING.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginVertical: 2,
    position: "relative",
  },
  menuItemActive: {
    backgroundColor: COLORS.primary + "10",
  },
  menuIcon: {
    marginRight: SPACING.md,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  menuLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.danger,
    marginLeft: SPACING.sm,
  },
  menuItemHovered: {
    backgroundColor: COLORS.border + "40",
  },
  menuLabelHovered: {
    color: COLORS.primary,
  },
  logoutBtnHovered: {
    backgroundColor: COLORS.danger + "10",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  logoutTextHovered: {
    textDecorationLine: "underline",
  },
  version: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  drawerLogo: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    marginTop: 2,
  },
});
