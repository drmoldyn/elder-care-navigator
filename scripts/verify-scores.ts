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

async function verifyScores() {
  console.log("Checking facility_scores table...\n");

  const { data: scoreData, error: scoreError } = await supabase
    .from("facility_scores")
    .select("facility_id, score, provider_type, region, version")
    .order("score", { ascending: false })
    .limit(10);

  if (scoreError) {
    throw new Error(`Failed to query scores: ${scoreError.message}`);
  }

  console.log(`Total scores found: ${scoreData?.length ?? 0}\n`);
  console.log("Top 10 facilities by SunsetWell score:");
  console.log("─".repeat(80));

  for (const row of scoreData ?? []) {
    console.log(`Score: ${row.score.toFixed(2)} | Type: ${row.provider_type.padEnd(20)} | Region: ${row.region ?? 'N/A'}`);
  }

  console.log("─".repeat(80));

  // Get count by provider type
  const { data: countData, error: countError } = await supabase
    .from("facility_scores")
    .select("provider_type, score")
    .eq("version", "v2");

  if (countError) {
    console.warn("Could not get count by provider type");
  } else {
    const byType: Record<string, number> = {};
    for (const row of countData ?? []) {
      byType[row.provider_type] = (byType[row.provider_type] ?? 0) + 1;
    }

    console.log("\nScores by provider type:");
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }
  }

  // Check score distribution
  const scores = (countData ?? []).map(row => row.score);
  if (scores.length > 0) {
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    console.log("\nScore distribution:");
    console.log(`  Min: ${min.toFixed(2)}`);
    console.log(`  Max: ${max.toFixed(2)}`);
    console.log(`  Avg: ${avg.toFixed(2)}`);
  }
}

verifyScores()
  .then(() => {
    console.log("\n✅ Verification complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
