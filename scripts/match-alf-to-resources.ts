#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Match State ALF Data to Existing Resources
 *
 * This script:
 * 1. Reads processed state ALF CSV files
 * 2. Attempts to match ALF records to existing resources in database
 * 3. Uses multiple matching strategies (exact address, fuzzy name+address, etc.)
 * 4. Updates matched resources with ALF-specific fields
 * 5. Creates new resource records for unmatched ALF facilities
 * 6. Adds state licenses to facility_identifiers table
 * 7. Generates match report
 *
 * Matching Strategies (in order):
 * 1. Exact match: address + name (case-insensitive)
 * 2. Fuzzy match: address + name (85%+ similarity)
 * 3. Fuzzy match: ZIP + name (85%+ similarity)
 * 4. Manual review: remaining unmatched records
 *
 * Usage:
 *   pnpm tsx scripts/match-alf-to-resources.ts --state=CA
 *   pnpm tsx scripts/match-alf-to-resources.ts --state=FL --dry-run
 *   pnpm tsx scripts/match-alf-to-resources.ts --all
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: Missing Supabase credentials");
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Matching thresholds
const FUZZY_MATCH_THRESHOLD = 0.85; // 85% similarity

// ============================================================================
// Types
// ============================================================================

interface ALFRecord {
  state: string;
  state_license_number: string;
  facility_name: string;
  address: string;
  city: string;
  zip_code: string;
  county: string;
  phone: string;
  license_status?: string;
  licensed_capacity?: string;
  [key: string]: any;
}

interface ExistingResource {
  id: string;
  title: string;
  street_address: string;
  city: string;
  zip_code: string;
  provider_type: string;
  state_license_number?: string;
}

interface MatchResult {
  alfRecord: ALFRecord;
  matchedResource?: ExistingResource;
  matchType?: "exact" | "fuzzy_address" | "fuzzy_zip" | "none";
  similarity?: number;
  action: "update" | "insert" | "skip";
}

// ============================================================================
// String Similarity Functions
// ============================================================================

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

function similarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  if (maxLength === 0) return 1.0;

  return 1 - distance / maxLength;
}

// ============================================================================
// Matching Functions
// ============================================================================

async function fetchExistingResources(state: string): Promise<ExistingResource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, street_address, city, zip_code, provider_type, state_license_number")
    .in("states", [state])
    .not("street_address", "is", null);

  if (error) {
    console.error("Error fetching existing resources:", error);
    return [];
  }

  return data || [];
}

function exactMatch(
  alfRecord: ALFRecord,
  resources: ExistingResource[]
): ExistingResource | null {
  const normalizedAlfAddress = normalizeString(alfRecord.address);
  const normalizedAlfName = normalizeString(alfRecord.facility_name);

  for (const resource of resources) {
    const normalizedResourceAddress = normalizeString(resource.street_address || "");
    const normalizedResourceName = normalizeString(resource.title);

    if (
      normalizedAlfAddress === normalizedResourceAddress &&
      normalizedAlfName === normalizedResourceName
    ) {
      return resource;
    }
  }

  return null;
}

function fuzzyMatchByAddress(
  alfRecord: ALFRecord,
  resources: ExistingResource[]
): { resource: ExistingResource; similarity: number } | null {
  let bestMatch: { resource: ExistingResource; similarity: number } | null = null;

  const normalizedAlfAddress = normalizeString(alfRecord.address);
  const normalizedAlfName = normalizeString(alfRecord.facility_name);

  for (const resource of resources) {
    const normalizedResourceAddress = normalizeString(resource.street_address || "");
    const normalizedResourceName = normalizeString(resource.title);

    // Address must match well (90%+)
    const addressSim = similarity(normalizedAlfAddress, normalizedResourceAddress);
    if (addressSim < 0.9) continue;

    // Name similarity
    const nameSim = similarity(normalizedAlfName, normalizedResourceName);
    if (nameSim < FUZZY_MATCH_THRESHOLD) continue;

    const avgSim = (addressSim + nameSim) / 2;

    if (!bestMatch || avgSim > bestMatch.similarity) {
      bestMatch = { resource, similarity: avgSim };
    }
  }

  return bestMatch;
}

function fuzzyMatchByZip(
  alfRecord: ALFRecord,
  resources: ExistingResource[]
): { resource: ExistingResource; similarity: number } | null {
  let bestMatch: { resource: ExistingResource; similarity: number } | null = null;

  const normalizedAlfName = normalizeString(alfRecord.facility_name);
  const alfZip = alfRecord.zip_code?.substring(0, 5) || "";

  const sameZipResources = resources.filter(
    (r) => r.zip_code?.substring(0, 5) === alfZip
  );

  for (const resource of sameZipResources) {
    const normalizedResourceName = normalizeString(resource.title);
    const nameSim = similarity(normalizedAlfName, normalizedResourceName);

    if (nameSim < FUZZY_MATCH_THRESHOLD) continue;

    if (!bestMatch || nameSim > bestMatch.similarity) {
      bestMatch = { resource, similarity: nameSim };
    }
  }

  return bestMatch;
}

