#!/usr/bin/env npx tsx

/**
 * Simplified validation: Calculate SunsetWell scores from core metrics only
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Simple 0-100 scoring from core CMS ratings
 */
function calculateSimpleScore(row: any): number | null {
  const health = row.health_inspection_rating;
  const staffing = row.staffing_rating;
  const quality = row.quality_measure_rating;

  if (!health || !staffing || !quality) return null;

  // Convert 1-5 stars to 0-100
  const healthScore = ((health - 1) / 4) * 100;
  const staffingScore = ((staffing - 1) / 4) * 100;
  const qualityScore = ((quality - 1) / 4) * 100;

  // Weighted average (matching DEFAULT_WEIGHTS roughly)
  return (
    healthScore * 0.45 +
    staffingScore * 0.28 +
    qualityScore * 0.27
  );
}

/**
 * Linear regression
 */
function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0,
    denom = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY);
    denom += (x[i] - meanX) ** 2;
  }

  const slope = num / denom;
  const intercept = meanY - slope * meanX;

  const predictions = x.map((xi) => slope * xi + intercept);
  const ssRes = y.reduce((sum, yi, i) => sum + (yi - predictions[i]) ** 2, 0);
  const ssTot = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0);
  const r_squared = 1 - ssRes / ssTot;

  return { slope, intercept, r_squared, n };
}

async function main() {
  console.log("\n=== Full Dataset Validation (Simplified) ===\n");

  // Paginate to get all facilities
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let from = 0;

  console.log("Fetching facilities...");
  while (true) {
    const { data, error } = await supabase
      .from("resources")
      .select(
        "facility_id, quality_rating, number_of_substantiated_complaints, number_of_facility_reported_incidents, health_inspection_rating, staffing_rating, quality_measure_rating"
      )
      .eq("provider_type", "nursing_home")
      .not("quality_rating", "is", null)
      .not("number_of_substantiated_complaints", "is", null)
      .not("health_inspection_rating", "is", null)
      .not("staffing_rating", "is", null)
      .not("quality_measure_rating", "is", null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    allData.push(...data);
    console.log(`  ... fetched ${allData.length} facilities`);

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`\nRetrieved ${allData.length} facilities total\n`);

  // Calculate scores
  const facilities = allData
    .map((row) => ({
      ...row,
      sunsetwell_score: calculateSimpleScore(row),
    }))
    .filter((f) => f.sunsetwell_score !== null);

  console.log(`Facilities with valid scores: ${facilities.length}\n`);

  // Prepare arrays
  const sunsetwell = facilities.map((f) => f.sunsetwell_score!);
  const cms = facilities.map((f) => f.quality_rating!);
  const logComplaints = facilities.map((f) =>
    Math.log((f.number_of_substantiated_complaints ?? 0) + 1)
  );
  const logIncidents = facilities.map((f) =>
    Math.log((f.number_of_facility_reported_incidents ?? 0) + 1)
  );

  // Run regressions
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("MODEL A: log(complaints) ~ sunsetwell_score");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const modelA = linearRegression(sunsetwell, logComplaints);
  console.log(`  n = ${modelA.n}`);
  console.log(`  r² = ${modelA.r_squared.toFixed(6)} (${(modelA.r_squared * 100).toFixed(2)}%)\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("MODEL B: log(complaints) ~ cms_overall_rating");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const modelB = linearRegression(cms, logComplaints);
  console.log(`  n = ${modelB.n}`);
  console.log(`  r² = ${modelB.r_squared.toFixed(6)} (${(modelB.r_squared * 100).toFixed(2)}%)\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("COMPARISON");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const ratio = modelA.r_squared / modelB.r_squared;
  const improvement = ((ratio - 1) * 100).toFixed(1);

  console.log(`  SunsetWell r²: ${modelA.r_squared.toFixed(6)}`);
  console.log(`  CMS r²:        ${modelB.r_squared.toFixed(6)}`);
  console.log(`  Ratio:         ${ratio.toFixed(2)}x`);
  console.log(`  Improvement:   +${improvement}%\n`);

  // Incidents
  const modelA_inc = linearRegression(sunsetwell, logIncidents);
  const modelB_inc = linearRegression(cms, logIncidents);

  console.log("SECONDARY OUTCOME (Incidents):");
  console.log(`  SunsetWell r²: ${modelA_inc.r_squared.toFixed(6)}`);
  console.log(`  CMS r²:        ${modelB_inc.r_squared.toFixed(6)}`);
  console.log(`  Ratio:         ${(modelA_inc.r_squared / modelB_inc.r_squared).toFixed(2)}x\n`);

  // Save
  const results = {
    analysis_date: new Date().toISOString(),
    n_facilities: facilities.length,
    method: "simplified_core_metrics_only",
    complaints: {
      sunsetwell: { r_squared: modelA.r_squared },
      cms: { r_squared: modelB.r_squared },
      ratio,
      improvement_percent: parseFloat(improvement),
    },
    incidents: {
      sunsetwell: { r_squared: modelA_inc.r_squared },
      cms: { r_squared: modelB_inc.r_squared },
      ratio: modelA_inc.r_squared / modelB_inc.r_squared,
    },
  };

  fs.writeFileSync(
    "docs/score-validation-full-simple.json",
    JSON.stringify(results, null, 2)
  );

  console.log("Results saved to docs/score-validation-full-simple.json\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
