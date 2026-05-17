import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../constants";
import { useAuthStore } from "../store/auth-store";

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
    </Stack.Navigator>
  );
}

export default function AppNavigation() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
