// ============ App Constants ============

// Change this to your actual backend URL when deploying
export const API_BASE_URL = "https://posbackend-8elh.onrender.com"; // Android emulator localhost
// export const API_BASE_URL = "http://localhost:3000"; // iOS simulator
// export const API_BASE_URL = "https://your-api.com"; // Production

export const SOCKET_URL = API_BASE_URL;

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CHEF: "CHEF",
  HELPER: "HELPER",
} as const;

export const ORDER_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  SERVED: "SERVED",
  CANCELLED: "CANCELLED",
} as const;

export const ORDER_ITEM_STATUSES = {
  PENDING: "PENDING",
  UNDER_COOK: "UNDER_COOK",
  COOKED: "COOKED",
} as const;

export const PAYMENT_METHODS = {
  CASH: "CASH",
  ONLINE: "ONLINE",
} as const;

// Color palette
export const COLORS = {
  primary: "#6366F1",       // Indigo
  primaryDark: "#4F46E5",
  primaryLight: "#818CF8",
  secondary: "#F59E0B",     // Amber
  secondaryDark: "#D97706",
  success: "#10B981",       // Emerald
  warning: "#F59E0B",       // Amber
  danger: "#EF4444",        // Red
  info: "#3B82F6",          // Blue
  
  background: "#0F172A",    // Slate 900
  surface: "#1E293B",       // Slate 800
  surfaceLight: "#334155",  // Slate 700
  card: "#1E293B",
  
  text: "#F8FAFC",          // Slate 50
  textSecondary: "#94A3B8", // Slate 400
  textMuted: "#64748B",     // Slate 500
  
  border: "#334155",        // Slate 700
  divider: "#1E293B",
  
  white: "#FFFFFF",
  black: "#000000",
  
  // Status colors
  statusPending: "#F59E0B",
  statusInProgress: "#3B82F6",
  statusCompleted: "#10B981",
  statusServed: "#8B5CF6",
  statusCancelled: "#EF4444",
  
  // Order item status colors
  itemPending: "#F59E0B",
  itemUnderCook: "#3B82F6",
  itemCooked: "#10B981",
} as const;

export const FONTS = {
  regular: "System",
  medium: "System",
  bold: "System",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
