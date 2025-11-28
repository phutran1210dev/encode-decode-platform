// Request interceptor to automatically apply stealth techniques
// Monkey-patch fetch to use stealth by default

import { stealthAPI } from './stealth-api';

class RequestInterceptor {
  private originalFetch: typeof fetch;
  private isActive: boolean = false;
  
  constructor() {
    this.originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;
  }
  
  // Activate stealth mode for all requests
  activate(): void {
    if (this.isActive || typeof window === 'undefined') return;
    
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
    if (!this.isActive || typeof window === 'undefined') return;
    
    window.fetch = this.originalFetch;
    this.isActive = false;
    console.log('🔍 Stealth mode deactivated - Using normal fetch');
  }
  
  // Check if URL is same-origin
  private isSameOrigin(url: string): boolean {
    if (typeof window === 'undefined') return true;
    
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

// Create lazy singleton interceptor to avoid SSR issues
let requestInterceptorInstance: RequestInterceptor | null = null;

export const getRequestInterceptor = (): RequestInterceptor => {
  if (typeof window === 'undefined') {
    // Return a dummy implementation for server-side
    return {
      activate: () => {},
      deactivate: () => {},
      isStealthActive: () => false,
    } as RequestInterceptor;
  }
  
  if (!requestInterceptorInstance) {
    requestInterceptorInstance = new RequestInterceptor();
  }
  
  return requestInterceptorInstance;
};

// Export for backward compatibility
export const requestInterceptor = getRequestInterceptor();

export default RequestInterceptor;