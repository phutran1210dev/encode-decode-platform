"use client"

import React from 'react';
import { MatrixCard } from '@/components/atoms';
import { EncodedOutput } from '@/components/molecules';
import { Terminal } from 'lucide-react';

interface EncodedOutputSectionProps {
  encodedData: string;
  onCopy: () => void;
}

export function EncodedOutputSection({ encodedData, onCopy }: EncodedOutputSectionProps) {
  return (
    <MatrixCard 
      title="ENCRYPTED PAYLOAD"
      description="[BASE64 ENCODED DATA STREAM]"
      icon={Terminal}
    >
      <EncodedOutput 
        value={encodedData}
        onCopy={onCopy}
      />
    </MatrixCard>
  );
}