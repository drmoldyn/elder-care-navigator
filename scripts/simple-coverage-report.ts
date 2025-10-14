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

async function simpleCoverageReport() {
  console.log("🔍 SIMPLE COVERAGE REPORT\n");
  console.log("=".repeat(80));

  // For each provider type, count facilities with scores using JOIN
  const providerTypes = [
    { key: "nursing_home", display: "NURSING HOMES" },
    { key: "assisted_living_facility", display: "ASSISTED LIVING FACILITIES" },
    { key: "home_health", display: "HOME HEALTH AGENCIES" },
  ];

  for (const { key, display } of providerTypes) {
    // Count total
    const { count: total } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("provider_type", key);

    // Count with scores using JOIN
    const { count: withScores } = await supabase
      .from("resources")
      .select("*, sunsetwell_scores!inner(overall_score)", { count: "exact", head: true })
      .eq("provider_type", key);

    const pct = total ? ((withScores! / total!) * 100).toFixed(1) : "0.0";

    console.log(`\n${display}`);
    console.log(`  Total facilities: ${total}`);
    console.log(`  With scores: ${withScores} (${pct}%)`);
  }

  // Total scores
  const { count: totalScores } = await supabase
    .from("sunsetwell_scores")
    .select("*", { count: "exact", head: true });

  console.log("\n" + "=".repeat(80));
  console.log(`📊 TOTAL SCORES IN DATABASE: ${totalScores}`);
  console.log("=".repeat(80));
}

simpleCoverageReport()
  .then(() => {
    console.log("\n✅ Report complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Report failed:", error);
    process.exit(1);
  });
