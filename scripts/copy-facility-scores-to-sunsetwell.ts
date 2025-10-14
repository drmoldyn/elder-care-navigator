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

const SCORE_VERSION = "v2";

async function copyFacilityScoresToSunsetwell() {
  console.log("📋 COPYING FACILITY_SCORES TO SUNSETWELL_SCORES\n");
  console.log("=".repeat(80));

  // Fetch all facility_scores with pagination
  console.log("1. Loading all facility_scores...");
  let allFacilityScores: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("facility_scores")
      .select("*")
      .eq("version", SCORE_VERSION)
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load facility_scores: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allFacilityScores.push(...data);
      console.log(`   Loaded page ${page + 1}: ${data.length} scores (total: ${allFacilityScores.length})`);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`\n✅ Loaded ${allFacilityScores.length} facility_scores\n`);

  // Build mapping from resources.id (UUID) -> resources.facility_id (CCN/text)
  console.log("2. Building resource ID -> external facility_id (CCN) map...");
  const idToExternal = new Map<string, string>();
  {
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("resources")
        .select("id, facility_id")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const batch = data ?? [];
      batch.forEach((r: any) => {
        if (r.id && typeof r.facility_id === 'string' && r.facility_id.trim().length) {
          idToExternal.set(r.id, r.facility_id.trim());
        }
      });
      if (batch.length < PAGE) break;
      from += PAGE;
    }
    console.log(`   Mapped ${idToExternal.size} resources to external IDs`);
  }

  // Transform facility_scores to sunsetwell_scores format using CCN/text ID
  console.log("3. Transforming scores to sunsetwell_scores format...");

  // Group by peer group to calculate percentiles
  const peerGroups = new Map<string, any[]>();
  for (const score of allFacilityScores) {
    const groupKey = `${score.provider_type}|${score.region ?? ""}`;
    if (!peerGroups.has(groupKey)) {
      peerGroups.set(groupKey, []);
    }
    peerGroups.get(groupKey)!.push(score);
  }

  console.log(`   Found ${peerGroups.size} peer groups\n`);

  // Calculate percentiles within each peer group
  const sunsetwellScores: Array<{ facility_id: string; overall_score: number; overall_percentile: number; peer_group_id: string | null; calculation_date: string; version: string }>
    = [];

  for (const [groupKey, scores] of peerGroups.entries()) {
    // Sort scores for percentile calculation
    const sortedScores = [...scores].sort((a, b) => a.score - b.score);
    const n = sortedScores.length;

    for (let i = 0; i < scores.length; i++) {
      const facility = scores[i];

      // Find percentile
      const rankIndex = sortedScores.findIndex(s => s.facility_id === facility.facility_id);
      const percentile = n === 1 ? 50 : Math.round((rankIndex / (n - 1)) * 100);

      const externalId = idToExternal.get(facility.facility_id) || facility.facility_id;
      sunsetwellScores.push({
        facility_id: externalId,
        overall_score: Number(facility.score.toFixed(2)),
        overall_percentile: percentile,
        peer_group_id: null,
        calculation_date: facility.calculated_at ? facility.calculated_at.split('T')[0] : new Date().toISOString().split('T')[0],
        version: SCORE_VERSION,
      });
    }
  }

  console.log(`   Created ${sunsetwellScores.length} sunsetwell_scores records\n`);

  // Upsert to sunsetwell_scores table
  console.log("4. Upserting to sunsetwell_scores table (facility_id = external CCN)...");
  const batchSize = 500;
  let completed = 0;

  for (let i = 0; i < sunsetwellScores.length; i += batchSize) {
    const batch = sunsetwellScores.slice(i, i + batchSize);

    const { error: upsertError } = await supabase
      .from("sunsetwell_scores")
      .upsert(batch, {
        onConflict: "facility_id,calculation_date",
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} error: ${upsertError.message}`);
    } else {
      completed += batch.length;
      if ((i + batchSize) % 2000 === 0 || i + batchSize >= sunsetwellScores.length) {
        console.log(`   ✅ Progress: ${Math.min(i + batchSize, sunsetwellScores.length)} / ${sunsetwellScores.length}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Facility_scores loaded:         ${allFacilityScores.length}`);
  console.log(`Sunsetwell_scores created:      ${sunsetwellScores.length}`);
  console.log(`Successfully upserted:          ${completed}`);
  console.log("=".repeat(80));

  // Verify coverage by provider type
  console.log("\n4. Verifying coverage by provider type...");

  const providerTypes = [
    { key: "nursing_home", display: "NURSING HOMES" },
    { key: "assisted_living_facility", display: "ASSISTED LIVING FACILITIES" },
    { key: "home_health", display: "HOME HEALTH AGENCIES" },
  ];

  for (const { key, display } of providerTypes) {
    const { count: total } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("provider_type", key);

    const { count: withScores } = await supabase
      .from("resources")
      .select("*, sunsetwell_scores!inner(overall_score)", { count: "exact", head: true })
      .eq("provider_type", key);

    const pct = total ? ((withScores! / total!) * 100).toFixed(1) : "0.0";

    console.log(`\n${display}`);
    console.log(`  Total: ${total}`);
    console.log(`  With scores: ${withScores} (${pct}%)`);
  }

  console.log("\n" + "=".repeat(80));
}

copyFacilityScoresToSunsetwell()
  .then(() => {
    console.log("\n✅ Copy complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Copy failed:", error);
    process.exit(1);
  });
