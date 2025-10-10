/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Automated migration using Supabase connection info
 * This script will guide you through getting the DB password if needed
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

async function autoMigrate() {
  console.log('\n🚀 Automated Geocoding Migration Setup\n');
  console.log('='.repeat(60));

  console.log('\n📋 Project Info:');
  console.log(`   Project ID: ${projectRef}`);
  console.log(`   URL: ${supabaseUrl}`);
  console.log('');

  console.log('⚠️  Supabase requires manual SQL execution for security.\n');
  console.log('   I cannot execute DDL statements (ALTER TABLE, CREATE INDEX)');
  console.log('   directly via the API or client libraries.\n');

  console.log('📝 Here is the simplest process:\n');

  console.log('   Step 1: Open this URL in your browser');
  console.log('   ======================================');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('');

  console.log('   Step 2: Copy this SQL');
  console.log('   =====================');
  console.log(`
-- Add geocoding columns
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resources_coordinates ON resources(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_resources_geocoded ON resources(geocoded_at) WHERE geocoded_at IS NULL;
  `);

  console.log('   Step 3: Click "RUN" button');
  console.log('   ===========================');
  console.log('   You should see: "Success. No rows returned"');
  console.log('');

  console.log('   Step 4: Verify migration worked');
  console.log('   ================================');
  console.log('   Run: pnpm tsx scripts/run-geocoding-migration.ts');
  console.log('');

  console.log('   Step 5: Start geocoding');
  console.log('   =======================');
  console.log('   Run: pnpm tsx scripts/geocode-facilities.ts --batch-size=100');
  console.log('');

  console.log('⏱️  Total time: ~2 minutes to run SQL + 2 hours to geocode\n');

  console.log('💡 Copy the URL above, paste in browser, copy the SQL, and run it!\n');
}

autoMigrate();
