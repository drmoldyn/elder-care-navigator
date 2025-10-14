#!/usr/bin/env npx tsx

/**
 * Univariate Regression Analysis: SunsetWell Score vs CMS Overall Rating
 *
 * Proper comparison of predictive power:
 * - Model A: log(complaints) ~ sunsetwell_score
 * - Model B: log(complaints) ~ cms_overall_rating
 *
 * Compare r² to determine relative predictive accuracy.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface FacilityData {
  facility_id: string;
  sunsetwell_score: number;
  cms_overall_rating: number;
  complaints: number;
  incidents: number;
}

/**
 * Simple linear regression: y ~ x
 * Returns { slope, intercept, r_squared, n }
 */
function linearRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  r_squared: number;
  n: number;
} {
  const n = x.length;

  // Calculate means
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += (x[i] - meanX) ** 2;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate r²
  const predictions = x.map(xi => slope * xi + intercept);
  const ssRes = y.reduce((sum, yi, i) => sum + (yi - predictions[i]) ** 2, 0);
  const ssTot = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0);
  const r_squared = 1 - (ssRes / ssTot);

  return { slope, intercept, r_squared, n };
}

async function fetchData(): Promise<FacilityData[]> {
  console.log("Fetching facility data...");

  // Query with JOIN to get both resources and sunsetwell_scores data
  const { data, error } = await supabase
    .from("resources")
    .select(
      `
      facility_id,
      quality_rating,
      number_of_substantiated_complaints,
      number_of_facility_reported_incidents,
      sunsetwell_scores!inner (
        overall_score
      )
    `
    )
    .eq("provider_type", "nursing_home")
    .not("quality_rating", "is", null)
    .not("number_of_substantiated_complaints", "is", null);

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from Supabase");
  }

  console.log(`Retrieved ${data.length} facilities with complete data`);

  return data
    .map((row: any) => ({
      facility_id: row.facility_id,
      sunsetwell_score: row.sunsetwell_scores?.[0]?.overall_score ?? null,
      cms_overall_rating: row.quality_rating,
      complaints: row.number_of_substantiated_complaints ?? 0,
      incidents: row.number_of_facility_reported_incidents ?? 0,
    }))
    .filter((f) => f.sunsetwell_score !== null); // Only include facilities with scores
}

