#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function verifyCalculationMethod() {
  console.log("🔍 VERIFYING WHICH CALCULATION METHOD WAS USED\n");

  // Get sample scores
  const { data: scores } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id, overall_score, overall_percentile")
    .eq("version", "v2")
    .limit(100);

  if (!scores || scores.length === 0) {
    console.log("No v2 scores found");
    return;
  }

  // Check if overall_score and overall_percentile are different
  let scoreEqualsPercentile = 0;
  let scoreDiffersFromPercentile = 0;

  for (const score of scores) {
    if (Math.abs(score.overall_score - score.overall_percentile) < 0.01) {
      scoreEqualsPercentile++;
    } else {
      scoreDiffersFromPercentile++;
    }
  }

  console.log("Analysis of 100 sample scores:");
  console.log(`  Score equals percentile: ${scoreEqualsPercentile}`);
  console.log(`  Score differs from percentile: ${scoreDiffersFromPercentile}`);

  if (scoreEqualsPercentile > 90) {
    console.log("\n❌ PROBLEM DETECTED:");
    console.log("   The overall_score is the same as overall_percentile in most cases.");
    console.log("   This means the WRONG script was used (normalize-facility-metrics.ts)");
    console.log("   which replaces the weighted composite with just the percentile.");
    console.log("\n✅ SOLUTION:");
    console.log("   Re-run: npx tsx scripts/calculate-sunsetwell-scores-full.ts");
    console.log("   This will generate correct non-normalized weighted scores AND percentiles.");
  } else {
    console.log("\n✅ CORRECT:");
    console.log("   The scores were generated using the correct method.");
    console.log("   overall_score = non-normalized weighted composite (0-100)");
    console.log("   overall_percentile = peer-group ranking");
  }

  // Show examples
  console.log("\n\nSample scores:");
  for (const score of scores.slice(0, 5)) {
    console.log(`  Facility: ${score.facility_id}`);
    console.log(`    Score: ${score.overall_score}`);
    console.log(`    Percentile: ${score.overall_percentile}`);
    console.log(`    Difference: ${Math.abs(score.overall_score - score.overall_percentile).toFixed(2)}`);
    console.log();
  }
}

verifyCalculationMethod()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
