/**
 * Apply migration by creating a temporary function in Supabase
 * and executing it via RPC
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n🔧 Applying Geocoding Migration via Supabase REST API\n');
  console.log('='.repeat(60));

  try {
    console.log('\n📝 Creating temporary migration function...\n');

    // Step 1: Create a function that applies the migration
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION apply_geocoding_migration()
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Add columns
        ALTER TABLE resources
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_resources_coordinates
        ON resources(latitude, longitude);

        CREATE INDEX IF NOT EXISTS idx_resources_geocoded
        ON resources(geocoded_at) WHERE geocoded_at IS NULL;

        RETURN 'Migration complete';
      END;
      $$;
    `;

    // Try to execute using raw SQL via Supabase
    // This requires using the SQL editor or a custom RPC endpoint
    console.log('⚠️  Supabase REST API does not support DDL statements directly.\n');
    console.log('   Please run the migration using one of these methods:\n');

    console.log('   Method 1: Supabase SQL Editor (Recommended)');
    console.log('   -------------------------------------------');
    console.log('   1. Open: https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new');
    console.log('   2. Copy the SQL from: scripts/add-geocoding-columns.sql');
    console.log('   3. Click RUN\n');

    console.log('   Method 2: Create and call migration function');
    console.log('   -------------------------------------------');
    console.log('   1. Open: https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new');
    console.log('   2. Paste this SQL to create a migration function:\n');
    console.log(createFunctionSQL);
    console.log('\n   3. Then run this command:');
    console.log('      pnpm tsx -e "');
    console.log('        import { createClient } from \'@supabase/supabase-js\';');
    console.log('        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);');
    console.log('        const { data, error } = await supabase.rpc(\'apply_geocoding_migration\');');
    console.log('        console.log(data || error);');
    console.log('      "\n');

    console.log('   Quick SQL (copy to Supabase SQL Editor):');
    console.log('   ' + '='.repeat(60));
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
    console.log('   ' + '='.repeat(60));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

runMigration();
