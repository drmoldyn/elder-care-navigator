/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Run geocoding migration directly via PostgreSQL connection
 * This bypasses the Supabase REST API and connects directly to the database
 */

import { Client } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

async function runMigration() {
  console.log('\n🔧 Running Geocoding Migration via Direct PostgreSQL Connection\n');
  console.log('='.repeat(60));

  // Construct PostgreSQL connection string from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Extract project ref from Supabase URL
  const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Could not extract project reference from Supabase URL');
    process.exit(1);
  }

  // Construct connection string
  // Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  // Note: We need the database password, which is different from the service role key

  console.log('\n⚠️  Direct PostgreSQL connection requires database password');
  console.log('   The Supabase service role key is not the database password.\n');
  console.log('   To get your database password:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
  console.log('   2. Look for "Connection string" or "Database password"');
  console.log('   3. Reset password if needed\n');

  // Try to connect with pooler connection string format
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || '[PASSWORD]'}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('   Connection string format:');
  console.log('   ' + connectionString.replace(/:[^:@]+@/, ':[PASSWORD]@'));
  console.log('');

  if (!process.env.SUPABASE_DB_PASSWORD) {
    console.log('❌ SUPABASE_DB_PASSWORD not set in .env.local');
    console.log('   Add your database password to .env.local:');
    console.log('   SUPABASE_DB_PASSWORD=your-db-password\n');
    console.log('💡 Alternative: Run the SQL manually in Supabase SQL Editor');
    console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('   ✅ Connected\n');

    // Read the migration SQL
    const sqlPath = join(process.cwd(), 'scripts/add-geocoding-columns.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    // Execute the SQL
    await client.query(sql);

    console.log('✅ Migration complete!\n');

    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'resources'
      AND column_name IN ('latitude', 'longitude', 'geocoded_at', 'geocode_quality')
      ORDER BY column_name;
    `);

    console.log('✅ Verified columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    console.log('');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
