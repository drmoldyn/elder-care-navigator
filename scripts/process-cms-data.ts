#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Process CMS datasets into our enhanced schema format
 *
 * This script:
 * 1. Reads raw CMS CSV files
 * 2. Maps CMS fields to our database schema
 * 3. Adds geocoding placeholders (lat/long to be filled by geocoding service)
 * 4. Outputs processed CSV files ready for import
 *
 * Usage:
 *   pnpm tsx scripts/process-cms-data.ts
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

interface CmsHomeHealthRow {
  "CMS Certification Number (CCN)"?: string;
  "Provider Name"?: string;
  "Address"?: string;
  "City"?: string;
  "State"?: string;
  "Zip Code"?: string;
  "County Name"?: string;
  "Phone Number"?: string;
  "Ownership Type"?: string;
  "Offers Nursing Care Services"?: string;
  "Offers Physical Therapy Services"?: string;
  "Offers Occupational Therapy Services"?: string;
  "Offers Speech Pathology Services"?: string;
  "Offers Medical Social Services"?: string;
  "Offers Home Health Aide Services"?: string;
  "Date Certified"?: string;
  [key: string]: string | undefined;
}

interface CmsNursingHomeRow {
  "Federal Provider Number"?: string;
  "Provider Name"?: string;
  "Provider Address"?: string;
  "Provider City"?: string;
  "City/Town"?: string;
  State?: string;
  "Provider State"?: string;
  "Provider Zip Code"?: string;
  "ZIP Code"?: string;
  "Provider County Name"?: string;
  "County/Parish"?: string;
  "Provider Phone Number"?: string;
  "Telephone Number"?: string;
  "Ownership Type"?: string;
  "Number of Certified Beds"?: string;
  "Overall Rating"?: string;
  "Provider Type"?: string;
  [key: string]: string | undefined;
}

interface CmsHospitalRow {
  "Facility ID"?: string;
  "Facility Name"?: string;
  "Address"?: string;
  "City"?: string;
  "State"?: string;
  "ZIP Code"?: string;
  "County Name"?: string;
  "Phone Number"?: string;
  "Hospital Type"?: string;
  "Hospital Ownership"?: string;
  "Emergency Services"?: string;
  "Hospital overall rating"?: string;
  [key: string]: string | undefined;
}

interface ProcessedRow {
  facility_id: string;
  facility_name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  phone: string;
  website: string;
  email: string;
  npi: string;
  medicare_accepted: string;
  medicaid_accepted: string;
  private_insurance_accepted: string;
  veterans_affairs_accepted: string;
  total_beds: string;
  ownership_type: string;
  quality_rating: string;
  services_offered: string;
  specialties: string;
  latitude: string;
  longitude: string;
  description: string;
  best_for: string;
  urgency_level: string;
  location_type: string;
  states: string;
  audience: string;
  living_situation: string;
  cost: string;
  source_authority: string;
  provider_type: string;
  conditions: string;
  staffing_rating: string;
  total_nurse_hours_per_resident_per_day: string;
  rn_hours_per_resident_per_day: string;
  lpn_hours_per_resident_per_day: string;
  cna_hours_per_resident_per_day: string;
  weekend_nurse_hours_per_resident_per_day: string;
  weekend_rn_hours_per_resident_per_day: string;
  total_nurse_staff_turnover: string;
  rn_turnover: string;
  case_mix_total_nurse_hours: string;
  case_mix_rn_hours: string;
  health_inspection_rating: string;
  quality_measure_rating: string;
  number_of_facility_reported_incidents: string;
  number_of_substantiated_complaints: string;
  number_of_certified_beds: string;
}

function cleanString(value: string | undefined): string {
  return (value || "").trim();
}

function cleanPhone(phone: string | undefined): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "").slice(0, 10);
}

function cleanZip(zip: string | undefined): string {
  if (!zip) return "";
  return zip.replace(/[^\d]/g, "").slice(0, 5);
}

function cleanState(value: string | undefined): string {
  const cleaned = cleanString(value);
  if (!cleaned) return "";
  return cleaned.length === 2 ? cleaned.toUpperCase() : cleaned;
}

