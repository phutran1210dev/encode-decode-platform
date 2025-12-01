import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry {
  data: string;
  timestamp: number;
  expires: number;
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
    
    console.log(`QR Data API: Retrieving data for ID: ${id}`);
    
    // Access the QR data cache
    const cache = globalThis.qrDataCache || new Map<string, CacheEntry>();
    const cacheEntry = cache.get(id);
    
    if (!cacheEntry) {
      console.log(`QR Data API: Data not found for ID: ${id}`);
      return NextResponse.json(
        { error: 'Data not found or expired' },
        { status: 404 }
      );
    }
    
    // Check if data has expired
    if (cacheEntry.expires < Date.now()) {
      console.log(`QR Data API: Data expired for ID: ${id}`);
      cache.delete(id);
      return NextResponse.json(
        { error: 'Data has expired' },
        { status: 410 }
      );
    }
    
    console.log(`QR Data API: Successfully retrieved data for ID: ${id}`);
    
    return NextResponse.json({
      data: cacheEntry.data,
      timestamp: cacheEntry.timestamp,
      expiresAt: cacheEntry.expires
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('QR Data retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear cache after download
export async function DELETE(
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
    
    console.log(`QR Data API: Deleting cache for ID: ${id}`);
    
    const cache = globalThis.qrDataCache || new Map<string, CacheEntry>();
    const existed = cache.has(id);
    
    if (existed) {
      cache.delete(id);
      console.log(`QR Data API: Cache deleted for ID: ${id}`);
    }
    
    return NextResponse.json({
      success: true,
      existed
    });
    
  } catch (error) {
    console.error('QR Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cache' },
      { status: 500 }
    );
  }
}
