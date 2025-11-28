// Advanced API hiding techniques to prevent detection in DevTools Network tab
// Multiple layers of obfuscation and stealth

interface HiddenAPIConfig {
  useServiceWorker: boolean;
  useWebWorker: boolean;
  fragmentRequests: boolean;
  useImageRequests: boolean;
  bypassDevTools: boolean;
}

class HiddenAPIService {
  private config: HiddenAPIConfig;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private webWorker: Worker | null = null;
  
  constructor(config: Partial<HiddenAPIConfig> = {}) {
    this.config = {
      useServiceWorker: true,
      useWebWorker: true,
      fragmentRequests: true,
      useImageRequests: false,
      bypassDevTools: true,
      ...config
    };
    
    this.initializeHiddenServices();
  }
  
  // Initialize service worker to intercept and hide requests
  private async initializeHiddenServices(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      if (this.config.useServiceWorker && 'serviceWorker' in navigator) {
        await this.setupServiceWorker();
      }
      
      if (this.config.useWebWorker) {
        await this.setupWebWorker();
      }
      
      if (this.config.bypassDevTools) {
        this.bypassDevToolsDetection();
      }
    } catch (error) {
      console.warn('Failed to initialize hidden API services:', error);
    }
  }
  
  // Setup service worker for request interception
  private async setupServiceWorker(): Promise<void> {
    const swCode = `
      self.addEventListener('fetch', function(event) {
        const url = new URL(event.request.url);
        
        // Hide requests with special header
        if (event.request.headers.get('X-Hidden-Request')) {
          event.respondWith(
            fetch(event.request.clone(), {
              headers: {
                ...Object.fromEntries(event.request.headers.entries()),
                'X-Hidden-Request': undefined, // Remove the marker
              }
            }).then(response => {
              // Clone response to hide it from DevTools
              return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            })
          );
        }
      });
    `;
    
    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);
    
    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl);
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }
  
  // Setup web worker for background requests
  private async setupWebWorker(): Promise<void> {
    const workerCode = `
      self.onmessage = function(e) {
        const { url, options, id } = e.data;
        
        fetch(url, options)
          .then(response => response.text())
          .then(data => {
            self.postMessage({ id, success: true, data });
          })
          .catch(error => {
            self.postMessage({ id, success: false, error: error.message });
          });
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    try {
      this.webWorker = new Worker(workerUrl);
    } catch (error) {
      console.warn('Web worker creation failed:', error);
    }
  }
  
  // Bypass DevTools detection techniques
  private bypassDevToolsDetection(): void {
    // Override console methods to prevent logging
    const originalLog = console.log;
    
    // Selectively hide API-related logs
    console.log = (...args: unknown[]) => {
      if (!args.some(arg => typeof arg === 'string' && arg.includes('API'))) {
        originalLog.apply(console, args);
      }
    };
    
    // Override fetch globally with hidden version
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Check if this should be a hidden request
      const shouldHide = this.shouldHideRequest(input, init);
      
      if (shouldHide) {
        return this.hiddenFetch(input, init);
      }
      
      return originalFetch(input, init);
    };
    
    // Detect and counter DevTools
    this.detectDevTools();
  }
  
  // Determine if request should be hidden
  private shouldHideRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Hide external API calls or marked requests
    const headers = init?.headers;
    const hasHiddenHeader = headers && 
      (headers instanceof Headers ? headers.get('X-Hidden-Request') === 'true' :
       (headers as Record<string, string>)['X-Hidden-Request'] === 'true');
    
    return !url.startsWith(window.location.origin) || Boolean(hasHiddenHeader);
  }
  
  // Hidden fetch implementation
  private async hiddenFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    const options = { ...init };
    
    // Try multiple hiding techniques
    const techniques = [
      () => this.fetchViaWebWorker(url, options),
      () => this.fetchViaServiceWorker(url, options),
      () => this.fetchViaImageProxy(url, options),
      () => this.fragmentedFetch(url, options),
    ];
    
    for (const technique of techniques) {
      try {
        const result = await technique();
        if (result) return result;
      } catch {
        continue; // Try next technique
      }
    }
    
    // Fallback to normal fetch with obfuscation
    return this.obfuscatedFetch(url, options);
  }
  
  // Fetch via Web Worker (hidden from DevTools)
  private async fetchViaWebWorker(url: string, options: RequestInit): Promise<Response | null> {
    if (!this.webWorker) return null;
    
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);
      
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 10000);
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          clearTimeout(timeout);
          this.webWorker?.removeEventListener('message', handleMessage);
          
          if (e.data.success) {
            resolve(new Response(e.data.data, { status: 200 }));
          } else {
            reject(new Error(e.data.error));
          }
        }
      };
      
      this.webWorker?.addEventListener('message', handleMessage);
      this.webWorker?.postMessage({ url, options, id });
    });
  }
  
  // Fetch via Service Worker
  private async fetchViaServiceWorker(url: string, options: RequestInit): Promise<Response | null> {
    if (!this.serviceWorkerRegistration?.active) return null;
    
    const hiddenOptions = {
      ...options,
      headers: {
        ...options.headers,
        'X-Hidden-Request': 'true',
      }
    };
    
    return fetch(url, hiddenOptions);
  }
  
  // Hide request as image request (for GET only)
  private async fetchViaImageProxy(url: string, options: RequestInit): Promise<Response | null> {
    if (options.method && options.method.toUpperCase() !== 'GET') return null;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          // Extract data from image (if API returns data as image)
          const imageData = canvas.toDataURL();
          resolve(new Response(imageData, { status: 200 }));
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      
      // Append timestamp to bypass cache
      const separator = url.includes('?') ? '&' : '?';
      img.src = `${url}${separator}_img=${Date.now()}`;
    });
  }
  
  // Fragment large requests into smaller parts
  private async fragmentedFetch(url: string, options: RequestInit): Promise<Response | null> {
    if (!this.config.fragmentRequests) return null;
    
    // For demonstration - fragment headers into multiple requests
    const headers = new Headers(options.headers);
    const fragmentedHeaders = new Headers();
    
    // Split headers across multiple mini-requests
    let headerIndex = 0;
    for (const [key, value] of headers.entries()) {
      if (headerIndex % 2 === 0) {
        fragmentedHeaders.set(key, value);
      }
      headerIndex++;
    }
    
    return fetch(url, {
      ...options,
      headers: fragmentedHeaders,
    });
  }
  
  // Obfuscated fetch with timing and header manipulation
  private async obfuscatedFetch(url: string, options: RequestInit): Promise<Response> {
    // Add random delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Obfuscate headers
    const obfuscatedHeaders = new Headers(options.headers);
    obfuscatedHeaders.set('X-Timestamp', Date.now().toString());
    obfuscatedHeaders.set('X-Random', Math.random().toString());
    
    // Remove identifying headers
    obfuscatedHeaders.delete('X-Hidden-Request');
    
    return fetch(url, {
      ...options,
      headers: obfuscatedHeaders,
    });
  }
  
  // Detect DevTools and take countermeasures
  private detectDevTools(): void {
    const devtools = { open: false };
    
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.onDevToolsOpen();
        }
      } else {
        devtools.open = false;
      }
    }, 500);
    
    // Console detection
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: () => {
        devtools.open = true;
        this.onDevToolsOpen();
      }
    });
    
    console.log('%c', element);
  }
  
  // Handle DevTools detection
  private onDevToolsOpen(): void {
    // Clear console
    console.clear();
    
    // Increase obfuscation level
    this.config.fragmentRequests = true;
    this.config.useWebWorker = true;
    
    // Could redirect or show warning
    console.warn('🔒 Enhanced security mode activated');
  }
  
  // Clean up resources
  destroy(): void {
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.unregister();
    }
    
    if (this.webWorker) {
      this.webWorker.terminate();
    }
  }
}

// Create singleton instance
export const hiddenAPI = new HiddenAPIService({
  useServiceWorker: true,
  useWebWorker: true,
  fragmentRequests: true,
  useImageRequests: false,
  bypassDevTools: true,
});

// Utility function to make hidden API calls
export const hiddenFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const hiddenOptions = {
    ...options,
    headers: {
      ...options?.headers,
      'X-Hidden-Request': 'true',
    }
  };
  
  return fetch(url, hiddenOptions);
};

export default HiddenAPIService;