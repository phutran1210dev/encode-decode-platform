import { put, del, head } from '@vercel/blob';

export interface BlobUploadOptions {
  data: string;
  fileName?: string;
  contentType?: string;
  expiresIn?: number; // seconds, default 30 minutes
}

export interface BlobMetadata {
  url: string;
  blobId: string;
  size: number;
  uploadedAt: number;
}

/**
 * Upload data to Vercel Blob Storage
 * Returns a URL that can be used to download the data
 */
export async function uploadToBlob(options: BlobUploadOptions): Promise<BlobMetadata> {
  const {
    data,
    fileName = `stream-${Date.now()}.bin`,
    contentType = 'application/octet-stream',
    expiresIn = 30 * 60 // 30 minutes default
  } = options;

  try {
    // Upload data to blob storage
    const blob = await put(fileName, data, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
      // Blob will be available for specified duration
      cacheControlMaxAge: expiresIn,
    });

    return {
      url: blob.url,
      blobId: blob.pathname,
      size: data.length,
      uploadedAt: Date.now(),
    };
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error(`Failed to upload to blob storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete blob by URL or pathname
 */
export async function deleteBlob(urlOrPathname: string): Promise<void> {
  try {
    await del(urlOrPathname);
  } catch (error) {
    console.error('Blob deletion error:', error);
    // Don't throw - deletion failures are not critical
  }
}

/**
 * Check if blob exists and get metadata
 */
export async function getBlobMetadata(url: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
  try {
    const metadata = await head(url);
    return {
      exists: true,
      size: metadata.size,
      contentType: metadata.contentType,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Generate a short-lived blob URL for large data
 * Returns a blob URL that can be embedded in QR code
 */
export async function createBlobUrlForQR(data: string, fileName?: string): Promise<string> {
  const metadata = await uploadToBlob({
    data,
    fileName,
    expiresIn: 60 * 60, // 1 hour
  });

  return metadata.url;
}
