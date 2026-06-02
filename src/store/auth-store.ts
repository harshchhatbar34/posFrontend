import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { User, Role } from "../types";

const setItem = async (key: string, value: string) => {
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
};

const getItem = async (key: string) => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const deleteItem = async (key: string) => {
  if (Platform.OS === "web") localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
};

// ============ Auth Store (Zustand) ============

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadStoredAuth: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
    try {
      await setItem("accessToken", accessToken);
      await setItem("refreshToken", refreshToken);
      await setItem("user", JSON.stringify(user));
    } catch (e) {
      console.error("Failed to store auth:", e);
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    try {
      await setItem("accessToken", accessToken);
      await setItem("refreshToken", refreshToken);
    } catch (e) {
      console.error("Failed to store tokens:", e);
    }
  },

  logout: async () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    try {
      await deleteItem("accessToken");
      await deleteItem("refreshToken");
      await deleteItem("user");
    } catch (e) {
      console.error("Failed to clear auth:", e);
    }
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, userStr] = await Promise.all([
        getItem("accessToken"),
        getItem("refreshToken"),
        getItem("user"),
      ]);

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr) as User;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error("Failed to load auth:", e);
      set({ isLoading: false });
    }
  },

  hasRole: (...roles) => {
    const user = get().user;
    return user ? roles.includes(user.role) : false;
  },

  isAdmin: () => {
    const user = get().user;
    return user ? ["SUPER_ADMIN", "ADMIN"].includes(user.role) : false;
  },
}));
