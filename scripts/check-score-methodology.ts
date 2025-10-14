#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function checkScoreMethodology() {
  console.log("🔍 CHECKING SCORE METHODOLOGY\n");
  console.log("=".repeat(80));

  // Get sample scores
  const { data: sampleScores } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id, overall_score, overall_percentile, version, calculation_date")
    .eq("version", "v2")
    .limit(10);

  console.log("Sample sunsetwell_scores records:");
  console.log(JSON.stringify(sampleScores, null, 2));

  // Get sample facility with raw metrics
  if (sampleScores && sampleScores.length > 0) {
    const sampleId = sampleScores[0].facility_id;

    const { data: facility } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        provider_type,
        health_inspection_rating,
        staffing_rating,
        quality_measure_rating,
        total_nurse_hours_per_resident_per_day,
        rn_hours_per_resident_per_day,
        total_nurse_staff_turnover,
        rn_turnover
      `)
      .eq("id", sampleId)
      .single();

    console.log("\n\nSample facility raw metrics:");
    console.log(JSON.stringify(facility, null, 2));

    // Get normalized metrics for this facility
    const { data: normalizedMetrics } = await supabase
      .from("facility_metrics_normalized")
      .select("metric_key, raw_value, normalized_value, score_version")
      .eq("facility_id", sampleId)
      .eq("score_version", "v2");

    console.log("\n\nNormalized metrics for this facility:");
    console.log(JSON.stringify(normalizedMetrics, null, 2));
  }

  // Check facility_scores table
  console.log("\n\n" + "=".repeat(80));
  console.log("CHECKING FACILITY_SCORES TABLE");
  console.log("=".repeat(80));

  const { data: facilityScoresSample } = await supabase
    .from("facility_scores")
    .select("facility_id, score, provider_type, region, version")
    .eq("version", "v2")
    .limit(5);

  console.log("Sample facility_scores records:");
  console.log(JSON.stringify(facilityScoresSample, null, 2));

  // Check the scoring script
  console.log("\n\n" + "=".repeat(80));
  console.log("SUMMARY: What should we have?");
  console.log("=".repeat(80));
  console.log(`
1. SUNSETWELL SCORE (overall_score):
   - Should be: Non-normalized weighted composite (0-100 scale)
   - Calculated from: Weighted sum of raw metrics
   - Example: If a facility has:
     * health_inspection_rating = 4 (out of 5) → normalized to 80/100
     * staffing_rating = 3 (out of 5) → normalized to 60/100
     * With weights: 53% inspection, 32% staffing, 15% quality
     * Score = (80 * 0.53) + (60 * 0.32) + (quality * 0.15)

2. PERCENTILE (overall_percentile):
   - Should be: Peer-group ranking (0-100)
   - Calculated from: Comparing overall_score within peer group
   - Example: If facility scores 75 and ranks 80th out of 100 in its state
     * overall_percentile = 80

Current data shows:
  `);

  if (sampleScores && sampleScores.length > 0) {
    console.log(`  Overall scores range: ${Math.min(...sampleScores.map(s => s.overall_score))} to ${Math.max(...sampleScores.map(s => s.overall_score))}`);
    console.log(`  Percentiles range: ${Math.min(...sampleScores.map(s => s.overall_percentile))} to ${Math.max(...sampleScores.map(s => s.overall_percentile))}`);
  }
}

checkScoreMethodology()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });
