import { NextRequest, NextResponse } from 'next/server';

// Dynamic import QRCode to handle potential SSR issues
import QRCode from 'qrcode';

interface StreamEntryMetadata {
  originalSize: number;
  fileName?: string;
  contentType?: string;
  chunkSize: number;
  compressionRatio: number;
}

interface StreamEntry {
  chunks: string[];
  totalChunks: number;
  timestamp: number;
  expires: number;
  metadata: StreamEntryMetadata;
}

declare global {
  var qrStreamCache: Map<string, StreamEntry> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    console.log('QR Streaming API called');
    
    // Parse request body safely
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' }, 
        { status: 400 }
      );
    }
    
    const { data, fileName, contentType, streamId: providedStreamId } = requestData;
    
    // Input validation
    if (!data) {
      return NextResponse.json(
        { error: 'Data is required', code: 'MISSING_DATA' }, 
        { status: 400 }
      );
    }
    
    if (typeof data !== 'string') {
      return NextResponse.json(
        { error: 'Data must be a string', code: 'INVALID_TYPE' }, 
        { status: 400 }
      );
    }
    
    // Sanitize and validate data
    const sanitizedData = data.trim();
    if (sanitizedData.length === 0) {
      return NextResponse.json(
        { error: 'Data cannot be empty', code: 'EMPTY_DATA' }, 
        { status: 400 }
      );
    }
    
    // Size limits for streaming (max 50MB as per requirements)
    const MAX_STREAM_SIZE = 50 * 1024 * 1024; // 50MB
    if (sanitizedData.length > MAX_STREAM_SIZE) {
      return NextResponse.json(
        { 
          error: 'Data exceeds streaming size limit',
          code: 'STREAM_SIZE_EXCEEDED',
          details: {
            maxSize: MAX_STREAM_SIZE,
            currentSize: sanitizedData.length,
            maxSizeMB: '50MB'
          }
        },
        { status: 413 }
      );
    }
    
    console.log(`Processing streaming data: ${sanitizedData.length} characters, fileName: ${fileName || 'unknown'}`);
    
    // Auto-detect environment with fallback
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = host.includes('localhost') || host.includes('127.0.0.1') 
      ? `http://127.0.0.1:3000` 
      : `https://${host}`;
    
    // Optimized chunking with dynamic size based on data size
    const dynamicChunkSize = sanitizedData.length > 10000000 ? 100000 : 50000; // 100KB for >10MB, 50KB otherwise
    const chunks: string[] = [];
    
    for (let i = 0; i < sanitizedData.length; i += dynamicChunkSize) {
      chunks.push(sanitizedData.substring(i, i + dynamicChunkSize));
    }
    
    console.log(`Data split into ${chunks.length} chunks (${dynamicChunkSize} bytes each)`);
    
    // Use provided streamId or generate new one
    const streamId = providedStreamId || Buffer.from(`${Date.now()}-${Math.random()}-${sanitizedData.length}`).toString('base64url').substring(0, 20);
    
    // Calculate expiration based on data size
    const expirationMinutes = sanitizedData.length > 50000000 ? 60 : 30; // 60min for >50MB, 30min otherwise
    const expirationTime = expirationMinutes * 60 * 1000;
    
    // Store stream data in cache with metadata
    globalThis.qrStreamCache = globalThis.qrStreamCache || new Map<string, StreamEntry>();
    globalThis.qrStreamCache.set(streamId, {
      chunks,
      totalChunks: chunks.length,
      timestamp: Date.now(),
      expires: Date.now() + expirationTime,
      metadata: {
        originalSize: sanitizedData.length,
        fileName: fileName || `stream-${Date.now()}.txt`,
        contentType: contentType || 'text/plain',
        chunkSize: dynamicChunkSize,
        compressionRatio: 0 // Not compressed in streaming
      }
    });
    
    // Clean up expired entries
    for (const [key, value] of globalThis.qrStreamCache.entries()) {
      if (value.expires < Date.now()) {
        globalThis.qrStreamCache.delete(key);
      }
    }
    
    console.log(`Stream stored with ID: ${streamId}, Cache size: ${globalThis.qrStreamCache.size}`);
    
    // Create stream URL
    const streamUrl = new URL(`/stream/${streamId}`, baseUrl).toString();
    
    // Generate QR code for stream URL
    let qrCodeDataURL: string;
    try {
      qrCodeDataURL = await QRCode.toDataURL(streamUrl, {
        width: 400,
        margin: 1,
        color: {
          dark: '#00ff00', // Matrix green
          light: '#000000' // Black background
        },
        errorCorrectionLevel: 'M'
      });
    } catch (qrError) {
      console.error('QR generation error:', qrError);
      return NextResponse.json(
        { error: 'Failed to generate QR code' }, 
        { status: 500 }
      );
    }
    
    console.log(`Stream data stored successfully with ID: ${streamId}`);
    
    // If streamId was provided (from client), don't return QR code (already generated)
    if (providedStreamId) {
      return NextResponse.json({
        success: true,
        streamId,
        message: 'Data uploaded successfully',
        streaming: {
          totalChunks: chunks.length,
          chunkSize: dynamicChunkSize,
          originalSize: sanitizedData.length,
          expiresIn: expirationTime,
          expiresAt: Date.now() + expirationTime
        }
      });
    }
    
    // Original flow - generate QR code
    return NextResponse.json({
      qrCode: qrCodeDataURL,
      url: streamUrl,
      streamId,
      streaming: {
        totalChunks: chunks.length,
        chunkSize: dynamicChunkSize,
        originalSize: sanitizedData.length,
        compression: 'chunked',
        expiresIn: expirationTime,
        expiresAt: Date.now() + expirationTime
      },
      metadata: {
        fileName: fileName || `stream-${Date.now()}.txt`,
        contentType: contentType || 'text/plain',
        timestamp: Date.now()
      },
      environment: host.includes('localhost') || host.includes('127.0.0.1') ? 'development' : 'production'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Stream-ID': streamId
      }
    });
    
  } catch (error) {
    console.error('QR Streaming generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code for streaming data' }, 
      { status: 500 }
    );
  }
}