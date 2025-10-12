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

async function testLocationQuery() {
  const city = "Austin";
  const state = "TX";

  console.log(`Testing query for ${city}, ${state}...\n`);

  // This is the EXACT query from getLocationData
  const { data, error } = await supabase
    .from("resources")
    .select(
      `
      id,
      title,
      provider_type,
      city,
      states,
      street_address,
      health_inspection_rating,
      staffing_rating,
      quality_measure_rating,
      total_nurse_hours_per_resident_per_day,
      facility_scores!inner(score, version)
    `
    )
    .eq("facility_scores.version", "v2")
    .ilike("city", city)
    .contains("states", [state]);

  if (error) {
    console.error("❌ Query error:", error);
    return;
  }

  console.log(`✅ Query succeeded - found ${data?.length ?? 0} results\n`);

  if (data && data.length > 0) {
    // Process like the actual code does
    const facilities = data
      .filter((facility) => {
        const scores = facility.facility_scores as unknown as Array<{ score: number }>;
        return Array.isArray(scores) && scores.length > 0;
      })
      .map((facility) => {
        const scores = facility.facility_scores as unknown as Array<{ score: number }>;
        return {
          id: facility.id,
          title: facility.title,
          sunsetwell_score: scores[0].score,
        };
      })
      .sort((a, b) => b.sunsetwell_score - a.sunsetwell_score);

    console.log(`After processing: ${facilities.length} facilities with scores`);
    console.log("\nTop 5:");
    facilities.slice(0, 5).forEach((f, i) => {
      console.log(`${i + 1}. ${f.title} - Score: ${f.sunsetwell_score.toFixed(2)}`);
    });

    // Calculate stats
    const totalFacilities = facilities.length;
    const avgScore =
      facilities.reduce((sum, f) => sum + f.sunsetwell_score, 0) / totalFacilities;

    console.log(`\nStats:`);
    console.log(`  Total: ${totalFacilities}`);
    console.log(`  Avg Score: ${avgScore.toFixed(2)}`);
  }
}

testLocationQuery()
  .then(() => {
    console.log("\n✅ Test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
