#!/usr/bin/env tsx
/**
 * Enhanced CSV Resource Importer
 * Supports geolocation, insurance coverage, and medical system proximity
 *
 * Usage:
 *   pnpm tsx scripts/import-resources-enhanced.ts <path-to-csv> [--compute-proximity]
 *
 * Example:
 *   pnpm tsx scripts/import-resources-enhanced.ts data/cms-home-health.csv --compute-proximity
 *
 * CSV Format:
 *   facility_id,facility_name,category,address,city,state,zip_code,county,phone,website,email,
 *   npi,medicare_accepted,medicaid_accepted,private_insurance_accepted,veterans_affairs_accepted,
 *   total_beds,ownership_type,quality_rating,services_offered,specialties,latitude,longitude,
 *   description,best_for,urgency_level,location_type,audience,living_situation,cost,source_authority
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

interface ImportSummary {
  inserted: number;
  updated: number;
  skipped: number;
  proximity_computed: number;
  errors: Array<{ row: number; message: string }>;
}

interface CsvRow {
  facility_id?: string;
  facility_name: string;
  category: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  phone?: string;
  website?: string;
  email?: string;
  npi?: string;
  medicare_accepted?: string;
  medicaid_accepted?: string;
  private_insurance_accepted?: string;
  veterans_affairs_accepted?: string;
  total_beds?: string;
  ownership_type?: string;
  quality_rating?: string;
  services_offered?: string;
  specialties?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  best_for?: string;
  urgency_level?: string;
  location_type?: string;
  states?: string;
  audience?: string;
  living_situation?: string;
  cost?: string;
  source_authority?: string;
  provider_type?: string;
  insurance_notes?: string;
  hours_available?: string;
  conditions?: string;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === "true" || lower === "yes" || lower === "1";
}

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

function parseArray(value: string | undefined, delimiter = ";"): string[] | null {
  if (!value || value.trim() === "") return null;
  return value.split(delimiter).map((v) => v.trim()).filter(Boolean);
}

function parseString(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

async function importResources(
  csvPath: string,
  computeProximity: boolean
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    proximity_computed: 0,
    errors: [],
  };

  // 1. Read CSV file
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📂 Found ${records.length} rows in ${path.basename(csvPath)}`);

  // 2. Process each row
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // Account for header + 0-index

    try {
      // Map CSV to enhanced schema
      const dbRecord = {
        // Core info (required)
        title: row.facility_name,
        url: parseString(row.website) || `https://example.com/${row.facility_id || i}`,
        description: parseString(row.description) || `${row.facility_name} - ${row.category}`,
        best_for: parseString(row.best_for),

        // Categorization
        category: parseArray(row.category) || [row.category],
        conditions: parseArray(row.conditions) || parseArray(row.specialties) || [],
        urgency_level: parseString(row.urgency_level) || "medium",

        // Location
        location_type: parseString(row.location_type) || (row.state ? "state" : "national"),
        states: parseArray(row.states) || (row.state ? [row.state] : null),
        requires_zip: false,

        // Address fields (new)
        street_address: parseString(row.address),
        city: parseString(row.city),
        state: parseString(row.state),
        zip_code: parseString(row.zip_code),
        county: parseString(row.county),
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),

        // Insurance (new)
        medicare_accepted: parseBoolean(row.medicare_accepted),
        medicaid_accepted: parseBoolean(row.medicaid_accepted),
        private_insurance_accepted: parseBoolean(row.private_insurance_accepted),
        veterans_affairs_accepted: parseBoolean(row.veterans_affairs_accepted),
        insurance_notes: parseString(row.insurance_notes),

        // Provider identification (new)
        facility_id: parseString(row.facility_id),
        npi: parseString(row.npi),
        provider_type: parseString(row.provider_type) || parseString(row.category),

        // Facility characteristics (new)
        total_beds: parseInt(row.total_beds),
        ownership_type: parseString(row.ownership_type),
        quality_rating: parseFloat(row.quality_rating),
        services_offered: parseArray(row.services_offered) || parseArray(row.category),
        specialties: parseArray(row.specialties),

        // Audience
        audience: parseArray(row.audience) || ["caregiver", "patient"],
        living_situation: parseArray(row.living_situation),

        // Resource details
        cost: parseString(row.cost) || "varies",
        contact_phone: parseString(row.phone),
        contact_email: parseString(row.email),
        hours_available: parseString(row.hours_available),

        // Metadata
        source_authority: parseString(row.source_authority) || "CMS",
        last_verified: new Date().toISOString(),

        // Monetization (defaults)
        affiliate_url: null,
        affiliate_network: null,
        is_sponsored: false,
      };

      // Insert or update
      const { data, error } = await supabase
        .from("resources")
        .upsert(dbRecord, {
          onConflict: "facility_id",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        summary.errors.push({
          row: rowNum,
          message: `DB error: ${error.message}`,
        });
        console.error(`❌ Row ${rowNum}: ${error.message}`);
      } else if (data && data.length > 0) {
        const resourceId = data[0].id;
        summary.inserted++;
        console.log(`✅ Row ${rowNum}: Inserted "${dbRecord.title}"`);

        // Compute proximity if requested and coordinates available
        if (computeProximity && dbRecord.latitude && dbRecord.longitude) {
          try {
            const { data: proximityData, error: proximityError } = await supabase.rpc(
              "compute_resource_medical_proximity",
              {
                resource_uuid: resourceId,
                radius_miles: 120,
              }
            );

            if (proximityError) {
              console.warn(
                `⚠️  Row ${rowNum}: Proximity computation failed: ${proximityError.message}`
              );
            } else if (proximityData !== null) {
              summary.proximity_computed++;
              console.log(
                `   📍 Computed proximity to ${proximityData} medical system(s)`
              );
            }
          } catch (proximityErr) {
            console.warn(
              `⚠️  Row ${rowNum}: Proximity computation error: ${proximityErr}`
            );
          }
        }
      } else {
        summary.skipped++;
        console.log(`⏭️  Row ${rowNum}: Skipped (no changes)`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown validation error";
      summary.errors.push({ row: rowNum, message });
      console.error(`❌ Row ${rowNum}: ${message}`);
    }
  }

  return summary;
}

// Main execution
const csvPath = process.argv[2];
const computeProximity = process.argv.includes("--compute-proximity");

if (!csvPath) {
  console.error(
    "❌ Usage: pnpm tsx scripts/import-resources-enhanced.ts <csv-path> [--compute-proximity]"
  );
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ File not found: ${csvPath}`);
  process.exit(1);
}

console.log("🚀 Starting enhanced resource import...");
if (computeProximity) {
  console.log("📍 Proximity computation ENABLED (120-mile radius)\n");
} else {
  console.log("📍 Proximity computation DISABLED (use --compute-proximity to enable)\n");
}

importResources(csvPath, computeProximity)
  .then((summary) => {
    console.log("\n📊 Import Summary:");
    console.log(`   ✅ Inserted:   ${summary.inserted}`);
    console.log(`   🔄 Updated:    ${summary.updated}`);
    console.log(`   ⏭️  Skipped:    ${summary.skipped}`);
    console.log(`   📍 Proximity:  ${summary.proximity_computed}`);
    console.log(`   ❌ Errors:     ${summary.errors.length}`);

    if (summary.errors.length > 0) {
      console.log("\n⚠️  Errors:");
      summary.errors.slice(0, 10).forEach((e) =>
        console.log(`   Row ${e.row}: ${e.message}`)
      );
      if (summary.errors.length > 10) {
        console.log(`   ... and ${summary.errors.length - 10} more errors`);
      }
    }

    console.log("\n✨ Import complete!");
    process.exit(summary.errors.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
