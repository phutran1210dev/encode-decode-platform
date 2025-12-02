"use client"

import React, { useState } from 'react';
import { MatrixCard, MatrixButton } from '@/components/atoms';
import { EncodedOutput, QRModal } from '@/components/molecules';
import { Terminal, QrCode } from 'lucide-react';

interface EncodedOutputSectionProps {
  encodedData: string;
  onCopy: () => void;
}

export function EncodedOutputSection({ encodedData, onCopy }: EncodedOutputSectionProps) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // Debug log
  console.log('🟢 EncodedOutputSection render - encodedData:', encodedData ? encodedData.substring(0, 50) + '...' : 'empty');
  
  return (
    <MatrixCard 
      title="ENCODED OUTPUT"
      description="[BASE64 ENCODED DATA STREAM]"
      icon={Terminal}
    >
      <div className="space-y-4">
        <EncodedOutput 
          value={encodedData}
          onCopy={onCopy}
        />
        
        {encodedData && (
          <div className="flex gap-2">
            <MatrixButton
              variant="outline"
              onClick={() => setIsQRModalOpen(true)}
              icon={QrCode}
              className="flex-1"
            >
              GENERATE QR
            </MatrixButton>
          </div>
        )}
      </div>
      
      <QRModal 
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        data={encodedData}
      />
    </MatrixCard>
  );
}