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

async function populateStates() {
  console.log("📋 POPULATING NURSING HOME STATES FROM CMS DATA\n");

  // Read CMS data
  console.log("1. Reading CMS nursing home data...");
  const csvPath = "data/cms/nursing-homes-providers.csv";
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Loaded ${records.length} records from CMS file`);

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

  // Get all nursing homes from database
  console.log("2. Fetching nursing homes from database...");
  let allNursingHomes: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("resources")
      .select("id, facility_id, title, states")
      .eq("provider_type", "nursing_home")
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch nursing homes: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allNursingHomes.push(...data);
      console.log(`   Loaded page ${page + 1}: ${data.length} nursing homes (total: ${allNursingHomes.length})`);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`   Total nursing homes: ${allNursingHomes.length}\n`);

  // Update nursing homes with states
  console.log("3. Updating nursing homes with state data...");

  let updated = 0;
  let alreadyHaveStates = 0;
  let noMatch = 0;
  let errors = 0;

  const batchSize = 100;
  for (let i = 0; i < allNursingHomes.length; i += batchSize) {
    const batch = allNursingHomes.slice(i, i + batchSize);

    for (const nh of batch) {
      // Skip if already has states
      if (nh.states && Array.isArray(nh.states) && nh.states.length > 0 && nh.states[0]) {
        alreadyHaveStates++;
        continue;
      }

      // Look up state by CCN
      const state = ccnToState.get(nh.facility_id);

      if (!state) {
        noMatch++;
        if (noMatch <= 5) {
          console.log(`   ⚠️  No state match for CCN: ${nh.facility_id} (${nh.title})`);
        }
        continue;
      }

      // Update with state
      const { error: updateError } = await supabase
        .from("resources")
        .update({ states: [state] })
        .eq("id", nh.id);

      if (updateError) {
        errors++;
        if (errors <= 5) {
          console.error(`   ❌ Error updating ${nh.title}: ${updateError.message}`);
        }
      } else {
        updated++;
      }
    }

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= allNursingHomes.length) {
      console.log(`   Progress: ${Math.min(i + batchSize, allNursingHomes.length)} / ${allNursingHomes.length} processed...`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total nursing homes:           ${allNursingHomes.length}`);
  console.log(`Already had states:            ${alreadyHaveStates}`);
  console.log(`Newly updated with states:     ${updated}`);
  console.log(`No CCN match in CMS data:      ${noMatch}`);
  console.log(`Errors:                        ${errors}`);
  console.log(`Final with states:             ${alreadyHaveStates + updated}`);
  console.log(`Coverage:                      ${(((alreadyHaveStates + updated) / allNursingHomes.length) * 100).toFixed(1)}%`);
  console.log("=".repeat(80));
}

populateStates()
  .then(() => {
    console.log("\n✅ States population complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ States population failed:", error);
    process.exit(1);
  });
