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

// Helpers to tolerate alternate header names (provider-data API vs medicare.gov)
function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.trim().toLowerCase()] = v;
  }
  return out;
}

function getField(rowLower: Record<string, unknown>, aliases: string[]): string | undefined {
  for (const a of aliases) {
    const key = a.trim().toLowerCase();
    if (rowLower[key] != null && String(rowLower[key]).trim() !== "") {
      return String(rowLower[key]);
    }
  }
  return undefined;
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

  const processed: ProcessedDeficiency[] = [];
  for (const r of records as any[]) {
    const row = normalizeRowKeys(r);
    const prov = getField(row, [
      "CMS Certification Number (CCN)",
      "Federal Provider Number",
      "federal provider number",
      "federal_provider_number",
      "federalprovider_number",
      "federal_provider_no",
    ]);
    if (!prov) continue;
    const scopeSeverityCode = cleanString(
      getField(row, ["Scope Severity Code", "scope_severity_code"]) || ""
    );
    processed.push({
      provider_id: cleanString(prov),
      provider_name: cleanString(getField(row, ["Provider Name", "provider_name"]) || ""),
      deficiency_tag: cleanString(getField(row, ["Deficiency Tag", "Deficiency Tag Number", "deficiency_tag"]) || ""),
      deficiency_description: cleanString(getField(row, ["Tag Description", "Deficiency Description", "tag_description"]) || ""),
      scope: cleanString(getField(row, ["Scope", "scope"]) || "") || getScopeFromCode(scopeSeverityCode),
      severity: cleanString(getField(row, ["Severity", "severity"]) || "") || getSeverityFromCode(scopeSeverityCode),
      scope_severity_code: scopeSeverityCode,
      survey_date: parseDate(getField(row, ["Inspection Date", "inspection date", "inspection_date"]) ),
      survey_type: cleanString(getField(row, ["Survey Type", "survey_type"]) || ""),
      inspection_id: cleanString(getField(row, ["Inspection ID", "inspection_id"]) || ""),
      correction_date: parseDate(getField(row, ["Correction Date", "correction_date"]) ),
      is_corrected: ((): string => {
        const v = getField(row, ["Deficiency Corrected", "deficiency_corrected"]) || "";
        const t = v.toLowerCase();
        if (t.includes("deficient") || t.startsWith("y") || t.startsWith("t")) return "true";
        return "false";
      })(),
      displayed_on_care_compare: ((): string => {
        const v = getField(row, ["Standard Deficiency", "Standard Survey Health Deficiency", "standard_survey_health_deficiency"]) || "";
        const t = v.toLowerCase();
        return (t.startsWith("y") || t.startsWith("t")) ? "true" : "false";
      })(),
      data_as_of: parseDate(getField(row, ["Filedate", "filedate", "Processing Date", "processing date"])) || new Date().toISOString().split("T")[0],
    });
  }

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

  const processed: ProcessedPenalty[] = [];
  for (const r of records as any[]) {
    const row = normalizeRowKeys(r);
    const prov = getField(row, ["CMS Certification Number (CCN)", "Federal Provider Number", "federal_provider_number", "federal provider number"]);
    if (!prov) continue;
    processed.push({
      provider_id: cleanString(prov),
      provider_name: cleanString(getField(row, ["Provider Name", "provider_name"]) || ""),
      provider_address: cleanString(getField(row, ["Provider Address", "provider_address"]) || ""),
      provider_city: cleanString(getField(row, ["Provider City", "provider_city"]) || ""),
      provider_state: cleanString(getField(row, ["Provider State", "provider_state"]) || ""),
      provider_zip: cleanString(getField(row, ["Provider Zip Code", "provider_zip_code", "zip", "zip_code"]) || ""),
      penalty_type: cleanString(getField(row, ["Penalty Type", "penalty_type"]) || ""),
      penalty_date: parseDate(getField(row, ["Penalty Date", "penalty_date"]) ),
      fine_amount: parseNumeric(getField(row, ["Fine Amount", "fine_amount"]) ),
      payment_denial_start_date: parseDate(getField(row, ["Payment Denial Start Date", "payment_denial_start_date"]) ),
      payment_denial_end_date: parseDate(getField(row, ["Payment Denial End Date", "payment_denial_end_date"]) ),
      processing_date: parseDate(getField(row, ["Processing Date", "processing_date"]) ),
      data_as_of: parseDate(getField(row, ["Filedate", "filedate"])) || new Date().toISOString().split("T")[0],
    });
  }

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

  const processed: ProcessedQualityMetric[] = [];
  for (const r of records as any[]) {
    const row = normalizeRowKeys(r);
    const prov = getField(row, ["CMS Certification Number (CCN)", "Federal Provider Number", "federal_provider_number", "federal provider number"]);
    if (!prov) continue;
    const periodRaw = cleanString(
      getField(row, ["Measure Period", "Quarter", "measure_period", "quarter"]) || ""
    );
    const { startDate, endDate } = parseMeasurePeriod(periodRaw);
    processed.push({
      provider_id: cleanString(prov),
      provider_name: cleanString(getField(row, ["Provider Name", "provider_name"]) || ""),
      measure_code: cleanString(getField(row, ["Measure Code", "measure_code"]) || ""),
      measure_name: cleanString(getField(row, ["Measure Description", "measure_description"]) || ""),
      measure_period_start: startDate,
      measure_period_end: endDate,
      score: parseNumeric(getField(row, ["Four Quarter Average Score", "Score", "score"]) ),
      denominator: parseNumeric(getField(row, ["Denominator", "denominator"]) ),
      numerator: parseNumeric(getField(row, ["Numerator", "numerator"]) ),
      performance_category: cleanString(getField(row, ["Performance Rating", "performance_rating"]) || ""),
      footnote: cleanString(getField(row, ["Footnote", "footnote"]) || ""),
      data_as_of: parseDate(getField(row, ["Filedate", "filedate"])) || new Date().toISOString().split("T")[0],
    });
  }

  const outputPath = "data/cms/processed/quality-metrics-processed.csv";
  fs.writeFileSync(outputPath, stringify(processed, { header: true }));

  console.log(`✅ Processed ${processed.length} quality measures`);
  console.log(`   Output: ${outputPath}`);

  return processed.length;
}

