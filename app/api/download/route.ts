import { NextRequest, NextResponse } from 'next/server';
import { decodeFromBase64 } from '@/lib/file-utils';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (!data || typeof data !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }

    // Decode the base64 data
    const decoded = decodeFromBase64(data);
    
    if (!decoded.files || decoded.files.length === 0) {
      return NextResponse.json(
        { error: 'No files found in data' },
        { status: 400 }
      );
    }

    // For single file, return it directly
    if (decoded.files.length === 1) {
      const file = decoded.files[0];
      
      // Handle binary files (data URLs)
      if (file.isBinary && file.content.startsWith('data:')) {
        const matches = file.content.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': mimeType,
              'Content-Disposition': `attachment; filename="${file.name}"`,
              'Content-Length': buffer.length.toString(),
            },
          });
        }
      }
      
      // Handle text files
      return new NextResponse(file.content, {
        headers: {
          'Content-Type': file.type || 'text/plain',
          'Content-Disposition': `attachment; filename="${file.name}"`,
        },
      });
    }

    // For multiple files, return info (client will download individually)
    return NextResponse.json({
      success: true,
      files: decoded.files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        isBinary: f.isBinary
      }))
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const data = url.searchParams.get('data');
  
  if (!data) {
    return NextResponse.json(
      { error: 'Missing data parameter' },
      { status: 400 }
    );
  }

  try {
    // Decode the base64 data
    const decoded = decodeFromBase64(data);
    
    if (!decoded.files || decoded.files.length === 0) {
      return NextResponse.json(
        { error: 'No files found in data' },
        { status: 400 }
      );
    }

    const file = decoded.files[0];
    
    // Handle binary files (data URLs)
    if (file.isBinary && file.content.startsWith('data:')) {
      const matches = file.content.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${file.name}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      }
    }
    
    // Handle text files
    return new NextResponse(file.content, {
      headers: {
        'Content-Type': file.type || 'text/plain',
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}
