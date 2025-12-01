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
  // Check if this is a blob URL
  const isBlobMode = value.startsWith('BLOB:');
  const displayValue = isBlobMode 
    ? `🌥️ CLOUD STORAGE MODE\n\nYour file has been uploaded to cloud storage.\n\nSize: Large file (optimized for QR transfer)\nStorage: Vercel Blob Storage\nStatus: Ready for QR generation\n\n✅ Click "GENERATE QR" below to create a scannable QR code.\n\nBlob URL:\n${value.replace('BLOB:', '')}` 
    : value;
  
  return (
    <div className="space-y-2">
      <MatrixLabel>ENCODED STREAM</MatrixLabel>
      <Textarea 
        value={displayValue}
        placeholder="[AWAITING ENCRYPTION...]"
        readOnly
        className="min-h-[300px] font-mono text-xs bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50"
      />
      {value && !isBlobMode && (
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