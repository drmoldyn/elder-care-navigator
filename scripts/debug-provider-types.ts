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

async function debugProviderTypes() {
  console.log("🔍 DEBUGGING PROVIDER TYPES\n");

  // Get 10 sample scores
  const { data: sampleScores } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id")
    .limit(10);

  console.log("Sample facility_ids from sunsetwell_scores:");
  for (const score of sampleScores ?? []) {
    console.log(`  ${score.facility_id}`);

    // Look up this facility in resources
    const { data: resource } = await supabase
      .from("resources")
      .select("id, provider_type, title")
      .eq("id", score.facility_id)
      .single();

    if (resource) {
      console.log(`    ✅ Found: ${resource.provider_type} - ${resource.title}`);
    } else {
      console.log(`    ❌ NOT FOUND in resources table`);
    }
  }

  // Check what provider_type values exist in resources
  console.log("\n All unique provider_type values in resources:");
  const { data: allResources } = await supabase
    .from("resources")
    .select("provider_type")
    .limit(1000);

  const providerTypes = new Set(allResources?.map(r => r.provider_type) || []);
  for (const pt of providerTypes) {
    const { count } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("provider_type", pt);
    console.log(`  "${pt}": ${count} facilities`);
  }

  // Check if sunsetwell_scores has provider_type field
  console.log("\n Sunsetwell_scores schema:");
  const { data: sampleScore } = await supabase
    .from("sunsetwell_scores")
    .select("*")
    .limit(1)
    .single();

  if (sampleScore) {
    console.log("  Fields:", Object.keys(sampleScore));
    if ("provider_type" in sampleScore) {
      console.log(`  provider_type value: ${sampleScore.provider_type}`);
    } else {
      console.log("  ⚠️  provider_type field does NOT exist in sunsetwell_scores");
    }
  }
}

debugProviderTypes()
  .then(() => {
    console.log("\n✅ Debug complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });
