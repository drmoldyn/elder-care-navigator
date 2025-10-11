#!/usr/bin/env tsx
/**
 * Process CMS Hospice Quality Data
 *
 * This script:
 * 1. Reads CMS hospice quality CSV files
 * 2. Normalizes quality measures and CAHPS survey data
 * 3. Calculates aggregate ratings
 * 4. Outputs processed CSVs ready for import
 *
 * Input files (from download script):
 *   - hospice-general-*.csv (provider info + star ratings)
 *   - hospice-cahps-*.csv (CAHPS survey measures)
 *   - hospice-quality-measures-*.csv (individual quality metrics)
 *   - hospice-service-area-*.csv (ZIP code coverage)
 *
 * Output files:
 *   - data/cms/processed/hospice-quality-processed.csv (for resources table updates)
 *   - data/cms/processed/hospice-cahps-processed.csv (for hospice_cahps table)
 *   - data/cms/processed/hospice-metrics-processed.csv (for hospice_quality_metrics table)
 *
 * Usage:
 *   pnpm tsx scripts/process-hospice-quality.ts [refresh-date]
 *   Example: pnpm tsx scripts/process-hospice-quality.ts Aug2025
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const REFRESH_DATE = process.argv[2] || "Aug2025";
const INPUT_DIR = "data/cms/raw";
const OUTPUT_DIR = "data/cms/processed";

interface HospiceGeneralRow {
  "CMS Certification Number (CCN)"?: string;
  "Facility Name"?: string;
  "Address"?: string;
  "City"?: string;
  "State"?: string;
  "Zip Code"?: string;
  "County Name"?: string;
  "Phone Number"?: string;
  "Quality of patient care star rating"?: string;
  "Quality of patient care footnote"?: string;
  "Quality of caregiver experience star rating"?: string;
  "Quality of caregiver experience footnote"?: string;
  "Ownership Type"?: string;
  "Offers nursing care services"?: string;
  [key: string]: string | undefined;
}

interface HospiceCAHPSRow {
  "CMS Certification Number (CCN)"?: string;
  "Facility Name"?: string;
  "Measure Name"?: string;
  "Measure Code"?: string;
  "Score"?: string;
  "Footnote"?: string;
  "Number of Completed Surveys"?: string;
  "Survey Response Rate Percent"?: string;
  "Measure Start Date"?: string;
  "Measure End Date"?: string;
  [key: string]: string | undefined;
}

interface HospiceQualityMeasureRow {
  "CMS Certification Number (CCN)"?: string;
  "Facility Name"?: string;
  "Measure Name"?: string;
  "Measure Code"?: string;
  "Score"?: string;
  "Footnote"?: string;
  "Measure Start Date"?: string;
  "Measure End Date"?: string;
  [key: string]: string | undefined;
}

interface HospiceServiceAreaRow {
  "CMS Certification Number (CCN)"?: string;
  "Facility Name"?: string;
  "Zip Code"?: string;
  "County Name"?: string;
  "State"?: string;
  [key: string]: string | undefined;
}

interface ProcessedQualityRow {
  ccn: string;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  phone: string;
  ownership_type: string;

  // Star ratings
  hospice_quality_star: string;
  hospice_cahps_star: string;

  // Key quality measures (will be populated from quality measures file)
  hospice_pain_management_percent: string;
  hospice_symptom_management_percent: string;
  hospice_emotional_support_percent: string;
  hospice_willing_to_recommend_percent: string;
  hospice_communication_percent: string;
  hospice_getting_timely_help_percent: string;
  hospice_treating_with_respect_percent: string;
  hospice_medication_review_percent: string;
  hospice_discussion_of_beliefs_percent: string;
  hospice_chemotherapy_in_last_2_weeks: string;

  // Survey metadata
  hospice_cahps_survey_count: string;
  hospice_cahps_response_rate: string;

  // Service area
  hospice_service_area_counties: string;
  hospice_accepts_pediatric: string;

  // Reporting periods
  hospice_quality_period: string;
  hospice_cahps_period: string;
}

interface ProcessedCAHPSRow {
  ccn: string;
  survey_measure: string;
  measure_code: string;
  score: string;
  top_box_percentage: string;
  reporting_period: string;
  number_of_completed_surveys: string;
  response_rate: string;
  footnote: string;
}

interface ProcessedMetricRow {
  ccn: string;
  metric_name: string;
  metric_value: string;
  metric_type: string;
  reporting_period: string;
  measure_start_date: string;
  measure_end_date: string;
  numerator: string;
  denominator: string;
  footnote: string;
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

function cleanNumeric(value: string | undefined): string {
  if (!value || value.trim() === "" || value === "Not Available") return "";
  const cleaned = value.replace(/[^\d.-]/g, "");
  return cleaned;
}

function determineMetricType(measureName: string): string {
  const name = measureName.toLowerCase();

  if (name.includes("pain") || name.includes("symptom") || name.includes("dyspnea")) {
    return "outcome";
  } else if (name.includes("chemotherapy") || name.includes("treatment")) {
    return "process";
  } else if (name.includes("discuss") || name.includes("preference")) {
    return "process";
  } else if (name.includes("visit") || name.includes("staff")) {
    return "structural";
  }

  return "process"; // default
}

function buildReportingPeriod(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return REFRESH_DATE;

  // Extract quarter and year from dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startQ = Math.floor(start.getMonth() / 3) + 1;
  const endQ = Math.floor(end.getMonth() / 3) + 1;

  if (start.getFullYear() === end.getFullYear()) {
    return `Q${startQ}-Q${endQ} ${start.getFullYear()}`;
  } else {
    return `Q${startQ} ${start.getFullYear()} - Q${endQ} ${end.getFullYear()}`;
  }
}

console.log("\n🏥 Processing CMS Hospice Quality Data");
console.log("=====================================\n");

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ============================================================================
// 1. PROCESS HOSPICE GENERAL INFORMATION (Base Provider Data)
// ============================================================================

console.log("📋 Step 1: Processing Hospice General Information...");

const generalFile = path.join(INPUT_DIR, `hospice-general-${REFRESH_DATE}.csv`);
if (!fs.existsSync(generalFile)) {
  console.error(`❌ File not found: ${generalFile}`);
  process.exit(1);
}

const generalContent = fs.readFileSync(generalFile, "utf-8");
const generalRecords: HospiceGeneralRow[] = parse(generalContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`   Found ${generalRecords.length} hospice providers`);

// Create a map for quick lookup
const providersMap = new Map<string, ProcessedQualityRow>();

for (const row of generalRecords) {
  const ccn = cleanString(row["CMS Certification Number (CCN)"]);
  if (!ccn) continue;

  providersMap.set(ccn, {
    ccn,
    facility_name: cleanString(row["Facility Name"]),
    address: cleanString(row["Address"]),
    city: cleanString(row["City"]),
    state: cleanString(row["State"]),
    zip_code: cleanZip(row["Zip Code"]),
    county: cleanString(row["County Name"]),
    phone: cleanPhone(row["Phone Number"]),
    ownership_type: cleanString(row["Ownership Type"]),

    hospice_quality_star: cleanNumeric(row["Quality of patient care star rating"]),
    hospice_cahps_star: cleanNumeric(row["Quality of caregiver experience star rating"]),

    // Initialize measure fields (will be populated from other files)
    hospice_pain_management_percent: "",
    hospice_symptom_management_percent: "",
    hospice_emotional_support_percent: "",
    hospice_willing_to_recommend_percent: "",
    hospice_communication_percent: "",
    hospice_getting_timely_help_percent: "",
    hospice_treating_with_respect_percent: "",
    hospice_medication_review_percent: "",
    hospice_discussion_of_beliefs_percent: "",
    hospice_chemotherapy_in_last_2_weeks: "",

    hospice_cahps_survey_count: "",
    hospice_cahps_response_rate: "",
    hospice_service_area_counties: "",
    hospice_accepts_pediatric: "FALSE", // default
    hospice_quality_period: REFRESH_DATE,
    hospice_cahps_period: "",
  });
}

console.log(`   ✅ Processed ${providersMap.size} unique providers\n`);

// ============================================================================
// 2. PROCESS CAHPS SURVEY DATA
// ============================================================================

console.log("📋 Step 2: Processing CAHPS Survey Data...");

const cahpsFile = path.join(INPUT_DIR, `hospice-cahps-${REFRESH_DATE}.csv`);
const cahpsProcessed: ProcessedCAHPSRow[] = [];

if (fs.existsSync(cahpsFile)) {
  const cahpsContent = fs.readFileSync(cahpsFile, "utf-8");
  const cahpsRecords: HospiceCAHPSRow[] = parse(cahpsContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${cahpsRecords.length} CAHPS measure records`);

  // Track survey counts by provider
  const surveyCountMap = new Map<string, { count: number; rate: number }>();

  for (const row of cahpsRecords) {
    const ccn = cleanString(row["CMS Certification Number (CCN)"]);
    const measureName = cleanString(row["Measure Name"]);
    const score = cleanNumeric(row["Score"]);

    if (!ccn || !measureName) continue;

    // Track survey counts
    const surveyCount = cleanNumeric(row["Number of Completed Surveys"]);
    const responseRate = cleanNumeric(row["Survey Response Rate Percent"]);
    if (surveyCount && !surveyCountMap.has(ccn)) {
      surveyCountMap.set(ccn, {
        count: parseInt(surveyCount) || 0,
        rate: parseFloat(responseRate) || 0,
      });
    }

    // Map specific CAHPS measures to provider record
    const provider = providersMap.get(ccn);
    if (provider) {
      const measureLower = measureName.toLowerCase();

      if (measureLower.includes("willing to recommend")) {
        provider.hospice_willing_to_recommend_percent = score;
      } else if (measureLower.includes("communication")) {
        provider.hospice_communication_percent = score;
      } else if (measureLower.includes("getting timely") || measureLower.includes("timely help")) {
        provider.hospice_getting_timely_help_percent = score;
      } else if (measureLower.includes("treating") && measureLower.includes("respect")) {
        provider.hospice_treating_with_respect_percent = score;
      } else if (measureLower.includes("emotional") || measureLower.includes("spiritual")) {
        provider.hospice_emotional_support_percent = score;
      }

      // Set reporting period
      const period = buildReportingPeriod(
        row["Measure Start Date"],
        row["Measure End Date"]
      );
      provider.hospice_cahps_period = period;
    }

    // Add to processed CAHPS output
    cahpsProcessed.push({
      ccn,
      survey_measure: measureName,
      measure_code: cleanString(row["Measure Code"]),
      score,
      top_box_percentage: score, // CMS reports as top-box %
      reporting_period: buildReportingPeriod(
        row["Measure Start Date"],
        row["Measure End Date"]
      ),
      number_of_completed_surveys: cleanNumeric(row["Number of Completed Surveys"]),
      response_rate: cleanNumeric(row["Survey Response Rate Percent"]),
      footnote: cleanString(row["Footnote"]),
    });
  }

  // Update survey counts in provider records
  for (const [ccn, data] of surveyCountMap) {
    const provider = providersMap.get(ccn);
    if (provider) {
      provider.hospice_cahps_survey_count = data.count.toString();
      provider.hospice_cahps_response_rate = data.rate.toString();
    }
  }

  console.log(`   ✅ Processed ${cahpsProcessed.length} CAHPS measures\n`);
} else {
  console.log(`   ⏭️  CAHPS file not found, skipping\n`);
}

// ============================================================================
// 3. PROCESS QUALITY MEASURES (HIS/HOPE)
// ============================================================================

console.log("📋 Step 3: Processing Quality Measures...");

const measuresFile = path.join(INPUT_DIR, `hospice-quality-measures-${REFRESH_DATE}.csv`);
const metricsProcessed: ProcessedMetricRow[] = [];

if (fs.existsSync(measuresFile)) {
  const measuresContent = fs.readFileSync(measuresFile, "utf-8");
  const measuresRecords: HospiceQualityMeasureRow[] = parse(measuresContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${measuresRecords.length} quality measure records`);

  for (const row of measuresRecords) {
    const ccn = cleanString(row["CMS Certification Number (CCN)"]);
    const measureName = cleanString(row["Measure Name"]);
    const score = cleanNumeric(row["Score"]);

    if (!ccn || !measureName) continue;

    // Map specific measures to provider record
    const provider = providersMap.get(ccn);
    if (provider) {
      const measureLower = measureName.toLowerCase();

      if (measureLower.includes("pain") && measureLower.includes("control")) {
        provider.hospice_pain_management_percent = score;
      } else if (measureLower.includes("symptom")) {
        provider.hospice_symptom_management_percent = score;
      } else if (measureLower.includes("medication") && measureLower.includes("review")) {
        provider.hospice_medication_review_percent = score;
      } else if (measureLower.includes("discussion") && measureLower.includes("belief")) {
        provider.hospice_discussion_of_beliefs_percent = score;
      } else if (measureLower.includes("chemotherapy") && measureLower.includes("last")) {
        provider.hospice_chemotherapy_in_last_2_weeks = score;
      }
    }

    // Add to processed metrics output
    metricsProcessed.push({
      ccn,
      metric_name: measureName,
      metric_value: score,
      metric_type: determineMetricType(measureName),
      reporting_period: buildReportingPeriod(
        row["Measure Start Date"],
        row["Measure End Date"]
      ),
      measure_start_date: cleanString(row["Measure Start Date"]),
      measure_end_date: cleanString(row["Measure End Date"]),
      numerator: "",
      denominator: "",
      footnote: cleanString(row["Footnote"]),
    });
  }

  console.log(`   ✅ Processed ${metricsProcessed.length} quality metrics\n`);
} else {
  console.log(`   ⏭️  Quality measures file not found, skipping\n`);
}

// ============================================================================
// 4. PROCESS SERVICE AREA (OPTIONAL)
// ============================================================================

console.log("📋 Step 4: Processing Service Area Data...");

const serviceAreaFile = path.join(INPUT_DIR, `hospice-service-area-${REFRESH_DATE}.csv`);

if (fs.existsSync(serviceAreaFile)) {
  const serviceAreaContent = fs.readFileSync(serviceAreaFile, "utf-8");
  const serviceAreaRecords: HospiceServiceAreaRow[] = parse(serviceAreaContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${serviceAreaRecords.length} service area records`);

  // Group counties by CCN
  const serviceAreaMap = new Map<string, Set<string>>();

  for (const row of serviceAreaRecords) {
    const ccn = cleanString(row["CMS Certification Number (CCN)"]);
    const county = cleanString(row["County Name"]);

    if (!ccn || !county) continue;

    if (!serviceAreaMap.has(ccn)) {
      serviceAreaMap.set(ccn, new Set());
    }
    serviceAreaMap.get(ccn)!.add(county);
  }

  // Update provider records with county arrays
  for (const [ccn, counties] of serviceAreaMap) {
    const provider = providersMap.get(ccn);
    if (provider) {
      // Format as PostgreSQL array string
      const countyArray = Array.from(counties).sort();
      provider.hospice_service_area_counties = `{${countyArray.map(c => `"${c}"`).join(",")}}`;
    }
  }

  console.log(`   ✅ Processed service areas for ${serviceAreaMap.size} providers\n`);
} else {
  console.log(`   ⏭️  Service area file not found, skipping\n`);
}

// ============================================================================
// 5. WRITE OUTPUT FILES
// ============================================================================

console.log("📝 Writing output files...\n");

// Write hospice quality processed (for resources table updates)
const qualityOutputFile = path.join(OUTPUT_DIR, "hospice-quality-processed.csv");
const qualityOutput = Array.from(providersMap.values());
fs.writeFileSync(qualityOutputFile, stringify(qualityOutput, { header: true }));
console.log(`   ✅ Wrote ${qualityOutput.length} records to hospice-quality-processed.csv`);

// Write CAHPS processed (for hospice_cahps table)
if (cahpsProcessed.length > 0) {
  const cahpsOutputFile = path.join(OUTPUT_DIR, "hospice-cahps-processed.csv");
  fs.writeFileSync(cahpsOutputFile, stringify(cahpsProcessed, { header: true }));
  console.log(`   ✅ Wrote ${cahpsProcessed.length} records to hospice-cahps-processed.csv`);
}

// Write metrics processed (for hospice_quality_metrics table)
if (metricsProcessed.length > 0) {
  const metricsOutputFile = path.join(OUTPUT_DIR, "hospice-metrics-processed.csv");
  fs.writeFileSync(metricsOutputFile, stringify(metricsProcessed, { header: true }));
  console.log(`   ✅ Wrote ${metricsProcessed.length} records to hospice-metrics-processed.csv`);
}

// ============================================================================
// 6. SUMMARY STATISTICS
// ============================================================================

console.log("\n📊 Processing Summary");
console.log("=====================================\n");

const withQualityStar = qualityOutput.filter(p => p.hospice_quality_star).length;
const withCAHPSStar = qualityOutput.filter(p => p.hospice_cahps_star).length;
const withPainMgmt = qualityOutput.filter(p => p.hospice_pain_management_percent).length;
const withServiceArea = qualityOutput.filter(p => p.hospice_service_area_counties).length;

console.log(`Total Providers: ${qualityOutput.length}`);
console.log(`  - With Quality Star Rating: ${withQualityStar} (${((withQualityStar/qualityOutput.length)*100).toFixed(1)}%)`);
console.log(`  - With CAHPS Star Rating: ${withCAHPSStar} (${((withCAHPSStar/qualityOutput.length)*100).toFixed(1)}%)`);
console.log(`  - With Pain Management Data: ${withPainMgmt} (${((withPainMgmt/qualityOutput.length)*100).toFixed(1)}%)`);
console.log(`  - With Service Area Data: ${withServiceArea} (${((withServiceArea/qualityOutput.length)*100).toFixed(1)}%)`);

console.log(`\nCAHPS Measures: ${cahpsProcessed.length}`);
console.log(`Quality Metrics: ${metricsProcessed.length}`);

console.log("\n✨ Processing complete!");
console.log("\n📂 Output files saved in data/cms/processed/");
console.log("\n🔄 Next step:");
console.log("   pnpm tsx scripts/import-hospice-quality.ts");
console.log("");