function processHomeHealthAgencies(): number {
  console.log("\n📋 Processing Home Health Agencies...");

  const inputPath = "data/cms/home-health-agencies.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return 0;
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: CmsHomeHealthRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const processed: ProcessedRow[] = records.map((row) => {
    const services: string[] = [];
    if (row["Offers Nursing Care Services"] === "Yes") services.push("Skilled Nursing");
    if (row["Offers Physical Therapy Services"] === "Yes") services.push("Physical Therapy");
    if (row["Offers Occupational Therapy Services"] === "Yes") services.push("Occupational Therapy");
    if (row["Offers Speech Pathology Services"] === "Yes") services.push("Speech Therapy");
    if (row["Offers Medical Social Services"] === "Yes") services.push("Medical Social Work");
    if (row["Offers Home Health Aide Services"] === "Yes") services.push("Home Health Aide");

    return {
      facility_id: cleanString(row["CMS Certification Number (CCN)"]),
      facility_name: cleanString(row["Provider Name"]),
      category: "home_health",
      address: cleanString(row["Address"]),
      city: cleanString(row["City"]),
      state: cleanString(row["State"]),
      zip_code: cleanZip(row["Zip Code"]),
      county: cleanString(row["County Name"]),
      phone: cleanPhone(row["Phone Number"]),
      website: "",
      email: "",
      npi: "",
      medicare_accepted: "TRUE",
      medicaid_accepted: "TRUE",
      private_insurance_accepted: "TRUE",
      veterans_affairs_accepted: "FALSE",
      total_beds: "0",
      ownership_type: cleanString(row["Ownership Type"]),
      quality_rating: "",
      services_offered: services.join(";"),
      specialties: "Post-Hospital Care;Chronic Disease Management;Elder Care",
      latitude: "",
      longitude: "",
      description: `Medicare-certified home health agency providing ${services.join(", ")}`,
      best_for: "Patients needing skilled care at home after hospitalization or for chronic conditions",
      urgency_level: "medium",
      location_type: "local",
      states: cleanString(row["State"]),
      audience: "caregiver;patient;family",
      living_situation: "independent;with_family",
      cost: "Covered by Medicare for eligible patients",
      source_authority: "CMS",
      provider_type: "home_health",
      conditions: "chronic;mobility;medical_change",
      staffing_rating: "",
      total_nurse_hours_per_resident_per_day: "",
      rn_hours_per_resident_per_day: "",
      lpn_hours_per_resident_per_day: "",
      cna_hours_per_resident_per_day: "",
      weekend_nurse_hours_per_resident_per_day: "",
      weekend_rn_hours_per_resident_per_day: "",
      total_nurse_staff_turnover: "",
      rn_turnover: "",
      case_mix_total_nurse_hours: "",
      case_mix_rn_hours: "",
      health_inspection_rating: "",
      quality_measure_rating: "",
      number_of_facility_reported_incidents: "",
      number_of_substantiated_complaints: "",
      number_of_certified_beds: "",
    };
  });

  const outputPath = "data/cms/processed/home-health-processed.csv";
  fs.mkdirSync("data/cms/processed", { recursive: true });
  fs.writeFileSync(outputPath, stringify(processed, { header: true }));

  console.log(`✅ Processed ${processed.length} home health agencies`);
  return processed.length;
}

