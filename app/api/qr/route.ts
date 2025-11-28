import { NextRequest, NextResponse } from 'next/server';

// Dynamic import QRCode to handle potential SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let QRCode: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    
    // Sanitize input data
    const sanitizedData = data.trim();
    if (sanitizedData.length === 0) {
      return NextResponse.json(
        { error: 'Data cannot be empty', code: 'EMPTY_DATA' }, 
        { status: 400 }
      );
    }
    
    // Size validation with proper constants
    const MAX_DATA_SIZE = 5 * 1024 * 1024; // 5MB
    if (sanitizedData.length > MAX_DATA_SIZE) {
      return NextResponse.json(
        { 
          error: 'Data exceeds maximum size limit',
          code: 'SIZE_LIMIT_EXCEEDED',
          details: {
            maxSize: MAX_DATA_SIZE,
            currentSize: sanitizedData.length,
            maxSizeMB: '5MB'
          }
        },
        { status: 413 }
      );
    }
    
    // Handle large data with compression and chunking
    let processedData = sanitizedData;
    let isCompressed = false;
    let isChunked = false;
    let expirationTime = 10 * 60 * 1000; // Default 10 minutes
    
    console.log(`Original data size: ${sanitizedData.length} characters`);
    
    // Always try compression for data over 500 chars
    if (sanitizedData.length > 500) {
      try {
        // Enhanced compression algorithm
        let compressed = sanitizedData
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/={2,}/g, '=') // Replace multiple = with single =
          .replace(/\+{2,}/g, '+') // Replace multiple + with single +
          .replace(/\/{2,}/g, '/') // Replace multiple / with single /
          .replace(/\n\s*\n/g, '\n') // Remove empty lines
          .replace(/\t+/g, ' ') // Replace tabs with space
          .trim();
          
        // Special handling for base64 data
        if (data.includes('data:') || data.match(/^[A-Za-z0-9+/=]+$/)) {
          // Remove redundant base64 padding and compress further
          compressed = compressed.replace(/=+$/, '');
          // Try to compress repetitive base64 patterns
          compressed = compressed.replace(/(.{10,}?)\1+/g, '$1');
        }
        
        // Try additional compression for JSON-like data
        if (data.includes('{') || data.includes('[')) {
          compressed = compressed
            .replace(/,\s*/g, ',') // Remove spaces after commas
            .replace(/:\s*/g, ':') // Remove spaces after colons
            .replace(/{\s*/g, '{') // Remove spaces after opening braces
            .replace(/\s*}/g, '}') // Remove spaces before closing braces
            .replace(/\[\s*/g, '[') // Remove spaces after opening brackets
            .replace(/\s*\]/g, ']'); // Remove spaces before closing brackets
        }
        
        if (compressed.length < sanitizedData.length) {
          processedData = compressed;
          isCompressed = true;
          console.log(`Data compressed from ${sanitizedData.length} to ${compressed.length} chars (${Math.round((1 - compressed.length/sanitizedData.length) * 100)}% reduction)`);
        }
      } catch (compressionError) {
        console.log('Compression failed, using original data:', compressionError instanceof Error ? compressionError.message : 'Unknown error');
      }
    }
    
    // Use chunking for data over 2KB (to handle 5MB+ files efficiently)
    if (processedData.length > 2000) {
      // For very large data, we'll store it temporarily and use a short ID
      const dataId = Buffer.from(data).toString('base64url').substring(0, 12) + Date.now();
      
      // Store in a simple in-memory cache (you could use Redis/Database in production)
      globalThis.qrDataCache = globalThis.qrDataCache || new Map<string, CacheEntry>();
      // Longer expiration for large files (30 minutes)
      expirationTime = sanitizedData.length > 1000000 ? (30 * 60 * 1000) : (10 * 60 * 1000);
      
      globalThis.qrDataCache.set(dataId, {
        data: data,
        timestamp: Date.now(),
        expires: Date.now() + expirationTime
      });
      
      // Clean up expired entries
      for (const [key, value] of globalThis.qrDataCache.entries()) {
        if (value.expires < Date.now()) {
          globalThis.qrDataCache.delete(key);
        }
      }
      
      processedData = dataId;
      isChunked = true;
      console.log(`Large data (${sanitizedData.length} chars) stored with ID: ${dataId}`);
      console.log(`Cache now has ${globalThis.qrDataCache.size} entries`);
    }
    
    // Final validation - QR codes can handle up to ~7000 chars with high error correction
    if (!isChunked && processedData.length > 6000) {
      return NextResponse.json(
        { error: `Data too large for QR code generation (${processedData.length} characters). Maximum supported: 6000 characters. Very large files will be chunked automatically.` }, 
        { status: 400 }
      );
    }
    
    console.log(`Final processed data size: ${processedData.length} characters (chunked: ${isChunked}, compressed: ${isCompressed})`);
    
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
      // Use optimal settings for large data
      const qrOptions = {
        width: 400, // Larger size for better scanning
        margin: 1,  // Smaller margin for more data space
        color: {
          dark: '#00ff00', // Matrix green
          light: '#000000' // Black background
        },
        // Use L (Low) error correction for maximum data capacity
        errorCorrectionLevel: processedData.length > 3000 ? 'L' : 'M'
      };
      
      qrCodeDataURL = await QRCode.toDataURL(targetUrl, qrOptions);
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
      data: sanitizedData,
      environment: host.includes('localhost') || host.includes('127.0.0.1') ? 'development' : 'production',
      processing: {
        originalSize: sanitizedData.length,
        processedSize: processedData.length,
        isCompressed,
        isChunked,
        compressionRatio: isCompressed ? Math.round((1 - processedData.length/sanitizedData.length) * 100) : 0
      },
      metadata: {
        timestamp: Date.now(),
        expiresIn: isChunked ? expirationTime : null
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
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