#!/usr/bin/env tsx
/**
 * Delete nursing home resources by ID.
 *
 * Usage:
 *   pnpm tsx scripts/delete-nursing-homes-by-ids.ts --input data/cms/processed/nursing-homes-db-ambiguous.csv --dry-run
 *   pnpm tsx scripts/delete-nursing-homes-by-ids.ts --input data/cms/processed/nursing-homes-db-ambiguous.csv --execute
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
  console.error("❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CliOptions {
  input: string;
  column: string;
  dryRun: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let input = "data/cms/processed/nursing-homes-db-ambiguous.csv";
  let column = "resource_id";
  let dryRun = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--input" && args[i + 1]) {
      input = args[i + 1];
      i++;
      continue;
    }
    if (arg.startsWith("--input=")) {
      input = arg.split("=")[1];
      continue;
    }
    if (arg === "--column" && args[i + 1]) {
      column = args[i + 1];
      i++;
      continue;
    }
    if (arg.startsWith("--column=")) {
      column = arg.split("=")[1];
      continue;
    }
    if (arg === "--execute") {
      dryRun = false;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
  }

  return { input, column, dryRun };
}

function loadIds(inputPath: string, column: string): string[] {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const ext = path.extname(inputPath).toLowerCase();
  const uniqueIds = new Set<string>();

  if (ext === ".csv") {
    const content = fs.readFileSync(inputPath, "utf-8");
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    rows.forEach((row) => {
      const value = row[column];
      if (value && value.trim()) {
        uniqueIds.add(value.trim());
      }
    });
  } else {
    const content = fs.readFileSync(inputPath, "utf-8");
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((value) => uniqueIds.add(value));
  }

  return Array.from(uniqueIds);
}

async function deleteIds(ids: string[]) {
  const chunkSize = 200;
  let deleted = 0;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error, count } = await supabase
      .from("resources")
      .delete({ count: "exact" })
      .in("id", chunk);

    if (error) {
      throw new Error(`Failed to delete batch starting at index ${i}: ${error.message}`);
    }

    deleted += count ?? 0;
    console.log(`   Deleted ${deleted}/${ids.length}...`);
  }

  return deleted;
}

async function main() {
  const options = parseArgs();
  console.log("🗑️  Nursing Home Deletion Utility\n");
  console.log(`Input file: ${options.input}`);
  console.log(`Column:     ${options.column}`);
  console.log(`Mode:       ${options.dryRun ? "DRY RUN" : "EXECUTE"}`);

  const ids = loadIds(options.input, options.column);

  if (ids.length === 0) {
    console.log("⚠️  No IDs found in input file. Nothing to do.");
    return;
  }

  console.log(`📋 Unique resource IDs loaded: ${ids.length}`);
  console.log(`   Sample: ${ids.slice(0, 5).join(", ")}${ids.length > 5 ? ", ..." : ""}`);

  if (options.dryRun) {
    console.log("\nDry run complete. Re-run with --execute to delete.");
    return;
  }

  console.log("\n🚨 Executing deletions...\n");
  const deleted = await deleteIds(ids);
  console.log(`\n✅ Deleted ${deleted} nursing home records from Supabase.`);
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
