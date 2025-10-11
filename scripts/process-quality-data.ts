#!/usr/bin/env tsx
/**
 * Process CMS Quality & Inspection Data
 *
 * This script:
 * 1. Reads raw CMS CSV files (deficiencies, penalties, quality measures)
 * 2. Normalizes and cleans the data
 * 3. Maps CMS fields to our database schema
 * 4. Outputs processed CSV files ready for import
 *
 * Usage:
 *   pnpm tsx scripts/process-quality-data.ts
 */

import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

// ============================================================================
// Type Definitions
// ============================================================================

interface CmsDeficiencyRow {
  "Federal Provider Number"?: string;
  "Provider Name"?: string;
  "Deficiency Tag"?: string;
  "Tag Description"?: string;
  "Scope Severity Code"?: string;
  "Deficiency Corrected"?: string;
  "Correction Date"?: string;
  "Inspection Date"?: string;
  "Survey Type"?: string;
  "Inspection ID"?: string;
  "Standard Survey Health Deficiency"?: string;
  "Complaint Deficiency"?: string;
  "Scope"?: string;
  "Severity"?: string;
  "Filedate"?: string;
  [key: string]: string | undefined;
}

interface CmsPenaltyRow {
  "Federal Provider Number"?: string;
  "Provider Name"?: string;
  "Provider Address"?: string;
  "Provider City"?: string;
  "Provider State"?: string;
  "Provider Zip Code"?: string;
  "Penalty Type"?: string;
  "Penalty Date"?: string;
  "Fine Amount"?: string;
  "Payment Denial Start Date"?: string;
  "Payment Denial End Date"?: string;
  "Processing Date"?: string;
  "Filedate"?: string;
  [key: string]: string | undefined;
}

interface CmsQualityMeasureRow {
  "Federal Provider Number"?: string;
  "Provider Name"?: string;
  "Measure Code"?: string;
  "Measure Description"?: string;
  "Four Quarter Average Score"?: string;
  "Score"?: string;
  "Denominator"?: string;
  "Numerator"?: string;
  "Footnote"?: string;
  "Performance Rating"?: string;
  "Measure Period"?: string;
  "Quarter"?: string;
  "Filedate"?: string;
  [key: string]: string | undefined;
}

interface ProcessedDeficiency {
  provider_id: string;
  provider_name: string;
  deficiency_tag: string;
  deficiency_description: string;
  scope: string;
  severity: string;
  scope_severity_code: string;
  survey_date: string;
  survey_type: string;
  inspection_id: string;
  correction_date: string;
  is_corrected: string;
  displayed_on_care_compare: string;
  data_as_of: string;
}

interface ProcessedPenalty {
  provider_id: string;
  provider_name: string;
  provider_address: string;
  provider_city: string;
  provider_state: string;
  provider_zip: string;
  penalty_type: string;
  penalty_date: string;
  fine_amount: string;
  payment_denial_start_date: string;
  payment_denial_end_date: string;
  processing_date: string;
  data_as_of: string;
}

interface ProcessedQualityMetric {
  provider_id: string;
  provider_name: string;
  measure_code: string;
  measure_name: string;
  measure_period_start: string;
  measure_period_end: string;
  score: string;
  denominator: string;
  numerator: string;
  performance_category: string;
  footnote: string;
  data_as_of: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function cleanString(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

function parseDate(dateStr: string | undefined): string {
  if (!dateStr) return "";

  // Try to parse various date formats
  const cleaned = dateStr.trim();
  if (!cleaned || cleaned === "N/A" || cleaned === "Not Available") return "";

  try {
    // Handle MM/DD/YYYY format
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [month, day, year] = cleaned.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Handle YYYY-MM-DD format (already correct)
    if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return cleaned;
    }

    // Handle YYYYMMDD format
    if (cleaned.match(/^\d{8}$/)) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }

    return "";
  } catch {
    console.warn(`Failed to parse date: ${dateStr}`);
    return "";
  }
}

function parseNumeric(value: string | undefined): string {
  if (!value) return "";
  const cleaned = value.trim();
  if (cleaned === "" || cleaned === "N/A" || cleaned === "Not Available") return "";

  // Remove commas and dollar signs
  const numeric = cleaned.replace(/[$,]/g, "");
  if (isNaN(Number(numeric))) return "";

  return numeric;
}

