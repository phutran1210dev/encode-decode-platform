// Static version constants (update manually when package.json changes)
export const APP_VERSION = '0.1.0' as const;
export const APP_NAME = 'encode-decode-platform' as const;

export const getVersionString = (): string => `v${APP_VERSION}`;
export const getFullAppTitle = (): string => `${APP_NAME} ${getVersionString()}`;

// Type-safe version check
export const isVersionAtLeast = (minVersion: string): boolean => {
  const current = APP_VERSION.split('.').map(Number);
  const minimum = minVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
    const currentPart = current[i] || 0;
    const minimumPart = minimum[i] || 0;
    
    if (currentPart > minimumPart) return true;
    if (currentPart < minimumPart) return false;
  }
  
  return true;
};