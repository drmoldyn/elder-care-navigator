#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function quickCheck() {
  console.log("Quick verification of score counts...\n");

  const providerTypes = [
    { key: "nursing_home", name: "Nursing Homes" },
    { key: "assisted_living_facility", name: "Assisted Living" },
    { key: "home_health", name: "Home Health" },
  ];

  // Load all scores first
  console.log("Loading all scores...");
  const allScores = new Set<string>();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .eq("version", "v2")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((s) => allScores.add(s.facility_id));
      if (data.length < 1000) hasMore = false;
      else page++;
    }
  }

  console.log(`Total unique facilities with v2 scores: ${allScores.size}\n`);

  // Check each provider type
  for (const { key, name } of providerTypes) {
    console.log(`${name}:`);

    // Count total
    let total = 0;
    page = 0;
    hasMore = true;
    const ids: string[] = [];

    while (hasMore) {
      const { data } = await supabase
        .from("resources")
        .select("id")
        .eq("provider_type", key)
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        ids.push(...data.map((r) => r.id));
        total += data.length;
        if (data.length < 1000) hasMore = false;
        else page++;
      }
    }

    const withScores = ids.filter((id) => allScores.has(id)).length;
    const pct = total > 0 ? ((withScores / total) * 100).toFixed(1) : "0.0";

    console.log(`  Total: ${total.toLocaleString()}`);
    console.log(`  With scores: ${withScores.toLocaleString()} (${pct}%)\n`);
  }
}

quickCheck()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
