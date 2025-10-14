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

async function finalCoverageReport() {
  console.log("🔍 FINAL SCORE COVERAGE REPORT\n");
  console.log("=".repeat(80));

  // Get all scores with pagination
  let allScores: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("Loading all scores...");
  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id, version")
      .range(from, to);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allScores.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`Loaded ${allScores.length} score records\n`);

  // Get unique facilities
  const uniqueFacilities = new Set(allScores.map(s => s.facility_id));
  console.log(`Unique facilities with scores: ${uniqueFacilities.size}\n`);

  // For each unique facility, look up its provider_type
  console.log("Looking up provider types for scored facilities...");
  const providerTypeCounts = new Map<string, number>();

  // Batch lookup facilities
  const facilityIds = Array.from(uniqueFacilities);
  for (let i = 0; i < facilityIds.length; i += 1000) {
    const batch = facilityIds.slice(i, i + 1000);
    const { data: resources } = await supabase
      .from("resources")
      .select("id, provider_type")
      .in("id", batch);

    for (const resource of resources ?? []) {
      const count = providerTypeCounts.get(resource.provider_type) || 0;
      providerTypeCounts.set(resource.provider_type, count + 1);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 SCORES BY PROVIDER TYPE");
  console.log("=".repeat(80));

  // Get total counts for each provider type (using actual values from database)
  const providerTypes = [
    { key: "nursing_home", display: "NURSING HOMES" },
    { key: "assisted_living_facility", display: "ASSISTED LIVING FACILITIES" },
    { key: "home_health", display: "HOME HEALTH AGENCIES" },
    { key: "hospice", display: "HOSPICE AGENCIES" }
  ];

  for (const { key, display } of providerTypes) {
    const { count: total } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("provider_type", key);

    const withScores = providerTypeCounts.get(key) || 0;
    const pct = total ? ((withScores / total) * 100).toFixed(1) : "0.0";

    console.log(`\n${display}`);
    console.log(`  Total facilities: ${total}`);
    console.log(`  With scores: ${withScores} (${pct}%)`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎯 KEY METRICS");
  console.log("=".repeat(80));
  console.log(`Total score records: ${allScores.length}`);
  console.log(`Unique facilities scored: ${uniqueFacilities.size}`);
  console.log(`Duplicate score records: ${allScores.length - uniqueFacilities.size}`);
  console.log("=".repeat(80));
}

finalCoverageReport()
  .then(() => {
    console.log("\n✅ Report complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Report failed:", error);
    process.exit(1);
  });
