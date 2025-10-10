/**
 * Run geocoding migration on Supabase database
 * Adds latitude, longitude, geocoded_at, and geocode_quality columns
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n🔧 Running Geocoding Migration\n');
  console.log('='.repeat(60));

  try {
    // Check if columns already exist
    const { data: sampleRow } = await supabase
      .from('resources')
      .select('*')
      .limit(1);

    if (sampleRow && sampleRow.length > 0) {
      const hasLatitude = 'latitude' in sampleRow[0];
      const hasLongitude = 'longitude' in sampleRow[0];

      if (hasLatitude && hasLongitude) {
        console.log('✅ Geocoding columns already exist!');
        console.log('   latitude: ✓');
        console.log('   longitude: ✓');
        console.log('   geocoded_at: ' + ('geocoded_at' in sampleRow[0] ? '✓' : '❌'));
        console.log('   geocode_quality: ' + ('geocode_quality' in sampleRow[0] ? '✓' : '❌'));
        console.log('\n💡 Ready to run geocoding script\n');
        return;
      }
    }

    console.log('\n⚠️  Geocoding columns not found');
    console.log('   You need to run the SQL migration manually:\n');
    console.log('   Option 1: Run in Supabase SQL Editor');
    console.log('   1. Go to https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql');
    console.log('   2. Copy contents of scripts/add-geocoding-columns.sql');
    console.log('   3. Run the SQL\n');
    console.log('   Option 2: Use psql (if you have direct database access)');
    console.log('   psql <connection-string> < scripts/add-geocoding-columns.sql\n');

  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    process.exit(1);
  }
}

runMigration();
