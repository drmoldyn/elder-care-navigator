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

async function fullSurvey() {
  console.log("🔍 COMPREHENSIVE FACILITY SURVEY\n");

  // Get ACTUAL counts without limits
  const { count: totalResources, error: resourcesError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true });

  if (resourcesError) {
    console.error("Error counting resources:", resourcesError.message);
  } else {
    console.log(`📊 Total resources in database: ${totalResources}`);
  }

  // Count by provider type
  const { data: allResources, error: allError } = await supabase
    .from("resources")
    .select("provider_type");

  if (allError) {
    console.error("Error fetching resources:", allError.message);
  } else {
    const typeCounts: Record<string, number> = {};
    for (const resource of allResources ?? []) {
      const type = resource.provider_type ?? 'unknown';
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    }

    console.log("\n📋 Breakdown by provider type:");
    console.log("─".repeat(60));
    for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type.padEnd(35)} | ${String(count).padStart(10)}`);
    }
    console.log("─".repeat(60));
  }

  // Count nursing homes specifically
  const { count: nursingHomeCount, error: nhCountError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  if (!nhCountError) {
    console.log(`\n🏥 Total NURSING HOMES: ${nursingHomeCount}`);
  }

  // Check nursing homes with CCN (facility_id)
  const { count: withCCN, error: ccnError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home")
    .not("facility_id", "is", null);

  if (!ccnError) {
    console.log(`   With CCN (facility_id): ${withCCN}`);
  }

  // Check nursing homes with coordinates
  const { count: withCoords, error: coordsError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (!coordsError) {
    console.log(`   With lat/long coordinates: ${withCoords}`);
  }

  // Check nursing homes with CMS quality data
  const { count: withQuality, error: qualityError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home")
    .not("staffing_rating", "is", null);

  if (!qualityError) {
    console.log(`   With CMS quality data (staffing_rating): ${withQuality}`);
  }

  // Check sunsetwell_scores
  const { count: scoreCount, error: scoreError } = await supabase
    .from("sunsetwell_scores")
    .select("*", { count: "exact", head: true });

  if (!scoreError) {
    console.log(`\n✅ Total facilities WITH SunsetWell scores: ${scoreCount}`);
  }

  // Get unique resource_ids in sunsetwell_scores
  const { data: scoredResources, error: scoredError } = await supabase
    .from("sunsetwell_scores")
    .select("resource_id");

  if (!scoredError && scoredResources) {
    const uniqueScored = new Set(scoredResources.map(s => s.resource_id).filter(Boolean));
    console.log(`   Unique facilities scored: ${uniqueScored.size}`);
  }

  // Check facility_metrics_normalized
  const { count: metricsCount, error: metricsCountError } = await supabase
    .from("facility_metrics_normalized")
    .select("*", { count: "exact", head: true });

  if (!metricsCountError) {
    console.log(`\n📊 Normalized metrics records: ${metricsCount}`);
  }

  const { data: metricsData, error: metricsDataError } = await supabase
    .from("facility_metrics_normalized")
    .select("facility_id");

  if (!metricsDataError && metricsData) {
    const uniqueMetrics = new Set(metricsData.map(m => m.facility_id).filter(Boolean));
    console.log(`   Unique facilities with metrics: ${uniqueMetrics.size}`);
  }

  console.log("\n" + "=".repeat(60));
}

fullSurvey()
  .then(() => {
    console.log("\n✅ Survey complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Survey failed:", error);
    process.exit(1);
  });
