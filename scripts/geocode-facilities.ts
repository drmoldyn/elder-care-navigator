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
const loopAll = args.includes('--loop');
const maxBatchesArg = args.find((arg) => arg.startsWith('--max-batches='));
const maxBatches = maxBatchesArg ? parseInt(maxBatchesArg.split('=')[1], 10) : 0;
const providerTypeArg = args.find((arg) => arg.startsWith('--provider-type='));
const providerType = providerTypeArg ? providerTypeArg.split('=')[1] : undefined;

interface GeocodeResult {
  latitude: number;
  longitude: number;
  quality: string;
  formattedAddress: string;
}

/**
 * Geocode a single address using Google Geocoding API
 */
async function geocodeAddress(address: string, city?: string, state?: string, zip?: string, fallbackName?: string): Promise<GeocodeResult | null> {
  // Build full address string
  const fullAddress = [
    address,
    city,
    state,
    zip
  ].filter(Boolean).join(', ');

  const tryRequest = async (query: string) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleApiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return { data, query };
  };

  try {
    let { data } = await tryRequest(fullAddress);

    if (data.status === 'ZERO_RESULTS') {
      const sanitized = fullAddress
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .replace(/#/g, '')
        .trim();
      if (sanitized !== fullAddress) {
        console.warn(`   ⚠️  No results for: ${fullAddress} → retrying as ${sanitized}`);
        ({ data } = await tryRequest(sanitized));
      }
    }

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        quality: result.geometry.location_type,
        formattedAddress: result.formatted_address,
      };
    }

    if (data.status === 'ZERO_RESULTS' && fallbackName) {
      const fallbackQuery = [fallbackName, city, state].filter(Boolean).join(', ');
      console.warn(`   ⚠️  No results for: ${fullAddress} → retrying with facility name ${fallbackQuery}`);
      ({ data } = await tryRequest(fallbackQuery));
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          quality: result.geometry.location_type,
          formattedAddress: result.formatted_address,
        };
      }
    }

    if (data.status === 'ZERO_RESULTS') {
      console.warn(`   ⚠️  No results for: ${fullAddress}`);
      return null;
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('   ❌ Google API quota exceeded');
      throw new Error('QUOTA_EXCEEDED');
    }

    console.warn(`   ⚠️  Geocoding failed (${data.status}): ${fullAddress}`);
    return null;
  } catch (error) {
    console.error('   ❌ Error geocoding address:', error);
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

  const buildCountQuery = () => {
    let query = supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .is('latitude', null)
      .not('street_address', 'is', null);

    if (providerType) {
      query = query.eq('provider_type', providerType);
    }

    return query;
  };

  const buildFetchQuery = () => {
    let query = supabase
      .from('resources')
      .select('id, title, street_address, city, zip_code, states')
      .is('latitude', null)
      .not('street_address', 'is', null)
      .limit(batchSize);

    if (providerType) {
      query = query.eq('provider_type', providerType);
    }

    return query;
  };

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

  const { count: initialCount } = await buildCountQuery();
  let remaining = initialCount ?? 0;

  console.log(`📊 Facilities needing geocoding: ${remaining.toLocaleString()}${providerType ? ` (provider_type=${providerType})` : ''}\n`);
  console.log(`⚙️  Batch size: ${batchSize}`);
  console.log(`⏱️  Rate limit: 50 requests/second (Google free tier)\n`);

  if (remaining === 0) {
    console.log('✅ All facilities already geocoded!\n');
    return;
  }

  let batchNumber = 0;
  let totalSuccess = 0;
  let totalFail = 0;
  let totalSkip = 0;

  while (remaining > 0) {
    if (!loopAll && batchNumber > 0) {
      break;
    }
    if (maxBatches > 0 && batchNumber >= maxBatches) {
      break;
    }

    const { data: facilities, error: fetchError } = await buildFetchQuery();

    if (fetchError) {
      console.error('❌ Error fetching facilities:', fetchError);
      process.exit(1);
    }

    if (!facilities || facilities.length === 0) {
      console.log('✅ No more facilities needing geocoding.\n');
      break;
    }

    batchNumber++;
    console.log(`🔄 Processing batch ${batchNumber} (${facilities.length} facilities)...\n`);

    let batchSuccess = 0;
    let batchFail = 0;
    let batchSkip = 0;

    for (let i = 0; i < facilities.length; i++) {
      const facility = facilities[i];
      const progress = `[${i + 1}/${facilities.length}]`;

      console.log(`${progress} ${facility.title}`);
      console.log(`   📍 ${facility.street_address}, ${facility.city || ''} ${facility.zip_code || ''}`);

      const state = Array.isArray(facility.states) && facility.states.length > 0 ? facility.states[0] : undefined;
      const result = await geocodeAddress(
        facility.street_address,
        facility.city,
        state,
        facility.zip_code,
        facility.title ?? undefined
      );

      if (result) {
        console.log(`   ✅ Geocoded: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)} (${result.quality})`);

        if (!dryRun) {
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
            console.error('   ❌ Failed to update database:', updateError);
            batchFail++;
          } else {
            batchSuccess++;
          }
        } else {
          batchSuccess++;
        }
      } else {
        console.log('   ⏭️  Skipped (no geocoding result)');
        batchSkip++;
      }

      await sleep(40);

      if ((i + 1) % 10 === 0) {
        console.log(`\n   Progress (batch ${batchNumber}): ${batchSuccess} succeeded, ${batchFail} failed, ${batchSkip} skipped\n`);
      }
    }

    totalSuccess += batchSuccess;
    totalFail += batchFail;
    totalSkip += batchSkip;

    console.log(`\n🧮 Batch ${batchNumber} summary: ✅ ${batchSuccess}, ❌ ${batchFail}, ⏭️  ${batchSkip}\n`);

    const { count: newRemaining } = await buildCountQuery();
    remaining = newRemaining ?? 0;
    console.log(`📋 Remaining facilities: ${remaining.toLocaleString()}\n`);

    if (remaining === 0) {
      console.log('✅ All facilities geocoded!\n');
      break;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Geocoding Complete!\n');
  console.log(`   ✅ Success: ${totalSuccess}`);
  console.log(`   ❌ Failed: ${totalFail}`);
  console.log(`   ⏭️  Skipped: ${totalSkip}`);

  if (remaining > 0) {
    console.log(`\n   📋 Remaining: ${remaining.toLocaleString()} facilities`);
    if (!loopAll) {
      console.log('   💡 Run again (or add --loop/--max-batches) to continue geocoding');
    } else if (maxBatches > 0 && batchNumber >= maxBatches) {
      console.log('   💡 Increase --max-batches to continue geocoding in-loop');
    }
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
