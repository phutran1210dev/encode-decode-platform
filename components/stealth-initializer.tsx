"use client"

import { useEffect } from 'react';

// Client-side component to initialize stealth mode
export function StealthInitializer() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Dynamic import to ensure client-side only
    const initializeStealth = async () => {
      try {
        // Import request interceptor dynamically
        const { getRequestInterceptor } = await import('@/lib/request-interceptor');
        
        const interceptor = getRequestInterceptor();
        
        // Check if stealth should be activated
        const urlParams = new URLSearchParams(window.location.search);
        const isStealthMode = 
          process.env.NODE_ENV === 'production' ||
          urlParams.has('stealth') ||
          localStorage.getItem('stealth-mode') === 'true';
        
        if (isStealthMode && !interceptor.isStealthActive()) {
          // Add random delay for stealth activation
          const delay = Math.random() * 1000 + 500; // 500-1500ms
          setTimeout(() => {
            interceptor.activate();
          }, delay);
        }
        
        console.log('🥷 Stealth capabilities loaded');
      } catch (error) {
        console.warn('Failed to load stealth capabilities:', error);
      }
    };
    
    initializeStealth();
  }, []);

  return null; // This component doesn't render anything
}