function parseMeasurePeriod(period: string): { startDate: string; endDate: string } {
  if (!period) return { startDate: "", endDate: "" };

  // Try to extract year and quarter
  // Handle range format like "2024Q2-2025Q1"
  const rangeMatch = period.match(/(20\d{2})Q([1-4])\s*-\s*(20\d{2})Q([1-4])/i);
  if (rangeMatch) {
    const year1 = parseInt(rangeMatch[1]);
    const q1 = parseInt(rangeMatch[2]);
    const year2 = parseInt(rangeMatch[3]);
    const q2 = parseInt(rangeMatch[4]);
    const start = { 1: `${year1}-01-01`, 2: `${year1}-04-01`, 3: `${year1}-07-01`, 4: `${year1}-10-01` } as const;
    const end = { 1: `${year2}-03-31`, 2: `${year2}-06-30`, 3: `${year2}-09-30`, 4: `${year2}-12-31` } as const;
    return { startDate: start[q1 as 1|2|3|4] || "", endDate: end[q2 as 1|2|3|4] || "" };
  }

  const yearMatch = period.match(/20\d{2}/);
  const quarterMatch = period.match(/Q\s*([1-4])/i);
  if (!yearMatch || !quarterMatch) return { startDate: "", endDate: "" };
  const year = parseInt(yearMatch[0]);
  const quarter = parseInt(quarterMatch[1]);
  const quarterStarts = { 1: `${year}-01-01`, 2: `${year}-04-01`, 3: `${year}-07-01`, 4: `${year}-10-01` } as const;
  const quarterEnds = { 1: `${year}-03-31`, 2: `${year}-06-30`, 3: `${year}-09-30`, 4: `${year}-12-31` } as const;
  return { startDate: quarterStarts[quarter as 1|2|3|4] || "", endDate: quarterEnds[quarter as 1|2|3|4] || "" };
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
