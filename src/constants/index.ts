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
  COOKED: "COOKED",
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
  primaryLight: "#059669",  // Contrast green for highlights on light theme
  secondary: "#F59E0B",     // Amber
  secondaryDark: "#D97706",
  success: "#10B981",       // Emerald
  warning: "#F59E0B",       // Amber
  danger: "#EF4444",        // Red
  info: "#3B82F6",          // Blue
  
  background: "#FFFFFF",    // Premium pure white background
  surface: "#F9FAFB",       // Very soft gray surface
  surfaceLight: "#F3F4F6",  // Soft gray elevated surface
  card: "#FFFFFF",          // White card surface
  
  text: "#111827",          // Crisp slate black
  textSecondary: "#4B5563", // Slate gray secondary text
  textMuted: "#9CA3AF",     // Muted gray
  
  border: "#E5E7EB",        // Clean subtle light border
  divider: "#F3F4F6",       // Subtle light divider
  
  white: "#FFFFFF",
  black: "#000000",
  
  // Status colors (optimized for light theme readability)
  statusPending: "#D97706",
  statusInProgress: "#2563EB",
  statusCooked: "#059669",
  statusServed: "#7C3AED",
  statusCancelled: "#DC2626",
  
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
