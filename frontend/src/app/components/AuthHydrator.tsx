'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function AuthHydrator() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  return null;
}
