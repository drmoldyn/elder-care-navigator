#!/usr/bin/env tsx
/**
 * Quick check to see if database tables exist
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log("🔍 Checking database tables...\n");

  const tables = ["resources", "user_sessions", "leads", "resource_feedback"];

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`❌ ${table}: NOT FOUND (${error.message})`);
    } else {
      console.log(`✅ ${table}: EXISTS (${count || 0} rows)`);
    }
  }

  console.log("\n✨ Check complete!");
}

checkTables().catch(console.error);
