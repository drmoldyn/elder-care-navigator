import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function estimate() {
  // Count resources with CCN
  const { count: withCCN } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .not('facility_id', 'is', null);

  // Count resources with NPI
  const { count: withNPI } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .not('npi', 'is', null);

  console.log('\nEstimated Identifier Counts:');
  console.log(`  Resources with CCN: ${withCCN?.toLocaleString()}`);
  console.log(`  Resources with NPI: ${withNPI?.toLocaleString()}`);
  console.log(`  Total identifiers: ~${((withCCN || 0) + (withNPI || 0)).toLocaleString()}`);
}

estimate();
