"use client"

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import EncodeDecode from '@/components/encode-decode-platform-refactored';
import { Suspense } from 'react';

function DecodePageContent() {
  const searchParams = useSearchParams();
  const [autoFillData, setAutoFillData] = useState<string>('');
  
  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedData = decodeURIComponent(data);
        setAutoFillData(decodedData);
      } catch (error) {
        console.error('Failed to decode URL parameter:', error);
      }
    }
  }, [searchParams]);
  
  return <EncodeDecode autoFillData={autoFillData} />;
}

export default function DecodePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-green-400 font-mono">Loading...</div>}>
      <DecodePageContent />
    </Suspense>
  );
}