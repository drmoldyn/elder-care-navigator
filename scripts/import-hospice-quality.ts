#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Import Hospice Quality Data to Supabase
 *
 * This script:
 * 1. Reads processed hospice quality CSVs
 * 2. Updates existing hospice providers in resources table by CCN
 * 3. Imports detailed metrics to hospice_quality_metrics table
 * 4. Imports CAHPS survey data to hospice_cahps table
 * 5. Uses batch inserts for efficiency
 * 6. Reports progress and errors
 *
 * Prerequisites:
 *   - Migration 0011_hospice_quality.sql must be applied
 *   - Processed CSV files must exist in data/cms/processed/
 *   - Hospice providers must already exist in resources table
 *
 * Usage:
 *   pnpm tsx scripts/import-hospice-quality.ts [--dry-run]
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 100;

interface ImportStats {
  providersUpdated: number;
  providersSkipped: number;
  cahpsInserted: number;
  cahpsUpdated: number;
  metricsInserted: number;
  metricsUpdated: number;
  errors: Array<{ type: string; ccn?: string; message: string }>;
}

const stats: ImportStats = {
  providersUpdated: 0,
  providersSkipped: 0,
  cahpsInserted: 0,
  cahpsUpdated: 0,
  metricsInserted: 0,
  metricsUpdated: 0,
  errors: [],
};

// ============================================================================
// Helper Functions
// ============================================================================

function parseNumeric(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseInteger(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function parseArray(value: string | undefined): string[] | null {
  if (!value || value.trim() === "") return null;

  // Handle PostgreSQL array format: {val1,val2,val3} or {"val1","val2","val3"}
  if (value.startsWith("{") && value.endsWith("}")) {
    const content = value.slice(1, -1);
    if (!content) return null;

    return content
      .split(",")
      .map(v => v.trim().replace(/^"(.*)"$/, "$1"))
      .filter(v => v.length > 0);
  }

  return null;
}

async function batchProcess<T>(
  items: T[],
  processor: (batch: T[]) => Promise<void>,
  batchSize: number = BATCH_SIZE
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);

    // Progress indicator
    if ((i + batchSize) % (batchSize * 5) === 0) {
      process.stdout.write(".");
    }
  }
  console.log(""); // newline after progress dots
}

// ============================================================================
// 1. UPDATE RESOURCES TABLE WITH QUALITY DATA
// ============================================================================

