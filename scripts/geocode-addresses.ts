#!/usr/bin/env tsx
/**
 * Geocoding utility to add latitude/longitude coordinates to CSV files
 *
 * Uses the free US Census Geocoding API (no API key required)
 * Rate limit: ~1000 requests per day recommended
 *
 * Usage:
 *   pnpm tsx scripts/geocode-addresses.ts <input-csv> <output-csv>
 *
 * Example:
 *   pnpm tsx scripts/geocode-addresses.ts data/cms/processed/home-health-processed.csv data/cms/geocoded/home-health-geocoded.csv
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

interface CsvRow {
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: string;
  longitude?: string;
  [key: string]: string | undefined;
}

interface GeocodeResult {
  latitude: number | null;
  longitude: number | null;
  matched: boolean;
}

// Delay between requests (ms) to respect rate limits
const DELAY_MS = 1000; // 1 second between requests

// Sleep utility
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Geocode an address using the US Census Geocoding API
 * Free, no API key required
 * Documentation: https://geocoding.geo.census.gov/geocoder/
 */
async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zip: string
): Promise<GeocodeResult> {
  try {
    // Build query URL
    const baseUrl = "https://geocoding.geo.census.gov/geocoder/locations/address";
    const params = new URLSearchParams({
      street: street || "",
      city: city || "",
      state: state || "",
      zip: zip || "",
      benchmark: "Public_AR_Current",
      format: "json",
    });

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`   ⚠️  HTTP ${response.status} for ${street}, ${city}, ${state}`);
      return { latitude: null, longitude: null, matched: false };
    }

    const data = await response.json();

    if (
      data?.result?.addressMatches &&
      data.result.addressMatches.length > 0
    ) {
      const match = data.result.addressMatches[0];
      const coords = match.coordinates;

      return {
        latitude: coords.y, // latitude is 'y' in Census API
        longitude: coords.x, // longitude is 'x' in Census API
        matched: true,
      };
    }

    return { latitude: null, longitude: null, matched: false };
  } catch (error) {
    console.error(
      `   ❌ Geocoding error for ${street}, ${city}, ${state}:`,
      error instanceof Error ? error.message : error
    );
    return { latitude: null, longitude: null, matched: false };
  }
}

/**
 * Fallback: Geocode using ZIP code centroid
 * Uses a simplified approach based on ZIP code only
 */
async function geocodeZip(zip: string): Promise<GeocodeResult> {
  try {
    const baseUrl = "https://geocoding.geo.census.gov/geocoder/locations/address";
    const params = new URLSearchParams({
      street: "",
      city: "",
      state: "",
      zip: zip,
      benchmark: "Public_AR_Current",
      format: "json",
    });

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { latitude: null, longitude: null, matched: false };
    }

    const data = await response.json();

    if (
      data?.result?.addressMatches &&
      data.result.addressMatches.length > 0
    ) {
      const match = data.result.addressMatches[0];
      const coords = match.coordinates;

      return {
        latitude: coords.y,
        longitude: coords.x,
        matched: true,
      };
    }

    return { latitude: null, longitude: null, matched: false };
  } catch {
    return { latitude: null, longitude: null, matched: false };
  }
}

async function geocodeCsv(inputPath: string, outputPath: string): Promise<void> {
  console.log(`📂 Reading ${path.basename(inputPath)}...`);

  const content = fs.readFileSync(inputPath, "utf-8");
  const records: CsvRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📍 Geocoding ${records.length} addresses...`);
  console.log(`⏱️  Estimated time: ~${Math.ceil(records.length / 60)} minutes (1 req/sec)\n`);

  let geocoded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 1;

    // Skip if already geocoded
    if (row.latitude && row.longitude && row.latitude !== "" && row.longitude !== "") {
      skipped++;
      if (rowNum % 100 === 0) {
        console.log(`   Row ${rowNum}: Already geocoded (${geocoded} geocoded, ${skipped} skipped, ${failed} failed)`);
      }
      continue;
    }

    const address = row.address || "";
    const city = row.city || "";
    const state = row.state || "";
    const zip = row.zip_code || "";

    // Skip if no address data
    if (!address && !city && !zip) {
      failed++;
      console.log(`   ⏭️  Row ${rowNum}: No address data, skipping`);
      continue;
    }

    // Try full address geocoding first
    let result = await geocodeAddress(address, city, state, zip);

    // Fallback to ZIP code if full address fails
    if (!result.matched && zip) {
      await sleep(DELAY_MS);
      result = await geocodeZip(zip);
    }

    if (result.matched && result.latitude && result.longitude) {
      row.latitude = result.latitude.toFixed(8);
      row.longitude = result.longitude.toFixed(8);
      geocoded++;
      console.log(
        `   ✅ Row ${rowNum}: ${city}, ${state} → (${row.latitude}, ${row.longitude})`
      );
    } else {
      failed++;
      console.log(`   ❌ Row ${rowNum}: Could not geocode ${address}, ${city}, ${state} ${zip}`);
    }

    // Rate limiting delay
    if (i < records.length - 1) {
      await sleep(DELAY_MS);
    }

    // Progress update every 100 rows
    if (rowNum % 100 === 0) {
      console.log(
        `   📊 Progress: ${rowNum}/${records.length} (${geocoded} geocoded, ${skipped} skipped, ${failed} failed)`
      );
    }
  }

  // Write output
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, stringify(records, { header: true }));

  console.log(`\n✨ Geocoding complete!`);
  console.log(`   ✅ Geocoded:  ${geocoded}`);
  console.log(`   ⏭️  Skipped:   ${skipped} (already had coordinates)`);
  console.log(`   ❌ Failed:    ${failed}`);
  console.log(`   📂 Saved to:  ${outputPath}`);
}

// Main execution
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("❌ Usage: pnpm tsx scripts/geocode-addresses.ts <input-csv> <output-csv>");
  console.error("\nExample:");
  console.error("  pnpm tsx scripts/geocode-addresses.ts data/cms/processed/home-health-processed.csv data/cms/geocoded/home-health-geocoded.csv");
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Input file not found: ${inputPath}`);
  process.exit(1);
}

console.log("🌍 Starting geocoding process...");
console.log("🔧 Using US Census Geocoding API (free, no API key required)\n");

geocodeCsv(inputPath, outputPath)
  .then(() => {
    console.log("\n🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
