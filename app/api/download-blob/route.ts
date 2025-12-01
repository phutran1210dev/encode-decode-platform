import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing blob URL parameter' },
        { status: 400 }
      );
    }

    // Fetch data from blob storage
    const blobResponse = await fetch(url);
    
    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: 'Blob not found or expired' },
        { status: 404 }
      );
    }

    // Get the blob data
    const blobData = await blobResponse.arrayBuffer();
    const contentType = blobResponse.headers.get('content-type') || 'application/octet-stream';
    
    // Extract filename from URL or use default
    const urlPath = new URL(url).pathname;
    const fileName = urlPath.split('/').pop() || 'download';

    // Delete blob after download (cleanup)
    // Run async without blocking response
    del(url).then(() => {
      console.log(`Blob deleted after download: ${url}`);
    }).catch((err) => {
      console.error('Failed to delete blob:', err);
      // Don't fail the download if deletion fails
    });

    // Return the file for download
    return new NextResponse(blobData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': blobData.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Blob download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
