import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Increase body size limit for large files (50MB)
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

    console.log(`Starting upload: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Buffer created, uploading to Supabase...`);
    
    // Upload to Supabase Storage with larger file support
    const { data, error } = await supabaseAdmin.storage
      .from('encoded-files')
      .upload(fileName, buffer, {
        contentType: 'application/octet-stream',
        upsert: true,
        duplex: 'half' // Enable streaming for large files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('encoded-files')
      .getPublicUrl(data.path);

    console.log(`File uploaded to Supabase: ${publicUrl}`);

    return NextResponse.json({
      url: publicUrl,
      size: file.size,
      path: data.path,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
