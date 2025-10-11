#!/usr/bin/env tsx
/**
 * Verify Facility Identifiers
 *
 * Data quality verification script for the facility_identifiers crosswalk table.
 * Generates reports on identifier coverage, confidence scores, and potential duplicates.
 *
 * Part of Phase 4 of the Data Acquisition Plan.
 *
 * Usage:
 *   pnpm tsx scripts/verify-identifiers.ts
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

interface IdentifierStats {
  totalIdentifiers: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  byState: Record<string, number>;
  verified: number;
  unverified: number;
}

interface ResourceCoverage {
  totalResources: number;
  withIdentifiers: number;
  withoutIdentifiers: number;
  withMultipleIdentifiers: number;
  avgIdentifiersPerResource: number;
}

interface ConfidenceStats {
  perfect: number; // 1.0
  high: number; // 0.9-0.99
  medium: number; // 0.7-0.89
  low: number; // < 0.7
  distribution: Array<{ range: string; count: number }>;
}

interface DuplicateInfo {
  identifierType: string;
  identifierValue: string;
  state: string | null;
  resourceCount: number;
  resourceIds: string[];
  facilityNames: string[];
}

/**
 * Count total identifiers by type, source, and state
 */
async function getIdentifierStats(): Promise<IdentifierStats> {
  const stats: IdentifierStats = {
    totalIdentifiers: 0,
    byType: {},
    bySource: {},
    byState: {},
    verified: 0,
    unverified: 0,
  };

  // Get all identifiers
  const { data: identifiers, error } = await supabase
    .from('facility_identifiers')
    .select('identifier_type, source, state, verified_at');

  if (error) {
    throw new Error(`Failed to fetch identifiers: ${error.message}`);
  }

  stats.totalIdentifiers = identifiers.length;

  // Count by type, source, and state
  identifiers.forEach((id) => {
    // By type
    stats.byType[id.identifier_type] = (stats.byType[id.identifier_type] || 0) + 1;

    // By source
    stats.bySource[id.source] = (stats.bySource[id.source] || 0) + 1;

    // By state (handle null)
    const state = id.state || 'National';
    stats.byState[state] = (stats.byState[state] || 0) + 1;

    // Verification status
    if (id.verified_at) {
      stats.verified++;
    } else {
      stats.unverified++;
    }
  });

  return stats;
}

/**
 * Analyze resource coverage (resources with/without identifiers)
 */
async function getResourceCoverage(): Promise<ResourceCoverage> {
  // Total resources
  const { count: totalResources, error: totalError } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error(`Failed to count resources: ${totalError.message}`);
  }

  // Resources with at least one identifier
  const { data: resourcesWithIds, error: idsError } = await supabase
    .from('facility_identifiers')
    .select('resource_id');

  if (idsError) {
    throw new Error(`Failed to fetch resource IDs: ${idsError.message}`);
  }

  const uniqueResourcesWithIds = new Set(resourcesWithIds.map((r) => r.resource_id));
  const withIdentifiers = uniqueResourcesWithIds.size;

  // Count identifiers per resource
  const identifierCounts: Record<string, number> = {};
  resourcesWithIds.forEach((r) => {
    identifierCounts[r.resource_id] = (identifierCounts[r.resource_id] || 0) + 1;
  });

  const withMultipleIdentifiers = Object.values(identifierCounts).filter((count) => count > 1).length;
  const avgIdentifiersPerResource =
    withIdentifiers > 0 ? resourcesWithIds.length / withIdentifiers : 0;

  return {
    totalResources: totalResources || 0,
    withIdentifiers,
    withoutIdentifiers: (totalResources || 0) - withIdentifiers,
    withMultipleIdentifiers,
    avgIdentifiersPerResource,
  };
}

/**
 * Analyze confidence score distribution
 */
