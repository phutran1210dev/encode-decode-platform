import { NextRequest, NextResponse } from 'next/server';

// Dynamic import QRCode to handle potential SSR issues
import QRCode from 'qrcode';

interface StreamEntry {
  chunks: string[];
  totalChunks: number;
  timestamp: number;
  expires: number;
  metadata: {
    originalSize: number;
    fileName?: string;
    contentType?: string;
  };
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
    
    const { data, fileName, contentType } = requestData;
    
    if (!data || typeof data !== 'string') {
      return NextResponse.json(
        { error: 'Data is required and must be a string' }, 
        { status: 400 }
      );
    }
    
    console.log(`Processing data: ${data.length} characters, fileName: ${fileName}`);
    
    // Auto-detect environment and create appropriate base URL
    const host = request.headers.get('host') || '';
    let baseUrl: string;
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      baseUrl = `http://127.0.0.1:3000`;
    } else {
      baseUrl = `https://${host}`;
    }
    
    // For streaming approach, chunk data into smaller pieces
    const CHUNK_SIZE = 50000; // 50KB chunks
    const chunks: string[] = [];
    
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      chunks.push(data.substring(i, i + CHUNK_SIZE));
    }
    
    console.log(`Data split into ${chunks.length} chunks`);
    
    // Generate unique stream ID
    const streamId = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64url').substring(0, 16);
    
    // Store stream data in cache
    globalThis.qrStreamCache = globalThis.qrStreamCache || new Map<string, StreamEntry>();
    globalThis.qrStreamCache.set(streamId, {
      chunks,
      totalChunks: chunks.length,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 60 * 1000), // 30 minutes
      metadata: {
        originalSize: data.length,
        fileName,
        contentType
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
    
    console.log('QR code generated successfully for streaming data');
    
    return NextResponse.json({
      qrCode: qrCodeDataURL,
      url: streamUrl,
      streamId,
      streaming: {
        totalChunks: chunks.length,
        chunkSize: CHUNK_SIZE,
        originalSize: data.length,
        compression: 'chunked'
      },
      metadata: {
        fileName,
        contentType
      },
      environment: host.includes('localhost') || host.includes('127.0.0.1') ? 'development' : 'production'
    });
    
  } catch (error) {
    console.error('QR Streaming generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code for streaming data' }, 
      { status: 500 }
    );
  }
}