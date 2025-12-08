// MANUAL MIGRATION REQUIRED
// 
// This migration cannot be run automatically via API.
// Please run manually in Supabase SQL Editor:
// 
// 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
// 2. Copy contents of migrations/add-storage-columns.sql
// 3. Click "Run"
//
// Alternatively, use Supabase CLI:
// supabase db push

console.log(`
⚠️  MANUAL MIGRATION REQUIRED

Please run the following SQL in your Supabase dashboard:

1. Go to: Supabase Dashboard > SQL Editor
2. Copy and paste the contents of: migrations/add-storage-columns.sql
3. Click "Run"

Or use psql directly:
psql "YOUR_DATABASE_URL" < migrations/add-storage-columns.sql
`);