function parseBoolean(value: string | undefined): string {
  if (!value) return "false";
  const cleaned = value.trim().toLowerCase();
  return cleaned === "y" || cleaned === "yes" || cleaned === "true" ? "true" : "false";
}

function getScopeFromCode(code: string | undefined): string {
  if (!code) return "";

  // Scope codes: A-C = Pattern, D-F = Isolated, G-I = Widespread
  const firstChar = code.trim().toUpperCase()[0];
  if (["A", "B", "C"].includes(firstChar)) return "Pattern";
  if (["D", "E", "F"].includes(firstChar)) return "Isolated";
  if (["G", "H", "I"].includes(firstChar)) return "Widespread";

  return "";
}

function getSeverityFromCode(code: string | undefined): string {
  if (!code) return "";

  // Severity codes (second character): 1=No harm, 2=Minimal harm, 3=Actual harm, 4=Immediate jeopardy
  const firstChar = code.trim().toUpperCase()[0];

  if (["A", "D", "G"].includes(firstChar)) return "No actual harm with potential for minimal harm";
  if (["B", "E", "H"].includes(firstChar)) return "No actual harm with potential for more than minimal harm";
  if (["C", "F", "I"].includes(firstChar)) return "Actual harm";
  if (["J", "K", "L"].includes(firstChar)) return "Immediate jeopardy to resident health or safety";

  return "";
}

// ============================================================================
// Processing Functions
// ============================================================================

function processDeficiencies(): number {
  console.log("\n📋 Processing Health Deficiencies...");

  const inputPath = "data/cms/raw/health-deficiencies-latest.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return 0;
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: CmsDeficiencyRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} deficiency records`);

  const processed: ProcessedDeficiency[] = records
    .filter((row) => row["Federal Provider Number"]) // Must have provider ID
    .map((row) => {
      const scopeSeverityCode = cleanString(row["Scope Severity Code"]);

      return {
        provider_id: cleanString(row["Federal Provider Number"]),
        provider_name: cleanString(row["Provider Name"]),
        deficiency_tag: cleanString(row["Deficiency Tag"]),
        deficiency_description: cleanString(row["Tag Description"]),
        scope: cleanString(row["Scope"]) || getScopeFromCode(scopeSeverityCode),
        severity: cleanString(row["Severity"]) || getSeverityFromCode(scopeSeverityCode),
        scope_severity_code: scopeSeverityCode,
        survey_date: parseDate(row["Inspection Date"]),
        survey_type: cleanString(row["Survey Type"]),
        inspection_id: cleanString(row["Inspection ID"]),
        correction_date: parseDate(row["Correction Date"]),
        is_corrected: parseBoolean(row["Deficiency Corrected"]),
        displayed_on_care_compare: parseBoolean(row["Standard Survey Health Deficiency"]) || "true",
        data_as_of: parseDate(row["Filedate"]) || new Date().toISOString().split("T")[0],
      };
    });

  const outputPath = "data/cms/processed/deficiencies-processed.csv";
  fs.mkdirSync("data/cms/processed", { recursive: true });
  fs.writeFileSync(outputPath, stringify(processed, { header: true }));

  console.log(`✅ Processed ${processed.length} deficiencies`);
  console.log(`   Output: ${outputPath}`);

  return processed.length;
}

function processPenalties(): number {
  console.log("\n📋 Processing Penalties...");

  const inputPath = "data/cms/raw/penalties-latest.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return 0;
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: CmsPenaltyRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} penalty records`);

  const processed: ProcessedPenalty[] = records
    .filter((row) => row["Federal Provider Number"]) // Must have provider ID
    .map((row) => ({
      provider_id: cleanString(row["Federal Provider Number"]),
      provider_name: cleanString(row["Provider Name"]),
      provider_address: cleanString(row["Provider Address"]),
      provider_city: cleanString(row["Provider City"]),
      provider_state: cleanString(row["Provider State"]),
      provider_zip: cleanString(row["Provider Zip Code"]),
      penalty_type: cleanString(row["Penalty Type"]),
      penalty_date: parseDate(row["Penalty Date"]),
      fine_amount: parseNumeric(row["Fine Amount"]),
      payment_denial_start_date: parseDate(row["Payment Denial Start Date"]),
      payment_denial_end_date: parseDate(row["Payment Denial End Date"]),
      processing_date: parseDate(row["Processing Date"]),
      data_as_of: parseDate(row["Filedate"]) || new Date().toISOString().split("T")[0],
    }));

  const outputPath = "data/cms/processed/penalties-processed.csv";
  fs.writeFileSync(outputPath, stringify(processed, { header: true }));

  console.log(`✅ Processed ${processed.length} penalties`);
  console.log(`   Output: ${outputPath}`);

  // Summary statistics
  const totalFines = processed.reduce((sum, p) => sum + (parseFloat(p.fine_amount) || 0), 0);
  console.log(`   💰 Total fines: $${totalFines.toLocaleString()}`);

  return processed.length;
}

