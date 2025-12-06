/**
 * Upload Strategy Service
 * Automatically selects the best upload method based on file size
 */

export type UploadMethod = 'database' | 'blob' | 's3-multipart';

export interface UploadResult {
  url: string;
  method: UploadMethod;
  size: number;
}

/**
 * Size thresholds for different upload methods
 */
const THRESHOLDS = {
  DATABASE: 2 * 1024 * 1024,      // 2MB - Use Supabase database
  BLOB_STANDARD: 10 * 1024 * 1024, // 10MB - Use Vercel Blob
  S3_MULTIPART: 20 * 1024 * 1024,  // 20MB+ - Use S3 multipart upload
} as const;

/**
 * Determines the best upload method based on data size
 */
export function selectUploadMethod(dataSizeBytes: number): UploadMethod {
  if (dataSizeBytes <= THRESHOLDS.DATABASE) {
    return 'database';
  } else if (dataSizeBytes <= THRESHOLDS.BLOB_STANDARD) {
    return 'blob';
  } else {
    return 's3-multipart';
  }
}

/**
 * Upload encoded data using the optimal method
 */
export async function uploadEncodedData(
  encoded: string,
  options: {
    fileCount?: number;
    fileName?: string;
  } = {}
): Promise<UploadResult> {
  const dataSizeBytes = new Blob([encoded]).size;
  const method = selectUploadMethod(dataSizeBytes);
  const sizeMB = (dataSizeBytes / 1024 / 1024).toFixed(2);

  console.log(`[Upload Strategy] Size: ${sizeMB}MB, Method: ${method}`);

  switch (method) {
    case 'database':
      return uploadToDatabase(encoded, options);
    
    case 'blob':
      return uploadToBlob(encoded, options);
    
    case 's3-multipart':
      return uploadToS3(encoded, options);
    
    default:
      throw new Error(`Unknown upload method: ${method}`);
  }
}

/**
 * Upload to Supabase database (< 2MB)
 */
async function uploadToDatabase(
  encoded: string,
  options: { fileCount?: number }
): Promise<UploadResult> {
  const response = await fetch('/api/save-encoded', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: encoded,
      fileCount: options.fileCount || 1,
      totalSize: encoded.length,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload to database');
  }

  const result = await response.json();

  return {
    url: `DB:${result.id}`,
    method: 'database',
    size: encoded.length,
  };
}

/**
 * Upload to Vercel Blob storage (2-10MB)
 */
async function uploadToBlob(
  encoded: string,
  options: { fileName?: string }
): Promise<UploadResult> {
  const response = await fetch('/api/upload-blob-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: encoded,
      fileName: options.fileName || `encoded-${Date.now()}.bin`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload to blob storage');
  }

  const result = await response.json();

  return {
    url: `BLOB:${result.url}`,
    method: 'blob',
    size: encoded.length,
  };
}

/**
 * Upload to Supabase S3 with multipart (20MB+)
 */
async function uploadToS3(
  encoded: string,
  options: { fileName?: string }
): Promise<UploadResult> {
  // Convert string to Blob for FormData
  const blob = new Blob([encoded], { type: 'application/octet-stream' });
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('fileName', options.fileName || `encoded-${Date.now()}.bin`);

  const response = await fetch('/api/upload-s3', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to upload to S3 storage');
  }

  const result = await response.json();

  return {
    url: `S3:${result.url}`,
    method: 's3-multipart',
    size: blob.size,
  };
}

/**
 * Get human-readable description of upload method
 */
export function getUploadMethodDescription(method: UploadMethod): string {
  switch (method) {
    case 'database':
      return 'Lightweight (Database)';
    case 'blob':
      return 'Standard (Blob Storage)';
    case 's3-multipart':
      return 'Large File (S3 Multipart)';
    default:
      return 'Unknown';
  }
}