async function updateHospiceProviders(): Promise<void> {
  console.log("\n📋 Step 1: Updating Hospice Provider Quality Data");
  console.log("================================================\n");

  const inputFile = path.join("data/cms/processed", "hospice-quality-processed.csv");

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    stats.errors.push({
      type: "file_not_found",
      message: `Input file not found: ${inputFile}`,
    });
    return;
  }

  const content = fs.readFileSync(inputFile, "utf-8");
  const records: any[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} hospice providers to update`);

  if (DRY_RUN) {
    console.log("\n🔍 DRY RUN - No changes will be made\n");
    console.log("Sample record:");
    console.log(JSON.stringify(records[0], null, 2));
    return;
  }

  await batchProcess(records, async (batch) => {
    for (const row of batch) {
      const ccn = row.ccn?.trim();
      if (!ccn) {
        stats.providersSkipped++;
        continue;
      }

      try {
        // Find existing resource by CCN (facility_id)
        const { data: existing, error: findError } = await supabase
          .from("resources")
          .select("id, facility_id")
          .eq("facility_id", ccn)
          .maybeSingle();

        if (findError) {
          stats.errors.push({
            type: "lookup_error",
            ccn,
            message: findError.message,
          });
          stats.providersSkipped++;
          continue;
        }

        if (!existing) {
          // Provider doesn't exist - skip (should be imported first via main process)
          stats.providersSkipped++;
          continue;
        }

        // Update the resource with quality data
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        // Star ratings
        const qualityStar = parseNumeric(row.hospice_quality_star);
        if (qualityStar !== null) updateData.hospice_quality_star = qualityStar;

        const cahpsStar = parseNumeric(row.hospice_cahps_star);
        if (cahpsStar !== null) updateData.hospice_cahps_star = cahpsStar;

        // Quality measures
        const painMgmt = parseNumeric(row.hospice_pain_management_percent);
        if (painMgmt !== null) updateData.hospice_pain_management_percent = painMgmt;

        const symptomMgmt = parseNumeric(row.hospice_symptom_management_percent);
        if (symptomMgmt !== null) updateData.hospice_symptom_management_percent = symptomMgmt;

        const emotionalSupport = parseNumeric(row.hospice_emotional_support_percent);
        if (emotionalSupport !== null) updateData.hospice_emotional_support_percent = emotionalSupport;

        const willingRecommend = parseNumeric(row.hospice_willing_to_recommend_percent);
        if (willingRecommend !== null) updateData.hospice_willing_to_recommend_percent = willingRecommend;

        const communication = parseNumeric(row.hospice_communication_percent);
        if (communication !== null) updateData.hospice_communication_percent = communication;

        const timelyHelp = parseNumeric(row.hospice_getting_timely_help_percent);
        if (timelyHelp !== null) updateData.hospice_getting_timely_help_percent = timelyHelp;

        const respect = parseNumeric(row.hospice_treating_with_respect_percent);
        if (respect !== null) updateData.hospice_treating_with_respect_percent = respect;

        const medReview = parseNumeric(row.hospice_medication_review_percent);
        if (medReview !== null) updateData.hospice_medication_review_percent = medReview;

        const beliefs = parseNumeric(row.hospice_discussion_of_beliefs_percent);
        if (beliefs !== null) updateData.hospice_discussion_of_beliefs_percent = beliefs;

        const chemo = parseNumeric(row.hospice_chemotherapy_in_last_2_weeks);
        if (chemo !== null) updateData.hospice_chemotherapy_in_last_2_weeks = chemo;

        // Survey metadata
        const surveyCount = parseInteger(row.hospice_cahps_survey_count);
        if (surveyCount !== null) updateData.hospice_cahps_survey_count = surveyCount;

        const responseRate = parseNumeric(row.hospice_cahps_response_rate);
        if (responseRate !== null) updateData.hospice_cahps_response_rate = responseRate;

        // Service area
        const counties = parseArray(row.hospice_service_area_counties);
        if (counties !== null) updateData.hospice_service_area_counties = counties;

        // Reporting periods
        if (row.hospice_quality_period) updateData.hospice_quality_period = row.hospice_quality_period;
        if (row.hospice_cahps_period) updateData.hospice_cahps_period = row.hospice_cahps_period;

        // Only update if we have data to update
        if (Object.keys(updateData).length > 1) { // > 1 because updated_at is always there
          const { error: updateError } = await supabase
            .from("resources")
            .update(updateData)
            .eq("id", existing.id);

          if (updateError) {
            stats.errors.push({
              type: "update_error",
              ccn,
              message: updateError.message,
            });
            stats.providersSkipped++;
          } else {
            stats.providersUpdated++;
          }
        } else {
          stats.providersSkipped++;
        }
      } catch (error: any) {
        stats.errors.push({
          type: "unexpected_error",
          ccn,
          message: error.message,
        });
        stats.providersSkipped++;
      }

    }
  });

  console.log(`\n✅ Updated ${stats.providersUpdated} providers`);
  console.log(`   ⏭️  Skipped ${stats.providersSkipped} providers`);
}

// ============================================================================
// 2. IMPORT CAHPS SURVEY DATA
// ============================================================================

async function importCAHPSData(): Promise<void> {
  console.log("\n📋 Step 2: Importing CAHPS Survey Data");
  console.log("======================================\n");

  const inputFile = path.join("data/cms/processed", "hospice-cahps-processed.csv");

  if (!fs.existsSync(inputFile)) {
    console.log(`⏭️  File not found: ${inputFile} - Skipping CAHPS import`);
    return;
  }

  const content = fs.readFileSync(inputFile, "utf-8");
  const records: any[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} CAHPS measure records`);

  if (DRY_RUN) {
    console.log("\n🔍 DRY RUN - No changes will be made\n");
    return;
  }

  await batchProcess(records, async (batch) => {
    const insertData = batch.map(row => ({
      ccn: row.ccn?.trim(),
      survey_measure: row.survey_measure?.trim(),
      measure_code: row.measure_code?.trim() || null,
      score: parseNumeric(row.score),
      top_box_percentage: parseNumeric(row.top_box_percentage),
      reporting_period: row.reporting_period?.trim() || null,
      number_of_completed_surveys: parseInteger(row.number_of_completed_surveys),
      response_rate: parseNumeric(row.response_rate),
      footnote: row.footnote?.trim() || null,
    })).filter(item => item.ccn && item.survey_measure);

    if (insertData.length === 0) return;

    // Upsert (insert or update on conflict)
    const { error } = await supabase
      .from("hospice_cahps")
      .upsert(insertData, {
        onConflict: "ccn,survey_measure,reporting_period",
        ignoreDuplicates: false,
      });

    if (error) {
      stats.errors.push({
        type: "cahps_import_error",
        message: error.message,
      });
    } else {
      stats.cahpsInserted += insertData.length;
    }
  });

  console.log(`\n✅ Imported/updated ${stats.cahpsInserted} CAHPS measures`);
}

