#!/usr/bin/env tsx
/**
 * Process California RCFE (Residential Care Facilities for the Elderly) Data
 *
 * This script:
 * 1. Reads raw California RCFE CSV files from data/state/ca/raw/
 * 2. Maps California-specific fields to our database schema
 * 3. Normalizes data to common ALF format
 * 4. Outputs processed CSV ready for import
 *
 * Data Sources:
 * - Community Care Licensing Division (CCLD)
 * - California Open Data Portal (data.ca.gov)
 *
 * Usage:
 *   pnpm tsx scripts/process-alf-ca.ts
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import path from "path";

// ============================================================================
// Type Definitions
// ============================================================================

interface CaliforniaRCFERow {
  // Common field names (adjust based on actual CSV columns)
  "Facility Number"?: string;
  "Facility Name"?: string;
  "Facility License Number"?: string;
  "License Number"?: string;
  "Facility Address"?: string;
  "Address"?: string;
  "City"?: string;
  "ZIP"?: string;
  "Zip Code"?: string;
  "County"?: string;
  "Phone"?: string;
  "Phone Number"?: string;
  "Facility Type"?: string;
  "Facility Status"?: string;
  "License Status"?: string;
  "Capacity"?: string;
  "Licensed Capacity"?: string;
  "Administrator"?: string;
  "Licensee"?: string;
  "License Issue Date"?: string;
  "License Expiration Date"?: string;
  [key: string]: string | undefined;
}

interface ProcessedALFRow {
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
  provider_type: string;
  administrator_name: string;
  licensee_name: string;
  memory_care_certified: string;
  // Standard fields
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
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function normalizeZipCode(zip: string | undefined): string {
  if (!zip) return "";
  // Extract first 5 digits
  const match = zip.match(/\d{5}/);
  return match ? match[0] : zip;
}

function normalizeLicenseStatus(status: string | undefined): string {
  if (!status) return "UNKNOWN";

  const normalized = status.toUpperCase().trim();

  if (normalized.includes("ACTIVE") || normalized.includes("LICENSED")) {
    return "ACTIVE";
  }
  if (normalized.includes("INACTIVE")) return "INACTIVE";
  if (normalized.includes("SUSPENDED")) return "SUSPENDED";
  if (normalized.includes("REVOKED")) return "REVOKED";
  if (normalized.includes("PENDING")) return "PENDING";
  if (normalized.includes("CLOSED")) return "INACTIVE";

  return normalized;
}

function normalizeCapacity(capacity: string | undefined): string {
  if (!capacity) return "";
  // Extract numeric value
  const match = capacity.match(/\d+/);
  return match ? match[0] : "";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    // Return in YYYY-MM-DD format
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function getFieldValue(
  row: CaliforniaRCFERow,
  possibleFields: string[]
): string {
  for (const field of possibleFields) {
    if (row[field]) return row[field] || "";
  }
  return "";
}

// ============================================================================
// Processing Function
// ============================================================================

function processCaliforniaRCFE(inputFile: string): ProcessedALFRow[] {
  console.log(`\nProcessing: ${inputFile}`);

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    return [];
  }

  const csvContent = fs.readFileSync(inputFile, "utf-8");
  const records: CaliforniaRCFERow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} records`);

  const processed: ProcessedALFRow[] = records.map((row) => {
    // Extract license number (various possible field names)
    const licenseNumber =
      getFieldValue(row, [
        "Facility License Number",
        "License Number",
        "Facility Number",
      ]) || "";

    // Extract facility name
    const facilityName = getFieldValue(row, ["Facility Name", "Name"]) || "";

    // Extract address components
    const address =
      getFieldValue(row, ["Facility Address", "Address", "Street Address"]) ||
      "";
    const city = row["City"] || "";
    const zipCode = normalizeZipCode(
      getFieldValue(row, ["ZIP", "Zip Code", "ZIP Code"])
    );
    const county = row["County"] || "";
    const phone = normalizePhoneNumber(
      getFieldValue(row, ["Phone", "Phone Number"])
    );

    // Extract license information
    const licenseStatus = normalizeLicenseStatus(
      getFieldValue(row, ["License Status", "Facility Status", "Status"])
    );
    const capacity = normalizeCapacity(
      getFieldValue(row, ["Capacity", "Licensed Capacity"])
    );
    const licenseIssueDate = formatDate(
      getFieldValue(row, ["License Issue Date", "Issue Date"])
    );
    const licenseExpirationDate = formatDate(
      getFieldValue(row, ["License Expiration Date", "Expiration Date"])
    );

    // Extract operator information
    const administrator = getFieldValue(row, ["Administrator"]) || "";
    const licensee = getFieldValue(row, ["Licensee", "Owner"]) || "";

    // Facility type
    const facilityType = getFieldValue(row, ["Facility Type", "Type"]) || "RCFE";

    // Memory care determination (California doesn't explicitly certify this in basic data)
    // Would need to cross-reference with additional datasets or inspection notes
    const memoryCareCertified = "false";

    // Medicaid (called Medi-Cal in California)
    // Would need additional data source - not in basic facility list
    const medicaidAccepted = "";

    const description = `Residential Care Facility for the Elderly in ${city}, California. Licensed by California Department of Social Services, Community Care Licensing Division.`;

    return {
      state: "CA",
      state_license_number: licenseNumber,
      facility_name: facilityName,
      address: address,
      city: city,
      zip_code: zipCode,
      county: county,
      phone: phone,
      license_status: licenseStatus,
      licensed_capacity: capacity,
      license_issue_date: licenseIssueDate,
      license_expiration_date: licenseExpirationDate,
      facility_type: facilityType,
      provider_type: "assisted_living",
      administrator_name: administrator,
      licensee_name: licensee,
      memory_care_certified: memoryCareCertified,
      medicare_accepted: "false", // RCFEs don't accept Medicare
      medicaid_accepted: medicaidAccepted,
      description: description,
      source: "CA_CDSS_CCLD",
    };
  });

  return processed;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("California RCFE Data Processing");
  console.log("=".repeat(80));

  const dataDir = "data/state/ca";
  const rawDir = path.join(dataDir, "raw");
  const processedDir = dataDir;

  // Ensure directories exist
  if (!fs.existsSync(rawDir)) {
    console.error(`\nError: Raw data directory not found: ${rawDir}`);
    console.error(
      "Please run: ./scripts/download-alf-ca.sh and manually download files"
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
    console.error("Please download California RCFE data first.");
    process.exit(1);
  }

  console.log(`\nFound ${rawFiles.length} raw file(s) to process:`);
  rawFiles.forEach((f) => console.log(`  - ${path.basename(f)}`));

  // Process all files and combine results
  let allProcessed: ProcessedALFRow[] = [];

  for (const file of rawFiles) {
    const processed = processCaliforniaRCFE(file);
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

  console.log(`\n${"=".repeat(80)}`);
  console.log("Next Steps:");
  console.log("=".repeat(80));
  console.log("1. Review the processed file for data quality");
  console.log("2. Run: node scripts/match-alf-to-resources.ts --state=CA");
  console.log("3. Or import directly with custom import script");
  console.log("=".repeat(80));
}

main().catch((error) => {
  console.error("Error processing California RCFE data:", error);
  process.exit(1);
});
