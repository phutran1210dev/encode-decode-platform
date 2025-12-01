import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || 'data.bin';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob Storage
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: true
    });

    console.log(`File uploaded to blob: ${blob.url}`);

    return NextResponse.json({
      url: blob.url,
      size: file.size,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
