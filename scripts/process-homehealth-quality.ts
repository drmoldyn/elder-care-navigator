#!/usr/bin/env tsx
/**
 * Process CMS Home Health Quality datasets
 *
 * This script:
 * 1. Reads raw CMS Home Health CSV files
 * 2. Extracts quality metrics, patient experience (CAHPS), and service area data
 * 3. Pivots wide-format quality measures into normalized rows
 * 4. Calculates aggregate star ratings where needed
 * 5. Outputs processed CSV files ready for database import
 *
 * Phase 2: Home Health Quality Metrics
 *
 * Usage:
 *   pnpm tsx scripts/process-homehealth-quality.ts
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import path from "path";

// ===== Type Definitions =====

interface HomeHealthAgencyRow {
  "CMS Certification Number (CCN)"?: string;
  "Provider Name"?: string;
  "Address"?: string;
  "City"?: string;
  "State"?: string;
  "Zip Code"?: string;
  "County Name"?: string;
  "Phone Number"?: string;
  "Ownership Type"?: string;
  "Date Certified"?: string;

  // Quality ratings
  "Quality of patient care star rating"?: string;
  "HHCAHPS star rating"?: string; // Patient experience

  // Quality measures (percentages)
  "How often patients got care in a timely manner"?: string;
  "How often patients can take their drugs correctly by mouth"?: string;
  "How often patients got better at bathing"?: string;
  "How often patients got better at walking or moving around"?: string;
  "How often patients got better at getting in and out of bed"?: string;
  "How often patients got better at breathing"?: string;
  "How often home health patients had to be admitted to the hospital"?: string;
  "How often patients receiving home health care needed any urgent, unplanned care in the ER without hospital admission"?: string;

  // CAHPS measures
  "How often the home health team gave care in a professional way - star rating"?: string;
  "How patients rated the overall care from the home health agency - star rating"?: string;
  "How often the home health team communicated well with patients - star rating"?: string;
  "How often the home health team discussed medicines, pain, and home safety with patients - star rating"?: string;
  "Willingness to recommend the agency - star rating"?: string;

  [key: string]: string | undefined;
}

interface ProcessedAgencyRow {
  ccn: string;
  provider_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  phone: string;
  ownership_type: string;
  date_certified: string;

  // Star ratings
  quality_star: string;
  patient_experience_star: string;

  // Quality measures
  timely_care_percent: string;
  manages_meds_percent: string;
  improvement_bathing_percent: string;
  improvement_walking_percent: string;
  improvement_bed_transfer_percent: string;
  improvement_breathing_percent: string;
  acute_hospitalization_percent: string;
  er_use_percent: string;

  // CAHPS measures
  professional_care_star: string;
  overall_care_rating_star: string;
  communication_star: string;
  discussion_care_star: string;
  recommend_star: string;
}

interface QualityMetricRow {
  ccn: string;
  metric_name: string;
  metric_category: string;
  metric_value: string;
  metric_type: string;
  reporting_period: string;
  reporting_start_date: string;
  reporting_end_date: string;
  data_source: string;
}

interface ServiceAreaRow {
  "CMS Certification Number (CCN)"?: string;
  "Zip Code"?: string;
  "County Name"?: string;
  "State"?: string;
  [key: string]: string | undefined;
}

interface ProcessedServiceArea {
  ccn: string;
  zip_codes: string;
  counties: string;
  states: string;
}

// ===== Helper Functions =====

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

function parseNumeric(value: string | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/[^\d.]/g, "");
  return cleaned || "";
}

function parseStarRating(value: string | undefined): string {
  if (!value) return "";
  // Extract numeric value from strings like "4 out of 5 stars" or just "4"
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : "";
}

function getLatestFile(pattern: string): string | null {
  const dir = "data/cms/raw";
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter(f => f.includes(pattern) && f.endsWith('.csv'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(dir, files[0]) : null;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `Q${quarter} ${year}`;
}

// ===== Processing Functions =====

function processHomeHealthAgencies(): ProcessedAgencyRow[] {
  console.log("\n📋 Processing Home Health Agencies with Quality Ratings...");

  const inputPath = getLatestFile("homehealth-agencies");
  if (!inputPath || !fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return [];
  }

  console.log(`   Reading: ${inputPath}`);

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: HomeHealthAgencyRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const processed: ProcessedAgencyRow[] = records.map((row) => {
    return {
      ccn: cleanString(row["CMS Certification Number (CCN)"]),
      provider_name: cleanString(row["Provider Name"]),
      address: cleanString(row["Address"]),
      city: cleanString(row["City"]),
      state: cleanString(row["State"]),
      zip_code: cleanZip(row["Zip Code"]),
      county: cleanString(row["County Name"]),
      phone: cleanPhone(row["Phone Number"]),
      ownership_type: cleanString(row["Ownership Type"]),
      date_certified: cleanString(row["Date Certified"]),

      quality_star: parseStarRating(row["Quality of patient care star rating"]),
      patient_experience_star: parseStarRating(row["HHCAHPS star rating"]),

      timely_care_percent: parseNumeric(row["How often patients got care in a timely manner"]),
      manages_meds_percent: parseNumeric(row["How often patients can take their drugs correctly by mouth"]),
      improvement_bathing_percent: parseNumeric(row["How often patients got better at bathing"]),
      improvement_walking_percent: parseNumeric(row["How often patients got better at walking or moving around"]),
      improvement_bed_transfer_percent: parseNumeric(row["How often patients got better at getting in and out of bed"]),
      improvement_breathing_percent: parseNumeric(row["How often patients got better at breathing"]),
      acute_hospitalization_percent: parseNumeric(row["How often home health patients had to be admitted to the hospital"]),
      er_use_percent: parseNumeric(row["How often patients receiving home health care needed any urgent, unplanned care in the ER without hospital admission"]),

      professional_care_star: parseStarRating(row["How often the home health team gave care in a professional way - star rating"]),
      overall_care_rating_star: parseStarRating(row["How patients rated the overall care from the home health agency - star rating"]),
      communication_star: parseStarRating(row["How often the home health team communicated well with patients - star rating"]),
      discussion_care_star: parseStarRating(row["How often the home health team discussed medicines, pain, and home safety with patients - star rating"]),
      recommend_star: parseStarRating(row["Willingness to recommend the agency - star rating"]),
    };
  });

  console.log(`✅ Processed ${processed.length} home health agencies`);
  return processed;
}

function pivotQualityMetrics(agencies: ProcessedAgencyRow[]): QualityMetricRow[] {
  console.log("\n📊 Pivoting quality metrics to normalized format...");

  const metrics: QualityMetricRow[] = [];
  const reportingPeriod = getCurrentQuarter();

  agencies.forEach((agency) => {
    const ccn = agency.ccn;
    if (!ccn) return;

    // Helper to add metric
    const addMetric = (
      name: string,
      value: string,
      category: string,
      type: string
    ) => {
      if (value) {
        metrics.push({
          ccn,
          metric_name: name,
          metric_category: category,
          metric_value: value,
          metric_type: type,
          reporting_period: reportingPeriod,
          reporting_start_date: "",
          reporting_end_date: "",
          data_source: "CMS_HOME_HEALTH_COMPARE",
        });
      }
    };

    // Star ratings
    addMetric("overall_quality_star", agency.quality_star, "quality_of_care", "star_rating");
    addMetric("patient_experience_star", agency.patient_experience_star, "patient_experience", "star_rating");

    // Quality of care percentages
    addMetric("timely_care", agency.timely_care_percent, "quality_of_care", "percentage");
    addMetric("manages_medications", agency.manages_meds_percent, "quality_of_care", "percentage");
    addMetric("improvement_bathing", agency.improvement_bathing_percent, "quality_of_care", "percentage");
    addMetric("improvement_walking", agency.improvement_walking_percent, "quality_of_care", "percentage");
    addMetric("improvement_bed_transfer", agency.improvement_bed_transfer_percent, "quality_of_care", "percentage");
    addMetric("improvement_breathing", agency.improvement_breathing_percent, "quality_of_care", "percentage");
    addMetric("acute_hospitalization", agency.acute_hospitalization_percent, "utilization", "percentage");
    addMetric("emergency_room_use", agency.er_use_percent, "utilization", "percentage");

    // CAHPS star ratings
    addMetric("professional_care_star", agency.professional_care_star, "patient_experience", "star_rating");
    addMetric("overall_care_rating_star", agency.overall_care_rating_star, "patient_experience", "star_rating");
    addMetric("communication_star", agency.communication_star, "patient_experience", "star_rating");
    addMetric("discussion_care_star", agency.discussion_care_star, "patient_experience", "star_rating");
    addMetric("recommend_star", agency.recommend_star, "patient_experience", "star_rating");
  });

  console.log(`✅ Created ${metrics.length} quality metric records`);
  return metrics;
}

function processServiceAreas(): ProcessedServiceArea[] {
  console.log("\n📍 Processing Home Health Service Areas...");

  const inputPath = getLatestFile("homehealth-service-areas");
  if (!inputPath || !fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return [];
  }

  console.log(`   Reading: ${inputPath}`);

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: ServiceAreaRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Group by CCN to aggregate service areas
  const serviceAreaMap = new Map<string, { zips: Set<string>; counties: Set<string>; states: Set<string> }>();

  records.forEach((row) => {
    const ccn = cleanString(row["CMS Certification Number (CCN)"]);
    const zip = cleanZip(row["Zip Code"]);
    const county = cleanString(row["County Name"]);
    const state = cleanString(row["State"]);

    if (!ccn) return;

    if (!serviceAreaMap.has(ccn)) {
      serviceAreaMap.set(ccn, {
        zips: new Set(),
        counties: new Set(),
        states: new Set(),
      });
    }

    const areas = serviceAreaMap.get(ccn)!;
    if (zip) areas.zips.add(zip);
    if (county) areas.counties.add(county);
    if (state) areas.states.add(state);
  });

  // Convert to array
  const processed: ProcessedServiceArea[] = Array.from(serviceAreaMap.entries()).map(
    ([ccn, areas]) => ({
      ccn,
      zip_codes: Array.from(areas.zips).sort().join(";"),
      counties: Array.from(areas.counties).sort().join(";"),
      states: Array.from(areas.states).sort().join(";"),
    })
  );

  console.log(`✅ Processed service areas for ${processed.length} agencies`);
  return processed;
}

// ===== Main Execution =====

console.log("🚀 Processing CMS Home Health Quality datasets...");
console.log("================================================");

try {
  // Ensure output directory exists
  const outputDir = "data/cms/processed";
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Process agencies with quality ratings
  const agencies = processHomeHealthAgencies();
  if (agencies.length > 0) {
    const agencyOutputPath = path.join(outputDir, "homehealth-quality-processed.csv");
    fs.writeFileSync(agencyOutputPath, stringify(agencies, { header: true }));
    console.log(`   Saved: ${agencyOutputPath}`);
  }

  // 2. Pivot quality metrics to normalized format
  const qualityMetrics = pivotQualityMetrics(agencies);
  if (qualityMetrics.length > 0) {
    const metricsOutputPath = path.join(outputDir, "homehealth-quality-metrics.csv");
    fs.writeFileSync(metricsOutputPath, stringify(qualityMetrics, { header: true }));
    console.log(`   Saved: ${metricsOutputPath}`);
  }

  // 3. Process service areas
  const serviceAreas = processServiceAreas();
  if (serviceAreas.length > 0) {
    const serviceAreaOutputPath = path.join(outputDir, "homehealth-service-areas.csv");
    fs.writeFileSync(serviceAreaOutputPath, stringify(serviceAreas, { header: true }));
    console.log(`   Saved: ${serviceAreaOutputPath}`);
  }

  console.log("\n✨ Processing complete!");
  console.log("================================================");
  console.log("\n📊 Summary:");
  console.log(`   - Agencies processed: ${agencies.length}`);
  console.log(`   - Quality metrics: ${qualityMetrics.length}`);
  console.log(`   - Service areas: ${serviceAreas.length}`);
  console.log("\n📂 Output files in: data/cms/processed/");
  console.log("\n🔄 Next steps:");
  console.log("   1. Review processed CSV files");
  console.log("   2. Apply database migration: 0010_home_health_quality.sql");
  console.log("   3. Import data: pnpm tsx scripts/import-homehealth-quality.ts");

  process.exit(0);
} catch (error) {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
}
