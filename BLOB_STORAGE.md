# Vercel Blob Storage Setup

## Environment Variables

Add the following to your Vercel project:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_GOhH8MHVCwx8IN22_zvTNs9Y10X2ObYumsp4dIXnIEZ2x92
```

## Local Development

Create `.env.local` file:

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_GOhH8MHVCwx8IN22_zvTNs9Y10X2ObYumsp4dIXnIEZ2x92"
```

## How It Works

For files larger than 7KB:
1. File is uploaded to Vercel Blob Storage
2. Short download URL is generated
3. QR code contains the download URL
4. Scanning QR code triggers automatic file download

Files expire after 1 hour for security.