function processQualityMeasures(): number {
  console.log("\n📋 Processing Quality Measures...");

  const inputPath = "data/cms/raw/mds-quality-measures-latest.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return 0;
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: CmsQualityMeasureRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} quality measure records`);

  const processed: ProcessedQualityMetric[] = records
    .filter((row) => row["Federal Provider Number"]) // Must have provider ID
    .map((row) => {
      // Parse measure period (e.g., "Q4 2024" or "2024 Q4")
      const period = cleanString(row["Measure Period"] || row["Quarter"] || "");
      const { startDate, endDate } = parseMeasurePeriod(period);

      return {
        provider_id: cleanString(row["Federal Provider Number"]),
        provider_name: cleanString(row["Provider Name"]),
        measure_code: cleanString(row["Measure Code"]),
        measure_name: cleanString(row["Measure Description"]),
        measure_period_start: startDate,
        measure_period_end: endDate,
        score: parseNumeric(row["Four Quarter Average Score"] || row["Score"]),
        denominator: parseNumeric(row["Denominator"]),
        numerator: parseNumeric(row["Numerator"]),
        performance_category: cleanString(row["Performance Rating"]),
        footnote: cleanString(row["Footnote"]),
        data_as_of: parseDate(row["Filedate"]) || new Date().toISOString().split("T")[0],
      };
    });

  const outputPath = "data/cms/processed/quality-metrics-processed.csv";
  fs.writeFileSync(outputPath, stringify(processed, { header: true }));

  console.log(`✅ Processed ${processed.length} quality measures`);
  console.log(`   Output: ${outputPath}`);

  return processed.length;
}

function parseMeasurePeriod(period: string): { startDate: string; endDate: string } {
  if (!period) return { startDate: "", endDate: "" };

  // Try to extract year and quarter
  const yearMatch = period.match(/20\d{2}/);
  const quarterMatch = period.match(/Q([1-4])/i);

  if (!yearMatch) return { startDate: "", endDate: "" };

  const year = parseInt(yearMatch[0]);
  const quarter = quarterMatch ? parseInt(quarterMatch[1]) : 4; // Default to Q4

  // Calculate start and end dates for the quarter
  const quarterStarts = {
    1: `${year}-01-01`,
    2: `${year}-04-01`,
    3: `${year}-07-01`,
    4: `${year}-10-01`,
  };

  const quarterEnds = {
    1: `${year}-03-31`,
    2: `${year}-06-30`,
    3: `${year}-09-30`,
    4: `${year}-12-31`,
  };

  return {
    startDate: quarterStarts[quarter as keyof typeof quarterStarts] || "",
    endDate: quarterEnds[quarter as keyof typeof quarterEnds] || "",
  };
}

// ============================================================================
// Main Execution
// ============================================================================

console.log("🚀 Processing CMS Quality & Inspection Data...");

try {
  let totalProcessed = 0;

  totalProcessed += processDeficiencies();
  totalProcessed += processPenalties();
  totalProcessed += processQualityMeasures();

  console.log(`\n✨ Processing complete!`);
  console.log(`📊 Total records processed: ${totalProcessed.toLocaleString()}`);
  console.log(`\n📂 Processed files saved in data/cms/processed/`);
  console.log(`\n⚠️  Important next steps:`);
  console.log(`   1. Review processed files for data quality`);
  console.log(`   2. Run: pnpm tsx scripts/import-quality-data.ts`);
  console.log(`   3. Update resource quality summaries in database`);
  console.log(``);

  process.exit(0);
} catch (error) {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
}
