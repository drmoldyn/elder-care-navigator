import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTotalCount() {
  // Count all resources
  const { count: totalCount, error: totalError } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('Error counting total:', totalError);
    return;
  }

  console.log(`\n📊 Total resources in database: ${totalCount?.toLocaleString()}\n`);

  // Try to get a sample of provider types
  const { data: sample, error: sampleError } = await supabase
    .from('resources')
    .select('provider_type')
    .limit(10);

  if (sampleError) {
    console.error('Error getting sample:', sampleError);
  } else {
    console.log('Sample provider types:', sample?.map(r => r.provider_type));
  }

  // Count by provider type using RPC if needed
  const { data: counts, error: countsError } = await supabase
    .rpc('count_by_provider_type');

  if (countsError) {
    console.log('\nDirect count attempt:');
    // Try simpler approach - get all provider_type values
    const { data: allTypes, error: typesError } = await supabase
      .from('resources')
      .select('provider_type');

    if (typesError) {
      console.error('Error:', typesError);
    } else {
      const typeCounts = allTypes?.reduce((acc: any, row: any) => {
        const type = row.provider_type || 'null';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      console.log('\nCounts by provider type:');
      for (const [type, count] of Object.entries(typeCounts || {})) {
        console.log(`  ${type}: ${count}`);
      }
    }
  } else {
    console.log('Counts from RPC:', counts);
  }
}

checkTotalCount();
