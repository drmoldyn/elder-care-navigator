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

type UUID = string;

interface ResourceRow {
  id: UUID; // resources.id (UUID)
  facility_id: string | null; // CCN / external id (TEXT)
  provider_type: string | null;
  states: string[] | null;
  total_beds?: number | null;
  number_of_certified_beds?: number | null;
  licensed_capacity?: number | null;
  ownership_type?: string | null;
  // Metrics used for nursing homes
  health_inspection_rating?: number | null;
  staffing_rating?: number | null;
  quality_measure_rating?: number | null;
  total_nurse_hours_per_resident_per_day?: number | null;
  rn_hours_per_resident_per_day?: number | null;
  total_nurse_staff_turnover?: number | null;
  rn_turnover?: number | null;
  number_of_facility_reported_incidents?: number | null;
  number_of_substantiated_complaints?: number | null;
  deficiency_count?: number | null;
  has_immediate_jeopardy?: boolean | null;
  total_penalties_amount?: number | null;
}

interface PeerGroupRow {
  id: UUID;
  facility_type: ProviderType;
  criteria: Record<string, unknown> | null;
}

// State to Census division mapping (mirror of seed-peer-groups.ts)
const STATE_TO_DIVISION: Record<string, { code: string; name: string }> = {
  AL: { code: "east_south_central", name: "East South Central" },
  AK: { code: "pacific", name: "Pacific" },
  AZ: { code: "mountain", name: "Mountain" },
  AR: { code: "west_south_central", name: "West South Central" },
  CA: { code: "pacific", name: "Pacific" },
  CO: { code: "mountain", name: "Mountain" },
  CT: { code: "new_england", name: "New England" },
  DC: { code: "south_atlantic", name: "South Atlantic" },
  DE: { code: "south_atlantic", name: "South Atlantic" },
  FL: { code: "south_atlantic", name: "South Atlantic" },
  GA: { code: "south_atlantic", name: "South Atlantic" },
  HI: { code: "pacific", name: "Pacific" },
  IA: { code: "west_north_central", name: "West North Central" },
  ID: { code: "mountain", name: "Mountain" },
  IL: { code: "east_north_central", name: "East North Central" },
  IN: { code: "east_north_central", name: "East North Central" },
  KS: { code: "west_north_central", name: "West North Central" },
  KY: { code: "east_south_central", name: "East South Central" },
  LA: { code: "west_south_central", name: "West South Central" },
  MA: { code: "new_england", name: "New England" },
  MD: { code: "south_atlantic", name: "South Atlantic" },
  ME: { code: "new_england", name: "New England" },
  MI: { code: "east_north_central", name: "East North Central" },
  MN: { code: "west_north_central", name: "West North Central" },
  MO: { code: "west_north_central", name: "West North Central" },
  MS: { code: "east_south_central", name: "East South Central" },
  MT: { code: "mountain", name: "Mountain" },
  NC: { code: "south_atlantic", name: "South Atlantic" },
  ND: { code: "west_north_central", name: "West North Central" },
  NE: { code: "west_north_central", name: "West North Central" },
  NH: { code: "new_england", name: "New England" },
  NJ: { code: "mid_atlantic", name: "Mid-Atlantic" },
  NM: { code: "mountain", name: "Mountain" },
  NV: { code: "mountain", name: "Mountain" },
  NY: { code: "mid_atlantic", name: "Mid-Atlantic" },
  OH: { code: "east_north_central", name: "East North Central" },
  OK: { code: "west_south_central", name: "West South Central" },
  OR: { code: "pacific", name: "Pacific" },
  PA: { code: "mid_atlantic", name: "Mid-Atlantic" },
  PR: { code: "caribbean", name: "Caribbean" },
  RI: { code: "new_england", name: "New England" },
  SC: { code: "south_atlantic", name: "South Atlantic" },
  SD: { code: "west_north_central", name: "West North Central" },
  TN: { code: "east_south_central", name: "East South Central" },
  TX: { code: "west_south_central", name: "West South Central" },
  UT: { code: "mountain", name: "Mountain" },
  VA: { code: "south_atlantic", name: "South Atlantic" },
  VT: { code: "new_england", name: "New England" },
  WA: { code: "pacific", name: "Pacific" },
  WI: { code: "east_north_central", name: "East North Central" },
  WV: { code: "south_atlantic", name: "South Atlantic" },
  WY: { code: "mountain", name: "Mountain" },
};

