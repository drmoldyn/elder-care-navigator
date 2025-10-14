#!/usr/bin/env npx tsx

/**
 * Inline Univariate Regression: Calculate SunsetWell scores on-the-fly
 *
 * This version doesn't require the sunsetwell_scores table to be populated.
 * It fetches raw metrics and calculates scores inline using the same logic.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { DEFAULT_WEIGHTS, METRICS, getMetricsForProvider } from "./config";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface FacilityRaw {
  facility_id: string;
  quality_rating: number;
  complaints: number;
  incidents: number;

  // Metrics for scoring
  health_inspection_rating?: number;
  staffing_rating?: number;
  quality_measure_rating?: number;
  total_nurse_hours_per_resident_per_day?: number;
  rn_hours_per_resident_per_day?: number;
  total_nurse_staff_turnover?: number;
  rn_turnover?: number;
  deficiency_count?: number;
  has_immediate_jeopardy?: boolean;
  total_penalties_amount?: number;
  hosp_ls_per_1k?: number;
  ed_ls_per_1k?: number;
}

/**
 * Convert raw metric value to 0-100 score
 */
function toScore100(metricKey: string, value: any): number | null {
  if (value === null || value === undefined) return null;
  const val = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(val)) return null;

  const linearMap = (v: number, minVal: number, maxVal: number) => {
    if (v <= minVal) return 0;
    if (v >= maxVal) return 100;
    return ((v - minVal) / (maxVal - minVal)) * 100;
  };

  switch (metricKey) {
    case "health_inspection_rating":
    case "staffing_rating":
    case "quality_measure_rating":
      // CMS 1-5 stars → 0-100
      return ((val - 1) / 4) * 100;

    case "total_nurse_hours_per_resident_per_day":
      // 2-6 hours typical range
      return linearMap(val, 2.0, 6.0);

    case "rn_hours_per_resident_per_day":
      // 0.3-1.2 hours typical
      return linearMap(val, 0.3, 1.2);

    case "total_nurse_staff_turnover":
    case "rn_turnover":
      // 10-80% typical, lower is better → invert
      return 100 - linearMap(val, 10, 80);

    case "deficiency_count":
      // 0-30 deficiencies typical, lower is better → invert
      return 100 - linearMap(val, 0, 30);

    case "has_immediate_jeopardy":
      // Boolean: 0 = good (100), 1 = bad (0)
      return val ? 0 : 100;

    case "total_penalties_amount":
      // $0-$50k typical, lower is better → invert
      return 100 - linearMap(val, 0, 50000);

    case "hosp_ls_per_1k":
    case "ed_ls_per_1k":
      // 0-10 per 1,000 days typical, lower is better → invert
      return 100 - linearMap(val, 0, 10);

    default:
      return null;
  }
}

/**
 * Calculate weighted SunsetWell score from raw metrics
 */
function calculateSunsetwellScore(facility: FacilityRaw): number | null {
  const weights = DEFAULT_WEIGHTS.nursing_home;
  let weightedSum = 0;
  let weightTotal = 0;

  for (const [metricKey, weight] of Object.entries(weights)) {
    if (!weight || weight === 0) continue;

    const rawValue = (facility as any)[metricKey];
    const score100 = toScore100(metricKey, rawValue);

    if (score100 !== null) {
      weightedSum += score100 * Math.abs(weight);
      weightTotal += Math.abs(weight);
    }
  }

  if (weightTotal === 0) return null;
  return weightedSum / weightTotal;
}

/**
 * Simple linear regression
 */
function linearRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  r_squared: number;
  n: number;
} {
  const n = x.length;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += (x[i] - meanX) ** 2;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  const predictions = x.map(xi => slope * xi + intercept);
  const ssRes = y.reduce((sum, yi, i) => sum + (yi - predictions[i]) ** 2, 0);
  const ssTot = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0);
  const r_squared = 1 - (ssRes / ssTot);

  return { slope, intercept, r_squared, n };
}

async function fetchAllFacilities(): Promise<FacilityRaw[]> {
  console.log("Fetching all nursing home facilities...");

  const { data, error } = await supabase
    .from("resources")
    .select(
      `
      facility_id,
      quality_rating,
      number_of_substantiated_complaints,
      number_of_facility_reported_incidents,
      health_inspection_rating,
      staffing_rating,
      quality_measure_rating,
      total_nurse_hours_per_resident_per_day,
      rn_hours_per_resident_per_day,
      total_nurse_staff_turnover,
      rn_turnover,
      deficiency_count,
      has_immediate_jeopardy,
      total_penalties_amount,
      hosp_ls_per_1k,
      ed_ls_per_1k
    `
    )
    .eq("provider_type", "nursing_home")
    .not("quality_rating", "is", null)
    .not("number_of_substantiated_complaints", "is", null);

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned");
  }

  console.log(`Retrieved ${data.length} facilities\n`);

  return data.map((row) => ({
    facility_id: row.facility_id,
    quality_rating: row.quality_rating,
    complaints: row.number_of_substantiated_complaints ?? 0,
    incidents: row.number_of_facility_reported_incidents ?? 0,
    health_inspection_rating: row.health_inspection_rating ?? undefined,
    staffing_rating: row.staffing_rating ?? undefined,
    quality_measure_rating: row.quality_measure_rating ?? undefined,
    total_nurse_hours_per_resident_per_day: row.total_nurse_hours_per_resident_per_day ?? undefined,
    rn_hours_per_resident_per_day: row.rn_hours_per_resident_per_day ?? undefined,
    total_nurse_staff_turnover: row.total_nurse_staff_turnover ?? undefined,
    rn_turnover: row.rn_turnover ?? undefined,
    deficiency_count: row.deficiency_count ?? undefined,
    has_immediate_jeopardy: row.has_immediate_jeopardy ?? undefined,
    total_penalties_amount: row.total_penalties_amount ?? undefined,
    hosp_ls_per_1k: row.hosp_ls_per_1k ?? undefined,
    ed_ls_per_1k: row.ed_ls_per_1k ?? undefined,
  }));
}