function processNursingHomes(): number {
  console.log("\n📋 Processing Nursing Homes...");

  const inputPath = "data/cms/nursing-homes-providers.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return 0;
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: CmsNursingHomeRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const processed: ProcessedRow[] = records.map((row) => {
    return {
      facility_id: cleanString(row["CMS Certification Number (CCN)"] || row["Federal Provider Number"]),
      facility_name: cleanString(row["Provider Name"]),
      category: "nursing_home",
      address: cleanString(row["Provider Address"]),
      city: cleanString(row["Provider City"] || row["City/Town"]),
      state: cleanState(row["Provider State"] || row.State),
      zip_code: cleanZip(row["Provider Zip Code"] || row["ZIP Code"]),
      county: cleanString(row["Provider County Name"] || row["County/Parish"]),
      phone: cleanPhone(row["Provider Phone Number"] || row["Telephone Number"]),
      website: "",
      email: "",
      npi: "",
      medicare_accepted: "TRUE",
      medicaid_accepted: "TRUE",
      private_insurance_accepted: "TRUE",
      veterans_affairs_accepted: "FALSE",
      total_beds: cleanString(row["Number of Certified Beds"]),
      ownership_type: cleanString(row["Ownership Type"]),
      quality_rating: cleanString(row["Overall Rating"]),
      services_offered: "Skilled Nursing;Long-term Care;Rehabilitation;Memory Care",
      specialties: "Dementia Care;Post-Acute Rehabilitation;Complex Medical Needs",
      latitude: cleanString((row as any).Latitude),
      longitude: cleanString((row as any).Longitude),
      description: `Medicare-certified nursing home with ${row["Number of Certified Beds"] || "multiple"} beds providing 24/7 skilled nursing care`,
      best_for: "Individuals requiring 24/7 skilled nursing care or long-term residential care",
      urgency_level: "high",
      location_type: "local",
      states: cleanState(row["Provider State"] || row.State),
      audience: "caregiver;patient;family",
      living_situation: "facility",
      cost: "Covered by Medicare (up to 100 days post-hospitalization), Medicaid, or private pay",
      source_authority: "CMS",
      provider_type: "nursing_home",
      conditions: "dementia;mobility;chronic;multiple",
      staffing_rating: cleanString(row["Staffing Rating"]),
      total_nurse_hours_per_resident_per_day: cleanString(row["Reported Total Nurse Staffing Hours per Resident per Day"]),
      rn_hours_per_resident_per_day: cleanString(row["Reported RN Staffing Hours per Resident per Day"]),
      lpn_hours_per_resident_per_day: cleanString(row["Reported LPN Staffing Hours per Resident per Day"]),
      cna_hours_per_resident_per_day: cleanString(row["Reported Nurse Aide Staffing Hours per Resident per Day"]),
      weekend_nurse_hours_per_resident_per_day: cleanString(row["Total number of nurse staff hours per resident per day on the weekend"]),
      weekend_rn_hours_per_resident_per_day: cleanString(row["Registered Nurse hours per resident per day on the weekend"]),
      total_nurse_staff_turnover: cleanString(row["Total nursing staff turnover"]),
      rn_turnover: cleanString(row["Registered Nurse turnover"]),
      case_mix_total_nurse_hours: cleanString(row["Case-Mix Total Nurse Staffing Hours per Resident per Day"]),
      case_mix_rn_hours: cleanString(row["Case-Mix RN Staffing Hours per Resident per Day"]),
      health_inspection_rating: cleanString(row["Health Inspection Rating"]),
      quality_measure_rating: cleanString(row["QM Rating"]),
      number_of_facility_reported_incidents: cleanString(row["Number of Facility Reported Incidents"]),
      number_of_substantiated_complaints: cleanString(row["Number of Substantiated Complaints"]),
      number_of_certified_beds: cleanString(row["Number of Certified Beds"]),
    };
  });

  const outputPath = "data/cms/processed/nursing-homes-processed.csv";
  fs.writeFileSync(outputPath, stringify(processed, { header: true }));

  console.log(`✅ Processed ${processed.length} nursing homes`);
  return processed.length;
}

function processHospitals(): number {
  console.log("\n📋 Processing Hospitals (for medical systems database)...");

  const inputPath = "data/cms/hospitals.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return 0;
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: CmsHospitalRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Create a separate CSV for medical_systems table
  const medicalSystems = records.map((row) => {
    const hospitalType = cleanString(row["Hospital Type"]);
    let mappedType = "acute_care";
    if (hospitalType.includes("Critical Access")) mappedType = "critical_access";
    else if (hospitalType.includes("Children")) mappedType = "childrens";
    else if (hospitalType.includes("VA")) mappedType = "va";

    return {
      cms_provider_id: cleanString(row["Facility ID"]),
      name: cleanString(row["Facility Name"]),
      npi: "",
      street_address: cleanString(row["Address"]),
      city: cleanString(row["City"]),
      state: cleanString(row["State"]),
      zip_code: cleanZip(row["ZIP Code"]),
      county: cleanString(row["County Name"]),
      latitude: "",
      longitude: "",
      hospital_type: mappedType,
      bed_count: "",
      is_teaching_hospital: "FALSE", // Would need additional data source
      trauma_level: "",
      academic_affiliation: "",
      phone: cleanPhone(row["Phone Number"]),
      website: "",
      cms_quality_rating: cleanString(row["Hospital overall rating"]),
    };
  });

  const outputPath = "data/cms/processed/hospitals-medical-systems.csv";
  fs.writeFileSync(outputPath, stringify(medicalSystems, { header: true }));

  console.log(`✅ Processed ${medicalSystems.length} hospitals for medical systems`);
  console.log(`   💡 Note: Latitude/longitude need to be geocoded before import`);
  return medicalSystems.length;
}

