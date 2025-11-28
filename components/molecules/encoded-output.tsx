"use client"

import React from 'react';
import { MatrixButton, MatrixLabel } from '@/components/atoms';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';

interface EncodedOutputProps {
  value: string;
  onCopy: () => void;
}

export function EncodedOutput({ value, onCopy }: EncodedOutputProps) {
  return (
    <div className="space-y-2">
      <MatrixLabel>ENCODED STREAM</MatrixLabel>
      <Textarea 
        value={value}
        placeholder="[AWAITING ENCRYPTION...]"
        readOnly
        className="min-h-[300px] font-mono text-xs bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50"
      />
      {value && (
        <MatrixButton 
          onClick={onCopy}
          icon={Copy}
          className="w-full"
        >
          COPY TO CLIPBOARD
        </MatrixButton>
      )}
    </div>
  );
}