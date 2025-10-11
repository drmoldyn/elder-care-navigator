#!/usr/bin/env tsx
/**
 * Apply CCN + quality metric updates for the exact-match nursing home subset.
 *
 * Requires a prior run of scripts/generate-nursing-home-merge-plan.ts
 * which produces data/cms/processed/nursing-homes-exact-matches.csv.
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const INPUT_MATCHES = process.env.NURSING_HOME_EXACT_MATCHES || "data/cms/processed/nursing-homes-exact-matches.csv";

interface MatchRow {
  [key: string]: string;
}

function parseFloatField(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsed) ? null : parsed;
}

function parseIntField(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const parsed = Number.parseInt(value.replace(/,/g, ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseStringField(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

async function main() {
  if (!fs.existsSync(INPUT_MATCHES)) {
    console.error(`❌ Exact-match CSV not found: ${INPUT_MATCHES}`);
    console.error("   Run scripts/generate-nursing-home-merge-plan.ts first.");
    process.exit(1);
  }

  const content = fs.readFileSync(INPUT_MATCHES, "utf-8");
  const rows: MatchRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (rows.length === 0) {
    console.error("❌ No rows found in exact-match CSV");
    process.exit(1);
  }

  console.log(`🔄 Applying updates for ${rows.length} exact matches\n`);

  const stats = {
    total: rows.length,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const row of rows) {
    const resourceId = parseStringField(row.resource_id);
    const facilityId = parseStringField(row.facility_id);

    if (!resourceId) {
      stats.skipped++;
      console.warn("⚠️  Skipping row without resource_id", row);
      continue;
    }

    if (!facilityId) {
      stats.skipped++;
      console.warn(`⚠️  Skipping ${resourceId}: missing facility_id`);
      continue;
    }

    const updates: Record<string, unknown> = {
      facility_id: facilityId,
      updated_at: new Date().toISOString(),
    };

    const title = parseStringField(row.facility_name || row.title);
    if (title) updates.title = title;

    const streetAddress = parseStringField(row.address);
    const city = parseStringField(row.city);
    const zipCode = parseStringField(row.zip_code);
    const county = parseStringField(row.county);

    if (streetAddress) updates.street_address = streetAddress;
    if (city) updates.city = city;
    if (zipCode) updates.zip_code = zipCode;
    if (county) updates.county = county;

    const ownership = parseStringField(row.ownership_type);
    if (ownership) updates.ownership_type = ownership;

    const totalBeds = parseIntField(row.total_beds || row.number_of_certified_beds);
    if (totalBeds !== null) updates.total_beds = totalBeds;

    const numberOfCertifiedBeds = parseIntField(row.number_of_certified_beds);
    if (numberOfCertifiedBeds !== null) {
      updates.number_of_certified_beds = numberOfCertifiedBeds;
    }

    const qualityRating = parseFloatField(row.quality_rating);
    if (qualityRating !== null) updates.quality_rating = qualityRating;

    const staffingRating = parseFloatField(row.staffing_rating);
    if (staffingRating !== null) updates.staffing_rating = staffingRating;

    const totalNurseHours = parseFloatField(row.total_nurse_hours_per_resident_per_day);
    if (totalNurseHours !== null) updates.total_nurse_hours_per_resident_per_day = totalNurseHours;

    const rnHours = parseFloatField(row.rn_hours_per_resident_per_day);
    if (rnHours !== null) updates.rn_hours_per_resident_per_day = rnHours;

    const lpnHours = parseFloatField(row.lpn_hours_per_resident_per_day);
    if (lpnHours !== null) updates.lpn_hours_per_resident_per_day = lpnHours;

    const cnaHours = parseFloatField(row.cna_hours_per_resident_per_day);
    if (cnaHours !== null) updates.cna_hours_per_resident_per_day = cnaHours;

    const weekendTotal = parseFloatField(row.weekend_nurse_hours_per_resident_per_day);
    if (weekendTotal !== null) updates.weekend_nurse_hours_per_resident_per_day = weekendTotal;

    const weekendRn = parseFloatField(row.weekend_rn_hours_per_resident_per_day);
    if (weekendRn !== null) updates.weekend_rn_hours_per_resident_per_day = weekendRn;

    const turnover = parseFloatField(row.total_nurse_staff_turnover);
    if (turnover !== null) updates.total_nurse_staff_turnover = turnover;

    const rnTurnover = parseFloatField(row.rn_turnover);
    if (rnTurnover !== null) updates.rn_turnover = rnTurnover;

    const caseMixTotal = parseFloatField(row.case_mix_total_nurse_hours);
    if (caseMixTotal !== null) updates.case_mix_total_nurse_hours = caseMixTotal;

    const caseMixRN = parseFloatField(row.case_mix_rn_hours);
    if (caseMixRN !== null) updates.case_mix_rn_hours = caseMixRN;

    const inspectionRating = parseFloatField(row.health_inspection_rating);
    if (inspectionRating !== null) updates.health_inspection_rating = inspectionRating;

    const qmRating = parseFloatField(row.quality_measure_rating);
    if (qmRating !== null) updates.quality_measure_rating = qmRating;

    const incidents = parseIntField(row.number_of_facility_reported_incidents);
    if (incidents !== null) updates.number_of_facility_reported_incidents = incidents;

    const complaints = parseIntField(row.number_of_substantiated_complaints);
    if (complaints !== null) updates.number_of_substantiated_complaints = complaints;

    try {
      const { error } = await supabase
        .from("resources")
        .update(updates)
        .eq("id", resourceId);

      if (error) {
        stats.errors++;
        console.error(`❌ Failed to update ${resourceId}: ${error.message}`);
        continue;
      }

      stats.updated++;
      if (stats.updated % 100 === 0) {
        console.log(`   Progress: updated ${stats.updated}/${stats.total}`);
      }
    } catch (err) {
      stats.errors++;
      console.error(`❌ Unexpected error updating ${resourceId}:`, err);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 EXACT MERGE SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total rows processed: ${stats.total}`);
  console.log(`✅ Updated:            ${stats.updated}`);
  console.log(`⚠️  Skipped:            ${stats.skipped}`);
  console.log(`❌ Errors:             ${stats.errors}`);
  console.log("=".repeat(60));

  if (stats.errors === 0) {
    console.log("\n✅ CCN + quality metrics applied to exact-match facilities.");
  } else {
    console.log("\n⚠️  Review errors above before proceeding.");
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