async function matchALFRecords(
  alfRecords: ALFRecord[],
  state: string
): Promise<MatchResult[]> {
  console.log(`\nFetching existing resources for state: ${state}...`);
  const existingResources = await fetchExistingResources(state);
  console.log(`Found ${existingResources.length} existing resources`);

  const results: MatchResult[] = [];

  console.log(`\nMatching ${alfRecords.length} ALF records...`);

  for (const alfRecord of alfRecords) {
    const matchResult: MatchResult = {
      alfRecord,
      action: "insert",
    };

    // Strategy 1: Exact match
    const exactMatchResult = exactMatch(alfRecord, existingResources);
    if (exactMatchResult) {
      matchResult.matchedResource = exactMatchResult;
      matchResult.matchType = "exact";
      matchResult.similarity = 1.0;
      matchResult.action = "update";
      results.push(matchResult);
      continue;
    }

    // Strategy 2: Fuzzy match by address + name
    const fuzzyAddressMatch = fuzzyMatchByAddress(alfRecord, existingResources);
    if (fuzzyAddressMatch) {
      matchResult.matchedResource = fuzzyAddressMatch.resource;
      matchResult.matchType = "fuzzy_address";
      matchResult.similarity = fuzzyAddressMatch.similarity;
      matchResult.action = "update";
      results.push(matchResult);
      continue;
    }

    // Strategy 3: Fuzzy match by ZIP + name
    const fuzzyZipMatch = fuzzyMatchByZip(alfRecord, existingResources);
    if (fuzzyZipMatch) {
      matchResult.matchedResource = fuzzyZipMatch.resource;
      matchResult.matchType = "fuzzy_zip";
      matchResult.similarity = fuzzyZipMatch.similarity;
      matchResult.action = "update";
      results.push(matchResult);
      continue;
    }

    // No match found - will insert new record
    matchResult.matchType = "none";
    results.push(matchResult);
  }

  return results;
}

// ============================================================================
// Database Operations
// ============================================================================

async function updateResource(
  resourceId: string,
  alfRecord: ALFRecord
): Promise<boolean> {
  const updateData: any = {
    state_license_number: alfRecord.state_license_number,
    license_status: alfRecord.license_status || null,
    licensed_capacity: alfRecord.licensed_capacity
      ? parseInt(alfRecord.licensed_capacity)
      : null,
    provider_type: "assisted_living",
    updated_at: new Date().toISOString(),
  };

  // Add state-specific fields if available
  if (alfRecord.memory_care_certified !== undefined) {
    updateData.memory_care_certified = alfRecord.memory_care_certified === "true";
  }
  if (alfRecord.medicaid_accepted !== undefined && alfRecord.medicaid_accepted !== "") {
    updateData.medicaid_accepted = alfRecord.medicaid_accepted === "true";
  }

  const { error } = await supabase
    .from("resources")
    .update(updateData)
    .eq("id", resourceId);

  if (error) {
    console.error(`Error updating resource ${resourceId}:`, error);
    return false;
  }

  return true;
}

async function insertResource(alfRecord: ALFRecord): Promise<string | null> {
  const insertData: any = {
    title: alfRecord.facility_name,
    url: "", // No URL available from state data
    description: alfRecord.description || `Assisted Living Facility in ${alfRecord.city}, ${alfRecord.state}`,
    category: ["senior-living", "assisted-living"],
    conditions: ["aging"],
    urgency_level: "not_urgent",
    location_type: "local",
    states: [alfRecord.state],
    audience: ["family-caregiver", "senior"],
    cost: "Paid",
    source_authority: `${alfRecord.state} State Licensing`,
    street_address: alfRecord.address,
    city: alfRecord.city,
    zip_code: alfRecord.zip_code,
    county: alfRecord.county,
    contact_phone: alfRecord.phone,
    state_license_number: alfRecord.state_license_number,
    license_status: alfRecord.license_status || null,
    licensed_capacity: alfRecord.licensed_capacity
      ? parseInt(alfRecord.licensed_capacity)
      : null,
    provider_type: "assisted_living",
    medicare_accepted: false,
    medicaid_accepted: alfRecord.medicaid_accepted === "true" || false,
    memory_care_certified: alfRecord.memory_care_certified === "true" || false,
  };

  const { data, error } = await supabase
    .from("resources")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error(`Error inserting resource:`, error);
    return null;
  }

  return data?.id || null;
}

async function addFacilityIdentifier(
  resourceId: string,
  state: string,
  licenseNumber: string
): Promise<boolean> {
  const { error } = await supabase.from("facility_identifiers").upsert(
    {
      resource_id: resourceId,
      identifier_type: "STATE_LICENSE",
      identifier_value: licenseNumber,
      identifier_state: state,
      source: `STATE_${state}`,
      confidence_score: 1.0,
      is_primary: true,
      verified: true,
    },
    { onConflict: "identifier_type,identifier_value,identifier_state" }
  );

  if (error) {
    console.error(`Error adding facility identifier:`, error);
    return false;
  }

  return true;
}

