#!/usr/bin/env tsx
/**
 * Process Assisted Living Facilities Data
 * Converts ALF dataset to our database schema format
 *
 * Input: data/assisted-living/assisted-living-facilities.csv
 * Output: data/assisted-living/processed/alf-processed.csv
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

interface AlfRecord {
  "Facility ID": string;
  "Facility Name": string;
  Address: string;
  City: string;
  State: string;
  "Zip Code": string;
  "Phone Number": string;
  County: string;
  Licensee: string;
  "State Facility Type 2 Literal": string;
  "State Facility Type 1 Literal": string;
  "Date Accessed": string;
  "License Number": string;
  Capacity: string;
  "Email Address": string;
  "Ownership Type": string;
  Latitude: string;
  Longitude: string;
}

interface ProcessedRecord {
  facility_id: string;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  phone: string;
  email: string;
  category: string;
  provider_type: string;
  ownership_type: string;
  total_beds: string;
  license_number: string;
  website: string;
  description: string;
  best_for: string;
  // Insurance - default to likely accepted
  medicare_accepted: string;
  medicaid_accepted: string;
  private_insurance_accepted: string;
  veterans_affairs_accepted: string;
  // Location metadata
  latitude: string;
  longitude: string;
}

function cleanString(value: string | undefined): string {
  if (!value || value.trim() === "") return "";
  return value.trim();
}

function inferOwnershipType(value: string): string {
  if (!value || value.trim() === "") return "";
  const lower = value.toLowerCase();
  if (lower.includes("profit")) return "for_profit";
  if (lower.includes("non-profit") || lower.includes("nonprofit")) return "non_profit";
  if (lower.includes("government") || lower.includes("county") || lower.includes("state")) return "government";
  return "";
}

function processAlfData(inputPath: string, outputPath: string) {
  console.log(`📂 Reading ${inputPath}...`);

  const csvContent = fs.readFileSync(inputPath, "utf-8");
  const records: AlfRecord[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📊 Found ${records.length} assisted living facilities\n`);

  const processedRecords: ProcessedRecord[] = records.map((record) => {
    const facilityName = cleanString(record["Facility Name"]);

    return {
      facility_id: cleanString(record["Facility ID"]) || cleanString(record["License Number"]),
      facility_name: facilityName,
      address: cleanString(record.Address),
      city: cleanString(record.City),
      state: cleanString(record.State),
      zip_code: cleanString(record["Zip Code"]),
      county: cleanString(record.County),
      phone: cleanString(record["Phone Number"]),
      email: cleanString(record["Email Address"]),

      category: "assisted_living",
      provider_type: "assisted_living_facility",
      ownership_type: inferOwnershipType(record["Ownership Type"]),
      total_beds: cleanString(record.Capacity),
      license_number: cleanString(record["License Number"]),

      website: "", // Not in dataset
      description: `${facilityName} is an assisted living facility in ${record.City}, ${record.State} with capacity for ${record.Capacity || "residents"}.`,
      best_for: "Seniors needing assistance with daily activities in a residential setting",

      // Insurance - ALFs typically accept most insurance
      medicare_accepted: "true",
      medicaid_accepted: "true",
      private_insurance_accepted: "true",
      veterans_affairs_accepted: "true",

      // Coordinates already in dataset!
      latitude: cleanString(record.Latitude),
      longitude: cleanString(record.Longitude),
    };
  });

  // Create output directory
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write processed CSV
  const csvOutput = stringify(processedRecords, {
    header: true,
    columns: Object.keys(processedRecords[0]),
  });

  fs.writeFileSync(outputPath, csvOutput);

  console.log(`✅ Processed ${processedRecords.length} facilities`);
  console.log(`📝 Output: ${outputPath}\n`);

  // Summary stats
  const stateCount = new Map<string, number>();
  processedRecords.forEach((r) => {
    const state = r.state;
    stateCount.set(state, (stateCount.get(state) || 0) + 1);
  });

  console.log("📊 Summary by State:");
  const sortedStates = Array.from(stateCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedStates.forEach(([state, count]) => {
    console.log(`   ${state}: ${count.toLocaleString()} facilities`);
  });

  if (stateCount.size > 10) {
    console.log(`   ... and ${stateCount.size - 10} more states`);
  }
}

// Run processor
const inputPath = "data/assisted-living/assisted-living-facilities.csv";
const outputPath = "data/assisted-living/processed/alf-processed.csv";

processAlfData(inputPath, outputPath);
