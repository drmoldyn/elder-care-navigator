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

async function testStatePopulation() {
  console.log("🧪 TESTING STATE POPULATION (DRY RUN)\n");

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

  // Get sample nursing homes WITHOUT states
  console.log("2. Testing on 10 nursing homes without states...");
  const { data: sampleNH } = await supabase
    .from("resources")
    .select("id, facility_id, title, states")
    .eq("provider_type", "nursing_home")
    .is("states", null)
    .limit(10);

  console.log(`   Found ${sampleNH?.length ?? 0} sample facilities\n`);

  let matches = 0;
  let noMatches = 0;

  for (const nh of sampleNH ?? []) {
    const state = ccnToState.get(nh.facility_id);

    if (state) {
      matches++;
      console.log(`   ✅ ${nh.facility_id} → ${state} | ${nh.title}`);
    } else {
      noMatches++;
      console.log(`   ❌ ${nh.facility_id} → NO MATCH | ${nh.title}`);
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Matches: ${matches}/10 (${(matches / 10 * 100).toFixed(0)}%)`);
  console.log(`   No matches: ${noMatches}/10`);

  if (matches >= 8) {
    console.log(`\n✅ Test passed! Ready to run full update.`);
    return true;
  } else {
    console.log(`\n⚠️  Low match rate. Review the issue before proceeding.`);
    return false;
  }
}

testStatePopulation()
  .then((success) => {
    if (success) {
      console.log("\n💡 Run: npx tsx scripts/populate-nursing-home-states.ts");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
