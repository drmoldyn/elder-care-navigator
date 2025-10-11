#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNursingHomes() {
  console.log("🔍 Checking existing nursing homes in database...\n");

  const { data, error, count } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: false })
    .contains("category", ["nursing_home"])
    .limit(5);

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  console.log(`📊 Total nursing homes in database: ${count}`);
  
  if (data && data.length > 0) {
    console.log(`\n📋 Sample record (first one):`);
    const sample = data[0];
    console.log(`   - Title: ${sample.title}`);
    console.log(`   - Facility ID: ${sample.facility_id}`);
    console.log(`   - City, State: ${sample.city}, ${sample.states?.[0]}`);
    console.log(`   - Staffing Rating: ${sample.staffing_rating || "N/A"}`);
    console.log(`   - Total Nurse Hours: ${sample.total_nurse_hours_per_resident_per_day || "N/A"}`);
  }
}

checkNursingHomes();
