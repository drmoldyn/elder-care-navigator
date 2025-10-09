#!/usr/bin/env tsx
/**
 * Debug Supabase connection
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Debug Information:\n");
console.log("URL:", supabaseUrl);
console.log("Service Key (first 20 chars):", supabaseServiceKey?.slice(0, 20) + "...");
console.log("");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
  // Try to query a system table first
  console.log("Testing connection with a simple query...\n");

  const { data, error } = await supabase
    .from("resources")
    .select("count");

  console.log("Query result:");
  console.log("  Data:", data);
  console.log("  Error:", error);

  if (error) {
    console.log("\nError details:");
    console.log("  Code:", error.code);
    console.log("  Message:", error.message);
    console.log("  Details:", error.details);
    console.log("  Hint:", error.hint);
  }
}

debug().catch(console.error);
