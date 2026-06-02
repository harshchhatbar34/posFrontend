// ============ App Constants ============

// Change this to your actual backend URL when deploying
export const API_BASE_URL = "https://pos-backend-jeg5.vercel.app"; // Android emulator localhost
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
  primary: "#10B981",       // Emerald Green
  primaryDark: "#059669",
  primaryLight: "#059669",  // Slightly darker green for contrast
  secondary: "#F59E0B",     // Amber
  secondaryDark: "#D97706",
  success: "#10B981",       // Emerald
  warning: "#F59E0B",       // Amber
  danger: "#EF4444",        // Red
  info: "#3B82F6",          // Blue
  
  background: "#FFFFFF",    // Pure white background
  surface: "#F8FAFC",       // Off-white/very light slate surface
  surfaceLight: "#F1F5F9",  // Light grey highlights
  card: "#FFFFFF",          // White card
  
  text: "#0F172A",          // Slate 900 (Dark text)
  textSecondary: "#475569", // Slate 600
  textMuted: "#94A3B8",     // Slate 400
  
  border: "#E2E8F0",        // Slate 200 border
  divider: "#F1F5F9",       // Slate 100 divider
  
  white: "#FFFFFF",
  black: "#000000",
  
  // Status colors
  statusPending: "#D97706",   // Darker amber for contrast
  statusInProgress: "#2563EB", // Darker blue for contrast
  statusCompleted: "#059669",  // Darker green for contrast
  statusServed: "#7C3AED",     // Darker purple for contrast
  statusCancelled: "#DC2626",  // Darker red for contrast
  
  // Order item status colors
  itemPending: "#D97706",
  itemUnderCook: "#2563EB",
  itemCooked: "#059669",
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
