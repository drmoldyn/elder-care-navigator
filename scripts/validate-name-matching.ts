#!/usr/bin/env tsx
/**
 * Validate Name Matching Accuracy
 * Tests how well facility names match between DB and CSV
 * Checks for mismatches, duplicates, and ambiguous matches
 */

import fs from "fs";
import { parse } from "csv-parse/sync";
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

interface MatchResult {
  csvName: string;
  csvAddress: string;
  csvCity: string;
  csvState: string;
  dbName: string;
  dbCity: string;
  dbState: string;
  dbLat: number | null;
  dbLng: number | null;
  matchType: "exact" | "case-insensitive" | "no-match" | "multiple-matches";
  matchCount: number;
  addressMatch: boolean;
  cityMatch: boolean;
  stateMatch: boolean;
}

function normalizeStateName(state: string | undefined): string | null {
  if (!state) return null;

  const stateMap: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  const upper = state.toUpperCase();
  if (upper.length === 2 && stateMap[upper]) {
    return stateMap[upper];
  }

  // Check if it's already a full state name
  const normalized = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  if (Object.values(stateMap).includes(normalized)) {
    return normalized;
  }

  return state;
}

async function validateMatching(sampleSize: number = 500) {
  console.log(`🔍 Validating name matching accuracy (sample size: ${sampleSize})\n`);

  // Read CSV
  const csvPath = "data/cms/processed/nursing-homes-processed.csv";
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Take random sample
  const sample = records
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  console.log(`📊 Testing ${sample.length} random facilities...\n`);

  const results: MatchResult[] = [];
  let exactMatches = 0;
  let caseInsensitiveMatches = 0;
  let noMatches = 0;
  let multipleMatches = 0;
  let addressMatches = 0;
  let cityMatches = 0;
  let stateMatches = 0;

  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    const facilityName = row.facility_name || row.title;

    // Progress indicator
    if ((i + 1) % 100 === 0) {
      console.log(`  Processed ${i + 1}/${sample.length}...`);
    }

    try {
      // Find all matching records (could be multiple)
      const { data: matches, error } = await supabase
        .from("resources")
        .select("id, title, city, states, latitude, longitude, street_address")
        .eq("provider_type", "nursing_home")
        .ilike("title", facilityName);

      if (error) {
        console.error(`  Error for ${facilityName}:`, error.message);
        continue;
      }

      const matchCount = matches?.length || 0;
      let matchType: MatchResult["matchType"] = "no-match";

      if (matchCount === 0) {
        matchType = "no-match";
        noMatches++;
      } else if (matchCount === 1) {
        // Check if exact match or case-insensitive
        const dbName = matches[0].title;
        if (dbName === facilityName) {
          matchType = "exact";
          exactMatches++;
        } else {
          matchType = "case-insensitive";
          caseInsensitiveMatches++;
        }
      } else {
        matchType = "multiple-matches";
        multipleMatches++;
      }

      // Check address/location matching for verification
      const match = matches && matches.length > 0 ? matches[0] : null;
      const csvCity = (row.city || "").toLowerCase().trim();
      const csvState = normalizeStateName(row.state);
      const csvAddress = (row.address || "").toLowerCase().trim();
      const dbCity = match ? (match.city || "").toLowerCase().trim() : "";
      const dbState = match && match.states && match.states.length > 0
        ? normalizeStateName(match.states[0])
        : null;
      const dbAddress = match ? (match.street_address || "").toLowerCase().trim() : "";

      const addressMatch = csvAddress && dbAddress && csvAddress === dbAddress;
      const cityMatch = csvCity && dbCity && csvCity === dbCity;
      const stateMatch = csvState && dbState && csvState === dbState;

      if (addressMatch) addressMatches++;
      if (cityMatch) cityMatches++;
      if (stateMatch) stateMatches++;

      results.push({
        csvName: facilityName,
        csvAddress: row.address || "",
        csvCity: row.city || "",
        csvState: row.state || "",
        dbName: match?.title || "N/A",
        dbCity: match?.city || "N/A",
        dbState: match?.states?.[0] || "N/A",
        dbLat: match?.latitude || null,
        dbLng: match?.longitude || null,
        matchType,
        matchCount,
        addressMatch,
        cityMatch,
        stateMatch,
      });
    } catch (err) {
      console.error(`  Exception for ${facilityName}:`, err);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 MATCHING VALIDATION RESULTS");
  console.log("=".repeat(70));
  console.log(`Sample size:              ${sample.length}`);
  console.log(`\n🎯 Name Matching Results:`);
  console.log(`  ✅ Exact matches:         ${exactMatches} (${((exactMatches / sample.length) * 100).toFixed(1)}%)`);
  console.log(`  ✅ Case-insensitive:      ${caseInsensitiveMatches} (${((caseInsensitiveMatches / sample.length) * 100).toFixed(1)}%)`);
  console.log(`  ⚠️  Multiple matches:      ${multipleMatches} (${((multipleMatches / sample.length) * 100).toFixed(1)}%)`);
  console.log(`  ❌ No match found:        ${noMatches} (${((noMatches / sample.length) * 100).toFixed(1)}%)`);

  const totalMatched = exactMatches + caseInsensitiveMatches;
  const matchRate = (totalMatched / sample.length) * 100;

  console.log(`\n📍 Location Verification (for matched records):`);
  console.log(`  City matches:           ${cityMatches} (${((cityMatches / totalMatched) * 100).toFixed(1)}% of matched)`);
  console.log(`  State matches:          ${stateMatches} (${((stateMatches / totalMatched) * 100).toFixed(1)}% of matched)`);
  console.log(`  Address matches:        ${addressMatches} (${((addressMatches / totalMatched) * 100).toFixed(1)}% of matched)`);

  console.log(`\n🎯 Overall Match Rate:    ${matchRate.toFixed(1)}%`);
  console.log("=".repeat(70));

  // Show examples of problematic matches
  if (multipleMatches > 0) {
    console.log(`\n⚠️  MULTIPLE MATCH EXAMPLES (first 10):`);
    const multiples = results.filter(r => r.matchType === "multiple-matches").slice(0, 10);
    multiples.forEach(r => {
      console.log(`  "${r.csvName}" → ${r.matchCount} matches in DB`);
      console.log(`    CSV Location: ${r.csvCity}, ${r.csvState}`);
      console.log(`    DB Location:  ${r.dbCity}, ${r.dbState}`);
    });
  }

  if (noMatches > 0) {
    console.log(`\n❌ NO MATCH EXAMPLES (first 10):`);
    const unmatched = results.filter(r => r.matchType === "no-match").slice(0, 10);
    unmatched.forEach(r => {
      console.log(`  "${r.csvName}"`);
      console.log(`    Location: ${r.csvCity}, ${r.csvState}`);
    });
  }

  // Show mismatched locations (name matched but location doesn't)
  const locationMismatches = results.filter(
    r => (r.matchType === "exact" || r.matchType === "case-insensitive") &&
         (!r.cityMatch || !r.stateMatch)
  );

  if (locationMismatches.length > 0) {
    console.log(`\n🚨 POTENTIAL MISASSIGNMENTS (name matched but location differs - first 10):`);
    locationMismatches.slice(0, 10).forEach(r => {
      console.log(`  CSV: "${r.csvName}" (${r.csvCity}, ${r.csvState})`);
      console.log(`  DB:  "${r.dbName}" (${r.dbCity}, ${r.dbState})`);
      console.log(`    City match: ${r.cityMatch ? "✅" : "❌"} | State match: ${r.stateMatch ? "✅" : "❌"}`);
    });
  }

  // Recommendation
  console.log(`\n💡 RECOMMENDATION:`);
  if (matchRate >= 95 && locationMismatches.length <= sample.length * 0.02) {
    console.log(`✅ HIGH ACCURACY - Safe to proceed with merge approach`);
    console.log(`   - ${matchRate.toFixed(1)}% of records matched by name`);
    console.log(`   - Only ${locationMismatches.length} potential misassignments (${((locationMismatches.length / sample.length) * 100).toFixed(1)}%)`);
  } else if (matchRate >= 85) {
    console.log(`⚠️  MODERATE ACCURACY - Review mismatches before proceeding`);
    console.log(`   - ${matchRate.toFixed(1)}% match rate is acceptable but not ideal`);
    console.log(`   - Consider manual review of ${locationMismatches.length} potential misassignments`);
  } else {
    console.log(`❌ LOW ACCURACY - Consider re-import from scratch with CCN data`);
    console.log(`   - Only ${matchRate.toFixed(1)}% match rate`);
    console.log(`   - Too many mismatches for safe merge`);
    console.log(`   - Recommend: Get CMS data with CCN, delete old records, re-import fresh`);
  }

  console.log("\n" + "=".repeat(70));
}

// Run validation
const sampleSize = parseInt(process.argv[2]) || 500;
validateMatching(sampleSize).catch(console.error);
