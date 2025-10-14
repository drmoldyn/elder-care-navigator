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

async function populateStatesParallel() {
  console.log("📋 POPULATING NURSING HOME STATES (PARALLEL)\n");

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

  // Get all nursing homes WITHOUT states (paginated)
  console.log("2. Fetching nursing homes without states...");
  let allNursingHomes: any[] = [];
  let page = 0;
  const fetchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * fetchSize;
    const to = from + fetchSize - 1;

    const { data, error } = await supabase
      .from("resources")
      .select("id, facility_id")
      .eq("provider_type", "nursing_home")
      .is("states", null)
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch nursing homes: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allNursingHomes.push(...data);
      if (data.length < fetchSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`   Found ${allNursingHomes.length} nursing homes without states\n`);

  // Filter to only those with matching CCNs
  const updates = allNursingHomes
    .map(nh => {
      const state = ccnToState.get(nh.facility_id);
      if (!state) return null;
      return { id: nh.id, state };
    })
    .filter(Boolean) as Array<{ id: string; state: string }>;

  console.log(`   Prepared ${updates.length} updates\n`);

  // Update in parallel batches
  console.log("3. Executing parallel batch updates...");
  const parallelBatchSize = 50; // Update 50 at a time in parallel
  let completed = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i += parallelBatchSize) {
    const batch = updates.slice(i, i + parallelBatchSize);

    // Execute all updates in this batch in parallel
    const updatePromises = batch.map(async ({ id, state }) => {
      const { error } = await supabase
        .from("resources")
        .update({ states: [state] })
        .eq("id", id);

      if (error) {
        errors++;
        return false;
      }
      return true;
    });

    const results = await Promise.all(updatePromises);
    completed += results.filter(Boolean).length;

    const progress = Math.min(i + parallelBatchSize, updates.length);
    const pct = ((progress / updates.length) * 100).toFixed(1);
    console.log(`   Progress: ${progress} / ${updates.length} (${pct}%) | ✅ ${completed} | ❌ ${errors}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total facilities processed:     ${allNursingHomes.length}`);
  console.log(`Successfully updated:           ${completed}`);
  console.log(`Errors:                         ${errors}`);
  console.log(`No CCN match:                   ${allNursingHomes.length - updates.length}`);
  console.log("=".repeat(80));
}

populateStatesParallel()
  .then(() => {
    console.log("\n✅ States population complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ States population failed:", error);
    process.exit(1);
  });
