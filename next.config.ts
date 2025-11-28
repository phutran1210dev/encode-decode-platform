import type { NextConfig } from "next";

// Bundle analyzer setup
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* React Compiler */
  reactCompiler: true,
  
  /* Performance Optimizations */
  experimental: {
    // Enable React 19 features
    ppr: false, // Partial Pre-rendering
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  /* External Packages */
  serverExternalPackages: ['animejs'],
  
  /* Output for Vercel */
  output: 'standalone',

  /* Turbopack Configuration */
  turbopack: {
    resolveAlias: {
      '@/components': './components',
      '@/lib': './lib',
      '@/hooks': './hooks',
      '@/types': './types',
    },
  },
  
  /* Build Optimizations */
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  /* Fallback webpack config for non-Turbopack builds */
  webpack: (config, { dev, isServer }) => {
    // Only apply webpack optimizations if not using Turbopack
    if (!process.env.TURBOPACK && !dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              maxSize: 244000,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              maxSize: 244000,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  /* Image Optimization */
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  /* Headers for Security and Performance */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
