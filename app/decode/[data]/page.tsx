'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import EncodeDecode from '@/components/encode-decode-legacy';

interface DecodedData {
  data: string;
  timestamp: number;
  expiresAt: number;
}

export default function DecodePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [decodedData, setDecodedData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      // Check for data in URL params (new chunked approach)
      const dataId = params?.data as string;
      
      // Check for data in search params (traditional approach)
      const queryData = searchParams?.get('data');
      
      if (dataId && dataId !== 'undefined') {
        // Handle chunked data
        setIsLoading(true);
        try {
          const response = await hiddenFetch(`/api/qr-data/${dataId}`, {
            headers: { 'X-Hidden-Request': 'true' }
          });
          if (response.ok) {
            const result: DecodedData = await response.json();
            setDecodedData(decodeURIComponent(result.data));
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to load data');
          }
        } catch (err) {
          setError('Network error loading data');
          console.error('Error loading chunked data:', err);
        } finally {
          setIsLoading(false);
        }
      } else if (queryData) {
        // Handle traditional query parameter data
        try {
          setDecodedData(decodeURIComponent(queryData));
        } catch (err) {
          setError('Invalid data format');
          console.error('Error decoding query data:', err);
        }
      }
    };

    loadData();
  }, [params, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono text-center">
          <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>LOADING ENCRYPTED DATA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 font-mono text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl mb-4">DATA ACCESS ERROR</h1>
          <p className="text-red-400/70 mb-6">{error}</p>
          <Link 
            href="/" 
            className="inline-block px-6 py-2 bg-green-600 text-black font-mono rounded hover:bg-green-500 transition-colors"
          >
            RETURN TO PLATFORM
          </Link>
        </div>
      </div>
    );
  }

  return <EncodeDecode initialDecodeData={decodedData} />;
}