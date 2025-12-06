import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Supabase S3-compatible storage configuration
const S3_ENDPOINT = 'https://ahqhgpblpyzpwahyyfiy.storage.supabase.co';
const S3_REGION = 'us-east-1';
const S3_BUCKET = 'encoded-files';

// Initialize S3 client with Supabase credentials
export const s3Client = new S3Client({
  endpoint: `${S3_ENDPOINT}/storage/v1/s3`,
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || 'ab3725275b1423d90a0197296adf1965',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '6a272ac6ec3a144f7749103899b3989b1732db27663ae574ed5965575c7bd5cf',
  },
  forcePathStyle: true, // Required for Supabase S3
});

/**
 * Upload file to Supabase Storage using S3-compatible API
 * Supports large files with automatic multipart upload
 */
export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<{ url: string; key: string; size: number }> {
  const key = fileName;

  try {
    // Use Upload from @aws-sdk/lib-storage for automatic multipart upload
    // This handles large files efficiently (splits into 5MB chunks automatically)
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
      // Configure multipart upload thresholds
      queueSize: 4, // concurrent part uploads
      partSize: 5 * 1024 * 1024, // 5MB parts (minimum for S3)
    });

    // Optional: track upload progress
    upload.on('httpUploadProgress', (progress: { loaded?: number; total?: number }) => {
      if (progress.loaded && progress.total) {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
        console.log(`Upload progress: ${percent}% (${progress.loaded}/${progress.total} bytes)`);
      }
    });

    await upload.done();

    // Construct public URL
    const publicUrl = `${S3_ENDPOINT}/storage/v1/object/public/${S3_BUCKET}/${key}`;

    return {
      url: publicUrl,
      key,
      size: buffer.length,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

/**
 * Upload file using simple PutObject (for smaller files < 5MB)
 */
export async function uploadToS3Simple(
  buffer: Buffer,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<{ url: string; key: string; size: number }> {
  const key = fileName;

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const publicUrl = `${S3_ENDPOINT}/storage/v1/object/public/${S3_BUCKET}/${key}`;

    return {
      url: publicUrl,
      key,
      size: buffer.length,
    };
  } catch (error) {
    console.error('S3 simple upload error:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage using S3-compatible API
 */
export async function deleteFromS3(fileName: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    await s3Client.send(command);
    console.log(`File deleted from S3: ${fileName}`);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
}
