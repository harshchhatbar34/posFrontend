import React from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../constants";
import { useAuthStore } from "../store/auth-store";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

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

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
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

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Jay Goga POS", headerLeft: () => null }} />
      <Stack.Screen name="Sections" component={SectionsScreen} options={{ title: "Sections" }} />
      <Stack.Screen name="Tables" component={TablesScreen} options={{ title: "Select Table" }} />
      <Stack.Screen name="ProductListing" component={ProductListingScreen} options={{ title: "Add Products" }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Order Summary" }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "Orders" }} />
      <Stack.Screen name="Kitchen" component={KitchenScreen} options={{ title: "Kitchen Dashboard" }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: "Inventory" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports" }} />
      <Stack.Screen name="Users" component={UsersScreen} options={{ title: "Users" }} />
      <Stack.Screen name="Products" component={ProductsScreen} options={{ title: "Products" }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order Detail" }} />
    </Stack.Navigator>
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

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        {isAuthenticated ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
      <Toast config={toastConfig} />
    </View>
  );
}
