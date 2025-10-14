#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function checkProviderTypes() {
  console.log("Checking provider types with pagination...\n");

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
      console.error("Error:", error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((row) => providerTypesSet.add(row.provider_type));
      console.log(`Page ${page + 1}: Found ${data.length} rows, ${providerTypesSet.size} unique types so far`);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  console.log(`\n✅ Total unique provider types: ${providerTypesSet.size}`);
  console.log("Provider types:", Array.from(providerTypesSet).sort());

  // Count each type
  console.log("\nCounts by provider type:");
  for (const type of Array.from(providerTypesSet).sort()) {
    let total = 0;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("resources")
        .select("id")
        .eq("provider_type", type)
        .range(from, to);

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        total += data.length;
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    console.log(`  ${type}: ${total.toLocaleString()}`);
  }
}

checkProviderTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
