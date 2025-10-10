/**
 * Add geocoding columns to resources table via Supabase client
 * This executes the migration using raw SQL through Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n🔧 Adding Geocoding Columns to Database\n');
  console.log('='.repeat(60));

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts/add-geocoding-columns.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('\n📝 SQL to execute:\n');
    console.log(sql);
    console.log('\n' + '='.repeat(60));

    // Execute each SQL statement separately
    const statements = [
      // Add columns
      `ALTER TABLE resources
       ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
       ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
       ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
       ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50)`,

      // Create coordinate index
      `CREATE INDEX IF NOT EXISTS idx_resources_coordinates
       ON resources(latitude, longitude)`,

      // Create geocoded index
      `CREATE INDEX IF NOT EXISTS idx_resources_geocoded
       ON resources(geocoded_at) WHERE geocoded_at IS NULL`
    ];

    for (let i = 0; i < statements.length; i++) {
      console.log(`\n${i + 1}. Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql: statements[i]
      });

      if (error) {
        // Try alternative method using REST API
        console.log('   Trying alternative method...');

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statements[i] }),
        });

        if (!response.ok) {
          console.error(`   ❌ Failed: ${error.message}`);
          console.log('\n⚠️  Note: Supabase client cannot execute DDL statements directly');
          console.log('   Please run the migration manually in Supabase SQL Editor:');
          console.log(`   https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql\n`);
          return;
        }
      }

      console.log('   ✅ Success');
    }

    console.log('\n✨ Migration complete!\n');

    // Verify columns were added
    const { data } = await supabase
      .from('resources')
      .select('latitude, longitude, geocoded_at, geocode_quality')
      .limit(1);

    if (data) {
      console.log('✅ Verified: Geocoding columns are now available\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   1. Go to https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql');
    console.log('   2. Copy contents of scripts/add-geocoding-columns.sql');
    console.log('   3. Click "RUN"\n');
  }
}

runMigration();
