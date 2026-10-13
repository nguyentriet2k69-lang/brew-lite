import { create } from 'zustand';
import { Product, Size, Topping } from '@/app/types/product';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  size: Size;
  toppings: Topping[];
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, size: Size, toppings: Topping[], unitPrice: number) => void;
  removeItem: (cartId: string) => void;
  increaseQuantity: (cartId: string) => void;
  decreaseQuantity: (cartId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  addItem: (product, size, toppings, unitPrice) =>
    set((state) => {
      const toppingIds = toppings
        .map((topping) => topping.id)
        .sort((left, right) => String(left).localeCompare(String(right)));
      const cartId = JSON.stringify([product.id, size, toppingIds]);
      const existingItem = state.items.find((item) => item.cartId === cartId);

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }

      return {
        items: [...state.items, { ...product, cartId, quantity: 1, size, toppings, unitPrice }],
      };
    }),

  removeItem: (cartId) =>
    set((state) => ({
      items: state.items.filter((item) => item.cartId !== cartId),
    })),

  increaseQuantity: (cartId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
      ),
    })),

  decreaseQuantity: (cartId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.cartId === cartId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    })),

  clearCart: () => set({ items: [] }),
}));