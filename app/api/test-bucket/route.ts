import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json({
        error: 'Failed to list buckets',
        details: bucketsError.message,
      }, { status: 500 });
    }

    // Check if encoded-files bucket exists
    const encodedFilesBucket = buckets?.find(b => b.name === 'encoded-files');
    
    if (!encodedFilesBucket) {
      return NextResponse.json({
        error: 'Bucket not found',
        availableBuckets: buckets?.map(b => b.name) || [],
        message: 'Please create "encoded-files" bucket in Supabase Dashboard'
      }, { status: 404 });
    }

    // Try to list files in bucket
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from('encoded-files')
      .list('', { limit: 5 });

    return NextResponse.json({
      success: true,
      bucket: encodedFilesBucket,
      canListFiles: !filesError,
      filesError: filesError?.message,
      sampleFiles: files?.length || 0,
      message: 'Bucket access OK'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
