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

async function checkWeightedMetricsCoverage() {
  console.log("🔍 CHECKING WEIGHTED METRICS COVERAGE\n");
  console.log("=".repeat(80));

  const weightedMetrics = [
    "health_inspection_rating",
    "staffing_rating",
    "total_nurse_hours_per_resident_per_day",
    "rn_hours_per_resident_per_day",
    "total_nurse_staff_turnover",
    "rn_turnover",
    "quality_measure_rating"
  ];

  // Count total nursing homes
  const { count: totalNH } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  console.log(`Total nursing homes: ${totalNH}\n`);

  // Count facilities with AT LEAST ONE weighted metric
  let nhWithAnyMetric = 0;
  let nhWithAllNullMetrics = [];

  // Sample check of facilities without scores
  const { data: facilitiesWithoutScores } = await supabase
    .from("resources")
    .select(`id, title, facility_id, ${weightedMetrics.join(", ")}, states`)
    .eq("provider_type", "nursing_home")
    .limit(100);

  for (const facility of facilitiesWithoutScores || []) {
    // Check if has score
    const { data: score } = await supabase
      .from("sunsetwell_scores")
      .select("overall_score")
      .eq("facility_id", facility.id)
      .single();

    if (!score) {
      // Check if has ANY weighted metric
      const hasAnyMetric = weightedMetrics.some(metric => {
        const value = facility[metric];
        return value !== null && value !== undefined && value !== "";
      });

      if (!hasAnyMetric) {
        nhWithAllNullMetrics.push(facility);
      }
    }
  }

  console.log(`Checked 100 sample facilities`);
  console.log(`  Facilities without scores AND without any weighted metrics: ${nhWithAllNullMetrics.length}\n`);

  if (nhWithAllNullMetrics.length > 0) {
    console.log("Sample facilities with NO weighted metrics:\n");
    for (const facility of nhWithAllNullMetrics.slice(0, 5)) {
      console.log(`  • ${facility.title} (CCN: ${facility.facility_id})`);
      console.log(`    State: ${facility.states?.[0] || 'NULL'}`);
      for (const metric of weightedMetrics) {
        console.log(`    ${metric}: ${facility[metric] === null ? 'NULL' : facility[metric]}`);
      }
      console.log();
    }
  }

  // Now do a comprehensive check: count all nursing homes with at least one weighted metric
  console.log("=".repeat(80));
  console.log("COMPREHENSIVE COVERAGE CHECK");
  console.log("=".repeat(80));

  for (const metric of weightedMetrics) {
    const { count } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("provider_type", "nursing_home")
      .not(metric, "is", null);

    const pct = totalNH ? ((count! / totalNH!) * 100).toFixed(1) : "0.0";
    console.log(`${metric}: ${count} (${pct}%)`);
  }

  console.log("\n" + "=".repeat(80));
}

checkWeightedMetricsCoverage()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
