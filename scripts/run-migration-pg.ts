/**
 * Run migration using pg library with Supabase connection pooler
 */

import { Client } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

async function runMigration() {
  console.log('\n🔧 Running Geocoding Migration via PostgreSQL\n');
  console.log('='.repeat(60));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Could not extract project reference');
    process.exit(1);
  }

  // Supabase connection pooler format
  // We'll use the service role key as password with the pooler
  const connectionString = `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('\n📋 Connection Info:');
  console.log(`   Project: ${projectRef}`);
  console.log(`   Pooler: aws-0-us-east-1.pooler.supabase.com:6543`);
  console.log('');

  // Try using Supabase session pooler with service role key
  // This might work for some operations

  const client = new Client({
    host: `aws-0-us-east-1.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Attempting connection to Supabase pooler...');
    await client.connect();
    console.log('   ✅ Connected!\n');

    // Read migration SQL
    const sqlPath = join(process.cwd(), 'scripts/add-geocoding-columns.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    // Split SQL into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`   ${i + 1}/${statements.length} Executing...`);

      try {
        await client.query(stmt + ';');
        console.log(`   ✅ Success`);
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists (OK)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migration complete!\n');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'resources'
      AND column_name IN ('latitude', 'longitude', 'geocoded_at', 'geocode_quality')
      ORDER BY column_name;
    `);

    console.log('✅ Verified columns added:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Connection/Migration failed:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('\n⚠️  The service role key cannot be used as database password.');
      console.log('   Supabase requires the actual database password for direct connections.\n');
      console.log('   Options:');
      console.log('   1. Run SQL in Supabase SQL Editor (easiest)');
      console.log('   2. Get database password from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
      console.log('   3. Add to .env.local: SUPABASE_DB_PASSWORD=your-password');
      console.log('   4. Run this script again\n');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
