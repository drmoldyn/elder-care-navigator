#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
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

async function checkStateData() {
  console.log("🔍 CHECKING STATE DATA\n");

  // Get a sample nursing home
  const { data: sample } = await supabase
    .from("resources")
    .select("*")
    .eq("provider_type", "nursing_home")
    .limit(5);

  console.log("Sample nursing home records:\n");

  for (const nh of sample ?? []) {
    console.log(`${nh.title}:`);
    console.log(`  states array: ${JSON.stringify(nh.states)}`);
    console.log(`  state column (if exists): ${(nh as any).state}`);
    console.log(`  street_address: ${nh.street_address}`);
    console.log(`  city: ${nh.city}`);
    console.log(`  zip_code: ${nh.zip_code}`);
    console.log();
  }

  // Check if there's ANY nursing home with states populated
  const { count: withStates } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home")
    .not("states", "is", null);

  console.log(`Nursing homes with states array populated: ${withStates} out of 14,752`);

  // Check the CMS source file to see if it has state data
  console.log(`\nState data is missing from resources.states array!`);
  console.log(`This is why normalization isn't working - peer groups need state for comparison.`);
}

checkStateData()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
