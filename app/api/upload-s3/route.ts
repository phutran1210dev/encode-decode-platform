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
    console.log(`[Upload] Starting: ${fileName} (${fileSizeMB}MB)`);
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Try S3 API first (best for large files)
    try {
      console.log(`[S3 Upload] Attempting S3 multipart upload...`);
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
    } catch (s3Error) {
      console.warn('[S3 Upload] Failed, falling back to Supabase SDK:', s3Error);
      
      // Fallback to Supabase SDK
      const { supabaseAdmin } = await import('@/lib/supabase');
      
      console.log(`[Supabase Upload] Using Supabase SDK...`);
      
      const { data, error } = await supabaseAdmin.storage
        .from('encoded-files')
        .upload(fileName, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('encoded-files')
        .getPublicUrl(data.path);

      console.log(`[Supabase Upload] Success: ${publicUrl}`);

      return NextResponse.json({
        url: publicUrl,
        size: file.size,
        path: data.path,
        uploadedAt: new Date().toISOString(),
        method: 'supabase-sdk'
      });
    }

  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
