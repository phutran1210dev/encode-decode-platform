"use client"

import { useEffect } from 'react';

// Client-side component to initialize stealth mode
export function StealthInitializer() {
  useEffect(() => {
    // Dynamic import to ensure client-side only
    import('@/lib/request-interceptor').then(() => {
      // Request interceptor will auto-activate based on conditions
      console.log('🥷 Stealth capabilities loaded');
    }).catch((error) => {
      console.warn('Failed to load stealth capabilities:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}