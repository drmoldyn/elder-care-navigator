#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const sql = fs.readFileSync("supabase/migrations/0008_add_staffing_metrics.sql", "utf-8");
  
  console.log("Applying migration: 0008_add_staffing_metrics.sql");
  console.log("SQL length:", sql.length);
  
  // Execute the entire migration as one
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  
  if (error) {
    console.error("Error applying migration:", error);
    process.exit(1);
  }
  
  console.log("✅ Migration applied successfully");
}

applyMigration().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
