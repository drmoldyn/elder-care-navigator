#!/usr/bin/env tsx

/**
 * ⚠️ WARNING: This script is for METRIC NORMALIZATION ONLY
 *
 * DO NOT USE THIS FOR FINAL SUNSETWELL SCORE CALCULATION
 *
 * This script:
 * ✅ Calculates z-scores for individual metrics within peer groups
 * ✅ Stores normalized metrics in `facility_metrics_normalized`
 * ❌ INCORRECTLY converts weighted z-scores to percentiles (line 206-212)
 * ❌ Should NOT be used for final scoring
 *
 * For final SunsetWell scores, use:
 * → scripts/calculate-sunsetwell-scores-full.ts
 *
 * That script correctly generates:
 * - overall_score: Non-normalized weighted composite (0-100)
 * - overall_percentile: Peer-group ranking (0-100)
 *
 * See: docs/scoring-model.md and FACILITY-INVENTORY.md for correct methodology
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { DEFAULT_WEIGHTS, METRICS, ProviderType } from "./scoring/config";

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

const PROVIDER_TYPES: ProviderType[] = [
  "nursing_home",
  "assisted_living",
  "home_health",
  "hospice",
];

const PROVIDER_TYPE_ALIASES: Record<string, ProviderType> = {
  assisted_living_facility: "assisted_living",
  assisted_living: "assisted_living",
  home_health_agency: "home_health",
};

function toProviderType(value: string | null | undefined): ProviderType | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  const alias = PROVIDER_TYPE_ALIASES[normalized];
  if (alias) return alias;
  const direct = normalized as ProviderType;
  return PROVIDER_TYPES.includes(direct) ? direct : null;
}

function resolveRegion(facility: FacilityRow): string {
  const fromArray = Array.isArray(facility.states) && facility.states.length > 0
    ? facility.states[0]
    : null;

  const legacy =
    typeof facility.state === "string" && facility.state.trim().length === 2
      ? facility.state
      : null;

  const region = fromArray ?? legacy ?? "";
  return region.toUpperCase();
}

interface FacilityRow {
  id: string;
  provider_type: ProviderType | null;
  state?: string | null;
  states?: string[] | null;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

interface WeightRow {
  provider_type: ProviderType;
  metric_key: string;
  weight: number;
  region: string | null;
}

interface NormalizedMetricRow {
  facility_id: string;
  metric_key: string;
  raw_value: number | null;
  z_score: number | null;
  percentile: number | null;
  mean: number | null;
  std_dev: number | null;
  provider_type: ProviderType;
  region: string | null;
  score_version: string;
  calculated_at: string;
}

interface ScoreRow {
  facility_id: string;
  score: number;
  provider_type: ProviderType;
  region: string | null;
  version: string;
  calculated_at: string;
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

function computePercentiles(values: number[], higherIsBetter: boolean): Map<number, number> {
  if (values.length === 0) return new Map();
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const percentiles = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const value = sorted[i];
    if (n === 1) {
      percentiles.set(value, 50);
      continue;
    }
    const percentile = higherIsBetter
      ? (i / (n - 1)) * 100
      : ((n - 1 - i) / (n - 1)) * 100;
    if (!percentiles.has(value)) {
      percentiles.set(value, percentile);
    }
  }
  return percentiles;
}

async function fetchWeights(): Promise<Map<string, number>> {
  const weights = new Map<string, number>();
  const { data, error } = await supabase
    .from<WeightRow>("facility_metric_weights")
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

async function getAvailableColumns(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from<FacilityRow>("resources")
    .select("*")
    .limit(1);

  if (error) {
    console.warn(
      "Failed to inspect resources schema; assuming all configured metrics are available.",
      error.message
    );
    return new Set(METRICS.map((metric) => metric.column));
  }

  const sample = data?.[0] ?? {};
  return new Set(Object.keys(sample));
}

async function normalizeMetrics() {
  console.log("Fetching facility metrics...");

  const availableColumns = await getAvailableColumns();

  const metricsToProcess = METRICS.filter((metric) => {
    const isAvailable = availableColumns.has(metric.column);
    if (!isAvailable) {
      console.warn(`Skipping metric '${metric.key}' – column '${metric.column}' not present`);
    }
    return isAvailable;
  });

  if (metricsToProcess.length === 0) {
    console.log("No metrics available in current schema. Exiting.");
    return;
  }

  const selectColumns = [
    "id",
    "provider_type",
    "states",
    ...Array.from(new Set(metricsToProcess.map((m) => m.column))),
  ];

  // Fetch ALL facilities with pagination
  console.log("Loading all facilities with pagination...");
  let allFacilities: FacilityRow[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from<FacilityRow>("resources")
      .select(selectColumns.join(", "))
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load resources: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allFacilities.push(...data);
      console.log(`  Loaded page ${page + 1}: ${data.length} facilities (total: ${allFacilities.length})`);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`✅ Loaded ${allFacilities.length} facilities total\n`);

  const facilities = allFacilities.filter((row) => row.provider_type);
  const now = new Date().toISOString();
  const customWeights = await fetchWeights();

  const normalizedRows: NormalizedMetricRow[] = [];
  const scoreAccumulator: Record<string, { score: number; weightTotal: number; provider_type: ProviderType; region: string | null }> = {};

  for (const metric of metricsToProcess) {
    const facilitiesForMetric = facilities.filter((facility) => {
      const providerType = toProviderType(facility.provider_type);
      if (!providerType) return false;
      if (!metric.providerTypes.includes(providerType)) return false;
      const raw = facility[metric.column];
      return raw !== null && raw !== undefined && raw !== "";
    });

    if (facilitiesForMetric.length === 0) {
      continue;
    }

    const groups = new Map<string, FacilityRow[]>();
    for (const facility of facilitiesForMetric) {
      const providerType = toProviderType(facility.provider_type);
      if (!providerType) continue;

      const region = resolveRegion(facility);
      const key = `${providerType}::${region}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(facility);
    }

    for (const [groupKey, groupFacilities] of groups.entries()) {
      const [providerTypeRaw, region] = groupKey.split("::");
      const providerType = providerTypeRaw as ProviderType;
      const values = groupFacilities
        .map((facility) => {
          const value = facility[metric.column];
          if (typeof value === "boolean") return value ? 1 : 0;
          if (typeof value === "string") return value === "" ? undefined : Number(value);
          return typeof value === "number" ? value : undefined;
        })
        .filter((value): value is number => value !== undefined && !Number.isNaN(value));

      if (values.length === 0) continue;

      const meanValue = mean(values);
      const stdValue = stddev(values, meanValue);
      const percentileLookup = computePercentiles(values, metric.higherIsBetter);

      for (const facility of groupFacilities) {
        const valueRaw = facility[metric.column];
        if (valueRaw === null || valueRaw === undefined || valueRaw === "") continue;

        let numericValue: number;
        if (typeof valueRaw === "boolean") numericValue = valueRaw ? 1 : 0;
        else if (typeof valueRaw === "string") numericValue = Number(valueRaw);
        else numericValue = valueRaw as number;

        if (Number.isNaN(numericValue)) continue;

        let zScore = 0;
        if (stdValue > 0) {
          zScore = metric.higherIsBetter
            ? (numericValue - meanValue) / stdValue
            : (meanValue - numericValue) / stdValue;
        }

        const percentile = percentileLookup.get(numericValue) ?? 50;

        normalizedRows.push({
          facility_id: facility.id,
          metric_key: metric.key,
          raw_value: numericValue,
          z_score: Number.isFinite(zScore) ? zScore : 0,
          percentile,
          mean: meanValue,
          std_dev: stdValue,
          provider_type: providerType,
          region: region || null,
          score_version: SCORE_VERSION,
          calculated_at: now,
        });

        const weight = resolveWeight(providerType, metric.key, region || null, customWeights);
        if (weight !== undefined && weight !== 0) {
          const scoreKey = `${facility.id}|${providerType}|${region || ""}`;
          if (!scoreAccumulator[scoreKey]) {
            scoreAccumulator[scoreKey] = {
              score: 0,
              weightTotal: 0,
              provider_type: providerType,
              region: region || null,
            };
          }
          scoreAccumulator[scoreKey].score += weight * (Number.isFinite(zScore) ? zScore : 0);
          scoreAccumulator[scoreKey].weightTotal += Math.abs(weight);
        }
      }
    }
  }

  // Deduplicate normalized rows (keep last occurrence)
  const dedupeMap = new Map<string, NormalizedMetricRow>();
  for (const row of normalizedRows) {
    const key = `${row.facility_id}|${row.metric_key}|${row.score_version}`;
    dedupeMap.set(key, row);
  }
  const dedupedRows = Array.from(dedupeMap.values());

  console.log(`Deduped ${normalizedRows.length} rows to ${dedupedRows.length} unique rows`);

  const batchSize = 500;
  for (let i = 0; i < dedupedRows.length; i += batchSize) {
    const batch = dedupedRows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("facility_metrics_normalized")
      .upsert(batch, { onConflict: "facility_id,metric_key,score_version" });
    if (error) {
      throw new Error(`Failed to upsert normalized metrics: ${error.message}`);
    }
  }

  console.log(`Upserted ${dedupedRows.length} normalized metric rows.`);

  // Prepare score rows
  const scoreRows: ScoreRow[] = Object.entries(scoreAccumulator).map(([key, value]) => {
    const [facilityId] = key.split("|");
    const normalized = value.weightTotal > 0 ? value.score / value.weightTotal : 0;
    return {
      facility_id: facilityId,
      score: normalized,
      provider_type: value.provider_type,
      region: value.region,
      version: SCORE_VERSION,
      calculated_at: now,
    };
  });

  // Normalize scores within peer groups and convert to percentile scale
  const groups = new Map<string, ScoreRow[]>();
  for (const row of scoreRows) {
    const groupKey = `${row.provider_type}|${row.region ?? ""}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(row);
  }

  const finalScores: ScoreRow[] = [];
  for (const [, rows] of groups.entries()) {
    if (rows.length === 0) continue;
    const values = rows.map((row) => row.score);
    const percentiles = computePercentiles(values, true);

    for (const row of rows) {
      const percentile = percentiles.get(row.score) ?? 50;
      let scaled = percentile;
      if (!Number.isFinite(scaled)) scaled = 50;
      finalScores.push({ ...row, score: Number(scaled.toFixed(2)) });
    }
  }

  for (let i = 0; i < finalScores.length; i += batchSize) {
    const batch = finalScores.slice(i, i + batchSize);
    const { error } = await supabase
      .from("facility_scores")
      .upsert(batch, { onConflict: "facility_id,version" });
    if (error) {
      throw new Error(`Failed to upsert facility scores: ${error.message}`);
    }
  }

  console.log(`Upserted composite scores for ${finalScores.length} facilities.`);
}

normalizeMetrics()
  .then(() => {
    console.log("✅ Facility metrics normalized and scores updated.");
  })
  .catch((error) => {
    console.error("❌ Normalization pipeline failed:", error);
    process.exit(1);
  });
