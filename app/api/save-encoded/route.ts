import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, fileCount, totalSize } = body;
    
    if (!data || typeof data !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      );
    }

    // Insert encoded data into Supabase
    const { data: result, error } = await supabaseAdmin
      .from('encoded_files')
      .insert({
        data: data,
        file_count: fileCount || 1,
        total_size: totalSize || data.length,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: `Failed to save data: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`Encoded data saved with ID: ${result.id}`);

    return NextResponse.json({
      id: result.id,
      size: data.length,
      savedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save encoded data error:', error);
    return NextResponse.json(
      { error: 'Failed to save encoded data' },
      { status: 500 }
    );
  }
}
