// Request interceptor to automatically apply stealth techniques
// Monkey-patch fetch to use stealth by default

import { stealthAPI } from './stealth-api';

class RequestInterceptor {
  private originalFetch: typeof fetch;
  private isActive: boolean = false;
  
  constructor() {
    this.originalFetch = window.fetch.bind(window);
  }
  
  // Activate stealth mode for all requests
  activate(): void {
    if (this.isActive) return;
    
    // Override global fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Skip stealth for same-origin requests to avoid breaking the app
      if (this.isSameOrigin(url)) {
        return this.originalFetch(input, init);
      }
      
      // Apply stealth for external requests
      try {
        return await stealthAPI.stealthFetch(url, init);
      } catch (error) {
        // Fallback to original fetch on error
        console.warn('Stealth fetch failed, falling back to normal fetch:', error);
        return this.originalFetch(input, init);
      }
    };
    
    this.isActive = true;
    console.log('🥷 Stealth mode activated - API requests are now obfuscated');
  }
  
  // Deactivate stealth mode
  deactivate(): void {
    if (!this.isActive) return;
    
    window.fetch = this.originalFetch;
    this.isActive = false;
    console.log('🔍 Stealth mode deactivated - Using normal fetch');
  }
  
  // Check if URL is same-origin
  private isSameOrigin(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.origin === window.location.origin;
    } catch {
      return true; // Assume same-origin for relative URLs
    }
  }
  
  // Get current status
  isStealthActive(): boolean {
    return this.isActive;
  }
}

// Create singleton interceptor
export const requestInterceptor = new RequestInterceptor();

// Auto-activate in production or when specifically enabled
if (typeof window !== 'undefined') {
  // Check for stealth mode flags
  const urlParams = new URLSearchParams(window.location.search);
  const isStealthMode = 
    process.env.NODE_ENV === 'production' ||
    urlParams.has('stealth') ||
    localStorage.getItem('stealth-mode') === 'true';
  
  if (isStealthMode) {
    // Activate after a random delay to avoid pattern detection
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    setTimeout(() => {
      requestInterceptor.activate();
    }, delay);
  }
}

export default RequestInterceptor;