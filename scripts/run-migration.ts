#!/usr/bin/env tsx
/**
 * Run database migration on Supabase
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("🚀 Running database migration...\n");

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/0001_init.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");

  console.log("📄 Migration file loaded");
  console.log(`   Path: ${migrationPath}`);
  console.log(`   Size: ${sql.length} characters\n`);

  // Execute migration using RPC
  // Note: Supabase client doesn't have a direct SQL execution method,
  // so we'll need to use the REST API directly
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // If the RPC method doesn't exist, we'll need to run statements individually
    console.log(
      "⚠️  Direct SQL execution not available, running via SQL Editor method..."
    );
    console.log(
      "\n📋 Please run the migration manually via Supabase Dashboard:"
    );
    console.log("   1. Go to: https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql");
    console.log("   2. Open SQL Editor");
    console.log("   3. Paste contents of: supabase/migrations/0001_init.sql");
    console.log("   4. Click Run\n");
    process.exit(1);
  }

  console.log("✅ Migration executed successfully!\n");

  // Verify tables were created
  console.log("🔍 Verifying tables...\n");
  const tables = ["resources", "user_sessions", "leads", "resource_feedback"];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`❌ ${table}: FAILED (${error.message})`);
    } else {
      console.log(`✅ ${table}: EXISTS (${count || 0} rows)`);
    }
  }

  console.log("\n✨ Migration complete!");
}

runMigration().catch(console.error);
