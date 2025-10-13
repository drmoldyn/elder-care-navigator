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

async function checkScoreCoverage() {
  console.log("Checking SunsetWell score coverage...\n");

  // Get total facilities
  const { count: totalCount, error: totalError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    throw new Error(`Failed to count resources: ${totalError.message}`);
  }

  console.log(`📊 Total facilities in resources table: ${totalCount}`);

  // Get facilities with sunsetwell_scores
  const { data: facilitiesWithScores, error: scoresError } = await supabase
    .from("resources")
    .select(`
      id,
      facility_id,
      title,
      provider_type,
      sunsetwell_scores!inner(overall_score, overall_percentile, calculation_date)
    `)
    .order("calculation_date", { ascending: false, referencedTable: "sunsetwell_scores" })
    .limit(1, { referencedTable: "sunsetwell_scores" });

  if (scoresError) {
    throw new Error(`Failed to query facilities with scores: ${scoresError.message}`);
  }

  const facilitiesWithScoresCount = facilitiesWithScores?.length ?? 0;
  const facilitiesWithoutScoresCount = (totalCount ?? 0) - facilitiesWithScoresCount;

  console.log(`✅ Facilities WITH SunsetWell scores: ${facilitiesWithScoresCount}`);
  console.log(`❌ Facilities WITHOUT SunsetWell scores: ${facilitiesWithoutScoresCount}`);
  console.log(`📈 Coverage: ${totalCount ? ((facilitiesWithScoresCount / totalCount) * 100).toFixed(1) : 0}%\n`);

  // Get facilities without scores by finding facility_ids not in sunsetwell_scores
  if (facilitiesWithoutScoresCount > 0) {
    // Get all facility_ids that have scores
    const { data: scoredFacilityIds, error: scoredIdsError } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .order("calculation_date", { ascending: false });

    if (scoredIdsError) {
      console.warn("Could not fetch scored facility IDs:", scoredIdsError.message);
    } else {
      const scoredIds = new Set(scoredFacilityIds?.map(s => s.facility_id) ?? []);

      // Get sample of facilities without scores
      const { data: allFacilities, error: allFacilitiesError } = await supabase
        .from("resources")
        .select("id, facility_id, title, provider_type, states")
        .not("facility_id", "is", null)
        .limit(1000);

      if (allFacilitiesError) {
        console.warn("Could not fetch facilities:", allFacilitiesError.message);
      } else {
        const facilitiesWithoutScores = allFacilities?.filter(f => !scoredIds.has(f.facility_id!)) ?? [];
        const sampleSize = Math.min(20, facilitiesWithoutScores.length);

        console.log(`Sample facilities WITHOUT scores (${sampleSize} of ${facilitiesWithoutScores.length}):`);
        console.log("─".repeat(120));

        for (const facility of facilitiesWithoutScores.slice(0, sampleSize)) {
          const state = Array.isArray(facility.states) ? facility.states[0] : 'N/A';
          console.log(`${facility.facility_id?.padEnd(15) ?? 'NO_ID'.padEnd(15)} | ${facility.provider_type?.padEnd(25) ?? 'N/A'.padEnd(25)} | ${state.padEnd(5)} | ${facility.title?.substring(0, 50) ?? 'N/A'}`);
        }
        console.log("─".repeat(120));
        console.log();

        // Check if these facilities have normalized metrics
        const sampleIds = facilitiesWithoutScores.slice(0, 50).map(f => f.facility_id).filter(Boolean);

        if (sampleIds.length > 0) {
          const { data: metricsCheck, error: metricsError } = await supabase
            .from("facility_metrics_normalized")
            .select("facility_id")
            .in("facility_id", sampleIds);

          if (metricsError) {
            console.warn("Could not check normalized metrics:", metricsError.message);
          } else {
            const facilitiesWithMetrics = new Set(metricsCheck?.map(m => m.facility_id) ?? []);
            const facilitiesWithoutMetrics = sampleIds.filter(id => !facilitiesWithMetrics.has(id));

            console.log(`\n🔍 Diagnosis (sample of ${sampleIds.length} facilities without scores):`);
            console.log(`   Facilities WITH normalized metrics: ${facilitiesWithMetrics.size}`);
            console.log(`   Facilities WITHOUT normalized metrics: ${facilitiesWithoutMetrics.length}`);

            if (facilitiesWithoutMetrics.length > 0) {
              console.log(`\n⚠️  Root cause: ${facilitiesWithoutMetrics.length}/${sampleIds.length} sample facilities lack normalized metrics`);
              console.log("   This suggests facilities are missing base data for score calculation");
              console.log("   These facilities likely need data import/processing first");
            } else {
              console.log(`\n✅ Root cause: Facilities have normalized metrics but scores haven't been calculated`);
              console.log("   Solution: Run 'npx tsx scripts/calculate-sunsetwell-scores.ts' to generate scores");
            }
          }
        }
      }
    }
  }

  // Score distribution for facilities with scores
  if (facilitiesWithScoresCount > 0) {
    const scores = facilitiesWithScores?.map((f: any) =>
      f.sunsetwell_scores?.[0]?.overall_score
    ).filter((s: any) => typeof s === 'number') ?? [];

    if (scores.length > 0) {
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;

      console.log("\n📊 Score distribution:");
      console.log(`   Min: ${min.toFixed(2)}`);
      console.log(`   Max: ${max.toFixed(2)}`);
      console.log(`   Avg: ${avg.toFixed(2)}`);
    }
  }

  // Check by provider type
  const { data: byProvider, error: providerError } = await supabase
    .from("resources")
    .select("facility_id, provider_type");

  if (!providerError && byProvider) {
    const providerCounts: Record<string, { total: number; withScores: number }> = {};

    // Count totals by provider type
    for (const row of byProvider) {
      const type = row.provider_type ?? 'unknown';
      if (!providerCounts[type]) {
        providerCounts[type] = { total: 0, withScores: 0 };
      }
      providerCounts[type].total++;
    }

    // Get unique facility_ids with scores
    const { data: scoredFacilities, error: scoredError } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id");

    if (!scoredError && scoredFacilities) {
      const scoredIds = new Set(scoredFacilities.map(s => s.facility_id));

      // Count how many facilities with scores per provider type
      for (const row of byProvider) {
        const type = row.provider_type ?? 'unknown';
        if (row.facility_id && scoredIds.has(row.facility_id)) {
          providerCounts[type].withScores++;
        }
      }
    }

    console.log("\n📋 Coverage by provider type:");
    console.log("─".repeat(80));
    for (const [type, counts] of Object.entries(providerCounts).sort((a, b) => b[1].total - a[1].total)) {
      const coverage = counts.total > 0 ? ((counts.withScores / counts.total) * 100).toFixed(1) : '0.0';
      console.log(`${type.padEnd(30)} | Total: ${String(counts.total).padStart(6)} | With scores: ${String(counts.withScores).padStart(6)} | ${coverage}%`);
    }
    console.log("─".repeat(80));
  }
}

checkScoreCoverage()
  .then(() => {
    console.log("\n✅ Score coverage check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Score coverage check failed:", error);
    process.exit(1);
  });
