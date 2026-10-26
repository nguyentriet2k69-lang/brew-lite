import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Size, Topping } from '@/app/types/product';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  size: Size;
  toppings: Topping[];
  unitPrice: number;
}

interface CartState {
  items: CartItem[]; // Giỏ hàng đang hiển thị
  ownerId: string | null; // Ai đang sở hữu giỏ hàng này
  savedCarts: Record<string, CartItem[]>; // KHO LƯU TRỮ GIỎ HÀNG CỦA TỪNG USER
  
  addItem: (product: Product, size: Size, toppings: Topping[], unitPrice: number) => void;
  removeItem: (cartId: string) => void;
  increaseQuantity: (cartId: string) => void;
  decreaseQuantity: (cartId: string) => void;
  clearCart: () => void;
  switchUser: (newOwnerId: string | null) => void; 
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      ownerId: 'guest', // Mặc định là khách vãng lai
      savedCarts: {}, // Ban đầu kho lưu trữ trống

      // Hàm đổi user: Cất giỏ hàng cũ vào kho, lấy giỏ hàng mới ra
      switchUser: (newOwnerId) =>
        set((state) => {
          const newOwner = newOwnerId || 'guest';
          const currentOwner = state.ownerId || 'guest';
          
          if (currentOwner === newOwner) return state; // Nếu trùng user thì bỏ qua

          // 1. Cất giỏ hàng hiện tại vào kho
          const updatedSavedCarts = { 
            ...state.savedCarts, 
            [currentOwner]: state.items 
          };

          // 2. Lấy giỏ hàng của user mới ra (nếu chưa có thì trả về mảng rỗng)
          const newItems = updatedSavedCarts[newOwner] || [];

          return {
            ownerId: newOwner,
            items: newItems,
            savedCarts: updatedSavedCarts,
          };
        }),

      addItem: (product, size, toppings, unitPrice) =>
        set((state) => {
          const toppingIds = toppings
            .map((topping) => topping.id)
            .sort((left, right) => String(left).localeCompare(String(right)));
          const cartId = JSON.stringify([product.id, size, toppingIds]);
          const existingItem = state.items.find((item) => item.cartId === cartId);

          let newItems;
          if (existingItem) {
            newItems = state.items.map((item) =>
              item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item,
            );
          } else {
            newItems = [...state.items, { ...product, cartId, quantity: 1, size, toppings, unitPrice }];
          }

          // Cập nhật đồng thời vào giỏ hiện tại và kho lưu trữ
          const currentOwner = state.ownerId || 'guest';
          return {
            items: newItems,
            savedCarts: { ...state.savedCarts, [currentOwner]: newItems }
          };
        }),

      removeItem: (cartId) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.cartId !== cartId);
          const currentOwner = state.ownerId || 'guest';
          return {
            items: newItems,
            savedCarts: { ...state.savedCarts, [currentOwner]: newItems }
          };
        }),

      increaseQuantity: (cartId) =>
        set((state) => {
          const newItems = state.items.map((item) =>
            item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item,
          );
          const currentOwner = state.ownerId || 'guest';
          return {
            items: newItems,
            savedCarts: { ...state.savedCarts, [currentOwner]: newItems }
          };
        }),

      decreaseQuantity: (cartId) =>
        set((state) => {
          const newItems = state.items.map((item) =>
            item.cartId === cartId && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          );
          const currentOwner = state.ownerId || 'guest';
          return {
            items: newItems,
            savedCarts: { ...state.savedCarts, [currentOwner]: newItems }
          };
        }),

      clearCart: () => set((state) => {
        const currentOwner = state.ownerId || 'guest';
        return {
          items: [],
          savedCarts: { ...state.savedCarts, [currentOwner]: [] }
        };
      }),
    }),
    { name: 'brew-lite-cart' },
  ),
);