/**
 * Apply geocoding migration by executing raw SQL via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n🔧 Applying Geocoding Migration\n');
  console.log('='.repeat(60));

  try {
    // Execute the migration using Supabase's SQL execution
    // Note: This requires the postgres extension or direct SQL execution capability

    console.log('\n📝 Executing SQL statements...\n');

    // Add columns
    console.log('1/3 Adding geocoding columns...');
    const { error: error1 } = await (supabase as any).rpc('exec', {
      sql: `
        ALTER TABLE resources
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);
      `
    });

    if (error1) {
      console.log('   Note: Direct SQL execution not available via Supabase client');
      console.log('   Please run migration manually in Supabase SQL Editor\n');
      console.log('   URL: https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new\n');
      console.log('   SQL to run:');
      console.log('   ---');
      console.log(`
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_resources_coordinates
ON resources(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_resources_geocoded
ON resources(geocoded_at) WHERE geocoded_at IS NULL;
      `);
      console.log('   ---\n');
      return false;
    }

    console.log('   ✅ Columns added');

    // Create indexes
    console.log('2/3 Creating coordinate index...');
    await (supabase as any).rpc('exec', {
      sql: `CREATE INDEX IF NOT EXISTS idx_resources_coordinates ON resources(latitude, longitude);`
    });
    console.log('   ✅ Coordinate index created');

    console.log('3/3 Creating geocoded index...');
    await (supabase as any).rpc('exec', {
      sql: `CREATE INDEX IF NOT EXISTS idx_resources_geocoded ON resources(geocoded_at) WHERE geocoded_at IS NULL;`
    });
    console.log('   ✅ Geocoded index created');

    console.log('\n✨ Migration complete!\n');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new\n');
    return false;
  }
}

applyMigration();
