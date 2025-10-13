#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checkNursingHomes() {
  console.log("Analyzing nursing home data...\n");

  // Get all nursing homes from resources
  const { data: nursingHomes, error: nhError } = await supabase
    .from("resources")
    .select("id, facility_id, title, states")
    .eq("provider_type", "nursing_home");

  if (nhError) {
    throw new Error(`Failed to fetch nursing homes: ${nhError.message}`);
  }

  const totalNH = nursingHomes?.length ?? 0;
  console.log(`📊 Total nursing homes in resources table: ${totalNH}`);

  // Check facility_id formats
  const withUUID = nursingHomes?.filter(nh => {
    const id = nh.facility_id;
    return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }) ?? [];

  const withNumeric = nursingHomes?.filter(nh => {
    const id = nh.facility_id;
    return id && /^\d+$/.test(id);
  }) ?? [];

  const withNull = nursingHomes?.filter(nh => !nh.facility_id) ?? [];

  console.log(`\n🔍 Facility ID formats:`);
  console.log(`   UUID format: ${withUUID.length}`);
  console.log(`   Numeric format: ${withNumeric.length}`);
  console.log(`   Null/missing: ${withNull.length}`);

  // Check which have scores
  const { data: scoredIds, error: scoresError } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id");

  if (scoresError) {
    console.warn("Could not check scores:", scoresError.message);
  } else {
    const scoredSet = new Set(scoredIds?.map(s => s.facility_id) ?? []);
    const nursingHomesWithScores = nursingHomes?.filter(nh => nh.facility_id && scoredSet.has(nh.facility_id)) ?? [];

    console.log(`\n✅ SunsetWell scores:`);
    console.log(`   Nursing homes WITH scores: ${nursingHomesWithScores.length}`);
    console.log(`   Nursing homes WITHOUT scores: ${totalNH - nursingHomesWithScores.length}`);
    console.log(`   Coverage: ${totalNH > 0 ? ((nursingHomesWithScores.length / totalNH) * 100).toFixed(1) : 0}%`);

    // Sample nursing homes without scores
    const nhWithoutScores = nursingHomes?.filter(nh => !nh.facility_id || !scoredSet.has(nh.facility_id)) ?? [];

    console.log(`\n📝 Sample nursing homes WITHOUT scores (first 20):`);
    console.log("─".repeat(100));
    for (const nh of nhWithoutScores.slice(0, 20)) {
      const state = Array.isArray(nh.states) ? nh.states[0] : 'N/A';
      console.log(`${(nh.facility_id || 'NO_ID').padEnd(40)} | ${state.padEnd(3)} | ${nh.title?.substring(0, 50) ?? 'N/A'}`);
    }
    console.log("─".repeat(100));

    // Check if numeric facility_ids have metrics
    if (withNumeric.length > 0) {
      console.log(`\n🔬 Checking if numeric facility_ids have normalized metrics...`);

      const sampleNumericIds = withNumeric.slice(0, 10).map(nh => nh.facility_id!);
      const { data: metricsData, error: metricsError } = await supabase
        .from("facility_metrics_normalized")
        .select("facility_id")
        .in("facility_id", sampleNumericIds);

      if (metricsError) {
        console.log(`   ⚠️  Error checking metrics: ${metricsError.message}`);
        console.log(`   This is expected - numeric IDs are not in metrics table (which uses UUIDs)`);
      } else {
        console.log(`   Found ${metricsData?.length ?? 0} metrics for ${sampleNumericIds.length} numeric facility_ids`);
      }
    }
  }

  // Check the nursing_home_quality table (if it exists)
  console.log(`\n🔍 Checking nursing_home_quality table...`);
  const { data: qualityData, error: qualityError } = await supabase
    .from("nursing_home_quality")
    .select("federal_provider_number, provider_name, overall_rating")
    .limit(10);

  if (qualityError) {
    console.log(`   ⚠️  Table doesn't exist or error: ${qualityError.message}`);
  } else {
    const { count: qualityCount } = await supabase
      .from("nursing_home_quality")
      .select("federal_provider_number", { count: "exact", head: true });

    console.log(`   ✅ nursing_home_quality table exists with ${qualityCount} records`);

    if (qualityData && qualityData.length > 0) {
      console.log(`   Sample record: ${qualityData[0].federal_provider_number} - ${qualityData[0].provider_name} (${qualityData[0].overall_rating} stars)`);
    }

    // Check if there's a mapping issue between nursing_home_quality and resources
    if (withNumeric.length > 0 && qualityData && qualityData.length > 0) {
      console.log(`\n💡 Diagnosis:`);
      console.log(`   - resources table has ${withNumeric.length} nursing homes with NUMERIC facility_ids`);
      console.log(`   - sunsetwell_scores table has ${scoredIds?.length ?? 0} facilities with UUID facility_ids`);
      console.log(`   - nursing_home_quality table has ${qualityCount} records (likely with CMS provider numbers)`);
      console.log(`\n   ⚠️  ISSUE: Facility ID mismatch!`);
      console.log(`   - Numeric facility_ids in resources don't match UUID facility_ids in scores`);
      console.log(`   - Need to establish mapping between CMS provider numbers → resource UUIDs`);
      console.log(`\n   🔧 SOLUTION: Add CCN (CMS Certification Number) column to resources table`);
      console.log(`      and use it to join with nursing_home_quality data`);
    }
  }
}

checkNursingHomes()
  .then(() => {
    console.log("\n✅ Nursing home analysis complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Analysis failed:", error);
    process.exit(1);
  });
