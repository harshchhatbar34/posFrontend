import { create } from "zustand";
import { CartItem, Product } from "../types";

// ============ Cart Store (Zustand) ============

interface CartState {
  items: CartItem[];
  tableId: string | null;
  sectionId: string | null;
  notes: string;

  // Actions
  setTable: (tableId: string, sectionId: string) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  sectionId: null,
  notes: "",

  setTable: (tableId, sectionId) => set({ tableId, sectionId }),

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((item) => item.product.id === product.id);

    if (existing) {
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...items, { product, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  setNotes: (notes) => set({ notes }),

  clearCart: () => set({ items: [], tableId: null, sectionId: null, notes: "" }),

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
