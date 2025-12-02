import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing blob URL' },
        { status: 400 }
      );
    }

    // Delete blob from storage
    await del(url);

    return NextResponse.json({
      success: true,
      message: 'Blob deleted successfully' 
    });

  } catch (error) {
    console.error('Delete blob error:', error);
    return NextResponse.json(
      { error: 'Failed to delete blob' },
      { status: 500 }
    );
  }
}
