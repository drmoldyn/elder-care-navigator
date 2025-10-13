#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { DEFAULT_WEIGHTS, ProviderType } from "./scoring/config";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SCORE_VERSION = process.env.METRIC_SCORE_VERSION ?? "v2";
const USE_TEN_POINT_SCALE = process.env.USE_TEN_POINT_SCALE === "true";

interface FacilityMetric {
  facility_id: string;
  metric_key: string;
  z_score: number;
  provider_type: ProviderType;
  region: string | null;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function computePercentile(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 50;
  const sorted = [...allScores].sort((a, b) => a - b);
  const n = sorted.length;

  let countBelow = 0;
  for (const s of sorted) {
    if (s <= score) countBelow++;
    else break;
  }

  if (n === 1) return 50;
  return Math.round(((countBelow - 1) / (n - 1)) * 100);
}

async function fetchWeights(): Promise<Map<string, number>> {
  const weights = new Map<string, number>();
  const { data, error } = await supabase
    .from("facility_metric_weights")
    .select("provider_type, metric_key, weight, region")
    .eq("version", SCORE_VERSION);

  if (error) {
    console.warn("Failed to load custom metric weights; falling back to defaults.", error.message);
    return weights;
  }

  if (!data || data.length === 0) {
    return weights;
  }

  for (const row of data) {
    const key = `${row.provider_type}|${row.region ?? "GLOBAL"}|${row.metric_key}`;
    weights.set(key, row.weight);
  }

  return weights;
}

function resolveWeight(
  providerType: ProviderType,
  metricKey: string,
  region: string | null,
  customWeights: Map<string, number>
): number | undefined {
  const regionKey = `${providerType}|${region ?? "GLOBAL"}|${metricKey}`;
  if (customWeights.has(regionKey)) {
    return customWeights.get(regionKey);
  }

  const globalKey = `${providerType}|GLOBAL|${metricKey}`;
  if (customWeights.has(globalKey)) {
    return customWeights.get(globalKey);
  }

  return DEFAULT_WEIGHTS[providerType]?.[metricKey];
}

async function fetchAllMetrics(): Promise<FacilityMetric[]> {
  console.log("Fetching ALL normalized metrics with pagination...");

  const allMetrics: FacilityMetric[] = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("facility_metrics_normalized")
      .select("facility_id, metric_key, z_score, provider_type, region")
      .eq("score_version", SCORE_VERSION)
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load normalized metrics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allMetrics.push(...(data as FacilityMetric[]));
      console.log(`  Loaded page ${page + 1}: ${data.length} rows (total: ${allMetrics.length})`);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return allMetrics;
}

async function calculateSunsetwellScores() {
  const metrics = await fetchAllMetrics();
  console.log(`\n✅ Loaded ${metrics.length} normalized metric rows total\n`);

  const customWeights = await fetchWeights();
  const now = new Date().toISOString();

  // Accumulate weighted z-scores for each facility
  const scoreAccumulator: Record<string, {
    facilityId: string;
    rawScore: number;
    weightTotal: number;
    providerType: ProviderType;
    region: string | null;
  }> = {};

  for (const metric of metrics) {
    const weight = resolveWeight(
      metric.provider_type,
      metric.metric_key,
      metric.region,
      customWeights
    );

    if (weight === undefined || weight === 0) continue;

    const scoreKey = `${metric.facility_id}|${metric.provider_type}|${metric.region ?? ""}`;

    if (!scoreAccumulator[scoreKey]) {
      scoreAccumulator[scoreKey] = {
        facilityId: metric.facility_id,
        rawScore: 0,
        weightTotal: 0,
        providerType: metric.provider_type,
        region: metric.region,
      };
    }

    const zScore = Number.isFinite(metric.z_score) ? metric.z_score : 0;
    scoreAccumulator[scoreKey].rawScore += weight * zScore;
    scoreAccumulator[scoreKey].weightTotal += Math.abs(weight);
  }

  // Calculate final weighted composite scores
  const facilityScores = Object.values(scoreAccumulator).map(acc => ({
    ...acc,
    compositeZScore: acc.weightTotal > 0 ? acc.rawScore / acc.weightTotal : 0,
  }));

  console.log(`Calculated composite z-scores for ${facilityScores.length} facilities`);

  // Group by peer group (provider_type + region)
  const peerGroups = new Map<string, typeof facilityScores>();
  for (const facility of facilityScores) {
    const groupKey = `${facility.providerType}|${facility.region ?? ""}`;
    if (!peerGroups.has(groupKey)) {
      peerGroups.set(groupKey, []);
    }
    peerGroups.get(groupKey)!.push(facility);
  }

  console.log(`Peer groups: ${peerGroups.size}`);

  // For each peer group, normalize z-scores to 0-100 scale and calculate percentiles
  const sunsetwellScores: Array<{
    facility_id: string;
    overall_score: number;
    overall_percentile: number;
    peer_group_id: string | null;
    calculation_date: string;
    version: string;
  }> = [];

  for (const [groupKey, facilities] of peerGroups.entries()) {
    if (facilities.length === 0) continue;

    const zScores = facilities.map(f => f.compositeZScore);
    const normalizedScores = facilities.map(f => {
      let normalized = 50 + (f.compositeZScore * 25);
      normalized = Math.max(0, Math.min(100, normalized));

      if (USE_TEN_POINT_SCALE) {
        normalized = Math.max(1, Math.min(10, (normalized / 10) + 1));
      }

      return {
        facilityId: f.facilityId,
        score: Number(normalized.toFixed(2)),
      };
    });

    const scoreValues = normalizedScores.map(n => n.score);

    for (let i = 0; i < facilities.length; i++) {
      const facility = facilities[i];
      const normalized = normalizedScores[i];
      const percentile = computePercentile(normalized.score, scoreValues);

      sunsetwellScores.push({
        facility_id: facility.facilityId,
        overall_score: normalized.score,
        overall_percentile: percentile,
        peer_group_id: null,
        calculation_date: now.split('T')[0],
        version: SCORE_VERSION,
      });
    }
  }

  // Upsert to sunsetwell_scores table
  console.log(`\nUpserting ${sunsetwellScores.length} scores to database...`);
  const batchSize = 500;
  for (let i = 0; i < sunsetwellScores.length; i += batchSize) {
    const batch = sunsetwellScores.slice(i, i + batchSize);
    const { error: upsertError } = await supabase
      .from("sunsetwell_scores")
      .upsert(batch, {
        onConflict: "facility_id,calculation_date",
        ignoreDuplicates: false
      });

    if (upsertError) {
      throw new Error(`Failed to upsert sunsetwell_scores: ${upsertError.message}`);
    }

    if ((i + batchSize) % 2000 === 0 || i + batchSize >= sunsetwellScores.length) {
      console.log(`  Upserted ${Math.min(i + batchSize, sunsetwellScores.length)} / ${sunsetwellScores.length}...`);
    }
  }

  console.log(`\n✅ Upserted ${sunsetwellScores.length} SunsetWell scores to sunsetwell_scores table`);
  console.log(`   Score scale: ${USE_TEN_POINT_SCALE ? '1-10' : '0-100'}`);
  console.log(`   Percentiles calculated within peer groups (state + provider type)`);
}

calculateSunsetwellScores()
  .then(() => {
    console.log("\n✅ SunsetWell scores calculation complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ SunsetWell scores calculation failed:", error);
    process.exit(1);
  });
