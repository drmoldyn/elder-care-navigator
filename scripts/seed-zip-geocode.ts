#!/usr/bin/env tsx
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalizeZip(z: string): string {
  return String(z || '').trim().slice(0, 5);
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: pnpm tsx scripts/seed-zip-geocode.ts <path-to-csv>');
    process.exit(1);
  }
  const full = path.resolve(csvPath);
  if (!fs.existsSync(full)) {
    console.error(`File not found: ${full}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(full, 'utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  // Expect columns: zip, latitude, longitude (case-insensitive)
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  const batch: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    const zip = normalizeZip(r.zip || r.ZIP || r.postal || r.Postal || r.Postcode || r.postcode || '');
    const latStr = r.latitude ?? r.lat ?? r.Latitude ?? r.LAT ?? '';
    const lngStr = r.longitude ?? r.lng ?? r.lon ?? r.Longitude ?? r.LON ?? '';
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!zip || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      skipped++;
      continue;
    }
    batch.push({ zip, latitude: lat, longitude: lng, updated_at: new Date().toISOString(), error_status: null, error_message: null });
  }

  // Upsert in chunks
  const chunk = <T,>(arr: T[], n: number) => arr.reduce<T[][]>((a,_,i)=> (i%n? a[a.length-1].push(arr[i]) : a.push([arr[i]]), a), []);
  const chunks = chunk(batch, 1000);
  for (const c of chunks) {
    const { error } = await supabase
      .from('zip_geocode_cache')
      .upsert(c, { onConflict: 'zip' });
    if (error) {
      console.error('Upsert error:', error.message);
      failed += c.length;
    } else {
      inserted += c.length;
    }
  }

  console.log(`Seed complete. Inserted/updated: ${inserted}, skipped: ${skipped}, failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