// ============================================================================
// Main Processing
// ============================================================================

async function processState(
  state: string,
  dryRun: boolean = false
): Promise<void> {
  console.log("=".repeat(80));
  console.log(`Processing ${state} ALF Data`);
  console.log("=".repeat(80));

  const dataDir = `data/state/${state.toLowerCase()}`;

  // Find most recent processed file
  if (!fs.existsSync(dataDir)) {
    console.error(`Error: Data directory not found: ${dataDir}`);
    return;
  }

  const processedFiles = fs
    .readdirSync(dataDir)
    .filter((f) => f.startsWith("alf-processed_") && f.endsWith(".csv"))
    .sort()
    .reverse();

  if (processedFiles.length === 0) {
    console.error(`Error: No processed ALF files found in ${dataDir}`);
    console.error(`Run: pnpm tsx scripts/process-alf-${state.toLowerCase()}.ts first`);
    return;
  }

  const processedFile = path.join(dataDir, processedFiles[0]);
  console.log(`\nUsing: ${processedFile}`);

  // Read ALF records
  const csvContent = fs.readFileSync(processedFile, "utf-8");
  const alfRecords: ALFRecord[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Loaded ${alfRecords.length} ALF records`);

  // Match records
  const matchResults = await matchALFRecords(alfRecords, state);

  // Analyze results
  const stats = {
    total: matchResults.length,
    exactMatches: matchResults.filter((r) => r.matchType === "exact").length,
    fuzzyAddressMatches: matchResults.filter((r) => r.matchType === "fuzzy_address").length,
    fuzzyZipMatches: matchResults.filter((r) => r.matchType === "fuzzy_zip").length,
    noMatches: matchResults.filter((r) => r.matchType === "none").length,
    updates: 0,
    inserts: 0,
    errors: 0,
  };

  console.log(`\n${"=".repeat(80)}`);
  console.log("Match Results");
  console.log("=".repeat(80));
  console.log(`Total records: ${stats.total}`);
  console.log(`Exact matches: ${stats.exactMatches}`);
  console.log(`Fuzzy address matches: ${stats.fuzzyAddressMatches}`);
  console.log(`Fuzzy ZIP matches: ${stats.fuzzyZipMatches}`);
  console.log(`No matches (new facilities): ${stats.noMatches}`);

  if (dryRun) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("DRY RUN - No database changes made");
    console.log("=".repeat(80));
    return;
  }

  // Apply updates and inserts
  console.log(`\n${"=".repeat(80)}`);
  console.log("Applying Database Changes");
  console.log("=".repeat(80));

  for (const result of matchResults) {
    if (result.action === "update" && result.matchedResource) {
      process.stdout.write(".");
      const success = await updateResource(
        result.matchedResource.id,
        result.alfRecord
      );
      if (success) {
        await addFacilityIdentifier(
          result.matchedResource.id,
          state,
          result.alfRecord.state_license_number
        );
        stats.updates++;
      } else {
        stats.errors++;
      }
    } else if (result.action === "insert") {
      process.stdout.write("+");
      const newResourceId = await insertResource(result.alfRecord);
      if (newResourceId) {
        await addFacilityIdentifier(
          newResourceId,
          state,
          result.alfRecord.state_license_number
        );
        stats.inserts++;
      } else {
        stats.errors++;
      }
    }
  }

  console.log(`\n\n${"=".repeat(80)}`);
  console.log("Final Summary");
  console.log("=".repeat(80));
  console.log(`Resources updated: ${stats.updates}`);
  console.log(`Resources inserted: ${stats.inserts}`);
  console.log(`Errors: ${stats.errors}`);
  console.log("=".repeat(80));

  // Write match report
  const reportFile = path.join(dataDir, `match-report_${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify({ stats, matchResults }, null, 2));
  console.log(`\nMatch report saved to: ${reportFile}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const stateArg = args.find((arg) => arg.startsWith("--state="));
  const dryRun = args.includes("--dry-run");
  const all = args.includes("--all");

  const states = ["CA", "FL", "TX", "NY"];

  if (all) {
    console.log("Processing all states...\n");
    for (const state of states) {
      await processState(state, dryRun);
      console.log("\n");
    }
  } else if (stateArg) {
    const state = stateArg.split("=")[1].toUpperCase();
    if (!states.includes(state)) {
      console.error(`Error: Invalid state ${state}`);
      console.error(`Valid states: ${states.join(", ")}`);
      process.exit(1);
    }
    await processState(state, dryRun);
  } else {
    console.log("Usage:");
    console.log("  pnpm tsx scripts/match-alf-to-resources.ts --state=CA");
    console.log("  pnpm tsx scripts/match-alf-to-resources.ts --state=FL --dry-run");
    console.log("  pnpm tsx scripts/match-alf-to-resources.ts --all");
    console.log("\nOptions:");
    console.log("  --state=XX    Process specific state (CA, FL, TX, NY)");
    console.log("  --all         Process all states");
    console.log("  --dry-run     Show what would be done without making changes");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