interface QualityAgg {
  hospPer1kLs?: number;
  hospDen?: number;
  edPer1kLs?: number;
  edDen?: number;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function computePercentile(value: number, group: number[]): number {
  if (group.length === 0) return 50;
  const sorted = [...group].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 1) return 50;
  // Find rank index of value (first index where sorted[i] >= value)
  let i = 0;
  while (i < n && sorted[i] <= value) i++;
  return Math.round(((Math.max(0, i - 1)) / (n - 1)) * 100);
}

function primaryState(states: string[] | null | undefined): string | null {
  if (!states || states.length === 0) return null;
  const s = (states[0] || "").toString().toUpperCase().trim();
  return s.length === 2 ? s : null;
}

function bedCapacity(providerType: ProviderType, row: ResourceRow): number | null {
  switch (providerType) {
    case "nursing_home":
      return (row.total_beds ?? null) ?? (row.number_of_certified_beds ?? null);
    case "assisted_living":
      return (row.licensed_capacity ?? null) ?? (row.total_beds ?? null);
    default:
      return null;
  }
}

function matchesCriteria(resource: ResourceRow, criteria: Record<string, unknown> | null, providerType: ProviderType): boolean {
  if (!criteria) return true;
  const map = criteria as Record<string, unknown>;

  const st = primaryState(resource.states);
  const bedCount = bedCapacity(providerType, resource);
  const ownership = (resource.ownership_type || "").toLowerCase();

  if (typeof map.state === "string") {
    if (!st || st !== (map.state as string).toUpperCase()) return false;
  }
  if (Array.isArray(map.states) && map.states.length > 0) {
    const allowed = new Set((map.states as unknown[]).map((s) => String(s).toUpperCase()));
    if (!st || !allowed.has(st)) return false;
  }
  if (typeof map.bed_count_min === "number") {
    if (bedCount === null || bedCount < (map.bed_count_min as number)) return false;
  }
  if (typeof map.bed_count_max === "number") {
    if (bedCount === null || bedCount >= (map.bed_count_max as number)) return false;
  }
  if (Array.isArray(map.ownership_types) && map.ownership_types.length > 0) {
    const set = new Set((map.ownership_types as unknown[]).map((s) => String(s).toLowerCase()));
    if (!ownership || !set.has(ownership)) return false;
  }
  return true;
}

function resolveWeight(providerType: ProviderType, metricKey: string, region: string | null, custom: Map<string, number>): number | undefined {
  // Direct region (state) override
  const keyRegion = `${providerType}|${region ?? "GLOBAL"}|${metricKey}`;
  if (custom.has(keyRegion)) return custom.get(keyRegion);
  // Division-level override (DIV:<code>)
  const div = region && STATE_TO_DIVISION[region as keyof typeof STATE_TO_DIVISION]?.code;
  if (div) {
    const keyDiv = `${providerType}|DIV:${div}|${metricKey}`;
    if (custom.has(keyDiv)) return custom.get(keyDiv);
  }
  const keyGlobal = `${providerType}|GLOBAL|${metricKey}`;
  if (custom.has(keyGlobal)) return custom.get(keyGlobal);
  return DEFAULT_WEIGHTS[providerType]?.[metricKey];
}

async function fetchCustomWeights(): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  const { data, error } = await supabase
    .from("facility_metric_weights")
    .select("provider_type, metric_key, weight, region")
    .eq("version", SCORE_VERSION);
  if (error || !data) return m;
  for (const row of data) m.set(`${row.provider_type}|${row.region ?? "GLOBAL"}|${row.metric_key}`, row.weight);
  return m;
}

