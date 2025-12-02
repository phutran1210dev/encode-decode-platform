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
    
    const { data, blobUrl, fileUrl, fileName, mode } = requestData;
    
    // Auto-detect environment and create base URL
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = host.includes('localhost') || host.includes('127.0.0.1') 
      ? `http://127.0.0.1:3000` 
      : `https://${host}`;
    
    // Handle direct file download (ZIP files, etc.)
    if (mode === 'direct-download' && fileUrl) {
      console.log(`Generating QR for direct file download: ${fileName}`);
      
      // Generate QR code with direct file URL
      let qrCodeDataURL: string;
      try {
        qrCodeDataURL = await QRCode.toDataURL(fileUrl, {
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
        url: fileUrl,
        fileName: fileName,
        mode: 'direct-download',
        metadata: {
          timestamp: Date.now()
        }
      });
    }
    
    // Check if blob URL is provided (client-side upload already done)
    if (blobUrl) {
      console.log(`Using pre-uploaded blob: ${blobUrl}`);
      
      // Create stream URL with blob parameter
      const streamId = `blob-${Date.now()}`;
      const downloadUrl = `${baseUrl}/stream/${streamId}?blob=${encodeURIComponent(blobUrl)}`;
      
      // Generate QR code with stream URL
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
        blobUrl: blobUrl,
        mode: 'blob-storage',
        metadata: {
          timestamp: Date.now()
        }
      });
    }
    
    // Handle direct data (small files)
    if (!data) {
      return NextResponse.json(
        { error: 'Data or blobUrl is required', code: 'MISSING_DATA' }, 
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
    
    console.log(`Data size: ${sanitizedData.length} characters`);
    
    // Create URL with data directly in query parameter
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
    
    // Generate QR code
    let qrCodeDataURL: string;
    try {
      const qrOptions = {
        width: 400,
        margin: 1,
        color: {
          dark: '#00ff00',
          light: '#000000'
        },
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
      mode: 'direct',
      metadata: {
        timestamp: Date.now(),
        originalSize: sanitizedData.length
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
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
