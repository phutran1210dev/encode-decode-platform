const { Pool } = require('pg');

// Direct connection (avoid dotenv dependency)  
const connectionString = 'postgres://postgres.ahqhgpblpyzpwahyyfiy:KGqPpdFZdzX5j1Zn@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

if (!connectionString) {
  console.error('❌ Connection string not configured');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🔄 Running database migration...\n');
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Add new columns
    console.log('1. Adding storage columns...');
    await client.query(`
      ALTER TABLE encoded_files 
        ADD COLUMN IF NOT EXISTS storage_path text,
        ADD COLUMN IF NOT EXISTS storage_url text,
        ADD COLUMN IF NOT EXISTS file_name text;
    `);
    console.log('   ✅ Columns added');
    
    // Make data nullable
    console.log('2. Making data column nullable...');
    await client.query('ALTER TABLE encoded_files ALTER COLUMN data DROP NOT NULL;');
    console.log('   ✅ Data column now nullable');
    
    // Add constraint (with DROP IF EXISTS first)
    console.log('3. Adding storage constraint...');
    await client.query(`
      ALTER TABLE encoded_files DROP CONSTRAINT IF EXISTS check_data_or_storage;
    `);
    await client.query(`
      ALTER TABLE encoded_files 
        ADD CONSTRAINT check_data_or_storage 
        CHECK (data IS NOT NULL OR storage_path IS NOT NULL);
    `);
    console.log('   ✅ Constraint added');
    
    // Create index
    console.log('4. Creating storage index...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_encoded_files_storage_path ON encoded_files(storage_path);');
    console.log('   ✅ Index created');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease run the SQL manually in Supabase Dashboard > SQL Editor');
    console.error('File: migrations/add-storage-columns.sql\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
