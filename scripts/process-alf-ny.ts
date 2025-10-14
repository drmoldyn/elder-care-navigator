#!/usr/bin/env tsx
/**
 * Process New York Adult Care Facility (ACF) licensing data
 *
 * Inputs (downloaded from Health Data NY):
 *   - data/state/ny/raw/facility-general-info.csv  (dataset: vn5v-hh5r)
 *   - data/state/ny/raw/facility-certification-info.csv (dataset: 2g9y-7kqm)
 *
 * Output:
 *   - data/state/ny/alf-processed_YYYYMMDD.csv
 *
 * The script filters the general facility roster to Adult Homes (AH) and
 * Enriched Housing Programs (EHP), joins in certification metrics to derive
 * licensed capacity, and formats records to our common assisted living schema.
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

type GeneralRow = Record<string, string>;
type CertificationRow = Record<string, string>;

interface CapacityStats {
  overall?: number;
  components: number[];
  lastUpdated?: string;
}

interface ProcessedRow {
  state: string;
  state_license_number: string;
  facility_name: string;
  address: string;
  city: string;
  zip_code: string;
  county: string;
  phone: string;
  license_status: string;
  licensed_capacity: string;
  license_issue_date: string;
  license_expiration_date: string;
  facility_type: string;
  facility_type_detail: string;
  facility_type_code: string;
  provider_type: string;
  memory_care_certified: string;
  medicare_accepted: string;
  medicaid_accepted: string;
  description: string;
  source: string;
  latitude: string;
  longitude: string;
  last_updated_date: string;
}

const RAW_DIR = path.join("data", "state", "ny", "raw");
const OUTPUT_DIR = path.join("data", "state", "ny");
const GENERAL_FILE = path.join(RAW_DIR, "facility-general-info.csv");
const CERT_FILE = path.join(RAW_DIR, "facility-certification-info.csv");

const ACF_CODES = new Set(["AH", "EHP"]);
const CAPACITY_VALUES = new Set([
  "Assisted Living Residence (ALR)",
  "Enhanced Assisted Living Residence (EALR)",
  "Special Needs Assisted Living Residence (SNALR)",
  "Assisted Living Program (ALP)",
]);

// ============================================================================
// Helpers
// ============================================================================

function ensureFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file missing: ${filePath}`);
  }
}

function parseCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

function formatZip(zip: string | undefined): string {
  if (!zip) return "";
  const match = zip.match(/\d{5}/);
  return match ? match[0] : zip.trim();
}

function toTitle(value: string | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function parseDate(value: string | undefined): string {
  if (!value) return "";
  const normalized = value.replace(/"/g, "").trim();
  if (!normalized) return "";
  const [month, day, year] = normalized.split(/[\/\-]/);
  if (!year || !month || !day) {
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return "";
  }
  const iso = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "" : iso;
}

function sanitizeOpenDate(openDate: string): string {
  const iso = parseDate(openDate);
  if (!iso) return "";
  // NY roster uses 1901-01-01 as placeholder for missing dates
  if (iso.startsWith("1901")) return "";
  return iso;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/,/g, "");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

// ============================================================================
// Capacity aggregation
// ============================================================================

function buildCapacityMap(certRows: CertificationRow[]): Map<string, CapacityStats> {
  const map = new Map<string, CapacityStats>();

  for (const row of certRows) {
    const facilityId = (row["Facility ID"] ?? "").trim();
    if (!facilityId) continue;

    const attrType = (row["Attribute Type"] ?? "").trim().toUpperCase();
    const attrValue = (row["Attribute Value"] ?? "").trim();
    const effective = parseDate(row["Effective Date"]);

    const measure =
      toNumber(row["Measure Value"]) ??
      toNumber(row["Capacity"]) ??
      toNumber(row["Bed Count"]);

    if (!map.has(facilityId)) {
      map.set(facilityId, { components: [] });
    }
    const stats = map.get(facilityId)!;

    if (effective) {
      if (!stats.lastUpdated || effective > stats.lastUpdated) {
        stats.lastUpdated = effective;
      }
    }

    if (attrType !== "BED" || measure === undefined) {
      continue;
    }

    if (attrValue === "Overall Capacity (AH/EHP)") {
      const current = stats.overall ?? 0;
      stats.overall = Math.max(current, Math.round(measure));
    } else if (CAPACITY_VALUES.has(attrValue)) {
      stats.components.push(Math.round(measure));
    }
  }

  return map;
}

function resolveCapacity(stats: CapacityStats | undefined): number | undefined {
  if (!stats) return undefined;
  if (stats.overall && stats.overall > 0) return stats.overall;
  if (stats.components.length > 0) {
    const total = stats.components.reduce((sum, val) => sum + (Number.isFinite(val) ? val : 0), 0);
    return total > 0 ? total : undefined;
  }
  return undefined;
}

// ============================================================================
// Main processing
// ============================================================================

function buildRecords(): ProcessedRow[] {
  ensureFileExists(GENERAL_FILE);
  ensureFileExists(CERT_FILE);

  console.log("Reading general facility roster...");
  const generalRows = parseCsv(GENERAL_FILE) as GeneralRow[];
  console.log(`General records loaded: ${generalRows.length.toLocaleString()}`);

  console.log("Reading certification details...");
  const certRows = parseCsv(CERT_FILE) as CertificationRow[];
  console.log(`Certification records loaded: ${certRows.length.toLocaleString()}`);

  const capacityMap = buildCapacityMap(certRows);

  const processed: ProcessedRow[] = [];

  for (const row of generalRows) {
    const shortCode = (row["Short Description"] ?? "").trim().toUpperCase();
    if (!ACF_CODES.has(shortCode)) continue;

    const facilityId = (row["Facility ID"] ?? "").trim();
    if (!facilityId) continue;

    const name = (row["Facility Name"] ?? "").trim();
    const address1 = (row["Facility Address 1"] ?? "").trim();
    const address2 = (row["Facility Address 2"] ?? "").trim();
    const address = [address1, address2].filter(Boolean).join(", ");

    const city = toTitle(row["Facility City"]);
    const zip = formatZip(row["Facility Zip Code"]);
    const county = toTitle(row["Facility County"]);
    const phone = formatPhone(row["Facility Phone Number"]);
    const openDate = sanitizeOpenDate(row["Facility Open Date"] ?? "");
    const lat = (row["Facility Latitude"] ?? "").trim();
    const lon = (row["Facility Longitude"] ?? "").trim();
    const ocn = (row["Operating Certificate Number"] ?? "").trim();

    const certStats = capacityMap.get(facilityId);
    const capacity = resolveCapacity(certStats);

    const facilityType = (row["Description"] ?? "").trim() || (shortCode === "AH" ? "Adult Home" : "Enriched Housing Program");

    const description = `${name} is an adult care facility in ${city || "New York State"}.`;

    processed.push({
      state: "NY",
      state_license_number: ocn,
      facility_name: name,
      address,
      city,
      zip_code: zip,
      county,
      phone,
      license_status: "ACTIVE",
      licensed_capacity: capacity ? String(capacity) : "",
      license_issue_date: openDate,
      license_expiration_date: "",
      facility_type: facilityType,
      facility_type_detail: "",
      facility_type_code: shortCode,
      provider_type: "assisted_living",
      memory_care_certified: "false",
      medicare_accepted: "",
      medicaid_accepted: "",
      description,
      source: "NY_DOH_HEALTH_FACILITIES",
      latitude: lat,
      longitude: lon,
      last_updated_date: certStats?.lastUpdated ?? "",
    });
  }

  return processed;
}

function main(): void {
  try {
    const records = buildRecords();
    console.log(`Adult Care Facilities retained: ${records.length.toLocaleString()}`);

    if (records.length === 0) {
      console.warn("⚠️ No adult care facilities found — check source files.");
      process.exit(1);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const outputPath = path.join(OUTPUT_DIR, `alf-processed_${today}.csv`);

    const columns: (keyof ProcessedRow)[] = [
      "state",
      "state_license_number",
      "facility_name",
      "address",
      "city",
      "zip_code",
      "county",
      "phone",
      "license_status",
      "licensed_capacity",
      "license_issue_date",
      "license_expiration_date",
      "facility_type",
      "facility_type_detail",
      "facility_type_code",
      "provider_type",
      "memory_care_certified",
      "medicare_accepted",
      "medicaid_accepted",
      "description",
      "source",
      "latitude",
      "longitude",
      "last_updated_date",
    ];

    const csv = stringify(records, { header: true, columns });
    fs.writeFileSync(outputPath, csv);

    console.log(`✅ Processed file written to ${outputPath}`);
  } catch (error) {
    console.error("❌ Failed to process NY ACF data:", error);
    process.exit(1);
  }
}

main();
