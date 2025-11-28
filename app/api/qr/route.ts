import { NextRequest, NextResponse } from 'next/server';

// Dynamic import QRCode to handle potential SSR issues
let QRCode: any;
try {
  QRCode = require('qrcode');
} catch (error) {
  console.error('Failed to load QRCode library:', error);
}

interface CacheEntry {
  data: string;
  timestamp: number;
  expires: number;
}

declare global {
  var qrDataCache: Map<string, CacheEntry> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    console.log('QR API called');
    
    // Check if QRCode library is available
    if (!QRCode) {
      console.error('QRCode library not available');
      return NextResponse.json(
        { error: 'QR code generation service unavailable' }, 
        { status: 503 }
      );
    }
    
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
    
    const { data } = requestData;
    
    if (!data || typeof data !== 'string') {
      return NextResponse.json(
        { error: 'Data is required and must be a string' }, 
        { status: 400 }
      );
    }
    
    // Handle large data with compression and chunking
    let processedData = data;
    let isCompressed = false;
    let isChunked = false;
    
    // First, try to compress large data
    if (data.length > 2000) {
      try {
        // Simple compression using URL-safe base64 and removing redundant chars
        const compressed = data
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
          
        if (compressed.length < data.length * 0.8) {
          processedData = compressed;
          isCompressed = true;
          console.log(`Data compressed from ${data.length} to ${compressed.length} chars`);
        }
      } catch (error) {
        console.log('Compression failed, using original data');
      }
    }
    
    // If still too large, create a shortened URL approach
    if (processedData.length > 2500) {
      // For very large data, we'll store it temporarily and use a short ID
      const dataId = Buffer.from(data).toString('base64url').substring(0, 12) + Date.now();
      
      // Store in a simple in-memory cache (you could use Redis/Database in production)
      globalThis.qrDataCache = globalThis.qrDataCache || new Map<string, CacheEntry>();
      globalThis.qrDataCache.set(dataId, {
        data: data,
        timestamp: Date.now(),
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes
      });
      
      // Clean up expired entries
      for (const [key, value] of globalThis.qrDataCache.entries()) {
        if (value.expires < Date.now()) {
          globalThis.qrDataCache.delete(key);
        }
      }
      
      processedData = dataId;
      isChunked = true;
      console.log(`Large data (${data.length} chars) stored with ID: ${dataId}`);
    }
    
    // Final validation
    if (processedData.length > 3000) {
      return NextResponse.json(
        { error: `Data too large for QR code generation (${processedData.length} characters). Maximum supported: 3000 characters.` }, 
        { status: 400 }
      );
    }
    
    // Auto-detect environment and create appropriate base URL
    const host = request.headers.get('host') || '';
    let baseUrl: string;
    
    console.log('Host detected:', host);
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // Development environment
      baseUrl = `http://127.0.0.1:3000`;
    } else {
      // Production environment - use the actual host from request
      baseUrl = `https://${host}`;
    }
    
    console.log('Base URL:', baseUrl);
    
    // Create URL with processed data
    let targetUrl: string;
    try {
      if (isChunked) {
        // Use special route for chunked data
        const url = new URL(`/decode/${processedData}`, baseUrl);
        targetUrl = url.toString();
      } else {
        // Normal route with query parameter
        const url = new URL('/decode', baseUrl);
        url.searchParams.set('data', processedData);
        targetUrl = url.toString();
      }
    } catch (urlError) {
      console.error('URL creation error:', urlError);
      return NextResponse.json(
        { error: 'Failed to create target URL' }, 
        { status: 500 }
      );
    }
    
    console.log('Target URL:', targetUrl);
    
    // Generate QR code with error handling
    let qrCodeDataURL: string;
    try {
      qrCodeDataURL = await QRCode.toDataURL(targetUrl, {
        width: 300,
        margin: 2,
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
    
    console.log('QR code generated successfully');
    
    return NextResponse.json({
      qrCode: qrCodeDataURL,
      url: targetUrl,
      data: data,
      environment: host.includes('localhost') || host.includes('127.0.0.1') ? 'development' : 'production',
      processing: {
        originalSize: data.length,
        processedSize: processedData.length,
        isCompressed,
        isChunked
      }
    });
    
  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const data = searchParams.get('data');
  
  if (!data) {
    return NextResponse.json(
      { error: 'Data parameter is required' }, 
      { status: 400 }
    );
  }
  
  try {
    // Generate QR code as SVG for GET requests
    const qrCodeSVG = await QRCode.toString(data, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#00ff00',
        light: '#000000'
      },
      errorCorrectionLevel: 'M'
    });
    
    return new NextResponse(qrCodeSVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' }, 
      { status: 500 }
    );
  }
}