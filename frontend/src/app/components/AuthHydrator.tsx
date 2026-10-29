'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function AuthHydrator() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();

    const handleAuthExpired = () => useAuthStore.getState().clearSession();
    window.addEventListener('brew-lite:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('brew-lite:auth-expired', handleAuthExpired);
  }, []);

  return null;
}
