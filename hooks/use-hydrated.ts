import { useState, useEffect } from 'react';

/**
 * Custom hook to handle hydration mismatch by ensuring component is mounted
 * This prevents SSR/client rendering differences for dynamic content
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}