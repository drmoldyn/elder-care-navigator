#!/usr/bin/env tsx
/**
 * Process New York Adult Care Facility (ACF) Data
 *
 * This script:
 * 1. Reads raw NY ACF CSV files from data/state/ny/raw/
 * 2. Merges General Information and Certification Information datasets
 * 3. Maps New York-specific fields to our database schema
 * 4. Normalizes data to common ALF format
 * 5. Outputs processed CSV ready for import
 *
 * Data Sources:
 * - New York State Department of Health
 * - Health Data NY Portal (health.data.ny.gov)
 * - Two datasets merged on Facility ID:
 *   1. Health Facility General Information
 *   2. Health Facility Certification Information
 *
 * Usage:
 *   pnpm tsx scripts/process-alf-ny.ts
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import path from "path";

// ============================================================================
// Type Definitions
// ============================================================================

interface NYGeneralInfoRow {
  "Facility ID"?: string;
  "Facility Name"?: string;
  "Description of Services"?: string;
  "Street Address"?: string;
  "Address"?: string;
  "City"?: string;
  "State"?: string;
  "Zip Code"?: string;
  "ZIP"?: string;
  "County"?: string;
  "Phone Number"?: string;
  "Phone"?: string;
  "Facility Type Code"?: string;
  "Facility Type"?: string;
  [key: string]: string | undefined;
}

interface NYCertificationInfoRow {
  "Facility ID"?: string;
  "Operating Certificate Number"?: string;
  "Operator Name"?: string;
  "Operator Phone"?: string;
  "Service Type Description"?: string;
  "Service Description"?: string;
  "Bed Count"?: string;
  "Capacity"?: string;
  "Certification Date"?: string;
  [key: string]: string | undefined;
}

interface ProcessedALFRow {
  state: string;
  facility_id: string;
  operating_certificate_number: string;
  facility_name: string;
  address: string;
  city: string;
  zip_code: string;
  county: string;
  phone: string;
  facility_type: string;
  service_type: string;
  licensed_capacity: string;
  provider_type: string;
  operator_name: string;
  operator_phone: string;
  certification_date: string;
  description: string;
  memory_care_certified: string;
  medicare_accepted: string;
  medicaid_accepted: string;
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

function getFieldValue(
  row: NYGeneralInfoRow | NYCertificationInfoRow,
  possibleFields: string[]
): string {
  for (const field of possibleFields) {
    if (row[field]) return row[field] || "";
  }
  return "";
}

function determineFacilityType(
  typeCode: string | undefined,
  serviceDescription: string | undefined
): { type: string; isACF: boolean } {
  const code = (typeCode || "").toUpperCase();
  const service = (serviceDescription || "").toUpperCase();

  // Adult Care Facility types in NY:
  // - Adult Home
  // - Residence for Adults
  // - Enriched Housing Program

  if (
    service.includes("ADULT HOME") ||
    code.includes("ADULT HOME") ||
    code === "AH"
  ) {
    return { type: "Adult Home", isACF: true };
  }

  if (
    service.includes("RESIDENCE FOR ADULTS") ||
    code.includes("RESIDENCE") ||
    code === "RFA"
  ) {
    return { type: "Residence for Adults", isACF: true };
  }

  if (
    service.includes("ENRICHED HOUSING") ||
    code.includes("ENRICHED") ||
    code === "EHP"
  ) {
    return { type: "Enriched Housing Program", isACF: true };
  }

  // Check for assisted living in service description
  if (service.includes("ASSISTED LIVING")) {
    return { type: "Assisted Living", isACF: true };
  }

  return { type: "Other", isACF: false };
}

// ============================================================================
// Processing Function
// ============================================================================

function processNewYorkACF(
  generalInfoFile: string,
  certificationInfoFile: string
): ProcessedALFRow[] {
  console.log(`\nProcessing General Info: ${generalInfoFile}`);
  console.log(`Processing Certification Info: ${certificationInfoFile}`);

  // Read General Information
  if (!fs.existsSync(generalInfoFile)) {
    throw new Error(`General info file not found: ${generalInfoFile}`);
  }

  const generalContent = fs.readFileSync(generalInfoFile, "utf-8");
  const generalRecords: NYGeneralInfoRow[] = parse(generalContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${generalRecords.length} general info records`);

  // Read Certification Information
  if (!fs.existsSync(certificationInfoFile)) {
    throw new Error(
      `Certification info file not found: ${certificationInfoFile}`
    );
  }

  const certContent = fs.readFileSync(certificationInfoFile, "utf-8");
  const certRecords: NYCertificationInfoRow[] = parse(certContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${certRecords.length} certification info records`);

  // Build map of certification data by Facility ID
  const certMap = new Map<string, NYCertificationInfoRow[]>();
  for (const cert of certRecords) {
    const facilityId = cert["Facility ID"] || "";
    if (!facilityId) continue;

    if (!certMap.has(facilityId)) {
      certMap.set(facilityId, []);
    }
    certMap.get(facilityId)!.push(cert);
  }

  // Merge general info with certification info
  const processed: ProcessedALFRow[] = [];

  for (const general of generalRecords) {
    const facilityId = general["Facility ID"] || "";
    if (!facilityId) continue;

    const certifications = certMap.get(facilityId) || [];

    // If facility has multiple certifications, create one record per certification
    // Or aggregate them - for now, we'll take the first/primary certification
    const primaryCert = certifications[0] || ({} as NYCertificationInfoRow);

    // Extract facility type
    const facilityTypeCode = getFieldValue(general, [
      "Facility Type Code",
      "Facility Type",
    ]);
    const serviceType = getFieldValue(primaryCert, [
      "Service Type Description",
      "Service Description",
    ]);

    const { type: facilityType, isACF } = determineFacilityType(
      facilityTypeCode,
      serviceType
    );

    // Only process Adult Care Facilities (similar to assisted living)
    if (!isACF) {
      continue;
    }

    // Extract general information
    const facilityName = getFieldValue(general, ["Facility Name"]) || "";
    const address =
      getFieldValue(general, ["Street Address", "Address"]) || "";
    const city = general["City"] || "";
    const zipCode = normalizeZipCode(
      getFieldValue(general, ["Zip Code", "ZIP"])
    );
    const county = general["County"] || "";
    const phone = normalizePhoneNumber(
      getFieldValue(general, ["Phone Number", "Phone"])
    );

    const servicesDescription =
      general["Description of Services"] || facilityType;

    // Extract certification information
    const operatingCertNumber =
      primaryCert["Operating Certificate Number"] || "";
    const operatorName = primaryCert["Operator Name"] || "";
    const operatorPhone = normalizePhoneNumber(
      primaryCert["Operator Phone"] || ""
    );
    const capacity = normalizeCapacity(
      getFieldValue(primaryCert, ["Bed Count", "Capacity"])
    );
    const certificationDate = formatDate(
      primaryCert["Certification Date"] || ""
    );

    // Memory care determination
    // Would need additional data - check service description
    const memoryCareCertified = serviceType.includes("MEMORY CARE")
      ? "true"
      : "false";

    // Medicaid acceptance - many NY ACFs accept Medicaid
    // Would need additional data source to confirm
    const medicaidAccepted = "";

    const description = `${facilityType} in ${city}, New York. Licensed by New York State Department of Health. ${servicesDescription ? `Services: ${servicesDescription}.` : ""}`;

    processed.push({
      state: "NY",
      facility_id: facilityId,
      operating_certificate_number: operatingCertNumber,
      facility_name: facilityName,
      address: address,
      city: city,
      zip_code: zipCode,
      county: county,
      phone: phone,
      facility_type: facilityType,
      service_type: serviceType,
      licensed_capacity: capacity,
      provider_type: "assisted_living",
      operator_name: operatorName,
      operator_phone: operatorPhone,
      certification_date: certificationDate,
      description: description,
      memory_care_certified: memoryCareCertified,
      medicare_accepted: "false",
      medicaid_accepted: medicaidAccepted,
      source: "NY_DOH_HEALTH_DATA",
    });
  }

  return processed;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("New York Adult Care Facility (ACF) Data Processing");
  console.log("=".repeat(80));

  const dataDir = "data/state/ny";
  const rawDir = path.join(dataDir, "raw");
  const processedDir = dataDir;

  // Ensure directories exist
  if (!fs.existsSync(rawDir)) {
    console.error(`\nError: Raw data directory not found: ${rawDir}`);
    console.error("Please run: ./scripts/download-alf-ny.sh to download data");
    process.exit(1);
  }

  // Create processed directory
  fs.mkdirSync(processedDir, { recursive: true });

  // Find the required CSV files
  const rawFiles = fs.readdirSync(rawDir).filter((f) => f.endsWith(".csv"));

  const generalInfoFile = rawFiles.find((f) =>
    f.includes("facility-general-info")
  );
  const certInfoFile = rawFiles.find((f) =>
    f.includes("facility-certification-info")
  );

  if (!generalInfoFile || !certInfoFile) {
    console.error(`\nError: Required CSV files not found in ${rawDir}`);
    console.error("Expected files:");
    console.error("  - facility-general-info_*.csv");
    console.error("  - facility-certification-info_*.csv");
    console.error("\nPlease download NY ACF data first using download-alf-ny.sh");
    process.exit(1);
  }

  console.log(`\nFound required files:`);
  console.log(`  - ${generalInfoFile}`);
  console.log(`  - ${certInfoFile}`);

  // Process files
  const processed = processNewYorkACF(
    path.join(rawDir, generalInfoFile),
    path.join(rawDir, certInfoFile)
  );

  console.log(`\n${"=".repeat(80)}`);
  console.log("Processing Summary");
  console.log("=".repeat(80));
  console.log(`Adult Care Facilities found: ${processed.length}`);

  // Write processed CSV
  const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const outputFile = path.join(processedDir, `alf-processed_${timestamp}.csv`);

  if (processed.length === 0) {
    console.error("\nNo Adult Care Facilities found in the data.");
    console.error("This may indicate a data format issue.");
    process.exit(1);
  }

  const csvOutput = stringify(processed, {
    header: true,
    columns: Object.keys(processed[0]),
  });

  fs.writeFileSync(outputFile, csvOutput);

  console.log(`\nOutput written to: ${outputFile}`);
  console.log(`File size: ${(csvOutput.length / 1024).toFixed(2)} KB`);

  // Show sample statistics
  const typeCounts = processed.reduce(
    (acc, r) => {
      acc[r.facility_type] = (acc[r.facility_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`\nFacility Type Distribution:`);
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  console.log(`\n${"=".repeat(80)}`);
  console.log("Next Steps:");
  console.log("=".repeat(80));
  console.log("1. Review the processed file for data quality");
  console.log("2. Run: node scripts/match-alf-to-resources.ts --state=NY");
  console.log("3. Or import directly with custom import script");
  console.log("\nNote: NY uses 'Adult Care Facility' terminology.");
  console.log("Types include: Adult Homes, Residences for Adults, Enriched Housing");
  console.log("=".repeat(80));
}

main().catch((error) => {
  console.error("Error processing New York ACF data:", error);
  process.exit(1);
});
