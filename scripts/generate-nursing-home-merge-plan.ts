#!/usr/bin/env tsx
/**
 * Generate merge artifacts for the nursing home CCN + quality metric update.
 *
 * Outputs three CSV files under data/cms/processed/:
 *  1. nursing-homes-exact-matches.csv       → safe to update in place (preserve geocodes)
 *  2. nursing-homes-marked-to-delete.csv    → requires full re-import + new geocoding
 *  3. nursing-homes-db-without-cms.csv      → legacy DB rows without a CMS match
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CsvRow {
  [key: string]: string;
}

interface ResourceRow {
  id: string;
  title: string | null;
  street_address: string | null;
  city: string | null;
  states: string[] | null;
  zip_code: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  facility_id: string | null;
  matchKey?: string;
  matchable?: boolean;
}

const INPUT_CSV = process.env.NURSING_HOME_PROCESSED_CSV || "data/cms/processed/nursing-homes-processed.csv";
const OUTPUT_EXACT = "data/cms/processed/nursing-homes-exact-matches.csv";
const OUTPUT_MARKED = "data/cms/processed/nursing-homes-marked-to-delete.csv";
const OUTPUT_DB_ONLY = "data/cms/processed/nursing-homes-db-without-cms.csv";
const OUTPUT_DB_AMBIGUOUS = "data/cms/processed/nursing-homes-db-ambiguous.csv";

const STATE_MAP: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeAlphaNumeric(value: string): string {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeZip(zip: string): string {
  const digits = zip.replace(/[^0-9]/g, "");
  return digits.slice(0, 5);
}

function normalizeState(state: string): string {
  const cleaned = normalizeWhitespace(state).toUpperCase();
  if (!cleaned) return "";
  if (cleaned.length === 2) return cleaned;
  return STATE_MAP[cleaned] || cleaned.slice(0, 2);
}

function buildMatchKey(name?: string, address?: string): string | null {
  if (!name || !address) return null;

  const normName = normalizeAlphaNumeric(name);
  const normAddr = normalizeAlphaNumeric(address);

  if (!normName || !normAddr) {
    return null;
  }

  return `${normName}|${normAddr}`;
}

function evaluateLocationAgreement(
  csvLatRaw: string | undefined,
  csvLngRaw: string | undefined,
  dbLat: number | null,
  dbLng: number | null
) {
  const csvLat = csvLatRaw && csvLatRaw.trim() !== "" ? Number.parseFloat(csvLatRaw) : null;
  const csvLng = csvLngRaw && csvLngRaw.trim() !== "" ? Number.parseFloat(csvLngRaw) : null;

  if (
    csvLat === null ||
    csvLng === null ||
    Number.isNaN(csvLat) ||
    Number.isNaN(csvLng) ||
    dbLat === null ||
    dbLng === null
  ) {
    return { status: "insufficient_data" as const, delta: null as number | null };
  }

  const latDiff = Math.abs(csvLat - dbLat);
  const lngDiff = Math.abs(csvLng - dbLng);
  const maxDiff = Math.max(latDiff, lngDiff);

  if (maxDiff <= 0.01) {
    return { status: "latlong_exact" as const, delta: maxDiff };
  }

  if (maxDiff <= 0.05) {
    return { status: "latlong_near" as const, delta: maxDiff };
  }

  return { status: "latlong_mismatch" as const, delta: maxDiff };
}

async function fetchAllNursingHomes(): Promise<ResourceRow[]> {
  const pageSize = 1000;
  let from = 0;
  const resources: ResourceRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("resources")
      .select(
        "id,title,street_address,city,states,zip_code,county,latitude,longitude,facility_id"
      )
      .eq("provider_type", "nursing_home")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    resources.push(
      ...data.map((row) => ({
        id: row.id,
        title: row.title ?? null,
        street_address: row.street_address ?? null,
        city: row.city ?? null,
        states: (row.states as string[] | null) ?? null,
        zip_code: row.zip_code ?? null,
        county: row.county ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        facility_id: row.facility_id ?? null,
      }))
    );

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return resources;
}

function ensureOutputDirectory(filepath: string) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  console.log("🔍 Generating nursing home merge artifacts\n");

  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`❌ Input CSV not found: ${INPUT_CSV}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(INPUT_CSV, "utf-8");
  const csvRows: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (csvRows.length === 0) {
    console.error("❌ CSV contains no records");
    process.exit(1);
  }

  const csvHeaders = Object.keys(csvRows[0]);

  console.log(`📂 Loaded ${csvRows.length} rows from ${INPUT_CSV}`);

  const resources = await fetchAllNursingHomes();
  console.log(`🗄️  Loaded ${resources.length} nursing homes from Supabase\n`);

  const lookup = new Map<string, ResourceRow[]>();
  const resourcesWithoutKey: ResourceRow[] = [];

  resources.forEach((resource) => {
    const primaryState = resource.states?.[0] || "";
    const matchKey = buildMatchKey(
      resource.title || undefined,
      resource.street_address || undefined
    );

    if (!matchKey) {
      resourcesWithoutKey.push(resource);
      resource.matchable = false;
      return;
    }

    resource.matchable = true;
    resource.matchKey = matchKey;

    const bucket = lookup.get(matchKey);
    if (bucket) {
      bucket.push(resource);
    } else {
      lookup.set(matchKey, [resource]);
    }
  });

  const exactMatches: Array<Record<string, string>> = [];
  const unmatchedCsv: Array<Record<string, string>> = [];
  const dbWithoutCsv: Array<Record<string, string>> = [];
  const dbAmbiguous: Array<Record<string, string>> = [];
  const matchedResourceIds = new Set<string>();
  const resourceAssignments = new Map<string, number>();
  const ambiguousResourceSeen = new Set<string>();

  const reasonCounts: Record<string, number> = {};

  function trackReason(reason: string) {
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  }

  csvRows.forEach((row) => {
    const matchKey = buildMatchKey(
      row.facility_name,
      row.address
    );

    if (!matchKey) {
      unmatchedCsv.push({
        reason: "missing_name_or_address",
        match_key: "",
        ...row,
      });
      trackReason("missing_name_or_address");
      return;
    }

    const candidates = lookup.get(matchKey) || [];

    if (candidates.length === 0) {
      unmatchedCsv.push({
        reason: "no_matching_resource",
        match_key: matchKey,
        ...row,
      });
      trackReason("no_matching_resource");
      return;
    }

    if (candidates.length > 1) {
      candidates.forEach((candidate) => {
        if (ambiguousResourceSeen.has(candidate.id)) {
          return;
        }
        ambiguousResourceSeen.add(candidate.id);
        dbAmbiguous.push({
          match_key: matchKey,
          resource_id: candidate.id,
          title: candidate.title || "",
          street_address: candidate.street_address || "",
          city: candidate.city || "",
          states: candidate.states ? candidate.states.join(";") : "",
          zip_code: candidate.zip_code || "",
          county: candidate.county || "",
          latitude: candidate.latitude != null ? String(candidate.latitude) : "",
          longitude: candidate.longitude != null ? String(candidate.longitude) : "",
        });
      });

      unmatchedCsv.push({
        reason: "ambiguous_db_duplicates",
        match_key: matchKey,
        ...row,
      });
      trackReason("ambiguous_db_duplicates");
      return;
    }

    const resource = candidates[0];
    const alreadyAssigned = resourceAssignments.get(resource.id) || 0;
    if (alreadyAssigned > 0) {
      unmatchedCsv.push({
        reason: "duplicate_csv_match",
        match_key: matchKey,
        ...row,
      });
      trackReason("duplicate_csv_match");
      return;
    }

    const locationAgreement = evaluateLocationAgreement(
      row.latitude,
      row.longitude,
      resource.latitude,
      resource.longitude
    );

    const csvCityNorm = row.city ? normalizeAlphaNumeric(row.city) : "";
    const dbCityNorm = resource.city ? normalizeAlphaNumeric(resource.city) : "";
    let cityMatchStatus = "insufficient_data";
    if (csvCityNorm && dbCityNorm) {
      cityMatchStatus = csvCityNorm === dbCityNorm ? "match" : "mismatch";
    } else if (csvCityNorm && !dbCityNorm) {
      cityMatchStatus = "missing_db";
    } else if (!csvCityNorm && dbCityNorm) {
      cityMatchStatus = "missing_csv";
    }

    const csvStateNorm = row.state ? normalizeState(row.state) : "";
    const dbStateNorm = resource.states?.[0] ? normalizeState(resource.states[0]) : "";
    let stateMatchStatus = "insufficient_data";
    if (csvStateNorm && dbStateNorm) {
      stateMatchStatus = csvStateNorm === dbStateNorm ? "match" : "mismatch";
    } else if (csvStateNorm && !dbStateNorm) {
      stateMatchStatus = "missing_db";
    } else if (!csvStateNorm && dbStateNorm) {
      stateMatchStatus = "missing_csv";
    }

    resourceAssignments.set(resource.id, alreadyAssigned + 1);
    matchedResourceIds.add(resource.id);

    const matchedRecord: Record<string, string> = {
      resource_id: resource.id,
      match_key: matchKey,
      match_reason: "exact_name_address",
      existing_latitude: resource.latitude != null ? String(resource.latitude) : "",
      existing_longitude: resource.longitude != null ? String(resource.longitude) : "",
      csv_latitude: row.latitude || "",
      csv_longitude: row.longitude || "",
      location_quality: locationAgreement.status,
      location_delta: locationAgreement.delta?.toString() || "",
      city_match: cityMatchStatus,
      state_match: stateMatchStatus,
      ...row,
    };

    exactMatches.push(matchedRecord);
  });

  resources.forEach((resource) => {
    if (!resource.matchable) {
      dbWithoutCsv.push({
        resource_id: resource.id,
        title: resource.title || "",
        street_address: resource.street_address || "",
        city: resource.city || "",
        state: resource.states?.[0] || "",
        zip_code: resource.zip_code || "",
        county: resource.county || "",
        match_key: "",
        reason: "missing_fields",
      });
      return;
    }

    if (!matchedResourceIds.has(resource.id)) {
      dbWithoutCsv.push({
        resource_id: resource.id,
        title: resource.title || "",
        street_address: resource.street_address || "",
        city: resource.city || "",
        state: resource.states?.[0] || "",
        zip_code: resource.zip_code || "",
        county: resource.county || "",
        match_key: resource.matchKey || "",
        reason: "no_csv_match",
      });
    }
  });

  ensureOutputDirectory(OUTPUT_EXACT);
  ensureOutputDirectory(OUTPUT_MARKED);
  ensureOutputDirectory(OUTPUT_DB_ONLY);
  ensureOutputDirectory(OUTPUT_DB_AMBIGUOUS);

  const exactColumns = [
    "resource_id",
    "match_key",
    "match_reason",
    "existing_latitude",
    "existing_longitude",
    "csv_latitude",
    "csv_longitude",
    "location_quality",
    "location_delta",
    "city_match",
    "state_match",
    ...csvHeaders,
  ];

  const unmatchedColumns = [
    "reason",
    "match_key",
    "location_delta",
    ...csvHeaders,
  ];

  const dbColumns = [
    "resource_id",
    "title",
    "street_address",
    "city",
    "state",
    "zip_code",
    "county",
    "match_key",
    "reason",
  ];

  fs.writeFileSync(
    OUTPUT_EXACT,
    stringify(exactMatches, { header: true, columns: exactColumns })
  );

  fs.writeFileSync(
    OUTPUT_MARKED,
    stringify(unmatchedCsv, { header: true, columns: unmatchedColumns })
  );

  fs.writeFileSync(
    OUTPUT_DB_ONLY,
    stringify(dbWithoutCsv, { header: true, columns: dbColumns })
  );

  const dbAmbiguousColumns = [
    "match_key",
    "resource_id",
    "title",
    "street_address",
    "city",
    "states",
    "zip_code",
    "county",
    "latitude",
    "longitude",
  ];

  fs.writeFileSync(
    OUTPUT_DB_AMBIGUOUS,
    stringify(dbAmbiguous, { header: true, columns: dbAmbiguousColumns })
  );

  console.log("📄 Generated:");
  console.log(`   • ${OUTPUT_EXACT} (${exactMatches.length} rows)`);
  console.log(`   • ${OUTPUT_MARKED} (${unmatchedCsv.length} rows)`);
  console.log(`   • ${OUTPUT_DB_ONLY} (${dbWithoutCsv.length} rows)`);
  console.log(`   • ${OUTPUT_DB_AMBIGUOUS} (${dbAmbiguous.length} rows)`);

  console.log("\n📊 Match summary:");
  console.log(`   ✅ Exact matches:              ${exactMatches.length}`);
  console.log(`   ❌ CSV rows needing review:    ${unmatchedCsv.length}`);
  console.log(`   ❌ DB rows missing CMS match:  ${dbWithoutCsv.length}`);

  if (Object.keys(reasonCounts).length > 0) {
    console.log("\n   Breakdown of CSV review reasons:");
    Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, count]) => {
        console.log(`     • ${reason}: ${count}`);
      });
  }

  console.log("\n✅ Merge planning artifacts ready. Proceed with manual review and the exact-merge script." );
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
