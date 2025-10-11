#!/usr/bin/env tsx
/**
 * Process Texas Assisted Living Facility (ALF) Data
 *
 * This script:
 * 1. Reads raw Texas ALF CSV files from data/state/tx/raw/
 * 2. Maps Texas-specific fields (HHSC TULIP) to our database schema
 * 3. Normalizes data to common ALF format
 * 4. Outputs processed CSV ready for import
 *
 * Data Sources:
 * - Texas Health and Human Services Commission (HHSC)
 * - TULIP (Texas Unified Licensure Information Portal)
 *
 * Usage:
 *   pnpm tsx scripts/process-alf-tx.ts
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import path from "path";

// ============================================================================
// Type Definitions
// ============================================================================

interface TexasALFRow {
  // Common field names from TULIP/HHSC data
  "License Number"?: string;
  "Facility License Number"?: string;
  "Facility Number"?: string;
  "Facility Name"?: string;
  "Name"?: string;
  "DBA"?: string; // Doing Business As
  "Address"?: string;
  "Street Address"?: string;
  "City"?: string;
  "State"?: string;
  "ZIP"?: string;
  "Zip Code"?: string;
  "County"?: string;
  "Phone"?: string;
  "Phone Number"?: string;
  "Administrator"?: string;
  "Administrator Name"?: string;
  "License Status"?: string;
  "Status"?: string;
  "License Type"?: string;
  "Capacity"?: string;
  "Licensed Capacity"?: string;
  "Inspection Date"?: string;
  "Last Inspection Date"?: string;
  "Violation Count"?: string;
  "Type C Violations"?: string; // Most serious
  "Type B Violations"?: string;
  "Type A Violations"?: string;
  [key: string]: string | undefined;
}

interface ProcessedALFRow {
  state: string;
  state_license_number: string;
  facility_name: string;
  dba_name: string;
  address: string;
  city: string;
  zip_code: string;
  county: string;
  phone: string;
  license_status: string;
  license_type: string;
  licensed_capacity: string;
  provider_type: string;
  administrator_name: string;
  last_inspection_date: string;
  total_violations_count: string;
  critical_violations_count: string; // Type C violations
  memory_care_certified: string;
  medicare_accepted: string;
  medicaid_accepted: string;
  description: string;
  source: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function normalizePhoneNumber(phone: string | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function normalizeZipCode(zip: string | undefined): string {
  if (!zip) return "";
  const match = zip.match(/\d{5}/);
  return match ? match[0] : zip;
}

function normalizeLicenseStatus(status: string | undefined): string {
  if (!status) return "UNKNOWN";

  const normalized = status.toUpperCase().trim();

  if (normalized.includes("ACTIVE") || normalized.includes("CURRENT")) {
    return "ACTIVE";
  }
  if (normalized.includes("INACTIVE")) return "INACTIVE";
  if (normalized.includes("EXPIRED")) return "INACTIVE";
  if (normalized.includes("SUSPENDED")) return "SUSPENDED";
  if (normalized.includes("REVOKED")) return "REVOKED";
  if (normalized.includes("PENDING")) return "PENDING";

  return normalized;
}

function normalizeCapacity(capacity: string | undefined): string {
  if (!capacity) return "";
  const match = capacity.match(/\d+/);
  return match ? match[0] : "";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function getFieldValue(row: TexasALFRow, possibleFields: string[]): string {
  for (const field of possibleFields) {
    if (row[field]) return row[field] || "";
  }
  return "";
}

// ============================================================================
// Processing Function
// ============================================================================

function processTexasALF(inputFile: string): ProcessedALFRow[] {
  console.log(`\nProcessing: ${inputFile}`);

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    return [];
  }

  const csvContent = fs.readFileSync(inputFile, "utf-8");
  const records: TexasALFRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} records`);

  const processed: ProcessedALFRow[] = records.map((row) => {
    // Extract license number
    const licenseNumber =
      getFieldValue(row, [
        "License Number",
        "Facility License Number",
        "Facility Number",
      ]) || "";

    // Extract facility name and DBA
    const facilityName =
      getFieldValue(row, ["Facility Name", "Name"]) || "";
    const dbaName = row["DBA"] || "";

    // Extract address components
    const address =
      getFieldValue(row, ["Address", "Street Address"]) || "";
    const city = row["City"] || "";
    const zipCode = normalizeZipCode(
      getFieldValue(row, ["ZIP", "Zip Code"])
    );
    const county = row["County"] || "";
    const phone = normalizePhoneNumber(
      getFieldValue(row, ["Phone", "Phone Number"])
    );

    // Extract license information
    const licenseStatus = normalizeLicenseStatus(
      getFieldValue(row, ["License Status", "Status"])
    );
    const licenseType = getFieldValue(row, ["License Type"]) || "";
    const capacity = normalizeCapacity(
      getFieldValue(row, ["Capacity", "Licensed Capacity"])
    );

    // Extract operator information
    const administrator =
      getFieldValue(row, ["Administrator", "Administrator Name"]) || "";

    // Inspection and violation information
    const lastInspectionDate = formatDate(
      getFieldValue(row, ["Inspection Date", "Last Inspection Date"])
    );

    const typeCViolations = normalizeCapacity(row["Type C Violations"] || "0");
    const typeBViolations = normalizeCapacity(row["Type B Violations"] || "0");
    const typeAViolations = normalizeCapacity(row["Type A Violations"] || "0");

    const totalViolations =
      normalizeCapacity(row["Violation Count"]) ||
      String(
        parseInt(typeCViolations || "0") +
          parseInt(typeBViolations || "0") +
          parseInt(typeAViolations || "0")
      );

    // Type C violations are the most critical in Texas
    const criticalViolations = typeCViolations;

    // Memory care determination
    // Would need additional data source
    const memoryCareCertified = "false";

    // Medicaid acceptance
    // Would need additional data source
    const medicaidAccepted = "";

    const description = `Assisted Living Facility in ${city}, Texas. Licensed by Texas Health and Human Services Commission (HHSC) under Texas Administrative Code, Title 26, Chapter 553.${dbaName ? ` Also known as: ${dbaName}.` : ""}`;

    return {
      state: "TX",
      state_license_number: licenseNumber,
      facility_name: facilityName,
      dba_name: dbaName,
      address: address,
      city: city,
      zip_code: zipCode,
      county: county,
      phone: phone,
      license_status: licenseStatus,
      license_type: licenseType,
      licensed_capacity: capacity,
      provider_type: "assisted_living",
      administrator_name: administrator,
      last_inspection_date: lastInspectionDate,
      total_violations_count: totalViolations,
      critical_violations_count: criticalViolations,
      memory_care_certified: memoryCareCertified,
      medicare_accepted: "false",
      medicaid_accepted: medicaidAccepted,
      description: description,
      source: "TX_HHSC_TULIP",
    };
  });

  return processed;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("Texas ALF Data Processing");
  console.log("=".repeat(80));

  const dataDir = "data/state/tx";
  const rawDir = path.join(dataDir, "raw");
  const processedDir = dataDir;

  // Ensure directories exist
  if (!fs.existsSync(rawDir)) {
    console.error(`\nError: Raw data directory not found: ${rawDir}`);
    console.error(
      "Please run: ./scripts/download-alf-tx.sh and complete data request"
    );
    process.exit(1);
  }

  // Create processed directory
  fs.mkdirSync(processedDir, { recursive: true });

  // Find all CSV files in raw directory
  const rawFiles = fs
    .readdirSync(rawDir)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => path.join(rawDir, f));

  if (rawFiles.length === 0) {
    console.error(`\nNo CSV files found in ${rawDir}`);
    console.error("Please obtain Texas ALF data via public information request.");
    process.exit(1);
  }

  console.log(`\nFound ${rawFiles.length} raw file(s) to process:`);
  rawFiles.forEach((f) => console.log(`  - ${path.basename(f)}`));

  // Process all files and combine results
  let allProcessed: ProcessedALFRow[] = [];

  for (const file of rawFiles) {
    const processed = processTexasALF(file);
    allProcessed = allProcessed.concat(processed);
  }

  // Remove duplicates based on license number
  const uniqueRecords = new Map<string, ProcessedALFRow>();
  for (const record of allProcessed) {
    if (record.state_license_number) {
      uniqueRecords.set(record.state_license_number, record);
    }
  }

  const finalRecords = Array.from(uniqueRecords.values());

  console.log(`\n${"=".repeat(80)}`);
  console.log("Processing Summary");
  console.log("=".repeat(80));
  console.log(`Total records processed: ${allProcessed.length}`);
  console.log(`Unique facilities: ${finalRecords.length}`);
  console.log(`Duplicates removed: ${allProcessed.length - finalRecords.length}`);

  // Write processed CSV
  const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const outputFile = path.join(processedDir, `alf-processed_${timestamp}.csv`);

  const csvOutput = stringify(finalRecords, {
    header: true,
    columns: Object.keys(finalRecords[0] || {}),
  });

  fs.writeFileSync(outputFile, csvOutput);

  console.log(`\nOutput written to: ${outputFile}`);
  console.log(`File size: ${(csvOutput.length / 1024).toFixed(2)} KB`);

  // Show sample statistics
  const statusCounts = finalRecords.reduce(
    (acc, r) => {
      acc[r.license_status] = (acc[r.license_status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`\nLicense Status Distribution:`);
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

  const withViolations = finalRecords.filter(
    (r) => parseInt(r.total_violations_count || "0") > 0
  ).length;
  const withCritical = finalRecords.filter(
    (r) => parseInt(r.critical_violations_count || "0") > 0
  ).length;

  console.log(`\nFacilities with violations: ${withViolations}`);
  console.log(`Facilities with critical (Type C) violations: ${withCritical}`);

  console.log(`\n${"=".repeat(80)}`);
  console.log("Next Steps:");
  console.log("=".repeat(80));
  console.log("1. Review the processed file for data quality");
  console.log("2. Run: node scripts/match-alf-to-resources.ts --state=TX");
  console.log("3. Or import directly with custom import script");
  console.log("=".repeat(80));
}

main().catch((error) => {
  console.error("Error processing Texas ALF data:", error);
  process.exit(1);
});
