import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const s3AccessKey = process.env.SUPABASE_S3_ACCESS_KEY_ID;
    const s3SecretKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
    
    return NextResponse.json({
      s3_credentials: {
        access_key_set: !!s3AccessKey,
        access_key_length: s3AccessKey?.length || 0,
        secret_key_set: !!s3SecretKey,
        secret_key_length: s3SecretKey?.length || 0,
      },
      supabase: {
        url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_role_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
