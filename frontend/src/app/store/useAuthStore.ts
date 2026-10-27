'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, AuthUser } from '@/app/types/auth';
import { useCartStore } from './useCartStore'; 

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (session: AuthResponse) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      
      setSession: ({ accessToken, user }) => {
        set({ accessToken, user });
        // Đăng nhập -> Lấy giỏ hàng của user này từ kho ra
        useCartStore.getState().switchUser(user.id); 
      },
      
      clearSession: () => {
        set({ accessToken: null, user: null });
        // Đăng xuất -> Cất giỏ hàng hiện tại vào kho và chuyển về khách
        useCartStore.getState().switchUser(null); 
      },
    }),
    { name: 'brew-lite-auth', skipHydration: true },
  ),
);