// Absolute 0–100 mapping per metric (nursing homes)
function toScore100(
  metricKey: string,
  raw: unknown,
  cal: { hospP10?: number; hospP90?: number; edP10?: number; edP90?: number }
): number | null {
  const val = typeof raw === "boolean" ? (raw ? 1 : 0) : typeof raw === "string" ? Number(raw) : (raw as number | null);
  if (val === null || Number.isNaN(val)) return null;
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  const lin = (x: number, a: number, b: number) => clamp(((x - a) / (b - a)) * 100, 0, 100);
  const inv = (x: number, a: number, b: number) => 100 - lin(x, a, b);

  switch (metricKey) {
    // Stars 1–5
    case "health_inspection_rating":
    case "staffing_rating":
    case "quality_measure_rating": {
      return clamp(((val - 1) / 4) * 100, 0, 100);
    }
    // Staffing capacity
    case "total_nurse_hours_per_resident_per_day": {
      // Typical range ~ 2.5–6.0
      return lin(val, 2.0, 6.0);
    }
    case "rn_hours_per_resident_per_day": {
      // Typical range ~ 0.2–1.0
      return lin(val, 0.2, 1.0);
    }
    // Stability (lower is better)
    case "total_nurse_staff_turnover": {
      return inv(val, 10, 80);
    }
    case "rn_turnover": {
      return inv(val, 10, 80);
    }
    // Safety/penalties (lower is better)
    case "deficiency_count": {
      return inv(val, 0, 25);
    }
    case "total_penalties_amount": {
      return inv(val, 0, 250000);
    }
    case "has_immediate_jeopardy": {
      return val > 0 ? 0 : 100;
    }
    // Long-stay hospitalization per 1,000 resident-days (lower is better)
    case "hosp_ls_per_1k": {
      const lo = cal.hospP10 ?? 0.5;
      const hi = cal.hospP90 ?? 3.5;
      return inv(val, lo, hi);
    }
    // Long-stay ED visits per 1,000 resident-days (lower is better)
    case "ed_ls_per_1k": {
      const lo = cal.edP10 ?? 0.5;
      const hi = cal.edP90 ?? 6.0;
      return inv(val, lo, hi);
    }
    // Outcome proxies (not in composite by default; mapped for transparency)
    case "number_of_facility_reported_incidents": {
      return inv(val, 0, 20);
    }
    case "number_of_substantiated_complaints": {
      return inv(val, 0, 40);
    }
    // Assisted living basics
    case "licensed_capacity": {
      return lin(val, 6, 300);
    }
    case "medicaid_accepted": {
      return val > 0 ? 100 : 0;
    }
    default:
      return null;
  }
}

