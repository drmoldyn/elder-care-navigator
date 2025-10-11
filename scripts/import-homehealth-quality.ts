#!/usr/bin/env tsx
/**
 * Import CMS Home Health Quality data to Supabase
 *
 * This script imports:
 * 1. Quality metrics to home_health_quality_metrics table
 * 2. Service areas to update resources table
 * 3. Updates existing home health agencies with quality ratings
 *
 * Phase 2: Home Health Quality Metrics
 *
 * Usage:
 *   pnpm tsx scripts/import-homehealth-quality.ts
 *
 * Prerequisites:
 * - Run: scripts/download-cms-homehealth-data.sh
 * - Run: scripts/process-homehealth-quality.ts
 * - Apply migration: 0010_home_health_quality.sql
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

// ===== Type Definitions =====

interface ImportSummary {
  agencies_updated: number;
  quality_metrics_inserted: number;
  service_areas_updated: number;
  errors: Array<{ item: string; message: string }>;
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
  quality_star: string;
  patient_experience_star: string;
  timely_care_percent: string;
  manages_meds_percent: string;
  improvement_bathing_percent: string;
  improvement_walking_percent: string;
  improvement_breathing_percent: string;
  acute_hospitalization_percent: string;
  er_use_percent: string;
  recommend_star: string;
  [key: string]: string;
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
  ccn: string;
  zip_codes: string;
  counties: string;
  states: string;
}

// ===== Helper Functions =====

function parseFloat(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = Number.parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseDate(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function parseArray(value: string | undefined, delimiter = ";"): string[] | null {
  if (!value || value.trim() === "") return null;
  return value.split(delimiter).map((v) => v.trim()).filter(Boolean);
}

// ===== Import Functions =====

async function updateHomeHealthAgenciesWithQuality(
  csvPath: string,
  summary: ImportSummary
): Promise<void> {
  console.log("\n📋 Updating home health agencies with quality ratings...");

  if (!fs.existsSync(csvPath)) {
    console.log("⏭️  File not found, skipping");
    return;
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const records: ProcessedAgencyRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} agencies to update`);

  // Process in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      try {
        // Update existing resource by CCN (facility_id)
        const { data, error } = await supabase
          .from("resources")
          .update({
            cms_ccn: row.ccn,
            ownership_type: row.ownership_type || null,
            date_certified: parseDate(row.date_certified),
            hh_quality_star: parseFloat(row.quality_star),
            hh_patient_experience_star: parseFloat(row.patient_experience_star),
            hh_timely_care_percent: parseFloat(row.timely_care_percent),
            hh_manages_meds_percent: parseFloat(row.manages_meds_percent),
            hh_improvement_bathing_percent: parseFloat(row.improvement_bathing_percent),
            hh_improvement_walking_percent: parseFloat(row.improvement_walking_percent),
            hh_improvement_breathing_percent: parseFloat(row.improvement_breathing_percent),
            hh_acute_hospitalization_percent: parseFloat(row.acute_hospitalization_percent),
            hh_er_use_percent: parseFloat(row.er_use_percent),
            hh_recommend_percent: parseFloat(row.recommend_star) ? parseFloat(row.recommend_star)! * 20 : null, // Convert 5-star to percentage
            updated_at: new Date().toISOString(),
          })
          .eq("facility_id", row.ccn)
          .select("id");

        if (error) {
          summary.errors.push({
            item: `Agency ${row.ccn}`,
            message: error.message,
          });
        } else if (data && data.length > 0) {
          summary.agencies_updated++;
          if ((i + batch.indexOf(row)) % 100 === 0) {
            console.log(`   ✅ Updated ${summary.agencies_updated} agencies...`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        summary.errors.push({
          item: `Agency ${row.ccn}`,
          message,
        });
      }
    }
  }

  console.log(`✅ Updated ${summary.agencies_updated} home health agencies`);
}

async function importQualityMetrics(
  csvPath: string,
  summary: ImportSummary
): Promise<void> {
  console.log("\n📊 Importing quality metrics...");

  if (!fs.existsSync(csvPath)) {
    console.log("⏭️  File not found, skipping");
    return;
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const records: QualityMetricRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} quality metrics to import`);

  // Process in batches
  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const dbRecords = batch.map((row) => ({
      ccn: row.ccn,
      metric_name: row.metric_name,
      metric_category: row.metric_category,
      metric_value: parseFloat(row.metric_value),
      metric_type: row.metric_type,
      reporting_period: row.reporting_period,
      reporting_start_date: row.reporting_start_date || null,
      reporting_end_date: row.reporting_end_date || null,
      data_source: row.data_source,
    }));

    try {
      const { data, error } = await supabase
        .from("home_health_quality_metrics")
        .upsert(dbRecords, {
          onConflict: "ccn,metric_name,reporting_period",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        summary.errors.push({
          item: `Quality metrics batch ${i / BATCH_SIZE + 1}`,
          message: error.message,
        });
      } else if (data) {
        summary.quality_metrics_inserted += data.length;
        console.log(`   ✅ Imported ${summary.quality_metrics_inserted} metrics...`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      summary.errors.push({
        item: `Quality metrics batch ${i / BATCH_SIZE + 1}`,
        message,
      });
    }
  }

  console.log(`✅ Imported ${summary.quality_metrics_inserted} quality metrics`);
}

async function updateServiceAreas(
  csvPath: string,
  summary: ImportSummary
): Promise<void> {
  console.log("\n📍 Updating service areas...");

  if (!fs.existsSync(csvPath)) {
    console.log("⏭️  File not found, skipping");
    return;
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const records: ServiceAreaRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} service area records to update`);

  // Process in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      try {
        const { data, error } = await supabase
          .from("resources")
          .update({
            hh_service_zip_codes: parseArray(row.zip_codes),
            hh_service_counties: parseArray(row.counties),
            updated_at: new Date().toISOString(),
          })
          .eq("facility_id", row.ccn)
          .select("id");

        if (error) {
          summary.errors.push({
            item: `Service area ${row.ccn}`,
            message: error.message,
          });
        } else if (data && data.length > 0) {
          summary.service_areas_updated++;
          if ((i + batch.indexOf(row)) % 100 === 0) {
            console.log(`   ✅ Updated ${summary.service_areas_updated} service areas...`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        summary.errors.push({
          item: `Service area ${row.ccn}`,
          message,
        });
      }
    }
  }

  console.log(`✅ Updated ${summary.service_areas_updated} service areas`);
}

// ===== Main Execution =====

async function main() {
  console.log("🚀 Starting CMS Home Health Quality import...");
  console.log("==============================================");

  const summary: ImportSummary = {
    agencies_updated: 0,
    quality_metrics_inserted: 0,
    service_areas_updated: 0,
    errors: [],
  };

  const processedDir = "data/cms/processed";

  try {
    // 1. Update home health agencies with quality ratings
    await updateHomeHealthAgenciesWithQuality(
      path.join(processedDir, "homehealth-quality-processed.csv"),
      summary
    );

    // 2. Import quality metrics to dedicated table
    await importQualityMetrics(
      path.join(processedDir, "homehealth-quality-metrics.csv"),
      summary
    );

    // 3. Update service areas
    await updateServiceAreas(
      path.join(processedDir, "homehealth-service-areas.csv"),
      summary
    );

    // Print summary
    console.log("\n==============================================");
    console.log("📊 Import Summary:");
    console.log(`   ✅ Agencies updated:      ${summary.agencies_updated}`);
    console.log(`   📊 Quality metrics:       ${summary.quality_metrics_inserted}`);
    console.log(`   📍 Service areas updated: ${summary.service_areas_updated}`);
    console.log(`   ❌ Errors:                ${summary.errors.length}`);

    if (summary.errors.length > 0) {
      console.log("\n⚠️  Errors:");
      summary.errors.slice(0, 10).forEach((e) =>
        console.log(`   ${e.item}: ${e.message}`)
      );
      if (summary.errors.length > 10) {
        console.log(`   ... and ${summary.errors.length - 10} more errors`);
      }
    }

    console.log("\n✨ Import complete!");
    process.exit(summary.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  }
}

main();
