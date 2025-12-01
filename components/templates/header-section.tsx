"use client"

import React from 'react';
import { MatrixCard, MatrixButton } from '@/components/atoms';
import { GlitchText, TypingText } from '@/components/matrix-effects';
import { Terminal, Shield, Info, Lock, Unlock, RotateCcw } from 'lucide-react';
import { formatFileSize, MAX_FILE_SIZE, MAX_TOTAL_SIZE } from '@/lib/file-utils';
import { APP_VERSION } from '@/lib/version';

interface HeaderSectionProps {
  onReset: () => void;
}

export function HeaderSection({ onReset }: HeaderSectionProps) {
  return (
    <>
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Terminal className="h-8 w-8 text-green-500" />
          <h1 className="text-4xl font-bold font-mono glow-text">
            <GlitchText text="ENDCODE VAULT" />
          </h1>
          <Shield className="h-8 w-8 text-green-500" />
        </div>
        <div className="text-green-400 text-lg font-mono">
          <TypingText 
            text="[SECURE FILE ENCODING/DECODING SYSTEM]"
            delay={1000}
            speed={100}
          />
        </div>
      </div>

      <div className="mb-6">
        <MatrixCard 
          title="SYSTEM PARAMETERS"
          icon={Info}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-500/70 font-mono">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Max file size: {formatFileSize(MAX_FILE_SIZE)}
            </div>
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              Max total size: {formatFileSize(MAX_TOTAL_SIZE)}
            </div>
          </div>
        </MatrixCard>
      </div>

      <div className="mb-6 text-center">
        <MatrixButton 
          variant="outline" 
          onClick={onReset}
          icon={RotateCcw}
        >
          SYSTEM RESET
        </MatrixButton>
      </div>
    </>
  );
}