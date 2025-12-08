-- Migration: Add storage columns to encoded_files table
-- Date: 2025-12-08
-- Purpose: Support storing large files in Supabase Storage with DB:id reference

-- Add new columns
ALTER TABLE encoded_files 
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS storage_url text,
  ADD COLUMN IF NOT EXISTS file_name text;

-- Make data column nullable (either data or storage_path must exist)
ALTER TABLE encoded_files 
  ALTER COLUMN data DROP NOT NULL;

-- Add constraint to ensure at least one storage method exists
ALTER TABLE encoded_files 
  ADD CONSTRAINT check_data_or_storage 
  CHECK (data IS NOT NULL OR storage_path IS NOT NULL);

-- Create index for storage lookups
CREATE INDEX IF NOT EXISTS idx_encoded_files_storage_path 
  ON encoded_files(storage_path);

COMMENT ON COLUMN encoded_files.storage_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN encoded_files.storage_url IS 'Public URL for direct file access';
COMMENT ON COLUMN encoded_files.file_name IS 'Original filename for downloads';
