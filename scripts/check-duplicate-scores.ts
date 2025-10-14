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

async function checkDuplicateScores() {
  console.log("🔍 CHECKING FOR DUPLICATE SCORES\n");

  // Get all scores
  let allScores: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id, score_version")
      .range(from, to);

    if (error) {
      console.error("Error fetching scores:", error);
      break;
    }

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

  console.log(`Total score records: ${allScores.length}\n`);

  // Group by facility_id
  const facilityScoreCount = new Map<string, number>();
  for (const score of allScores) {
    const count = facilityScoreCount.get(score.facility_id) || 0;
    facilityScoreCount.set(score.facility_id, count + 1);
  }

  console.log(`Unique facilities with scores: ${facilityScoreCount.size}\n`);

  // Find duplicates
  const duplicates = Array.from(facilityScoreCount.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  console.log(`Facilities with multiple score records: ${duplicates.length}\n`);

  if (duplicates.length > 0) {
    console.log("Top 10 facilities with most duplicate scores:");
    for (const [facilityId, count] of duplicates.slice(0, 10)) {
      console.log(`  ${facilityId}: ${count} scores`);

      // Get the scores for this facility
      const { data: scores } = await supabase
        .from("sunsetwell_scores")
        .select("score_version, overall_score, updated_at")
        .eq("facility_id", facilityId);

      for (const s of scores ?? []) {
        console.log(`    - Version: ${s.score_version}, Score: ${s.overall_score}, Updated: ${s.updated_at}`);
      }
    }
  }

  // Check score versions
  console.log("\n Score versions:");
  const versionCounts = new Map<string, number>();
  for (const score of allScores) {
    const count = versionCounts.get(score.score_version || 'null') || 0;
    versionCounts.set(score.score_version || 'null', count + 1);
  }

  for (const [version, count] of versionCounts.entries()) {
    console.log(`  ${version}: ${count} scores`);
  }
}

checkDuplicateScores()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
