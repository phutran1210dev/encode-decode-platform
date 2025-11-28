"use client"

import React from 'react';
import Link from 'next/link';
import { MatrixButton, MatrixCard } from '@/components/atoms';
import { GlitchText, TypingText } from '@/components/matrix-effects';
import MatrixRain from '@/components/matrix-effects';
import { Terminal, Home, AlertTriangle, Search } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import { useHydrated } from '@/hooks/use-hydrated';

export default function NotFound() {
  const isHydrated = useHydrated();

  return (
    <div className="min-h-screen relative">
      <MatrixRain />
      
      <div className="container mx-auto p-6 max-w-4xl relative z-10">
        <div className="min-h-screen flex items-center justify-center">
          <MatrixCard 
            title="ACCESS DENIED"
            description="[SYSTEM ERROR - RESOURCE NOT FOUND]"
            icon={AlertTriangle}
            className="w-full max-w-2xl text-center"
          >
            <div className="space-y-6">
              {/* Error Code */}
              <div className="text-center">
                <div className="text-8xl font-mono font-bold text-green-400 glow-text mb-4">
                  <GlitchText text="404" />
                </div>
                <div className="text-2xl font-mono text-green-500/80 mb-6">
                  <TypingText 
                    text="UNAUTHORIZED ACCESS TO RESTRICTED AREA"
                    delay={500}
                    speed={50}
                  />
                </div>
              </div>

              {/* Error Details */}
              <div className="bg-black/30 border border-green-500/30 rounded-md p-4 text-left font-mono text-sm">
                <div className="text-green-400 mb-2">
                  <Terminal className="inline h-4 w-4 mr-2" />
                  SYSTEM DIAGNOSTICS:
                </div>
                <div className="text-green-500/70 space-y-1 ml-6">
                  <div>→ Target resource: <span className="text-red-400">NOT_FOUND</span></div>
                  <div>→ Access level: <span className="text-yellow-400">RESTRICTED</span></div>
                  <div>→ Security status: <span className="text-green-400">ACTIVE</span></div>
                  <div>→ Recommendation: <span className="text-blue-400">RETURN_TO_BASE</span></div>
                </div>
              </div>

              {/* Matrix-style loading animation */}
              <div className="text-center py-4">
                <div className="text-green-500/60 font-mono text-sm">
                  <TypingText 
                    text="SEARCHING FOR ALTERNATIVE ROUTES..."
                    delay={2000}
                    speed={80}
                  />
                </div>
                <div className="mt-2 text-green-600/40 font-mono text-xs">
                  <TypingText 
                    text="[░░░░░░░░░░] 100% COMPLETE - NO ALTERNATIVE FOUND"
                    delay={4000}
                    speed={100}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <MatrixButton icon={Home} className="w-full sm:w-auto">
                    RETURN TO BASE
                  </MatrixButton>
                </Link>
                
                <MatrixButton 
                  variant="outline" 
                  icon={Search}
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto"
                >
                  RETRACE STEPS
                </MatrixButton>
              </div>

              {/* Hacker Quote */}
              <div className="text-center pt-6 border-t border-green-500/30">
                <div className="text-green-500/60 font-mono text-sm italic">
                  <TypingText 
                    text="&quot;The best way to find out if you can trust somebody is to trust them.&quot; - Ernest Hemingway"
                    delay={6000}
                    speed={60}
                  />
                </div>
                <div className="text-green-600/40 font-mono text-xs mt-2">
                  <TypingText 
                    text={`- ENCODE CODE VAULT SYSTEM v${APP_VERSION}`}
                    delay={10000}
                    speed={80}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="text-green-600/30 font-mono text-xs">
                ERROR_CODE: 0x404_NOT_FOUND | TIMESTAMP: {isHydrated ? new Date().toISOString() : 'INITIALIZING...'}
              </div>
            </div>
          </MatrixCard>
        </div>
      </div>
    </div>
  );
}