"use client"

import React from 'react';
import { MatrixCard, MatrixButton, MatrixLabel } from '@/components/atoms';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, Unlock } from 'lucide-react';

interface DecodeInputSectionProps {
  base64Input: string;
  onInputChange: (value: string) => void;
  onDecode: () => void;
  isDecoding: boolean;
}

export function DecodeInputSection({ 
  base64Input, 
  onInputChange, 
  onDecode, 
  isDecoding
}: DecodeInputSectionProps) {
  return (
    <MatrixCard 
      title="DATA DECODER"
      description="[PASTE ENCODED DATA TO DECODE]"
      icon={Terminal}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <MatrixLabel>ENCODED DATA</MatrixLabel>
          <Textarea 
            value={base64Input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="[PASTE BASE64 ENCODED DATA HERE...]"
            className="min-h-[200px] font-mono text-xs bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50"
          />
        </div>

        <MatrixButton 
          onClick={onDecode}
          disabled={isDecoding || !base64Input.trim()}
          icon={Unlock}
          className="w-full"
        >
          DECODE DATA
        </MatrixButton>
      </div>
    </MatrixCard>
  );
}