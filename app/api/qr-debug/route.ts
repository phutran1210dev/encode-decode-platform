import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' }, 
        { status: 400 }
      );
    }
    
    // Analyze data characteristics
    const analysis = {
      originalSize: data.length,
      type: typeof data,
      isBase64: /^[A-Za-z0-9+/=]+$/.test(data),
      hasDataUrl: data.includes('data:'),
      whitespaceCount: (data.match(/\s/g) || []).length,
      uniqueChars: new Set(data).size,
      repetitionRatio: data.length / new Set(data).size,
      sample: data.substring(0, 100) + (data.length > 100 ? '...' : '')
    };
    
    // Test compression
    const compressed = data
      .replace(/\s+/g, ' ')
      .replace(/={2,}/g, '=')
      .replace(/\+{2,}/g, '+')
      .replace(/\/{2,}/g, '/')
      .trim();
      
    const compressionRatio = compressed.length / data.length;
    
    // Recommendations
    const recommendations = [];
    if (analysis.originalSize > 2000) {
      recommendations.push('Data is large - will be automatically chunked');
    }
    if (compressionRatio < 0.9) {
      recommendations.push(`Compression can reduce size by ${Math.round((1-compressionRatio)*100)}%`);
    }
    if (analysis.whitespaceCount > analysis.originalSize * 0.1) {
      recommendations.push('Data has excessive whitespace - can be compressed');
    }
    
    return NextResponse.json({
      analysis,
      compression: {
        originalSize: analysis.originalSize,
        compressedSize: compressed.length,
        ratio: compressionRatio,
        savings: `${Math.round((1-compressionRatio)*100)}%`
      },
      qrCompatible: compressed.length <= 2000,
      willBeChunked: compressed.length > 1500,
      recommendations
    });
    
  } catch (error) {
    console.error('Data analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    );
  }
}