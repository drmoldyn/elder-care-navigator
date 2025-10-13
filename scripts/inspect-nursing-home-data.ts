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

async function inspectNursingHomeData() {
  console.log("Inspecting nursing home data columns...\n");

  // Get a sample nursing home with all columns
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("provider_type", "nursing_home")
    .limit(5);

  if (error) {
    throw new Error(`Failed to fetch nursing home: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.log("No nursing homes found");
    return;
  }

  const sampleNH = data[0];
  console.log("Sample nursing home columns and values:");
  console.log("=".repeat(100));

  // Core identification
  console.log("\n🏥 IDENTIFICATION:");
  console.log(`  id: ${sampleNH.id}`);
  console.log(`  facility_id: ${sampleNH.facility_id}`);
  console.log(`  title: ${sampleNH.title}`);
  console.log(`  provider_type: ${sampleNH.provider_type}`);

  // Location
  console.log("\n📍 LOCATION:");
  console.log(`  street_address: ${sampleNH.street_address}`);
  console.log(`  city: ${sampleNH.city}`);
  console.log(`  states: ${JSON.stringify(sampleNH.states)}`);
  console.log(`  zip_code: ${sampleNH.zip_code}`);
  console.log(`  county: ${sampleNH.county}`);

  // CMS Quality Metrics - the critical ones for scoring
  console.log("\n⭐ CMS QUALITY METRICS:");
  console.log(`  staffing_rating: ${sampleNH.staffing_rating}`);
  console.log(`  health_inspection_rating: ${sampleNH.health_inspection_rating}`);
  console.log(`  quality_measure_rating: ${sampleNH.quality_measure_rating}`);

  // Staffing details
  console.log("\n👩‍⚕️ STAFFING DETAILS:");
  console.log(`  total_nurse_hours_per_resident_per_day: ${sampleNH.total_nurse_hours_per_resident_per_day}`);
  console.log(`  rn_staffing_hours_per_resident_per_day: ${sampleNH.rn_staffing_hours_per_resident_per_day}`);
  console.log(`  total_nurse_staff_turnover: ${sampleNH.total_nurse_staff_turnover}`);

  // Facility info
  console.log("\n🏢 FACILITY INFO:");
  console.log(`  ownership_type: ${sampleNH.ownership_type}`);
  console.log(`  total_beds: ${sampleNH.total_beds}`);

  // Issues/Complaints
  console.log("\n⚠️  ISSUES:");
  console.log(`  number_of_substantiated_complaints: ${sampleNH.number_of_substantiated_complaints}`);
  console.log(`  number_of_facility_reported_incidents: ${sampleNH.number_of_facility_reported_incidents}`);
  console.log(`  number_of_fines: ${sampleNH.number_of_fines}`);

  console.log("\n=".repeat(100));

  // Check how many nursing homes have complete CMS data
  const { data: withMetrics, error: metricsError } = await supabase
    .from("resources")
    .select("id, facility_id, staffing_rating, health_inspection_rating, quality_measure_rating, total_nurse_hours_per_resident_per_day")
    .eq("provider_type", "nursing_home");

  if (metricsError) {
    console.error("Error checking metrics:", metricsError.message);
    return;
  }

  const withStaffing = withMetrics?.filter(r => r.staffing_rating !== null) ?? [];
  const withHealth = withMetrics?.filter(r => r.health_inspection_rating !== null) ?? [];
  const withQuality = withMetrics?.filter(r => r.quality_measure_rating !== null) ?? [];
  const withNurseHours = withMetrics?.filter(r => r.total_nurse_hours_per_resident_per_day !== null) ?? [];

  console.log("\n📊 CMS Data Availability (1000 nursing homes):");
  console.log(`  With staffing_rating: ${withStaffing.length} (${((withStaffing.length / 1000) * 100).toFixed(1)}%)`);
  console.log(`  With health_inspection_rating: ${withHealth.length} (${((withHealth.length / 1000) * 100).toFixed(1)}%)`);
  console.log(`  With quality_measure_rating: ${withQuality.length} (${((withQuality.length / 1000) * 100).toFixed(1)}%)`);
  console.log(`  With total_nurse_hours: ${withNurseHours.length} (${((withNurseHours.length / 1000) * 100).toFixed(1)}%)`);

  // Check if data can be scored
  const scorable = withMetrics?.filter(r =>
    r.staffing_rating !== null ||
    r.health_inspection_rating !== null ||
    r.quality_measure_rating !== null ||
    r.total_nurse_hours_per_resident_per_day !== null
  ) ?? [];

  console.log(`\n✅ SCORABLE nursing homes (have at least 1 metric): ${scorable.length} (${((scorable.length / 1000) * 100).toFixed(1)}%)`);

  if (scorable.length > 0) {
    console.log("\n💡 RECOMMENDATION:");
    console.log("   These nursing homes have CMS data and can be scored!");
    console.log("   Next step: Run the data normalization and scoring pipeline on these facilities");
  } else {
    console.log("\n⚠️  WARNING:");
    console.log("   Nursing homes lack CMS quality metrics - need to import CMS data first");
  }
}

inspectNursingHomeData()
  .then(() => {
    console.log("\n✅ Inspection complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Inspection failed:", error);
    process.exit(1);
  });
