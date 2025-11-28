// Performance monitoring utilities
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName: string, fn: () => void) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    } else {
      fn();
    }
  },

  // Report Web Vitals
  reportWebVitals: (metric: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }
  },

  // Lazy load with intersection observer
  createLazyLoader: (callback: () => void, options?: IntersectionObserverInit) => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      return new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      }, options);
    }
    return null;
  },
};