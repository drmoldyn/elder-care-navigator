#!/usr/bin/env tsx

import { parse } from "csv-parse/sync";
import fs from "fs";
import dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config({ path: ".env.local" });

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!SUPABASE_DB_PASSWORD || !SUPABASE_PROJECT_REF) {
  throw new Error("Missing SUPABASE_DB_PASSWORD or NEXT_PUBLIC_SUPABASE_URL");
}

async function populateStatesBulk() {
  console.log("📋 BULK POPULATING NURSING HOME STATES\n");

  // Read CMS data
  console.log("1. Reading CMS nursing home data...");
  const csvPath = "data/cms/nursing-homes-providers.csv";
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Build CCN → State mapping
  const ccnToState = new Map<string, string>();
  for (const record of records) {
    const ccn = (record["CMS Certification Number (CCN)"] || record["Federal Provider Number"] || "").trim();
    const state = (record["State"] || record["Provider State"] || "").trim().toUpperCase();

    if (ccn && state && state.length === 2) {
      ccnToState.set(ccn, state);
    }
  }

  console.log(`   Built mapping for ${ccnToState.size} CCNs\n`);

  // Generate SQL VALUES clause
  console.log("2. Generating SQL script...");
  const values = Array.from(ccnToState.entries())
    .map(([ccn, state]) => `('${ccn}', '${state}')`)
    .join(',\n  ');

  const sql = `
-- Bulk update states for nursing homes using CMS CCN → State mapping
BEGIN;

-- Create temporary table with CCN → State mapping
CREATE TEMP TABLE ccn_states (
  ccn TEXT PRIMARY KEY,
  state TEXT NOT NULL
);

-- Insert all CCN → State mappings
INSERT INTO ccn_states (ccn, state) VALUES
  ${values};

-- Update resources table using JOIN
UPDATE resources
SET states = ARRAY[ccn_states.state]
FROM ccn_states
WHERE
  resources.facility_id = ccn_states.ccn
  AND resources.provider_type = 'nursing_home'
  AND resources.states IS NULL;

-- Report results
SELECT
  COUNT(*) FILTER (WHERE states IS NOT NULL) as with_states,
  COUNT(*) FILTER (WHERE states IS NULL) as without_states,
  COUNT(*) as total
FROM resources
WHERE provider_type = 'nursing_home';

COMMIT;
`;

  // Write SQL to temp file
  const sqlPath = "/tmp/populate-states.sql";
  fs.writeFileSync(sqlPath, sql);
  console.log(`   Generated SQL script with ${ccnToState.size} mappings\n`);

  // Execute via psql
  console.log("3. Executing bulk update via psql...");
  const connectionString = `postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  try {
    const output = execSync(`psql "${connectionString}" -f ${sqlPath}`, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    console.log(output);
    console.log("\n✅ Bulk update complete!");
  } catch (error: any) {
    console.error("\n❌ Bulk update failed:");
    console.error(error.stdout || error.stderr || error.message);
    throw error;
  }
}

populateStatesBulk()
  .then(() => {
    console.log("\n✅ States population complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ States population failed:", error);
    process.exit(1);
  });
