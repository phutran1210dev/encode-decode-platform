import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Fetch encoded data from Supabase
    const { data, error } = await supabaseAdmin
      .from('encoded_files')
      .select('data, storage_path, storage_url, file_name, file_count, total_size, created_at, access_count')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Data not found or expired' },
        { status: 404 }
      );
    }

    // Update access count
    await supabaseAdmin
      .from('encoded_files')
      .update({ access_count: (data.access_count || 0) + 1 })
      .eq('id', id);

    // If this is a storage file, return download URL
    if (data.storage_url) {
      console.log(`Storage file requested: ${id} -> ${data.storage_url}`);
      return NextResponse.json({
        type: 'storage',
        url: data.storage_url,
        fileName: data.file_name,
        fileCount: data.file_count,
        totalSize: data.total_size,
        accessCount: (data.access_count || 0) + 1,
      });
    }

    // Otherwise return embedded data
    const dataLength = data.data?.length || 0;
    const expectedSize = data.total_size || 0;
    console.log(`Encoded data retrieved: ${id}`, {
      fileCount: data.file_count,
      totalSize: data.total_size,
      dataLength: dataLength,
      dataTruncated: dataLength < expectedSize,
    });

    return NextResponse.json({
      type: 'data',
      data: data.data,
      fileCount: data.file_count,
      totalSize: data.total_size,
      createdAt: data.created_at,
      accessCount: data.access_count + 1
    });

  } catch (error) {
    console.error('Get encoded data error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve encoded data' },
      { status: 500 }
    );
  }
}
