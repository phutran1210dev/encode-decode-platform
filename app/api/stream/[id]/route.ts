import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      );
    }
    
    // Access the stream cache
    const cache = globalThis.qrStreamCache || new Map<string, StreamEntry>();
    const streamEntry = cache.get(id);
    
    if (!streamEntry) {
      return NextResponse.json(
        { error: 'Stream not found or expired' },
        { status: 404 }
      );
    }
    
    // Check if stream has expired
    if (streamEntry.expires < Date.now()) {
      cache.delete(id);
      return NextResponse.json(
        { error: 'Stream has expired' },
        { status: 410 }
      );
    }
    
    // Get chunk index from query params
    const url = new URL(request.url);
    const chunkIndex = parseInt(url.searchParams.get('chunk') || '0');
    
    if (chunkIndex < 0 || chunkIndex >= streamEntry.totalChunks) {
      return NextResponse.json(
        { error: `Invalid chunk index. Must be between 0 and ${streamEntry.totalChunks - 1}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      chunk: streamEntry.chunks[chunkIndex],
      chunkIndex,
      totalChunks: streamEntry.totalChunks,
      isLast: chunkIndex === streamEntry.totalChunks - 1,
      metadata: streamEntry.metadata,
      expiresAt: streamEntry.expires
    });
    
  } catch (error) {
    console.error('Stream retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve stream data' },
      { status: 500 }
    );
  }
}

// Get complete stream metadata
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      );
    }
    
    const cache = globalThis.qrStreamCache || new Map<string, StreamEntry>();
    const streamEntry = cache.get(id);
    
    if (!streamEntry) {
      return NextResponse.json(
        { error: 'Stream not found or expired' },
        { status: 404 }
      );
    }
    
    if (streamEntry.expires < Date.now()) {
      cache.delete(id);
      return NextResponse.json(
        { error: 'Stream has expired' },
        { status: 410 }
      );
    }
    
    // Reassemble complete data
    const completeData = streamEntry.chunks.join('');
    
    console.log(`Reassembling complete stream ${id}: ${completeData.length} characters`);
    
    return NextResponse.json({
      data: completeData,
      metadata: streamEntry.metadata,
      totalChunks: streamEntry.totalChunks,
      expiresAt: streamEntry.expires
    });
    
  } catch (error) {
    console.error('Complete stream retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve complete stream data' },
      { status: 500 }
    );
  }
}