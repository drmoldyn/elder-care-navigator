#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function verifyExactCount() {
  console.log("🔍 VERIFYING EXACT SCORE COUNT\n");

  // Get all unique facility_ids with v2 scores
  console.log("Loading all v2 scores...");
  const uniqueFacilityIds = new Set<string>();
  let page = 0;
  let hasMore = true;
  let totalRows = 0;

  while (hasMore) {
    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .eq("version", "v2")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      totalRows += data.length;
      data.forEach((row) => uniqueFacilityIds.add(row.facility_id));
      if (data.length < 1000) hasMore = false;
      else page++;
    }
  }

  console.log(`Total score records: ${totalRows.toLocaleString()}`);
  console.log(`Unique facilities: ${uniqueFacilityIds.size.toLocaleString()}`);
  console.log(`Duplicate records: ${(totalRows - uniqueFacilityIds.size).toLocaleString()}\n`);

  // Break down by provider type
  const providerTypes = ["nursing_home", "assisted_living_facility", "home_health"];

  for (const providerType of providerTypes) {
    console.log(`${providerType}:`);

    // Get all facility IDs of this type
    let allIds: string[] = [];
    page = 0;
    hasMore = true;

    while (hasMore) {
      const { data } = await supabase
        .from("resources")
        .select("id")
        .eq("provider_type", providerType)
        .order("id")
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allIds.push(...data.map((r) => r.id));
        if (data.length < 1000) hasMore = false;
        else page++;
      }
    }

    const withScores = allIds.filter((id) => uniqueFacilityIds.has(id)).length;
    const pct = allIds.length > 0 ? ((withScores / allIds.length) * 100).toFixed(1) : "0.0";

    console.log(`  Total: ${allIds.length.toLocaleString()}`);
    console.log(`  With scores: ${withScores.toLocaleString()} (${pct}%)\n`);
  }
}

verifyExactCount()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
