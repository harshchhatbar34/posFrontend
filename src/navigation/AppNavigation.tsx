import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../constants";
import { useAuthStore } from "../store/auth-store";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useNavigationStore } from "../store/navigation-store";
import SidebarDrawer from "../components/SidebarDrawer";

export const navigationRef = createNavigationContainerRef();

// Screens
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SectionsScreen from "../screens/SectionsScreen";
import TablesScreen from "../screens/TablesScreen";
import ProductListingScreen from "../screens/ProductListingScreen";
import CartScreen from "../screens/CartScreen";
import OrdersScreen from "../screens/OrdersScreen";
import KitchenScreen from "../screens/KitchenScreen";
import InventoryScreen from "../screens/InventoryScreen";
import ReportsScreen from "../screens/ReportsScreen";
import UsersScreen from "../screens/UsersScreen";
import ProductsScreen from "../screens/ProductsScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import CategoriesScreen from "../screens/CategoriesScreen";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.background },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: "600" as const, fontSize: 17 },
  contentStyle: { backgroundColor: COLORS.background },
  headerShadowVisible: false,
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

const menuButtonLeft = () => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={() => useNavigationStore.getState().openSidebar()}
    style={{
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: COLORS.surfaceLight,
      borderWidth: 1,
      borderColor: COLORS.border,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 5,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    }}
  >
    <Ionicons name="menu-outline" size={22} color={COLORS.primary} />
  </TouchableOpacity>
);

const backAndMenuButtons = ({ navigation }: any) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 5 }}>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => useNavigationStore.getState().openSidebar()}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Ionicons name="menu-outline" size={22} color={COLORS.primary} />
    </TouchableOpacity>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.goBack()}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Ionicons name="arrow-back" size={20} color={COLORS.text} />
    </TouchableOpacity>
  </View>
);

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Jay Goga Cafe", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Sections" component={SectionsScreen} options={{ title: "Sections", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Tables" component={TablesScreen} options={({ navigation }) => ({ title: "Select Table", headerLeft: () => backAndMenuButtons({ navigation }) })} />
      <Stack.Screen name="ProductListing" component={ProductListingScreen} options={({ navigation }) => ({ title: "Add Products", headerLeft: () => backAndMenuButtons({ navigation }) })} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Order Summary" }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "Orders", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Kitchen" component={KitchenScreen} options={{ title: "Kitchen Dashboard", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: "Inventory", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Users" component={UsersScreen} options={{ title: "Users", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Products" component={ProductsScreen} options={{ title: "Products", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: "Categories", headerLeft: menuButtonLeft }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order Detail" }} />
    </Stack.Navigator>
  );
}

function AppStackWrapper() {
  return (
    <View style={{ flex: 1 }}>
      <AppStack />
      <SidebarDrawer />
    </View>
  );
}

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#22c55e",
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        minHeight: 48,
        width: "auto",
        maxWidth: 320,
        alignSelf: "flex-start",
        marginLeft: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={{ fontSize: 13, fontWeight: "400", color: COLORS.text }}
      text2Style={{ fontSize: 12, fontWeight: "400", color: COLORS.textSecondary }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#ef4444",
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        minHeight: 48,
        width: "auto",
        maxWidth: 320,
        alignSelf: "flex-start",
        marginLeft: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={{ fontSize: 13, fontWeight: "400", color: COLORS.text }}
      text2Style={{ fontSize: 12, fontWeight: "400", color: COLORS.textSecondary }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#3b82f6",
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        minHeight: 48,
        width: "auto",
        maxWidth: 320,
        alignSelf: "flex-start",
        marginLeft: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={{ fontSize: 13, fontWeight: "400", color: COLORS.text }}
      text2Style={{ fontSize: 12, fontWeight: "400", color: COLORS.textSecondary }}
    />
  ),
};

export default function AppNavigation() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.background,
      text: COLORS.text,
      border: COLORS.border,
      notification: COLORS.primary,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        {isAuthenticated ? <AppStackWrapper /> : <AuthStack />}
      </NavigationContainer>
      <Toast config={toastConfig} />
    </View>
  );
}
