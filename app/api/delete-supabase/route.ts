import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing file URL' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    // URL format: https://ahqhgpblpyzpwahyyfiy.supabase.co/storage/v1/object/public/encoded-files/file-123.bin
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // Delete from Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from('encoded-files')
      .remove([fileName]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`File deleted from Supabase: ${fileName}`);

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully' 
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