function processHospiceProviders(): number {
  console.log("\n📋 Processing Hospice Providers...");

  const inputPath = "data/cms/hospice-providers.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return 0;
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const processed: ProcessedRow[] = records.map((row: any) => {
    return {
      facility_id: cleanString(row["CMS Certification Number (CCN)"] || row["CCN"]),
      facility_name: cleanString(row["Facility Name"] || row["Provider Name"]),
      category: "hospice",
      address: cleanString(row["Address"]),
      city: cleanString(row["City"]),
      state: cleanString(row["State"]),
      zip_code: cleanZip(row["Zip Code"] || row["ZIP Code"]),
      county: cleanString(row["County Name"] || row["County"]),
      phone: cleanPhone(row["Phone Number"]),
      website: "",
      email: "",
      npi: "",
      medicare_accepted: "TRUE",
      medicaid_accepted: "TRUE",
      private_insurance_accepted: "TRUE",
      veterans_affairs_accepted: "TRUE",
      total_beds: "",
      ownership_type: cleanString(row["Ownership Type"]),
      quality_rating: cleanString(row["Quality of patient care star rating"] || row["Overall Rating"]),
      services_offered: "Hospice Care;Palliative Care;Pain Management;Bereavement Support;Spiritual Care",
      specialties: "End-of-Life Care;Cancer Care;Dementia Care;Cardiac Care",
      latitude: "",
      longitude: "",
      description: "Medicare-certified hospice providing compassionate end-of-life care and support",
      best_for: "Individuals with terminal illness seeking comfort care and family support",
      urgency_level: "high",
      location_type: "local",
      states: cleanString(row["State"]),
      audience: "caregiver;patient;family",
      living_situation: "independent;with_family;facility",
      cost: "Fully covered by Medicare Hospice Benefit",
      source_authority: "CMS",
      provider_type: "hospice",
      conditions: "chronic;medical_change;multiple",
      staffing_rating: "",
      total_nurse_hours_per_resident_per_day: "",
      rn_hours_per_resident_per_day: "",
      lpn_hours_per_resident_per_day: "",
      cna_hours_per_resident_per_day: "",
      weekend_nurse_hours_per_resident_per_day: "",
      weekend_rn_hours_per_resident_per_day: "",
      total_nurse_staff_turnover: "",
      rn_turnover: "",
      case_mix_total_nurse_hours: "",
      case_mix_rn_hours: "",
      health_inspection_rating: "",
      quality_measure_rating: "",
      number_of_facility_reported_incidents: "",
      number_of_substantiated_complaints: "",
      number_of_certified_beds: "",
    };
  });

  const outputPath = "data/cms/processed/hospice-processed.csv";
  fs.writeFileSync(outputPath, stringify(processed, { header: true }));

  console.log(`✅ Processed ${processed.length} hospice providers`);
  return processed.length;
}

// Main execution
console.log("🚀 Processing CMS datasets...");

try {
  let totalProcessed = 0;

  totalProcessed += processHomeHealthAgencies();
  totalProcessed += processNursingHomes();
  totalProcessed += processHospiceProviders();
  totalProcessed += processHospitals();

  console.log(`\n✨ Processing complete!`);
  console.log(`📊 Total records processed: ${totalProcessed}`);
  console.log(`\n📂 Processed files saved in data/cms/processed/`);
  console.log(`\n⚠️  Important next steps:`);
  console.log(`   1. Geocode addresses to get lat/long coordinates`);
  console.log(`      Run: pnpm tsx scripts/geocode-addresses.ts`);
  console.log(`   2. Import to database`);
  console.log(`      Run: pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/[file].csv`);
  console.log(`   3. Compute proximity to medical systems (if coordinates available)`);
  console.log(`      Add --compute-proximity flag to import command`);

  process.exit(0);
} catch (error) {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
}
