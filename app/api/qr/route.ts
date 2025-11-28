import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' }, 
        { status: 400 }
      );
    }
    
    // Auto-detect environment and create appropriate base URL
    const host = request.headers.get('host') || '';
    let baseUrl: string;
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // Development environment - use 127.0.0.1 for better mobile access
      baseUrl = `http://127.0.0.1:3000`;
    } else {
      // Production environment - use Vercel domain
      baseUrl = 'https://encode-decode-platform.vercel.app';
    }
    
    // Create URL with encoded data as query parameter
    const url = new URL('/decode', baseUrl);
    url.searchParams.set('data', encodeURIComponent(data));
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(url.toString(), {
      width: 300,
      margin: 2,
      color: {
        dark: '#00ff00', // Matrix green
        light: '#000000' // Black background
      },
      errorCorrectionLevel: 'M'
    });
    
    return NextResponse.json({
      qrCode: qrCodeDataURL,
      url: url.toString(),
      data: data,
      environment: host.includes('localhost') || host.includes('127.0.0.1') ? 'development' : 'production'
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