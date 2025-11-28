import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry {
  data: string;
  timestamp: number;
  expires: number;
}

declare global {
  var qrDataCache: Map<string, CacheEntry> | undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Data ID is required' },
        { status: 400 }
      );
    }
    
    // Access the global cache
    const cache = globalThis.qrDataCache || new Map<string, CacheEntry>();
    const cachedData = cache.get(id);
    
    if (!cachedData) {
      return NextResponse.json(
        { error: 'Data not found or expired' },
        { status: 404 }
      );
    }
    
    // Check if data has expired
    if (cachedData.expires < Date.now()) {
      cache.delete(id);
      return NextResponse.json(
        { error: 'Data has expired' },
        { status: 410 }
      );
    }
    
    return NextResponse.json({
      data: cachedData.data,
      timestamp: cachedData.timestamp,
      expiresAt: cachedData.expires
    });
    
  } catch (error) {
    console.error('QR data retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}