async function getConfidenceStats(): Promise<ConfidenceStats> {
  const { data: identifiers, error } = await supabase
    .from('facility_identifiers')
    .select('confidence_score');

  if (error) {
    throw new Error(`Failed to fetch confidence scores: ${error.message}`);
  }

  const stats: ConfidenceStats = {
    perfect: 0,
    high: 0,
    medium: 0,
    low: 0,
    distribution: [],
  };

  // Count by category
  identifiers.forEach((id) => {
    const score = id.confidence_score;
    if (score === 1.0) {
      stats.perfect++;
    } else if (score >= 0.9) {
      stats.high++;
    } else if (score >= 0.7) {
      stats.medium++;
    } else {
      stats.low++;
    }
  });

  // Build distribution
  stats.distribution = [
    { range: '1.0 (Perfect)', count: stats.perfect },
    { range: '0.9-0.99 (High)', count: stats.high },
    { range: '0.7-0.89 (Medium)', count: stats.medium },
    { range: '<0.7 (Low)', count: stats.low },
  ];

  return stats;
}

/**
 * Find potential duplicates (same identifier -> multiple resources)
 */
async function findDuplicates(): Promise<DuplicateInfo[]> {
  const { data, error } = await supabase
    .from('view_facility_identifier_summary')
    .select('*')
    .gt('resource_count', 1)
    .order('resource_count', { ascending: false })
    .limit(50); // Top 50 duplicates

  if (error) {
    throw new Error(`Failed to fetch duplicates: ${error.message}`);
  }

  return data.map((row) => ({
    identifierType: row.identifier_type,
    identifierValue: row.identifier_value,
    state: row.state,
    resourceCount: row.resource_count,
    resourceIds: row.resource_ids,
    facilityNames: row.facility_names,
  }));
}

/**
 * Print formatted statistics
 */
