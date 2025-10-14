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

async function checkRemainingNullStates() {
  console.log("🔍 CHECKING REMAINING NULL STATES\n");

  // Count all nursing homes
  const { count: total } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home");

  console.log(`Total nursing homes: ${total}\n`);

  // Count with states IS NULL
  const { count: nullCount } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home")
    .is("states", null);

  console.log(`Nursing homes with states IS NULL: ${nullCount}\n`);

  // Sample 10 facilities with null states
  const { data: nullSample } = await supabase
    .from("resources")
    .select("id, facility_id, title, states, street_address, city, zip_code")
    .eq("provider_type", "nursing_home")
    .is("states", null)
    .limit(10);

  console.log("Sample facilities with null states:");
  for (const nh of nullSample ?? []) {
    console.log(`  - CCN: ${nh.facility_id}`);
    console.log(`    Name: ${nh.title}`);
    console.log(`    States: ${JSON.stringify(nh.states)}`);
    console.log(`    Address: ${nh.street_address}, ${nh.city} ${nh.zip_code}`);
    console.log();
  }

  // Count with states array populated (any non-null value)
  const { count: withStates } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", "nursing_home")
    .not("states", "is", null);

  console.log(`Nursing homes with states NOT NULL: ${withStates}\n`);

  // Check if any have empty arrays
  const { data: allFacilities } = await supabase
    .from("resources")
    .select("id, facility_id, states")
    .eq("provider_type", "nursing_home")
    .not("states", "is", null)
    .limit(1000);

  const emptyArrays = allFacilities?.filter(f => Array.isArray(f.states) && f.states.length === 0) || [];
  const nullInArray = allFacilities?.filter(f => Array.isArray(f.states) && f.states.length > 0 && f.states[0] === null) || [];

  console.log(`Facilities with empty states array []: ${emptyArrays.length}`);
  console.log(`Facilities with [null] in states: ${nullInArray.length}\n`);

  console.log("Summary:");
  console.log(`  Total nursing homes:        ${total}`);
  console.log(`  With populated states:      ${withStates} (${((withStates! / total!) * 100).toFixed(1)}%)`);
  console.log(`  With null states:           ${nullCount} (${((nullCount! / total!) * 100).toFixed(1)}%)`);
}

checkRemainingNullStates()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
