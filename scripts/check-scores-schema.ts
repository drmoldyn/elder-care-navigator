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

async function checkScoresSchema() {
  console.log("🔍 CHECKING SUNSETWELL_SCORES SCHEMA\n");

  // Get a sample record to see all fields
  const { data: sampleScore, error } = await supabase
    .from("sunsetwell_scores")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching sample score:", error);
    return;
  }

  if (sampleScore) {
    console.log("Sample score record fields:");
    for (const [key, value] of Object.entries(sampleScore)) {
      console.log(`  ${key}: ${typeof value} = ${value}`);
    }
  }

  // Count total scores
  const { count: totalScores } = await supabase
    .from("sunsetwell_scores")
    .select("*", { count: "exact", head: true });

  console.log(`\nTotal scores in table: ${totalScores}`);

  // Get unique facility count
  let allFacilityIds = new Set<string>();
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .range(from, to);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach(s => allFacilityIds.add(s.facility_id));
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`Unique facilities with scores: ${allFacilityIds.size}\n`);

  //Count by provider_type properly
  const providerTypeCounts = new Map<string, Set<string>>();
  page = 0;
  hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id, provider_type")
      .range(from, to);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach(s => {
        if (!providerTypeCounts.has(s.provider_type)) {
          providerTypeCounts.set(s.provider_type, new Set());
        }
        providerTypeCounts.get(s.provider_type)!.add(s.facility_id);
      });
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log("Unique facilities by provider_type:");
  for (const [type, ids] of providerTypeCounts.entries()) {
    console.log(`  ${type}: ${ids.size} facilities`);
  }
}

checkScoresSchema()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
