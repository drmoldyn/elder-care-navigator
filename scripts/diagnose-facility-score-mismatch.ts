#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function diagnose() {
  console.log("🔍 DIAGNOSING FACILITY-SCORE MISMATCH\n");

  // Get all unique facility_ids with v2 scores
  console.log("1. Loading all facility IDs with v2 scores...");
  const scoredFacilityIds = new Set<string>();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .eq("version", "v2")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((row) => scoredFacilityIds.add(row.facility_id));
      if (data.length < 1000) hasMore = false;
      else page++;
    }
  }

  console.log(`   Found ${scoredFacilityIds.size.toLocaleString()} unique facility IDs with scores\n`);

  // Get all facilities from resources table
  console.log("2. Loading all facilities from resources table...");
  const facilitiesById = new Map<string, { id: string; provider_type: string | null }>();
  page = 0;
  hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("resources")
      .select("id, provider_type")
      .order("id")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((row) => {
        facilitiesById.set(row.id, {
          id: row.id,
          provider_type: row.provider_type,
        });
      });
      if (data.length < 1000) hasMore = false;
      else page++;
    }
  }

  console.log(`   Found ${facilitiesById.size.toLocaleString()} facilities in resources table\n`);

  // Find mismatches
  console.log("3. Analyzing mismatches...\n");

  // Facilities with scores but not in resources
  const scoresWithoutFacility: string[] = [];
  for (const facilityId of scoredFacilityIds) {
    if (!facilitiesById.has(facilityId)) {
      scoresWithoutFacility.push(facilityId);
    }
  }

  console.log(`   Facilities with scores but NOT in resources table: ${scoresWithoutFacility.length}`);
  if (scoresWithoutFacility.length > 0 && scoresWithoutFacility.length <= 10) {
    console.log(`   Sample IDs: ${scoresWithoutFacility.slice(0, 10).join(", ")}`);
  }

  // Facilities with scores but null/undefined provider_type
  const scoresWithNullType: string[] = [];
  for (const facilityId of scoredFacilityIds) {
    const facility = facilitiesById.get(facilityId);
    if (facility && !facility.provider_type) {
      scoresWithNullType.push(facilityId);
    }
  }

  console.log(`   Facilities with scores but NULL provider_type: ${scoresWithNullType.length}`);

  // Get provider_type distribution for scored facilities
  const providerTypeCounts = new Map<string, number>();
  for (const facilityId of scoredFacilityIds) {
    const facility = facilitiesById.get(facilityId);
    if (facility) {
      const type = facility.provider_type || "NULL";
      providerTypeCounts.set(type, (providerTypeCounts.get(type) || 0) + 1);
    }
  }

  console.log("\n4. Provider type distribution for facilities with scores:");
  const sortedTypes = Array.from(providerTypeCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    console.log(`   ${type}: ${count.toLocaleString()}`);
  }

  // Check for duplicate calculation_date entries
  console.log("\n5. Checking for duplicate score records per facility...");
  const facilityCounts = new Map<string, number>();
  page = 0;
  hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .eq("version", "v2")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((row) => {
        facilityCounts.set(row.facility_id, (facilityCounts.get(row.facility_id) || 0) + 1);
      });
      if (data.length < 1000) hasMore = false;
      else page++;
    }
  }

  const duplicateFacilities = Array.from(facilityCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  console.log(`   Found ${duplicateFacilities.length} facilities with duplicate score records`);
  if (duplicateFacilities.length > 0) {
    console.log(`   Sample (showing first 5):`);
    for (const [facilityId, count] of duplicateFacilities.slice(0, 5)) {
      console.log(`     Facility ${facilityId}: ${count} records`);
    }
  }

  // Summary
  console.log("\n6. SUMMARY:");
  console.log(`   Total unique facilities with v2 scores: ${scoredFacilityIds.size.toLocaleString()}`);
  console.log(`   Facilities in resources table: ${facilitiesById.size.toLocaleString()}`);
  console.log(`   Scores without matching facility: ${scoresWithoutFacility.length}`);
  console.log(`   Scores with null provider_type: ${scoresWithNullType.length}`);
  console.log(`   Expected match: ${scoredFacilityIds.size - scoresWithoutFacility.length - scoresWithNullType.length}`);
}

diagnose()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