function main() {
  console.log("\n=== Univariate Regression Analysis ===\n");
  console.log("Comparing predictive power of:");
  console.log("  - SunsetWell Score (0-100)");
  console.log("  - CMS Overall Rating (1-5 stars)\n");

  fetchData()
    .then((facilities) => {
      // Filter out zero complaints for log transformation
      const facilitiesWithComplaints = facilities.filter((f) => f.complaints > 0);

      console.log(`Total facilities: ${facilities.length}`);
      console.log(`Facilities with complaints > 0: ${facilitiesWithComplaints.length}`);
      console.log(`Using log(complaints + 1) for all facilities\n`);

      // Prepare data arrays (using log(complaints + 1) to handle zeros)
      const sunsetwellScores = facilities.map((f) => f.sunsetwell_score);
      const cmsRatings = facilities.map((f) => f.cms_overall_rating);
      const logComplaints = facilities.map((f) => Math.log(f.complaints + 1));
      const logIncidents = facilities.map((f) => Math.log(f.incidents + 1));

      // === MODEL A: SunsetWell Score predicting complaints ===
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("MODEL A: log(complaints) ~ sunsetwell_score");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const modelA_complaints = linearRegression(sunsetwellScores, logComplaints);
      console.log(`  n = ${modelA_complaints.n}`);
      console.log(`  slope = ${modelA_complaints.slope.toFixed(6)}`);
      console.log(`  intercept = ${modelA_complaints.intercept.toFixed(6)}`);
      console.log(`  r² = ${modelA_complaints.r_squared.toFixed(6)} (${(modelA_complaints.r_squared * 100).toFixed(2)}%)\n`);

      // === MODEL B: CMS Overall Rating predicting complaints ===
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("MODEL B: log(complaints) ~ cms_overall_rating");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const modelB_complaints = linearRegression(cmsRatings, logComplaints);
      console.log(`  n = ${modelB_complaints.n}`);
      console.log(`  slope = ${modelB_complaints.slope.toFixed(6)}`);
      console.log(`  intercept = ${modelB_complaints.intercept.toFixed(6)}`);
      console.log(`  r² = ${modelB_complaints.r_squared.toFixed(6)} (${(modelB_complaints.r_squared * 100).toFixed(2)}%)\n`);

      // === COMPARISON ===
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("COMPARISON: Complaints Prediction");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const ratio_complaints = modelA_complaints.r_squared / modelB_complaints.r_squared;
      const improvement_complaints = ((ratio_complaints - 1) * 100).toFixed(1);

      console.log(`  SunsetWell r²: ${modelA_complaints.r_squared.toFixed(6)}`);
      console.log(`  CMS r²:        ${modelB_complaints.r_squared.toFixed(6)}`);
      console.log(`  Ratio:         ${ratio_complaints.toFixed(2)}x`);
      console.log(`  Improvement:   +${improvement_complaints}%\n`);

      // === INCIDENTS ANALYSIS ===
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("SECONDARY OUTCOME: Incidents");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const modelA_incidents = linearRegression(sunsetwellScores, logIncidents);
      const modelB_incidents = linearRegression(cmsRatings, logIncidents);

      console.log(`Model A (SunsetWell): r² = ${modelA_incidents.r_squared.toFixed(6)}`);
      console.log(`Model B (CMS):        r² = ${modelB_incidents.r_squared.toFixed(6)}`);
      console.log(`Ratio:                ${(modelA_incidents.r_squared / modelB_incidents.r_squared).toFixed(2)}x\n`);

      // === SAVE RESULTS ===
      const results = {
        analysis_date: new Date().toISOString(),
        n_facilities: facilities.length,
        outcome_complaints: {
          sunsetwell_score: {
            r_squared: modelA_complaints.r_squared,
            slope: modelA_complaints.slope,
            intercept: modelA_complaints.intercept,
          },
          cms_overall_rating: {
            r_squared: modelB_complaints.r_squared,
            slope: modelB_complaints.slope,
            intercept: modelB_complaints.intercept,
          },
          performance_ratio: ratio_complaints,
          improvement_percent: parseFloat(improvement_complaints),
        },
        outcome_incidents: {
          sunsetwell_score: {
            r_squared: modelA_incidents.r_squared,
            slope: modelA_incidents.slope,
            intercept: modelA_incidents.intercept,
          },
          cms_overall_rating: {
            r_squared: modelB_incidents.r_squared,
            slope: modelB_incidents.slope,
            intercept: modelB_incidents.intercept,
          },
          performance_ratio: modelA_incidents.r_squared / modelB_incidents.r_squared,
        },
      };

      const outputPath = "docs/score-validation-results.json";
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`Results saved to ${outputPath}`);

      // === INTERPRETATION ===
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("INTERPRETATION");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (ratio_complaints > 1.5) {
        console.log(`✓ SunsetWell Score is ${ratio_complaints.toFixed(1)}x better at predicting complaints`);
        console.log(`  This means it captures ${improvement_complaints}% more signal than CMS stars alone`);
      } else if (ratio_complaints > 1.2) {
        console.log(`✓ SunsetWell Score is moderately better (${ratio_complaints.toFixed(2)}x)`);
        console.log(`  Improvement: +${improvement_complaints}%`);
      } else if (ratio_complaints > 1.0) {
        console.log(`≈ SunsetWell Score is slightly better (${ratio_complaints.toFixed(2)}x)`);
      } else {
        console.log(`✗ SunsetWell Score is NOT better than CMS (${ratio_complaints.toFixed(2)}x)`);
        console.log(`  This suggests the scoring methodology needs revision`);
      }

      console.log("\nNote: These are univariate models (single predictor each)");
      console.log("This is the CORRECT comparison for composite scores.\n");
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
}

main();
