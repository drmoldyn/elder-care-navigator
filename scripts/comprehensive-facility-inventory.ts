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

interface FacilityStats {
  total: number;
  withFacilityId: number;
  withGeolocation: number;
  withStates: number;
  withCMSData: number;
  withScores: number;
  sampleFacilities: any[];
}

async function getAllFacilitiesByType(providerType: string): Promise<any[]> {
  let allFacilities: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log(`  Loading ${providerType} facilities with pagination...`);

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("provider_type", providerType)
      .range(from, to);

    if (error) {
      console.error(`  Error loading page ${page}:`, error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allFacilities.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`  ✅ Loaded ${allFacilities.length} facilities (${page + 1} pages)`);
  return allFacilities;
}

async function getFacilityStats(providerType: string, displayName: string): Promise<FacilityStats> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 ${displayName.toUpperCase()}`);
  console.log("=".repeat(80));

  // Get all facilities with pagination
  const facilities = await getAllFacilitiesByType(providerType);
  const total = facilities.length;

  // Count facilities with specific data
  let withFacilityId = 0;
  let withGeolocation = 0;
  let withStates = 0;
  let withCMSData = 0;

  // Define CMS metrics based on provider type
  const cmsMetrics: Record<string, string[]> = {
    nursing_home: [
      "health_inspection_rating",
      "staffing_rating",
      "quality_measure_rating",
    ],
    home_health: [
      "quality_of_patient_care_star_rating",
    ],
    hospice: [
      "quality_of_patient_care_star_rating",
    ],
    assisted_living_facility: [], // No CMS metrics for ALFs
  };

  const metricsToCheck = cmsMetrics[providerType] || [];

  for (const facility of facilities) {
    // Check facility_id (CCN or similar)
    if (facility.facility_id && facility.facility_id.trim()) {
      withFacilityId++;
    }

    // Check geolocation
    if (
      facility.latitude != null &&
      facility.longitude != null &&
      facility.latitude !== 0 &&
      facility.longitude !== 0
    ) {
      withGeolocation++;
    }

    // Check states array
    if (facility.states && Array.isArray(facility.states) && facility.states.length > 0) {
      withStates++;
    }

    // Check CMS data (at least one metric present)
    if (metricsToCheck.length > 0) {
      const hasAnyMetric = metricsToCheck.some((metric) => {
        const value = facility[metric];
        return value !== null && value !== undefined && value !== "";
      });
      if (hasAnyMetric) {
        withCMSData++;
      }
    }
  }

  // Get facilities with scores using pagination
  let facilitiesWithScores = new Set<string>();
  let page = 0;
  let hasMore = true;
  const pageSize = 1000;

  console.log(`  Checking SunsetWell scores...`);
  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id")
      .eq("version", "v2")
      .range(from, to);

    if (error) {
      console.error(`  Error loading scores page ${page}:`, error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((score) => facilitiesWithScores.add(score.facility_id));
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  // Count facilities with scores
  const withScores = facilities.filter((f) => facilitiesWithScores.has(f.id)).length;

  // Get sample facilities
  const sampleFacilities = facilities.slice(0, 3);

  // Print results
  console.log(`\nTotal Facilities: ${total.toLocaleString()}`);
  console.log(`\nData Completeness:`);
  console.log(
    `  Facility ID (CCN):        ${withFacilityId.toLocaleString()} (${((withFacilityId / total) * 100).toFixed(1)}%)`
  );
  console.log(
    `  Geolocation (lat/lng):    ${withGeolocation.toLocaleString()} (${((withGeolocation / total) * 100).toFixed(1)}%)`
  );
  console.log(
    `  State Data:               ${withStates.toLocaleString()} (${((withStates / total) * 100).toFixed(1)}%)`
  );

  if (metricsToCheck.length > 0) {
    console.log(
      `  CMS Quality Metrics:      ${withCMSData.toLocaleString()} (${((withCMSData / total) * 100).toFixed(1)}%)`
    );
  } else {
    console.log(`  CMS Quality Metrics:      N/A (no CMS metrics for this provider type)`);
  }

  console.log(
    `  SunsetWell Scores:        ${withScores.toLocaleString()} (${((withScores / total) * 100).toFixed(1)}%)`
  );

  console.log(`\nSample Facilities:`);
  for (const facility of sampleFacilities) {
    console.log(`  • ${facility.title}`);
    console.log(`    ID: ${facility.id}`);
    console.log(`    Facility ID: ${facility.facility_id || "NULL"}`);
    console.log(`    Location: ${facility.latitude}, ${facility.longitude}`);
    console.log(`    State: ${facility.states?.[0] || "NULL"}`);
    console.log(
      `    Has Score: ${facilitiesWithScores.has(facility.id) ? "YES ✅" : "NO ❌"}`
    );
  }

  return {
    total,
    withFacilityId,
    withGeolocation,
    withStates,
    withCMSData,
    withScores,
    sampleFacilities,
  };
}

async function comprehensiveInventory() {
  console.log("\n🔍 COMPREHENSIVE FACILITY INVENTORY");
  console.log("=".repeat(80));
  console.log("Using proper pagination to avoid 1,000-row limit");
  console.log("=".repeat(80));

  // First, get all distinct provider types in the database
  console.log("\nDiscovering provider types with pagination...");
  const providerTypesSet = new Set<string>();
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("resources")
      .select("provider_type")
      .range(from, to);

    if (error) {
      throw new Error(`Failed to get provider types: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((row) => {
        if (row.provider_type) {
          providerTypesSet.add(row.provider_type);
        }
      });

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  const uniqueTypes = Array.from(providerTypesSet).filter(t => t !== null).sort();
  console.log(`Found ${uniqueTypes.length} provider types: ${uniqueTypes.join(", ")}`);

  // Define provider type display names
  const providerTypeNames: Record<string, string> = {
    nursing_home: "Skilled Nursing Facilities (SNFs)",
    assisted_living_facility: "Assisted Living Facilities (ALFs)",
    home_health: "Home Health Agencies",
    hospice: "Hospice Agencies",
  };

  // Collect stats for each provider type
  const allStats: Record<string, FacilityStats> = {};

  for (const providerType of uniqueTypes) {
    const displayName = providerTypeNames[providerType] || providerType;
    allStats[providerType] = await getFacilityStats(providerType, displayName);
  }

  // Print summary
  console.log(`\n\n${"=".repeat(80)}`);
  console.log("📋 INVENTORY SUMMARY");
  console.log("=".repeat(80));

  let grandTotal = 0;
  let grandTotalWithScores = 0;

  for (const [providerType, stats] of Object.entries(allStats)) {
    const displayName = providerTypeNames[providerType] || providerType;
    console.log(`\n${displayName}:`);
    console.log(`  Total: ${stats.total.toLocaleString()}`);
    console.log(`  With Scores: ${stats.withScores.toLocaleString()} (${((stats.withScores / stats.total) * 100).toFixed(1)}%)`);
    grandTotal += stats.total;
    grandTotalWithScores += stats.withScores;
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`GRAND TOTAL: ${grandTotal.toLocaleString()} facilities`);
  console.log(`WITH SCORES: ${grandTotalWithScores.toLocaleString()} (${((grandTotalWithScores / grandTotal) * 100).toFixed(1)}%)`);
  console.log("=".repeat(80));

  // Generate README-formatted output
  console.log(`\n\n${"=".repeat(80)}`);
  console.log("📝 README.md FORMAT (copy this into your README)");
  console.log("=".repeat(80));

  for (const [providerType, stats] of Object.entries(allStats)) {
    const displayName = providerTypeNames[providerType] || providerType;
    console.log(`\n#### ${displayName}`);
    console.log(`- ✅ ${stats.total.toLocaleString()} total facilities (100%)`);

    if (stats.withFacilityId > 0) {
      console.log(
        `- ✅ ${stats.withFacilityId.toLocaleString()} with facility IDs (${((stats.withFacilityId / stats.total) * 100).toFixed(1)}%)`
      );
    }

    if (stats.withGeolocation > 0) {
      console.log(
        `- ✅ ${stats.withGeolocation.toLocaleString()} with precise geolocation (${((stats.withGeolocation / stats.total) * 100).toFixed(1)}%)`
      );
    }

    if (stats.withStates > 0) {
      console.log(
        `- ✅ ${stats.withStates.toLocaleString()} with state data for peer grouping (${((stats.withStates / stats.total) * 100).toFixed(1)}%)`
      );
    }

    if (stats.withCMSData > 0) {
      console.log(
        `- ✅ ${stats.withCMSData.toLocaleString()} with CMS quality metrics (${((stats.withCMSData / stats.total) * 100).toFixed(1)}%)`
      );
    }

    if (stats.withScores > 0) {
      console.log(
        `- ✅ **${stats.withScores.toLocaleString()} with SunsetWell Scores (${((stats.withScores / stats.total) * 100).toFixed(1)}%)**`
      );
    } else {
      console.log(`- ⏳ 0 with SunsetWell Scores (CMS data import pending)`);
    }
  }

  console.log(`\n**Note**: SunsetWell Scores require sufficient metric data across staffing, quality, safety, and care dimensions. Coverage percentages represent facilities with complete reporting data and align with CMS data availability.`);
}

comprehensiveInventory()
  .then(() => {
    console.log("\n✅ Inventory complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Inventory failed:", error);
    process.exit(1);
  });
