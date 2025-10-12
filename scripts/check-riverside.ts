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

async function checkRiverside() {
  console.log("Checking for Riverside, CA facilities...\n");

  // First check resources with the city
  const { data: resources, error: resError } = await supabase
    .from("resources")
    .select("id, title, city, states, provider_type")
    .ilike("city", "Riverside")
    .contains("states", ["CA"])
    .limit(5);

  if (resError) {
    console.error("Error fetching resources:", resError);
    return;
  }

  console.log(`Found ${resources?.length ?? 0} resources in Riverside, CA:`);
  resources?.forEach((r) => {
    console.log(`- ${r.title} (${r.provider_type})`);
    console.log(`  ID: ${r.id}, City: ${r.city}, States: ${r.states}`);
  });

  if (resources && resources.length > 0) {
    // Now check if they have v2 scores
    console.log("\nChecking for v2 scores...");
    const facilityIds = resources.map((r) => r.id);

    const { data: scores, error: scoreError } = await supabase
      .from("facility_scores")
      .select("facility_id, score, version")
      .in("facility_id", facilityIds)
      .eq("version", "v2");

    if (scoreError) {
      console.error("Error fetching scores:", scoreError);
      return;
    }

    console.log(`Found ${scores?.length ?? 0} v2 scores for these facilities`);
    scores?.forEach((s) => {
      const facility = resources.find((r) => r.id === s.facility_id);
      console.log(`- ${facility?.title}: ${s.score.toFixed(2)}`);
    });
  }

  // Now try the actual join query used in the location page
  console.log("\n\nTrying the actual location query...");
  const { data: joined, error: joinError } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      provider_type,
      city,
      states,
      address,
      facility_scores!inner(score, version)
    `)
    .eq("facility_scores.version", "v2")
    .ilike("city", "Riverside")
    .contains("states", ["CA"])
    .limit(5);

  if (joinError) {
    console.error("Error with join query:", joinError);
    return;
  }

  console.log(`Join query returned ${joined?.length ?? 0} results`);
  joined?.forEach((r) => {
    console.log(`- ${r.title}`);
    console.log(`  Scores:`, r.facility_scores);
  });
}

checkRiverside()
  .then(() => {
    console.log("\n✅ Check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
