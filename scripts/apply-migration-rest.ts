#!/usr/bin/env tsx
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

async function runSQL(sql: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: "POST",
    headers: {
      "apikey": supabaseServiceKey,
      "Authorization": `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed: ${response.status} - ${text}`);
  }

  return await response.json();
}

async function applyMigration() {
  console.log("🔄 Applying migration...\n");

  const statements = [
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS staffing_rating numeric(2,1)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS total_nurse_hours_per_resident_per_day numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS rn_hours_per_resident_per_day numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS lpn_hours_per_resident_per_day numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS cna_hours_per_resident_per_day numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS weekend_nurse_hours_per_resident_per_day numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS weekend_rn_hours_per_resident_per_day numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS total_nurse_staff_turnover numeric(5,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS rn_turnover numeric(5,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS case_mix_total_nurse_hours numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS case_mix_rn_hours numeric(4,2)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS health_inspection_rating numeric(2,1)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS quality_measure_rating numeric(2,1)",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS number_of_facility_reported_incidents integer",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS number_of_substantiated_complaints integer",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS number_of_certified_beds integer",
  ];

  for (const sql of statements) {
    try {
      console.log(`Executing: ${sql.substring(0, 80)}...`);
      await runSQL(sql);
      console.log("✅ Success");
    } catch (err) {
      console.error(`❌ Error: ${err}`);
    }
  }

  console.log("\n✅ Migration complete!");
}

applyMigration().catch(console.error);
