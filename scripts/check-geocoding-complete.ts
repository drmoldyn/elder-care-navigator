import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkGeocoding() {
  console.log('\n🌍 Geocoding Status Report\n');

  // Count nursing homes
  const { count: nhTotal } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'nursing_home');

  const { count: nhGeocoded } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'nursing_home')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  // Count assisted living
  const { count: alfTotal } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'assisted_living_facility');

  const { count: alfGeocoded } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'assisted_living_facility')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  // Count home health
  const { count: hhTotal } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'home_health');

  const { count: hhGeocoded } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'home_health')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  // Overall totals
  const { count: total } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  const { count: geocoded } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log('Type'.padEnd(25) + 'Total'.padEnd(12) + 'Geocoded'.padEnd(12) + 'Remaining'.padEnd(12) + 'Progress');
  console.log('='.repeat(75));

  const printRow = (type: string, tot: number, geo: number) => {
    const remaining = tot - geo;
    const progress = tot > 0 ? ((geo / tot) * 100).toFixed(1) : '0.0';
    console.log(
      type.padEnd(25) +
      tot.toLocaleString().padEnd(12) +
      geo.toLocaleString().padEnd(12) +
      remaining.toLocaleString().padEnd(12) +
      `${progress}%`
    );
  };

  printRow('Nursing Homes', nhTotal || 0, nhGeocoded || 0);
  printRow('Assisted Living', alfTotal || 0, alfGeocoded || 0);
  printRow('Home Health', hhTotal || 0, hhGeocoded || 0);

  console.log('='.repeat(75));
  printRow('TOTAL', total || 0, geocoded || 0);

  console.log('\n');

  // Check if SNF/ALF are complete
  const snfAlfComplete = (nhTotal === nhGeocoded) && (alfTotal === alfGeocoded);
  if (snfAlfComplete) {
    console.log('✅ SNF and ALF geocoding is 100% COMPLETE');
  } else {
    console.log('⏳ SNF and ALF geocoding still in progress');
  }

  if (hhTotal && hhTotal > 0) {
    if (hhGeocoded === hhTotal) {
      console.log('✅ Home Health geocoding is 100% COMPLETE');
    } else {
      const hhProgress = ((hhGeocoded || 0) / (hhTotal || 1) * 100).toFixed(1);
      console.log(`⏳ Home Health geocoding ${hhProgress}% complete (${(hhTotal || 0) - (hhGeocoded || 0)} remaining)`);
    }
  }

  console.log('\n');
}

checkGeocoding();
