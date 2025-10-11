#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Import CMS Quality & Inspection Data to Supabase
 *
 * This script:
 * 1. Reads processed CSV files (deficiencies, penalties, quality measures)
 * 2. Imports data to Supabase tables in batches
 * 3. Handles duplicates using upsert operations
 * 4. Updates resource quality summary fields
 *
 * Usage:
 *   pnpm tsx scripts/import-quality-data.ts
 */

import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

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

// ============================================================================
// Configuration
// ============================================================================

const BATCH_SIZE = 100; // Number of rows to insert per batch

interface ImportSummary {
  inserted: number;
  updated: number;
  errors: number;
  total: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseString(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

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

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === "true" || lower === "yes" || lower === "1";
}

function parseDate(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  // Assuming dates are already in YYYY-MM-DD format from processing
  return value.trim();
}

// ============================================================================
// Import Functions
// ============================================================================

async function importDeficiencies(): Promise<ImportSummary> {
  console.log("\n📋 Importing Health Deficiencies...");

  const inputPath = "data/cms/processed/deficiencies-processed.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return { inserted: 0, updated: 0, errors: 0, total: 0 };
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} records to import`);

  const summary: ImportSummary = { inserted: 0, updated: 0, errors: 0, total: records.length };

  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const dbRecords = batch.map((row: any) => ({
      provider_id: parseString(row.provider_id),
      provider_name: parseString(row.provider_name),
      deficiency_tag: parseString(row.deficiency_tag),
      deficiency_description: parseString(row.deficiency_description),
      scope: parseString(row.scope),
      severity: parseString(row.severity),
      scope_severity_code: parseString(row.scope_severity_code),
      survey_date: parseDate(row.survey_date),
      survey_type: parseString(row.survey_type),
      inspection_id: parseString(row.inspection_id),
      correction_date: parseDate(row.correction_date),
      is_corrected: parseBoolean(row.is_corrected),
      displayed_on_care_compare: parseBoolean(row.displayed_on_care_compare),
      data_as_of: parseDate(row.data_as_of),
    }));

    // Upsert to handle duplicates
    const { error, count } = await supabase
      .from("nursing_home_deficiencies")
      .upsert(dbRecords, {
        onConflict: "provider_id,deficiency_tag,survey_date,inspection_id",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error(`   ❌ Error in batch ${i / BATCH_SIZE + 1}:`, error.message);
      summary.errors += batch.length;
    } else {
      summary.inserted += count || batch.length;
      process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
    }
  }

  console.log(`\n✅ Imported ${summary.inserted} deficiencies (${summary.errors} errors)`);
  return summary;
}

async function importPenalties(): Promise<ImportSummary> {
  console.log("\n📋 Importing Penalties...");

  const inputPath = "data/cms/processed/penalties-processed.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return { inserted: 0, updated: 0, errors: 0, total: 0 };
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} records to import`);

  const summary: ImportSummary = { inserted: 0, updated: 0, errors: 0, total: records.length };

  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const dbRecords = batch.map((row: any) => ({
      provider_id: parseString(row.provider_id),
      provider_name: parseString(row.provider_name),
      provider_address: parseString(row.provider_address),
      provider_city: parseString(row.provider_city),
      provider_state: parseString(row.provider_state),
      provider_zip: parseString(row.provider_zip),
      penalty_type: parseString(row.penalty_type),
      penalty_date: parseDate(row.penalty_date),
      fine_amount: parseNumeric(row.fine_amount),
      payment_denial_start_date: parseDate(row.payment_denial_start_date),
      payment_denial_end_date: parseDate(row.payment_denial_end_date),
      processing_date: parseDate(row.processing_date),
      data_as_of: parseDate(row.data_as_of),
    }));

    // Upsert to handle duplicates
    const { error, count } = await supabase
      .from("nursing_home_penalties")
      .upsert(dbRecords, {
        onConflict: "provider_id,penalty_type,penalty_date",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error(`   ❌ Error in batch ${i / BATCH_SIZE + 1}:`, error.message);
      summary.errors += batch.length;
    } else {
      summary.inserted += count || batch.length;
      process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
    }
  }

  console.log(`\n✅ Imported ${summary.inserted} penalties (${summary.errors} errors)`);
  return summary;
}

async function importQualityMetrics(): Promise<ImportSummary> {
  console.log("\n📋 Importing Quality Metrics...");

  const inputPath = "data/cms/processed/quality-metrics-processed.csv";
  if (!fs.existsSync(inputPath)) {
    console.log("⏭️  File not found, skipping");
    return { inserted: 0, updated: 0, errors: 0, total: 0 };
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} records to import`);

  const summary: ImportSummary = { inserted: 0, updated: 0, errors: 0, total: records.length };

  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const dbRecords = batch.map((row: any) => ({
      provider_id: parseString(row.provider_id),
      provider_name: parseString(row.provider_name),
      measure_code: parseString(row.measure_code),
      measure_name: parseString(row.measure_name),
      measure_period_start: parseDate(row.measure_period_start),
      measure_period_end: parseDate(row.measure_period_end),
      score: parseNumeric(row.score),
      denominator: parseInteger(row.denominator),
      numerator: parseInteger(row.numerator),
      performance_category: parseString(row.performance_category),
      footnote: parseString(row.footnote),
      data_as_of: parseDate(row.data_as_of),
    }));

    // Upsert to handle duplicates
    const { error, count } = await supabase
      .from("nursing_home_quality_metrics")
      .upsert(dbRecords, {
        onConflict: "provider_id,measure_code,measure_period_start,measure_period_end",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error(`   ❌ Error in batch ${i / BATCH_SIZE + 1}:`, error.message);
      summary.errors += batch.length;
    } else {
      summary.inserted += count || batch.length;
      process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
    }
  }

  console.log(`\n✅ Imported ${summary.inserted} quality metrics (${summary.errors} errors)`);
  return summary;
}

async function updateResourceQualitySummary(): Promise<void> {
  console.log("\n🔄 Updating resource quality summaries...");

  // Call the database function to update summary fields
  const { error } = await supabase.rpc("update_nursing_home_quality_summary");

  if (error) {
    console.error("   ❌ Error updating quality summary:", error.message);
  } else {
    console.log("✅ Updated quality summary for all nursing homes");
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("🚀 Importing CMS Quality & Inspection Data to Supabase...\n");

  try {
    const startTime = Date.now();

    // Import all datasets
    const deficienciesSummary = await importDeficiencies();
    const penaltiesSummary = await importPenalties();
    const metricsSummary = await importQualityMetrics();

    // Update resource summaries
    await updateResourceQualitySummary();

    // Calculate totals
    const totalRecords =
      deficienciesSummary.inserted +
      penaltiesSummary.inserted +
      metricsSummary.inserted;

    const totalErrors =
      deficienciesSummary.errors +
      penaltiesSummary.errors +
      metricsSummary.errors;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log("✨ Import Complete!");
    console.log("=".repeat(60));
    console.log(`📊 Total records imported: ${totalRecords.toLocaleString()}`);
    console.log(`   • Deficiencies: ${deficienciesSummary.inserted.toLocaleString()}`);
    console.log(`   • Penalties: ${penaltiesSummary.inserted.toLocaleString()}`);
    console.log(`   • Quality Metrics: ${metricsSummary.inserted.toLocaleString()}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log("=".repeat(60));

    if (totalErrors > 0) {
      console.log("\n⚠️  Some records failed to import. Check error messages above.");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  }
}

main();
