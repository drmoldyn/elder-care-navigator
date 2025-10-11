#!/usr/bin/env tsx

import { createClient, PostgrestFilterBuilder } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { ProviderType, getMetricsForProvider } from "./scoring/config";

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

const CALCULATION_DATE =
  process.env.BENCHMARK_CALCULATION_DATE ?? new Date().toISOString().slice(0, 10);

type Criteria = Record<string, unknown> | null;

interface PeerGroupRow {
  id: string;
  name: string;
  facility_type: ProviderType;
  criteria: Criteria;
}

interface ResourceRow {
  id: string;
  facility_id: string | null;
  provider_type: ProviderType | null;
  states?: string[] | null;
  county: string | null;
  zip_code: string | null;
  total_beds?: number | null;
  number_of_certified_beds?: number | null;
  licensed_capacity?: number | null;
  ownership_type?: string | null;
  is_rural?: boolean | null;
  urban_rural?: string | null;
  cbsa?: string | null;
  cbsa_code?: string | null;
  [key: string]: unknown;
}

interface BenchmarkRow {
  peer_group_id: string;
  metric_name: string;
  mean: number | null;
  median: number | null;
  std_dev: number | null;
  min_value: number | null;
  max_value: number | null;
  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  sample_count: number;
  calculation_date: string;
}

const PROVIDER_TYPES: ProviderType[] = [
  "nursing_home",
  "assisted_living",
  "home_health",
  "hospice",
];


const PROVIDER_DB_MAP: Record<ProviderType, string[]> = {
  nursing_home: ["nursing_home"],
  assisted_living: ["assisted_living", "assisted_living_facility"],
  home_health: ["home_health", "home_health_agency"],
  hospice: ["hospice"],
};

function toProviderType(value: string | null | undefined): ProviderType | null {
  if (!value) return null;
  const normalized = value.toLowerCase() as ProviderType;
  return PROVIDER_TYPES.includes(normalized) ? normalized : null;
}

function normalizeValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "string") {
    if (value.trim() === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const rank = (sorted.length - 1) * q;
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;
  if (upperIndex >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

function computeStatistics(values: number[]): Omit<BenchmarkRow, "peer_group_id" | "metric_name" | "calculation_date"> {
  if (values.length === 0) {
    return {
      mean: null,
      median: null,
      std_dev: null,
      min_value: null,
      max_value: null,
      p10: null,
      p25: null,
      p50: null,
      p75: null,
      p90: null,
      sample_count: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;
  const variance =
    count > 1
      ? sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median: percentile(sorted, 0.5),
    std_dev: stdDev,
    min_value: sorted[0],
    max_value: sorted[count - 1],
    p10: percentile(sorted, 0.1),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    sample_count: count,
  };
}

function matchesCriteria(
  resource: ResourceRow,
  criteria: Criteria,
  facilityType: ProviderType
): boolean {
  if (!criteria) return true;

  const map = criteria as Record<string, unknown>;

  const states = (resource.states ?? []).map((state) => state?.toUpperCase()).filter(Boolean) as string[];
  const primaryState = states[0] ?? null;
  const county = resource.county?.toLowerCase() ?? null;
  const ownership = resource.ownership_type?.toLowerCase() ?? null;
  const bedCount = determineCapacityForResource(facilityType, resource);

  if (typeof map.state === "string") {
    if (!primaryState || primaryState !== (map.state as string).toUpperCase()) return false;
  }

  if (Array.isArray(map.states) && map.states.length > 0) {
    const allowed = new Set(
      (map.states as unknown[]).map((s) => String(s).toUpperCase())
    );
    if (!primaryState || !allowed.has(primaryState)) return false;
  }

  if (typeof map.county === "string") {
    if (!county || county !== (map.county as string).toLowerCase()) return false;
  }

  if (Array.isArray(map.counties) && map.counties.length > 0) {
    const allowed = new Set(
      (map.counties as unknown[]).map((s) => String(s).toLowerCase())
    );
    if (!county || !allowed.has(county)) return false;
  }

  if (typeof map.cbsa === "string") {
    const cbsaCandidate =
      (resource.cbsa ?? resource.cbsa_code ?? null)?.toString().toLowerCase() ?? null;
    if (!cbsaCandidate || cbsaCandidate !== (map.cbsa as string).toLowerCase()) return false;
  }

  if (typeof map.bed_count_min === "number") {
    if (bedCount === null || bedCount < (map.bed_count_min as number)) return false;
  }

  if (typeof map.bed_count_max === "number") {
    if (bedCount === null || bedCount >= (map.bed_count_max as number)) return false;
  }

  if (bedCount === null && map.allow_unknown_bed_count === false) {
    return false;
  }

  if (Array.isArray(map.ownership_types) && map.ownership_types.length > 0) {
    const allowed = new Set(
      (map.ownership_types as unknown[]).map((s) => String(s).toLowerCase())
    );
    if (!ownership || !allowed.has(ownership)) return false;
  }

  if (Array.isArray(map.ownership_categories) && map.ownership_categories.length > 0) {
    const allowedCategories = new Set(
      (map.ownership_categories as unknown[]).map((s) => String(s).toLowerCase())
    );
    if (!allowedCategories.has(ownershipCategory(resource.ownership_type))) return false;
  }

  if (typeof map.is_rural === "boolean") {
    const explicitFlag = typeof resource.is_rural === "boolean" ? resource.is_rural : null;
    const inferredFlag =
      explicitFlag !== null
        ? explicitFlag
        : typeof resource.urban_rural === "string"
        ? resource.urban_rural.toLowerCase().includes("rural")
        : null;
    if (inferredFlag === null || inferredFlag !== map.is_rural) return false;
  }

  if (Array.isArray(map.zip_codes) && map.zip_codes.length > 0) {
    const allowed = new Set(
      (map.zip_codes as unknown[]).map((s) => String(s).slice(0, 5))
    );
    const zip = resource.zip_code?.slice(0, 5) ?? null;
    if (!zip || !allowed.has(zip)) return false;
  }

  if (Array.isArray(map.zip_prefixes) && map.zip_prefixes.length > 0) {
    const prefixes = (map.zip_prefixes as unknown[]).map((s) => String(s));
    const zip = resource.zip_code ?? "";
    const hasPrefix = prefixes.some((prefix) => zip.startsWith(prefix));
    if (!hasPrefix) return false;
  }

  return true;
}


function applyDirectFilters(
  query: PostgrestFilterBuilder<ResourceRow, ResourceRow[]>,
  criteria: Criteria
): PostgrestFilterBuilder<ResourceRow, ResourceRow[]> {
  if (!criteria) return query;

  const map = criteria as Record<string, unknown>;

  if (typeof map.state === "string") {
    query = query.contains("states", [(map.state as string).toUpperCase()]);
  } else if (Array.isArray(map.states) && map.states.length > 0) {
    const states = (map.states as unknown[]).map((s) => String(s).toUpperCase());
    query = query.overlaps("states", states);
  }

  if (typeof map.county === "string") {
    query = query.eq("county", (map.county as string).toLowerCase());
  } else if (Array.isArray(map.counties) && map.counties.length > 0) {
    const counties = (map.counties as unknown[]).map((s) => String(s).toLowerCase());
    query = query.in("county", counties);
  }

  return query;
}

function determineCapacityForResource(
  facilityType: ProviderType,
  resource: ResourceRow
): number | null {
  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return null;
  };

  switch (facilityType) {
    case "nursing_home":
      return (
        toNumber(resource.total_beds) ??
        toNumber(resource.number_of_certified_beds)
      );
    case "assisted_living":
      return toNumber(resource.licensed_capacity) ?? toNumber(resource.total_beds);
    default:
      return null;
  }
}

function ownershipCategory(value: string | null | undefined): string {
  if (!value) return "other";
  const normalized = value.toLowerCase();
  if (normalized.includes("for profit")) return "for_profit";
  if (normalized.includes("non profit") || normalized.includes("non-profit")) {
    return "non_profit_or_gov";
  }
  if (normalized.includes("government")) return "non_profit_or_gov";
  return "other";
}


async function fetchPeerGroups(): Promise<PeerGroupRow[]> {
  const { data, error } = await supabase
    .from<PeerGroupRow>("peer_groups")
    .select("id, name, facility_type, criteria");

  if (error) {
    throw new Error(`Failed to load peer groups: ${error.message}`);
  }

  return (data ?? []).filter((group) => PROVIDER_TYPES.includes(group.facility_type));
}

async function fetchFacilitiesForGroup(
  group: PeerGroupRow,
  metricColumns: string[]
): Promise<ResourceRow[]> {
  const baseColumns = [
    "id",
    "facility_id",
    "provider_type",
    "states",
    "county",
    "zip_code",
    "total_beds",
    "number_of_certified_beds",
    "licensed_capacity",
    "ownership_type",
    "is_rural",
    "urban_rural",
    "cbsa",
    "cbsa_code",
  ];

  const selectColumns = Array.from(new Set([...baseColumns, ...metricColumns]));
  const selectClause = selectColumns.join(", ");

  const PAGE_SIZE = 1000;
  let from = 0;
  const results: ResourceRow[] = [];

  while (true) {
    let query = supabase
      .from<ResourceRow>("resources")
      .select(selectClause)
      .in("provider_type", PROVIDER_DB_MAP[group.facility_type])
      .range(from, from + PAGE_SIZE - 1);

    query = applyDirectFilters(query, group.criteria);

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch resources for group ${group.id}: ${error.message}`);
    }

    const batch = data ?? [];
    results.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return results;
}

async function buildBenchmarks(): Promise<void> {
  const peerGroups = await fetchPeerGroups();
  if (peerGroups.length === 0) {
    console.log("No peer groups defined. Nothing to calculate.");
    return;
  }

  const rows: BenchmarkRow[] = [];

  for (const group of peerGroups) {
    const metrics = getMetricsForProvider(group.facility_type);
    if (metrics.length === 0) {
      console.log(`Skipping peer group ${group.name} (${group.id}) – no metrics defined.`);
      continue;
    }

    const facilities = await fetchFacilitiesForGroup(
      group,
      metrics.map((metric) => metric.column)
    );

    const eligibleFacilities = facilities.filter((facility) =>
      matchesCriteria(facility, group.criteria, group.facility_type)
    );

    if (eligibleFacilities.length === 0) {
      console.log(
        `Peer group ${group.name} (${group.id}) has no facilities after filtering; skipping.`
      );
      continue;
    }

    for (const metric of metrics) {
      const values: number[] = [];

      for (const facility of eligibleFacilities) {
        const raw = facility[metric.column];
        const numeric = normalizeValue(raw);
        if (numeric === null) continue;
        values.push(numeric);
      }

      const stats = computeStatistics(values);
      if (stats.sample_count === 0) {
        continue;
      }

      rows.push({
        peer_group_id: group.id,
        metric_name: metric.key,
        mean: stats.mean,
        median: stats.median,
        std_dev: stats.std_dev,
        min_value: stats.min_value,
        max_value: stats.max_value,
        p10: stats.p10,
        p25: stats.p25,
        p50: stats.p50,
        p75: stats.p75,
        p90: stats.p90,
        sample_count: stats.sample_count,
        calculation_date: CALCULATION_DATE,
      });
    }
  }

  if (rows.length === 0) {
    console.log("No benchmark rows generated. Ensure metrics and data are available.");
    return;
  }

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("benchmark_metrics")
      .upsert(batch, { onConflict: "peer_group_id,metric_name,calculation_date" });
    if (error) {
      throw new Error(`Failed to upsert benchmark metrics: ${error.message}`);
    }
  }

  console.log(`✅ Calculated benchmark metrics for ${rows.length} peer group / metric pairs.`);
}

buildBenchmarks()
  .catch((error) => {
    console.error("❌ Benchmark calculation failed:", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