function printReport(
  identifierStats: IdentifierStats,
  resourceCoverage: ResourceCoverage,
  confidenceStats: ConfidenceStats,
  duplicates: DuplicateInfo[]
) {
  console.log('\n' + '='.repeat(70));
  console.log('FACILITY IDENTIFIERS VERIFICATION REPORT');
  console.log('='.repeat(70));

  // Section 1: Identifier Statistics
  console.log('\n📊 IDENTIFIER STATISTICS\n');
  console.log(`   Total Identifiers: ${identifierStats.totalIdentifiers.toLocaleString()}`);
  console.log('');
  console.log('   By Type:');
  Object.entries(identifierStats.byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / identifierStats.totalIdentifiers) * 100).toFixed(1);
      console.log(`      ${type.padEnd(20)} ${count.toLocaleString().padStart(10)}  (${percentage}%)`);
    });
  console.log('');
  console.log('   By Source:');
  Object.entries(identifierStats.bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      const percentage = ((count / identifierStats.totalIdentifiers) * 100).toFixed(1);
      console.log(
        `      ${source.padEnd(20)} ${count.toLocaleString().padStart(10)}  (${percentage}%)`
      );
    });
  console.log('');
  console.log('   Verification Status:');
  console.log(`      Verified:     ${identifierStats.verified.toLocaleString()}`);
  console.log(`      Unverified:   ${identifierStats.unverified.toLocaleString()}`);

  // Section 2: Resource Coverage
  console.log('\n📍 RESOURCE COVERAGE\n');
  console.log(`   Total Resources:              ${resourceCoverage.totalResources.toLocaleString()}`);
  console.log(`   With Identifiers:             ${resourceCoverage.withIdentifiers.toLocaleString()} (${((resourceCoverage.withIdentifiers / resourceCoverage.totalResources) * 100).toFixed(1)}%)`);
  console.log(`   Without Identifiers:          ${resourceCoverage.withoutIdentifiers.toLocaleString()} (${((resourceCoverage.withoutIdentifiers / resourceCoverage.totalResources) * 100).toFixed(1)}%)`);
  console.log(`   With Multiple Identifiers:    ${resourceCoverage.withMultipleIdentifiers.toLocaleString()}`);
  console.log(`   Avg Identifiers per Resource: ${resourceCoverage.avgIdentifiersPerResource.toFixed(2)}`);

  // Section 3: Confidence Scores
  console.log('\n🎯 CONFIDENCE SCORE DISTRIBUTION\n');
  confidenceStats.distribution.forEach(({ range, count }) => {
    const percentage = ((count / identifierStats.totalIdentifiers) * 100).toFixed(1);
    console.log(`   ${range.padEnd(20)} ${count.toLocaleString().padStart(10)}  (${percentage}%)`);
  });

  if (confidenceStats.low > 0) {
    console.log(
      `\n   ⚠️  ${confidenceStats.low} identifiers have low confidence (<0.7) and may need review`
    );
  }

  // Section 4: Duplicates
  console.log('\n🔍 POTENTIAL DUPLICATES\n');
  if (duplicates.length === 0) {
    console.log('   ✅ No duplicate identifiers found!');
  } else {
    console.log(`   Found ${duplicates.length} identifiers linked to multiple resources:\n`);
    duplicates.slice(0, 10).forEach((dup, index) => {
      console.log(`   ${index + 1}. ${dup.identifierType}: ${dup.identifierValue}${dup.state ? ` (${dup.state})` : ''}`);
      console.log(`      → ${dup.resourceCount} resources:`);
      dup.facilityNames.slice(0, 3).forEach((name) => {
        console.log(`         - ${name}`);
      });
      if (dup.facilityNames.length > 3) {
        console.log(`         ... and ${dup.facilityNames.length - 3} more`);
      }
      console.log('');
    });

    if (duplicates.length > 10) {
      console.log(`   ... and ${duplicates.length - 10} more duplicates`);
    }

    console.log(`   ⚠️  Review these duplicates to ensure data quality`);
  }

  // Section 5: Top States
  console.log('\n🗺️  TOP STATES BY IDENTIFIER COUNT\n');
  const topStates = Object.entries(identifierStats.byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  topStates.forEach(([state, count]) => {
    const percentage = ((count / identifierStats.totalIdentifiers) * 100).toFixed(1);
    console.log(`   ${state.padEnd(20)} ${count.toLocaleString().padStart(10)}  (${percentage}%)`);
  });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY\n');

  const coveragePercent = (
    (resourceCoverage.withIdentifiers / resourceCoverage.totalResources) *
    100
  ).toFixed(1);

  if (parseFloat(coveragePercent) >= 95) {
    console.log(`   ✅ Excellent coverage: ${coveragePercent}% of resources have identifiers`);
  } else if (parseFloat(coveragePercent) >= 80) {
    console.log(`   ✓  Good coverage: ${coveragePercent}% of resources have identifiers`);
  } else {
    console.log(`   ⚠️  Coverage needs improvement: ${coveragePercent}% of resources have identifiers`);
  }

  if (confidenceStats.perfect === identifierStats.totalIdentifiers) {
    console.log('   ✅ All identifiers have perfect confidence scores');
  } else if (confidenceStats.low > 0) {
    console.log(`   ⚠️  ${confidenceStats.low} identifiers need confidence review`);
  }

  if (duplicates.length === 0) {
    console.log('   ✅ No duplicate identifiers detected');
  } else {
    console.log(`   ⚠️  ${duplicates.length} duplicate identifiers require investigation`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n');
}

/**
 * Main execution
 */
async function verifyIdentifiers() {
  console.log('\n🔍 Running facility identifiers verification...\n');

  try {
    // Gather statistics
    console.log('📊 Gathering statistics...');
    const identifierStats = await getIdentifierStats();

    console.log('📍 Analyzing resource coverage...');
    const resourceCoverage = await getResourceCoverage();

    console.log('🎯 Analyzing confidence scores...');
    const confidenceStats = await getConfidenceStats();

    console.log('🔍 Checking for duplicates...');
    const duplicates = await findDuplicates();

    // Print report
    printReport(identifierStats, resourceCoverage, confidenceStats, duplicates);

    // Next steps
    console.log('NEXT STEPS:\n');
    if (resourceCoverage.withoutIdentifiers > 0) {
      console.log(
        `   1. Investigate ${resourceCoverage.withoutIdentifiers} resources without identifiers`
      );
    }
    if (duplicates.length > 0) {
      console.log(
        '   2. Review and resolve duplicate identifiers (may indicate merged facilities)'
      );
    }
    if (confidenceStats.low > 0) {
      console.log('   3. Verify low-confidence matches manually');
    }
    console.log('   4. Begin importing state licensing data to add STATE_LICENSE identifiers');
    console.log('   5. Use lookup functions in ETL scripts for data integration\n');

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
verifyIdentifiers();
