import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importServiceAreas() {
  console.log('🗺️  Importing home health service area data...\n');

  const csvPath = 'data/cms/home-health-zip-codes.csv';
  const csvContent = readFileSync(csvPath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{
    State: string;
    'CMS Certification Number (CCN)': string;
    'ZIP Code': string;
  }>;

  console.log(`📂 Found ${records.length.toLocaleString()} service area records\n`);

  // Process in batches of 1000
  const batchSize = 1000;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const mappings = batch.map((record) => ({
      state: record.State,
      ccn: record['CMS Certification Number (CCN)'],
      zip_code: record['ZIP Code'],
    }));

    try {
      const { error } = await supabase
        .from('home_health_service_areas')
        .insert(mappings);

      if (error) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message);
        failed += batch.length;
      } else {
        imported += batch.length;
        if (imported % 10000 === 0 || imported === records.length) {
          console.log(`✅ Imported ${imported.toLocaleString()} service areas...`);
        }
      }
    } catch (err) {
      console.error(`❌ Exception importing batch ${i / batchSize + 1}:`, err);
      failed += batch.length;
    }
  }

  console.log('\n✨ Import complete!');
  console.log(`   Successful: ${imported.toLocaleString()}`);
  console.log(`   Failed: ${failed.toLocaleString()}`);
  console.log(`   Total: ${records.length.toLocaleString()}`);
}

importServiceAreas().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
