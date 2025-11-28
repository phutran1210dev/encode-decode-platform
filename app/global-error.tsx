"use client"

import React from 'react';
import { useHydrated } from '@/hooks/use-hydrated';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const isHydrated = useHydrated();

  return (
    <html>
      <body>
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-6xl font-mono font-bold text-red-500 mb-4">
                CRITICAL ERROR
              </h1>
              <p className="text-xl text-red-400 font-mono">
                SYSTEM FAILURE - COMPLETE SHUTDOWN REQUIRED
              </p>
            </div>

            <div className="bg-black border border-red-500 rounded-lg p-6 mb-6">
              <div className="text-red-400 font-mono text-sm mb-4">
                FATAL ERROR DETAILS:
              </div>
              <div className="text-red-300 font-mono text-sm space-y-2">
                <div>Error: {error.name || 'Unknown Fatal Error'}</div>
                <div>Message: {error.message}</div>
                {error.digest && <div>Digest: {error.digest}</div>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={reset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-mono transition-colors"
              >
                EMERGENCY RESTART
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded font-mono transition-colors border border-gray-600"
              >
                FORCE RELOAD
              </button>
            </div>

            <div className="text-center mt-8">
              <p className="text-red-600 font-mono text-xs">
                GLOBAL_ERROR | {isHydrated ? new Date().toISOString() : 'INITIALIZING...'}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}