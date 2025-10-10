/**
 * Geocode facility addresses using Google Geocoding API
 *
 * This script:
 * 1. Fetches facilities without geocoding
 * 2. Calls Google Geocoding API for each address
 * 3. Updates database with lat/lng coordinates
 * 4. Includes rate limiting and error handling
 *
 * Usage:
 *   pnpm tsx scripts/geocode-facilities.ts [--batch-size=100] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!googleApiKey) {
  console.error('❌ Missing GOOGLE_GEOCODING_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
  console.error('   Add to .env.local: GOOGLE_GEOCODING_API_KEY=your-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse command line arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100');
const dryRun = args.includes('--dry-run');

interface GeocodeResult {
  latitude: number;
  longitude: number;
  quality: string;
  formattedAddress: string;
}

/**
 * Geocode a single address using Google Geocoding API
 */
async function geocodeAddress(address: string, city?: string, state?: string, zip?: string): Promise<GeocodeResult | null> {
  // Build full address string
  const fullAddress = [
    address,
    city,
    state,
    zip
  ].filter(Boolean).join(', ');

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        quality: result.geometry.location_type,
        formattedAddress: result.formatted_address,
      };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`   ⚠️  No results for: ${fullAddress}`);
      return null;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('   ❌ Google API quota exceeded');
      throw new Error('QUOTA_EXCEEDED');
    } else {
      console.warn(`   ⚠️  Geocoding failed (${data.status}): ${fullAddress}`);
      return null;
    }
  } catch (error) {
    console.error(`   ❌ Error geocoding address:`, error);
    return null;
  }
}

/**
 * Sleep for specified milliseconds (rate limiting)
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main geocoding function
 */
async function geocodeFacilities() {
  console.log('\n🗺️  Geocoding Facility Addresses\n');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No database updates will be made\n');
  }

  // 1. Check if columns exist
  const { data: sampleRow } = await supabase
    .from('resources')
    .select('*')
    .limit(1);

  if (sampleRow && sampleRow.length > 0) {
    const hasLatitude = 'latitude' in sampleRow[0];
    const hasLongitude = 'longitude' in sampleRow[0];

    if (!hasLatitude || !hasLongitude) {
      console.error('❌ Geocoding columns not found in database');
      console.error('   Run: psql $DATABASE_URL < scripts/add-geocoding-columns.sql');
      process.exit(1);
    }
  }

  // 2. Count facilities needing geocoding
  const { count: totalCount } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .is('latitude', null)
    .not('street_address', 'is', null);

  console.log(`📊 Facilities needing geocoding: ${totalCount?.toLocaleString()}\n`);
  console.log(`⚙️  Batch size: ${batchSize}`);
  console.log(`⏱️  Rate limit: 50 requests/second (Google free tier)\n`);

  if (totalCount === 0) {
    console.log('✅ All facilities already geocoded!\n');
    return;
  }

  // 3. Fetch batch of facilities
  const { data: facilities, error: fetchError } = await supabase
    .from('resources')
    .select('id, title, street_address, city, zip_code')
    .is('latitude', null)
    .not('street_address', 'is', null)
    .limit(batchSize);

  if (fetchError) {
    console.error('❌ Error fetching facilities:', fetchError);
    process.exit(1);
  }

  console.log(`🔄 Processing ${facilities?.length} facilities...\n`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  // 4. Geocode each facility
  for (let i = 0; i < (facilities?.length || 0); i++) {
    const facility = facilities![i];
    const progress = `[${i + 1}/${facilities?.length}]`;

    console.log(`${progress} ${facility.title}`);
    console.log(`   📍 ${facility.street_address}, ${facility.city || ''} ${facility.zip_code || ''}`);

    // Geocode the address
    const result = await geocodeAddress(
      facility.street_address,
      facility.city,
      undefined, // state not stored separately in city column
      facility.zip_code
    );

    if (result) {
      console.log(`   ✅ Geocoded: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)} (${result.quality})`);

      if (!dryRun) {
        // Update database
        const { error: updateError } = await supabase
          .from('resources')
          .update({
            latitude: result.latitude,
            longitude: result.longitude,
            geocoded_at: new Date().toISOString(),
            geocode_quality: result.quality,
          })
          .eq('id', facility.id);

        if (updateError) {
          console.error(`   ❌ Failed to update database:`, updateError);
          failCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } else {
      console.log(`   ⏭️  Skipped (no geocoding result)`);
      skipCount++;
    }

    // Rate limiting: Google allows 50 requests/second on free tier
    // Increased to 25 requests/second (40ms delay) for faster processing
    await sleep(40);

    // Progress update every 10 facilities
    if ((i + 1) % 10 === 0) {
      console.log(`\n   Progress: ${successCount} succeeded, ${failCount} failed, ${skipCount} skipped\n`);
    }
  }

  // 5. Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Geocoding Complete!\n');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);

  const remaining = (totalCount || 0) - batchSize;
  if (remaining > 0) {
    console.log(`\n   📋 Remaining: ${remaining.toLocaleString()} facilities`);
    console.log(`   💡 Run again to continue geocoding`);
  }

  console.log('');

  if (dryRun) {
    console.log('ℹ️  This was a dry run. Remove --dry-run flag to update database.\n');
  }
}

// Run the geocoding
geocodeFacilities().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
