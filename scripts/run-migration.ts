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

async function runMigration() {
  console.log("🔄 Applying staffing metrics migration...\n");

  const columns = [
    { name: "staffing_rating", type: "numeric(2,1)" },
    { name: "total_nurse_hours_per_resident_per_day", type: "numeric(4,2)" },
    { name: "rn_hours_per_resident_per_day", type: "numeric(4,2)" },
    { name: "lpn_hours_per_resident_per_day", type: "numeric(4,2)" },
    { name: "cna_hours_per_resident_per_day", type: "numeric(4,2)" },
    { name: "weekend_nurse_hours_per_resident_per_day", type: "numeric(4,2)" },
    { name: "weekend_rn_hours_per_resident_per_day", type: "numeric(4,2)" },
    { name: "total_nurse_staff_turnover", type: "numeric(5,2)" },
    { name: "rn_turnover", type: "numeric(5,2)" },
    { name: "case_mix_total_nurse_hours", type: "numeric(4,2)" },
    { name: "case_mix_rn_hours", type: "numeric(4,2)" },
    { name: "health_inspection_rating", type: "numeric(2,1)" },
    { name: "quality_measure_rating", type: "numeric(2,1)" },
    { name: "number_of_facility_reported_incidents", type: "integer" },
    { name: "number_of_substantiated_complaints", type: "integer" },
    { name: "number_of_certified_beds", type: "integer" },
  ];

  // Check which columns already exist
  const { data: existingColumns } = await supabase
    .from("resources")
    .select("*")
    .limit(1);

  if (existingColumns && existingColumns.length > 0) {
    const existing = Object.keys(existingColumns[0]);
    console.log("📋 Checking existing columns...");
    
    const missingColumns = columns.filter(col => !existing.includes(col.name));
    
    if (missingColumns.length === 0) {
      console.log("✅ All staffing columns already exist!");
    } else {
      console.log(`⚠️  Missing ${missingColumns.length} columns:`);
      missingColumns.forEach(col => console.log(`   - ${col.name}`));
      console.log("\n💡 Run the following SQL in Supabase SQL Editor:");
      console.log("   scripts/apply-staffing-migration.sql");
    }
  }
}

runMigration().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
