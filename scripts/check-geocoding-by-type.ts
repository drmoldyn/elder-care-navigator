import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkGeocodingByType() {
  const { data: all, error } = await supabase
    .from('resources')
    .select('provider_type, latitude, longitude');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const stats = all?.reduce((acc: any, facility: any) => {
    const type = facility.provider_type || 'unknown';
    if (!acc[type]) {
      acc[type] = { total: 0, geocoded: 0, remaining: 0 };
    }
    acc[type].total++;
    if (facility.latitude && facility.longitude) {
      acc[type].geocoded++;
    } else {
      acc[type].remaining++;
    }
    return acc;
  }, {});

  console.log('\n🌍 Geocoding Status by Facility Type:\n');
  console.log('Type'.padEnd(20) + 'Total'.padEnd(12) + 'Geocoded'.padEnd(12) + 'Remaining'.padEnd(12) + 'Progress');
  console.log('='.repeat(70));

  for (const [type, data] of Object.entries(stats as any)) {
    const progress = ((data.geocoded / data.total) * 100).toFixed(1);
    console.log(
      type.padEnd(20) +
      data.total.toString().padEnd(12) +
      data.geocoded.toString().padEnd(12) +
      data.remaining.toString().padEnd(12) +
      `${progress}%`
    );
  }

  // Overall totals
  const totalAll = Object.values(stats as any).reduce((sum: number, data: any) => sum + data.total, 0);
  const geocodedAll = Object.values(stats as any).reduce((sum: number, data: any) => sum + data.geocoded, 0);
  const remainingAll = Object.values(stats as any).reduce((sum: number, data: any) => sum + data.remaining, 0);
  const progressAll = ((geocodedAll / totalAll) * 100).toFixed(1);

  console.log('='.repeat(70));
  console.log(
    'TOTAL'.padEnd(20) +
    totalAll.toString().padEnd(12) +
    geocodedAll.toString().padEnd(12) +
    remainingAll.toString().padEnd(12) +
    `${progressAll}%`
  );
}

checkGeocodingByType();
