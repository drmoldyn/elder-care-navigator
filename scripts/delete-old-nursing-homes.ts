#!/usr/bin/env tsx
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

async function deleteOldNursingHomes() {
  console.log("🗑️  Deleting old nursing homes data...\n");

  // First, count how many will be deleted
  const { count } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .contains("category", ["nursing_home"]);

  console.log(`📊 Found ${count} nursing homes to delete`);

  if (count === 0) {
    console.log("✅ No nursing homes to delete");
    return;
  }

  // Confirm deletion
  console.log("\n⚠️  This will delete all existing nursing home records.");
  console.log("   Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Delete them
  const { error } = await supabase
    .from("resources")
    .delete()
    .contains("category", ["nursing_home"]);

  if (error) {
    console.error("❌ Error deleting records:", error);
    process.exit(1);
  }

  console.log(`✅ Deleted ${count} nursing homes`);
  console.log("\n💡 Next step: Run the import script");
  console.log("   pnpm tsx scripts/import-resources-simple.ts data/cms/processed/nursing-homes-processed.csv");
}

deleteOldNursingHomes().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