// ============================================================================
// 3. IMPORT QUALITY METRICS DATA
// ============================================================================

async function importQualityMetrics(): Promise<void> {
  console.log("\n📋 Step 3: Importing Quality Metrics");
  console.log("====================================\n");

  const inputFile = path.join("data/cms/processed", "hospice-metrics-processed.csv");

  if (!fs.existsSync(inputFile)) {
    console.log(`⏭️  File not found: ${inputFile} - Skipping metrics import`);
    return;
  }

  const content = fs.readFileSync(inputFile, "utf-8");
  const records: any[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} quality metric records`);

  if (DRY_RUN) {
    console.log("\n🔍 DRY RUN - No changes will be made\n");
    return;
  }

  await batchProcess(records, async (batch) => {
    const insertData = batch.map(row => ({
      ccn: row.ccn?.trim(),
      metric_name: row.metric_name?.trim(),
      metric_value: parseNumeric(row.metric_value),
      metric_type: row.metric_type?.trim() || "process",
      reporting_period: row.reporting_period?.trim() || null,
      measure_start_date: row.measure_start_date?.trim() || null,
      measure_end_date: row.measure_end_date?.trim() || null,
      numerator: parseInteger(row.numerator),
      denominator: parseInteger(row.denominator),
      footnote: row.footnote?.trim() || null,
    })).filter(item => item.ccn && item.metric_name);

    if (insertData.length === 0) return;

    // Upsert (insert or update on conflict)
    const { error } = await supabase
      .from("hospice_quality_metrics")
      .upsert(insertData, {
        onConflict: "ccn,metric_name,reporting_period",
        ignoreDuplicates: false,
      });

    if (error) {
      stats.errors.push({
        type: "metrics_import_error",
        message: error.message,
      });
    } else {
      stats.metricsInserted += insertData.length;
    }
  });

  console.log(`\n✅ Imported/updated ${stats.metricsInserted} quality metrics`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("\n🚀 Hospice Quality Data Import");
  console.log("================================\n");

  if (DRY_RUN) {
    console.log("🔍 Running in DRY RUN mode - no database changes will be made\n");
  }

  const startTime = Date.now();

  try {
    // Step 1: Update resources table with quality data
    await updateHospiceProviders();

    // Step 2: Import CAHPS survey data
    await importCAHPSData();

    // Step 3: Import quality metrics
    await importQualityMetrics();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n" + "=".repeat(50));
    console.log("📊 Import Summary");
    console.log("=".repeat(50) + "\n");

    console.log("Resources Updated:");
    console.log(`  ✅ Providers updated: ${stats.providersUpdated}`);
    console.log(`  ⏭️  Providers skipped: ${stats.providersSkipped}`);

    console.log("\nCAHPS Data:");
    console.log(`  ✅ Measures imported: ${stats.cahpsInserted}`);

    console.log("\nQuality Metrics:");
    console.log(`  ✅ Metrics imported: ${stats.metricsInserted}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
      console.log("\nFirst 10 errors:");
      stats.errors.slice(0, 10).forEach((error, idx) => {
        console.log(`  ${idx + 1}. [${error.type}] ${error.ccn || "N/A"}: ${error.message}`);
      });

      if (stats.errors.length > 10) {
        console.log(`\n  ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log(`\n⏱️  Duration: ${duration}s`);
    console.log("\n✨ Import complete!");

    if (DRY_RUN) {
      console.log("\n🔍 This was a DRY RUN - no changes were made");
      console.log("   Remove --dry-run flag to perform actual import");
    }

  } catch (error: any) {
    console.error("\n💥 Fatal error during import:", error);
    process.exit(1);
  }
}

main();
