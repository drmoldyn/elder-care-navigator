#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function verifyNHScoreCount() {
  console.log("🔍 VERIFYING NURSING HOME SCORE COUNT\n");

  // Get all nursing home IDs
  console.log("1. Loading all nursing home IDs...");
  let allNHIds: string[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("resources")
      .select("id")
      .eq("provider_type", "nursing_home")
      .range(from, to);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allNHIds.push(...data.map((r) => r.id));
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`   Total nursing homes: ${allNHIds.length}\n`);

  // Get all scores (all versions)
  console.log("2. Loading all sunsetwell_scores...");
  let allScoreIds = new Set<string>();
  page = 0;
  hasMore = true;

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
      data.forEach((s) => allScoreIds.add(s.facility_id));
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`   Total unique facilities with scores: ${allScoreIds.size}\n`);

  // Count NH with scores
  const nhWithScores = allNHIds.filter((id) => allScoreIds.has(id));

  console.log("3. Results:");
  console.log(`   Nursing homes: ${allNHIds.length}`);
  console.log(`   With scores: ${nhWithScores.length} (${((nhWithScores.length / allNHIds.length) * 100).toFixed(1)}%)`);
  console.log(`   Without scores: ${allNHIds.length - nhWithScores.length}`);

  // Check version breakdown
  console.log("\n4. Checking score versions...");
  const versionCounts: Record<string, number> = {};

  page = 0;
  hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("sunsetwell_scores")
      .select("version")
      .range(from, to);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((s) => {
        const version = s.version || "NULL";
        versionCounts[version] = (versionCounts[version] || 0) + 1;
      });
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log("   Version breakdown:");
  for (const [version, count] of Object.entries(versionCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${version}: ${count.toLocaleString()}`);
  }
}

verifyNHScoreCount()
  .then(() => {
    console.log("\n✅ Verification complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
