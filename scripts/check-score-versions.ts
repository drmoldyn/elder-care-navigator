#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function checkVersions() {
  console.log("Checking sunsetwell_scores versions...\n");

  // Get all distinct versions
  let allScores: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("version, calculation_date")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allScores.push(...data);
      if (data.length < 1000) hasMore = false;
      else page++;
    }
  }

  const versionCounts = new Map<string, Set<string>>();

  for (const score of allScores) {
    const version = score.version || "NULL";
    const date = score.calculation_date;

    if (!versionCounts.has(version)) {
      versionCounts.set(version, new Set());
    }
    versionCounts.get(version)!.add(date);
  }

  console.log("Version breakdown:");
  for (const [version, dates] of Array.from(versionCounts.entries()).sort()) {
    console.log(`\n  ${version}:`);
    console.log(`    Total scores: ${allScores.filter(s => (s.version || "NULL") === version).length}`);
    console.log(`    Calculation dates: ${Array.from(dates).sort().join(", ")}`);
  }

  // Check if we have overlapping facility_ids with different versions
  const facilityVersions = new Map<string, Set<string>>();

  page = 0;
  hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("sunsetwell_scores")
      .select("facility_id, version")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      for (const row of data) {
        if (!facilityVersions.has(row.facility_id)) {
          facilityVersions.set(row.facility_id, new Set());
        }
        facilityVersions.get(row.facility_id)!.add(row.version || "NULL");
      }
      if (data.length < 1000) hasMore = false;
      else page++;
    }
  }

  const multiVersion = Array.from(facilityVersions.entries()).filter(
    ([_, versions]) => versions.size > 1
  );

  console.log(`\n\nFacilities with multiple versions: ${multiVersion.length}`);
  if (multiVersion.length > 0) {
    console.log("Sample facilities with multiple versions:");
    for (const [facilityId, versions] of multiVersion.slice(0, 5)) {
      console.log(`  ${facilityId}: ${Array.from(versions).join(", ")}`);
    }
  }
}

checkVersions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
