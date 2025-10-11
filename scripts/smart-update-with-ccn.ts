#!/usr/bin/env tsx
/**
 * Smart Update: Merge new CMS data while preserving existing geocoding
 *
 * Strategy:
 * 1. For facilities in both DB and CSV (matched by CCN) → UPDATE with new data, KEEP geocoding
 * 2. For facilities only in CSV (new) → INSERT new record, geocoding needed later
 * 3. For facilities only in DB (closed) → DELETE or mark inactive
 *
 * This preserves ~$74 of geocoding work!
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

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === "true" || lower === "yes" || lower === "1";
}

function parseArray(value: string | undefined, delimiter = ";"): string[] | null {
  if (!value || value.trim() === "") return null;
  return value.split(delimiter).map((v) => v.trim()).filter(Boolean);
}

interface UpdateStats {
  updated: number;
  inserted: number;
  toDelete: number;
  geocodingPreserved: number;
  geocodingNeeded: number;
  errors: number;
}

async function smartUpdate() {
  const stats: UpdateStats = {
    updated: 0,
    inserted: 0,
    toDelete: 0,
    geocodingPreserved: 0,
    geocodingNeeded: 0,
    errors: 0,
  };

  console.log("🔄 Smart Update: Merging CMS data while preserving geocoding\n");

  // Step 1: Load all existing nursing homes from DB
  console.log("📊 Loading existing nursing homes from database...");
  const { data: existingRecords, error: fetchError } = await supabase
    .from("resources")
    .select("id, facility_id, title, latitude, longitude")
    .eq("provider_type", "nursing_home");

  if (fetchError) {
    console.error("❌ Error fetching existing records:", fetchError);
    process.exit(1);
  }

  console.log(`   Found ${existingRecords?.length || 0} existing records\n`);

  // Create lookup map by CCN
  const existingByCCN = new Map<string, any>();
  (existingRecords || []).forEach((record) => {
    if (record.facility_id) {
      existingByCCN.set(record.facility_id, record);
    }
  });

  console.log(`   ${existingByCCN.size} records have CCN for matching\n`);

  // Step 2: Load CSV with new data
  console.log("📂 Loading new CMS data from CSV...");
  const csvPath = "data/cms/processed/nursing-homes-processed.csv";
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const csvRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${csvRecords.length} records in CSV\n`);

  // Track which CCNs are in CSV
  const csvCCNs = new Set<string>();

  // Step 3: Process each CSV record
  console.log("🔄 Processing records...\n");

  for (let i = 0; i < csvRecords.length; i++) {
    const row = csvRecords[i];
    const ccn = parseString(row.facility_id);

    if (!ccn) {
      console.log(`⚠️  Skipping record without CCN: ${row.facility_name}`);
      stats.errors++;
      continue;
    }

    csvCCNs.add(ccn);

    // Prepare data from CSV
    const newData = {
      facility_id: ccn,
      title: row.facility_name || row.title,
      url: parseString(row.website) || `https://example.com/facility/${ccn}`,
      description: parseString(row.description) || `${row.facility_name} - nursing home`,
      best_for: parseString(row.best_for),
      category: parseArray(row.category) || ["nursing_home"],
      conditions: parseArray(row.conditions) || parseArray(row.specialties) || [],
      urgency_level: parseString(row.urgency_level) || "high",
      location_type: "local",
      states: parseArray(row.states) || (row.state ? [row.state] : null),
      requires_zip: false,
      street_address: parseString(row.address),
      city: parseString(row.city),
      zip_code: parseString(row.zip_code),
      county: parseString(row.county),
      medicare_accepted: parseBoolean(row.medicare_accepted),
      medicaid_accepted: parseBoolean(row.medicaid_accepted),
      private_insurance_accepted: parseBoolean(row.private_insurance_accepted),
      veterans_affairs_accepted: parseBoolean(row.veterans_affairs_accepted),
      npi: parseString(row.npi),
      provider_type: "nursing_home",
      total_beds: parseInt(row.total_beds),
      ownership_type: parseString(row.ownership_type),
      quality_rating: parseFloat(row.quality_rating),
      services_offered: parseArray(row.services_offered),
      specialties: parseArray(row.specialties),
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
      updated_at: new Date().toISOString(),
    };

    const existing = existingByCCN.get(ccn);

    if (existing) {
      // UPDATE: Facility exists, preserve geocoding if available
      const hasGeocoding = existing.latitude != null && existing.longitude != null;

      if (hasGeocoding) {
        // Preserve existing coordinates
        newData.latitude = existing.latitude;
        newData.longitude = existing.longitude;
        stats.geocodingPreserved++;
      } else {
        // Add coordinates from CSV if available
        newData.latitude = parseFloat(row.latitude);
        newData.longitude = parseFloat(row.longitude);
        if (newData.latitude == null || newData.longitude == null) {
          stats.geocodingNeeded++;
        }
      }

      const { error: updateError } = await supabase
        .from("resources")
        .update(newData)
        .eq("id", existing.id);

      if (updateError) {
        console.error(`❌ Error updating ${ccn}:`, updateError.message);
        stats.errors++;
      } else {
        stats.updated++;
        if ((stats.updated + stats.inserted) % 100 === 0) {
          console.log(`   Progress: ${stats.updated} updated, ${stats.inserted} inserted...`);
        }
      }
    } else {
      // INSERT: New facility, add coordinates from CSV
      newData.latitude = parseFloat(row.latitude);
      newData.longitude = parseFloat(row.longitude);

      if (newData.latitude == null || newData.longitude == null) {
        stats.geocodingNeeded++;
      }

      const { error: insertError } = await supabase
        .from("resources")
        .insert(newData);

      if (insertError) {
        console.error(`❌ Error inserting ${ccn}:`, insertError.message);
        stats.errors++;
      } else {
        stats.inserted++;
        if ((stats.updated + stats.inserted) % 100 === 0) {
          console.log(`   Progress: ${stats.updated} updated, ${stats.inserted} inserted...`);
        }
      }
    }
  }

  // Step 4: Identify facilities to delete (in DB but not in CSV)
  console.log("\n🔍 Identifying facilities no longer in CMS data...");
  const toDelete: string[] = [];
  existingByCCN.forEach((record, ccn) => {
    if (!csvCCNs.has(ccn)) {
      toDelete.push(record.id);
    }
  });

  stats.toDelete = toDelete.length;

  if (toDelete.length > 0) {
    console.log(`   Found ${toDelete.length} facilities to delete (closed/delisted)\n`);
    console.log("   ⚠️  Note: Not deleting automatically. Review first.");
    console.log("   Run this to delete:");
    console.log(`   DELETE FROM resources WHERE id IN (${toDelete.map(id => `'${id}'`).slice(0, 10).join(", ")}...);`);
  }

  // Final report
  console.log("\n" + "=".repeat(70));
  console.log("📊 SMART UPDATE SUMMARY");
  console.log("=".repeat(70));
  console.log(`✅ Updated (existing):     ${stats.updated}`);
  console.log(`✅ Inserted (new):         ${stats.inserted}`);
  console.log(`⚠️  To delete (closed):     ${stats.toDelete}`);
  console.log(`💾 Geocoding preserved:   ${stats.geocodingPreserved} facilities`);
  console.log(`📍 Geocoding needed:      ${stats.geocodingNeeded} facilities`);
  console.log(`❌ Errors:                ${stats.errors}`);
  console.log("=".repeat(70));

  // Cost savings
  const savedCost = stats.geocodingPreserved * 0.005;
  const neededCost = stats.geocodingNeeded * 0.005;

  console.log(`\n💰 COST ANALYSIS:`);
  console.log(`   Geocoding preserved: $${savedCost.toFixed(2)} saved`);
  console.log(`   Geocoding needed:    $${neededCost.toFixed(2)} required`);
  console.log(`   Total savings:       $${savedCost.toFixed(2)}`);

  // Next steps
  console.log(`\n🎯 NEXT STEPS:`);
  if (stats.geocodingNeeded > 0) {
    console.log(`   1. Geocode ${stats.geocodingNeeded} facilities without coordinates:`);
    console.log(`      pnpm tsx scripts/geocode-facilities.ts --provider-type=nursing_home --missing-only`);
  }
  if (stats.toDelete > 0) {
    console.log(`   2. Review and delete ${stats.toDelete} closed facilities (optional)`);
  }
  console.log(`   3. Calculate SunsetWell Scores once geocoding complete`);

  console.log("\n" + "=".repeat(70));
}

smartUpdate().catch(console.error);