function main() {
  console.log("\n=== Full Dataset Univariate Regression Analysis ===\n");
  console.log("Calculating SunsetWell scores inline from raw metrics...\n");

  fetchAllFacilities()
    .then((facilities) => {
      // Calculate SunsetWell scores inline
      console.log("Computing SunsetWell scores for all facilities...");
      const facilitiesWithScores = facilities
        .map((f) => ({
          ...f,
          sunsetwell_score: calculateSunsetwellScore(f),
        }))
        .filter((f) => f.sunsetwell_score !== null);

      console.log(`Facilities with valid SunsetWell scores: ${facilitiesWithScores.length}\n`);

      // Prepare data arrays
      const sunsetwellScores = facilitiesWithScores.map((f) => f.sunsetwell_score!);
      const cmsRatings = facilitiesWithScores.map((f) => f.quality_rating);
      const logComplaints = facilitiesWithScores.map((f) => Math.log(f.complaints + 1));
      const logIncidents = facilitiesWithScores.map((f) => Math.log(f.incidents + 1));

      // Run regressions
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("MODEL A: log(complaints) ~ sunsetwell_score");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const modelA_complaints = linearRegression(sunsetwellScores, logComplaints);
      console.log(`  n = ${modelA_complaints.n}`);
      console.log(`  slope = ${modelA_complaints.slope.toFixed(6)}`);
      console.log(`  intercept = ${modelA_complaints.intercept.toFixed(6)}`);
      console.log(`  r² = ${modelA_complaints.r_squared.toFixed(6)} (${(modelA_complaints.r_squared * 100).toFixed(2)}%)\n`);

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("MODEL B: log(complaints) ~ cms_overall_rating");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const modelB_complaints = linearRegression(cmsRatings, logComplaints);
      console.log(`  n = ${modelB_complaints.n}`);
      console.log(`  slope = ${modelB_complaints.slope.toFixed(6)}`);
      console.log(`  intercept = ${modelB_complaints.intercept.toFixed(6)}`);
      console.log(`  r² = ${modelB_complaints.r_squared.toFixed(6)} (${(modelB_complaints.r_squared * 100).toFixed(2)}%)\n`);

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("COMPARISON: Complaints Prediction");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const ratio_complaints = modelA_complaints.r_squared / modelB_complaints.r_squared;
      const improvement_complaints = ((ratio_complaints - 1) * 100).toFixed(1);

      console.log(`  SunsetWell r²: ${modelA_complaints.r_squared.toFixed(6)}`);
      console.log(`  CMS r²:        ${modelB_complaints.r_squared.toFixed(6)}`);
      console.log(`  Ratio:         ${ratio_complaints.toFixed(2)}x`);
      console.log(`  Improvement:   +${improvement_complaints}%\n`);

      // Incidents
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("SECONDARY OUTCOME: Incidents");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const modelA_incidents = linearRegression(sunsetwellScores, logIncidents);
      const modelB_incidents = linearRegression(cmsRatings, logIncidents);

      console.log(`Model A (SunsetWell): r² = ${modelA_incidents.r_squared.toFixed(6)}`);
      console.log(`Model B (CMS):        r² = ${modelB_incidents.r_squared.toFixed(6)}`);
      console.log(`Ratio:                ${(modelA_incidents.r_squared / modelB_incidents.r_squared).toFixed(2)}x\n`);

      // Save results
      const results = {
        analysis_date: new Date().toISOString(),
        n_facilities: facilitiesWithScores.length,
        methodology: "inline_calculation",
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

      const outputPath = "docs/score-validation-full-dataset.json";
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`Results saved to ${outputPath}`);

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("INTERPRETATION");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (ratio_complaints > 1.5) {
        console.log(`✓ SunsetWell Score is ${ratio_complaints.toFixed(1)}x better at predicting complaints`);
        console.log(`  (+${improvement_complaints}% more predictive power)`);
      } else if (ratio_complaints > 1.2) {
        console.log(`✓ SunsetWell Score is moderately better (${ratio_complaints.toFixed(2)}x)`);
        console.log(`  (+${improvement_complaints}% improvement)`);
      } else if (ratio_complaints > 1.0) {
        console.log(`≈ SunsetWell Score is slightly better (${ratio_complaints.toFixed(2)}x)`);
        console.log(`  (+${improvement_complaints}% improvement)`);
      } else {
        console.log(`✗ SunsetWell Score is NOT better than CMS (${ratio_complaints.toFixed(2)}x)`);
      }

      console.log("\n");
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
}

main();
