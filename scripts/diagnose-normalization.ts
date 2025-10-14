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

async function diagnoseNormalization() {
  console.log("🔍 DIAGNOSING NORMALIZATION ISSUE\n");

  // Check what's in facility_metrics_normalized
  const { data: metrics } = await supabase
    .from("facility_metrics_normalized")
    .select("facility_id, provider_type, region, score_version")
    .eq("score_version", "v2")
    .limit(1000);

  const uniqueFacilities = new Set(metrics?.map(m => m.facility_id) ?? []);
  const byProviderType: Record<string, Set<string>> = {};
  const byRegion: Record<string, number> = {};

  for (const metric of metrics ?? []) {
    if (!byProviderType[metric.provider_type]) {
      byProviderType[metric.provider_type] = new Set();
    }
    byProviderType[metric.provider_type].add(metric.facility_id);

    const region = metric.region || "null";
    byRegion[region] = (byRegion[region] || 0) + 1;
  }

  console.log("Normalized metrics breakdown:");
  console.log(`  Total unique facilities: ${uniqueFacilities.size}`);
  console.log(`\n  By provider type:`);
  for (const [type, facilities] of Object.entries(byProviderType)) {
    console.log(`    ${type}: ${facilities.size} facilities`);
  }

  console.log(`\n  By region (top 10):`);
  const sortedRegions = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [region, count] of sortedRegions) {
    console.log(`    ${region}: ${count} metrics`);
  }

  // Check a sample nursing home that HAS metrics
  const nursingHomeMetrics = metrics?.filter(m => m.provider_type === "nursing_home") ?? [];
  if (nursingHomeMetrics.length > 0) {
    const sampleId = nursingHomeMetrics[0].facility_id;

    console.log(`\n📋 Sample nursing home WITH metrics:`);
    const { data: sampleResource } = await supabase
      .from("resources")
      .select("*")
      .eq("id", sampleId)
      .single();

    if (sampleResource) {
      console.log(`  ID: ${sampleResource.id}`);
      console.log(`  Title: ${sampleResource.title}`);
      console.log(`  States: ${JSON.stringify(sampleResource.states)}`);
      console.log(`  staffing_rating: ${sampleResource.staffing_rating}`);
      console.log(`  health_inspection_rating: ${sampleResource.health_inspection_rating}`);
      console.log(`  quality_measure_rating: ${sampleResource.quality_measure_rating}`);
    }
  }

  // Check a sample nursing home that DOESN'T have metrics
  const { data: allNursingHomes } = await supabase
    .from("resources")
    .select("id, title, states, staffing_rating, health_inspection_rating")
    .eq("provider_type", "nursing_home")
    .limit(1000);

  const withoutMetrics = allNursingHomes?.filter(nh => !uniqueFacilities.has(nh.id)) ?? [];

  if (withoutMetrics.length > 0) {
    console.log(`\n📋 Sample nursing home WITHOUT metrics:`);
    const sample = withoutMetrics[0];
    console.log(`  ID: ${sample.id}`);
    console.log(`  Title: ${sample.title}`);
    console.log(`  States: ${JSON.stringify(sample.states)}`);
    console.log(`  staffing_rating: ${sample.staffing_rating}`);
    console.log(`  health_inspection_rating: ${sample.health_inspection_rating}`);

    console.log(`\n  ⚠️  This facility HAS data but was NOT normalized!`);
    console.log(`     Out of 1000 sampled nursing homes: ${withoutMetrics.length} lack normalized metrics`);
  }

  // Check if it's a states array issue
  console.log(`\n📊 Checking states array format...`);
  const withNullStates = allNursingHomes?.filter(nh => nh.states === null || nh.states.length === 0) ?? [];
  console.log(`  Nursing homes with null/empty states: ${withNullStates.length}/1000`);

  if (withNullStates.length > 0) {
    console.log(`\n  ⚠️  POSSIBLE ISSUE: ${withNullStates.length} nursing homes have null/empty states array!`);
    console.log(`     Normalization groups by state, so these may be skipped`);
  }
}

diagnoseNormalization()
  .then(() => {
    console.log("\n✅ Diagnosis complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Diagnosis failed:", error);
    process.exit(1);
  });
