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

async function diagnoseMissingScores() {
  console.log("🔍 DIAGNOSING MISSING SCORES FOR NURSING HOMES\n");
  console.log("=".repeat(80));

  // Get all nursing homes
  console.log("1. Counting nursing homes...");
  const { count: totalNH } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  console.log(`   Total nursing homes: ${totalNH}\n`);

  // Count with staffing_rating (proxy for CMS data)
  const { count: withCMS } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home")
    .not("staffing_rating", "is", null);

  console.log(`   With CMS data (staffing_rating): ${withCMS} (${((withCMS! / totalNH!) * 100).toFixed(1)}%)\n`);

  // Count with scores
  const { count: withScores } = await supabase
    .from("resources")
    .select("*, sunsetwell_scores!inner(overall_score)", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  console.log(`   With scores: ${withScores} (${((withScores! / totalNH!) * 100).toFixed(1)}%)\n`);

  const gap = withCMS! - withScores!;
  console.log(`   ❌ GAP: ${gap} nursing homes with CMS data but NO scores\n`);

  // Sample 10 nursing homes with CMS data but no scores
  console.log("2. Sampling facilities with CMS data but no scores...\n");

  const { data: allWithCMS } = await supabase
    .from("resources")
    .select("id, title, facility_id, staffing_rating, health_inspection_rating, quality_measure_rating, states")
    .eq("provider_type", "nursing_home")
    .not("staffing_rating", "is", null)
    .limit(100);

  let samplesChecked = 0;
  let samplesWithoutScores = [];

  for (const facility of allWithCMS || []) {
    const { data: score } = await supabase
      .from("sunsetwell_scores")
      .select("overall_score")
      .eq("facility_id", facility.id)
      .single();

    if (!score) {
      samplesWithoutScores.push(facility);
      if (samplesWithoutScores.length >= 10) break;
    }
    samplesChecked++;
  }

  console.log(`   Checked ${samplesChecked} facilities with CMS data`);
  console.log(`   Found ${samplesWithoutScores.length} without scores:\n`);

  for (const facility of samplesWithoutScores) {
    console.log(`   • ${facility.title}`);
    console.log(`     CCN: ${facility.facility_id}`);
    console.log(`     State: ${facility.states?.[0] || 'NULL'}`);
    console.log(`     Staffing: ${facility.staffing_rating}`);
    console.log(`     Inspection: ${facility.health_inspection_rating}`);
    console.log(`     Quality: ${facility.quality_measure_rating}`);

    // Check if this facility has normalized metrics
    const { count: metricCount } = await supabase
      .from("facility_metrics_normalized")
      .select("*", { count: "exact", head: true })
      .eq("facility_id", facility.id);

    console.log(`     Normalized metrics: ${metricCount}`);
    console.log();
  }

  console.log("=".repeat(80));
}

diagnoseMissingScores()
  .then(() => {
    console.log("\n✅ Diagnosis complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Diagnosis failed:", error);
    process.exit(1);
  });
