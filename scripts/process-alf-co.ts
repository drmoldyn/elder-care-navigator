#!/usr/bin/env tsx
/**
 * Process Colorado Assisted Living Facility (ALR) Data
 *
 * This script transforms the Colorado Department of Public Health & Environment
 * (CDPHE) facility directory export (GeoJSON) into the standard SunsetWell ALF
 * schema used for state licensing feeds.
 *
 * Steps:
 * 1. Read the GeoJSON export filtered to Assisted Living Residences
 *    stored under data/state/co/raw/
 * 2. Normalize addresses, phone numbers, and status fields
 * 3. Emit a CSV with the common columns consumed by downstream profiling,
 *    embedding, and scoring notebooks
 *
 * Usage:
 *   pnpm tsx scripts/process-alf-co.ts
 */

import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";

// ============================================================================
// Type Definitions
// ============================================================================

interface ColoradoFacilityProperties {
  OBJECTID?: number;
  Facility_ID?: string;
  Facility_Name?: string;
  Facility_Type_Code?: string;
  Facility_Type?: string;
  Facility_Type_Detail?: string;
  Facility_Type_Abbreviation?: string;
  Licensed_Beds_Total?: number;
  Telephone?: string;
  County?: string;
  Address_Full?: string;
  Latitude?: number;
  Longitude?: number;
  CDPHE_HFEMS_Licensed?: string;
  Operating_Status?: string;
  Date_Date_Updated?: number | string;
  Source?: string;
}

interface ColoradoFeature {
  properties?: ColoradoFacilityProperties;
}

interface FeatureCollection {
  type: string;
  features: ColoradoFeature[];
}

interface ProcessedColoradoRow {
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

// ============================================================================
// Helper Functions
// ============================================================================

function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

function parseAddress(addressFull: string | undefined): {
  address: string;
  city: string;
  zipCode: string;
} {
  if (!addressFull) {
    return { address: "", city: "", zipCode: "" };
  }

  const parts = addressFull.split(",");
  const street = parts[0]?.trim() ?? "";
  const city = parts[1]?.trim() ?? "";
  let zipCode = "";

  if (parts.length >= 3) {
    const stateZip = parts.slice(2).join(",").trim();
    const zipMatch = stateZip.match(/(\d{5})(?:-\d{4})?/);
    if (zipMatch) {
      zipCode = zipMatch[0];
    }
  }

  return { address: street, city, zipCode };
}

function normalizeStatus(status: string | undefined): string {
  if (!status) return "UNKNOWN";
  const normalized = status.trim().toUpperCase();

  if (normalized.includes("ACTIVE")) return "ACTIVE";
  if (normalized.includes("PENDING")) return "PENDING";
  if (normalized.includes("IN REVIEW")) return "IN REVIEW";
  if (normalized.includes("EXPIRE")) return "EXPIRED";
  if (normalized.includes("CLOSED")) return "CLOSED";

  return normalized;
}

function formatCapacity(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) return "";
  return String(Math.max(0, Math.round(numeric)));
}

function formatDateFromEpoch(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) return "";

  const date = new Date(numeric);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function toTitleCase(value: string | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

// ============================================================================
// Main Processing Logic
// ============================================================================

const RAW_DIR = path.join("data", "state", "co", "raw");
const RAW_FILE = path.join(RAW_DIR, "cdphe_assisted_living.geojson");

if (!fs.existsSync(RAW_FILE)) {
  console.error(`❌ Raw file not found: ${RAW_FILE}`);
  process.exit(1);
}

const rawContent = fs.readFileSync(RAW_FILE, "utf-8");
const geojson = JSON.parse(rawContent) as FeatureCollection;

if (!geojson.features || geojson.features.length === 0) {
  console.error("❌ No features found in GeoJSON export. Did the download step succeed?");
  process.exit(1);
}

const dateStamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
const OUTPUT_DIR = path.join("data", "state", "co");
const OUTPUT_FILE = path.join(OUTPUT_DIR, `alf-processed_${dateStamp}.csv`);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const processed: ProcessedColoradoRow[] = geojson.features.map((feature) => {
  const props = feature.properties ?? {};
  const { address, city, zipCode } = parseAddress(props.Address_Full);

  const facilityName = (props.Facility_Name ?? "").trim();

  return {
    state: "CO",
    state_license_number: (props.Facility_ID ?? "").trim(),
    facility_name: facilityName,
    address,
    city,
    zip_code: zipCode,
    county: toTitleCase(props.County?.trim()),
    phone: formatPhoneNumber(props.Telephone),
    license_status: normalizeStatus(props.Operating_Status),
    licensed_capacity: formatCapacity(props.Licensed_Beds_Total),
    license_issue_date: "",
    license_expiration_date: "",
    facility_type: props.Facility_Type ?? "",
    facility_type_detail: props.Facility_Type_Detail ?? "",
    facility_type_code: props.Facility_Type_Code ?? "",
    provider_type: "assisted_living",
    memory_care_certified: "false",
    medicare_accepted: "",
    medicaid_accepted: "",
    description:
      facilityName && city
        ? `${facilityName} is an assisted living residence in ${city}, Colorado. Licensed via CDPHE.`
        : "Colorado assisted living residence (CDPHE directory).",
    source: "CO_CDPHE_HEALTH_FACILITIES",
    latitude: props.Latitude !== undefined ? String(props.Latitude) : "",
    longitude: props.Longitude !== undefined ? String(props.Longitude) : "",
    last_updated_date: formatDateFromEpoch(props.Date_Date_Updated),
  };
});

const columns: (keyof ProcessedColoradoRow)[] = [
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

const csvOutput = stringify(processed, {
  header: true,
  columns,
});

fs.writeFileSync(OUTPUT_FILE, csvOutput);

console.log(`✅ Processed ${processed.length} Colorado assisted living facilities`);
console.log(`📝 Output saved to ${OUTPUT_FILE}`);
