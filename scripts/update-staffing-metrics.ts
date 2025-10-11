#!/usr/bin/env tsx
/**
 * Update existing nursing home records with staffing metrics
 * Matches by CCN (CMS Certification Number) instead of deleting/re-importing
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface StaffingData {
  ccn: string;
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
  ownership_type: string;
  number_of_certified_beds: string;
}

function parseNumeric(value: string | undefined): number | null {
  if (!value || value === "" || value === "N/A") return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function parseInt32(value: string | undefined): number | null {
  if (!value || value === "" || value === "N/A") return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

async function updateStaffingMetrics(csvPath: string) {
  console.log("📖 Reading CSV file:", csvPath);
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as StaffingData[];

  console.log(`📊 Found ${records.length} nursing homes with staffing data\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;
  const batchSize = 50;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    for (const record of batch) {
      const { ccn } = record;

      // Update by CCN
      const { data, error } = await supabase
        .from("resources")
        .update({
          staffing_rating: parseNumeric(record.staffing_rating),
          total_nurse_hours_per_resident_per_day: parseNumeric(record.total_nurse_hours_per_resident_per_day),
          rn_hours_per_resident_per_day: parseNumeric(record.rn_hours_per_resident_per_day),
          lpn_hours_per_resident_per_day: parseNumeric(record.lpn_hours_per_resident_per_day),
          cna_hours_per_resident_per_day: parseNumeric(record.cna_hours_per_resident_per_day),
          weekend_nurse_hours_per_resident_per_day: parseNumeric(record.weekend_nurse_hours_per_resident_per_day),
          weekend_rn_hours_per_resident_per_day: parseNumeric(record.weekend_rn_hours_per_resident_per_day),
          total_nurse_staff_turnover: parseNumeric(record.total_nurse_staff_turnover),
          rn_turnover: parseNumeric(record.rn_turnover),
          case_mix_total_nurse_hours: parseNumeric(record.case_mix_total_nurse_hours),
          case_mix_rn_hours: parseNumeric(record.case_mix_rn_hours),
          health_inspection_rating: parseNumeric(record.health_inspection_rating),
          quality_measure_rating: parseNumeric(record.quality_measure_rating),
          number_of_facility_reported_incidents: parseInt32(record.number_of_facility_reported_incidents),
          number_of_substantiated_complaints: parseInt32(record.number_of_substantiated_complaints),
          ownership_type: record.ownership_type || null,
          number_of_certified_beds: parseInt32(record.number_of_certified_beds),
        })
        .eq("ccn", ccn)
        .select();

      if (error) {
        console.error(`❌ Error updating CCN ${ccn}:`, error.message);
        errors++;
      } else if (!data || data.length === 0) {
        // CCN not found in database (might be new or not imported yet)
        notFound++;
      } else {
        updated++;
      }
    }

    // Progress update every batch
    const progress = Math.min(i + batchSize, records.length);
    const pct = ((progress / records.length) * 100).toFixed(1);
    console.log(`📝 Progress: ${progress}/${records.length} (${pct}%) | Updated: ${updated} | Not found: ${notFound} | Errors: ${errors}`);
  }

  console.log("\n✅ Update complete!");
  console.log(`   Updated: ${updated}`);
  console.log(`   Not found: ${notFound}`);
  console.log(`   Errors: ${errors}`);
}

// Main execution
const csvPath = process.argv[2] || "data/cms/processed/nursing-homes-processed.csv";

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV file not found: ${csvPath}`);
  process.exit(1);
}

updateStaffingMetrics(csvPath)
  .then(() => {
    console.log("\n🎉 Staffing metrics update complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  });
