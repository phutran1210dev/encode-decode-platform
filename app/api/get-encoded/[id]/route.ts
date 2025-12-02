import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Fetch encoded data from Supabase
    const { data, error } = await supabaseAdmin
      .from('encoded_files')
      .select('data, file_count, total_size, created_at, access_count')
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

    console.log(`Encoded data retrieved: ${id}`);

    return NextResponse.json({
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
