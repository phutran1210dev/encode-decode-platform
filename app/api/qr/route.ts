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
    
    // Size validation with proper constants (max 50MB for streaming support)
    const MAX_DATA_SIZE = 50 * 1024 * 1024; // 50MB
    if (sanitizedData.length > MAX_DATA_SIZE) {
      return NextResponse.json(
        { 
          error: 'Data exceeds maximum size limit',
          code: 'SIZE_LIMIT_EXCEEDED',
          details: {
            maxSize: MAX_DATA_SIZE,
            currentSize: sanitizedData.length,
            maxSizeMB: '50MB'
          }
        },
        { status: 413 }
      );
    }
    
    console.log(`Original data size: ${sanitizedData.length} characters`);
    
    // For large data, use Vercel Blob Storage
    const QR_SIZE_LIMIT = 7000;
    if (sanitizedData.length > QR_SIZE_LIMIT) {
      console.log(`Data too large for direct QR (${sanitizedData.length} chars), using Blob storage`);
      
      try {
        // Upload to Vercel Blob Storage
        const { uploadToBlob } = await import('@/lib/blob-storage');
        const blobMetadata = await uploadToBlob({
          data: sanitizedData,
          fileName: requestData.fileName || `data-${Date.now()}.bin`,
          contentType: requestData.contentType || 'application/octet-stream',
          expiresIn: 60 * 60 // 1 hour
        });
        
        console.log(`Uploaded to blob storage: ${blobMetadata.url}`);
        
        // Auto-detect environment and create base URL
        const host = request.headers.get('host') || 'localhost:3000';
        const baseUrl = host.includes('localhost') || host.includes('127.0.0.1') 
          ? `http://127.0.0.1:3000` 
          : `https://${host}`;
        
        // Create stream URL with blob parameter for auto-download
        const streamId = `blob-${Date.now()}`;
        const downloadUrl = `${baseUrl}/stream/${streamId}?blob=${encodeURIComponent(blobMetadata.url)}`;
        
        // Generate QR code with stream URL (will auto-trigger download)
        let qrCodeDataURL: string;
        try {
          qrCodeDataURL = await QRCode.toDataURL(downloadUrl, {
            width: 400,
            margin: 1,
            color: {
              dark: '#00ff00',
              light: '#000000'
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
        
        return NextResponse.json({
          qrCode: qrCodeDataURL,
          url: downloadUrl,
          blobUrl: blobMetadata.url,
          mode: 'blob-storage',
          storage: {
            size: blobMetadata.size,
            uploadedAt: blobMetadata.uploadedAt,
            expiresIn: 3600
          },
          metadata: {
            timestamp: Date.now(),
            fileName: requestData.fileName || `data-${Date.now()}.bin`,
            contentType: requestData.contentType || 'application/octet-stream'
          }
        });
        
      } catch (blobError) {
        console.error('Blob storage error:', blobError);
        
        // Fallback: Return error with guidance
        return NextResponse.json({
          error: 'FILE_TOO_LARGE_FOR_QR',
          message: 'File is too large for QR code transfer',
          fileSize: sanitizedData.length,
          maxQRSize: QR_SIZE_LIMIT,
          recommendation: 'USE_DIRECT_DOWNLOAD',
          alternativeMethods: [
            'Click "Download All Files" button below',
            'Transfer via AirDrop, Email, or Cloud storage',
            'Use USB cable or file sharing service'
          ]
        }, { status: 400 });
      }
    }
    
    console.log(`Data size OK for direct QR: ${sanitizedData.length} characters`);
    
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
    
    // Create URL with data directly in query parameter (no cache needed)
    let targetUrl: string;
    try {
      const url = new URL('/decode', baseUrl);
      url.searchParams.set('data', sanitizedData);
      targetUrl = url.toString();
      console.log('Target URL created with data in query param');
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
        errorCorrectionLevel: sanitizedData.length > 3000 ? 'L' : 'M'
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
        method: 'direct-url' // No cache, data in URL
      },
      metadata: {
        timestamp: Date.now()
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