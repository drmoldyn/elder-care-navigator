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

async function checkFacilityScoresTable() {
  console.log("🔍 CHECKING FACILITY_SCORES TABLE\n");
  console.log("=".repeat(80));

  // Check if facility_scores table exists and has data
  const { count: facilityScoresCount } = await supabase
    .from("facility_scores")
    .select("*", { count: "exact", head: true });

  console.log(`Total records in facility_scores table: ${facilityScoresCount}\n`);

  // Get sample records from facility_scores
  const { data: sampleFacilityScores } = await supabase
    .from("facility_scores")
    .select("*")
    .limit(5);

  console.log("Sample records from facility_scores:");
  for (const score of sampleFacilityScores || []) {
    console.log(`  Facility: ${score.facility_id}`);
    console.log(`    Score: ${score.score}`);
    console.log(`    Provider type: ${score.provider_type}`);
    console.log(`    Region: ${score.region}`);
    console.log(`    Version: ${score.version}`);
    console.log();
  }

  // Check specific facility that's missing scores
  const testFacilityId = "195416"; // ROSEPINE RETIREMENT & REHAB CENTER, LLC (CCN)

  // First get the UUID for this CCN
  const { data: testFacility } = await supabase
    .from("resources")
    .select("id, title")
    .eq("facility_id", testFacilityId)
    .eq("provider_type", "nursing_home")
    .single();

  if (testFacility) {
    console.log(`\nChecking test facility: ${testFacility.title} (${testFacility.id})\n`);

    // Check facility_scores table
    const { data: facilityScore } = await supabase
      .from("facility_scores")
      .select("*")
      .eq("facility_id", testFacility.id)
      .eq("version", "v2")
      .single();

    console.log(`  In facility_scores table: ${facilityScore ? 'YES ✅' : 'NO ❌'}`);
    if (facilityScore) {
      console.log(`    Score: ${facilityScore.score}`);
      console.log(`    Provider type: ${facilityScore.provider_type}`);
      console.log(`    Region: ${facilityScore.region}`);
    }

    // Check sunsetwell_scores table
    const { data: sunsetwellScore } = await supabase
      .from("sunsetwell_scores")
      .select("*")
      .eq("facility_id", testFacility.id)
      .eq("version", "v2")
      .single();

    console.log(`  In sunsetwell_scores table: ${sunsetwellScore ? 'YES ✅' : 'NO ❌'}`);
    if (sunsetwellScore) {
      console.log(`    Overall score: ${sunsetwellScore.overall_score}`);
      console.log(`    Overall percentile: ${sunsetwellScore.overall_percentile}`);
    }

    // Check normalized metrics
    const { count: metricsCount } = await supabase
      .from("facility_metrics_normalized")
      .select("*", { count: "exact", head: true })
      .eq("facility_id", testFacility.id)
      .eq("score_version", "v2");

    console.log(`  Normalized metrics count: ${metricsCount}`);
  }

  // Count nursing homes in each table
  console.log("\n" + "=".repeat(80));
  console.log("NURSING HOME COVERAGE BY TABLE:");
  console.log("=".repeat(80));

  const { count: totalNH } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  console.log(`Total nursing homes in resources: ${totalNH}`);

  // Count in facility_scores
  let nhInFacilityScores = 0;
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  const facilityIds = new Set<string>();

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from("facility_scores")
      .select("facility_id")
      .eq("version", "v2")
      .range(from, to);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach(s => facilityIds.add(s.facility_id));
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  // Now check which of these are nursing homes
  for (let i = 0; i < Array.from(facilityIds).length; i += 1000) {
    const batch = Array.from(facilityIds).slice(i, i + 1000);
    const { count } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("provider_type", "nursing_home")
      .in("id", batch);

    nhInFacilityScores += count || 0;
  }

  console.log(`Nursing homes in facility_scores: ${nhInFacilityScores} (${((nhInFacilityScores / totalNH!) * 100).toFixed(1)}%)`);

  const { count: nhInSunsetwellScores } = await supabase
    .from("resources")
    .select("*, sunsetwell_scores!inner(overall_score)", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  console.log(`Nursing homes in sunsetwell_scores: ${nhInSunsetwellScores} (${((nhInSunsetwellScores! / totalNH!) * 100).toFixed(1)}%)`);

  console.log("\n" + "=".repeat(80));
}

checkFacilityScoresTable()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
