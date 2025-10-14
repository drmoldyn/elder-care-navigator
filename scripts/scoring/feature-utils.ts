import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const DATA_DIR = path.join("data", "cms", "processed");

const MDS_CODES = ["410", "479", "451", "430", "404", "434", "406", "480"];

const DEFICIENCIES_FILE = path.join(DATA_DIR, "deficiencies-processed.csv");
const PENALTIES_FILE = path.join(DATA_DIR, "penalties-processed.csv");
const QUALITY_METRICS_FILE = path.join(DATA_DIR, "quality-metrics-processed.csv");
const NURSING_HOMES_FILE = path.join(DATA_DIR, "nursing-homes-processed.csv");

export type ExtraFeatureRecord = Record<string, number>;

function safeNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function readCsv(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

function severityWeight(codeRaw: string | null | undefined): number {
  const code = (codeRaw || "").toUpperCase().trim();
  if (!code) return 0;
  if ("ABC".includes(code)) return 1;
  if ("DEF".includes(code)) return 2;
  if ("GHI".includes(code)) return 4;
  if ("JKL".includes(code)) return 0; // IJ handled separately
  return 0;
}

export const EXTRA_FEATURE_KEYS: string[] = [
  ...MDS_CODES.map((code) => `mds_${code}`),
  "deficiency_severity_index",
  "deficiency_ij_count",
  "deficiency_total_count",
  "penalty_total_amount",
  "facility_complaints_per_bed",
  "facility_incidents_per_bed",
  "state_complaints_per_bed",
  "state_incidents_per_bed",
];

export function loadExtraFacilityFeatures(): Map<string, ExtraFeatureRecord> {
  const map = new Map<string, ExtraFeatureRecord>();

  const ensureRecord = (facilityId: string) => {
    const key = facilityId.trim();
    if (!key) return undefined;
    if (!map.has(key)) map.set(key, {});
    return map.get(key)!;
  };

  // Facility-level complaint/incident rates and state benchmarks
  const stateTotals = new Map<string, { complaints: number; incidents: number; beds: number }>();
  const facilityMeta = new Map<string, { state?: string; complaints?: number; incidents?: number; beds?: number }>();
  const nhRows = readCsv(NURSING_HOMES_FILE);
  for (const row of nhRows) {
    const facilityId = String(row["facility_id"] ?? "").trim();
    if (!facilityId) continue;
    const statesField = Array.isArray(row["states"])
      ? (row["states"] as unknown[])
      : String(row["states"] ?? "").split(',');
    const primaryStateRaw = (statesField.find((s) => String(s).trim().length === 2) ?? row["state"] ?? "").toString().trim();
    const state = primaryStateRaw.length === 2 ? primaryStateRaw.toUpperCase() : undefined;
    const complaints = safeNumber(row["number_of_substantiated_complaints"]);
    const incidents = safeNumber(row["number_of_facility_reported_incidents"]);
    const beds = safeNumber(row["number_of_certified_beds"]) ?? safeNumber(row["total_beds"]);
    facilityMeta.set(facilityId, { state, complaints: complaints ?? undefined, incidents: incidents ?? undefined, beds: beds ?? undefined });
    if (state && beds && beds > 0) {
      const entry = stateTotals.get(state) ?? { complaints: 0, incidents: 0, beds: 0 };
      if (complaints !== null) entry.complaints += complaints;
      if (incidents !== null) entry.incidents += incidents;
      entry.beds += beds;
      stateTotals.set(state, entry);
    }
  }

  const stateRates = new Map<string, { complaintRate?: number; incidentRate?: number }>();
  for (const [state, totals] of stateTotals.entries()) {
    const complaintRate = totals.beds > 0 ? totals.complaints / totals.beds : undefined;
    const incidentRate = totals.beds > 0 ? totals.incidents / totals.beds : undefined;
    stateRates.set(state, { complaintRate, incidentRate });
  }

  for (const [facilityId, meta] of facilityMeta.entries()) {
    const record = ensureRecord(facilityId);
    if (!record) continue;
    const beds = meta.beds && meta.beds > 0 ? meta.beds : undefined;
    if (beds && meta.complaints !== undefined) {
      record["facility_complaints_per_bed"] = meta.complaints / beds;
    }
    if (beds && meta.incidents !== undefined) {
      record["facility_incidents_per_bed"] = meta.incidents / beds;
    }
    if (meta.state) {
      const sr = stateRates.get(meta.state);
      if (sr?.complaintRate !== undefined) record["state_complaints_per_bed"] = sr.complaintRate;
      if (sr?.incidentRate !== undefined) record["state_incidents_per_bed"] = sr.incidentRate;
    }
  }

  // MDS harm measures
  const qmRows = readCsv(QUALITY_METRICS_FILE);
  for (const row of qmRows) {
    const facilityId = String(row["provider_id"] ?? "").trim();
    if (!facilityId) continue;
    const code = String(row["measure_code"] ?? "").trim();
    if (!MDS_CODES.includes(code)) continue;
    const score = safeNumber(row["score"] ?? row["value"]);
    if (score === null) continue;
    const record = ensureRecord(facilityId);
    if (!record) continue;
    record[`mds_${code}`] = score;
  }

  // Deficiency aggregates
  const defRows = readCsv(DEFICIENCIES_FILE);
  for (const row of defRows) {
    const facilityId = String(row["provider_id"] ?? "").trim();
    if (!facilityId) continue;
    const record = ensureRecord(facilityId);
    if (!record) continue;
    const code = String(row["scope_severity_code"] ?? "").trim();
    const w = severityWeight(code);
    record["deficiency_severity_index"] = (record["deficiency_severity_index"] ?? 0) + w;
    record["deficiency_total_count"] = (record["deficiency_total_count"] ?? 0) + 1;
    if (code && "JKL".includes(code[0]?.toUpperCase?.() ?? "")) {
      record["deficiency_ij_count"] = (record["deficiency_ij_count"] ?? 0) + 1;
    }
  }

  // Penalty totals (CMP fines)
  const penRows = readCsv(PENALTIES_FILE);
  for (const row of penRows) {
    const facilityId = String(row["provider_id"] ?? "").trim();
    if (!facilityId) continue;
    const record = ensureRecord(facilityId);
    if (!record) continue;
    const amount = safeNumber(row["fine_amount"]);
    if (amount === null) continue;
    record["penalty_total_amount"] = (record["penalty_total_amount"] ?? 0) + amount;
  }

  return map;
}

export function getFeatureValue(
  row: Record<string, unknown>,
  extra: ExtraFeatureRecord | undefined,
  key: string
): number | null {
  const direct = safeNumber((row as Record<string, unknown>)[key]);
  if (direct !== null) return direct;
  if (extra && typeof extra[key] === "number" && Number.isFinite(extra[key])) {
    return extra[key];
  }
  return null;
}
