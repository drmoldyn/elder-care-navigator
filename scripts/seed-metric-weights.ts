#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { DEFAULT_WEIGHTS, ProviderType } from "./scoring/config";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const VERSION = process.env.METRIC_SCORE_VERSION ?? "v2";

type WeightInsert = {
  version: string;
  provider_type: ProviderType;
  metric_key: string;
  weight: number;
  region: string | null;
};

async function seedWeights() {
  const rows: WeightInsert[] = [];

  (Object.keys(DEFAULT_WEIGHTS) as ProviderType[]).forEach((providerType) => {
    const metrics = DEFAULT_WEIGHTS[providerType];
    Object.entries(metrics).forEach(([metricKey, weight]) => {
      rows.push({
        version: VERSION,
        provider_type: providerType,
        metric_key: metricKey,
        weight,
        region: null,
      });
    });
  });

  if (rows.length === 0) {
    console.log("No weights to seed. Exiting.");
    return;
  }

  const { error: deleteError } = await supabase
    .from("facility_metric_weights")
    .delete()
    .eq("version", VERSION);

  if (deleteError) {
    throw new Error(`Failed to delete existing weights: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase
    .from("facility_metric_weights")
    .insert(rows);

  if (insertError) {
    throw new Error(`Failed to insert metric weights: ${insertError.message}`);
  }

  console.log(`✅ Seeded ${rows.length} metric weights for version ${VERSION}.`);
}

seedWeights()
  .catch((error) => {
    console.error("❌ Failed to seed metric weights:", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
