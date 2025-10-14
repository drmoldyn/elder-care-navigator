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

async function diagnoseScoreMismatch() {
  console.log("🔍 DIAGNOSING SCORE MISMATCH\n");

  // Get sample of 10 scores
  const { data: sampleScores } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id, provider_type, overall_score")
    .limit(10);

  console.log("Sample scores from sunsetwell_scores:");
  for (const score of sampleScores ?? []) {
    console.log(`  Facility ID: ${score.facility_id} | Type: ${score.provider_type} | Score: ${score.overall_score}`);

    // Check if this facility_id exists in resources
    const { data: resource } = await supabase
      .from("resources")
      .select("id, title, provider_type")
      .eq("id", score.facility_id)
      .single();

    if (resource) {
      console.log(`    ✅ Found in resources: ${resource.title} (${resource.provider_type})`);
    } else {
      console.log(`    ❌ NOT found in resources`);
    }
  }

  console.log("\n2. Checking if facility_ids in scores are UUIDs or CCNs...");

  const { data: firstScore } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id")
    .limit(1)
    .single();

  console.log(`  Sample facility_id format: ${firstScore?.facility_id}`);
  console.log(`  Length: ${firstScore?.facility_id?.length}`);
  console.log(`  Is UUID format: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstScore?.facility_id || '')}`);

  console.log("\n3. Sample resources table:");
  const { data: sampleResources } = await supabase
    .from("resources")
    .select("id, title, provider_type")
    .eq("provider_type", "nursing_home")
    .limit(5);

  for (const resource of sampleResources ?? []) {
    console.log(`  ID: ${resource.id} | ${resource.title}`);

    // Check if this resource has a score
    const { data: score } = await supabase
      .from("sunsetwell_scores")
      .select("overall_score")
      .eq("facility_id", resource.id)
      .single();

    if (score) {
      console.log(`    ✅ Has score: ${score.overall_score}`);
    } else {
      console.log(`    ❌ No score found`);
    }
  }
}

diagnoseScoreMismatch()
  .then(() => {
    console.log("\n✅ Diagnosis complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Diagnosis failed:", error);
    process.exit(1);
  });
