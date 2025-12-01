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
      <div className="min-h-screen relative bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-green-950/5 to-black" />
        
        <div className="container mx-auto p-6 max-w-4xl relative z-10">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-2xl">
              {/* Matrix Card Header */}
              <div className="bg-black/50 backdrop-blur-sm border-2 border-green-500/30 rounded-lg p-8 shadow-[0_0_30px_rgba(0,255,0,0.15)]">
                <div className="space-y-6">
                  {/* Error Code with Glitch Effect */}
                  <div className="text-center">
                    <div className="text-8xl font-mono font-bold text-green-400 mb-4 animate-pulse glow-text">
                      404
                    </div>
                    <div className="text-2xl font-mono text-green-500/80 mb-2">
                      QR CODE EXPIRED
                    </div>
                    <div className="text-sm font-mono text-green-400/60">
                      [STREAM ACCESS DENIED - DATA NOT FOUND]
                    </div>
                  </div>

                  {/* System Diagnostics */}
                  <div className="bg-black/30 border border-green-500/30 rounded-md p-4 text-left font-mono text-sm">
                    <div className="text-green-400 mb-2 flex items-center gap-2">
                      <span className="text-green-500">▸</span>
                      SYSTEM DIAGNOSTICS:
                    </div>
                    <div className="text-green-500/70 space-y-1 ml-6">
                      <div>→ Stream status: <span className="text-red-400">EXPIRED</span></div>
                      <div>→ Data retention: <span className="text-yellow-400">30-60 MINUTES</span></div>
                      <div>→ Current time: <span className="text-blue-400">{new Date().toLocaleTimeString()}</span></div>
                      <div>→ Recommendation: <span className="text-green-400">REGENERATE_QR</span></div>
                    </div>
                  </div>

                  {/* Recovery Instructions */}
                  <div className="bg-green-500/5 border border-green-500/20 rounded-md p-4">
                    <div className="text-green-400 font-mono text-sm mb-3 flex items-center gap-2">
                      <span className="text-green-500">⚡</span>
                      RECOVERY PROTOCOL:
                    </div>
                    <ol className="text-green-400/70 font-mono text-xs space-y-2 ml-6 list-decimal">
                      <li className="pl-2">Navigate to encode page</li>
                      <li className="pl-2">Upload your file again (if needed)</li>
                      <li className="pl-2">Click "ENCODE DATA" button</li>
                      <li className="pl-2">Generate new QR code</li>
                      <li className="pl-2">Scan within 30 minutes</li>
                    </ol>
                  </div>

                  {/* Loading Animation Effect */}
                  <div className="text-center py-3">
                    <div className="text-green-500/60 font-mono text-xs">
                      SEARCHING FOR ALTERNATIVE ROUTES...
                    </div>
                    <div className="mt-2 text-green-600/40 font-mono text-xs">
                      [████████░░] 80% - NO CACHE FOUND
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link 
                      href="/" 
                      className="px-6 py-3 bg-green-600 text-black font-mono rounded hover:bg-green-500 transition-all font-semibold text-center shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)]"
                    >
                      ← RETURN TO BASE
                    </Link>
                    <Link 
                      href="/?tab=encode" 
                      className="px-6 py-3 bg-green-500/10 text-green-400 border-2 border-green-500/50 font-mono rounded hover:bg-green-500/20 transition-all font-semibold text-center"
                    >
                      GENERATE NEW QR →
                    </Link>
                  </div>

                  {/* Warning Footer */}
                  <div className="text-center pt-4 border-t border-green-500/20">
                    <div className="text-yellow-500/60 font-mono text-xs mb-1">
                      ⚠️ QR codes auto-expire for security
                    </div>
                    <div className="text-green-600/30 font-mono text-xs">
                      STREAM_ID: {params?.id} | TIMESTAMP: {new Date().toISOString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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