#!/usr/bin/env tsx
/**
 * Process Florida Assisted Living Facility (ALF) Data
 *
 * This script:
 * 1. Reads raw Florida ALF CSV files from data/state/fl/raw/
 * 2. Maps Florida-specific fields (AHCA HealthFinder) to our database schema
 * 3. Normalizes data to common ALF format
 * 4. Outputs processed CSV ready for import
 *
 * Data Sources:
 * - Florida Agency for Health Care Administration (AHCA)
 * - Florida HealthFinder (quality.healthfinder.fl.gov)
 *
 * Usage:
 *   pnpm tsx scripts/process-alf-fl.ts
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import path from "path";

// ============================================================================
// Type Definitions
// ============================================================================

interface FloridaALFRow {
  // Common field names from HealthFinder export
  "Provider Number"?: string;
  "License Number"?: string;
  "Provider Name"?: string;
  "Facility Name"?: string;
  "Name"?: string;
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
  "Owner"?: string;
  "License Status"?: string;
  "Status"?: string;
  "Number of Beds"?: string;
  "Total Beds"?: string;
  "Licensed Beds"?: string;
  "Bed Count"?: string;
  "Facility Type"?: string;
  "Type"?: string;
  "ECC License"?: string; // Extended Congregate Care
  "Limited Mental Health"?: string;
  "Limited Nursing Services"?: string;
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
  facility_type: string;
  provider_type: string;
  administrator_name: string;
  owner_name: string;
  ecc_certified: string; // Extended Congregate Care
  limited_mental_health: string;
  limited_nursing_services: string;
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
  const match = capacity.match(/\d+/);
  return match ? match[0] : "";
}

function normalizeBooleanField(value: string | undefined): string {
  if (!value) return "false";
  const normalized = value.toLowerCase().trim();
  if (normalized === "yes" || normalized === "y" || normalized === "true" || normalized === "1") {
    return "true";
  }
  return "false";
}

function getFieldValue(row: FloridaALFRow, possibleFields: string[]): string {
  for (const field of possibleFields) {
    if (row[field]) return row[field] || "";
  }
  return "";
}

// ============================================================================
// Processing Function
// ============================================================================

function processFloridaALF(inputFile: string): ProcessedALFRow[] {
  console.log(`\nProcessing: ${inputFile}`);

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    return [];
  }

  const csvContent = fs.readFileSync(inputFile, "utf-8");
  const records: FloridaALFRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} records`);

  const processed: ProcessedALFRow[] = records.map((row) => {
    // Extract license number (AHCA Provider Number)
    const licenseNumber =
      getFieldValue(row, ["Provider Number", "License Number"]) || "";

    // Extract facility name
    const facilityName =
      getFieldValue(row, ["Provider Name", "Facility Name", "Name"]) || "";

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

    const capacity = normalizeCapacity(
      getFieldValue(row, [
        "Number of Beds",
        "Total Beds",
        "Licensed Beds",
        "Bed Count",
      ])
    );

    // Extract operator information
    const administrator =
      getFieldValue(row, ["Administrator", "Administrator Name"]) || "";
    const owner = getFieldValue(row, ["Owner"]) || "";

    // Facility type
    const facilityType =
      getFieldValue(row, ["Facility Type", "Type"]) || "ALF";

    // Florida-specific certifications
    const eccCertified = normalizeBooleanField(row["ECC License"]);
    const limitedMentalHealth = normalizeBooleanField(
      row["Limited Mental Health"]
    );
    const limitedNursingServices = normalizeBooleanField(
      row["Limited Nursing Services"]
    );

    // Memory care determination
    // ECC (Extended Congregate Care) often indicates memory care capability
    const memoryCareCertified = eccCertified;

    // Medicaid - Florida uses SMMC LTC program for ALFs
    // Would need additional data source to confirm
    const medicaidAccepted = "";

    const description = `Assisted Living Facility in ${city}, Florida. Licensed by Florida Agency for Health Care Administration (AHCA).${eccCertified === "true" ? " Provides Extended Congregate Care (ECC) services." : ""}`;

    return {
      state: "FL",
      state_license_number: licenseNumber,
      facility_name: facilityName,
      address: address,
      city: city,
      zip_code: zipCode,
      county: county,
      phone: phone,
      license_status: licenseStatus,
      licensed_capacity: capacity,
      facility_type: facilityType,
      provider_type: "assisted_living",
      administrator_name: administrator,
      owner_name: owner,
      ecc_certified: eccCertified,
      limited_mental_health: limitedMentalHealth,
      limited_nursing_services: limitedNursingServices,
      memory_care_certified: memoryCareCertified,
      medicare_accepted: "false", // ALFs don't accept Medicare
      medicaid_accepted: medicaidAccepted,
      description: description,
      source: "FL_AHCA_HEALTHFINDER",
    };
  });

  return processed;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("Florida ALF Data Processing");
  console.log("=".repeat(80));

  const dataDir = "data/state/fl";
  const rawDir = path.join(dataDir, "raw");
  const processedDir = dataDir;

  // Ensure directories exist
  if (!fs.existsSync(rawDir)) {
    console.error(`\nError: Raw data directory not found: ${rawDir}`);
    console.error(
      "Please run: ./scripts/download-alf-fl.sh and manually download files"
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
    console.error("Please download Florida ALF data first.");
    process.exit(1);
  }

  console.log(`\nFound ${rawFiles.length} raw file(s) to process:`);
  rawFiles.forEach((f) => console.log(`  - ${path.basename(f)}`));

  // Process all files and combine results
  let allProcessed: ProcessedALFRow[] = [];

  for (const file of rawFiles) {
    const processed = processFloridaALF(file);
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

  const eccCount = finalRecords.filter((r) => r.ecc_certified === "true").length;
  console.log(`\nFacilities with ECC (Extended Congregate Care): ${eccCount}`);

  console.log(`\n${"=".repeat(80)}`);
  console.log("Next Steps:");
  console.log("=".repeat(80));
  console.log("1. Review the processed file for data quality");
  console.log("2. Run: node scripts/match-alf-to-resources.ts --state=FL");
  console.log("3. Or import directly with custom import script");
  console.log("=".repeat(80));
}

main().catch((error) => {
  console.error("Error processing Florida ALF data:", error);
  process.exit(1);
});
