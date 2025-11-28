"use client"

import React from 'react';
import { MatrixButton, MatrixCard } from '@/components/atoms';
import { GlitchText, TypingText } from '@/components/matrix-effects';
import MatrixRain from '@/components/matrix-effects';
import { Terminal, RefreshCw, AlertTriangle, Bug } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import { useHydrated } from '@/hooks/use-hydrated';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const isHydrated = useHydrated();

  return (
    <div className="min-h-screen relative">
      <MatrixRain />
      
      <div className="container mx-auto p-6 max-w-4xl relative z-10">
        <div className="min-h-screen flex items-center justify-center">
          <MatrixCard 
            title="SYSTEM MALFUNCTION"
            description="[CRITICAL ERROR - SYSTEM COMPROMISED]"
            icon={Bug}
            className="w-full max-w-2xl text-center"
          >
            <div className="space-y-6">
              {/* Error Code */}
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-red-400 glow-text mb-4">
                  <GlitchText text="ERROR" />
                </div>
                <div className="text-xl font-mono text-red-500/80 mb-6">
                  <TypingText 
                    text="UNEXPECTED SYSTEM BREACH DETECTED"
                    delay={500}
                    speed={50}
                  />
                </div>
              </div>

              {/* Error Details */}
              <div className="bg-black/30 border border-red-500/30 rounded-md p-4 text-left font-mono text-sm">
                <div className="text-red-400 mb-2">
                  <Terminal className="inline h-4 w-4 mr-2" />
                  ERROR DIAGNOSTICS:
                </div>
                <div className="text-red-500/70 space-y-1 ml-6">
                  <div>→ Error type: <span className="text-red-300">{error.name || 'Unknown'}</span></div>
                  <div>→ Error message: <span className="text-yellow-300">{error.message}</span></div>
                  {error.digest && (
                    <div>→ Error digest: <span className="text-blue-300">{error.digest}</span></div>
                  )}
                  <div>→ Status: <span className="text-red-400">SYSTEM_UNSTABLE</span></div>
                </div>
              </div>

              {/* Stack trace (only in development) */}
              {process.env.NODE_ENV === 'development' && error.stack && (
                <details className="bg-black/50 border border-red-500/20 rounded-md">
                  <summary className="p-3 text-red-400 font-mono text-sm cursor-pointer hover:bg-red-500/10">
                    → STACK_TRACE [CLICK_TO_EXPAND]
                  </summary>
                  <pre className="p-3 text-xs text-red-300/60 font-mono overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}

              {/* Recovery animation */}
              <div className="text-center py-4">
                <div className="text-yellow-500/60 font-mono text-sm">
                  <TypingText 
                    text="INITIATING RECOVERY PROTOCOLS..."
                    delay={2000}
                    speed={80}
                  />
                </div>
                <div className="mt-2 text-green-600/40 font-mono text-xs">
                  <TypingText 
                    text="[░░░░░████░] RECOVERY READY - AWAITING USER ACTION"
                    delay={4000}
                    speed={100}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <MatrixButton 
                  icon={RefreshCw} 
                  onClick={reset}
                  className="w-full sm:w-auto"
                >
                  RESTART SYSTEM
                </MatrixButton>
                
                <MatrixButton 
                  variant="outline" 
                  icon={Terminal}
                  onClick={() => window.location.href = '/'}
                  className="w-full sm:w-auto"
                >
                  EMERGENCY EXIT
                </MatrixButton>
              </div>

              {/* Warning Message */}
              <div className="text-center pt-6 border-t border-red-500/30">
                <div className="flex items-center justify-center gap-2 text-yellow-500/80 font-mono text-sm mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <TypingText 
                    text="WARNING: SYSTEM MAY BE UNSTABLE"
                    delay={6000}
                    speed={60}
                  />
                </div>
                <div className="text-red-600/60 font-mono text-xs">
                  <TypingText 
                    text="Contact system administrator if error persists"
                    delay={8000}
                    speed={80}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="text-red-600/30 font-mono text-xs">
                ERROR_ID: {error.digest || 'UNKNOWN'} | v{APP_VERSION} | TIMESTAMP: {isHydrated ? new Date().toISOString() : 'INITIALIZING...'}
              </div>
            </div>
          </MatrixCard>
        </div>
      </div>
    </div>
  );
}