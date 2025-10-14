#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function slugifyLocation(city: string, state: string): string {
  return `${city}`.toLowerCase().replace(/\s+/g, '-').concat('-', `${state}`.toLowerCase());
}

async function main() {
  const SINCE = process.env.REVALIDATE_SINCE || '';
  const OUTPUT = process.env.REVALIDATE_OUTPUT || 'revalidate.json';

  // 1) Determine the most recent calculation_date if SINCE not given
  let sinceClause: string | null = null;
  if (SINCE) {
    sinceClause = SINCE;
  } else {
    const { data: latest, error: latestErr } = await supabase
      .from('sunsetwell_scores')
      .select('calculation_date')
      .order('calculation_date', { ascending: false })
      .limit(1);
    if (latestErr) {
      console.error('Failed to fetch latest calculation_date:', latestErr.message);
      process.exit(1);
    }
    const cd = latest?.[0]?.calculation_date as string | undefined;
    if (!cd) {
      console.log('No sunsetwell_scores found; nothing to revalidate.');
      fs.writeFileSync(OUTPUT, JSON.stringify({ facilityIds: [], locationSlugs: [], revalidateLocationsIndex: false }, null, 2));
      return;
    }
    sinceClause = cd;
  }

  // 2) Get facility_ids that were scored on/after sinceClause
  const { data: scored, error: scoredErr } = await supabase
    .from('sunsetwell_scores')
    .select('facility_id')
    .gte('calculation_date', sinceClause!);
  if (scoredErr) {
    console.error('Failed to fetch scored facilities:', scoredErr.message);
    process.exit(1);
  }
  const facIdsRaw = (scored || []).map((r: any) => String(r.facility_id)).filter(Boolean);
  const uniqueFacIds = Array.from(new Set(facIdsRaw));

  if (uniqueFacIds.length === 0) {
    console.log('No scored facilities since', sinceClause);
    fs.writeFileSync(OUTPUT, JSON.stringify({ facilityIds: [], locationSlugs: [], revalidateLocationsIndex: false }, null, 2));
    return;
  }

  // 3) Map to resources: support both external facility_id and UUID id match
  const chunk = <T,>(arr: T[], n: number) => arr.reduce<T[][]>((a,_,i)=> (i%n? a[a.length-1].push(arr[i]) : a.push([arr[i]]), a), []);
  const facilityIds: string[] = [];
  const locationSlugsSet = new Set<string>();

  // Query both ways in manageable chunks
  for (const ids of chunk(uniqueFacIds, 1000)) {
    // Match by resources.facility_id
    const { data: rows1 } = await supabase
      .from('resources')
      .select('id, facility_id, city, states')
      .in('facility_id', ids);
    for (const r of rows1 || []) {
      facilityIds.push(r.id);
      const state = Array.isArray(r.states) && r.states[0] ? String(r.states[0]) : null;
      if (r.city && state) locationSlugsSet.add(slugifyLocation(String(r.city), state));
    }
    // Match by resources.id
    const { data: rows2 } = await supabase
      .from('resources')
      .select('id, facility_id, city, states')
      .in('id', ids);
    for (const r of rows2 || []) {
      facilityIds.push(r.id);
      const state = Array.isArray(r.states) && r.states[0] ? String(r.states[0]) : null;
      if (r.city && state) locationSlugsSet.add(slugifyLocation(String(r.city), state));
    }
  }

  const payload = {
    facilityIds: Array.from(new Set(facilityIds)),
    locationSlugs: Array.from(locationSlugsSet),
    revalidateLocationsIndex: true,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${OUTPUT}:`, { facilities: payload.facilityIds.length, locations: payload.locationSlugs.length });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

