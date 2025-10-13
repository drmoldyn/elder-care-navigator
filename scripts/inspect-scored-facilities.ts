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

async function inspectScoredFacilities() {
  console.log("Inspecting facilities with scores...\n");

  // Get sample of scored facilities
  const { data: scores, error: scoresError } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id, overall_score, overall_percentile, calculation_date, version")
    .order("overall_score", { ascending: false })
    .limit(10);

  if (scoresError) {
    throw new Error(`Failed to fetch scores: ${scoresError.message}`);
  }

  console.log("Top 10 scored facilities:");
  console.log("─".repeat(100));
  for (const score of scores ?? []) {
    console.log(`Facility ID: ${score.facility_id}`);
    console.log(`  Score: ${score.overall_score.toFixed(2)} | Percentile: ${score.overall_percentile}% | Version: ${score.version}`);
  }
  console.log("─".repeat(100));

  // Check facility_id format in resources table
  console.log("\nSample facility_ids from resources table:");
  const { data: resources, error: resourcesError } = await supabase
    .from("resources")
    .select("facility_id, title, provider_type")
    .not("facility_id", "is", null)
    .limit(20);

  if (!resourcesError && resources) {
    console.log("─".repeat(100));
    for (const resource of resources.slice(0, 10)) {
      console.log(`${resource.facility_id} | ${resource.provider_type?.padEnd(25)} | ${resource.title?.substring(0, 40)}`);
    }
    console.log("─".repeat(100));
  }

  // Check facility_metrics_normalized table
  console.log("\nChecking facility_metrics_normalized table:");
  const { data: metrics, error: metricsError } = await supabase
    .from("facility_metrics_normalized")
    .select("facility_id, metric_key, z_score, provider_type, region, score_version")
    .limit(10);

  if (metricsError) {
    console.error("Error fetching normalized metrics:", metricsError.message);
  } else {
    console.log(`Found ${metrics?.length ?? 0} normalized metrics`);
    if (metrics && metrics.length > 0) {
      console.log("─".repeat(100));
      console.log(`Sample facility_id from metrics: ${metrics[0].facility_id}`);
      console.log(`Metric: ${metrics[0].metric_key} | Z-score: ${metrics[0].z_score} | Version: ${metrics[0].score_version}`);
      console.log("─".repeat(100));
    }
  }

  // Count distinct facility_ids in each table
  const { data: resourceCount } = await supabase
    .from("resources")
    .select("facility_id", { count: "exact", head: false })
    .not("facility_id", "is", null);

  const { data: scoreCount } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id", { count: "exact", head: false });

  const { data: metricsCount } = await supabase
    .from("facility_metrics_normalized")
    .select("facility_id", { count: "exact", head: false });

  const uniqueResourceIds = new Set(resourceCount?.map(r => r.facility_id) ?? []).size;
  const uniqueScoreIds = new Set(scoreCount?.map(s => s.facility_id) ?? []).size;
  const uniqueMetricIds = new Set(metricsCount?.map(m => m.facility_id) ?? []).size;

  console.log("\n📊 Unique facility_ids by table:");
  console.log(`   resources: ${uniqueResourceIds}`);
  console.log(`   sunsetwell_scores: ${uniqueScoreIds}`);
  console.log(`   facility_metrics_normalized: ${uniqueMetricIds}`);
}

inspectScoredFacilities()
  .then(() => {
    console.log("\n✅ Inspection complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Inspection failed:", error);
    process.exit(1);
  });
