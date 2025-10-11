#!/usr/bin/env tsx
/**
 * Populate Facility Identifiers
 *
 * Extracts CCN and NPI identifiers from existing resources table
 * and populates the facility_identifiers crosswalk table.
 *
 * This is Phase 4 of the Data Acquisition Plan - creating the
 * foundational crosswalk infrastructure for linking facilities
 * across different data sources.
 *
 * Usage:
 *   pnpm tsx scripts/populate-identifiers.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Resource {
  id: string;
  facility_id: string | null;  // CCN
  npi: string | null;
  state: string | null;
  states: string[] | null;
  provider_type: string | null;
}

interface IdentifierRecord {
  resource_id: string;
  identifier_type: string;
  identifier_value: string;
  state: string | null;
  source: string;
  confidence_score: number;
}

interface Stats {
  totalResources: number;
  ccnFound: number;
  npiFound: number;
  identifiersCreated: number;
  duplicatesSkipped: number;
  errors: number;
}

/**
 * Fetch all resources with CCN or NPI data
 */
async function fetchResources(): Promise<Resource[]> {
  console.log('📂 Fetching resources from database...\n');

  const { data, error } = await supabase
    .from('resources')
    .select('id, facility_id, npi, state, states, provider_type')
    .or('facility_id.not.is.null,npi.not.is.null');

  if (error) {
    throw new Error(`Failed to fetch resources: ${error.message}`);
  }

  console.log(`✅ Found ${data.length.toLocaleString()} resources with identifiers\n`);
  return data;
}

/**
 * Build identifier records from resource data
 */
function buildIdentifiers(resources: Resource[]): IdentifierRecord[] {
  const identifiers: IdentifierRecord[] = [];

  for (const resource of resources) {
    // Determine the state for this resource
    // Prefer single 'state' field, fall back to first state in 'states' array
    let resourceState: string | null = null;
    if (resource.state && resource.state.length === 2) {
      resourceState = resource.state.toUpperCase();
    } else if (resource.states && resource.states.length > 0) {
      resourceState = resource.states[0].toUpperCase();
    }

    // Add CCN (facility_id) identifier
    if (resource.facility_id && resource.facility_id.trim()) {
      identifiers.push({
        resource_id: resource.id,
        identifier_type: 'CCN',
        identifier_value: resource.facility_id.trim(),
        state: resourceState,
        source: 'CMS',
        confidence_score: 1.0,
      });
    }

    // Add NPI identifier
    if (resource.npi && resource.npi.trim()) {
      identifiers.push({
        resource_id: resource.id,
        identifier_type: 'NPI',
        identifier_value: resource.npi.trim(),
        state: null, // NPI is a national identifier
        source: 'CMS',
        confidence_score: 1.0,
      });
    }
  }

  return identifiers;
}

/**
 * Insert identifiers into database in batches
 */
async function insertIdentifiers(
  identifiers: IdentifierRecord[],
  batchSize: number = 1000
): Promise<{ inserted: number; duplicates: number; errors: number }> {
  let inserted = 0;
  let duplicates = 0;
  let errors = 0;

  console.log(`📝 Inserting ${identifiers.length.toLocaleString()} identifiers in batches of ${batchSize}...\n`);

  for (let i = 0; i < identifiers.length; i += batchSize) {
    const batch = identifiers.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(identifiers.length / batchSize);

    try {
      const { data, error } = await supabase
        .from('facility_identifiers')
        .insert(batch)
        .select('id');

      if (error) {
        // Check if error is due to unique constraint violation (duplicates)
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          console.log(`⚠️  Batch ${batchNumber}/${totalBatches}: Skipped duplicates`);
          duplicates += batch.length;
        } else {
          console.error(`❌ Batch ${batchNumber}/${totalBatches}: Error - ${error.message}`);
          errors += batch.length;
        }
      } else {
        inserted += data?.length || batch.length;
        if (batchNumber % 10 === 0 || i + batchSize >= identifiers.length) {
          console.log(
            `✅ Progress: ${Math.min(i + batchSize, identifiers.length).toLocaleString()}/${identifiers.length.toLocaleString()} (${Math.round((Math.min(i + batchSize, identifiers.length) / identifiers.length) * 100)}%)`
          );
        }
      }
    } catch (err) {
      console.error(`❌ Exception in batch ${batchNumber}/${totalBatches}:`, err);
      errors += batch.length;
    }

    // Small delay to avoid overwhelming the database
    if (i + batchSize < identifiers.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { inserted, duplicates, errors };
}

/**
 * Main execution function
 */
async function populateIdentifiers() {
  console.log('🚀 Starting facility identifiers population\n');
  console.log('=' .repeat(60));
  console.log('\n');

  const stats: Stats = {
    totalResources: 0,
    ccnFound: 0,
    npiFound: 0,
    identifiersCreated: 0,
    duplicatesSkipped: 0,
    errors: 0,
  };

  try {
    // Step 1: Fetch resources with identifiers
    const resources = await fetchResources();
    stats.totalResources = resources.length;

    // Step 2: Build identifier records
    console.log('🔨 Building identifier records...\n');
    const identifiers = buildIdentifiers(resources);

    // Count identifier types
    stats.ccnFound = identifiers.filter(i => i.identifier_type === 'CCN').length;
    stats.npiFound = identifiers.filter(i => i.identifier_type === 'NPI').length;

    console.log(`   CCN identifiers:  ${stats.ccnFound.toLocaleString()}`);
    console.log(`   NPI identifiers:  ${stats.npiFound.toLocaleString()}`);
    console.log(`   Total to insert:  ${identifiers.length.toLocaleString()}\n`);

    // Step 3: Insert identifiers
    const insertResult = await insertIdentifiers(identifiers);
    stats.identifiersCreated = insertResult.inserted;
    stats.duplicatesSkipped = insertResult.duplicates;
    stats.errors = insertResult.errors;

    // Step 4: Print summary
    console.log('\n');
    console.log('=' .repeat(60));
    console.log('✨ Population Complete!\n');
    console.log('Summary:');
    console.log(`   Total resources processed:    ${stats.totalResources.toLocaleString()}`);
    console.log(`   CCN identifiers found:        ${stats.ccnFound.toLocaleString()}`);
    console.log(`   NPI identifiers found:        ${stats.npiFound.toLocaleString()}`);
    console.log(`   Identifiers created:          ${stats.identifiersCreated.toLocaleString()}`);
    console.log(`   Duplicates skipped:           ${stats.duplicatesSkipped.toLocaleString()}`);
    console.log(`   Errors:                       ${stats.errors.toLocaleString()}`);
    console.log('\n');

    // Step 5: Verification query
    console.log('📊 Verification Stats:\n');

    const { data: typeCount, error: typeError } = await supabase
      .from('facility_identifiers')
      .select('identifier_type')
      .then(async (result) => {
        if (result.error) return result;

        const counts: Record<string, number> = {};
        result.data.forEach((row: { identifier_type: string }) => {
          counts[row.identifier_type] = (counts[row.identifier_type] || 0) + 1;
        });

        return { data: counts, error: null };
      });

    if (!typeError && typeCount) {
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count.toLocaleString()}`);
      });
    }

    const { count: resourcesWithIdentifiers, error: countError } = await supabase
      .from('facility_identifiers')
      .select('resource_id', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n   Resources with identifiers: ${resourcesWithIdentifiers?.toLocaleString() || 'N/A'}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Run verification: pnpm tsx scripts/verify-identifiers.ts');
    console.log('  2. Test lookup functions in your code');
    console.log('  3. Begin importing state licensing data\n');

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
populateIdentifiers();
