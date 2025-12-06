import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3-supabase';

// Increase body size limit for large files
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || `file-${Date.now()}.bin`;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[S3 Upload] Starting: ${fileName} (${fileSizeMB}MB)`);
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[S3 Upload] Buffer created, uploading to Supabase S3...`);
    
    // Upload using S3-compatible API (supports multipart for large files)
    const result = await uploadToS3(
      buffer,
      fileName,
      file.type || 'application/octet-stream'
    );

    console.log(`[S3 Upload] Success: ${result.url}`);

    return NextResponse.json({
      url: result.url,
      size: file.size,
      path: result.key,
      uploadedAt: new Date().toISOString(),
      method: 's3-multipart'
    });

  } catch (error) {
    console.error('[S3 Upload] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
