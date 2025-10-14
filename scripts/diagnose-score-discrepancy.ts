#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function diagnoseDiscrepancy() {
  console.log("🔍 DIAGNOSING SCORE COUNT DISCREPANCY\n");

  // Method 1: Load all nursing homes, then check which have scores
  console.log("METHOD 1: Load all nursing homes, then check scores");
  let allNHIds: string[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from("resources")
      .select("id")
      .eq("provider_type", "nursing_home")
      .range(from, to);

    if (!data || data.length === 0) {
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

  console.log(`  Loaded ${allNHIds.length} nursing homes`);

  // Get scores with v2 version filter
  let scoresV2 = new Set<string>();
  page = 0;
  hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .eq("version", "v2")
      .range(from, to);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((s) => scoresV2.add(s.facility_id));
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  const nhWithScoresV2 = allNHIds.filter((id) => scoresV2.has(id));
  console.log(`  Found ${nhWithScoresV2.length} nursing homes with v2 scores (${((nhWithScoresV2.length / allNHIds.length) * 100).toFixed(1)}%)\n`);

  // Method 2: Check if there are duplicate scores per facility
  console.log("METHOD 2: Check for duplicate scores");
  page = 0;
  hasMore = true;
  const facilityScoreCounts = new Map<string, number>();

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id, version, calculation_date")
      .eq("version", "v2")
      .range(from, to);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((s) => {
        const count = facilityScoreCounts.get(s.facility_id) || 0;
        facilityScoreCounts.set(s.facility_id, count + 1);
      });
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  const facilitiesWithMultipleScores = Array.from(facilityScoreCounts.entries()).filter(
    ([_, count]) => count > 1
  );

  console.log(`  Total facilities with scores: ${facilityScoreCounts.size}`);
  console.log(`  Facilities with multiple score records: ${facilitiesWithMultipleScores.length}`);

  if (facilitiesWithMultipleScores.length > 0) {
    console.log(`\n  Sample facilities with multiple scores:`);
    for (const [facilityId, count] of facilitiesWithMultipleScores.slice(0, 5)) {
      const { data: scores } = await supabase
        .from("sunsetwell_scores")
        .select("calculation_date, overall_score")
        .eq("facility_id", facilityId)
        .eq("version", "v2");

      console.log(`    ${facilityId}: ${count} scores`);
      scores?.forEach((s) => {
        console.log(`      - Date: ${s.calculation_date}, Score: ${s.overall_score}`);
      });
    }
  }

  // Method 3: Check the sunsetwell_scores table total count
  console.log("\nMETHOD 3: Direct count of v2 scores");
  page = 0;
  hasMore = true;
  let totalV2Scores = 0;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("id")
      .eq("version", "v2")
      .range(from, to);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      totalV2Scores += data.length;
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`  Total v2 score records: ${totalV2Scores.toLocaleString()}`);
  console.log(`  Unique facilities with v2 scores: ${facilityScoreCounts.size.toLocaleString()}`);
  console.log(`  Difference: ${(totalV2Scores - facilityScoreCounts.size).toLocaleString()}`);
}

diagnoseDiscrepancy()
  .then(() => {
    console.log("\n✅ Diagnosis complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Diagnosis failed:", error);
    process.exit(1);
  });
