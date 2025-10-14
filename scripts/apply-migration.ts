#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { execSql } from "./lib/exec-sql";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function resolveMigrationPath(arg?: string): string {
  if (arg && fs.existsSync(arg)) return arg;
  // Fallback: find latest file matching suffix
  const dir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('add_staffing_metrics.sql')).sort();
  if (files.length === 0) {
    throw new Error('Migration file not found. Pass a path, e.g. supabase/migrations/202510140945_add_staffing_metrics.sql');
  }
  return path.join(dir, files[files.length - 1]);
}

async function applyMigration() {
  const migrationPath = resolveMigrationPath(process.argv[2]);
  const sql = fs.readFileSync(migrationPath, "utf-8");
  
  console.log("Applying migration:", path.basename(migrationPath));
  console.log("SQL length:", sql.length);
  
  const result = await execSql(supabase, sql, { supabaseUrl, serviceKey: supabaseServiceKey });
  if (!result.ok) {
    console.error("Error applying migration:", result.error);
    process.exit(1);
  }
  
  console.log("✅ Migration applied successfully");
}

applyMigration().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
