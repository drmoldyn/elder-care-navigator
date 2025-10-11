import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type FacilityRow = {
  provider_type: string | null;
  latitude: number | null;
  longitude: number | null;
};

type GeocodeStat = {
  total: number;
  geocoded: number;
  remaining: number;
};

async function checkGeocodingByType() {
  const { data: all, error } = await supabase
    .from('resources')
    .select('provider_type, latitude, longitude');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const stats = (all ?? []).reduce<Record<string, GeocodeStat>>((acc, facility: FacilityRow) => {
    const key = facility.provider_type ?? 'unknown';
    if (!acc[key]) {
      acc[key] = { total: 0, geocoded: 0, remaining: 0 };
    }

    acc[key].total += 1;

    const hasCoordinates = typeof facility.latitude === 'number' && typeof facility.longitude === 'number';
    if (hasCoordinates) {
      acc[key].geocoded += 1;
    } else {
      acc[key].remaining += 1;
    }

    return acc;
  }, {});

  console.log('\n🌍 Geocoding Status by Facility Type:\n');
  console.log('Type'.padEnd(20) + 'Total'.padEnd(12) + 'Geocoded'.padEnd(12) + 'Remaining'.padEnd(12) + 'Progress');
  console.log('='.repeat(70));

  for (const [type, data] of Object.entries(stats)) {
    const progress = data.total > 0 ? ((data.geocoded / data.total) * 100).toFixed(1) : '0.0';
    console.log(
      type.padEnd(20) +
      data.total.toString().padEnd(12) +
      data.geocoded.toString().padEnd(12) +
      data.remaining.toString().padEnd(12) +
      `${progress}%`
    );
  }

  // Overall totals
  const totals = Object.values(stats).reduce(
    (acc, data) => {
      acc.total += data.total;
      acc.geocoded += data.geocoded;
      acc.remaining += data.remaining;
      return acc;
    },
    { total: 0, geocoded: 0, remaining: 0 }
  );

  const progressAll = totals.total > 0 ? ((totals.geocoded / totals.total) * 100).toFixed(1) : '0.0';

  console.log('='.repeat(70));
  console.log(
    'TOTAL'.padEnd(20) +
    totals.total.toString().padEnd(12) +
    totals.geocoded.toString().padEnd(12) +
    totals.remaining.toString().padEnd(12) +
    `${progressAll}%`
  );
}

checkGeocodingByType();
