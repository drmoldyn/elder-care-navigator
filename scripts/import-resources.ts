#!/usr/bin/env tsx
/**
 * CSV Resource Importer
 *
 * Usage:
 *   pnpm tsx scripts/import-resources.ts <path-to-csv>
 *
 * Example:
 *   pnpm tsx scripts/import-resources.ts supabase/seed/resources.sample.csv
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import { resourceRecordSchema } from "../src/lib/validation/session";

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
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

async function importResources(csvPath: string): Promise<ImportSummary> {
  const summary: ImportSummary = {
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  // 1. Read CSV file
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
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
      // Validate with Zod schema
      const validated = resourceRecordSchema.parse(row);

      // Transform to DB format
      const dbRecord = {
        title: validated.title,
        url: validated.url,
        description: validated.description,
        best_for: validated.best_for || null,
        category: validated.category.split(";").map((c) => c.trim()),
        conditions: validated.conditions.split(";").map((c) => c.trim()),
        urgency_level: validated.urgency_level,
        location_type: validated.location_type,
        states: validated.states
          ? validated.states.split(";").map((s) => s.trim())
          : null,
        requires_zip: validated.requires_zip,
        audience: validated.audience.split(";").map((a) => a.trim()),
        living_situation: validated.living_situation
          ? validated.living_situation.split(";").map((l) => l.trim())
          : null,
        cost: validated.cost,
        contact_phone: validated.contact_phone || null,
        contact_email: validated.contact_email || null,
        hours_available: validated.hours_available || null,
        affiliate_url: validated.affiliate_url || null,
        affiliate_network: validated.affiliate_network || null,
        is_sponsored: validated.is_sponsored || false,
        source_authority: validated.source_authority,
        last_verified: validated.last_verified || null,
      };

      // Insert into Supabase
      const { error } = await supabase.from("resources").insert(dbRecord);

      if (error) {
        // Check for duplicate
        if (error.code === "23505") {
          summary.skipped++;
          console.log(`⏭️  Row ${rowNum}: Duplicate, skipping`);
        } else {
          summary.errors.push({
            row: rowNum,
            message: `DB error: ${error.message}`,
          });
          console.error(`❌ Row ${rowNum}: ${error.message}`);
        }
      } else {
        summary.inserted++;
        console.log(`✅ Row ${rowNum}: Inserted "${validated.title}"`);
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

if (!csvPath) {
  console.error("❌ Usage: pnpm tsx scripts/import-resources.ts <csv-path>");
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ File not found: ${csvPath}`);
  process.exit(1);
}

console.log("🚀 Starting resource import...\n");

importResources(csvPath)
  .then((summary) => {
    console.log("\n📊 Import Summary:");
    console.log(`   ✅ Inserted: ${summary.inserted}`);
    console.log(`   ⏭️  Skipped:  ${summary.skipped}`);
    console.log(`   ❌ Errors:   ${summary.errors.length}`);

    if (summary.errors.length > 0) {
      console.log("\n⚠️  Errors:");
      summary.errors.forEach((e) =>
        console.log(`   Row ${e.row}: ${e.message}`)
      );
      process.exit(1);
    }

    console.log("\n✨ Import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
