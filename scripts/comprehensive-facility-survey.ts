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

interface FacilityCounts {
  total: number;
  withCCN: number;
  withCoords: number;
  withCMSData: number;
  withScores: number;
}

async function surveyProviderType(providerType: string, cmsDataColumn: string): Promise<FacilityCounts> {
  // Total count
  const { count: total } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", providerType);

  // With CCN (facility_id)
  const { count: withCCN } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", providerType)
    .not("facility_id", "is", null)
    .neq("facility_id", "");

  // With coordinates
  const { count: withCoords } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", providerType)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  // With CMS quality data (provider-specific metric)
  const { count: withCMSData } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("provider_type", providerType)
    .not(cmsDataColumn, "is", null);

  // With SunsetWell scores - need to join with sunsetwell_scores
  const { data: resourceIds } = await supabase
    .from("resources")
    .select("id")
    .eq("provider_type", providerType);

  const resourceIdSet = new Set((resourceIds ?? []).map(r => r.id));

  const { data: scoredFacilities } = await supabase
    .from("sunsetwell_scores")
    .select("facility_id");

  const scoredIds = new Set((scoredFacilities ?? []).map(s => s.facility_id));
  const withScores = Array.from(resourceIdSet).filter(id => scoredIds.has(id)).length;

  return {
    total: total ?? 0,
    withCCN: withCCN ?? 0,
    withCoords: withCoords ?? 0,
    withCMSData: withCMSData ?? 0,
    withScores,
  };
}

async function comprehensiveSurvey() {
  console.log("🔍 COMPREHENSIVE FACILITY DATA SURVEY\n");
  console.log("=" .repeat(100));

  const providerTypes = [
    { type: "nursing_home", label: "Skilled Nursing Facilities (SNFs)", cmsColumn: "staffing_rating" },
    { type: "assisted_living_facility", label: "Assisted Living Facilities (ALFs)", cmsColumn: "licensed_capacity" },
    { type: "home_health", label: "Home Health Agencies", cmsColumn: "ownership_type" },
    { type: "hospice", label: "Hospice Agencies", cmsColumn: "ownership_type" },
  ];

  const results: Record<string, FacilityCounts> = {};

  for (const provider of providerTypes) {
    console.log(`\n📊 ${provider.label.toUpperCase()}`);
    console.log("-".repeat(100));

    const counts = await surveyProviderType(provider.type, provider.cmsColumn);
    results[provider.type] = counts;

    console.log(`   Total facilities:                ${counts.total.toLocaleString()}`);
    console.log(`   With CCN (facility_id):          ${counts.withCCN.toLocaleString()} (${((counts.withCCN / counts.total) * 100).toFixed(1)}%)`);
    console.log(`   With geolocation (lat/long):     ${counts.withCoords.toLocaleString()} (${((counts.withCoords / counts.total) * 100).toFixed(1)}%)`);
    console.log(`   With CMS data (${provider.cmsColumn}): ${counts.withCMSData.toLocaleString()} (${((counts.withCMSData / counts.total) * 100).toFixed(1)}%)`);
    console.log(`   With SunsetWell scores:          ${counts.withScores.toLocaleString()} (${((counts.withScores / counts.total) * 100).toFixed(1)}%)`);
  }

  console.log("\n" + "=".repeat(100));
  console.log("\n📈 SUMMARY\n");

  const totalFacilities = Object.values(results).reduce((sum, counts) => sum + counts.total, 0);
  const totalWithScores = Object.values(results).reduce((sum, counts) => sum + counts.withScores, 0);

  console.log(`   Total facilities across all types:  ${totalFacilities.toLocaleString()}`);
  console.log(`   Total with SunsetWell scores:       ${totalWithScores.toLocaleString()} (${((totalWithScores / totalFacilities) * 100).toFixed(1)}%)`);

  console.log("\n" + "=".repeat(100));

  // Generate README snippet
  console.log("\n📝 README SNIPPET:\n");
  console.log("```");
  console.log("## Facility Data Coverage\n");

  for (const provider of providerTypes) {
    const counts = results[provider.type];
    console.log(`### ${provider.label}`);
    console.log(`- **Total**: ${counts.total.toLocaleString()} facilities`);
    console.log(`- **With CCN**: ${counts.withCCN.toLocaleString()} (${((counts.withCCN / counts.total) * 100).toFixed(1)}%)`);
    console.log(`- **With Geolocation**: ${counts.withCoords.toLocaleString()} (${((counts.withCoords / counts.total) * 100).toFixed(1)}%)`);
    console.log(`- **With CMS Data**: ${counts.withCMSData.toLocaleString()} (${((counts.withCMSData / counts.total) * 100).toFixed(1)}%)`);
    console.log(`- **With SunsetWell Scores**: ${counts.withScores.toLocaleString()} (${((counts.withScores / counts.total) * 100).toFixed(1)}%)\n`);
  }

  console.log("```");
}

comprehensiveSurvey()
  .then(() => {
    console.log("\n✅ Survey complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Survey failed:", error);
    process.exit(1);
  });
