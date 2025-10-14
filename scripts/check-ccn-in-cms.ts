#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checkCCNInCMS() {
  console.log("🔍 CHECKING CCNs IN CMS DATA\n");

  // Read CMS data
  console.log("1. Reading CMS nursing home data...");
  const csvPath = "data/cms/nursing-homes-providers.csv";
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Get all CCNs from CMS
  const cmsccns = new Set<string>();
  for (const record of records) {
    const ccn = (record["CMS Certification Number (CCN)"] || record["Federal Provider Number"] || "").trim();
    if (ccn) {
      cmsccns.add(ccn);
    }
  }

  console.log(`   Found ${cmsccns.size} unique CCNs in CMS data\n`);

  // Get sample facilities without states
  const { data: nullStateFacilities } = await supabase
    .from("resources")
    .select("id, facility_id, title")
    .eq("provider_type", "nursing_home")
    .is("states", null)
    .limit(20);

  console.log("2. Checking if null-state CCNs exist in CMS data:\n");

  let inCMS = 0;
  let notInCMS = 0;

  for (const facility of nullStateFacilities ?? []) {
    const exists = cmsccns.has(facility.facility_id);
    if (exists) {
      inCMS++;
      console.log(`  ✅ ${facility.facility_id} - IN CMS - ${facility.title}`);
    } else {
      notInCMS++;
      console.log(`  ❌ ${facility.facility_id} - NOT IN CMS - ${facility.title}`);
    }
  }

  console.log(`\nSummary of sample (${nullStateFacilities?.length} facilities):`);
  console.log(`  In CMS data:     ${inCMS}`);
  console.log(`  Not in CMS data: ${notInCMS}`);

  // Now check all 1976 facilities
  console.log("\n3. Checking all 1976 facilities with null states...");

  const { data: allNullState } = await supabase
    .from("resources")
    .select("facility_id")
    .eq("provider_type", "nursing_home")
    .is("states", null);

  let allInCMS = 0;
  let allNotInCMS = 0;

  for (const facility of allNullState ?? []) {
    if (cmsccns.has(facility.facility_id)) {
      allInCMS++;
    } else {
      allNotInCMS++;
    }
  }

  console.log(`\nAll 1976 facilities:`);
  console.log(`  In CMS data:     ${allInCMS}`);
  console.log(`  Not in CMS data: ${allNotInCMS}`);
}

checkCCNInCMS()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
