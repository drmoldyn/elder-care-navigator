#!/usr/bin/env tsx
/**
 * Simple CSV Resource Importer (No Geocoding Required)
 * Imports CMS data with address/ZIP only
 *
 * Usage:
 *   pnpm tsx scripts/import-resources-simple.ts <path-to-csv>
 *
 * Example:
 *   pnpm tsx scripts/import-resources-simple.ts data/cms/processed/home-health-processed.csv
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
  errors: Array<{ row: number; message: string }>;
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

async function importResources(csvPath: string): Promise<ImportSummary> {
  const summary: ImportSummary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Read CSV file
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📂 Found ${records.length} rows in ${path.basename(csvPath)}\n`);

  // Process each row
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // Account for header + 0-index

    try {
      // Map CSV to database schema
      const dbRecord = {
        // Core info
        title: row.facility_name || row.title,
        url: parseString(row.website) || `https://example.com/facility/${row.facility_id || i}`,
        description: parseString(row.description) || `${row.facility_name} - ${row.category}`,
        best_for: parseString(row.best_for),

        // Categorization
        category: parseArray(row.category) || [row.category || "elder_care"],
        conditions: parseArray(row.conditions) || parseArray(row.specialties) || [],
        urgency_level: parseString(row.urgency_level) || "medium",

        // Location
        location_type: parseString(row.location_type) || (row.state ? "state" : "national"),
        states: parseArray(row.states) || (row.state ? [row.state] : null),
        requires_zip: false,

        // Address fields (NEW)
        street_address: parseString(row.address) || parseString(row.street_address),
        city: parseString(row.city),
        zip_code: parseString(row.zip_code),
        county: parseString(row.county),

        // Insurance (NEW)
        medicare_accepted: parseBoolean(row.medicare_accepted),
        medicaid_accepted: parseBoolean(row.medicaid_accepted),
        private_insurance_accepted: parseBoolean(row.private_insurance_accepted),
        veterans_affairs_accepted: parseBoolean(row.veterans_affairs_accepted),

        // Provider identification (NEW)
        facility_id: parseString(row.facility_id),
        npi: parseString(row.npi),
        provider_type: parseString(row.provider_type) || parseString(row.category),

        // Facility characteristics (NEW)
        total_beds: parseInt(row.total_beds),
        ownership_type: parseString(row.ownership_type),
        quality_rating: parseFloat(row.quality_rating),
        services_offered: parseArray(row.services_offered),
        specialties: parseArray(row.specialties),

        // Audience
        audience: parseArray(row.audience) || ["caregiver", "patient"],
        living_situation: parseArray(row.living_situation),

        // Resource details
        cost: parseString(row.cost) || "varies",
        contact_phone: parseString(row.phone) || parseString(row.contact_phone),
        contact_email: parseString(row.email) || parseString(row.contact_email),
        hours_available: parseString(row.hours_available),

        // Metadata
        source_authority: parseString(row.source_authority) || "CMS",
        last_verified: new Date().toISOString(),

        // Monetization (defaults)
        affiliate_url: null,
        affiliate_network: null,
        is_sponsored: false,
      };

      // Insert into Supabase
      const { error } = await supabase
        .from("resources")
        .insert(dbRecord);

      if (error) {
        summary.errors.push({
          row: rowNum,
          message: `DB error: ${error.message}`,
        });
        console.error(`❌ Row ${rowNum}: ${error.message}`);
      } else {
        summary.inserted++;
        if (rowNum % 100 === 0) {
          console.log(`✅ Imported ${rowNum} rows...`);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      summary.errors.push({ row: rowNum, message });
      console.error(`❌ Row ${rowNum}: ${message}`);
    }
  }

  return summary;
}

// Main execution
const csvPath = process.argv[2];

if (!csvPath) {
  console.error("❌ Usage: pnpm tsx scripts/import-resources-simple.ts <csv-path>");
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ File not found: ${csvPath}`);
  process.exit(1);
}

console.log("🚀 Starting resource import (address/ZIP only, no geocoding)...\n");

importResources(csvPath)
  .then((summary) => {
    console.log("\n📊 Import Summary:");
    console.log(`   ✅ Inserted:   ${summary.inserted}`);
    console.log(`   🔄 Updated:    ${summary.updated}`);
    console.log(`   ⏭️  Skipped:    ${summary.skipped}`);
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
