// Stealth API utility to obfuscate and hide API requests
// Anti-detection techniques for API calls

import { hiddenAPI } from './hidden-api';

interface StealthConfig {
  useRandomDelays: boolean;
  useProxyRotation: boolean;
  obfuscateHeaders: boolean;
  fragmentRequests: boolean;
}

class StealthAPIService {
  private config: StealthConfig;
  private userAgents: string[];
  private lastRequestTime: number = 0;
  
  constructor(config: Partial<StealthConfig> = {}) {
    this.config = {
      useRandomDelays: true,
      useProxyRotation: false,
      obfuscateHeaders: true,
      fragmentRequests: false,
      ...config
    };
    
    // Common user agents pool
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
  }
  
  // Generate random delay between requests
  private async randomDelay(): Promise<void> {
    if (!this.config.useRandomDelays) return;
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 100; // 100ms minimum
    const maxDelay = 2000; // 2s maximum
    
    if (timeSinceLastRequest < minDelay) {
      const additionalDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      await new Promise(resolve => setTimeout(resolve, additionalDelay));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  // Get random user agent
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  // Generate obfuscated headers
  private generateStealthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.obfuscateHeaders) {
      headers['User-Agent'] = this.getRandomUserAgent();
      headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
      headers['Accept-Language'] = 'en-US,en;q=0.5';
      headers['Accept-Encoding'] = 'gzip, deflate, br';
      headers['DNT'] = '1';
      headers['Connection'] = 'keep-alive';
      headers['Upgrade-Insecure-Requests'] = '1';
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'none';
      headers['Sec-Fetch-User'] = '?1';
      headers['Cache-Control'] = 'max-age=0';
      
      // Add random custom headers to look more natural
      const customHeaders = [
        ['X-Requested-With', 'XMLHttpRequest'],
        ['X-Client-Version', `${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 100)}`],
        ['X-Session-ID', this.generateRandomID()]
      ];
      
      // Randomly include some custom headers
      customHeaders.forEach(([key, value]) => {
        if (Math.random() > 0.5) {
          headers[key] = value;
        }
      });
    }
    
    return headers;
  }
  
  // Generate random session ID
  private generateRandomID(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  // Obfuscate URL parameters
  private obfuscateURL(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Add dummy parameters to mask real ones
      const dummyParams = [
        ['_t', Date.now().toString()],
        ['_r', Math.random().toString()],
        ['_v', '1.0'],
        ['_s', this.generateRandomID()],
      ];
      
      dummyParams.forEach(([key, value]) => {
        if (Math.random() > 0.3) { // 70% chance to add each dummy param
          urlObj.searchParams.set(key, value);
        }
      });
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  // Fragment large requests into smaller chunks
  private async fragmentedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.config.fragmentRequests) {
      return fetch(url, options);
    }
    
    // For now, just use regular fetch
    // In future, could implement request chunking
    return fetch(url, options);
  }
  
  // Main stealth fetch method
  async stealthFetch(url: string, options: RequestInit = {}): Promise<Response> {
    await this.randomDelay();
    
    const stealthHeaders = this.generateStealthHeaders();
    const obfuscatedURL = this.obfuscateURL(url);
    
    const stealthOptions: RequestInit = {
      ...options,
      headers: {
        ...stealthHeaders,
        ...options.headers,
        'X-Hidden-Request': 'true', // Mark for hidden API
      },
    };
    
    // Add random jitter to avoid pattern detection
    const jitter = Math.random() * 50; // 0-50ms jitter
    await new Promise(resolve => setTimeout(resolve, jitter));
    
    try {
      // Use hidden API for maximum stealth
      return await this.fragmentedFetch(obfuscatedURL, stealthOptions);
    } catch {
      // On failure, retry once with basic headers but still hidden
      const basicOptions: RequestInit = {
        ...options,
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'X-Hidden-Request': 'true',
          ...options.headers,
        },
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      return await fetch(url, basicOptions);
    }
  }
  
  // Stealth POST with data obfuscation
  async stealthPost(url: string, data: unknown, options: RequestInit = {}): Promise<Response> {
    const obfuscatedData = this.obfuscateData(data);
    
    return this.stealthFetch(url, {
      method: 'POST',
      body: JSON.stringify(obfuscatedData),
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
  }
  
  // Obfuscate request data
  private obfuscateData(data: unknown): unknown {
    if (!data || typeof data !== 'object' || data === null) return data;
    
    // Add dummy fields to mask real data
    const obfuscated: Record<string, unknown> = {
      ...(data as Record<string, unknown>),
      _timestamp: Date.now(),
      _client: 'web',
      _version: '1.0.0',
      _noise: Math.random().toString(36),
    };
    
    // Randomly reorder fields
    const keys = Object.keys(obfuscated);
    const shuffled: Record<string, unknown> = {};
    
    // Fisher-Yates shuffle
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    
    keys.forEach(key => {
      shuffled[key] = obfuscated[key];
    });
    
    return shuffled;
  }
  
  // Clean response data (remove obfuscation)
  cleanResponse(data: unknown): unknown {
    if (!data || typeof data !== 'object' || data === null) return data;
    
    const cleaned = { ...(data as Record<string, unknown>) } as Record<string, unknown>;
    
    // Remove dummy fields
    delete cleaned._timestamp;
    delete cleaned._client;
    delete cleaned._version;
    delete cleaned._noise;
    
    return cleaned;
  }
}

// Create singleton instance
export const stealthAPI = new StealthAPIService({
  useRandomDelays: true,
  obfuscateHeaders: true,
  fragmentRequests: false,
  useProxyRotation: false,
});

// Utility functions for easier usage
export const stealthFetch = (url: string, options?: RequestInit) => 
  stealthAPI.stealthFetch(url, options);

export const stealthPost = (url: string, data: unknown, options?: RequestInit) => 
  stealthAPI.stealthPost(url, data, options);

export default StealthAPIService;