async function calculateSunsetwellScores() {
  const customWeights = await fetchCustomWeights();

  // Calibration object for dynamic ranges of hosp/ED measures
  const cal: { hospP10?: number; hospP90?: number; edP10?: number; edP90?: number } = {};
  // Prefetch quality metrics (hospitalization and ED) for all providers
  const qualityAggByProvider = new Map<string, QualityAgg>();
  {
    // Pull recent measures with flexible name matching
    const patterns = [
      { key: "hosp", like: ["hospital", "per 1,000", "long"] },
      { key: "ed", like: ["emergency", "per 1,000", "long"] },
    ];

    const { data: qms, error: qmErr } = await supabase
      .from("nursing_home_quality_metrics")
      .select("provider_id, measure_name:measure_name, score, denominator, measure_period_end")
      .not("provider_id", "is", null);
    if (qmErr) {
      console.warn("Failed to fetch quality metrics; hospitalization/ED will be omitted:", qmErr.message);
    } else {
      const latestPerProv: Record<string, QualityAgg & { hospDate?: string; edDate?: string }> = {};
      for (const row of (qms ?? []) as Array<{ provider_id: string; measure_name: string; score: number | null; denominator: number | null; measure_period_end: string | null }>) {
        const name = (row.measure_name || "").toLowerCase();
        const isHosp = patterns[0].like.every((p) => name.includes(p));
        const isEd = patterns[1].like.every((p) => name.includes(p));
        if (!isHosp && !isEd) continue;
        if (!latestPerProv[row.provider_id]) latestPerProv[row.provider_id] = {};
        const r = latestPerProv[row.provider_id];
        const d = row.measure_period_end || "";
        if (isHosp) {
          if (!r.hospDate || d > r.hospDate) {
            r.hospDate = d;
            r.hospPer1kLs = typeof row.score === "number" ? row.score : undefined;
            r.hospDen = typeof row.denominator === "number" ? row.denominator : undefined;
          }
        }
        if (isEd) {
          if (!r.edDate || d > r.edDate) {
            r.edDate = d;
            r.edPer1kLs = typeof row.score === "number" ? row.score : undefined;
            r.edDen = typeof row.denominator === "number" ? row.denominator : undefined;
          }
        }
      }
      const hospVals = Object.values(latestPerProv).map((v) => v.hospPer1kLs).filter((x): x is number => typeof x === "number").sort((a,b)=>a-b);
      const edVals = Object.values(latestPerProv).map((v) => v.edPer1kLs).filter((x): x is number => typeof x === "number").sort((a,b)=>a-b);
      if (hospVals.length > 10) {
        cal.hospP10 = percentile(hospVals, 0.1);
        cal.hospP90 = percentile(hospVals, 0.9);
      }
      if (edVals.length > 10) {
        cal.edP10 = percentile(edVals, 0.1);
        cal.edP90 = percentile(edVals, 0.9);
      }
      for (const [prov, v] of Object.entries(latestPerProv)) qualityAggByProvider.set(prov, v);
    }
  }

  // Load peer groups for assignment
  const { data: peerGroupsRaw } = await supabase
    .from("peer_groups")
    .select("id, facility_type, criteria");
  const peerGroups: PeerGroupRow[] = (peerGroupsRaw as PeerGroupRow[]) ?? [];

  // Load facilities and required columns (focus on nursing homes first)
  const selectAll = "*";

  const PAGE_SIZE = 1000;
  let from = 0;
  const allResources: ResourceRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from<ResourceRow>("resources")
      .select(selectAll)
      .in("provider_type", ["nursing_home"]) // primary scope in this pass
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch resources: ${error.message}`);
    const batch = data ?? [];
    allResources.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  if (allResources.length === 0) {
    console.log("No nursing homes found; exiting.");
    return;
  }

  // Prepare to compute absolute scores and group percentiles
  type MetricScoreMap = Record<string, number | null>;
  interface FacilityScoreRow {
    id: UUID; // resources.id
    providerType: ProviderType;
    region: string | null; // primary state
    peerGroupId: UUID | null;
    overall: number; // absolute 0–100
    compSafety: number | null;
    compStaffing: number | null;
    compQuality: number | null;
    compCare: number | null;
    metricScores: MetricScoreMap; // per-metric absolute 0–100
  }

  // 1) Compute per-facility absolute metric scores and composite
  const facilitiesScored: FacilityScoreRow[] = [];

  for (const row of allResources) {
    const pt = (row.provider_type || "nursing_home") as ProviderType;
    if (pt !== "nursing_home") continue; // current implementation focuses on NH

    const region = primaryState(row.states);

    // Build metric scores
    const weights = DEFAULT_WEIGHTS[pt] || {};
    const metricScores: MetricScoreMap = {};
    let weightedSum = 0;
    let weightTotal = 0;

    for (const [metricKey, defaultW] of Object.entries(weights)) {
      // Allow custom weight overrides
      const w = resolveWeight(pt, metricKey, region, customWeights);
      if (!w || w === 0) continue;
      let raw = (row as unknown as Record<string, unknown>)[metricKey];
      // Fill derived QMs from quality metrics map
      if ((metricKey === "hosp_ls_per_1k" || metricKey === "ed_ls_per_1k") && row.facility_id) {
        const agg = qualityAggByProvider.get(row.facility_id);
        if (agg) {
          raw = metricKey === "hosp_ls_per_1k" ? agg.hospPer1kLs ?? null : agg.edPer1kLs ?? null;
        } else {
          raw = null;
        }
      }
      const s = toScore100(metricKey, raw, cal);
      metricScores[metricKey] = s;
      if (s !== null) {
        weightedSum += s * Math.abs(w);
        weightTotal += Math.abs(w);
      }
    }

    const overall = weightTotal > 0 ? weightedSum / weightTotal : 0;

    // Components (subset-weight averages)
    const component = (keys: string[]): number | null => {
      let sum = 0, wsum = 0;
      for (const k of keys) {
        const w = resolveWeight(pt, k, region, customWeights) ?? 0;
        const s = metricScores[k];
        if (w !== 0 && s != null) {
          sum += s * Math.abs(w);
          wsum += Math.abs(w);
        }
      }
      return wsum > 0 ? sum / wsum : null;
    };

    const compSafety = component(["health_inspection_rating", "deficiency_count", "has_immediate_jeopardy", "total_penalties_amount"]);
    const compStaffing = component(["staffing_rating", "total_nurse_hours_per_resident_per_day", "rn_hours_per_resident_per_day", "total_nurse_staff_turnover", "rn_turnover"]);
    const compQuality = component(["quality_measure_rating", "hosp_ls_per_1k", "ed_ls_per_1k"]);
    const compCare = null; // reserved for patient-centered outcomes when available

    // Assign peer group
    const group = peerGroups.find((g) => g.facility_type === pt && matchesCriteria(row, g.criteria, pt)) || null;

    facilitiesScored.push({
      id: row.id,
      providerType: pt,
      region,
      peerGroupId: group ? group.id : null,
      overall,
      compSafety,
      compStaffing,
      compQuality,
      compCare,
      metricScores,
    });
  }

  // 2) Build group distributions for percentiles and shrinkage
  const byGroup = new Map<UUID | string, FacilityScoreRow[]>();
  for (const f of facilitiesScored) {
    const key = f.peerGroupId || `${f.providerType}|${f.region ?? ""}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(f);
  }

  // 3) Compute percentiles and prepare upserts
  const today = new Date().toISOString().slice(0, 10);
  type UpsertRow = {
    facility_id: string;
    peer_group_id: string | null;
    overall_score: number;
    overall_percentile: number;
    quality_score: number | null;
    staffing_score: number | null;
    safety_score: number | null;
    care_score: number | null;
    metric_percentiles: Record<string, number | string> | null;
    calculation_date: string;
    version: string;
  };

  const upserts: UpsertRow[] = [];

  for (const [groupKey, rows] of byGroup.entries()) {
    if (rows.length === 0) continue;
    const groupOverall = rows.map((r) => r.overall);
    const groupMean = mean(groupOverall);

    // Compute ranking score with modest shrinkage for small facilities
    const rankScores: number[] = [];
    for (const r of rows) {
      // Reliability proxy from derived QM denominators and staffing hours availability
      const hasHours = r.metricScores["total_nurse_hours_per_resident_per_day"] != null || r.metricScores["rn_hours_per_resident_per_day"] != null;
      const provId = allResources.find((x) => x.id === r.id)?.facility_id || null;
      const qm = provId ? qualityAggByProvider.get(provId) : undefined;
      const nDen = (qm?.hospDen ?? 0) + (qm?.edDen ?? 0);
      const rel = (() => {
        let w = 0.6; // base
        if (hasHours) w += 0.1;
        if (nDen > 0) {
          // scale 0..0.3 with tanh-like curve
          const inc = Math.max(0, Math.min(0.3, 0.3 * Math.tanh(nDen / 1000)));
          w += inc;
        }
        return Math.max(0.6, Math.min(0.98, w));
      })();
      const rankScore = rel * r.overall + (1 - rel) * groupMean;
      rankScores.push(rankScore);
    }

    // Build metric distributions for per-metric percentiles
    const metricKeys = new Set<string>();
    rows.forEach((r) => Object.keys(r.metricScores).forEach((k) => metricKeys.add(k)));
    const metricDistributions: Record<string, number[]> = {};
    for (const k of metricKeys) {
      metricDistributions[k] = rows
        .map((r) => r.metricScores[k])
        .filter((v): v is number => typeof v === "number");
    }

    // Produce upserts
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const overallPercentile = computePercentile(rankScores[i], rankScores);

      // Per-metric percentiles
      const mp: Record<string, number | string> = {};
      for (const [k, arr] of Object.entries(metricDistributions)) {
        const v = r.metricScores[k];
        if (typeof v === "number" && arr.length > 0) mp[k] = computePercentile(v, arr);
      }
      // Reliability label for transparency (not a DB field; store in JSON)
      mp["_note"] = "Absolute 0-100 score; percentile within peer group with modest shrinkage for ranking";

      // Reliability label and simple uncertainty band based on reliability
      const relW = (() => {
        const provId = allResources.find((x) => x.id === r.id)?.facility_id || null;
        const qm = provId ? qualityAggByProvider.get(provId) : undefined;
        const hasHours = r.metricScores["total_nurse_hours_per_resident_per_day"] != null || r.metricScores["rn_hours_per_resident_per_day"] != null;
        let w = 0.6 + (hasHours ? 0.1 : 0);
        const nDen = (qm?.hospDen ?? 0) + (qm?.edDen ?? 0);
        if (nDen > 0) w += Math.max(0, Math.min(0.3, 0.3 * Math.tanh(nDen / 1000)));
        return Math.max(0.6, Math.min(0.98, w));
      })();
      const label = relW >= 0.85 ? "high" : relW >= 0.75 ? "moderate" : "low";
      const halfWidth = Math.round((10 * (1 - relW)) * 100) / 100; // 0..4-ish
      const ciLow = Math.max(0, Number((r.overall - halfWidth).toFixed(2)));
      const ciHigh = Math.min(100, Number((r.overall + halfWidth).toFixed(2)));

      const provIdForRow = allResources.find((x) => x.id === r.id)?.facility_id || null;
      upserts.push({
        facility_id: provIdForRow || r.id, // prefer external facility_id; fallback to UUID if missing
        peer_group_id: typeof groupKey === "string" && groupKey.includes("|") ? null : (groupKey as string),
        overall_score: Number(r.overall.toFixed(2)),
        overall_percentile: overallPercentile,
        quality_score: r.compQuality != null ? Number(r.compQuality.toFixed(2)) : null,
        staffing_score: r.compStaffing != null ? Number(r.compStaffing.toFixed(2)) : null,
        safety_score: r.compSafety != null ? Number(r.compSafety.toFixed(2)) : null,
        care_score: r.compCare != null ? Number(r.compCare.toFixed(2)) : null,
        metric_percentiles: Object.keys(mp).length ? mp : null,
        calculation_date: today,
        version: SCORE_VERSION,
        // Additional fields exist after migration 0015
        // @ts-ignore
        reliability_weight: Number(relW.toFixed(3)),
        // @ts-ignore
        reliability_label: label,
        // @ts-ignore
        score_ci_lower: ciLow,
        // @ts-ignore
        score_ci_upper: ciHigh,
      });
    }
  }

  // 4) Upsert to sunsetwell_scores
  console.log(`Upserting ${upserts.length} scores to sunsetwell_scores ...`);
  const batchSize = 500;
  let fallbackWithoutReliability = false;
  for (let i = 0; i < upserts.length; i += batchSize) {
    const batch = upserts.slice(i, i + batchSize);
    const payload = fallbackWithoutReliability
      ? batch.map(({ reliability_label, reliability_weight, score_ci_lower, score_ci_upper, ...rest }) => rest)
      : batch;
    const { error } = await supabase
      .from("sunsetwell_scores")
      .upsert(payload as any, { onConflict: "facility_id,calculation_date" });
    if (error) {
      const msg = error.message || "";
      if (/reliability_|score_ci_/.test(msg) && !fallbackWithoutReliability) {
        // Retry without reliability fields for this and all subsequent batches
        fallbackWithoutReliability = true;
        const minimal = batch.map(({ reliability_label, reliability_weight, score_ci_lower, score_ci_upper, ...rest }) => rest);
        const { error: err2 } = await supabase
          .from("sunsetwell_scores")
          .upsert(minimal as any, { onConflict: "facility_id,calculation_date" });
        if (err2) throw new Error(`Failed to upsert sunsetwell_scores (fallback): ${err2.message}`);
      } else {
        throw new Error(`Failed to upsert sunsetwell_scores: ${error.message}`);
      }
    }
  }

  console.log(`✅ Upserted ${upserts.length} SunsetWell scores (absolute 0–100 + peer percentiles)`);
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
