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

async function checkScoreCount() {
  console.log("🔍 CHECKING SUNSETWELL SCORE COUNTS\n");

  // Count total scores in sunsetwell_scores table
  const { count: totalScores } = await supabase
    .from("sunsetwell_scores")
    .select("*", { count: "exact", head: true });

  console.log(`Total scores in sunsetwell_scores table: ${totalScores}\n`);

  // Count scores by provider type
  const { data: scoresByType } = await supabase
    .from("sunsetwell_scores")
    .select("provider_type");

  const providerTypeCounts = new Map<string, number>();
  for (const score of scoresByType ?? []) {
    const count = providerTypeCounts.get(score.provider_type) || 0;
    providerTypeCounts.set(score.provider_type, count + 1);
  }

  console.log("Scores by provider type:");
  for (const [type, count] of providerTypeCounts.entries()) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();

  // Count nursing homes with scores  (via JOIN)
  const { count: nursingHomesWithScores } = await supabase
    .from("resources")
    .select("*, sunsetwell_scores!inner(overall_score)", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  console.log(`Nursing homes joined with scores: ${nursingHomesWithScores}\n`);

  // Sample 5 recent scores
  const { data: sampleScores } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id, provider_type, overall_score, overall_percentile")
    .order("updated_at", { ascending: false })
    .limit(5);

  console.log("Sample recent scores:");
  for (const score of sampleScores ?? []) {
    console.log(`  Facility: ${score.facility_id}`);
    console.log(`    Type: ${score.provider_type}`);
    console.log(`    Score: ${score.overall_score}`);
    console.log(`    Percentile: ${score.overall_percentile}`);
    console.log();
  }
}

checkScoreCount()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
