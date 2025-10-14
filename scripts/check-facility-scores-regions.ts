#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false }}
);

async function checkFacilityScoresRegions() {
  console.log("🔍 CHECKING FACILITY_SCORES REGIONS\n");

  // Get all nursing home facility_scores
  let allScores: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from('facility_scores')
      .select('region, provider_type')
      .eq('version', 'v2')
      .eq('provider_type', 'nursing_home')
      .range(from, to);

    if (!data || data.length === 0) {
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

  const regionCounts: Record<string, number> = {};
  for (const row of allScores) {
    const region = row.region || 'NULL';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  }

  console.log('Nursing home facility_scores by region:');
  const sorted = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  for (const [region, count] of sorted) {
    console.log(`  ${region}: ${count}`);
  }

  console.log(`\nTotal nursing home scores in facility_scores: ${allScores.length}`);
}

checkFacilityScoresRegions()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
