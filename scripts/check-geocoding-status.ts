import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkGeocoding() {
  // Count total facilities
  const { count: total } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  // Count geocoded facilities
  const { count: geocoded } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  // Count by facility type
  const { data: byType } = await supabase
    .from('resources')
    .select('provider_type, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  type GeocodedRow = {
    provider_type: string | null;
    latitude: number | null;
    longitude: number | null;
  };

  const typeCounts = (byType ?? []).reduce<Record<string, number>>((acc, curr: GeocodedRow) => {
    const key = curr.provider_type ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`\n🌍 Geocoding Status:\n`);
  console.log(`Total facilities: ${total?.toLocaleString()}`);
  console.log(`Geocoded: ${geocoded?.toLocaleString()}`);
  console.log(`Remaining: ${((total || 0) - (geocoded || 0)).toLocaleString()}`);
  console.log(`Progress: ${((geocoded || 0) / (total || 1) * 100).toFixed(1)}%`);
  console.log(`\nBy facility type:`, typeCounts);
}

checkGeocoding();
