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

async function debugScoring() {
  console.log("🔍 DEBUGGING SCORING ISSUE\n");

  // Check sunsetwell_scores table
  console.log("1. Checking sunsetwell_scores table...");
  const { count: totalScores } = await supabase
    .from("sunsetwell_scores")
    .select("*", { count: "exact", head: true });

  console.log(`   Total rows in sunsetwell_scores: ${totalScores}`);

  // Get sample scores
  const { data: sampleScores } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id, overall_score, overall_percentile, calculation_date")
    .limit(5);

  console.log("\n   Sample scores:");
  for (const score of sampleScores ?? []) {
    console.log(`     facility_id: ${score.facility_id}`);
    console.log(`     score: ${score.overall_score}, percentile: ${score.overall_percentile}%`);
  }

  // Check if these facility_ids exist in resources
  if (sampleScores && sampleScores.length > 0) {
    const sampleIds = sampleScores.map(s => s.facility_id);

    console.log("\n2. Checking if these facility_ids match resources.id...");
    const { data: matchingResources } = await supabase
      .from("resources")
      .select("id, title, provider_type")
      .in("id", sampleIds);

    console.log(`   Found ${matchingResources?.length ?? 0} matching resources by ID`);

    if (matchingResources && matchingResources.length > 0) {
      console.log("\n   ✅ facility_id correctly matches resources.id");
      for (const resource of matchingResources) {
        console.log(`     ${resource.id} = ${resource.title} (${resource.provider_type})`);
      }
    } else {
      console.log("\n   ❌ facility_ids do NOT match resources.id - checking facility_id column...");

      const { data: byFacilityId } = await supabase
        .from("resources")
        .select("id, facility_id, title, provider_type")
        .in("facility_id", sampleIds);

      if (byFacilityId && byFacilityId.length > 0) {
        console.log(`   Found ${byFacilityId.length} matches by facility_id (CCN) column`);
        console.log("   ⚠️  ISSUE: sunsetwell_scores.facility_id should reference resources.id, not resources.facility_id!");
      }
    }
  }

  // Check nursing homes
  console.log("\n3. Checking nursing home data completeness...");

  const { data: nursingHomes } = await supabase
    .from("resources")
    .select("id, facility_id, title, staffing_rating, health_inspection_rating, quality_measure_rating, total_nurse_hours_per_resident_per_day")
    .eq("provider_type", "nursing_home")
    .limit(100);

  const withAllMetrics = nursingHomes?.filter(nh =>
    nh.staffing_rating !== null &&
    nh.health_inspection_rating !== null &&
    nh.quality_measure_rating !== null &&
    nh.total_nurse_hours_per_resident_per_day !== null
  ) ?? [];

  const withAnyMetric = nursingHomes?.filter(nh =>
    nh.staffing_rating !== null ||
    nh.health_inspection_rating !== null ||
    nh.quality_measure_rating !== null ||
    nh.total_nurse_hours_per_resident_per_day !== null
  ) ?? [];

  console.log(`   Sample of 100 nursing homes:`);
  console.log(`     With ALL 4 main metrics: ${withAllMetrics.length}`);
  console.log(`     With ANY metric: ${withAnyMetric.length}`);

  // Check facility_metrics_normalized
  console.log("\n4. Checking facility_metrics_normalized...");
  const { count: metricsCount } = await supabase
    .from("facility_metrics_normalized")
    .select("*", { count: "exact", head: true })
    .eq("score_version", "v2");

  console.log(`   Total normalized metrics (v2): ${metricsCount}`);

  // Get unique facility IDs from metrics
  const { data: allMetrics } = await supabase
    .from("facility_metrics_normalized")
    .select("facility_id")
    .eq("score_version", "v2");

  const uniqueFacilityIds = new Set((allMetrics ?? []).map(m => m.facility_id));
  console.log(`   Unique facilities with metrics: ${uniqueFacilityIds.size}`);

  // Check if these match nursing home UUIDs
  const sampleMetricIds = Array.from(uniqueFacilityIds).slice(0, 10);
  const { data: resourcesForMetrics } = await supabase
    .from("resources")
    .select("id, title, provider_type")
    .in("id", sampleMetricIds);

  console.log(`   Sample check: ${resourcesForMetrics?.length ?? 0}/10 metric facility_ids match resources.id`);

  if (resourcesForMetrics && resourcesForMetrics.length > 0) {
    const providerTypes = resourcesForMetrics.map(r => r.provider_type);
    console.log(`   Provider types in metrics: ${[...new Set(providerTypes)].join(", ")}`);
  }
}

debugScoring()
  .then(() => {
    console.log("\n✅ Debug complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });
