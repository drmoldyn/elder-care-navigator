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

async function findCitiesWithScores() {
  console.log("Finding cities with v2 scores...\n");

  // Get all resources with v2 scores
  const { data, error } = await supabase
    .from("resources")
    .select(`
      city,
      states,
      facility_scores!inner(score, version)
    `)
    .eq("facility_scores.version", "v2")
    .not("city", "is", null);

  if (error) {
    console.error("Error:", error);
    return;
  }

  // Count by city-state
  const cityCounts: Record<string, number> = {};

  data?.forEach((row) => {
    if (row.city && Array.isArray(row.states) && row.states.length > 0) {
      const key = `${row.city}, ${row.states[0]}`;
      cityCounts[key] = (cityCounts[key] || 0) + 1;
    }
  });

  // Sort by count descending
  const sorted = Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  console.log("Top 20 cities with v2 scores:");
  console.log("─".repeat(60));
  sorted.forEach(([city, count]) => {
    console.log(`${city.padEnd(40)} ${count} facilities`);
  });
}

findCitiesWithScores()
  .then(() => {
    console.log("\n✅ Complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
