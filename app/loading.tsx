"use client"

import React from 'react';
import { MatrixCard } from '@/components/atoms';
import { GlitchText, TypingText } from '@/components/matrix-effects';
import MatrixRain from '@/components/matrix-effects';
import { Terminal, Loader2 } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

export default function Loading() {
  return (
    <div className="min-h-screen relative">
      <MatrixRain />
      
      <div className="container mx-auto p-6 max-w-4xl relative z-10">
        <div className="min-h-screen flex items-center justify-center">
          <MatrixCard 
            title="SYSTEM INITIALIZATION"
            description="[LOADING SECURE PROTOCOLS]"
            icon={Terminal}
            className="w-full max-w-2xl text-center"
          >
            <div className="space-y-6">
              {/* Loading Animation */}
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-green-400 glow-text mb-4">
                  <GlitchText text="LOADING" />
                </div>
                <div className="flex items-center justify-center mb-6">
                  <Loader2 className="h-8 w-8 text-green-500 animate-spin mr-3" />
                  <div className="text-lg font-mono text-green-500/80">
                    <TypingText 
                      text="INITIALIZING ENDCODE VAULT..."
                      delay={500}
                      speed={80}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="bg-black/30 border border-green-500/30 rounded-md p-4 text-left font-mono text-sm">
                <div className="text-green-400 mb-3">
                  <Terminal className="inline h-4 w-4 mr-2" />
                  SYSTEM BOOT SEQUENCE:
                </div>
                <div className="space-y-2 ml-6">
                  <div className="text-green-300">
                    <TypingText text="→ Loading encryption modules... ✓" delay={1000} speed={50} />
                  </div>
                  <div className="text-green-300">
                    <TypingText text="→ Initializing matrix effects... ✓" delay={2000} speed={50} />
                  </div>
                  <div className="text-green-300">
                    <TypingText text="→ Establishing secure channels... ✓" delay={3000} speed={50} />
                  </div>
                  <div className="text-yellow-300">
                    <TypingText text="→ Loading user interface... ⟳" delay={4000} speed={50} />
                  </div>
                </div>
              </div>

              {/* Loading Bar */}
              <div className="w-full bg-black/50 border border-green-500/30 rounded-md p-2">
                <div className="text-green-400 font-mono text-xs mb-2 text-center">
                  LOADING PROGRESS
                </div>
                <div className="w-full bg-black/70 rounded-sm h-3 overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-green-600 to-green-400 loading-bar-animation"
                    style={{
                      animation: 'loading-progress 4s ease-out forwards'
                    }}
                  />
                </div>
                <div className="text-green-500/60 font-mono text-xs mt-2 text-center">
                  <TypingText text="[████████░░] 80% COMPLETE" delay={3500} speed={100} />
                </div>
              </div>

              {/* System Status */}
              <div className="text-center">
                <div className="text-green-500/60 font-mono text-sm">
                  <TypingText 
                    text="PLEASE WAIT WHILE SYSTEM COMES ONLINE..."
                    delay={5000}
                    speed={60}
                  />
                </div>
                <div className="text-green-600/40 font-mono text-xs mt-2">
                  <TypingText 
                    text={`Security protocols active • v${APP_VERSION} • All systems operational`}
                    delay={6500}
                    speed={80}
                  />
                </div>
              </div>
            </div>
          </MatrixCard>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% { width: 0%; }
          25% { width: 25%; }
          50% { width: 50%; }
          75% { width: 75%; }
          100% { width: 80%; }
        }
        .loading-bar-animation {
          width: 0%;
        }
      `}</style>
    </div>
  );
}