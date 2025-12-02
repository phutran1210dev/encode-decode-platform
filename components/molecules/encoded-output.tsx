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
  // Debug log to check value
  if (value) {
    console.log('📝 EncodedOutput received value:', value.substring(0, 100));
  }
  
  // Check if this is cloud storage URL
  const isSupabaseMode = value.startsWith('SUPABASE:');
  const isBlobMode = value.startsWith('BLOB:');
  const isFileMode = value.startsWith('FILE:');
  const isDBMode = value.startsWith('DB:');
  const isCloudMode = isSupabaseMode || isBlobMode || isFileMode || isDBMode;
  
  let displayValue = value;
  
  if (isFileMode) {
    // Parse format: FILE:URL:fileName
    // URL might contain colons (https://...) so we need special handling
    const withoutPrefix = value.substring(5); // Remove 'FILE:'
    const lastColonIndex = withoutPrefix.lastIndexOf(':');
    
    let fileUrl = '';
    let fileName = 'file';
    
    if (lastColonIndex !== -1) {
      fileUrl = withoutPrefix.substring(0, lastColonIndex);
      fileName = withoutPrefix.substring(lastColonIndex + 1);
    } else {
      fileUrl = withoutPrefix;
    }
    
    displayValue = `📦 ZIP FILE UPLOADED\n\nYour ZIP file has been uploaded directly to cloud storage.\n\nFile: ${fileName}\nMode: Direct Download (No encoding needed)\nStorage: Supabase Storage\nStatus: Ready for QR generation\n\n✅ Generate QR code below to download this file from any device.\n\nDirect Download URL:\n${fileUrl}`;
  } else if (isDBMode) {
    const id = value.replace('DB:', '');
    displayValue = `💾 SAVED TO DATABASE\n\nYour encoded data has been saved to cloud database.\n\nData ID: ${id}\nExpires: 24 hours\nStatus: Ready for QR generation\n\n✅ Generate QR code below to decode from any device.\n\nNote: Data will be automatically deleted after 24 hours.`;
  } else if (isCloudMode) {
    displayValue = `🌥️ CLOUD STORAGE MODE\n\nYour file has been uploaded to cloud storage.\n\nSize: Large file (optimized for QR transfer)\nStorage: ${isSupabaseMode ? 'Supabase Storage (Free)' : 'Vercel Blob Storage'}\nStatus: Ready for QR generation\n\n✅ Click "GENERATE QR" below to create a scannable QR code.\n\nStorage URL:\n${value.replace('SUPABASE:', '').replace('BLOB:', '')}`;
  }
  
  return (
    <div className="space-y-2">
      <MatrixLabel>ENCODED STREAM</MatrixLabel>
      <Textarea 
        value={displayValue}
        placeholder="[AWAITING ENCRYPTION...]"
        readOnly
        className="min-h-[300px] font-mono text-xs bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50"
      />
      {value && !isCloudMode && (
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