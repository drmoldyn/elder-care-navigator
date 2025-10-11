#!/usr/bin/env tsx
/**
 * @deprecated October 11, 2025 — superseded by the exact-match workflow.
 * Use scripts/generate-nursing-home-merge-plan.ts and scripts/run-nursing-home-exact-merge.ts instead.
 *
 * This script remains for historical reference and should not be used on new imports.
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseFloat(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = Number.parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseInt(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = Number.parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function parseString(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

interface UpdateStats {
  total: number;
  updated: number;
  notFound: number;
  errors: number;
  errorDetails: Array<{ name: string; error: string }>;
}

async function updateQualityMetrics() {
  const stats: UpdateStats = {
    total: 0,
    updated: 0,
    notFound: 0,
    errors: 0,
    errorDetails: [],
  };

  // Read CSV
  const csvPath = "data/cms/processed/nursing-homes-processed.csv";
  console.log(`📂 Reading ${csvPath}...`);

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📊 Found ${records.length} nursing homes in CSV\n`);
  stats.total = records.length;

  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    for (const row of batch) {
      const facilityName = row.facility_name || row.title;
      const facilityId = parseString(row.facility_id);

      try {
        let existing = null;
        let findError = null;

        // Try matching by facility_id (CCN) first if available
        if (facilityId) {
          const result = await supabase
            .from("resources")
            .select("id, title, facility_id, latitude, longitude")
            .eq("provider_type", "nursing_home")
            .eq("facility_id", facilityId)
            .limit(1)
            .maybeSingle();

          existing = result.data;
          findError = result.error;
        }

        // Fall back to name matching if facility_id match not found
        if (!existing && !findError) {
          const result = await supabase
            .from("resources")
            .select("id, title, facility_id, latitude, longitude")
            .eq("provider_type", "nursing_home")
            .ilike("title", facilityName)
            .limit(1)
            .maybeSingle();

          existing = result.data;
          findError = result.error;
        }

        if (findError || !existing) {
          stats.notFound++;
          if (stats.notFound <= 10) {
            console.log(`⚠️  Not found: ${facilityName} (CCN: ${facilityId || 'N/A'})`);
          }
          continue;
        }

        // Prepare update with quality metrics
        const updates = {
          // Preserve existing geocoded coordinates
          // Only update if CSV has coordinates and DB doesn't
          latitude: existing.latitude || parseFloat(row.latitude),
          longitude: existing.longitude || parseFloat(row.longitude),

          // Add facility_id
          facility_id: parseString(row.facility_id),

          // Add address info
          street_address: parseString(row.address),
          city: parseString(row.city),
          zip_code: parseString(row.zip_code),
          county: parseString(row.county),

          // Quality metrics
          staffing_rating: parseFloat(row.staffing_rating),
          total_nurse_hours_per_resident_per_day: parseFloat(row.total_nurse_hours_per_resident_per_day),
          rn_hours_per_resident_per_day: parseFloat(row.rn_hours_per_resident_per_day),
          lpn_hours_per_resident_per_day: parseFloat(row.lpn_hours_per_resident_per_day),
          cna_hours_per_resident_per_day: parseFloat(row.cna_hours_per_resident_per_day),
          weekend_nurse_hours_per_resident_per_day: parseFloat(row.weekend_nurse_hours_per_resident_per_day),
          weekend_rn_hours_per_resident_per_day: parseFloat(row.weekend_rn_hours_per_resident_per_day),
          total_nurse_staff_turnover: parseFloat(row.total_nurse_staff_turnover),
          rn_turnover: parseFloat(row.rn_turnover),
          case_mix_total_nurse_hours: parseFloat(row.case_mix_total_nurse_hours),
          case_mix_rn_hours: parseFloat(row.case_mix_rn_hours),
          health_inspection_rating: parseFloat(row.health_inspection_rating),
          quality_measure_rating: parseFloat(row.quality_measure_rating),
          number_of_facility_reported_incidents: parseInt(row.number_of_facility_reported_incidents),
          number_of_substantiated_complaints: parseInt(row.number_of_substantiated_complaints),
          number_of_certified_beds: parseInt(row.number_of_certified_beds),
          ownership_type: parseString(row.ownership_type),

          updated_at: new Date().toISOString(),
        };

        // Update record
        const { error: updateError } = await supabase
          .from("resources")
          .update(updates)
          .eq("id", existing.id);

        if (updateError) {
          stats.errors++;
          stats.errorDetails.push({
            name: facilityName,
            error: updateError.message,
          });
          if (stats.errors <= 10) {
            console.error(`❌ Error updating ${facilityName}:`, updateError.message);
          }
          continue;
        }

        stats.updated++;

        // Progress indicator
        if (stats.updated % 100 === 0) {
          console.log(`✅ Updated ${stats.updated} / ${stats.total} records...`);
        }
      } catch (err) {
        stats.errors++;
        stats.errorDetails.push({
          name: facilityName,
          error: err instanceof Error ? err.message : String(err),
        });
        if (stats.errors <= 10) {
          console.error(`❌ Exception for ${facilityName}:`, err);
        }
      }
    }
  }

  // Final report
  console.log("\n" + "=".repeat(60));
  console.log("📊 UPDATE SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total records in CSV:    ${stats.total}`);
  console.log(`✅ Successfully updated:  ${stats.updated}`);
  console.log(`⚠️  Not found in DB:      ${stats.notFound}`);
  console.log(`❌ Errors:                ${stats.errors}`);
  console.log("=".repeat(60));

  if (stats.errorDetails.length > 0 && stats.errorDetails.length <= 20) {
    console.log("\n❌ Error Details:");
    stats.errorDetails.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  } else if (stats.errorDetails.length > 20) {
    console.log(`\n❌ ${stats.errorDetails.length} errors occurred (showing first 10 above)`);
  }

  // Verification query
  console.log("\n🔍 Verifying updated data...");
  const { data: verifyData, error: verifyError } = await supabase
    .from("resources")
    .select("staffing_rating, health_inspection_rating, quality_measure_rating")
    .eq("provider_type", "nursing_home")
    .not("staffing_rating", "is", null);

  if (!verifyError && verifyData) {
    console.log(`✅ Records with staffing rating: ${verifyData.length}`);
    console.log(`✅ Average staffing rating: ${(verifyData.reduce((sum, r) => sum + (r.staffing_rating || 0), 0) / verifyData.length).toFixed(2)}`);
  }
}

updateQualityMetrics().catch(console.error);
