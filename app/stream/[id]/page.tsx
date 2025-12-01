'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import EncodeDecode from '@/components/encode-decode-legacy';

interface StreamMetadata {
  originalSize: number;
  fileName?: string;
  contentType?: string;
}

interface StreamChunk {
  chunk: string;
  chunkIndex: number;
  totalChunks: number;
  isLast: boolean;
  metadata: StreamMetadata;
  expiresAt: number;
}

export default function StreamPage() {
  const params = useParams();
  const [streamedData, setStreamedData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);

  useEffect(() => {
    const loadStreamData = async () => {
      const streamId = params?.id as string;
      
      if (!streamId || streamId === 'undefined') {
        setError('Invalid stream ID');
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        console.log(`Loading stream: ${streamId}`);
        
        // First try to get data from URL query params (stateless approach)
        const urlParams = new URLSearchParams(window.location.search);
        const urlData = urlParams.get('d'); // 'd' = data parameter
        
        if (urlData) {
          // Stateless mode - data embedded in URL
          console.log(`Stream loaded from URL params: ${urlData.length} characters`);
          setStreamedData(urlData);
          setMetadata({
            originalSize: urlData.length,
            fileName: 'streamed-data.txt',
            contentType: 'text/plain'
          });
          setProgress({ current: 1, total: 1 });
          setIsLoading(false);
          return;
        }
        
        // Try to load from localStorage (for large files)
        const storageKey = `stream_${streamId}`;
        const localData = localStorage.getItem(storageKey);
        
        if (localData) {
          console.log(`Stream loaded from localStorage: ${localData.length} characters`);
          setStreamedData(localData);
          setMetadata({
            originalSize: localData.length,
            fileName: 'streamed-data.txt',
            contentType: 'text/plain'
          });
          setProgress({ current: 1, total: 1 });
          setIsLoading(false);
          return;
        }
        
        // Fallback: Try to load from cache-based API (legacy support)
        console.log(`Attempting to load from cache API for stream: ${streamId}`);
        
        const response = await fetch(`/api/stream/${streamId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stream data not found. Please regenerate the QR code to enable cross-device access.');
        }
        
        const result = await response.json();
        
        setStreamedData(result.data);
        setMetadata(result.metadata);
        setProgress({ current: result.totalChunks, total: result.totalChunks });
        
        console.log(`Stream loaded from cache: ${result.data.length} characters`);
        
      } catch (err) {
        console.error('Error loading stream:', err);
        // User-friendly error - QR code expired or not uploaded to server
        setError('STREAM_NOT_FOUND');
      } finally {
        setIsLoading(false);
      }
    };

    loadStreamData();
  }, [params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono text-center max-w-md">
          <div className="animate-spin h-12 w-12 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h1 className="text-xl mb-4">STREAMING DATA...</h1>
          <div className="space-y-2 text-green-500/70">
            <p>Loading chunks: {progress.current}/{progress.total}</p>
            {metadata && (
              <>
                <p>File: {metadata.fileName || 'Unknown'}</p>
                <p>Size: {(metadata.originalSize / 1024).toFixed(2)} KB</p>
              </>
            )}
          </div>
          <div className="mt-4 bg-green-500/20 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' 
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-green-500 text-8xl mb-6 animate-pulse">404</div>
            <h1 className="text-3xl font-mono text-green-400 mb-4">QR CODE EXPIRED</h1>
            <div className="space-y-3 text-green-400/70 font-mono text-sm mb-8">
              <p>⚠️ This QR code link is no longer valid</p>
              <p>🔄 QR codes expire after 30-60 minutes for security</p>
              <p>📱 Please generate a new QR code from the encode page</p>
            </div>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
            <h2 className="text-green-400 font-mono text-lg mb-4">HOW TO FIX:</h2>
            <ol className="text-green-400/70 font-mono text-sm space-y-3 list-decimal list-inside">
              <li>Go back to the encode page</li>
              <li>Upload your file again (if needed)</li>
              <li>Click "ENCODE DATA"</li>
              <li>Generate a new QR code</li>
              <li>Scan the new QR code within 30 minutes</li>
            </ol>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Link 
              href="/" 
              className="px-6 py-3 bg-green-600 text-black font-mono rounded hover:bg-green-500 transition-colors font-semibold"
            >
              ← BACK TO HOME
            </Link>
            <Link 
              href="/?tab=encode" 
              className="px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/50 font-mono rounded hover:bg-green-500/30 transition-colors font-semibold"
            >
              ENCODE NEW DATA →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Stream Info Header */}
      {metadata && (
        <div className="bg-green-500/10 border-b border-green-500/30 p-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between text-green-400 font-mono text-sm">
              <div className="flex gap-6">
                <span>📁 {metadata.fileName || 'Streamed Data'}</span>
                <span>📊 {(metadata.originalSize / 1024).toFixed(2)} KB</span>
                <span>🔗 Streaming Mode</span>
              </div>
              <span>✅ Stream Complete</span>
            </div>
          </div>
        </div>
      )}
      
      <EncodeDecode initialDecodeData={streamedData} />
    </div>
  );
}