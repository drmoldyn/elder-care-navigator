import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkMigrations() {
  console.log('🔍 Checking Supabase migration status...\n');

  // Check 0003: Geolocation columns
  console.log('Migration 0003 (Geolocation):');
  const { data: resources, error: geoError } = await supabase
    .from('resources')
    .select('latitude, longitude')
    .limit(1);

  if (geoError) {
    console.log('  ❌ NOT applied');
    console.log('  Error:', geoError.message);
  } else {
    console.log('  ✅ Applied - latitude/longitude columns exist');
  }

  // Check 0004: Info requests table
  console.log('\nMigration 0004 (Info Requests):');
  const { error: infoError } = await supabase
    .from('info_requests')
    .select('id')
    .limit(1);

  if (infoError) {
    console.log('  ❌ NOT applied');
    console.log('  Error:', infoError.message);
  } else {
    console.log('  ✅ Applied - info_requests table exists');
  }

  // Check 0005: Care type column
  console.log('\nMigration 0005 (Care Type):');
  const { error: careError } = await supabase
    .from('user_sessions')
    .select('care_type')
    .limit(1);

  if (careError) {
    console.log('  ❌ NOT applied');
    console.log('  Error:', careError.message);
  } else {
    console.log('  ✅ Applied - care_type column exists');
  }

  // Check 0006: Service areas table
  console.log('\nMigration 0006 (Service Areas):');
  const { data: serviceAreas, error: serviceError } = await supabase
    .from('home_health_service_areas')
    .select('id')
    .limit(1);

  if (serviceError) {
    console.log('  ❌ NOT applied');
    console.log('  Error:', serviceError.message);
  } else {
    const { count } = await supabase
      .from('home_health_service_areas')
      .select('*', { count: 'exact', head: true });
    console.log(`  ✅ Applied - ${count?.toLocaleString() || 0} service area mappings imported`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Summary:');

  const allGood = !geoError && !infoError && !careError && !serviceError;
  if (allGood) {
    console.log('✅ All migrations applied successfully!');
  } else {
    console.log('⚠️  Some migrations still need to be run.');
    console.log('See the prompts provided earlier to run them in Supabase SQL Editor.');
  }
}

checkMigrations().catch(console.error);
